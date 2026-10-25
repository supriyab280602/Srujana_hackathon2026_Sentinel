import React from 'react';
import { ReplayEvent } from '../types';
import { formatINR } from '../../../utils/formatters';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CurrentEventEvidenceProps {
  currentEvent?: ReplayEvent;
}

export const CurrentEventEvidence: React.FC<CurrentEventEvidenceProps> = ({ currentEvent }) => {
  if (!currentEvent) {
    return (
      <div className="bg-surface-elevated border border-surface-border rounded-xl p-4 text-center text-xs text-ink-muted">
        No active replay step selected. Click an event on the timeline to inspect evidence.
      </div>
    );
  }

  const isFlagged = currentEvent.flaggedHop;

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-surface-border">
        <h4 className="font-semibold text-xs text-ink uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className={`w-3.5 h-3.5 ${isFlagged ? 'text-risk-critical' : 'text-risk-low'}`} />
          <span>Active Hop Attribution</span>
        </h4>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
          isFlagged ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          <span className={`w-1 h-1 rounded-full ${isFlagged ? 'bg-red-600' : 'bg-emerald-600'}`} />
          {isFlagged ? 'Structured Mule Hop' : 'Normal Transfer'}
        </span>
      </div>

      <div className="bg-surface-elevated rounded-lg p-3 text-xs space-y-2 border border-surface-border">
        <div className="flex justify-between items-center">
          <span className="text-ink-secondary">Transferred Value</span>
          <span className="font-mono font-bold text-ink tabular-nums text-xs">
            {formatINR(currentEvent.amount)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-ink-secondary">Payment Rail</span>
          <span className="font-mono font-bold text-ink uppercase text-[11px]">{currentEvent.channel}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-ink-secondary">Emerging Typology</span>
          <span className={`font-semibold text-right text-[11px] ${isFlagged ? 'text-amber-800' : 'text-emerald-800'}`}>
            {currentEvent.emergingPattern || 'None'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-surface-border">
          <span className="text-ink-secondary">Composite Risk Index</span>
          <span className={`font-mono font-bold text-xs ${
            currentEvent.scoreAtEvent > 70 ? 'text-risk-critical' :
            currentEvent.scoreAtEvent > 40 ? 'text-risk-medium' : 'text-risk-low'
          }`}>
            {currentEvent.scoreAtEvent} / 100
          </span>
        </div>
      </div>

      {currentEvent.step === 8 && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Complete sequence replayed (8 of 8 events). Full terminal siphon trace identified.</span>
        </div>
      )}

      <p className="text-[10px] text-ink-muted leading-relaxed">
        Snapshot evaluated at <b className="text-ink font-mono">{currentEvent.timestamp}</b>. Strict zero-lookahead feature extraction enforced.
      </p>
    </div>
  );
};
