// Phase 5 Image Preview — Thumbnail preview, metadata, upload mode indicator, and remove action

import { MAX_IMAGE_BYTES } from '../services/chat.service';
import type { PendingImageAttachment } from '../types/chat';

interface ImagePreviewProps {
  image: PendingImageAttachment;
  useFormData?: boolean;
  disabled?: boolean;
  onRemove: () => void;
}

function formatImageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function ImagePreview({
  image,
  useFormData = false,
  disabled = false,
  onRemove,
}: ImagePreviewProps) {
  const isOverLimit = image.fileSize > MAX_IMAGE_BYTES;

  return (
    <div
      className={`mb-2.5 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
        isOverLimit
          ? 'border-rose-300 bg-rose-50/70'
          : 'border-slate-200 bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src={image.previewUrl}
          alt={image.fileName}
          className="h-11 w-11 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-800 truncate">
              {image.fileName}
            </p>
            <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-[10px] font-medium text-slate-700 shrink-0">
              {useFormData && image.file ? 'FormData' : 'JSON'}
            </span>
          </div>

          <p
            className={`text-[11px] truncate ${
              isOverLimit ? 'text-rose-700 font-medium' : 'text-slate-500'
            }`}
          >
            {image.mimeType} • {formatImageSize(image.fileSize)}
            {isOverLimit ? ' • Exceeds 5 MB limit' : ' • ≤ 5 MB'}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-100/70 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
      >
        Remove
      </button>
    </div>
  );
}