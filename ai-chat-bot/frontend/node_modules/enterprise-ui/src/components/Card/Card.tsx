import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Root Component ---
const cardVariants = cva(
  "rounded-xl overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        outline: "border border-[#888888] bg-white text-black dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-100",
        elevated: "shadow-md bg-white text-black border border-transparent dark:bg-zinc-950 dark:shadow-zinc-900/50 dark:text-zinc-100",
        filled: "bg-[#E5E5E5] text-black border border-transparent dark:bg-zinc-900 dark:text-zinc-100",
      },
      isInteractive: {
        true: "hover:shadow-lg hover:-translate-y-1 cursor-pointer",
        false: "",
      }
    },
    defaultVariants: {
      variant: "outline",
      isInteractive: false,
    }
  }
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  cardBg?: string;
  borderColor?: string;
  textColor?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, isInteractive, cardBg, borderColor, textColor, style, ...props }, ref) => {
    
    // Map custom hex codes to CSS variables safely
    const customStyle = {
      ...style,
      ...(cardBg ? { '--card-bg': cardBg } : {}),
      ...(borderColor ? { '--card-border': borderColor } : {}),
      ...(textColor ? { '--card-text': textColor } : {}),
    } as React.CSSProperties;

    return (
      <div
        ref={ref}
        style={customStyle}
        className={cn(
          cardVariants({ variant, isInteractive }),
          // Apply variables and explicitly force them to override dark mode defaults
          cardBg && "bg-[var(--card-bg)] dark:bg-[var(--card-bg)]",
          borderColor && "border-[var(--card-border)] dark:border-[var(--card-border)]",
          textColor && "text-[var(--card-text)] dark:text-[var(--card-text)]",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// --- Header ---
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// --- Title ---
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// --- Description ---
export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-[#888888] dark:text-zinc-400", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

// --- Content ---
export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

// --- Footer ---
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";