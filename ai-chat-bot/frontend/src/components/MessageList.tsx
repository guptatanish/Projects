// Phase 1 Message Feed — Renders user & assistant messages and loading state

import { useEffect, useRef } from 'react';
import type { ChatMessageItem } from '../types/chat';

interface MessageListProps {
  messages: ChatMessageItem[]; // Ordered list of chat messages in state
  isLoading: boolean; // True while waiting for the backend reply
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  // Creates a reference to an invisible marker element at the very bottom of the list
  const bottomMarkerRef = useRef<HTMLDivElement | null>(null);

  // `useEffect` runs automatically after rendering whenever `messages` or `isLoading` changes
  useEffect(() => {
    bottomMarkerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Chat conversation"
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((item) => {
          const isUser = item.role === 'user';

          return (
            <div
              key={item.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                <span className="font-medium text-slate-600">
                  {isUser ? 'You' : 'Assistant'}
                </span>
                {!isUser && item.mode && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {item.mode}
                  </span>
                )}
                <span>{item.createdAt}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                {item.text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-medium text-slate-600 mb-1 px-1">
              Assistant
            </span>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
              <span>Waiting for response from FastAPI...</span>
            </div>
          </div>
        )}

        {/* Scroll target at the end of the conversation */}
        <div ref={bottomMarkerRef} />
      </div>
    </div>
  );
}