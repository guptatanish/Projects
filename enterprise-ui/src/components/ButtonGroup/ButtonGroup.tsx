import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Context & Types ---
interface ButtonGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  size: 'small' | 'medium' | 'large';
  orientation: 'horizontal' | 'vertical';
  activeBg?: string;
  activeTextColor?: string;
  inactiveBg?: string;
  inactiveTextColor?: string;
  hoverBg?: string;
}

const ButtonGroupContext = createContext<ButtonGroupContextValue | undefined>(undefined);

const useButtonGroupContext = () => {
  const context = useContext(ButtonGroupContext);
  if (!context) {
    throw new Error('ButtonGroupItem must be used within a <ButtonGroup>');
  }
  return context;
};

// --- Root Component ---
// MOVED the border, rounded-md, and overflow-hidden to the outer container so it looks like one single unit
const buttonGroupVariants = cva("inline-flex border border-[#888888] rounded-md overflow-hidden dark:border-zinc-700", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    }
  },
  defaultVariants: {
    orientation: "horizontal",
  }
});

export interface ButtonGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  activeBg?: string;
  activeTextColor?: string;
  inactiveBg?: string;
  inactiveTextColor?: string;
  hoverBg?: string;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ 
    className, 
    value: controlledValue, 
    defaultValue, 
    onValueChange, 
    size = 'medium', 
    orientation = 'horizontal',
    activeBg,
    activeTextColor,
    inactiveBg,
    inactiveTextColor,
    hoverBg,
    children, 
    ...props 
  }, ref) => {
    
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(defaultValue || '');
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : uncontrolledValue;

    const handleValueChange = useCallback((newValue: string) => {
      if (!isControlled) setUncontrolledValue(newValue);
      onValueChange?.(newValue);
    }, [isControlled, onValueChange]);

    const contextValue = useMemo(() => ({
      value: currentValue,
      onValueChange: handleValueChange,
      size,
      orientation,
      activeBg,
      activeTextColor,
      inactiveBg,
      inactiveTextColor,
      hoverBg,
    }), [currentValue, handleValueChange, size, orientation, activeBg, activeTextColor, inactiveBg, inactiveTextColor, hoverBg]);

    return (
      <ButtonGroupContext.Provider value={contextValue}>
        <div 
          ref={ref} 
          role="group" 
          className={cn(buttonGroupVariants({ orientation }), className)} 
          {...props}
        >
          {children}
        </div>
      </ButtonGroupContext.Provider>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

// --- Item Component ---
const buttonGroupItemVariants = cva(
  // REMOVED individual borders and negative margins. Added relative positioning for the inner separator line.
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative rounded-none",
  {
    variants: {
      size: {
        small: "h-8 px-3 text-sm",
        medium: "h-10 px-4 py-2 text-sm",
        large: "h-12 px-8 text-base",
      },
      orientation: {
        // Creates a perfect 1px line that doesn't touch the top/bottom edges
        horizontal: "after:absolute after:right-0 after:top-2.5 after:bottom-2.5 after:w-[1px] after:bg-[#888888] dark:after:bg-zinc-700 last:after:hidden",
        vertical: "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1px] after:bg-[#888888] dark:after:bg-zinc-700 last:after:hidden",
      }
    },
    defaultVariants: {
      size: "medium",
      orientation: "horizontal",
    }
  }
);

export interface ButtonGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ className, value, style, type = "button", children, ...props }, ref) => {
    const { 
      value: selectedValue, 
      onValueChange, 
      size, 
      orientation,
      activeBg,
      activeTextColor,
      inactiveBg,
      inactiveTextColor,
      hoverBg
    } = useButtonGroupContext();
    
    const isActive = selectedValue === value;

    const customStyle = {
      ...style,
      ...(activeBg ? { '--bg-active': activeBg } : {}),
      ...(activeTextColor ? { '--text-active': activeTextColor } : {}),
      ...(inactiveBg ? { '--bg-inactive': inactiveBg } : {}),
      ...(inactiveTextColor ? { '--text-inactive': inactiveTextColor } : {}),
      ...(hoverBg ? { '--bg-hover': hoverBg } : {}),
    } as React.CSSProperties;

    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={isActive}
        data-state={isActive ? "on" : "off"}
        onClick={(e) => {
          onValueChange(value);
          props.onClick?.(e);
        }}
        style={customStyle}
        className={cn(
          buttonGroupItemVariants({ size, orientation }),
          // Cleaned up defaults (removed border overrides since outer container handles borders now)
          isActive && !activeBg && "bg-[#E5E5E5] text-black dark:bg-zinc-800 dark:text-white",
          !isActive && !inactiveBg && "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
          
          // Configurable Styling
          isActive && activeBg && "bg-[color:var(--bg-active)]",
          isActive && activeTextColor && "text-[color:var(--text-active)]",
          !isActive && inactiveBg && "bg-[color:var(--bg-inactive)]",
          !isActive && inactiveTextColor && "text-[color:var(--text-inactive)]",
          !isActive && hoverBg && "hover:bg-[color:var(--bg-hover)]",
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ButtonGroupItem.displayName = "ButtonGroupItem";