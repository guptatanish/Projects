import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup, type RadioOption } from './RadioGroup';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['vertical', 'horizontal'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    activeColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    hoverBg: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

const sampleOptions: RadioOption[] = [
  { value: 'standard', label: 'Standard Delivery' },
  { value: 'express', label: 'Express Delivery' },
  { value: 'pickup', label: 'Store Pickup' },
];

const ControlledRadioDemo = (args: any) => {
  const [selected, setSelected] = useState<string>(args.value ?? 'standard');

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 pb-8">
      <RadioGroup
        {...args}
        value={selected}
        onValueChange={(val) => {
          setSelected(val);
          args.onValueChange?.(val);
        }}
      />
      <div className="text-xs text-[#888888]">
        Selected value:{' '}
        <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
          {selected || 'none'}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    options: sampleOptions,
    value: 'standard',
    orientation: 'vertical',
    size: 'medium',
  },
  render: (args) => <ControlledRadioDemo {...args} />,
};

export const SingleRadioButton: Story = {
  args: {
    options: [
      {
        value: 'agree',
        label: 'I acknowledge the compliance policy for this workspace',
      },
    ],
    value: '',
    size: 'medium',
  },
  render: (args) => <ControlledRadioDemo {...args} />,
};

export const HorizontalLayout: Story = {
  args: {
    options: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ],
    value: 'weekly',
    orientation: 'horizontal',
  },
  render: (args) => <ControlledRadioDemo {...args} />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-full max-w-md pb-8">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <ControlledRadioDemo options={sampleOptions} value="standard" size="small" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <ControlledRadioDemo options={sampleOptions} value="express" size="medium" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <ControlledRadioDemo options={sampleOptions} value="pickup" size="large" />
      </div>
    </div>
  ),
};

export const DisabledStates: Story = {
  args: {
    options: [
      { value: 'opt1', label: 'Available Option' },
      { value: 'opt2', label: 'Disabled Option', disabled: true },
      { value: 'opt3', label: 'Another Available Option' },
    ],
    value: 'opt1',
  },
  render: (args) => <ControlledRadioDemo {...args} />,
};

export const CustomColorsDemo: Story = {
  args: {
    options: sampleOptions,
    value: 'express',
    activeColor: '#2563eb',
    borderColor: '#93c5fd',
    textColor: '#1e3a8a',
    hoverBg: '#eff6ff',
  },
  render: (args) => <ControlledRadioDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    options: sampleOptions,
    value: 'standard',
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-md">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Radio Group (Dark Context)</div>
      <ControlledRadioDemo {...args} />
    </div>
  ),
};