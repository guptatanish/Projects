import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const chipVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0 border border-transparent max-w-full",
  {
    variants: {
      variant: {
        solid: "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
        soft: "bg-[#E5E5E5] text-black hover:bg-[#D4D4D8] dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
        outline: "border-[#888888] text-black bg-transparent hover:bg-[#F4F4F5] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
      },
      size: {
        // FIXED: Removed fixed heights (h-6, etc.) and replaced with py-* (vertical padding).
        // Now the chip physically expands to fit the text perfectly without squishing.
        small: "text-xs px-2.5 py-1 gap-1",
        medium: "text-sm px-3 py-1.5 gap-1.5",
        large: "text-base px-4 py-2 gap-2",
      },
      disabled: {
        true: "opacity-50 pointer-events-none",
        false: "",
      },
      isInteractive: {
        true: "cursor-pointer",
        false: "",
      }
    },
    defaultVariants: {
      variant: "soft",
      size: "medium",
      disabled: false,
      isInteractive: false,
    },
  }
);

const XIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none", className)} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export interface ChipProps extends Omit<React.HTMLAttributes<HTMLDivElement | HTMLButtonElement>, 'onClick'>, VariantProps<typeof chipVariants> {
  selected?: boolean;
  avatar?: React.ReactNode;
  icon?: React.ReactNode;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => void;
  chipBg?: string;
  chipText?: string;
  chipBorder?: string;
  textSize?: string; // Added custom text size
}

export const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ 
    className, 
    variant, 
    size = 'medium', 
    selected, 
    disabled, 
    avatar, 
    icon, 
    onDelete, 
    onClick, 
    chipBg, 
    chipText, 
    chipBorder,
    textSize,
    style, 
    children, 
    ...props 
  }, ref) => {
    const isInteractive = !!onClick || selected !== undefined;
    const Component = isInteractive ? 'button' : 'div';

    const customStyle: React.CSSProperties = { ...style };
    if (chipBg) customStyle.backgroundColor = chipBg;
    if (chipText) customStyle.color = chipText;
    if (textSize) customStyle.fontSize = textSize; // Maps directly to inline styles
    if (chipBorder || variant === 'outline') {
      customStyle.borderColor = chipBorder || '#888888'; 
    }

    const avatarSizes = {
      small: "-ml-1 w-4 h-4",
      medium: "-ml-1 w-5 h-5",
      large: "-ml-1.5 w-6 h-6",
    };

    const iconSizes = {
      small: "w-3 h-3",
      medium: "w-4 h-4",
      large: "w-5 h-5",
    };

    return (
      <Component
        ref={ref as any}
        type={isInteractive ? "button" : undefined}
        onClick={onClick as any}
        style={customStyle}
        aria-pressed={selected}
        aria-disabled={disabled}
        className={cn(
          chipVariants({ variant, size, disabled, isInteractive }),
          
          selected && !chipBg && variant === 'soft' && "bg-black text-white dark:bg-white dark:text-black",
          selected && !chipBg && variant === 'outline' && "bg-black text-white dark:bg-white dark:text-black",
          
          className
        )}
        {...(props as any)}
      >
        {/* Leading Avatar */}
        {avatar && (
          <div className={cn("shrink-0 overflow-hidden rounded-full flex items-center justify-center bg-gray-200 dark:bg-zinc-700", avatarSizes[size || 'medium'])}>
            {avatar}
          </div>
        )}

        {/* Leading Icon */}
        {!avatar && icon && (
          <div className={cn("shrink-0 flex items-center justify-center", iconSizes[size || 'medium'])}>
            {icon}
          </div>
        )}

        {/* Label */}
        <span className="truncate">{children}</span>

        {/* Trailing Delete Action */}
        {onDelete && (
          <button
            type="button"
            aria-label="Remove"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation(); 
              onDelete(e);
            }}
            className={cn(
              "shrink-0 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-black/10 dark:hover:bg-white/20",
              size === 'small' ? "-mr-1.5 w-4 h-4" : size === 'medium' ? "-mr-1.5 w-5 h-5" : "-mr-2 w-6 h-6"
            )}
          >
            <XIcon className={cn(size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-4 h-4' : 'w-5 h-5')} />
          </button>
        )}
      </Component>
    );
  }
);

Chip.displayName = "Chip";