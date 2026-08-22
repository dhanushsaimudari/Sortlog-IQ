'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Product } from '../../../types/product';
import { fetchProductById, reprocessProduct } from '../../../lib/api/products';
import { EnrichmentCanvas } from '../../../components/enrichment/EnrichmentCanvas';
import { QualityScoreCard } from '../../../components/enrichment/QualityScoreCard';
import { DescriptionTabs } from '../../../components/enrichment/DescriptionTabs';
import { ValidationPanel } from '../../../components/enrichment/ValidationPanel';
import { AutoFixCard } from '../../../components/enrichment/AutoFixCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || 'prod-101';
  const [product, setProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'content' | 'validation' | 'autofix' | 'audit'>('canvas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const p = await fetchProductById(id);
    setProduct(p);
    setLoading(false);
  };

  const handleReprocess = async () => {
    if (!product) return;
    const updated = await reprocessProduct(product.id);
    setProduct(updated);
  };

  if (loading || !product) {
    return (
      <div className="p-12 text-center font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-5xl mx-auto shadow-sm">
        Loading product detail...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 font-mono">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/products" className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
            </Link>
            <span className="text-slate-400 dark:text-slate-600">&bull;</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">{product.identity.mfg_part_num}</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            {product.content.product_name} &bull; {product.identity.brand.canonical_value}
            <Badge status={product.quality.status}>{product.quality.status}</Badge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            {product.classification.classpath}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReprocess}>
            <RefreshCw className="w-3.5 h-3.5" /> Re-Process Item
          </Button>

          {product.requires_review && (
            <Link href="/review">
              <Button variant="secondary" size="sm" className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                Review Exception Item
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'canvas' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Enrichment Canvas (RAW ➔ FINAL)
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'content' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Generated Content Formats
        </button>

        <button
          onClick={() => setActiveTab('validation')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'validation' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Quality Checks ({product.validations.length})
        </button>

        <button
          onClick={() => setActiveTab('autofix')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'autofix' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Auto-Fix Actions
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
            activeTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Audit History
        </button>
      </div>

      {/* TAB CONTENT: ENRICHMENT CANVAS */}
      {activeTab === 'canvas' && (
        <div className="space-y-6">
          <EnrichmentCanvas product={product} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DescriptionTabs content={product.content} />
            </div>
            <div className="lg:col-span-1">
              <QualityScoreCard quality={product.quality} />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GENERATED CONTENT */}
      {activeTab === 'content' && (
        <DescriptionTabs content={product.content} />
      )}

      {/* TAB CONTENT: VALIDATION CHECKS */}
      {activeTab === 'validation' && (
        <ValidationPanel validations={product.validations} />
      )}

      {/* TAB CONTENT: AUTO-FIX ACTIONS */}
      {activeTab === 'autofix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between font-mono text-xs">
            <h2 className="font-bold text-slate-800 dark:text-slate-200 uppercase">Deterministic Auto-Fix Engine</h2>
            <Badge status="INFO">Rule-Based Deterministic Fixes</Badge>
          </div>

          {product.identity.brand.status === "NORMALIZED" && (
            <AutoFixCard
              ruleId="R-BRD-001"
              issueName="Brand Trademark Symbol Normalization"
              currentValue={product.source_data.e1_brand || product.source_data.unilog_brand || product.identity.brand.raw_value}
              expectedValue={product.identity.brand.canonical_value}
              reason="Canonical brand enforcement rule appended ® registered trademark symbol."
            />
          )}

          {product.identity.manufacturer.status === "NORMALIZED" && (
            <AutoFixCard
              ruleId="R-MFR-001"
              issueName="Manufacturer Canonical Standardization"
              currentValue={product.identity.manufacturer.raw_value}
              expectedValue={product.identity.manufacturer.canonical_value}
              reason="Normalized abbreviated distributor manufacturer code to canonical legal entity name."
            />
          )}

          {product.validations.filter(v => v.auto_fix_available).map((v, idx) => (
            <AutoFixCard
              key={idx}
              ruleId={v.rule_id}
              issueName={v.target_field}
              currentValue={v.current_value || "Raw Input"}
              expectedValue={v.expected_value || "Normalized"}
              reason={v.message}
            />
          ))}

          {!product.identity.brand.status.includes("NORMALIZED") &&
           !product.identity.manufacturer.status.includes("NORMALIZED") &&
           product.validations.filter(v => v.auto_fix_available).length === 0 && (
            <div className="p-8 text-center text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              No pending auto-fix transformations for this item. All fields are compliant.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <Card className="space-y-4 font-mono text-xs">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 uppercase">Product Lifecycle Audit Log</h2>
          <div className="space-y-2">
            {product.audit_trail.map((log, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded flex justify-between items-center">
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{log.event_type}</span>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">{log.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px]">{log.timestamp}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[10px]">Actor: {log.actor}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
