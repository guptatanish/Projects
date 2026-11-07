import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "absolute z-10 flex items-center justify-center rounded-full font-bold border-2 border-white dark:border-zinc-950 text-[10px]",
  {
    variants: {
      type: {
        notification: "min-w-[20px] h-[20px] px-1.5",
        status: "w-3 h-3 p-0", 
      },
      intent: {
        default: "bg-gray-500 text-white",
        error: "bg-red-500 text-white",
        success: "bg-green-500 text-white",
        warning: "bg-amber-500 text-white",
        info: "bg-blue-500 text-white",
      },
      placement: {
        "top-right": "-top-1.5 -right-1.5",
        "top-left": "-top-1.5 -left-1.5",
        "bottom-right": "-bottom-1.5 -right-1.5",
        "bottom-left": "-bottom-1.5 -left-1.5",
      }
    },
    defaultVariants: {
      type: "notification",
      intent: "error",
      placement: "top-right",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  content?: React.ReactNode;
  max?: number;
  showZero?: boolean;
  invisible?: boolean;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    type, 
    intent, 
    placement, 
    content, 
    max = 99, 
    showZero = false, 
    invisible = false, 
    children, 
    ...props 
  }, ref) => {

    let displayContent = content;
    if (typeof content === 'number' && max) {
      displayContent = content > max ? `${max}+` : content;
    }

    // Simplified hiding logic
    const isHidden = invisible || (content === 0 && !showZero);

    return (
      <div className="relative inline-flex shrink-0 align-middle" ref={ref} {...props}>
        {children}
        {!isHidden && (
          <span className={cn(badgeVariants({ type, intent, placement }), className)}>
            {type === 'notification' ? displayContent : null}
          </span>
        )}
      </div>
    );
  }
);

Badge.displayName = "Badge";