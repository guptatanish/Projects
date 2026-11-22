import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';

// --- Icons ---
const UploadCloudIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const FileIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const XIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface FileUploadProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onError?: (error: string) => void;
  multiple?: boolean;
  accept?: string; // e.g., ".pdf, .png, image/*"
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;

  // Custom Colors
  dropzoneBg?: string;
  activeDropzoneBg?: string;
  borderColor?: string;
  iconColor?: string;
  textColor?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    className,
    files,
    onFilesChange,
    onError,
    multiple = false,
    accept,
    maxSize,
    maxFiles,
    disabled = false,
    dropzoneBg,
    activeDropzoneBg,
    borderColor,
    iconColor,
    textColor,
    style,
    ...props
  }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const processFiles = useCallback((incomingFiles: File[]) => {
      let validFiles = [...incomingFiles];

      // Validate Max Files Limit
      if (maxFiles && (files.length + validFiles.length) > maxFiles) {
        onError?.(`You can only upload a maximum of ${maxFiles} files.`);
        validFiles = validFiles.slice(0, maxFiles - files.length);
      }

      // Validate Size
      if (maxSize) {
        const oversized = validFiles.filter(f => f.size > maxSize);
        if (oversized.length > 0) {
          onError?.(`${oversized[0].name} exceeds the maximum file size of ${formatFileSize(maxSize)}.`);
          validFiles = validFiles.filter(f => f.size <= maxSize);
        }
      }

      // Validate Accept Type
      if (accept) {
        const allowedTypes = accept.split(',').map(t => t.trim().toLowerCase());
        const invalidTypes = validFiles.filter(f => {
          const extension = '.' + f.name.split('.').pop()?.toLowerCase();
          const mimeType = f.type.toLowerCase();
          return !allowedTypes.some(type => {
            if (type.startsWith('.')) return extension === type;
            if (type.endsWith('/*')) return mimeType.startsWith(type.replace('/*', ''));
            return mimeType === type;
          });
        });

        if (invalidTypes.length > 0) {
          onError?.(`${invalidTypes[0].name} is not an accepted file type.`);
          validFiles = validFiles.filter(f => !invalidTypes.includes(f));
        }
      }

      if (validFiles.length > 0) {
        onFilesChange(multiple ? [...files, ...validFiles] : [validFiles[0]]);
      }
    }, [files, multiple, accept, maxSize, maxFiles, onFilesChange, onError]);

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(Array.from(e.target.files));
      }
      // Reset input value so the same file can be selected again if removed
      e.target.value = '';
    };

    const removeFile = (indexToRemove: number) => {
      if (disabled) return;
      onFilesChange(files.filter((_, index) => index !== indexToRemove));
    };

    // Safe inline CSS variables mapping
    const customStyle = {
      ...style,
      ...(dropzoneBg ? { '--fu-bg': dropzoneBg } : {}),
      ...(activeDropzoneBg ? { '--fu-active-bg': activeDropzoneBg } : {}),
      ...(borderColor ? { '--fu-border': borderColor } : {}),
      ...(iconColor ? { '--fu-icon': iconColor } : {}),
      ...(textColor ? { '--fu-text': textColor } : {}),
    } as React.CSSProperties;

    return (
      <div 
        ref={ref} 
        style={customStyle} 
        className={cn("w-full flex flex-col gap-4", className)} 
        {...props}
      >
        {/* Hidden File Input */}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
        />

        {/* Dropzone Area */}
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            
            // Border Colors
            borderColor ? "border-[var(--fu-border)]" : "border-[#888888] dark:border-zinc-700",
            !borderColor && isDragging && !disabled && "border-black dark:border-zinc-300",
            
            // Background Colors
            !isDragging && (dropzoneBg ? "bg-[var(--fu-bg)]" : "bg-[#f9fafb] dark:bg-zinc-900"),
            isDragging && (activeDropzoneBg ? "bg-[var(--fu-active-bg)]" : "bg-[#f3f4f6] dark:bg-zinc-800"),
            
            // Text Colors
            textColor && "text-[var(--fu-text)]"
          )}
        >
          <UploadCloudIcon 
            className={cn(
              "w-10 h-10 mb-4",
              iconColor ? "text-[var(--fu-icon)]" : "text-[#555555] dark:text-zinc-400"
            )} 
          />
          <div className="text-center">
            <p className={cn(
              "text-sm font-medium",
              !textColor && "text-black dark:text-zinc-100"
            )}>
              {isDragging ? "Drop files here..." : "Click or drag files here to upload"}
            </p>
            <p className={cn(
              "mt-1 text-xs",
              !textColor && "text-[#888888] dark:text-zinc-500"
            )}>
              {accept ? `Supports: ${accept.split(',').join(', ')}` : "All files supported"}
              {maxSize && ` (Max: ${formatFileSize(maxSize)})`}
            </p>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {files.map((file, index) => (
              <li 
                key={`${file.name}-${index}`} 
                className={cn(
                  "flex items-center justify-between p-3 border rounded-md bg-white dark:bg-zinc-950",
                  borderColor ? "border-[var(--fu-border)]" : "border-[#e5e5e5] dark:border-zinc-800"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className={cn(
                    "w-5 h-5 shrink-0",
                    iconColor ? "text-[var(--fu-icon)]" : "text-[#888888] dark:text-zinc-400"
                  )} />
                  <div className="flex flex-col overflow-hidden">
                    <span className={cn(
                      "text-sm font-medium truncate",
                      textColor ? "text-[var(--fu-text)]" : "text-black dark:text-zinc-100"
                    )}>
                      {file.name}
                    </span>
                    <span className={cn(
                      "text-xs",
                      textColor ? "text-[var(--fu-text)] opacity-70" : "text-[#888888] dark:text-zinc-500"
                    )}>
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1.5 shrink-0 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-[#888888] hover:text-black dark:text-zinc-400 dark:hover:text-white"
                    aria-label={`Remove ${file.name}`}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";