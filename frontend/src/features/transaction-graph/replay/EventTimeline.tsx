import React from 'react';
import { ReplayEvent } from '../types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface EventTimelineProps {
  events: ReplayEvent[];
  activeStep: number;
  onSelectStep: (step: number) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  activeStep,
  onSelectStep,
}) => {
  return (
    <div className="bg-surface p-4 rounded-xl border border-surface-border">
      <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
        Transaction Event Stream
      </h4>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {events.map((ev) => {
          const isActive = ev.step === activeStep;
          const isPassed = ev.step < activeStep;

          return (
            <div
              key={ev.step}
              onClick={() => onSelectStep(ev.step)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-purple-950/40 border-purple-500 text-purple-200 ring-1 ring-purple-500/50'
                  : isPassed
                  ? 'bg-surface-elevated/40 border-surface-border text-slate-400'
                  : 'bg-surface/20 border-surface-border/40 text-slate-500 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold">#{ev.step}</span>
                <span className="font-mono text-[11px] text-slate-300">{ev.timestamp}</span>
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-200">
                  <span>{ev.sourceAccount}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span>{ev.targetAccount}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold">${ev.amount.toLocaleString()}</span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
