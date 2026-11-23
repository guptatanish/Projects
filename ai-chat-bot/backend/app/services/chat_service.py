import base64
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.rate_limit import chat_rate_limiter
from app.models.attachment import Attachment
from app.models.conversation import Conversation
from app.models.message import Message
from app.services import conversation_service
from app.services.gemini_service import gemini_service

MAX_DECODED_IMAGE_BYTES = 4 * 1024 * 1024  # 4 MB cap for low-RAM safety
_EXT_BY_MIME: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _build_default_title(message_text: str) -> str:
    """Derive a concise conversation title from the opening user prompt."""
    single_line = " ".join(message_text.strip().split())
    if len(single_line) <= 60:
        return single_line
    return f"{single_line[:57].rstrip()}..."


def _decode_image_payload(
    *,
    image_base64: str | None,
    image_mime_type: str | None,
    image_file_name: str | None,
) -> dict[str, Any] | None:
    """Decode validated base64 image input into bytes and normalized metadata."""
    if not image_base64 or not image_mime_type:
        return None

    raw_b64 = image_base64.strip()
    if "," in raw_b64 and raw_b64.lower().startswith("data:"):
        raw_b64 = raw_b64.split(",", 1)[1].strip()

    try:
        image_bytes = base64.b64decode(raw_b64, validate=True)
    except Exception as exc:
        raise AppError(
            code="INVALID_ATTACHMENT",
            message="Invalid base64 image payload.",
            status_code=422,
        ) from exc

    if not image_bytes:
        raise AppError(
            code="INVALID_ATTACHMENT",
            message="Decoded image payload cannot be empty.",
            status_code=422,
        )

    if len(image_bytes) > MAX_DECODED_IMAGE_BYTES:
        raise AppError(
            code="ATTACHMENT_TOO_LARGE",
            message="Image attachment exceeds the 4 MB limit.",
            status_code=413,
        )

    ext = _EXT_BY_MIME.get(image_mime_type, ".bin")
    safe_name = Path(image_file_name).name if image_file_name else f"attachment{ext}"
    if not safe_name:
        safe_name = f"attachment{ext}"

    return {
        "data": image_bytes,
        "mime_type": image_mime_type,
        "file_name": safe_name[:255],
        "file_size": len(image_bytes),
    }


def send_chat_message(
    db: Session,
    *,
    message_text: str,
    conversation_id: int | None = None,
    history_limit: int = 20,
    image_base64: str | None = None,
    image_mime_type: str | None = None,
    image_file_name: str | None = None,
    rate_limit_key: str = "default",
) -> dict[str, object]:
    """Persist user and assistant messages (and optional image metadata) and generate a Gemini reply."""
    chat_rate_limiter.check_and_record(rate_limit_key)

    decoded_image = _decode_image_payload(
        image_base64=image_base64,
        image_mime_type=image_mime_type,
        image_file_name=image_file_name,
    )

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

    if decoded_image is not None:
        attachment_row = Attachment(
            message_id=user_message.id,
            file_name=decoded_image["file_name"],
            mime_type=decoded_image["mime_type"],
            file_size=decoded_image["file_size"],
            storage_path=None,
        )
        db.add(attachment_row)
        db.flush()

    optional_image = (
        {
            "data": decoded_image["data"],
            "mime_type": decoded_image["mime_type"],
        }
        if decoded_image is not None
        else None
    )

    ai_result = gemini_service.generate_reply(
        conversation_history=conversation_history,
        current_message=message_text,
        optional_image=optional_image,
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