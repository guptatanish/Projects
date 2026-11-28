from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_DEFAULT_JWT_SECRET = "dev-only-change-me-in-production-secret-key"


class Settings(BaseSettings):
    """Typed runtime configuration loaded from environment variables and .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "ai-chat-bot-backend"
    environment: Literal["development", "production"] = "development"
    api_v1_prefix: str = "/api"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_origin_regex: str | None = None
    gemini_api_key: str = ""
    gemini_router_model: str = "gemini-3.5-flash-lite"
    gemini_chat_model: str = "gemini-3.8-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    embedding_dimensions: int = 768
    gemini_timeout_seconds: float = 30.0
    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/ai_chat_bot"

    # Auth & HttpOnly cookie settings
    jwt_secret_key: str = DEV_DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    cookie_name: str = "ai_chat_bot_session"
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_secure: bool = False
    cookie_domain: str | None = None

    # History windowing & size guard
    history_message_limit: int = 20
    history_max_chars: int = 16000

    # Rate limits (protects ₹0 free-tier Gemini quota & CPU on single-worker instances)
    rate_limit_per_minute: int = 20
    rate_limit_per_day: int = 300
    auth_rate_limit_per_minute: int = 10
    auth_rate_limit_per_day: int = 100

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

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """Normalize standard postgres/postgresql URLs to use psycopg v3 driver."""
        cleaned = value.strip()
        if cleaned.startswith("postgres://"):
            return f"postgresql+psycopg://{cleaned[len('postgres://'):]}"
        if cleaned.startswith("postgresql://"):
            return f"postgresql+psycopg://{cleaned[len('postgresql://'):]}"
        return cleaned

    @field_validator("cors_origin_regex", mode="before")
    @classmethod
    def normalize_cors_origin_regex(cls, value: object) -> object:
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
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

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        """Fail fast in production if JWT_SECRET_KEY is still the dev placeholder or too weak."""
        if self.is_production:
            if (
                not self.jwt_secret_key
                or self.jwt_secret_key == DEV_DEFAULT_JWT_SECRET
                or len(self.jwt_secret_key) < 32
            ):
                raise ValueError(
                    "Production startup blocked: JWT_SECRET_KEY must be set to a strong secret (>= 32 chars) and must not use the dev placeholder."
                )
        return self

    @property
    def is_production(self) -> bool:
        """Return True when running in a production environment."""
        return self.environment == "production"

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
