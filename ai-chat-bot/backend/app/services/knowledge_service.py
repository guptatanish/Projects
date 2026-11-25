from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data.profile_knowledge import PROFILE_KNOWLEDGE_CHUNKS
from app.models.knowledge_chunk import KnowledgeChunk
from app.services.gemini_service import gemini_service


def seed_profile_knowledge(db: Session, *, force_reembed: bool = False) -> int:
    """Idempotently upsert profile knowledge chunks and their pgvector embeddings."""
    existing_rows = {
        (row.source_key, row.chunk_index): row
        for row in db.scalars(select(KnowledgeChunk)).all()
    }

    pending_chunks = []
    for item in PROFILE_KNOWLEDGE_CHUNKS:
        key = (item["source_key"], item["chunk_index"])
        existing = existing_rows.get(key)
        content_changed = existing is not None and (
            existing.content != item["content"]
            or existing.title != item["title"]
            or existing.section != item["section"]
        )
        if existing is None or force_reembed or content_changed:
            pending_chunks.append((item, existing))

    if not pending_chunks:
        return 0

    texts_to_embed = [item["content"] for item, _ in pending_chunks]
    vectors = gemini_service.embed_texts(texts_to_embed)

    for (item, existing), vector in zip(pending_chunks, vectors):
        if existing is None:
            db.add(
                KnowledgeChunk(
                    source_key=item["source_key"],
                    chunk_index=item["chunk_index"],
                    title=item["title"],
                    section=item["section"],
                    content=item["content"],
                    embedding=vector,
                )
            )
        else:
            existing.title = item["title"]
            existing.section = item["section"]
            existing.content = item["content"]
            existing.embedding = vector

    db.commit()
    return len(pending_chunks)


def retrieve_relevant_chunks(
    db: Session,
    query_text: str,
    *,
    top_k: int = 4,
) -> list[KnowledgeChunk]:
    """Retrieve top-K most similar knowledge chunks from pgvector using cosine distance."""
    cleaned_query = (query_text or "").strip()
    if not cleaned_query or top_k <= 0:
        return []

    query_vector = gemini_service.embed_text(cleaned_query)
    stmt = (
        select(KnowledgeChunk)
        .order_by(KnowledgeChunk.embedding.cosine_distance(query_vector))
        .limit(top_k)
    )
    return list(db.scalars(stmt).all())


def format_retrieved_context(chunks: list[KnowledgeChunk]) -> str:
    """Format retrieved chunks into a compact grounding block for prompts."""
    if not chunks:
        return ""
    lines = ["Relevant Profile Knowledge Chunks:"]
    for idx, chunk in enumerate(chunks, start=1):
        lines.append(f"[{idx}] ({chunk.section} - {chunk.title}): {chunk.content}")
    return "\n".join(lines)
