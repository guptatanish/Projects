// Phase 1 Types — Aligned with FastAPI backend schemas (`app/schemas/chat.py` & `app/core/errors.py`)

// Who sent a message in the chat screen: 'user' (you) or 'assistant' (the chatbot)
export type MessageSenderRole = 'user' | 'assistant';

// What the frontend sends in the JSON body of POST /api/chat
export interface ChatRequestPayload {
  message: string;
}

// What the FastAPI backend returns on a 200 OK response from POST /api/chat
export interface ChatResponsePayload {
  reply: string;
  role: 'assistant';
  mode: string;
  model: string | null;
}

// What the FastAPI backend returns on GET /api/health
export interface HealthCheckResponse {
  status: string;
  service: string;
  environment: string;
  phase: number;
}

// The inner error details returned by FastAPI when something fails (e.g., 422, 404, 500)
export interface ApiErrorDetail {
  code: string;
  message: string;
}

// The outer wrapper around every error response from `app/core/errors.py`
export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

// A single message object stored in React state to draw on screen
export interface ChatMessageItem {
  id: string;
  role: MessageSenderRole;
  text: string;
  createdAt: string;
  mode?: string;
  model?: string | null;
}