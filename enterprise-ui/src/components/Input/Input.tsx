import React, { useState, useRef, useImperativeHandle, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputWrapperVariants = cva(
  "flex items-center w-full rounded-none border-0 border-b-2 border-[#888888] bg-[#E5E5E5] px-3 text-sm transition-colors focus-within:outline-none focus-within:border-primary",
  {
    variants: {
      inputSize: {
        xsmall: "h-7 text-xs",
        small: "h-8 text-xs",
        medium: "h-10 text-sm",
        large: "h-12 text-base",
        xlarge: "h-14 text-lg",
      },
      validationState: {
        default: "",
        invalid: "border-destructive focus-within:border-destructive",
        valid: "border-green-600 focus-within:border-green-600",
        info: "border-blue-500 focus-within:border-blue-500",
      },
      isDisabled: {
        true: "opacity-50 cursor-not-allowed bg-gray-200",
      }
    },
    defaultVariants: {
      inputSize: "medium",
      validationState: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: "xsmall" | "small" | "medium" | "large" | "xlarge";
  invalid?: boolean;
  valid?: boolean;
  info?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  isClearable?: boolean;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputSize = "medium",
      invalid,
      valid,
      info,
      startAdornment,
      endAdornment,
      isClearable,
      isLoading,
      type = "text",
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      inputRef: externalRef,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value || defaultValue));
    
    const internalRef = useRef<HTMLInputElement>(null);
    
    useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);
    useImperativeHandle(externalRef, () => internalRef.current as HTMLInputElement);

    // Sync state if the value is controlled externally by a parent component
    useEffect(() => {
      if (value !== undefined) {
        setHasValue(String(value).length > 0);
      }
    }, [value]);

    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;
    const validationState = invalid ? "invalid" : valid ? "valid" : info ? "info" : "default";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      if (onChange) onChange(e);
    };

    const handleClear = () => {
      if (internalRef.current) {
        internalRef.current.value = "";
        setHasValue(false);
        const event = Object.create(new Event('input', { bubbles: true }));
        Object.defineProperty(event, 'target', { value: internalRef.current, writable: false });
        if (onChange) onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    };

    return (
      <div className={cn(inputWrapperVariants({ inputSize, validationState, isDisabled: disabled }), className)}>
        
        {startAdornment && <div className="mr-2 flex items-center text-muted-foreground">{startAdornment}</div>}
        
        <input
          ref={internalRef}
          type={currentType}
          disabled={disabled || isLoading}
          readOnly={readOnly}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          className="flex-1 bg-transparent border-none outline-none p-0 text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed min-w-0"
          {...props}
        />

        <div className="ml-2 flex items-center gap-2 text-muted-foreground">
          {isClearable && hasValue && !disabled && !readOnly && (
            <button type="button" onClick={handleClear} className="hover:text-foreground focus:outline-none" aria-label="Clear input">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}

          {isPassword && !disabled && (
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-foreground focus:outline-none" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          )}

          {isLoading && (
            <svg className="animate-spin text-primary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          )}

          {endAdornment && <div className="flex items-center">{endAdornment}</div>}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";