import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Rating } from './Rating';

const HeartSvg = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const FlameSvg = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

const ThumbsUpSvg = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

const StarSvg = (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ICON_OPTIONS = {
  star: { label: 'Star', node: StarSvg, activeColor: '#f59e0b' },
  heart: { label: 'Heart', node: HeartSvg, activeColor: '#e11d48' },
  flame: { label: 'Flame', node: FlameSvg, activeColor: '#ea580c' },
  thumbsUp: { label: 'Thumbs Up', node: ThumbsUpSvg, activeColor: '#2563eb' },
} as const;

type IconPresetKey = keyof typeof ICON_OPTIONS;

const meta: Meta<typeof Rating> = {
  title: 'Components/Rating',
  component: Rating,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: ['default', 'star', 'heart', 'flame', 'thumbsUp'],
      mapping: {
        default: undefined,
        star: StarSvg,
        heart: HeartSvg,
        flame: FlameSvg,
        thumbsUp: ThumbsUpSvg,
      },
      description: 'Select icon style from the dropdown',
    },
    max: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    allowHalf: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    disabled: { control: 'boolean' },
    clearable: { control: 'boolean' },
    showValue: { control: 'boolean' },
    defaultValue: { control: { type: 'number', min: 0, max: 10, step: 0.5 } },
    value: { control: { type: 'number', min: 0, max: 10, step: 0.5 } },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    activeColor: { control: 'color' },
    inactiveColor: { control: 'color' },
    hoverColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Rating>;

const ControlledRatingDemo = (args: any) => {
  const initial = args.value !== undefined ? args.value : (args.defaultValue ?? 3);
  const [val, setVal] = useState<number>(initial);

  useEffect(() => {
    if (args.value !== undefined) {
      setVal(args.value);
    } else if (args.defaultValue !== undefined) {
      setVal(args.defaultValue);
    }
  }, [args.value, args.defaultValue]);

  return (
    <div className="flex flex-col gap-3 pb-6">
      <Rating
        {...args}
        defaultValue={args.defaultValue}
        value={args.value !== undefined ? val : undefined}
        onValueChange={(next) => {
          setVal(next);
          args.onValueChange?.(next);
        }}
      />
      <div className="text-xs text-[#888888]">
        Current value:{' '}
        <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
          {val}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    defaultValue: 3,
    max: 5,
    allowHalf: false,
    showValue: true,
    size: 'medium',
    clearable: true,
  },
  render: (args) => <ControlledRatingDemo {...args} />,
};

export const CustomIcon: Story = {
  render: () => {
    const [selectedPreset, setSelectedPreset] = useState<IconPresetKey>('heart');
    const [ratingVal, setRatingVal] = useState<number>(4);
    const activePreset = ICON_OPTIONS[selectedPreset];

    return (
      <div className="flex flex-col gap-4 pb-6 max-w-md">
        <div className="flex items-center gap-3">
          <label htmlFor="rating-icon-select" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Icon Option:
          </label>
          <select
            id="rating-icon-select"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value as IconPresetKey)}
            className="px-2.5 py-1.5 text-sm rounded-md border border-zinc-300 bg-white text-black dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700"
          >
            <option value="star">1. Star</option>
            <option value="heart">2. Heart</option>
            <option value="flame">3. Flame</option>
            <option value="thumbsUp">4. Thumbs Up</option>
          </select>
        </div>

        <Rating
          value={ratingVal}
          onValueChange={setRatingVal}
          max={5}
          showValue
          size="large"
          icon={activePreset.node}
          activeColor={activePreset.activeColor}
          hoverColor={activePreset.activeColor}
        />

        <div className="text-xs text-[#888888]">
          Selected icon: <span className="font-mono">{activePreset.label}</span> · Value:{' '}
          <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {ratingVal}
          </span>
        </div>
      </div>
    );
  },
};

export const HalfRating: Story = {
  args: {
    defaultValue: 3.5,
    max: 5,
    allowHalf: true,
    showValue: true,
    size: 'medium',
  },
  render: (args) => <ControlledRatingDemo {...args} />,
};

export const ReadOnlyAndDisabled: Story = {
  render: () => (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Read-Only (4.5 / 5)
        </span>
        <Rating value={4.5} allowHalf readOnly showValue />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Disabled
        </span>
        <Rating value={2} disabled showValue />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <ControlledRatingDemo defaultValue={3} size="small" showValue />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <ControlledRatingDemo defaultValue={4} size="medium" showValue />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <ControlledRatingDemo defaultValue={5} size="large" showValue />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    defaultValue: 4,
    max: 5,
    showValue: true,
    activeColor: '#2563eb',
    inactiveColor: '#dbeafe',
    hoverColor: '#1d4ed8',
    textColor: '#1e3a8a',
  },
  render: (args) => <ControlledRatingDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    defaultValue: 4,
    max: 5,
    showValue: true,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-md">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Rating (Dark Context)</div>
      <ControlledRatingDemo {...args} />
    </div>
  ),
};