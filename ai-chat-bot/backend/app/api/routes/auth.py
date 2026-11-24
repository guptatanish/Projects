from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthSessionResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, user_id: int) -> None:
    """Attach an HttpOnly JWT session cookie to the HTTP response."""
    token = create_access_token(subject=user_id)
    max_age_seconds = max(60, settings.access_token_expire_minutes * 60)
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        path="/",
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_samesite,
    )


def _clear_session_cookie(response: Response) -> None:
    """Clear the HttpOnly JWT session cookie."""
    response.delete_cookie(
        key=settings.cookie_name,
        path="/",
        domain=settings.cookie_domain,
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_samesite,
    )


@router.post(
    "/register",
    response_model=AuthSessionResponse,
    status_code=201,
)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    """Register a new user and start an HttpOnly cookie session."""
    user = auth_service.register_user(
        db,
        email=payload.email,
        full_name=payload.full_name,
        password=payload.password,
    )
    _set_session_cookie(response, user.id)
    return AuthSessionResponse(
        authenticated=True,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthSessionResponse,
    status_code=200,
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    """Authenticate credentials and set an HttpOnly JWT session cookie."""
    user = auth_service.authenticate_user(
        db,
        email=payload.email,
        password=payload.password,
    )
    _set_session_cookie(response, user.id)
    return AuthSessionResponse(
        authenticated=True,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    status_code=200,
)
def logout(response: Response) -> dict[str, bool]:
    """Clear the session cookie and log out the user."""
    _clear_session_cookie(response)
    return {"authenticated": False}


@router.get(
    "/me",
    response_model=AuthSessionResponse,
    status_code=200,
)
def me(current_user: User = Depends(get_current_user)) -> AuthSessionResponse:
    """Return the currently authenticated user profile."""
    return AuthSessionResponse(
        authenticated=True,
        user=UserResponse.model_validate(current_user),
    )