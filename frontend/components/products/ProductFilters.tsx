'use client';

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 font-mono text-xs flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-colors duration-200">
      <div className="flex flex-1 items-center gap-3 w-full">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by MPN, Product Name, Brand, Manufacturer..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-md pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Dropdown Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Quality Statuses</option>
            <option value="EXCELLENT">EXCELLENT (&gt;=95)</option>
            <option value="PASS">PASS (85-95)</option>
            <option value="NEEDS_REVIEW">NEEDS_REVIEW (70-85)</option>
            <option value="CRITICAL">CRITICAL (&lt;70)</option>
          </select>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onReset}>
        <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
      </Button>
    </div>
  );
};
