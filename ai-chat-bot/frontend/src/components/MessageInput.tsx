// Phase 4 Prompt Composer — Auto-growing input, Markdown preview toggle, image picker, starter chips, and Send/Stop

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  estimateBase64DecodedBytes,
  isSupportedImageMimeType,
  MAX_IMAGE_BASE64_CHARS,
  MAX_IMAGE_BYTES,
} from '../services/chat.service';
import type { PendingImageAttachment } from '../types/chat';

interface MessageInputProps {
  value: string; // Current text inside the textarea
  onChange: (nextValue: string) => void; // Called on every keystroke
  onSend: (overridePrompt?: string) => void; // Called when sending text or a starter chip
  onStop: () => void; // Called when clicking Stop while Gemini Flash is generating
  selectedImage: PendingImageAttachment | null; // Currently attached image (JPEG/PNG/WebP)
  onSelectImage: (image: PendingImageAttachment | null) => void; // Updates selected image
  onAttachmentError?: (message: string) => void; // Surfaces invalid/oversized image feedback
  isLoading: boolean; // True while waiting for POST /api/chat
  isRateLimited?: boolean; // True when backend returned 429 AI_RATE_LIMITED / RATE_LIMIT_EXCEEDED
  isEmptyState?: boolean; // True when no messages exist yet in the current chat
  starterPrompts?: string[]; // Quick profile starter questions shown on empty state
  maxLength?: number; // Backend limit: 4000 characters
}

function formatFileSizeKb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

// Lightweight inline Markdown renderer for the composer's live Markdown preview mode
function renderComposerInline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, idx) => {
    if (!token) return null;
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-950">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="px-1 py-0.5 mx-0.5 rounded bg-slate-200/80 text-slate-900 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={idx}>{token}</Fragment>;
  });
}

function ComposerMarkdownPreview({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <p className="text-sm text-slate-400 italic py-1">
        Nothing to preview yet — paste or type Markdown text in Edit mode.
      </p>
    );
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push(
        <p key={`h-${i}`} className="font-semibold text-slate-950 text-sm mt-1.5 mb-0.5">
          {renderComposerInline(headingMatch[2])}
        </p>
      );
      i += 1;
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-1 space-y-0.5 text-sm text-slate-800">
          {items.map((item, idx) => (
            <li key={idx}>{renderComposerInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-1 space-y-0.5 text-sm text-slate-800">
          {items.map((item, idx) => (
            <li key={idx}>{renderComposerInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} className="my-1 first:mt-0 last:mb-0 text-sm text-slate-800 leading-relaxed">
        {renderComposerInline(line)}
      </p>
    );
    i += 1;
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 max-h-44 overflow-y-auto">
      {blocks}
    </div>
  );
}

export function MessageInput({
  value,
  onChange,
  onSend,
  onStop,
  selectedImage,
  onSelectImage,
  onAttachmentError,
  isLoading,
  isRateLimited = false,
  isEmptyState = false,
  starterPrompts = [],
  maxLength = 4000,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<boolean>(false);

  const trimmedLength = value.trim().length;
  const canSend = trimmedLength > 0 && !isLoading && !isRateLimited;

  // Auto-adjust textarea height up to ~176px when in Edit mode
  useEffect(() => {
    if (previewMarkdown) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, 176);
    el.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [value, previewMarkdown]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset input value so selecting the same file again after removing still triggers onChange
    event.target.value = '';
    if (!file) return;

    if (!isSupportedImageMimeType(file.type)) {
      onAttachmentError?.(
        `Unsupported file type "${file.type || 'unknown'}". Please choose a JPEG, PNG, or WebP image.`
      );
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      onAttachmentError?.(
        `Image "${file.name}" (${formatFileSizeKb(file.size)}) exceeds the 4 MB limit.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      const base64Only = commaIdx !== -1 ? result.slice(commaIdx + 1) : result;

      if (!base64Only) {
        onAttachmentError?.('Could not read image data.');
        return;
      }

      if (base64Only.length > MAX_IMAGE_BASE64_CHARS) {
        onAttachmentError?.('Encoded image exceeds the 5,600,000 character base64 limit.');
        return;
      }

      const decodedBytes = estimateBase64DecodedBytes(base64Only);
      if (decodedBytes > MAX_IMAGE_BYTES) {
        onAttachmentError?.('Decoded image size exceeds the 4 MB limit.');
        return;
      }

      onAttachmentError?.('');
      onSelectImage({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        base64: base64Only,
        previewUrl: result,
      });
    };
    reader.onerror = () => {
      onAttachmentError?.('Failed to read the selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;
    setPreviewMarkdown(false);
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        setPreviewMarkdown(false);
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
              onClick={() => {
                setPreviewMarkdown(false);
                onSend(promptText);
              }}
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
        {/* Selected Image Attachment Preview Pill */}
        {selectedImage && (
          <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={selectedImage.previewUrl}
                alt={selectedImage.fileName}
                className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {selectedImage.fileName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {selectedImage.mimeType} • {formatFileSizeKb(selectedImage.fileSize)}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSelectImage(null)}
              className="px-2 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              Remove
            </button>
          </div>
        )}

        {/* Hidden File Input for JPEG / PNG / WebP */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Attach image"
        />

        <div className="flex items-end gap-2">
          <button
            type="button"
            disabled={isLoading || isRateLimited}
            onClick={() => fileInputRef.current?.click()}
            title="Attach image (JPEG, PNG, WebP — max 4 MB)"
            aria-label="Attach image"
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-xs font-medium text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            + Image
          </button>

          {previewMarkdown ? (
            <div className="flex-1 min-w-0">
              <ComposerMarkdownPreview text={value} />
            </div>
          ) : (
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
                  : 'Ask a question or paste Markdown (e.g. **bold**, - list, `code`)...'
              }
              aria-label="Chat message input"
              className="flex-1 resize-none overflow-y-auto bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 leading-relaxed min-h-11 max-h-44"
            />
          )}

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

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-3 min-w-0">
            <span className="truncate">
              {isRateLimited
                ? 'Rate limit active (no automatic retries)'
                : 'Enter to send • Shift + Enter for new line • JPEG/PNG/WebP ≤ 4 MB'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewMarkdown((prev) => !prev)}
              className="font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {previewMarkdown ? 'Edit' : 'Preview MD'}
            </button>

            <span>
              {value.length} / {maxLength}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}