import React from 'react';
import { ReplayEvent } from '../types';
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
    <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100">
        <Clock className="w-4 h-4 text-neutral-400" />
        <h4 className="font-bold text-sm text-neutral-900">Transaction Event Stream</h4>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {events.map((ev) => {
          const isActive = ev.step === activeStep;
          const isPassed = ev.step < activeStep;

          return (
            <div
              key={ev.step}
              onClick={() => onSelectStep(ev.step)}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                isActive
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold shadow-xs'
                  : isPassed
                  ? 'bg-neutral-50/80 border-neutral-100 text-neutral-700'
                  : 'bg-white border-neutral-100 text-neutral-400 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold text-neutral-400">#{ev.step}</span>
                <span className="text-[10px] text-neutral-400 font-medium">{ev.timestamp}</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-neutral-800">{ev.sourceAccount}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-400" />
                  <span className="font-medium text-neutral-800">{ev.targetAccount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">
                  ${ev.amount.toLocaleString()}
                </span>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
