'use client';

import React from 'react';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcutsHelp: React.FC = () => {
  const shortcuts = [
    { key: 'A', label: 'Approve' },
    { key: 'R', label: 'Reject' },
    { key: 'E', label: 'Edit' },
    { key: 'F', label: 'Auto-Fix' },
    { key: 'N', label: 'Next' },
    { key: 'P', label: 'Prev' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 flex items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 shadow-xs transition-colors duration-200">
      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
        <Keyboard className="w-3.5 h-3.5" />
        <span className="font-semibold text-[11px] uppercase">Review Shortcuts:</span>
      </div>
      <div className="flex items-center gap-3">
        {shortcuts.map((s) => (
          <div key={s.key} className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold">
              {s.key}
            </kbd>
            <span className="text-[11px]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
