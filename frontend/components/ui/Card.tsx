import React from 'react';
import { cn } from '../../lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div
    {...props}
    className={cn('bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-4 text-slate-800 dark:text-slate-200 transition-colors duration-200', className)}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; className?: string }> = ({ title, subtitle, action, className }) => (
  <div className={cn('flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800', className)}>
    <div>
      <h3 className={cn('font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider font-mono')}>{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
