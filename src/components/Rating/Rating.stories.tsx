import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Rating } from './Rating';

const meta: Meta<typeof Rating> = {
  title: 'Components/Rating',
  component: Rating,
  tags: ['autodocs'],
  argTypes: {
    max: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    allowHalf: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    clearable: { control: 'boolean' },
    showValue: { control: 'boolean' },
    defaultValue: { control: { type: 'number', min: 0, max: 10, step: 0.5 } },
    value: { control: { type: 'number', min: 0, max: 10, step: 0.5 } },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    activeColor: { control: 'color' },
    inactiveColor: { control: 'color' },
    hoverColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Rating>;

const ControlledRatingDemo = (args: any) => {
  const initial = args.value !== undefined ? args.value : (args.defaultValue ?? 3);
  const [val, setVal] = useState<number>(initial);

  useEffect(() => {
    if (args.value !== undefined) {
      setVal(args.value);
    } else if (args.defaultValue !== undefined) {
      setVal(args.defaultValue);
    }
  }, [args.value, args.defaultValue]);

  return (
    <div className="flex flex-col gap-3 pb-6">
      <Rating
        {...args}
        defaultValue={args.defaultValue}
        value={args.value !== undefined ? val : undefined}
        onValueChange={(next) => {
          setVal(next);
          args.onValueChange?.(next);
        }}
      />
      <div className="text-xs text-[#888888]">
        Current value:{' '}
        <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
          {val}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    defaultValue: 3,
    max: 5,
    allowHalf: false,
    showValue: true,
    size: 'medium',
    clearable: true,
  },
  render: (args) => <ControlledRatingDemo {...args} />,
};

export const HalfRating: Story = {
  args: {
    defaultValue: 3.5,
    max: 5,
    allowHalf: true,
    showValue: true,
    size: 'medium',
  },
  render: (args) => <ControlledRatingDemo {...args} />,
};

export const ReadOnlyAndDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Read-Only (4.5 / 5)
        </span>
        <Rating value={4.5} allowHalf readOnly showValue />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Disabled
        </span>
        <Rating value={2} disabled showValue />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <ControlledRatingDemo defaultValue={3} size="small" showValue />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <ControlledRatingDemo defaultValue={4} size="medium" showValue />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <ControlledRatingDemo defaultValue={5} size="large" showValue />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    defaultValue: 4,
    max: 5,
    showValue: true,
    activeColor: '#2563eb',
    inactiveColor: '#dbeafe',
    hoverColor: '#1d4ed8',
    textColor: '#1e3a8a',
  },
  render: (args) => <ControlledRatingDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    defaultValue: 4,
    max: 5,
    showValue: true,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-md">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Rating (Dark Context)</div>
      <ControlledRatingDemo {...args} />
    </div>
  ),
};