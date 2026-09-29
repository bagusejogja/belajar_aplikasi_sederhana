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

export interface TableActionButtonProps {
  icon: React.ElementType;
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success' | 'indigo';
  title: string;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
  onClick?: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export const TableActionButton = ({
  icon: Icon,
  variant = 'default',
  title,
  label,
  size = 'sm',
  onClick,
  disabled,
  className = '',
}: TableActionButtonProps) => {
  const variants = {
    default: 'text-slate-600 bg-white hover:bg-slate-800 hover:text-white border-slate-200/90 hover:border-slate-800 hover:shadow-slate-200',
    primary: 'text-blue-600 bg-blue-50/70 hover:bg-blue-600 hover:text-white border-blue-200/80 hover:border-blue-600 hover:shadow-blue-200',
    indigo: 'text-indigo-600 bg-indigo-50/70 hover:bg-indigo-600 hover:text-white border-indigo-200/80 hover:border-indigo-600 hover:shadow-indigo-200',
    warning: 'text-amber-700 bg-amber-50/70 hover:bg-amber-600 hover:text-white border-amber-200/80 hover:border-amber-600 hover:shadow-amber-200',
    danger: 'text-rose-600 bg-rose-50/70 hover:bg-rose-600 hover:text-white border-rose-200/80 hover:border-rose-600 hover:shadow-rose-200',
    success: 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-600 hover:text-white border-emerald-200/80 hover:border-emerald-600 hover:shadow-emerald-200',
  };

  const sizeClasses = {
    xs: 'h-6 px-1.5 text-[10px] rounded-lg gap-1',
    sm: 'h-7 px-2 text-xs rounded-xl gap-1.5',
    md: 'h-8 px-2.5 text-xs rounded-xl gap-1.5',
  };

  const iconSizes = {
    xs: 12,
    sm: 13,
    md: 15,
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-bold border shadow-2xs transition-all duration-200 active:scale-90 hover:-translate-y-0.5 cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      <Icon size={iconSizes[size]} className="shrink-0" />
      {label && <span className="font-bold leading-none">{label}</span>}
    </button>
  );
};

export const TableActionGroup = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`inline-flex items-center justify-center gap-1 p-1 bg-slate-50/80 border border-slate-200/70 rounded-2xl shadow-2xs ${className}`}>
      {children}
    </div>
  );
};
