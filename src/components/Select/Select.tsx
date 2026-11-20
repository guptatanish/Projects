import React, { useEffect, useId, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const ChevronDownIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
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
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const CheckIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
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
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ClearIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
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

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

const selectTriggerVariants = cva(
  "flex w-full items-center justify-between rounded-md border transition-colors bg-white dark:bg-zinc-950 border-[#d4d4d4] dark:border-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-zinc-950",
  {
    variants: {
      size: {
        small: "px-2.5 py-1.5 gap-2 text-xs leading-normal",
        medium: "px-3 py-2 gap-2.5 text-sm leading-normal",
        large: "px-3.5 py-2.5 gap-3 text-base leading-normal",
      },
    },
    defaultVariants: {
      size: "medium",
    },
  }
);

const sizeConfig = {
  small: {
    iconPx: 14,
    optionClass: "px-2.5 py-1.5 text-xs leading-normal",
    descClass: "text-[11px] leading-snug",
  },
  medium: {
    iconPx: 16,
    optionClass: "px-3 py-2 text-sm leading-normal",
    descClass: "text-xs leading-snug",
  },
  large: {
    iconPx: 18,
    optionClass: "px-3.5 py-2.5 text-base leading-normal",
    descClass: "text-xs leading-snug",
  },
} as const;

export interface SelectProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'defaultValue' | 'onChange'>,
    VariantProps<typeof selectTriggerVariants> {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  size?: 'small' | 'medium' | 'large';
  align?: 'left' | 'right';
  clearable?: boolean;
  disabled?: boolean;
  wrapperClassName?: string;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  bottomBorderColor?: string;
  textColor?: string;
  menuBg?: string;
  hoverBg?: string;
  selectedBg?: string;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      wrapperClassName,
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Select an option',
      emptyText = 'No options available',
      size = 'medium',
      align = 'left',
      clearable = false,
      disabled = false,
      bgColor,
      borderColor,
      bottomBorderColor,
      textColor,
      menuBg,
      hoverBg,
      selectedBg,
      style,
      id,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const listboxId = `${generatedId}-listbox`;
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '');
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
      if (!isControlled && defaultValue !== undefined) {
        setInternalValue(defaultValue);
      }
    }, [defaultValue, isControlled]);

    const currentValue = isControlled ? (value ?? '') : internalValue;
    const selectedOption = options.find((opt) => opt.value === currentValue);
    const metrics = sizeConfig[size || 'medium'];

    const assignTriggerRef = (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    };

    useEffect(() => {
      if (!isOpen) return;
      const handleOutsideClick = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setHoveredIndex(null);
        }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          setHoveredIndex(null);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const commitSelection = (nextVal: string) => {
      if (!isControlled) {
        setInternalValue(nextVal);
      }
      onValueChange?.(nextVal);
      setIsOpen(false);
      setHoveredIndex(null);
      triggerRef.current?.focus();
    };

    const handleClear = (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
      if (disabled) return;
      if (!isControlled) {
        setInternalValue('');
      }
      onValueChange?.('');
    };

    const findNextEnabledIndex = (startIndex: number, step: 1 | -1): number => {
      if (options.length === 0) return -1;
      let idx = startIndex;
      for (let count = 0; count < options.length; count++) {
        idx = (idx + step + options.length) % options.length;
        if (!options[idx].disabled) {
          return idx;
        }
      }
      return -1;
    };

    const openMenuAtSelected = () => {
      if (disabled) return;
      const selectedIdx = options.findIndex((opt) => opt.value === currentValue && !opt.disabled);
      const fallbackIdx = options.findIndex((opt) => !opt.disabled);
      setActiveIndex(selectedIdx !== -1 ? selectedIdx : fallbackIdx);
      setIsOpen(true);
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openMenuAtSelected();
        }
      } else {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((prev) => findNextEnabledIndex(prev < 0 ? -1 : prev, 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((prev) => findNextEnabledIndex(prev < 0 ? 0 : prev, -1));
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < options.length && !options[activeIndex].disabled) {
            commitSelection(options[activeIndex].value);
          }
        }
      }

      onKeyDown?.(e);
    };

    const showClear = clearable && !disabled && currentValue.length > 0;

    return (
      <div
        ref={containerRef}
        className={cn('relative w-full', wrapperClassName)}
      >
        <button
          ref={assignTriggerRef}
          id={id || generatedId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
            } else {
              openMenuAtSelected();
            }
          }}
          onKeyDown={handleTriggerKeyDown}
          style={{
            backgroundColor: bgColor || undefined,
            borderColor: borderColor || undefined,
            borderBottomColor: bottomBorderColor || borderColor || undefined,
            color: textColor || undefined,
            ...style,
          }}
          className={cn(
            selectTriggerVariants({ size }),
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:border-[#888888] dark:hover:border-zinc-700',
            className
          )}
          {...props}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
            {selectedOption?.icon && (
              <span
                style={{
                  width: `${metrics.iconPx}px`,
                  height: `${metrics.iconPx}px`,
                }}
                className="inline-flex items-center justify-center shrink-0"
              >
                {selectedOption.icon}
              </span>
            )}
            <span
              className={cn(
                'truncate',
                selectedOption
                  ? (!textColor && 'text-black dark:text-zinc-100 font-medium')
                  : (!textColor && 'text-[#888888] dark:text-zinc-500')
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>

          <span className="inline-flex items-center gap-1.5 shrink-0">
            {showClear && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear selection"
                onClick={handleClear}
                className={cn(
                  'inline-flex items-center justify-center rounded p-0.5 transition-colors',
                  'hover:bg-black/10 dark:hover:bg-white/10',
                  !textColor && 'text-[#555555] dark:text-zinc-400'
                )}
              >
                <ClearIcon sizePx={Math.max(12, metrics.iconPx - 2)} color={textColor || undefined} />
              </span>
            )}
            <ChevronDownIcon
              sizePx={metrics.iconPx}
              color={textColor || undefined}
            />
          </span>
        </button>

        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            style={{
              backgroundColor: menuBg || undefined,
              borderColor: borderColor || undefined,
              color: textColor || undefined,
            }}
            className={cn(
              'absolute z-50 mt-1 min-w-full w-max max-w-full rounded-md border shadow-lg max-h-60 overflow-y-auto py-1 outline-none',
              align === 'right' ? 'right-0' : 'left-0',
              !menuBg && 'bg-white dark:bg-zinc-950',
              !borderColor && 'border-[#e5e5e5] dark:border-zinc-800'
            )}
          >
            {options.length === 0 ? (
              <div
                className={cn(
                  metrics.optionClass,
                  !textColor && 'text-[#888888] dark:text-zinc-500'
                )}
              >
                {emptyText}
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = option.value === currentValue;
                const isFocused = activeIndex === index;
                const isHovered = hoveredIndex === index && !option.disabled;

                const rowBgStyle: React.CSSProperties = {};
                if (isSelected && selectedBg) {
                  rowBgStyle.backgroundColor = selectedBg;
                } else if (isHovered && hoverBg) {
                  rowBgStyle.backgroundColor = hoverBg;
                }
                if (textColor) {
                  rowBgStyle.color = textColor;
                }

                return (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onMouseEnter={() => {
                      if (!option.disabled) {
                        setHoveredIndex(index);
                        setActiveIndex(index);
                      }
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => {
                      if (!option.disabled) {
                        commitSelection(option.value);
                      }
                    }}
                    style={rowBgStyle}
                    className={cn(
                      'flex w-full items-center justify-between gap-2.5 text-left transition-colors',
                      metrics.optionClass,
                      option.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer',
                      !selectedBg && isSelected && 'bg-black/[0.06] dark:bg-white/[0.1] font-medium',
                      !hoverBg && !isSelected && !option.disabled && 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                      isFocused && !isHovered && 'ring-1 ring-inset ring-black/20 dark:ring-white/20',
                      !textColor && 'text-black dark:text-zinc-100'
                    )}
                  >
                    <span className="flex items-start gap-2 min-w-0 flex-1">
                      {option.icon && (
                        <span
                          style={{
                            width: `${metrics.iconPx}px`,
                            height: `${metrics.iconPx}px`,
                          }}
                          className="mt-0.5 inline-flex items-center justify-center shrink-0"
                        >
                          {option.icon}
                        </span>
                      )}
                      <span className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{option.label}</span>
                        {option.description && (
                          <span
                            className={cn(
                              'mt-0.5 break-words',
                              metrics.descClass,
                              !textColor && 'text-[#555555] dark:text-zinc-400'
                            )}
                          >
                            {option.description}
                          </span>
                        )}
                      </span>
                    </span>

                    {isSelected && (
                      <CheckIcon
                        sizePx={metrics.iconPx}
                        color={textColor || undefined}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';