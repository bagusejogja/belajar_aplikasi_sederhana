import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { SecondaryButton, PrimaryButton } from './ActionButtons';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void | Promise<void>;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isLoading?: boolean;
  submitDisabled?: boolean;
  hideFooter?: boolean;
}

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon,
  children,
  submitText = 'Simpan Perubahan',
  cancelText = 'Batal',
  size = 'lg',
  isLoading = false,
  submitDisabled = false,
  hideFooter = false
}: FormModalProps) {
  // Close on ESC key
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

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[size];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && !isLoading && !submitDisabled) {
      onSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog Shell */}
      <div 
        className={`relative w-full ${sizeClasses} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 my-auto`}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug font-normal">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
            {children}
          </div>

          {/* Sticky Footer */}
          {!hideFooter && (
            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-850/70 shrink-0">
              <SecondaryButton onClick={onClose} disabled={isLoading}>
                {cancelText}
              </SecondaryButton>

              <PrimaryButton 
                onClick={handleSubmit} 
                disabled={isLoading || submitDisabled}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  submitText
                )}
              </PrimaryButton>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
