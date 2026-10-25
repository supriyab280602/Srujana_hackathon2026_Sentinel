import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-brand-500 hover:bg-brand-600 text-white border border-brand-600 shadow-sm focus:ring-brand-400',
    secondary:
      'bg-surface hover:bg-surface-elevated text-ink border border-surface-border shadow-card focus:ring-gray-300',
    danger:
      'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 focus:ring-red-300',
    outline:
      'border border-surface-border-strong hover:border-gray-400 text-ink-secondary hover:bg-surface-elevated focus:ring-gray-300',
    ghost:
      'text-ink-secondary hover:text-ink hover:bg-surface-elevated focus:ring-gray-300',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
