'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileEdit, 
  ShieldCheck, 
  XCircle 
} from 'lucide-react';

export type StatusType = 
  | 'approved' | 'disetujui' | 'verified' | 'sesuai'
  | 'pending' | 'menunggu' | 'proses'
  | 'rejected' | 'ditolak' | 'tolak'
  | 'draft' | 'usulan'
  | 'warning' | 'perhatian'
  | 'info';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'xs' | 'sm';
  showIcon?: boolean;
}

export default function StatusBadge({
  status,
  label,
  size = 'sm',
  showIcon = true,
}: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase().trim();

  let config = {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: FileEdit,
    defaultLabel: label || status,
  };

  if (['approved', 'disetujui', 'verified', 'sesuai', 'sukses'].includes(normalized)) {
    config = {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
      icon: CheckCircle2,
      defaultLabel: label || 'Disetujui',
    };
  } else if (['pending', 'menunggu', 'proses', 'review'].includes(normalized)) {
    config = {
      bg: 'bg-amber-50 text-amber-800 border-amber-200/90',
      icon: Clock,
      defaultLabel: label || 'Menunggu',
    };
  } else if (['rejected', 'ditolak', 'tolak', 'gagal'].includes(normalized)) {
    config = {
      bg: 'bg-rose-50 text-rose-800 border-rose-200/90',
      icon: XCircle,
      defaultLabel: label || 'Ditolak',
    };
  } else if (['warning', 'perhatian', 'revisi'].includes(normalized)) {
    config = {
      bg: 'bg-orange-50 text-orange-800 border-orange-200/90',
      icon: AlertCircle,
      defaultLabel: label || 'Perlu Revisi',
    };
  } else if (['info', 'aktif', 'active'].includes(normalized)) {
    config = {
      bg: 'bg-blue-50 text-blue-800 border-blue-200/90',
      icon: ShieldCheck,
      defaultLabel: label || 'Aktif',
    };
  }

  const Icon = config.icon;
  const sizeClasses = size === 'xs'
    ? 'text-[9px] px-1.5 py-0.5 gap-1'
    : 'text-[10px] px-2 py-0.5 gap-1.5';

  return (
    <span className={`inline-flex items-center font-black uppercase tracking-wider rounded-md border shadow-2xs ${config.bg} ${sizeClasses}`}>
      {showIcon && <Icon size={size === 'xs' ? 10 : 12} className="shrink-0" />}
      <span>{config.defaultLabel}</span>
    </span>
  );
}
