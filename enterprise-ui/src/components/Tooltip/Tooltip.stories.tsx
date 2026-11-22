import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip, type TooltipPlacement } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    openDelay: { control: { type: 'number', min: 0, max: 1500, step: 50 } },
    closeDelay: { control: { type: 'number', min: 0, max: 1500, step: 50 } },
    showArrow: { control: 'boolean' },
    disabled: { control: 'boolean' },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    arrowColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

const TriggerButton = ({
  label,
  isDarkSurface = false,
}: {
  label: string;
  isDarkSurface?: boolean;
}) => (
  <button
    type="button"
    style={{
      padding: '8px 16px',
      backgroundColor: isDarkSurface ? '#27272a' : '#ffffff',
      border: `1px solid ${isDarkSurface ? '#3f3f46' : '#d4d4d4'}`,
      color: isDarkSurface ? '#f4f4f5' : '#111111',
    }}
    className="text-xs font-medium rounded-md cursor-pointer hover:opacity-90 transition-opacity"
  >
    {label}
  </button>
);

const TooltipDemo = (args: any) => {
  const isDarkSurface = Boolean(args.__darkSurface);
  const [isOpen, setIsOpen] = useState<boolean>(
    args.open !== undefined ? Boolean(args.open) : Boolean(args.defaultOpen)
  );

  useEffect(() => {
    if (args.open !== undefined) {
      setIsOpen(Boolean(args.open));
    } else if (args.defaultOpen !== undefined) {
      setIsOpen(Boolean(args.defaultOpen));
    }
  }, [args.open, args.defaultOpen]);

  const darkDefaults = isDarkSurface
    ? {
        bgColor: args.bgColor ?? '#f4f4f5',
        borderColor: args.borderColor ?? '#e4e4e7',
        textColor: args.textColor ?? '#111111',
        arrowColor: args.arrowColor ?? '#f4f4f5',
      }
    : {};

  return (
    <div className="w-full max-w-2xl flex flex-col gap-5 pb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            padding: '7px 14px',
            backgroundColor: isDarkSurface ? '#ffffff' : '#111111',
            color: isDarkSurface ? '#111111' : '#ffffff',
            border: 'none',
          }}
          className="text-xs font-medium rounded-md cursor-pointer hover:opacity-90 transition-opacity"
        >
          {isOpen ? 'Hide Tooltip' : 'Show Tooltip'}
        </button>

        <span
          style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
          className="text-xs"
        >
          Placement: <span className="font-mono">{args.placement || 'top'}</span> · Hover, focus, or toggle
        </span>
      </div>

      <div
        style={{
          padding: '64px 48px',
          backgroundColor: isDarkSurface ? '#111113' : '#fafafa',
          borderColor: isDarkSurface ? '#27272a' : '#e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="w-full rounded-lg border"
      >
        <Tooltip
          {...args}
          {...darkDefaults}
          open={isOpen}
          onOpenChange={(next) => {
            setIsOpen(next);
            args.onOpenChange?.(next);
          }}
        >
          <TriggerButton label="Hover or Focus Me" isDarkSurface={isDarkSurface} />
        </Tooltip>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    content: 'Saves your current workspace layout and filters.',
    placement: 'top',
    size: 'medium',
    defaultOpen: true,
    openDelay: 150,
    closeDelay: 100,
    showArrow: true,
    disabled: false,
  },
  render: (args) => <TooltipDemo {...args} />,
};

export const Placements: Story = {
  render: () => {
    const placements: TooltipPlacement[] = ['top', 'bottom', 'left', 'right'];
    return (
      <div
        style={{ padding: '56px 40px' }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-14 w-full max-w-2xl pb-6 place-items-center"
      >
        {placements.map((pos) => (
          <Tooltip
            key={pos}
            content={`Tooltip on ${pos}`}
            placement={pos}
            defaultOpen
            openDelay={0}
            closeDelay={0}
          >
            <TriggerButton label={`Placement: ${pos}`} />
          </Tooltip>
        ))}
      </div>
    );
  },
};

export const SizesAndStates: Story = {
  render: () => (
    <div
      style={{ padding: '48px 32px' }}
      className="flex flex-col gap-12 w-full max-w-2xl pb-6"
    >
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <div>
          <Tooltip content="Small tooltip hint" size="small" placement="right" defaultOpen openDelay={0}>
            <TriggerButton label="Small Tooltip" />
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <div>
          <Tooltip content="Medium tooltip with clear spacing" size="medium" placement="right" defaultOpen openDelay={0}>
            <TriggerButton label="Medium Tooltip" />
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <div>
          <Tooltip content="Large tooltip for detailed context" size="large" placement="right" defaultOpen openDelay={0}>
            <TriggerButton label="Large Tooltip" />
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Without Arrow &amp; Disabled
        </span>
        <div className="flex items-center gap-6 flex-wrap">
          <Tooltip content="Arrow hidden" showArrow={false} placement="top" defaultOpen openDelay={0}>
            <TriggerButton label="No Arrow" />
          </Tooltip>
          <Tooltip content="Should not appear" disabled placement="top" openDelay={0}>
            <TriggerButton label="Disabled Tooltip" />
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    content: 'Custom indigo tooltip with matching arrow and border.',
    placement: 'top',
    size: 'medium',
    defaultOpen: true,
    openDelay: 0,
    closeDelay: 0,
    showArrow: true,
    bgColor: '#2563eb',
    borderColor: '#1d4ed8',
    textColor: '#ffffff',
    arrowColor: '#2563eb',
  },
  render: (args) => <TooltipDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    content: 'High-contrast tooltip on dark surface.',
    placement: 'top',
    size: 'medium',
    defaultOpen: true,
    openDelay: 0,
    closeDelay: 0,
    showArrow: true,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-2xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Tooltip (Dark Context)</div>
      <TooltipDemo {...args} __darkSurface />
    </div>
  ),
};