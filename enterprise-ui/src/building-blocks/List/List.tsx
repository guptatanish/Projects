import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export interface ListItem {
  id: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  disabled?: boolean;
  onClick?: (item: ListItem) => void;
}

export type ListContainerElement = 'ul' | 'ol' | 'div';
export type ListVariant = 'plain' | 'bordered' | 'card' | 'divided';
export type ListSize = 'small' | 'medium' | 'large';

const listRootVariants = cva(
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
    rowPadStyle: { padding: '10px 14px' } as React.CSSProperties,
    emptyPadStyle: { padding: '20px 14px' } as React.CSSProperties,
    gapClass: "gap-2.5",
    primaryClass: "text-xs font-medium leading-normal",
    secondaryClass: "text-[11px] leading-snug",
    trailingClass: "text-[11px] leading-normal",
  },
  medium: {
    rowPadStyle: { padding: '12px 16px' } as React.CSSProperties,
    emptyPadStyle: { padding: '24px 16px' } as React.CSSProperties,
    gapClass: "gap-3",
    primaryClass: "text-sm font-medium leading-normal",
    secondaryClass: "text-xs leading-snug",
    trailingClass: "text-xs leading-normal",
  },
  large: {
    rowPadStyle: { padding: '16px 20px' } as React.CSSProperties,
    emptyPadStyle: { padding: '28px 20px' } as React.CSSProperties,
    gapClass: "gap-3.5",
    primaryClass: "text-base font-medium leading-normal",
    secondaryClass: "text-xs leading-normal",
    trailingClass: "text-xs leading-normal",
  },
} as const;

export interface ListProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect' | 'children'>,
    VariantProps<typeof listRootVariants> {
  items: ListItem[];
  as?: ListContainerElement;
  variant?: ListVariant;
  size?: ListSize;
  selectable?: boolean;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (item: ListItem) => void;
  emptyText?: string;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  itemBgColor?: string;
  activeBgColor?: string;
  hoverBgColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedTextColor?: string;
}

export const List = React.forwardRef<HTMLElement, ListProps>(
  (
    {
      className,
      items = [],
      as = 'ul',
      variant = 'bordered',
      size = 'medium',
      selectable = false,
      selectedId,
      defaultSelectedId,
      onSelect,
      emptyText = 'No items found.',
      bgColor,
      itemBgColor,
      activeBgColor,
      hoverBgColor,
      borderColor,
      textColor,
      mutedTextColor,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const listId = id || `${uid}-list`;
    const ContainerTag: ListContainerElement = as ?? 'ul';
    const isListTag = ContainerTag === 'ul' || ContainerTag === 'ol';
    const ItemTag: 'li' | 'div' = isListTag ? 'li' : 'div';

    const resolvedVariant: ListVariant = variant ?? 'bordered';
    const resolvedSize: ListSize = size ?? 'medium';
    const metrics = sizeConfig[resolvedSize];

    const isControlled = selectedId !== undefined;
    const [internalSelected, setInternalSelected] = useState<string | undefined>(defaultSelectedId);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    useEffect(() => {
      if (!isControlled && defaultSelectedId !== undefined) {
        setInternalSelected(defaultSelectedId);
      }
    }, [defaultSelectedId, isControlled]);

    const currentSelectedId = isControlled ? selectedId : internalSelected;
    const resolvedBorder = borderColor || '#e5e5e5';

    const getContainerStyle = (): React.CSSProperties => {
      const base: React.CSSProperties = {
        backgroundColor: bgColor || (resolvedVariant === 'card' ? '#ffffff' : 'transparent'),
        ...style,
      };

      if (resolvedVariant === 'bordered' || resolvedVariant === 'card') {
        base.border = `1px solid ${resolvedBorder}`;
        base.borderRadius = '8px';
        base.overflow = 'hidden';
      }

      return base;
    };

    const handleItemActivate = (item: ListItem) => {
      if (item.disabled) return;
      if (selectable) {
        if (!isControlled) {
          setInternalSelected(item.id);
        }
        onSelect?.(item);
      } else if (item.onClick) {
        item.onClick(item);
        onSelect?.(item);
      }
    };

    return (
      <ContainerTag
        ref={ref as any}
        id={listId}
        style={getContainerStyle()}
        className={cn(
          listRootVariants({ size: resolvedSize }),
          isListTag && 'list-none m-0 p-0',
          resolvedVariant === 'card' && 'shadow-xs',
          resolvedVariant === 'plain' && 'flex flex-col gap-2',
          className
        )}
        {...(props as any)}
      >
        {items.length === 0 ? (
          <ItemTag
            style={{
              ...metrics.emptyPadStyle,
              color: mutedTextColor || textColor || undefined,
            }}
            className={cn(
              'text-center break-words',
              !mutedTextColor && !textColor && 'text-[#666666] dark:text-zinc-400'
            )}
          >
            {emptyText}
          </ItemTag>
        ) : (
          items.map((item, idx) => {
            const isSelected = Boolean(selectable && currentSelectedId === item.id);
            const isInteractive = Boolean(!item.disabled && (selectable || item.onClick || onSelect));
            const isHovered = hoveredId === item.id && isInteractive && !isSelected;

            const rowBg = isSelected
              ? activeBgColor || '#f3f4f6'
              : isHovered && hoverBgColor
                ? hoverBgColor
                : itemBgColor || (resolvedVariant === 'plain' ? '#fafafa' : 'transparent');

            const showDivider =
              idx > 0 && (resolvedVariant === 'bordered' || resolvedVariant === 'card' || resolvedVariant === 'divided');

            const rowStyle: React.CSSProperties = {
              ...metrics.rowPadStyle,
              backgroundColor: rowBg,
              borderTop: showDivider ? `1px solid ${resolvedBorder}` : undefined,
              borderRadius: resolvedVariant === 'plain' ? '6px' : undefined,
              border: resolvedVariant === 'plain' ? `1px solid ${resolvedBorder}` : undefined,
            };

            const contentInner = (
              <>
                {item.leading && (
                  <span className="inline-flex items-center justify-center shrink-0">
                    {item.leading}
                  </span>
                )}

                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                  <span
                    style={{ color: textColor || undefined }}
                    className={cn(
                      metrics.primaryClass,
                      'break-words',
                      !textColor && 'text-black dark:text-zinc-100'
                    )}
                  >
                    {item.primary}
                  </span>

                  {item.secondary && (
                    <span
                      style={{ color: mutedTextColor || undefined }}
                      className={cn(
                        metrics.secondaryClass,
                        'break-words',
                        !mutedTextColor && 'text-[#666666] dark:text-zinc-400'
                      )}
                    >
                      {item.secondary}
                    </span>
                  )}
                </div>

                {item.trailing && (
                  <span
                    style={{ color: mutedTextColor || textColor || undefined }}
                    className={cn(
                      metrics.trailingClass,
                      'shrink-0',
                      !mutedTextColor && !textColor && 'text-[#666666] dark:text-zinc-400'
                    )}
                  >
                    {item.trailing}
                  </span>
                )}
              </>
            );

            return (
              <ItemTag
                key={`${uid}-item-${item.id}`}
                aria-selected={selectable ? isSelected : undefined}
                onMouseEnter={() => isInteractive && setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={resolvedVariant === 'plain' && isSelected && activeBgColor ? { ...rowStyle, backgroundColor: activeBgColor } : rowStyle}
                className={cn(
                  'min-w-0',
                  item.disabled && 'opacity-50',
                  isHovered && !hoverBgColor && 'bg-black/[0.03] dark:bg-white/[0.05]'
                )}
              >
                {isInteractive ? (
                  <button
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handleItemActivate(item)}
                    className={cn(
                      'w-full flex items-center text-left bg-transparent border-0 p-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-black/25 dark:focus-visible:ring-white/30 rounded',
                      metrics.gapClass
                    )}
                  >
                    {contentInner}
                  </button>
                ) : (
                  <div className={cn('w-full flex items-center', metrics.gapClass)}>
                    {contentInner}
                  </div>
                )}
              </ItemTag>
            );
          })
        )}
      </ContainerTag>
    );
  }
);

List.displayName = 'List';