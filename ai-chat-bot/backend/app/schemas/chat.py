import base64
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ALLOWED_IMAGE_MIME_TYPES: set[str] = {
    "image/jpeg",
    "image/png",
    "image/webp",
}
MAX_IMAGE_BASE64_CHARS = 5_600_000


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


class AttachmentResponse(BaseModel):
    """Serialized attachment metadata attached to a persisted message."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    message_id: int
    file_name: str
    mime_type: str
    file_size: int
    created_at: datetime


class MessageResponse(BaseModel):
    """Serialized representation of a single persisted message."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: Literal["user", "assistant"]
    content: str
    model: str | None = None
    created_at: datetime
    attachments: list[AttachmentResponse] = Field(default_factory=list)


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
    """Request payload for sending a message (and optional image) to the assistant."""

    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: int | None = Field(default=None, ge=1)
    image_base64: str | None = Field(default=None, max_length=MAX_IMAGE_BASE64_CHARS)
    image_mime_type: str | None = Field(default=None, max_length=120)
    image_file_name: str | None = Field(default=None, max_length=255)

    @field_validator("message")
    @classmethod
    def validate_non_whitespace_message(cls, value: str) -> str:
        """Reject messages that are empty or contain only whitespace."""
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Message cannot be empty or whitespace only.")
        return trimmed

    @field_validator("image_mime_type")
    @classmethod
    def validate_image_mime_type(cls, value: str | None) -> str | None:
        """Allow only safe raster image MIME types when provided."""
        if value is None:
            return None
        normalized = value.strip().lower()
        if not normalized:
            return None
        if normalized not in ALLOWED_IMAGE_MIME_TYPES:
            raise ValueError(
                f"Unsupported image_mime_type '{value}'. Allowed: image/jpeg, image/png, image/webp."
            )
        return normalized

    @field_validator("image_file_name")
    @classmethod
    def normalize_image_file_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None

    @model_validator(mode="after")
    def validate_image_pair(self) -> "ChatRequest":
        """Ensure base64 payload and MIME type are provided together and decode cleanly."""
        has_b64 = bool(self.image_base64 and self.image_base64.strip())
        has_mime = bool(self.image_mime_type)

        if has_b64 != has_mime:
            raise ValueError(
                "Both image_base64 and image_mime_type must be provided together."
            )

        if has_b64:
            raw_b64 = (self.image_base64 or "").strip()
            if "," in raw_b64 and raw_b64.lower().startswith("data:"):
                raw_b64 = raw_b64.split(",", 1)[1].strip()
            try:
                decoded = base64.b64decode(raw_b64, validate=True)
            except Exception as exc:
                raise ValueError("Invalid base64 image payload.") from exc
            if not decoded:
                raise ValueError("Decoded image payload cannot be empty.")

        return self


class ChatResponse(BaseModel):
    """Response payload returned after persisting and generating a chat reply."""

    conversation_id: int
    message_id: int
    reply: str
    role: Literal["assistant"] = "assistant"
    mode: str
    model: str