import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['circle', 'dots', 'orbit', 'ring'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xlarge'],
    },
    speed: {
      control: 'select',
      options: ['slow', 'normal', 'fast'],
    },
    color: { control: 'color' },
    trackColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-8 items-center py-8">
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-zinc-500 font-medium">Circle</span>
        <Spinner variant="circle" size="large" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-zinc-500 font-medium">Dots (Gemini)</span>
        <Spinner variant="dots" size="large" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-zinc-500 font-medium">Orbit</span>
        <Spinner variant="orbit" size="large" />
      </div>
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-zinc-500 font-medium">Ring</span>
        <Spinner variant="ring" size="large" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 py-8">
      <Spinner variant="circle" size="small" />
      <Spinner variant="circle" size="medium" />
      <Spinner variant="circle" size="large" />
      <Spinner variant="circle" size="xlarge" />
    </div>
  ),
};

export const ButtonIntegration: Story = {
  render: () => (
    <div className="flex gap-4 py-8">
      <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-black/90 transition-colors">
        <Spinner variant="circle" size="small" />
        Saving...
      </button>
      <button className="flex items-center justify-center w-[120px] px-4 py-2 border border-zinc-300 text-black rounded-md text-sm font-medium hover:bg-zinc-50 transition-colors">
        <Spinner variant="dots" size="small" />
      </button>
    </div>
  ),
};

export const CustomColors: Story = {
  args: {
    variant: 'circle',
    size: 'xlarge',
    color: '#3b82f6', // blue-500
    trackColor: '#dbeafe', // blue-100
  },
  render: (args) => (
    <div className="py-8">
      <Spinner {...args} />
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-md">
      <div className="text-sm font-semibold text-zinc-400 mb-6">Spinner (Dark Context)</div>
      <div className="flex gap-6 text-white">
        <Spinner variant="circle" size="large" />
        <Spinner variant="orbit" size="large" />
        <Spinner variant="dots" size="large" />
      </div>
    </div>
  ),
};