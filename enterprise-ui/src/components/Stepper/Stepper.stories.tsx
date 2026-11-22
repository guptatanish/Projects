import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stepper, type StepperItem } from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'Components/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  argTypes: {
    activeStep: { control: { type: 'number', min: 0, max: 3, step: 1 } },
    defaultStep: { control: { type: 'number', min: 0, max: 3, step: 1 } },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    clickable: { control: 'boolean' },
    showStepNumbers: { control: 'boolean' },
    activeColor: { control: 'color' },
    completedColor: { control: 'color' },
    inactiveColor: { control: 'color' },
    errorColor: { control: 'color' },
    textColor: { control: 'color' },
    connectorColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const sampleSteps: StepperItem[] = [
  { id: 'account', title: 'Account', description: 'Basic profile details' },
  { id: 'workspace', title: 'Workspace', description: 'Team & permissions' },
  { id: 'billing', title: 'Billing', description: 'Payment method', optional: true },
  { id: 'review', title: 'Review', description: 'Confirm & launch' },
];

const StepperDemo = (args: any) => {
  const stepsList: StepperItem[] = args.steps ?? sampleSteps;
  const initial = args.activeStep !== undefined ? args.activeStep : (args.defaultStep ?? 0);
  const [stepIdx, setStepIdx] = useState<number>(
    Math.min(Math.max(initial, 0), Math.max(0, stepsList.length - 1))
  );
  const isDarkSurface = Boolean(args.__darkSurface);

  useEffect(() => {
    const next = args.activeStep !== undefined ? args.activeStep : (args.defaultStep ?? 0);
    setStepIdx(Math.min(Math.max(next, 0), Math.max(0, stepsList.length - 1)));
  }, [args.activeStep, args.defaultStep, stepsList.length]);

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6 pb-6">
      <Stepper
        {...args}
        steps={stepsList}
        activeStep={stepIdx}
        activeColor={args.activeColor ?? (isDarkSurface ? '#ffffff' : '#111111')}
        completedColor={args.completedColor ?? (isDarkSurface ? '#e4e4e7' : '#18181b')}
        inactiveColor={args.inactiveColor ?? (isDarkSurface ? '#52525b' : '#d4d4d4')}
        connectorColor={args.connectorColor ?? (isDarkSurface ? '#3f3f46' : '#e4e4e7')}
        textColor={args.textColor ?? (isDarkSurface ? '#f4f4f5' : undefined)}
        onStepChange={(next) => {
          setStepIdx(next);
          args.onStepChange?.(next);
        }}
      />

      <div className="flex items-center justify-between gap-4 pt-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={stepIdx <= 0}
            onClick={() => setStepIdx((prev) => Math.max(0, prev - 1))}
            style={{
              padding: '8px 18px',
              backgroundColor: isDarkSurface ? '#18181b' : '#ffffff',
              border: `1px solid ${isDarkSurface ? '#3f3f46' : '#d4d4d4'}`,
              color: isDarkSurface ? '#f4f4f5' : '#111111',
            }}
            className="text-xs font-medium rounded-md hover:opacity-85 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-opacity"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={stepIdx >= stepsList.length - 1}
            onClick={() => setStepIdx((prev) => Math.min(stepsList.length - 1, prev + 1))}
            style={{
              padding: '8px 18px',
              backgroundColor: isDarkSurface ? '#ffffff' : '#111111',
              border: 'none',
              color: isDarkSurface ? '#111111' : '#ffffff',
            }}
            className="text-xs font-medium rounded-md hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-opacity"
          >
            Next Step
          </button>
        </div>

        <div
          style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
          className="text-xs"
        >
          Active step:{' '}
          <span
            style={
              isDarkSurface
                ? { backgroundColor: '#27272a', color: '#f4f4f5' }
                : { backgroundColor: '#f3f4f6', color: '#111111' }
            }
            className="font-mono px-1.5 py-0.5 rounded"
          >
            {stepIdx + 1} ({stepsList[stepIdx]?.title})
          </span>
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    steps: sampleSteps,
    activeStep: 1,
    orientation: 'horizontal',
    size: 'medium',
    clickable: true,
    showStepNumbers: true,
  },
  render: (args) => <StepperDemo {...args} />,
};

export const VerticalAndStatuses: Story = {
  render: () => {
    const statusSteps: StepperItem[] = [
      { id: 'repo', title: 'Repository Connected', description: 'Source branch verified' },
      { id: 'build', title: 'Build Failed', description: 'Type check failed in CI', status: 'error' },
      { id: 'deploy', title: 'Staging Deploy', description: 'Awaiting build pass', disabled: true },
      { id: 'live', title: 'Production Release', description: 'Final rollout' },
    ];

    return (
      <div className="flex flex-col gap-6 w-full max-w-md pb-6">
        <Stepper steps={statusSteps} activeStep={1} orientation="vertical" />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-7 w-full max-w-2xl pb-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <Stepper steps={sampleSteps} activeStep={1} size="small" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <Stepper steps={sampleSteps} activeStep={1} size="medium" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <Stepper steps={sampleSteps} activeStep={1} size="large" />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    steps: sampleSteps,
    activeStep: 2,
    activeColor: '#2563eb',
    completedColor: '#16a34a',
    inactiveColor: '#bfdbfe',
    connectorColor: '#cbd5e1',
    textColor: '#1e3a8a',
  },
  render: (args) => <StepperDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    steps: sampleSteps,
    activeStep: 1,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-2xl"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-5">Stepper (Dark Context)</div>
      <StepperDemo {...args} __darkSurface />
    </div>
  ),
};