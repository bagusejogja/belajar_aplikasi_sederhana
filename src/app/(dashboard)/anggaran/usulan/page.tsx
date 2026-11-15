'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import UsulanAnggaranView from '@/components/UsulanAnggaranView';

export default function UsulanAnggaranPage() {
  return (
    <div className="space-y-4">
      {/* Banner info modul telah diintegrasikan */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 border border-indigo-200/80 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Layers size={16} />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800">Modul Terintegrasi Satu Menu:</span>
            <p className="text-[11px] text-slate-600 font-medium">
              Halaman ini telah digabungkan ke menu utama <strong>Rekapitulasi Revisi (MAK, RKAT, Terjadwal)</strong>.
            </p>
          </div>
        </div>
        <Link
          href="/anggaran/mak?tab=revisi-terjadwal"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <span>Buka di Menu Terpadu</span>
          <ArrowLeft size={13} className="rotate-180" />
        </Link>
      </div>

      <UsulanAnggaranView />
    </div>
  );
}
