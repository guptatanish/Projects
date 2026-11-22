import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NumericInput } from './NumericInput';

const meta: Meta<typeof NumericInput> = {
  title: 'Components/NumericInput',
  component: NumericInput,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    allowDecimals: { control: 'boolean', description: 'Toggles whether decimal values can be typed or pasted' },
    step: { control: 'number', description: 'Amount to increment/decrement per button click' },
    precision: { control: 'number', description: 'Locks the number of decimal places' },
    min: { control: 'number' },
    max: { control: 'number' },
    placeholder: { control: 'text' },
    inputBg: { control: 'color' },
    stepperBg: { control: 'color' },
    stepperHoverBg: { control: 'color' },
    borderColor: { control: 'color' },
    bottomBorderColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof NumericInput>;

const NumericInputDemo = (args: any) => {
  const [val, setVal] = useState<number | undefined>(args.value);

  return (
    <div className="flex flex-col gap-4 pb-20">
      <NumericInput 
        {...args} 
        value={val} 
        onValueChange={(v) => {
          setVal(v);
          args.onValueChange?.(v);
        }} 
      />
      <div className="text-xs text-[#888888]">
        Raw Output: <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{typeof val === 'number' ? val : 'undefined'}</span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    placeholder: 'Qty',
    step: 1,
    allowDecimals: true,
  },
  render: (args) => <NumericInputDemo {...args} />,
};

export const IntegerOnly: Story = {
  args: {
    placeholder: 'Whole No.',
    step: 5,
    allowDecimals: false,
  },
  render: (args) => <NumericInputDemo {...args} />,
};

export const CurrencyAndPrecision: Story = {
  args: {
    placeholder: '0.00',
    step: 10.50,
    allowDecimals: true,
    precision: 2,
    prefix: '₹',
  },
  render: (args) => <NumericInputDemo {...args} />,
};

export const MinMaxClamped: Story = {
  args: {
    placeholder: '0-100',
    min: 0,
    max: 100,
    step: 10,
    suffix: '%',
  },
  render: (args) => <NumericInputDemo {...args} />,
};

export const GenericScalingSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full pb-20">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium dark:text-zinc-200">Small</label>
        <NumericInputDemo size="small" placeholder="Qty" step={1} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium dark:text-zinc-200">Medium</label>
        <NumericInputDemo size="medium" placeholder="Qty" step={1} />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium dark:text-zinc-200">Large</label>
        <NumericInputDemo size="large" placeholder="Qty" step={1} />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    placeholder: 'Custom...',
    inputBg: '#fef2f2',
    stepperBg: '#fecaca',
    stepperHoverBg: '#f87171',
    borderColor: '#fca5a5',
    bottomBorderColor: '#dc2626',
    textColor: '#7f1d1d',
    prefix: 'kg',
  },
  render: (args) => <NumericInputDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    placeholder: 'Dark...',
    step: 100,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-sm">
      <div className="text-sm font-semibold text-zinc-400 mb-6">Numeric Input (Dark Context)</div>
      <NumericInputDemo {...args} />
    </div>
  ),
};