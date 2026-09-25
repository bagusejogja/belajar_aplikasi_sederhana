'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: {
    value: string;
    isUp?: boolean;
    isGood?: boolean;
  };
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';
  progress?: {
    percentage: number;
    label?: string;
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'blue',
  progress,
}: StatCardProps) {
  const variantStyles = {
    blue: {
      bg: 'bg-blue-50/70',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      bar: 'bg-blue-600',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      bar: 'bg-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-700',
      border: 'border-amber-200/80',
      bar: 'bg-amber-500',
    },
    rose: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
      bar: 'bg-rose-600',
    },
    indigo: {
      bg: 'bg-indigo-50/70',
      text: 'text-indigo-700',
      border: 'border-indigo-200/80',
      bar: 'bg-indigo-600',
    },
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-xl md:text-2xl font-black text-gray-900 tracking-tight font-mono">
            {value}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl border ${style.bg} ${style.text} ${style.border} shrink-0`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {/* Progress Bar (Optional) */}
      {progress && (
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-500">
            <span>{progress.label || 'Realisasi'}</span>
            <span className="font-mono">{progress.percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Subtitle / Trend */}
      {(subtitle || trend) && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-100 text-xs text-gray-500">
          {subtitle && <span className="truncate">{subtitle}</span>}

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                trend.isGood !== undefined
                  ? trend.isGood
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{trend.value}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
