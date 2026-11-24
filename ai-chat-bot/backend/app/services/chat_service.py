import base64
from datetime import datetime, timezone
import os
from pathlib import Path
import tempfile
from typing import Any

from sqlalchemy.orm import Session

from app.api.deps import ensure_conversation_owner
from app.core.config import settings
from app.core.errors import AppError
from app.core.rate_limit import chat_rate_limiter
from app.models.attachment import Attachment
from app.models.conversation import Conversation
from app.models.message import Message
from app.services import conversation_service
from app.services.gemini_service import gemini_service

_EXT_BY_MIME: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def detect_image_mime_from_magic_bytes(data: bytes) -> str | None:
    """Inspect magic bytes to confirm actual JPEG, PNG, or WebP image format."""
    if not data:
        return None
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_image_bytes(
    data: bytes,
    *,
    declared_mime_type: str | None = None,
    file_name: str | None = None,
) -> dict[str, Any]:
    """Validate image byte length and magic bytes against allowed JPEG/PNG/WebP formats."""
    if not data:
        raise AppError(
            code="INVALID_ATTACHMENT",
            message="Image payload cannot be empty.",
            status_code=422,
        )

    max_bytes = settings.max_image_bytes
    if len(data) > max_bytes:
        max_mb = max_bytes // (1024 * 1024)
        raise AppError(
            code="ATTACHMENT_TOO_LARGE",
            message=f"Image attachment exceeds the {max_mb} MB limit.",
            status_code=413,
        )

    detected_mime = detect_image_mime_from_magic_bytes(data)
    if detected_mime is None:
        raise AppError(
            code="INVALID_ATTACHMENT",
            message="Unsupported or corrupted image bytes. Only JPEG, PNG, and WebP are allowed.",
            status_code=422,
        )

    normalized_declared = (declared_mime_type or "").strip().lower() or None
    if normalized_declared and normalized_declared != detected_mime:
        raise AppError(
            code="INVALID_ATTACHMENT",
            message=(
                f"Declared type '{normalized_declared}' does not match detected image bytes '{detected_mime}'."
            ),
            status_code=422,
        )

    ext = _EXT_BY_MIME[detected_mime]
    safe_name = Path(file_name).name if file_name else f"attachment{ext}"
    if not safe_name:
        safe_name = f"attachment{ext}"

    return {
        "data": data,
        "mime_type": detected_mime,
        "file_name": safe_name[:255],
        "file_size": len(data),
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
    """Decode validated base64 image input into bytes and verify magic bytes."""
    if not image_base64:
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

    return validate_image_bytes(
        image_bytes,
        declared_mime_type=image_mime_type,
        file_name=image_file_name,
    )


def _run_vision_with_temp_cleanup(
    *,
    conversation_history: list[dict[str, str]],
    current_message: str,
    validated_image: dict[str, Any] | None,
) -> dict[str, Any]:
    """Stage image bytes via a temporary file when present and guarantee cleanup in `finally`."""
    if validated_image is None:
        return gemini_service.generate_reply(
            conversation_history=conversation_history,
            current_message=current_message,
            optional_image=None,
        )

    suffix = _EXT_BY_MIME.get(validated_image["mime_type"], ".bin")
    temp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(validated_image["data"])
            temp_path = tmp.name

        with open(temp_path, "rb") as reader:
            staged_bytes = reader.read()

        return gemini_service.generate_reply(
            conversation_history=conversation_history,
            current_message=current_message,
            optional_image={
                "data": staged_bytes,
                "mime_type": validated_image["mime_type"],
            },
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


def send_chat_message(
    db: Session,
    *,
    message_text: str,
    conversation_id: int | None = None,
    user_id: int | None = None,
    history_limit: int | None = None,
    history_max_chars: int | None = None,
    image_base64: str | None = None,
    image_mime_type: str | None = None,
    image_file_name: str | None = None,
    image_bytes: bytes | None = None,
    rate_limit_key: str = "default",
) -> dict[str, object]:
    """Persist user and assistant messages (and optional image metadata) and generate a Gemini reply."""
    chat_rate_limiter.check_and_record(rate_limit_key)

    if image_bytes is not None:
        validated_image = validate_image_bytes(
            image_bytes,
            declared_mime_type=image_mime_type,
            file_name=image_file_name,
        )
    else:
        validated_image = _decode_image_payload(
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

    if validated_image is not None:
        attachment_row = Attachment(
            message_id=user_message.id,
            file_name=validated_image["file_name"],
            mime_type=validated_image["mime_type"],
            file_size=validated_image["file_size"],
            storage_path=None,
        )
        db.add(attachment_row)
        db.flush()

    ai_result = _run_vision_with_temp_cleanup(
        conversation_history=conversation_history,
        current_message=message_text,
        validated_image=validated_image,
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