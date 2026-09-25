import React from 'react';
import { 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowRight 
} from 'lucide-react';

export type AlertType = 'info' | 'warning' | 'danger' | 'success';
export type AlertVariant = 'soft' | 'bordered' | 'accent-left';

export interface BannerAlertProps {
  type?: AlertType;
  variant?: AlertVariant;
  title?: string;
  message?: string | React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export default function BannerAlert({
  type = 'info',
  variant = 'accent-left',
  title,
  message,
  actionText,
  onAction,
  onClose,
  icon,
  className = '',
  children
}: BannerAlertProps) {
  const configs = {
    info: {
      defaultIcon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
      accentBorder: 'border-l-4 border-l-blue-600',
      softBg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/80 text-blue-900 dark:text-blue-100',
      titleColor: 'text-blue-950 dark:text-blue-100',
      textColor: 'text-blue-800/90 dark:text-blue-200/90',
      actionBtn: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    warning: {
      defaultIcon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      accentBorder: 'border-l-4 border-l-amber-500',
      softBg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-100',
      titleColor: 'text-amber-950 dark:text-amber-100',
      textColor: 'text-amber-800/90 dark:text-amber-200/90',
      actionBtn: 'bg-amber-600 hover:bg-amber-700 text-white'
    },
    danger: {
      defaultIcon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
      accentBorder: 'border-l-4 border-l-rose-600',
      softBg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/80 text-rose-900 dark:text-rose-100',
      titleColor: 'text-rose-950 dark:text-rose-100',
      textColor: 'text-rose-800/90 dark:text-rose-200/90',
      actionBtn: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    success: {
      defaultIcon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      accentBorder: 'border-l-4 border-l-emerald-600',
      softBg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100',
      titleColor: 'text-emerald-950 dark:text-emerald-100',
      textColor: 'text-emerald-800/90 dark:text-emerald-200/90',
      actionBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    }
  }[type];

  const borderClass = variant === 'accent-left' ? configs.accentBorder : 'border';

  return (
    <div
      role="alert"
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${configs.softBg} ${borderClass} ${className}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Leading Icon */}
        <div className="pt-0.5 shrink-0">
          {icon || configs.defaultIcon}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-xs font-bold leading-snug tracking-tight mb-0.5 ${configs.titleColor}`}>
              {title}
            </h4>
          )}
          
          {message && (
            <div className={`text-xs font-medium leading-relaxed ${configs.textColor}`}>
              {message}
            </div>
          )}

          {children && (
            <div className={`text-xs mt-1.5 ${configs.textColor}`}>
              {children}
            </div>
          )}

          {/* Action Link / Button */}
          {actionText && onAction && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={onAction}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold shadow-xs transition-colors cursor-pointer ${configs.actionBtn}`}
              >
                <span>{actionText}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pemberitahuan"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
