import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SideNav, type SideNavGroup, type SideNavItem } from './SideNav';

const meta: Meta<typeof SideNav> = {
  title: 'Components/SideNav',
  component: SideNav,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    collapsed: { control: 'boolean' },
    defaultCollapsed: { control: 'boolean' },
    showCollapseToggle: { control: 'boolean' },
    width: { control: 'text' },
    collapsedWidth: { control: 'text' },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    hoverBg: { control: 'color' },
    activeBg: { control: 'color' },
    activeColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof SideNav>;

const sampleGroups: SideNavGroup[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: 'overview', label: 'Overview', badge: 'New' },
      {
        id: 'projects',
        label: 'Projects',
        badge: 4,
        children: [
          { id: 'design-system', label: 'Design System' },
          { id: 'api-gateway', label: 'API Gateway' },
          { id: 'release-logs', label: 'Release Logs' },
        ],
      },
      { id: 'team', label: 'Team Members' },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    collapsible: false,
    items: [
      { id: 'billing', label: 'Billing & Plans' },
      { id: 'settings', label: 'Settings' },
      { id: 'archived', label: 'Archived Items', disabled: true },
    ],
  },
];

const flatItems: SideNavItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'analytics', label: 'Analytics', badge: 'Live' },
  { id: 'reports', label: 'Reports' },
  { id: 'audit', label: 'Audit Trail' },
];

const SideNavDemo = (args: any) => {
  const [selectedId, setSelectedId] = useState<string>(args.activeId ?? 'design-system');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    args.collapsed !== undefined ? Boolean(args.collapsed) : Boolean(args.defaultCollapsed)
  );

  useEffect(() => {
    if (args.activeId !== undefined) {
      setSelectedId(args.activeId);
    }
  }, [args.activeId]);

  useEffect(() => {
    if (args.collapsed !== undefined) {
      setIsCollapsed(Boolean(args.collapsed));
    } else if (args.defaultCollapsed !== undefined) {
      setIsCollapsed(Boolean(args.defaultCollapsed));
    }
  }, [args.collapsed, args.defaultCollapsed]);

  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="flex min-h-[340px] w-full max-w-2xl overflow-hidden rounded-md border border-[#e5e5e5] dark:border-zinc-800">
        <SideNav
          {...args}
          activeId={selectedId}
          collapsed={isCollapsed}
          onCollapsedChange={(next) => {
            setIsCollapsed(next);
            args.onCollapsedChange?.(next);
          }}
          onSelect={(item) => {
            setSelectedId(item.id);
            args.onSelect?.(item);
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
          className="flex-1 p-5 bg-[#fafafa] dark:bg-zinc-900/40"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Active Route
          </div>
          <div className="mt-1 text-base font-semibold text-black dark:text-zinc-100">
            {selectedId}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    groups: sampleGroups,
    activeId: 'design-system',
    size: 'medium',
    showCollapseToggle: true,
    header: <span className="font-semibold tracking-tight truncate">Enterprise UI</span>,
    footer: <span className="text-xs text-zinc-500 truncate">v2.4.0</span>,
  },
  render: (args) => <SideNavDemo {...args} />,
};

export const FlatItems: Story = {
  args: {
    items: flatItems,
    activeId: 'analytics',
    size: 'medium',
  },
  render: (args) => <SideNavDemo {...args} />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <SideNav groups={sampleGroups} activeId="overview" size="small" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <SideNav groups={sampleGroups} activeId="projects" size="medium" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <SideNav groups={sampleGroups} activeId="team" size="large" />
      </div>
    </div>
  ),
};

export const CollapsedRail: Story = {
  args: {
    groups: sampleGroups,
    activeId: 'overview',
    collapsed: true,
    showCollapseToggle: true,
  },
  render: (args) => <SideNavDemo {...args} />,
};

export const CustomColorsDemo: Story = {
  args: {
    groups: sampleGroups,
    activeId: 'api-gateway',
    showCollapseToggle: true,
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    textColor: '#1e3a8a',
    hoverBg: '#dbeafe',
    activeBg: '#2563eb',
    activeColor: '#ffffff',
  },
  render: (args) => <SideNavDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    groups: sampleGroups,
    activeId: 'design-system',
    showCollapseToggle: true,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-6 rounded-md border border-zinc-800 w-full max-w-2xl">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Side Navigation (Dark Context)</div>
      <SideNavDemo {...args} />
    </div>
  ),
};