import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from './SearchInput';

const meta: Meta<typeof SearchInput> = {
  title: 'Components/SearchInput',
  component: SearchInput,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    placeholder: { control: 'text' },
    clearable: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    debounceMs: { control: { type: 'number', min: 0, max: 2000, step: 100 } },
    bgColor: { control: 'color' },
    borderColor: { control: 'color' },
    bottomBorderColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

const SearchDemo = (args: any) => {
  const initial = args.value !== undefined ? args.value : (args.defaultValue ?? '');
  const [query, setQuery] = useState<string>(initial);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initial);
  const [submittedQuery, setSubmittedQuery] = useState<string>('');

  useEffect(() => {
    if (args.value !== undefined) {
      setQuery(args.value);
    } else if (args.defaultValue !== undefined) {
      setQuery(args.defaultValue);
    }
  }, [args.value, args.defaultValue]);

  return (
    <div className="w-full max-w-md flex flex-col gap-3 pb-6">
      <SearchInput
        {...args}
        value={query}
        onValueChange={(val) => {
          setQuery(val);
          args.onValueChange?.(val);
        }}
        onDebouncedChange={(val) => {
          setDebouncedQuery(val);
          args.onDebouncedChange?.(val);
        }}
        onSearch={(val) => {
          setSubmittedQuery(val);
          args.onSearch?.(val);
        }}
      />
      <div className="flex flex-col gap-1 text-xs text-[#888888]">
        <div>
          Live value:{' '}
          <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {query || '(empty)'}
          </span>
        </div>
        <div>
          Debounced ({args.debounceMs ?? 300}ms):{' '}
          <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {debouncedQuery || '(empty)'}
          </span>
        </div>
        <div>
          Submitted (Enter / Clear):{' '}
          <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {submittedQuery || '(none)'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    placeholder: 'Search records...',
    size: 'medium',
    clearable: true,
    loading: false,
    disabled: false,
    readOnly: false,
    debounceMs: 300,
  },
  render: (args) => <SearchDemo {...args} />,
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Small</span>
        <SearchDemo size="small" placeholder="Small search..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Medium</span>
        <SearchDemo size="medium" placeholder="Medium search..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Large</span>
        <SearchDemo size="large" placeholder="Large search..." />
      </div>
    </div>
  ),
};

export const LoadingAndStates: Story = {
  render: () => (
    <div className="flex flex-col gap-5 w-full max-w-md pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Loading</span>
        <SearchDemo defaultValue="typescript" loading />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Read-Only</span>
        <SearchDemo defaultValue="Read-only query" readOnly />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Disabled</span>
        <SearchDemo defaultValue="Disabled search" disabled />
      </div>
    </div>
  ),
};

export const CustomColorsDemo: Story = {
  args: {
    defaultValue: 'Filtered item',
    bgColor: '#eff6ff',
    borderColor: '#93c5fd',
    bottomBorderColor: '#2563eb',
    textColor: '#1e3a8a',
  },
  render: (args) => <SearchDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    defaultValue: 'Dark mode search',
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full max-w-md">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Search Input (Dark Context)</div>
      <SearchDemo {...args} />
    </div>
  ),
};