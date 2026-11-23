from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.conversation import Conversation
from app.models.message import Message
from app.services import conversation_service
from app.services.gemini_service import gemini_service


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
    history_limit: int = 20,
) -> dict[str, object]:
    """Persist user and assistant messages in PostgreSQL and generate a Gemini reply."""
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
    else:
        conversation = Conversation(title=_build_default_title(message_text)[:200])
        db.add(conversation)
        db.flush()

    prior_messages = conversation_service.get_recent_messages(
        db,
        conversation.id,
        limit=history_limit,
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

    ai_result = gemini_service.generate_reply(
        conversation_history=conversation_history,
        current_message=message_text,
    )

    reply_text = str(ai_result["text"])
    model_used = str(ai_result["model"])

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
        "mode": "gemini_flash",
        "model": model_used,
    }