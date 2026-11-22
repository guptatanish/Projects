import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const slideTrackVariants = cva(
  "inline-flex flex-wrap items-center justify-center",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
      size: {
        small: "gap-1.5",
        medium: "gap-2",
        large: "gap-2.5",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    dotPx: 8,
    pillActiveWidthPx: 20,
    lineMainPx: 18,
    lineCrossPx: 3,
    numberPx: 22,
    textClass: "text-[11px] leading-none",
    counterClass: "text-xs leading-normal",
  },
  medium: {
    dotPx: 10,
    pillActiveWidthPx: 26,
    lineMainPx: 26,
    lineCrossPx: 4,
    numberPx: 28,
    textClass: "text-xs leading-none",
    counterClass: "text-sm leading-normal",
  },
  large: {
    dotPx: 12,
    pillActiveWidthPx: 32,
    lineMainPx: 34,
    lineCrossPx: 5,
    numberPx: 34,
    textClass: "text-sm leading-none",
    counterClass: "text-base leading-normal",
  },
} as const;

export interface SlideIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof slideTrackVariants> {
  count?: number;
  activeIndex?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  shape?: 'dot' | 'pill' | 'line' | 'number';
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  showCounter?: boolean;
  labels?: string[];

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  activeColor?: string;
  inactiveColor?: string;
  hoverColor?: string;
  textColor?: string;
}

export const SlideIndicator = React.forwardRef<HTMLDivElement, SlideIndicatorProps>(
  (
    {
      className,
      count = 5,
      activeIndex,
      defaultIndex = 0,
      onChange,
      shape = 'dot',
      orientation = 'horizontal',
      size = 'medium',
      interactive = true,
      showCounter = false,
      labels,
      activeColor,
      inactiveColor,
      hoverColor,
      textColor,
      style,
      'aria-label': ariaLabel = 'Slide indicator',
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const safeCount = Math.max(1, Math.floor(count));
    const resolvedOrientation = orientation ?? 'horizontal';
    const resolvedShape = shape ?? 'dot';
    const metrics = sizeConfig[size || 'medium'];

    const clampIndex = (idx: number) => {
      if (Number.isNaN(idx)) return 0;
      return Math.min(Math.max(Math.floor(idx), 0), safeCount - 1);
    };

    const isControlled = activeIndex !== undefined;
    const [internalIndex, setInternalIndex] = useState<number>(() => clampIndex(defaultIndex));
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
      if (!isControlled) {
        setInternalIndex((prev) => clampIndex(prev));
      }
    }, [safeCount, isControlled]);

    useEffect(() => {
      if (!isControlled && defaultIndex !== undefined) {
        setInternalIndex(clampIndex(defaultIndex));
      }
    }, [defaultIndex, isControlled, safeCount]);

    const currentIndex = clampIndex(isControlled ? (activeIndex ?? 0) : internalIndex);

    const selectSlide = (nextIdx: number) => {
      if (!interactive) return;
      const clamped = clampIndex(nextIdx);
      if (!isControlled) {
        setInternalIndex(clamped);
      }
      onChange?.(clamped);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, idx: number) => {
      if (!interactive) return;
      const nextKey = resolvedOrientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const prevKey = resolvedOrientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

      if (e.key === nextKey) {
        e.preventDefault();
        const targetIdx = (idx + 1) % safeCount;
        selectSlide(targetIdx);
        document.getElementById(`${uid}-slide-${targetIdx}`)?.focus();
      } else if (e.key === prevKey) {
        e.preventDefault();
        const targetIdx = (idx - 1 + safeCount) % safeCount;
        selectSlide(targetIdx);
        document.getElementById(`${uid}-slide-${targetIdx}`)?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        selectSlide(0);
        document.getElementById(`${uid}-slide-0`)?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastIdx = safeCount - 1;
        selectSlide(lastIdx);
        document.getElementById(`${uid}-slide-${lastIdx}`)?.focus();
      }
    };

    const getItemDimensions = (isActive: boolean): React.CSSProperties => {
      if (resolvedShape === 'dot') {
        return {
          width: `${metrics.dotPx}px`,
          height: `${metrics.dotPx}px`,
          borderRadius: '9999px',
        };
      }
      if (resolvedShape === 'pill') {
        const activeDim = `${metrics.pillActiveWidthPx}px`;
        const baseDim = `${metrics.dotPx}px`;
        if (resolvedOrientation === 'vertical') {
          return {
            width: baseDim,
            height: isActive ? activeDim : baseDim,
            borderRadius: '9999px',
          };
        }
        return {
          width: isActive ? activeDim : baseDim,
          height: baseDim,
          borderRadius: '9999px',
        };
      }
      if (resolvedShape === 'line') {
        if (resolvedOrientation === 'vertical') {
          return {
            width: `${metrics.lineCrossPx}px`,
            height: `${metrics.lineMainPx}px`,
            borderRadius: '9999px',
          };
        }
        return {
          width: `${metrics.lineMainPx}px`,
          height: `${metrics.lineCrossPx}px`,
          borderRadius: '9999px',
        };
      }
      // number
      return {
        minWidth: `${metrics.numberPx}px`,
        height: `${metrics.numberPx}px`,
        paddingLeft: '6px',
        paddingRight: '6px',
        borderRadius: '9999px',
      };
    };

    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: resolvedOrientation === 'vertical' ? 'column' : 'row',
          alignItems: 'center',
          gap: '10px',
          ...style,
        }}
        className={cn(className)}
        {...props}
      >
        <div
          role={interactive ? 'tablist' : 'group'}
          aria-label={ariaLabel}
          aria-orientation={resolvedOrientation}
          className={cn(slideTrackVariants({ orientation: resolvedOrientation, size }))}
        >
          {Array.from({ length: safeCount }, (_, index) => {
            const isActive = index === currentIndex;
            const isHovered = hoveredIndex === index && interactive && !isActive;
            const itemLabel = labels?.[index] || `Slide ${index + 1} of ${safeCount}`;

            const bg = isActive
              ? activeColor || '#111111'
              : isHovered && hoverColor
                ? hoverColor
                : inactiveColor || '#d4d4d4';

            const fg =
              resolvedShape === 'number'
                ? isActive
                  ? textColor || '#ffffff'
                  : textColor || '#222222'
                : undefined;

            const itemStyle: React.CSSProperties = {
              ...getItemDimensions(isActive),
              backgroundColor: bg,
              color: fg,
              transition: 'all 180ms ease',
            };

            const baseItemClasses = cn(
              'inline-flex items-center justify-center shrink-0 select-none',
              resolvedShape === 'number' && cn('font-semibold tabular-nums', metrics.textClass),
              interactive
                ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
                : 'cursor-default'
            );

            if (!interactive) {
              return (
                <span
                  key={`${uid}-indicator-${index}`}
                  aria-label={itemLabel}
                  aria-current={isActive ? 'step' : undefined}
                  title={itemLabel}
                  style={itemStyle}
                  className={baseItemClasses}
                >
                  {resolvedShape === 'number' ? index + 1 : null}
                </span>
              );
            }

            return (
              <button
                key={`${uid}-indicator-${index}`}
                id={`${uid}-slide-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={itemLabel}
                title={itemLabel}
                tabIndex={isActive ? 0 : -1}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => selectSlide(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={itemStyle}
                className={baseItemClasses}
              >
                {resolvedShape === 'number' ? index + 1 : null}
              </button>
            );
          })}
        </div>

        {showCounter && (
          <span
            style={{ color: textColor || '#666666' }}
            className={cn(
              'font-medium tabular-nums select-none',
              metrics.counterClass
            )}
          >
            {currentIndex + 1} / {safeCount}
          </span>
        )}
      </div>
    );
  }
);

SlideIndicator.displayName = 'SlideIndicator';