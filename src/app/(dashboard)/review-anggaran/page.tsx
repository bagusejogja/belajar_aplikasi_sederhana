'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Layers, FileEdit, Wand2, Sparkles, 
  ArrowRight, CheckSquare, Zap, Cpu, CheckCircle2,
  Lock, TrendingUp, BarChart3, Database
} from 'lucide-react';

export default function ReviewAnggaranLanding() {
  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* 1. SLIM HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 md:p-8 shadow-xs border border-indigo-500/20">
        <div className="relative z-10 max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 border border-white/20 text-[11px] font-black text-indigo-200 backdrop-blur-md">
            <Sparkles size={13} className="text-amber-400" />
            <span>Smart Budget Review Engine (Rule Engine + AI)</span>
          </div>
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-white">
            Penelaah Anggaran Cerdas & Otomasi Aturan
          </h1>
          <p className="text-indigo-100/80 text-xs md:text-sm leading-relaxed font-medium">
            Sistem analitik cerdas yang memadukan <strong>Rule Engine Eksak</strong> dan <strong>Kecerdasan Buatan (AI)</strong> untuk mendeteksi, mengevaluasi, serta mengunci usulan anggaran wajib secara otomatis dan transparan.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none text-white">
          <ShieldCheck size={220} />
        </div>
      </div>

      {/* 2. 4 MODERN KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: RULE ENGINE EKSAK */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">METODE PENELAAHAN</span>
              <div className="text-base font-black text-gray-900 tracking-tight">
                Rule Engine Eksak
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Prioritas Penguncian</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">100% Deterministik</span>
          </div>
        </div>

        {/* CARD 2: EVALUATOR AI */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">ASISTEN CERDAS</span>
              <div className="text-base font-black text-indigo-700 tracking-tight">
                Google Gemini AI
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Cpu size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-indigo-700 flex items-center justify-between border-t border-indigo-100/60 pt-2">
            <span>Rekomendasi Penyesuaian</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold">Otomatis</span>
          </div>
        </div>

        {/* CARD 3: AUDIT & PIVOT */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">ANALITIK DATA</span>
              <div className="text-base font-black text-amber-700 tracking-tight">
                Multi-Dimensi Pivot
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>Filter Cepat Keyboard</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">Instan</span>
          </div>
        </div>

        {/* CARD 4: INTEGRASI EXCEL */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">INPUT FLEKSIBEL</span>
              <div className="text-base font-black text-gray-900 tracking-tight">
                Copas Zone Excel
              </div>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100">
              <FileEdit size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Batch Input Masal</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Siap Pakai</span>
          </div>
        </div>
      </div>

      {/* 3. 4 MODUL UTAMA DENGAN KARTU INTERAKTIF */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* MODUL 1: REVIEW USULAN ANGGARAN */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <CheckSquare size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight">Review Detail Usulan</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                Review detail hierarkis berjenjang, hitung rumus penyesuaian (Direvisi), dan filter keyboard autocomplete.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/review">
              <button className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer">
                <span>Buka Review Detail</span>
                <ArrowRight size={13} />
              </button>
            </Link>
          </div>
        </div>

        {/* MODUL 2: ADMIN REVIEW & PIVOT */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight">Portal Admin & Pivot</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                Pantau seluruh usulan anggaran, jalankan Pivot Analysis multi-dimensi, dan setujui masal rekomendasi.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/review-anggaran/admin">
              <button className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer">
                <span>Masuk Portal Admin</span>
                <ArrowRight size={13} />
              </button>
            </Link>
          </div>
        </div>

        {/* MODUL 3: MASTER ATURAN RULE ENGINE */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Wand2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight">Master Aturan (Rule Engine)</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                Atur kata kunci, nomor akun, dan prioritas aturan untuk penguncian eksak anggaran wajib (Mandatory).
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/review-anggaran/rules">
              <button className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer">
                <span>Kelola Master Aturan</span>
                <ArrowRight size={13} />
              </button>
            </Link>
          </div>
        </div>

        {/* MODUL 4: PORTAL UNIT KERJA */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
              <FileEdit size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight">Portal Unit Kerja</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                Copas baris Excel masal (Paste Zone), ajukan usulan, dan pantau status penguncian (RULE vs AI).
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link href="/review-anggaran/unit-kerja">
              <button className="w-full h-8 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer">
                <span>Masuk Portal Unit Kerja</span>
                <ArrowRight size={13} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
