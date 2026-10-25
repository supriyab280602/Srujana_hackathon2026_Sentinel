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

  const scoreColor =
    currentScore > 70 ? 'text-rose-600' :
    currentScore > 40 ? 'text-amber-600' :
    'text-emerald-600';

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
        <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-neutral-400" />
          Risk Evolution
        </h4>
        <span className={`text-sm font-bold ${scoreColor}`}>
          {currentScore} / 100
        </span>
      </div>

      <div className="flex items-end gap-2.5 h-20 pb-1">
        {events.map((ev) => {
          const isEvaluated = ev.step <= currentStep;
          const isActive = ev.step === currentStep;
          const heightPct = Math.max((ev.scoreAtEvent / 100) * 100, 10);

          let barColor = '#F1F5F9'; // future: subtle gray
          if (isEvaluated) {
            if (ev.scoreAtEvent > 70) barColor = '#F43F5E';
            else if (ev.scoreAtEvent > 40) barColor = '#F59E0B';
            else barColor = '#10B981';
          }

          return (
            <div key={ev.step} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-full transition-all duration-300"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: barColor,
                  outline: isActive ? '2px solid #2563EB' : 'none',
                  outlineOffset: 2,
                }}
              />
              <span className="text-[10px] font-semibold text-neutral-400">#{ev.step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
