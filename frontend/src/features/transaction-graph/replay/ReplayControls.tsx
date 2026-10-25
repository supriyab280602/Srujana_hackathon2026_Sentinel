import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Clock, CheckCircle2 } from 'lucide-react';

const SPEED_OPTIONS = [0.5, 1, 1.5, 2] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

interface ReplayControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: Speed;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onStepChange: (step: number) => void;
  onSpeedChange: (speed: Speed) => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onReset,
  onStepChange,
  onSpeedChange,
}) => {
  const progress = ((currentStep - 1) / Math.max(totalSteps - 1, 1)) * 100;
  const isComplete = currentStep >= totalSteps;

  return (
    <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs space-y-3.5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-xs font-semibold text-ink">Chronological Flow Replay</span>
          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Sequence Complete ({totalSteps}/{totalSteps} Hops)</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
              Step {currentStep} of {totalSteps}
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono font-medium text-ink-muted">
          Strict Zero-Lookahead Telemetry
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-1.5 bg-surface-elevated border border-surface-border rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-200 ${
            isComplete ? 'bg-emerald-600' : 'bg-brand-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Scrubber slider */}
      <input
        type="range"
        min={1}
        max={totalSteps}
        value={currentStep}
        onChange={(e) => onStepChange(Number(e.target.value))}
        className="w-full h-1.5 accent-brand-600 cursor-pointer bg-slate-200 rounded-lg"
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-1.5">
          {/* Reset */}
          <button
            onClick={onReset}
            title="Restart replay from Node 0 (step 1)"
            className="w-7 h-7 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border flex items-center justify-center text-ink-secondary hover:text-ink transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Step back */}
          <button
            onClick={onStepBackward}
            disabled={currentStep <= 1}
            title="Previous event"
            className="w-7 h-7 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border flex items-center justify-center text-ink-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {isPlaying ? (
              <><Pause className="w-3 h-3 text-amber-300" /> <span>Pause</span></>
            ) : isComplete ? (
              <><RotateCcw className="w-3 h-3 text-emerald-300" /> <span>Replay from Node 0</span></>
            ) : (
              <><Play className="w-3 h-3 text-blue-400" /> <span>Play Flow</span></>
            )}
          </button>

          {/* Step forward */}
          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            title="Next event"
            className="w-7 h-7 rounded-lg bg-surface hover:bg-surface-elevated border border-surface-border flex items-center justify-center text-ink-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed selector pills */}
        <div className="flex items-center gap-1 bg-surface-elevated p-0.5 rounded-lg border border-surface-border">
          <span className="text-[10px] font-medium text-ink-muted px-1.5">Speed:</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded transition-all ${
                speed === s
                  ? 'bg-surface text-ink font-bold shadow-xs border border-surface-border'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
