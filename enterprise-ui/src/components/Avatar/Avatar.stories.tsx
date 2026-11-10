import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarImage, AvatarFallback } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="50%" height="50%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export const Default: Story = {
  args: {
    size: 'md',
    shape: 'circle',
  },
  render: (args) => (
    <div className="inline-block">
      <Avatar {...args}>
        <AvatarImage src="https://i.pravatar.cc/150?img=32" alt="Jane Doe" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const ImageFallbackLogic: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-gray-500 font-medium">Valid Image</span>
        <Avatar size="lg">
          <AvatarImage src="https://i.pravatar.cc/150?img=68" alt="Valid Image" />
          <AvatarFallback>VI</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-gray-500 font-medium">Broken Link (Shows Fallback)</span>
        <Avatar size="lg">
          <AvatarImage src="https://example.com/broken-image.jpg" alt="Broken Link" />
          <AvatarFallback>BL</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-gray-500 font-medium">No Image (Icon Fallback)</span>
        <Avatar size="lg">
          <AvatarFallback><UserIcon /></AvatarFallback>
        </Avatar>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar size="xl">
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <Avatar size="lg" shape="circle">
        <AvatarImage src="https://i.pravatar.cc/150?img=47" alt="Circle Shape" />
        <AvatarFallback>CR</AvatarFallback>
      </Avatar>
      <Avatar size="lg" shape="square">
        <AvatarImage src="https://i.pravatar.cc/150?img=47" alt="Square Shape" />
        <AvatarFallback>SQ</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 text-zinc-100 p-8 rounded-md flex flex-col gap-8 w-full max-w-2xl mt-8">
      <div>
        <div className="text-sm font-semibold mb-6 text-zinc-400">Avatar Component (Dark Mode)</div>
        <div className="flex gap-8 items-end">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">Image Loaded</span>
            <Avatar size="lg">
              <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="Dark Mode User" />
              <AvatarFallback>DM</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">Initials Fallback</span>
            <Avatar size="lg">
              <AvatarFallback>TG</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-zinc-500 font-medium">Square Icon Fallback</span>
            <Avatar size="lg" shape="square">
              <AvatarFallback><UserIcon /></AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  ),
};