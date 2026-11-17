import React, { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: 'number' },
    showLabel: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    trackBg: { control: 'color' },
    indicatorBg: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

// Interactive component to simulate progress loading
const AnimatedProgressDemo = (args: any) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) return 0;
        return Math.min(oldProgress + Math.random() * 15, 100);
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-md pb-12 pt-4">
      <ProgressBar {...args} value={progress} />
    </div>
  );
};

export const Default: Story = {
  args: {
    value: 45,
    showLabel: true,
  },
  render: (args) => (
    <div className="w-full max-w-md pb-12 pt-4">
      <ProgressBar {...args} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="w-full max-w-md flex flex-col gap-8 pb-12 pt-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-500">Small</span>
        <ProgressBar value={25} size="small" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-500">Medium</span>
        <ProgressBar value={50} size="medium" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-500">Large</span>
        <ProgressBar value={75} size="large" />
      </div>
    </div>
  ),
};

export const SimulatedLoading: Story = {
  args: {
    showLabel: true,
  },
  render: (args) => <AnimatedProgressDemo {...args} />,
};

export const IndeterminateMode: Story = {
  args: {
    indeterminate: true,
    size: 'medium',
  },
  render: (args) => (
    <div className="w-full max-w-md pb-12 pt-4">
      <ProgressBar {...args} />
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    value: 65,
    showLabel: true,
    trackBg: '#fef2f2', // red-50
    indicatorBg: '#dc2626', // red-600
    textColor: '#991b1b', // red-800
  },
  render: (args) => (
    <div className="w-full max-w-md pb-12 pt-4">
      <ProgressBar {...args} />
    </div>
  ),
};

export const DarkModeDocs: Story = {
  args: {
    value: 80,
    showLabel: true,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-md pb-16">
      <div className="text-sm font-semibold text-zinc-400 mb-6">Progress Bar (Dark Context)</div>
      <ProgressBar {...args} />
    </div>
  ),
};