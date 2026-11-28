from dataclasses import dataclass
import hashlib
import logging
import re
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError, RateLimitExceededError
from app.services.cache_service import response_cache
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


def _has_word(text: str, word: str) -> bool:
    """Match whole words/phrases rather than accidental substrings."""
    return bool(re.search(rf"(?<![a-z0-9_-]){re.escape(word)}(?![a-z0-9_-])", text))


def route_message(
    message_text: str,
    *,
    scope: str | None = None,
    detail_level: str | None = None,
) -> RouteDecision:
    """Classify user intent deterministically without spending extra LLM quota."""
    normalized = " ".join((message_text or "").strip().lower().split())
    top_k_default = 6 if (detail_level or "").strip().lower() == "detailed" else 4

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
    if normalized in greeting_exact and not scope:
        return RouteDecision(
            intent="greeting",
            section_hint="overview",
            use_retrieval=False,
            top_k=0,
        )

    cleaned_scope = (scope or "").strip().lower()
    if cleaned_scope in {"projects", "project"}:
        return RouteDecision(
            intent="projects",
            section_hint="projects",
            use_retrieval=True,
            top_k=top_k_default,
        )
    if cleaned_scope in {"skills", "stack", "tech", "work"}:
        return RouteDecision(
            intent="skills_stack",
            section_hint="skills",
            use_retrieval=True,
            top_k=top_k_default,
        )
    if cleaned_scope in {"education", "edu"}:
        return RouteDecision(
            intent="education",
            section_hint="education",
            use_retrieval=True,
            top_k=max(3, top_k_default),
        )

    has_stack_term = any(
        _has_word(normalized, w)
        for w in (
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
            "skill",
            "interview",
            "monorepo",
            "tooling",
        )
    )
    has_project_term = any(
        _has_word(normalized, w)
        for w in (
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
            "airbus",
            "iam",
            "iam-chatbot",
            "iam-ai-assistant",
            "echarts",
            "openshift",
        )
    )

    if has_stack_term and not (_has_word(normalized, "project") or _has_word(normalized, "projects")):
        return RouteDecision(
            intent="skills_stack",
            section_hint="skills",
            use_retrieval=True,
            top_k=top_k_default,
        )

    if has_project_term:
        return RouteDecision(
            intent="projects",
            section_hint="projects",
            use_retrieval=True,
            top_k=top_k_default,
        )

    if has_stack_term:
        return RouteDecision(
            intent="skills_stack",
            section_hint="skills",
            use_retrieval=True,
            top_k=top_k_default,
        )

    if any(
        _has_word(normalized, w)
        for w in (
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
            top_k=max(3, top_k_default),
        )

    return RouteDecision(
        intent="profile_overview",
        section_hint="overview",
        use_retrieval=True,
        top_k=top_k_default,
    )


def retrieve_agent_context(
    db: Session,
    *,
    message_text: str,
    route: RouteDecision,
) -> tuple[str | None, list[dict[str, Any]]]:
    """Stage 2 (Retriever): fetch pgvector chunks, format context, and build citations."""
    if not route.use_retrieval or route.top_k <= 0:
        return None, []

    try:
        chunks = retrieve_relevant_chunks(
            db,
            message_text,
            top_k=route.top_k,
            section_filter=route.section_hint,
        )
        if route.section_hint and chunks:
            prioritized = [c for c in chunks if c.section == route.section_hint]
            others = [c for c in chunks if c.section != route.section_hint]
            chunks = prioritized + others

        sources = [
            {
                "id": c.id,
                "source_key": c.source_key,
                "title": c.title,
                "section": c.section,
            }
            for c in chunks
        ]
        formatted = format_retrieved_context(chunks)
        return (formatted or None), sources
    except Exception as exc:
        logger.warning("Multi-agent retriever degraded to base context: %s", exc)
        return None, []


def _generate_with_fallback(
    *,
    conversation_history: list[dict[str, str]] | None,
    current_message: str,
    retrieved_context: str | None,
) -> dict[str, Any]:
    """Synthesize response on configured chat model; fall back to gemini-3.5-flash-lite on 503/429."""
    primary_model = (settings.gemini_chat_model or FALLBACK_CHAT_MODEL).strip() or FALLBACK_CHAT_MODEL
    try:
        return gemini_service.generate_reply(
            conversation_history=conversation_history,
            current_message=current_message,
            retrieved_context=retrieved_context,
        )
    except (AppError, RateLimitExceededError) as exc:
        should_fallback = primary_model != FALLBACK_CHAT_MODEL and (
            isinstance(exc, RateLimitExceededError)
            or (isinstance(exc, AppError) and exc.code == "AI_UNAVAILABLE")
        )
        if should_fallback:
            logger.warning(
                "Primary model '%s' failed (%s); falling back to '%s'",
                primary_model,
                getattr(exc, "code", type(exc).__name__),
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


def _build_cache_key(
    message_text: str,
    *,
    scope: str | None = None,
    detail_level: str | None = None,
) -> str:
    norm_q = " ".join((message_text or "").strip().lower().split())
    raw = f"{norm_q}|scope={(scope or '').strip().lower()}|detail={(detail_level or '').strip().lower()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def run_multi_agent_pipeline(
    db: Session,
    *,
    message_text: str,
    conversation_history: list[dict[str, str]] | None = None,
    scope: str | None = None,
    detail_level: str | None = None,
) -> dict[str, Any]:
    """Execute the lean 3-stage pipeline: route -> retrieve -> synthesize."""
    route = route_message(message_text, scope=scope, detail_level=detail_level)

    can_use_cache = not conversation_history
    cache_key = _build_cache_key(message_text, scope=scope, detail_level=detail_level)
    if can_use_cache:
        cached_payload = response_cache.get(cache_key)
        if isinstance(cached_payload, dict):
            return {
                **cached_payload,
                "route": route,
                "cached": True,
            }

    retrieved_context, sources = retrieve_agent_context(
        db,
        message_text=message_text,
        route=route,
    )
    synthesis = _generate_with_fallback(
        conversation_history=conversation_history,
        current_message=message_text,
        retrieved_context=retrieved_context,
    )

    payload: dict[str, Any] = {
        "reply": str(synthesis["text"]),
        "model": str(synthesis["model"]),
        "mode": "multi_agent_rag",
        "context_used": bool(retrieved_context),
        "fallback_from": synthesis.get("fallback_from"),
        "sources": sources,
        "hero_type": route.intent,
        "hero_data": {
            "intent": route.intent,
            "section": route.section_hint,
            "citations_count": len(sources),
        },
        "token_usage": synthesis.get("tokenUsage"),
        "finish_reason": synthesis.get("finishReason"),
        "cached": False,
    }

    if can_use_cache:
        response_cache.set(cache_key, payload)

    return {
        **payload,
        "route": route,
    }
