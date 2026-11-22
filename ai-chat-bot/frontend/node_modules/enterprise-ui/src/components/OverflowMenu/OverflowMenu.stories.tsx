import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { OverflowMenu, type OverflowMenuItem } from './OverflowMenu';

// --- Storybook Mock Icons ---
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);
const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);

const meta: Meta<typeof OverflowMenu> = {
  title: 'Components/OverflowMenu',
  component: OverflowMenu,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    align: {
      control: 'radio',
      options: ['left', 'right'],
    },
    disabled: { control: 'boolean' },
    menuBg: { control: 'color' },
    itemHoverBg: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof OverflowMenu>;

const defaultItems: OverflowMenuItem[] = [
  { label: 'Edit record', icon: <EditIcon />, onClick: () => alert('Edit clicked') },
  { label: 'Duplicate', icon: <CopyIcon />, onClick: () => alert('Duplicate clicked') },
  { label: 'Share link', icon: <ShareIcon />, divider: true, onClick: () => alert('Share clicked') },
  { label: 'Delete record', icon: <TrashIcon />, destructive: true, onClick: () => alert('Delete clicked') },
];

export const Default: Story = {
  args: {
    items: defaultItems,
    size: 'medium',
    align: 'right',
  },
  render: (args) => (
    <div className="pb-48 flex justify-center">
      <OverflowMenu {...args} />
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div className="flex justify-between w-full max-w-sm pb-48">
      <div className="flex flex-col items-start gap-2">
        <span className="text-sm text-zinc-500">Align: Left (Drops Rightwards)</span>
        <OverflowMenu items={defaultItems} align="left" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm text-zinc-500">Align: Right (Drops Leftwards)</span>
        <OverflowMenu items={defaultItems} align="right" />
      </div>
    </div>
  ),
};

export const CustomTrigger: Story = {
  args: {
    items: defaultItems,
    align: 'left',
    customTrigger: (
      <span className="px-3 py-1.5 text-sm bg-black text-white rounded-md hover:bg-black/80 dark:bg-white dark:text-black transition-colors">
        Actions ▾
      </span>
    ),
  },
  render: (args) => (
    <div className="p-4 pb-48 flex justify-start">
      <OverflowMenu {...args} items={defaultItems} />
    </div>
  ),
};

export const DisabledItems: Story = {
  args: {
    align: 'left',
    items: [
      { label: 'View Details', onClick: () => {} },
      { label: 'Edit Details', disabled: true, onClick: () => {} },
      { label: 'Delete', destructive: true, disabled: true, onClick: () => {} },
    ],
  },
  render: (args) => (
    <div className="p-4 pb-44 flex justify-start">
      <OverflowMenu {...args} />
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    align: 'left',
    menuBg: '#eff6ff', // blue-50
    itemHoverBg: '#dbeafe', // blue-100
    borderColor: '#bfdbfe', // blue-200
    textColor: '#1e3a8a', // blue-900
  },
  render: (args) => (
    <div className="p-4 pb-48 flex justify-start">
      <OverflowMenu {...args} items={defaultItems} />
    </div>
  ),
};

export const DarkModeDocs: Story = {
  args: {
    items: defaultItems,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-sm">
      <div className="flex justify-between items-center pb-48 w-full">
        <span className="text-sm font-semibold text-zinc-400">Data Row Example</span>
        <OverflowMenu {...args} items={defaultItems} />
      </div>
    </div>
  ),
};