'use client';

import React from 'react';
import { ValidationRuleResult } from '../../types/product';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ValidationPanelProps {
  validations: ValidationRuleResult[];
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validations }) => {
  const getIcon = (status: string, severity: string) => {
    if (status === 'PASS' || status === 'FIXED') return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    if (severity === 'CRITICAL' || status === 'FAIL') return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
    if (severity === 'WARNING' || status === 'REVIEW') return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
    return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />;
  };

  return (
    <Card className="space-y-4">
      <CardHeader title="Quality Checks & Rule Verification" subtitle="Deterministic rule engine evaluation results" />

      <div className="space-y-2 font-mono text-xs">
        {validations.map((v, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getIcon(v.status, v.severity)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{v.rule_name}</span>
                  <span className="text-[10px] text-slate-500">({v.rule_id})</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{v.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={v.status}>{v.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
