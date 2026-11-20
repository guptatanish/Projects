import React, { useEffect, useId, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const CheckIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ErrorIcon = ({ sizePx, color }: { sizePx: number; color?: string }) => (
  <svg
    width={sizePx}
    height={sizePx}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="block shrink-0"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export type StepperStepStatus = 'complete' | 'active' | 'pending' | 'error';

export interface StepperItem {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  disabled?: boolean;
  status?: StepperStepStatus;
}

const stepperContainerVariants = cva(
  "w-full flex",
  {
    variants: {
      orientation: {
        horizontal: "flex-row items-start",
        vertical: "flex-col",
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
    nodePx: 24,
    iconPx: 12,
    connectorThicknessPx: 2,
    titleClass: "text-xs leading-normal",
    descClass: "text-[11px] leading-snug",
  },
  medium: {
    nodePx: 30,
    iconPx: 14,
    connectorThicknessPx: 2,
    titleClass: "text-sm leading-normal",
    descClass: "text-xs leading-snug",
  },
  large: {
    nodePx: 36,
    iconPx: 16,
    connectorThicknessPx: 2.5,
    titleClass: "text-base leading-normal",
    descClass: "text-xs leading-snug",
  },
} as const;

export interface StepperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof stepperContainerVariants> {
  steps: StepperItem[];
  activeStep?: number;
  defaultStep?: number;
  onStepChange?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
  showStepNumbers?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  activeColor?: string;
  completedColor?: string;
  inactiveColor?: string;
  errorColor?: string;
  textColor?: string;
  connectorColor?: string;
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      steps = [],
      activeStep,
      defaultStep = 0,
      onStepChange,
      orientation = 'horizontal',
      size = 'medium',
      clickable = true,
      showStepNumbers = true,
      activeColor,
      completedColor,
      inactiveColor,
      errorColor,
      textColor,
      connectorColor,
      style,
      'aria-label': ariaLabel = 'Progress steps',
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const resolvedOrientation = orientation ?? 'horizontal';
    const metrics = sizeConfig[size || 'medium'];

    const clampStep = (idx: number): number => {
      if (steps.length === 0 || Number.isNaN(idx)) return 0;
      return Math.min(Math.max(Math.floor(idx), 0), steps.length - 1);
    };

    const isControlled = activeStep !== undefined;
    const [internalStep, setInternalStep] = useState<number>(() => clampStep(defaultStep));

    useEffect(() => {
      if (!isControlled) {
        setInternalStep((prev) => clampStep(prev));
      }
    }, [steps.length, isControlled]);

    useEffect(() => {
      if (!isControlled && defaultStep !== undefined) {
        setInternalStep(clampStep(defaultStep));
      }
    }, [defaultStep, isControlled, steps.length]);

    const currentStep = clampStep(isControlled ? (activeStep ?? 0) : internalStep);

    const resolveStatus = (step: StepperItem, index: number): StepperStepStatus => {
      if (step.status) return step.status;
      if (index < currentStep) return 'complete';
      if (index === currentStep) return 'active';
      return 'pending';
    };

    const handleSelectStep = (step: StepperItem, index: number) => {
      if (!clickable || step.disabled) return;
      const nextIdx = clampStep(index);
      if (!isControlled) {
        setInternalStep(nextIdx);
      }
      if (nextIdx !== currentStep) {
        onStepChange?.(nextIdx);
      }
    };

    const defaultActiveFill = '#111111';
    const defaultCompletedFill = '#18181b';

    const getNodeStyle = (status: StepperStepStatus): React.CSSProperties => {
      const base: React.CSSProperties = {
        width: `${metrics.nodePx}px`,
        height: `${metrics.nodePx}px`,
        borderRadius: '9999px',
      };

      if (status === 'error') {
        return {
          ...base,
          backgroundColor: errorColor || '#dc2626',
          borderColor: errorColor || '#dc2626',
          color: '#ffffff',
        };
      }
      if (status === 'complete') {
        const bg = completedColor || defaultCompletedFill;
        return {
          ...base,
          backgroundColor: bg,
          borderColor: bg,
          color: '#ffffff',
        };
      }
      if (status === 'active') {
        const bg = activeColor || defaultActiveFill;
        return {
          ...base,
          backgroundColor: bg,
          borderColor: bg,
          color: '#ffffff',
        };
      }
      return {
        ...base,
        backgroundColor: 'transparent',
        borderColor: inactiveColor || '#d4d4d4',
        color: textColor || '#666666',
      };
    };

    const getConnectorColor = (index: number): string => {
      const leftStatus = resolveStatus(steps[index], index);
      if (leftStatus === 'complete') {
        return completedColor || activeColor || defaultCompletedFill;
      }
      return connectorColor || inactiveColor || '#e4e4e7';
    };

    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        style={style}
        className={cn(stepperContainerVariants({ orientation: resolvedOrientation, size }), className)}
        {...props}
      >
        {steps.map((step, index) => {
          const status = resolveStatus(step, index);
          const isLast = index === steps.length - 1;
          const isInteractive = clickable && !step.disabled;

          const nodeContent =
            status === 'complete' ? (
              <CheckIcon sizePx={metrics.iconPx} color="#ffffff" />
            ) : status === 'error' ? (
              <ErrorIcon sizePx={metrics.iconPx} color="#ffffff" />
            ) : showStepNumbers ? (
              <span className={cn('font-semibold tabular-nums', metrics.titleClass)}>
                {index + 1}
              </span>
            ) : (
              <span
                style={{
                  width: `${Math.max(6, Math.round(metrics.nodePx / 3))}px`,
                  height: `${Math.max(6, Math.round(metrics.nodePx / 3))}px`,
                  borderRadius: '9999px',
                  backgroundColor: status === 'active' ? '#ffffff' : 'currentColor',
                }}
              />
            );

          if (resolvedOrientation === 'horizontal') {
            return (
              <div
                key={`${uid}-step-${step.id}-${index}`}
                className={cn('flex items-start min-w-0', !isLast ? 'flex-1' : 'shrink-0')}
              >
                <div className="flex flex-col items-center min-w-0 max-w-[160px]">
                  <button
                    type="button"
                    disabled={!isInteractive}
                    aria-current={status === 'active' ? 'step' : undefined}
                    onClick={() => handleSelectStep(step, index)}
                    style={getNodeStyle(status)}
                    className={cn(
                      'inline-flex items-center justify-center border-2 shrink-0 transition-colors',
                      step.disabled && 'opacity-50',
                      isInteractive
                        ? 'cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
                        : 'cursor-default'
                    )}
                  >
                    {nodeContent}
                  </button>

                  <div className="mt-2 flex flex-col items-center text-center min-w-0 w-full px-1">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <span
                        style={{
                          color:
                            status === 'error'
                              ? errorColor || '#dc2626'
                              : textColor || undefined,
                        }}
                        className={cn(
                          'font-medium break-words',
                          metrics.titleClass,
                          step.disabled && 'opacity-50',
                          !textColor &&
                            status !== 'error' &&
                            (status === 'active' || status === 'complete'
                              ? 'text-black dark:text-zinc-100 font-semibold'
                              : 'text-[#666666] dark:text-zinc-400')
                        )}
                      >
                        {step.title}
                      </span>
                      {step.optional && (
                        <span className="text-[11px] text-[#888888] dark:text-zinc-500">
                          (Optional)
                        </span>
                      )}
                    </div>

                    {step.description && (
                      <p
                        style={{ color: textColor || undefined }}
                        className={cn(
                          'mt-0.5 break-words',
                          metrics.descClass,
                          step.disabled && 'opacity-50',
                          !textColor && 'text-[#737373] dark:text-zinc-400'
                        )}
                      >
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {!isLast && (
                  <div
                    aria-hidden="true"
                    style={{
                      marginTop: `${Math.round(metrics.nodePx / 2)}px`,
                      height: `${metrics.connectorThicknessPx}px`,
                      backgroundColor: getConnectorColor(index),
                      transform: 'translateY(-50%)',
                    }}
                    className="flex-1 mx-2 rounded-full transition-colors min-w-[16px]"
                  />
                )}
              </div>
            );
          }

          // Vertical orientation
          return (
            <div
              key={`${uid}-step-${step.id}-${index}`}
              className="flex items-stretch min-w-0"
            >
              <div className="flex flex-col items-center shrink-0">
                <button
                  type="button"
                  disabled={!isInteractive}
                  aria-current={status === 'active' ? 'step' : undefined}
                  onClick={() => handleSelectStep(step, index)}
                  style={getNodeStyle(status)}
                  className={cn(
                    'inline-flex items-center justify-center border-2 shrink-0 transition-colors',
                    step.disabled && 'opacity-50',
                    isInteractive
                      ? 'cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
                      : 'cursor-default'
                  )}
                >
                  {nodeContent}
                </button>

                {!isLast && (
                  <div
                    aria-hidden="true"
                    style={{
                      width: `${metrics.connectorThicknessPx}px`,
                      minHeight: '44px',
                      marginTop: '6px',
                      marginBottom: '6px',
                      backgroundColor: getConnectorColor(index),
                    }}
                    className="flex-1 rounded-full transition-colors"
                  />
                )}
              </div>

              <div
                style={{
                  marginLeft: '16px',
                  paddingBottom: !isLast ? '28px' : '4px',
                }}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    style={{
                      color:
                        status === 'error'
                          ? errorColor || '#dc2626'
                          : textColor || undefined,
                    }}
                    className={cn(
                      'font-medium break-words',
                      metrics.titleClass,
                      step.disabled && 'opacity-50',
                      !textColor &&
                        status !== 'error' &&
                        (status === 'active' || status === 'complete'
                          ? 'text-black dark:text-zinc-100 font-semibold'
                          : 'text-[#666666] dark:text-zinc-400')
                    )}
                  >
                    {step.title}
                  </span>
                  {step.optional && (
                    <span className="text-[11px] text-[#888888] dark:text-zinc-500">
                      (Optional)
                    </span>
                  )}
                </div>

                {step.description && (
                  <p
                    style={{ color: textColor || undefined }}
                    className={cn(
                      'mt-1 break-words',
                      metrics.descClass,
                      step.disabled && 'opacity-50',
                      !textColor && 'text-[#737373] dark:text-zinc-400'
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

Stepper.displayName = 'Stepper';