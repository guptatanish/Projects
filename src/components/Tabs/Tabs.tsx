import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

const tabsRootVariants = cva(
  "w-full flex",
  {
    variants: {
      orientation: {
        horizontal: "flex-col",
        vertical: "flex-col sm:flex-row items-start",
      },
      size: {
        small: "text-xs leading-normal",
        medium: "text-sm leading-normal",
        large: "text-base leading-normal",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    triggerClass: "px-3 py-1.5 gap-1.5 text-xs leading-normal",
    iconPx: 14,
    badgeClass: "text-[10px] px-2 py-0.5",
    panelPadStyle: { padding: '16px 20px' } as React.CSSProperties,
    listGapClass: "gap-1",
  },
  medium: {
    triggerClass: "px-4 py-2 gap-2 text-sm leading-normal",
    iconPx: 16,
    badgeClass: "text-xs px-2 py-0.5",
    panelPadStyle: { padding: '20px 24px' } as React.CSSProperties,
    listGapClass: "gap-1.5",
  },
  large: {
    triggerClass: "px-5 py-2.5 gap-2.5 text-base leading-normal",
    iconPx: 18,
    badgeClass: "text-xs px-2.5 py-0.5",
    panelPadStyle: { padding: '24px 28px' } as React.CSSProperties,
    listGapClass: "gap-2",
  },
} as const;

export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'>,
    VariantProps<typeof tabsRootVariants> {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'enclosed';
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  activeColor?: string;
  inactiveColor?: string;
  indicatorColor?: string;
  hoverBg?: string;
  borderColor?: string;
  textColor?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      className,
      items = [],
      value,
      defaultValue,
      onChange,
      variant = 'underline',
      orientation = 'horizontal',
      size = 'medium',
      fullWidth = false,
      activeColor,
      inactiveColor,
      indicatorColor,
      hoverBg,
      borderColor,
      textColor,
      style,
      'aria-label': ariaLabel = 'Tabs',
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const resolvedVariant = variant ?? 'underline';
    const resolvedOrientation = orientation ?? 'horizontal';
    const metrics = sizeConfig[size || 'medium'];
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const enabledItems = items.filter((it) => !it.disabled);
    const firstEnabledId = enabledItems[0]?.id ?? items[0]?.id ?? '';

    const resolveValidId = (candidate?: string): string => {
      if (candidate && items.some((it) => it.id === candidate && !it.disabled)) {
        return candidate;
      }
      if (candidate && items.some((it) => it.id === candidate)) {
        return candidate;
      }
      return firstEnabledId;
    };

    const isControlled = value !== undefined;
    const [internalTabId, setInternalTabId] = useState<string>(() => resolveValidId(defaultValue));

    useEffect(() => {
      if (!isControlled && defaultValue !== undefined) {
        setInternalTabId(resolveValidId(defaultValue));
      }
    }, [defaultValue, items, isControlled]);

    useEffect(() => {
      if (!isControlled && !items.some((it) => it.id === internalTabId)) {
        setInternalTabId(firstEnabledId);
      }
    }, [items, internalTabId, firstEnabledId, isControlled]);

    const activeId = isControlled ? resolveValidId(value) : resolveValidId(internalTabId);
    const activeItem = items.find((it) => it.id === activeId) ?? items[0];

    const selectTab = (tabId: string, focusTrigger = false) => {
      const target = items.find((it) => it.id === tabId);
      if (!target || target.disabled) return;
      if (!isControlled) {
        setInternalTabId(tabId);
      }
      if (tabId !== activeId) {
        onChange?.(tabId);
      }
      if (focusTrigger) {
        document.getElementById(`${uid}-tab-${tabId}`)?.focus();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      if (items.length === 0) return;
      const nextKey = resolvedOrientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const prevKey = resolvedOrientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

      const findNextEnabled = (startIndex: number, step: 1 | -1): string | null => {
        let idx = startIndex;
        for (let i = 0; i < items.length; i += 1) {
          idx = (idx + step + items.length) % items.length;
          if (!items[idx]?.disabled) {
            return items[idx].id;
          }
        }
        return null;
      };

      if (e.key === nextKey) {
        e.preventDefault();
        const nextId = findNextEnabled(currentIndex, 1);
        if (nextId) selectTab(nextId, true);
      } else if (e.key === prevKey) {
        e.preventDefault();
        const prevId = findNextEnabled(currentIndex, -1);
        if (prevId) selectTab(prevId, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        const firstId = items.find((it) => !it.disabled)?.id;
        if (firstId) selectTab(firstId, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastId = [...items].reverse().find((it) => !it.disabled)?.id;
        if (lastId) selectTab(lastId, true);
      }
    };

    const resolvedBorder = borderColor || '#e5e5e5';

    const getTabListStyle = (): React.CSSProperties => {
      if (resolvedVariant === 'underline') {
        if (resolvedOrientation === 'vertical') {
          return {
            borderRight: `1px solid ${resolvedBorder}`,
            paddingRight: '8px',
          };
        }
        return {
          borderBottom: `1px solid ${resolvedBorder}`,
        };
      }
      if (resolvedVariant === 'enclosed') {
        return {
          borderBottom: resolvedOrientation === 'horizontal' ? `1px solid ${resolvedBorder}` : undefined,
          borderRight: resolvedOrientation === 'vertical' ? `1px solid ${resolvedBorder}` : undefined,
        };
      }
      return {};
    };

    const getTriggerStyle = (item: TabItem, isActive: boolean): React.CSSProperties => {
      const isHovered = hoveredId === item.id && !item.disabled && !isActive;
      const baseColor = isActive
        ? activeColor || textColor || '#111111'
        : inactiveColor || textColor || '#555555';

      const styleObj: React.CSSProperties = {
        color: baseColor,
        position: 'relative',
      };

      if (isHovered && hoverBg) {
        styleObj.backgroundColor = hoverBg;
      }

      if (resolvedVariant === 'pills') {
        if (isActive) {
          const pillBg = indicatorColor || '#111111';
          const isLightPillBg =
            pillBg.toLowerCase() === '#ffffff' || pillBg.toLowerCase() === '#fff';
          styleObj.backgroundColor = pillBg;
          styleObj.color = activeColor || (isLightPillBg ? '#111111' : '#ffffff');
        }
      } else if (resolvedVariant === 'enclosed') {
        if (isActive) {
          styleObj.backgroundColor = '#ffffff';
          styleObj.borderTop = `1px solid ${resolvedBorder}`;
          styleObj.borderLeft = `1px solid ${resolvedBorder}`;
          styleObj.borderRight = `1px solid ${resolvedBorder}`;
          styleObj.borderBottom = '1px solid #ffffff';
          styleObj.marginBottom = '-1px';
        }
      }

      return styleObj;
    };

    return (
      <div
        ref={ref}
        style={style}
        className={cn(
          tabsRootVariants({ orientation: resolvedOrientation, size }),
          resolvedOrientation === 'vertical' && 'gap-4',
          className
        )}
        {...props}
      >
        <div
          role="tablist"
          aria-label={ariaLabel}
          aria-orientation={resolvedOrientation}
          style={getTabListStyle()}
          className={cn(
            'flex flex-wrap shrink-0',
            resolvedOrientation === 'vertical' ? 'flex-col min-w-[170px]' : 'flex-row',
            fullWidth && resolvedOrientation === 'horizontal' && 'w-full',
            metrics.listGapClass
          )}
        >
          {items.map((item, index) => {
            const isActive = item.id === activeId;
            const isHovered = hoveredId === item.id && !item.disabled && !isActive;
            const accent = indicatorColor || activeColor || '#111111';
            const pillBg = indicatorColor || '#111111';
            const isLightPillBg =
              pillBg.toLowerCase() === '#ffffff' || pillBg.toLowerCase() === '#fff';
            const activePillText = activeColor || (isLightPillBg ? '#111111' : '#ffffff');
            const isActivePillChip = resolvedVariant === 'pills' && isActive;

            return (
              <button
                key={`${uid}-tab-${item.id}`}
                id={`${uid}-tab-${item.id}`}
                type="button"
                role="tab"
                disabled={item.disabled}
                aria-selected={isActive}
                aria-controls={`${uid}-panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                onMouseEnter={() => !item.disabled && setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => selectTab(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={getTriggerStyle(item, isActive)}
                className={cn(
                  'inline-flex items-center justify-center font-medium transition-colors shrink-0',
                  metrics.triggerClass,
                  fullWidth && resolvedOrientation === 'horizontal' && 'flex-1',
                  resolvedVariant === 'pills' && 'rounded-md',
                  resolvedVariant === 'enclosed' && 'rounded-t-md',
                  resolvedVariant === 'underline' && 'rounded-t-sm',
                  item.disabled
                    ? 'opacity-45 cursor-not-allowed'
                    : 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1',
                  isHovered && !hoverBg && 'bg-black/[0.04] dark:bg-white/[0.06]',
                  !activeColor &&
                    !inactiveColor &&
                    !textColor &&
                    resolvedVariant !== 'pills' &&
                    (isActive
                      ? 'text-black dark:text-zinc-100 font-semibold'
                      : 'text-[#555555] dark:text-zinc-400')
                )}
              >
                {item.icon && (
                  <span
                    style={{ width: `${metrics.iconPx}px`, height: `${metrics.iconPx}px` }}
                    className="inline-flex items-center justify-center shrink-0"
                  >
                    {item.icon}
                  </span>
                )}

                <span className="truncate">{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    style={
                      isActivePillChip
                        ? {
                            backgroundColor: isLightPillBg
                              ? 'rgba(17, 17, 17, 0.12)'
                              : 'rgba(255, 255, 255, 0.2)',
                            color: activePillText,
                          }
                        : {
                            backgroundColor: '#e5e5e5',
                            color: '#111111',
                          }
                    }
                    className={cn(
                      'rounded-full font-semibold tabular-nums shrink-0',
                      metrics.badgeClass
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {resolvedVariant === 'underline' && isActive && resolvedOrientation === 'horizontal' && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: '-1px',
                      height: '2px',
                      backgroundColor: accent,
                    }}
                  />
                )}

                {resolvedVariant === 'underline' && isActive && resolvedOrientation === 'vertical' && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: '-9px',
                      width: '2px',
                      backgroundColor: accent,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {activeItem && (
          <div
            id={`${uid}-panel-${activeItem.id}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${activeItem.id}`}
            style={{
              ...metrics.panelPadStyle,
              color: textColor || undefined,
            }}
            className={cn(
              'flex-1 min-w-0 w-full',
              !textColor && 'text-[#222222] dark:text-zinc-200'
            )}
          >
            {activeItem.content}
          </div>
        )}
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';