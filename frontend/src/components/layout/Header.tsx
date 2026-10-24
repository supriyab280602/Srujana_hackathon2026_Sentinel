import React, { useEffect, useState } from 'react';
import { StatusIndicator } from '../ui/StatusIndicator';
import { apiService } from '../../services/api';
import { Search, ShieldAlert, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'busy'>('busy');

  useEffect(() => {
    let mounted = true;
    apiService.getHealth()
      .then((res) => {
        if (mounted) {
          setBackendStatus(res.status === 'ok' ? 'online' : 'offline');
        }
      })
      .catch(() => {
        if (mounted) setBackendStatus('offline');
      });
    return () => { mounted = false; };
  }, []);

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-surface-border px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Quick Search */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account ID, txn hash, mule entity..."
            className="w-full bg-surface-elevated border border-surface-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Status Indicators & Metadata */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-elevated/70 rounded-full border border-surface-border text-xs">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Scoring Engine:</span>
          <span className="font-mono text-slate-200">v0.1-Scaffold</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-surface-elevated/70 rounded-full border border-surface-border text-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-slate-400">Backend API:</span>
          <StatusIndicator
            status={backendStatus}
            label={backendStatus === 'online' ? 'Connected' : 'Standalone / Offline'}
          />
        </div>
      </div>
    </header>
  );
};
