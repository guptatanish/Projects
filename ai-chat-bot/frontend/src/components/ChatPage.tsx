// Phase 1 Main Chat View — Connects input, message list, loading state, and error display

import { useEffect, useRef, useState } from 'react';
import {
  ChatApiError,
  checkBackendHealth,
  sendChatMessage,
} from '../services/chat.service';
import type { ChatMessageItem } from '../types/chat';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';

// Formats current local time like "02:20 AM" for each message bubble
function formatCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPage() {
  // `useState` stores reactive UI data; calling the setter (`setMessages`) re-renders the UI
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(
    null
  );
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking'
  );

  // Holds the active AbortController so clicking "Stop" can cancel a running `fetch` request
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to check GET /api/health on the FastAPI backend
  const runHealthCheck = async () => {
    setBackendStatus('checking');
    try {
      await checkBackendHealth();
      setBackendStatus('online');
    } catch {
      setBackendStatus('offline');
    }
  };

  // Run a health check once when ChatPage first mounts on screen
  useEffect(() => {
    void runHealthCheck();
  }, []);

  // Cancels any in-flight request when the user clicks "Stop"
  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  // Clears messages and error banners in local state (Phase 1 is stateless on the backend)
  const handleClearChat = () => {
    handleStop();
    setMessages([]);
    setErrorInfo(null);
  };

  // Sends the user's message to POST /api/chat and appends both user and assistant messages
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    setErrorInfo(null);

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      text: trimmed,
      createdAt: formatCurrentTime(),
    };

    // Immediately show the user's message in the list and clear the input box
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await sendChatMessage(trimmed, controller.signal);
      setBackendStatus('online');

      const assistantMessage: ChatMessageItem = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        text: response.reply,
        createdAt: formatCurrentTime(),
        mode: response.mode,
        model: response.model,
      };

      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error: unknown) {
      // If the user intentionally clicked "Stop", we don't treat it as an error banner
      if ((error as Error)?.name === 'AbortError') {
        return;
      }

      if (error instanceof ChatApiError) {
        if (error.code === 'NETWORK_ERROR') {
          setBackendStatus('offline');
        }
        setErrorInfo({
          code: error.code,
          message: error.message,
        });
      } else {
        setErrorInfo({
          code: 'UNEXPECTED_ERROR',
          message: 'Something unexpected happened while sending your message.',
        });
      }
    } finally {
      // Always runs whether the request succeeded, failed, or was stopped
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white text-slate-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 shrink-0 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate">
            AI Chat Bot — Phase 1 Loop
          </h1>

          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              backendStatus === 'online'
                ? 'bg-emerald-100 text-emerald-800'
                : backendStatus === 'offline'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            Backend: {backendStatus}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void runHealthCheck()}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Check Health
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0 && !errorInfo && !isLoading}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Error Display Banner (shows standardized backend errors like VALIDATION_ERROR or NETWORK_ERROR) */}
      {errorInfo && (
        <div
          role="alert"
          className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2.5"
        >
          <div className="max-w-3xl mx-auto flex items-start justify-between gap-3 text-xs">
            <div className="text-rose-900">
              <span className="font-semibold mr-1.5">[{errorInfo.code}]</span>
              <span>{errorInfo.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorInfo(null)}
              className="text-rose-700 hover:text-rose-950 font-medium cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Empty State Prompt or Active Message Feed */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <p className="text-lg font-semibold text-slate-900">
            Phase 1: Frontend ↔ FastAPI Connection Test
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
            Type a message below to send <code className="text-slate-700">{'{ "message": "..." }'}</code>{' '}
            to <code className="text-slate-700">POST /api/chat</code> and view the backend reply.
          </p>
        </div>
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      {/* Bottom Composer */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
        <MessageInput
          value={inputText}
          onChange={setInputText}
          onSend={() => void handleSend()}
          onStop={handleStop}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}