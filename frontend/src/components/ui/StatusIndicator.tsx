import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'warning' | 'offline' | 'busy';
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const colors = {
    online: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    warning: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    offline: 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    busy: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {label && <span className="text-xs text-slate-300 font-medium">{label}</span>}
    </div>
  );
};
