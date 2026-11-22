import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from './FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'Components/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    accept: { control: 'text', description: 'Comma separated string e.g. ".pdf, image/*"' },
    maxSize: { control: 'number', description: 'Max file size in bytes' },
    maxFiles: { control: 'number', description: 'Maximum number of files allowed' },
    dropzoneBg: { control: 'color' },
    activeDropzoneBg: { control: 'color' },
    borderColor: { control: 'color' },
    iconColor: { control: 'color' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

// Interactive wrapper for Storybook to manage the controlled file state natively
const FileUploadDemo = (args: any) => {
  const [files, setFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setErrorMsg(null); // Clear errors on successful drop
  };

  const handleError = (error: string) => {
    setErrorMsg(error);
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-2">
      <FileUpload 
        {...args} 
        files={files} 
        onFilesChange={handleFilesChange} 
        onError={handleError} 
      />
      {errorMsg && (
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          {errorMsg}
        </span>
      )}
    </div>
  );
};

export const SingleFileUpload: Story = {
  args: {
    multiple: false,
  },
  render: (args) => <FileUploadDemo {...args} />,
};

export const MultipleFiles: Story = {
  args: {
    multiple: true,
    maxFiles: 5,
  },
  render: (args) => <FileUploadDemo {...args} />,
};

export const RestrictedTypesAndSize: Story = {
  args: {
    multiple: true,
    accept: '.pdf, image/*',
    maxSize: 5242880, // 5MB limit
  },
  render: (args) => <FileUploadDemo {...args} />,
};

export const CustomColorsDemo: Story = {
  args: {
    multiple: true,
    dropzoneBg: '#eff6ff', // blue-50
    activeDropzoneBg: '#dbeafe', // blue-100
    borderColor: '#bfdbfe', // blue-200
    iconColor: '#3b82f6', // blue-500
    textColor: '#1e3a8a', // blue-900
  },
  render: (args) => <FileUploadDemo {...args} />,
};

export const Disabled: Story = {
  args: {
    multiple: true,
    disabled: true,
  },
  render: (args) => <FileUploadDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    multiple: true,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full">
      <div className="text-sm font-semibold text-zinc-400 mb-6">File Upload (Dark Mode Context)</div>
      <FileUploadDemo {...args} />
    </div>
  ),
};