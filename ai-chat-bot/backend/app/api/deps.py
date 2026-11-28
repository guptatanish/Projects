from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.conversation import Conversation
from app.models.user import User
from app.services import auth_service


def extract_client_ip(request: Request) -> str:
    """Resolve client IP without trusting an arbitrary spoofable first X-Forwarded-For hop."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        parts = [p.strip() for p in forwarded_for.split(",") if p.strip()]
        if parts:
            return parts[-1]
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Resolve the currently authenticated user from the HttpOnly session cookie."""
    token = request.cookies.get(settings.cookie_name)
    if not token:
        raise AppError(
            code="UNAUTHORIZED",
            message="Authentication required. Please log in.",
            status_code=401,
        )

    payload = decode_access_token(token)
    if payload is None:
        raise AppError(
            code="UNAUTHORIZED",
            message="Session is invalid or has expired. Please log in again.",
            status_code=401,
        )

    subject = payload.get("sub")
    try:
        user_id = int(str(subject))
    except (TypeError, ValueError) as exc:
        raise AppError(
            code="UNAUTHORIZED",
            message="Invalid authentication token subject.",
            status_code=401,
        ) from exc

    user = auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise AppError(
            code="UNAUTHORIZED",
            message="Authenticated user no longer exists.",
            status_code=401,
        )

    return user


def ensure_conversation_owner(
    conversation: Conversation,
    current_user_or_id: User | int,
) -> None:
    """Enforce that `current_user_or_id` owns `conversation` (IDOR guard -> 403 Forbidden)."""
    actor_id = (
        current_user_or_id
        if isinstance(current_user_or_id, int)
        else current_user_or_id.id
    )
    if conversation.user_id is None or conversation.user_id != actor_id:
        raise AppError(
            code="FORBIDDEN",
            message="You do not have permission to access this conversation.",
            status_code=403,
        )
