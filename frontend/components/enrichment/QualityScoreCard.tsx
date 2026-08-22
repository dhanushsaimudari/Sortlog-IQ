'use client';

import React from 'react';
import { QualityScore } from '../../types/product';
import { Card, CardHeader } from '../ui/Card';
import { Progress } from '../ui/Progress';

interface QualityScoreCardProps {
  quality: QualityScore;
}

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({ quality }) => {
  if (!quality) return null;

  const overallScore = quality.overall_score ?? 0;
  const status = quality.status || 'PASS';

  const subScores = (quality as any).sub_scores || {};
  const breakdown = quality.breakdown || {};

  const classScore = breakdown.classification ?? subScores.classification ?? 85;
  const brandScore = breakdown.brand ?? subScores.brand_normalization ?? 90;
  const lovScore = breakdown.lov ?? subScores.attributes ?? 80;
  const uomScore = breakdown.uom ?? subScores.attributes ?? 95;
  const descScore = breakdown.descriptions ?? subScores.descriptions ?? 85;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getProgressColor = (score: number): 'emerald' | 'amber' | 'rose' => {
    if (score >= 90) return 'emerald';
    if (score >= 80) return 'amber';
    return 'rose';
  };

  return (
    <Card className="space-y-4">
      <CardHeader title="Product Quality Score" subtitle="Explainable deterministic quality weighting" />

      {/* Main Score Callout */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Overall Readiness</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold font-mono ${getScoreColor(overallScore)}`}>
              {overallScore.toFixed(1)}
            </span>
            <span className="text-sm font-mono text-slate-400 dark:text-slate-500">/ 100</span>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            STATUS: {status}
          </span>
        </div>
      </div>

      {/* Sub-score Breakdown */}
      <div className="space-y-3 text-xs font-mono">
        <div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span>Classification Match (15%)</span>
            <span className="text-slate-800 dark:text-slate-200">{classScore}%</span>
          </div>
          <Progress value={classScore} color={getProgressColor(classScore)} />
        </div>

        <div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span>Brand Normalization (20%)</span>
            <span className="text-slate-800 dark:text-slate-200">{brandScore}%</span>
          </div>
          <Progress value={brandScore} color={getProgressColor(brandScore)} />
        </div>

        <div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span>LOV & Attribute Extraction (25%)</span>
            <span className="text-slate-800 dark:text-slate-200">{lovScore}%</span>
          </div>
          <Progress value={lovScore} color={getProgressColor(lovScore)} />
        </div>

        <div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span>UOM Compliance (10%)</span>
            <span className="text-slate-800 dark:text-slate-200">{uomScore}%</span>
          </div>
          <Progress value={uomScore} color={getProgressColor(uomScore)} />
        </div>

        <div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
            <span>Description Formulas (20%)</span>
            <span className="text-slate-800 dark:text-slate-200">{descScore}%</span>
          </div>
          <Progress value={descScore} color={getProgressColor(descScore)} />
        </div>
      </div>
    </Card>
  );
};
