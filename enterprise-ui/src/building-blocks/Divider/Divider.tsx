import React, { useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';
export type DividerSize = 'small' | 'medium' | 'large';
export type DividerLabelAlign = 'left' | 'center' | 'right';

const dividerRootVariants = cva(
  "select-none min-w-0",
  {
    variants: {
      size: {
        small: "text-[11px] leading-normal",
        medium: "text-xs leading-normal",
        large: "text-sm leading-normal",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    defaultThicknessPx: 1,
    horizontalMarginPx: 10,
    verticalMarginPx: 10,
    verticalHeightPx: 22,
    defaultLabelGapPx: 6,
    labelPadStyle: { padding: '2px 7px' } as React.CSSProperties,
    labelClass: "text-[11px] font-medium leading-normal",
  },
  medium: {
    defaultThicknessPx: 1,
    horizontalMarginPx: 14,
    verticalMarginPx: 14,
    verticalHeightPx: 28,
    defaultLabelGapPx: 8,
    labelPadStyle: { padding: '2px 9px' } as React.CSSProperties,
    labelClass: "text-xs font-medium leading-normal",
  },
  large: {
    defaultThicknessPx: 2,
    horizontalMarginPx: 18,
    verticalMarginPx: 18,
    verticalHeightPx: 34,
    defaultLabelGapPx: 10,
    labelPadStyle: { padding: '3px 11px' } as React.CSSProperties,
    labelClass: "text-sm font-medium leading-normal",
  },
} as const;

export interface DividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof dividerRootVariants> {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  size?: DividerSize;
  label?: React.ReactNode;
  labelAlign?: DividerLabelAlign;
  labelGap?: number;
  thickness?: number;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  color?: string;
  labelColor?: string;
  labelBgColor?: string;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      className,
      orientation = 'horizontal',
      variant = 'solid',
      size = 'medium',
      label,
      labelAlign = 'center',
      labelGap,
      thickness,
      color,
      labelColor,
      labelBgColor,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const dividerId = id || `${uid}-divider`;
    const resolvedOrientation: DividerOrientation = orientation ?? 'horizontal';
    const resolvedVariant: DividerVariant = variant ?? 'solid';
    const resolvedSize: DividerSize = size ?? 'medium';
    const resolvedAlign: DividerLabelAlign = labelAlign ?? 'center';
    const metrics = sizeConfig[resolvedSize];

    const strokePx =
      thickness !== undefined && thickness > 0
        ? Math.min(Math.max(Math.round(thickness), 1), 8)
        : metrics.defaultThicknessPx;

    const resolvedGapPx =
      labelGap !== undefined && labelGap >= 0
        ? Math.min(Math.max(Math.round(labelGap), 0), 64)
        : metrics.defaultLabelGapPx;

    const strokeColor = color || '#e5e5e5';
    const hasLabel =
      resolvedOrientation === 'horizontal' &&
      label !== null &&
      label !== undefined &&
      label !== false &&
      label !== '';

    if (resolvedOrientation === 'vertical') {
      return (
        <div
          ref={ref}
          id={dividerId}
          role="separator"
          aria-orientation="vertical"
          style={{
            display: 'inline-block',
            alignSelf: 'stretch',
            minHeight: `${metrics.verticalHeightPx}px`,
            width: `${strokePx}px`,
            marginLeft: `${metrics.verticalMarginPx}px`,
            marginRight: `${metrics.verticalMarginPx}px`,
            borderLeft: `${strokePx}px ${resolvedVariant} ${strokeColor}`,
            flexShrink: 0,
            ...style,
          }}
          className={cn(dividerRootVariants({ size: resolvedSize }), className)}
          {...props}
        />
      );
    }

    const lineStyle: React.CSSProperties = {
      height: `${strokePx}px`,
      borderTop: `${strokePx}px ${resolvedVariant} ${strokeColor}`,
      flex: 1,
      minWidth: '12px',
    };

    if (!hasLabel) {
      return (
        <div
          ref={ref}
          id={dividerId}
          role="separator"
          aria-orientation="horizontal"
          style={{
            width: '100%',
            marginTop: `${metrics.horizontalMarginPx}px`,
            marginBottom: `${metrics.horizontalMarginPx}px`,
            borderTop: `${strokePx}px ${resolvedVariant} ${strokeColor}`,
            ...style,
          }}
          className={cn(dividerRootVariants({ size: resolvedSize }), className)}
          {...props}
        />
      );
    }

    const showLeftLine = resolvedAlign !== 'left';
    const showRightLine = resolvedAlign !== 'right';

    return (
      <div
        ref={ref}
        id={dividerId}
        role="separator"
        aria-orientation="horizontal"
        style={{
          width: '100%',
          marginTop: `${metrics.horizontalMarginPx}px`,
          marginBottom: `${metrics.horizontalMarginPx}px`,
          display: 'flex',
          alignItems: 'center',
          gap: `${resolvedGapPx}px`,
          ...style,
        }}
        className={cn(dividerRootVariants({ size: resolvedSize }), className)}
        {...props}
      >
        {showLeftLine && <span aria-hidden="true" style={lineStyle} />}

        <span
          style={{
            ...metrics.labelPadStyle,
            color: labelColor || undefined,
            backgroundColor: labelBgColor || undefined,
          }}
          className={cn(
            metrics.labelClass,
            'rounded-full shrink-0 max-w-[70%] truncate',
            !labelColor && 'text-[#666666] dark:text-zinc-400',
            !labelBgColor && 'bg-white dark:bg-zinc-950'
          )}
        >
          {label}
        </span>

        {showRightLine && <span aria-hidden="true" style={lineStyle} />}
      </div>
    );
  }
);

Divider.displayName = 'Divider';