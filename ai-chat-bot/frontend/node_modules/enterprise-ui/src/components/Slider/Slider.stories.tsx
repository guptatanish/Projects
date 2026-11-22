import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';

const meta: Meta<typeof Slider> = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 100, step: 1 } },
    defaultValue: { control: { type: 'number', min: 0, max: 100, step: 1 } },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    showMinMax: { control: 'boolean' },
    showTicks: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    trackColor: { control: 'color' },
    fillColor: { control: 'color' },
    thumbColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

const SliderDemo = (args: any) => {
  const minVal = args.min ?? 0;
  const maxVal = args.max ?? 100;
  const isDarkSurface = Boolean(args.__darkSurface);
  const initial =
    args.value !== undefined
      ? args.value
      : args.defaultValue !== undefined
        ? args.defaultValue
        : Math.round((minVal + maxVal) / 2);

  const [val, setVal] = useState<number>(initial);

  useEffect(() => {
    if (args.value !== undefined) {
      setVal(args.value);
    } else if (args.defaultValue !== undefined) {
      setVal(args.defaultValue);
    }
  }, [args.value, args.defaultValue]);

  return (
    <div className="w-full max-w-md flex flex-col gap-3 pb-6">
      <Slider
        {...args}
        value={val}
        trackColor={args.trackColor ?? (isDarkSurface ? '#3f3f46' : '#d4d4d4')}
        fillColor={args.fillColor ?? (isDarkSurface ? '#ffffff' : '#111111')}
        thumbColor={args.thumbColor ?? (isDarkSurface ? '#ffffff' : '#111111')}
        textColor={args.textColor ?? (isDarkSurface ? '#a1a1aa' : '#666666')}
        onValueChange={(next) => {
          setVal(next);
          args.onValueChange?.(next);
        }}
      />
      <div
        style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
        className="text-xs"
      >
        Current value:{' '}
        <span
          style={
            isDarkSurface
              ? { backgroundColor: '#27272a', color: '#f4f4f5' }
              : { backgroundColor: '#f3f4f6', color: '#111111' }
          }
          className="font-mono px-1.5 py-0.5 rounded"
        >
          {args.formatValue ? args.formatValue(val) : val}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 40,
    size: 'medium',
    showMinMax: true,
    showTicks: false,
    disabled: false,
    readOnly: false,
  },
  render: (args) => <SliderDemo {...args} />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <SliderDemo defaultValue={25} size="small" showMinMax />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <SliderDemo defaultValue={50} size="medium" showMinMax />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <SliderDemo defaultValue={75} size="large" showMinMax />
      </div>
    </div>
  ),
};

export const StepsTicksAndStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Stepped with Ticks (Step 10, 0–100)
        </span>
        <SliderDemo
          min={0}
          max={100}
          step={10}
          defaultValue={30}
          showMinMax
          showTicks
          formatValue={(v) => `${v}%`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Read-Only
        </span>
        <SliderDemo defaultValue={65} showMinMax readOnly />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Disabled
        </span>
        <SliderDemo defaultValue={35} showMinMax disabled />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 60,
    showMinMax: true,
    trackColor: '#dbeafe',
    fillColor: '#2563eb',
    thumbColor: '#1d4ed8',
    textColor: '#1e3a8a',
  },
  render: (args) => <SliderDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 55,
    showMinMax: true,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-lg"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Slider (Dark Context)</div>
      <SliderDemo {...args} __darkSurface />
    </div>
  ),
};