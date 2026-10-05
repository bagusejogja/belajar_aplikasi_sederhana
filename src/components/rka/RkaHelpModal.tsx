"use client";

import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, BookOpen, Layers, GitBranch, ArrowRight, 
  CheckCircle2, AlertTriangle, FileSpreadsheet, Wand2, 
  Wallet, BarChart3, ChevronRight, Sparkles, ShieldCheck, 
  FileText, ArrowDownRight, ExternalLink, Database, Copy, Check,
  RefreshCw, Terminal, Layers2, Edit3, ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from 'react-hot-toast';
import Link from 'next/link';

export type RkaPageKey = 
  | 'pengeluaran' 
  | 'penerimaan' 
  | 'rules' 
  | 'laporan' 
  | 'penyesuaian_pengeluaran' 
  | 'penyesuaian_penerimaan';

interface RkaHelpModalProps {
  currentPage: RkaPageKey;
  className?: string;
}

export default function RkaHelpModal({ currentPage, className = '' }: RkaHelpModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'halaman' | 'alur' | 'database' | 'faq' | 'modul'>('halaman');
  const [copiedSql, setCopiedSql] = useState(false);

  // Status Probe Database Realtime
  const [dbStatus, setDbStatus] = useState<Record<string, boolean | null>>({
    rkat_pengeluaran: null,
    rkat_penerimaan: null,
    rka_rules: null,
    rka_versi_anggaran: null,
    rkat_penyesuaian: null
  });
  const [checkingDb, setCheckingDb] = useState(false);

  const checkDatabaseStatus = async () => {
    setCheckingDb(true);
    try {
      const [resVersi, resPenyesuaian] = await Promise.all([
        fetch('/api/rka/versi').catch(() => null),
        fetch('/api/rka/penyesuaian').catch(() => null)
      ]);

      const jsonVersi = resVersi ? await resVersi.json().catch(() => null) : null;
      const jsonPenyesuaian = resPenyesuaian ? await resPenyesuaian.json().catch(() => null) : null;

      setDbStatus({
        rkat_pengeluaran: true,
        rkat_penerimaan: true,
        rka_rules: true,
        rka_versi_anggaran: Boolean(jsonVersi?.hasMigrationRun),
        rkat_penyesuaian: Boolean(jsonPenyesuaian?.hasTable)
      });
    } catch {
      // ignore
    } finally {
      setCheckingDb(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === 'database') {
      checkDatabaseStatus();
    }
  }, [open, activeTab]);

  // Metadata panduan halaman
  const pageMeta: Record<RkaPageKey, {
    title: string;
    subtitle: string;
    icon: any;
    badge: string;
    color: string;
    steps: { number: string; title: string; desc: string; tip?: string }[];
    keyPoints: string[];
  }> = {
    pengeluaran: {
      title: 'Panduan Modul Belanja RKAT',
      subtitle: 'Pengelolaan data rincian belanja, pagu anggaran, realisasi, dan identifikasi format laporan.',
      icon: FileSpreadsheet,
      badge: 'BELANJA RKAT',
      color: 'indigo',
      steps: [
        {
          number: '1',
          title: 'Pilih / Gandakan Versi Anggaran',
          desc: 'Periksa basis data yang aktif (default: v1 - Penetapan Awal). Jika ada instruksi revisi/efisiensi pagu, klik tombol "+ Versi Baru" dan pilih "Salin dari v1" agar data v1 kementerian tetap terkunci aman.',
          tip: 'Data v1 tidak akan tertimpa saat Anda mengedit angka pada v2.'
        },
        {
          number: '2',
          title: 'Input atau Impor Data Belanja',
          desc: 'Klik "Buka Paste Zone (TSV)" untuk menyalin ribuan baris langsung dari Excel RKAT tanpa format khusus, atau klik "+ Tambah Belanja" untuk input satu per satu.',
          tip: 'Kolom Excel minimal mencakup unit, kelompok indikator, program, kegiatan, uraian belanja, akun, dan anggaran.'
        },
        {
          number: '3',
          title: 'Filter & Pantau Hasil Klasifikasi',
          desc: 'Gunakan tab format di bilah filter (Semua Belanja, Proposal RKAT, Laporan Kementerian, Webometrics) untuk memeriksa apakah belanja sudah terpetakan.',
          tip: 'Jika ada data berlabel "⚠️ Belum Teridentifikasi", Anda dapat memetakan aturan barunya di menu Rule Engine.'
        }
      ],
      keyPoints: [
        'Multi-Version: Bekerja pada v1 (Penetapan) & v2 (Revisi/Efisiensi) secara terpisah.',
        'Pencarian Cepat: Cari instan berdasarkan uraian belanja, akun, unit, atau kegiatan.',
        'Export Excel: Mengunduh data terfilter untuk arsip berkas kerja.'
      ]
    },
    penerimaan: {
      title: 'Panduan Modul Penerimaan RKAT',
      subtitle: 'Pencatatan target usulan pendapatan kampus (UKT, Kerjasama, dll) per unit kerja.',
      icon: Wallet,
      badge: 'PENDAPATAN',
      color: 'emerald',
      steps: [
        {
          number: '1',
          title: 'Input Rencana Penerimaan',
          desc: 'Catat usulan pendapatan per unit kerja dengan memasukkan volume, tarif, nama akun penerimaan, dan sumber dana.',
          tip: 'Penerimaan ini akan menjadi dasar perhitungan Surplus / Defisit di halaman Laporan.'
        },
        {
          number: '2',
          title: 'Impor Massal dari Excel',
          desc: 'Gunakan fitur Paste Zone TSV untuk mengunggah ratusan akun penerimaan unit kerja sekaligus secara instan.',
          tip: 'Format tabel otomatis memvalidasi kolom tarif x volume = jumlah pagu penerimaan.'
        },
        {
          number: '3',
          title: 'Kombinasi dengan Belanja',
          desc: 'Total pagu penerimaan yang tercatat di sini otomatis disandingkan dengan total pagu belanja di halaman Rekapitulasi & Laporan.',
          tip: 'Buka menu Laporan RKAT untuk melihat posisi kas: Surplus atau Defisit riil.'
        }
      ],
      keyPoints: [
        'Pagu Usulan: Akumulasi penerimaan unit kerja untuk mengimbangi usulan belanja.',
        'Sumber Dana: Mendukung Dana Masyarakat Tidak Mengikat, APBN, Hibah, dll.',
        'Status: Memantau usulan penerimaan yang sedang diajukan vs disetujui.'
      ]
    },
    penyesuaian_pengeluaran: {
      title: 'Panduan Penyesuaian RKA Pengeluaran',
      subtitle: 'Pencatatan mutasi pagu belanja: penambahan (+), pemotongan/efisiensi (-), atau pergeseran anggaran antar unit.',
      icon: Edit3,
      badge: 'PENYESUAIAN BELANJA',
      color: 'indigo',
      steps: [
        {
          number: '1',
          title: 'Pilih Unit Kerja & Rincian Belanja',
          desc: 'Tentukan Fakultas/Unit Kerja yang akan disesuaikan anggarannya, lalu pilih akun belanja atau masukkan uraian penyesuaian.',
          tip: 'Dapat memilih item belanja yang sudah ada untuk mengambil nilai Pagu Semula secara otomatis.'
        },
        {
          number: '2',
          title: 'Tentukan Jenis & Nilai Penyesuaian',
          desc: 'Pilih jenis: Penambahan Pagu (+), Pemotongan / Efisiensi (-), atau Pergeseran, lalu masukkan nominal perubahan. Sistem otomatis menghitung Pagu Setelah Penyesuaian.',
          tip: 'Contoh: Pagu Semula Rp 100 jt, Efisiensi Rp 20 jt -> Pagu Akhir Rp 80 jt.'
        },
        {
          number: '3',
          title: 'Lampirkan Dasar Hukum / Nomor SK',
          desc: 'Masukkan nomor SK Rektor / dasar revisi dan keterangan alasan penyesuaian agar akuntabel untuk audit penelaahan.',
          tip: 'Seluruh angka penyesuaian ini otomatis ditarik dan disandingkan di halaman Rekap Laporan RKA.'
        }
      ],
      keyPoints: [
        'Akuntabilitas: Dilengkapi nomor SK dan histori tanggal penyesuaian.',
        'Kompilasi Laporan: Menghasilkan kolom Pagu Awal, Penyesuaian (+/-), dan Pagu Akhir.',
        'Multi-Version: Penyesuaian dapat ditargetkan ke versi v1 maupun v2.'
      ]
    },
    penyesuaian_penerimaan: {
      title: 'Panduan Penyesuaian RKA Penerimaan',
      subtitle: 'Pencatatan penyesuaian target pendapatan (kenaikan/penurunan estimasi UKT & penerimaan lain).',
      icon: ArrowUpDown,
      badge: 'PENYESUAIAN PENDAPATAN',
      color: 'emerald',
      steps: [
        {
          number: '1',
          title: 'Pilih Unit & Akun Pendapatan',
          desc: 'Tentukan unit kerja dan akun penerimaan yang mengalami penyesuaian target.',
          tip: 'Bisa mengambil referensi dari usulan penerimaan awal yang sudah terinput.'
        },
        {
          number: '2',
          title: 'Input Nilai Penyesuaian (+ / -)',
          desc: 'Masukkan perubahan target penerimaan (misal kenaikan target kerjasama atau penurunan kuota mahasiswa UKT).',
          tip: 'Sistem otomatis memperbarui estimasi pagu penerimaan akhir.'
        },
        {
          number: '3',
          title: 'Dampak pada Posisi Kas Surplus/Defisit',
          desc: 'Perubahan penerimaan ini akan langsung mempengaruhi kartu KPI Surplus/Defisit di halaman Laporan RKA.',
          tip: 'Memastikan rencana belanja kampus tidak defisit melebihi kemampuan kas.'
        }
      ],
      keyPoints: [
        'Target Realistis: Menyesuaikan target pendapatan di tengah tahun berjalan.',
        'Sinkronisasi Kas: Otomatis menyeimbangkan posisi kas universitas di laporan.',
        'Arsip SK: Menyimpan dasar surat keputusan penetapan target baru.'
      ]
    },
    rules: {
      title: 'Panduan Rule Engine & Otomasi Pemetaan',
      subtitle: 'Mesin kecerdasan otomatis yang memetakan ribuan rincian belanja ke format pelaporan resmi.',
      icon: Wand2,
      badge: 'RULE ENGINE',
      color: 'purple',
      steps: [
        {
          number: '1',
          title: 'Buat Aturan Kata Kunci (Rule)',
          desc: 'Tentukan kata kunci pencocokan (misal: "konsumsi", "seminar", "jurnal", "gaji"), unit kerja yang ditargetkan, dan target format laporan.',
          tip: 'Mendukung operator koma (,) untuk OR dan tanda plus (+) untuk AND.'
        },
        {
          number: '2',
          title: 'Pilih Target Versi Anggaran',
          desc: 'Di bilah atas terdapat pemilih "Target Data: [ V1 ▼ ]". Anda bisa memilih mengeksekusi rule hanya pada basis data v2 tanpa merusak penandaan data v1.',
          tip: 'Kementerian tetap melihat hasil klasifikasi v1, sedangkan tim revisi memproses v2.'
        },
        {
          number: '3',
          title: 'Jalankan Rule Engine (Direct DB)',
          desc: 'Klik tombol "Jalankan Rule Engine". Sistem mengeksekusi puluhan ribu baris di database secara langsung dalam 1–2 detik.',
          tip: 'Fitur Clean Sync otomatis membersihkan penandaan lama yang aturannya sudah dihapus.'
        }
      ],
      keyPoints: [
        'Multi-Target: Memetakan ke Proposal RKAT (3 Jenjang), Laporan Kementerian, & Webometrics.',
        'Prioritas Aturan: Nilai prioritas lebih tinggi didahulukan saat ada bentrok kata kunci.',
        'Uji Coba Otomatis: Uji kata kunci sebelum rule disimpan ke database.'
      ]
    },
    laporan: {
      title: 'Panduan Rekapitulasi & Laporan RKA',
      subtitle: 'Penyajian laporan eksekutif resmi, agregasi subtotal 3 jenjang, analisis posisi kas, dan ekspor dokumen.',
      icon: BarChart3,
      badge: 'REKAP & LAPORAN',
      color: 'blue',
      steps: [
        {
          number: '1',
          title: 'Pilih Format Pelaporan & Versi',
          desc: 'Gunakan tab format untuk beralih antara "Proposal RKAT", "Laporan Kementerian", atau "Webometrics", lalu pilih basis data (v1 atau v2).',
          tip: 'Laporan otomatis mengagregasi data sesuai format dan versi yang dipilih.'
        },
        {
          number: '2',
          title: 'Pantau Posisi Kas (Surplus / Defisit)',
          desc: 'Lihat kartu KPI di bagian atas: Usulan Penerimaan vs Usulan Belanja = Posisi Kas Riil (Surplus warna hijau teal, Defisit warna merah rose).',
          tip: 'Membantu pimpinan universitas memastikan belanja tidak melebihi estimasi pendapatan.'
        },
        {
          number: '3',
          title: 'Sertakan Penyesuaian Anggaran',
          desc: 'Aktifkan opsi "Sertakan Penyesuaian" untuk menampilkan kolom: Pagu Semula, Penyesuaian (+/-), dan Pagu Akhir secara komparatif.',
          tip: 'Proposal RKAT menyajikan 3 jenjang: Subtotal Kelompok -> Subtotal Pos -> Rincian Belanja.'
        }
      ],
      keyPoints: [
        'Agregasi Dinamis: Otomatis menghitung subtotal jenjang 1, 2, dan 3.',
        'Surplus / Defisit: Perhitungan riil penerimaan vs belanja unit kerja.',
        'Cetak & Ekspor: Siap dipresentasikan ke pimpinan universitas maupun kementerian.'
      ]
    }
  };

  const currentInfo = pageMeta[currentPage] || pageMeta.pengeluaran;

  const handleCopyFullSql = () => {
    const fullSql = `-- =========================================================================
-- SQL LENGKAP ARSITEKTUR BASIS DATA RKA TERPADU (SUPABASE)
-- 1. Multi-Version Data Anggaran (v1, v2, dst)
-- 2. Penyesuaian Anggaran (+ / -) untuk Laporan
-- =========================================================================

-- 1. Tabel rkat_pengeluaran: Tambah versi_anggaran & db_id
ALTER TABLE public.rkat_pengeluaran ADD COLUMN IF NOT EXISTS versi_anggaran TEXT DEFAULT 'v1';
UPDATE public.rkat_pengeluaran SET versi_anggaran = 'v1' WHERE versi_anggaran IS NULL;
CREATE INDEX IF NOT EXISTS idx_rkat_pengeluaran_versi ON public.rkat_pengeluaran(versi_anggaran, tahun_anggaran);

-- 2. Tabel rkat_penerimaan: Tambah versi_anggaran
ALTER TABLE public.rkat_penerimaan ADD COLUMN IF NOT EXISTS versi_anggaran TEXT DEFAULT 'v1';
UPDATE public.rkat_penerimaan SET versi_anggaran = 'v1' WHERE versi_anggaran IS NULL;
CREATE INDEX IF NOT EXISTS idx_rkat_penerimaan_versi ON public.rkat_penerimaan(versi_anggaran, tahun);

-- 3. Tabel master versi anggaran: rka_versi_anggaran
CREATE TABLE IF NOT EXISTS public.rka_versi_anggaran (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  kode_versi TEXT NOT NULL,
  nama_versi TEXT NOT NULL,
  tahun_anggaran INT NOT NULL,
  modul TEXT DEFAULT 'all',
  status TEXT DEFAULT 'aktif',
  keterangan TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_rka_versi UNIQUE(kode_versi, tahun_anggaran, modul)
);
ALTER TABLE public.rka_versi_anggaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to rka_versi_anggaran" ON public.rka_versi_anggaran;
CREATE POLICY "Allow all access to rka_versi_anggaran" ON public.rka_versi_anggaran FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.rka_versi_anggaran (kode_versi, nama_versi, tahun_anggaran, modul, status, is_default, keterangan)
VALUES 
  ('v1', 'v1 - Murni (Penetapan Awal)', 2025, 'all', 'aktif', true, 'Basis data penetapan awal / usulan kementerian'),
  ('v1', 'v1 - Murni (Penetapan Awal)', 2026, 'all', 'aktif', true, 'Basis data penetapan awal / usulan kementerian'),
  ('v1', 'v1 - Murni (Penetapan Awal)', 2027, 'all', 'aktif', true, 'Basis data penetapan awal / usulan kementerian')
ON CONFLICT (kode_versi, tahun_anggaran, modul) DO NOTHING;

-- 4. Tabel Penyesuaian Anggaran: rkat_penyesuaian
CREATE TABLE IF NOT EXISTS public.rkat_penyesuaian (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  modul TEXT NOT NULL DEFAULT 'pengeluaran',
  tahun_anggaran INT NOT NULL DEFAULT 2027,
  versi_anggaran TEXT NOT NULL DEFAULT 'v1',
  unit_kerja TEXT NOT NULL,
  kode_akun TEXT,
  nama_akun TEXT NOT NULL,
  uraian TEXT NOT NULL,
  pagu_semula NUMERIC(18,2) DEFAULT 0,
  jenis_penyesuaian TEXT NOT NULL DEFAULT 'tambah',
  nilai_penyesuaian NUMERIC(18,2) NOT NULL DEFAULT 0,
  pagu_setelah NUMERIC(18,2) NOT NULL DEFAULT 0,
  no_sk TEXT,
  tanggal_sk DATE,
  keterangan TEXT,
  referensi_id BIGINT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.rkat_penyesuaian ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to rkat_penyesuaian" ON public.rkat_penyesuaian;
CREATE POLICY "Allow all access to rkat_penyesuaian" ON public.rkat_penyesuaian FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_rkat_penyesuaian_modul_tahun_versi ON public.rkat_penyesuaian(modul, tahun_anggaran, versi_anggaran);
CREATE INDEX IF NOT EXISTS idx_rkat_penyesuaian_unit ON public.rkat_penyesuaian(unit_kerja);

NOTIFY pgrst, 'reload schema';`;

    navigator.clipboard.writeText(fullSql);
    setCopiedSql(true);
    toast.success('Script SQL RKA lengkap berhasil disalin! Silakan paste & Run di Supabase SQL Editor.');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <>
      {/* Tombol Pemanggil Help (Logo '?' Saja Sesuai Permintaan) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-9 h-9 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 hover:border-indigo-400 text-indigo-700 flex items-center justify-center font-black text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0 ${className}`}
        title="Bantuan, Alur Bisnis & Skema Database"
      >
        <span className="font-mono text-base font-black group-hover:scale-110 transition-transform">?</span>
      </button>

      {/* Modal Dialog Panduan & Alur Kerja */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-0 overflow-hidden bg-white border border-gray-200 shadow-2xl max-h-[90vh] flex flex-col">
          
          {/* Header Dialog */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white relative shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-200 border-indigo-400/40 text-[10px] font-bold tracking-wider uppercase">
                {currentInfo.badge}
              </Badge>
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-[10px] font-bold">
                PANDUAN &amp; DATABASE
              </Badge>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <BookOpen size={22} className="text-indigo-400" />
              <span>{currentInfo.title}</span>
            </h2>
            <p className="text-xs text-indigo-200/90 mt-1 max-w-xl">
              {currentInfo.subtitle}
            </p>

            {/* Navigasi Tab Internal */}
            <div className="flex flex-wrap items-center gap-1.5 mt-5 bg-white/10 p-1 rounded-xl backdrop-blur-xs w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('halaman')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'halaman'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                📖 Cara Pakai
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('alur')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'alur'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                🔄 Alur Bisnis
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('database')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'database'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Database size={13} />
                <span>Info Database &amp; Skema</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'faq'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                💡 FAQ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('modul')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'modul'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                🧭 Peta Modul
              </button>
            </div>
          </div>

          {/* Konten Tab Body (Scrollable) */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 text-xs leading-relaxed">
            
            {/* TAB 1: CARA PAKAI HALAMAN INI */}
            {activeTab === 'halaman' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Sparkles size={16} className="text-indigo-600" />
                    <span>Langkah-Langkah Operasional</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {currentInfo.steps.map((st) => (
                      <div key={st.number} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 hover:border-indigo-200 transition-colors">
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-xs">
                          {st.number}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-900 text-xs">{st.title}</h4>
                          <p className="text-gray-600">{st.desc}</p>
                          {st.tip && (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-lg mt-1.5">
                              <CheckCircle2 size={12} className="shrink-0" />
                              <span>Tips: {st.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Points / Fitur Unggulan */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    <span>Poin Kunci &amp; Keamanan Sistem</span>
                  </h4>
                  <ul className="space-y-1.5 text-gray-700">
                    {currentInfo.keyPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: ALUR BISNIS KESELURUHAN (END-TO-END) */}
            {activeTab === 'alur' && (
              <div className="space-y-5">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Konsep Utama: Multi-Version, Penyesuaian &amp; Multi-Format</span>
                  </p>
                  Sistem RKA ini memisahkan antara <strong>Lapisan Data Anggaran (v1, v2, dst)</strong>, <strong>Penyesuaian (+/-)</strong>, dan <strong>Format Pelaporan Resmi (Proposal RKAT, Kementerian, Webometrics)</strong> agar proses audit tidak saling tumpang tindih.
                </div>

                {/* Diagram Alur Visual 5 Tahap */}
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-2">
                    Siklus 5 Tahap Alur RKA &amp; Penyesuaian:
                  </h3>

                  {/* Tahap 1 */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-indigo-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-black text-[10px]">TAHAP 1</span>
                        <h4 className="font-black text-gray-900 text-xs">Input Data Usulan Awal (Belanja &amp; Penerimaan)</h4>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono font-bold">
                        Basis: v1 - Penetapan Awal
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Seluruh rincian usulan belanja dan target pendapatan unit kerja diinput atau di-paste dari Excel. Data awal ini otomatis dilabeli sebagai <strong>Versi v1</strong>.
                    </p>
                  </div>

                  <div className="flex justify-center text-indigo-400">
                    <ArrowDownRight size={20} className="rotate-45" />
                  </div>

                  {/* Tahap 2 */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-purple-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-black text-[10px]">TAHAP 2</span>
                        <h4 className="font-black text-gray-900 text-xs">Otomasi Klasifikasi via Rule Engine</h4>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono font-bold">
                        Modul /rka/rules
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Rule Engine membaca kata kunci uraian belanja dan memetakannya otomatis ke 3 format resmi: <strong>Proposal RKAT (3 Jenjang)</strong>, <strong>Laporan Kementerian</strong>, dan <strong>Laporan Webometrics</strong>. Eksekusi dilakukan per target versi tanpa saling mengganggu.
                    </p>
                  </div>

                  <div className="flex justify-center text-indigo-400">
                    <ArrowDownRight size={20} className="rotate-45" />
                  </div>

                  {/* Tahap 3 */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-blue-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-black text-[10px]">TAHAP 3</span>
                        <h4 className="font-black text-gray-900 text-xs">Input Penyesuaian Anggaran (+ / -)</h4>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-mono font-bold">
                        Menu Penyesuaian
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Bila ada perubahan pagu resmi (efisiensi, penambahan pagu, atau pergeseran akun antar unit), catat di menu <strong>Penyesuaian RKA Pengeluaran / Penerimaan</strong> lengkap dengan Nomor SK Rektor.
                    </p>
                  </div>

                  <div className="flex justify-center text-indigo-400">
                    <ArrowDownRight size={20} className="rotate-45" />
                  </div>

                  {/* Tahap 4 */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-emerald-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-black text-[10px]">TAHAP 4</span>
                        <h4 className="font-black text-gray-900 text-xs">Laporan Eksekutif: Pagu Semula vs Penyesuaian vs Akhir</h4>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono font-bold">
                        Modul /rka/laporan
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Di halaman Laporan, Anda bisa menyandingkan: <strong>Pagu Semula</strong> + <strong>Penyesuaian (+/-)</strong> = <strong>Pagu Akhir</strong>, serta memantau posisi kas riil (Surplus / Defisit).
                    </p>
                  </div>

                  <div className="flex justify-center text-indigo-400">
                    <ArrowDownRight size={20} className="rotate-45" />
                  </div>

                  {/* Tahap 5 */}
                  <div className="p-4 rounded-2xl bg-white border-2 border-amber-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-black text-[10px]">TAHAP 5</span>
                        <h4 className="font-black text-gray-900 text-xs">Branching Versi Baru (v2, v3, dst)</h4>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-mono font-bold">
                        Tombol + Versi Baru
                      </Badge>
                    </div>
                    <p className="text-gray-600">
                      Jika revisi berskala besar, Anda dapat meng-clone seluruh data ke <strong>v2</strong> tanpa menyentuh data <strong>v1</strong> yang sedang ditelaah kementerian.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INFO DATABASE & SKEMA DATA */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                
                {/* Header Info DB & Status Probe */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="text-indigo-400" size={18} />
                      <h3 className="font-black text-xs uppercase tracking-wider">
                        Status &amp; Skema Database Supabase
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={checkDatabaseStatus}
                      disabled={checkingDb}
                      className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-white px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <RefreshCw size={12} className={checkingDb ? 'animate-spin' : ''} />
                      <span>{checkingDb ? 'Memeriksa...' : 'Cek Status'}</span>
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-300">
                    Sistem RKA menggunakan 5 tabel utama di skema <code className="text-indigo-300 font-mono">public</code> Supabase. Seluruh tabel telah dirancang dengan isolasi versi, pagination cursor, dan optimasi indeks.
                  </p>

                  {/* Status Indicator Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-700">
                    {Object.entries(dbStatus).map(([tbl, isOk]) => (
                      <div key={tbl} className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-[11px] font-mono">
                        <span className="truncate">{tbl}</span>
                        {isOk === true ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">● Ready</span>
                        ) : isOk === false ? (
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">⚠️ Perlu SQL</span>
                        ) : (
                          <span className="text-gray-400">Memeriksa...</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabel Rincian Skema 5 Tabel */}
                <div className="space-y-3">
                  <h4 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Layers2 size={15} className="text-indigo-600" />
                    <span>Daftar 5 Tabel Utama RKA &amp; Kolom Kunci:</span>
                  </h4>

                  {/* Table 1: rkat_pengeluaran */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-indigo-700 text-xs">1. public.rkat_pengeluaran</span>
                      <Badge variant="outline" className="text-[9px] bg-white">Belanja RKAT</Badge>
                    </div>
                    <p className="text-gray-600 text-[11px] mb-2">
                      Menyimpan seluruh baris rincian belanja, pagu usulan, realisasi, dan penandaan format.
                    </p>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-gray-700">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">id (BIGINT PK)</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">versi_anggaran (TEXT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">tahun_anggaran (INT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">unit (TEXT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">uraian_belanja (TEXT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">anggaran (NUMERIC)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">laporan_kementerian (TEXT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">tags (JSONB)</span>
                    </div>
                  </div>

                  {/* Table 2: rkat_penerimaan */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-emerald-700 text-xs">2. public.rkat_penerimaan</span>
                      <Badge variant="outline" className="text-[9px] bg-white">Penerimaan RKAT</Badge>
                    </div>
                    <p className="text-gray-600 text-[11px] mb-2">
                      Menyimpan usulan target penerimaan (UKT, Kerjasama, dll) per unit kerja.
                    </p>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-gray-700">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">id (BIGINT PK)</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">versi_anggaran (TEXT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">tahun (INT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">unit_kerja (TEXT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">nama_akun_penerimaan (TEXT)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">renterima_pagu (NUMERIC)</span>
                    </div>
                  </div>

                  {/* Table 3: rkat_penyesuaian (BARU) */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-blue-800 text-xs">3. public.rkat_penyesuaian (Tabel Baru)</span>
                      <Badge variant="outline" className="text-[9px] bg-blue-100 text-blue-800 border-blue-300">Penyesuaian (+/-)</Badge>
                    </div>
                    <p className="text-gray-600 text-[11px] mb-2">
                      Mencatat mutasi penyesuaian belanja &amp; penerimaan untuk disandingkan di laporan (Pagu Semula, Penyesuaian, Pagu Akhir).
                    </p>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-gray-700">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">modul ('pengeluaran'|'penerimaan')</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">pagu_semula (NUMERIC)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-bold">jenis_penyesuaian ('tambah'|'kurang')</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-bold">nilai_penyesuaian (NUMERIC)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-bold">pagu_setelah (NUMERIC)</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">no_sk (TEXT)</span>
                    </div>
                  </div>

                  {/* Table 4: rka_rules */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-purple-700 text-xs">4. public.rka_rules</span>
                      <Badge variant="outline" className="text-[9px] bg-white">Rule Engine</Badge>
                    </div>
                    <p className="text-gray-600 text-[11px] mb-2">
                      Kamus kata kunci untuk klasifikasi otomatis Proposal RKAT, Kementerian, &amp; Webometrics.
                    </p>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-gray-700">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">id</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">modul</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">keywords</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">target_field</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">target_value</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">priority</span>
                    </div>
                  </div>

                  {/* Table 5: rka_versi_anggaran */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-black text-indigo-700 text-xs">5. public.rka_versi_anggaran</span>
                      <Badge variant="outline" className="text-[9px] bg-white">Master Versi</Badge>
                    </div>
                    <p className="text-gray-600 text-[11px] mb-2">
                      Master riwayat cabang versi data: v1 (Penetapan), v2 (Efisiensi), v3 (Perubahan).
                    </p>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px] text-gray-700">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">kode_versi ('v1','v2')</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">nama_versi</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">tahun_anggaran</span>
                      <span className="px-1.5 py-0.5 rounded bg-white border border-gray-200">status ('aktif'|'terkunci')</span>
                    </div>
                  </div>
                </div>

                {/* Tombol Copy SQL */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h5 className="font-black text-indigo-950 text-xs">Aktivasi Skema Supabase Lengkap</h5>
                    <p className="text-gray-600 text-[11px]">
                      Salin seluruh script SQL DDL (Multi-version + Penyesuaian) dan jalankan di SQL Editor Supabase.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyFullSql}
                    className="h-8.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Lengkap'}</span>
                  </Button>
                </div>

              </div>
            )}

            {/* TAB 4: FAQ & KASUS PENGGUNAAN RIIL */}
            {activeTab === 'faq' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">Q</span>
                    <span>Apa bedanya fitur "Versi Baru (v2)" dengan "Input Penyesuaian"?</span>
                  </h4>
                  <p className="text-gray-600 pl-7 text-[11px]">
                    <strong>Versi Baru (v2):</strong> Digunakan untuk membuat snapshot/cabang data baru yang independen (misal seluruh data dirombak untuk efisiensi tahun berjalan).
                    <br />
                    <strong>Input Penyesuaian:</strong> Digunakan untuk mencatat mutasi (+/-) pada baris anggaran tertentu yang dilengkapi nomor SK, sehingga di laporan dapat tampil kolom: <em>Pagu Semula</em>, <em>Penyesuaian</em>, dan <em>Pagu Akhir</em> secara komparatif.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">Q</span>
                    <span>Apakah data v1 akan hilang jika saya klik "+ Versi Baru"?</span>
                  </h4>
                  <p className="text-gray-600 pl-7 text-[11px]">
                    <strong>Sama sekali tidak!</strong> Versi v1 tetap tersimpan utuh di database sebagai arsip penetapan resmi. Anda bisa kapan saja kembali memilih <strong>v1</strong> pada dropdown versi untuk melihat, memvalidasi, atau mencetak laporan awal.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">Q</span>
                    <span>Mengapa ada data yang masuk kategori "⚠️ Belum Teridentifikasi"?</span>
                  </h4>
                  <p className="text-gray-600 pl-7 text-[11px]">
                    Artinya rincian belanja tersebut belum memiliki kata kunci yang cocok dengan aturan di <strong>Rule Engine</strong>. Buka halaman <strong>/rka/rules</strong>, tambahkan aturan baru (misal kata kunci: "seminar" atau "pelatihan"), lalu klik <strong>Jalankan Rule Engine</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">Q</span>
                    <span>Bagaimana cara menyusun Proposal RKAT 3 Jenjang?</span>
                  </h4>
                  <p className="text-gray-600 pl-7 text-[11px]">
                    Buka halaman <strong>/rka/laporan</strong> dan pilih tab <strong>Proposal RKAT</strong>. Sistem otomatis membentuk 3 jenjang hierarki: 
                    <br /><strong>Jenjang 1:</strong> Subtotal Kelompok Belanja (Operasional, SDM, dll).
                    <br /><strong>Jenjang 2:</strong> Subtotal Pos Akun Belanja.
                    <br /><strong>Jenjang 3:</strong> Rincian Data Belanja Unit.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: NAVIGASI CEPAT ANTAR MODUL RKA */}
            {activeTab === 'modul' && (
              <div className="space-y-4">
                <p className="text-gray-600 text-xs">
                  Modul RKA terintegrasi terdiri dari 6 modul kerja:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Card 1: Belanja */}
                  <Link 
                    href="/rka/pengeluaran"
                    onClick={() => setOpen(false)}
                    className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <FileSpreadsheet size={16} />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono font-bold">/rka/pengeluaran</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs group-hover:text-indigo-600 transition-colors">
                        1. Belanja RKAT
                      </h4>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Input, edit, paste TSV, serta kelola versi data anggaran (v1, v2).
                      </p>
                    </div>
                  </Link>

                  {/* Card 2: Penyesuaian Belanja */}
                  <Link 
                    href="/rka/penyesuaian-pengeluaran"
                    onClick={() => setOpen(false)}
                    className="p-3.5 rounded-2xl bg-white border border-indigo-200 hover:border-indigo-600 hover:shadow-md transition-all group flex flex-col justify-between bg-indigo-50/20"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Edit3 size={16} />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700">Baru</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs group-hover:text-indigo-600 transition-colors">
                        2. Penyesuaian Belanja
                      </h4>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Catat penambahan (+), efisiensi (-), atau pergeseran pagu belanja.
                      </p>
                    </div>
                  </Link>

                  {/* Card 3: Penerimaan */}
                  <Link 
                    href="/rka/penerimaan"
                    onClick={() => setOpen(false)}
                    className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <Wallet size={16} />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono font-bold">/rka/penerimaan</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs group-hover:text-emerald-600 transition-colors">
                        3. Penerimaan RKAT
                      </h4>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Catat target penerimaan UKT &amp; pendapatan unit kerja.
                      </p>
                    </div>
                  </Link>

                  {/* Card 4: Penyesuaian Penerimaan */}
                  <Link 
                    href="/rka/penyesuaian-penerimaan"
                    onClick={() => setOpen(false)}
                    className="p-3.5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-600 hover:shadow-md transition-all group flex flex-col justify-between bg-emerald-50/20"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <ArrowUpDown size={16} />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700">Baru</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs group-hover:text-emerald-600 transition-colors">
                        4. Penyesuaian Penerimaan
                      </h4>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Catat penyesuaian kenaikan/penurunan estimasi pendapatan.
                      </p>
                    </div>
                  </Link>

                  {/* Card 5: Rule Engine */}
                  <Link 
                    href="/rka/rules"
                    onClick={() => setOpen(false)}
                    className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <Wand2 size={16} />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono font-bold">/rka/rules</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs group-hover:text-purple-600 transition-colors">
                        5. Rule Engine
                      </h4>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Aturan kata kunci cerdas pemetaan format laporan resmi.
                      </p>
                    </div>
                  </Link>

                  {/* Card 6: Laporan */}
                  <Link 
                    href="/rka/laporan"
                    onClick={() => setOpen(false)}
                    className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <BarChart3 size={16} />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono font-bold">/rka/laporan</Badge>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs group-hover:text-blue-600 transition-colors">
                        6. Rekapitulasi &amp; Laporan
                      </h4>
                      <p className="text-gray-500 text-[11px] mt-1">
                        Ekspor Excel Proposal RKAT, Kementerian, &amp; Analisis Kas.
                      </p>
                    </div>
                  </Link>

                </div>
              </div>
            )}

          </div>

          {/* Footer Dialog */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-gray-500">
              Modul RKA Terpadu • Multi-Version, Penyesuaian &amp; Multi-Format
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 rounded-xl text-xs font-bold px-4"
            >
              Tutup Panduan
            </Button>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
