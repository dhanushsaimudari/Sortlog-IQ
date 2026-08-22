'use client';

import React, { useState, useEffect } from 'react';
import { EvaluationResult } from '../../types/evaluation';
import { fetchEvaluationResults, triggerEvaluationRun } from '../../lib/api/evaluation';
import { MetricCards } from '../../components/evaluation/MetricCards';
import { AccuracyChart } from '../../components/evaluation/AccuracyChart';
import { ComparisonTable } from '../../components/evaluation/ComparisonTable';
import { ErrorExplorer } from '../../components/evaluation/ErrorExplorer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FlaskConical, Play } from 'lucide-react';

export default function EvaluationPage() {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEval();

    const handleUpdate = () => loadEval();
    window.addEventListener('session-changed', handleUpdate);
    window.addEventListener('catalog-updated', handleUpdate);

    return () => {
      window.removeEventListener('session-changed', handleUpdate);
      window.removeEventListener('catalog-updated', handleUpdate);
    };
  }, []);

  const loadEval = async () => {
    setLoading(true);
    const data = await fetchEvaluationResults();
    setEvaluation(data);
    setLoading(false);
  };

  const handleRunEval = async () => {
    setLoading(true);
    const res = await triggerEvaluationRun();
    setEvaluation(res);
    setLoading(false);
  };

  const filteredDiscrepancies = evaluation?.discrepancies
    ? selectedFilterCategory
      ? evaluation.discrepancies.filter((d) => d.category === selectedFilterCategory)
      : evaluation.discrepancies
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Evaluation Lab <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Automated quality evaluation engine evaluating active session product compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={handleRunEval}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Play className="w-3.5 h-3.5" /> Run Session Evaluation
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
          Calculating evaluation metrics...
        </div>
      ) : !evaluation || evaluation.products_evaluated === 0 ? (
        <Card className="p-12 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 border border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">No evaluation has been run.</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Upload product data into the active session and run an evaluation to view precision, recall, and compliance metrics.
            </p>
          </div>
          <Button size="md" variant="primary" onClick={handleRunEval} className="mx-auto bg-purple-600 hover:bg-purple-500 text-white">
            <Play className="w-4 h-4" /> Run Evaluation
          </Button>
        </Card>
      ) : (
        <>
          {/* Metric Callout Cards */}
          <MetricCards evaluation={evaluation} />

          {/* Accuracy Chart & Error Explorer Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccuracyChart domainScores={evaluation.domain_scores} />
            <ErrorExplorer categoryCounts={evaluation.category_counts} onSelectCategory={setSelectedFilterCategory} />
          </div>

          {/* Comparison Discrepancy Table */}
          <ComparisonTable discrepancies={filteredDiscrepancies} />
        </>
      )}
    </div>
  );
}
