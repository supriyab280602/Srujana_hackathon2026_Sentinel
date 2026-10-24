import React from 'react';
import { ReplayEvent } from '../types';
import { ShieldAlert } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

interface CurrentEventEvidenceProps {
  currentEvent?: ReplayEvent;
}

export const CurrentEventEvidence: React.FC<CurrentEventEvidenceProps> = ({ currentEvent }) => {
  if (!currentEvent) {
    return (
      <div className="bg-surface p-4 rounded-xl border border-surface-border text-center text-xs text-slate-500">
        No active replay step selected.
      </div>
    );
  }

  return (
    <div className="bg-surface p-4 rounded-xl border border-surface-border space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Step Evidence Breakdown</span>
        </h4>
        <Badge variant={currentEvent.flaggedHop ? 'critical' : 'info'}>
          {currentEvent.flaggedHop ? 'SUSPICIOUS HOP' : 'NORMAL'}
        </Badge>
      </div>

      <div className="bg-surface-elevated/40 p-3 rounded-lg border border-surface-border/60 text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Flow Amount:</span>
          <span className="font-mono font-bold text-white">${currentEvent.amount.toLocaleString()} {currentEvent.currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Channel Type:</span>
          <span className="font-mono text-slate-300 uppercase">{currentEvent.channel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Pattern Detected:</span>
          <span className="font-mono text-amber-400 font-semibold">{currentEvent.emergingPattern || 'None'}</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Incremental evidence available strictly at time <code className="text-slate-300 font-mono">{currentEvent.timestamp}</code> without leakage of subsequent transactions.
      </p>
    </div>
  );
};
