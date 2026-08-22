'use client';

import React, { useState } from 'react';
import { Wand2, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface AutoFixCardProps {
  ruleId: string;
  issueName: string;
  currentValue: string;
  expectedValue: string;
  reason: string;
  onApplyFix?: () => void;
}

export const AutoFixCard: React.FC<AutoFixCardProps> = ({
  ruleId,
  issueName,
  currentValue,
  expectedValue,
  reason,
  onApplyFix,
}) => {
  const [isFixed, setIsFixed] = useState(false);

  const handleFix = () => {
    setIsFixed(true);
    if (onApplyFix) onApplyFix();
  };

  return (
    <div className={`p-4 rounded-lg border font-mono text-xs transition-all ${
      isFixed
        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            {ruleId}
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{issueName}</span>
        </div>
        {isFixed ? (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Check className="w-3.5 h-3.5" /> FIXED
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">AUTO-FIX AVAILABLE</span>
        )}
      </div>

      <p className="text-slate-600 dark:text-slate-400 mb-3">{reason}</p>

      {/* Before / After Diff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="bg-white dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block mb-1">Current State</span>
          <span className={isFixed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-amber-700 dark:text-amber-300 font-bold'}>
            {currentValue}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-950 p-2.5 rounded border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase block mb-1">Target Normalized State</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{expectedValue}</span>
        </div>
      </div>

      {!isFixed ? (
        <Button size="sm" variant="secondary" onClick={handleFix} className="w-full border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50">
          <Wand2 className="w-3.5 h-3.5" />
          Apply Deterministic Auto-Fix
        </Button>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 pt-1">
          <span>✓ Rule re-validated successfully</span>
          <button onClick={() => setIsFixed(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
