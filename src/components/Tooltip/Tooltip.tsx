import React, { useEffect, useId, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipSize = 'small' | 'medium' | 'large';

const tooltipBubbleVariants = cva(
  "rounded-md border shadow-md max-w-xs w-max break-words select-none pointer-events-none",
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
    padStyle: { padding: '6px 10px' } as React.CSSProperties,
    offsetPx: 10,
    arrowPx: 8,
    textClass: "text-xs leading-normal",
  },
  medium: {
    padStyle: { padding: '8px 12px' } as React.CSSProperties,
    offsetPx: 12,
    arrowPx: 10,
    textClass: "text-xs sm:text-sm leading-normal",
  },
  large: {
    padStyle: { padding: '10px 14px' } as React.CSSProperties,
    offsetPx: 14,
    arrowPx: 12,
    textClass: "text-sm sm:text-base leading-normal",
  },
} as const;

export interface TooltipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content' | 'children'>,
    VariantProps<typeof tooltipBubbleVariants> {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  size?: TooltipSize;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  showArrow?: boolean;
  disabled?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  arrowColor?: string;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      className,
      content,
      children,
      placement = 'top',
      size = 'medium',
      open,
      defaultOpen = false,
      onOpenChange,
      openDelay = 150,
      closeDelay = 100,
      showArrow = true,
      disabled = false,
      bgColor,
      borderColor,
      textColor,
      arrowColor,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const tooltipId = id || `${uid}-tooltip`;
    const resolvedPlacement: TooltipPlacement = placement ?? 'top';
    const resolvedSize: TooltipSize = size ?? 'medium';
    const metrics = sizeConfig[resolvedSize];

    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState<boolean>(Boolean(defaultOpen));

    const openTimerRef = useRef<number | null>(null);
    const closeTimerRef = useRef<number | null>(null);

    useEffect(() => {
      if (!isControlled) {
        setInternalOpen(Boolean(defaultOpen));
      }
    }, [defaultOpen, isControlled]);

    const clearTimers = () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };

    useEffect(() => {
      return () => clearTimers();
    }, []);

    const setOpenState = (nextOpen: boolean) => {
      if (disabled && nextOpen) return;
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    const scheduleOpen = () => {
      if (disabled) return;
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (openDelay <= 0) {
        setOpenState(true);
        return;
      }
      if (openTimerRef.current !== null) return;
      openTimerRef.current = window.setTimeout(() => {
        openTimerRef.current = null;
        setOpenState(true);
      }, openDelay);
    };

    const scheduleClose = () => {
      if (openTimerRef.current !== null) {
        window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      if (closeDelay <= 0) {
        setOpenState(false);
        return;
      }
      if (closeTimerRef.current !== null) return;
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        setOpenState(false);
      }, closeDelay);
    };

    const isVisible = !disabled && (isControlled ? Boolean(open) : internalOpen);

    useEffect(() => {
      if (!isVisible) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          clearTimers();
          setOpenState(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]);

    const hasContent = content !== null && content !== undefined && content !== false && content !== '';
    const shouldRenderPopup = isVisible && hasContent;

    const resolvedBg = bgColor || '#111111';
    const resolvedBorder = borderColor || '#111111';
    const resolvedText = textColor || '#ffffff';
    const resolvedArrow = arrowColor || resolvedBg;

    const getBubblePositionStyle = (): React.CSSProperties => {
      switch (resolvedPlacement) {
        case 'bottom':
          return {
            position: 'absolute',
            top: `calc(100% + ${metrics.offsetPx}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
          };
        case 'left':
          return {
            position: 'absolute',
            right: `calc(100% + ${metrics.offsetPx}px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40,
          };
        case 'right':
          return {
            position: 'absolute',
            left: `calc(100% + ${metrics.offsetPx}px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 40,
          };
        case 'top':
        default:
          return {
            position: 'absolute',
            bottom: `calc(100% + ${metrics.offsetPx}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
          };
      }
    };

    const getArrowStyle = (): React.CSSProperties => {
      const half = Math.round(metrics.arrowPx / 2);
      const base: React.CSSProperties = {
        position: 'absolute',
        width: `${metrics.arrowPx}px`,
        height: `${metrics.arrowPx}px`,
        backgroundColor: resolvedArrow,
        transform: 'rotate(45deg)',
      };

      switch (resolvedPlacement) {
        case 'bottom':
          return {
            ...base,
            top: `-${half}px`,
            left: '50%',
            marginLeft: `-${half}px`,
            borderTop: `1px solid ${resolvedBorder}`,
            borderLeft: `1px solid ${resolvedBorder}`,
          };
        case 'left':
          return {
            ...base,
            right: `-${half}px`,
            top: '50%',
            marginTop: `-${half}px`,
            borderTop: `1px solid ${resolvedBorder}`,
            borderRight: `1px solid ${resolvedBorder}`,
          };
        case 'right':
          return {
            ...base,
            left: `-${half}px`,
            top: '50%',
            marginTop: `-${half}px`,
            borderBottom: `1px solid ${resolvedBorder}`,
            borderLeft: `1px solid ${resolvedBorder}`,
          };
        case 'top':
        default:
          return {
            ...base,
            bottom: `-${half}px`,
            left: '50%',
            marginLeft: `-${half}px`,
            borderBottom: `1px solid ${resolvedBorder}`,
            borderRight: `1px solid ${resolvedBorder}`,
          };
      }
    };

    return (
      <div
        ref={ref}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        className="w-fit max-w-full"
      >
        <div
          aria-describedby={shouldRenderPopup ? tooltipId : undefined}
          className="inline-flex items-center"
        >
          {children}
        </div>

        {shouldRenderPopup && (
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              ...getBubblePositionStyle(),
              ...metrics.padStyle,
              backgroundColor: resolvedBg,
              borderColor: resolvedBorder,
              color: resolvedText,
              ...style,
            }}
            className={cn(tooltipBubbleVariants({ size: resolvedSize }), className)}
            {...props}
          >
            {showArrow && <span aria-hidden="true" style={getArrowStyle()} />}
            <span className={cn(metrics.textClass, 'relative z-10 block')}>{content}</span>
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';