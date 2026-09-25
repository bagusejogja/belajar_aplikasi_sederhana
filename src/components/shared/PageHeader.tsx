'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  breadcrumbs?: BreadcrumbItem[];
  badge?: {
    text: string;
    variant?: 'primary' | 'success' | 'warning' | 'info' | 'purple';
  };
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  badge,
  actions,
}: PageHeaderProps) {
  const badgeStyles = {
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-gray-200/90 shadow-2xs mb-4">
      {/* Optional Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5">
          <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <Home size={13} className="text-gray-400" />
            <span className="sr-only">Dashboard</span>
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={12} className="text-gray-300 shrink-0" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-blue-600 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-gray-700">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-200/60 shrink-0 mt-0.5">
              <Icon size={20} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                {title}
              </h1>
              {badge && (
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs tracking-wider ${
                  badgeStyles[badge.variant || 'primary']
                }`}>
                  {badge.text}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
