import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Building Blocks/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
    variant: {
      control: 'select',
      options: ['solid', 'dashed', 'dotted'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    label: { control: 'text' },
    labelAlign: {
      control: 'radio',
      options: ['left', 'center', 'right'],
    },
    labelGap: { control: { type: 'number', min: 0, max: 48, step: 2 } },
    thickness: { control: { type: 'number', min: 1, max: 8, step: 1 } },
    color: { control: 'color' },
    labelColor: { control: 'color' },
    labelBgColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  args: {
    orientation: 'horizontal',
    variant: 'solid',
    size: 'medium',
    label: 'OR',
    labelAlign: 'center',
    labelGap: 8,
  },
  render: (args) => {
    const isVertical = args.orientation === 'vertical';
    return (
      <div
        className={
          isVertical
            ? 'w-full max-w-xl flex flex-row items-center flex-wrap pb-6'
            : 'w-full max-w-xl flex flex-col gap-2 pb-6'
        }
      >
        <div className="text-xs text-[#666666]">Continue with email or SSO</div>
        <Divider {...args} />
        <div className="text-xs text-[#666666]">Sign in using an access token</div>
      </div>
    );
  },
};

export const VariantsAndLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-xl pb-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Solid (Left Label)
        </span>
        <Divider variant="solid" label="General" labelAlign="left" labelGap={8} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Dashed (Center Label)
        </span>
        <Divider variant="dashed" label="Optional Details" labelAlign="center" labelGap={8} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Dotted (Right Label)
        </span>
        <Divider variant="dotted" label="End of Section" labelAlign="right" labelGap={8} />
      </div>
    </div>
  ),
};

export const SizesAndVertical: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-full max-w-xl pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <Divider size="small" label="Small" labelGap={6} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <Divider size="medium" label="Medium" labelGap={8} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <Divider size="large" label="Large" labelGap={10} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Vertical Orientation
        </span>
        <div
          style={{ padding: '12px 16px' }}
          className="inline-flex items-center flex-wrap rounded-md border border-[#e5e5e5] w-fit"
        >
          <span className="text-xs font-medium">Overview</span>
          <Divider orientation="vertical" size="medium" />
          <span className="text-xs font-medium">Activity</span>
          <Divider orientation="vertical" variant="dashed" size="medium" />
          <span className="text-xs font-medium">Settings</span>
        </div>
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    orientation: 'horizontal',
    variant: 'solid',
    size: 'medium',
    label: 'Section Break',
    labelAlign: 'center',
    labelGap: 8,
    thickness: 2,
    color: '#93c5fd',
    labelColor: '#1e3a8a',
    labelBgColor: '#eff6ff',
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#f8faff', padding: '20px', borderColor: '#dbeafe' }}
      className="w-full max-w-xl rounded-lg border pb-6"
    >
      <div style={{ color: '#1e3a8a' }} className="text-xs font-medium">
        Custom styled section above
      </div>
      <Divider {...args} />
      <div style={{ color: '#1d4ed8' }} className="text-xs font-medium">
        Custom styled section below
      </div>
    </div>
  ),
};

export const DarkModeDocs: Story = {
  args: {
    orientation: 'horizontal',
    variant: 'solid',
    size: 'medium',
    label: 'Dark Context',
    labelAlign: 'center',
    labelGap: 8,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-3">Divider (Dark Context)</div>
      <div style={{ color: '#f4f4f5' }} className="text-xs">
        Above separator on dark surface
      </div>
      <Divider
        {...args}
        color={args.color ?? '#3f3f46'}
        labelColor={args.labelColor ?? '#a1a1aa'}
        labelBgColor={args.labelBgColor ?? '#09090b'}
      />
      <div style={{ color: '#a1a1aa' }} className="text-xs">
        Below separator on dark surface
      </div>
    </div>
  ),
};