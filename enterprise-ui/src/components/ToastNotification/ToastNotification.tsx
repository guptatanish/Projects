import React, { useEffect, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const InfoIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

const SuccessIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const WarningIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ErrorIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);

const CloseIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export type ToastVariant = 'default' | 'info' | 'success' | 'warning' | 'error';
export type ToastSize = 'small' | 'medium' | 'large';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

const toastCardVariants = cva(
  "w-full max-w-sm rounded-lg border shadow-sm flex items-start min-w-0",
  {
    variants: {
      size: {
        small: "text-xs leading-normal gap-2.5",
        medium: "text-sm leading-normal gap-3",
        large: "text-base leading-normal gap-3.5",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    padStyle: { padding: '12px 14px' } as React.CSSProperties,
    iconPx: 16,
    closePx: 14,
    titleClass: "text-xs font-semibold leading-normal",
    descClass: "text-[11px] leading-snug",
    actionClass: "text-[11px] font-semibold",
  },
  medium: {
    padStyle: { padding: '14px 18px' } as React.CSSProperties,
    iconPx: 18,
    closePx: 16,
    titleClass: "text-sm font-semibold leading-normal",
    descClass: "text-xs leading-relaxed",
    actionClass: "text-xs font-semibold",
  },
  large: {
    padStyle: { padding: '18px 22px' } as React.CSSProperties,
    iconPx: 20,
    closePx: 18,
    titleClass: "text-base font-semibold leading-normal",
    descClass: "text-sm leading-relaxed",
    actionClass: "text-xs font-semibold",
  },
} as const;

const tonePalette: Record<
  ToastVariant,
  {
    bg: string;
    border: string;
    title: string;
    desc: string;
    icon: string;
    accent: string;
  }
> = {
  default: {
    bg: '#ffffff',
    border: '#e5e5e5',
    title: '#111111',
    desc: '#52525b',
    icon: '#111111',
    accent: '#111111',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    title: '#1e3a8a',
    desc: '#1d4ed8',
    icon: '#2563eb',
    accent: '#1d4ed8',
  },
  success: {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    title: '#14532d',
    desc: '#15803d',
    icon: '#16a34a',
    accent: '#15803d',
  },
  warning: {
    bg: '#fffbeb',
    border: '#fde68a',
    title: '#78350f',
    desc: '#b45309',
    icon: '#d97706',
    accent: '#b45309',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    title: '#7f1d1d',
    desc: '#b91c1c',
    icon: '#dc2626',
    accent: '#b91c1c',
  },
};

export interface ToastNotificationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof toastCardVariants> {
  title: string;
  description?: string;
  variant?: ToastVariant;
  size?: ToastSize;
  position?: ToastPosition;
  duration?: number;
  open?: boolean;
  onClose?: () => void;
  closable?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  iconColor?: string;
  accentColor?: string;
}

export const ToastNotification = React.forwardRef<HTMLDivElement, ToastNotificationProps>(
  (
    {
      className,
      title,
      description,
      variant = 'default',
      size = 'medium',
      position = 'bottom-right',
      duration = 5000,
      open = true,
      onClose,
      closable = true,
      actionLabel,
      onAction,
      icon,
      bgColor,
      borderColor,
      textColor,
      iconColor,
      accentColor,
      style,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const resolvedVariant: ToastVariant = variant ?? 'default';
    const resolvedSize: ToastSize = size ?? 'medium';
    const metrics = sizeConfig[resolvedSize];
    const palette = tonePalette[resolvedVariant];

    useEffect(() => {
      if (!open || !onClose || duration <= 0) return;
      const timer = window.setTimeout(() => {
        onClose();
      }, duration);
      return () => window.clearTimeout(timer);
    }, [open, onClose, duration]);

    if (!open) return null;

    const ariaRole =
      resolvedVariant === 'error' || resolvedVariant === 'warning' ? 'alert' : 'status';
    const ariaLive =
      resolvedVariant === 'error' || resolvedVariant === 'warning' ? 'assertive' : 'polite';

    const resolvedBg = bgColor || palette.bg;
    const resolvedBorder = borderColor || palette.border;
    const resolvedTitleColor = textColor || palette.title;
    const resolvedDescColor = textColor || palette.desc;
    const resolvedIconColor = iconColor || palette.icon;
    const resolvedAccentColor = accentColor || palette.accent;

    const renderDefaultIcon = () => {
      switch (resolvedVariant) {
        case 'info':
          return <InfoIcon sizePx={metrics.iconPx} color={resolvedIconColor} />;
        case 'success':
          return <SuccessIcon sizePx={metrics.iconPx} color={resolvedIconColor} />;
        case 'warning':
          return <WarningIcon sizePx={metrics.iconPx} color={resolvedIconColor} />;
        case 'error':
          return <ErrorIcon sizePx={metrics.iconPx} color={resolvedIconColor} />;
        default:
          return <InfoIcon sizePx={metrics.iconPx} color={resolvedIconColor} />;
      }
    };

    return (
      <div
        ref={ref}
        id={`${uid}-toast`}
        role={ariaRole}
        aria-live={ariaLive}
        data-position={position}
        style={{
          ...metrics.padStyle,
          backgroundColor: resolvedBg,
          borderColor: resolvedBorder,
          ...style,
        }}
        className={cn(toastCardVariants({ size: resolvedSize }), className)}
        {...props}
      >
        <div
          style={{ color: resolvedIconColor, marginTop: '2px' }}
          className="inline-flex items-center justify-center shrink-0"
        >
          {icon ?? renderDefaultIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <div
            style={{ color: resolvedTitleColor }}
            className={cn(metrics.titleClass, 'break-words')}
          >
            {title}
          </div>

          {description && (
            <p
              style={{ color: resolvedDescColor }}
              className={cn(metrics.descClass, 'mt-1 break-words')}
            >
              {description}
            </p>
          )}

          {actionLabel && onAction && (
            <div className="mt-2.5 flex items-center gap-3">
              <button
                type="button"
                onClick={onAction}
                style={{ color: resolvedAccentColor }}
                className={cn(
                  metrics.actionClass,
                  'underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 rounded'
                )}
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>

        {closable && onClose && (
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={onClose}
            style={{ color: resolvedDescColor, padding: '4px' }}
            className="shrink-0 rounded-md bg-transparent border-0 cursor-pointer hover:bg-black/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <CloseIcon sizePx={metrics.closePx} color={resolvedDescColor} />
          </button>
        )}
      </div>
    );
  }
);

ToastNotification.displayName = 'ToastNotification';