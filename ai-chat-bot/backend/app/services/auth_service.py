from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import hash_password, verify_password
from app.models.user import User


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Fetch a user by primary key."""
    if user_id <= 0:
        return None
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    """Fetch a user by normalized lowercase email."""
    normalized_email = email.strip().lower()
    stmt = select(User).where(User.email == normalized_email)
    return db.scalar(stmt)


def register_user(
    db: Session,
    *,
    email: str,
    full_name: str,
    password: str,
) -> User:
    """Register a new user account and persist it in PostgreSQL."""
    normalized_email = email.strip().lower()
    existing = get_user_by_email(db, normalized_email)
    if existing is not None:
        raise AppError(
            code="EMAIL_ALREADY_REGISTERED",
            message="An account with this email already exists.",
            status_code=409,
        )

    user = User(
        email=normalized_email,
        full_name=" ".join(full_name.strip().split()),
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(
    db: Session,
    *,
    email: str,
    password: str,
) -> User:
    """Verify email and password and return the authenticated User."""
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise AppError(
            code="INVALID_CREDENTIALS",
            message="Invalid email or password.",
            status_code=401,
        )
    return user