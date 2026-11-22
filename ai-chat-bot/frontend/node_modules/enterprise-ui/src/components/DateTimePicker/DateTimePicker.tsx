import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const CalendarIcon = ({ sizePx = 16, color }: { sizePx?: number; color?: string }) => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = ({ sizePx = 16, color }: { sizePx?: number; color?: string }) => (
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
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ChevronLeftIcon = ({ sizePx = 16, color }: { sizePx?: number; color?: string }) => (
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
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = ({ sizePx = 16, color }: { sizePx?: number; color?: string }) => (
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
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ClearIcon = ({ sizePx = 14, color }: { sizePx?: number; color?: string }) => (
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

export type DateTimePickerMode = 'date' | 'time' | 'datetime';
export type DateTimeFormatStyle = '12h' | '24h';
export type DateTimePickerSize = 'small' | 'medium' | 'large';

const triggerVariants = cva(
  "w-full min-w-0 flex items-center justify-between gap-3 rounded-md border transition-colors outline-none",
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
    triggerPadStyle: { padding: '7px 12px' } as React.CSSProperties,
    popoverPadStyle: { padding: '14px' } as React.CSSProperties,
    iconPx: 14,
    cellPx: 30,
    dayTextClass: "text-xs",
    headerTextClass: "text-xs font-semibold",
    selectClass: "text-xs",
  },
  medium: {
    triggerPadStyle: { padding: '9px 14px' } as React.CSSProperties,
    popoverPadStyle: { padding: '16px' } as React.CSSProperties,
    iconPx: 16,
    cellPx: 34,
    dayTextClass: "text-xs sm:text-sm",
    headerTextClass: "text-sm font-semibold",
    selectClass: "text-xs",
  },
  large: {
    triggerPadStyle: { padding: '11px 16px' } as React.CSSProperties,
    popoverPadStyle: { padding: '18px' } as React.CSSProperties,
    iconPx: 18,
    cellPx: 38,
    dayTextClass: "text-sm",
    headerTextClass: "text-base font-semibold",
    selectClass: "text-xs sm:text-sm",
  },
} as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEKDAY_LABELS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAY_LABELS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const pad2 = (n: number) => String(n).padStart(2, '0');

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

export interface DateTimePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'>,
    VariantProps<typeof triggerVariants> {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date | null) => void;
  mode?: DateTimePickerMode;
  timeFormat?: DateTimeFormatStyle;
  minuteStep?: number;
  minDate?: Date;
  maxDate?: Date;
  weekStartsOn?: 0 | 1;
  size?: DateTimePickerSize;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  // Custom Colors (applied inline to avoid Tailwind JIT purging)
  bgColor?: string;
  borderColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  accentColor?: string;
  hoverBgColor?: string;
}

export const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
  (
    {
      className,
      value,
      defaultValue = null,
      onChange,
      mode = 'datetime',
      timeFormat = '24h',
      minuteStep = 1,
      minDate,
      maxDate,
      weekStartsOn = 1,
      size = 'medium',
      placeholder,
      clearable = true,
      disabled = false,
      readOnly = false,
      bgColor,
      borderColor,
      textColor,
      mutedTextColor,
      accentColor,
      hoverBgColor,
      style,
      id,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const pickerId = id || `${uid}-dtp`;
    const resolvedMode: DateTimePickerMode = mode ?? 'datetime';
    const resolvedTimeFormat: DateTimeFormatStyle = timeFormat ?? '24h';
    const resolvedSize: DateTimePickerSize = size ?? 'medium';
    const resolvedWeekStart: 0 | 1 = weekStartsOn === 0 ? 0 : 1;
    const safeMinuteStep = Math.max(1, Math.min(60, Math.floor(minuteStep || 1)));
    const metrics = sizeConfig[resolvedSize];

    const rootRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const [pickerPanel, setPickerPanel] = useState<'calendar' | 'month' | 'year'>('calendar');

    const isControlled = value !== undefined;
    const [internalDate, setInternalDate] = useState<Date | null>(() =>
      defaultValue ? new Date(defaultValue.getTime()) : null
    );

    useEffect(() => {
      if (!isControlled && defaultValue !== undefined) {
        setInternalDate(defaultValue ? new Date(defaultValue.getTime()) : null);
      }
    }, [defaultValue, isControlled]);

    const currentDate = useMemo(() => {
      const raw = isControlled ? (value ?? null) : internalDate;
      if (!raw) return null;
      const parsed = raw instanceof Date ? raw : new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, [isControlled, value, internalDate]);

    const [viewDate, setViewDate] = useState<Date>(() => currentDate || new Date());

    useEffect(() => {
      if (currentDate) {
        setViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      }
    }, [currentDate?.getTime()]);

    useEffect(() => {
      if (!isOpen) {
        setPickerPanel('calendar');
      }
    }, [isOpen]);

    const isDayDisabled = (dayDate: Date) => {
      if (minDate && startOfDay(dayDate) < startOfDay(minDate)) return true;
      if (maxDate && endOfDay(dayDate) > endOfDay(maxDate)) return true;
      return false;
    };

    const isTimestampOutOfRange = (candidate: Date) => {
      if (minDate && candidate.getTime() < minDate.getTime()) return true;
      if (maxDate && candidate.getTime() > maxDate.getTime()) return true;
      return false;
    };

    const commitDate = (next: Date | null) => {
      if (disabled || readOnly) return;
      if (next && isTimestampOutOfRange(next)) return;
      const cloned = next ? new Date(next.getTime()) : null;
      if (!isControlled) {
        setInternalDate(cloned);
      }
      onChange?.(cloned);
    };

    useEffect(() => {
      if (!isOpen) return;
      const handleOutside = (e: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('mousedown', handleOutside);
        document.removeEventListener('keydown', handleEsc);
      };
    }, [isOpen]);

    const formatDisplayValue = (d: Date | null): string => {
      if (!d) {
        if (placeholder) return placeholder;
        if (resolvedMode === 'date') return 'Select date';
        if (resolvedMode === 'time') return 'Select time';
        return 'Select date & time';
      }

      const datePart = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const hours24 = d.getHours();
      const minutes = pad2(d.getMinutes());
      const seconds = pad2(d.getSeconds());

      let timePart: string;
      if (resolvedTimeFormat === '12h') {
        const period = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
        timePart = `${pad2(hours12)}:${minutes}:${seconds} ${period}`;
      } else {
        timePart = `${pad2(hours24)}:${minutes}:${seconds}`;
      }

      if (resolvedMode === 'date') return datePart;
      if (resolvedMode === 'time') return timePart;
      return `${datePart} ${timePart}`;
    };

    const handleSelectDay = (dayNum: number) => {
      const base = currentDate ? new Date(currentDate.getTime()) : new Date();
      const next = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        dayNum,
        base.getHours(),
        base.getMinutes(),
        base.getSeconds(),
        0
      );
      commitDate(next);
      if (resolvedMode === 'date') {
        setIsOpen(false);
      }
    };

    const handleTimeChange = (nextHours24: number, nextMinutes: number, nextSeconds: number) => {
      const base = currentDate ? new Date(currentDate.getTime()) : new Date();
      const next = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        nextHours24,
        nextMinutes,
        nextSeconds,
        0
      );
      commitDate(next);
    };

    const activeTimeSource = currentDate || new Date();
    const currentHours24 = activeTimeSource.getHours();
    const currentMinutes = activeTimeSource.getMinutes();
    const currentSeconds = activeTimeSource.getSeconds();
    const isPM = currentHours24 >= 12;
    const currentHour12 = currentHours24 % 12 === 0 ? 12 : currentHours24 % 12;

    const minuteOptions = useMemo(() => {
      const list: number[] = [];
      for (let m = 0; m < 60; m += safeMinuteStep) {
        list.push(m);
      }
      if (!list.includes(currentMinutes)) {
        list.push(currentMinutes);
        list.sort((a, b) => a - b);
      }
      return list;
    }, [safeMinuteStep, currentMinutes]);

    const secondOptions = useMemo(() => Array.from({ length: 60 }, (_, s) => s), []);
    const hourOptions24 = useMemo(() => Array.from({ length: 24 }, (_, h) => h), []);
    const hourOptions12 = useMemo(() => Array.from({ length: 12 }, (_, idx) => idx + 1), []);

    const yearOptions = useMemo(() => {
      const baseYear = viewDate.getFullYear();
      const startYear = baseYear - 6;
      return Array.from({ length: 12 }, (_, idx) => startYear + idx);
    }, [viewDate]);

    const calendarCells = useMemo(() => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      const leadingBlanks = (firstDayOfMonth - resolvedWeekStart + 7) % 7;
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const cells: Array<{ key: string; day: number | null }> = [];
      for (let i = 0; i < leadingBlanks; i++) {
        cells.push({ key: `blank-${i}`, day: null });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ key: `day-${d}`, day: d });
      }
      return cells;
    }, [viewDate, resolvedWeekStart]);

    const weekdayHeaders = resolvedWeekStart === 0 ? WEEKDAY_LABELS_SUN : WEEKDAY_LABELS_MON;
    const today = new Date();

    const resolvedBg = bgColor || '#ffffff';
    const resolvedBorder = borderColor || '#d4d4d4';
    const resolvedText = textColor || undefined;
    const resolvedMuted = mutedTextColor || undefined;
    const resolvedAccent = accentColor || '#111111';

    const showDateSection = resolvedMode === 'date' || resolvedMode === 'datetime';
    const showTimeSection = resolvedMode === 'time' || resolvedMode === 'datetime';
    const canInteract = !disabled && !readOnly;

    const sevenColGridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
      gap: '4px',
      textAlign: 'center',
      alignItems: 'center',
    };

    const threeColGridStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '6px',
      textAlign: 'center',
    };

    const handleStepNav = (direction: -1 | 1) => {
      if (pickerPanel === 'year') {
        setViewDate((prev) => new Date(prev.getFullYear() + direction * 12, prev.getMonth(), 1));
      } else if (pickerPanel === 'month') {
        setViewDate((prev) => new Date(prev.getFullYear() + direction, prev.getMonth(), 1));
      } else {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
      }
    };

    return (
      <div
        ref={(node) => {
          rootRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: '340px' }}
        className="min-w-0"
      >
        <div
          id={pickerId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          onClick={() => {
            if (!canInteract) return;
            setIsOpen((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (!canInteract) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          style={{
            ...metrics.triggerPadStyle,
            backgroundColor: resolvedBg,
            borderColor: resolvedBorder,
            color: resolvedText,
            ...style,
          }}
          className={cn(
            triggerVariants({ size: resolvedSize }),
            !resolvedText && 'text-[#111111] dark:text-zinc-100',
            disabled ? 'opacity-50 cursor-not-allowed' : readOnly ? 'cursor-default' : 'cursor-pointer',
            className
          )}
          {...props}
        >
          <span className="flex items-center gap-2.5 min-w-0 flex-1">
            {resolvedMode === 'time' ? (
              <ClockIcon sizePx={metrics.iconPx} color={resolvedMuted || resolvedText} />
            ) : (
              <CalendarIcon sizePx={metrics.iconPx} color={resolvedMuted || resolvedText} />
            )}
            <span
              style={{
                color: !currentDate ? resolvedMuted : resolvedText,
              }}
              className={cn(
                'truncate',
                !currentDate && !resolvedMuted && 'text-[#71717a] dark:text-zinc-400'
              )}
            >
              {formatDisplayValue(currentDate)}
            </span>
          </span>

          {clearable && currentDate && canInteract && (
            <button
              type="button"
              aria-label="Clear value"
              onClick={(e) => {
                e.stopPropagation();
                commitDate(null);
              }}
              className="shrink-0 p-1 rounded hover:bg-black/[0.06] dark:hover:bg-white/[0.08] bg-transparent border-0 cursor-pointer outline-none"
            >
              <ClearIcon sizePx={13} color={resolvedMuted || resolvedText} />
            </button>
          )}
        </div>

        {isOpen && canInteract && (
          <div
            role="dialog"
            aria-label="Date and time picker"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 50,
              width: '320px',
              maxWidth: 'calc(100vw - 32px)',
              backgroundColor: resolvedBg,
              borderColor: resolvedBorder,
              color: resolvedText,
              ...metrics.popoverPadStyle,
            }}
            className={cn(
              'rounded-lg border shadow-xl flex flex-col gap-4',
              !resolvedText && 'text-[#111111] dark:text-zinc-100'
            )}
          >
            {showDateSection && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    aria-label="Previous"
                    onClick={() => handleStepNav(-1)}
                    className="p-1.5 rounded-md border-0 bg-transparent cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] outline-none"
                  >
                    <ChevronLeftIcon sizePx={15} color={resolvedText} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPickerPanel((prev) => (prev === 'month' ? 'calendar' : 'month'))
                      }
                      style={{
                        backgroundColor: pickerPanel === 'month' ? resolvedAccent : 'transparent',
                        color: pickerPanel === 'month' ? '#ffffff' : resolvedText,
                      }}
                      className={cn(
                        metrics.headerTextClass,
                        'px-2 py-0.5 rounded-md border-0 cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] outline-none'
                      )}
                    >
                      {MONTH_NAMES[viewDate.getMonth()]}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPickerPanel((prev) => (prev === 'year' ? 'calendar' : 'year'))
                      }
                      style={{
                        backgroundColor: pickerPanel === 'year' ? resolvedAccent : 'transparent',
                        color: pickerPanel === 'year' ? '#ffffff' : resolvedText,
                      }}
                      className={cn(
                        metrics.headerTextClass,
                        'px-2 py-0.5 rounded-md border-0 cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] outline-none'
                      )}
                    >
                      {viewDate.getFullYear()}
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label="Next"
                    onClick={() => handleStepNav(1)}
                    className="p-1.5 rounded-md border-0 bg-transparent cursor-pointer hover:bg-black/[0.06] dark:hover:bg-white/[0.08] outline-none"
                  >
                    <ChevronRightIcon sizePx={15} color={resolvedText} />
                  </button>
                </div>

                {pickerPanel === 'month' && (
                  <div style={threeColGridStyle}>
                    {SHORT_MONTH_NAMES.map((mName, mIdx) => {
                      const isCurrentMonth = viewDate.getMonth() === mIdx;
                      return (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => {
                            setViewDate((prev) => new Date(prev.getFullYear(), mIdx, 1));
                            setPickerPanel('calendar');
                          }}
                          style={{
                            backgroundColor: isCurrentMonth ? resolvedAccent : 'transparent',
                            color: isCurrentMonth ? '#ffffff' : resolvedText,
                          }}
                          className={cn(
                            'py-2 px-2 rounded-md font-medium border-0 cursor-pointer transition-colors outline-none',
                            metrics.dayTextClass,
                            !isCurrentMonth && 'hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                          )}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>
                )}

                {pickerPanel === 'year' && (
                  <div style={threeColGridStyle}>
                    {yearOptions.map((yr) => {
                      const isCurrentYear = viewDate.getFullYear() === yr;
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            setViewDate((prev) => new Date(yr, prev.getMonth(), 1));
                            setPickerPanel('calendar');
                          }}
                          style={{
                            backgroundColor: isCurrentYear ? resolvedAccent : 'transparent',
                            color: isCurrentYear ? '#ffffff' : resolvedText,
                          }}
                          className={cn(
                            'py-2 px-2 rounded-md font-medium border-0 cursor-pointer transition-colors outline-none tabular-nums',
                            metrics.dayTextClass,
                            !isCurrentYear && 'hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                          )}
                        >
                          {yr}
                        </button>
                      );
                    })}
                  </div>
                )}

                {pickerPanel === 'calendar' && (
                  <>
                    <div style={sevenColGridStyle}>
                      {weekdayHeaders.map((wd) => (
                        <span
                          key={wd}
                          style={{ color: resolvedMuted }}
                          className={cn(
                            'text-[11px] font-semibold py-1 select-none',
                            !resolvedMuted && 'text-[#71717a] dark:text-zinc-400'
                          )}
                        >
                          {wd}
                        </span>
                      ))}
                    </div>

                    <div style={sevenColGridStyle}>
                      {calendarCells.map((cell) => {
                        if (!cell.day) {
                          return <span key={cell.key} style={{ height: `${metrics.cellPx}px` }} />;
                        }

                        const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), cell.day);
                        const disabledDay = isDayDisabled(cellDate);
                        const isSelected = currentDate ? isSameDay(cellDate, currentDate) : false;
                        const isToday = isSameDay(cellDate, today);
                        const isHovered = hoveredKey === cell.key && !disabledDay && !isSelected;

                        return (
                          <button
                            key={cell.key}
                            type="button"
                            disabled={disabledDay}
                            onMouseEnter={() => setHoveredKey(cell.key)}
                            onMouseLeave={() => setHoveredKey(null)}
                            onClick={() => handleSelectDay(cell.day!)}
                            style={{
                              width: `${metrics.cellPx}px`,
                              height: `${metrics.cellPx}px`,
                              margin: '0 auto',
                              backgroundColor: isSelected
                                ? resolvedAccent
                                : isHovered && hoverBgColor
                                  ? hoverBgColor
                                  : 'transparent',
                              color: isSelected
                                ? '#ffffff'
                                : disabledDay
                                  ? resolvedMuted
                                  : resolvedText,
                              border: isToday && !isSelected ? `1px solid ${resolvedBorder}` : 'none',
                            }}
                            className={cn(
                              'inline-flex items-center justify-center rounded-md font-medium transition-colors outline-none',
                              metrics.dayTextClass,
                              disabledDay
                                ? 'opacity-35 cursor-not-allowed'
                                : 'cursor-pointer',
                              !isSelected && !disabledDay && !hoverBgColor && 'hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                            )}
                          >
                            {cell.day}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {showTimeSection && (
              <div
                style={{ borderTop: showDateSection ? `1px solid ${resolvedBorder}` : undefined }}
                className={cn(showDateSection && 'pt-3', 'flex flex-col gap-2')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{ color: resolvedMuted }}
                    className={cn(
                      'text-xs font-medium flex items-center gap-1.5',
                      !resolvedMuted && 'text-[#666666] dark:text-zinc-400'
                    )}
                  >
                    <ClockIcon sizePx={13} color={resolvedMuted || resolvedText} />
                    Time ({resolvedTimeFormat})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  {resolvedTimeFormat === '24h' ? (
                    <select
                      aria-label="Hour"
                      value={currentHours24}
                      onChange={(e) =>
                        handleTimeChange(Number(e.target.value), currentMinutes, currentSeconds)
                      }
                      style={{
                        backgroundColor: resolvedBg,
                        borderColor: resolvedBorder,
                        color: resolvedText,
                      }}
                      className={cn(
                        'flex-1 min-w-0 rounded-md border px-2 py-1.5 outline-none cursor-pointer tabular-nums',
                        metrics.selectClass
                      )}
                    >
                      {hourOptions24.map((h) => (
                        <option key={h} value={h}>
                          {pad2(h)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      aria-label="Hour"
                      value={currentHour12}
                      onChange={(e) => {
                        const h12 = Number(e.target.value);
                        const h24 = isPM ? (h12 % 12) + 12 : h12 % 12;
                        handleTimeChange(h24, currentMinutes, currentSeconds);
                      }}
                      style={{
                        backgroundColor: resolvedBg,
                        borderColor: resolvedBorder,
                        color: resolvedText,
                      }}
                      className={cn(
                        'flex-1 min-w-0 rounded-md border px-2 py-1.5 outline-none cursor-pointer tabular-nums',
                        metrics.selectClass
                      )}
                    >
                      {hourOptions12.map((h) => (
                        <option key={h} value={h}>
                          {pad2(h)}
                        </option>
                      ))}
                    </select>
                  )}

                  <span className="text-xs font-semibold shrink-0">:</span>

                  <select
                    aria-label="Minute"
                    value={currentMinutes}
                    onChange={(e) =>
                      handleTimeChange(currentHours24, Number(e.target.value), currentSeconds)
                    }
                    style={{
                      backgroundColor: resolvedBg,
                      borderColor: resolvedBorder,
                      color: resolvedText,
                    }}
                    className={cn(
                      'flex-1 min-w-0 rounded-md border px-2 py-1.5 outline-none cursor-pointer tabular-nums',
                      metrics.selectClass
                    )}
                  >
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>
                        {pad2(m)}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs font-semibold shrink-0">:</span>

                  <select
                    aria-label="Second"
                    value={currentSeconds}
                    onChange={(e) =>
                      handleTimeChange(currentHours24, currentMinutes, Number(e.target.value))
                    }
                    style={{
                      backgroundColor: resolvedBg,
                      borderColor: resolvedBorder,
                      color: resolvedText,
                    }}
                    className={cn(
                      'flex-1 min-w-0 rounded-md border px-2 py-1.5 outline-none cursor-pointer tabular-nums',
                      metrics.selectClass
                    )}
                  >
                    {secondOptions.map((s) => (
                      <option key={s} value={s}>
                        {pad2(s)}
                      </option>
                    ))}
                  </select>

                  {resolvedTimeFormat === '12h' && (
                    <select
                      aria-label="AM or PM"
                      value={isPM ? 'PM' : 'AM'}
                      onChange={(e) => {
                        const nextPM = e.target.value === 'PM';
                        const h24 = nextPM ? (currentHour12 % 12) + 12 : currentHour12 % 12;
                        handleTimeChange(h24, currentMinutes, currentSeconds);
                      }}
                      style={{
                        backgroundColor: resolvedBg,
                        borderColor: resolvedBorder,
                        color: resolvedText,
                      }}
                      className={cn(
                        'shrink-0 rounded-md border px-2 py-1.5 outline-none cursor-pointer',
                        metrics.selectClass
                      )}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  )}
                </div>
              </div>
            )}

            <div
              style={{ borderTop: `1px solid ${resolvedBorder}` }}
              className="pt-3 flex items-center justify-between gap-2"
            >
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
                  commitDate(now);
                }}
                style={{ color: resolvedText }}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-transparent border-0 cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                Now
              </button>

              <div className="flex items-center gap-2">
                {clearable && (
                  <button
                    type="button"
                    onClick={() => commitDate(null)}
                    style={{ color: resolvedMuted || resolvedText }}
                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-transparent border-0 cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    backgroundColor: resolvedAccent,
                    color: '#ffffff',
                  }}
                  className="text-xs font-medium px-3 py-1 rounded-md border-0 cursor-pointer hover:opacity-90"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';