import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'warning' | 'offline' | 'busy';
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const colors = {
    online:  'bg-emerald-500',
    warning: 'bg-amber-400',
    offline: 'bg-red-500',
    busy:    'bg-brand-500 animate-pulse',
  };

  const textColors = {
    online:  'text-emerald-700',
    warning: 'text-amber-700',
    offline: 'text-red-600',
    busy:    'text-brand-600',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {label && (
        <span className={`font-mono text-[10px] uppercase tracking-wider font-semibold ${textColors[status]}`}>
          {label}
        </span>
      )}
    </div>
  );
};
