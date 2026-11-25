from typing import TypedDict


class ProfileKnowledgeChunk(TypedDict):
    source_key: str
    chunk_index: int
    title: str
    section: str
    content: str


PROFILE_KNOWLEDGE_CHUNKS: list[ProfileKnowledgeChunk] = [
    {
        "source_key": "profile_overview",
        "chunk_index": 0,
        "title": "Identity, Role & Location",
        "section": "overview",
        "content": (
            "Tanish Gupta is a software developer based in Bengaluru, India. "
            "He works on a React and TypeScript monorepo project covering data tables "
            "for AI for ARD, pull requests, unit tests, linting, and pipelines, and conducts "
            "technical interviews for React and TypeScript testing roles covering DOM behavior, "
            "useEffect, test writing, and Node package management."
        ),
    },
    {
        "source_key": "project_enterprise_ui",
        "chunk_index": 0,
        "title": "enterprise-ui Component Library",
        "section": "projects",
        "content": (
            "enterprise-ui is a React, TypeScript, and Vite component library and design system "
            "featuring 40+ headless/building-block components, Storybook documentation, "
            "Tailwind CSS, ESLint, and unit testing, scoped specifically for React."
        ),
    },
    {
        "source_key": "project_ai_chat_bot",
        "chunk_index": 0,
        "title": "ai-chat-bot Architecture",
        "section": "projects",
        "content": (
            "ai-chat-bot is a personal profile and knowledge assistant pairing a React, TypeScript, "
            "and Vite frontend (consuming enterprise-ui) with a FastAPI and PostgreSQL/pgvector "
            "backend designed for lightweight execution on constrained memory budgets."
        ),
    },
    {
        "source_key": "project_roast_battle",
        "chunk_index": 0,
        "title": "1v1 Video Roast Battle Prototype",
        "section": "projects",
        "content": (
            "Built a real-time 1v1 video web platform prototype using FastAPI, Socket.IO, Redis, "
            "WebRTC signaling, and JWT authentication."
        ),
    },
    {
        "source_key": "tech_stack",
        "chunk_index": 0,
        "title": "Core Technical Stack",
        "section": "skills",
        "content": (
            "Primary engineering stack includes React, TypeScript, Vite, Next.js, Tailwind CSS, "
            "Node.js, Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL with pgvector, Docker, "
            "WSL 2, and Git."
        ),
    },
    {
        "source_key": "education_background",
        "chunk_index": 0,
        "title": "Education & Incubation Exposure",
        "section": "education",
        "content": (
            "Studied at Graphic Era University, with pre-incubation and incubation review exposure "
            "at TBI-GEU Inventorium in Dehradun."
        ),
    },
]
