import React, { useState, useMemo, useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// --- Icons for Checkbox and Pagination ---
const CheckIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none", className)} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DashIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cn("pointer-events-none", className)} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChevronLeft = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRight = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

// Internal Checkbox purely for the DataTable
const TableCheckbox = ({ checked, onChange, disabled }: { checked: boolean | 'indeterminate', onChange: () => void, disabled?: boolean }) => {
  const isIndeterminate = checked === 'indeterminate';
  const isChecked = checked === true;
  const isActive = isChecked || isIndeterminate;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? 'mixed' : isChecked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        !isActive && "border-[#888888] bg-transparent dark:border-zinc-500",
        isActive && "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {isChecked && <CheckIcon className="h-3 w-3" />}
      {isIndeterminate && <DashIcon className="h-3 w-3" />}
    </button>
  );
};

// --- Variants ---
const tableVariants = cva("w-full caption-bottom text-left border-collapse", {
  variants: {
    size: {
      small: "text-xs",
      medium: "text-sm",
      large: "text-base",
    },
  },
  defaultVariants: {
    size: "medium",
  },
});

const cellPadding = {
  small: "px-3 py-2",
  medium: "px-4 py-3",
  large: "px-5 py-4",
};

export type ColumnDef<T> = {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
};

export interface DataTableProps<T> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'data'>, VariantProps<typeof tableVariants> {
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  selectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  pageSize?: number;
  
  headerBg?: string;
  rowHoverBg?: string;
  selectedRowBg?: string;
  borderColor?: string;
  textColor?: string;
}

export const DataTable = React.forwardRef(<T extends Record<string, any>>(
  {
    className,
    data,
    columns,
    getRowId,
    selectedRowIds = [],
    onSelectionChange,
    pageSize = 10,
    size = "medium",
    headerBg,
    rowHoverBg,
    selectedRowBg,
    borderColor,
    textColor,
    style,
    ...props
  }: DataTableProps<T>,
  ref: React.Ref<HTMLDivElement>
) => {
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  
  useEffect(() => {
    if (currentPage >= totalPages) setCurrentPage(Math.max(0, totalPages - 1));
  }, [data.length, pageSize, totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRowIds.includes(getRowId(row)));
  const isSomePageSelected = paginatedData.some(row => selectedRowIds.includes(getRowId(row)));
  const masterCheckboxState = isAllPageSelected ? true : isSomePageSelected ? 'indeterminate' : false;

  const handleMasterToggle = () => {
    if (!onSelectionChange) return;
    const pageIds = paginatedData.map(getRowId);
    if (isAllPageSelected) {
      onSelectionChange(selectedRowIds.filter(id => !pageIds.includes(id)));
    } else {
      const newSelections = new Set([...selectedRowIds, ...pageIds]);
      onSelectionChange(Array.from(newSelections));
    }
  };

  const handleRowToggle = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedRowIds.includes(id)) {
      onSelectionChange(selectedRowIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedRowIds, id]);
    }
  };

  // Safe mapping of inline styles. 
  const customStyle = {
    ...style,
    ...(headerBg ? { '--dt-header-bg': headerBg } : {}),
    ...(rowHoverBg ? { '--dt-row-hover': rowHoverBg } : {}),
    ...(selectedRowBg ? { '--dt-selected-bg': selectedRowBg } : {}),
    ...(borderColor ? { '--dt-border': borderColor } : {}),
    ...(textColor ? { '--dt-text': textColor } : {}),
  } as React.CSSProperties;

  return (
    <div 
      ref={ref}
      style={customStyle}
      className={cn(
        "flex flex-col rounded-md border overflow-hidden dark:border-zinc-800",
        // FIXED: Conditional standard tailwind border vs custom injection
        borderColor ? "border-[var(--dt-border)]" : "border-[#d4d4d8]",
        className
      )} 
      {...props}
    >
      <div className="overflow-x-auto w-full">
        <table className={cn(tableVariants({ size }), textColor && "text-[var(--dt-text)]")}>
          
          <thead className={cn(
            "border-b dark:border-zinc-800 dark:bg-zinc-900",
            // FIXED: Conditional standard colors to prevent Tailwind JIT compilation failures
            borderColor ? "border-[var(--dt-border)]" : "border-[#d4d4d8]",
            headerBg ? "bg-[var(--dt-header-bg)]" : "bg-[#E5E5E5]"
          )}>
            <tr>
              <th className={cn("font-semibold text-left align-middle w-12", cellPadding[size || 'medium'])}>
                <TableCheckbox 
                  checked={masterCheckboxState} 
                  onChange={handleMasterToggle} 
                  disabled={!onSelectionChange || paginatedData.length === 0} 
                />
              </th>
              
              {columns.map((col, index) => (
                <th 
                  key={index}
                  className={cn(
                    "font-semibold align-middle text-[#555555] dark:text-zinc-400", 
                    cellPadding[size || 'medium'],
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-zinc-950">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="h-24 text-center text-[#888888] dark:text-zinc-500">
                  No results.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const rowId = getRowId(row);
                const isSelected = selectedRowIds.includes(rowId);

                return (
                  <tr 
                    key={rowId}
                    className={cn(
                      "border-b transition-colors dark:border-zinc-800",
                      // Row border
                      borderColor ? "border-[var(--dt-border)]" : "border-[#e5e5e5]",
                      
                      // Unselected Hover State
                      !isSelected && !rowHoverBg && "hover:bg-[#f4f4f5] dark:hover:bg-zinc-900",
                      !isSelected && rowHoverBg && "hover:bg-[var(--dt-row-hover)] dark:hover:bg-[var(--dt-row-hover)]",
                      
                      // Selected State & Selected Hover State
                      isSelected && !selectedRowBg && "bg-[#f0fdf4] hover:bg-[#f0fdf4] dark:bg-zinc-800 dark:hover:bg-zinc-800",
                      isSelected && selectedRowBg && "bg-[var(--dt-selected-bg)] hover:bg-[var(--dt-selected-bg)] dark:bg-[var(--dt-selected-bg)] dark:hover:bg-[var(--dt-selected-bg)]"
                    )}
                  >
                    <td className={cn("align-middle w-12", cellPadding[size || 'medium'])}>
                      <TableCheckbox 
                        checked={isSelected} 
                        onChange={() => handleRowToggle(rowId)} 
                        disabled={!onSelectionChange} 
                      />
                    </td>
                    
                    {columns.map((col, index) => (
                      <td 
                        key={index}
                        className={cn(
                          "align-middle", 
                          cellPadding[size || 'medium'],
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                        )}
                      >
                        {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey]) : null)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={cn(
        "flex items-center justify-between border-t bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950",
        // FIXED: Footer border
        borderColor ? "border-[var(--dt-border)]" : "border-[#d4d4d8]"
      )}>
        <div className="text-sm text-[#888888] dark:text-zinc-400">
          Showing {paginatedData.length === 0 ? 0 : (currentPage * pageSize) + 1} to {Math.min((currentPage + 1) * pageSize, data.length)} of {data.length} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d4d4d8] bg-transparent p-0 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-sm font-medium">
            Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1 || totalPages === 0}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d4d4d8] bg-transparent p-0 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}) as <T>(props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }) => React.ReactElement;

(DataTable as any).displayName = "DataTable";