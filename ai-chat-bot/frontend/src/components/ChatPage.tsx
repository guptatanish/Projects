// Phase 2 Main Chat View — Empty-to-docked layout, starter chips, Markdown feed, and Phase 2 error handling

import { useEffect, useRef, useState } from 'react';
import {
  ChatApiError,
  checkBackendHealth,
  sendChatMessage,
} from '../services/chat.service';
import type { ChatMessageItem } from '../types/chat';
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
}

// Formats current local time like "05:20 PM" for each message bubble
function formatCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<ErrorBannerState | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );

  // Holds the active AbortController so clicking "Stop" cancels an in-flight Gemini Flash request
  const abortControllerRef = useRef<AbortController | null>(null);

  const runHealthCheck = async () => {
    setBackendStatus('checking');
    try {
      await checkBackendHealth();
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    void runHealthCheck();
  }, []);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const handleClearChat = () => {
    handleStop();
    setMessages([]);
    setErrorBanner(null);
    setIsRateLimited(false);
  };

  // Sends either typed text or a starter/retry prompt to POST /api/chat
  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt ?? inputText).trim();
    if (!textToSend || isLoading || isRateLimited) return;

    setErrorBanner(null);

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      text: textToSend,
      createdAt: formatCurrentTime(),
    };

    // Append user message right away and clear input only when sending from the text box
    setMessages((prev) => [...prev, userMessage]);
    if (overridePrompt === undefined) {
      setInputText('');
    }
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await sendChatMessage(textToSend, controller.signal);
      setBackendStatus('online');

      const assistantMessage: ChatMessageItem = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        text: response.reply,
        createdAt: formatCurrentTime(),
        mode: response.mode,
        model: response.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      // User intentionally clicked "Stop"
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
        });
      } else {
        setErrorBanner({
          code: 'UNEXPECTED_ERROR',
          message: 'Something unexpected happened while contacting the assistant.',
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const isEmptyChat = messages.length === 0 && !isLoading;

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
    <div className="h-screen w-full flex flex-col bg-white text-slate-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 shrink-0 border-b border-slate-200/80 px-4 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate">
            Personal Profile &amp; Knowledge Assistant
          </h1>

          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
            Phase 2 • Gemini Flash
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void runHealthCheck()}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Health
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0 && !errorBanner && !isLoading && !isRateLimited}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Standardized Error / Quota Notice Banner */}
      {errorBanner && (
        <div
          role="alert"
          className={`shrink-0 border-b px-4 py-2.5 ${
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
                  onClick={() => void handleSend(errorBanner.retryPrompt)}
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

      {/* Empty Welcome State (Centered Composer) vs. Active Chat (Docked Bottom Composer) */}
      {isEmptyChat ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="max-w-xl w-full text-center mb-5">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">
              Ask anything about your profile
            </p>
            <p className="text-sm text-slate-500 mt-1.5">
              Explore your personal Git projects, work experience, tech stack, and education powered by Gemini Flash.
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
    </div>
  );
}