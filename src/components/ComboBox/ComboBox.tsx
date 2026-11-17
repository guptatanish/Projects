import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Icons ---
const ChevronDownIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const CheckIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Multi-select Checkbox Icons
const CheckboxChecked = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const CheckboxUnchecked = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none shrink-0", className)} {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
  </svg>
);

// --- Variants ---
// FIXED: Removed focus-within:ring classes so the blue border is completely gone
const triggerVariants = cva(
  "flex w-full items-center justify-between rounded-none border-0 border-b-2 border-[#888888] bg-[#E5E5E5] transition-colors focus-within:outline-none dark:border-zinc-700 dark:bg-zinc-900",
  {
    variants: {
      size: {
        small: "px-3 py-1.5 text-xs leading-normal gap-2",
        medium: "px-4 py-2 text-sm leading-normal gap-2",
        large: "px-5 py-3 text-base leading-normal gap-3",
      },
      disabled: {
        true: "opacity-50 cursor-not-allowed",
        false: "cursor-text",
      },
    },
    defaultVariants: {
      size: "medium",
      disabled: false,
    },
  }
);

export type ComboBoxOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface ComboBoxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>, VariantProps<typeof triggerVariants> {
  options: ComboBoxOption[];
  mode?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: any) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  triggerBg?: string;
  dropdownBg?: string;
  itemHoverBg?: string;
  activeTextColor?: string;
  borderColor?: string;
  bottomBorderColor?: string;
  textColor?: string;
}

export const ComboBox = React.forwardRef<HTMLDivElement, ComboBoxProps>(
  ({
    className,
    options,
    mode = 'single',
    value: controlledValue,
    onValueChange,
    placeholder = "Select an option...",
    emptyText = "No results found.",
    size = "medium",
    disabled = false,
    triggerBg,
    dropdownBg,
    itemHoverBg,
    activeTextColor,
    borderColor,
    bottomBorderColor,
    textColor,
    style,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    const isControlled = controlledValue !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState<string | string[]>(mode === 'multiple' ? [] : "");
    const selectedValue = isControlled ? controlledValue : uncontrolledValue;

    const currentSingleValue = typeof selectedValue === 'string' ? selectedValue : '';
    const currentMultiValues = Array.isArray(selectedValue) ? selectedValue : [];

    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedSingleOption = mode === 'single' ? options.find(opt => opt.value === currentSingleValue) : null;

    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchQuery("");
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleSelect = useCallback((option: ComboBoxOption) => {
      if (option.disabled) return;

      if (mode === 'single') {
        if (!isControlled) setUncontrolledValue(option.value);
        onValueChange?.(option.value);
        setSearchQuery("");
        setIsOpen(false);
      } else {
        const isAlreadySelected = currentMultiValues.includes(option.value);
        const newValues = isAlreadySelected 
          ? currentMultiValues.filter(v => v !== option.value) 
          : [...currentMultiValues, option.value];
        
        if (!isControlled) setUncontrolledValue(newValues);
        onValueChange?.(newValues);
        inputRef.current?.focus(); 
      }
    }, [isControlled, onValueChange, mode, currentMultiValues]);

    const handleRemoveMultiItem = (e: React.MouseEvent, valueToRemove: string) => {
      e.stopPropagation();
      const newValues = currentMultiValues.filter(v => v !== valueToRemove);
      if (!isControlled) setUncontrolledValue(newValues);
      onValueChange?.(newValues);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      const emptyVal = mode === 'multiple' ? [] : "";
      if (!isControlled) setUncontrolledValue(emptyVal);
      onValueChange?.(emptyVal);
      setSearchQuery("");
      inputRef.current?.focus();
    };

    const hasSelection = mode === 'multiple' ? currentMultiValues.length > 0 : !!currentSingleValue;

    const customStyle = {
      ...style,
      ...(triggerBg ? { '--cb-trigger-bg': triggerBg } : {}),
      ...(dropdownBg ? { '--cb-dropdown-bg': dropdownBg } : {}),
      ...(itemHoverBg ? { '--cb-item-hover': itemHoverBg } : {}),
      ...(activeTextColor ? { '--cb-active-text': activeTextColor } : {}),
      ...(borderColor ? { '--cb-border': borderColor } : {}),
      ...(bottomBorderColor ? { '--cb-bottom-border': bottomBorderColor } : {}),
      ...(textColor ? { '--cb-text': textColor } : {}),
    } as React.CSSProperties;

    return (
      <div 
        ref={containerRef} 
        style={customStyle}
        className={cn("relative w-full max-w-sm", className)} 
        {...props}
      >
        {/* Trigger / Input */}
        <div
          onClick={() => {
            if (disabled) return;
            setIsOpen(true);
            inputRef.current?.focus();
          }}
          className={cn(
            triggerVariants({ size, disabled }),
            triggerBg && "bg-[var(--cb-trigger-bg)] dark:bg-[var(--cb-trigger-bg)]",
            bottomBorderColor 
              ? "border-b-[var(--cb-bottom-border)] dark:border-b-[var(--cb-bottom-border)]" 
              : (borderColor && "border-b-[var(--cb-border)] dark:border-b-[var(--cb-border)]"),
            textColor && "text-[var(--cb-text)] dark:text-[var(--cb-text)]"
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
            
            {/* Multi-Select Chips inside Trigger */}
            {mode === 'multiple' && currentMultiValues.map(val => {
              const opt = options.find(o => o.value === val);
              if (!opt) return null;
              return (
                <span 
                  key={val} 
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-black/10 font-medium text-black dark:bg-white/20 dark:text-zinc-100",
                    size === 'small' ? 'px-1.5 py-0.5 text-[10px]' : size === 'medium' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
                  )}
                >
                  {opt.label}
                  <button 
                    type="button"
                    disabled={disabled}
                    onClick={(e) => handleRemoveMultiItem(e, val)}
                    className="rounded-full hover:bg-black/10 dark:hover:bg-white/20 p-0.5 transition-colors focus:outline-none"
                  >
                    <XIcon className={cn(size === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
                  </button>
                </span>
              );
            })}

            <input
              ref={inputRef}
              type="text"
              disabled={disabled}
              placeholder={hasSelection && mode === 'single' ? selectedSingleOption?.label : (hasSelection ? "" : placeholder)}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              className={cn(
                "flex-1 min-w-[60px] bg-transparent outline-none placeholder:text-[#888888] dark:placeholder:text-zinc-500",
                selectedSingleOption && !searchQuery && mode === 'single' && "text-transparent", 
                textColor && "placeholder:text-[var(--cb-text)]"
              )}
            />
          </div>
          
          {selectedSingleOption && !searchQuery && mode === 'single' && (
            <span className="absolute pointer-events-none truncate" style={{ left: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px', right: '40px' }}>
              {selectedSingleOption.label}
            </span>
          )}

          <div className="flex items-center gap-1 shrink-0 text-[#888888] dark:text-zinc-400">
            {hasSelection && !disabled && (
              <button 
                type="button"
                onClick={handleClear}
                className="hover:text-black dark:hover:text-white p-0.5 rounded-full transition-colors focus:outline-none"
                aria-label="Clear selection"
              >
                <XIcon className={cn(size === 'small' ? 'w-3 h-3' : 'w-4 h-4')} />
              </button>
            )}
            <ChevronDownIcon className={cn(
              size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4',
              isOpen && "rotate-180 transition-transform"
            )} />
          </div>
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className={cn(
              // FIXED: Removed mt-1 and changed rounded-md to rounded-none to seamlessly connect to the trigger
              "absolute z-50 w-full rounded-none border border-t-0 border-[#888888] bg-white shadow-md outline-none dark:border-zinc-700 dark:bg-zinc-950",
              dropdownBg && "bg-[var(--cb-dropdown-bg)] dark:bg-[var(--cb-dropdown-bg)]",
              borderColor && "border-[var(--cb-border)] dark:border-[var(--cb-border)]"
            )}
          >
            <ul 
              className="max-h-60 w-full overflow-y-auto p-1"
              role="listbox"
            >
              {filteredOptions.length === 0 ? (
                <li className="py-6 text-center text-sm text-[#888888] dark:text-zinc-400">
                  {emptyText}
                </li>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = mode === 'single' 
                    ? currentSingleValue === option.value
                    : currentMultiValues.includes(option.value);
                  const isHovered = hoveredValue === option.value;
                  
                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHoveredValue(option.value)}
                      onMouseLeave={() => setHoveredValue(null)}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm transition-colors",
                        size === 'small' ? 'py-1.5 px-2 text-xs gap-2' : size === 'medium' ? 'py-2 px-2 text-sm gap-2.5' : 'py-2.5 px-2 text-base gap-3',
                        option.disabled && "opacity-50 cursor-not-allowed",
                        
                        !option.disabled && isHovered && !itemHoverBg && "bg-gray-100 dark:bg-zinc-800",
                        !option.disabled && isHovered && itemHoverBg && "bg-[var(--cb-item-hover)] dark:bg-[var(--cb-item-hover)]",
                        
                        textColor && "text-[var(--cb-text)] dark:text-[var(--cb-text)]",
                        isSelected && activeTextColor && "text-[var(--cb-active-text)] dark:text-[var(--cb-active-text)]"
                      )}
                    >
                      {mode === 'multiple' && (
                        <span className={cn("shrink-0", isSelected ? "text-black dark:text-white" : "text-[#888888] dark:text-zinc-500")}>
                          {isSelected ? (
                            <CheckboxChecked className={cn(size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                          ) : (
                            <CheckboxUnchecked className={cn(size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                          )}
                        </span>
                      )}

                      <span className="truncate pr-8">{option.label}</span>
                      
                      {isSelected && mode === 'single' && (
                        <span className="absolute right-2 flex items-center justify-center">
                          <CheckIcon className={cn(size === 'small' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
                        </span>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

ComboBox.displayName = "ComboBox";