import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['rectangle', 'circle', 'text'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    loading: { control: 'boolean' },
    width: { control: 'text' },
    height: { control: 'text' },
    radius: { control: 'text' },
    lines: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    lastLineWidth: { control: 'text' },
    animation: {
      control: 'radio',
      options: ['pulse', 'wave', 'none'],
    },
    baseColor: { control: 'color' },
    highlightColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    variant: 'rectangle',
    size: 'medium',
    loading: true,
    width: '100%',
    height: 96,
    lines: 1,
    animation: 'pulse',
  },
  render: (args) => (
    <div className="w-full max-w-md pb-6">
      <Skeleton {...args} />
    </div>
  ),
};

export const TenSecondPageLoad: Story = {
  render: () => {
    const [secondsLeft, setSecondsLeft] = useState<number>(10);
    const isLoading = secondsLeft > 0;

    useEffect(() => {
      if (secondsLeft <= 0) return;
      const timer = window.setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => window.clearInterval(timer);
    }, [secondsLeft]);

    const restartDemo = () => setSecondsLeft(10);

    const tableRows = [
      { id: 'ORD-1042', customer: 'Aarav Nair', status: 'Completed', amount: '₹14,200' },
      { id: 'ORD-1043', customer: 'Meera Krishnan', status: 'Pending', amount: '₹8,750' },
      { id: 'ORD-1044', customer: 'Rohan Deshmukh', status: 'Completed', amount: '₹22,400' },
      { id: 'ORD-1045', customer: 'Ananya Verma', status: 'Processing', amount: '₹5,900' },
    ];

    return (
      <div className="w-full max-w-3xl flex flex-col gap-5 pb-8">
        <div className="flex items-center justify-between gap-3 rounded-md border border-[#e5e5e5] dark:border-zinc-800 px-4 py-2.5 bg-[#fafafa] dark:bg-zinc-900/50">
          <div className="text-xs font-medium text-[#555555] dark:text-zinc-300">
            {isLoading
              ? `Loading page data... revealing content in ${secondsLeft}s`
              : 'Page loaded'}
          </div>
          <button
            type="button"
            onClick={restartDemo}
            className="px-3 py-1 text-xs font-medium rounded-md border border-[#d4d4d4] dark:border-zinc-700 bg-white dark:bg-zinc-950 text-black dark:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            Replay 10s Load
          </button>
        </div>

        <div className="rounded-lg border border-[#e5e5e5] dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 flex flex-col gap-6">
          {/* Page Title & Profile Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <Skeleton loading={isLoading} variant="circle" width={48} height={48} animation="wave">
                <div className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-semibold shrink-0">
                  AN
                </div>
              </Skeleton>

              <div className="flex-1 min-w-0">
                <Skeleton loading={isLoading} variant="text" height={22} width="45%" animation="wave">
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-100 truncate">
                    Workspace Operations Dashboard
                  </h2>
                </Skeleton>
                <div className="mt-1.5">
                  <Skeleton loading={isLoading} variant="text" height={14} width="65%" animation="wave">
                    <p className="text-xs text-[#666666] dark:text-zinc-400">
                      Real-time summary of orders, throughput, and recent activity.
                    </p>
                  </Skeleton>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards (Rectangular) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Orders', value: '1,284' },
              { label: 'Active Users', value: '342' },
              { label: 'Revenue', value: '₹4,82,900' },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-md border border-[#e5e5e5] dark:border-zinc-800 p-3.5"
              >
                <Skeleton loading={isLoading} variant="rectangle" height={64} animation="wave">
                  <div className="text-xs font-medium text-[#666666] dark:text-zinc-400">
                    {card.label}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-black dark:text-zinc-100">
                    {card.value}
                  </div>
                </Skeleton>
              </div>
            ))}
          </div>

          {/* Table Section */}
          <div className="flex flex-col gap-2">
            <Skeleton loading={isLoading} variant="text" height={16} width="160px" animation="wave">
              <div className="text-sm font-semibold text-black dark:text-zinc-100">
                Recent Orders
              </div>
            </Skeleton>

            {isLoading ? (
              <div className="flex flex-col gap-2.5 pt-1">
                <Skeleton loading variant="rectangle" height={34} animation="wave" />
                <Skeleton loading variant="text" lines={4} lastLineWidth="85%" animation="wave" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-[#e5e5e5] dark:border-zinc-800">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e5e5] dark:border-zinc-800 bg-[#fafafa] dark:bg-zinc-900/60">
                      <th className="py-2 px-3 font-medium text-[#555555] dark:text-zinc-400">Order ID</th>
                      <th className="py-2 px-3 font-medium text-[#555555] dark:text-zinc-400">Customer</th>
                      <th className="py-2 px-3 font-medium text-[#555555] dark:text-zinc-400">Status</th>
                      <th className="py-2 px-3 font-medium text-[#555555] dark:text-zinc-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b last:border-b-0 border-[#e5e5e5] dark:border-zinc-800"
                      >
                        <td className="py-2 px-3 font-mono text-xs text-black dark:text-zinc-100">{row.id}</td>
                        <td className="py-2 px-3 text-black dark:text-zinc-100">{row.customer}</td>
                        <td className="py-2 px-3 text-[#555555] dark:text-zinc-300">{row.status}</td>
                        <td className="py-2 px-3 font-medium text-black dark:text-zinc-100">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Text Block (Multi-line)
        </span>
        <Skeleton variant="text" lines={3} lastLineWidth="65%" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Circle & Text Placeholder
        </span>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" width={44} height={44} />
          <div className="flex-1">
            <Skeleton variant="text" lines={2} lastLineWidth="75%" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Rectangle
        </span>
        <Skeleton variant="rectangle" width="100%" height={100} />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" size="small" />
          <div className="flex-1">
            <Skeleton variant="text" size="small" lines={2} lastLineWidth="60%" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" size="medium" />
          <div className="flex-1">
            <Skeleton variant="text" size="medium" lines={2} lastLineWidth="60%" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" size="large" />
          <div className="flex-1">
            <Skeleton variant="text" size="large" lines={2} lastLineWidth="60%" />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Animations: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-full max-w-md pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pulse</span>
        <Skeleton variant="rectangle" height={48} animation="pulse" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Wave</span>
        <Skeleton variant="rectangle" height={48} animation="wave" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">None</span>
        <Skeleton variant="rectangle" height={48} animation="none" />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    variant: 'rectangle',
    width: '100%',
    height: 96,
    lines: 2,
    lastLineWidth: '70%',
    animation: 'wave',
    baseColor: '#dbeafe',
    highlightColor: 'rgba(37, 99, 235, 0.28)',
  },
  render: (args) => (
    <div className="w-full max-w-md pb-6">
      <Skeleton {...args} />
    </div>
  ),
};

export const DarkModeDocs: Story = {
  args: {
    variant: 'text',
    lines: 3,
    lastLineWidth: '65%',
    animation: 'pulse',
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-6 rounded-md border border-zinc-800 w-full max-w-md">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Skeleton (Dark Context)</div>
      <Skeleton {...args} />
    </div>
  ),
};