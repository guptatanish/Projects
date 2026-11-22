import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

type CheckboxStoryArgs = React.ComponentProps<typeof Checkbox> & {
  textColor?: string;
};

const meta: Meta<CheckboxStoryArgs> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'radio',
      options: [true, false, 'indeterminate'],
      description: 'The controlled state of the checkbox',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: 'boolean',
    },
    checkedBg: {
      control: 'color',
      description: 'Hex code for background when active (e.g., #22c55e)',
    },
    checkedBorder: {
      control: 'color',
      description: 'Hex code for border when active (e.g., #16a34a)',
    },
    iconColor: {
      control: 'color',
      description: 'Hex code for the check/dash icon (e.g., #ffffff)',
    },
    textColor: {
      control: 'color',
      description: 'Hex code for the accompanying label text',
    },
    onCheckedChange: { action: 'checked changed' },
  },
};

export default meta;
type Story = StoryObj<CheckboxStoryArgs>;

export const Default: Story = {
  args: {
    size: 'medium',
    defaultChecked: false,
    disabled: false,
    checkedBg: '',
    checkedBorder: '',
    iconColor: '',
    textColor: '',
  },
  render: (args) => (
    <div className="flex items-center gap-3 py-1">
      <Checkbox id="terms" {...args} />
      <label 
        htmlFor="terms" 
        style={{ color: args.textColor || undefined }}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-zinc-100"
      >
        Accept terms and conditions
      </label>
    </div>
  ),
};

export const ConfigurableColorsDemo: Story = {
  args: {
    defaultChecked: true,
    checkedBg: '#22c55e', 
    checkedBorder: '#16a34a', 
    iconColor: '#ffffff',
    textColor: '#166534', 
  },
  render: (args) => (
    <div className="flex items-center gap-3 py-1">
      <Checkbox id="custom-color" {...args} />
      <label 
        htmlFor="custom-color" 
        style={{ color: args.textColor || undefined }}
        className="text-sm font-medium dark:text-zinc-100"
      >
        Subscribe to newsletter
      </label>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    // FIXED: Replaced space-y-4 with gap-4 and added py-1 to individual rows
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 py-1">
        <Checkbox id="size-sm" size="small" defaultChecked />
        <label htmlFor="size-sm" className="text-sm dark:text-zinc-100">Small Checkbox (16px)</label>
      </div>
      <div className="flex items-center gap-3 py-1">
        <Checkbox id="size-md" size="medium" defaultChecked />
        <label htmlFor="size-md" className="text-sm dark:text-zinc-100">Medium Checkbox (20px)</label>
      </div>
      <div className="flex items-center gap-3 py-1">
        <Checkbox id="size-lg" size="large" defaultChecked />
        <label htmlFor="size-lg" className="text-sm dark:text-zinc-100">Large Checkbox (24px)</label>
      </div>
    </div>
  ),
};

export const IndeterminateState: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [childrenChecked, setChildrenChecked] = useState([true, false]);

    const allChecked = childrenChecked.every(Boolean);
    const isIndeterminate = childrenChecked.some(Boolean) && !allChecked;
    const parentState = allChecked ? true : isIndeterminate ? 'indeterminate' : false;

    const toggleParent = () => {
      const newState = parentState === 'indeterminate' ? true : !allChecked;
      setChildrenChecked([newState, newState]);
    };

    return (
      <div className="flex flex-col p-6 border border-[#888888] rounded-md max-w-sm dark:border-zinc-700">
        <div className="flex items-center gap-3 py-1 pb-4 border-b border-[#888888] dark:border-zinc-700">
          <Checkbox 
            id="parent" 
            checked={parentState} 
            onCheckedChange={toggleParent} 
          />
          <label htmlFor="parent" className="text-sm font-bold dark:text-zinc-100">
            Select All Permissions
          </label>
        </div>
        
        {/* FIXED: Replaced space-y-3 with gap-4 for unbreakable vertical spacing */}
        <div className="flex flex-col gap-4 pl-7 pt-4">
          <div className="flex items-center gap-3 py-1">
            <Checkbox 
              id="child1" 
              checked={childrenChecked[0]} 
              onCheckedChange={(c) => setChildrenChecked([c, childrenChecked[1]])} 
            />
            <label htmlFor="child1" className="text-sm dark:text-zinc-300">Read Access</label>
          </div>
          <div className="flex items-center gap-3 py-1">
            <Checkbox 
              id="child2" 
              checked={childrenChecked[1]} 
              onCheckedChange={(c) => setChildrenChecked([childrenChecked[0], c])} 
            />
            <label htmlFor="child2" className="text-sm dark:text-zinc-300">Write Access</label>
          </div>
        </div>
      </div>
    );
  }
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 py-1">
        <Checkbox id="disabled-unchecked" disabled />
        <label htmlFor="disabled-unchecked" className="text-sm opacity-50 dark:text-zinc-100">Disabled Unchecked</label>
      </div>
      <div className="flex items-center gap-3 py-1">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <label htmlFor="disabled-checked" className="text-sm opacity-50 dark:text-zinc-100">Disabled Checked</label>
      </div>
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 p-8 rounded-md flex flex-col gap-6 w-full mt-8 border border-zinc-800">
      <div className="text-sm font-semibold text-zinc-400 mb-2">Checkbox (Dark Mode Context)</div>
      
      <div className="flex items-center gap-3 py-1">
        <Checkbox id="dm-1" defaultChecked />
        <label htmlFor="dm-1" className="text-sm font-medium text-zinc-100">Default Dark Theme</label>
      </div>
      
      <div className="flex items-center gap-3 py-1">
        <Checkbox id="dm-2" defaultChecked checkedBg="#6366f1" checkedBorder="#4f46e5" iconColor="#ffffff" />
        <label htmlFor="dm-2" className="text-sm font-medium text-zinc-100">Custom Brand Color</label>
      </div>
    </div>
  ),
};