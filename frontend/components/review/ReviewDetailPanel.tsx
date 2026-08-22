'use client';

import React from 'react';
import { ReviewItem } from '../../types/review';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Check, X, Wand2, Edit3 } from 'lucide-react';

interface ReviewDetailPanelProps {
  item: ReviewItem | null;
  onApprove: (item: ReviewItem) => void;
  onReject: (item: ReviewItem) => void;
  onAutoFix: (item: ReviewItem) => void;
}

export const ReviewDetailPanel: React.FC<ReviewDetailPanelProps> = ({
  item,
  onApprove,
  onReject,
  onAutoFix,
}) => {
  if (!item) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <p className="text-xs font-mono">Select an item from the review queue to inspect details</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <CardHeader title="Review Item Inspection" subtitle={`Product MPN: ${item.mfg_part_num}`} />

      <div className="space-y-3 text-xs font-mono">
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Issue Type</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{item.issue_type}</span>
          </div>
          <Badge status={item.severity}>{item.severity}</Badge>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block mb-1">Reason & Diagnostic Context</span>
          <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">{item.reason}</p>
        </div>

        {/* Diff Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Current Unvalidated Value</span>
            <span className="text-amber-700 dark:text-amber-300 font-bold block">{item.current_value}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Suggested Canonical Value</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold block">{item.suggested_value}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <Button variant="primary" size="sm" onClick={() => onApprove(item)} className="bg-emerald-600 hover:bg-emerald-500">
            <Check className="w-3.5 h-3.5" /> Approve (A)
          </Button>

          <Button variant="secondary" size="sm" onClick={() => onAutoFix(item)} className="border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">
            <Wand2 className="w-3.5 h-3.5" /> Auto-Fix (F)
          </Button>

          <Button variant="outline" size="sm" onClick={() => onReject(item)} className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950">
            <X className="w-3.5 h-3.5" /> Reject (R)
          </Button>

          <Button variant="outline" size="sm">
            <Edit3 className="w-3.5 h-3.5" /> Edit (E)
          </Button>
        </div>
      </div>
    </Card>
  );
};
