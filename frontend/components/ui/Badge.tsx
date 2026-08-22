import React from 'react';
import { cn, formatStatusBadge } from '../../lib/utils';

interface BadgeProps {
  status?: string;
  variant?: 'valid' | 'review' | 'blocked' | 'info' | 'unknown' | 'demo';
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, className, children }) => {
  if (status) {
    const info = formatStatusBadge(status);
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border shadow-xs', info.bg, className)}>
        {children || info.label}
      </span>
    );
  }

  const variants = {
    valid: 'bg-emerald-100/80 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
    review: 'bg-amber-100/80 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
    blocked: 'bg-rose-100/80 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300',
    info: 'bg-blue-100/80 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300',
    unknown: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400',
    demo: 'bg-purple-100/80 dark:bg-purple-950/80 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-mono text-[10px]',
  };

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border shadow-xs', variants[variant || 'unknown'], className)}>
      {children}
    </span>
  );
};
