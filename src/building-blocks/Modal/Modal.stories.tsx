import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal, type ModalSize } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Building Blocks/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    open: { control: 'boolean' },
    defaultOpen: { control: 'boolean' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xlarge'],
    },
    centered: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    closeOnBackdropClick: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    unmountOnExit: { control: 'boolean' },
    contained: { control: 'boolean' },
    bgColor: { control: 'color' },
    headerBgColor: { control: 'color' },
    footerBgColor: { control: 'color' },
    backdropColor: { control: 'text' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    mutedTextColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalDemo = (args: any) => {
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
        headerBgColor: args.headerBgColor ?? '#1f1f23',
        footerBgColor: args.footerBgColor ?? '#1f1f23',
        borderColor: args.borderColor ?? '#3f3f46',
        textColor: args.textColor ?? '#f4f4f5',
        mutedTextColor: args.mutedTextColor ?? '#a1a1aa',
        backdropColor: args.backdropColor ?? 'rgba(0, 0, 0, 0.65)',
      }
    : {};

  const isContained = args.contained !== undefined ? Boolean(args.contained) : true;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-4 pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: isDarkSurface ? '#ffffff' : '#111111',
              color: isDarkSurface ? '#111111' : '#ffffff',
              border: 'none',
            }}
            className="text-xs font-medium rounded-md cursor-pointer hover:opacity-90 transition-opacity"
          >
            Open Modal
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              padding: '8px 14px',
              backgroundColor: 'transparent',
              border: `1px solid ${isDarkSurface ? '#3f3f46' : '#d4d4d4'}`,
              color: isDarkSurface ? '#e4e4e7' : '#111111',
            }}
            className="text-xs font-medium rounded-md cursor-pointer hover:opacity-85 transition-opacity"
          >
            Close Modal
          </button>
        </div>

        <span
          style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
          className="text-xs"
        >
          Size: <span className="font-mono">{args.size || 'medium'}</span> · Centered:{' '}
          <span className="font-mono">{String(args.centered ?? true)}</span>
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          minHeight: '440px',
          padding: '24px',
          backgroundColor: isDarkSurface ? '#111113' : '#f8f8f8',
          borderColor: isDarkSurface ? '#27272a' : '#e5e5e5',
        }}
        className="w-full rounded-lg border overflow-hidden"
      >
        <div
          style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
          className="text-xs flex flex-col gap-2 max-w-xs"
        >
          <div className="font-semibold" style={{ color: isDarkSurface ? '#f4f4f5' : '#111111' }}>
            Preview Stage
          </div>
          <p className="leading-relaxed">
            Click &ldquo;Open Modal&rdquo; to inspect dialog sizing, vertical centering, header/body/footer slots, and dismissal behavior.
          </p>
        </div>

        <Modal
          {...args}
          {...darkDefaults}
          contained={isContained}
          open={isOpen}
          onOpenChange={(next) => {
            setIsOpen(next);
            args.onOpenChange?.(next);
          }}
          footer={
            args.footer ?? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '7px 14px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${isDarkSurface ? '#3f3f46' : '#d4d4d4'}`,
                    color: isDarkSurface ? '#e4e4e7' : '#111111',
                  }}
                  className="text-xs font-medium rounded-md cursor-pointer hover:opacity-85"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '7px 16px',
                    backgroundColor: isDarkSurface ? '#ffffff' : '#111111',
                    border: 'none',
                    color: isDarkSurface ? '#111111' : '#ffffff',
                  }}
                  className="text-xs font-medium rounded-md cursor-pointer hover:opacity-90"
                >
                  Confirm
                </button>
              </div>
            )
          }
        >
          <div className="flex flex-col gap-3">
            <p
              style={{ color: isDarkSurface ? '#e4e4e7' : '#222222' }}
              className="text-xs sm:text-sm leading-relaxed"
            >
              This modal building block provides a clean dialog surface with scrollable body content and structured header/footer slots.
            </p>
            <p
              style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
              className="text-xs leading-relaxed"
            >
              Press <span className="font-mono">Escape</span> or click the backdrop to dismiss when enabled.
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    title: 'Publish Release Notes',
    description: 'Confirm changes before notifying workspace members.',
    defaultOpen: false,
    size: 'medium',
    centered: true,
    showCloseButton: true,
    closeOnBackdropClick: true,
    closeOnEscape: true,
    unmountOnExit: false,
    contained: true,
  },
  render: (args) => <ModalDemo {...args} />,
};

export const SizesAndAlignment: Story = {
  render: () => {
    const sizes: ModalSize[] = ['small', 'medium', 'large', 'xlarge'];

    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl pb-10">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Sizes
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            {sizes.map((sz) => (
              <ModalDemo
                key={sz}
                title={`Modal (${sz})`}
                description="Responsive width and generous padding."
                size={sz}
                centered
                contained
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Top-Aligned
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <ModalDemo
              title="Top-Aligned Modal"
              description="Positioned near the top of the overlay stage."
              size="medium"
              centered={false}
              contained
            />
          </div>
        </div>
      </div>
    );
  },
};

export const CustomColorsDemo: Story = {
  args: {
    title: 'Custom Brand Modal',
    description: 'Configured with custom surface, header, footer, and border colors.',
    defaultOpen: false,
    size: 'medium',
    centered: true,
    contained: true,
    bgColor: '#ffffff',
    headerBgColor: '#eff6ff',
    footerBgColor: '#f8faff',
    borderColor: '#bfdbfe',
    textColor: '#1e3a8a',
    mutedTextColor: '#1d4ed8',
  },
  render: (args) => <ModalDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    title: 'Dark Mode Dialog',
    description: 'High-contrast modal surface in dark context.',
    defaultOpen: false,
    size: 'medium',
    centered: true,
    contained: true,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-3xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Modal (Dark Context)</div>
      <ModalDemo {...args} __darkSurface />
    </div>
  ),
};