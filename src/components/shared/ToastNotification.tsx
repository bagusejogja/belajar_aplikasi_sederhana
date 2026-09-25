import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function ToastNotification({
  toasts,
  onDismiss,
  position = 'top-right'
}: ToastNotificationProps) {
  if (toasts.length === 0) return null;

  const positionClasses = {
    'top-right': 'top-5 right-5',
    'top-left': 'top-5 left-5',
    'bottom-right': 'bottom-5 right-5',
    'bottom-left': 'bottom-5 left-5'
  }[position];

  return (
    <div className={`fixed z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none ${positionClasses}`}>
      {toasts.map((toast) => {
        const style = {
          success: {
            border: 'border-emerald-500/30',
            bg: 'bg-white dark:bg-slate-900',
            accent: 'bg-emerald-500',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
            titleColor: 'text-slate-800 dark:text-slate-100',
            bar: 'bg-emerald-500'
          },
          error: {
            border: 'border-rose-500/30',
            bg: 'bg-white dark:bg-slate-900',
            accent: 'bg-rose-500',
            icon: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
            titleColor: 'text-slate-800 dark:text-slate-100',
            bar: 'bg-rose-500'
          },
          warning: {
            border: 'border-amber-500/30',
            bg: 'bg-white dark:bg-slate-900',
            accent: 'bg-amber-500',
            icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
            titleColor: 'text-slate-800 dark:text-slate-100',
            bar: 'bg-amber-500'
          },
          info: {
            border: 'border-blue-500/30',
            bg: 'bg-white dark:bg-slate-900',
            accent: 'bg-blue-500',
            icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
            titleColor: 'text-slate-800 dark:text-slate-100',
            bar: 'bg-blue-500'
          }
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-xl p-3.5 flex items-start gap-3 backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-2 ${style.bg} ${style.border}`}
          >
            {/* Left Accent Stripe */}
            <div className={`absolute top-0 bottom-0 left-0 w-1 ${style.accent}`} />

            {/* Icon */}
            <div className="pt-0.5">{style.icon}</div>

            {/* Text Content */}
            <div className="flex-1 pr-2">
              <h4 className={`text-xs font-bold leading-snug ${style.titleColor}`}>
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed font-normal">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
