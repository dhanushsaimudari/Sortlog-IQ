'use client';

import React from 'react';
import { MetricCategoryBreakdown } from '../../types/evaluation';
import { Card, CardHeader } from '../ui/Card';

interface ErrorExplorerProps {
  categoryCounts: MetricCategoryBreakdown;
  onSelectCategory?: (cat: string) => void;
}

export const ErrorExplorer: React.FC<ErrorExplorerProps> = ({ categoryCounts, onSelectCategory }) => {
  const categories = [
    { key: 'EXACT', label: 'Exact Match', count: categoryCounts.EXACT, color: 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20' },
    { key: 'NORM', label: 'Normalized Match', count: categoryCounts.NORM, color: 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20' },
    { key: 'FMT_MISMATCH', label: 'Formatting Mismatch', count: categoryCounts.FMT_MISMATCH, color: 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20' },
    { key: 'MISSING', label: 'Missing Value (FN)', count: categoryCounts.MISSING, color: 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20' },
    { key: 'EXTRA', label: 'Extra Value (FP)', count: categoryCounts.EXTRA, color: 'text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20' },
    { key: 'WRONG', label: 'Wrong Value', count: categoryCounts.WRONG, color: 'text-rose-800 dark:text-rose-500 border-rose-400 dark:border-rose-900 bg-rose-100 dark:bg-rose-950/40' },
  ];

  return (
    <Card className="space-y-4">
      <CardHeader title="Error Category Explorer" subtitle="Click any category to filter discrepancy breakdown" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
        {categories.map((cat) => (
          <div
            key={cat.key}
            onClick={() => onSelectCategory && onSelectCategory(cat.key)}
            className={`p-3 rounded-lg border cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-all ${cat.color}`}
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">{cat.label}</span>
            <span className="text-xl font-bold">{cat.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
