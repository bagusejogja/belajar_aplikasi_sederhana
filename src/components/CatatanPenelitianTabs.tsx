'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, BarChart3, FileSpreadsheet, ShieldCheck } from 'lucide-react';

export default function CatatanPenelitianTabs() {
  const pathname = usePathname();

  const isInput = pathname === '/catatan-penelitian' || pathname === '/catatan-penelitian/input';
  const isLaporan = pathname.startsWith('/catatan-penelitian/laporan');

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200/90 dark:border-slate-800 -mx-4 sm:-mx-8 -mt-6 sm:-mt-8 mb-6 px-4 sm:px-8 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-slate-100 tracking-tight leading-none">
              Catatan Pengeluaran Kegiatan &amp; Penelitian
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-1">
              Pencatatan mandiri pengeluaran, dokumentasi 4 foto bukti, dan rekapitulasi laporan SPJ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck size={12} />
            <span>Folder: lampiran_penelitian</span>
          </span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        <Link
          href="/catatan-penelitian"
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            isInput
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 hover:border-gray-300'
          }`}
        >
          <PlusCircle size={15} />
          <span>Form Input Pengeluaran</span>
        </Link>

        <Link
          href="/catatan-penelitian/laporan"
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            isLaporan
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 hover:border-gray-300'
          }`}
        >
          <BarChart3 size={15} />
          <span>Laporan &amp; Riwayat Pengeluaran</span>
        </Link>
      </div>
    </div>
  );
}

