'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  Package,
  CheckSquare,
  FlaskConical,
  BarChart3,
  FileSearch,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getActiveSessionId } from '../../lib/session';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    const fetchPending = async () => {
      try {
        const sessionId = getActiveSessionId();
        const res = await fetch(`${API_BASE}/sessions/${sessionId}/reviews?status=PENDING`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPendingCount(data.length);
          }
        }
      } catch (e) {}
    };
    fetchPending();
  }, [pathname]);

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Review Queue', href: '/review', icon: CheckSquare, badge: pendingCount !== null ? pendingCount.toString() : undefined },
    { name: 'Evaluation Lab', href: '/evaluation', icon: FlaskConical },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Evidence Viewer', href: '/evidence', icon: FileSearch },
  ];

  return (
    <aside className={cn('relative bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-all duration-200', collapsed ? 'w-16' : 'w-64')}>
      <div>
        {/* Brand Header */}
        <div className={cn('p-4 border-b border-slate-200 dark:border-slate-800 flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-lg shadow-sm">
            S
          </div>
          <div className={cn(collapsed && 'hidden')}>
            <h1 className="font-bold font-mono text-slate-900 dark:text-slate-100 tracking-wider text-sm">SORTOLOG IQ</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans tracking-tight">Product Quality Engine</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="absolute left-[calc(100%-0.75rem)] top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-2',
                  active
                    ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')} />
                  <span className={cn(collapsed && 'hidden')}>{item.name}</span>
                </div>
                {item.badge && !collapsed && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className={cn('p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1 font-mono', collapsed && 'hidden')}>
        <div className="flex items-center justify-between text-[11px]">
          <span>WORKSPACE</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">UniHack Master</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span>UNILOG SCHEMA</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">252 Fields</span>
        </div>
      </div>
    </aside>
  );
};
