import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select, type SelectOption } from './Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    align: {
      control: 'radio',
      options: ['left', 'right'],
    },
    placeholder: { control: 'text' },
    emptyText: { control: 'text' },
    clearable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    bottomBorderColor: { control: 'color' },
    textColor: { control: 'color' },
    menuBg: { control: 'color' },
    hoverBg: { control: 'color' },
    selectedBg: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const roleOptions: SelectOption[] = [
  { value: 'frontend', label: 'Frontend Engineer', description: 'React, TypeScript & UI systems' },
  { value: 'backend', label: 'Backend Engineer', description: 'APIs, databases & services' },
  { value: 'fullstack', label: 'Full-Stack Engineer', description: 'End-to-end product delivery' },
  { value: 'qa', label: 'QA Automation', description: 'Test suites & CI verification', disabled: true },
];

const ControlledSelectDemo = (args: any) => {
  const initial = args.value !== undefined ? args.value : (args.defaultValue ?? '');
  const [selected, setSelected] = useState<string>(initial);

  useEffect(() => {
    if (args.value !== undefined) {
      setSelected(args.value);
    } else if (args.defaultValue !== undefined) {
      setSelected(args.defaultValue);
    }
  }, [args.value, args.defaultValue]);

  return (
    <div className="w-full max-w-sm flex flex-col gap-3 pb-44">
      <Select
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
          {selected || '(none)'}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    options: roleOptions,
    placeholder: 'Select a role',
    size: 'medium',
    align: 'left',
    clearable: true,
    disabled: false,
  },
  render: (args) => <ControlledSelectDemo {...args} />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-sm pb-40">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <ControlledSelectDemo options={roleOptions} size="small" placeholder="Small select" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <ControlledSelectDemo options={roleOptions} size="medium" placeholder="Medium select" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <ControlledSelectDemo options={roleOptions} size="large" placeholder="Large select" />
      </div>
    </div>
  ),
};

export const EmptyAndDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-full max-w-sm pb-28">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Empty Options</span>
        <ControlledSelectDemo options={[]} placeholder="No departments" emptyText="No matching items" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Disabled</span>
        <ControlledSelectDemo options={roleOptions} defaultValue="frontend" disabled />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    options: roleOptions,
    defaultValue: 'frontend',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    bottomBorderColor: '#2563eb',
    textColor: '#1e3a8a',
    menuBg: '#f8fafc',
    hoverBg: '#dbeafe',
    selectedBg: '#bfdbfe',
  },
  render: (args) => <ControlledSelectDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    options: roleOptions,
    defaultValue: 'backend',
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-md pb-44">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Select (Dark Context)</div>
      <ControlledSelectDemo {...args} />
    </div>
  ),
};