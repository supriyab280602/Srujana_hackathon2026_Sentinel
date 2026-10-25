import React from 'react';
import { ReplayEvent } from '../types';
import { ShieldAlert } from 'lucide-react';

interface CurrentEventEvidenceProps {
  currentEvent?: ReplayEvent;
}

export const CurrentEventEvidence: React.FC<CurrentEventEvidenceProps> = ({ currentEvent }) => {
  if (!currentEvent) {
    return (
      <div className="bg-neutral-50 border border-neutral-100 rounded-3xl p-5 text-center text-xs text-neutral-400">
        No active replay step selected.
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${currentEvent.flaggedHop ? 'text-rose-500' : 'text-emerald-500'}`} />
          Flow Attribution
        </h4>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
          currentEvent.flaggedHop ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${currentEvent.flaggedHop ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          {currentEvent.flaggedHop ? 'Suspicious Flow' : 'Normal Baseline'}
        </span>
      </div>

      <div className="bg-neutral-50/80 rounded-2xl p-4 text-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-neutral-500">Flow Amount</span>
          <span className="font-bold text-neutral-900">
            ${currentEvent.amount.toLocaleString()} {currentEvent.currency}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-500">Payment Rail</span>
          <span className="font-medium text-neutral-800 uppercase">{currentEvent.channel}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-500">Pattern Detected</span>
          <span className={`font-semibold text-right ${currentEvent.flaggedHop ? 'text-amber-700' : 'text-emerald-700'}`}>
            {currentEvent.emergingPattern || 'None'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60">
          <span className="text-neutral-500">Inferred Risk Index</span>
          <span className={`font-bold text-sm ${
            currentEvent.scoreAtEvent > 70 ? 'text-rose-600' :
            currentEvent.scoreAtEvent > 40 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {currentEvent.scoreAtEvent} / 100
          </span>
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 leading-relaxed">
        Temporal snapshot extracted strictly at <b className="text-neutral-700">{currentEvent.timestamp}</b>. Zero future transactions leaked into scoring.
      </p>
    </div>
  );
};
