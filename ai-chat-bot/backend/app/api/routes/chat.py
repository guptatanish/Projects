from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=200)
def send_chat_message(payload: ChatRequest) -> ChatResponse:
    """Phase 2 chat endpoint powered by Gemini Flash via chat_service."""
    return chat_service.process_message(payload)