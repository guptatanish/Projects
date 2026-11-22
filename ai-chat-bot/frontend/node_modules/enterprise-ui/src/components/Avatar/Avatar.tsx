import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Context & Types ---
type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface AvatarContextValue {
  status: ImageLoadingStatus;
  onStatusChange: (status: ImageLoadingStatus) => void;
}

const AvatarContext = createContext<AvatarContextValue | undefined>(undefined);

const useAvatarContext = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('Avatar components must be used within an <Avatar> provider');
  }
  return context;
};

// --- Root Component ---
const avatarVariants = cva(
  "relative inline-flex shrink-0 align-middle items-center justify-center overflow-hidden bg-[#E5E5E5] text-black dark:bg-zinc-800 dark:text-white",
  {
    variants: {
      size: {
        // Enforcing strict dimensions to prevent flexbox stretching/shrinking
        sm: "h-6 w-6 min-w-6 min-h-6 max-w-6 max-h-6 text-[10px]",
        md: "h-8 w-8 min-w-8 min-h-8 max-w-8 max-h-8 text-xs",
        lg: "h-10 w-10 min-w-10 min-h-10 max-w-10 max-h-10 text-sm",
        xl: "h-16 w-16 min-w-16 min-h-16 max-w-16 max-h-16 text-lg",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-md",
      },
    },
    defaultVariants: {
      size: "md",
      shape: "circle",
    },
  }
);

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, shape, children, ...props }, ref) => {
    const [status, setStatus] = useState<ImageLoadingStatus>('idle');

    const contextValue = useMemo(() => ({
      status,
      onStatusChange: setStatus,
    }), [status]);

    return (
      <AvatarContext.Provider value={contextValue}>
        <div ref={ref} className={cn(avatarVariants({ size, shape }), className)} {...props}>
          {children}
        </div>
      </AvatarContext.Provider>
    );
  }
);
Avatar.displayName = "Avatar";

// --- Avatar Image ---
export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
}

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt, onLoadingStatusChange, ...props }, ref) => {
    const { status, onStatusChange } = useAvatarContext();

    useEffect(() => {
      if (!src) {
        onStatusChange('error');
        return;
      }

      onStatusChange('loading');
      
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        onStatusChange('loaded');
        onLoadingStatusChange?.('loaded');
      };
      
      img.onerror = () => {
        onStatusChange('error');
        onLoadingStatusChange?.('error');
      };
    }, [src, onStatusChange, onLoadingStatusChange]);

    if (status !== 'loaded') return null;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        {...props}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

// --- Avatar Fallback ---
export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number;
}

export const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, delayMs, children, ...props }, ref) => {
    const { status } = useAvatarContext();
    const [canRender, setCanRender] = useState(delayMs === undefined);

    useEffect(() => {
      if (delayMs !== undefined) {
        const timer = setTimeout(() => setCanRender(true), delayMs);
        return () => clearTimeout(timer);
      }
    }, [delayMs]);

    if (status === 'loaded' || !canRender) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center font-medium",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AvatarFallback.displayName = "AvatarFallback";