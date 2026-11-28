from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api.deps import ensure_conversation_owner, get_current_user
from app.core.errors import AppError
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import (
    ConversationDetailResponse,
    ConversationSummaryResponse,
    CreateConversationRequest,
    RenameConversationRequest,
)
from app.services import conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post(
    "",
    response_model=ConversationSummaryResponse,
    status_code=201,
)
def create_conversation(
    payload: CreateConversationRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationSummaryResponse:
    """Create a new conversation thread in PostgreSQL owned by the current user."""
    title = payload.title if payload is not None else None
    conversation = conversation_service.create_conversation(
        db,
        title=title,
        user_id=current_user.id,
    )
    return ConversationSummaryResponse.model_validate(conversation)


@router.get(
    "",
    response_model=list[ConversationSummaryResponse],
    status_code=200,
)
def list_conversations(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConversationSummaryResponse]:
    """List recent conversations for the current user ordered by most recently updated."""
    safe_limit = max(1, min(limit, 200))
    conversations = conversation_service.list_conversations(
        db,
        limit=safe_limit,
        user_id=current_user.id,
    )
    return [
        ConversationSummaryResponse.model_validate(item)
        for item in conversations
    ]


@router.get(
    "/{conversation_id}",
    response_model=ConversationDetailResponse,
    status_code=200,
)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetailResponse:
    """Fetch a single conversation along with its chronological messages."""
    conversation = conversation_service.get_conversation_by_id(
        db,
        conversation_id,
        with_messages=True,
    )
    if conversation is None:
        raise AppError(
            code="CONVERSATION_NOT_FOUND",
            message=f"Conversation {conversation_id} was not found.",
            status_code=404,
        )
    ensure_conversation_owner(conversation, current_user)
    return ConversationDetailResponse.model_validate(conversation)


@router.patch(
    "/{conversation_id}",
    response_model=ConversationSummaryResponse,
    status_code=200,
)
def update_conversation(
    conversation_id: int,
    payload: RenameConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationSummaryResponse:
    """Rename a conversation owned by the current user."""
    conversation = conversation_service.get_conversation_by_id(
        db,
        conversation_id,
        with_messages=False,
    )
    if conversation is None:
        raise AppError(
            code="CONVERSATION_NOT_FOUND",
            message=f"Conversation {conversation_id} was not found.",
            status_code=404,
        )
    ensure_conversation_owner(conversation, current_user)
    updated = conversation_service.rename_conversation(
        db,
        conversation,
        title=payload.title,
    )
    return ConversationSummaryResponse.model_validate(updated)


@router.delete(
    "/{conversation_id}",
    status_code=204,
)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Delete a conversation and its messages from PostgreSQL if owned by the current user."""
    conversation = conversation_service.get_conversation_by_id(
        db,
        conversation_id,
        with_messages=False,
    )
    if conversation is None:
        raise AppError(
            code="CONVERSATION_NOT_FOUND",
            message=f"Conversation {conversation_id} was not found.",
            status_code=404,
        )
    ensure_conversation_owner(conversation, current_user)
    conversation_service.delete_conversation(
        db,
        conversation_id,
        conversation=conversation,
    )
    return Response(status_code=204)
