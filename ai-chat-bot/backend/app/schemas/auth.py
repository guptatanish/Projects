from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _normalize_email(value: str) -> str:
    cleaned = value.strip().lower()
    if "@" not in cleaned or "." not in cleaned.split("@")[-1]:
        raise ValueError("Please provide a valid email address.")
    return cleaned


class RegisterRequest(BaseModel):
    """Payload for registering a new user account."""

    email: str = Field(..., min_length=5, max_length=255)
    full_name: str = Field(..., min_length=1, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _normalize_email(value)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if not cleaned:
            raise ValueError("Full name cannot be empty.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Password cannot be blank or whitespace only.")
        return value


class LoginRequest(BaseModel):
    """Payload for authenticating an existing user."""

    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _normalize_email(value)


class UserResponse(BaseModel):
    """Public serialized representation of an authenticated user (never includes password_hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    created_at: datetime
    updated_at: datetime


class AuthSessionResponse(BaseModel):
    """Response payload returned on register/login/me session endpoints."""

    authenticated: bool = True
    user: UserResponse