import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonGroup, ButtonGroupItem } from './ButtonGroup';

type ButtonGroupStoryArgs = React.ComponentProps<typeof ButtonGroup>;

const meta: Meta<ButtonGroupStoryArgs> = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
    activeBg: {
      control: 'color',
      description: 'Hex code for the active button background (e.g., #3b82f6)',
    },
    activeTextColor: {
      control: 'color',
      description: 'Hex code for the active button text (e.g., #ffffff)',
    },
    inactiveBg: {
      control: 'color',
      description: 'Hex code for inactive buttons background (e.g., #ffffff)',
    },
    inactiveTextColor: {
      control: 'color',
      description: 'Hex code for inactive buttons text (e.g., #6b7280)',
    },
    hoverBg: {
      control: 'color',
      description: 'Hex code for inactive button hover state (e.g., #f3f4f6)',
    },
    onValueChange: { action: 'value changed' },
  },
};

export default meta;
type Story = StoryObj<ButtonGroupStoryArgs>;

export const Default: Story = {
  args: {
    defaultValue: 'center',
    size: 'medium',
    orientation: 'horizontal',
  },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroupItem value="left">Left</ButtonGroupItem>
      <ButtonGroupItem value="center">Center</ButtonGroupItem>
      <ButtonGroupItem value="right">Right</ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const ConfigurableColorsDemo: Story = {
  args: {
    defaultValue: 'monthly',
    activeBg: '#6366f1', // Indigo 500
    activeTextColor: '#ffffff',
    inactiveBg: '#ffffff',
    inactiveTextColor: '#4b5563', // Gray 600
    hoverBg: '#e0e7ff', // Indigo 100
  },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroupItem value="daily">Daily</ButtonGroupItem>
      <ButtonGroupItem value="weekly">Weekly</ButtonGroupItem>
      <ButtonGroupItem value="monthly">Monthly</ButtonGroupItem>
      <ButtonGroupItem value="yearly">Yearly</ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const IconGroup: Story = {
  render: () => (
    <ButtonGroup defaultValue="list">
      <ButtonGroupItem value="grid" aria-label="Grid View">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
        </svg>
      </ButtonGroupItem>
      <ButtonGroupItem value="list" aria-label="List View">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
        </svg>
      </ButtonGroupItem>
      <ButtonGroupItem value="gallery" aria-label="Gallery View">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      </ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const VerticalOrientation: Story = {
  render: () => (
    <ButtonGroup defaultValue="cpu" orientation="vertical" size="large">
      <ButtonGroupItem value="cpu">CPU Metrics</ButtonGroupItem>
      <ButtonGroupItem value="memory">Memory Usage</ButtonGroupItem>
      <ButtonGroupItem value="network">Network I/O</ButtonGroupItem>
    </ButtonGroup>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 text-zinc-100 p-8 rounded-md flex flex-col gap-6 w-full mt-8">
      <div className="text-sm font-semibold text-zinc-400 mb-4">ButtonGroup (Dark Mode)</div>
      
      <ButtonGroup defaultValue="system">
        <ButtonGroupItem value="light">Light</ButtonGroupItem>
        <ButtonGroupItem value="dark">Dark</ButtonGroupItem>
        <ButtonGroupItem value="system">System</ButtonGroupItem>
      </ButtonGroup>
      
      <ButtonGroup defaultValue="code" activeBg="#3b82f6" activeTextColor="#ffffff" inactiveBg="#18181b" inactiveTextColor="#a1a1aa" hoverBg="#27272a" className="mt-4">
        <ButtonGroupItem value="preview">Preview</ButtonGroupItem>
        <ButtonGroupItem value="code">Code</ButtonGroupItem>
      </ButtonGroup>
    </div>
  ),
};