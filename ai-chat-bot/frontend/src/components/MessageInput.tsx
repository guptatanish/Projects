// Phase 5 Prompt Composer — ImagePreview, JSON/FormData toggle, scope/filter popover, Markdown preview, and Send/Stop

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
import type { PendingImageAttachment, ProfileScopeFilter } from '../types/chat';
import { ImagePreview } from './ImagePreview';

export interface ComposerPreferences {
  scope: ProfileScopeFilter;
  responseStyle: 'concise' | 'detailed' | 'technical';
  includeCitations: boolean;
  strictProfileOnly: boolean;
  detailLevel: number; // 1 to 5
  focusDate: string;
}

interface MessageInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  onSend: (overridePrompt?: string) => void;
  onStop: () => void;
  selectedImage: PendingImageAttachment | null;
  onSelectImage: (image: PendingImageAttachment | null) => void;
  useFormData?: boolean;
  onToggleFormData?: (next: boolean) => void;
  preferences?: ComposerPreferences;
  onChangePreferences?: (next: ComposerPreferences) => void;
  onAttachmentError?: (message: string) => void;
  isLoading: boolean;
  isRateLimited?: boolean;
  isEmptyState?: boolean;
  starterPrompts?: string[];
  maxLength?: number;
}

const SCOPE_OPTIONS: { id: ProfileScopeFilter; label: string; hint: string }[] = [
  { id: 'all', label: 'All', hint: 'Full profile' },
  { id: 'git', label: 'Git', hint: 'Repositories & open source' },
  { id: 'work', label: 'Work', hint: 'Experience & roles' },
  { id: 'stack', label: 'Stack', hint: 'Tools & frameworks' },
  { id: 'education', label: 'Education', hint: 'Degrees & milestones' },
];

function formatFileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

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
  useFormData = false,
  onToggleFormData,
  preferences,
  onChangePreferences,
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
  const [filterPopoverOpen, setFilterPopoverOpen] = useState<boolean>(false);

  const trimmedLength = value.trim().length;
  const canSend = trimmedLength > 0 && !isLoading && !isRateLimited;

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
        `Image "${file.name}" (${formatFileSizeLabel(file.size)}) exceeds the 5 MB limit.`
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
        onAttachmentError?.('Encoded image exceeds the maximum allowed base64 size.');
        return;
      }

      const decodedBytes = estimateBase64DecodedBytes(base64Only);
      if (decodedBytes > MAX_IMAGE_BYTES) {
        onAttachmentError?.('Decoded image size exceeds the 5 MB limit.');
        return;
      }

      onAttachmentError?.('');
      onSelectImage({
        file,
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
    setFilterPopoverOpen(false);
    onSend();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        setPreviewMarkdown(false);
        setFilterPopoverOpen(false);
        onSend();
      }
    }
  };

  const updatePref = <K extends keyof ComposerPreferences>(
    key: K,
    nextVal: ComposerPreferences[K]
  ) => {
    if (!preferences || !onChangePreferences) return;
    onChangePreferences({
      ...preferences,
      [key]: nextVal,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      {/* Scope Button Group + Filter Popover Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        {preferences && onChangePreferences ? (
          <div
            role="group"
            aria-label="Profile scope filter"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/90 p-0.5"
          >
            {SCOPE_OPTIONS.map((opt) => {
              const active = preferences.scope === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.hint}
                  onClick={() => updatePref('scope', opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {selectedImage && onToggleFormData && (
            <button
              type="button"
              onClick={() => onToggleFormData(!useFormData)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Payload: {useFormData ? 'FormData' : 'JSON'}
            </button>
          )}

          {preferences && onChangePreferences && (
            <button
              type="button"
              onClick={() => setFilterPopoverOpen((prev) => !prev)}
              aria-expanded={filterPopoverOpen}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {filterPopoverOpen ? 'Close Filters' : 'Filters & Options'}
            </button>
          )}
        </div>
      </div>

      {/* Filter & Preference Popover */}
      {filterPopoverOpen && preferences && onChangePreferences && (
        <div
          role="dialog"
          aria-label="Prompt filters and preferences"
          className="mb-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-xs text-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-900">Scope &amp; Response Preferences</span>
            <button
              type="button"
              onClick={() => setFilterPopoverOpen(false)}
              className="text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Select: Response Style */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">Response Style</span>
              <select
                value={preferences.responseStyle}
                onChange={(e) =>
                  updatePref(
                    'responseStyle',
                    e.target.value as ComposerPreferences['responseStyle']
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="technical">Technical</option>
              </select>
            </label>

            {/* Combo Box (datalist): Focus Topic / Area */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">Focus Area</span>
              <input
                type="text"
                list="profile-focus-suggestions"
                value={preferences.scope === 'all' ? '' : preferences.scope}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  const matched = SCOPE_OPTIONS.find((s) => s.id === val)?.id ?? 'all';
                  updatePref('scope', matched);
                }}
                placeholder="Type or pick scope..."
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900"
              />
              <datalist id="profile-focus-suggestions">
                <option value="all" />
                <option value="git" />
                <option value="work" />
                <option value="stack" />
                <option value="education" />
              </datalist>
            </label>

            {/* Date Picker: Reference Date */}
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-600">Reference Date</span>
              <input
                type="date"
                value={preferences.focusDate}
                onChange={(e) => updatePref('focusDate', e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900"
              />
            </label>
          </div>

          {/* Slider: Detail Level */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-medium">Detail Depth</span>
              <span className="font-semibold text-slate-900">{preferences.detailLevel} / 5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={preferences.detailLevel}
              onChange={(e) => updatePref('detailLevel', Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          {/* Radio Group + Toggles / Checkboxes */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-3" role="radiogroup" aria-label="Output format">
              <span className="text-[11px] font-medium text-slate-500">Format:</span>
              {(['concise', 'detailed'] as const).map((mode) => (
                <label key={mode} className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="output-format-radio"
                    checked={preferences.responseStyle === mode}
                    onChange={() => updatePref('responseStyle', mode)}
                    className="accent-slate-900"
                  />
                  <span className="capitalize text-[11px]">{mode}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.includeCitations}
                  onChange={(e) => updatePref('includeCitations', e.target.checked)}
                  className="accent-slate-900 rounded"
                />
                <span className="text-[11px]">Cite sources</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={preferences.strictProfileOnly}
                  checked={preferences.strictProfileOnly}
                  onChange={(e) => updatePref('strictProfileOnly', e.target.checked)}
                  className="accent-slate-900 rounded"
                />
                <span className="text-[11px]">Strict profile mode</span>
              </label>
            </div>
          </div>
        </div>
      )}

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
        {/* Selected Image Attachment Preview */}
        {selectedImage && (
          <ImagePreview
            image={selectedImage}
            useFormData={useFormData}
            disabled={isLoading}
            onRemove={() => onSelectImage(null)}
          />
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
            title="Attach image (JPEG, PNG, WebP — max 5 MB)"
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
                : 'Enter to send • Shift + Enter for new line • JPEG/PNG/WebP ≤ 5 MB'}
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