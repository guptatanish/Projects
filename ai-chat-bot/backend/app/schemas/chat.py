from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CreateConversationRequest(BaseModel):
    """Request payload for creating a new conversation."""

    title: str | None = Field(default=None, max_length=200)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None


class RenameConversationRequest(BaseModel):
    """Request payload for renaming an existing conversation (requires non-empty title)."""

    title: str = Field(..., min_length=1, max_length=200)

    @field_validator("title")
    @classmethod
    def validate_non_empty_title(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if not cleaned:
            raise ValueError("Title cannot be empty or whitespace only.")
        return cleaned


class MessageResponse(BaseModel):
    """Serialized representation of a single persisted message."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: Literal["user", "assistant"]
    content: str
    model: str | None = None
    response_metadata: dict[str, Any] | None = None
    created_at: datetime


class ConversationSummaryResponse(BaseModel):
    """Serialized summary of a conversation thread."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    created_at: datetime
    updated_at: datetime


class ConversationDetailResponse(ConversationSummaryResponse):
    """Serialized conversation thread including its chronological messages."""

    messages: list[MessageResponse] = Field(default_factory=list)


class ChatRequest(BaseModel):
    """Request payload for sending a text message to the assistant."""

    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: int | None = Field(default=None, ge=1)
    scope: str | None = Field(default=None, max_length=64)
    detail_level: Literal["concise", "detailed"] | None = None

    @field_validator("message")
    @classmethod
    def validate_non_whitespace_message(cls, value: str) -> str:
        """Reject messages that are empty or contain only whitespace."""
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Message cannot be empty or whitespace only.")
        return trimmed


class ChatResponse(BaseModel):
    """Response payload returned after persisting and generating a chat reply."""

    conversation_id: int
    message_id: int
    reply: str
    role: Literal["assistant"] = "assistant"
    mode: str
    model: str
    sources: list[dict[str, Any]] = Field(default_factory=list)
    hero_type: str | None = None
    hero_data: dict[str, Any] | None = None
    cached: bool = False
    token_usage: dict[str, int | None] | None = None
    finish_reason: str | None = None
