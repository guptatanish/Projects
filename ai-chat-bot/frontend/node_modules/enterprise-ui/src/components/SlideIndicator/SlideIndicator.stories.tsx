import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SlideIndicator } from './SlideIndicator';

const meta: Meta<typeof SlideIndicator> = {
  title: 'Components/SlideIndicator',
  component: SlideIndicator,
  tags: ['autodocs'],
  argTypes: {
    count: { control: { type: 'number', min: 1, max: 12, step: 1 } },
    activeIndex: { control: { type: 'number', min: 0, max: 11, step: 1 } },
    defaultIndex: { control: { type: 'number', min: 0, max: 11, step: 1 } },
    shape: {
      control: 'select',
      options: ['dot', 'pill', 'line', 'number'],
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    interactive: { control: 'boolean' },
    showCounter: { control: 'boolean' },
    activeColor: { control: 'color' },
    inactiveColor: { control: 'color' },
    hoverColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof SlideIndicator>;

const slides = [
  { title: 'Slide 1 — Overview', caption: 'Unified workspace architecture and design tokens.' },
  { title: 'Slide 2 — Components', caption: 'Accessible, responsive primitives with dark mode.' },
  { title: 'Slide 3 — Performance', caption: 'Lean bundles and predictable layout behavior.' },
  { title: 'Slide 4 — Storybook Docs', caption: 'Interactive controls and live documentation.' },
  { title: 'Slide 5 — Release Ready', caption: 'Tested across states, sizes, and themes.' },
];

const SlideIndicatorDemo = (args: any) => {
  const total = Math.max(1, Number(args.count ?? slides.length));
  const initial = args.activeIndex !== undefined ? args.activeIndex : (args.defaultIndex ?? 0);
  const [idx, setIdx] = useState<number>(Math.min(Math.max(initial, 0), total - 1));
  const isDarkSurface = Boolean(args.__darkSurface);

  useEffect(() => {
    const next = args.activeIndex !== undefined ? args.activeIndex : (args.defaultIndex ?? 0);
    setIdx(Math.min(Math.max(next, 0), total - 1));
  }, [args.activeIndex, args.defaultIndex, total]);

  const currentSlide = slides[idx % slides.length];

  return (
    <div className="w-full max-w-md flex flex-col gap-4 pb-6">
      <div
        style={
          isDarkSurface
            ? { backgroundColor: '#18181b', borderColor: '#27272a', padding: '24px' }
            : { backgroundColor: '#fafafa', borderColor: '#e5e5e5', padding: '24px' }
        }
        className="rounded-md border flex flex-col justify-between gap-5 min-h-[140px]"
      >
        <div>
          <div
            style={{ color: isDarkSurface ? '#f4f4f5' : '#111111' }}
            className="text-sm font-semibold"
          >
            {currentSlide.title}
          </div>
          <p
            style={{ color: isDarkSurface ? '#a1a1aa' : '#666666' }}
            className="mt-1.5 text-xs leading-relaxed"
          >
            {currentSlide.caption}
          </p>
        </div>

        <div className="pt-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIdx((prev) => (prev - 1 + total) % total)}
            style={
              isDarkSurface
                ? { backgroundColor: '#09090b', borderColor: '#3f3f46', color: '#f4f4f5' }
                : { backgroundColor: '#ffffff', borderColor: '#d4d4d4', color: '#111111' }
            }
            className="px-3.5 py-1.5 text-xs font-medium rounded border-0 cursor-pointer"
          >
            Prev
          </button>

          <SlideIndicator
            {...args}
            count={total}
            activeIndex={idx}
            activeColor={args.activeColor ?? (isDarkSurface ? '#ffffff' : '#111111')}
            inactiveColor={args.inactiveColor ?? (isDarkSurface ? '#52525b' : '#d4d4d4')}
            textColor={args.textColor ?? (isDarkSurface ? '#e4e4e7' : '#555555')}
            onChange={(nextIdx) => {
              setIdx(nextIdx);
              args.onChange?.(nextIdx);
            }}
          />

          <button
            type="button"
            onClick={() => setIdx((prev) => (prev + 1) % total)}
            style={
              isDarkSurface
                ? { backgroundColor: '#09090b', borderColor: '#3f3f46', color: '#f4f4f5' }
                : { backgroundColor: '#ffffff', borderColor: '#d4d4d4', color: '#111111' }
            }
            className="px-3.5 py-1.5 text-xs font-medium rounded border-0 cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      <div
        style={{ color: isDarkSurface ? '#a1a1aa' : '#888888' }}
        className="text-xs"
      >
        Active index:{' '}
        <span
          style={
            isDarkSurface
              ? { backgroundColor: '#27272a', color: '#f4f4f5' }
              : { backgroundColor: '#f3f4f6', color: '#111111' }
          }
          className="font-mono px-1.5 py-0.5 rounded"
        >
          {idx}
        </span>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    count: 5,
    activeIndex: 0,
    shape: 'dot',
    orientation: 'horizontal',
    size: 'medium',
    interactive: true,
    showCounter: true,
  },
  render: (args) => <SlideIndicatorDemo {...args} />,
};

export const Shapes: Story = {
  render: () => (
    <div className="flex flex-col gap-5 pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Dot</span>
        <SlideIndicatorDemo count={5} shape="dot" showCounter />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pill</span>
        <SlideIndicatorDemo count={5} shape="pill" showCounter />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Line</span>
        <SlideIndicatorDemo count={5} shape="line" showCounter />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Number</span>
        <SlideIndicatorDemo count={5} shape="number" showCounter />
      </div>
    </div>
  ),
};

export const SizesAndOrientation: Story = {
  render: () => (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
          <SlideIndicator count={4} defaultIndex={1} shape="pill" size="small" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
          <SlideIndicator count={4} defaultIndex={1} shape="pill" size="medium" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
          <SlideIndicator count={4} defaultIndex={1} shape="pill" size="large" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Vertical</span>
        <SlideIndicator count={4} defaultIndex={2} shape="pill" orientation="vertical" showCounter />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    count: 5,
    activeIndex: 1,
    shape: 'pill',
    showCounter: true,
    activeColor: '#2563eb',
    inactiveColor: '#bfdbfe',
    hoverColor: '#60a5fa',
    textColor: '#1e3a8a',
  },
  render: (args) => <SlideIndicatorDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    count: 5,
    activeIndex: 2,
    shape: 'pill',
    showCounter: true,
  },
  render: (args) => (
    <div
      style={{ backgroundColor: '#09090b', borderColor: '#27272a', padding: '24px' }}
      className="dark rounded-md border w-full max-w-lg"
    >
      <div className="text-sm font-semibold text-zinc-400 mb-4">Slide Indicator (Dark Context)</div>
      <SlideIndicatorDemo {...args} __darkSurface />
    </div>
  ),
};