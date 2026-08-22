'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { DomainScores } from '../../types/evaluation';
import { Card, CardHeader } from '../ui/Card';
import { useTheme } from '../../lib/theme-context';

interface AccuracyChartProps {
  domainScores: DomainScores;
}

export const AccuracyChart: React.FC<AccuracyChartProps> = ({ domainScores }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const scores = domainScores || {
    identifiers: 0,
    brand_normalization: 0,
    taxonomy_classification: 0,
    attribute_extraction: 0,
    description_generation: 0,
    digital_assets: 0
  };

  const data = [
    { name: 'Identifiers', score: scores.identifiers || 0 },
    { name: 'Brand Normalization', score: scores.brand_normalization || 0 },
    { name: 'Classification', score: scores.taxonomy_classification || 0 },
    { name: 'Attribute Extraction', score: scores.attribute_extraction || 0 },
    { name: 'Description Gen', score: scores.description_generation || 0 },
    { name: 'Digital Assets', score: scores.digital_assets || 0 },
  ];

  return (
    <Card className="space-y-4">
      <CardHeader title="Domain Accuracy Breakdown" subtitle="Accuracy scores across functional output domains" />
      <div className="h-64 w-full text-xs font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#475569'} tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
            <YAxis domain={[0, 100]} stroke={isDark ? '#64748b' : '#475569'} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#334155' : '#cbd5e1',
                color: isDark ? '#f8fafc' : '#0f172a',
                borderRadius: '6px',
                fontSize: '12px'
              }}
              itemStyle={{ color: isDark ? '#38bdf8' : '#0284c7' }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.score >= 90 ? '#10b981' : entry.score >= 80 ? '#3b82f6' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
