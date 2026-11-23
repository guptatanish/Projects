// Phase 2 Prompt Composer — Auto-growing input, starter chips on empty chat, and Send / Stop controls

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';

// Props passed from `ChatPage.tsx` into `MessageInput`
interface MessageInputProps {
  value: string; // Current text inside the textarea
  onChange: (nextValue: string) => void; // Called on every keystroke
  onSend: (overridePrompt?: string) => void; // Called when sending text or a starter chip
  onStop: () => void; // Called when clicking Stop while Gemini Flash is generating
  isLoading: boolean; // True while waiting for POST /api/chat
  isRateLimited?: boolean; // True when backend returned 429 RATE_LIMIT_EXCEEDED
  isEmptyState?: boolean; // True when no messages exist yet in the current chat
  starterPrompts?: string[]; // Quick profile starter questions shown on empty state
  maxLength?: number; // Phase 1/2 backend limit: 4000 characters
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  isRateLimited = false,
  isEmptyState = false,
  starterPrompts = [],
  maxLength = 4000,
}: MessageInputProps) {
  // Reference to the underlying <textarea> DOM element so we can adjust its height automatically
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const trimmedLength = value.trim().length;
  const canSend = trimmedLength > 0 && !isLoading && !isRateLimited;

  // Automatically adjusts textarea height based on its content, up to ~180px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 180);
    el.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [value]);

  // Handles form submission (clicking "Send")
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevents full page reload
    if (!canSend) return;
    onSend();
  };

  // Handles keyboard shortcuts inside the textarea
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter (without Shift) sends; Shift + Enter inserts a newline
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Starter Prompt Chips on Empty State */}
      {isEmptyState && starterPrompts.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3.5">
          {starterPrompts.map((promptText) => (
            <button
              key={promptText}
              type="button"
              disabled={isLoading || isRateLimited}
              onClick={() => onSend(promptText)}
              className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <form
        onSubmit={handleFormSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs focus-within:border-slate-400 transition-colors"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            maxLength={maxLength}
            disabled={isLoading}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRateLimited
                ? 'Rate limit reached — please wait before sending another question...'
                : 'Ask about your Git projects, work experience, tech stack, or education...'
            }
            aria-label="Chat message input"
            className="flex-1 resize-none overflow-y-auto bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 leading-relaxed min-h-11 max-h-44"
          />

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            >
              Send
            </button>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            {isRateLimited
              ? 'Rate limit active (no automatic retries)'
              : 'Enter to send • Shift + Enter for new line'}
          </span>
          <span>
            {value.length} / {maxLength}
          </span>
        </div>
      </form>
    </div>
  );
}