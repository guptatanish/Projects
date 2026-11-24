from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.models.conversation import Conversation
from app.models.message import Message


def create_conversation(
    db: Session,
    title: str | None = None,
    *,
    user_id: int | None = None,
) -> Conversation:
    """Create and persist a new conversation record in PostgreSQL."""
    cleaned_title = (title or "").strip() or "New Chat"
    conversation = Conversation(
        title=cleaned_title[:200],
        user_id=user_id,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def list_conversations(
    db: Session,
    limit: int = 50,
    *,
    user_id: int | None = None,
) -> list[Conversation]:
    """Return recent conversations ordered by most recently updated, scoped to user_id when provided."""
    stmt = select(Conversation)
    if user_id is not None:
        stmt = stmt.where(Conversation.user_id == user_id)
    stmt = stmt.order_by(desc(Conversation.updated_at), desc(Conversation.id)).limit(limit)
    return list(db.scalars(stmt).all())


def get_conversation_by_id(
    db: Session,
    conversation_id: int,
    *,
    with_messages: bool = False,
) -> Conversation | None:
    """Fetch a single conversation by ID, optionally preloading its ordered messages and attachments."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    if with_messages:
        stmt = stmt.options(
            selectinload(Conversation.messages).selectinload(Message.attachments)
        )
    return db.scalar(stmt)


def rename_conversation(
    db: Session,
    conversation: Conversation,
    *,
    title: str,
) -> Conversation:
    """Update a conversation's title and refresh its `updated_at` timestamp."""
    cleaned = " ".join(title.strip().split())
    conversation.title = (cleaned or "New Chat")[:200]
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_recent_messages(
    db: Session,
    conversation_id: int,
    limit: int = 20,
    max_chars: int | None = None,
) -> list[Message]:
    """Return up to `limit` most recent messages in chronological order, respecting an optional char budget."""
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(desc(Message.id))
        .limit(limit)
    )
    recent_desc = list(db.scalars(stmt).all())
    recent_desc.reverse()

    if max_chars is None or max_chars <= 0:
        return recent_desc

    selected_reversed: list[Message] = []
    used_chars = 0
    for msg in reversed(recent_desc):
        msg_len = len(msg.content or "")
        if selected_reversed and (used_chars + msg_len > max_chars):
            break
        if not selected_reversed and msg_len > max_chars:
            selected_reversed.append(msg)
            break
        selected_reversed.append(msg)
        used_chars += msg_len

    selected_reversed.reverse()
    return selected_reversed


def delete_conversation(
    db: Session,
    conversation_id: int,
    *,
    conversation: Conversation | None = None,
) -> bool:
    """Delete a conversation by ID; returns True if deleted, False if not found."""
    target = conversation or get_conversation_by_id(db, conversation_id, with_messages=False)
    if target is None:
        return False
    db.delete(target)
    db.commit()
    return True