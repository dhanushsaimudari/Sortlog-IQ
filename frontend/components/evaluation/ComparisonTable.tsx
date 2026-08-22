'use client';

import React from 'react';
import { DiscrepancyItem } from '../../types/evaluation';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Wand2 } from 'lucide-react';

interface ComparisonTableProps {
  discrepancies: DiscrepancyItem[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ discrepancies }) => {
  return (
    <Card className="space-y-4">
      <CardHeader title="Ground Truth Discrepancy Matrix" subtitle="Detailed cell-by-cell comparison of expected ground truth vs predicted models" />

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3">MPN</th>
              <th className="p-3">Target Field</th>
              <th className="p-3">Category Outcome</th>
              <th className="p-3">Expected Ground Truth</th>
              <th className="p-3">Predicted Value</th>
              <th className="p-3">Auto-Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {discrepancies.map((d, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <td className="p-3 font-bold text-slate-900 dark:text-slate-200">{d.mpn}</td>
                <td className="p-3 text-blue-600 dark:text-blue-400">{d.field_name}</td>
                <td className="p-3">
                  <Badge status={d.category}>{d.category}</Badge>
                </td>
                <td className="p-3 text-emerald-800 dark:text-emerald-400 bg-slate-100 dark:bg-slate-950/60 rounded max-w-xs truncate">{d.expected_value}</td>
                <td className="p-3 text-amber-800 dark:text-amber-300 bg-slate-100 dark:bg-slate-950/60 rounded max-w-xs truncate">{d.predicted_value}</td>
                <td className="p-3">
                  {d.fix_available ? (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Wand2 className="w-3 h-3" /> Available
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
