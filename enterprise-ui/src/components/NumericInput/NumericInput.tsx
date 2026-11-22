import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Icons ---
const PlusIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MinusIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// --- Variants ---
// FIXED: Locked width strictly to w-32 to match your red rectangle perfectly
const wrapperVariants = cva(
  "flex w-32 items-center justify-between rounded-none border-0 border-b-2 border-[#888888] bg-[#E5E5E5] transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden",
  {
    variants: {
      size: {
        small: "px-2 py-1 text-xs leading-normal gap-1",
        medium: "px-2 py-1.5 text-sm leading-normal gap-1",
        large: "px-3 py-2.5 text-base leading-normal gap-2",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed",
        false: "cursor-text",
      },
    },
    defaultVariants: {
      size: "medium",
      disabled: false,
    },
  }
);

export interface NumericInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>, VariantProps<typeof wrapperVariants> {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  allowDecimals?: boolean;
  precision?: number;
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  showSteppers?: boolean;
  disabled?: boolean;

  inputBg?: string;
  stepperBg?: string;
  stepperHoverBg?: string;
  borderColor?: string;
  bottomBorderColor?: string;
  textColor?: string;
}

export const NumericInput = React.forwardRef<HTMLDivElement, NumericInputProps>(
  ({
    className,
    value,
    onValueChange,
    min,
    max,
    step = 1,
    allowDecimals = true,
    precision,
    placeholder,
    prefix,
    suffix,
    showSteppers = true,
    size = "medium",
    disabled = false,
    inputBg,
    stepperBg,
    stepperHoverBg,
    borderColor,
    bottomBorderColor,
    textColor,
    style,
    ...props
  }, ref) => {
    const [inputValue, setInputValue] = useState<string>(value !== undefined ? String(value) : '0');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value !== undefined && value !== parseFloat(inputValue)) {
        setInputValue(String(value));
      }
    }, [value]);

    const clamp = useCallback((val: number) => {
      let result = val;
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      return result;
    }, [min, max]);

    const formatToPrecision = useCallback((val: number) => {
      if (!allowDecimals) return Math.round(val);
      if (precision !== undefined) return parseFloat(val.toFixed(precision));
      return val;
    }, [allowDecimals, precision]);

    const triggerChange = useCallback((newVal: number | undefined) => {
      if (newVal === undefined) {
        setInputValue('');
        onValueChange?.(undefined);
        return;
      }
      const clamped = clamp(newVal);
      const formatted = formatToPrecision(clamped);
      setInputValue(String(formatted));
      onValueChange?.(formatted);
    }, [clamp, formatToPrecision, onValueChange]);

    const handleIncrement = () => {
      if (disabled) return;
      const current = parseFloat(inputValue) || 0;
      triggerChange(current + step);
    };

    const handleDecrement = () => {
      if (disabled) return;
      const current = parseFloat(inputValue) || 0;
      triggerChange(current - step);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      
      if (val === '') {
        setInputValue('');
        onValueChange?.(undefined);
        return;
      }

      const regex = allowDecimals ? /^-?\d*\.?\d*$/ : /^-?\d*$/;
      if (regex.test(val)) {
        setInputValue(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) {
          onValueChange?.(parsed);
        }
      }
    };

    const handleBlur = () => {
      if (inputValue === '' || inputValue === '-' || inputValue === '.') {
        triggerChange(undefined);
        return;
      }
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        triggerChange(parsed);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrement();
      }
    };

    const customStyle = {
      ...style,
      ...(inputBg ? { '--ni-bg': inputBg } : {}),
      ...(stepperBg ? { '--ni-stepper-bg': stepperBg } : {}),
      ...(stepperHoverBg ? { '--ni-stepper-hover': stepperHoverBg } : {}),
      ...(borderColor ? { '--ni-border': borderColor } : {}),
      ...(bottomBorderColor ? { '--ni-bottom-border': bottomBorderColor } : {}),
      ...(textColor ? { '--ni-text': textColor } : {}),
    } as React.CSSProperties;

    return (
      <div 
        ref={ref}
        style={customStyle}
        className={cn(
          wrapperVariants({ size, disabled }),
          inputBg && "bg-[var(--ni-bg)] dark:bg-[var(--ni-bg)]",
          bottomBorderColor 
            ? "border-b-[var(--ni-bottom-border)] dark:border-b-[var(--ni-bottom-border)]" 
            : (borderColor && "border-b-[var(--ni-border)] dark:border-b-[var(--ni-border)]"),
          textColor && "text-[var(--ni-text)] dark:text-[var(--ni-text)]",
          className
        )}
        onClick={() => inputRef.current?.focus()}
        {...props}
      >
        {showSteppers && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (min !== undefined && (parseFloat(inputValue) || 0) <= min)}
            onClick={(e) => { e.stopPropagation(); handleDecrement(); }}
            className={cn(
              "flex items-center shrink-0 justify-center transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed mr-1",
              size === 'small' ? 'w-5 h-5 rounded' : size === 'medium' ? 'w-6 h-6 rounded-md' : 'w-7 h-7 rounded-md',
              stepperBg ? "bg-[var(--ni-stepper-bg)]" : "bg-black/10 dark:bg-white/10",
              stepperHoverBg ? "hover:bg-[var(--ni-stepper-hover)]" : "hover:bg-black/20 dark:hover:bg-white/20"
            )}
          >
            <MinusIcon className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />
          </button>
        )}

        {prefix && (
          <span className="shrink-0 text-[#888888] dark:text-zinc-400 font-medium select-none">
            {prefix}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          inputMode={allowDecimals ? "decimal" : "numeric"}
          disabled={disabled}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          // FIXED: Removed w-full which was forcing the component to stretch in some flex layouts
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none text-center",
            textColor ? "placeholder:text-[var(--ni-text)] opacity-70" : "placeholder:text-[#888888] dark:placeholder:text-zinc-500"
          )}
        />

        {suffix && (
          <span className="shrink-0 text-[#888888] dark:text-zinc-400 font-medium select-none">
            {suffix}
          </span>
        )}

        {showSteppers && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (max !== undefined && (parseFloat(inputValue) || 0) >= max)}
            onClick={(e) => { e.stopPropagation(); handleIncrement(); }}
            className={cn(
              "flex items-center shrink-0 justify-center transition-colors focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed ml-1",
              size === 'small' ? 'w-5 h-5 rounded' : size === 'medium' ? 'w-6 h-6 rounded-md' : 'w-7 h-7 rounded-md',
              stepperBg ? "bg-[var(--ni-stepper-bg)]" : "bg-black/10 dark:bg-white/10",
              stepperHoverBg ? "hover:bg-[var(--ni-stepper-hover)]" : "hover:bg-black/20 dark:hover:bg-white/20"
            )}
          >
            <PlusIcon className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />
          </button>
        )}
      </div>
    );
  }
);

NumericInput.displayName = "NumericInput";