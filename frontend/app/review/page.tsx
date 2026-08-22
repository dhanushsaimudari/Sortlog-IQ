'use client';

import React, { useState, useEffect } from 'react';
import { ReviewItem } from '../../types/review';
import { fetchReviewItems, approveReviewItem, rejectReviewItem, autofixReviewItem } from '../../lib/api/reviews';
import { ReviewQueueTable } from '../../components/review/ReviewQueueTable';
import { ReviewDetailPanel } from '../../components/review/ReviewDetailPanel';
import { KeyboardShortcutsHelp } from '../../components/review/KeyboardShortcutsHelp';
import { Badge } from '../../components/ui/Badge';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();

    const handleUpdate = () => loadItems();
    window.addEventListener('session-changed', handleUpdate);
    window.addEventListener('catalog-updated', handleUpdate);

    return () => {
      window.removeEventListener('session-changed', handleUpdate);
      window.removeEventListener('catalog-updated', handleUpdate);
    };
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await fetchReviewItems();
    setItems(data);
    setLoading(false);
  };

  const selectedItem = items[selectedIndex] || null;

  const handleApprove = async (item: ReviewItem) => {
    await approveReviewItem(item.review_id);
    setItems((prev) => prev.filter((i) => i.review_id !== item.review_id));
  };

  const handleReject = async (item: ReviewItem) => {
    await rejectReviewItem(item.review_id);
    setItems((prev) => prev.filter((i) => i.review_id !== item.review_id));
  };

  const handleAutoFix = async (item: ReviewItem) => {
    await autofixReviewItem(item.review_id);
    setItems((prev) => prev.filter((i) => i.review_id !== item.review_id));
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input elements
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (!selectedItem) return;

      const key = e.key.toUpperCase();

      if (key === 'A') {
        e.preventDefault();
        handleApprove(selectedItem);
      } else if (key === 'R') {
        e.preventDefault();
        handleReject(selectedItem);
      } else if (key === 'F') {
        e.preventDefault();
        handleAutoFix(selectedItem);
      } else if (key === 'N') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
      } else if (key === 'P') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, items]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 font-mono">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Human Review Queue Workbench <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">Flagged exception queue for ambiguous brands, rule failures, and low-confidence items</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status="REVIEW">{items.length} Pending Exceptions</Badge>
        </div>
      </div>

      {/* Keyboard Shortcuts Toolbar */}
      <KeyboardShortcutsHelp />

      {/* Queue View & Inspection Split */}
      {loading ? (
        <div className="p-12 text-center font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
          Loading review queue items...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center font-mono text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold">Review Queue Clean</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">All catalog records are validated and approved for export.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ReviewQueueTable
              items={items}
              selectedIndex={selectedIndex}
              onSelectItem={setSelectedIndex}
              onApprove={handleApprove}
              onReject={handleReject}
              onAutoFix={handleAutoFix}
            />
          </div>

          <div className="lg:col-span-1">
            <ReviewDetailPanel
              item={selectedItem}
              onApprove={handleApprove}
              onReject={handleReject}
              onAutoFix={handleAutoFix}
            />
          </div>
        </div>
      )}
    </div>
  );
}
