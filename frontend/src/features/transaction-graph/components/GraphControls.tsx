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
    <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-surface-border">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Display Mode:</span>
        <div className="flex bg-surface-elevated p-0.5 rounded-lg border border-surface-border">
          <button
            onClick={() => onModeChange('exploration')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              mode === 'exploration'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Interactive Graph</span>
          </button>
          <button
            onClick={() => onModeChange('replay')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              mode === 'replay'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Replay Mode</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-surface-elevated rounded-lg border border-surface-border"
            title="Reset layout"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
