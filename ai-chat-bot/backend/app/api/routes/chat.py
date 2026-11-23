from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=200)
def post_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
) -> ChatResponse:
    """Persist chat messages in PostgreSQL and return a Gemini Flash reply."""
    result = chat_service.send_chat_message(
        db,
        message_text=payload.message,
        conversation_id=payload.conversation_id,
    )
    return ChatResponse.model_validate(result)