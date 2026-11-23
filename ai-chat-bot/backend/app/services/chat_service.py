from typing import Any

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini_service import GeminiService, gemini_service


class ChatService:
    """Orchestrates chat message handling across AI and (later) persistence layers."""

    def __init__(self, ai_service: GeminiService = gemini_service) -> None:
        self.ai_service = ai_service

    def process_message(
        self,
        payload: ChatRequest,
        *,
        system_instruction: str | None = None,
        conversation_history: list[dict[str, str]] | None = None,
        optional_image: dict[str, Any] | None = None,
    ) -> ChatResponse:
        """Send a user message to Gemini Flash and return a standardized ChatResponse."""
        ai_result = self.ai_service.generate_reply(
            system_instruction=system_instruction,
            conversation_history=conversation_history,
            current_message=payload.message,
            optional_image=optional_image,
        )

        return ChatResponse(
            reply=ai_result["text"],
            role="assistant",
            mode="gemini_flash",
            model=ai_result["model"],
        )


chat_service = ChatService()