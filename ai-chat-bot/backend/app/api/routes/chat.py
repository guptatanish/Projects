import json
from typing import Any

from fastapi import APIRouter, Depends, Request, UploadFile
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _resolve_rate_limit_key(request: Request, user_id: int | None = None) -> str:
    """Derive a per-user or per-client rate-limit key from user ID, forwarded header, or host."""
    forwarded_for = request.headers.get("x-forwarded-for")
    client_host = "anonymous"
    if forwarded_for:
        first_hop = forwarded_for.split(",")[0].strip()
        if first_hop:
            client_host = first_hop
    elif request.client and request.client.host:
        client_host = request.client.host

    if user_id is not None:
        return f"user:{user_id}:{client_host}"
    return client_host


async def _parse_chat_input(
    request: Request,
) -> tuple[str, int | None, str | None, str | None, str | None, bytes | None]:
    """Parse either JSON ChatRequest or multipart FormData (with at most 1 UploadFile)."""
    content_type = (request.headers.get("content-type") or "").lower()

    if "multipart/form-data" in content_type:
        form = await request.form()
        raw_message = form.get("message")
        message_text = raw_message.strip() if isinstance(raw_message, str) else ""
        if not message_text:
            raise AppError(
                code="VALIDATION_ERROR",
                message="Message text is required.",
                status_code=422,
            )

        raw_conv_id = form.get("conversation_id")
        conversation_id: int | None = None
        if raw_conv_id is not None and str(raw_conv_id).strip() != "":
            try:
                conversation_id = int(str(raw_conv_id).strip())
                if conversation_id <= 0:
                    raise ValueError("conversation_id must be positive")
            except ValueError as exc:
                raise AppError(
                    code="VALIDATION_ERROR",
                    message="conversation_id must be a positive integer.",
                    status_code=422,
                ) from exc

        upload_files: list[UploadFile] = []
        for field_name in ("image", "file", "attachment"):
            val = form.get(field_name)
            if isinstance(val, UploadFile):
                upload_files.append(val)

        if len(upload_files) > 1:
            raise AppError(
                code="INVALID_ATTACHMENT",
                message="Only one image attachment is allowed per message.",
                status_code=422,
            )

        image_bytes: bytes | None = None
        image_mime_type: str | None = None
        image_file_name: str | None = None

        if len(upload_files) == 1:
            upload = upload_files[0]
            try:
                image_bytes = await upload.read(settings.max_image_bytes + 1)
            finally:
                await upload.close()

            image_mime_type = upload.content_type
            image_file_name = upload.filename

        return (
            message_text,
            conversation_id,
            None,
            image_mime_type,
            image_file_name,
            image_bytes,
        )

    try:
        body: Any = await request.json()
    except Exception as exc:
        raise AppError(
            code="VALIDATION_ERROR",
            message="Invalid JSON request body.",
            status_code=422,
        ) from exc

    try:
        payload = ChatRequest.model_validate(body)
    except ValidationError as exc:
        first_err = exc.errors()[0] if exc.errors() else {}
        msg = str(first_err.get("msg") or "Invalid chat request payload.")
        raise AppError(
            code="VALIDATION_ERROR",
            message=msg,
            status_code=422,
        ) from exc

    return (
        payload.message,
        payload.conversation_id,
        payload.image_base64,
        payload.image_mime_type,
        payload.image_file_name,
        None,
    )


@router.post("", response_model=ChatResponse, status_code=200)
async def post_chat_message(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Persist chat messages (and optional image attachment) and return a Gemini Flash reply."""
    (
        message_text,
        conversation_id,
        image_base64,
        image_mime_type,
        image_file_name,
        image_bytes,
    ) = await _parse_chat_input(request)

    result = chat_service.send_chat_message(
        db,
        message_text=message_text,
        conversation_id=conversation_id,
        user_id=current_user.id,
        image_base64=image_base64,
        image_mime_type=image_mime_type,
        image_file_name=image_file_name,
        image_bytes=image_bytes,
        rate_limit_key=_resolve_rate_limit_key(request, user_id=current_user.id),
    )
    return ChatResponse.model_validate(result)