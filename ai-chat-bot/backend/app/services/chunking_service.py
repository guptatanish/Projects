from pathlib import Path
import re

KNOWLEDGE_DIR = Path(__file__).resolve().parents[2] / "knowledge"


def _infer_section(source_key: str, heading: str) -> str:
    """Map filename/heading to a canonical section tag for routing and filtering."""
    combined = f"{source_key} {heading}".lower()
    if any(k in combined for k in ("project", "enterprise", "roast", "chat-bot", "chatbot")):
        return "projects"
    if any(k in combined for k in ("skill", "stack", "tech", "experience", "interview", "tooling")):
        return "skills"
    if any(k in combined for k in ("education", "university", "college", "degree", "geu", "inventorium")):
        return "education"
    return "overview"


def load_markdown_chunks(
    knowledge_dir: Path | None = None,
    *,
    max_chunk_chars: int = 1200,
) -> list[dict[str, object]]:
    """Scan *.md files under knowledge_dir and split into structured chunk dicts."""
    base_dir = knowledge_dir or KNOWLEDGE_DIR
    if not base_dir.exists() or not base_dir.is_dir():
        return []

    md_files = sorted(base_dir.rglob("*.md"))
    chunks: list[dict[str, object]] = []

    for md_path in md_files:
        raw_text = md_path.read_text(encoding="utf-8").strip()
        if not raw_text:
            continue

        rel_stem = md_path.relative_to(base_dir).with_suffix("").as_posix()
        source_key = f"md:{rel_stem}"
        doc_title = md_path.stem.replace("_", " ").replace("-", " ").title()

        parts = re.split(r"(?m)^(#{2,3}\s+.+)$", raw_text)
        sections: list[tuple[str, str]] = []
        preamble = parts[0].strip()
        if preamble:
            sections.append((doc_title, preamble))

        idx = 1
        while idx < len(parts):
            heading_line = re.sub(r"^#{2,3}\s+", "", parts[idx]).strip()
            body = (parts[idx + 1] if idx + 1 < len(parts) else "").strip()
            if body:
                sections.append((heading_line or doc_title, f"## {heading_line}\n{body}"))
            idx += 2

        chunk_index = 0
        for heading, block_text in sections:
            text_clean = block_text.strip()
            if not text_clean:
                continue
            if len(text_clean) <= max_chunk_chars:
                sub_blocks = [text_clean]
            else:
                sub_blocks = []
                current_buf: list[str] = []
                current_len = 0
                for para in text_clean.split("\n\n"):
                    p = para.strip()
                    if not p:
                        continue
                    if current_buf and current_len + len(p) + 2 > max_chunk_chars:
                        sub_blocks.append("\n\n".join(current_buf))
                        current_buf = [f"## {heading}\n{p}"]
                        current_len = len(current_buf[0])
                    else:
                        current_buf.append(p)
                        current_len += len(p) + 2
                if current_buf:
                    sub_blocks.append("\n\n".join(current_buf))

            for sub in sub_blocks:
                chunks.append(
                    {
                        "source_key": source_key,
                        "chunk_index": chunk_index,
                        "title": heading,
                        "section": _infer_section(source_key, heading),
                        "content": sub.strip(),
                    }
                )
                chunk_index += 1

    return chunks
