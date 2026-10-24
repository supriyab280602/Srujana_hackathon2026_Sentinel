import React from 'react';
import { RiskSeverity, AlertStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: RiskSeverity | AlertStatus | 'default' | 'outline' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles: Record<string, string> = {
    default: 'bg-surface-elevated text-slate-300 border-surface-border',
    outline: 'border-slate-600 text-slate-400 bg-transparent',
    info: 'bg-blue-950/70 text-blue-400 border-blue-800/60',
    low: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
    medium: 'bg-amber-950/70 text-amber-400 border-amber-800/60',
    high: 'bg-orange-950/70 text-orange-400 border-orange-800/60',
    critical: 'bg-rose-950/70 text-rose-400 border-rose-800/60',
    open: 'bg-rose-950/60 text-rose-300 border-rose-800/50',
    under_review: 'bg-amber-950/60 text-amber-300 border-amber-800/50',
    escalated: 'bg-purple-950/60 text-purple-300 border-purple-800/50',
    dismissed: 'bg-slate-800 text-slate-400 border-slate-700',
    resolved: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  };

  const selectedStyle = styles[variant] || styles.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedStyle} ${className}`}>
      {children}
    </span>
  );
};
