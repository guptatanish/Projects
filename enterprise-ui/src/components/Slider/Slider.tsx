import React, { useEffect, useId, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const sliderRootVariants = cva(
  "w-full select-none",
  {
    variants: {
      size: {
        small: "text-xs leading-normal",
        medium: "text-sm leading-normal",
        large: "text-base leading-normal",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    trackHeightPx: 4,
    thumbPx: 14,
    hitAreaPx: 24,
    tickDotPx: 6,
    labelClass: "text-xs leading-normal",
  },
  medium: {
    trackHeightPx: 6,
    thumbPx: 18,
    hitAreaPx: 28,
    tickDotPx: 8,
    labelClass: "text-sm leading-normal",
  },
  large: {
    trackHeightPx: 8,
    thumbPx: 22,
    hitAreaPx: 32,
    tickDotPx: 10,
    labelClass: "text-base leading-normal",
  },
} as const;

export interface SliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>,
    VariantProps<typeof sliderRootVariants> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'small' | 'medium' | 'large';
  showMinMax?: boolean;
  showTicks?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  readOnly?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
  textColor?: string;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      size = 'medium',
      showMinMax = false,
      showTicks = false,
      formatValue,
      disabled = false,
      readOnly = false,
      trackColor,
      fillColor,
      thumbColor,
      textColor,
      style,
      id,
      'aria-label': ariaLabel = 'Slider',
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const sliderId = id || uid;
    const trackRef = useRef<HTMLDivElement | null>(null);
    const thumbRef = useRef<HTMLDivElement | null>(null);

    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) && max > safeMin ? max : safeMin + 100;
    const safeStep = Number.isFinite(step) && step > 0 ? step : 1;

    const getDecimalPlaces = (num: number): number => {
      const str = String(num);
      if (str.includes('e-')) {
        const exp = parseInt(str.split('e-')[1], 10);
        return Number.isFinite(exp) ? exp : 0;
      }
      const parts = str.split('.');
      return parts[1] ? parts[1].length : 0;
    };

    const decimals = Math.max(getDecimalPlaces(safeStep), getDecimalPlaces(safeMin));

    const roundToStep = (raw: number): number => {
      const clamped = Math.min(Math.max(raw, safeMin), safeMax);
      const stepsFromMin = Math.round((clamped - safeMin) / safeStep);
      const stepped = safeMin + stepsFromMin * safeStep;
      const finalClamped = Math.min(Math.max(stepped, safeMin), safeMax);
      return Number(finalClamped.toFixed(decimals));
    };

    const fallbackInitial =
      defaultValue !== undefined
        ? roundToStep(defaultValue)
        : roundToStep(safeMin + (safeMax - safeMin) / 2);

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<number>(fallbackInitial);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    useEffect(() => {
      if (!isControlled) {
        setInternalValue((prev) => roundToStep(prev));
      }
    }, [safeMin, safeMax, safeStep, isControlled]);

    useEffect(() => {
      if (!isControlled && defaultValue !== undefined) {
        setInternalValue(roundToStep(defaultValue));
      }
    }, [defaultValue, isControlled, safeMin, safeMax, safeStep]);

    const currentValue = roundToStep(isControlled ? (value ?? safeMin) : internalValue);
    const canInteract = !disabled && !readOnly;
    const metrics = sizeConfig[size || 'medium'];

    const ratio =
      safeMax === safeMin ? 0 : Math.min(Math.max((currentValue - safeMin) / (safeMax - safeMin), 0), 1);
    const percentage = ratio * 100;

    const commitValue = (nextRaw: number) => {
      if (!canInteract) return;
      const nextVal = roundToStep(nextRaw);
      if (!isControlled) {
        setInternalValue(nextVal);
      }
      if (nextVal !== currentValue) {
        onValueChange?.(nextVal);
      }
    };

    const getValueFromClientX = (clientX: number): number => {
      const el = trackRef.current;
      if (!el) return currentValue;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return currentValue;
      const posRatio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      return safeMin + posRatio * (safeMax - safeMin);
    };

    const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canInteract) return;
      e.preventDefault();
      thumbRef.current?.focus();
      setIsDragging(true);
      commitValue(getValueFromClientX(e.clientX));
    };

    useEffect(() => {
      if (!isDragging) return;

      const handlePointerMove = (e: PointerEvent) => {
        if (!canInteract) return;
        commitValue(getValueFromClientX(e.clientX));
      };

      const handlePointerUp = () => {
        setIsDragging(false);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    }, [isDragging, canInteract, currentValue, safeMin, safeMax, safeStep]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!canInteract) return;
      const largeStep = Math.max(safeStep, (safeMax - safeMin) / 10);

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          commitValue(currentValue + safeStep);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          commitValue(currentValue - safeStep);
          break;
        case 'PageUp':
          e.preventDefault();
          commitValue(currentValue + largeStep);
          break;
        case 'PageDown':
          e.preventDefault();
          commitValue(currentValue - largeStep);
          break;
        case 'Home':
          e.preventDefault();
          commitValue(safeMin);
          break;
        case 'End':
          e.preventDefault();
          commitValue(safeMax);
          break;
        default:
          break;
      }
    };

    const totalTicks = Math.floor((safeMax - safeMin) / safeStep);
    const tickValues: number[] =
      showTicks && totalTicks > 0 && totalTicks <= 50
        ? Array.from({ length: totalTicks + 1 }, (_, i) =>
            Number(Math.min(safeMax, safeMin + i * safeStep).toFixed(decimals))
          )
        : [];

    const displayValue = formatValue ? formatValue(currentValue) : String(currentValue);
    const displayMin = formatValue ? formatValue(safeMin) : String(safeMin);
    const displayMax = formatValue ? formatValue(safeMax) : String(safeMax);

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          sliderRootVariants({ size }),
          disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          style={{
            minHeight: `${metrics.hitAreaPx}px`,
            cursor: disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer',
          }}
          className="relative flex w-full items-center touch-none"
        >
          {/* Base Track */}
          <div
            style={{
              height: `${metrics.trackHeightPx}px`,
              backgroundColor: trackColor || undefined,
            }}
            className={cn(
              'relative w-full rounded-full overflow-visible',
              !trackColor && 'bg-[#d4d4d4] dark:bg-zinc-700'
            )}
          >
            {/* Active Fill */}
            <div
              style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: fillColor || undefined,
              }}
              className={cn(
                'rounded-full',
                !isDragging && 'transition-[width] duration-75',
                !fillColor && 'bg-black dark:bg-white'
              )}
            />

            {/* Optional Tick Dots */}
            {tickValues.length > 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center">
                {tickValues.map((tickVal) => {
                  const tickPct =
                    safeMax === safeMin ? 0 : ((tickVal - safeMin) / (safeMax - safeMin)) * 100;
                  const isReached = tickVal <= currentValue;
                  return (
                    <span
                      key={`${uid}-tick-${tickVal}`}
                      style={{
                        left: `${tickPct}%`,
                        transform: 'translate(-50%, -50%)',
                        top: '50%',
                        width: `${metrics.tickDotPx}px`,
                        height: `${metrics.tickDotPx}px`,
                        borderRadius: '9999px',
                      }}
                      className={cn(
                        'absolute block',
                        isReached
                          ? 'bg-white dark:bg-zinc-950 ring-1 ring-black/30 dark:ring-white/30'
                          : 'bg-[#737373] dark:bg-zinc-400'
                      )}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Thumb */}
          <div
            ref={thumbRef}
            id={sliderId}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={ariaLabel}
            aria-valuemin={safeMin}
            aria-valuemax={safeMax}
            aria-valuenow={currentValue}
            aria-valuetext={displayValue}
            aria-disabled={disabled || undefined}
            aria-readonly={readOnly || undefined}
            onKeyDown={handleKeyDown}
            style={{
              left: `${percentage}%`,
              width: `${metrics.thumbPx}px`,
              height: `${metrics.thumbPx}px`,
              transform: 'translate(-50%, 0)',
              backgroundColor: thumbColor || undefined,
            }}
            className={cn(
              'absolute rounded-full shadow-sm border border-black/15 dark:border-white/20',
              !isDragging && 'transition-[left] duration-75',
              !thumbColor && 'bg-black dark:bg-white',
              disabled
                ? 'cursor-not-allowed'
                : readOnly
                  ? 'cursor-default'
                  : 'cursor-grab active:cursor-grabbing hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950'
            )}
          />
        </div>

        {showMinMax && (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span
              style={{ color: textColor || undefined }}
              className={cn(
                'tabular-nums',
                metrics.labelClass,
                !textColor && 'text-[#666666] dark:text-zinc-400'
              )}
            >
              {displayMin}
            </span>
            <span
              style={{ color: textColor || undefined }}
              className={cn(
                'tabular-nums',
                metrics.labelClass,
                !textColor && 'text-[#666666] dark:text-zinc-400'
              )}
            >
              {displayMax}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';