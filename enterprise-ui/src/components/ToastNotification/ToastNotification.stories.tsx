import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ToastNotification, type ToastPosition } from './ToastNotification';

const meta: Meta<typeof ToastNotification> = {
  title: 'Components/ToastNotification',
  component: ToastNotification,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    position: {
      control: 'select',
      options: [
        'top-right',
        'top-left',
        'bottom-right',
        'bottom-left',
        'top-center',
        'bottom-center',
      ],
    },
    duration: { control: { type: 'number', min: 0, max: 15000, step: 500 } },
    open: { control: 'boolean' },
    closable: { control: 'boolean' },
    actionLabel: { control: 'text' },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    iconColor: { control: 'color' },
    accentColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof ToastNotification>;

const getPlacementStyle = (pos: ToastPosition): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: 'absolute',
    padding: '16px',
    display: 'flex',
    maxWidth: '100%',
    width: '100%',
  };

  switch (pos) {
    case 'top-left':
      return { ...base, top: 0, left: 0, justifyContent: 'flex-start', alignItems: 'flex-start' };
    case 'top-center':
      return { ...base, top: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'flex-start' };
    case 'top-right':
      return { ...base, top: 0, right: 0, justifyContent: 'flex-end', alignItems: 'flex-start' };
    case 'bottom-left':
      return { ...base, bottom: 0, left: 0, justifyContent: 'flex-start', alignItems: 'flex-end' };
    case 'bottom-center':
      return { ...base, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'flex-end' };
    case 'bottom-right':
    default:
      return { ...base, bottom: 0, right: 0, justifyContent: 'flex-end', alignItems: 'flex-end' };
  }
};

const ToastDemo = (args: any) => {
  const isDarkSurface = Boolean(args.__darkSurface);
  const resolvedPos: ToastPosition = args.position || 'bottom-right';
  const [isOpen, setIsOpen] = useState<boolean>(args.open ?? true);
  const [actionCount, setActionCount] = useState<number>(0);

  useEffect(() => {
    if (args.open !== undefined) {
      setIsOpen(Boolean(args.open));
    }
  }, [args.open]);

  const darkDefaults = isDarkSurface
    ? {
        bgColor: args.bgColor ?? '#18181b',
        borderColor: args.borderColor ?? '#3f3f46',
        textColor: args.textColor ?? '#f4f4f5',
        iconColor: args.iconColor ?? '#e4e4e7',
        accentColor: args.accentColor ?? '#ffffff',
      }
    : {};

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4 pb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
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
          Show Toast
        </button>

        <span
          style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
          className="text-xs"
        >
          Position: <span className="font-mono">{resolvedPos}</span>
          {actionCount > 0 ? ` · Actions clicked: ${actionCount}` : ''}
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          minHeight: '240px',
          backgroundColor: isDarkSurface ? '#111113' : '#f8f8f8',
          borderColor: isDarkSurface ? '#27272a' : '#e5e5e5',
        }}
        className="w-full rounded-lg border overflow-hidden"
      >
        {isOpen ? (
          <div style={getPlacementStyle(resolvedPos)}>
            <ToastNotification
              {...args}
              {...darkDefaults}
              position={resolvedPos}
              open={isOpen}
              onClose={() => {
                setIsOpen(false);
                args.onClose?.();
              }}
              onAction={() => {
                setActionCount((c) => c + 1);
                args.onAction?.();
              }}
            />
          </div>
        ) : (
          <div
            style={{ color: isDarkSurface ? '#a1a1aa' : '#666666', padding: '24px' }}
            className="text-xs"
          >
            Toast dismissed. Click &ldquo;Show Toast&rdquo; to display it again.
          </div>
        )}
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    title: 'Changes saved',
    description: 'Your workspace preferences have been updated.',
    variant: 'default',
    size: 'medium',
    position: 'bottom-right',
    duration: 0,
    open: true,
    closable: true,
    actionLabel: 'Undo',
  },
  render: (args) => <ToastDemo {...args} />,
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-lg pb-6">
      <ToastNotification
        title="Default Notification"
        description="Standard neutral notification for general updates."
        variant="default"
        duration={0}
        onClose={() => {}}
      />
      <ToastNotification
        title="New Release Available"
        description="Version 2.4 includes faster builds and improved keyboard shortcuts."
        variant="info"
        duration={0}
        onClose={() => {}}
      />
      <ToastNotification
        title="Deployment Succeeded"
        description="Production build is live across all regions."
        variant="success"
        actionLabel="View Logs"
        onAction={() => {}}
        duration={0}
        onClose={() => {}}
      />
      <ToastNotification
        title="API Rate Limit Approaching"
        description="You have used 85% of your hourly request quota."
        variant="warning"
        duration={0}
        onClose={() => {}}
      />
      <ToastNotification
        title="Failed to Sync Repository"
        description="Authentication token expired. Reconnect to continue syncing."
        variant="error"
        actionLabel="Retry"
        onAction={() => {}}
        duration={0}
        onClose={() => {}}
      />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-full max-w-lg pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <ToastNotification
          title="Copied to clipboard"
          description="Shareable link ready."
          size="small"
          variant="success"
          duration={0}
          onClose={() => {}}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <ToastNotification
          title="Settings Updated"
          description="Notification rules now apply to all projects."
          size="medium"
          variant="info"
          duration={0}
          onClose={() => {}}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <ToastNotification
          title="Backup Completed"
          description="Full database snapshot saved cleanly with zero errors."
          size="large"
          variant="success"
          actionLabel="Details"
          onAction={() => {}}
          duration={0}
          onClose={() => {}}
        />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    title: 'Custom Brand Toast',
    description: 'Configured with custom surface, border, and action accent colors.',
    variant: 'default',
    size: 'medium',
    position: 'top-right',
    duration: 0,
    open: true,
    closable: true,
    actionLabel: 'Explore',
    bgColor: '#eef2ff',
    borderColor: '#a5b4fc',
    textColor: '#1e1b4b',
    iconColor: '#4338ca',
    accentColor: '#3730a3',
  },
  render: (args) => <ToastDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    title: 'Session Saved',
    description: 'Draft changes synced cleanly in dark mode.',
    variant: 'default',
    size: 'medium',
    position: 'bottom-right',
    duration: 0,
    open: true,
    closable: true,
    actionLabel: 'Review',
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-2xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Toast Notification (Dark Context)</div>
      <ToastDemo {...args} __darkSurface />
    </div>
  ),
};