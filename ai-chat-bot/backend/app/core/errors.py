import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.utils.response import build_error_payload

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base application exception mapped to a standardized JSON error response."""

    def __init__(
        self,
        code: str = "INTERNAL_ERROR",
        message: str = "An unexpected error occurred.",
        status_code: int = 500,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class RateLimitExceededError(AppError):
    """Raised when request rate or AI quota limits are exceeded."""

    def __init__(
        self,
        message: str = "Too many requests. Please wait a moment and try again.",
    ) -> None:
        super().__init__(
            code="AI_RATE_LIMITED",
            message=message,
            status_code=429,
        )


def _http_status_to_code(status_code: int) -> str:
    """Map common HTTP status codes to consistent application error codes."""
    mapping = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        415: "UNSUPPORTED_MEDIA_TYPE",
        422: "VALIDATION_ERROR",
        429: "AI_RATE_LIMITED",
    }
    return mapping.get(status_code, "HTTP_ERROR")


def register_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the FastAPI application."""

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        logger.warning(
            "AppError on %s %s: [%s] %s",
            request.method,
            request.url.path,
            exc.code,
            exc.message,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_payload(exc.code, exc.message),
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        first_error = exc.errors()[0] if exc.errors() else {}
        field_loc = " -> ".join(
            str(part) for part in first_error.get("loc", ()) if part != "body"
        )
        detail_msg = first_error.get("msg", "Invalid request input.")
        message = f"{field_loc}: {detail_msg}" if field_loc else detail_msg

        logger.info(
            "Validation error on %s %s: %s",
            request.method,
            request.url.path,
            message,
        )
        return JSONResponse(
            status_code=422,
            content=build_error_payload("VALIDATION_ERROR", message),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        code = _http_status_to_code(exc.status_code)
        safe_message = (
            exc.detail
            if isinstance(exc.detail, str) and exc.detail.strip()
            else "Request could not be processed."
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_payload(code, safe_message),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception(
            "Unhandled error on %s %s",
            request.method,
            request.url.path,
            exc_info=exc,
        )
        return JSONResponse(
            status_code=500,
            content=build_error_payload(
                "INTERNAL_SERVER_ERROR",
                "Something went wrong on our side. Please try again.",
            ),
        )