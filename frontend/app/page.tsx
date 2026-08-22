'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Upload, Sparkles, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { fetchProducts } from '../lib/api/products';
import { Product } from '../types/product';
import { getActiveSessionId } from '../lib/session';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    const handleUpdate = () => loadDashboardData();
    window.addEventListener('session-changed', handleUpdate);
    window.addEventListener('catalog-updated', handleUpdate);

    return () => {
      window.removeEventListener('session-changed', handleUpdate);
      window.removeEventListener('catalog-updated', handleUpdate);
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const prodRes = await fetchProducts({ limit: 5 });
    setProducts(prodRes.items);

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

  const totalProds = analytics?.total_products_processed || products.length || 0;
  const qualityScore = analytics?.overall_quality_score || 0;
  const pendingReviews = analytics?.pending_review_count || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-mono">
      {/* HERO SECTION */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 space-y-6 relative overflow-hidden transition-colors duration-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 max-w-3xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400">
              SORTOLOG IQ
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Industrial Product Enrichment Engine
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold font-mono text-slate-900 dark:text-slate-100 leading-tight">
            Turn messy data into commerce-ready intelligence.
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
            Upload manufacturer and distributor product feeds (CSV, XLSX, PDF, Images) to perform AI enrichment, automated taxonomy classification, rule validation, and Unilog 252-column export.
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Core Philosophy: <strong className="text-slate-800 dark:text-slate-200">AI proposes. Rules validate. Evidence supports. Humans decide.</strong></span>
          </div>
        </div>

        {/* CTA BUTTONS */}
        <div className="flex flex-wrap items-center gap-4 pt-2 relative z-10">
          <Link href="/upload">
            <Button size="lg" variant="primary">
              <Upload className="w-4 h-4" /> Upload Catalogue
            </Button>
          </Link>
          <Link href="/products">
            <Button size="lg" variant="secondary">
              Product Master
            </Button>
          </Link>
          <Link href="/evaluation">
            <Button size="lg" variant="outline">
              Evaluation Lab
            </Button>
          </Link>
        </div>
      </section>

      {/* QUICK METRICS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Dataset & Local-First Intelligence Overview
          </h2>
          {totalProds === 0 && <span className="text-xs text-slate-400">No active dataset loaded</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">Local Intelligence Ratio</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {analytics?.local_intelligence_ratio != null ? `${analytics.local_intelligence_ratio.toFixed(1)}%` : '100%'}
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Computed Locally First</span>
          </Card>

          <Card className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">AI Dependency Rate</span>
            <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {analytics?.ai_dependency_rate != null ? `${analytics.ai_dependency_rate.toFixed(1)}%` : '0%'}
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Semantic Gate AI Calls</span>
          </Card>

          <Card className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">Average Quality Score</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {totalProds > 0 ? `${qualityScore.toFixed(1)} / 100` : 'No data'}
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Explainable Weighting</span>
          </Card>

          <Card className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">Review Required</span>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {pendingReviews > 0 ? `${pendingReviews} Items` : '0'}
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Human Review Workbench</span>
          </Card>
        </div>
      </section>

      {/* RECENT PRODUCTS OR EMPTY STATE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Recent Enriched Catalog Items
          </h2>
          {totalProds > 0 && (
            <Link href="/products" className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center gap-1">
              View All Catalog Items <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {totalProds === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active Catalogue</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Upload a real product catalogue (CSV, XLSX, PDF, Images) to begin AI enrichment and quality validation.
            </p>
            <Link href="/upload">
              <Button size="md" variant="primary" className="mx-auto mt-2">
                <Upload className="w-4 h-4" /> Upload Catalogue
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">MPN</th>
                  <th className="p-3">Manufacturer</th>
                  <th className="p-3">Brand</th>
                  <th className="p-3">Classpath</th>
                  <th className="p-3">Quality</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-200">
                      {p.content?.product_name || p.identity?.mfg_part_num || p.id}
                    </td>
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{p.identity?.mfg_part_num}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{p.identity?.manufacturer?.canonical_value}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400">{p.identity?.brand?.canonical_value}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{p.classification?.classpath}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-200">
                      {p.quality?.overall_score ? p.quality.overall_score.toFixed(1) : '0.0'}
                    </td>
                    <td className="p-3 text-right">
                      <Badge status={p.quality?.status || 'INFO'}>{p.quality?.status || 'INGESTED'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
