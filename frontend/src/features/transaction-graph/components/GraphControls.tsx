import React from 'react';
import { GraphViewMode } from '../types';
import { Play, Eye, RefreshCw } from 'lucide-react';

interface GraphControlsProps {
  mode: GraphViewMode;
  onModeChange: (mode: GraphViewMode) => void;
  onRefresh?: () => void;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  mode,
  onModeChange,
  onRefresh,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-neutral-100 rounded-full p-1.5 shadow-xs">
      <div className="flex bg-neutral-100 p-1 rounded-full gap-1">
        <button
          onClick={() => onModeChange('exploration')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            mode === 'exploration'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Interactive Topology</span>
        </button>
        <button
          onClick={() => onModeChange('replay')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            mode === 'replay'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Flow Replay Mode</span>
        </button>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="w-8 h-8 rounded-full text-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex items-center justify-center transition-colors mr-1"
          title="Reset layout focus"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
