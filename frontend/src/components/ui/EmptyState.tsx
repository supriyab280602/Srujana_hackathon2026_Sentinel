import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon = <AlertCircle className="w-10 h-10 text-slate-500 mb-3" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface/50 border border-dashed border-surface-border rounded-xl">
      {icon}
      <h4 className="text-base font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
};
