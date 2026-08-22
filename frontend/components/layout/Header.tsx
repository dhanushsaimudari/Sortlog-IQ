'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Cpu, Trash2, PlusCircle, Sun, Moon, Download } from 'lucide-react';
import { getActiveSessionId, createNewSession, clearCurrentSession, initSession } from '../../lib/session';
import { exportSessionCsv } from '../../lib/api/export';
import { useTheme } from '../../lib/theme-context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export const Header: React.FC = () => {
  const [connectionState, setConnectionState] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('OFFLINE');
  const [hasProducts, setHasProducts] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [aiBadge, setAiBadge] = useState<{ text: string; variant: 'ACTIVE' | 'FALLBACK' | 'LOCAL' | 'OFFLINE' }>({
    text: 'CONNECTING...',
    variant: 'LOCAL'
  });

  const [remainingSeconds, setRemainingSeconds] = useState<number>(7200);

  const checkSessionStatus = async (sid?: string) => {
    const currentId = sid || getActiveSessionId();
    setSessionId(currentId);
    try {
      const productsRes = await fetch(`${API_BASE}/sessions/${currentId}/products?limit=1`);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setHasProducts((data.total || 0) > 0);
      } else {
        setHasProducts(false);
      }
    } catch (e) {
      setHasProducts(false);
    }
  };

  useEffect(() => {
    initSession().then((id) => checkSessionStatus(id));

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.backend === 'ok') {
          if (data.watsonx === 'available') {
            setAiBadge({ text: 'WATSONX ACTIVE', variant: 'ACTIVE' });
          } else if (data.gemini === 'available') {
            setAiBadge({ text: 'WATSONX → GEMINI', variant: 'FALLBACK' });
          } else {
            setAiBadge({ text: 'LOCAL ENGINE ACTIVE', variant: 'LOCAL' });
          }
          setConnectionState('ONLINE');
        } else {
          setConnectionState('OFFLINE');
          setAiBadge({ text: 'AI UNAVAILABLE', variant: 'OFFLINE' });
        }
      })
      .catch(() => {
        setConnectionState('OFFLINE');
        setAiBadge({ text: 'AI UNAVAILABLE', variant: 'OFFLINE' });
      });

    const handleSessionChange = (e: any) => {
      const newSid = e.detail?.sessionId || getActiveSessionId();
      checkSessionStatus(newSid);
    };

    const handleCatalogUpdate = () => {
      checkSessionStatus();
    };

    window.addEventListener('session-changed', handleSessionChange);
    window.addEventListener('catalog-updated', handleCatalogUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('session-changed', handleSessionChange);
      window.removeEventListener('catalog-updated', handleCatalogUpdate);
    };
  }, []);

  const handleExtendSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions/${getActiveSessionId()}/extend`, { method: 'POST' });
      if (res.ok) {
        setRemainingSeconds(7200);
      }
    } catch (e) { }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await exportSessionCsv();
      if (!res.success) {
        alert(res.message || 'Export failed. Please ensure catalog products exist in active session.');
      }
    } catch (err: any) {
      console.error('Export CSV error:', err);
      alert(`Export CSV Error: ${err.message || 'Failed to download export file'}`);
    } finally {
      setExporting(false);
      checkSessionStatus();
    }
  };

  const handleNewSession = async () => {
    const newId = await createNewSession(false);
    setSessionId(newId);
    window.location.reload();
  };

  const handleClearSession = async () => {
    await clearCurrentSession();
    window.location.reload();
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerWarningClass =
    remainingSeconds <= 300
      ? 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
      : remainingSeconds <= 1800
        ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-950 dark:text-slate-300';

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between font-mono text-xs transition-colors duration-200">
      <div className="flex items-center gap-3">
        <span className="text-slate-500 dark:text-slate-400">Mode:</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-800 flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Stateless Session Engine
        </span>

        {sessionId && (
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
            ID: <span className="text-blue-600 dark:text-blue-300 font-semibold">{sessionId}</span>
          </span>
        )}

        {/* LIVE 120-MIN SESSION TIMER COUNTDOWN */}
        <div className={`px-2.5 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${timerWarningClass}`}>
          <span>Session Exp:</span>
          <span className="font-bold">{minutes}m {seconds < 10 ? `0${seconds}` : seconds}s</span>
          <button
            onClick={handleExtendSession}
            className="ml-1 px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded"
            title="Extend session by +120 minutes"
          >
            +120m
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-slate-800 transition-all duration-200 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-600" />
            </>
          )}
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 my-auto mx-1" />

        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="px-2.5 py-1.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="Export 252-Column Unilog Delivery CSV"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>

        <button
          onClick={handleNewSession}
          className="px-2.5 py-1.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-colors"
          title="Create a fresh session"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Session
        </button>

        <button
          onClick={handleClearSession}
          className="px-2.5 py-1.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors"
          title="Clear current session data and temporary files"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Session
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 my-auto mx-1" />

        <div className="flex items-center gap-2">
          {aiBadge.variant === 'ACTIVE' ? (
            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-xs" title="IBM watsonx.ai Primary Active (meta-llama/llama-3-3-70b-instruct)">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {aiBadge.text}
            </span>
          ) : aiBadge.variant === 'FALLBACK' ? (
            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5" title="IBM watsonx.ai unavailable. Gemini API Secondary Fallback active.">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              {aiBadge.text}
            </span>
          ) : aiBadge.variant === 'LOCAL' ? (
            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5" title="Local Deterministic Engine & ML Active">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {aiBadge.text}
            </span>
          ) : (
            <Badge variant="blocked">{aiBadge.text}</Badge>
          )}
        </div>

      </div>
    </header>
  );
};
