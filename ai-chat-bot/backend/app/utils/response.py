from typing import Any
from fastapi.responses import JSONResponse


def build_error_payload(code: str, message: str) -> dict[str, dict[str, str]]:
    """Build the standardized error JSON structure used across the API."""
    return {
        "error": {
            "code": code,
            "message": message,
        }
    }


def json_success(
    data: Any,
    status_code: int = 200,
) -> JSONResponse:
    """Return a clean JSONResponse with consistent status coding."""
    return JSONResponse(status_code=status_code, content=data)