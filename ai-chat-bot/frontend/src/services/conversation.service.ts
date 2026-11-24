// Phase 5 Conversation Service — Talks to FastAPI `/api/conversations` with auth cookies, 401/403, PATCH rename & attachments

import type {
  ApiErrorResponse,
  ChatMessageItem,
  ConversationDetail,
  ConversationSummary,
  CreateConversationPayload,
  PersistedMessageItem,
  RenameConversationPayload,
} from '../types/chat';
import { ChatApiError } from './chat.service';

// Base address of your Python FastAPI backend running locally
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Checks if parsed JSON matches `{ error: { code: string, message: string } }`
function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { error?: unknown };
  if (typeof candidate.error !== 'object' || candidate.error === null) return false;
  const err = candidate.error as { code?: unknown; message?: unknown };
  return typeof err.code === 'string' && typeof err.message === 'string';
}

// Converts non-2xx HTTP responses into a consistent `ChatApiError`
async function throwForFailedResponse(response: Response): Promise<never> {
  let parsedBody: unknown = null;
  try {
    parsedBody = await response.json();
  } catch {
    parsedBody = null;
  }

  if (isApiErrorResponse(parsedBody)) {
    throw new ChatApiError(
      parsedBody.error.code,
      parsedBody.error.message,
      response.status,
      false
    );
  }

  if (response.status === 401) {
    throw new ChatApiError(
      'UNAUTHORIZED',
      'Your session has expired or you are not logged in. Please sign in again.',
      401,
      false
    );
  }

  if (response.status === 403) {
    throw new ChatApiError(
      'FORBIDDEN',
      'You do not have permission to access or modify this conversation.',
      403,
      false
    );
  }

  if (response.status === 404) {
    throw new ChatApiError(
      'CONVERSATION_NOT_FOUND',
      'Requested conversation was not found.',
      404,
      false
    );
  }

  throw new ChatApiError(
    'HTTP_ERROR',
    `Request failed with status ${response.status} (${response.statusText || 'Error'}).`,
    response.status,
    false
  );
}

// Formats a backend ISO timestamp string into a readable local time/date label
export function formatMessageTimestamp(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  return parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Converts a persisted PostgreSQL message row (including Phase 4/5 `attachments`) into `ChatMessageItem`
export function mapPersistedMessageToItem(msg: PersistedMessageItem): ChatMessageItem {
  return {
    id: `db-msg-${msg.id}`,
    conversationId: msg.conversation_id,
    role: msg.role,
    text: msg.content,
    createdAt: formatMessageTimestamp(msg.created_at),
    mode: msg.mode ?? (msg.role === 'assistant' ? 'gemini_flash' : undefined),
    model: msg.model,
    attachments: Array.isArray(msg.attachments) ? msg.attachments : undefined,
  };
}

// GET /api/conversations?limit=50 — Fetches conversations scoped to the authenticated user
export async function listConversations(
  limit = 50,
  signal?: AbortSignal
): Promise<ConversationSummary[]> {
  let response: Response;
  try {
    const safeLimit = Math.max(1, Math.min(200, limit));
    response = await fetch(`${API_BASE_URL}/conversations?limit=${safeLimit}`, {
      method: 'GET',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to load conversations from backend at http://127.0.0.1:8000.',
      0,
      true
    );
  }

  if (!response.ok) {
    await throwForFailedResponse(response);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new ChatApiError(
      'INVALID_RESPONSE',
      'Expected a list of conversations from GET /api/conversations.',
      response.status,
      false
    );
  }

  return data as ConversationSummary[];
}

// POST /api/conversations — Creates a new conversation (optionally with a title up to 200 chars)
export async function createConversation(
  title?: string,
  signal?: AbortSignal
): Promise<ConversationSummary> {
  const payload: CreateConversationPayload = {};
  if (title && title.trim().length > 0) {
    payload.title = title.trim().slice(0, 200);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to create a new conversation on the backend.',
      0,
      true
    );
  }

  if (!response.ok) {
    await throwForFailedResponse(response);
  }

  return (await response.json()) as ConversationSummary;
}

// PATCH /api/conversations/{conversation_id} — Updates conversation title (and optional is_pinned)
export async function updateConversation(
  conversationId: number,
  payload: RenameConversationPayload,
  signal?: AbortSignal
): Promise<ConversationSummary> {
  const body: RenameConversationPayload = {};
  if (typeof payload.title === 'string') {
    const trimmed = payload.title.trim();
    if (!trimmed) {
      throw new ChatApiError(
        'VALIDATION_ERROR',
        'title: Conversation title cannot be empty.',
        422,
        false
      );
    }
    body.title = trimmed.slice(0, 200);
  }
  if (typeof payload.is_pinned === 'boolean') {
    body.is_pinned = payload.is_pinned;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to update conversation on the backend.',
      0,
      true
    );
  }

  if (!response.ok) {
    await throwForFailedResponse(response);
  }

  return (await response.json()) as ConversationSummary;
}

export async function renameConversation(
  conversationId: number,
  title: string,
  signal?: AbortSignal
): Promise<ConversationSummary> {
  return updateConversation(conversationId, { title }, signal);
}

// GET /api/conversations/{conversation_id} — Fetches conversation details + persisted messages & attachments
export async function getConversationDetail(
  conversationId: number,
  signal?: AbortSignal
): Promise<ConversationDetail> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'GET',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to load conversation messages from the backend.',
      0,
      true
    );
  }

  if (!response.ok) {
    await throwForFailedResponse(response);
  }

  return (await response.json()) as ConversationDetail;
}

// DELETE /api/conversations/{conversation_id} — Deletes conversation (204 No Content has an empty body)
export async function deleteConversation(
  conversationId: number,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to delete conversation on the backend.',
      0,
      true
    );
  }

  if (!response.ok) {
    await throwForFailedResponse(response);
  }

  // 204 No Content returns an empty body, so we do not call `response.json()` here
}