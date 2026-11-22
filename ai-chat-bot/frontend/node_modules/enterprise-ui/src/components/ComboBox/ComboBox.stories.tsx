import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ComboBox, type ComboBoxOption } from './ComboBox';

type ComboBoxStoryArgs = React.ComponentProps<typeof ComboBox>;

const meta: Meta<ComboBoxStoryArgs> = {
  title: 'Components/ComboBox',
  component: ComboBox,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['single', 'multiple'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    triggerBg: { control: 'color', description: 'Background hex for the input box' },
    dropdownBg: { control: 'color', description: 'Background hex for the floating dropdown list' },
    itemHoverBg: { control: 'color', description: 'Background hex for items on hover' },
    activeTextColor: { control: 'color', description: 'Text hex for the selected item in the list' },
    borderColor: { control: 'color', description: 'Hex code for dropdown full borders' },
    bottomBorderColor: { control: 'color', description: 'Hex code specifically for the trigger bottom border' },
    textColor: { control: 'color', description: 'Base text hex color' },
    onValueChange: { action: 'value changed' },
  },
};

export default meta;
type Story = StoryObj<ComboBoxStoryArgs>;

const frameworks: ComboBoxOption[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'remix', label: 'Remix', disabled: true },
  { value: 'astro', label: 'Astro' },
];

export const Default: Story = {
  args: {
    mode: 'single',
    size: 'medium',
    options: frameworks,
    placeholder: 'Select framework...',
    disabled: false,
  },
  render: (args) => (
    <div className="pb-40">
      <ComboBox {...args} />
    </div>
  ),
};

export const MultiSelect: Story = {
  args: {
    mode: 'multiple',
    size: 'medium',
    options: frameworks,
    placeholder: 'Select multiple frameworks...',
  },
  render: (args) => (
    <div className="pb-48">
      <ComboBox {...args} />
    </div>
  ),
};

export const GenericScalingSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 pb-40">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium dark:text-zinc-200">Small (Dense Layouts)</label>
        <ComboBox size="small" options={frameworks} placeholder="Select framework..." />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium dark:text-zinc-200">Medium (Standard Forms)</label>
        <ComboBox size="medium" options={frameworks} placeholder="Select framework..." />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium dark:text-zinc-200">Large (Spacious Layouts)</label>
        <ComboBox size="large" options={frameworks} placeholder="Select framework..." />
      </div>
    </div>
  ),
};

export const ConfigurableColorsDemo: Story = {
  args: {
    options: frameworks,
    mode: 'multiple',
    placeholder: 'Select a theme...',
    triggerBg: '#fef2f2', 
    dropdownBg: '#ffffff',
    itemHoverBg: '#fee2e2', 
    activeTextColor: '#b91c1c', 
    borderColor: '#fca5a5',
    bottomBorderColor: '#dc2626', // Specifically styling the flat bottom border
    textColor: '#7f1d1d', 
  },
  render: (args) => (
    <div className="pb-40">
      <ComboBox {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ComboBox 
        options={frameworks} 
        disabled 
        placeholder="Cannot interact..." 
      />
      <ComboBox 
        options={frameworks} 
        disabled 
        value="react" 
      />
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 p-8 rounded-md flex flex-col gap-6 w-full mt-8 border border-zinc-800 pb-48">
      <div className="text-sm font-semibold text-zinc-400 mb-2">ComboBox (Dark Mode Context)</div>
      
      <div className="flex flex-col gap-4">
        <ComboBox 
          options={frameworks} 
          mode="multiple"
          placeholder="Default dark theme (multi-select)..." 
        />
        
        <ComboBox 
          options={frameworks} 
          placeholder="Custom brand dark theme..." 
          triggerBg="#1e1b4b" 
          dropdownBg="#312e81" 
          itemHoverBg="#4338ca" 
          borderColor="#4f46e5"
          bottomBorderColor="#818cf8"
          textColor="#e0e7ff" 
        />
      </div>
    </div>
  ),
};