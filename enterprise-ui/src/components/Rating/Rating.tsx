import React, { useEffect, useId, useState } from 'react';
import { cn } from '../../utils/cn';

const StarGlyph = ({
  sizePx,
  fill,
  stroke,
}: {
  sizePx: number;
  fill: string;
  stroke: string;
}) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const sizeConfig = {
  small: {
    iconPx: 16,
    gapPx: 4,
    labelClass: 'text-xs',
  },
  medium: {
    iconPx: 22,
    gapPx: 6,
    labelClass: 'text-sm',
  },
  large: {
    iconPx: 28,
    gapPx: 8,
    labelClass: 'text-base',
  },
} as const;

export interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  max?: number;
  allowHalf?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  showValue?: boolean;
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  activeColor?: string;
  inactiveColor?: string;
  hoverColor?: string;
  textColor?: string;
}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      className,
      value,
      defaultValue = 0,
      onValueChange,
      max = 5,
      allowHalf = false,
      readOnly = false,
      disabled = false,
      clearable = true,
      showValue = false,
      size = 'medium',
      icon,
      activeColor,
      inactiveColor,
      hoverColor,
      textColor,
      style,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const groupId = useId();
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<number>(defaultValue);
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    useEffect(() => {
      if (!isControlled) {
        setInternalValue(defaultValue);
      }
    }, [defaultValue, isControlled]);

    const safeMax = Math.max(1, Math.floor(max));
    const step = allowHalf ? 0.5 : 1;

    const clampRating = (val: number) => {
      const clamped = Math.min(Math.max(val, 0), safeMax);
      if (allowHalf) {
        return Math.round(clamped * 2) / 2;
      }
      return Math.round(clamped);
    };

    const currentValue = clampRating(isControlled ? (value ?? 0) : internalValue);
    const displayValue = hoverValue !== null ? hoverValue : currentValue;
    const isInteractive = !readOnly && !disabled;
    const metrics = sizeConfig[size || 'medium'];

    const commitValue = (nextVal: number) => {
      const normalized = clampRating(nextVal);
      if (!isControlled) {
        setInternalValue(normalized);
      }
      onValueChange?.(normalized);
    };

    const handleSelect = (candidate: number) => {
      if (!isInteractive) return;
      const normalized = clampRating(candidate);
      if (clearable && normalized === currentValue) {
        commitValue(0);
      } else {
        commitValue(normalized);
      }
    };

    const getPointerRating = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
      if (!allowHalf) return index + 1;
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const isLeftHalf = relativeX <= rect.width / 2;
      return isLeftHalf ? index + 0.5 : index + 1;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        commitValue(currentValue + step);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        commitValue(currentValue - step);
      } else if (e.key === 'Home') {
        e.preventDefault();
        commitValue(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        commitValue(safeMax);
      }
    };

    const resolvedActive = hoverValue !== null && hoverColor
      ? hoverColor
      : activeColor || '#f59e0b';

    const resolvedInactive = inactiveColor || 'transparent';
    const resolvedStroke = hoverValue !== null && hoverColor
      ? hoverColor
      : activeColor || '#d97706';

    const getFillRatio = (index: number): number => {
      const itemStart = index;
      const itemEnd = index + 1;
      if (displayValue >= itemEnd) return 1;
      if (displayValue <= itemStart) return 0;
      return Math.min(Math.max(displayValue - itemStart, 0), 1);
    };

    return (
      <div
        ref={ref}
        role={readOnly ? 'img' : 'radiogroup'}
        aria-label={ariaLabel || (readOnly ? `Rating: ${currentValue} out of ${safeMax}` : 'Rating')}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHoverValue(null)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: `${metrics.gapPx * 2}px`,
          ...style,
        }}
        className={cn(
          'flex-wrap select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: `${metrics.gapPx}px`,
          }}
          className="flex-wrap"
        >
          {Array.from({ length: safeMax }, (_, index) => {
            const fillRatio = getFillRatio(index);
            const itemValue = index + 1;
            const isItemChecked = allowHalf
              ? currentValue === itemValue || currentValue === itemValue - 0.5
              : currentValue === itemValue;

            const renderGlyph = (fillHex: string, strokeHex: string) => {
              if (icon) {
                return (
                  <span
                    style={{
                      width: `${metrics.iconPx}px`,
                      height: `${metrics.iconPx}px`,
                      color: fillHex !== 'transparent' ? fillHex : undefined,
                    }}
                    className="inline-flex items-center justify-center shrink-0"
                  >
                    {icon}
                  </span>
                );
              }
              return (
                <StarGlyph
                  sizePx={metrics.iconPx}
                  fill={fillHex}
                  stroke={strokeHex}
                />
              );
            };

            return (
              <button
                key={`${groupId}-star-${index}`}
                type="button"
                role={readOnly ? undefined : 'radio'}
                aria-checked={readOnly ? undefined : isItemChecked}
                aria-label={
                  allowHalf
                    ? `${index + 0.5} or ${itemValue} out of ${safeMax}`
                    : `${itemValue} out of ${safeMax}`
                }
                disabled={!isInteractive}
                tabIndex={!isInteractive ? -1 : index === 0 || isItemChecked ? 0 : -1}
                onMouseMove={(e) => {
                  if (!isInteractive) return;
                  setHoverValue(getPointerRating(e, index));
                }}
                onClick={(e) => {
                  if (!isInteractive) return;
                  handleSelect(getPointerRating(e, index));
                }}
                style={{
                  width: `${metrics.iconPx}px`,
                  height: `${metrics.iconPx}px`,
                }}
                className={cn(
                  'relative inline-flex items-center justify-center p-0 border-0 bg-transparent shrink-0 transition-transform',
                  isInteractive && 'cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950 rounded-sm',
                  readOnly && 'cursor-default',
                  disabled && 'cursor-not-allowed'
                )}
              >
                {/* Base / Unfilled Star */}
                {renderGlyph(resolvedInactive, fillRatio > 0 ? resolvedStroke : '#9ca3af')}

                {/* Filled / Partial Overlay */}
                {fillRatio > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      width: `${fillRatio * 100}%`,
                    }}
                    className="absolute inset-y-0 left-0 overflow-hidden inline-flex items-center justify-start pointer-events-none"
                  >
                    {renderGlyph(resolvedActive, resolvedStroke)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showValue && (
          <span
            style={textColor ? { color: textColor } : undefined}
            className={cn(
              'font-medium tabular-nums',
              metrics.labelClass,
              !textColor && 'text-black dark:text-zinc-100'
            )}
          >
            {displayValue} / {safeMax}
          </span>
        )}
      </div>
    );
  }
);

Rating.displayName = 'Rating';