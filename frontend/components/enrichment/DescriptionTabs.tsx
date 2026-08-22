'use client';

import React, { useState } from 'react';
import { ProductContent } from '../../types/product';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Check, Wand2, AlertTriangle } from 'lucide-react';

interface DescriptionTabsProps {
  content: ProductContent;
}

export const DescriptionTabs: React.FC<DescriptionTabsProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'mobile' | 'invoice' | 'short' | 'long' | 'retail' | 'marketing'>('short');
  const [fixedStates, setFixedStates] = useState<Record<string, boolean>>({});

  const tabConfigs = {
    mobile: { label: 'Mobile Desc', text: content.mobile_desc || '', maxLen: 80, formula: '{Mfr} {Brand}, {Noun}, {Series}, {MPN}, {Mounting}' },
    invoice: { label: 'Invoice Desc', text: content.invoice_desc || '', maxLen: 40, formula: '{NOUN} {SERIES} {VOLT} {AMP} {SOUND}' },
    short: { label: 'Short Desc', text: content?.short_desc || '', maxLen: 160, formula: '{Brand®} {Series} {MPN} {Noun} {With}, {Mounting}' },
    long: { label: 'Long Desc', text: content?.long_desc || content?.long_desc1 || '', maxLen: 500, formula: '{Brand®} {Noun} {With}, {Series}, {Cycles}, {Voltage}, {Amps}' },
    retail: { label: 'Retail Desc', text: content?.retail_desc || '', maxLen: 100, formula: '{Series} {Noun}, {Mounting}, {Cycles}, {Material}' },
    marketing: { label: 'Marketing', text: content.marketing_description || '', maxLen: 300, formula: 'PDP Hero Narrative Paragraph' },
  };

  const current = tabConfigs[activeTab];
  const charCount = current.text.length;
  const isOverLimit = charCount > current.maxLen;
  const isFixed = fixedStates[activeTab];

  const handleAutoFix = () => {
    setFixedStates((prev) => ({ ...prev, [activeTab]: true }));
  };

  return (
    <Card className="space-y-4">
      <CardHeader title="Generated Content Channels" subtitle="Multi-channel text formulas & character boundary compliance" />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {(Object.keys(tabConfigs) as Array<keyof typeof tabConfigs>).map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tabConfigs[key].label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 dark:border-slate-800/60 pb-2">
          <span className="text-slate-500 dark:text-slate-400">Target Formula: <span className="text-slate-800 dark:text-slate-200">{current.formula}</span></span>
          <div className="flex items-center gap-2">
            <span className={isOverLimit && !isFixed ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
              {isFixed ? `${current.maxLen} / ${current.maxLen} chars` : `${charCount} / ${current.maxLen} chars`}
            </span>
            {isOverLimit && !isFixed ? (
              <Badge status="BLOCKED">LIMIT EXCEEDED</Badge>
            ) : (
              <Badge status="VALID">VALID</Badge>
            )}
          </div>
        </div>

        {/* Text Display */}
        <p className="font-mono text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/80 p-3 rounded border border-slate-200 dark:border-slate-800 leading-relaxed">
          {isFixed ? current.text.slice(0, current.maxLen - 3) + '...' : current.text}
        </p>

        {/* Limit Exceeded Auto-Fix Trigger */}
        {isOverLimit && !isFixed && (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 p-3 rounded-md">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Text length exceeds max boundary ({charCount} &gt; {current.maxLen} chars).</span>
            </div>
            <Button size="sm" variant="secondary" onClick={handleAutoFix} className="border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60">
              <Wand2 className="w-3.5 h-3.5" />
              Auto Fix Length
            </Button>
          </div>
        )}

        {isFixed && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 p-2.5 rounded-md">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Truncation auto-fix applied successfully to match target limit.</span>
          </div>
        )}
      </div>
    </Card>
  );
};
