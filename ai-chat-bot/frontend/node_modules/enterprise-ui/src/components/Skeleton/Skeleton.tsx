import React, { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const skeletonBlockVariants = cva(
  "block max-w-full transition-colors bg-[#e5e5e5] dark:bg-zinc-800",
  {
    variants: {
      variant: {
        rectangle: "rounded-md",
        circle: "rounded-full",
        text: "rounded",
      },
      animation: {
        pulse: "animate-pulse",
        wave: "relative overflow-hidden",
        none: "",
      },
    },
    defaultVariants: {
      variant: "rectangle",
      animation: "pulse",
    },
  }
);

const sizeConfig = {
  small: {
    textHeightPx: 12,
    circlePx: 28,
    rectHeightPx: 64,
    lineGapPx: 6,
  },
  medium: {
    textHeightPx: 16,
    circlePx: 40,
    rectHeightPx: 96,
    lineGapPx: 8,
  },
  large: {
    textHeightPx: 20,
    circlePx: 56,
    rectHeightPx: 140,
    lineGapPx: 10,
  },
} as const;

const hasValue = (val: unknown): val is number | string =>
  val !== undefined && val !== null && val !== '';

const formatDim = (dim?: number | string): string | undefined => {
  if (!hasValue(dim)) return undefined;
  return typeof dim === 'number' ? `${dim}px` : dim;
};

export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof skeletonBlockVariants> {
  children?: React.ReactNode;
  loading?: boolean;
  variant?: 'rectangle' | 'circle' | 'text';
  size?: 'small' | 'medium' | 'large';
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  lines?: number;
  lastLineWidth?: number | string;
  animation?: 'pulse' | 'wave' | 'none';

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  baseColor?: string;
  highlightColor?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      children,
      loading = true,
      className,
      variant = 'rectangle',
      size = 'medium',
      width,
      height,
      radius,
      lines = 1,
      lastLineWidth,
      animation = 'pulse',
      baseColor,
      highlightColor,
      style,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const resolvedVariant = variant ?? 'rectangle';
    const resolvedAnimation = animation ?? 'pulse';
    const metrics = sizeConfig[size || 'medium'];
    const lineCount = Math.max(1, Math.floor(lines));

    if (!loading && children !== undefined) {
      return <>{children}</>;
    }

    const getDefaultWidth = (): string => {
      if (hasValue(width)) return formatDim(width)!;
      if (resolvedVariant === 'circle') return `${metrics.circlePx}px`;
      return '100%';
    };

    const getDefaultHeight = (): string => {
      if (hasValue(height)) return formatDim(height)!;
      if (resolvedVariant === 'circle') return `${metrics.circlePx}px`;
      if (resolvedVariant === 'text') return `${metrics.textHeightPx}px`;
      return `${metrics.rectHeightPx}px`;
    };

    const resolvedRadius = hasValue(radius)
      ? formatDim(radius)
      : resolvedVariant === 'circle'
        ? '9999px'
        : undefined;

    const shimmerColor = highlightColor || 'rgba(255, 255, 255, 0.45)';

    const renderSingleBlock = (index: number) => {
      const isLast = index === lineCount - 1;
      const itemWidth =
        lineCount > 1 && isLast && hasValue(lastLineWidth)
          ? formatDim(lastLineWidth)!
          : getDefaultWidth();
      const itemHeight = getDefaultHeight();

      const blockStyle: React.CSSProperties = {
        width: itemWidth,
        height: itemHeight,
        minHeight: itemHeight,
        borderRadius: resolvedRadius,
        backgroundColor: baseColor || '#e5e5e5',
      };

      return (
        <div
          key={`${uid}-skeleton-${index}`}
          aria-hidden="true"
          style={blockStyle}
          className={cn(
            skeletonBlockVariants({
              variant: resolvedVariant,
              animation: resolvedAnimation,
            }),
            'dark:bg-zinc-800',
            lineCount === 1 && className
          )}
        >
          {resolvedAnimation === 'wave' && (
            <span
              aria-hidden="true"
              style={{
                background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
                animation: 'skeleton-wave 1.5s ease-in-out infinite',
              }}
              className="pointer-events-none block h-full w-full"
            />
          )}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${metrics.lineGapPx}px`,
          width: hasValue(width) ? formatDim(width) : '100%',
          ...style,
        }}
        className={cn(lineCount > 1 && className)}
        {...props}
      >
        {resolvedAnimation === 'wave' && (
          <style>{`@keyframes skeleton-wave { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
        )}
        {Array.from({ length: lineCount }, (_, idx) => renderSingleBlock(idx))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';