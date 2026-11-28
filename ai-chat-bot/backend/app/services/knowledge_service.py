from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.data.profile_knowledge import PROFILE_KNOWLEDGE_CHUNKS
from app.models.knowledge_chunk import KnowledgeChunk
from app.services.chunking_service import load_markdown_chunks
from app.services.gemini_service import gemini_service


def get_source_knowledge_items() -> list[dict[str, object]]:
    """Return knowledge chunks from Markdown files in backend/knowledge/, or fallback defaults."""
    md_chunks = load_markdown_chunks()
    if md_chunks:
        return md_chunks
    return list(PROFILE_KNOWLEDGE_CHUNKS)


def seed_profile_knowledge(db: Session, *, force_reembed: bool = False) -> int:
    """Idempotently sync knowledge chunks from backend/knowledge/*.md into pgvector."""
    items = get_source_knowledge_items()
    existing_rows = {
        (row.source_key, row.chunk_index): row
        for row in db.scalars(select(KnowledgeChunk)).all()
    }

    pending_chunks: list[tuple[dict[str, object], KnowledgeChunk | None]] = []
    desired_keys: set[tuple[str, int]] = set()

    for item in items:
        source_key = str(item["source_key"])
        chunk_index = int(item["chunk_index"])
        title = str(item["title"])
        section = str(item["section"])
        content = str(item["content"])
        key = (source_key, chunk_index)
        desired_keys.add(key)

        existing = existing_rows.get(key)
        content_changed = existing is not None and (
            existing.content != content
            or existing.title != title
            or existing.section != section
        )
        if existing is None or force_reembed or content_changed:
            pending_chunks.append((item, existing))

    stale_keys = [k for k in existing_rows if k not in desired_keys]
    if stale_keys:
        for s_key, s_idx in stale_keys:
            db.execute(
                delete(KnowledgeChunk).where(
                    KnowledgeChunk.source_key == s_key,
                    KnowledgeChunk.chunk_index == s_idx,
                )
            )

    if pending_chunks:
        texts_to_embed = [str(item["content"]) for item, _ in pending_chunks]
        vectors = gemini_service.embed_texts(
            texts_to_embed,
            task_type="RETRIEVAL_DOCUMENT",
        )

        for (item, existing), vector in zip(pending_chunks, vectors):
            source_key = str(item["source_key"])
            chunk_index = int(item["chunk_index"])
            title = str(item["title"])
            section = str(item["section"])
            content = str(item["content"])

            if existing is None:
                db.add(
                    KnowledgeChunk(
                        source_key=source_key,
                        chunk_index=chunk_index,
                        title=title,
                        section=section,
                        content=content,
                        embedding=vector,
                    )
                )
            else:
                existing.title = title
                existing.section = section
                existing.content = content
                existing.embedding = vector

    if pending_chunks or stale_keys:
        db.commit()

    return len(pending_chunks)


def retrieve_relevant_chunks(
    db: Session,
    query_text: str,
    *,
    top_k: int = 4,
    section_filter: str | None = None,
) -> list[KnowledgeChunk]:
    """Retrieve top-K most similar knowledge chunks from pgvector using cosine distance."""
    cleaned_query = (query_text or "").strip()
    if not cleaned_query or top_k <= 0:
        return []

    query_vector = gemini_service.embed_text(
        cleaned_query,
        task_type="RETRIEVAL_QUERY",
    )
    stmt = select(KnowledgeChunk)
    if section_filter and section_filter != "overview":
        stmt = stmt.where(KnowledgeChunk.section == section_filter)
    stmt = stmt.order_by(KnowledgeChunk.embedding.cosine_distance(query_vector)).limit(top_k)
    results = list(db.scalars(stmt).all())

    if section_filter and section_filter != "overview" and len(results) < top_k:
        seen_ids = {row.id for row in results}
        fallback_stmt = (
            select(KnowledgeChunk)
            .order_by(KnowledgeChunk.embedding.cosine_distance(query_vector))
            .limit(top_k * 2)
        )
        for row in db.scalars(fallback_stmt).all():
            if row.id not in seen_ids:
                results.append(row)
                seen_ids.add(row.id)
            if len(results) >= top_k:
                break

    return results


def format_retrieved_context(chunks: list[KnowledgeChunk]) -> str:
    """Format retrieved chunks into a compact grounding block for prompts."""
    if not chunks:
        return ""
    lines = ["Relevant Profile Knowledge Chunks:"]
    for idx, chunk in enumerate(chunks, start=1):
        lines.append(f"[{idx}] ({chunk.section} - {chunk.title}): {chunk.content}")
    return "\n".join(lines)
