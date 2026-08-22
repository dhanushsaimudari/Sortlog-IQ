import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQualityColor(score: number): string {
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800';
  if (score >= 80) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
  return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800';
}

export function formatStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'VALID':
    case 'EXCELLENT':
    case 'PASS':
    case 'MATCHED':
    case 'COMPLETED':
      return {
        bg: 'bg-emerald-100/80 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
        text: 'text-emerald-600 dark:text-emerald-400',
        label: 'VALID'
      };
    case 'REVIEW':
    case 'NEEDS_REVIEW':
    case 'WARNING':
    case 'PROCESSING':
      return {
        bg: 'bg-amber-100/80 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
        text: 'text-amber-600 dark:text-amber-400',
        label: 'REVIEW'
      };
    case 'BLOCKED':
    case 'CRITICAL':
    case 'FAIL':
    case 'FAILED':
      return {
        bg: 'bg-rose-100/80 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300',
        text: 'text-rose-600 dark:text-rose-400',
        label: 'BLOCKED'
      };
    case 'INFO':
    case 'NORMALIZED':
      return {
        bg: 'bg-blue-100/80 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300',
        text: 'text-blue-600 dark:text-blue-400',
        label: 'INFO'
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-400',
        text: 'text-slate-600 dark:text-slate-400',
        label: 'UNKNOWN'
      };
  }
}
