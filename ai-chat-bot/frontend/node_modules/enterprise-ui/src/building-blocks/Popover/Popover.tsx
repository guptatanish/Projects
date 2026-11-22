import React, { useEffect, useId, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';
export type PopoverSize = 'small' | 'medium' | 'large';

const popoverPanelVariants = cva(
  "rounded-lg border shadow-lg max-w-[calc(100vw-32px)] min-w-0 break-words outline-none",
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
    maxWidthPx: 220,
    padStyle: { padding: '12px 14px' } as React.CSSProperties,
    offsetPx: 12,
    arrowPx: 8,
    textClass: "text-xs leading-normal",
  },
  medium: {
    maxWidthPx: 280,
    padStyle: { padding: '14px 18px' } as React.CSSProperties,
    offsetPx: 14,
    arrowPx: 10,
    textClass: "text-xs sm:text-sm leading-normal",
  },
  large: {
    maxWidthPx: 360,
    padStyle: { padding: '18px 22px' } as React.CSSProperties,
    offsetPx: 16,
    arrowPx: 12,
    textClass: "text-sm leading-normal",
  },
} as const;

export interface PopoverProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof popoverPanelVariants> {
  trigger: React.ReactNode;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopoverPlacement;
  size?: PopoverSize;
  showArrow?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  disabled?: boolean;
  unmountOnExit?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  arrowColor?: string;
}

export const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      className,
      trigger,
      children,
      open,
      defaultOpen = false,
      onOpenChange,
      placement = 'bottom',
      size = 'medium',
      showArrow = true,
      closeOnClickOutside = true,
      closeOnEscape = true,
      disabled = false,
      unmountOnExit = false,
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
    const popoverId = id || `${uid}-popover`;
    const resolvedPlacement: PopoverPlacement = placement ?? 'bottom';
    const resolvedSize: PopoverSize = size ?? 'medium';
    const metrics = sizeConfig[resolvedSize];

    const rootRef = useRef<HTMLDivElement | null>(null);
    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState<boolean>(Boolean(defaultOpen));

    useEffect(() => {
      if (!isControlled) {
        setInternalOpen(Boolean(defaultOpen));
      }
    }, [defaultOpen, isControlled]);

    const isOpen = !disabled && (isControlled ? Boolean(open) : internalOpen);

    const setOpenState = (next: boolean) => {
      if (disabled && next) return;
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    };

    const toggleOpen = () => {
      if (disabled) return;
      setOpenState(!isOpen);
    };

    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpenState(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape]);

    useEffect(() => {
      if (!isOpen || !closeOnClickOutside) return;
      const handleOutsideClick = (e: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          setOpenState(false);
        }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen, closeOnClickOutside]);

    const shouldRenderPanel = unmountOnExit ? isOpen : true;

    const resolvedBg = bgColor || '#ffffff';
    const resolvedBorder = borderColor || '#e5e5e5';
    const resolvedText = textColor || undefined;
    const resolvedArrow = arrowColor || resolvedBg;

    const getPanelPositionStyle = (): React.CSSProperties => {
      switch (resolvedPlacement) {
        case 'top':
          return {
            position: 'absolute',
            bottom: `calc(100% + ${metrics.offsetPx}px)`,
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
        case 'bottom':
        default:
          return {
            position: 'absolute',
            top: `calc(100% + ${metrics.offsetPx}px)`,
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
        case 'top':
          return {
            ...base,
            bottom: `-${half}px`,
            left: '50%',
            marginLeft: `-${half}px`,
            borderBottom: `1px solid ${resolvedBorder}`,
            borderRight: `1px solid ${resolvedBorder}`,
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
        case 'bottom':
        default:
          return {
            ...base,
            top: `-${half}px`,
            left: '50%',
            marginLeft: `-${half}px`,
            borderTop: `1px solid ${resolvedBorder}`,
            borderLeft: `1px solid ${resolvedBorder}`,
          };
      }
    };

    return (
      <div
        ref={(node) => {
          rootRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        className="w-fit max-w-full"
      >
        <div
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-controls={popoverId}
          aria-disabled={disabled || undefined}
          className={cn(
            'inline-flex items-center',
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          {trigger}
        </div>

        {shouldRenderPanel && (
          <div
            id={popoverId}
            role="dialog"
            aria-modal="false"
            hidden={!isOpen}
            style={{
              ...getPanelPositionStyle(),
              ...metrics.padStyle,
              width: 'max-content',
              maxWidth: `${metrics.maxWidthPx}px`,
              backgroundColor: resolvedBg,
              borderColor: resolvedBorder,
              color: resolvedText,
              ...style,
            }}
            className={cn(
              popoverPanelVariants({ size: resolvedSize }),
              !resolvedText && 'text-[#111111] dark:text-zinc-100',
              className
            )}
            {...props}
          >
            {showArrow && <span aria-hidden="true" style={getArrowStyle()} />}
            <div className={cn(metrics.textClass, 'relative z-10 min-w-0')}>
              {children}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Popover.displayName = 'Popover';