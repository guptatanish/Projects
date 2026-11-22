import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, type TabItem } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    defaultValue: { control: 'text' },
    variant: {
      control: 'select',
      options: ['underline', 'pills', 'enclosed'],
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    fullWidth: { control: 'boolean' },
    activeColor: { control: 'color' },
    inactiveColor: { control: 'color' },
    indicatorColor: { control: 'color' },
    hoverBg: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const sampleItems: TabItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    badge: 'New',
    content: (
      <div className="flex flex-col gap-2">
        <div className="font-semibold text-sm">Workspace Overview</div>
        <p className="text-xs text-[#666666] leading-relaxed">
          Track active services, deployment health, and team activity across your organization.
        </p>
      </div>
    ),
  },
  {
    id: 'members',
    label: 'Members',
    badge: 12,
    content: (
      <div className="flex flex-col gap-2">
        <div className="font-semibold text-sm">Team Members</div>
        <p className="text-xs text-[#666666] leading-relaxed">
          Manage roles, engineering permissions, and pending workspace invitations.
        </p>
      </div>
    ),
  },
  {
    id: 'billing',
    label: 'Billing',
    content: (
      <div className="flex flex-col gap-2">
        <div className="font-semibold text-sm">Plan & Invoices</div>
        <p className="text-xs text-[#666666] leading-relaxed">
          Review current subscription tier, usage limits, and downloadable billing statements.
        </p>
      </div>
    ),
  },
  {
    id: 'audit',
    label: 'Audit Log',
    disabled: true,
    content: (
      <div className="text-xs text-[#666666]">Audit logs are restricted on this plan.</div>
    ),
  },
];

const TabsDemo = (args: any) => {
  const itemsList: TabItem[] = args.items ?? sampleItems;
  const initial = args.value || args.defaultValue || itemsList[0]?.id || '';
  const [activeTab, setActiveTab] = useState<string>(initial);
  const isDarkSurface = Boolean(args.__darkSurface);

  useEffect(() => {
    const next = args.value || args.defaultValue;
    if (next && itemsList.some((it) => it.id === next)) {
      setActiveTab(next);
    }
  }, [args.value, args.defaultValue, itemsList]);

  const themedItems: TabItem[] = isDarkSurface
    ? itemsList.map((it) => ({
        ...it,
        content: (
          <div className="flex flex-col gap-2">
            <div style={{ color: '#f4f4f5' }} className="font-semibold text-sm">
              {it.label}
            </div>
            <p style={{ color: '#a1a1aa' }} className="text-xs leading-relaxed">
              Dark surface tab panel for <span className="font-mono">{it.id}</span> with clear contrast and spacing.
            </p>
          </div>
        ),
      }))
    : itemsList;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 pb-6">
      <div
        style={
          isDarkSurface
            ? { backgroundColor: '#18181b', borderColor: '#27272a', padding: '16px' }
            : { backgroundColor: '#ffffff', borderColor: '#e5e5e5', padding: '16px' }
        }
        className="rounded-md border"
      >
        <Tabs
          {...args}
          items={themedItems}
          value={activeTab}
          activeColor={args.activeColor ?? (isDarkSurface ? '#111111' : undefined)}
          inactiveColor={args.inactiveColor ?? (isDarkSurface ? '#a1a1aa' : undefined)}
          indicatorColor={args.indicatorColor ?? (isDarkSurface ? '#ffffff' : undefined)}
          borderColor={args.borderColor ?? (isDarkSurface ? '#27272a' : undefined)}
          textColor={args.textColor ?? (isDarkSurface ? '#e4e4e7' : undefined)}
          onChange={(nextId) => {
            setActiveTab(nextId);
            args.onChange?.(nextId);
          }}
        />
      </div>

      <div
        style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
        className="text-xs"
      >
        Active tab:{' '}
        <span
          style={
            isDarkSurface
              ? { backgroundColor: '#27272a', color: '#f4f4f5' }
              : { backgroundColor: '#f3f4f6', color: '#111111' }
          }
          className="font-mono px-1.5 py-0.5 rounded"
        >
          {activeTab}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    items: sampleItems,
    defaultValue: 'overview',
    variant: 'underline',
    orientation: 'horizontal',
    size: 'medium',
    fullWidth: false,
  },
  render: (args) => <TabsDemo {...args} />,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-full max-w-2xl pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Underline
        </span>
        <Tabs items={sampleItems} defaultValue="overview" variant="underline" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Pills
        </span>
        <Tabs items={sampleItems} defaultValue="members" variant="pills" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Enclosed
        </span>
        <Tabs items={sampleItems} defaultValue="billing" variant="enclosed" />
      </div>
    </div>
  ),
};

export const SizesAndVertical: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-full max-w-2xl pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <Tabs items={sampleItems} defaultValue="overview" size="small" variant="pills" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <Tabs items={sampleItems} defaultValue="overview" size="medium" variant="pills" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <Tabs items={sampleItems} defaultValue="overview" size="large" variant="pills" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Vertical Orientation
        </span>
        <Tabs items={sampleItems} defaultValue="overview" orientation="vertical" variant="underline" />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    items: sampleItems,
    defaultValue: 'members',
    variant: 'pills',
    activeColor: '#ffffff',
    inactiveColor: '#1e40af',
    indicatorColor: '#2563eb',
    hoverBg: '#eff6ff',
    textColor: '#1e3a8a',
  },
  render: (args) => <TabsDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    items: sampleItems,
    defaultValue: 'overview',
    variant: 'pills',
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-2xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Tabs (Dark Context)</div>
      <TabsDemo {...args} __darkSurface />
    </div>
  ),
};