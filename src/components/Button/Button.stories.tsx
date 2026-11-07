import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'ghostNegative', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
    },
    disabled: { control: 'boolean' },
    pressed: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Click Me',
    variant: 'primary',
    size: 'medium',
    type: 'button',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="ghostNegative">Ghost Negative</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="error">Error</Button>
    </div>
  ),
};

export const DarkModeVariants: Story = {
  render: () => (
    <div className="dark bg-zinc-950 p-6 rounded-md flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="ghostNegative">Ghost Negative</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="error">Error</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button size="xsmall">XSmall</Button>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
      <Button size="xlarge">XLarge</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled variant="primary">Disabled Primary</Button>
      <Button disabled variant="secondary">Disabled Secondary</Button>
    </div>
  ),
};

export const ToggleButton: Story = {
  render: (args) => {
    const [isPressed, setIsPressed] = useState(false);
    return (
      <Button
        {...args}
        pressed={isPressed}
        onClick={() => setIsPressed(!isPressed)}
      >
        {isPressed ? 'Bookmark Added (On)' : 'Add Bookmark (Off)'}
      </Button>
    );
  },
  args: {
    variant: 'secondary',
  },
};