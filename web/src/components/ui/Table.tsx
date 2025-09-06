import React, { ReactNode } from 'react';
import { Button, Badge, LoadingSpinner } from './index';

// Modern Table Component
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, item: T, index: number) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  pagination
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`
                    px-6 py-4 text-sm font-semibold text-gray-900 uppercase tracking-wider
                    ${column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'}
                    ${column.width ? `w-${column.width}` : ''}
                  `}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={`
                  hover:bg-gray-50 transition-colors duration-150
                  ${onRowClick ? 'cursor-pointer' : ''}
                `}
                onClick={() => onRowClick?.(item, rowIndex)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`
                      px-6 py-4 text-sm text-gray-900
                      ${column.align === 'center' ? 'text-center' : 
                        column.align === 'right' ? 'text-right' : 'text-left'}
                    `}
                  >
                    {column.render 
                      ? column.render(item[column.key], item, rowIndex)
                      : String(item[column.key] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Status Badge Component for Tables
interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  const getVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    const lowercaseStatus = status.toLowerCase();
    
    if (['completed', 'success', 'active', 'approved', 'published'].includes(lowercaseStatus)) {
      return 'success';
    }
    if (['pending', 'warning', 'draft', 'review'].includes(lowercaseStatus)) {
      return 'warning';
    }
    if (['failed', 'error', 'rejected', 'cancelled', 'inactive'].includes(lowercaseStatus)) {
      return 'error';
    }
    if (['info', 'processing', 'running'].includes(lowercaseStatus)) {
      return 'info';
    }
    return 'neutral';
  };

  return (
    <Badge variant={variant || getVariant(status)}>
      {status}
    </Badge>
  );
};

// Action Buttons Component for Tables
interface ActionButtonsProps {
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'warning' | 'accent' | 'ghost';
    icon?: ReactNode;
  }>;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ actions }) => {
  return (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => (
        <Button
          key={index}
          size="sm"
          variant={action.variant || 'outline'}
          onClick={action.onClick}
          className="whitespace-nowrap"
        >
          {action.icon && <span className="mr-1">{action.icon}</span>}
          {action.label}
        </Button>
      ))}
    </div>
  );
};

// Data Export Component
interface DataExportProps {
  data: any[];
  filename?: string;
  className?: string;
}

export const DataExport: React.FC<DataExportProps> = ({ 
  data, 
  filename = 'export',
  className = ''
}) => {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) return;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button variant="outline" size="sm" onClick={exportToCSV}>
        📊 Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportToJSON}>
        📄 Export JSON
      </Button>
    </div>
  );
};

export default { Table, StatusBadge, ActionButtons, DataExport };
