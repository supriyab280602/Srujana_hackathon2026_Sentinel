import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, FastForward } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ReplayControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onStepChange: (step: number) => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  onStepChange,
}) => {
  return (
    <div className="bg-surface p-4 rounded-xl border border-purple-500/30 bg-purple-950/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono">
            Chronological Replay
          </span>
          <span className="text-xs text-slate-400">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Strict Zero-Lookahead Inference
        </div>
      </div>

      {/* Scrubbing Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={totalSteps}
          value={currentStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          className="w-full accent-purple-500 cursor-pointer h-1.5 bg-surface-elevated rounded-lg"
        />
      </div>

      {/* Playback Button Group */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onReset}
            title="Reset to step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onTogglePlay}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onStepForward}
            disabled={currentStep >= totalSteps}
            title="Next Chronological Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <FastForward className="w-3.5 h-3.5 text-purple-400" />
          <span>Playback: 1x</span>
        </div>
      </div>
    </div>
  );
};
