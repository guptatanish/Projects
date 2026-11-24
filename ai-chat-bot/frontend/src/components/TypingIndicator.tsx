// Phase 5 Typing Indicator — Avatar + Spinner + Skeleton loading state while Gemini Flash responds

export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Assistant is generating a response"
      className="flex items-start gap-3"
    >
      {/* Assistant Avatar */}
      <div className="h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 select-none">
        AI
      </div>

      {/* Loading Bubble with Spinner + Skeleton Lines */}
      <div className="flex-1 max-w-md rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin shrink-0"
          />
          <span className="text-xs font-medium text-slate-600">
            Thinking with Gemini Flash...
          </span>
        </div>

        {/* Skeleton Preview Lines */}
        <div className="mt-3 space-y-2 animate-pulse" aria-hidden="true">
          <div className="h-2.5 w-11/12 rounded bg-slate-200/80" />
          <div className="h-2.5 w-4/5 rounded bg-slate-200/80" />
          <div className="h-2.5 w-2/3 rounded bg-slate-200/80" />
        </div>
      </div>
    </div>
  );
}