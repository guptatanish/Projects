import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from './Chip';

type ChipStoryArgs = React.ComponentProps<typeof Chip>;

const meta: Meta<ChipStoryArgs> = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outline'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: { control: 'boolean' },
    selected: { control: 'boolean' },
    chipBg: {
      control: 'color',
      description: 'Hex code for background (e.g., #dbeafe)',
    },
    chipText: {
      control: 'color',
      description: 'Hex code for text (e.g., #1e40af)',
    },
    chipBorder: {
      control: 'color',
      description: 'Hex code for border (e.g., #bfdbfe)',
    },
    textSize: {
      control: 'text',
      description: 'Custom font size (e.g., 14px, 1rem)',
    },
    onClick: { action: 'clicked' },
    onDelete: { action: 'deleted' },
  },
};

export default meta;
type Story = StoryObj<ChipStoryArgs>;

export const Default: Story = {
  args: {
    variant: 'soft',
    size: 'medium',
    children: 'Design System',
    chipBg: '',
    chipText: '',
    chipBorder: '',
    textSize: '',
  },
  render: (args) => (
    <div className="flex items-center gap-3 py-2">
      <Chip {...args} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 py-2">
      <Chip variant="solid">Solid Chip</Chip>
      <Chip variant="soft">Soft Chip</Chip>
      <Chip variant="outline">Outline Chip</Chip>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 py-2">
      <Chip size="small">Small Chip</Chip>
      <Chip size="medium">Medium Chip</Chip>
      <Chip size="large">Large Chip</Chip>
    </div>
  ),
};

export const WithMedia: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 py-2">
      <Chip 
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        }
      >
        Feedback
      </Chip>
      <Chip 
        size="large"
        avatar={
          <img src="https://i.pravatar.cc/100?img=3" alt="Avatar" className="w-full h-full object-cover" />
        }
      >
        Alice Cooper
      </Chip>
    </div>
  ),
};

export const DeletableTokens: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [chips, setChips] = useState(['React', 'TypeScript', 'Tailwind CSS']);

    const handleDelete = (chipToRemove: string) => {
      setChips(chips.filter(chip => chip !== chipToRemove));
    };

    return (
      <div className="flex flex-wrap items-center gap-3 p-4 border border-[#888888] rounded-md dark:border-zinc-700 max-w-md">
        {chips.length === 0 && <span className="text-sm text-gray-500">No tags selected.</span>}
        {chips.map(chip => (
          <Chip key={chip} variant="soft" onDelete={() => handleDelete(chip)}>
            {chip}
          </Chip>
        ))}
      </div>
    );
  }
};

export const ToggleableFilters: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<string[]>(['Open']);

    const toggleFilter = (filter: string) => {
      setSelected(prev => 
        prev.includes(filter) 
          ? prev.filter(f => f !== filter) 
          : [...prev, filter]
      );
    };

    const filters = ['Open', 'In Progress', 'Resolved', 'Closed'];

    return (
      <div className="flex flex-wrap items-center gap-3 py-2">
        {filters.map(filter => (
          <Chip 
            key={filter}
            variant="outline"
            selected={selected.includes(filter)}
            onClick={() => toggleFilter(filter)}
          >
            {filter}
          </Chip>
        ))}
      </div>
    );
  }
};

export const ConfigurableColorsDemo: Story = {
  args: {
    children: 'Pending Approval',
    chipBg: '#fef3c7', 
    chipText: '#92400e', 
    chipBorder: '#fde68a', 
    textSize: '15px', // Configurable text size example
    variant: 'outline', 
  },
  render: (args) => (
    <div className="flex items-center gap-3 py-2">
      <Chip {...args} />
      
      <Chip chipBg="#dbeafe" chipText="#1e40af" chipBorder="#bfdbfe" variant="outline">
        Active
      </Chip>
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 p-8 rounded-md flex flex-col gap-6 w-full mt-8 border border-zinc-800">
      <div className="text-sm font-semibold text-zinc-400 mb-2">Chip (Dark Mode Context)</div>
      
      <div className="flex flex-wrap items-center gap-3 py-1">
        <Chip variant="solid">Solid</Chip>
        <Chip variant="soft">Soft</Chip>
        <Chip variant="outline">Outline</Chip>
        <Chip variant="soft" chipBg="#3b82f6" chipText="#ffffff">Custom Brand</Chip>
      </div>
    </div>
  ),
};