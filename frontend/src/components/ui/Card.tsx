import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`bg-surface border border-surface-border rounded-xl p-5 sm:p-6 shadow-card transition-all duration-200 hover:shadow-card-md ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-border">
          <div>
            {title && <h3 className="font-semibold text-base text-ink tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
