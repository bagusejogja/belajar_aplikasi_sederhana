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
  Sparkles,
  TrendingUp,
  Coins,
  ShieldCheck,
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
  Camera,
  Paperclip,
  ZoomIn,
  Gauge,
  Activity,
  ChevronRight
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TablePagination from '@/components/shared/TablePagination';
import ExportButtons from '@/components/shared/ExportButtons';
import StatusBadge from '@/components/shared/StatusBadge';
import StatCard from '@/components/shared/StatCard';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import DateRangePicker, { DateRange } from '@/components/shared/DateRangePicker';
import FileUploadDropzone from '@/components/shared/FileUploadDropzone';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  TableActionButton 
} from '@/components/shared/ActionButtons';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<
    'forms' | 'cards' | 'charts' | 'tab-styles' | 'editor' | 'colors' | 'buttons' | 'table'
  >('forms');

  // Poin 2: Filter Single vs Multi State
  const [singleUnit, setSingleUnit] = useState<string>('3');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['1', '3']);
  const [singleStatus, setSingleStatus] = useState<string>('approved');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['approved', 'pending']);

  // Poin 3: Unified Date Range Picker State
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });
  const [singleDate, setSingleDate] = useState<string>('2026-09-25');
  const [dateTimeVal, setDateTimeVal] = useState<string>('2026-09-25T08:30');

  // Poin 4: Upload Textbox & Camera
  const [uploadTextPath, setUploadTextPath] = useState<string>('SK_Rektor_Penetapan_Pagu_2026.pdf');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isSwitchActive, setIsSwitchActive] = useState<boolean>(true);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState<boolean>(true);

  // Poin 6: Clickable Card Selection (Colored Border Ring)
  const [selectedCardId, setSelectedCardId] = useState<string>('pagu');

  // Poin 7: Tab Pilihan Demo
  const [demoPillTab, setDemoPillTab] = useState<string>('tab1');
  const [demoUnderlineTab, setDemoUnderlineTab] = useState<string>('all');
  const [demoSegmentedTab, setDemoSegmentedTab] = useState<string>('monthly');

  // Editor Demo State
  const [editorContent, setEditorContent] = useState<string>(
    'Yth. Pimpinan Unit Kerja di Lingkungan Universitas Gadjah Mada,\n\nBersama ini kami sampaikan ketentuan penyesuaian usulan pagu anggaran tahun 2026...\n\n1. Seluruh transaksi wajib mencantumkan kode akun yang valid.\n2. Batas akhir pengajuan revisi tanggal 30 September 2026.'
  );

  // Table & Pagination Demo
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
        subtitle="Katalog baku komponen antarmuka (Design System) untuk menjamin konsistensi, kemudahan pakai, dan estetika seluruh modul aplikasi"
        icon={Palette}
        breadcrumbs={[
          { label: 'Master Data' },
          { label: 'Standar UI / UX' },
        ]}
        badge={{ text: 'Design System v2.2', variant: 'purple' }}
        actions={
          <ExportButtons
            onExportExcel={() => alert('Simulasi: Export Excel Standard')}
            onExportWord={() => alert('Simulasi: Export Word Standard')}
            onExportPdf={() => alert('Simulasi: Cetak PDF Standard')}
          />
        }
      />

      {/* 2. Poin 1: Katalog Tab Dibuat Cakep & Luas (Grid 4 Kolom Proporsional, Tidak Berdesakan) */}
      <div className="bg-white/95 backdrop-blur-sm p-3.5 px-4 md:px-5 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-blue-600" />
            <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
              Katalog Komponen Baku Terpadu
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold hidden sm:inline">
            Tampilan lega & nyaman dilihat (4 kolom proporsional)
          </span>
        </div>

        {/* Grid 4 Kolom: Lega, Rapi, & Elegan */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { id: 'forms', num: '01', label: 'Filter & Form Input', desc: 'Single & Multi, Date, Upload', icon: Search },
            { id: 'cards', num: '02', label: 'Template Card', desc: 'KPI Stat & Klik Garis Tepi', icon: Layout },
            { id: 'charts', num: '03', label: 'Template Grafik', desc: 'Bar, Line, Donut, Gauge', icon: BarChart3 },
            { id: 'tab-styles', num: '04', label: 'Tab Pilihan Menu', desc: 'Pill, Underline, Capsule', icon: Layers },
            { id: 'editor', num: '05', label: 'Editor & Gambar', desc: 'Toolbar Dokumen & Ukuran Foto', icon: FileText },
            { id: 'colors', num: '06', label: 'Palet Warna Baku', desc: 'Royal Blue, Emerald, Amber', icon: Palette },
            { id: 'buttons', num: '07', label: 'Tombol & Ikon', desc: 'Primary, Danger, Row Actions', icon: Plus },
            { id: 'table', num: '08', label: 'Tabel & Paging', desc: 'Data Table & Paging Baku', icon: TableIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group flex items-center gap-3 p-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer border text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 scale-[1.01]'
                    : 'bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200/90 hover:border-blue-200 hover:shadow-2xs active:scale-[0.99]'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                }`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                      {tab.num}
                    </span>
                    <span className="truncate font-bold tracking-tight text-[12px] leading-tight">
                      {tab.label}
                    </span>
                  </div>
                  <span className={`block text-[10px] truncate font-medium mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FILTER & FORM INPUT (POIN 2: SINGLE VS MULTI, POIN 3: RANGE, POIN 4: UPLOAD) */}
      {/* ========================================================================= */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          {/* Poin 2: Filter Single vs Multi-Select Side-by-Side */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 2
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Komparasi Filter: Single-Select vs Multi-Select
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Keduanya disediakan berdampingan: Gunakan <strong>Single Dropdown</strong> jika pencarian memerlukan 1 pilihan pasti, atau gunakan <strong>Multi-Select Filter</strong> jika data dapat dikelompokkan ke banyak pilihan sekaligus.
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom 1: Single-Select Dropdown */}
              <div className="space-y-3 p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Pilihan Tunggal (Single-Select)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    1 Nilai
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Unit Kerja (Single Dropdown)
                  </label>
                  <select
                    value={singleUnit}
                    onChange={(e) => setSingleUnit(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">-- Semua Unit Kerja --</option>
                    {sampleUnits.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label} ({u.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Status Usulan (Single Dropdown)
                  </label>
                  <select
                    value={singleStatus}
                    onChange={(e) => setSingleStatus(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800 cursor-pointer"
                  >
                    <option value="">-- Semua Status --</option>
                    {sampleStatuses.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kolom 2: Multi-Select Filter (Poin 1) */}
              <div className="space-y-3 p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Pilihan Ganda (Multi-Select Filter)
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Banyak Nilai + Tag
                  </span>
                </div>

                <MultiSelectFilter
                  label="Unit Kerja (Multi-Select)"
                  placeholder="Pilih beberapa unit..."
                  options={sampleUnits}
                  selectedValues={selectedUnits}
                  onChange={setSelectedUnits}
                  maxDisplayTags={2}
                />

                <MultiSelectFilter
                  label="Status Usulan (Multi-Select)"
                  placeholder="Pilih beberapa status..."
                  options={sampleStatuses}
                  selectedValues={selectedStatuses}
                  onChange={setSelectedStatuses}
                  maxDisplayTags={2}
                />
              </div>
            </div>
          </div>

          {/* Poin 3: Unified Date Range Picker (1x Klik Popover) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 3
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Range Picker Terpadu (1 Tampilan Tanpa Perlu Klik 2x)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Komponen <code className="text-blue-600 font-bold">&lt;DateRangePicker /&gt;</code> menampilkan kotak rentang tanggal terpadu. Saat diklik, popover langsung menyajikan tombol cepat (*Hari ini, 7 hari, Bulan ini*) serta input tanggal awal dan akhir dalam satu layar.
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Unified Range Picker */}
              <div className="sm:col-span-2">
                <DateRangePicker
                  label="Rentang Tanggal Laporan (Unified Popover)"
                  value={dateRange}
                  onChange={setDateRange}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Aktif: {dateRange.startDate} s/d {dateRange.endDate}
                </span>
              </div>

              {/* Date & Time Picker */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tanggal & Waktu (DateTime)
                </label>
                <input
                  type="datetime-local"
                  value={dateTimeVal}
                  onChange={(e) => setDateTimeVal(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Poin 4: Upload Textbox & Kamera + Drag & Drop */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 4
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Fasilitas Upload: Textbox File, Tombol Kamera / Browse, & Drag-Drop
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tersedia input textbox berkas dengan tombol klik pilih file dan ambil foto dari kamera perangkat, disandingkan dengan area drag-and-drop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opsi 1: Textbox Upload dengan Tombol Browse & Kamera */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  1. Input Textbox Berkas & Tombol Ambil Foto
                </span>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* Text Box File Display */}
                    <div className="relative flex-1">
                      <Paperclip size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={uploadTextPath}
                        onChange={(e) => setUploadTextPath(e.target.value)}
                        placeholder="Pilih berkas atau tempel URL..."
                        className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800"
                      />
                    </div>

                    {/* Tombol Pilih File */}
                    <label className="h-9 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs">
                      <FolderTree size={14} />
                      <span className="hidden sm:inline">Pilih File</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadTextPath(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>

                    {/* Tombol Kamera / Ambil Foto */}
                    <label className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs" title="Ambil foto dari kamera">
                      <Camera size={14} />
                      <span className="hidden sm:inline">Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadTextPath(`[Foto Kamera] ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Thumbnail Chip Preview */}
                  {uploadTextPath && (
                    <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={15} className="text-blue-600 shrink-0" />
                        <span className="truncate font-semibold text-gray-700">{uploadTextPath}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                        Siap Diunggah
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Opsi 2: Area Drag & Drop */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  2. Area Seret Berkas (Drag & Drop)
                </span>
                <FileUploadDropzone
                  label=""
                  maxSizeMB={15}
                  onFileSelect={(f) => setUploadTextPath(f.name)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEMPLATE CARD (POIN 6: CARD DIKLIK ADA GARIS TEPI WARNA)          */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Poin 6
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Template Card Interaktif (Klik Kartu ➔ Garis Tepi Menyala / Ring Focus)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Silakan <strong>klik salah satu kartu di bawah ini</strong>: Kartu yang aktif akan mendapatkan garis tepi bergradien warna tebal (*ring outline*) dengan tanda centang aktif.
              </p>
            </div>

            {/* Interactive Selectable Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { id: 'pagu', title: 'Total Pagu Anggaran', val: 'Rp 48,25 M', desc: 'TA 2026', icon: Coins, color: 'blue' },
                { id: 'realisasi', title: 'Realisasi Belanja', val: 'Rp 31,80 M', desc: 'Serapan 65.8%', icon: TrendingUp, color: 'emerald' },
                { id: 'sisa', title: 'Sisa Pagu Tersedia', val: 'Rp 16,45 M', desc: 'Alokasi Berjalan', icon: Layers, color: 'indigo' },
                { id: 'review', title: 'Usulan Menunggu', val: '14 Berkas', desc: 'Perlu Verifikasi', icon: Clock, color: 'amber' },
              ].map((card) => {
                const Icon = card.icon;
                const isSelected = selectedCardId === card.id;

                const ringColors: Record<string, string> = {
                  blue: 'ring-2 ring-blue-600 border-blue-500 bg-blue-50/20 shadow-md scale-[1.02]',
                  emerald: 'ring-2 ring-emerald-600 border-emerald-500 bg-emerald-50/20 shadow-md scale-[1.02]',
                  indigo: 'ring-2 ring-indigo-600 border-indigo-500 bg-indigo-50/20 shadow-md scale-[1.02]',
                  amber: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20 shadow-md scale-[1.02]',
                };

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative select-none ${
                      isSelected
                        ? ringColors[card.color]
                        : 'border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Active Checkmark Pill in Top Right */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase flex items-center gap-1 shadow-2xs">
                        <Check size={10} strokeWidth={3} />
                        <span>Terpilih</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                          {card.title}
                        </span>
                        <div className="text-xl md:text-2xl font-black text-gray-900 tracking-tight font-mono">
                          {card.val}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border bg-slate-50 border-gray-200 text-gray-700 shrink-0">
                        <Icon size={18} />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>{card.desc}</span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isSelected ? '● Aktif' : 'Klik kartu'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification of Active Card */}
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <span className="font-semibold">
                Kartu aktif terpilih: <strong>{selectedCardId.toUpperCase()}</strong>
              </span>
              <span className="text-[11px] text-blue-700 font-medium">
                Garis tepi otomatis menyala sesuai tema warna
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEMPLATE GRAFIK (POIN 5: DITAMBAH GRAFIK LINE, GAUGE, STACKED)     */}
      {/* ========================================================================= */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
                  Poin 5
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Koleksi Template Grafik Baku Lengkap
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tersedia 4 format visualisasi data: Bar Komparasi, Tren Garis Bulanan, Donut Komposisi, dan Speedometer Gauge Target.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 1. Bar Chart (Komparasi Usulan per Unit) */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-800">1. Bar Chart: Komparasi Pagu Unit</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">Satuan Juta Rp</span>
                </div>

                <div className="space-y-2 pt-2">
                  {[
                    { label: 'Fakultas Biologi', val: 85, text: 'Rp 850 Jt' },
                    { label: 'Fakultas Teknik', val: 95, text: 'Rp 950 Jt' },
                    { label: 'Direktorat Keuangan', val: 70, text: 'Rp 700 Jt' },
                    { label: 'Fakultas Kedokteran', val: 88, text: 'Rp 880 Jt' },
                  ].map((bar, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                        <span>{bar.label}</span>
                        <span className="font-mono text-blue-700 font-bold">{bar.text}</span>
                      </div>
                      <div className="w-full h-3.5 bg-gray-200/70 rounded-lg overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg"
                          style={{ width: `${bar.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Line / Area Trend Chart (Tren Realisasi Jan - Des) */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-gray-800">2. Tren Realisasi Bulanan (Area Chart)</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Q1 - Q3 2026
                  </span>
                </div>

                {/* SVG Area Sparkline */}
                <div className="h-32 w-full pt-2 flex flex-col justify-end">
                  <svg className="w-full h-24 overflow-visible" viewBox="0 0 300 80">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,70 Q50,60 100,45 T200,30 T300,10 L300,80 L0,80 Z"
                      fill="url(#areaGradient)"
                    />
                    <path
                      d="M0,70 Q50,60 100,45 T200,30 T300,10"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                    />
                    {/* Data Points */}
                    <circle cx="0" cy="70" r="3.5" fill="#059669" />
                    <circle cx="100" cy="45" r="3.5" fill="#059669" />
                    <circle cx="200" cy="30" r="3.5" fill="#059669" />
                    <circle cx="300" cy="10" r="4.5" fill="#047857" stroke="#fff" strokeWidth="2" />
                  </svg>
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono pt-2 border-t border-gray-200">
                    <span>Jan (Rp 2,1 M)</span>
                    <span>Apr (Rp 4,5 M)</span>
                    <span>Jul (Rp 7,8 M)</span>
                    <span className="font-bold text-emerald-700">Sep (Rp 10,2 M)</span>
                  </div>
                </div>
              </div>

              {/* 3. Donut Composition Chart */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart size={16} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-800">3. Donut: Komposisi Belanja</span>
                  </div>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                    Total: 100%
                  </span>
                </div>

                <div className="flex items-center justify-around gap-4 pt-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-blue-600" strokeDasharray="45, 100" strokeWidth="3.8" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-500" strokeDasharray="30, 100" strokeDashoffset="-45" strokeWidth="3.8" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-purple-500" strokeDasharray="25, 100" strokeDashoffset="-75" strokeWidth="3.8" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xs font-black text-gray-800">48 M</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 font-semibold">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-600" /><span>Pegawai (45%)</span></div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span>Barang/Jasa (30%)</span></div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /><span>Modal (25%)</span></div>
                  </div>
                </div>
              </div>

              {/* 4. Target Gauge / Speedometer Chart */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-amber-600" />
                    <span className="text-xs font-bold text-gray-800">4. Gauge: Capaian Kinerja Pagu</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Target 80%
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative w-36 h-20 overflow-hidden flex items-end justify-center">
                    <div className="w-36 h-36 rounded-full border-[14px] border-gray-100 border-t-amber-500 border-r-amber-500 transform -rotate-45" />
                    <div className="absolute bottom-0 text-center">
                      <span className="text-xl font-black text-gray-900 font-mono">74.2%</span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase">Tercapai</span>
                    </div>
                  </div>
                  <div className="flex justify-between w-full text-[10px] text-gray-400 font-mono px-4 pt-2">
                    <span>0% (Awal)</span>
                    <span className="font-bold text-emerald-600">80% Target</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TAB PILIHAN MENU (POIN 7: VARIASI TAB BAKU)                       */}
      {/* ========================================================================= */}
      {activeTab === 'tab-styles' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 7
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Katalog Gaya Tab Pilihan (Tab Selection Standards)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                4 pilihan gaya tab baku yang dapat dipilih sesuai kebutuhan halaman:
              </p>
            </div>

            {/* Gaya 1: Pill Gradient (Gaya Suite yang Kita Buat) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Gaya 1: Glow Pill Tabs (Dipakai di Sub-Menu Suite)
                </span>
                <span className="text-[10px] font-mono text-gray-400">Flex-wrap / Grid</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'tab1', label: 'Ringkasan Usulan', badge: 'Monitoring' },
                  { id: 'tab2', label: 'Input Pagu Baru', badge: 'Form' },
                  { id: 'tab3', label: 'Komparasi Versi', badge: 'Audit' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDemoPillTab(t.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      demoPillTab === t.id
                        ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 scale-[1.02]'
                        : 'bg-white text-slate-700 hover:bg-blue-50/60 border border-slate-200'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                      demoPillTab === t.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {t.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gaya 2: Classic Underline Tab with Badge */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Gaya 2: Underline Line Tabs (Dipakai di Rincian Laporan)
                </span>
                <span className="text-[10px] font-mono text-gray-400">Border-b Active Line</span>
              </div>
              <div className="flex items-center gap-6 border-b border-gray-200">
                {[
                  { id: 'all', label: 'Semua Transaksi', count: 124 },
                  { id: 'verified', label: 'Sudah Diverifikasi', count: 98 },
                  { id: 'pending', label: 'Menunggu Persetujuan', count: 26 },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDemoUnderlineTab(t.id)}
                    className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                      demoUnderlineTab === t.id ? 'text-blue-600 font-black' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-bold ${
                      demoUnderlineTab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {t.count}
                    </span>
                    {demoUnderlineTab === t.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Gaya 3: Segmented Slider Capsule */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Gaya 3: Segmented Capsule Bar (Gaya iOS / Switch Filter)
                </span>
                <span className="text-[10px] font-mono text-gray-400">Kapsul Abu-Abu</span>
              </div>
              <div className="inline-flex p-1 bg-gray-200/70 rounded-xl">
                {[
                  { id: 'daily', label: 'Harian' },
                  { id: 'weekly', label: 'Mingguan' },
                  { id: 'monthly', label: 'Bulanan' },
                  { id: 'yearly', label: 'Tahunan' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDemoSegmentedTab(t.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      demoSegmentedTab === t.id
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HALAMAN EDITOR & STANDAR UKURAN GAMBAR                             */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Template Editor Dokumen & Standar Ukuran Menampilkan Gambar
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Bilah alat (*toolbar*) standar untuk penyusunan narasi usulan serta kaidah dimensi gambar.
              </p>
            </div>

            {/* Editor Workspace Mockup */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="bg-slate-50 border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap select-none">
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Undo"><Undo2 size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Redo"><Redo2 size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 font-bold cursor-pointer" title="Bold"><Bold size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 italic cursor-pointer" title="Italic"><Italic size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 underline cursor-pointer" title="Underline"><Underline size={14} /></button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Rata Kiri"><AlignLeft size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Rata Tengah"><AlignCenter size={14} /></button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-700 cursor-pointer" title="Rata Kanan"><AlignRight size={14} /></button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Auto-Save On
                  </span>
                </div>
              </div>

              <div className="p-4 md:p-6 bg-slate-100/60 min-h-[160px] flex justify-center">
                <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
                  <textarea
                    rows={5}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="w-full text-xs text-gray-800 leading-relaxed font-sans focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Image Sizes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center font-bold text-xs">40px</div>
                <span className="block text-xs font-bold text-gray-800">Avatar / PIC</span>
                <span className="text-[10px] text-gray-400">40 x 40 px (1:1)</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-1">
                <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-200 mx-auto flex items-center justify-center text-indigo-700 text-xs font-bold">64px</div>
                <span className="block text-xs font-bold text-gray-800">Bukti Struk Kas</span>
                <span className="text-[10px] text-gray-400">64 x 64 px (1:1)</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-1">
                <div className="w-32 h-16 rounded-xl bg-emerald-50 border border-emerald-200 mx-auto flex items-center justify-center text-emerald-700 text-xs font-bold">160 x 80</div>
                <span className="block text-xs font-bold text-gray-800">Kartu Preview Surat</span>
                <span className="text-[10px] text-gray-400">16:9 Aspect Ratio</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-center space-y-1">
                <button
                  type="button"
                  onClick={() => alert('Simulasi Lightbox Resolusi Penuh!')}
                  className="w-32 h-16 rounded-xl bg-blue-600 text-white mx-auto flex items-center justify-center text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
                >
                  <ZoomIn size={14} className="mr-1" /> Zoom Full
                </button>
                <span className="block text-xs font-bold text-gray-800">Modal Lightbox</span>
                <span className="text-[10px] text-gray-400">Max 90vh (Fit Screen)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: PALET WARNA BAKU                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'colors' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Palet Warna Baku (Color Tokens & Standar Semantik)
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Aturan fungsi warna agar serasi dengan identitas Universitas Gadjah Mada:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Royal Blue (Brand Utama)</span>
                <span className="font-mono text-[10px]">#2563EB</span>
              </div>
              <p className="text-[11px] text-gray-500">Tombol aksi utama, tab aktif, header suite.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="h-10 rounded-lg bg-emerald-600 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Emerald (Export Excel & Sukses)</span>
                <span className="font-mono text-[10px]">#059669</span>
              </div>
              <p className="text-[11px] text-gray-500">Khusus tombol Excel dan status disetujui.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="h-10 rounded-lg bg-amber-500 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Amber (Review & Edit)</span>
                <span className="font-mono text-[10px]">#D97706</span>
              </div>
              <p className="text-[11px] text-gray-500">Status menunggu review dan tombol ubah data.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="h-10 rounded-lg bg-rose-600 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Rose (Ditolak & Hapus)</span>
                <span className="font-mono text-[10px]">#E11D48</span>
              </div>
              <p className="text-[11px] text-gray-500">Status ditolak dan tombol hapus destruktif.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="h-10 rounded-lg bg-blue-500 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Office Blue (Word .docx)</span>
                <span className="font-mono text-[10px]">#3B82F6</span>
              </div>
              <p className="text-[11px] text-gray-500">Khusus tombol Export Word dan persuratan.</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="h-10 rounded-lg bg-slate-800 flex items-center px-3 text-white font-bold text-xs justify-between">
                <span>Slate (Netral & Border)</span>
                <span className="font-mono text-[10px]">#1E293B</span>
              </div>
              <p className="text-[11px] text-gray-500">Teks utama, garis pemisah, dan tombol batal.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: TOMBOL & IKON                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'buttons' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Standarisasi Tombol & Ikon Baris Tabel
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[11px] font-bold text-gray-600 uppercase block mb-1.5">Primary</span>
                <PrimaryButton><Plus size={14} /> Tambah Data Baru</PrimaryButton>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-600 uppercase block mb-1.5">Secondary</span>
                <SecondaryButton><RotateCcw size={14} /> Reset Filter</SecondaryButton>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-600 uppercase block mb-1.5">Danger</span>
                <DangerButton>Hapus Terpilih</DangerButton>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 flex-wrap">
              <div className="flex items-center gap-1.5"><TableActionButton icon={Eye} variant="primary" title="Detail" /><span className="text-xs text-gray-600">Lihat Detail</span></div>
              <div className="flex items-center gap-1.5"><TableActionButton icon={Pencil} variant="warning" title="Edit" /><span className="text-xs text-gray-600">Ubah Data</span></div>
              <div className="flex items-center gap-1.5"><TableActionButton icon={Trash2} variant="danger" title="Hapus" /><span className="text-xs text-gray-600">Hapus Data</span></div>
              <div className="flex items-center gap-1.5"><TableActionButton icon={RefreshCw} variant="success" title="Sinkron" /><span className="text-xs text-gray-600">Sinkronisasi</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: TABEL & PAGING                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'table' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Standarisasi Tabel Data & Paging Baku
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Teks rata kiri, angka/uang rata kanan (font mono), status rata tengah.</p>
            </div>
            <ExportButtons onExportExcel={() => alert('Excel')} onExportWord={() => alert('Word')} />
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
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">Rp {row.pagu.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">Rp {row.realisasi.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-center"><StatusBadge status={row.status} /></td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TableActionButton icon={Eye} variant="primary" title="Detail" />
                        <TableActionButton icon={Pencil} variant="warning" title="Edit" />
                        <TableActionButton icon={Trash2} variant="danger" title="Hapus" />
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
    </div>
  );
}
