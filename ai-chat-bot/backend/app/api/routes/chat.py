from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse, status_code=200)
async def send_chat_message(payload: ChatRequest) -> ChatResponse:
    """Phase 1 mock/echo chat endpoint before Gemini Flash and DB persistence."""
    return ChatResponse(
        reply=f"[Phase 1 Mock Reply] Received: {payload.message}",
        role="assistant",
        mode="mock",
        model=None,
    )