import React, { useEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Removed Tailwind height classes entirely to prevent JIT purging
const progressBarVariants = cva(
  "w-full overflow-hidden rounded-full transition-colors",
  {
    variants: {
      size: {
        small: "",
        medium: "",
        large: "",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

// Explicit pixel heights mapped to the sizes
const heightMap = {
  small: "6px",
  medium: "10px",
  large: "16px",
};

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof progressBarVariants> {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  showLabel?: boolean;

  // Custom Colors
  indicatorBg?: string;
  trackBg?: string;
  textColor?: string;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({
    className,
    value = 0,
    max = 100,
    size = "medium",
    indeterminate = false,
    showLabel = false,
    indicatorBg,
    trackBg,
    textColor,
    style,
    ...props
  }, ref) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [isDarkContext, setIsDarkContext] = useState(false);

    useEffect(() => {
      const checkDark = () => {
        const el = rootRef.current;
        if (!el) return;
        setIsDarkContext(Boolean(el.closest('.dark')));
      };
      checkDark();

      const el = rootRef.current;
      if (!el || typeof MutationObserver === 'undefined') return;
      const observer = new MutationObserver(checkDark);
      const ancestor = el.closest('.dark') || document.documentElement;
      observer.observe(ancestor, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }, []);

    const safeValue = Math.min(Math.max(value, 0), max);
    const percentage = max > 0 ? Math.round((safeValue / max) * 100) : 0;

    const resolvedTextColor = textColor || (isDarkContext ? '#f4f4f5' : '#111111');
    const resolvedTrackBg = trackBg || (isDarkContext ? '#27272a' : '#E5E5E5');
    const resolvedIndicatorBg = indicatorBg || (isDarkContext ? '#ffffff' : '#111111');

    return (
      <div
        ref={rootRef}
        className={cn("flex w-full flex-col gap-1.5", className)}
        style={style}
      >
        {showLabel && (
          <div className="flex items-center justify-between text-sm font-medium">
            <span
              className={cn(!textColor && "text-black dark:text-zinc-100")}
              style={{ color: resolvedTextColor }}
            >
              {percentage}%
            </span>
          </div>
        )}

        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : safeValue}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(
            progressBarVariants({ size }),
            !trackBg && "bg-[#E5E5E5] dark:bg-zinc-800"
          )}
          style={{
            // Hardcoding the height inline guarantees it will always render
            height: heightMap[size || "medium"],
            backgroundColor: resolvedTrackBg,
          }}
          {...props}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-in-out",
              !indicatorBg && "bg-black dark:bg-white",
              indeterminate && "w-full animate-pulse opacity-70"
            )}
            style={{
              width: indeterminate ? '100%' : `${percentage}%`,
              backgroundColor: resolvedIndicatorBg,
            }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";