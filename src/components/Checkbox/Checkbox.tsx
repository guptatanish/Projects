import React, { useState, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Icons ---
const CheckIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none", className)} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DashIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none", className)} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// --- Component ---
const checkboxVariants = cva(
  "peer shrink-0 rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
  {
    variants: {
      size: {
        small: "w-4 h-4",
        medium: "w-5 h-5",
        large: "w-6 h-6",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const iconSizes = {
  small: "w-3 h-3",
  medium: "w-3.5 h-3.5",
  large: "w-4 h-4",
};

export interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'>, VariantProps<typeof checkboxVariants> {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
  checkedBg?: string;
  checkedBorder?: string;
  iconColor?: string;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ 
    className, 
    size = 'medium', 
    checked: controlledChecked, 
    defaultChecked, 
    onCheckedChange, 
    disabled, 
    checkedBg, 
    checkedBorder, 
    iconColor, 
    style, 
    ...props 
  }, ref) => {
    
    const isControlled = controlledChecked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = useState<boolean | 'indeterminate'>(defaultChecked || false);
    const checked = isControlled ? controlledChecked : uncontrolledChecked;
    
    const isIndeterminate = checked === 'indeterminate';
    const isChecked = checked === true;
    const isActive = isChecked || isIndeterminate;

    const handleToggle = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const newState = isIndeterminate ? true : !checked;
      
      if (!isControlled) {
        setUncontrolledChecked(newState);
      }
      onCheckedChange?.(newState);
    }, [disabled, isIndeterminate, checked, isControlled, onCheckedChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle(e);
      }
      props.onKeyDown?.(e);
    };

    // 100% Bulletproof approach: applying custom colors directly via React inline styles
    // This forces updates immediately in Storybook and bypasses Tailwind JIT failures
    const customStyle: React.CSSProperties = { ...style };
    if (isActive && checkedBg) customStyle.backgroundColor = checkedBg;
    if (isActive && checkedBorder) customStyle.borderColor = checkedBorder;
    if (isActive && iconColor) customStyle.color = iconColor; // sets SVG stroke via currentColor

    return (
      <button
        type="button"
        role="checkbox"
        ref={ref}
        aria-checked={isIndeterminate ? 'mixed' : isChecked}
        aria-disabled={disabled}
        data-state={isIndeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
        disabled={disabled}
        onClick={(e) => {
          handleToggle(e);
          props.onClick?.(e);
        }}
        onKeyDown={handleKeyDown}
        style={customStyle}
        className={cn(
          checkboxVariants({ size }),
          
          // Unchecked State (always uses defaults)
          !isActive && "border-[#888888] bg-transparent dark:border-zinc-700",
          
          // Checked/Indeterminate State (Only applies default Tailwind classes if no custom hex is provided)
          isActive && !checkedBg && "bg-black text-white dark:bg-white dark:text-black",
          isActive && !checkedBorder && "border-black dark:border-white",
          
          className
        )}
        {...props}
      >
        {isChecked && <CheckIcon className={iconSizes[size || 'medium']} />}
        {isIndeterminate && <DashIcon className={iconSizes[size || 'medium']} />}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";