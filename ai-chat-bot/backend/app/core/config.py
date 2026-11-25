from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed runtime configuration loaded from environment variables and .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "ai-chat-bot-backend"
    app_env: str = "development"
    environment: Literal["development", "production"] = "development"
    api_v1_prefix: str = "/api"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_router_model: str = "gemini-3.5-flash-lite"
    gemini_chat_model: str = "gemini-3.8-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 768
    gemini_timeout_seconds: float = 30.0
    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/ai_chat_bot"

    # Auth & HttpOnly cookie settings
    jwt_secret_key: str = "dev-only-change-me-in-production-secret-key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    cookie_name: str = "ai_chat_bot_session"
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_secure: bool = False
    cookie_domain: str | None = None

    # History windowing & size guard
    history_message_limit: int = 20
    history_max_chars: int = 16000

    # Rate limits (protects ₹0 free-tier Gemini quota)
    rate_limit_per_minute: int = 20
    rate_limit_per_day: int = 300

    # Image upload size cap (5 MB)
    max_image_bytes: int = 5 * 1024 * 1024

    @field_validator("api_v1_prefix")
    @classmethod
    def normalize_api_prefix(cls, value: str) -> str:
        """Ensure API prefix starts with '/' and has no trailing slash."""
        cleaned = value.strip()
        if not cleaned.startswith("/"):
            cleaned = f"/{cleaned}"
        return cleaned.rstrip("/") or "/api"

    @field_validator("environment", mode="before")
    @classmethod
    def normalize_environment(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator(
        "gemini_api_key",
        "gemini_model",
        "gemini_router_model",
        "gemini_chat_model",
        "gemini_embedding_model",
        "database_url",
        "jwt_secret_key",
        "cookie_name",
        mode="before",
    )
    @classmethod
    def strip_string_config(cls, value: object) -> object:
        """Trim accidental whitespace around string environment settings."""
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("embedding_dimensions")
    @classmethod
    def validate_embedding_dimensions(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("embedding_dimensions must be positive.")
        return value

    @field_validator("cookie_domain", mode="before")
    @classmethod
    def normalize_cookie_domain(cls, value: object) -> object:
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return value

    @field_validator("cookie_samesite", mode="before")
    @classmethod
    def normalize_cookie_samesite(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @property
    def cors_origins_list(self) -> list[str]:
        """Return CORS allowed origins as a clean list of URLs."""
        origins = [
            item.strip()
            for item in self.cors_origins.split(",")
            if item.strip()
        ]
        return origins or [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance so .env is parsed once per process."""
    return Settings()


settings = get_settings()