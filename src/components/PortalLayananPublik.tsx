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
  ExternalLink,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Layers,
  Info,
  Maximize2
} from 'lucide-react';
import PublicNavHeader, { PUBLIC_SERVICES } from '@/components/PublicNavHeader';

interface PortalLayananPublikProps {
  embeddedInDashboard?: boolean;
}

export default function PortalLayananPublik({ embeddedInDashboard = false }: PortalLayananPublikProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'iku' | 'input-rkat' | 'input-mak' | 'input-form'>('overview');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const getFullUrl = (path: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return `https://portalkeu.vercel.app${path}`;
  };

  const handleCopy = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = getFullUrl(path);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2500);
    }).catch(err => {
      console.error('Gagal menyalin:', err);
    });
  };

  const activeService = PUBLIC_SERVICES.find(s => s.id === activeTab);

  return (
    <div className={`min-h-screen bg-slate-50/70 ${embeddedInDashboard ? 'pb-16' : 'pb-24'}`}>
      {/* Top Navbar if accessed as public standalone */}
      {!embeddedInDashboard && (
        <PublicNavHeader currentPath="/layanan-publik" title="Pusat Layanan Publik" />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* HERO BANNER */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Sparkles size={200} className="text-indigo-600" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Akses Mandiri Bebas Login</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Pusat Form & Layanan Publik <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Anggaran RKAT</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Seluruh halaman di bawah ini dapat diakses langsung oleh PIC Unit, Tim Anggaran, maupun Pimpinan tanpa perlu akun atau login. Salin tautan publik untuk dibagikan secara instan melalui WhatsApp atau Email.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  activeTab === 'overview'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Ringkasan Semua Form
              </button>

              {!embeddedInDashboard && (
                <Link
                  href="/anggaran/layanan-publik"
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Masuk ke menu lengkap dashboard dengan sidebar"
                >
                  <Layers size={14} className="text-indigo-600" />
                  <span>Buka Menu Lengkap Dashboard</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 4 SERVICE CARDS (GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Katalog IKU */}
          <div 
            onClick={() => setActiveTab('iku')}
            className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between group shadow-xs ${
              activeTab === 'iku' 
                ? 'border-blue-500 ring-2 ring-blue-200 shadow-md scale-[1.01]' 
                : 'border-slate-200/90 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Target size={20} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Katalog & Pemetaan
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Katalog & Pemetaan IKU
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Pemetaan kegiatan RKAT ke indikator IKU, rekap per referensi, checklist cek list, dan ekspor excel per IKU.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-600 truncate">
                /iku
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleCopy('/iku', e)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedPath === '/iku'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                }`}
                title="Salin tautan publik IKU"
              >
                {copiedPath === '/iku' ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                <span>{copiedPath === '/iku' ? 'Tersalin' : 'Salin Link'}</span>
              </button>

              <Link
                href="/iku"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                title="Buka di tab baru"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>

          {/* Card 2: Pengajuan Perubahan RKAT */}
          <div 
            onClick={() => setActiveTab('input-rkat')}
            className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between group shadow-xs ${
              activeTab === 'input-rkat' 
                ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md scale-[1.01]' 
                : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Semula vs Menjadi
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Pengajuan Perubahan RKAT
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Upload file RKA deteksi kolom Semula (N) vs Menjadi (R), komparasi interaktif selisih net, & pengiriman berkas.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-600 truncate">
                /input-rkat
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleCopy('/input-rkat', e)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedPath === '/input-rkat'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                }`}
                title="Salin tautan publik Perubahan RKAT"
              >
                {copiedPath === '/input-rkat' ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                <span>{copiedPath === '/input-rkat' ? 'Tersalin' : 'Salin Link'}</span>
              </button>

              <Link
                href="/input-rkat"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                title="Buka di tab baru"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>

          {/* Card 3: Pengajuan Revisi MAK Unit */}
          <div 
            onClick={() => setActiveTab('input-mak')}
            className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between group shadow-xs ${
              activeTab === 'input-mak' 
                ? 'border-violet-500 ring-2 ring-violet-200 shadow-md scale-[1.01]' 
                : 'border-slate-200/90 hover:border-violet-300 hover:shadow-md'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <FileEdit size={20} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Formulir MAK
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                  Pengajuan Revisi MAK Unit
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Form pengajuan perbaikan / revisi unit atas catatan tolakan verifikator MAK secara mandiri.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-600 truncate">
                /input-mak
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleCopy('/input-mak', e)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedPath === '/input-mak'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-violet-50 hover:bg-violet-100 text-violet-700'
                }`}
                title="Salin tautan publik Pengajuan Revisi MAK"
              >
                {copiedPath === '/input-mak' ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                <span>{copiedPath === '/input-mak' ? 'Tersalin' : 'Salin Link'}</span>
              </button>

              <Link
                href="/input-mak"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                title="Buka di tab baru"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>

          {/* Card 4: Revisi Terjadwal */}
          <div 
            onClick={() => setActiveTab('input-form')}
            className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between group shadow-xs ${
              activeTab === 'input-form' 
                ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-md scale-[1.01]' 
                : 'border-slate-200/90 hover:border-emerald-300 hover:shadow-md'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <Calendar size={20} />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Form Usulan
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Form Revisi Terjadwal
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Formulir usulan revisi anggaran terjadwal terintegrasi untuk pengajuan berkala seluruh fakultas / unit.
                </p>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-600 truncate">
                /input-form
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => handleCopy('/input-form', e)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedPath === '/input-form'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                }`}
                title="Salin tautan publik Form Revisi Terjadwal"
              >
                {copiedPath === '/input-form' ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                <span>{copiedPath === '/input-form' ? 'Tersalin' : 'Salin Link'}</span>
              </button>

              <Link
                href="/input-form"
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                title="Buka di tab baru"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          </div>

        </div>

        {/* EMBEDDED TAB VIEWER (DIJADIKAN SATU) */}
        {activeTab !== 'overview' && activeService && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden animate-in fade-in duration-200 space-y-0">
            {/* Viewer Control Bar */}
            <div className="p-4 px-6 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <activeService.icon size={16} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black">{activeService.title}</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                      Bebas Login
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {getFullUrl(activeService.path)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCopy(activeService.path)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedPath === activeService.path
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                  title="Salin tautan ini untuk dibagikan"
                >
                  {copiedPath === activeService.path ? <Check size={13} className="stroke-[3]" /> : <Copy size={13} />}
                  <span>{copiedPath === activeService.path ? 'Tersalin!' : 'Salin Tautan'}</span>
                </button>

                <Link
                  href={activeService.path}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  title="Buka layar penuh di tab baru"
                >
                  <Maximize2 size={13} />
                  <span>Buka Layar Penuh</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold"
                  title="Tutup Pratinjau"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="w-full bg-slate-50 min-h-[750px] relative">
              <iframe
                src={activeService.path}
                className="w-full h-[85vh] border-0"
                title={activeService.title}
              />
            </div>
          </div>
        )}

        {/* INFO FOOTER SECTION */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white rounded-3xl p-6 border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Share2 size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Cara Membagikan Tautan ke Unit / Pengguna
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Cukup klik tombol <strong>"Salin Link"</strong> pada salah satu layanan di atas, lalu tempel (Paste) di pesan WhatsApp, email dinas, atau memo pengumuman revisi anggaran. Penerima tidak perlu melakukan login.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/anggaran/mak"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheck size={14} className="text-indigo-600" />
              <span>Monitoring Verifikasi (MAK)</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

