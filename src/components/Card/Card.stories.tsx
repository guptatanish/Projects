import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

type CardStoryArgs = React.ComponentProps<typeof Card>;

const meta: Meta<CardStoryArgs> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['outline', 'elevated', 'filled'],
    },
    isInteractive: {
      control: 'boolean',
      description: 'Adds a hover lift effect and shadow for clickable cards',
    },
    cardBg: {
      control: 'color',
      description: 'Hex code for custom card background (e.g., #f0fdf4)',
    },
    borderColor: {
      control: 'color',
      description: 'Hex code for custom border color (e.g., #bbf7d0)',
    },
    textColor: {
      control: 'color',
      description: 'Hex code for custom text color (e.g., #166534)',
    },
  },
};

export default meta;
type Story = StoryObj<CardStoryArgs>;

export const Default: Story = {
  args: {
    variant: 'outline',
    isInteractive: false,
    // explicitly initializing these ensures Storybook controls work
    cardBg: '',
    borderColor: '',
    textColor: '',
  },
  render: (args) => (
    <Card className="w-[350px]" {...args}>
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="text-sm font-medium">Framework</div>
          <div className="h-10 w-full rounded-md border border-[#888888] flex items-center px-3 text-sm text-[#888888] dark:border-zinc-700 dark:text-zinc-400">
            Select a framework...
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <button className="px-4 py-2 text-sm border border-[#888888] rounded-md hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
        <button className="px-4 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-md hover:bg-black/90 dark:hover:bg-gray-200 transition-colors">Deploy</button>
      </CardFooter>
    </Card>
  ),
};

export const UniversalContainerWithMedia: Story = {
  render: () => (
    <Card className="w-[400px] overflow-hidden">
      <div className="h-48 w-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
        <span className="text-blue-500 dark:text-blue-400 font-medium">Edge-to-Edge Container</span>
      </div>
      <CardHeader>
        <CardTitle>Product Name</CardTitle>
        <CardDescription>SKU: 192-XYS-2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          The card naturally handles components placed inside its content block. 
          The padding perfectly aligns all child items.
        </p>
        <div className="mt-4 flex gap-2">
           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">New</span>
           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300">In Stock</span>
        </div>
      </CardContent>
      <CardFooter>
        <button className="w-full px-4 py-2 text-sm bg-black text-white dark:bg-white dark:text-black rounded-md hover:opacity-90 transition-opacity">Add to Cart</button>
      </CardFooter>
    </Card>
  ),
};

export const ConfigurableColorsDemo: Story = {
  args: {
    variant: 'outline',
    cardBg: '#fef2f2', 
    borderColor: '#fecaca', 
    textColor: '#991b1b', 
  },
  render: (args) => (
    <Card className="w-[350px]" {...args}>
      <CardHeader>
        <CardTitle>Danger Zone</CardTitle>
        <CardDescription style={{ color: '#dc2626' }}>This action cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Permanently delete this repository and all of its associated data, settings, and deployments.
        </p>
      </CardContent>
      <CardFooter>
        <button className="px-4 py-2 text-sm bg-[#ef4444] text-white rounded-md hover:bg-[#dc2626] transition-colors border-none">
          Delete Repository
        </button>
      </CardFooter>
    </Card>
  ),
};

export const InteractiveCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <Card isInteractive variant="elevated" className="w-full">
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>View your monthly traffic</CardDescription>
        </CardHeader>
      </Card>
      
      <Card isInteractive variant="outline" className="w-full">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your workspace</CardDescription>
        </CardHeader>
      </Card>
    </div>
  ),
};