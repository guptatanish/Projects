// Phase 1 Prompt Composer — Text input box + Send / Stop button

import type { FormEvent, KeyboardEvent } from 'react';

// Props are inputs passed into this component from its parent (`ChatPage.tsx`)
interface MessageInputProps {
  value: string; // Current text typed inside the input box
  onChange: (nextValue: string) => void; // Function called whenever the user types
  onSend: () => void; // Function called when the user submits the message
  onStop: () => void; // Function called when the user clicks Stop while loading
  isLoading: boolean; // True while waiting for the backend reply
  maxLength?: number; // Optional character limit (Phase 1 backend allows up to 4000 chars)
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  maxLength = 4000,
}: MessageInputProps) {
  // Check whether there is at least one non-space character typed
  const trimmedLength = value.trim().length;
  const canSend = trimmedLength > 0 && !isLoading;

  // Runs when the user clicks "Send" or presses Enter inside the form
  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Stops the browser from doing a full page reload
    if (!canSend) return;
    onSend();
  };

  // Runs on every key press inside the textarea
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Pressing Enter (without Shift) sends the message; Shift+Enter adds a new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xs"
    >
      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={value}
          maxLength={maxLength}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question and press Enter to send..."
          aria-label="Chat message input"
          className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 leading-relaxed"
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
        <span>Enter to send • Shift + Enter for new line</span>
        <span>
          {value.length} / {maxLength}
        </span>
      </div>
    </form>
  );
}