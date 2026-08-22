'use client';

import React from 'react';
import { ReviewItem } from '../../types/review';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Check, X, Wand2 } from 'lucide-react';

interface ReviewQueueTableProps {
  items: ReviewItem[];
  selectedIndex: number;
  onSelectItem: (index: number) => void;
  onApprove: (item: ReviewItem) => void;
  onReject: (item: ReviewItem) => void;
  onAutoFix: (item: ReviewItem) => void;
}

export const ReviewQueueTable: React.FC<ReviewQueueTableProps> = ({
  items,
  selectedIndex,
  onSelectItem,
  onApprove,
  onReject,
  onAutoFix,
}) => {
  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
      <table className="w-full text-xs font-mono text-left">
        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-3">Priority</th>
            <th className="p-3">Product MPN</th>
            <th className="p-3">Field</th>
            <th className="p-3">Issue Type</th>
            <th className="p-3">Current Value</th>
            <th className="p-3">Suggested Value</th>
            <th className="p-3">Quality</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <tr
                key={item.review_id}
                onClick={() => onSelectItem(index)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-950/40 border-l-2 border-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <td className="p-3">
                  <Badge status={item.severity}>{item.severity}</Badge>
                </td>
                <td className="p-3 font-bold text-slate-900 dark:text-slate-200">{item.mfg_part_num}</td>
                <td className="p-3 text-blue-600 dark:text-blue-400">{item.field_name || item.field || 'General'}</td>
                <td className="p-3 text-slate-700 dark:text-slate-300">{item.issue_type}</td>
                <td className="p-3 text-amber-800 dark:text-amber-300 bg-slate-100 dark:bg-slate-950/60 rounded max-w-xs truncate">{item.current_value}</td>
                <td className="p-3 text-emerald-800 dark:text-emerald-400 bg-slate-100 dark:bg-slate-950/60 rounded max-w-xs truncate">{item.suggested_value}</td>
                <td className="p-3 font-bold text-slate-800 dark:text-slate-300">
                  {typeof item.quality_score === 'number' ? item.quality_score.toFixed(1) : (item.quality_score ?? 'N/A')}
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => onApprove(item)} className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onAutoFix(item)} className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950">
                      <Wand2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReject(item)} className="text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
