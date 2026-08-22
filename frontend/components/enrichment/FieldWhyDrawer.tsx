'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ProductAttribute } from '../../types/product';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface FieldWhyDrawerProps {
  attribute: ProductAttribute | null;
  onClose: () => void;
}

export const FieldWhyDrawer: React.FC<FieldWhyDrawerProps> = ({ attribute, onClose }) => {
  if (!attribute) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto transition-colors duration-200">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-widest">Field Metadata Inspection</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{attribute.label}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why This Value Explanation */}
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 space-y-1">
            <span className="text-slate-500 font-mono text-[10px] uppercase">Raw Input Origin</span>
            <p className="font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
              {attribute.explanation?.raw_source || attribute.raw_value || 'Raw Description Text'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 space-y-1">
            <span className="text-slate-500 font-mono text-[10px] uppercase">AI Interpretation</span>
            <p className="font-mono text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
              {attribute.explanation?.ai_interpretation || attribute.normalized_value || attribute.raw_value}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-3 space-y-2">
            <span className="text-slate-500 font-mono text-[10px] uppercase">Deterministic Rule Verification</span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">LOV Schema Compliance:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{attribute.explanation?.lov_status || 'MATCHED ✅'}</span>
              </div>
              <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">UOM Formatting Rule:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{attribute.explanation?.uom_status || 'Pint Approved'}</span>
              </div>
              <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Validation Result:</span>
                <Badge status={attribute.status}>{attribute.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
          Close Inspection
        </Button>
      </div>
    </div>
  );
};
