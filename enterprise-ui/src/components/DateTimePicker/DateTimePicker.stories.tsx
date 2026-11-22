import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DateTimePicker } from './DateTimePicker';

const meta: Meta<typeof DateTimePicker> = {
  title: 'Components/DateTimePicker',
  component: DateTimePicker,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['datetime', 'date', 'time'],
    },
    timeFormat: {
      control: 'radio',
      options: ['24h', '12h'],
    },
    minuteStep: {
      control: { type: 'number', min: 1, max: 30, step: 1 },
    },
    weekStartsOn: {
      control: 'radio',
      options: [1, 0],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    placeholder: { control: 'text' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    mutedTextColor: { control: 'color' },
    accentColor: { control: 'color' },
    hoverBgColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof DateTimePicker>;

const DateTimePickerDemo = (args: any) => {
  const isDarkSurface = Boolean(args.__darkSurface);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    args.value !== undefined ? args.value : (args.defaultValue ?? new Date(2026, 10, 22, 16, 30))
  );

  useEffect(() => {
    if (args.value !== undefined) {
      setSelectedDate(args.value);
    }
  }, [args.value]);

  const darkDefaults = isDarkSurface
    ? {
        bgColor: args.bgColor ?? '#18181b',
        borderColor: args.borderColor ?? '#3f3f46',
        textColor: args.textColor ?? '#f4f4f5',
        mutedTextColor: args.mutedTextColor ?? '#a1a1aa',
        accentColor: args.accentColor ?? '#3b82f6',
        hoverBgColor: args.hoverBgColor ?? '#27272a',
      }
    : {};

  return (
    <div style={{ minHeight: '420px' }} className="w-full max-w-md flex flex-col gap-4 pb-24">
      <DateTimePicker
        {...args}
        {...darkDefaults}
        value={selectedDate}
        onChange={(next) => {
          setSelectedDate(next);
          args.onChange?.(next);
        }}
      />
      <div
        style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
        className="text-xs break-words"
      >
        Selected value:{' '}
        <span
          style={
            isDarkSurface
              ? { backgroundColor: '#27272a', color: '#f4f4f5' }
              : { backgroundColor: '#f3f4f6', color: '#111111' }
          }
          className="font-mono px-1.5 py-0.5 rounded"
        >
          {selectedDate ? selectedDate.toLocaleString('en-IN') : 'null'}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    mode: 'datetime',
    timeFormat: '24h',
    minuteStep: 15,
    weekStartsOn: 1,
    size: 'medium',
    clearable: true,
    disabled: false,
    readOnly: false,
  },
  render: (args) => <DateTimePickerDemo {...args} />,
};

export const ModesAndFormats: Story = {
  render: () => {
    const [dateVal, setDateVal] = useState<Date | null>(new Date(2026, 10, 22));
    const [timeVal, setTimeVal] = useState<Date | null>(new Date(2026, 10, 22, 16, 45));

    return (
      <div style={{ minHeight: '440px' }} className="flex flex-col gap-7 w-full max-w-md pb-24">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Date Only
          </span>
          <DateTimePicker mode="date" value={dateVal} onChange={setDateVal} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Time Only (12h Format)
          </span>
          <DateTimePicker mode="time" timeFormat="12h" minuteStep={15} value={timeVal} onChange={setTimeVal} />
        </div>
      </div>
    );
  },
};

export const CustomColorsDemo: Story = {
  args: {
    mode: 'datetime',
    timeFormat: '12h',
    minuteStep: 15,
    size: 'medium',
    bgColor: '#ffffff',
    borderColor: '#93c5fd',
    textColor: '#1e3a8a',
    mutedTextColor: '#2563eb',
    accentColor: '#2563eb',
    hoverBgColor: '#eff6ff',
  },
  render: (args) => <DateTimePickerDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    mode: 'datetime',
    timeFormat: '24h',
    minuteStep: 15,
    size: 'medium',
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px', minHeight: '440px' }}
      className="dark rounded-md border w-full max-w-md pb-24"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Date &amp; Time Picker (Dark Context)</div>
      <DateTimePickerDemo {...args} __darkSurface />
    </div>
  ),
};