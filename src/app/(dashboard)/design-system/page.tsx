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
  Table as TableIcon,
  BarChart3,
  LineChart,
  PieChart,
  Layout,
  UploadCloud,
  Calendar,
  Image as ImageIcon,
  CheckSquare,
  ToggleLeft,
  ToggleRight,
  Maximize2,
  Minimize2,
  Sparkles,
  TrendingUp,
  Coins,
  ShieldCheck,
  FileCheck,
  FolderTree,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Undo2,
  Redo2,
  Download,
  ZoomIn
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TablePagination from '@/components/shared/TablePagination';
import ExportButtons from '@/components/shared/ExportButtons';
import StatusBadge from '@/components/shared/StatusBadge';
import StatCard from '@/components/shared/StatCard';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import FileUploadDropzone from '@/components/shared/FileUploadDropzone';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  TableActionButton 
} from '@/components/shared/ActionButtons';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<
    'buttons' | 'table' | 'forms' | 'cards' | 'charts' | 'editor' | 'colors' | 'guide'
  >('forms');

  // State Demo Form Controls
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['1', '3']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['approved', 'pending']);
  const [isSwitchActive, setIsSwitchActive] = useState<boolean>(true);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState<boolean>(true);
  const [singleDate, setSingleDate] = useState<string>('2026-09-25');
  const [dateTimeVal, setDateTimeVal] = useState<string>('2026-09-25T08:30');
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Editor Demo State
  const [editorContent, setEditorContent] = useState<string>(
    'Yth. Pimpinan Unit Kerja di Lingkungan Universitas Gadjah Mada,\n\nBersama ini kami sampaikan ketentuan penyesuaian usulan pagu anggaran tahun 2026...\n\n1. Seluruh transaksi wajib mencantumkan kode akun yang valid.\n2. Batas akhir pengajuan revisi tanggal 30 September 2026.'
  );
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // Pagination Demo
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const sampleUnits = [
    { value: '1', label: 'Majelis Wali Amanat', badge: 'KPTU' },
    { value: '2', label: 'Dewan Guru Besar', badge: 'KPTU' },
    { value: '3', label: 'Direktorat Keuangan', badge: 'KPTU' },
    { value: '4', label: 'Direktorat Perencanaan', badge: 'KPTU' },
    { value: '5', label: 'Fakultas Biologi', badge: 'Fakultas' },
    { value: '6', label: 'Fakultas Ekonomika dan Bisnis', badge: 'Fakultas' },
    { value: '7', label: 'Fakultas Teknik', badge: 'Fakultas' },
  ];

  const sampleStatuses = [
    { value: 'approved', label: 'Disetujui', badge: 'Valid' },
    { value: 'pending', label: 'Menunggu Review', badge: 'Review' },
    { value: 'revisi', label: 'Perlu Revisi', badge: 'Koreksi' },
    { value: 'rejected', label: 'Ditolak', badge: 'Batal' },
  ];

  const sampleTableData = [
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
        subtitle="Katalog baku komponen antarmuka (Design System) untuk menjamin konsistensi, kemudahan pakai, dan kerapian seluruh halaman"
        icon={Palette}
        breadcrumbs={[
          { label: 'Master Data' },
          { label: 'Standar UI / UX' },
        ]}
        badge={{ text: 'Design System v2.1', variant: 'purple' }}
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
              Katalog Komponen Baku Terpadu
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold hidden sm:inline">
            Pilih kategori untuk melihat demo interaktif & panduan penerapan
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { id: 'forms', label: '1. Filter & Form', icon: Search },
            { id: 'cards', label: '2. Template Card', icon: Layout },
            { id: 'charts', label: '3. Template Grafik', icon: BarChart3 },
            { id: 'editor', label: '4. Editor & Gambar', icon: FileText },
            { id: 'colors', label: '5. Warna Baku', icon: Palette },
            { id: 'buttons', label: '6. Tombol & Ikon', icon: Plus },
            { id: 'table', label: '7. Tabel & Paging', icon: TableIcon },
            { id: 'guide', label: '8. Panduan Kode', icon: Copy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 scale-[1.01]'
                    : 'bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200/90'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FILTER & FORM INPUT (MULTI-SELECT, COMBOBOX, DATE, SWITCH, UPLOAD) */}
      {/* ========================================================================= */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          {/* Card: Multi-Select Filter Demo (Poin 1) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 1
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Filter Multi-Select (Pilih Lebih Dari Satu Opsi)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Komponen <code className="text-blue-600 font-bold">&lt;MultiSelectFilter /&gt;</code> memungkinkan pengguna memilih beberapa unit kerja atau status sekaligus, dilengkapi kotak pencarian, tombol "Pilih Semua", dan hapus tag secara instan.
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <MultiSelectFilter
                label="Pilih Unit Kerja (Multi-Select)"
                placeholder="Pilih satu atau beberapa unit kerja..."
                options={sampleUnits}
                selectedValues={selectedUnits}
                onChange={setSelectedUnits}
                maxDisplayTags={3}
              />

              <MultiSelectFilter
                label="Pilih Status Usulan (Multi-Select)"
                placeholder="Pilih status..."
                options={sampleStatuses}
                selectedValues={selectedStatuses}
                onChange={setSelectedStatuses}
                maxDisplayTags={2}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50/60 p-3 rounded-xl border border-blue-200/60">
              <span className="font-bold text-blue-900 shrink-0">Hasil Pilihan Saat Ini:</span>
              <span className="font-mono text-[11px] truncate">
                Unit: [{selectedUnits.join(', ')}] | Status: [{selectedStatuses.join(', ')}]
              </span>
            </div>
          </div>

          {/* Card: Date Picker, DateTime, & Date Range (Poin 4) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 4
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Standarisasi Pemilih Tanggal & Waktu (Date, DateTime & Range Picker)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Semua pemilih tanggal menggunakan input baku dengan format seragam dan ikon kalender.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              {/* Single Date Picker */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Date Picker (Tanggal Saja)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800"
                  />
                </div>
                <span className="text-[10px] text-gray-400">Contoh: Tanggal transaksi / surat</span>
              </div>

              {/* Date & Time Picker */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Date & Time Picker (Tanggal + Jam)
                </label>
                <input
                  type="datetime-local"
                  value={dateTimeVal}
                  onChange={(e) => setDateTimeVal(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800"
                />
                <span className="text-[10px] text-gray-400">Contoh: Jadwal rapat / approval</span>
              </div>

              {/* Date Range Picker */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Range Picker (Rentang Tanggal)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 px-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800"
                  />
                  <span className="text-gray-400 font-bold text-xs">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-9 px-2 text-[11px] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800"
                  />
                </div>
                <span className="text-[10px] text-gray-400">Contoh: Filter laporan periode</span>
              </div>
            </div>
          </div>

          {/* Card: Checkbox, Switch, & File Upload Dropzone (Poin 4) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 4
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Checkbox, Switch Toggle, & Combo Box Upload
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Elemen kontrol switch gaya iOS, checkbox rapi, dan area unggah berkas cerdas (*Drag & Drop Dropzone*).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Checkbox & Switch Controls */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
                <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block">
                  Pilihan Biner & Saklar (Switch / Checkbox)
                </span>

                {/* Checkbox Demo */}
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer select-none hover:border-blue-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={isCheckboxChecked}
                    onChange={(e) => setIsCheckboxChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-bold text-gray-800">
                      Tampilkan Riwayat Revisi Anggaran
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Sertakan baris data yang pernah mengalami perubahan nominal
                    </span>
                  </div>
                </label>

                {/* Switch Toggle Demo (iOS Style) */}
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                  <div>
                    <span className="block text-xs font-bold text-gray-800">
                      Status Notifikasi AI Real-Time
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Aktifkan peringatan jika usulan melebihi standar pagu
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSwitchActive(!isSwitchActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isSwitchActive ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isSwitchActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Combo Box Upload / Drag & Drop Dropzone */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                <FileUploadDropzone
                  label="Area Upload Berkas (Drag & Drop)"
                  maxSizeMB={15}
                  onFileSelect={(f) => alert(`Berkas terpilih: ${f.name} (${(f.size/1024).toFixed(1)} KB)`)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEMPLATE CARD (STAT KPI, PAGU SUMMARY, FEATURE CARDS) - POIN 2    */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Poin 2
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Template Card Terstandarisasi (KPI, Pagu, & Fitur)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Koleksi kartu informasi yang seragam untuk menampilkan ringkasan data finansial, target, dan monitoring kinerja.
              </p>
            </div>

            {/* 1. Stat KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                title="Total Pagu Anggaran"
                value="Rp 48,25 M"
                subtitle="Tahun Anggaran 2026"
                icon={Coins}
                variant="blue"
                trend={{ value: '+12.5%', isUp: true, isGood: true }}
              />

              <StatCard
                title="Realisasi Belanja"
                value="Rp 31,80 M"
                subtitle="Target Triwulan III"
                icon={TrendingUp}
                variant="emerald"
                progress={{ percentage: 65.8, label: 'Keterserapan' }}
              />

              <StatCard
                title="Sisa Pagu Berjalan"
                value="Rp 16,45 M"
                subtitle="Tersedia untuk alokasi"
                icon={Layers}
                variant="indigo"
                trend={{ value: '34.2% sisa', isUp: false }}
              />

              <StatCard
                title="Usulan Menunggu Review"
                value="14 Berkas"
                subtitle="Perlu verifikasi admin"
                icon={Clock}
                variant="amber"
                trend={{ value: 'Prioritas', isUp: true, isGood: false }}
              />
            </div>

            {/* 2. Pagu Summary Card Detail */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Template Card Komparasi Pagu vs Realisasi
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Multi-Progress Card
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Belanja Pegawai (51)</span>
                    <span className="font-mono font-bold text-gray-800">82%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Realisasi: Rp 18,5 M</span>
                    <span>Pagu: Rp 22,5 M</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Belanja Barang & Jasa (52)</span>
                    <span className="font-mono font-bold text-gray-800">54%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '54%' }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Realisasi: Rp 8,2 M</span>
                    <span>Pagu: Rp 15,1 M</span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Belanja Modal (53)</span>
                    <span className="font-mono font-bold text-gray-800">41%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '41%' }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                    <span>Realisasi: Rp 4,4 M</span>
                    <span>Pagu: Rp 10,6 M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEMPLATE GRAFIK (BAR, LINE, DONUT, GAUGE) - POIN 3                */}
      {/* ========================================================================= */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                  Poin 3
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Template Grafik Baku (Bar Chart, Tren Realisasi, & Komposisi)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Visualisasi data modern yang responsif, ringan, dan tidak membebani performa halaman.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 1. Bar Chart Template (Komparasi Antar Unit) */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-800">Komparasi Usulan per Unit (Bar Chart)</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">Satuan: Juta Rp</span>
                </div>

                {/* Visual Bar Chart Mockup */}
                <div className="space-y-2 pt-2">
                  {[
                    { label: 'Fakultas Biologi', val1: 85, val2: 60, valText: 'Rp 850 Jt' },
                    { label: 'Fakultas Teknik', val1: 95, val2: 75, valText: 'Rp 950 Jt' },
                    { label: 'Direktorat Keuangan', val1: 70, val2: 50, valText: 'Rp 700 Jt' },
                    { label: 'Fakultas Kedokteran', val1: 88, val2: 68, valText: 'Rp 880 Jt' },
                  ].map((bar, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                        <span>{bar.label}</span>
                        <span className="font-mono text-blue-700 font-bold">{bar.valText}</span>
                      </div>
                      <div className="w-full h-4 bg-gray-200/70 rounded-lg overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                          style={{ width: `${bar.val1}%` }}
                          title={`Pagu: ${bar.val1}%`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-500 border-t border-gray-200/60 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" /> Pagu Disetujui
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-gray-300 inline-block" /> Kuota Maksimal
                  </span>
                </div>
              </div>

              {/* 2. Donut / Radial Composition Chart */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart size={16} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-800">Komposisi Alokasi Anggaran (Donut)</span>
                  </div>
                  <span className="text-[10px] text-purple-700 font-black bg-purple-50 px-2 py-0.5 rounded-md">
                    Total: 100%
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-3">
                  {/* Visual Donut Ring SVG */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-100"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-600"
                        strokeDasharray="45, 100"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray="30, 100"
                        strokeDashoffset="-45"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-purple-500"
                        strokeDasharray="25, 100"
                        strokeDashoffset="-75"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-black text-gray-800">48 M</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Total</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-xs text-gray-600 font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Belanja Pegawai (45%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Barang & Jasa (30%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span>Belanja Modal (25%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: HALAMAN EDITOR & STANDAR UKURAN GAMBAR - POIN 5                   */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          {/* Card 1: Rich Document / Surat Editor Mockup */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                  Poin 5
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Template Halaman Editor Dokumen & Surat
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bilah alat (*toolbar*) standar untuk penyusunan narasi usulan, surat keputusan, atau catatan verifikasi.
              </p>
            </div>

            {/* Standard Editor Layout */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {/* Editor Toolbar */}
              <div className="bg-slate-50 border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap select-none">
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Undo"><Undo2 size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Redo"><Redo2 size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />

                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 font-bold cursor-pointer" title="Bold"><Bold size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 italic cursor-pointer" title="Italic"><Italic size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 underline cursor-pointer" title="Underline"><Underline size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />

                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Heading 1"><Heading1 size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Heading 2"><Heading2 size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />

                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Rata Kiri"><AlignLeft size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Rata Tengah"><AlignCenter size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Rata Kanan"><AlignRight size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />

                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Bullet List"><List size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Numbered List"><ListOrdered size={14} /></button>

                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Mode Dokumen</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Auto-Save On
                  </span>
                </div>
              </div>

              {/* Editor Workspace Canvas */}
              <div className="p-4 md:p-6 bg-slate-100/60 min-h-[180px] flex justify-center">
                <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                  <textarea
                    rows={6}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full text-xs text-gray-800 leading-relaxed font-sans focus:outline-none resize-none"
                    placeholder="Ketik isi surat atau catatan kerja di sini..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Standar Ukuran Menampilkan Gambar (Image Sizing Standards) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 5
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Standarisasi Ukuran Menampilkan Gambar & Pratinjau Dokumen
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Aturan baku dimensi gambar agar tabel dan kartu tidak berantakan atau melar:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              {/* Size 1: Avatar / Micro Thumbnail (40x40) */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                    40px
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-gray-800">Avatar / PIC</span>
                  <span className="text-[10px] font-mono text-gray-400">40 x 40 px (1:1)</span>
                </div>
                <p className="text-[10px] text-gray-500">Khusus foto profil PIC atau ikon unit</p>
              </div>

              {/* Size 2: Thumbnail Tabel (64x64) */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold shadow-2xs">
                    64px
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-gray-800">Bukti Struk Kas</span>
                  <span className="text-[10px] font-mono text-gray-400">64 x 64 px (1:1)</span>
                </div>
                <p className="text-[10px] text-gray-500">Thumbnail kecil di dalam baris tabel kas</p>
              </div>

              {/* Size 3: Kartu Berkas Surat (160x100) */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-40 h-20 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-bold shadow-2xs">
                    160 x 80 px (16:9)
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-gray-800">Kartu Preview Lampiran</span>
                  <span className="text-[10px] font-mono text-gray-400">16:9 Aspect Ratio</span>
                </div>
                <p className="text-[10px] text-gray-500">Preview scan dokumen pendukung surat</p>
              </div>

              {/* Size 4: Full Modal Lightbox Preview */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-2">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => alert('Simulasi: Membuka modal foto resolusi penuh dengan zoom & rotate!')}
                    className="w-40 h-20 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center gap-1 text-xs font-bold shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <ZoomIn size={16} />
                    <span>Klik Lightbox</span>
                  </button>
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-gray-800">Modal Popup Penuh</span>
                  <span className="text-[10px] font-mono text-gray-400">Max 90vh (Fit Screen)</span>
                </div>
                <p className="text-[10px] text-gray-500">Pratinjau resolusi tinggi saat diklik</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PALET WARNA BAKU (COLOR TOKENS & RULES) - POIN 4                   */}
      {/* ========================================================================= */}
      {activeTab === 'colors' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                Poin 4
              </span>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Palet Warna Baku (Color Tokens & Standar Penggunaan)
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Setiap warna memiliki fungsi psikologis dan semantik yang tidak boleh ditukar sembarangan:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Primary Blue */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
              <div className="h-12 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Royal Blue (Brand Utama)</span>
                <span className="font-mono text-[10px]">#2563EB</span>
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-800 block">Kaidah Pemakaian:</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Digunakan untuk navigasi aktif, tombol aksi utama (*Save*, *Submit*), judul suite, dan elemen brand UGM.
                </p>
              </div>
            </div>

            {/* Emerald Success */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
              <div className="h-12 rounded-lg bg-emerald-600 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Emerald Green (Sukses & Excel)</span>
                <span className="font-mono text-[10px]">#059669</span>
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-800 block">Kaidah Pemakaian:</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Khusus tombol **Export Excel**, status disetujui/verified, saldo positif, dan indikator keberhasilan.
                </p>
              </div>
            </div>

            {/* Amber Warning */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
              <div className="h-12 rounded-lg bg-amber-500 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Amber Gold (Perhatian & Review)</span>
                <span className="font-mono text-[10px]">#D97706</span>
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-800 block">Kaidah Pemakaian:</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Khusus status **Menunggu Review**, notifikasi peringatan limit pagu, dan tombol ubah data (*Edit*).
                </p>
              </div>
            </div>

            {/* Rose Danger */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
              <div className="h-12 rounded-lg bg-rose-600 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Rose Red (Bahaya & Tolakan)</span>
                <span className="font-mono text-[10px]">#E11D48</span>
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-800 block">Kaidah Pemakaian:</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Khusus status **Ditolak/Tolakan Verif**, tombol **Hapus Data**, dan pesan kesalahan sistem.
                </p>
              </div>
            </div>

            {/* Sky Blue Word */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
              <div className="h-12 rounded-lg bg-blue-500 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Office Blue (Word & Dokumen)</span>
                <span className="font-mono text-[10px]">#3B82F6</span>
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-800 block">Kaidah Pemakaian:</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Khusus tombol **Export Word (.docx)**, preview persuratan, dan tautan dokumen resmi.
                </p>
              </div>
            </div>

            {/* Slate Surface */}
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
              <div className="h-12 rounded-lg bg-slate-800 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Slate & Gray (Netral)</span>
                <span className="font-mono text-[10px]">#1E293B</span>
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-gray-800 block">Kaidah Pemakaian:</span>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Latar belakang kartu, teks utama, border pemisah, tombol batal/reset, dan zebra striping tabel.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TOMBOL & IKON (EXISTING EXPANDED)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'buttons' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Standarisasi Tombol Aksi & Hierarki
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

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Standarisasi Ikon Tombol Baris Tabel (Row Actions)
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

      {/* ========================================================================= */}
      {/* TAB 7: TABEL & PAGING                                                     */}
      {/* ========================================================================= */}
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
                {sampleTableData.map((row, idx) => (
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

      {/* ========================================================================= */}
      {/* TAB 8: PANDUAN KODE (CHEATSHEET SIAP PAKAI)                               */}
      {/* ========================================================================= */}
      {activeTab === 'guide' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Panduan Kode Reusable (Siap Salin & Tempel)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Tinggal import komponen di bawah ini untuk diterapkan langsung ke halaman mana pun:
            </p>
          </div>

          {/* Snippet 1: Multi-Select Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>1. Memasang Multi-Select Filter:</span>
              <button
                onClick={() => handleCopy(`<MultiSelectFilter\n  label="Pilih Unit Kerja"\n  options={units}\n  selectedValues={selectedUnits}\n  onChange={setSelectedUnits}\n/>`, 'multiselect')}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                {copiedCode === 'multiselect' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'multiselect' ? 'Disalin!' : 'Salin Kode'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
{`import MultiSelectFilter from '@/components/shared/MultiSelectFilter';

<MultiSelectFilter
  label="Pilih Unit Kerja"
  options={[
    { value: '1', label: 'Majelis Wali Amanat', badge: 'KPTU' },
    { value: '2', label: 'Direktorat Keuangan', badge: 'KPTU' },
  ]}
  selectedValues={selectedUnits}
  onChange={setSelectedUnits}
/>`}
            </pre>
          </div>

          {/* Snippet 2: Stat Card KPI */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>2. Memasang Stat KPI Card:</span>
              <button
                onClick={() => handleCopy(`<StatCard\n  title="Total Pagu"\n  value="Rp 48,25 M"\n  variant="blue"\n  trend={{ value: '+12.5%', isUp: true, isGood: true }}\n/>`, 'statcard')}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                {copiedCode === 'statcard' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'statcard' ? 'Disalin!' : 'Salin Kode'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
{`import StatCard from '@/components/shared/StatCard';
import { Coins } from 'lucide-react';

<StatCard
  title="Total Pagu Anggaran"
  value="Rp 48,25 M"
  subtitle="Tahun 2026"
  icon={Coins}
  variant="blue"
  trend={{ value: '+12.5%', isUp: true, isGood: true }}
/>`}
            </pre>
          </div>

          {/* Snippet 3: File Upload Dropzone */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>3. Memasang Drag & Drop File Upload:</span>
              <button
                onClick={() => handleCopy(`<FileUploadDropzone\n  label="Upload Lampiran"\n  onFileSelect={(file) => console.log(file)}\n/>`, 'upload')}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                {copiedCode === 'upload' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'upload' ? 'Disalin!' : 'Salin Kode'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
{`import FileUploadDropzone from '@/components/shared/FileUploadDropzone';

<FileUploadDropzone
  label="Unggah Berkas Pendukung"
  maxSizeMB={15}
  onFileSelect={(file) => handleUpload(file)}
/>`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
