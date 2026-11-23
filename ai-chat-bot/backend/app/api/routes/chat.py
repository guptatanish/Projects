from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _resolve_rate_limit_key(request: Request) -> str:
    """Derive a per-client rate-limit key from client host or forwarded header."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        first_hop = forwarded_for.split(",")[0].strip()
        if first_hop:
            return first_hop
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


@router.post("", response_model=ChatResponse, status_code=200)
def post_chat_message(
    payload: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Persist chat messages (and optional image metadata) and return a Gemini Flash reply."""
    result = chat_service.send_chat_message(
        db,
        message_text=payload.message,
        conversation_id=payload.conversation_id,
        image_base64=payload.image_base64,
        image_mime_type=payload.image_mime_type,
        image_file_name=payload.image_file_name,
        rate_limit_key=_resolve_rate_limit_key(request),
    )
    return ChatResponse.model_validate(result)