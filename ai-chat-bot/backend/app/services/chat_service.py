from datetime import datetime, timezone
import logging

from sqlalchemy.orm import Session

from app.api.deps import ensure_conversation_owner
from app.core.config import settings
from app.core.errors import AppError
from app.core.rate_limit import chat_rate_limiter
from app.models.conversation import Conversation
from app.models.message import Message
from app.services import conversation_service
from app.services.agent_pipeline import run_multi_agent_pipeline

logger = logging.getLogger(__name__)


def _build_default_title(message_text: str) -> str:
    """Derive a concise conversation title from the opening user prompt."""
    single_line = " ".join(message_text.strip().split())
    if len(single_line) <= 60:
        return single_line
    return f"{single_line[:57].rstrip()}..."


def send_chat_message(
    db: Session,
    *,
    message_text: str,
    conversation_id: int | None = None,
    user_id: int | None = None,
    history_limit: int | None = None,
    history_max_chars: int | None = None,
    rate_limit_key: str = "default",
) -> dict[str, object]:
    """Persist user and assistant text messages via the lean multi-agent RAG pipeline."""
    chat_rate_limiter.check_and_record(rate_limit_key)

    if conversation_id is not None:
        conversation = conversation_service.get_conversation_by_id(
            db,
            conversation_id,
            with_messages=False,
        )
        if conversation is None:
            raise AppError(
                code="CONVERSATION_NOT_FOUND",
                message=f"Conversation {conversation_id} was not found.",
                status_code=404,
            )
        if user_id is not None:
            ensure_conversation_owner(
                conversation,
                type("AuthUser", (), {"id": user_id})(),
            )
    else:
        conversation = Conversation(
            title=_build_default_title(message_text)[:200],
            user_id=user_id,
        )
        db.add(conversation)
        db.flush()

    effective_limit = (
        settings.history_message_limit if history_limit is None else history_limit
    )
    effective_max_chars = (
        settings.history_max_chars if history_max_chars is None else history_max_chars
    )

    prior_messages = conversation_service.get_recent_messages(
        db,
        conversation.id,
        limit=effective_limit,
        max_chars=effective_max_chars,
    )
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in prior_messages
    ]

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=message_text,
        model=None,
    )
    db.add(user_message)
    db.flush()

    pipeline_result = run_multi_agent_pipeline(
        db,
        message_text=message_text,
        conversation_history=conversation_history,
    )

    reply_text = str(pipeline_result["reply"])
    model_used = str(pipeline_result["model"])
    mode_used = str(pipeline_result.get("mode") or "multi_agent_rag")

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=reply_text,
        model=model_used,
    )
    db.add(assistant_message)
    db.flush()

    if conversation.title == "New Chat":
        conversation.title = _build_default_title(message_text)[:200]
    conversation.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(assistant_message)

    return {
        "conversation_id": conversation.id,
        "message_id": assistant_message.id,
        "reply": reply_text,
        "role": "assistant",
        "mode": mode_used,
        "model": model_used,
    }
