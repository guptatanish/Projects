// Phase 4 Message Bubble — Renders user & assistant turns, Markdown formatting, and attachment metadata

import { Fragment, useState, type ReactNode } from 'react';
import type { AttachmentMetadata, ChatMessageItem } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessageItem;
}

function formatAttachmentBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
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

function AttachmentChips({
  attachments,
  isUser,
}: {
  attachments: AttachmentMetadata[];
  isUser: boolean;
}) {
  if (!attachments.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${isUser ? 'mb-2 justify-end' : 'mb-2 justify-start'}`}>
      {attachments.map((att) => (
        <div
          key={att.id}
          className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] border ${
            isUser
              ? 'border-slate-700 bg-slate-800/90 text-slate-100'
              : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          <span className="font-medium truncate max-w-48">{att.file_name}</span>
          <span
            className={
              isUser ? 'text-slate-300' : 'text-slate-400'
            }
          >
            {att.mime_type} • {formatAttachmentBytes(att.file_size)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be blocked in non-HTTPS contexts; fail silently
    }
  };

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
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {message.mode}
            </span>
          )}

          {!isUser && message.model && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
              {message.model}
            </span>
          )}

          <span>{message.createdAt}</span>
        </div>

        {/* Persisted or Sent Attachment Metadata */}
        {message.attachments && message.attachments.length > 0 && (
          <AttachmentChips attachments={message.attachments} isUser={isUser} />
        )}

        {/* Bubble Surface */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-slate-900 text-white whitespace-pre-wrap'
              : 'bg-slate-50 border border-slate-200/90 text-slate-800'
          }`}
        >
          {isUser ? message.text : <MarkdownContent content={message.text} />}
        </div>

        {/* Assistant Footer Actions (Copy) */}
        {!isUser && (
          <div className="mt-1 px-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
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