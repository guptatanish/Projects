from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.models.conversation import Conversation
from app.models.message import Message


def create_conversation(db: Session, title: str | None = None) -> Conversation:
    """Create and persist a new conversation record in PostgreSQL."""
    cleaned_title = (title or "").strip() or "New Chat"
    conversation = Conversation(title=cleaned_title[:200])
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def list_conversations(db: Session, limit: int = 50) -> list[Conversation]:
    """Return recent conversations ordered by most recently updated."""
    stmt = (
        select(Conversation)
        .order_by(desc(Conversation.updated_at), desc(Conversation.id))
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def get_conversation_by_id(
    db: Session,
    conversation_id: int,
    *,
    with_messages: bool = False,
) -> Conversation | None:
    """Fetch a single conversation by ID, optionally preloading its ordered messages."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    if with_messages:
        stmt = stmt.options(selectinload(Conversation.messages))
    return db.scalar(stmt)


def get_recent_messages(
    db: Session,
    conversation_id: int,
    limit: int = 20,
) -> list[Message]:
    """Return up to `limit` most recent messages for a conversation in chronological order."""
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(desc(Message.id))
        .limit(limit)
    )
    recent_desc = list(db.scalars(stmt).all())
    recent_desc.reverse()
    return recent_desc


def delete_conversation(db: Session, conversation_id: int) -> bool:
    """Delete a conversation by ID; returns True if deleted, False if not found."""
    conversation = get_conversation_by_id(db, conversation_id, with_messages=False)
    if conversation is None:
        return False
    db.delete(conversation)
    db.commit()
    return True