import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Popover, type PopoverPlacement } from './Popover';

const meta: Meta<typeof Popover> = {
  title: 'Building Blocks/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['bottom', 'top', 'left', 'right'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    showArrow: { control: 'boolean' },
    closeOnClickOutside: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    disabled: { control: 'boolean' },
    unmountOnExit: { control: 'boolean' },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    arrowColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

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

const PopoverDemo = (args: any) => {
  const isDarkSurface = Boolean(args.__darkSurface);
  const [isOpen, setIsOpen] = useState<boolean>(
    args.open !== undefined ? Boolean(args.open) : Boolean(args.defaultOpen ?? false)
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
        bgColor: args.bgColor ?? '#18181b',
        borderColor: args.borderColor ?? '#3f3f46',
        textColor: args.textColor ?? '#f4f4f5',
        arrowColor: args.arrowColor ?? '#18181b',
      }
    : {};

  return (
    <div className="w-full max-w-3xl flex flex-col gap-5 pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            style={{
              padding: '8px 16px',
              backgroundColor: isDarkSurface ? '#ffffff' : '#111111',
              color: isDarkSurface ? '#111111' : '#ffffff',
              border: 'none',
            }}
            className="text-xs font-medium rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          >
            {isOpen ? 'Close Popover' : 'Toggle Popover'}
          </button>
        </div>

        <span
          style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
          className="text-xs"
        >
          Placement: <span className="font-mono">{args.placement || 'bottom'}</span> · Size:{' '}
          <span className="font-mono">{args.size || 'medium'}</span>
        </span>
      </div>

      <div
        style={{
          minHeight: '300px',
          padding: '72px 48px',
          backgroundColor: isDarkSurface ? '#111113' : '#fafafa',
          borderColor: isDarkSurface ? '#27272a' : '#e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="w-full rounded-lg border"
      >
        <Popover
          {...args}
          {...darkDefaults}
          open={isOpen}
          onOpenChange={(next) => {
            setIsOpen(next);
            args.onOpenChange?.(next);
          }}
          trigger={<TriggerButton label="Open Popover" isDarkSurface={isDarkSurface} />}
        >
          <div className="flex flex-col gap-2.5">
            <div className="font-semibold text-xs sm:text-sm">Quick View Settings</div>
            <p
              style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
              className="text-xs leading-relaxed"
            >
              Interactive floating surface anchored to the trigger. Click outside or press Escape to dismiss.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: isDarkSurface ? '#ffffff' : '#111111',
                  color: isDarkSurface ? '#111111' : '#ffffff',
                  border: 'none',
                }}
                className="text-xs font-medium rounded-md cursor-pointer hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </Popover>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    placement: 'bottom',
    size: 'medium',
    defaultOpen: false,
    showArrow: true,
    closeOnClickOutside: true,
    closeOnEscape: true,
    disabled: false,
    unmountOnExit: false,
  },
  render: (args) => <PopoverDemo {...args} />,
};

export const PlacementsAndSizes: Story = {
  render: () => {
    const placements: PopoverPlacement[] = ['bottom', 'top', 'left', 'right'];

    return (
      <div className="flex flex-col gap-10 w-full max-w-3xl pb-10">
        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Placements (Click any trigger or use Controls)
          </span>
          <div
            style={{ padding: '72px 48px' }}
            className="flex items-center justify-center gap-6 flex-wrap rounded-lg border border-[#e5e5e5] bg-[#fafafa]"
          >
            {placements.map((pos) => (
              <Popover
                key={pos}
                placement={pos}
                size="small"
                defaultOpen={pos === 'bottom'}
                trigger={<TriggerButton label={`Placement: ${pos}`} />}
              >
                <div className="text-xs leading-relaxed">
                  Popover placed on <span className="font-mono">{pos}</span>.
                </div>
              </Popover>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Sizes
          </span>
          <div
            style={{ padding: '48px 32px' }}
            className="flex items-center gap-6 flex-wrap rounded-lg border border-[#e5e5e5] bg-[#fafafa]"
          >
            <Popover
              size="small"
              placement="bottom"
              trigger={<TriggerButton label="Small" />}
            >
              <div className="text-xs">Compact popover with comfortable padding.</div>
            </Popover>

            <Popover
              size="medium"
              placement="bottom"
              trigger={<TriggerButton label="Medium" />}
            >
              <div className="text-xs sm:text-sm">Standard popover for everyday actions and notes.</div>
            </Popover>

            <Popover
              size="large"
              placement="bottom"
              trigger={<TriggerButton label="Large" />}
            >
              <div className="text-sm">Wider popover with extra breathing room for richer blocks.</div>
            </Popover>
          </div>
        </div>
      </div>
    );
  },
};

export const CustomColorsDemo: Story = {
  args: {
    placement: 'bottom',
    size: 'medium',
    defaultOpen: false,
    showArrow: true,
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    textColor: '#1e3a8a',
    arrowColor: '#eff6ff',
  },
  render: (args) => <PopoverDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    placement: 'bottom',
    size: 'medium',
    defaultOpen: false,
    showArrow: true,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-3xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Popover (Dark Context)</div>
      <PopoverDemo {...args} __darkSurface />
    </div>
  ),
};