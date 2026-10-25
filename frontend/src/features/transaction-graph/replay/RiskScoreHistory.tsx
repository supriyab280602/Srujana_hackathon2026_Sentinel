import React from 'react';
import { ReplayEvent } from '../types';
import { TrendingUp } from 'lucide-react';

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

  const isCritical = currentScore > 70;
  const isMed = currentScore > 40;

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-surface-border">
        <h4 className="font-semibold text-xs text-ink uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
          <span>Risk Progression Curve</span>
        </h4>
        <span className={`text-xs font-mono font-bold tabular-nums ${isCritical ? 'text-risk-critical' : isMed ? 'text-risk-medium' : 'text-risk-low'}`}>
          {currentScore} / 100
        </span>
      </div>

      <div className="flex items-end gap-2 h-18 pb-1">
        {events.map((ev) => {
          const isEvaluated = ev.step <= currentStep;
          const isActive = ev.step === currentStep;
          const heightPct = Math.max((ev.scoreAtEvent / 100) * 100, 12);

          let barColor = '#E2E8F0';
          if (isEvaluated) {
            if (ev.scoreAtEvent > 70) barColor = '#DC2626';
            else if (ev.scoreAtEvent > 40) barColor = '#D97706';
            else barColor = '#16A34A';
          }

          return (
            <div key={ev.step} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm transition-all duration-200"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: barColor,
                  outline: isActive ? '2px solid #1D4ED8' : 'none',
                  outlineOffset: 1,
                }}
              />
              <span className="text-[9px] font-mono font-bold text-ink-muted">#{ev.step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
