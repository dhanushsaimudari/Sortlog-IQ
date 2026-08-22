'use client';

import React, { useState } from 'react';
import { SourceEvidence } from '../../types/product';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FileText, Info } from 'lucide-react';

interface PdfEvidenceViewerProps {
  evidenceList: SourceEvidence[];
}

export const PdfEvidenceViewer: React.FC<PdfEvidenceViewerProps> = ({ evidenceList }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<SourceEvidence | null>(
    evidenceList.length > 0 ? evidenceList[0] : null
  );

  if (evidenceList.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
        <Info className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
        <h3 className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">No Evidence Documents Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Source PDF spec sheets or manufacturer datasheets have not been linked for this product.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-mono text-xs">
      
      {/* LEFT: ATTRIBUTES WITH EVIDENCE */}
      <Card className="lg:col-span-1 space-y-3">
        <CardHeader title="Attributes with Evidence" subtitle="Select to navigate bounding box" />
        <div className="space-y-2">
          {evidenceList.map((ev, i) => {
            const isSelected = selectedEvidence?.evidence_id === ev.evidence_id;
            return (
              <div
                key={i}
                onClick={() => setSelectedEvidence(ev)}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-500 text-blue-900 dark:text-blue-200 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{ev.attribute_label}</span>
                  <Badge status="VALID">{(ev.confidence * 100).toFixed(0)}%</Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{ev.document_name || 'Spec_Sheet.pdf'}</p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 block">Page {ev.page_number}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* CENTER: DOCUMENT VIEWER CANVAS SKELETON */}
      <Card className="lg:col-span-2 space-y-3 flex flex-col justify-between">
        <div>
          <CardHeader
            title={selectedEvidence?.document_name || 'Manufacturer Specification Document'}
            subtitle={`Page ${selectedEvidence?.page_number || 1} of 4 • PDF.js Bounding Box Rendering`}
          />

          {/* Simulated PDF Document Render Box with Bounding Box Overlay */}
          <div className="relative bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-6 min-h-[380px] flex flex-col justify-center items-center text-center transition-colors duration-200">
            
            {/* Simulated Bounding Box Overlay */}
            {selectedEvidence?.bounding_box && (
              <div className="absolute inset-x-8 top-24 bottom-28 border-2 border-dashed border-emerald-500 dark:border-emerald-400 bg-emerald-500/10 rounded p-4 flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 uppercase tracking-widest mb-2">
                  Source Evidence Highlight (Page {selectedEvidence.page_number})
                </span>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 max-w-md bg-white/90 dark:bg-slate-950/90 p-3 rounded border border-emerald-300 dark:border-emerald-800/80 leading-relaxed shadow-lg">
                  "{selectedEvidence.extracted_text}"
                </p>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-2">
                  Coordinates: [{selectedEvidence.bounding_box.x0.toFixed(1)}, {selectedEvidence.bounding_box.y0.toFixed(1)}, {selectedEvidence.bounding_box.x1.toFixed(1)}, {selectedEvidence.bounding_box.y1.toFixed(1)}]
                </span>
              </div>
            )}

            <FileText className="w-12 h-12 text-slate-400 dark:text-slate-700 mb-2 opacity-40" />
            <span className="text-slate-500 dark:text-slate-500 text-xs font-mono">PDF Page Rendered via PDF.js</span>
          </div>
        </div>

        <div className="pt-2 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Scale: 100%</span>
          <span>PDF.js Canvas Engine Active</span>
        </div>
      </Card>

      {/* RIGHT: EVIDENCE DETAILS */}
      <Card className="lg:col-span-1 space-y-4">
        <CardHeader title="Evidence Context" subtitle="Observable source metadata" />

        {selectedEvidence ? (
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Source Document</span>
              <span className="font-bold text-slate-900 dark:text-slate-200 block truncate">{selectedEvidence.document_name || 'Spec_Sheet.pdf'}</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Page Number</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">Page {selectedEvidence.page_number}</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Extracted Source Text</span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed italic">
                "{selectedEvidence.extracted_text}"
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-1">Extraction Confidence</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{(selectedEvidence.confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">Select an attribute to inspect evidence context</p>
        )}
      </Card>
    </div>
  );
};
