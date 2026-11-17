import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Icons ---
const MoreVerticalIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

// --- Variants ---
const triggerVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        small: "h-7 w-7",
        medium: "h-8 w-8",
        large: "h-10 w-10",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed",
        false: "hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer",
      },
    },
    defaultVariants: {
      size: "medium",
      disabled: false,
    },
  }
);

export type OverflowMenuItem = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
};

export interface OverflowMenuProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof triggerVariants> {
  items: OverflowMenuItem[];
  align?: 'left' | 'right';
  customTrigger?: React.ReactNode;
  disabled?: boolean;

  // Custom Colors
  menuBg?: string;
  itemHoverBg?: string;
  borderColor?: string;
  textColor?: string;
}

export const OverflowMenu = React.forwardRef<HTMLDivElement, OverflowMenuProps>(
  ({
    className,
    items,
    align = 'right',
    size = "medium",
    disabled = false,
    customTrigger,
    menuBg,
    itemHoverBg,
    borderColor,
    textColor,
    style,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle outside clicks
    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleOutsideClick);
      }
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
      }
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleToggle = useCallback(() => {
      if (disabled) return;
      setIsOpen((prev) => !prev);
    }, [disabled]);

    const handleItemClick = useCallback((item: OverflowMenuItem) => {
      if (item.disabled) return;
      item.onClick();
      setIsOpen(false);
    }, []);

    // Safe inline CSS variables mapping
    const customStyle = {
      ...style,
      ...(menuBg ? { '--om-bg': menuBg } : {}),
      ...(itemHoverBg ? { '--om-hover': itemHoverBg } : {}),
      ...(borderColor ? { '--om-border': borderColor } : {}),
      ...(textColor ? { '--om-text': textColor } : {}),
    } as React.CSSProperties;

    return (
      <div 
        ref={(node) => {
          (containerRef as any).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as any).current = node;
        }}
        style={customStyle}
        className={cn("relative inline-block text-left", className)} 
        {...props}
      >
        {/* Trigger */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={cn(
            customTrigger ? "" : triggerVariants({ size, disabled }),
            textColor && !customTrigger && "text-[var(--om-text)] dark:text-[var(--om-text)]"
          )}
        >
          {customTrigger ? customTrigger : (
            <MoreVerticalIcon className={cn(
              size === 'small' ? 'h-4 w-4' : size === 'medium' ? 'h-5 w-5' : 'h-6 w-6',
              !textColor && "text-[#555555] dark:text-zinc-400"
            )} />
          )}
        </button>

        {/* Floating Menu Popover */}
        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className={cn(
              "absolute z-50 mt-1 w-48 rounded-md border shadow-lg outline-none",
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              menuBg ? "bg-[var(--om-bg)]" : "bg-white dark:bg-zinc-950",
              borderColor ? "border-[var(--om-border)]" : "border-[#e5e5e5] dark:border-zinc-800"
            )}
          >
            <div className="py-1" role="none">
              {items.map((item, index) => {
                const isDestructive = item.destructive && !item.disabled;
                
                return (
                  <React.Fragment key={index}>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        "flex w-full items-center px-4 py-2 text-sm transition-colors text-left",
                        item.disabled && "opacity-50 cursor-not-allowed",
                        
                        // Default vs Custom Text Colors
                        !isDestructive && textColor && "text-[var(--om-text)]",
                        !isDestructive && !textColor && "text-black dark:text-zinc-200",
                        
                        // Hover States
                        !item.disabled && !isDestructive && !itemHoverBg && "hover:bg-black/5 dark:hover:bg-white/10",
                        !item.disabled && !isDestructive && itemHoverBg && "hover:bg-[var(--om-hover)] dark:hover:bg-[var(--om-hover)]",
                        
                        // Destructive Mode
                        isDestructive && "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      )}
                    >
                      {item.icon && (
                        <span className={cn("mr-2 shrink-0 flex items-center justify-center", size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4')}>
                          {item.icon}
                        </span>
                      )}
                      <span className="truncate">{item.label}</span>
                    </button>
                    
                    {item.divider && index !== items.length - 1 && (
                      <div className={cn(
                        "my-1 border-b",
                        borderColor ? "border-[var(--om-border)]" : "border-[#e5e5e5] dark:border-zinc-800"
                      )} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

OverflowMenu.displayName = "OverflowMenu";