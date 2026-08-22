'use client';

import React, { useState } from 'react';
import { Product, ProductAttribute } from '../../types/product';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FieldWhyDrawer } from './FieldWhyDrawer';
import { Info, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface EnrichmentCanvasProps {
  product: Product;
}

export const EnrichmentCanvas: React.FC<EnrichmentCanvasProps> = ({ product }) => {
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);

  if (!product) return null;

  const source = product.source || product.source_data || {} as any;
  const mfgPartNum = source.mfg_part_num || product.identity?.mfg_part_num || product.id || 'N/A';
  const partDesc = source.part_desc || product.content?.product_name || 'N/A';
  const e1Brand = source.e1_brand || product.identity?.brand?.raw_value || 'N/A';
  const unilogBrand = source.unilog_brand || product.identity?.brand?.canonical_value || 'N/A';
  const partManuf = source.part_manuf || product.identity?.manufacturer?.raw_value || 'N/A';

  const confidenceScore = ((product.classification?.confidence_score ?? product.classification?.confidence ?? 0) * 100).toFixed(0);
  const attributes = product.attributes || [];
  const qualityScore = (product.quality?.overall_score ?? 0).toFixed(1);
  const qualityStatus = product.quality?.status || 'PASS';

  return (
    <div className="space-y-6">
      {/* 3-Column Large Canvas Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL 1: RAW INPUT */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between">
          <div>
            <CardHeader
              title="1. RAW SUPPLIER INPUT"
              subtitle="Original uncleaned product record as received"
            />
            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Mfg Part Number</span>
                <span className="text-slate-900 dark:text-slate-200 font-bold">{mfgPartNum}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Raw Description</span>
                <span className="text-amber-700 dark:text-amber-300 font-semibold leading-snug block">
                  {partDesc}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Supplier Brand (E1)</span>
                <span className="text-slate-600 dark:text-slate-400">{e1Brand}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Unilog Brand Feed</span>
                <span className="text-slate-600 dark:text-slate-400">{unilogBrand}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Supplier Manufacturer</span>
                <span className="text-slate-700 dark:text-slate-300">{partManuf}</span>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-4 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>RAW DATA — Preserved unchanged for audit traceability</span>
          </div>
        </Card>

        {/* PANEL 2: AI UNDERSTANDING */}
        <Card className="border-blue-200 dark:border-blue-900/40 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between">
          <div>
            <CardHeader
              title="2. AI UNDERSTANDING"
              subtitle="Gemini semantic extraction & feature interpretation"
              action={<Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            />
            <div className="space-y-2.5 text-xs font-mono">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 p-2.5 rounded flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase block">Product Noun</span>
                  <span className="text-blue-900 dark:text-blue-100 font-bold">{product.content?.product_name || 'N/A'}</span>
                </div>
                <span className="text-[10px] text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-800">
                  Conf: {confidenceScore}%
                </span>
              </div>

              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block pt-1">
                Extracted Attributes (Click any to inspect)
              </span>

              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedAttribute(attr)}
                  className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 p-2.5 rounded cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400">{attr.label}:</span>
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {attr.normalized_value || attr.raw_value} {attr.uom || ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={attr.status}>{attr.status}</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-4 text-[10px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Click any field to open "Why this value?" metadata inspection</span>
          </div>
        </Card>

        {/* PANEL 3: COMMERCE-READY PRODUCT */}
        <Card className="border-emerald-200 dark:border-emerald-900/40 bg-white/90 dark:bg-slate-900/90 flex flex-col justify-between">
          <div>
            <CardHeader
              title="3. COMMERCE-READY PRODUCT"
              subtitle="Validated, search-ready catalog publication state"
              action={<CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            />
            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Canonical Manufacturer</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">{product.identity?.manufacturer?.canonical_value || 'N/A'}</span>
                </div>
                <Badge status="VALID">MATCHED</Badge>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Canonical Brand</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">{product.identity?.brand?.canonical_value || 'N/A'}</span>
                </div>
                <Badge status="VALID">MATCHED</Badge>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Unilog Classpath</span>
                <span className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed block">
                  {product.classification?.classpath || 'N/A'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Target Short Description</span>
                <span className="text-slate-900 dark:text-slate-100 text-[11px] leading-relaxed block font-sans">
                  {product.content?.short_desc || 'N/A'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Readiness Quality Score</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{qualityScore} / 100</span>
                </div>
                <Badge status={qualityStatus}>{qualityStatus}</Badge>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-4 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for 252-Column Unilog Delivery CSV Export</span>
          </div>
        </Card>
      </div>

      {/* Field Inspection Drawer Popover */}
      <FieldWhyDrawer attribute={selectedAttribute} onClose={() => setSelectedAttribute(null)} />
    </div>
  );
};
