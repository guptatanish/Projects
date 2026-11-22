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

export type ModalSize = 'small' | 'medium' | 'large' | 'xlarge';

const modalPanelVariants = cva(
  "relative flex flex-col w-full min-h-0 min-w-0 rounded-lg border shadow-xl outline-none",
  {
    variants: {
      size: {
        small: "max-w-sm text-xs leading-normal",
        medium: "max-w-md text-sm leading-normal",
        large: "max-w-xl text-sm leading-normal",
        xlarge: "max-w-3xl text-base leading-normal",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    headerPadStyle: { padding: '14px 18px' } as React.CSSProperties,
    bodyPadStyle: { padding: '16px 18px' } as React.CSSProperties,
    footerPadStyle: { padding: '12px 18px' } as React.CSSProperties,
    closePx: 15,
    titleClass: "text-sm font-semibold leading-normal",
    descClass: "text-[11px] leading-snug",
  },
  medium: {
    headerPadStyle: { padding: '16px 22px' } as React.CSSProperties,
    bodyPadStyle: { padding: '20px 22px' } as React.CSSProperties,
    footerPadStyle: { padding: '14px 22px' } as React.CSSProperties,
    closePx: 17,
    titleClass: "text-base font-semibold leading-normal",
    descClass: "text-xs leading-snug",
  },
  large: {
    headerPadStyle: { padding: '18px 24px' } as React.CSSProperties,
    bodyPadStyle: { padding: '22px 24px' } as React.CSSProperties,
    footerPadStyle: { padding: '16px 24px' } as React.CSSProperties,
    closePx: 18,
    titleClass: "text-lg font-semibold leading-normal",
    descClass: "text-xs leading-normal",
  },
  xlarge: {
    headerPadStyle: { padding: '20px 28px' } as React.CSSProperties,
    bodyPadStyle: { padding: '24px 28px' } as React.CSSProperties,
    footerPadStyle: { padding: '16px 28px' } as React.CSSProperties,
    closePx: 19,
    titleClass: "text-lg font-semibold leading-normal",
    descClass: "text-sm leading-normal",
  },
} as const;

export interface ModalProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof modalPanelVariants> {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: ModalSize;
  centered?: boolean;
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

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
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
      size = 'medium',
      centered = true,
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
    const modalId = id || `${uid}-modal`;
    const titleId = `${uid}-title`;
    const descId = `${uid}-desc`;

    const resolvedSize: ModalSize = size ?? 'medium';
    const isCentered = centered !== undefined ? Boolean(centered) : true;
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

    const resolvedBorder = borderColor || '#e5e5e5';
    const resolvedBg = bgColor || '#ffffff';
    const hasHeader = Boolean(title || description || showCloseButton);

    return (
      <div
        id={modalId}
        style={{
          position: contained ? 'absolute' : 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: isCentered ? 'center' : 'flex-start',
          padding: contained ? '24px' : '32px 16px',
          backgroundColor: backdropColor || 'rgba(0, 0, 0, 0.45)',
          overflowY: 'auto',
        }}
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
          style={{
            backgroundColor: resolvedBg,
            borderColor: resolvedBorder,
            color: textColor || undefined,
            maxHeight: contained ? '100%' : 'calc(100vh - 64px)',
            ...style,
          }}
          className={cn(
            modalPanelVariants({ size: resolvedSize }),
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
                borderTopLeftRadius: '7px',
                borderTopRightRadius: '7px',
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
                  aria-label="Close modal"
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
                borderBottomLeftRadius: '7px',
                borderBottomRightRadius: '7px',
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

Modal.displayName = 'Modal';