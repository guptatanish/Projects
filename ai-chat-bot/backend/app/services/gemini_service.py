import logging
from typing import Any

from google import genai
from google.genai import types

from app.core.config import settings
from app.core.errors import AppError, RateLimitExceededError

logger = logging.getLogger(__name__)

DEFAULT_PROFILE_SYSTEM_INSTRUCTION = """You are the personal profile and knowledge assistant for Tanish Gupta.
Answer questions accurately, clearly, and concisely based on the profile facts below.
If something is not covered in the profile, state clearly that it is not listed rather than inventing details.

Profile Overview:
- Name: Tanish Gupta
- Role: Software Developer working on a React + TypeScript monorepo project (including data tables for AI for ARD, PRs, unit tests, linting, and pipelines), and conducting technical interviews for React + TypeScript testing roles (DOM behavior, useEffect, test writing, Node package management).
- Location: Bengaluru, India.
- Key Projects:
  1. `enterprise-ui`: Open-source React, TypeScript, and Vite component library and design system (40+ components/building blocks, Storybook, Tailwind CSS, ESLint, unit testing; scoped for React).
  2. `ai-chat-bot`: Personal profile and knowledge chatbot pairing a React + TypeScript + Vite frontend (using `enterprise-ui`) with a FastAPI + PostgreSQL backend.
  3. Real-time 1v1 video Roast Battle web app prototype (FastAPI, Socket.IO, Redis, WebRTC signaling, JWT auth).
- Core Tech Stack: React, TypeScript, Vite, Tailwind CSS, Node.js, Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic, Docker, WSL 2, Git.
- Education & Background: Graphic Era University (including pre-incubation/incubation review exposure at TBI-GEU Inventorium in Dehradun).
"""


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


class GeminiService:
    """Isolated wrapper around the google-genai SDK for text generation."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        timeout_ms: int | None = None,
    ) -> None:
        self.api_key = (
            api_key if api_key is not None else settings.gemini_api_key
        ).strip()
        self.model = (
            model if model is not None else settings.gemini_chat_model
        ).strip() or "gemini-3.5-flash-lite"
        default_timeout_ms = max(1000, int(settings.gemini_timeout_seconds * 1000))
        self.timeout_ms = timeout_ms if timeout_ms is not None else default_timeout_ms

    def _get_client(self) -> genai.Client:
        """Create a genai.Client using the server-side API key and explicit timeout."""
        if not self.api_key:
            raise AppError(
                code="AI_CONFIG_MISSING",
                message="GEMINI_API_KEY is not configured on the server.",
                status_code=500,
            )
        return genai.Client(
            api_key=self.api_key,
            http_options=types.HttpOptions(timeout=self.timeout_ms),
        )

    def generate_reply(
        self,
        *,
        system_instruction: str | None = None,
        conversation_history: list[dict[str, str]] | None = None,
        current_message: str,
    ) -> dict[str, Any]:
        """Generate a text response from Gemini and normalize metadata."""
        client = self._get_client()
        instruction = (
            system_instruction.strip()
            if system_instruction and system_instruction.strip()
            else DEFAULT_PROFILE_SYSTEM_INSTRUCTION
        )
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
            err_text = str(exc).lower()
            if "429" in err_text or "resource_exhausted" in err_text or "quota" in err_text:
                logger.warning("Gemini rate limit / quota error: %s", exc)
                raise RateLimitExceededError(
                    "Gemini API quota or rate limit reached. Please try again shortly."
                ) from exc

            if "503" in err_text or "unavailable" in err_text:
                logger.warning("Gemini model temporarily unavailable (503): %s", exc)
                raise AppError(
                    code="AI_UNAVAILABLE",
                    message="The AI model is temporarily experiencing high demand. Please try again.",
                    status_code=503,
                ) from exc

            if (
                "504" in err_text
                or "deadline_exceeded" in err_text
                or "timeout" in err_text
                or "timed out" in err_text
            ):
                logger.warning("Gemini request timed out / deadline exceeded: %s", exc)
                raise AppError(
                    code="AI_TIMEOUT",
                    message="The AI service took too long to respond. Please try again.",
                    status_code=504,
                ) from exc

            logger.exception("Gemini SDK call failed", exc_info=exc)
            raise AppError(
                code="AI_PROVIDER_ERROR",
                message="Unable to generate a response from the AI service right now.",
                status_code=502,
            ) from exc

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


gemini_service = GeminiService()