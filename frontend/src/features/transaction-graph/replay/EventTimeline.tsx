import React from 'react';
import { ReplayEvent } from '../types';
import { formatINR } from '../../../utils/formatters';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs">
      <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-surface-border">
        <Clock className="w-3.5 h-3.5 text-ink-muted" />
        <h4 className="font-semibold text-xs text-ink uppercase tracking-wider">
          Transaction Event Scrubber ({events.length} Hops)
        </h4>
      </div>
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {events.map((ev) => {
          const isActive = ev.step === activeStep;
          const isPassed = ev.step < activeStep;

          return (
            <div
              key={ev.step}
              onClick={() => onSelectStep(ev.step)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-brand-50 border-brand-300 text-brand-900 font-semibold shadow-xs'
                  : isPassed
                  ? 'bg-surface-elevated/70 border-surface-border text-ink-secondary'
                  : 'bg-surface border-surface-border text-ink-muted opacity-50 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-ink-muted">#{ev.step}</span>
                <span className="text-[10px] font-mono text-ink-muted">{ev.timestamp}</span>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span className="text-ink">{ev.sourceAccount}</span>
                  <ArrowRight className="w-3 h-3 text-ink-muted" />
                  <span className="text-ink">{ev.targetAccount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-bold text-ink tabular-nums">
                  {formatINR(ev.amount)}
                </span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
