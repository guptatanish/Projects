import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, type ColumnDef } from './DataTable';

type DataTableStoryArgs = React.ComponentProps<typeof DataTable>;

const meta: Meta<DataTableStoryArgs> = {
  title: 'Components/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    pageSize: {
      control: 'number',
      description: 'Number of rows before mandatory pagination triggers',
    },
    headerBg: { control: 'color', description: 'Background color of the table header (Defaults to #E5E5E5)' },
    rowHoverBg: { control: 'color', description: 'Background color on row hover' },
    selectedRowBg: { control: 'color', description: 'Background color for selected rows' },
    borderColor: { control: 'color', description: 'Color of the dividing thin borders' },
    textColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<DataTableStoryArgs>;

// Mock Enterprise Data Interface
interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

const employeeData: Employee[] = Array.from({ length: 25 }).map((_, i) => ({
  id: `EMP-${1000 + i}`,
  name: ['Alice Johnson', 'Bob Smith', 'Charlie Davis', 'Diana Prince', 'Ethan Hunt'][i % 5] + (i > 4 ? ` ${i}` : ''),
  department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations'][i % 5],
  role: ['Senior Dev', 'Manager', 'Analyst', 'Director', 'Coordinator'][i % 5],
  status: i % 4 === 0 ? 'On Leave' : i % 7 === 0 ? 'Inactive' : 'Active',
}));

// Generic Column Definition mapping
const employeeColumns: ColumnDef<Employee>[] = [
  { header: 'ID', accessorKey: 'id' },
  { header: 'Employee Name', accessorKey: 'name' },
  { header: 'Department', accessorKey: 'department' },
  { header: 'Role', accessorKey: 'role' },
  { 
    header: 'Status', 
    align: 'right',
    // Example of rendering custom generic UI inside the table cell
    cell: (row) => (
      <span 
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' :
          row.status === 'On Leave' ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}
      >
        {row.status}
      </span>
    )
  },
];

// Interactive Stateful Component for Storybook
const DataTableDemo = (args: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <DataTable 
      {...args} 
      selectedRowIds={selectedIds}
      onSelectionChange={setSelectedIds}
    />
  );
};

export const Default: Story = {
  args: {
    size: 'medium',
    pageSize: 10,
    data: employeeData,
    columns: employeeColumns,
    getRowId: (row: Employee) => row.id,
  },
  render: (args) => <DataTableDemo {...args} />,
};

export const DenseSmallSize: Story = {
  args: {
    size: 'small',
    pageSize: 5,
    data: employeeData.slice(0, 5),
    columns: employeeColumns,
    getRowId: (row: Employee) => row.id,
  },
  render: (args) => <DataTableDemo {...args} />,
};

export const CustomColorsDemo: Story = {
  args: {
    size: 'medium',
    pageSize: 7,
    data: employeeData.slice(0, 15),
    columns: employeeColumns,
    getRowId: (row: Employee) => row.id,
    
    // Bypassing Tailwind limits natively
    headerBg: '#dbeafe', // blue-100
    borderColor: '#bfdbfe', // blue-200
    rowHoverBg: '#eff6ff', // blue-50
    selectedRowBg: '#bfdbfe', // blue-200
    textColor: '#1e3a8a', // blue-900
  },
  render: (args) => <DataTableDemo {...args} />,
};

export const DarkModeDocs: Story = {
  args: {
    size: 'medium',
    pageSize: 5,
    data: employeeData.slice(0, 5),
    columns: employeeColumns,
    getRowId: (row: Employee) => row.id,
  },
  render: (args) => (
    <div className="dark bg-zinc-950 p-8 rounded-md border border-zinc-800 w-full">
      <div className="text-sm font-semibold text-zinc-400 mb-4">Data Table (Dark Mode Context)</div>
      <DataTableDemo {...args} />
    </div>
  ),
};