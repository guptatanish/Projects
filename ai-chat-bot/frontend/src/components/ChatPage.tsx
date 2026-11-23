// Phase 3 Main Chat View — PostgreSQL-backed multi-conversation history, multi-turn chat, and error handling

import { useCallback, useEffect, useRef, useState } from 'react';
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
} from '../services/conversation.service';
import type { ChatMessageItem, ConversationSummary } from '../types/chat';
import { ConversationSidebar } from './ConversationSidebar';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';

const STARTER_PROMPTS = [
  'Tell me about my personal Git projects and tech stack',
  'Summarize my work experience and engineering practices',
  'Share my education and key technical milestones',
];

interface ErrorBannerState {
  code: string;
  message: string;
  retryPrompt?: string;
  retryConversationId?: number | null;
}

// Formats current local time like "02:40 AM" for newly sent/received messages
function formatCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<ErrorBannerState | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );

  // Active AbortController used to cancel an in-flight POST /api/chat request when "Stop" is clicked
  const abortControllerRef = useRef<AbortController | null>(null);

  const runHealthCheck = useCallback(async () => {
    setBackendStatus('checking');
    try {
      await checkBackendHealth();
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }
  }, []);

  // Refreshes the sidebar conversation list from GET /api/conversations
  const refreshConversationList = useCallback(async () => {
    const items = await listConversations(50);
    setConversations(items);
    return items;
  }, []);

  // Loads persisted messages for a specific conversation via GET /api/conversations/{id}
  const loadConversationThread = useCallback(async (conversationId: number) => {
    setIsLoadingMessages(true);
    setErrorBanner(null);
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
        setErrorBanner({
          code: error.code,
          message: error.message,
        });
      } else {
        setErrorBanner({
          code: 'UNEXPECTED_ERROR',
          message: 'Could not load conversation messages.',
        });
      }
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // On initial mount: check health and load existing PostgreSQL conversations
  useEffect(() => {
    void runHealthCheck();

    let cancelled = false;
    (async () => {
      setIsLoadingList(true);
      try {
        const list = await listConversations(50);
        if (cancelled) return;
        setConversations(list);
        setBackendStatus('online');

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
      } catch (error: unknown) {
        if (cancelled) return;
        if (error instanceof ChatApiError && error.code === 'NETWORK_ERROR') {
          setBackendStatus('offline');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingList(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [runHealthCheck]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  // Starts a clean new chat thread (unselected ID until first message is sent or created)
  const handleNewChat = () => {
    handleStop();
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
    setErrorBanner(null);
    setIsRateLimited(false);
  };

  // Optional explicit thread creation via POST /api/conversations
  const handleCreateExplicitConversation = async () => {
    handleStop();
    setErrorBanner(null);
    try {
      const created = await createConversation('New Chat');
      await refreshConversationList();
      setActiveConversationId(created.id);
      setMessages([]);
      setBackendStatus('online');
    } catch (error: unknown) {
      if (error instanceof ChatApiError) {
        setErrorBanner({ code: error.code, message: error.message });
      }
    }
  };

  // Switches to another saved conversation in PostgreSQL
  const handleSelectConversation = (conversationId: number) => {
    if (conversationId === activeConversationId && messages.length > 0) return;
    handleStop();
    void loadConversationThread(conversationId);
  };

  // Deletes a conversation via DELETE /api/conversations/{id} (204 No Content)
  const handleDeleteConversation = async (conversationId: number) => {
    if (deletingId !== null) return;
    setDeletingId(conversationId);
    setErrorBanner(null);

    try {
      await deleteConversation(conversationId);
      const updatedList = await refreshConversationList();

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
        setErrorBanner({
          code: error.code,
          message: error.message,
        });
      } else {
        setErrorBanner({
          code: 'UNEXPECTED_ERROR',
          message: 'Failed to delete conversation.',
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Sends message to POST /api/chat passing `conversationId` when continuing a thread
  const handleSend = async (
    overridePrompt?: string,
    targetConversationId?: number | null
  ) => {
    const textToSend = (overridePrompt ?? inputText).trim();
    if (!textToSend || isLoading || isRateLimited) return;

    const conversationIdToUse =
      targetConversationId !== undefined ? targetConversationId : activeConversationId;

    setErrorBanner(null);

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, conversationId: conversationIdToUse ?? undefined, role: 'user', text: textToSend, createdAt: formatCurrentTime(), };  setMessages((prev) => [...prev, userMessage]); if (overridePrompt === undefined) { setInputText(''); } setIsLoading(true);  const controller = new AbortController(); abortControllerRef.current = controller;  try { const response = await sendChatMessage( textToSend, conversationIdToUse ?? undefined, controller.signal );  setBackendStatus('online'); setActiveConversationId(response.conversation_id);  const assistantMessage: ChatMessageItem = { id: `msg-${response.message_id}`,
        conversationId: response.conversation_id,
        role: 'assistant',
        text: response.reply,
        createdAt: formatCurrentTime(),
        mode: response.mode,
        model: response.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh sidebar list so titles and `updated_at` timestamps reflect PostgreSQL
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

        if (error.code === 'RATE_LIMIT_EXCEEDED' || error.status === 429) {
          setIsRateLimited(true);
          setErrorBanner({
            code: error.code || 'RATE_LIMIT_EXCEEDED',
            message: error.message,
          });
          return;
        }

        setErrorBanner({
          code: error.code,
          message: error.message,
          retryPrompt: error.retryable ? textToSend : undefined,
          retryConversationId: error.retryable ? conversationIdToUse : null,
        });
      } else {
        setErrorBanner({
          code: 'UNEXPECTED_ERROR',
          message: 'Something unexpected happened while sending your message.',
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const isEmptyChat = messages.length === 0 && !isLoading && !isLoadingMessages;

  const composer = (
    <MessageInput
      value={inputText}
      onChange={setInputText}
      onSend={(promptOverride) => void handleSend(promptOverride)}
      onStop={handleStop}
      isLoading={isLoading}
      isRateLimited={isRateLimited}
      isEmptyState={isEmptyChat}
      starterPrompts={STARTER_PROMPTS}
    />
  );

  return (
    <div className="h-screen w-full flex bg-white text-slate-900 overflow-hidden">
      {/* Persisted Conversation Sidebar */}
      {sidebarOpen && (
        <ConversationSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          isLoadingList={isLoadingList}
          deletingId={deletingId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={(id) => void handleDeleteConversation(id)}
          onCollapse={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-white">
        {/* Top Bar */}
        <header className="h-14 shrink-0 border-b border-slate-200/80 px-4 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Chats
              </button>
            )}

            <h1 className="text-sm font-semibold text-slate-900 truncate">
              {activeConversation?.title || 'Personal Profile & Knowledge Assistant'}
            </h1>

            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800">
              Phase 3 • PostgreSQL Memory
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${ backendStatus === 'online' ? 'bg-emerald-100 text-emerald-800' : backendStatus === 'offline' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700' }`} > {backendStatus} </span> </div>  <div className="flex items-center gap-2 shrink-0"> <button type="button" onClick={() => void handleCreateExplicitConversation()} className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" > New Thread </button>  <button type="button" onClick={() => void runHealthCheck()} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" > Health </button>  <button type="button" onClick={handleNewChat} disabled={messages.length === 0 && !errorBanner && !isLoading && activeConversationId === null} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer" > Clear View </button> </div> </header>  {/* Error / Rate-Limit Banner */} {errorBanner && ( <div role="alert" className={`shrink-0 border-b px-4 py-2.5 ${
              errorBanner.code === 'RATE_LIMIT_EXCEEDED'
                ? 'border-amber-200 bg-amber-50'
                : 'border-rose-200 bg-rose-50'
            }`}
          >
            <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
              <div
                className={
                  errorBanner.code === 'RATE_LIMIT_EXCEEDED'
                    ? 'text-amber-950'
                    : 'text-rose-900'
                }
              >
                <span className="font-semibold mr-1.5">[{errorBanner.code}]</span>
                <span>{errorBanner.message}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {errorBanner.retryPrompt && !isRateLimited && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleSend(
                        errorBanner.retryPrompt,
                        errorBanner.retryConversationId
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
                    setErrorBanner(null);
                    if (errorBanner.code === 'RATE_LIMIT_EXCEEDED') {
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

        {/* Thread Loading vs. Empty Welcome State vs. Active Message Feed */}
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
                Multi-turn conversations are persisted in PostgreSQL with Gemini Flash context.
              </p>
            </div>

            {composer}
          </div>
        ) : (
          <>
            <MessageList messages={messages} isLoading={isLoading} />

            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
              {composer}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Re-export timestamp helper for convenience if needed elsewhere
export { formatMessageTimestamp };