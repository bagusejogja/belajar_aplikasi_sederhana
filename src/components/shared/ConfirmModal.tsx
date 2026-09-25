import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  HelpCircle, 
  X, 
  Loader2 
} from 'lucide-react';
import { SecondaryButton } from './ActionButtons';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Variant themes
  const theme = {
    danger: {
      icon: <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 focus:ring-rose-500'
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 focus:ring-amber-500'
    },
    primary: {
      icon: <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 focus:ring-blue-500'
    },
    success: {
      icon: <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900',
      confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 focus:ring-emerald-500'
    }
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-4">
          {/* Badge Icon */}
          <div className={`p-3 rounded-xl border flex-shrink-0 shadow-inner ${theme.iconBg}`}>
            {theme.icon}
          </div>

          {/* Texts */}
          <div className="flex-1 pt-0.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {title}
            </h3>
            {description && (
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                {description}
              </p>
            )}

            {children && (
              <div className="mt-3 text-xs text-slate-700 dark:text-slate-300">
                {children}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <SecondaryButton onClick={onClose} disabled={isLoading}>
            {cancelText}
          </SecondaryButton>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${theme.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
