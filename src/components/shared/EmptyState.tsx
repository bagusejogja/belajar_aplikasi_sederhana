import React from 'react';
import { 
  SearchX, 
  FolderOpen, 
  AlertTriangle, 
  ShieldAlert, 
  Plus, 
  RotateCcw 
} from 'lucide-react';
import { PrimaryButton, SecondaryButton } from './ActionButtons';

export interface EmptyStateProps {
  type?: 'search' | 'empty' | 'error' | 'unauthorized';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  type = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  icon,
  className = ''
}: EmptyStateProps) {
  // Default configurations based on type
  const config = {
    search: {
      defaultTitle: 'Data Tidak Ditemukan',
      defaultDesc: 'Tidak ada data yang sesuai dengan kata kunci atau filter yang Anda terapkan. Coba ubah kata kunci atau bersihkan filter.',
      defaultIcon: <SearchX className="w-12 h-12 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />,
      bgIcon: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      defaultActionLabel: 'Reset Filter',
      defaultActionIcon: <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
    },
    empty: {
      defaultTitle: 'Belum Ada Data Tersedia',
      defaultDesc: 'Belum ada rekaman data pada modul ini. Klik tombol di bawah untuk membuat atau menambahkan entri data baru.',
      defaultIcon: <FolderOpen className="w-12 h-12 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />,
      bgIcon: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      defaultActionLabel: 'Tambah Data Baru',
      defaultActionIcon: <Plus className="w-3.5 h-3.5 mr-1.5" />
    },
    error: {
      defaultTitle: 'Terjadi Kesalahan Memuat Data',
      defaultDesc: 'Gagal mengambil data dari server atau koneksi jaringan terputus. Silakan coba muat ulang halaman.',
      defaultIcon: <AlertTriangle className="w-12 h-12 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />,
      bgIcon: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      defaultActionLabel: 'Coba Lagi',
      defaultActionIcon: <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
    },
    unauthorized: {
      defaultTitle: 'Akses Ditolak',
      defaultDesc: 'Anda tidak memiliki hak akses atau peran (role) yang sesuai untuk melihat atau mengelola data pada halaman ini.',
      defaultIcon: <ShieldAlert className="w-12 h-12 text-rose-500 dark:text-rose-400" strokeWidth={1.5} />,
      bgIcon: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
      defaultActionLabel: 'Kembali ke Dashboard',
      defaultActionIcon: null
    }
  }[type];

  const displayTitle = title || config.defaultTitle;
  const displayDesc = description || config.defaultDesc;
  const displayIcon = icon || config.defaultIcon;
  const displayActionLabel = actionLabel !== undefined ? actionLabel : (onAction ? config.defaultActionLabel : undefined);

  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 my-4 transition-all ${className}`}>
      {/* Icon Capsule with subtle decorative halo */}
      <div className="relative mb-4">
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-md" />
        <div className={`relative w-20 h-20 rounded-2xl border flex items-center justify-center shadow-inner ${config.bgIcon}`}>
          {displayIcon}
        </div>
      </div>

      {/* Typography */}
      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1.5 tracking-tight">
        {displayTitle}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6 font-normal">
        {displayDesc}
      </p>

      {/* Action Buttons */}
      {(displayActionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {secondaryLabel && onSecondaryAction && (
            <SecondaryButton onClick={onSecondaryAction}>
              {secondaryLabel}
            </SecondaryButton>
          )}
          {displayActionLabel && onAction && (
            <PrimaryButton onClick={onAction}>
              {config.defaultActionIcon}
              {displayActionLabel}
            </PrimaryButton>
          )}
        </div>
      )}
    </div>
  );
}
