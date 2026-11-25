from typing import Any

from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
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


async def _parse_chat_input(request: Request) -> tuple[str, int | None]:
    """Parse JSON ChatRequest payload for text chat."""
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

    return payload.message, payload.conversation_id


@router.post("", response_model=ChatResponse, status_code=200)
async def post_chat_message(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Persist text chat messages and return a Gemini reply."""
    message_text, conversation_id = await _parse_chat_input(request)

    result = chat_service.send_chat_message(
        db,
        message_text=message_text,
        conversation_id=conversation_id,
        user_id=current_user.id,
        rate_limit_key=_resolve_rate_limit_key(request, user_id=current_user.id),
    )
    return ChatResponse.model_validate(result)