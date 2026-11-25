from dataclasses import dataclass
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.services.gemini_service import GeminiService, gemini_service
from app.services.knowledge_service import (
    format_retrieved_context,
    retrieve_relevant_chunks,
)

logger = logging.getLogger(__name__)

FALLBACK_CHAT_MODEL = "gemini-3.5-flash-lite"


@dataclass(frozen=True)
class RouteDecision:
    """Lightweight routing output for a single chat turn."""

    intent: str
    section_hint: str | None
    use_retrieval: bool
    top_k: int


def route_message(message_text: str) -> RouteDecision:
    """Classify user intent deterministically without spending extra LLM quota."""
    normalized = " ".join((message_text or "").strip().lower().split())

    greeting_exact = {
        "hi",
        "hello",
        "hey",
        "hii",
        "yo",
        "gm",
        "good morning",
        "good afternoon",
        "good evening",
    }
    if normalized in greeting_exact:
        return RouteDecision(
            intent="greeting",
            section_hint="overview",
            use_retrieval=False,
            top_k=0,
        )

    if any(
        token in normalized
        for token in (
            "enterprise-ui",
            "enterprise ui",
            "ai-chat-bot",
            "ai chat bot",
            "roast battle",
            "project",
            "projects",
            "component library",
            "storybook",
            "webrtc",
        )
    ):
        return RouteDecision(
            intent="projects",
            section_hint="projects",
            use_retrieval=True,
            top_k=4,
        )

    if any(
        token in normalized
        for token in (
            "stack",
            "tech",
            "react",
            "typescript",
            "python",
            "fastapi",
            "postgres",
            "pgvector",
            "docker",
            "wsl",
            "skills",
            "interview",
            "monorepo",
        )
    ):
        return RouteDecision(
            intent="skills_stack",
            section_hint="skills",
            use_retrieval=True,
            top_k=4,
        )

    if any(
        token in normalized
        for token in (
            "education",
            "university",
            "graphic era",
            "geu",
            "inventorium",
            "dehradun",
            "college",
            "degree",
        )
    ):
        return RouteDecision(
            intent="education",
            section_hint="education",
            use_retrieval=True,
            top_k=3,
        )

    return RouteDecision(
        intent="profile_overview",
        section_hint="overview",
        use_retrieval=True,
        top_k=4,
    )


def retrieve_agent_context(
    db: Session,
    *,
    message_text: str,
    route: RouteDecision,
) -> str | None:
    """Stage 2 (Retriever): fetch pgvector chunks and format compact grounding context."""
    if not route.use_retrieval or route.top_k <= 0:
        return None

    try:
        chunks = retrieve_relevant_chunks(db, message_text, top_k=route.top_k)
        if route.section_hint and chunks:
            prioritized = [c for c in chunks if c.section == route.section_hint]
            others = [c for c in chunks if c.section != route.section_hint]
            chunks = prioritized + others
        formatted = format_retrieved_context(chunks)
        return formatted or None
    except Exception as exc:
        logger.warning("Multi-agent retriever degraded to base context: %s", exc)
        return None


def _generate_with_503_fallback(
    *,
    conversation_history: list[dict[str, str]] | None,
    current_message: str,
    retrieved_context: str | None,
) -> dict[str, Any]:
    """Synthesize response on configured chat model; fall back to gemini-3.5-flash-lite on 503."""
    primary_model = (settings.gemini_chat_model or FALLBACK_CHAT_MODEL).strip() or FALLBACK_CHAT_MODEL
    try:
        return gemini_service.generate_reply(
            conversation_history=conversation_history,
            current_message=current_message,
            retrieved_context=retrieved_context,
        )
    except AppError as exc:
        if exc.code == "AI_UNAVAILABLE" and primary_model != FALLBACK_CHAT_MODEL:
            logger.warning(
                "Primary model '%s' returned 503; falling back to '%s'",
                primary_model,
                FALLBACK_CHAT_MODEL,
            )
            fallback_runner = GeminiService(
                api_key=gemini_service.api_key,
                model=FALLBACK_CHAT_MODEL,
                embedding_model=gemini_service.embedding_model,
                embedding_dimensions=gemini_service.embedding_dimensions,
                timeout_ms=gemini_service.timeout_ms,
            )
            result = fallback_runner.generate_reply(
                conversation_history=conversation_history,
                current_message=current_message,
                retrieved_context=retrieved_context,
            )
            result["fallback_from"] = primary_model
            return result
        raise


def run_multi_agent_pipeline(
    db: Session,
    *,
    message_text: str,
    conversation_history: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    """Execute the lean 3-stage pipeline: route -> retrieve -> synthesize."""
    route = route_message(message_text)
    retrieved_context = retrieve_agent_context(
        db,
        message_text=message_text,
        route=route,
    )
    synthesis = _generate_with_503_fallback(
        conversation_history=conversation_history,
        current_message=message_text,
        retrieved_context=retrieved_context,
    )

    return {
        "reply": str(synthesis["text"]),
        "model": str(synthesis["model"]),
        "mode": "multi_agent_rag",
        "route": route,
        "context_used": bool(retrieved_context),
        "fallback_from": synthesis.get("fallback_from"),
    }
