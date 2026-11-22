import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Collapsible } from './Collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'Building Blocks/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['ghost', 'bordered', 'card'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    chevronPosition: {
      control: 'radio',
      options: ['right', 'left'],
    },
    showChevron: { control: 'boolean' },
    disabled: { control: 'boolean' },
    unmountOnExit: { control: 'boolean' },
    bgColor: { control: 'color' },
    headerBgColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    mutedTextColor: { control: 'color' },
    hoverBgColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

const CollapsibleDemo = (args: any) => {
  const isDarkSurface = Boolean(args.__darkSurface);
  const initial = args.open !== undefined ? Boolean(args.open) : Boolean(args.defaultOpen ?? true);
  const [isOpen, setIsOpen] = useState<boolean>(initial);

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
        headerBgColor: args.headerBgColor ?? '#202024',
        borderColor: args.borderColor ?? '#3f3f46',
        textColor: args.textColor ?? '#f4f4f5',
        mutedTextColor: args.mutedTextColor ?? '#a1a1aa',
        hoverBgColor: args.hoverBgColor ?? '#27272a',
      }
    : {};

  return (
    <div className="w-full max-w-xl flex flex-col gap-4 pb-6">
      <Collapsible
        {...args}
        {...darkDefaults}
        open={isOpen}
        onOpenChange={(next) => {
          setIsOpen(next);
          args.onOpenChange?.(next);
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="font-medium text-xs sm:text-sm">Environment &amp; Runtime Details</div>
          <p
            style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
            className="text-xs leading-relaxed"
          >
            Composable disclosure panel for building blocks such as advanced filters, release metadata, or nested form groups.
          </p>
        </div>
      </Collapsible>

      <div
        style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
        className="text-xs"
      >
        Expanded:{' '}
        <span
          style={
            isDarkSurface
              ? { backgroundColor: '#27272a', color: '#f4f4f5' }
              : { backgroundColor: '#f3f4f6', color: '#111111' }
          }
          className="font-mono px-1.5 py-0.5 rounded"
        >
          {isOpen ? 'true' : 'false'}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    title: 'Advanced Configuration',
    description: 'Optional headers, caching rules, and timeout overrides.',
    defaultOpen: true,
    variant: 'bordered',
    size: 'medium',
    chevronPosition: 'right',
    showChevron: true,
    disabled: false,
    unmountOnExit: false,
  },
  render: (args) => <CollapsibleDemo {...args} />,
};

export const VariantsAndChevron: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-xl pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Bordered</span>
        <Collapsible
          title="Bordered Section"
          description="Clean outline with divider between header and content"
          defaultOpen
          variant="bordered"
        >
          <p className="text-xs text-[#666666] leading-relaxed">
            Bordered collapsible content with generous padding.
          </p>
        </Collapsible>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Card</span>
        <Collapsible
          title="Card Section"
          description="Subtle surface header with elevated card container"
          defaultOpen
          variant="card"
        >
          <p className="text-xs text-[#666666] leading-relaxed">
            Card collapsible content suited for grouped settings blocks.
          </p>
        </Collapsible>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Ghost &amp; Left Chevron
        </span>
        <Collapsible
          title="Left Chevron Disclosure"
          description="Minimal ghost style with indicator on the left"
          defaultOpen
          variant="ghost"
          chevronPosition="left"
        >
          <p className="text-xs text-[#666666] leading-relaxed">
            Ghost collapsible content with zero outer box border.
          </p>
        </Collapsible>
      </div>
    </div>
  ),
};

export const SizesAndDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-xl pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <Collapsible title="Compact Details" size="small" defaultOpen>
          <p className="text-xs text-[#666666]">Small size disclosure body.</p>
        </Collapsible>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <Collapsible title="Standard Details" size="medium" defaultOpen>
          <p className="text-xs text-[#666666]">Medium size disclosure body.</p>
        </Collapsible>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <Collapsible title="Spacious Details" size="large" defaultOpen>
          <p className="text-xs text-[#666666]">Large size disclosure body.</p>
        </Collapsible>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Disabled</span>
        <Collapsible
          title="Locked Section"
          description="Cannot be expanded in current state"
          disabled
        >
          <p className="text-xs text-[#666666]">Hidden content.</p>
        </Collapsible>
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    title: 'Custom Brand Collapsible',
    description: 'Configured with custom header, surface, border, and hover colors.',
    defaultOpen: true,
    variant: 'card',
    size: 'medium',
    bgColor: '#f8faff',
    headerBgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    textColor: '#1e3a8a',
    mutedTextColor: '#1d4ed8',
    hoverBgColor: '#dbeafe',
  },
  render: (args) => <CollapsibleDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    title: 'Dark Mode Section',
    description: 'High-contrast disclosure block on a dark surface.',
    defaultOpen: true,
    variant: 'bordered',
    size: 'medium',
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Collapsible (Dark Context)</div>
      <CollapsibleDemo {...args} __darkSurface />
    </div>
  ),
};