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
  lightBg?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'blue',
  progress,
  lightBg = false,
}: StatCardProps) {
  const variantStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200/80',
      bar: 'bg-blue-600',
      cardBg: 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border-blue-200/90 hover:border-blue-400 hover:shadow-[0_4px_20px_rgba(59,130,246,0.18)] hover:ring-1 hover:ring-blue-400/30',
      titleColor: 'text-blue-600',
      valueColor: 'text-blue-950',
      footerBorder: 'border-blue-100/80',
      footerTextColor: 'text-blue-800',
      badgeBg: 'bg-blue-100/80',
      badgeText: 'text-blue-800',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200/80',
      bar: 'bg-emerald-600',
      cardBg: 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-emerald-200/90 hover:border-emerald-400 hover:shadow-[0_4px_20px_rgba(16,185,129,0.18)] hover:ring-1 hover:ring-emerald-400/30',
      titleColor: 'text-emerald-600',
      valueColor: 'text-emerald-950',
      footerBorder: 'border-emerald-100/80',
      footerTextColor: 'text-emerald-800',
      badgeBg: 'bg-emerald-100/80',
      badgeText: 'text-emerald-800',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200/80',
      bar: 'bg-amber-500',
      cardBg: 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-200/90 hover:border-amber-400 hover:shadow-[0_4px_20px_rgba(245,158,11,0.18)] hover:ring-1 hover:ring-amber-400/30',
      titleColor: 'text-amber-600',
      valueColor: 'text-amber-950',
      footerBorder: 'border-amber-100/80',
      footerTextColor: 'text-amber-800',
      badgeBg: 'bg-amber-100/80',
      badgeText: 'text-amber-800',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200/80',
      bar: 'bg-rose-600',
      cardBg: 'bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 border-rose-200/90 hover:border-rose-400 hover:shadow-[0_4px_20px_rgba(244,63,94,0.18)] hover:ring-1 hover:ring-rose-400/30',
      titleColor: 'text-rose-600',
      valueColor: 'text-rose-950',
      footerBorder: 'border-rose-100/80',
      footerTextColor: 'text-rose-800',
      badgeBg: 'bg-rose-100/80',
      badgeText: 'text-rose-800',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200/80',
      bar: 'bg-indigo-600',
      cardBg: 'bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 border-indigo-200/90 hover:border-indigo-400 hover:shadow-[0_4px_20px_rgba(99,102,241,0.18)] hover:ring-1 hover:ring-indigo-400/30',
      titleColor: 'text-indigo-600',
      valueColor: 'text-indigo-950',
      footerBorder: 'border-indigo-100/80',
      footerTextColor: 'text-indigo-800',
      badgeBg: 'bg-indigo-100/80',
      badgeText: 'text-indigo-800',
    },
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div
      className={
        lightBg
          ? `${style.cardBg} p-4 md:p-5 rounded-2xl border transition-all duration-200 select-none shadow-2xs hover:scale-[1.01] flex flex-col justify-between`
          : 'bg-white p-4 md:p-5 rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between'
      }
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span
              className={`text-[10px] font-black uppercase tracking-wider block ${
                lightBg ? style.titleColor : 'text-gray-500'
              }`}
            >
              {title}
            </span>
            <div
              className={`text-xl md:text-2xl font-black tracking-tight font-mono ${
                lightBg ? style.valueColor : 'text-gray-900'
              }`}
            >
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
      </div>

      {/* Footer Subtitle / Trend */}
      {(subtitle || trend) && (
        <div
          className={`flex items-center justify-between gap-2 mt-3 pt-2.5 border-t text-xs font-bold ${
            lightBg ? `${style.footerBorder} ${style.footerTextColor}` : 'border-gray-100 text-gray-500'
          }`}
        >
          {subtitle && <span className="truncate">{subtitle}</span>}

          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                trend.isGood !== undefined
                  ? trend.isGood
                    ? 'bg-emerald-100/90 text-emerald-800'
                    : 'bg-rose-100/90 text-rose-800'
                  : lightBg
                  ? `${style.badgeBg} ${style.badgeText}`
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
