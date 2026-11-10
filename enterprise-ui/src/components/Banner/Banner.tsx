import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const bannerVariants = cva(
  // FIXED: Explicitly forced px-6 (left/right padding) and py-4 (top/bottom) on the root container
  "w-full flex items-center justify-between gap-4 px-6 py-4 text-sm font-medium border-b transition-colors box-border",
  {
    variants: {
      variant: {
        default: "bg-[#E5E5E5] border-[#888888] text-black dark:bg-zinc-800 dark:border-zinc-700 dark:text-white",
        info: "bg-blue-600 border-blue-700 text-white dark:bg-blue-900 dark:border-blue-800",
        success: "bg-green-600 border-green-700 text-white dark:bg-green-900 dark:border-green-800",
        warning: "bg-amber-500 border-amber-600 text-white dark:bg-amber-900 dark:border-amber-800",
        destructive: "bg-red-600 border-red-700 text-white dark:bg-red-900 dark:border-red-800",
      },
      position: {
        static: "static",
        relative: "relative",
        absolute: "absolute top-0 inset-x-0 z-50",
        fixed: "fixed top-0 inset-x-0 z-50",
        sticky: "sticky top-0 z-50",
      }
    },
    defaultVariants: {
      variant: "default",
      position: "relative",
    },
  }
);

const icons = {
  default: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  ),
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  destructive: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  ),
};

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'action'>, VariantProps<typeof bannerVariants> {
  isDismissible?: boolean;
  onClose?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode | null;
  bannerBg?: string; 
  contentColor?: string;
}

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ className, variant = 'default', position = 'relative', isDismissible = false, onClose, action, icon, bannerBg, contentColor, children, ...props }, ref) => {
    
    const displayIcon = icon !== undefined ? icon : (variant ? icons[variant] : icons.default);

    return (
      <div 
        ref={ref} 
        role={variant === 'destructive' || variant === 'warning' ? 'alert' : 'status'}
        className={cn(bannerVariants({ variant, position }), bannerBg, contentColor, className)} 
        {...props}
      >
        <div className="flex flex-1 items-center gap-3">
          {displayIcon && <div className="shrink-0 h-5 w-5 flex items-center justify-center">{displayIcon}</div>}
          <div className="flex-1 leading-snug">{children}</div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {action && <div>{action}</div>}
          
          {isDismissible && (
            <button
              type="button"
              onClick={onClose}
              className="flex shrink-0 items-center justify-center rounded-sm opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
              aria-label="Dismiss banner"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Banner.displayName = "Banner";