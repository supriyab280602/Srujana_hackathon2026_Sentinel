import React from 'react';
import { RiskSeverity, AlertStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: RiskSeverity | AlertStatus | 'default' | 'outline' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles: Record<string, string> = {
    default:      'bg-gray-100 text-gray-600 border-gray-200',
    outline:      'border-gray-300 text-gray-500 bg-transparent',
    info:         'bg-brand-50 text-brand-600 border-brand-200',
    low:          'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium:       'bg-amber-50 text-amber-700 border-amber-200',
    high:         'bg-orange-50 text-orange-700 border-orange-200',
    critical:     'bg-red-50 text-red-700 border-red-200 font-semibold',
    open:         'bg-red-50 text-red-700 border-red-200',
    under_review: 'bg-brand-50 text-brand-600 border-brand-200',
    escalated:    'bg-purple-50 text-purple-700 border-purple-200',
    dismissed:    'bg-gray-100 text-gray-500 border-gray-200',
    resolved:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const selectedStyle = styles[variant] || styles.default;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wider border ${selectedStyle} ${className}`}>
      {children}
    </span>
  );
};
