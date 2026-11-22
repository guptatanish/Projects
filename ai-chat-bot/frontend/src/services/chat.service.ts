// Phase 1 Chat Service — Talks to FastAPI at http://127.0.0.1:8000/api

import type {
  ApiErrorResponse,
  ChatRequestPayload,
  ChatResponsePayload,
  HealthCheckResponse,
} from '../types/chat';

// Base address of your Python FastAPI backend running locally
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Custom error class so UI components can read both `code` (e.g. "VALIDATION_ERROR") and `message`
export class ChatApiError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(code: string, message: string, status = 0) {
    super(message);
    this.name = 'ChatApiError';
    this.code = code;
    this.status = status;
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
      0
    );
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = await response.json();
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    if (isApiErrorResponse(parsedBody)) {
      throw new ChatApiError(parsedBody.error.code, parsedBody.error.message, response.status);
    }
    throw new ChatApiError(
      'HTTP_ERROR',
      `Health check failed with status ${response.status}.`,
      response.status
    );
  }

  return parsedBody as HealthCheckResponse;
}

// Sends a user's message to POST /api/chat and returns the backend's ChatResponsePayload
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
      422
    );
  }

  const requestBody: ChatRequestPayload = {
    message: trimmedMessage,
  };

  let response: Response;

  try {
    // `fetch` is the browser's built-in function to send HTTP requests to another URL
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // `credentials: 'include'` ensures cookies work smoothly now and in Phase 4 auth
      credentials: 'include',
      // `JSON.stringify` converts the JS object `{ message: "..." }` into JSON text for HTTP
      body: JSON.stringify(requestBody),
      // `signal` lets the user cancel/stop an in-flight request if needed
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to connect to the backend at http://127.0.0.1:8000. Please check if the server is running.',
      0
    );
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = await response.json();
  } catch {
    parsedBody = null;
  }

  // Any HTTP status outside 200–299 (like 422, 404, 405, 500) is treated as an error
  if (!response.ok) {
    if (isApiErrorResponse(parsedBody)) {
      throw new ChatApiError(parsedBody.error.code, parsedBody.error.message, response.status);
    }

    throw new ChatApiError(
      'HTTP_ERROR',
      `Server returned status ${response.status} (${response.statusText || 'Request failed'}).`,
      response.status
    );
  }

  const data = parsedBody as Partial<ChatResponsePayload>;
  if (typeof data?.reply !== 'string') {
    throw new ChatApiError(
      'INVALID_RESPONSE',
      'Backend returned an unexpected response format.',
      response.status
    );
  }

  return {
    reply: data.reply,
    role: 'assistant',
    mode: typeof data.mode === 'string' ? data.mode : 'mock',
    model: data.model ?? null,
  };
}