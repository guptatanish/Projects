// Phase 5 Auth Service — Cookie-based authentication against FastAPI `/api/auth/*` (`HttpOnly` cookie `ai_chat_bot_session`)

import type {
  ApiErrorResponse,
  AuthSessionResponse,
  AuthUser,
  LoginPayload,
  LogoutResponse,
  RegisterPayload,
} from '../types/chat';
import { ChatApiError } from './chat.service';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { error?: unknown };
  if (typeof candidate.error !== 'object' || candidate.error === null) return false;
  const err = candidate.error as { code?: unknown; message?: unknown };
  return typeof err.code === 'string' && typeof err.message === 'string';
}

// Extracts an `AuthUser` from AuthSessionResponse (`{ authenticated: true, user: { ... } }`)
function extractAuthUser(parsedBody: unknown, status: number): AuthUser {
  if (typeof parsedBody === 'object' && parsedBody !== null) {
    const session = parsedBody as Partial<AuthSessionResponse> & Partial<AuthUser>;
    if (
      session.user &&
      typeof session.user === 'object' &&
      typeof session.user.email === 'string' &&
      typeof session.user.full_name === 'string'
    ) {
      if (session.authenticated === false) {
        throw new ChatApiError(
          'UNAUTHORIZED',
          'Session is not authenticated.',
          401,
          false
        );
      }
      return session.user;
    }
    if (typeof session.email === 'string' && typeof session.full_name === 'string') {
      return session as AuthUser;
    }
  }

  throw new ChatApiError(
    'INVALID_RESPONSE',
    'Backend returned an unexpected authentication session payload.',
    status,
    false
  );
}

async function throwAuthHttpError(response: Response): Promise<never> {
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
      'Authentication required. Please log in to continue.',
      401,
      false
    );
  }

  if (response.status === 403) {
    throw new ChatApiError(
      'FORBIDDEN',
      'You do not have permission to perform this action.',
      403,
      false
    );
  }

  throw new ChatApiError(
    'HTTP_ERROR',
    `Authentication request failed with status ${response.status} (${response.statusText || 'Error'}).`,
    response.status,
    false
  );
}

// GET /api/auth/me — Checks if an active HttpOnly session cookie (`ai_chat_bot_session`) exists
export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to reach authentication service at http://127.0.0.1:8000.',
      0,
      true
    );
  }

  // 401 UNAUTHORIZED simply means no active logged-in session yet
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    await throwAuthHttpError(response);
  }

  const parsedBody = (await response.json()) as unknown;
  return extractAuthUser(parsedBody, response.status);
}

// POST /api/auth/register — Sends { email, full_name, password } and receives HttpOnly session cookie
export async function registerUser(
  payload: RegisterPayload,
  signal?: AbortSignal
): Promise<AuthUser> {
  const cleanEmail = payload.email.trim();
  const cleanFullName = payload.full_name.trim();

  if (!cleanFullName || cleanFullName.length > 120) {
    throw new ChatApiError(
      'VALIDATION_ERROR',
      'full_name: Full name is required (1–120 characters).',
      422,
      false
    );
  }

  const requestBody: RegisterPayload = {
    email: cleanEmail,
    full_name: cleanFullName,
    password: payload.password,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to connect to http://127.0.0.1:8000 while registering.',
      0,
      true
    );
  }

  if (!response.ok) {
    await throwAuthHttpError(response);
  }

  const parsedBody = (await response.json()) as unknown;
  return extractAuthUser(parsedBody, response.status);
}

// POST /api/auth/login — Authenticates user and sets the HttpOnly `ai_chat_bot_session` cookie
export async function loginUser(
  payload: LoginPayload,
  signal?: AbortSignal
): Promise<AuthUser> {
  const requestBody: LoginPayload = {
    email: payload.email.trim(),
    password: payload.password,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to connect to http://127.0.0.1:8000 while logging in.',
      0,
      true
    );
  }

  if (!response.ok) {
    await throwAuthHttpError(response);
  }

  const parsedBody = (await response.json()) as unknown;
  return extractAuthUser(parsedBody, response.status);
}

// POST /api/auth/logout — Clears the HttpOnly session cookie on the backend
export async function logoutUser(signal?: AbortSignal): Promise<LogoutResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ChatApiError(
      'NETWORK_ERROR',
      'Unable to connect to http://127.0.0.1:8000 while logging out.',
      0,
      true
    );
  }

  if (!response.ok && response.status !== 401) {
    await throwAuthHttpError(response);
  }

  if (response.status === 204 || response.status === 401) {
    return { authenticated: false, message: 'Logged out' };
  }

  try {
    return (await response.json()) as LogoutResponse;
  } catch {
    return { authenticated: false, message: 'Logged out' };
  }
}