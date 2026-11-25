// Phase 6 Main Chat View — Text-only chat, auth cookies, 401/403 ownership handling, PATCH rename, Banner & Toast

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/auth.service';
import {
  ChatApiError,
  checkBackendHealth,
  sendChatMessage,
} from '../services/chat.service';
import {
  createConversation,
  deleteConversation,
  formatMessageTimestamp,
  getConversationDetail,
  listConversations,
  mapPersistedMessageToItem,
  renameConversation,
} from '../services/conversation.service';
import type {
  AuthUser,
  ChatMessageItem,
  ConversationSummary,
  MessageRating,
} from '../types/chat';
import { ConversationSidebar } from './ConversationSidebar';
import { MessageInput, type ComposerPreferences } from './MessageInput';
import { MessageList } from './MessageList';

const STARTER_PROMPTS = [
  'Tell me about my personal Git projects and tech stack',
  'Summarize my work experience and engineering practices',
  'Share my education and key technical milestones',
];

const DEFAULT_PREFERENCES: ComposerPreferences = {
  scope: 'all',
  responseStyle: 'detailed',
  includeCitations: true,
  strictProfileOnly: false,
  detailLevel: 3,
  focusDate: new Date().toISOString().slice(0, 10),
};

interface BannerAlertState {
  code: string;
  message: string;
  severity: 'rate-limit' | 'error' | 'info';
  retryPrompt?: string;
  retryConversationId?: number | null;
}

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'warning' | 'error';
}

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isRateLimitError(code: string, status?: number): boolean {
  return (
    code === 'AI_RATE_LIMITED' ||
    code === 'RATE_LIMIT_EXCEEDED' ||
    status === 429
  );
}

export function ChatPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authFullName, setAuthFullName] = useState<string>('');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [preferences, setPreferences] = useState<ComposerPreferences>(DEFAULT_PREFERENCES);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [bannerAlert, setBannerAlert] = useState<BannerAlertState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, tone: ToastState['tone'] = 'success') => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      const nextId = Date.now();
      setToast({ id: nextId, message, tone });
      toastTimerRef.current = window.setTimeout(() => {
        setToast((prev) => (prev?.id === nextId ? null : prev));
      }, 2800);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleUnauthorizedSession = useCallback(
    (reason?: string) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setCurrentUser(null);
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setAuthError(reason || 'Session expired or unauthorized. Please log in again.');
      setBannerAlert({
        code: 'UNAUTHORIZED',
        message: reason || 'Please sign in to access your private conversations.',
        severity: 'error',
      });
    },
    []
  );

  const runHealthCheck = useCallback(async () => {
    setBackendStatus('checking');
    try {
      await checkBackendHealth();
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }
  }, []);

  const refreshConversationList = useCallback(async () => {
    const items = await listConversations(50);
    setConversations(items);
    return items;
  }, []);

  const loadConversationThread = useCallback(
    async (conversationId: number) => {
      setIsLoadingMessages(true);
      setBannerAlert(null);
      try {
        const detail = await getConversationDetail(conversationId);
        setActiveConversationId(detail.id);
        setMessages(detail.messages.map(mapPersistedMessageToItem));
        setBackendStatus('online');
      } catch (error: unknown) {
        if (error instanceof ChatApiError) {
          if (error.code === 'NETWORK_ERROR') {
            setBackendStatus('offline');
          }
          if (error.code === 'UNAUTHORIZED' || error.status === 401) {
            handleUnauthorizedSession(error.message);
            return;
          }
          setBannerAlert({
            code: error.code,
            message: error.message,
            severity: 'error',
          });
        } else {
          setBannerAlert({
            code: 'UNEXPECTED_ERROR',
            message: 'Could not load conversation messages.',
            severity: 'error',
          });
        }
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [handleUnauthorizedSession]
  );

  // Initial boot: check backend health + verify active session cookie via GET /api/auth/me
  useEffect(() => {
    void runHealthCheck();

    let cancelled = false;
    (async () => {
      setIsCheckingAuth(true);
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        setCurrentUser(user);
        setBackendStatus('online');

        if (user) {
          setIsLoadingList(true);
          try {
            const list = await listConversations(50);
            if (cancelled) return;
            setConversations(list);

            if (list.length > 0) {
              const firstId = list[0].id;
              setActiveConversationId(firstId);
              setIsLoadingMessages(true);
              try {
                const detail = await getConversationDetail(firstId);
                if (!cancelled) {
                  setMessages(detail.messages.map(mapPersistedMessageToItem));
                }
              } finally {
                if (!cancelled) {
                  setIsLoadingMessages(false);
                }
              }
            }
          } finally {
            if (!cancelled) {
              setIsLoadingList(false);
            }
          }
        }
      } catch (error: unknown) {
        if (cancelled) return;
        if (error instanceof ChatApiError && error.code === 'NETWORK_ERROR') {
          setBackendStatus('offline');
        }
      } finally {
        if (!cancelled) {
          setIsCheckingAuth(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runHealthCheck]);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    try {
      const user =
        authMode === 'login'
          ? await loginUser({ email: authEmail, password: authPassword })
          : await registerUser({
              email: authEmail,
              full_name: authFullName,
              password: authPassword,
            });

      setCurrentUser(user);
      setAuthPassword('');
      setBannerAlert(null);
      setBackendStatus('online');
      showToast(
        authMode === 'login'
          ? `Signed in as ${user.full_name || user.email}`
          : `Account created for ${user.full_name || user.email}`,
        'success'
      );

      setIsLoadingList(true);
      try {
        const list = await listConversations(50);
        setConversations(list);
        if (list.length > 0) {
          await loadConversationThread(list[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      } finally {
        setIsLoadingList(false);
      }
    } catch (error: unknown) {
      if (error instanceof ChatApiError) {
        setAuthError(error.message);
      } else {
        setAuthError('Authentication failed. Please check your credentials and try again.');
      }
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Proceed with clearing local session state even if network call fails
    }
    handleUnauthorizedSession('You have been logged out.');
    showToast('Signed out', 'success');
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const handleNewChat = () => {
    handleStop();
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
    setBannerAlert(null);
    setIsRateLimited(false);
    setMobileDrawerOpen(false);
  };

  const handleCreateExplicitConversation = async () => {
    handleStop();
    setBannerAlert(null);
    try {
      const created = await createConversation('New Chat');
      await refreshConversationList();
      setActiveConversationId(created.id);
      setMessages([]);
      setBackendStatus('online');
      showToast('Created new conversation thread', 'success');
    } catch (error: unknown) {
      if (error instanceof ChatApiError) {
        if (error.code === 'UNAUTHORIZED' || error.status === 401) {
          handleUnauthorizedSession(error.message);
          return;
        }
        setBannerAlert({
          code: error.code,
          message: error.message,
          severity: 'error',
        });
      }
    }
  };

  const handleSelectConversation = (conversationId: number) => {
    setMobileDrawerOpen(false);
    if (conversationId === activeConversationId && messages.length > 0) return;
    handleStop();
    void loadConversationThread(conversationId);
  };

  const handleRenameConversation = async (conversationId: number, nextTitle: string) => {
    if (renamingId !== null) return;
    setRenamingId(conversationId);
    setBannerAlert(null);

    try {
      await renameConversation(conversationId, nextTitle);
      await refreshConversationList();
      showToast('Conversation renamed', 'success');
    } catch (error: unknown) {
      if (error instanceof ChatApiError) {
        if (error.code === 'UNAUTHORIZED' || error.status === 401) {
          handleUnauthorizedSession(error.message);
          return;
        }
        setBannerAlert({
          code: error.code,
          message: error.message,
          severity: 'error',
        });
        showToast(error.message, 'error');
      }
    } finally {
      setRenamingId(null);
    }
  };

  const handleTogglePinConversation = (conversationId: number) => {
    setPinnedIds((prev) => {
      const exists = prev.includes(conversationId);
      const next = exists
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId];
      showToast(exists ? 'Conversation unpinned' : 'Conversation pinned to top', 'success');
      return next;
    });
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (deletingId !== null) return;
    setDeletingId(conversationId);
    setBannerAlert(null);

    try {
      await deleteConversation(conversationId);
      setPinnedIds((prev) => prev.filter((id) => id !== conversationId));
      const updatedList = await refreshConversationList();
      showToast('Conversation deleted', 'success');

      if (activeConversationId === conversationId) {
        if (updatedList.length > 0) {
          const nextId = updatedList[0].id;
          await loadConversationThread(nextId);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (error: unknown) {
      if (error instanceof ChatApiError) {
        if (error.code === 'NETWORK_ERROR') {
          setBackendStatus('offline');
        }
        if (error.code === 'UNAUTHORIZED' || error.status === 401) {
          handleUnauthorizedSession(error.message);
          return;
        }
        setBannerAlert({
          code: error.code,
          message: error.message,
          severity: 'error',
        });
        showToast(error.message, 'error');
      } else {
        setBannerAlert({
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to delete conversation.',
          severity: 'error',
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRateMessage = (messageId: string, rating: MessageRating) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, rating } : m))
    );
    if (rating) {
      showToast(
        rating === 'up' ? 'Marked response as helpful' : 'Marked response as needs work',
        'success'
      );
    }
  };

  const composePromptWithPreferences = (rawText: string): string => {
    const parts: string[] = [];
    if (preferences.scope !== 'all') {
      parts.push(`[Scope: ${preferences.scope.toUpperCase()}]`);
    }
    if (preferences.responseStyle !== 'detailed' || preferences.detailLevel !== 3) {
      parts.push(`[Style: ${preferences.responseStyle}, Depth: ${preferences.detailLevel}/5]`);
    }
    if (preferences.strictProfileOnly) {
      parts.push('[Strict Profile Grounding: true]');
    }
    if (!parts.length) return rawText;
    return `${parts.join(' ')}\n${rawText}`;
  };

  // Sends text-only JSON message to POST /api/chat
  const handleSend = async (
    overridePrompt?: string,
    targetConversationId?: number | null
  ) => {
    const rawTextToSend = (overridePrompt ?? inputText).trim();
    if (!rawTextToSend || isLoading || isRateLimited) return;

    const textToSend =
      overridePrompt === undefined ? composePromptWithPreferences(rawTextToSend) : rawTextToSend;
    const conversationIdToUse =
      targetConversationId !== undefined ? targetConversationId : activeConversationId;

    setBannerAlert(null);

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversationId: conversationIdToUse ?? undefined,
      role: 'user',
      text: rawTextToSend,
      createdAt: formatCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (overridePrompt === undefined) {
      setInputText('');
    }
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await sendChatMessage(textToSend, {
        conversationId: conversationIdToUse ?? undefined,
        signal: controller.signal,
      });

      setBackendStatus('online');
      setActiveConversationId(response.conversation_id);

      const assistantMessage: ChatMessageItem = {
        id: `msg-${response.message_id}`,
        conversationId: response.conversation_id,
        role: 'assistant',
        text: response.reply,
        createdAt: formatCurrentTime(),
        mode: response.mode,
        model: response.model,
        rating: null,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        await refreshConversationList();
      } catch {
        // Non-fatal if sidebar refresh briefly misses
      }
    } catch (error: unknown) {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      if (error instanceof ChatApiError) {
        if (error.code === 'NETWORK_ERROR') {
          setBackendStatus('offline');
        }

        if (error.code === 'UNAUTHORIZED' || error.status === 401) {
          handleUnauthorizedSession(error.message);
          return;
        }

        if (isRateLimitError(error.code, error.status)) {
          setIsRateLimited(true);
          setBannerAlert({
            code: error.code || 'AI_RATE_LIMITED',
            message: error.message,
            severity: 'rate-limit',
          });
          showToast('Rate limit reached (429 AI_RATE_LIMITED)', 'warning');
          return;
        }

        setBannerAlert({
          code: error.code,
          message: error.message,
          severity: 'error',
          retryPrompt: error.retryable ? rawTextToSend : undefined,
          retryConversationId: error.retryable ? conversationIdToUse : null,
        });
        showToast(error.message, 'error');
      } else {
        setBannerAlert({
          code: 'UNEXPECTED_ERROR',
          message: 'Something unexpected happened while sending your message.',
          severity: 'error',
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const decoratedConversations: ConversationSummary[] = conversations.map((conv) => ({
    ...conv,
    is_pinned: pinnedIds.includes(conv.id) || Boolean(conv.is_pinned),
  }));

  const activeConversation = decoratedConversations.find(
    (c) => c.id === activeConversationId
  );
  const isEmptyChat = messages.length === 0 && !isLoading && !isLoadingMessages;

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-600 text-xs">
        Verifying session cookie...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
                Phase 6 • Cookie Auth
              </span>
              <h1 className="text-lg font-semibold text-slate-900 mt-2">
                {authMode === 'login' ? 'Sign in to your workspace' : 'Create your account'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Sessions are stored in an <code className="font-mono">HttpOnly</code> cookie (
                <code className="font-mono">ai_chat_bot_session</code>).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1 mb-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
              }}
              className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900"
            >
              {authError}
            </div>
          )}

          <form onSubmit={(e) => void handleAuthSubmit(e)} className="space-y-3.5 text-xs">
            {authMode === 'register' && (
              <label className="flex flex-col gap-1">
                <span className="font-medium text-slate-700">Full Name</span>
                <input
                  type="text"
                  required
                  minLength={1}
                  maxLength={120}
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  placeholder="Tanish Gupta"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-medium text-slate-700">Password</span>
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmittingAuth
                ? authMode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : authMode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const composer = (
    <MessageInput
      value={inputText}
      onChange={setInputText}
      onSend={(promptOverride) => void handleSend(promptOverride)}
      onStop={handleStop}
      preferences={preferences}
      onChangePreferences={setPreferences}
      isLoading={isLoading}
      isRateLimited={isRateLimited}
      isEmptyState={isEmptyChat}
      starterPrompts={STARTER_PROMPTS}
    />
  );

  return (
    <div className="h-screen w-full flex bg-white text-slate-900 overflow-hidden relative">
      {sidebarOpen && (
        <div className="hidden md:block h-full">
          <ConversationSidebar
            conversations={decoratedConversations}
            activeConversationId={activeConversationId}
            isLoadingList={isLoadingList}
            deletingId={deletingId}
            renamingId={renamingId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onRenameConversation={handleRenameConversation}
            onTogglePinConversation={handleTogglePinConversation}
            onDeleteConversation={(id) => void handleDeleteConversation(id)}
            onCollapse={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {mobileDrawerOpen && (
        <ConversationSidebar
          conversations={decoratedConversations}
          activeConversationId={activeConversationId}
          isLoadingList={isLoadingList}
          deletingId={deletingId}
          renamingId={renamingId}
          isMobileDrawer
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onTogglePinConversation={handleTogglePinConversation}
          onDeleteConversation={(id) => void handleDeleteConversation(id)}
          onCollapse={() => setMobileDrawerOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 h-full bg-white">
        <header className="h-14 shrink-0 border-b border-slate-200/80 px-4 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Menu
            </button>

            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="hidden md:inline-flex px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Chats
              </button>
            )}

            <h1 className="text-sm font-semibold text-slate-900 truncate">
              {activeConversation?.title || 'Personal Profile & Knowledge Assistant'}
            </h1>

            <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
              Phase 6 • Text-Only &amp; pgvector
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                backendStatus === 'online'
                  ? 'bg-emerald-100 text-emerald-800'
                  : backendStatus === 'offline'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
              }`}
            >
              {backendStatus}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-[11px] text-slate-500 max-w-40 truncate">
              {currentUser.full_name || currentUser.email}
            </span>

            <button
              type="button"
              onClick={() => void handleCreateExplicitConversation()}
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              New Thread
            </button>

            <button
              type="button"
              onClick={() => void runHealthCheck()}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Health
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {bannerAlert && (
          <div
            role="alert"
            className={`shrink-0 border-b px-4 py-2.5 ${
              bannerAlert.severity === 'rate-limit'
                ? 'border-amber-200 bg-amber-50'
                : 'border-rose-200 bg-rose-50'
            }`}
          >
            <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
              <div
                className={
                  bannerAlert.severity === 'rate-limit'
                    ? 'text-amber-950'
                    : 'text-rose-900'
                }
              >
                <span className="font-semibold mr-1.5">[{bannerAlert.code}]</span>
                <span>{bannerAlert.message}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {bannerAlert.retryPrompt && !isRateLimited && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleSend(
                        bannerAlert.retryPrompt,
                        bannerAlert.retryConversationId
                      )
                    }
                    className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 cursor-pointer"
                  >
                    Retry
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setBannerAlert(null);
                    if (isRateLimitError(bannerAlert.code)) {
                      setIsRateLimited(false);
                    }
                  }}
                  className="font-medium underline opacity-80 hover:opacity-100 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center px-4 text-xs text-slate-500">
            Loading persisted conversation...
          </div>
        ) : isEmptyChat ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <div className="max-w-xl w-full text-center mb-5">
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                Ask anything about your profile
              </p>
              <p className="text-sm text-slate-500 mt-1.5">
                Cookie-authenticated threads and PostgreSQL history powered by Gemini Flash.
              </p>
            </div>

            {composer}
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              isLoading={isLoading}
              onRateMessage={handleRateMessage}
              onCopySuccess={(label) => showToast(label, 'success')}
            />

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
              {composer}
            </div>
          </>
        )}

        {toast && (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 rounded-xl border border-slate-800 bg-slate-900 text-white px-4 py-2.5 text-xs font-medium shadow-lg"
          >
            {toast.message}
          </div>
        )}
      </main>
    </div>
  );
}

// Re-export timestamp helper for convenience if needed elsewhere
export { formatMessageTimestamp };