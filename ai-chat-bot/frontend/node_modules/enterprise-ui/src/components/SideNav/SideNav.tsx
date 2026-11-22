import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const EMPTY_ITEMS: SideNavItem[] = [];
const EMPTY_GROUPS: SideNavGroup[] = [];

const ChevronIcon = ({
  sizePx,
  expanded,
  color,
}: {
  sizePx: number;
  expanded: boolean;
  color?: string;
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
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 150ms ease',
    }}
    className="block shrink-0"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const CollapseToggleIcon = ({
  sizePx,
  collapsed,
  color,
}: {
  sizePx: number;
  collapsed: boolean;
  color?: string;
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
    className="block shrink-0"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    {collapsed ? <path d="m14 9 3 3-3 3" /> : <path d="m16 9-3 3 3 3" />}
  </svg>
);

export interface SideNavItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: SideNavItem[];
  onClick?: (item: SideNavItem) => void;
}

export interface SideNavGroup {
  id: string;
  title?: string;
  items: SideNavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const sideNavContainerVariants = cva(
  "flex flex-col border-r transition-colors bg-white dark:bg-zinc-950 border-[#e5e5e5] dark:border-zinc-800 text-black dark:text-zinc-100",
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
    iconPx: 15,
    chevronPx: 13,
    itemClass: "px-2.5 py-1.5 gap-2 text-xs leading-normal",
    badgeClass: "text-[10px] px-1.5 py-0.5",
    groupTitleClass: "text-xs px-2.5 pt-3 pb-1",
    sectionGapClass: "gap-0.5",
  },
  medium: {
    iconPx: 18,
    chevronPx: 14,
    itemClass: "px-3 py-2 gap-2.5 text-sm leading-normal",
    badgeClass: "text-xs px-1.5 py-0.5",
    groupTitleClass: "text-sm px-3 pt-4 pb-1.5",
    sectionGapClass: "gap-1",
  },
  large: {
    iconPx: 20,
    chevronPx: 16,
    itemClass: "px-3.5 py-2.5 gap-3 text-base leading-normal",
    badgeClass: "text-xs px-2 py-0.5",
    groupTitleClass: "text-base px-5 pt-4 pb-1.5",
    sectionGapClass: "gap-1",
  },
} as const;

const formatDimension = (dim?: number | string): string | undefined => {
  if (dim === undefined) return undefined;
  return typeof dim === 'number' ? `${dim}px` : dim;
};

const itemContainsActive = (item: SideNavItem, activeId?: string): boolean => {
  if (!activeId) return false;
  if (item.id === activeId) return true;
  if (item.children?.length) {
    return item.children.some((child) => itemContainsActive(child, activeId));
  }
  return false;
};

export interface SideNavProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'>,
    VariantProps<typeof sideNavContainerVariants> {
  items?: SideNavItem[];
  groups?: SideNavGroup[];
  activeId?: string;
  onSelect?: (item: SideNavItem) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  showCollapseToggle?: boolean;
  width?: number | string;
  collapsedWidth?: number | string;
  size?: 'small' | 'medium' | 'large';

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  hoverBg?: string;
  activeBg?: string;
  activeColor?: string;
}

export const SideNav = React.forwardRef<HTMLElement, SideNavProps>(
  (
    {
      className,
      items = EMPTY_ITEMS,
      groups = EMPTY_GROUPS,
      activeId,
      onSelect,
      header,
      footer,
      collapsed,
      defaultCollapsed = false,
      onCollapsedChange,
      showCollapseToggle = false,
      width = 256,
      collapsedWidth = 60,
      size = 'medium',
      bgColor,
      borderColor,
      textColor,
      hoverBg,
      activeBg,
      activeColor,
      style,
      'aria-label': ariaLabel = 'Sidebar navigation',
      ...props
    },
    ref
  ) => {
    const navId = useId();
    const isCollapseControlled = collapsed !== undefined;
    const [internalCollapsed, setInternalCollapsed] = useState<boolean>(defaultCollapsed);
    const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({});
    const [openGroupIds, setOpenGroupIds] = useState<Record<string, boolean>>(() => {
      const initial: Record<string, boolean> = {};
      groups.forEach((g) => {
        initial[g.id] = g.defaultOpen !== undefined ? g.defaultOpen : true;
      });
      return initial;
    });
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const isCollapsed = isCollapseControlled ? Boolean(collapsed) : internalCollapsed;
    const metrics = sizeConfig[size || 'medium'];

    useEffect(() => {
      if (!activeId) return;

      const nextExpanded: Record<string, boolean> = {};
      const walk = (list: SideNavItem[]) => {
        list.forEach((it) => {
          if (it.children?.length) {
            if (it.children.some((c) => itemContainsActive(c, activeId))) {
              nextExpanded[it.id] = true;
            }
            walk(it.children);
          }
        });
      };

      walk(items);
      groups.forEach((g) => walk(g.items));

      if (Object.keys(nextExpanded).length > 0) {
        setOpenItemIds((prev) => {
          const hasChanges = Object.keys(nextExpanded).some((k) => !prev[k]);
          return hasChanges ? { ...prev, ...nextExpanded } : prev;
        });
      }
    }, [activeId, items, groups]);

    const toggleCollapsed = () => {
      const next = !isCollapsed;
      if (!isCollapseControlled) {
        setInternalCollapsed(next);
      }
      onCollapsedChange?.(next);
    };

    const toggleItemExpand = (itemId: string) => {
      setOpenItemIds((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
    };

    const toggleGroupExpand = (groupId: string) => {
      setOpenGroupIds((prev) => ({
        ...prev,
        [groupId]: prev[groupId] === undefined ? false : !prev[groupId],
      }));
    };

    const handleItemActivate = (item: SideNavItem, e: React.MouseEvent) => {
      if (item.disabled) {
        e.preventDefault();
        return;
      }
      if (item.children?.length && !isCollapsed) {
        toggleItemExpand(item.id);
      }
      item.onClick?.(item);
      onSelect?.(item);
    };

    const resolvedWidth = isCollapsed
      ? formatDimension(collapsedWidth)
      : formatDimension(width);

    const renderNavItem = (item: SideNavItem, depth = 0): React.ReactNode => {
      const hasChildren = Boolean(item.children && item.children.length > 0);
      const isExpanded = Boolean(openItemIds[item.id]);
      const isActive = activeId !== undefined && item.id === activeId;
      const isBranchActive = !isActive && hasChildren && item.children!.some((c) => itemContainsActive(c, activeId));
      const hoverKey = `${navId}-${item.id}-${depth}`;
      const isHovered = hoveredKey === hoverKey && !item.disabled;

      const rowStyle: React.CSSProperties = {};
      if (isActive && activeBg) {
        rowStyle.backgroundColor = activeBg;
      } else if (isHovered && hoverBg) {
        rowStyle.backgroundColor = hoverBg;
      }

      const contentColor = isActive
        ? activeColor || textColor || undefined
        : textColor || undefined;

      const sharedClasses = cn(
        'group flex w-full items-center rounded-md transition-colors min-w-0',
        metrics.itemClass,
        isCollapsed && 'justify-center px-2',
        item.disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white',
        !activeBg && isActive && 'bg-black/[0.08] dark:bg-white/[0.12] font-semibold',
        !activeBg && !isActive && isBranchActive && 'font-medium',
        !hoverBg && !isActive && !item.disabled && 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
        !activeColor && isActive && 'text-black dark:text-white',
        !textColor && !isActive && 'text-[#333333] dark:text-zinc-300'
      );

      const innerContent = (
        <>
          {item.icon && (
            <span
              style={{
                width: `${metrics.iconPx}px`,
                height: `${metrics.iconPx}px`,
                color: contentColor,
              }}
              className="inline-flex items-center justify-center shrink-0"
            >
              {item.icon}
            </span>
          )}

          {!isCollapsed && (
            <span
              style={{ color: contentColor }}
              className="flex-1 min-w-0 truncate text-left"
            >
              {item.label}
            </span>
          )}

          {!isCollapsed && item.badge !== undefined && (
            <span
              className={cn(
                'shrink-0 rounded-full font-medium tabular-nums bg-black/[0.07] dark:bg-white/[0.12] text-[#333333] dark:text-zinc-200',
                metrics.badgeClass
              )}
            >
              {item.badge}
            </span>
          )}

          {!isCollapsed && hasChildren && (
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!item.disabled) toggleItemExpand(item.id);
              }}
              style={{ color: contentColor }}
              className="inline-flex items-center justify-center shrink-0 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <ChevronIcon
                sizePx={metrics.chevronPx}
                expanded={isExpanded}
                color={contentColor}
              />
            </span>
          )}
        </>
      );

      return (
        <div key={hoverKey} className="flex flex-col">
          {item.href && !item.disabled ? (
            <a
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              onMouseEnter={() => setHoveredKey(hoverKey)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={(e) => handleItemActivate(item, e)}
              style={rowStyle}
              className={sharedClasses}
            >
              {innerContent}
            </a>
          ) : (
            <button
              type="button"
              disabled={item.disabled}
              aria-current={isActive ? 'page' : undefined}
              aria-expanded={hasChildren && !isCollapsed ? isExpanded : undefined}
              title={isCollapsed ? item.label : undefined}
              onMouseEnter={() => !item.disabled && setHoveredKey(hoverKey)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={(e) => handleItemActivate(item, e)}
              style={rowStyle}
              className={sharedClasses}
            >
              {innerContent}
            </button>
          )}

          {!isCollapsed && hasChildren && isExpanded && (
            <div
              style={{
                marginLeft: '18px',
                paddingLeft: '10px',
                borderLeft: `1.5px solid ${borderColor || '#d4d4d8'}`,
              }}
              className={cn('mt-1 mb-1 flex flex-col', metrics.sectionGapClass)}
            >
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    const renderGroup = (group: SideNavGroup) => {
      const isGroupCollapsible = Boolean(group.collapsible) && !isCollapsed;
      const isGroupOpen =
        openGroupIds[group.id] !== undefined
          ? openGroupIds[group.id]
          : group.defaultOpen !== undefined
            ? group.defaultOpen
            : true;

      return (
        <div key={group.id} className="flex flex-col">
          {!isCollapsed && group.title && (
            isGroupCollapsible ? (
              <button
                type="button"
                onClick={() => toggleGroupExpand(group.id)}
                aria-expanded={isGroupOpen}
                style={{ color: textColor || undefined }}
                className={cn(
                  'flex w-full items-center justify-between font-semibold tracking-wide cursor-pointer rounded hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
                  metrics.groupTitleClass,
                  !textColor && 'text-[#666666] dark:text-zinc-400'
                )}
              >
                <span className="truncate">{group.title}</span>
                <ChevronIcon
                  sizePx={metrics.chevronPx}
                  expanded={isGroupOpen}
                  color={textColor || undefined}
                />
              </button>
            ) : (
              <div
                style={{ color: textColor || undefined }}
                className={cn(
                  'font-semibold tracking-wide truncate',
                  metrics.groupTitleClass,
                  !textColor && 'text-[#666666] dark:text-zinc-400'
                )}
              >
                {group.title}
              </div>
            )
          )}

          {isCollapsed && group.title && (
            <div className="my-2 mx-2 border-t border-[#e5e5e5] dark:border-zinc-800" />
          )}

          {isGroupOpen && (
            <div className={cn('flex flex-col px-2', metrics.sectionGapClass)}>
              {group.items.map((item) => renderNavItem(item, 0))}
            </div>
          )}
        </div>
      );
    };

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        style={{
          width: resolvedWidth,
          maxWidth: '100%',
          backgroundColor: bgColor || undefined,
          borderColor: borderColor || undefined,
          color: textColor || undefined,
          ...style,
        }}
        className={cn(
          sideNavContainerVariants({ size }),
          'shrink-0',
          className
        )}
        {...props}
      >
        {(header || showCollapseToggle) && (
          <div
            className={cn(
              'flex items-center border-b border-[#e5e5e5] dark:border-zinc-800',
              isCollapsed ? 'flex-col gap-2 p-2' : 'justify-between gap-2 px-3 py-2.5'
            )}
            style={borderColor ? { borderBottomColor: borderColor } : undefined}
          >
            {header && (
              <div className={cn('min-w-0 flex-1', isCollapsed && 'flex justify-center')}>
                {header}
              </div>
            )}
            {showCollapseToggle && (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                style={{ color: textColor || undefined }}
                className={cn(
                  'inline-flex items-center justify-center rounded-md p-1.5 shrink-0 transition-colors cursor-pointer',
                  'hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white',
                  !textColor && 'text-[#555555] dark:text-zinc-400'
                )}
              >
                <CollapseToggleIcon
                  sizePx={metrics.iconPx}
                  collapsed={isCollapsed}
                  color={textColor || undefined}
                />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
          {items.length > 0 && (
            <div className={cn('flex flex-col px-2', metrics.sectionGapClass)}>
              {items.map((item) => renderNavItem(item, 0))}
            </div>
          )}

          {groups.map((group) => renderGroup(group))}
        </div>

        {footer && (
          <div
            className={cn(
              'border-t border-[#e5e5e5] dark:border-zinc-800',
              isCollapsed ? 'p-2 flex justify-center' : 'px-3 py-2.5'
            )}
            style={borderColor ? { borderTopColor: borderColor } : undefined}
          >
            {footer}
          </div>
        )}
      </nav>
    );
  }
);

SideNav.displayName = 'SideNav';