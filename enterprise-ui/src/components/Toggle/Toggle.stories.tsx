import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
    label: { control: 'text' },
    description: { control: 'text' },
    labelPosition: {
      control: 'radio',
      options: ['right', 'left'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    checkedBgColor: { control: 'color' },
    uncheckedBgColor: { control: 'color' },
    thumbColor: { control: 'color' },
    borderColor: { control: 'color' },
    textColor: { control: 'color' },
    focusRingColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

const ToggleDemo = (args: any) => {
  const initial = args.checked !== undefined ? Boolean(args.checked) : Boolean(args.defaultChecked);
  const [isOn, setIsOn] = useState<boolean>(initial);
  const isDarkSurface = Boolean(args.__darkSurface);

  useEffect(() => {
    if (args.checked !== undefined) {
      setIsOn(Boolean(args.checked));
    } else if (args.defaultChecked !== undefined) {
      setIsOn(Boolean(args.defaultChecked));
    }
  }, [args.checked, args.defaultChecked]);

  return (
    <div className="w-full max-w-lg flex flex-col gap-4 pb-6">
      <Toggle
        {...args}
        checked={isOn}
        checkedBgColor={args.checkedBgColor ?? (isDarkSurface ? '#ffffff' : undefined)}
        uncheckedBgColor={args.uncheckedBgColor ?? (isDarkSurface ? '#3f3f46' : undefined)}
        thumbColor={args.thumbColor ?? (isDarkSurface ? '#111111' : undefined)}
        borderColor={args.borderColor ?? (isDarkSurface ? '#52525b' : undefined)}
        textColor={args.textColor ?? (isDarkSurface ? '#f4f4f5' : undefined)}
        focusRingColor={args.focusRingColor ?? (isDarkSurface ? '#ffffff' : undefined)}
        onChange={(next) => {
          setIsOn(next);
          args.onChange?.(next);
        }}
      />

      <div
        style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
        className="text-xs"
      >
        State:{' '}
        <span
          style={
            isDarkSurface
              ? { backgroundColor: '#27272a', color: '#f4f4f5' }
              : { backgroundColor: '#f3f4f6', color: '#111111' }
          }
          className="font-mono px-1.5 py-0.5 rounded"
        >
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    label: 'Email notifications',
    description: 'Receive alerts when pull requests or deployments need review.',
    defaultChecked: true,
    labelPosition: 'right',
    size: 'medium',
    disabled: false,
    readOnly: false,
  },
  render: (args) => <ToggleDemo {...args} />,
};

export const SizesAndPositions: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-lg pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <ToggleDemo label="Compact mode" description="Tighter table rows and spacing." size="small" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <ToggleDemo
          label="Auto-assign reviewers"
          description="Automatically assign code owners on new PRs."
          size="medium"
          defaultChecked
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <ToggleDemo
          label="Production maintenance mode"
          description="Pause non-critical background jobs during upgrades."
          size="large"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Left Label Position
        </span>
        <ToggleDemo
          label="Enable two-factor authentication"
          description="Require a verification code on sign-in."
          labelPosition="left"
          defaultChecked
        />
      </div>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-lg pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Read-Only</span>
        <ToggleDemo
          label="SSO enforcement"
          description="Managed by your organization security policy."
          checked
          readOnly
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Disabled</span>
        <ToggleDemo
          label="Beta telemetry"
          description="Unavailable for this workspace tier."
          defaultChecked={false}
          disabled
        />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    label: 'Custom accent toggle',
    description: 'Configured with custom active track, border, and focus ring colors.',
    defaultChecked: true,
    size: 'medium',
    checkedBgColor: '#2563eb',
    uncheckedBgColor: '#dbeafe',
    thumbColor: '#ffffff',
    borderColor: '#93c5fd',
    textColor: '#1e3a8a',
    focusRingColor: '#2563eb',
  },
  render: (args) => <ToggleDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    label: 'Dark surface toggle',
    description: 'High-contrast switch and helper text in dark context.',
    defaultChecked: true,
    size: 'medium',
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-lg"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Toggle (Dark Context)</div>
      <ToggleDemo {...args} __darkSurface />
    </div>
  ),
};