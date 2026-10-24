import React from 'react';
import { ReplayEvent } from '../types';

interface RiskScoreHistoryProps {
  events: ReplayEvent[];
  currentStep: number;
}

export const RiskScoreHistory: React.FC<RiskScoreHistoryProps> = ({
  events,
  currentStep,
}) => {
  const currentEvent = events.find((e) => e.step === currentStep);
  const currentScore = currentEvent ? currentEvent.scoreAtEvent : 0;

  return (
    <div className="bg-surface p-4 rounded-xl border border-surface-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Incremental Risk Evolution
        </h4>
        <span className="text-xs font-mono font-bold text-rose-400">
          Score at Step {currentStep}: {currentScore}/100
        </span>
      </div>

      <div className="flex items-end gap-2 h-20 pt-2 border-b border-surface-border pb-2">
        {events.map((ev) => {
          const isEvaluated = ev.step <= currentStep;
          const heightPercent = Math.max((ev.scoreAtEvent / 100) * 100, 10);

          return (
            <div key={ev.step} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all ${
                  isEvaluated
                    ? ev.scoreAtEvent > 70
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : 'bg-amber-500'
                    : 'bg-slate-800'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
              <span className="text-[9px] font-mono text-slate-400">s{ev.step}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-400 mt-2">
        Risk assessment updates incrementally as each transaction event is chronologically ingested.
      </p>
    </div>
  );
};
