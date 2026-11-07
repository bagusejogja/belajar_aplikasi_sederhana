'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Search, 
  Filter, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  FileCode,
  Landmark,
  Scale,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface TemplateDoc {
  id: string;
  title: string;
  category: 'EXCEL' | 'SURAT' | 'REGULASI' | 'PANDUAN';
  format: 'XLSX' | 'DOCX' | 'PDF' | 'GUIDE';
  fileSize: string;
  version: string;
  description: string;
  tags: string[];
  lastUpdated: string;
  downloadAction?: () => void;
  directLink?: string;
}

export default function PanduanTemplatePage() {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper download file Excel template RKA Pengeluaran
  const downloadTemplateRkaPengeluaran = () => {
    try {
      const sampleData = [
        {
          "Tahun": 2026,
          "Kode Unit": "01.01",
          "Unit Kerja": "Fakultas Ekonomika dan Bisnis",
          "Program": "Penyelenggaraan Pendidikan Sarjana",
          "Kegiatan": "Operasional Perkuliahan Reguler",
          "Uraian Belanja": "Pengadaan ATK Perkuliahan Semester Gasal",
          "Akun Detail": "521811 - Belanja Barang Persediaan Barang Konsumsi",
          "Prioritas": "Tinggi",
          "Anggaran": 45000000,
          "Sumber Dana": "Masyarakat (UKT)",
          "Laporan Kementerian": "Operasional Kampus",
          "Laporan Webometrics": "Pengembangan Konten Akademik"
        },
        {
          "Tahun": 2026,
          "Kode Unit": "01.01",
          "Unit Kerja": "Fakultas Ekonomika dan Bisnis",
          "Program": "Riset dan Pengabdian",
          "Kegiatan": "Hibah Penelitian Dosen Pemula",
          "Uraian Belanja": "Honor Narasumber Seminar Nasional Hasil Riset",
          "Akun Detail": "521213 - Belanja Honorarium Narasumber",
          "Prioritas": "Sedang",
          "Anggaran": 18000000,
          "Sumber Dana": "BOPTN Riset",
          "Laporan Kementerian": "Peningkatan Kualitas Publikasi",
          "Laporan Webometrics": "Research Citations Output"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template_RKA_Pengeluaran");
      XLSX.writeFile(wb, "Template_RKA_Pengeluaran_UGM_2026.xlsx");
      toast.success("Template Excel RKA Pengeluaran berhasil diunduh");
    } catch (err: any) {
      toast.error("Gagal mengunduh template: " + err.message);
    }
  };

  // Helper download file TSV template RKA Penerimaan
  const downloadTemplateRkaPenerimaan = () => {
    try {
      const header = "Tahun\tUnit Kerja\tKode Akun\tNama Akun Penerimaan\tTarget Anggaran\tRealisasi\tSumber Dana\tKeterangan\n";
      const sampleRow = "2026\tFakultas Teknik\t423111\tPendapatan Jasa Layanan Pendidikan Non-Gelar\t750000000\t0\tPendapatan Mandiri Unit\tPelatihan Sertifikasi Rekayasa Keinsinyuran\n";
      const blob = new Blob([header + sampleRow], { type: 'text/tab-separated-values;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "Template_Impor_TSV_RKA_Penerimaan.tsv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Template TSV Penerimaan berhasil diunduh");
    } catch (err: any) {
      toast.error("Gagal mengunduh: " + err.message);
    }
  };

  // Daftar Panduan & Template Dokumen Baku
  const templateList: TemplateDoc[] = [
    {
      id: 'tpl-rka-pengeluaran',
      title: 'Template Baku Impor RKA Pengeluaran UGM 2026',
      category: 'EXCEL',
      format: 'XLSX',
      fileSize: '18 KB',
      version: 'v2026.1',
      description: 'Format baku spreadsheet untuk impor massal rencana belanja unit ke modul RKA Pengeluaran, lengkap dengan kolom klasifikasi Laporan Kementerian dan Webometrics.',
      tags: ['RKA', 'Pengeluaran', 'Spreadsheet', 'Impor'],
      lastUpdated: '1 Januari 2026',
      downloadAction: downloadTemplateRkaPengeluaran
    },
    {
      id: 'tpl-rka-penerimaan',
      title: 'Template Impor TSV RKA Penerimaan Mandiri & Jasa',
      category: 'EXCEL',
      format: 'XLSX',
      fileSize: '12 KB',
      version: 'v2026.1',
      description: 'Format Tab-Separated Value (TSV) untuk salin-tempel cepat target penerimaan unit, UKT, dan layanan non-akademik.',
      tags: ['RKA', 'Penerimaan', 'TSV', 'Fast Import'],
      lastUpdated: '1 Januari 2026',
      downloadAction: downloadTemplateRkaPenerimaan
    },
    {
      id: 'tpl-surat-usulan-pagu',
      title: 'Draft Naskah Dinas Surat Usulan Tambah Pagu Unit',
      category: 'SURAT',
      format: 'DOCX',
      fileSize: '34 KB',
      version: 'v2.4',
      description: 'Template surat permohonan penambahan pagu anggaran dari Pimpinan Fakultas/Unit ke Wakil Rektor Bidang Keuangan, lengkap dengan nomor surat, latar belakang, dan rincian belanja.',
      tags: ['Surat Dinas', 'Tambah Pagu', 'Analisis', 'Naskah Resmi'],
      lastUpdated: '15 Januari 2026',
      directLink: '/analisis'
    },
    {
      id: 'tpl-surat-balasan-setuju',
      title: 'Template Surat Rekomendasi / Balasan Persetujuan Pagu',
      category: 'SURAT',
      format: 'DOCX',
      fileSize: '29 KB',
      version: 'v2.0',
      description: 'Format naskah dinas keputusan persetujuan penuh atau persetujuan bersyarat dari Direktorat Keuangan kepada Dekan/Kepala Unit.',
      tags: ['Surat Persetujuan', 'Direktorat Keuangan', 'Keputusan'],
      lastUpdated: '20 Januari 2026',
      directLink: '/analisis'
    },
    {
      id: 'tpl-sbu-ugm-2026',
      title: 'Standar Biaya Umum (SBU) & Standar Biaya Masukan UGM 2026',
      category: 'REGULASI',
      format: 'PDF',
      fileSize: '2.4 MB',
      version: 'Peraturan Rektor 2026',
      description: 'Buku pedoman resmi plafon tarif honorarium narasumber, biaya transport, uang harian rapat konsinyering, akomodasi, dan batas maksimum belanja barang.',
      tags: ['SBU 2026', 'Tarif Honor', 'Plafon Belanja', 'Audit'],
      lastUpdated: 'Januari 2026',
      directLink: '/design-system'
    },
    {
      id: 'tpl-sk-revisi-mak',
      title: 'Pedoman Pergeseran Anggaran Antar MAK & Antar Akun',
      category: 'REGULASI',
      format: 'PDF',
      fileSize: '850 KB',
      version: 'Edaran Dir. Keuangan',
      description: 'Aturan batas kewenangan unit dalam melakukan revisi mata anggaran (MAK), prosedur tanpa menambah pagu, dan syarat dokumen pendukung.',
      tags: ['Pergeseran MAK', 'Revisi Anggaran', 'Kewenangan'],
      lastUpdated: 'Februari 2026',
      directLink: '/perubahan-rkat'
    },
    {
      id: 'tpl-guide-5tahap',
      title: 'Panduan Operasional Alur 5 Tahap Analisis Usulan Pagu',
      category: 'PANDUAN',
      format: 'GUIDE',
      fileSize: 'Dokumentasi Sistem',
      version: 'v3.0 Interactive',
      description: 'Panduan langkah demi langkah memproses usulan unit: Verifikasi Dokumen -> Audit Posisi Pagu -> Identifikasi MAK -> Ringkasan AI -> Draft Keputusan.',
      tags: ['Alur Kerja', 'SOP Analisis', 'Verifikator'],
      lastUpdated: 'Maret 2026',
      directLink: '/analisis'
    },
    {
      id: 'tpl-guide-komparasi',
      title: 'Petunjuk Komparasi & Audit Perubahan RKAT Multi-Versi',
      category: 'PANDUAN',
      format: 'GUIDE',
      fileSize: 'Dokumentasi Sistem',
      version: 'v2.1',
      description: 'Cara memeriksa selisih alokasi belanja awal (v1) dengan penyesuaian (v2/v3) dan mencetak berita acara rekonsiliasi pagu.',
      tags: ['Audit', 'RKAT Multi-Versi', 'Rekonsiliasi'],
      lastUpdated: 'Maret 2026',
      directLink: '/perubahan-rkat'
    }
  ];

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templateList.filter(item => {
      const matchCat = activeCategory === 'ALL' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        item.title.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  const handleCopyTitle = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Judul dokumen disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen pb-24 space-y-6 max-w-7xl mx-auto">
      
      {/* ========================================================== */}
      {/* 🌟 HERO BANNER: PUSAT PANDUAN & DOKUMEN BAKU UGM 2026      */}
      {/* ========================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-300 text-[11px] font-bold border border-white/10">
              <BookOpen size={14} className="text-amber-400" />
              <span>Pusat Regulasi, SBU &amp; Template Baku Keuangan UGM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Repositori Template Resmi &amp; Pedoman Anggaran 2026
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Unduh template spreadsheet RKA, draf naskah dinas usulan tambah pagu, Standar Biaya Umum (SBU), serta panduan langkah verifikasi terintegrasi untuk seluruh unit kerja.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 shrink-0">
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Standar Terverifikasi</span>
              <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck size={16} /> SBU &amp; RKA 2026 Valid
              </span>
            </div>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Template</span>
              <span className="text-sm font-black text-amber-300 flex items-center gap-1.5 mt-0.5">
                <FileSpreadsheet size={16} /> {templateList.length} Berkas Siap Unduh
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 🔍 FILTER KATEGORI & PENCARIAN CEPAT                       */}
      {/* ========================================================== */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          
          {/* Scrollable Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none">
            {[
              { id: 'ALL', label: 'Semua Kategori', icon: Layers },
              { id: 'EXCEL', label: 'Template Excel & TSV', icon: FileSpreadsheet },
              { id: 'SURAT', label: 'Naskah Dinas & Word', icon: FileText },
              { id: 'REGULASI', label: 'SBU & Regulasi', icon: Scale },
              { id: 'PANDUAN', label: 'Panduan Operasional', icon: BookOpen }
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 border border-gray-200/80'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-gray-500'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama template, SBU, atau topik..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 📋 GRID KARTU TEMPLATE & PANDUAN                           */}
      {/* ========================================================== */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-200/80 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
            <Search size={28} />
          </div>
          <h4 className="text-base font-black text-gray-800">Dokumen Tidak Ditemukan</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Tidak ada template yang cocok dengan kata kunci "{searchQuery}". Silakan coba kata kunci lain seperti "RKA", "SBU", "Pagu", atau "Surat".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredTemplates.map((item) => {
            const isExcel = item.category === 'EXCEL';
            const isSurat = item.category === 'SURAT';
            const isRegulasi = item.category === 'REGULASI';

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-indigo-300"
              >
                <div className="p-6 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                      isExcel 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : isSurat 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : isRegulasi
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {isExcel ? <FileSpreadsheet size={12} /> : isSurat ? <FileText size={12} /> : isRegulasi ? <Scale size={12} /> : <BookOpen size={12} />}
                      <span>{item.format} • {item.version}</span>
                    </span>

                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {item.lastUpdated}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.map(t => (
                      <span key={t} className="text-[10px] font-bold text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-gray-400">
                    Ukuran: <strong className="text-gray-700">{item.fileSize}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyTitle(item.id, item.title)}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                      title="Salin Judul"
                    >
                      {copiedId === item.id ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                    </button>

                    {item.downloadAction ? (
                      <button
                        onClick={item.downloadAction}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <Download size={14} />
                        <span>Unduh Spreadsheet</span>
                      </button>
                    ) : item.directLink ? (
                      <Link
                        href={item.directLink}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        <span>Buka di Aplikasi</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================== */}
      {/* ℹ️ KOTAK BANTUAN & KONTAK DITKEU UGM                       */}
      {/* ========================================================== */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200">
            <HelpCircle size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900">Butuh Format Khusus atau Konsultasi Anggaran?</h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Hubungi Tim Perencanaan &amp; Verifikasi Anggaran Direktorat Keuangan UGM untuk permohonan template naskah dinas lainnya.
            </p>
          </div>
        </div>

        <Link
          href="/gov-units"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-2xl text-xs font-black border border-indigo-200/80 shadow-2xs transition-all whitespace-nowrap cursor-pointer"
        >
          <span>Lihat Kontak PIC Unit</span>
          <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}
