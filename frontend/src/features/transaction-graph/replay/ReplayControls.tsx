import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';

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

  return (
    <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-neutral-900">Chronological Flow Replay</span>
          <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
            Event {currentStep} of {totalSteps}
          </span>
        </div>
        <span className="text-[11px] font-medium text-neutral-400">
          Zero-Lookahead Active
        </span>
      </div>

      {/* Progress track */}
      <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all duration-300"
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
        className="w-full h-1.5 accent-blue-600 cursor-pointer bg-neutral-200 rounded-lg"
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Reset */}
          <button
            onClick={onReset}
            title="Restart from step 1"
            className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Step back */}
          <button
            onClick={onStepBackward}
            disabled={currentStep <= 1}
            title="Previous event"
            className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause - Solid black or brand blue pill */}
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            {isPlaying ? (
              <><Pause className="w-3.5 h-3.5" /> <span>Pause</span></>
            ) : (
              <><Play className="w-3.5 h-3.5" /> <span>Play Replay</span></>
            )}
          </button>

          {/* Step forward */}
          <button
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            title="Next event"
            className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed selector pills */}
        <div className="flex items-center gap-1 bg-neutral-50 p-1 rounded-full border border-neutral-200/60">
          <span className="text-[10px] font-medium text-neutral-400 px-2">Speed</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full transition-all ${
                speed === s
                  ? 'bg-white text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
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
