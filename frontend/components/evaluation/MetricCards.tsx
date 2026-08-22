'use client';

import React from 'react';
import { EvaluationResult } from '../../types/evaluation';
import { Card } from '../ui/Card';
import { ShieldCheck, CheckCircle2, Wand2, Target } from 'lucide-react';

interface MetricCardsProps {
  evaluation: EvaluationResult;
  onSelectMetric?: (metricKey: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ evaluation, onSelectMetric }) => {
  const overallAcc = evaluation?.overall_accuracy ?? 0;
  const f1 = evaluation?.f1_score ?? 0;
  const prec = evaluation?.precision_score ?? 0;
  const lov = evaluation?.lov_compliance_rate ?? 0;
  const uom = evaluation?.uom_compliance_rate ?? 0;
  const autofix = evaluation?.autofix_success_rate ?? evaluation?.auto_fix_success_rate ?? 0;
  const rouge = evaluation?.rouge_l_score ?? 0;
  const total = evaluation?.total_evaluated ?? evaluation?.products_evaluated ?? 0;

  const cards = [
    { title: 'Overall Accuracy', value: `${overallAcc.toFixed(1)}%`, sub: `${total} Items Evaluated`, icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', key: 'overall' },
    { title: 'Field F1 Score', value: f1.toFixed(3), sub: `Precision: ${(prec * 100).toFixed(0)}%`, icon: Target, color: 'text-blue-600 dark:text-blue-400', key: 'f1' },
    { title: 'LOV Compliance', value: `${lov.toFixed(1)}%`, sub: 'Controlled Vocabulary Match', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', key: 'lov' },
    { title: 'UOM Compliance', value: `${uom.toFixed(1)}%`, sub: 'Pint Standard Abbreviation', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', key: 'uom' },
    { title: 'Auto-Fix Success', value: `${autofix.toFixed(1)}%`, sub: 'Deterministic Corrections', icon: Wand2, color: 'text-amber-600 dark:text-amber-400', key: 'autofix' },
    { title: 'ROUGE-L Score', value: rouge.toFixed(3), sub: 'Description Text Similarity', icon: Target, color: 'text-purple-600 dark:text-purple-400', key: 'rouge' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card
            key={i}
            onClick={() => onSelectMetric && onSelectMetric(c.key)}
            className="cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div>
              <span className={`text-2xl font-bold font-mono ${c.color}`}>{c.value}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5">{c.sub}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
