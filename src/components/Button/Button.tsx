import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary/50 hover:text-secondary-foreground",
        ghostNegative: "text-destructive hover:bg-destructive/10",
        success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600",
        warning: "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
        error: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        xsmall: "h-7 px-2 text-xs rounded-sm",
        small: "h-8 px-3 text-sm",
        medium: "h-10 px-4 py-2 text-sm",
        large: "h-12 px-8 text-base",
        xlarge: "h-14 px-10 text-lg rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  pressed?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, pressed, disabled, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-pressed={pressed}
        data-state={pressed ? "on" : "off"}
        className={cn(
          buttonVariants({ variant, size, className }),
          pressed && "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90"
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";