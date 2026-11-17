import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const XIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const dialogVariants = cva(
  "relative flex w-full flex-col overflow-hidden rounded-lg border shadow-xl outline-none transition-all dark:border-zinc-800",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        full: "max-w-[95vw] md:max-w-[90vw]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface DialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof dialogVariants> {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
  preventOutsideClick?: boolean;
  
  overlayBg?: string;
  dialogBg?: string;
  borderColor?: string;
  textColor?: string;
}

export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({
    className,
    isOpen,
    onOpenChange,
    size,
    title,
    description,
    children,
    footer,
    hideCloseButton = false,
    preventOutsideClick = false,
    overlayBg,
    dialogBg,
    borderColor,
    textColor,
    style,
    ...props
  }, ref) => {
    const [mounted, setMounted] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setMounted(true);
    }, []);

    // FIXED: Scrollbar compensation logic to prevent layout shift and Storybook freezing
    useEffect(() => {
      if (!isOpen) return;

      // 1. Calculate the exact width of the scrollbar
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // 2. Save original body styles
      const originalOverflow = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // 3. Apply scroll lock and instantly add padding so the width never changes
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onOpenChange(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      if (dialogRef.current) {
        dialogRef.current.focus();
      }

      return () => {
        // 4. Restore everything precisely on close
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, onOpenChange]);

    if (!mounted || !isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (preventOutsideClick) return;
      if (e.target === e.currentTarget) {
        onOpenChange(false);
      }
    };

    const customStyle = {
      ...style,
      ...(dialogBg ? { '--dlg-bg': dialogBg } : {}),
      ...(borderColor ? { '--dlg-border': borderColor } : {}),
      ...(textColor ? { '--dlg-text': textColor } : {}),
    } as React.CSSProperties;

    const overlayStyle = overlayBg ? { backgroundColor: overlayBg } : {};

    const dialogContent = (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={handleBackdropClick}
      >
        <div 
          className={cn(
            "fixed inset-0 transition-opacity",
            overlayBg ? "" : "bg-black/50 dark:bg-black/70"
          )}
          style={overlayStyle}
          aria-hidden="true"
        />

        <div
          ref={(node) => {
            (dialogRef as any).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as any).current = node;
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          style={customStyle}
          className={cn(
            dialogVariants({ size }),
            dialogBg ? "bg-[var(--dlg-bg)]" : "bg-white dark:bg-zinc-950",
            borderColor ? "border-[var(--dlg-border)]" : "border-[#e5e5e5]",
            textColor && "text-[var(--dlg-text)]",
            className
          )}
          {...props}
        >
          {(title || description || !hideCloseButton) && (
            <div className={cn(
              "flex flex-col space-y-1.5 px-6 py-5 border-b",
              borderColor ? "border-[var(--dlg-border)]" : "border-[#e5e5e5] dark:border-zinc-800"
            )}>
              <div className="flex items-start justify-between gap-4">
                {title && (
                  <h2 className={cn(
                    "text-lg font-semibold leading-none tracking-tight",
                    !textColor && "text-black dark:text-zinc-100"
                  )}>
                    {title}
                  </h2>
                )}
                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Close"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {description && (
                <p className={cn(
                  "text-sm",
                  !textColor && "text-[#555555] dark:text-zinc-400"
                )}>
                  {description}
                </p>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>

          {footer && (
            <div className={cn(
              "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4 border-t bg-black/5 dark:bg-white/5",
              borderColor ? "border-[var(--dlg-border)]" : "border-[#e5e5e5] dark:border-zinc-800"
            )}>
              {footer}
            </div>
          )}
        </div>
      </div>
    );

    return createPortal(dialogContent, document.body);
  }
);

Dialog.displayName = "Dialog";