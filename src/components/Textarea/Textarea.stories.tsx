import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text' },
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    rows: { control: { type: 'number', min: 2, max: 12, step: 1 } },
    maxRows: { control: { type: 'number', min: 2, max: 14, step: 1 } },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'horizontal', 'both', 'auto'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    maxLength: { control: { type: 'number', min: 10, max: 1000, step: 10 } },
    showCount: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    focusBorderColor: { control: 'color' },
    textColor: { control: 'color' },
    placeholderColor: { control: 'color' },
    errorColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

const TextareaDemo = (args: any) => {
  const initial = args.value !== undefined ? args.value : (args.defaultValue ?? '');
  const [val, setVal] = useState<string>(String(initial));
  const isDarkSurface = Boolean(args.__darkSurface);

  useEffect(() => {
    if (args.value !== undefined) {
      setVal(String(args.value));
    } else if (args.defaultValue !== undefined) {
      setVal(String(args.defaultValue));
    }
  }, [args.value, args.defaultValue]);

  return (
    <div className="w-full max-w-lg flex flex-col gap-4 pb-6">
      <Textarea
        {...args}
        value={val}
        bgColor={args.bgColor ?? (isDarkSurface ? '#18181b' : undefined)}
        borderColor={args.borderColor ?? (isDarkSurface ? '#3f3f46' : undefined)}
        focusBorderColor={args.focusBorderColor ?? (isDarkSurface ? '#ffffff' : undefined)}
        textColor={args.textColor ?? (isDarkSurface ? '#f4f4f5' : undefined)}
        placeholderColor={args.placeholderColor ?? (isDarkSurface ? '#71717a' : undefined)}
        onValueChange={(next) => {
          setVal(next);
          args.onValueChange?.(next);
        }}
      />

      <div
        style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
        className="text-xs"
      >
        Characters:{' '}
        <span
          style={
            isDarkSurface
              ? { backgroundColor: '#27272a', color: '#f4f4f5' }
              : { backgroundColor: '#f3f4f6', color: '#111111' }
          }
          className="font-mono px-1.5 py-0.5 rounded"
        >
          {val.length}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    label: 'Release Notes',
    placeholder: 'Write summary of changes, migrations, or rollout notes...',
    helperText: 'Visible to team members on the deployment log.',
    rows: 4,
    resize: 'vertical',
    size: 'medium',
    maxLength: 300,
    showCount: true,
    required: true,
  },
  render: (args) => <TextareaDemo {...args} />,
};

export const SizesAndAutoResize: Story = {
  render: () => (
    <div className="flex flex-col gap-7 w-full max-w-lg pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <TextareaDemo
          label="Short Note"
          placeholder="Small textarea..."
          size="small"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <TextareaDemo
          label="Standard Note"
          placeholder="Medium textarea..."
          size="medium"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <TextareaDemo
          label="Detailed Specification"
          placeholder="Large textarea..."
          size="large"
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Auto-Resize (rows: 2, maxRows: 6)
        </span>
        <TextareaDemo
          label="Auto-Expanding Notes"
          placeholder="Type multiple lines to see height expand automatically..."
          resize="auto"
          rows={2}
          maxRows={6}
          helperText="Expands smoothly up to 6 rows."
        />
      </div>
    </div>
  ),
};

export const ValidationAndStates: Story = {
  render: () => (
    <div className="flex flex-col gap-7 w-full max-w-lg pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Error State</span>
        <TextareaDemo
          label="Incident Postmortem"
          defaultValue="Root cause under investigation."
          error="Please include timeline impact and mitigation steps."
          showCount
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Read-Only</span>
        <TextareaDemo
          label="System Configuration"
          defaultValue={'{\n  "retries": 3,\n  "timeoutMs": 5000\n}'}
          readOnly
          resize="none"
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Disabled</span>
        <TextareaDemo
          label="Archived Comment"
          defaultValue="Editing is locked for closed tickets."
          disabled
          rows={3}
        />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    label: 'Custom Styled Notes',
    placeholder: 'Type here...',
    defaultValue: 'Styled with custom accent borders and surface tint.',
    showCount: true,
    maxLength: 160,
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    focusBorderColor: '#2563eb',
    textColor: '#1e3a8a',
    placeholderColor: '#60a5fa',
  },
  render: (args) => <TextareaDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    label: 'Engineering Notes',
    placeholder: 'Add technical notes...',
    defaultValue: 'Verified build pipeline and dark mode surface contrast.',
    helperText: 'Stored as draft automatically.',
    showCount: true,
    maxLength: 240,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-lg"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Textarea (Dark Context)</div>
      <TextareaDemo {...args} __darkSurface />
    </div>
  ),
};