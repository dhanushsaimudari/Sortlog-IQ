'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PdfEvidenceViewer } from '../../components/evidence/PdfEvidenceViewer';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileSearch, Upload } from 'lucide-react';
import { fetchProducts } from '../../lib/api/products';
import { fetchEvidenceByProduct } from '../../lib/api/evidence';
import { Product } from '../../types/product';

export default function EvidencePage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    setLoading(true);
    const prodRes = await fetchProducts({ limit: 1 });
    if (prodRes.items.length > 0) {
      const activeProd = prodRes.items[0];
      setProduct(activeProd);
      const ev = await fetchEvidenceByProduct(activeProd.id);
      setEvidenceList(ev.length > 0 ? ev : (activeProd as any).evidence || []);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Source Evidence Document Viewer <FileSearch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Trace extracted technical specifications to exact bounding box coordinates in source manufacturer spec sheet PDFs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {product ? (
            <>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Product: {product.identity?.mfg_part_num || product.id}
              </span>
              <Badge status="VALID">PDF.js Active</Badge>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-mono">No Product Selected</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
          Loading evidence document coordinates...
        </div>
      ) : !product ? (
        <Card className="p-12 text-center space-y-4 max-w-2xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <FileSearch className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Evidence Available</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
              Upload product datasheets or catalogue feeds to inspect bounding box PDF evidence.
            </p>
          </div>
          <Link href="/upload">
            <Button size="md" variant="primary" className="mx-auto">
              <Upload className="w-4 h-4" /> Upload Catalogue Data
            </Button>
          </Link>
        </Card>
      ) : (
        <PdfEvidenceViewer evidenceList={evidenceList} />
      )}
    </div>
  );
}
