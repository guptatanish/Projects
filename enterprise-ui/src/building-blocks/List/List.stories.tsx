import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { List, type ListItem } from './List';

const meta: Meta<typeof List> = {
  title: 'Building Blocks/List',
  component: List,
  tags: ['autodocs'],
  argTypes: {
    as: {
      control: 'radio',
      options: ['ul', 'ol', 'div'],
    },
    variant: {
      control: 'select',
      options: ['plain', 'bordered', 'card', 'divided'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    selectable: { control: 'boolean' },
    emptyText: { control: 'text' },
    bgColor: { control: 'color' },
    itemBgColor: { control: 'color' },
    activeBgColor: { control: 'color' },
    hoverBgColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    mutedTextColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof List>;

const sampleItems: ListItem[] = [
  {
    id: 'deploy-prod',
    primary: 'Production API Release v2.4.0',
    secondary: 'Deployed by release-bot · 12 minutes ago',
    trailing: 'Healthy',
  },
  {
    id: 'pr-review',
    primary: 'Design System Tokens & Accessibility Audit',
    secondary: 'Assigned to frontend-core · Updated 1 hour ago',
    trailing: 'In Review',
  },
  {
    id: 'db-backup',
    primary: 'Automated Daily Snapshot',
    secondary: 'Completed across primary and read replicas',
    trailing: '02:00 UTC',
  },
  {
    id: 'legacy-job',
    primary: 'Deprecated Webhook Worker',
    secondary: 'Scheduled for removal next sprint',
    trailing: 'Disabled',
    disabled: true,
  },
];

const ListDemo = (args: any) => {
  const itemsList: ListItem[] = args.items ?? sampleItems;
  const isDarkSurface = Boolean(args.__darkSurface);
  const [selected, setSelected] = useState<string | undefined>(
    args.selectedId ?? args.defaultSelectedId ?? 'deploy-prod'
  );

  useEffect(() => {
    if (args.selectedId !== undefined) {
      setSelected(args.selectedId);
    }
  }, [args.selectedId]);

  const darkDefaults = isDarkSurface
    ? {
        bgColor: args.bgColor ?? '#18181b',
        itemBgColor: args.itemBgColor ?? (args.variant === 'plain' ? '#202024' : undefined),
        activeBgColor: args.activeBgColor ?? '#27272a',
        hoverBgColor: args.hoverBgColor ?? '#222226',
        borderColor: args.borderColor ?? '#3f3f46',
        textColor: args.textColor ?? '#f4f4f5',
        mutedTextColor: args.mutedTextColor ?? '#a1a1aa',
      }
    : {};

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 pb-6">
      <List
        {...args}
        {...darkDefaults}
        items={itemsList}
        selectedId={args.selectable ? selected : args.selectedId}
        onSelect={(item) => {
          setSelected(item.id);
          args.onSelect?.(item);
        }}
      />

      {args.selectable && (
        <div
          style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
          className="text-xs"
        >
          Selected item:{' '}
          <span
            style={
              isDarkSurface
                ? { backgroundColor: '#27272a', color: '#f4f4f5' }
                : { backgroundColor: '#f3f4f6', color: '#111111' }
            }
            className="font-mono px-1.5 py-0.5 rounded"
          >
            {selected || 'none'}
          </span>
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  args: {
    items: sampleItems,
    as: 'ul',
    variant: 'bordered',
    size: 'medium',
    selectable: true,
    defaultSelectedId: 'deploy-prod',
    emptyText: 'No items found.',
  },
  render: (args) => <ListDemo {...args} />,
};

export const VariantsAndSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-7 w-full max-w-2xl pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Plain (Small)
        </span>
        <List items={sampleItems.slice(0, 3)} variant="plain" size="small" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Divided (Medium)
        </span>
        <List items={sampleItems.slice(0, 3)} variant="divided" size="medium" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Card (Large)
        </span>
        <List items={sampleItems.slice(0, 3)} variant="card" size="large" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Empty State
        </span>
        <List items={[]} variant="bordered" emptyText="No recent activity events." />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    items: sampleItems,
    as: 'ul',
    variant: 'bordered',
    size: 'medium',
    selectable: true,
    defaultSelectedId: 'pr-review',
    bgColor: '#ffffff',
    activeBgColor: '#eff6ff',
    hoverBgColor: '#f8faff',
    borderColor: '#bfdbfe',
    textColor: '#1e3a8a',
    mutedTextColor: '#2563eb',
  },
  render: (args) => <ListDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    items: sampleItems,
    as: 'ul',
    variant: 'bordered',
    size: 'medium',
    selectable: true,
    defaultSelectedId: 'deploy-prod',
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-2xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">List (Dark Context)</div>
      <ListDemo {...args} __darkSurface />
    </div>
  ),
};