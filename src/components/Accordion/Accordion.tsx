import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Context & Types ---
type AccordionType = 'single' | 'multiple';
type AccordionVariant = 'default' | 'separated' | 'flush';

interface AccordionContextValue {
  type: AccordionType;
  variant: AccordionVariant;
  value: string[];
  onItemOpen: (itemValue: string) => void;
  onItemClose: (itemValue: string) => void;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an <Accordion> provider');
  }
  return context;
};

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  isDisabled: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | undefined>(undefined);

const useAccordionItemContext = () => {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionItem components must be used within an <AccordionItem> provider');
  }
  return context;
};

// --- Root Component ---
const accordionVariants = cva("w-full", {
  variants: {
    variant: {
      default: "border-l border-r border-t border-[#888888]",
      separated: "flex flex-col gap-4",
      flush: "border-t border-[#888888]",
    }
  },
  defaultVariants: {
    variant: "default",
  }
});

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value' | 'defaultValue' | 'onChange'> {
  type?: AccordionType;
  variant?: AccordionVariant;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: any) => void;
  collapsible?: boolean;
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, type = 'single', variant = 'default', value: controlledValue, defaultValue, onValueChange, collapsible = false, children, ...props }, ref) => {
    const toArray = (val?: string | string[]) => (Array.isArray(val) ? val : val ? [val] : []);
    
    const [uncontrolledValue, setUncontrolledValue] = useState<string[]>(toArray(defaultValue));
    const isControlled = controlledValue !== undefined;
    const activeValues = isControlled ? toArray(controlledValue) : uncontrolledValue;

    const handleItemOpen = useCallback((itemValue: string) => {
      let newValues: string[];
      if (type === 'single') {
        newValues = [itemValue];
      } else {
        newValues = [...activeValues, itemValue];
      }
      if (!isControlled) setUncontrolledValue(newValues);
      onValueChange?.(type === 'single' ? newValues[0] : newValues);
    }, [type, activeValues, isControlled, onValueChange]);

    const handleItemClose = useCallback((itemValue: string) => {
      if (type === 'single' && !collapsible) return;
      const newValues = activeValues.filter((v) => v !== itemValue);
      if (!isControlled) setUncontrolledValue(newValues);
      onValueChange?.(type === 'single' ? (newValues.length ? newValues[0] : undefined) : newValues);
    }, [type, collapsible, activeValues, isControlled, onValueChange]);

    const contextValue = useMemo(() => ({
      type, variant, value: activeValues, onItemOpen: handleItemOpen, onItemClose: handleItemClose, collapsible,
    }), [type, variant, activeValues, handleItemOpen, handleItemClose, collapsible]);

    return (
      <AccordionContext.Provider value={contextValue}>
        <div ref={ref} className={cn(accordionVariants({ variant }), className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

// --- Accordion Item ---
const itemVariants = cva("overflow-hidden", {
  variants: {
    variant: {
      default: "border-b border-[#888888] rounded-none", 
      separated: "border border-[#888888] rounded-none shadow-sm",
      flush: "border-b border-[#888888] rounded-none",
    }
  }
});

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, disabled = false, children, ...props }, ref) => {
    const { value: activeValues, variant } = useAccordionContext();
    const isOpen = activeValues.includes(value);

    const contextValue = useMemo(() => ({ value, isOpen, isDisabled: disabled }), [value, isOpen, disabled]);

    return (
      <AccordionItemContext.Provider value={contextValue}>
        <div 
          ref={ref} 
          data-state={isOpen ? "open" : "closed"}
          data-disabled={disabled ? "" : undefined}
          className={cn(itemVariants({ variant }), disabled && "opacity-50 pointer-events-none", className)} 
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

// --- Accordion Trigger ---
export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hideIcon?: boolean;
  icon?: React.ReactNode;
  triggerBg?: string;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, hideIcon = false, icon, triggerBg, children, ...props }, ref) => {
    const { onItemOpen, onItemClose } = useAccordionContext();
    const { value, isOpen, isDisabled } = useAccordionItemContext();

    return (
      <h3 className="flex m-0">
        <button
          ref={ref}
          type="button"
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${value}`}
          id={`accordion-trigger-${value}`}
          disabled={isDisabled}
          onClick={() => (isOpen ? onItemClose(value) : onItemOpen(value))}
          className={cn(
            "flex flex-1 items-center justify-between font-medium transition-colors hover:opacity-90 text-left px-5 py-4 focus-visible:outline-none focus-visible:bg-black/5",
            triggerBg || "bg-[#E5E5E5] text-black dark:bg-zinc-800 dark:text-white", 
            className
          )}
          {...props}
        >
          {children}
          {!hideIcon && (
            icon ? (
              <div className="shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" data-state={isOpen ? "open" : "closed"}>
                {icon}
              </div>
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" height="20" viewBox="0 0 24 24" 
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="shrink-0 transition-transform duration-200 data-[state=open]:rotate-180"
                data-state={isOpen ? "open" : "closed"}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            )
          )}
        </button>
      </h3>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

// --- Accordion Content ---
export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  contentBg?: string;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, contentBg, children, ...props }, ref) => {
    const { isOpen, value } = useAccordionItemContext();

    return (
      <div
        ref={ref}
        id={`accordion-content-${value}`}
        role="region"
        aria-labelledby={`accordion-trigger-${value}`}
        data-state={isOpen ? "open" : "closed"}
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out data-[state=open]:grid-rows-[1fr]"
        {...props}
      >
        <div className="overflow-hidden">
          <div className={cn(
            "text-sm px-5 py-6 border-t border-[#888888]",
            contentBg || "bg-white text-black dark:bg-zinc-950 dark:text-zinc-100", 
            className
          )}>
            {children}
          </div>
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";