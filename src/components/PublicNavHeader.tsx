'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Target, 
  FileSpreadsheet, 
  FileEdit, 
  Calendar, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink,
  Share2,
  Layers
} from 'lucide-react';

interface PublicNavHeaderProps {
  currentPath: string;
  title?: string;
  subtitle?: string;
}

export const PUBLIC_SERVICES = [
  {
    id: 'iku',
    path: '/iku',
    title: 'Katalog IKU',
    shortName: 'Katalog IKU',
    icon: Target,
    color: 'from-blue-600 to-indigo-600',
    textColor: 'text-blue-600',
    badge: 'Pemetaan RKAT',
    desc: 'Pemetaan kegiatan RKAT ke indikator IKU'
  },
  {
    id: 'input-rkat',
    path: '/input-rkat',
    title: 'Perubahan RKAT',
    shortName: 'Perubahan RKAT',
    icon: FileSpreadsheet,
    color: 'from-indigo-600 to-indigo-800',
    textColor: 'text-indigo-600',
    badge: 'Semula vs Menjadi',
    desc: 'Pengajuan revisi anggaran RKAT unit mandiri'
  },
  {
    id: 'input-mak',
    path: '/input-mak',
    title: 'Pengajuan Revisi MAK',
    shortName: 'Revisi MAK',
    icon: FileEdit,
    color: 'from-violet-600 to-purple-600',
    textColor: 'text-purple-600',
    badge: 'Revisi Unit',
    desc: 'Formulir pengajuan revisi mata anggaran MAK'
  },
  {
    id: 'input-form',
    path: '/input-form',
    title: 'Revisi Terjadwal',
    shortName: 'Revisi Terjadwal',
    icon: Calendar,
    color: 'from-emerald-600 to-teal-600',
    textColor: 'text-emerald-600',
    badge: 'Form Usulan',
    desc: 'Formulir usulan revisi anggaran terjadwal unit'
  },
  {
    id: 'layanan-publik',
    path: '/layanan-publik',
    title: 'Pusat Layanan Publik',
    shortName: 'Semua Layanan',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-600',
    badge: 'Hub Publik',
    desc: 'Pusat semua formulir & layanan publik tanpa login'
  }
];

export default function PublicNavHeader({ currentPath, title }: PublicNavHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    let fullUrl = '';
    if (typeof window !== 'undefined') {
      fullUrl = `${window.location.origin}${currentPath}`;
    } else {
      fullUrl = `https://portalkeu.vercel.app${currentPath}`;
    }

    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Gagal menyalin tautan:', err);
    });
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Status Bebas Login */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <Link 
            href="/layanan-publik" 
            className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
            title="Buka Pusat Layanan Publik"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shadow-indigo-200">
              PK
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  PORTALKEU
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200">
                  Publik
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Layanan Mandiri Tanpa Login</p>
            </div>
          </Link>

          {/* Tombol Salin Link Publik (Mobile) */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                copied 
                  ? 'bg-emerald-600 text-white shadow-emerald-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
              title="Salin tautan ini untuk dibagikan tanpa login"
            >
              {copied ? <Check size={14} className="stroke-[3]" /> : <Share2 size={14} />}
              <span>{copied ? 'Tersalin!' : 'Bagi Link'}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher Layanan Publik */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 custom-scrollbar">
          {PUBLIC_SERVICES.map((srv) => {
            const Icon = srv.icon;
            const isActive = currentPath === srv.path;

            return (
              <Link
                key={srv.id}
                href={srv.path}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-300 scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 active:scale-98'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : srv.textColor} />
                <span>{srv.shortName}</span>
              </Link>
            );
          })}
        </div>

        {/* Tombol Salin Link Publik (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer border ${
              copied 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200' 
                : 'bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300'
            }`}
            title={`Salin tautan publik "${title || currentPath}" untuk dibagikan ke WhatsApp / Email tanpa perlu login`}
          >
            {copied ? (
              <>
                <Check size={14} className="stroke-[3] text-white" />
                <span>Tautan Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-indigo-600" />
                <span>Salin Link Publik</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
