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
  icon = <AlertCircle className="w-10 h-10 text-[#898989] mb-3" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[#0c0c0b] border border-dashed border-[#2a2a2a] rounded-2xl">
      {icon}
      <h4 className="font-serif text-lg font-bold text-white tracking-tight">{title}</h4>
      <p className="font-mono text-xs text-[#898989] max-w-sm mt-1 mb-5">{description}</p>
      {action}
    </div>
  );
};
