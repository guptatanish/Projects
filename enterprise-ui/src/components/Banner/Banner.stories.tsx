import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Banner } from './Banner';
import { cn } from '../../utils/cn';

// Extend Storybook args to include custom action fields for the documentation
type BannerStoryArgs = React.ComponentProps<typeof Banner> & {
  customActionText?: string;
  customActionColor?: string;
};

const meta: Meta<BannerStoryArgs> = {
  title: 'Components/Banner',
  component: Banner,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'destructive'],
    },
    position: {
      control: 'select',
      options: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    },
    isDismissible: { control: 'boolean' },
    onClose: { action: 'closed' },
    bannerBg: {
      control: 'text',
      description: 'Override banner background class (e.g., bg-purple-600)',
    },
    contentColor: {
      control: 'text',
      description: 'Override banner text color class (e.g., text-purple-100)',
    },
    customActionText: {
      control: 'text',
      description: 'Text to display inside the action button for this demo',
    },
    customActionColor: {
      control: 'text',
      description: 'Tailwind classes for the action button (e.g., bg-white text-black)',
    },
  },
};

export default meta;
type Story = StoryObj<BannerStoryArgs>;

export const Default: Story = {
  args: {
    variant: 'default',
    position: 'relative',
    isDismissible: true,
    bannerBg: '',
    contentColor: '',
    customActionText: 'Take Action',
    customActionColor: 'bg-black text-white px-3 py-1.5 rounded-sm hover:opacity-80',
    children: 'System maintenance is scheduled for Sunday at 02:00 AM IST. Expect up to 15 minutes of downtime.',
  },
  render: (args) => (
    <Banner 
      {...args} 
      action={
        args.customActionText ? (
          <button className={cn("text-xs font-bold shadow-sm focus:outline-none transition-colors", args.customActionColor)}>
            {args.customActionText}
          </button>
        ) : undefined
      }
    />
  ),
};

export const ConfigurableColors: Story = {
  render: () => (
    <div className="flex flex-col w-full gap-4">
      <Banner 
        variant="default" // The variant is overridden by bannerBg below
        bannerBg="bg-indigo-600" 
        contentColor="text-indigo-50"
        isDismissible 
        action={
          <button className="bg-white text-indigo-900 px-4 py-2 text-xs font-bold shadow-sm hover:bg-indigo-50 focus:outline-none transition-colors">
            Custom Action
          </button>
        }
      >
        This banner uses custom bannerBg and contentColor props to completely override the default theme.
      </Banner>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col w-full gap-4">
      <Banner variant="default" isDismissible>
        Default: We have updated our Terms of Service and Privacy Policy.
      </Banner>
      <Banner variant="info" isDismissible>
        Info: A new version of the enterprise dashboard is now available.
      </Banner>
      <Banner variant="success" isDismissible>
        Success: Your data migration has completed successfully without errors.
      </Banner>
      <Banner variant="warning" isDismissible>
        Warning: Your API key will expire in 3 days. Please generate a new one.
      </Banner>
      <Banner variant="destructive" isDismissible>
        Destructive: We could not process your last payment. Your account will be suspended in 24 hours.
      </Banner>
    </div>
  ),
};

export const InteractiveDismiss: Story = {
  render: () => {
    const [isVisible, setIsVisible] = useState(true);
    
    if (!isVisible) {
      return (
        <button 
          onClick={() => setIsVisible(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded shadow hover:bg-blue-700"
        >
          Reset Banner
        </button>
      );
    }

    return (
      <Banner 
        variant="info" 
        isDismissible 
        onClose={() => setIsVisible(false)}
      >
        Click the X icon on the right to dismiss this banner. In a real app, you would save this state to localStorage.
      </Banner>
    );
  }
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 text-zinc-100 p-8 rounded-md flex flex-col gap-6 w-full mt-8">
      <div className="text-sm font-semibold text-zinc-400 mb-2">Banner Variants (Dark Mode)</div>
      
      <Banner variant="default" isDismissible>
        Default: We have updated our Terms of Service and Privacy Policy.
      </Banner>
      <Banner variant="info" isDismissible>
        Info: A new version of the enterprise dashboard is now available.
      </Banner>
      <Banner variant="success" isDismissible>
        Success: Your data migration has completed successfully without errors.
      </Banner>
      <Banner variant="warning" isDismissible>
        Warning: Your API key will expire in 3 days. Please generate a new one.
      </Banner>
      <Banner variant="destructive" isDismissible>
        Destructive: We could not process your last payment. Your account will be suspended.
      </Banner>
    </div>
  ),
};