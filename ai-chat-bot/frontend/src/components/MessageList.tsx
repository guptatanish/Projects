// Phase 2 Message Feed — Renders `MessageBubble` items, `TypingIndicator`, and smooth auto-scroll

import { useEffect, useRef } from 'react';
import type { ChatMessageItem } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface MessageListProps {
  messages: ChatMessageItem[]; // Ordered list of messages in the current chat session
  isLoading: boolean; // True while awaiting Gemini Flash response from POST /api/chat
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  // Invisible element at the bottom of the scroll container used as a scroll anchor
  const bottomMarkerRef = useRef<HTMLDivElement | null>(null);

  // Scroll smoothly to the newest message or typing indicator whenever they update
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
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((item) => (
          <MessageBubble key={item.id} message={item} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomMarkerRef} />
      </div>
    </div>
  );
}