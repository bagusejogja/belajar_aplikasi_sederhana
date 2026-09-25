'use client';

import React, { useState } from 'react';
import { 
  Palette, 
  Layers, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Building2, 
  Copy, 
  Check, 
  SlidersHorizontal,
  Table as TableIcon
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TablePagination from '@/components/shared/TablePagination';
import ExportButtons from '@/components/shared/ExportButtons';
import StatusBadge from '@/components/shared/StatusBadge';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  TableActionButton 
} from '@/components/shared/ActionButtons';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<'buttons' | 'table' | 'forms' | 'badges' | 'guide'>('buttons');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Sample Table Data for Demonstration
  const sampleData = [
    { id: 1, kode: '511111', nama: 'Belanja Gaji Pokok PNS', unit: 'Fakultas Biologi', pagu: 1250000000, realisasi: 850000000, status: 'disetujui' },
    { id: 2, kode: '511119', nama: 'Belanja Pembulatan Gaji PNS', unit: 'Fakultas Teknik', pagu: 45000000, realisasi: 32000000, status: 'proses' },
    { id: 3, kode: '511129', nama: 'Belanja Uang Makan PNS', unit: 'Direktorat Keuangan', pagu: 340000000, realisasi: 195000000, status: 'disetujui' },
    { id: 4, kode: '521211', nama: 'Belanja Bahan Operasional', unit: 'Fakultas Kedokteran', pagu: 95000000, realisasi: 0, status: 'revisi' },
    { id: 5, kode: '532111', nama: 'Belanja Modal Peralatan Mesin', unit: 'Direktorat Perencanaan', pagu: 600000000, realisasi: 120000000, status: 'ditolak' },
  ];

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Standard Page Header */}
      <PageHeader
        title="Standar UI / UX & Komponen Desain"
        subtitle="Panduan baku dan repositori komponen seragam (Design System) untuk konsistensi seluruh modul aplikasi"
        icon={Palette}
        breadcrumbs={[
          { label: 'Master Data' },
          { label: 'Standar UI / UX' },
        ]}
        badge={{ text: 'Design System v2.0', variant: 'purple' }}
        actions={
          <ExportButtons
            onExportExcel={() => alert('Simulasi: Export Excel Standard')}
            onExportWord={() => alert('Simulasi: Export Word Standard')}
            onExportPdf={() => alert('Simulasi: Cetak PDF Standard')}
          />
        }
      />

      {/* 2. Suite Sub-Navigation Tabs */}
      <div className="bg-white/95 backdrop-blur-sm p-3 px-4 md:px-5 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-blue-600" />
            <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
              Kategori Komponen Baku
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">
            Klik kategori untuk melihat pratinjau & aturan pakai
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'buttons', label: 'Tombol & Ikon', icon: Plus },
            { id: 'table', label: 'Tabel & Paging', icon: TableIcon },
            { id: 'forms', label: 'Filter & Input', icon: Search },
            { id: 'badges', label: 'Badge & Status', icon: CheckCircle },
            { id: 'guide', label: 'Panduan Kode', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 scale-[1.01]'
                    : 'bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200/90'
                }`}
              >
                <Icon size={15} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: TOMBOL & IKON */}
      {activeTab === 'buttons' && (
        <div className="space-y-4">
          {/* Card 1: Tombol Utama & Aksi */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                1. Standarisasi Tombol Aksi (Buttons Hierarchy)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Setiap tombol memiliki makna dan warna baku yang seragam di seluruh aplikasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-600 uppercase">Primary Button</span>
                <div>
                  <PrimaryButton onClick={() => alert('Primary Clicked')}>
                    <Plus size={14} /> Tambah Data Baru
                  </PrimaryButton>
                </div>
                <p className="text-[11px] text-gray-400">
                  Warna: Royal Blue gradient. Dipakai untuk aksi utama (Simpan, Tambah Usulan, Submit).
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-600 uppercase">Secondary Button</span>
                <div>
                  <SecondaryButton onClick={() => alert('Secondary Clicked')}>
                    <RotateCcw size={14} /> Reset Filter
                  </SecondaryButton>
                </div>
                <p className="text-[11px] text-gray-400">
                  Warna: Putih border slate. Dipakai untuk Batal, Tutup, atau Reset.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-600 uppercase">Danger Button</span>
                <div>
                  <DangerButton onClick={() => alert('Danger Clicked')}>
                    Hapus Data Terpilih
                  </DangerButton>
                </div>
                <p className="text-[11px] text-gray-400">
                  Warna: Rose 600. Khusus aksi destruktif (Hapus, Tolak Usulan).
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Tombol Ekspor (Excel, Word, PDF) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                2. Standarisasi Tombol Ekspor (Excel, Word, & PDF)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Gunakan komponen <code className="text-blue-600 font-mono font-bold">&lt;ExportButtons /&gt;</code> di setiap header tabel atau laporan.
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
              <ExportButtons
                onExportExcel={() => alert('Export Excel')}
                onExportWord={() => alert('Export Word')}
                onExportPdf={() => alert('Cetak PDF')}
                size="md"
              />
              <span className="text-xs text-gray-400 font-medium">
                Pewarnaan otomatis: Excel (Emerald), Word (Blue), PDF (Rose)
              </span>
            </div>
          </div>

          {/* Card 3: Tombol Aksi Tabel (Micro Action Buttons) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                3. Standarisasi Ikon Tombol Baris Tabel (Row Actions)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tombol di kolom "Aksi" pada tabel menggunakan ukuran kompak <code className="text-blue-600 font-mono font-bold">&lt;TableActionButton /&gt;</code>.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex-wrap">
              <div className="flex items-center gap-1.5">
                <TableActionButton icon={Eye} variant="primary" title="Lihat Detail" onClick={() => {}} />
                <span className="text-xs text-gray-600 font-semibold">Lihat Detail (Eye)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TableActionButton icon={Pencil} variant="warning" title="Edit Data" onClick={() => {}} />
                <span className="text-xs text-gray-600 font-semibold">Ubah / Edit (Pencil)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TableActionButton icon={Trash2} variant="danger" title="Hapus Data" onClick={() => {}} />
                <span className="text-xs text-gray-600 font-semibold">Hapus (Trash2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TableActionButton icon={RefreshCw} variant="success" title="Sinkron Ulang" onClick={() => {}} />
                <span className="text-xs text-gray-600 font-semibold">Sinkronisasi (RefreshCw)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TABEL & PAGING */}
      {activeTab === 'table' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Standarisasi Tabel Data & Paging Baku
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Kaidah: Teks rata kiri, Uang/Angka rata kanan (font mono), Badge status rata tengah.
              </p>
            </div>
            <ExportButtons
              onExportExcel={() => alert('Exporting Table Demo')}
              onExportWord={() => alert('Exporting Word Demo')}
            />
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3">Kode Akun</th>
                  <th className="py-3 px-3">Uraian Akun</th>
                  <th className="py-3 px-3">Unit Kerja</th>
                  <th className="py-3 px-3 text-right">Pagu Usulan</th>
                  <th className="py-3 px-3 text-right">Realisasi</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sampleData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-blue-50/40 transition-colors even:bg-slate-50/30">
                    <td className="py-2.5 px-3 text-center text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{row.kode}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{row.nama}</td>
                    <td className="py-2.5 px-3 text-gray-600">{row.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                      Rp {row.pagu.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                      Rp {row.realisasi.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TableActionButton icon={Eye} variant="primary" title="Detail" onClick={() => {}} />
                        <TableActionButton icon={Pencil} variant="warning" title="Edit" onClick={() => {}} />
                        <TableActionButton icon={Trash2} variant="danger" title="Hapus" onClick={() => {}} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Standard Pagination Component */}
          <TablePagination
            currentPage={currentPage}
            totalPages={5}
            totalItems={48}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(size) => setItemsPerPage(size)}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* TAB 3: FILTER & INPUT */}
      {activeTab === 'forms' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Standarisasi Filter Bar & Form Input
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Semua input, select combo box, dan search box diseragamkan dengan tinggi <code className="text-blue-600 font-bold">h-9</code>, radius <code className="text-blue-600 font-bold">rounded-xl</code>, dan border halus.
            </p>
          </div>

          {/* Live Filter Bar Demo */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <Filter size={14} className="text-blue-600" />
              <span>Panel Filter Terpadu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kode akun, nama..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-gray-400"
                />
              </div>

              {/* Combo Box 1: Unit Kerja */}
              <select className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-700 cursor-pointer">
                <option value="">-- Semua Unit Kerja --</option>
                <option value="1">Fakultas Biologi</option>
                <option value="2">Fakultas Teknik</option>
                <option value="3">Direktorat Keuangan</option>
              </select>

              {/* Combo Box 2: Status */}
              <select className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-700 cursor-pointer">
                <option value="">-- Semua Status Usulan --</option>
                <option value="approved">Disetujui</option>
                <option value="pending">Menunggu Review</option>
                <option value="revisi">Perlu Revisi</option>
                <option value="rejected">Ditolak</option>
              </select>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <PrimaryButton className="flex-1 h-9">
                  <Search size={13} /> Cari
                </PrimaryButton>
                <SecondaryButton className="h-9 px-3" title="Reset Filter">
                  <RotateCcw size={13} />
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BADGE & STATUS */}
      {activeTab === 'badges' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Standarisasi Status Badge & Lencana
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Gunakan komponen <code className="text-blue-600 font-bold">&lt;StatusBadge status="..." /&gt;</code> untuk memastikan konsistensi warna status di semua tabel.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
            <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Disetujui / Sesuai</span>
              <StatusBadge status="disetujui" />
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Menunggu / Proses</span>
              <StatusBadge status="proses" />
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Perlu Revisi</span>
              <StatusBadge status="revisi" />
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Ditolak</span>
              <StatusBadge status="ditolak" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PANDUAN KODE (CHEATSHEET) */}
      {activeTab === 'guide' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Panduan Cara Pakai Komponen Standar di Halaman Anda
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cukup salin kode berikut untuk menerapkan standar yang sama pada halaman mana pun.
            </p>
          </div>

          {/* Snippet 1: Export Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>1. Memasang Tombol Export (Excel & Word):</span>
              <button
                onClick={() => handleCopy(`<ExportButtons\n  onExportExcel={exportToExcel}\n  onExportWord={exportToWord}\n/>`, 'export')}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                {copiedCode === 'export' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'export' ? 'Disalin!' : 'Salin Kode'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
{`import ExportButtons from '@/components/shared/ExportButtons';

// Di JSX halaman Anda:
<ExportButtons
  onExportExcel={exportToExcel}
  onExportWord={exportToWord}
  onExportPdf={exportToPdf}
/>`}
            </pre>
          </div>

          {/* Snippet 2: Table Pagination */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>2. Memasang Paging Baku (Pagination):</span>
              <button
                onClick={() => handleCopy(`<TablePagination\n  currentPage={currentPage}\n  totalPages={totalPages}\n  totalItems={totalItems}\n  itemsPerPage={itemsPerPage}\n  onPageChange={(p) => setCurrentPage(p)}\n  onItemsPerPageChange={(s) => setItemsPerPage(s)}\n/>`, 'paging')}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                {copiedCode === 'paging' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'paging' ? 'Disalin!' : 'Salin Kode'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
{`import TablePagination from '@/components/shared/TablePagination';

// Di bawah tabel data Anda:
<TablePagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalDataCount}
  itemsPerPage={itemsPerPage}
  onPageChange={(page) => setCurrentPage(page)}
  onItemsPerPageChange={(size) => setItemsPerPage(size)}
/>`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
