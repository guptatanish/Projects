import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const ChevronDownIcon = ({
  sizePx,
  color,
  rotated,
}: {
  sizePx: number;
  color?: string;
  rotated: boolean;
}) => (
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
    style={{
      transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 160ms ease',
    }}
    className="block shrink-0"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export type CollapsibleVariant = 'ghost' | 'bordered' | 'card';
export type CollapsibleSize = 'small' | 'medium' | 'large';
export type CollapsibleChevronPosition = 'right' | 'left';

const collapsibleRootVariants = cva(
  "w-full min-w-0",
  {
    variants: {
      size: {
        small: "text-xs leading-normal",
        medium: "text-sm leading-normal",
        large: "text-base leading-normal",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    triggerPadStyle: { padding: '10px 14px' } as React.CSSProperties,
    panelPadStyle: { padding: '12px 14px' } as React.CSSProperties,
    chevronPx: 14,
    titleClass: "text-xs font-semibold leading-normal",
    descClass: "text-[11px] leading-snug",
    gapClass: "gap-2",
  },
  medium: {
    triggerPadStyle: { padding: '12px 16px' } as React.CSSProperties,
    panelPadStyle: { padding: '16px 18px' } as React.CSSProperties,
    chevronPx: 16,
    titleClass: "text-sm font-semibold leading-normal",
    descClass: "text-xs leading-snug",
    gapClass: "gap-2.5",
  },
  large: {
    triggerPadStyle: { padding: '16px 20px' } as React.CSSProperties,
    panelPadStyle: { padding: '20px 22px' } as React.CSSProperties,
    chevronPx: 18,
    titleClass: "text-base font-semibold leading-normal",
    descClass: "text-xs leading-normal",
    gapClass: "gap-3",
  },
} as const;

export interface CollapsibleProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'onChange'>,
    VariantProps<typeof collapsibleRootVariants> {
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: CollapsibleVariant;
  size?: CollapsibleSize;
  chevronPosition?: CollapsibleChevronPosition;
  showChevron?: boolean;
  disabled?: boolean;
  unmountOnExit?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  headerBgColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  hoverBgColor?: string;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      className,
      title,
      description,
      trigger,
      children,
      open,
      defaultOpen = false,
      onOpenChange,
      variant = 'bordered',
      size = 'medium',
      chevronPosition = 'right',
      showChevron = true,
      disabled = false,
      unmountOnExit = false,
      bgColor,
      headerBgColor,
      borderColor,
      textColor,
      mutedTextColor,
      hoverBgColor,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const rootId = id || `${uid}-collapsible`;
    const panelId = `${uid}-panel`;
    const resolvedVariant: CollapsibleVariant = variant ?? 'bordered';
    const resolvedSize: CollapsibleSize = size ?? 'medium';
    const resolvedChevronPos: CollapsibleChevronPosition = chevronPosition ?? 'right';
    const metrics = sizeConfig[resolvedSize];

    const isControlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState<boolean>(Boolean(defaultOpen));
    const [isHovered, setIsHovered] = useState<boolean>(false);

    useEffect(() => {
      if (!isControlled) {
        setInternalOpen(Boolean(defaultOpen));
      }
    }, [defaultOpen, isControlled]);

    const isOpen = isControlled ? Boolean(open) : internalOpen;

    const handleToggle = () => {
      if (disabled) return;
      const next = !isOpen;
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    };

    const resolvedBorder = borderColor || '#e5e5e5';

    const getRootStyle = (): React.CSSProperties => {
      const base: React.CSSProperties = {
        backgroundColor: bgColor || (resolvedVariant === 'card' ? '#ffffff' : 'transparent'),
        ...style,
      };

      if (resolvedVariant === 'bordered' || resolvedVariant === 'card') {
        base.border = `1px solid ${resolvedBorder}`;
        base.borderRadius = '8px';
      }

      return base;
    };

    const getHeaderStyle = (): React.CSSProperties => {
      const defaultHeaderBg =
        resolvedVariant === 'card'
          ? '#fafafa'
          : resolvedVariant === 'bordered'
            ? 'transparent'
            : 'transparent';

      const bg =
        isHovered && !disabled && hoverBgColor
          ? hoverBgColor
          : headerBgColor || defaultHeaderBg;

      const headerStyle: React.CSSProperties = {
        ...metrics.triggerPadStyle,
        backgroundColor: bg,
        borderRadius:
          resolvedVariant === 'bordered' || resolvedVariant === 'card'
            ? isOpen
              ? '7px 7px 0 0'
              : '7px'
            : '6px',
      };

      return headerStyle;
    };

    const shouldRenderPanel = unmountOnExit ? isOpen : true;

    const chevronEl = showChevron ? (
      <ChevronDownIcon
        sizePx={metrics.chevronPx}
        color={mutedTextColor || textColor || undefined}
        rotated={isOpen}
      />
    ) : null;

    return (
      <div
        ref={ref}
        id={rootId}
        style={getRootStyle()}
        className={cn(
          collapsibleRootVariants({ size: resolvedSize }),
          resolvedVariant === 'card' && 'shadow-xs',
          className
        )}
        {...props}
      >
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={handleToggle}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={getHeaderStyle()}
          className={cn(
            'w-full flex items-center justify-between text-left transition-colors outline-none',
            metrics.gapClass,
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer focus-visible:ring-2 focus-visible:ring-black/25 dark:focus-visible:ring-white/30',
            isHovered && !disabled && !hoverBgColor && 'bg-black/[0.03] dark:bg-white/[0.05]'
          )}
        >
          {resolvedChevronPos === 'left' && chevronEl}

          <div className="min-w-0 flex-1">
            {trigger ? (
              trigger
            ) : (
              <div className="flex flex-col gap-0.5 min-w-0">
                {title && (
                  <span
                    style={{ color: textColor || undefined }}
                    className={cn(
                      metrics.titleClass,
                      'break-words',
                      !textColor && 'text-black dark:text-zinc-100'
                    )}
                  >
                    {title}
                  </span>
                )}
                {description && (
                  <span
                    style={{ color: mutedTextColor || undefined }}
                    className={cn(
                      metrics.descClass,
                      'break-words',
                      !mutedTextColor && 'text-[#666666] dark:text-zinc-400'
                    )}
                  >
                    {description}
                  </span>
                )}
              </div>
            )}
          </div>

          {resolvedChevronPos === 'right' && chevronEl}
        </button>

        {shouldRenderPanel && (
          <div
            id={panelId}
            hidden={!isOpen}
            style={{
              ...metrics.panelPadStyle,
              borderTop:
                isOpen && (resolvedVariant === 'bordered' || resolvedVariant === 'card')
                  ? `1px solid ${resolvedBorder}`
                  : undefined,
              color: textColor || undefined,
            }}
            className={cn(
              'min-w-0',
              !textColor && 'text-[#222222] dark:text-zinc-200'
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);

Collapsible.displayName = 'Collapsible';