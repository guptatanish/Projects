import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const toggleWrapperVariants = cva(
  "inline-flex items-start max-w-full select-none",
  {
    variants: {
      size: {
        small: "text-xs leading-normal gap-2.5",
        medium: "text-sm leading-normal gap-3",
        large: "text-base leading-normal gap-3.5",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    trackWidthPx: 34,
    trackHeightPx: 18,
    thumbPx: 12,
    paddingPx: 3,
    labelClass: "text-xs font-medium leading-normal",
    descClass: "text-[11px] leading-snug",
  },
  medium: {
    trackWidthPx: 42,
    trackHeightPx: 22,
    thumbPx: 16,
    paddingPx: 3,
    labelClass: "text-sm font-medium leading-normal",
    descClass: "text-xs leading-snug",
  },
  large: {
    trackWidthPx: 50,
    trackHeightPx: 26,
    thumbPx: 20,
    paddingPx: 3,
    labelClass: "text-base font-medium leading-normal",
    descClass: "text-xs leading-snug",
  },
} as const;

export type ToggleLabelPosition = 'right' | 'left';
export type ToggleSize = 'small' | 'medium' | 'large';

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'defaultChecked'>,
    VariantProps<typeof toggleWrapperVariants> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  labelPosition?: ToggleLabelPosition;
  size?: ToggleSize;
  readOnly?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  checkedBgColor?: string;
  uncheckedBgColor?: string;
  thumbColor?: string;
  borderColor?: string;
  textColor?: string;
  focusRingColor?: string;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onChange,
      label,
      description,
      labelPosition = 'right',
      size = 'medium',
      disabled = false,
      readOnly = false,
      checkedBgColor,
      uncheckedBgColor,
      thumbColor,
      borderColor,
      textColor,
      focusRingColor,
      style,
      id,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const switchId = id || `${uid}-toggle`;
    const descId = `${uid}-desc`;
    const resolvedSize: ToggleSize = size ?? 'medium';
    const resolvedLabelPos: ToggleLabelPosition = labelPosition ?? 'right';
    const metrics = sizeConfig[resolvedSize];
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState<boolean>(Boolean(defaultChecked));

    useEffect(() => {
      if (!isControlled) {
        setInternalChecked(Boolean(defaultChecked));
      }
    }, [defaultChecked, isControlled]);

    const isChecked = isControlled ? Boolean(checked) : internalChecked;
    const canInteract = !disabled && !readOnly;

    const handleToggle = () => {
      if (!canInteract) return;
      const next = !isChecked;
      if (!isControlled) {
        setInternalChecked(next);
      }
      onChange?.(next);
    };

    const trackBg = isChecked
      ? checkedBgColor || '#111111'
      : uncheckedBgColor || '#d4d4d4';

    const trackBorder = borderColor
      ? `1px solid ${borderColor}`
      : isChecked
        ? `1px solid ${checkedBgColor || '#111111'}`
        : `1px solid ${uncheckedBgColor || '#c4c4c4'}`;

    const thumbTranslateX = isChecked
      ? metrics.trackWidthPx - metrics.thumbPx - metrics.paddingPx * 2
      : 0;

    const ringStyle: React.CSSProperties =
      isFocused && !disabled
        ? {
            boxShadow: `0 0 0 2px #ffffff, 0 0 0 4px ${focusRingColor || '#111111'}`,
          }
        : {};

    const switchButton = (
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        aria-label={!label ? ariaLabel || 'Toggle switch' : ariaLabel}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={handleToggle}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        style={{
          width: `${metrics.trackWidthPx}px`,
          height: `${metrics.trackHeightPx}px`,
          padding: `${metrics.paddingPx}px`,
          backgroundColor: trackBg,
          border: trackBorder,
          borderRadius: '9999px',
          display: 'inline-flex',
          alignItems: 'center',
          flexShrink: 0,
          transition: 'background-color 160ms ease, border-color 160ms ease',
          ...ringStyle,
          ...style,
        }}
        className={cn(
          'outline-none',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : readOnly
              ? 'cursor-default'
              : 'cursor-pointer',
          className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          style={{
            width: `${metrics.thumbPx}px`,
            height: `${metrics.thumbPx}px`,
            borderRadius: '9999px',
            backgroundColor: thumbColor || '#ffffff',
            transform: `translateX(${thumbTranslateX}px)`,
            transition: 'transform 160ms ease, background-color 160ms ease',
            display: 'block',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    );

    const textBlock =
      label || description ? (
        <div
          onClick={() => {
            if (canInteract) {
              handleToggle();
            }
          }}
          style={{
            paddingTop: `${Math.max(0, Math.round((metrics.trackHeightPx - 20) / 2))}px`,
          }}
          className={cn(
            'min-w-0 flex-1 flex flex-col gap-0.5',
            disabled ? 'opacity-50 cursor-not-allowed' : canInteract ? 'cursor-pointer' : 'cursor-default'
          )}
        >
          {label && (
            <span
              style={{ color: textColor || undefined }}
              className={cn(
                metrics.labelClass,
                'break-words',
                !textColor && 'text-black dark:text-zinc-100'
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              id={descId}
              style={{ color: textColor || undefined }}
              className={cn(
                metrics.descClass,
                'break-words',
                !textColor && 'text-[#666666] dark:text-zinc-400'
              )}
            >
              {description}
            </span>
          )}
        </div>
      ) : null;

    return (
      <div className={cn(toggleWrapperVariants({ size: resolvedSize }))}>
        {resolvedLabelPos === 'left' && textBlock}
        {switchButton}
        {resolvedLabelPos === 'right' && textBlock}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';