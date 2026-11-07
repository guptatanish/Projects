import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['notification', 'status'],
    },
    intent: {
      control: 'select',
      options: ['default', 'error', 'success', 'warning', 'info'],
    },
    placement: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
    },
    content: {
      control: 'text',
    },
    max: { control: 'number' },
    showZero: { control: 'boolean' },
    invisible: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

const BellIcon = () => (
  <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-md flex items-center justify-center shrink-0">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900 dark:text-white">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  </div>
);

const Avatar = () => (
  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-sm font-semibold shrink-0 text-black dark:text-white">
    TG
  </div>
);

export const Default: Story = {
  args: {
    content: '4',
    type: 'notification',
    intent: 'error',
    placement: 'top-right',
    children: <BellIcon />,
  },
};

export const NotificationType: Story = {
  render: () => (
    <div className="flex gap-10 p-6 items-center">
      <Badge type="notification" content="4" intent="error" placement="top-right">
        <BellIcon />
      </Badge>
      <Badge type="notification" content={120} max={99} intent="info" placement="top-left">
        <div className="px-4 py-2 border bg-white dark:bg-zinc-900 rounded-md text-sm shrink-0 font-medium">Inbox</div>
      </Badge>
      <Badge type="notification" content="New" intent="success" placement="bottom-right">
        <div className="px-4 py-2 border bg-white dark:bg-zinc-900 rounded-md text-sm shrink-0 font-medium">Features</div>
      </Badge>
    </div>
  ),
};

export const StatusType: Story = {
  render: () => (
    <div className="flex gap-10 p-6 items-center">
      <Badge type="status" intent="success" placement="bottom-right">
        <Avatar />
      </Badge>
      <Badge type="status" intent="error" placement="top-left">
        <Avatar />
      </Badge>
      <Badge type="status" intent="warning" placement="bottom-left">
        <Avatar />
      </Badge>
      <Badge type="status" intent="default" placement="top-right">
        <Avatar />
      </Badge>
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 text-zinc-100 p-8 rounded-md flex flex-col gap-8 w-full max-w-2xl mt-4">
      <div>
        <div className="text-sm font-semibold mb-6 text-zinc-400">Notification Badges (Dark Mode)</div>
        <div className="flex gap-10 items-center">
          <Badge type="notification" content="4" intent="error" placement="top-right">
            <BellIcon />
          </Badge>
          <Badge type="notification" content={120} max={99} intent="info" placement="top-left">
            <div className="px-4 py-2 border border-zinc-700 rounded-md text-sm shrink-0 font-medium">Inbox</div>
          </Badge>
        </div>
      </div>
      <div className="pt-6 border-t border-zinc-800">
        <div className="text-sm font-semibold mb-6 text-zinc-400">Status / Presence Badges (Dark Mode)</div>
        <div className="flex gap-10 items-center">
          <Badge type="status" intent="success" placement="bottom-right">
            <Avatar />
          </Badge>
          <Badge type="status" intent="error" placement="top-left">
            <Avatar />
          </Badge>
          <Badge type="status" intent="warning" placement="bottom-left">
            <Avatar />
          </Badge>
        </div>
      </div>
    </div>
  ),
};