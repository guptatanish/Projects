import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {
    isOpen: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    hideCloseButton: { control: 'boolean' },
    preventOutsideClick: { control: 'boolean' },
    overlayBg: { control: 'color' },
    dialogBg: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// Helper component to manage state in Storybook
const DialogDemo = (args: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 h-[400px] flex items-start">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Open Dialog
      </button>

      <Dialog 
        {...args} 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
        footer={
          args.footer || (
            <>
              <button 
                onClick={() => setIsOpen(false)}
                className="mt-2 sm:mt-0 px-4 py-2 bg-transparent border border-[#888888] rounded-md text-sm font-medium hover:bg-gray-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Confirm
              </button>
            </>
          )
        }
      >
        {args.children || (
          <p className="text-sm dark:text-zinc-300">
            This is the main body of the dialog. It handles overflow automatically. Try putting a lot of content in here and watch it scroll gracefully without breaking the layout.
          </p>
        )}
      </Dialog>
    </div>
  );
};

export const Default: Story = {
  args: {
    title: 'Deactivate Account',
    description: 'Are you sure you want to deactivate your account? This action cannot be undone.',
    size: 'md',
  },
  render: (args) => <DialogDemo {...args} />,
};

export const Sizes: Story = {
  args: {
    title: 'Large Dialog Box',
    description: 'This uses the "lg" size configuration, great for detailed forms.',
    size: 'lg',
  },
  render: (args) => <DialogDemo {...args} />,
};

export const DataEntryForm: Story = {
  args: {
    title: 'Create New Project',
    description: 'Enter the details of your new initiative below.',
    size: 'md',
    preventOutsideClick: true, // Good practice for forms so data isn't accidentally lost
    children: (
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium dark:text-zinc-200">Project Name</label>
          <input 
            type="text" 
            placeholder="e.g. Apollo Redesign" 
            className="w-full px-3 py-2 border border-[#888888] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:focus:ring-white"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium dark:text-zinc-200">Security Level</label>
          <select className="w-full px-3 py-2 border border-[#888888] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black dark:bg-zinc-900 dark:border-zinc-700 dark:text-white dark:focus:ring-white">
            <option>Standard</option>
            <option>Confidential</option>
            <option>Strictly Confidential</option>
          </select>
        </div>
      </div>
    ),
  },
  render: (args) => <DialogDemo {...args} />,
};

export const CustomColorsDemo: Story = {
  args: {
    title: 'Warning: Resource Limit',
    description: 'You are about to exceed your monthly API quota.',
    size: 'sm',
    dialogBg: '#fef2f2', // red-50
    borderColor: '#fca5a5', // red-300
    textColor: '#7f1d1d', // red-900
    overlayBg: 'rgba(127, 29, 29, 0.4)', // transparent dark red overlay
  },
  render: (args) => <DialogDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    title: 'System Preferences',
    description: 'Manage your enterprise configuration settings.',
    size: 'md',
  },
  render: (args) => (
    <div className="dark bg-zinc-950 border border-zinc-800 rounded-md w-full">
      <div className="px-8 pt-8 text-sm font-semibold text-zinc-400">Dialog (Dark Mode Context)</div>
      <DialogDemo {...args} />
    </div>
  ),
};