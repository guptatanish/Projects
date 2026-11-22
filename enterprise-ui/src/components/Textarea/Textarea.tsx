import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textareaControlVariants = cva(
  "w-full rounded-md border transition-colors leading-normal outline-none",
  {
    variants: {
      size: {
        small: "text-xs",
        medium: "text-sm",
        large: "text-base",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    padStyle: { padding: '8px 12px' } as React.CSSProperties,
    lineHeightPx: 18,
    labelClass: "text-xs leading-normal",
    helperClass: "text-[11px] leading-normal",
  },
  medium: {
    padStyle: { padding: '10px 14px' } as React.CSSProperties,
    lineHeightPx: 21,
    labelClass: "text-sm leading-normal",
    helperClass: "text-xs leading-normal",
  },
  large: {
    padStyle: { padding: '12px 16px' } as React.CSSProperties,
    lineHeightPx: 24,
    labelClass: "text-base leading-normal",
    helperClass: "text-xs leading-normal",
  },
} as const;

export type TextareaResizeMode = 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'defaultValue'>,
    VariantProps<typeof textareaControlVariants> {
  label?: string;
  helperText?: string;
  error?: boolean | string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onValueChange?: (value: string) => void;
  rows?: number;
  maxRows?: number;
  resize?: TextareaResizeMode;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  focusBorderColor?: string;
  textColor?: string;
  placeholderColor?: string;
  errorColor?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error = false,
      value,
      defaultValue,
      onChange,
      onValueChange,
      rows = 4,
      maxRows,
      resize = 'vertical',
      size = 'medium',
      showCount = false,
      maxLength,
      disabled = false,
      readOnly = false,
      required = false,
      bgColor,
      borderColor,
      focusBorderColor,
      textColor,
      placeholderColor,
      errorColor,
      style,
      id,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const textareaId = id || uid;
    const helperId = `${uid}-helper`;
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const safeRows = Math.max(1, Math.floor(rows));
    const resolvedResize: TextareaResizeMode = resize ?? 'vertical';
    const metrics = sizeConfig[size || 'medium'];

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(
      defaultValue !== undefined ? String(defaultValue) : ''
    );

    useEffect(() => {
      if (!isControlled && defaultValue !== undefined) {
        setInternalValue(String(defaultValue));
      }
    }, [defaultValue, isControlled]);

    const currentValue = isControlled ? String(value ?? '') : internalValue;

    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' && error.trim().length > 0 ? error : undefined;
    const resolvedErrorColor = errorColor || '#dc2626';

    const setRefs = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      }
    };

    const adjustAutoHeight = () => {
      const el = innerRef.current;
      if (!el || resolvedResize !== 'auto') return;
      el.style.height = 'auto';
      const verticalPadding =
        parseFloat(String(metrics.padStyle.paddingTop || '10')) +
        parseFloat(String(metrics.padStyle.paddingBottom || '10'));
      const minHeight = safeRows * metrics.lineHeightPx + verticalPadding + 4;
      const maxHeight =
        maxRows && maxRows > 0
          ? Math.max(minHeight, Math.floor(maxRows) * metrics.lineHeightPx + verticalPadding + 4)
          : Infinity;
      const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
      el.style.height = `${nextHeight}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    useLayoutEffect(() => {
      adjustAutoHeight();
    }, [currentValue, resolvedResize, safeRows, maxRows, size]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextVal = e.target.value;
      if (!isControlled) {
        setInternalValue(nextVal);
      }
      onChange?.(e);
      onValueChange?.(nextVal);
    };

    const getCssResize = (): React.CSSProperties['resize'] => {
      if (resolvedResize === 'auto' || resolvedResize === 'none') return 'none';
      return resolvedResize;
    };

    const computedBorderColor = hasError
      ? resolvedErrorColor
      : isFocused
        ? focusBorderColor || '#111111'
        : borderColor || '#d4d4d4';

    const showBottomRow = Boolean(errorMessage || helperText || showCount);
    const charCount = currentValue.length;
    const isNearLimit = maxLength !== undefined && charCount >= maxLength;

    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label
            htmlFor={textareaId}
            style={{ color: textColor || undefined }}
            className={cn(
              'font-medium select-none',
              metrics.labelClass,
              disabled && 'opacity-50',
              !textColor && 'text-black dark:text-zinc-100'
            )}
          >
            {label}
            {required && (
              <span
                style={{ color: hasError ? resolvedErrorColor : '#dc2626' }}
                className="ml-1"
                aria-hidden="true"
              >
                *
              </span>
            )}
          </label>
        )}

        {placeholderColor && (
          <style>{`#${CSS.escape(textareaId)}::placeholder { color: ${placeholderColor}; opacity: 1; }`}</style>
        )}

        <textarea
          ref={setRefs}
          id={textareaId}
          rows={safeRows}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          value={currentValue}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          aria-label={!label ? ariaLabel || 'Textarea' : ariaLabel}
          aria-invalid={hasError || undefined}
          aria-describedby={showBottomRow ? helperId : undefined}
          style={{
            ...metrics.padStyle,
            resize: getCssResize(),
            backgroundColor: bgColor || undefined,
            borderColor: computedBorderColor,
            color: textColor || undefined,
            ...style,
          }}
          className={cn(
            textareaControlVariants({ size }),
            !bgColor &&
              (disabled
                ? 'bg-[#f4f4f5] dark:bg-zinc-900'
                : 'bg-white dark:bg-zinc-950'),
            !textColor && 'text-black dark:text-zinc-100 placeholder:text-[#888888] dark:placeholder:text-zinc-500',
            disabled
              ? 'opacity-55 cursor-not-allowed'
              : readOnly
                ? 'cursor-default'
                : 'cursor-text',
            isFocused &&
              !hasError &&
              !focusBorderColor &&
              'ring-2 ring-black/15 dark:ring-white/20',
            hasError && 'ring-2 ring-red-500/15',
            className
          )}
          {...props}
        />

        {showBottomRow && (
          <div id={helperId} className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {errorMessage ? (
                <p
                  style={{ color: resolvedErrorColor }}
                  className={cn('font-medium', metrics.helperClass)}
                >
                  {errorMessage}
                </p>
              ) : helperText ? (
                <p
                  style={{ color: textColor || undefined }}
                  className={cn(
                    metrics.helperClass,
                    disabled && 'opacity-50',
                    !textColor && 'text-[#666666] dark:text-zinc-400'
                  )}
                >
                  {helperText}
                </p>
              ) : null}
            </div>

            {showCount && (
              <span
                style={{
                  color: isNearLimit
                    ? resolvedErrorColor
                    : textColor || undefined,
                }}
                className={cn(
                  'shrink-0 tabular-nums',
                  metrics.helperClass,
                  !isNearLimit && !textColor && 'text-[#737373] dark:text-zinc-400'
                )}
              >
                {maxLength !== undefined ? `${charCount} / ${maxLength}` : charCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';