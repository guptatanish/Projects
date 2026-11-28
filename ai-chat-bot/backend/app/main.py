from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes.auth import router as auth_router
from app.api.routes.chat import router as chat_router
from app.api.routes.conversations import router as conversations_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.db.session import engine
from app.utils.response import json_success


def _check_database_health() -> bool:
    """Verify PostgreSQL connectivity with a lightweight SELECT 1 query."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@asynccontextmanager
async def _lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and clean database pool disposal on shutdown."""
    try:
        yield
    finally:
        engine.dispose()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=_lifespan,
    )

    cors_kwargs: dict[str, object] = {
        "allow_origins": settings.cors_origins_list,
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    if settings.cors_origin_regex:
        cors_kwargs["allow_origin_regex"] = settings.cors_origin_regex

    application.add_middleware(
        CORSMiddleware,
        **cors_kwargs,
    )

    register_exception_handlers(application)

    @application.get("/", tags=["health"])
    def root_health():
        """Lightweight root endpoint for platform health checks."""
        db_ok = _check_database_health()
        return json_success(
            {
                "status": "ok" if db_ok else "degraded",
                "service": settings.app_name,
                "environment": settings.environment,
                "database": "reachable" if db_ok else "unreachable",
            }
        )

    @application.get(f"{settings.api_v1_prefix}/health", tags=["health"])
    def health_check():
        """API v1 health check with database status."""
        db_ok = _check_database_health()
        return json_success(
            {
                "status": "ok" if db_ok else "degraded",
                "service": settings.app_name,
                "environment": settings.environment,
                "database": "reachable" if db_ok else "unreachable",
                "phase": 9,
            }
        )

    application.include_router(auth_router, prefix=settings.api_v1_prefix)
    application.include_router(chat_router, prefix=settings.api_v1_prefix)
    application.include_router(conversations_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
