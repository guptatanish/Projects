// Phase 3 Types — Aligned with FastAPI backend (`POST /api/chat` & `/api/conversations`)

// Who sent a message in the chat screen: 'user' (you) or 'assistant' (the chatbot)
export type MessageSenderRole = 'user' | 'assistant';

// Known error codes returned by the backend or created on the frontend network layer
export type KnownApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONVERSATION_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AI_UNAVAILABLE'
  | 'AI_TIMEOUT'
  | 'AI_PROVIDER_ERROR'
  | 'AI_EMPTY_RESPONSE'
  | 'AI_CONFIG_MISSING'
  | 'INTERNAL_SERVER_ERROR'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'HTTP_ERROR';

// What the frontend sends in the JSON body of POST /api/chat
export interface ChatRequestPayload {
  message: string;
  conversation_id?: number;
}

// What the FastAPI backend returns on a 200 OK response from POST /api/chat
export interface ChatResponsePayload {
  conversation_id: number;
  message_id: number;
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

// Summary of a saved conversation returned by GET /api/conversations or POST /api/conversations
export interface ConversationSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

// Optional request body when explicitly creating a new conversation via POST /api/conversations
export interface CreateConversationPayload {
  title?: string;
}

// A single message row persisted in PostgreSQL and returned inside GET /api/conversations/{id}
export interface PersistedMessageItem {
  id: number;
  conversation_id: number;
  role: MessageSenderRole;
  content: string;
  mode?: string | null;
  model: string | null;
  created_at: string;
}

// Full conversation object with persisted messages returned by GET /api/conversations/{id}
export interface ConversationDetail extends ConversationSummary {
  messages: PersistedMessageItem[];
}

// The inner error details returned by FastAPI when something fails
export interface ApiErrorDetail {
  code: KnownApiErrorCode | string;
  message: string;
}

// The outer wrapper around every error response from `app/core/errors.py`
export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

// A single message object stored in React state to draw on screen
export interface ChatMessageItem {
  id: string;
  conversationId?: number;
  role: MessageSenderRole;
  text: string;
  createdAt: string;
  mode?: string;
  model?: string | null;
}