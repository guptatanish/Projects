import React, { useEffect, useId, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const SearchIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ClearIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const LoadingSpinner = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="block shrink-0 animate-spin"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke={color || 'currentColor'}
      strokeWidth="2.5"
      className="opacity-25"
    />
    <path
      fill={color || 'currentColor'}
      d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const searchWrapperVariants = cva(
  "flex w-full items-center rounded-none border-0 border-b-2 border-[#888888] bg-[#E5E5E5] transition-colors dark:border-zinc-700 dark:bg-zinc-900",
  {
    variants: {
      size: {
        small: "px-2.5 py-1.5 gap-2 text-xs leading-normal",
        medium: "px-3 py-1.5 gap-2 text-sm leading-normal",
        large: "px-3 py-2 gap-2.5 text-base leading-normal",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    iconPx: 14,
    actionBtnPx: 20,
    inputClass: "text-xs leading-normal",
  },
  medium: {
    iconPx: 16,
    actionBtnPx: 22,
    inputClass: "text-sm leading-normal",
  },
  large: {
    iconPx: 18,
    actionBtnPx: 24,
    inputClass: "text-base leading-normal",
  },
} as const;

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'defaultValue' | 'onChange'>,
    VariantProps<typeof searchWrapperVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  clearable?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  wrapperClassName?: string;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  bottomBorderColor?: string;
  textColor?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      wrapperClassName,
      value,
      defaultValue = '',
      onValueChange,
      onDebouncedChange,
      onSearch,
      debounceMs = 300,
      placeholder = 'Search...',
      clearable = true,
      loading = false,
      disabled = false,
      readOnly = false,
      size = 'medium',
      bgColor,
      borderColor,
      bottomBorderColor,
      textColor,
      style,
      id,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const innerInputRef = useRef<HTMLInputElement | null>(null);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(defaultValue);

    useEffect(() => {
      if (!isControlled) {
        setInternalValue(defaultValue);
      }
    }, [defaultValue, isControlled]);

    const currentValue = isControlled ? (value ?? '') : internalValue;
    const metrics = sizeConfig[size || 'medium'];
    const canInteract = !disabled && !readOnly;
    const showClearButton = clearable && canInteract && currentValue.length > 0;

    useEffect(() => {
      if (!onDebouncedChange) return;
      const timer = window.setTimeout(() => {
        onDebouncedChange(currentValue);
      }, Math.max(0, debounceMs));

      return () => window.clearTimeout(timer);
    }, [currentValue, debounceMs, onDebouncedChange]);

    const assignRef = (node: HTMLInputElement | null) => {
      innerInputRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    const updateValue = (nextVal: string) => {
      if (!isControlled) {
        setInternalValue(nextVal);
      }
      onValueChange?.(nextVal);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canInteract) return;
      updateValue(e.target.value);
    };

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!canInteract) return;
      updateValue('');
      onSearch?.('');
      innerInputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && canInteract) {
        onSearch?.(currentValue);
      } else if (e.key === 'Escape' && canInteract && currentValue.length > 0) {
        e.preventDefault();
        updateValue('');
        onSearch?.('');
      }
      onKeyDown?.(e);
    };

    return (
      <div
        onClick={() => {
          if (!disabled) innerInputRef.current?.focus();
        }}
        style={{
          backgroundColor: bgColor || undefined,
          borderColor: borderColor || undefined,
          borderBottomColor: bottomBorderColor || borderColor || undefined,
          ...style,
        }}
        className={cn(
          searchWrapperVariants({ size }),
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-text',
          wrapperClassName
        )}
      >
        <SearchIcon
          sizePx={metrics.iconPx}
          color={textColor || undefined}
        />

        <input
          ref={assignRef}
          id={inputId}
          type="text"
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={textColor ? { color: textColor } : undefined}
          className={cn(
            'flex-1 min-w-0 w-full bg-transparent outline-none',
            metrics.inputClass,
            !textColor && 'text-black dark:text-zinc-100 placeholder:text-[#888888] dark:placeholder:text-zinc-500',
            textColor && 'placeholder:opacity-65',
            disabled && 'cursor-not-allowed',
            className
          )}
          {...props}
        />

        {loading && (
          <span
            aria-label="Searching"
            className="inline-flex items-center justify-center shrink-0 text-[#555555] dark:text-zinc-400"
            style={textColor ? { color: textColor } : undefined}
          >
            <LoadingSpinner sizePx={metrics.iconPx} color={textColor || undefined} />
          </span>
        )}

        {showClearButton && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            style={{
              width: `${metrics.actionBtnPx}px`,
              height: `${metrics.actionBtnPx}px`,
              color: textColor || undefined,
            }}
            className={cn(
              'inline-flex items-center justify-center shrink-0 rounded transition-colors cursor-pointer',
              'hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white',
              !textColor && 'text-[#555555] dark:text-zinc-400'
            )}
          >
            <ClearIcon sizePx={Math.max(12, metrics.iconPx - 2)} color={textColor || undefined} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';