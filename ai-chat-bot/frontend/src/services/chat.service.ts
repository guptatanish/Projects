// Phase 2 Chat Service — Talks to FastAPI Gemini Flash endpoint at http://127.0.0.1:8000/api

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
    // Explicitly ensure RATE_LIMIT_EXCEEDED is never auto-retried or treated as a retryable transient glitch
    if (code === 'RATE_LIMIT_EXCEEDED' || response.status === 429) {
      return new ChatApiError(
        code || 'RATE_LIMIT_EXCEEDED',
        message || 'Rate limit or quota reached. Please wait a bit before sending another request.',
        response.status,
        false
      );
    }
    return new ChatApiError(code, message, response.status);
  }

  // Fallback mapping if an HTTP error status arrives without the standard `{ error }` wrapper
  if (response.status === 429) {
    return new ChatApiError(
      'RATE_LIMIT_EXCEEDED',
      'Rate limit or quota reached. Please wait before trying again.',
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

// Sends a user's message to POST /api/chat and returns the Gemini Flash ChatResponsePayload
export async function sendChatMessage(
  messageText: string,
  signal?: AbortSignal
): Promise<ChatResponsePayload> {
  // Trim leading/trailing spaces before sending so pure spaces are caught cleanly
  const trimmedMessage = messageText.trim();

  if (!trimmedMessage) {
    throw new ChatApiError(
      'VALIDATION_ERROR',
      'message: Message cannot be empty or whitespace only.',
      422,
      false
    );
  }

  const requestBody: ChatRequestPayload = {
    message: trimmedMessage,
  };

  let response: Response;

  try {
    // `fetch` sends a JSON POST request to FastAPI; `credentials: 'include'` keeps cookie support ready
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
      signal,
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

  // Any HTTP status outside 200–299 (like 422, 429, 500, 502, 503, 504) is converted into a ChatApiError
  if (!response.ok) {
    throw buildHttpChatError(response, parsedBody);
  }

  const data = parsedBody as Partial<ChatResponsePayload>;
  if (typeof data?.reply !== 'string') {
    throw new ChatApiError(
      'INVALID_RESPONSE',
      'Backend returned an unexpected response format.',
      response.status,
      false
    );
  }

  return {
    reply: data.reply,
    role: 'assistant',
    mode: typeof data.mode === 'string' ? data.mode : 'gemini_flash',
    model: typeof data.model === 'string' ? data.model : data.model ?? null,
  };
}