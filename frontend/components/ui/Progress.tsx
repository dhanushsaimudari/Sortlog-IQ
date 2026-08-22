import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number; // 0 - 100
  color?: 'emerald' | 'amber' | 'rose' | 'blue';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, color = 'blue', className }) => {
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
  };

  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all duration-300 rounded-full', colors[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
