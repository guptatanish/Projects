import React, { useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const radioGroupVariants = cva(
  "w-full",
  {
    variants: {
      orientation: {
        vertical: "flex flex-col gap-3",
        horizontal: "flex flex-row flex-wrap gap-x-6 gap-y-3",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
);

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

const sizeConfig = {
  small: {
    circlePx: 16,
    dotPx: 7,
    labelClass: "text-xs leading-normal",
    gapClass: "gap-2",
  },
  medium: {
    circlePx: 20,
    dotPx: 9,
    labelClass: "text-sm leading-normal",
    gapClass: "gap-2.5",
  },
  large: {
    circlePx: 24,
    dotPx: 11,
    labelClass: "text-base leading-normal",
    gapClass: "gap-3",
  },
} as const;

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>,
    VariantProps<typeof radioGroupVariants> {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  orientation?: 'vertical' | 'horizontal';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;

  // Custom Colors (applied via inline styles to avoid Tailwind JIT issues)
  activeColor?: string;
  borderColor?: string;
  textColor?: string;
  hoverBg?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      options,
      value,
      defaultValue,
      onValueChange,
      name,
      orientation = 'vertical',
      size = 'medium',
      disabled = false,
      activeColor,
      borderColor,
      textColor,
      hoverBg,
      style,
      ...props
    },
    ref
  ) => {
    const groupId = useId();
    const groupName = name || groupId;
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);

    const currentValue = isControlled ? value : internalValue;
    const resolvedOrientation = orientation ?? 'vertical';
    const metrics = sizeConfig[size || 'medium'];

    const selectValue = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    };

    const enabledIndices = options
      .map((opt, idx) => (!disabled && !opt.disabled ? idx : -1))
      .filter((idx) => idx !== -1);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, currentIndex: number) => {
      if (enabledIndices.length === 0) return;

      const currentPos = enabledIndices.indexOf(currentIndex);
      let nextPos: number | null = null;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextPos = currentPos === -1 ? 0 : (currentPos + 1) % enabledIndices.length;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nextPos =
          currentPos === -1
            ? enabledIndices.length - 1
            : (currentPos - 1 + enabledIndices.length) % enabledIndices.length;
      }

      if (nextPos !== null) {
        const targetIndex = enabledIndices[nextPos];
        const targetOption = options[targetIndex];
        selectValue(targetOption.value);
        const targetEl = document.getElementById(`${groupId}-option-${targetIndex}`);
        targetEl?.focus();
      }
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-disabled={disabled || undefined}
        style={{
          display: 'flex',
          flexDirection: resolvedOrientation === 'horizontal' ? 'row' : 'column',
          flexWrap: resolvedOrientation === 'horizontal' ? 'wrap' : 'nowrap',
          ...style,
        }}
        className={cn(
          radioGroupVariants({ orientation: resolvedOrientation }),
          resolvedOrientation === 'horizontal'
            ? "flex flex-row flex-wrap gap-x-6 gap-y-3"
            : "flex flex-col gap-3",
          className
        )}
        {...props}
      >
        {options.map((option, index) => {
          const isChecked = currentValue === option.value;
          const isItemDisabled = disabled || Boolean(option.disabled);
          const itemId = `${groupId}-option-${index}`;
          const isHovered = hoveredValue === option.value && !isItemDisabled;

          const resolvedBorder = isChecked && activeColor
            ? activeColor
            : borderColor || undefined;

          const resolvedDotColor = activeColor || undefined;

          return (
            <div
              key={`${option.value}-${index}`}
              className="flex items-center shrink-0"
            >
              <label
                htmlFor={itemId}
                onMouseEnter={() => !isItemDisabled && setHoveredValue(option.value)}
                onMouseLeave={() => setHoveredValue(null)}
                style={isHovered && hoverBg ? { backgroundColor: hoverBg } : undefined}
                className={cn(
                  "group relative inline-flex items-center rounded-md transition-colors",
                  metrics.gapClass,
                  hoverBg ? "px-2 py-1.5 -mx-2" : "",
                  isItemDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer",
                  !hoverBg && !isItemDisabled && "hover:bg-black/[0.03] dark:hover:bg-white/[0.04] px-2 py-1.5 -mx-2"
                )}
              >
                <input
                  id={itemId}
                  type="radio"
                  name={groupName}
                  value={option.value}
                  checked={isChecked}
                  disabled={isItemDisabled}
                  onChange={() => !isItemDisabled && selectValue(option.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="sr-only peer"
                />

                <span
                  aria-hidden="true"
                  style={{
                    width: `${metrics.circlePx}px`,
                    height: `${metrics.circlePx}px`,
                    borderColor: resolvedBorder,
                  }}
                  className={cn(
                    "shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-white dark:peer-focus-visible:ring-offset-zinc-950",
                    !resolvedBorder && (
                      isChecked
                        ? "border-black dark:border-white"
                        : "border-[#888888] dark:border-zinc-600"
                    ),
                    isChecked
                      ? (!activeColor && "bg-white dark:bg-zinc-950")
                      : "bg-transparent"
                  )}
                >
                  {isChecked && (
                    <span
                      style={{
                        width: `${metrics.dotPx}px`,
                        height: `${metrics.dotPx}px`,
                        backgroundColor: resolvedDotColor,
                      }}
                      className={cn(
                        "rounded-full transition-transform",
                        !resolvedDotColor && "bg-black dark:bg-white"
                      )}
                    />
                  )}
                </span>

                <span
                  style={textColor ? { color: textColor } : undefined}
                  className={cn(
                    "font-medium whitespace-nowrap",
                    metrics.labelClass,
                    !textColor && "text-black dark:text-zinc-100"
                  )}
                >
                  {option.label}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    );
  }
);

RadioGroup.displayName = "RadioGroup";