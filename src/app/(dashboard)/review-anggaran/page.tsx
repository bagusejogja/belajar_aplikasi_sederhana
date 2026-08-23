'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Layers, FileEdit, Wand2, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReviewAnggaranLanding() {
  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-8 md:p-12 shadow-xl border border-indigo-500/20">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-indigo-200 backdrop-blur-md">
            <Sparkles size={14} /> Smart Budget Review Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Penelaah Anggaran Cerdas (Rule Engine + AI)
          </h1>
          <p className="text-indigo-100/80 text-base md:text-lg leading-relaxed font-medium">
            Sistem analitik cerdas yang memadukan <strong>Rule Engine Eksak</strong> dan <strong>Kecerdasan Buatan (AI)</strong> untuk mendeteksi, mengevaluasi, serta mengunci usulan anggaran wajib secara otomatis.
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none text-white">
          <ShieldCheck size={280} />
        </div>
      </div>

      {/* Portal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Review Detail Anggaran */}
        <Card className="bg-white border-gray-200 hover:border-indigo-500/50 hover:shadow-lg transition-all group ring-2 ring-indigo-500/10">
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <CheckSquare size={24} />
            </div>
            <CardTitle className="text-2xl text-gray-900">Review Usulan</CardTitle>
            <CardDescription className="text-gray-500">
              Review detail hierarkis berjenjang, hitung rumus penyesuaian (Direvisi), dan filter keyboard autocomplete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/review">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-sm font-bold">
                Buka Review Detail <ArrowRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Review & Pivot */}
        <Card className="bg-white border-gray-200 hover:border-indigo-500/50 hover:shadow-lg transition-all group">
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Layers size={24} />
            </div>
            <CardTitle className="text-2xl text-gray-900">Portal Admin & Pivot</CardTitle>
            <CardDescription className="text-gray-500">
              Pantau seluruh usulan anggaran, jalankan Pivot Analysis multi-dimensi, dan setujui masal rekomendasi AI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/review-anggaran/admin">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-sm">
                Masuk Portal Admin <ArrowRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Master Aturan (Rule Engine) */}
        <Card className="bg-white border-gray-200 hover:border-emerald-500/50 hover:shadow-lg transition-all group">
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <Wand2 size={24} />
            </div>
            <CardTitle className="text-2xl text-gray-900">Master Aturan (Rule Engine)</CardTitle>
            <CardDescription className="text-gray-500">
              Atur kata kunci, nomor akun, dan prioritas aturan untuk penguncian eksak anggaran wajib (Mandatory).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/review-anggaran/rules">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                Kelola Master Aturan <ArrowRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Portal Unit Kerja */}
        <Card className="bg-white border-gray-200 hover:border-blue-500/50 hover:shadow-lg transition-all group">
          <CardHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <FileEdit size={24} />
            </div>
            <CardTitle className="text-2xl text-gray-900">Portal Unit Kerja</CardTitle>
            <CardDescription className="text-gray-500">
              Copas baris Excel masal (Paste Zone), ajukan usulan, dan pantau status penguncian (RULE vs AI).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/review-anggaran/unit-kerja">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                Masuk Unit Kerja <ArrowRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
