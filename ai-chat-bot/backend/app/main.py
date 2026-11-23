from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.chat import router as chat_router
from app.api.routes.conversations import router as conversations_router
from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.utils.response import json_success


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(application)

    @application.get(f"{settings.api_v1_prefix}/health", tags=["health"])
    async def health_check():
        """Lightweight server health check."""
        return json_success(
            {
                "status": "ok",
                "service": settings.app_name,
                "environment": settings.app_env,
                "phase": 3,
            }
        )

    application.include_router(chat_router, prefix=settings.api_v1_prefix)
    application.include_router(conversations_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()