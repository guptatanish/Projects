// Phase 5 Types — Aligned with FastAPI backend (`/api/auth/*`, `/api/conversations`, `POST /api/chat` JSON & FormData)

// Who sent a message in the chat screen: 'user' (you) or 'assistant' (the chatbot)
export type MessageSenderRole = 'user' | 'assistant';

// Supported image MIME types accepted by backend Phase 5 (JPEG, PNG, WebP)
export type SupportedImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

// Scope/topic filter options for personal profile knowledge exploration
export type ProfileScopeFilter = 'all' | 'git' | 'work' | 'stack' | 'education';

// User feedback rating on an assistant response
export type MessageRating = 'up' | 'down' | null;

// Known error codes returned by the backend or created on the frontend network layer
export type KnownApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'CONVERSATION_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'AI_RATE_LIMITED'
  | 'ATTACHMENT_TOO_LARGE'
  | 'INVALID_ATTACHMENT'
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

// Authenticated user profile inside AuthSessionResponse (`user` object)
export interface AuthUser {
  id: number | string;
  email: string;
  full_name: string;
  created_at?: string;
  updated_at?: string;
}

// Session response envelope returned by GET /api/auth/me, POST /api/auth/login, POST /api/auth/register
export interface AuthSessionResponse {
  authenticated: boolean;
  user: AuthUser;
}

// Payload for POST /api/auth/login
export interface LoginPayload {
  email: string;
  password: string;
}

// Payload for POST /api/auth/register (`full_name` required, 1-120 chars; `password` min 8 chars)
export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
}

// Response shape for POST /api/auth/logout
export interface LogoutResponse {
  authenticated?: boolean;
  detail?: string;
  message?: string;
}

// Image attachment state held in the UI composer before sending (supports File for FormData + base64 fallback)
export interface PendingImageAttachment {
  file?: File | null;
  fileName: string;
  mimeType: SupportedImageMimeType;
  fileSize: number; // Original file byte size
  base64: string; // Base64 string (without data: URL prefix)
  previewUrl: string; // Data URL or object URL for thumbnail preview
}

// Persisted attachment metadata returned inside MessageResponse (`GET /api/conversations/{id}`)
export interface AttachmentMetadata {
  id: number;
  message_id: number;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

// What the frontend sends in the JSON body of POST /api/chat
export interface ChatRequestPayload {
  message: string;
  conversation_id?: number;
  image_base64?: string;
  image_mime_type?: SupportedImageMimeType;
  image_file_name?: string;
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
  is_pinned?: boolean;
}

// Optional request body when explicitly creating a new conversation via POST /api/conversations
export interface CreateConversationPayload {
  title?: string;
}

// Request body for PATCH /api/conversations/{conversation_id}
export interface RenameConversationPayload {
  title?: string;
  is_pinned?: boolean;
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
  attachments?: AttachmentMetadata[];
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
  attachments?: AttachmentMetadata[];
  rating?: MessageRating;
}