// Phase 6 Chat Service — Talks to FastAPI POST /api/chat (JSON text-only), auth cookies & 401/403/429 handling

import type {
  ApiErrorResponse,
  ChatRequestPayload,
  ChatResponsePayload,
  HealthCheckResponse,
} from '../types/chat';

// Base address of your Python FastAPI backend running locally
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Error codes where the user can safely try sending the same message again manually
const RETRYABLE_ERROR_CODES = new Set<string>([
  'AI_UNAVAILABLE',
  'AI_TIMEOUT',
  'NETWORK_ERROR',
]);

// Custom error class with structured error code, HTTP status, and retry guidance for the UI
export class ChatApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly retryable: boolean;

  constructor(code: string, message: string, status = 0, retryable?: boolean) {
    super(message);
    this.name = 'ChatApiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable ?? RETRYABLE_ERROR_CODES.has(code);
  }
}

// Safely checks if a parsed JSON object matches `{ error: { code: string, message: string } }`
function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { error?: unknown };
  if (typeof candidate.error !== 'object' || candidate.error === null) return false;
  const err = candidate.error as { code?: unknown; message?: unknown };
  return typeof err.code === 'string' && typeof err.message === 'string';
}

// Normalizes non-2xx responses into a `ChatApiError` using the backend's `{ error: { code, message } }` contract
function buildHttpChatError(response: Response, parsedBody: unknown): ChatApiError {
  if (isApiErrorResponse(parsedBody)) {
    const { code, message } = parsedBody.error;

    if (code === 'UNAUTHORIZED' || response.status === 401) {
      return new ChatApiError(
        code || 'UNAUTHORIZED',
        message || 'Authentication required. Please log in again.',
        response.status,
        false
      );
    }

    if (code === 'FORBIDDEN' || response.status === 403) {
      return new ChatApiError(
        code || 'FORBIDDEN',
        message || 'You do not have permission to access this conversation.',
        response.status,
        false
      );
    }

    // Never auto-retry rate-limit rejections (429 / AI_RATE_LIMITED / RATE_LIMIT_EXCEEDED)
    if (
      code === 'AI_RATE_LIMITED' ||
      code === 'RATE_LIMIT_EXCEEDED' ||
      response.status === 429
    ) {
      return new ChatApiError(
        code || 'AI_RATE_LIMITED',
        message || 'Rate limit reached. Please wait a moment before sending another request.',
        response.status,
        false
      );
    }

    return new ChatApiError(code, message, response.status);
  }

  // Fallback mapping if an HTTP error status arrives without the standard `{ error }` wrapper
  if (response.status === 401) {
    return new ChatApiError(
      'UNAUTHORIZED',
      'Authentication required. Please sign in to continue.',
      401,
      false
    );
  }

  if (response.status === 403) {
    return new ChatApiError(
      'FORBIDDEN',
      'You do not have access to this conversation.',
      403,
      false
    );
  }

  if (response.status === 404) {
    return new ChatApiError(
      'CONVERSATION_NOT_FOUND',
      'Conversation was not found on the server.',
      404,
      false
    );
  }

  if (response.status === 429) {
    return new ChatApiError(
      'AI_RATE_LIMITED',
      'Rate limit reached. Please wait before sending another request.',
      429,
      false
    );
  }

  if (response.status === 503) {
    return new ChatApiError(
      'AI_UNAVAILABLE',
      'The AI service is temporarily unavailable. You can retry your request.',
      503,
      true
    );
  }

  if (response.status === 504) {
    return new ChatApiError(
      'AI_TIMEOUT',
      'The AI response timed out. You can retry your request.',
      504,
      true
    );
  }

  return new ChatApiError(
    'HTTP_ERROR',
    `Server returned status ${response.status} (${response.statusText || 'Request failed'}).`,
    response.status,
    false
  );
}

// Calls GET /api/health to check if the backend server is reachable
export async function checkBackendHealth(signal?: AbortSignal): Promise<HealthCheckResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Cannot reach the backend server at http://127.0.0.1:8000. Make sure FastAPI is running.',
      0,
      true
    );
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = await response.json();
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    throw buildHttpChatError(response, parsedBody);
  }

  return parsedBody as HealthCheckResponse;
}

export interface SendChatMessageOptions {
  conversationId?: number;
  signal?: AbortSignal;
}

// Sends a text-only JSON message (`{ message, conversation_id? }`) to POST /api/chat
export async function sendChatMessage(
  messageText: string,
  optionsOrConversationId?: SendChatMessageOptions | number,
  legacySignal?: AbortSignal
): Promise<ChatResponsePayload> {
  const options: SendChatMessageOptions =
    typeof optionsOrConversationId === 'number' || optionsOrConversationId === undefined
      ? { conversationId: optionsOrConversationId, signal: legacySignal }
      : optionsOrConversationId;

  const trimmedMessage = messageText.trim();

  if (!trimmedMessage) {
    throw new ChatApiError(
      'VALIDATION_ERROR',
      'message: Message cannot be empty or whitespace only.',
      422,
      false
    );
  }

  const validConversationId =
    typeof options.conversationId === 'number' &&
    Number.isInteger(options.conversationId) &&
    options.conversationId > 0
      ? options.conversationId
      : undefined;

  const requestBody: ChatRequestPayload = {
    message: trimmedMessage,
    ...(validConversationId !== undefined ? { conversation_id: validConversationId } : {}),
  };

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
      signal: options.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to connect to the backend at http://127.0.0.1:8000. Please check if the server is running.',
      0,
      true
    );
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = await response.json();
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    throw buildHttpChatError(response, parsedBody);
  }

  const data = parsedBody as Partial<ChatResponsePayload>;
  if (
    typeof data?.reply !== 'string' ||
    typeof data?.conversation_id !== 'number' ||
    typeof data?.message_id !== 'number'
  ) {
    throw new ChatApiError(
      'INVALID_RESPONSE',
      'Backend returned an unexpected chat response format.',
      response.status,
      false
    );
  }

  return {
    conversation_id: data.conversation_id,
    message_id: data.message_id,
    reply: data.reply,
    role: 'assistant',
    mode: typeof data.mode === 'string' ? data.mode : 'gemini_flash',
    model: typeof data.model === 'string' ? data.model : data.model ?? null,
  };
}