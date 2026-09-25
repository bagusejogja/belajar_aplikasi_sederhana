'use client';

import React from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Filter, 
  Check, 
  X,
  Search,
  RotateCcw
} from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const PrimaryButton = ({
  children,
  className = '',
  size = 'md',
  isLoading = false,
  ...props
}: ButtonProps) => {
  const sizeClass = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-xs';
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-md shadow-blue-200/60 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClass} ${className}`}
    >
      {isLoading ? <RefreshCw size={14} className="animate-spin" /> : null}
      {children}
    </button>
  );
};

export const SecondaryButton = ({
  children,
  className = '',
  size = 'md',
  ...props
}: ButtonProps) => {
  const sizeClass = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-xs';
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 shadow-2xs active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};

export const DangerButton = ({
  children,
  className = '',
  size = 'md',
  ...props
}: ButtonProps) => {
  const sizeClass = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-xs';
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200/50 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClass} ${className}`}
    >
      <Trash2 size={14} />
      {children}
    </button>
  );
};

export const TableActionButton = ({
  icon: Icon,
  variant = 'default',
  title,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success';
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const variants = {
    default: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-gray-200',
    primary: 'text-blue-600 hover:bg-blue-50 hover:text-blue-800 border-blue-200',
    warning: 'text-amber-700 hover:bg-amber-50 hover:text-amber-900 border-amber-200',
    danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-800 border-rose-200',
    success: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-200',
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg border bg-white shadow-2xs transition-all active:scale-90 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${variants[variant]}`}
    >
      <Icon size={14} />
    </button>
  );
};
