'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme } from '../../lib/theme-context';
import { getActiveSessionId } from '../../lib/session';
import { Upload, FileSpreadsheet } from 'lucide-react';

export default function DashboardPage() {
  const { theme } = useTheme();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    loadAnalytics();

    const handleUpdate = () => loadAnalytics();
    window.addEventListener('session-changed', handleUpdate);
    window.addEventListener('catalog-updated', handleUpdate);

    return () => {
      window.removeEventListener('session-changed', handleUpdate);
      window.removeEventListener('catalog-updated', handleUpdate);
    };
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const sessionId = getActiveSessionId();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
      const res = await fetch(`${apiBase}/sessions/${sessionId}/analytics`);
      if (res.ok) {
        setAnalytics(await res.json());
      }
    } catch (e) {}
    setLoading(false);
  };

  const totalProds = analytics?.total_products_processed || 0;
  const overallQuality = analytics?.overall_quality_score || 0;
  const totalAttrs = analytics?.total_attributes_generated || 0;
  const pendingReviews = analytics?.pending_review_count || 0;
  const blockedCount = analytics?.blocked_count || 0;
  const autoFixedCount = analytics?.auto_fixed_count || 0;
  const evalAccuracy = analytics?.evaluation_accuracy || 0;
  const domainScores = analytics?.quality_domain_scores || {
    classification: 0,
    manufacturer: 0,
    brand: 0,
    lov_values: 0,
    uom_format: 0,
    descriptions: 0,
  };

  const errorData = [
    { name: 'Pending Human Review', value: pendingReviews || (totalProds > 0 ? 1 : 0), color: '#f59e0b' },
    { name: 'Blocked Validation Criticals', value: blockedCount || 0, color: '#ef4444' },
    { name: 'Auto-Fixed Rules', value: autoFixedCount || 0, color: '#10b981' },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-5xl mx-auto">
        Loading executive dashboard metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Executive Data Quality Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Real-time catalog readiness, error distribution, and validation metrics
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {totalProds > 0 ? `${totalProds} SKUs Active` : 'No Active Catalogue'}
        </span>
      </div>

      {totalProds === 0 ? (
        /* SESSION EMPTY STATE */
        <Card className="p-12 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Active Catalogue</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Upload a real product catalogue (CSV, XLSX, PDF, Images) to begin AI enrichment and view real-time quality scoring.
            </p>
          </div>
          <Link href="/upload">
            <Button size="md" variant="primary" className="mx-auto">
              <Upload className="w-4 h-4" /> Upload Catalogue
            </Button>
          </Link>
        </Card>
      ) : (
        /* REAL DATA DASHBOARD */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CATALOG QUALITY CALLOUT */}
            <Card className="lg:col-span-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6">
              <div>
                <CardHeader title="CATALOG QUALITY" subtitle="Weighted overall dataset readiness score" />
                <div className="my-6 text-center">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-6xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {overallQuality.toFixed(1)}
                    </span>
                    <span className="text-xl text-slate-400 dark:text-slate-500 font-bold">/ 100</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-sans">
                    {totalProds} SKUs currently enriched in active session.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-500">Benchmark Mode:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">252-Column Unilog Schema</span>
              </div>
            </Card>

            {/* BREAKDOWN PROGRESS BARS */}
            <Card className="lg:col-span-2 space-y-3 p-6">
              <CardHeader title="QUALITY DOMAIN BREAKDOWN" subtitle="Compliance scores across functional domain groups" />

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Classification Compliance</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{domainScores.classification.toFixed(1)}%</span>
                  </div>
                  <Progress value={domainScores.classification} color="emerald" />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Manufacturer Normalization</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{domainScores.manufacturer.toFixed(1)}%</span>
                  </div>
                  <Progress value={domainScores.manufacturer} color="emerald" />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Brand Normalization</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{domainScores.brand.toFixed(1)}%</span>
                  </div>
                  <Progress value={domainScores.brand} color="emerald" />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>LOV Value Compliance</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{domainScores.lov_values.toFixed(1)}%</span>
                  </div>
                  <Progress value={domainScores.lov_values} color="emerald" />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>UOM Standard Compliance</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{domainScores.uom_format.toFixed(1)}%</span>
                  </div>
                  <Progress value={domainScores.uom_format} color="emerald" />
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                    <span>Description Completeness</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{domainScores.descriptions.toFixed(1)}%</span>
                  </div>
                  <Progress value={domainScores.descriptions} color="emerald" />
                </div>
              </div>
            </Card>
          </div>

          {/* PROCESSING METRIC CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Products Processed</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{totalProds}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Session SKUs</span>
            </Card>

            <Card className="p-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Attributes Generated</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalAttrs}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">EAV Triplets</span>
            </Card>

            <Card className="p-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Requiring Review</span>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{pendingReviews}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Review Queue</span>
            </Card>

            <Card className="p-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Products Blocked</span>
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{blockedCount}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Critical Failures</span>
            </Card>

            <Card className="p-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Auto-Fixed Errors</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{autoFixedCount}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Deterministic Fixes</span>
            </Card>

            <Card className="p-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Evaluation Accuracy</span>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {evalAccuracy > 0 ? `${evalAccuracy.toFixed(1)}%` : 'Not run'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">Accuracy Metric</span>
            </Card>
          </div>

          {/* ERROR DISTRIBUTION CHART */}
          {errorData.length > 0 && (
            <Card className="p-6">
              <CardHeader title="Rule Error Distribution" subtitle="Categorized validation warnings and rule status" />
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {errorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: isDark ? '#94a3b8' : '#475569',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
