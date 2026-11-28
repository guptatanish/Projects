import logging
import math
from typing import Any

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.errors import AppError, RateLimitExceededError

logger = logging.getLogger(__name__)

_CLIENT_CACHE: dict[tuple[str, int], genai.Client] = {}

DEFAULT_PROFILE_SYSTEM_INSTRUCTION = """You are the personal profile and knowledge assistant for Tanish Gupta.
Answer questions accurately, clearly, and concisely based on the public portfolio facts below.
If something is not covered in the profile, state clearly that it is not listed rather than inventing details.

Profile Overview:
- Name: Tanish Gupta
- Role: Software Developer working on React + TypeScript monorepo architectures (pull requests, unit tests, linting, CI/CD pipelines) and conducting technical interviews for React + TypeScript testing roles (DOM behavior, useEffect, testing scripts, Node.js package management).
- Location: Bengaluru, India.
- Key Projects:
  1. `enterprise-ui`: React, TypeScript, and Vite component library and design system (40+ components/building blocks, Storybook, Tailwind CSS, ESLint, unit testing; scoped for React).
  2. `ai-chat-bot`: Personal profile and knowledge chatbot pairing a React + TypeScript + Vite frontend (using `enterprise-ui`) with a FastAPI + PostgreSQL (`pgvector`) backend and a 3-stage multi-agent RAG pipeline.
  3. Real-time 1v1 video Roast Battle web app prototype (FastAPI, Socket.IO, Redis, WebRTC signaling, JWT auth).
- Core Tech Stack: React, TypeScript, Vite, Tailwind CSS, Node.js, Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, pgvector, Docker, WSL 2, Git.
- Education & Background: Graphic Era University (including pre-incubation/incubation review exposure at TBI-GEU Inventorium in Dehradun).
"""


def _l2_normalize(values: list[float]) -> list[float]:
    """L2-normalize a vector so cosine similarity/distance stays accurate at reduced dimensions."""
    norm = math.sqrt(sum(v * v for v in values))
    if norm <= 1e-12:
        return values
    return [v / norm for v in values]


def _extract_token_usage(response: Any) -> dict[str, int | None]:
    """Safely extract token usage counts from a google-genai response."""
    usage = getattr(response, "usage_metadata", None)
    if usage is None:
        return {
            "prompt_tokens": None,
            "candidates_tokens": None,
            "total_tokens": None,
        }
    return {
        "prompt_tokens": getattr(usage, "prompt_token_count", None),
        "candidates_tokens": getattr(usage, "candidates_token_count", None),
        "total_tokens": getattr(usage, "total_token_count", None),
    }


def _extract_finish_reason(response: Any) -> str | None:
    """Safely extract finish reason from the first candidate if available."""
    candidates = getattr(response, "candidates", None)
    if not candidates:
        return None
    first = candidates[0]
    reason = getattr(first, "finish_reason", None)
    return str(reason) if reason is not None else None


def _build_contents(
    conversation_history: list[dict[str, str]] | None,
    current_message: str,
) -> list[types.Content]:
    """Build SDK Content objects from bounded text history and the current prompt."""
    contents: list[types.Content] = []

    if conversation_history:
        for item in conversation_history:
            raw_role = (item.get("role") or "user").strip().lower()
            role = "model" if raw_role in {"assistant", "model"} else "user"
            text = (item.get("content") or "").strip()
            if text:
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=text)],
                    )
                )

    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=current_message)],
        )
    )
    return contents


def _map_sdk_exception(exc: Exception, *, operation: str) -> AppError:
    """Translate google-genai SDK errors into consistent AppError / RateLimitExceededError responses."""
    err_text = str(exc).lower()
    if "429" in err_text or "resource_exhausted" in err_text or "quota" in err_text:
        logger.warning("Gemini %s rate limit / quota error: %s", operation, exc)
        return RateLimitExceededError(
            "Gemini API quota or rate limit reached. Please try again shortly."
        )

    if "503" in err_text or "unavailable" in err_text:
        logger.warning("Gemini %s temporarily unavailable (503): %s", operation, exc)
        return AppError(
            code="AI_UNAVAILABLE",
            message="The AI model is temporarily experiencing high demand. Please try again.",
            status_code=503,
        )

    if (
        "504" in err_text
        or "deadline_exceeded" in err_text
        or "timeout" in err_text
        or "timed out" in err_text
    ):
        logger.warning("Gemini %s timed out / deadline exceeded: %s", operation, exc)
        return AppError(
            code="AI_TIMEOUT",
            message="The AI service took too long to respond. Please try again.",
            status_code=504,
        )

    logger.exception("Gemini SDK %s failed", operation, exc_info=exc)
    return AppError(
        code="AI_PROVIDER_ERROR",
        message="Unable to complete the request with the AI service right now.",
        status_code=502,
    )


class GeminiService:
    """Isolated wrapper around the google-genai SDK for text generation and embeddings."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        embedding_model: str | None = None,
        embedding_dimensions: int | None = None,
        timeout_ms: int | None = None,
    ) -> None:
        self.api_key = (
            api_key if api_key is not None else settings.gemini_api_key
        ).strip()
        self.model = (
            model if model is not None else settings.gemini_chat_model
        ).strip() or "gemini-3.5-flash-lite"
        self.embedding_model = (
            embedding_model if embedding_model is not None else settings.gemini_embedding_model
        ).strip() or "gemini-embedding-001"
        self.embedding_dimensions = (
            embedding_dimensions if embedding_dimensions is not None else settings.embedding_dimensions
        )
        default_timeout_ms = max(1000, int(settings.gemini_timeout_seconds * 1000))
        self.timeout_ms = timeout_ms if timeout_ms is not None else default_timeout_ms

    def _get_client(self) -> genai.Client:
        """Return a cached genai.Client keyed by API key and timeout to avoid churn."""
        if not self.api_key:
            raise AppError(
                code="AI_CONFIG_MISSING",
                message="GEMINI_API_KEY is not configured on the server.",
                status_code=500,
            )
        cache_key = (self.api_key, int(self.timeout_ms))
        client = _CLIENT_CACHE.get(cache_key)
        if client is None:
            client = genai.Client(
                api_key=self.api_key,
                http_options=types.HttpOptions(timeout=self.timeout_ms),
            )
            _CLIENT_CACHE[cache_key] = client
        return client

    def generate_reply(
        self,
        *,
        system_instruction: str | None = None,
        conversation_history: list[dict[str, str]] | None = None,
        current_message: str,
        retrieved_context: str | None = None,
    ) -> dict[str, Any]:
        """Generate a text response from Gemini and normalize metadata."""
        client = self._get_client()
        base_instruction = (
            system_instruction.strip()
            if system_instruction and system_instruction.strip()
            else DEFAULT_PROFILE_SYSTEM_INSTRUCTION
        )
        if retrieved_context and retrieved_context.strip():
            instruction = f"{base_instruction}\n\n{retrieved_context.strip()}"
        else:
            instruction = base_instruction

        contents = _build_contents(
            conversation_history=conversation_history,
            current_message=current_message,
        )
        config = types.GenerateContentConfig(
            system_instruction=instruction,
            temperature=0.4,
        )

        try:
            response = client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )
        except Exception as exc:
            raise _map_sdk_exception(exc, operation="generate_content") from exc

        reply_text = (getattr(response, "text", None) or "").strip()
        if not reply_text:
            raise AppError(
                code="AI_EMPTY_RESPONSE",
                message="The AI service returned an empty response.",
                status_code=502,
            )

        return {
            "text": reply_text,
            "model": self.model,
            "tokenUsage": _extract_token_usage(response),
            "finishReason": _extract_finish_reason(response),
        }

    def embed_texts(
        self,
        texts: list[str],
        *,
        output_dimensionality: int | None = None,
        task_type: str | None = None,
    ) -> list[list[float]]:
        """Generate L2-normalized vector embeddings for one or more non-empty strings."""
        cleaned_texts = [t.strip() for t in texts if t and t.strip()]
        if not cleaned_texts:
            raise AppError(
                code="VALIDATION_ERROR",
                message="At least one non-empty text string is required for embedding.",
                status_code=422,
            )

        target_dims = (
            output_dimensionality
            if output_dimensionality is not None
            else self.embedding_dimensions
        )
        client = self._get_client()
        config_kwargs: dict[str, Any] = {"output_dimensionality": target_dims}
        if task_type:
            config_kwargs["task_type"] = task_type
        embed_config = types.EmbedContentConfig(**config_kwargs)

        try:
            response = client.models.embed_content(
                model=self.embedding_model,
                contents=cleaned_texts,
                config=embed_config,
            )
        except Exception as exc:
            raise _map_sdk_exception(exc, operation="embed_content") from exc

        embeddings_attr = getattr(response, "embeddings", None) or []
        vectors: list[list[float]] = []
        for item in embeddings_attr:
            values = getattr(item, "values", None)
            if not values:
                continue
            vec = _l2_normalize([float(v) for v in values])
            if len(vec) != target_dims:
                raise AppError(
                    code="AI_EMBEDDING_DIM_MISMATCH",
                    message=(
                        f"Expected {target_dims}-dimensional embedding, received {len(vec)}."
                    ),
                    status_code=502,
                )
            vectors.append(vec)

        if len(vectors) != len(cleaned_texts):
            raise AppError(
                code="AI_EMPTY_EMBEDDING",
                message="The AI service did not return embeddings for all input texts.",
                status_code=502,
            )

        return vectors

    def embed_text(
        self,
        text: str,
        *,
        output_dimensionality: int | None = None,
        task_type: str | None = None,
    ) -> list[float]:
        """Generate a single L2-normalized vector embedding."""
        return self.embed_texts(
            [text],
            output_dimensionality=output_dimensionality,
            task_type=task_type,
        )[0]


gemini_service = GeminiService()
