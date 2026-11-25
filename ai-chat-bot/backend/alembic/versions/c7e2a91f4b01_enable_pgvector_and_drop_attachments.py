"""enable_pgvector_and_drop_attachments

Revision ID: c7e2a91f4b01
Revises: ad69d29ba890
Create Date: 2026-11-25 23:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7e2a91f4b01"
down_revision: Union[str, Sequence[str], None] = "ad69d29ba890"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Enable pgvector extension and drop legacy attachments table."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    op.execute("DROP TABLE IF EXISTS attachments CASCADE;")


def downgrade() -> None:
    """Recreate attachments table (leaves pgvector extension in place)."""
    op.create_table(
        "attachments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("message_id", sa.Integer(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_attachments_message_id"), "attachments", ["message_id"], unique=False)
