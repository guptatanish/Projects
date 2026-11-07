import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Primary Action',
  },
};

export const OverriddenStyle: Story = {
  args: {
    children: 'Destructive Action',
    className: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', // Testing tailwind-merge
  },
};