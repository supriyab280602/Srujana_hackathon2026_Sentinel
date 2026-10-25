import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { Search, Bell, ChevronDown, IndianRupee, TrendingUp } from 'lucide-react';

export const Header: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    apiService.getHealth()
      .then((res) => {
        if (mounted) setBackendOnline(res.status === 'ok');
      })
      .catch(() => {
        if (mounted) setBackendOnline(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-surface-border px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Top Left Global Metrics */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-ink-secondary">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-ink tabular-nums leading-tight">
              {formatINR(485200)}
            </div>
            <div className="text-[10px] text-ink-muted font-medium">Suspicious 24h Volume</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2.5 border-l border-surface-border pl-6">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-risk-high">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-ink tabular-nums leading-tight">+14 Spikes</div>
            <div className="text-[10px] text-ink-muted font-medium">Syndicate Velocity</div>
          </div>
        </div>
      </div>

      {/* Center Command Search Field */}
      <div className="relative w-64 lg:w-96 max-w-md mx-4">
        <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search accounts, transactions, SAR dockets... (Press ⌘K)"
          className="w-full bg-surface-elevated border border-surface-border rounded-lg pl-9 pr-12 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all font-sans"
        />
        <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted bg-surface px-1.5 py-0.5 rounded border border-surface-border font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls & Operational Status */}
      <div className="flex items-center gap-3">
        {/* Real-time Gateway Engine Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevated border border-surface-border text-[11px] text-ink-secondary font-medium">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-amber-500'}`} />
          <span>{backendOnline ? 'Surveillance Active' : 'Offline / Standby Mocks'}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative w-8 h-8 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border flex items-center justify-center text-ink-secondary transition-colors"
          title="Surveillance Notifications (3 Unresolved)"
          aria-label="Surveillance Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-risk-critical rounded-full" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-lg hover:bg-surface-elevated transition-colors border border-transparent hover:border-surface-border cursor-pointer">
          <div className="w-7 h-7 rounded-md bg-brand-950 text-white flex items-center justify-center font-semibold text-xs tracking-tight shadow-xs">
            AM
          </div>
          <div className="text-left hidden sm:block">
            <div className="font-semibold text-xs text-ink leading-tight">Alex Mercer</div>
            <div className="text-[10px] text-ink-muted">Lead AML Desk</div>
          </div>
          <ChevronDown className="w-3 h-3 text-ink-muted" />
        </div>
      </div>
    </header>
  );
};
