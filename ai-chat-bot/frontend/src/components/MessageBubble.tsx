// Phase 7 Message Bubble — Text-only Markdown formatting, pgvector_rag badge indicator, single-hero widget, copy & rating

import { Fragment, useState, type ReactNode } from 'react';
import type { ChatMessageItem, MessageRating } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessageItem;
  onRate?: (messageId: string, rating: MessageRating) => void;
  onCopySuccess?: (label: string) => void;
}

// Parses inline Markdown inside a single line: **bold** and `inline code`
function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return tokens.map((token, index) => {
    if (!token) return null;

    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={index} className="font-semibold text-slate-950">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-200/75 text-slate-900 font-mono text-[12px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    return <Fragment key={index}>{token}</Fragment>;
  });
}

// Renders block-level Markdown: fenced code blocks, headings, bullet lists, numbered lists, and paragraphs
function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-3 text-xs font-mono leading-relaxed"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    if (!trimmed) {
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      elements.push(
        <p
          key={`h-${i}`}
          className={`font-semibold text-slate-950 mt-2.5 mb-1 ${
            level === 1 ? 'text-base' : 'text-sm'
          }`}
        >
          {renderInlineMarkdown(headingText)}
        </p>
      );
      i += 1;
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 list-disc pl-5 space-y-1 text-slate-800">
          {listItems.map((itemText, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineMarkdown(itemText)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const orderedItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        orderedItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-1.5 list-decimal pl-5 space-y-1 text-slate-800">
          {orderedItems.map((itemText, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInlineMarkdown(itemText)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="my-1.5 first:mt-0 last:mb-0 leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
    i += 1;
  }

  return <div className="text-sm text-slate-800">{elements}</div>;
}

// Extracts structured key/value rows when an assistant answer contains bulleted or `Key: Value` lines
function extractStructuredRows(content: string): { label: string; detail: string }[] {
  const rows: { label: string; detail: string }[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  for (const rawLine of lines) {
    const cleaned = rawLine.trim().replace(/^[-*•]\s+|\d+\.\s+/, '');
    const boldKv = cleaned.match(/^\*\*([^*]+)\*\*[:\s-]+(.+)$/);
    if (boldKv) {
      rows.push({
        label: boldKv[1].trim(),
        detail: boldKv[2].replace(/\*\*/g, '').trim(),
      });
      continue;
    }

    const plainKv = cleaned.match(/^([A-Za-z0-9 /_-]{2,36}):\s+(.+)$/);
    if (plainKv) {
      rows.push({
        label: plainKv[1].trim(),
        detail: plainKv[2].replace(/\*\*/g, '').trim(),
      });
    }
  }

  return rows.slice(0, 6);
}

// Single-hero structured widget (Card / Data Table / Collapsible) for structured profile answers
function SingleHeroProfileCard({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const rows = extractStructuredRows(content);
  const hasTabularStructure = rows.length >= 2;

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
          {hasTabularStructure ? 'Structured Profile Summary (Table Card)' : 'Profile Highlights Card'}
        </span>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-[11px] font-medium text-indigo-700 hover:text-indigo-900 cursor-pointer"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {hasTabularStructure ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500">
                <th className="py-1.5 px-3 font-semibold">Topic</th>
                <th className="py-1.5 px-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-3 font-medium text-slate-900 align-top whitespace-nowrap">
                    {row.label}
                  </td>
                  <td className="py-1.5 px-3 align-top">
                    {expanded ? row.detail : row.detail.length > 140 ? `${row.detail.slice(0, 140)}...` : row.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-3 py-2.5 text-xs text-slate-700">
          {expanded
            ? content.trim()
            : content.trim().length > 220
              ? `${content.trim().slice(0, 220)}...`
              : content.trim()}
        </div>
      )}
    </div>
  );
}

export function MessageBubble({ message, onRate, onCopySuccess }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const currentRating: MessageRating = message.rating ?? null;
  const isPgvectorRag = message.mode === 'pgvector_rag';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      onCopySuccess?.('Response copied to clipboard');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be blocked in non-HTTPS contexts
    }
  };

  const handleRatingClick = (next: 'up' | 'down') => {
    const toggled: MessageRating = currentRating === next ? null : next;
    onRate?.(message.id, toggled);
  };

  const shouldRenderHeroWidget =
    !isUser && (message.text.length > 180 || extractStructuredRows(message.text).length >= 2);

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
          AI
        </div>
      )}

      {/* Message Column */}
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Metadata Row: Author + Mode/Model Badges + Time */}
        <div className="flex flex-wrap items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
          <span className="font-medium text-slate-600">
            {isUser ? 'You' : 'Assistant'}
          </span>

          {!isUser && message.mode && (
            <span
              title={
                isPgvectorRag
                  ? 'Grounded via top-K cosine similarity retrieval against knowledge_chunks'
                  : 'Answered using base profile system instruction'
              }
              className={`px-1.5 py-0.5 rounded font-medium ${
                isPgvectorRag
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isPgvectorRag ? 'pgvector RAG' : message.mode}
            </span>
          )}

          {!isUser && message.model && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
              {message.model}
            </span>
          )}

          <span>{message.createdAt}</span>
        </div>

        {/* Bubble Surface */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-slate-900 text-white whitespace-pre-wrap'
              : 'bg-slate-50 border border-slate-200/90 text-slate-800'
          }`}
        >
          {isUser ? (
            message.text
          ) : (
            <>
              <MarkdownContent content={message.text} />
              {shouldRenderHeroWidget && <SingleHeroProfileCard content={message.text} />}
            </>
          )}
        </div>

        {/* Assistant Footer Actions: Copy + Answer Rating */}
        {!isUser && (
          <div className="mt-1.5 px-1 flex items-center gap-3 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="hover:text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>

            <span aria-hidden="true">•</span>

            <div className="inline-flex items-center gap-1.5" role="group" aria-label="Rate response">
              <button
                type="button"
                aria-pressed={currentRating === 'up'}
                onClick={() => handleRatingClick('up')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  currentRating === 'up'
                    ? 'bg-emerald-100 text-emerald-800 font-semibold'
                    : 'hover:text-slate-700'
                }`}
              >
                Helpful
              </button>
              <button
                type="button"
                aria-pressed={currentRating === 'down'}
                onClick={() => handleRatingClick('down')}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  currentRating === 'down'
                    ? 'bg-rose-100 text-rose-800 font-semibold'
                    : 'hover:text-slate-700'
                }`}
              >
                Needs work
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
          You
        </div>
      )}
    </div>
  );
}