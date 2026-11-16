import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './Breadcrumb';

type BreadcrumbStoryArgs = React.ComponentProps<typeof Breadcrumb> & {
  linkColor?: string;
  hoverColor?: string;
  pageColor?: string;
  separatorType?: 'chevron' | 'slash';
};

const meta: Meta<BreadcrumbStoryArgs> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  argTypes: {
    linkColor: {
      control: 'color',
      description: 'Hex color code for inactive links (e.g., #3b82f6)',
    },
    hoverColor: {
      control: 'color',
      description: 'Hex color code on hover (e.g., #1d4ed8)',
    },
    pageColor: {
      control: 'color',
      description: 'Hex color code for the current active page (e.g., #1e3a8a)',
    },
    separatorType: {
      control: 'radio',
      options: ['chevron', 'slash'],
      description: 'Toggle between the default chevron icon and a slash separator',
    },
  },
};

export default meta;
type Story = StoryObj<BreadcrumbStoryArgs>;

export const Default: Story = {
  args: {
    linkColor: '#3b82f6', 
    hoverColor: '#1d4ed8', 
    pageColor: '#1e3a8a', 
    separatorType: 'chevron',
  },
  render: (args) => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" linkColor={args.linkColor} hoverColor={args.hoverColor}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          {args.separatorType === 'slash' ? <span className="font-light text-[#888888] px-1">/</span> : undefined}
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" linkColor={args.linkColor} hoverColor={args.hoverColor}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          {args.separatorType === 'slash' ? <span className="font-light text-[#888888] px-1">/</span> : undefined}
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage pageColor={args.pageColor}>
            Breadcrumb
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const ConfigurableColorsDemo: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" linkColor="#3b82f6" hoverColor="#1d4ed8">
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#" linkColor="#3b82f6" hoverColor="#1d4ed8">
            Settings
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage pageColor="#1e3a8a">
            Billing
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const WithCollapsedItems: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" linkColor="#3b82f6" hoverColor="#1d4ed8">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#" linkColor="#3b82f6" hoverColor="#1d4ed8">Products</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage pageColor="#1e3a8a">Enterprise Plan</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const TruncatedText: Story = {
  render: () => (
    <div className="max-w-[300px] border border-[#888888] p-4 rounded-sm">
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="truncate">
            <BreadcrumbLink href="#" linkColor="#3b82f6" hoverColor="#1d4ed8" className="truncate max-w-[80px]">
              Root Directory
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="truncate">
            <BreadcrumbPage pageColor="#1e3a8a" className="truncate max-w-[120px]">
              Very Long Folder Name That Will Be Truncated
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 text-zinc-100 p-8 rounded-md flex flex-col gap-6 w-full mt-8">
      <div className="text-sm font-semibold text-zinc-400 mb-2">Breadcrumb (Dark Mode)</div>
      
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {/* Using lighter blue hex codes optimized for dark backgrounds */}
            <BreadcrumbLink href="#" linkColor="#60a5fa" hoverColor="#93c5fd">Workspaces</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" linkColor="#60a5fa" hoverColor="#93c5fd">Design System</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage pageColor="#bfdbfe">Typography</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
};