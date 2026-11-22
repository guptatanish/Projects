import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva(
  "inline-flex items-center justify-center shrink-0",
  {
    variants: {
      size: {
        small: "w-4 h-4",
        medium: "w-6 h-6",
        large: "w-8 h-8",
        xlarge: "w-12 h-12",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {
  variant?: 'circle' | 'orbit' | 'ring';
  speed?: 'slow' | 'normal' | 'fast';
  label?: string;
  color?: string;
  trackColor?: string;
}

const speedMap = {
  slow: '1.5s',
  normal: '0.85s',
  fast: '0.5s',
};

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({
    className,
    variant = 'circle',
    size = 'medium',
    speed = 'normal',
    label = 'Loading...',
    color,
    trackColor,
    style,
    ...props
  }, ref) => {
    const animationDuration = speedMap[speed];
    
    const activeColor = color || 'currentColor';
    const bgTrackColor = trackColor || (color ? 'transparent' : 'currentColor');

    const renderVariant = () => {
      switch (variant) {
        case 'orbit':
          return (
            <svg 
              className="w-full h-full animate-spin" 
              viewBox="0 0 24 24" 
              style={{ animationDuration }}
            >
              <circle cx="12" cy="3" r="2.5" fill={activeColor} />
              <circle cx="19.79" cy="16.5" r="2.5" fill={activeColor} className="opacity-70" />
              <circle cx="4.21" cy="16.5" r="2.5" fill={activeColor} className="opacity-40" />
            </svg>
          );

        case 'ring':
          return (
            <div 
              className="w-full h-full rounded-full border-solid animate-spin"
              style={{
                borderWidth: size === 'small' ? '2px' : size === 'xlarge' ? '4px' : '3px',
                borderColor: trackColor || 'rgba(136, 136, 136, 0.2)',
                borderTopColor: activeColor,
                animationDuration,
              }}
            />
          );

        case 'circle':
        default:
          return (
            <svg 
              className="w-full h-full animate-spin" 
              viewBox="0 0 24 24" 
              fill="none" 
              style={{ animationDuration }}
            >
              <circle 
                cx="12" cy="12" r="10" 
                stroke={bgTrackColor} 
                strokeWidth={size === 'small' ? '3' : '4'} 
                className={!trackColor ? "opacity-20" : ""} 
              />
              <path 
                fill={activeColor} 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
              />
            </svg>
          );
      }
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn(spinnerVariants({ size }), className)}
        style={style}
        {...props}
      >
        {renderVariant()}
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";