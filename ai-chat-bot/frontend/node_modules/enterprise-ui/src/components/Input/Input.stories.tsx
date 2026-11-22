import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    inputSize: {
      control: 'select',
      options: ['xsmall', 'small', 'medium', 'large', 'xlarge'],
    },
    invalid: { control: 'boolean' },
    valid: { control: 'boolean' },
    info: { control: 'boolean' },
    isClearable: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    onChange: { action: 'changed' },
    // Fixes for the object crash:
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'tel', 'url'],
      description: 'HTML input type',
    },
    startAdornment: {
      control: 'text',
      description: 'Accepts a string or ReactNode (use string for testing in controls)',
    },
    endAdornment: {
      control: 'text',
      description: 'Accepts a string or ReactNode (use string for testing in controls)',
    },
    inputRef: {
      control: { disable: true },
      description: 'Forwarded React ref (cannot be edited in Storybook)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// Reusable dummy icon for adornments
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

export const Default: Story = {
  args: {
    placeholder: 'Enter text here...',
    inputSize: 'medium',
  },
};

export const ValidationStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Input invalid placeholder="Invalid state (Error)..." />
      <Input valid placeholder="Valid state (Success)..." />
      <Input info placeholder="Info state..." />
    </div>
  ),
};

export const AdvancedFeatures: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <label className="text-sm font-medium mb-1 block">Clearable Input</label>
        <Input isClearable defaultValue="Click the X to clear me" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Password Reveal</label>
        <Input type="password" defaultValue="secretpassword123" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Loading State</label>
        <Input isLoading placeholder="Checking username..." />
      </div>
    </div>
  ),
};

export const Adornments: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Input startAdornment={<SearchIcon />} placeholder="Search users..." />
      <Input startAdornment="https://" endAdornment=".com" placeholder="yourdomain" />
      <Input startAdornment="₹" placeholder="0.00" type="number" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Input inputSize="xsmall" placeholder="X-Small input..." />
      <Input inputSize="small" placeholder="Small input..." />
      <Input inputSize="medium" placeholder="Medium input..." />
      <Input inputSize="large" placeholder="Large input..." />
      <Input inputSize="xlarge" placeholder="X-Large input..." />
    </div>
  ),
};