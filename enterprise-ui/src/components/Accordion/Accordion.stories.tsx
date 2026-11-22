import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';

// Extend the Storybook args to include our sub-component props so they appear in the Controls panel
type AccordionStoryArgs = React.ComponentProps<typeof Accordion> & {
  triggerBg?: string;
  contentBg?: string;
};

const meta: Meta<AccordionStoryArgs> = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['single', 'multiple'],
    },
    variant: {
      control: 'select',
      options: ['default', 'separated', 'flush'],
    },
    collapsible: { control: 'boolean' },
    triggerBg: {
      control: 'text',
      description: 'Override the default Trigger background (e.g., bg-blue-100 text-blue-900)',
    },
    contentBg: {
      control: 'text',
      description: 'Override the default Content background (e.g., bg-blue-50 text-blue-900)',
    },
  },
};

export default meta;
type Story = StoryObj<AccordionStoryArgs>;

export const Default: Story = {
  args: {
    type: 'single',
    collapsible: true,
    triggerBg: '', // Leave empty to use the component's default #E5E5E5
    contentBg: '', // Leave empty to use the component's default white
  },
  render: (args) => (
    <div className="max-w-md w-full">
      <Accordion type={args.type} variant={args.variant} collapsible={args.collapsible} defaultValue="item-1">
        <AccordionItem value="item-1">
          {/* Wire the new args down into the sub-components */}
          <AccordionTrigger triggerBg={args.triggerBg}>Personal Information</AccordionTrigger>
          <AccordionContent contentBg={args.contentBg}>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-black dark:text-white">Name*:</label>
                <input type="text" className="w-full border border-[#888888] bg-white dark:bg-zinc-900 text-black dark:text-white px-3 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-black dark:text-white">Email*:</label>
                <input type="email" className="w-full border border-[#888888] bg-white dark:bg-zinc-900 text-black dark:text-white px-3 py-2 outline-none focus:border-blue-500" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger triggerBg={args.triggerBg}>Company Details</AccordionTrigger>
          <AccordionContent contentBg={args.contentBg}>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-black dark:text-white">Company Name:</label>
                <input type="text" className="w-full border border-[#888888] bg-white dark:bg-zinc-900 text-black dark:text-white px-3 py-2 outline-none focus:border-blue-500" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const ConfigurableColors: Story = {
  render: () => (
    <div className="max-w-md w-full">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger triggerBg="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
            Forced Blue Trigger
          </AccordionTrigger>
          <AccordionContent contentBg="bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100">
            This panel uses custom colors passed directly via the new props.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger triggerBg="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
            Forced Green Trigger
          </AccordionTrigger>
          <AccordionContent contentBg="bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100">
            This ensures your branding colors stay locked no matter what mode Storybook is in.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const SeparatedVariant: Story = {
  render: () => (
    <div className="max-w-md w-full">
      <Accordion type="single" variant="separated" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Account Settings</AccordionTrigger>
          <AccordionContent>Manage your profile, email preferences, and password settings.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Billing Information</AccordionTrigger>
          <AccordionContent>View past invoices, update your credit card, and change your subscription plan.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const FlushVariant: Story = {
  render: () => (
    <div className="max-w-md w-full">
      <Accordion type="multiple" variant="flush" defaultValue={["item-1"]}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Product Details</AccordionTrigger>
          <AccordionContent>Heavy-duty steel construction with powder-coated finish.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Shipping & Returns</AccordionTrigger>
          <AccordionContent>Free shipping across India. 30-day hassle-free returns.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const DarkModeDocs: Story = {
  render: () => (
    <div className="dark bg-zinc-950 text-zinc-100 p-8 rounded-md flex flex-col gap-8 w-full max-w-2xl">
      <div>
        <div className="text-sm font-semibold mb-6 text-zinc-400">Default Accordion (Dark Mode)</div>
        <div className="max-w-md w-full">
          <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1">
              <AccordionTrigger>Personal Information</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-white">Name*:</label>
                    <input type="text" className="w-full border border-[#888888] bg-zinc-900 text-white px-3 py-2 outline-none focus:border-blue-500" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Security Settings</AccordionTrigger>
              <AccordionContent>Manage your 2FA and active sessions.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  ),
};