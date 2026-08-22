'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '../../types/product';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Eye, CheckSquare } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
}

export const ProductTable: React.FC<ProductTableProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500 font-mono shadow-sm space-y-3">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No products available.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Upload a catalogue to begin enrichment.</p>
        <Link href="/upload" className="inline-block mt-2">
          <Button size="sm" variant="primary">Upload Catalogue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
      <table className="w-full text-xs font-mono text-left">
        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-3">Product Name</th>
            <th className="p-3">MPN</th>
            <th className="p-3">Manufacturer</th>
            <th className="p-3">Brand</th>
            <th className="p-3">Classpath</th>
            <th className="p-3">Quality Score</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">{p.content.product_name}</td>
              <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{p.identity.mfg_part_num}</td>
              <td className="p-3 text-slate-700 dark:text-slate-300">{p.identity.manufacturer.canonical_value}</td>
              <td className="p-3 text-emerald-600 dark:text-emerald-400">{p.identity.brand.canonical_value}</td>
              <td className="p-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{p.classification.classpath}</td>
              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                {p.quality.overall_score.toFixed(1)} / 100
              </td>
              <td className="p-3">
                <Badge status={p.quality.status}>{p.quality.status}</Badge>
              </td>
              <td className="p-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/products/${p.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3.5 h-3.5" /> Canvas View
                    </Button>
                  </Link>
                  {p.requires_review && (
                    <Link href="/review">
                      <Button size="sm" variant="secondary" className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                        <CheckSquare className="w-3.5 h-3.5" /> Review
                      </Button>
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
