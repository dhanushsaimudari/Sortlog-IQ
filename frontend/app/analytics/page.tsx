'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { BarChart3, Upload, FileSpreadsheet } from 'lucide-react';
import { useTheme } from '../../lib/theme-context';
import { getActiveSessionId } from '../../lib/session';

export default function AnalyticsPage() {
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
  const domainScores = analytics?.quality_domain_scores || {
    classification: 0,
    manufacturer: 0,
    brand: 0,
    lov_values: 0,
    uom_format: 0,
    descriptions: 0,
  };

  const complianceData = [
    { metric: 'Classification', rate: domainScores.classification },
    { metric: 'Manufacturer', rate: domainScores.manufacturer },
    { metric: 'Brand', rate: domainScores.brand },
    { metric: 'LOV Values', rate: domainScores.lov_values },
    { metric: 'UOM Format', rate: domainScores.uom_format },
    { metric: 'Descriptions', rate: domainScores.descriptions },
  ];

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-5xl mx-auto">
        Loading catalog intelligence analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Catalog Intelligence Analytics <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Active session compliance rates, validation metrics, and attribute distribution
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {totalProds > 0 ? `${totalProds} Session Items` : 'No Active Catalogue'}
        </span>
      </div>

      {totalProds === 0 ? (
        <Card className="p-12 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">No analytics available yet.</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Process a product catalogue to generate domain compliance statistics and attribute metrics.
            </p>
          </div>
          <Link href="/upload">
            <Button size="md" variant="primary" className="mx-auto">
              <Upload className="w-4 h-4" /> Upload Catalogue
            </Button>
          </Link>
        </Card>
      ) : (
        /* REAL ANALYTICS CHARTS */
        <div className="grid grid-cols-1 gap-6">
          <Card className="space-y-4 p-6">
            <CardHeader title="Schema Compliance Rates (%)" subtitle="Current session compliance metrics by functional group" />
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="metric"
                    stroke={isDark ? '#64748b' : '#475569'}
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 100]} stroke={isDark ? '#64748b' : '#475569'} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
