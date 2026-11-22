import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const CloseIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export type DrawerPlacement = 'right' | 'left' | 'top' | 'bottom';
export type DrawerSize = 'small' | 'medium' | 'large';

const drawerPanelVariants = cva(
  "relative flex flex-col min-h-0 min-w-0 shadow-xl outline-none",
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
    horizontalMaxWidthPx: 320,
    verticalMaxHeightPx: 220,
    headerPadStyle: { padding: '14px 18px' } as React.CSSProperties,
    bodyPadStyle: { padding: '16px 18px' } as React.CSSProperties,
    footerPadStyle: { padding: '12px 18px' } as React.CSSProperties,
    closePx: 15,
    titleClass: "text-sm font-semibold leading-normal",
    descClass: "text-[11px] leading-snug",
  },
  medium: {
    horizontalMaxWidthPx: 420,
    verticalMaxHeightPx: 300,
    headerPadStyle: { padding: '16px 22px' } as React.CSSProperties,
    bodyPadStyle: { padding: '20px 22px' } as React.CSSProperties,
    footerPadStyle: { padding: '14px 22px' } as React.CSSProperties,
    closePx: 17,
    titleClass: "text-base font-semibold leading-normal",
    descClass: "text-xs leading-snug",
  },
  large: {
    horizontalMaxWidthPx: 580,
    verticalMaxHeightPx: 400,
    headerPadStyle: { padding: '20px 26px' } as React.CSSProperties,
    bodyPadStyle: { padding: '24px 26px' } as React.CSSProperties,
    footerPadStyle: { padding: '16px 26px' } as React.CSSProperties,
    closePx: 19,
    titleClass: "text-lg font-semibold leading-normal",
    descClass: "text-xs leading-normal",
  },
} as const;

export interface DrawerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof drawerPanelVariants> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: DrawerPlacement;
  size?: DrawerSize;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  unmountOnExit?: boolean;
  contained?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  headerBgColor?: string;
  footerBgColor?: string;
  backdropColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedTextColor?: string;
}

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      className,
      title,
      description,
      children,
      footer,
      open,
      defaultOpen = false,
      onOpenChange,
      placement = 'right',
      size = 'medium',
      showCloseButton = true,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      unmountOnExit = false,
      contained = false,
      bgColor,
      headerBgColor,
      footerBgColor,
      backdropColor,
      borderColor,
      textColor,
      mutedTextColor,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const drawerId = id || `${uid}-drawer`;
    const titleId = `${uid}-title`;
    const descId = `${uid}-desc`;

    const resolvedPlacement: DrawerPlacement = placement ?? 'right';
    const resolvedSize: DrawerSize = size ?? 'medium';
    const metrics = sizeConfig[resolvedSize];

    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState<boolean>(Boolean(defaultOpen));

    useEffect(() => {
      if (!isControlled) {
        setInternalOpen(Boolean(defaultOpen));
      }
    }, [defaultOpen, isControlled]);

    const isOpen = isControlled ? Boolean(open) : internalOpen;

    const setOpenState = (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
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

    if (unmountOnExit && !isOpen) return null;
    if (!isOpen) return null;

    const isHorizontalEdge = resolvedPlacement === 'left' || resolvedPlacement === 'right';
    const resolvedBorder = borderColor || '#e5e5e5';
    const resolvedBg = bgColor || '#ffffff';

    const getWrapperStyle = (): React.CSSProperties => {
      const base: React.CSSProperties = {
        position: contained ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        backgroundColor: backdropColor || 'rgba(0, 0, 0, 0.4)',
      };

      switch (resolvedPlacement) {
        case 'left':
          return { ...base, justifyContent: 'flex-start', alignItems: 'stretch' };
        case 'top':
          return { ...base, justifyContent: 'stretch', alignItems: 'flex-start', flexDirection: 'column' };
        case 'bottom':
          return { ...base, justifyContent: 'stretch', alignItems: 'flex-end', flexDirection: 'column' };
        case 'right':
        default:
          return { ...base, justifyContent: 'flex-end', alignItems: 'stretch' };
      }
    };

    const getPanelStyle = (): React.CSSProperties => {
      const base: React.CSSProperties = {
        backgroundColor: resolvedBg,
        color: textColor || undefined,
        ...style,
      };

      if (isHorizontalEdge) {
        return {
          ...base,
          width: '100%',
          maxWidth: `${metrics.horizontalMaxWidthPx}px`,
          height: '100%',
          borderLeft: resolvedPlacement === 'right' ? `1px solid ${resolvedBorder}` : undefined,
          borderRight: resolvedPlacement === 'left' ? `1px solid ${resolvedBorder}` : undefined,
        };
      }

      return {
        ...base,
        width: '100%',
        height: '100%',
        maxHeight: `${metrics.verticalMaxHeightPx}px`,
        borderTop: resolvedPlacement === 'bottom' ? `1px solid ${resolvedBorder}` : undefined,
        borderBottom: resolvedPlacement === 'top' ? `1px solid ${resolvedBorder}` : undefined,
      };
    };

    const hasHeader = Boolean(title || description || showCloseButton);

    return (
      <div
        id={drawerId}
        style={getWrapperStyle()}
        onMouseDown={(e) => {
          if (closeOnBackdropClick && e.target === e.currentTarget) {
            setOpenState(false);
          }
        }}
      >
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          style={getPanelStyle()}
          className={cn(
            drawerPanelVariants({ size: resolvedSize }),
            !textColor && 'text-[#111111] dark:text-zinc-100',
            className
          )}
          {...props}
        >
          {hasHeader && (
            <div
              style={{
                ...metrics.headerPadStyle,
                backgroundColor: headerBgColor || 'transparent',
                borderBottom: `1px solid ${resolvedBorder}`,
              }}
              className="flex items-start justify-between gap-4 shrink-0"
            >
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    id={titleId}
                    style={{ color: textColor || undefined }}
                    className={cn(
                      metrics.titleClass,
                      'break-words',
                      !textColor && 'text-black dark:text-zinc-100'
                    )}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descId}
                    style={{ color: mutedTextColor || undefined }}
                    className={cn(
                      metrics.descClass,
                      'mt-1 break-words',
                      !mutedTextColor && 'text-[#666666] dark:text-zinc-400'
                    )}
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  type="button"
                  aria-label="Close drawer"
                  onClick={() => setOpenState(false)}
                  style={{
                    padding: '6px',
                    color: mutedTextColor || textColor || undefined,
                  }}
                  className={cn(
                    'shrink-0 rounded-md bg-transparent border-0 cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/30',
                    !mutedTextColor && !textColor && 'text-[#555555] dark:text-zinc-400'
                  )}
                >
                  <CloseIcon
                    sizePx={metrics.closePx}
                    color={mutedTextColor || textColor || undefined}
                  />
                </button>
              )}
            </div>
          )}

          <div
            style={{
              ...metrics.bodyPadStyle,
              color: textColor || undefined,
            }}
            className={cn(
              'flex-1 min-h-0 overflow-y-auto break-words',
              !textColor && 'text-[#222222] dark:text-zinc-200'
            )}
          >
            {children}
          </div>

          {footer && (
            <div
              style={{
                ...metrics.footerPadStyle,
                backgroundColor: footerBgColor || 'transparent',
                borderTop: `1px solid ${resolvedBorder}`,
              }}
              className="flex items-center justify-end gap-3 shrink-0 flex-wrap"
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Drawer.displayName = 'Drawer';