from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import extract_client_ip, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _resolve_rate_limit_key(request: Request, user_id: int | None = None) -> str:
    """Derive a non-spoofable per-user rate-limit key or client IP fallback."""
    if user_id is not None:
        return f"user:{user_id}"
    return f"ip:{extract_client_ip(request)}"


@router.post("", response_model=ChatResponse, status_code=200)
def post_chat_message(
    request: Request,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Persist text chat messages and return a multi-agent RAG reply."""
    result = chat_service.send_chat_message(
        db,
        message_text=payload.message,
        conversation_id=payload.conversation_id,
        user_id=current_user.id,
        rate_limit_key=_resolve_rate_limit_key(request, user_id=current_user.id),
    )
    return ChatResponse.model_validate(result)
