// Phase 2 Typing Indicator — Calm loading feedback while Gemini Flash generates a response

export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Assistant is generating a response"
      className="flex items-start gap-3"
    >
      {/* Assistant Avatar Badge */}
      <div className="h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
        AI
      </div>

      {/* Loading Bubble with Animated Dots + Lightweight Skeleton Lines */}
      <div className="flex-1 max-w-md rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" />
          <span className="text-xs font-medium text-slate-600 ml-1">
            Generating response with Gemini Flash...
          </span>
        </div>

        {/* Subtle Skeleton Lines Previewing Incoming Text */}
        <div className="mt-3 space-y-2 animate-pulse" aria-hidden="true">
          <div className="h-2.5 w-11/12 rounded bg-slate-200/80" />
          <div className="h-2.5 w-3/4 rounded bg-slate-200/80" />
        </div>
      </div>
    </div>
  );
}