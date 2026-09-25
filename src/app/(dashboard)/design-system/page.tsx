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
  Type,
  ArrowUpDown,
  Bell,
  CheckCircle2,
  ShieldAlert,
  Rows,
  AlignJustify,
  Info,
  PanelRightClose,
  FileCheck,
  History,
  Tag
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TablePagination from '@/components/shared/TablePagination';
import ExportButtons from '@/components/shared/ExportButtons';
import StatusBadge from '@/components/shared/StatusBadge';
import StatCard from '@/components/shared/StatCard';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import AutocompleteCombobox from '@/components/shared/AutocompleteCombobox';
import DateRangePicker, { DateRange } from '@/components/shared/DateRangePicker';
import FileUploadDropzone from '@/components/shared/FileUploadDropzone';
import EmptyState from '@/components/shared/EmptyState';
import SkeletonTable from '@/components/shared/SkeletonTable';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ToastNotification, { ToastItem } from '@/components/shared/ToastNotification';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import BannerAlert from '@/components/shared/BannerAlert';
import FormModal from '@/components/shared/FormModal';
import DetailDrawer from '@/components/shared/DetailDrawer';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  TableActionButton 
} from '@/components/shared/ActionButtons';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<
    'forms' | 'typography' | 'cards' | 'charts' | 'tab-styles' | 'editor' | 'colors' | 'table' | 'modals'
  >('forms');

  // Table Density & Simulation State
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [tableSimState, setTableSimState] = useState<'normal' | 'loading' | 'empty'>('normal');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState<'danger' | 'warning' | 'primary' | 'success'>('danger');
  const [modalTitle, setModalTitle] = useState('Konfirmasi Hapus Pengajuan');
  const [modalDesc, setModalDesc] = useState('Apakah Anda yakin ingin menghapus data pengajuan pagu ini? Tindakan ini tidak dapat dibatalkan.');
  const [modalLoading, setModalLoading] = useState(false);

  // Form Modal Demo State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formModalLoading, setFormModalLoading] = useState(false);
  const [demoFormAccount, setDemoFormAccount] = useState('521211');
  const [demoFormName, setDemoFormName] = useState('Belanja Bahan Operasional Laboratorium');
  const [demoFormAmount, setDemoFormAmount] = useState('175000000');
  const [demoFormNotes, setDemoFormNotes] = useState('Diusulkan untuk pengadaan reagen dan alat habis pakai semester ganjil');

  // Detail Drawer Demo State
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Banner Alert Demo State
  const [showWarningBanner, setShowWarningBanner] = useState(true);

  // Toast Notification State
  const [toasts, setToasts] = useState<ToastItem[]>([
    { id: '1', type: 'success', title: 'Data Berhasil Disimpan', message: 'Penyesuaian usulan pagu Fakultas Biologi telah diperbarui.' }
  ]);

  const triggerToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const newId = Date.now().toString();
    const newToast: ToastItem = { id: newId, type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newId));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Empty State Interactive Type
  const [emptyStateVariant, setEmptyStateVariant] = useState<'search' | 'empty' | 'error' | 'unauthorized'>('search');

  // Poin 1 & 2: Autocomplete & Multi-Select State
  const [autocompleteUnit, setAutocompleteUnit] = useState<string>('3');
  const [singleStatus, setSingleStatus] = useState<string>('approved');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['1', '3']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['approved', 'pending']);

  // Poin 2 (Baru): Unified Date Range Picker with Time (Jam)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    startTime: '08:00',
    endTime: '17:00'
  });
  const [singleDate, setSingleDate] = useState<string>('2026-09-25');
  const [dateTimeVal, setDateTimeVal] = useState<string>('2026-09-25T08:30');

  // Poin 3 (Baru): Typography Tester State
  const [sampleTesterText, setSampleTesterText] = useState<string>('Universitas Gadjah Mada - Sistem Verifikasi Anggaran Terpadu');
  const [testerSize, setTesterSize] = useState<string>('text-lg');
  const [testerWeight, setTesterWeight] = useState<string>('font-bold');

  // Upload Textbox & Camera
  const [uploadTextPath, setUploadTextPath] = useState<string>('SK_Rektor_Penetapan_Pagu_2026.pdf');

  // Card Selection (Colored Border Ring)
  const [selectedCardId, setSelectedCardId] = useState<string>('pagu');

  // Tab Styles Demo
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
    { value: '1', label: 'Majelis Wali Amanat', badge: 'KPTU', subtext: 'Kode Unit: 010101' },
    { value: '2', label: 'Dewan Guru Besar', badge: 'KPTU', subtext: 'Kode Unit: 010201' },
    { value: '3', label: 'Direktorat Keuangan', badge: 'KPTU', subtext: 'Kode Unit: 010802' },
    { value: '4', label: 'Direktorat Perencanaan', badge: 'KPTU', subtext: 'Kode Unit: 010801' },
    { value: '5', label: 'Fakultas Biologi', badge: 'Fakultas', subtext: 'Kode Unit: 02000010' },
    { value: '6', label: 'Fakultas Ekonomika dan Bisnis', badge: 'Fakultas', subtext: 'Kode Unit: 03000010' },
    { value: '7', label: 'Fakultas Teknik', badge: 'Fakultas', subtext: 'Kode Unit: 04000010' },
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
        badge={{ text: 'Design System v2.3', variant: 'purple' }}
        actions={
          <ExportButtons
            onExportExcel={() => alert('Simulasi: Export Excel Standard')}
            onExportWord={() => alert('Simulasi: Export Word Standard')}
            onExportPdf={() => alert('Simulasi: Cetak PDF Standard')}
          />
        }
      />

      {/* Floating Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} position="top-right" />

      {/* Interactive Confirm Modal */}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        variant={modalVariant}
        title={modalTitle}
        description={modalDesc}
        isLoading={modalLoading}
        confirmText="Ya, Lanjutkan"
        cancelText="Batal"
        onConfirm={async () => {
          setModalLoading(true);
          await new Promise((res) => setTimeout(res, 800));
          setModalLoading(false);
          setModalOpen(false);
          triggerToast('success', 'Aksi Berhasil Diproses', `Tindakan ${modalTitle} telah dieksekusi secara aman.`);
        }}
      />

      {/* Interactive Form Modal (Standard Input Dialog) */}
      <FormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="Input Usulan Pagu Anggaran Baru"
        subtitle="Formulir entri alokasi belanja unit kerja tahun anggaran 2026"
        icon={<FileCheck className="w-5 h-5" />}
        size="lg"
        isLoading={formModalLoading}
        submitText="Simpan Usulan Pagu"
        onSubmit={async () => {
          setFormModalLoading(true);
          await new Promise((res) => setTimeout(res, 900));
          setFormModalLoading(false);
          setFormModalOpen(false);
          triggerToast('success', 'Usulan Pagu Berhasil Disimpan', `Kode Akun ${demoFormAccount} sebesar Rp ${Number(demoFormAmount).toLocaleString('id-ID')} telah direkam.`);
        }}
      >
        <div className="space-y-3.5">
          <BannerAlert
            type="info"
            variant="soft"
            title="Ketentuan Penetapan"
            message="Pastikan kode akun sesuai dengan Bagan Akun Standar (BAS) UGM edisi 2026."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Unit Kerja
              </label>
              <input
                type="text"
                disabled
                value="Majelis Wali Amanat (MWA)"
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 text-xs font-semibold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Kode Akun Belanja
              </label>
              <input
                type="text"
                value={demoFormAccount}
                onChange={(e) => setDemoFormAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Uraian Akun Belanja
            </label>
            <input
              type="text"
              value={demoFormName}
              onChange={(e) => setDemoFormName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Nominal Pagu Diusulkan (Rp)
            </label>
            <input
              type="number"
              value={demoFormAmount}
              onChange={(e) => setDemoFormAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              Terbaca: Rp {Number(demoFormAmount || 0).toLocaleString('id-ID')}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
              Catatan & Justifikasi Pengajuan
            </label>
            <textarea
              rows={3}
              value={demoFormNotes}
              onChange={(e) => setDemoFormNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-xs text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </FormModal>

      {/* Interactive Detail Drawer (Slide-Over Panel Samping) */}
      <DetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Detail Verifikasi Usulan"
        subtitle="ID Berkas: TR-UGM-2026-0902"
        badge={<StatusBadge status="disetujui" />}
        icon={<PanelRightClose className="w-5 h-5" />}
        width="xl"
        footerActions={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-gray-500 font-mono">
              Terakhir diperbarui: 25 Sep 2026, 14:30
            </span>
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={() => setDrawerOpen(false)}>
                Tutup
              </SecondaryButton>
              <PrimaryButton onClick={() => {
                setDrawerOpen(false);
                triggerToast('info', 'Cetak Lembar Verifikasi', 'Menyiapkan berkas PDF lembar verifikasi...');
              }}>
                Cetak Lembar Verifikasi
              </PrimaryButton>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Banner Alert inside Drawer */}
          <BannerAlert
            type="success"
            variant="accent-left"
            title="Verifikasi Lolos Syarat"
            message="Pengajuan telah diperiksa oleh Verifikator Keuangan dan dinyatakan memenuhi seluruh kepatuhan administrasi."
          />

          {/* KPI Ringkasan Akun */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Pagu Disetujui</span>
              <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                Rp 1.250.000.000
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-gray-400">Realisasi s.d. Saat Ini</span>
              <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                Rp 850.000.000 (68%)
              </p>
            </div>
          </div>

          {/* Metadata Rincian */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-850 space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 block border-b pb-1.5 border-gray-100 dark:border-slate-700">
              Informasi Mata Anggaran
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <span className="text-gray-500 font-medium">Unit Pengusul:</span>
              <span className="col-span-2 font-bold text-gray-900 dark:text-gray-100">Fakultas Biologi UGM</span>

              <span className="text-gray-500 font-medium">Mata Anggaran:</span>
              <span className="col-span-2 font-mono font-bold text-indigo-700 dark:text-indigo-400">511111 - Belanja Gaji Pokok PNS</span>

              <span className="text-gray-500 font-medium">Sumber Dana:</span>
              <span className="col-span-2 font-semibold text-gray-800 dark:text-gray-200">Dana Masyarakat (PTNBH)</span>

              <span className="text-gray-500 font-medium">SK Penetapan:</span>
              <span className="col-span-2 font-semibold text-blue-600">SK/REK/UGM/2026/0411</span>
            </div>
          </div>

          {/* Audit Timeline / Jejak Rekam */}
          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-850 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600" /> Jejak Rekam Verifikasi (Audit Trail)
            </span>
            
            <div className="relative pl-6 space-y-3 border-l-2 border-blue-200 dark:border-blue-900 ml-2">
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                <span className="text-[10px] text-gray-400 font-mono">25 Sep 2026, 14:30 WIB</span>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">Persetujuan Final oleh Direktur Keuangan</p>
                <p className="text-[11px] text-gray-500">Berkas dinyatakan lengkap dan telah ditandatangani secara digital.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                <span className="text-[10px] text-gray-400 font-mono">24 Sep 2026, 10:15 WIB</span>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">Pemeriksaan Kesesuaian oleh Staf Verifikator</p>
                <p className="text-[11px] text-gray-500">Kesesuaian volume dan harga satuan telah sesuai standar SBU.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-900" />
                <span className="text-[10px] text-gray-400 font-mono">22 Sep 2026, 09:00 WIB</span>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">Pengajuan Usulan oleh Unit Kerja</p>
                <p className="text-[11px] text-gray-500">Dokumen RKA diunggah melalui portal anggaran.</p>
              </div>
            </div>
          </div>
        </div>
      </DetailDrawer>

      {/* 2. Grid 3 Kolom Proporsional (3 Baris Rapi, Nyaman & Tidak Terjepit) */}
      <div className="bg-white/95 backdrop-blur-sm p-3.5 px-4 md:px-5 rounded-2xl border border-gray-200/90 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-blue-600" />
            <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
              Katalog Komponen Baku Terpadu (9 Modul Standar)
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold hidden sm:inline">
            Tampilan proporsional & responsif (3 kolom x 3 baris)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {[
            { id: 'forms', num: '01', label: 'Filter & Form Input', desc: 'Autocomplete ↑/↓, Multi, Jam', icon: Search },
            { id: 'typography', num: '02', label: 'Ukuran & Jenis Font', desc: 'Hierarki Font, Mono Uang, Tester', icon: Type },
            { id: 'cards', num: '03', label: 'Template Card', desc: 'KPI Stat & Klik Garis Tepi', icon: Layout },
            { id: 'charts', num: '04', label: 'Template Grafik', desc: 'Bar, Line, Donut, Gauge', icon: BarChart3 },
            { id: 'tab-styles', num: '05', label: 'Tab Pilihan Menu', desc: 'Pill, Underline, Capsule', icon: Layers },
            { id: 'editor', num: '06', label: 'Editor & Gambar', desc: 'Toolbar Dokumen & Ukuran Foto', icon: FileText },
            { id: 'colors', num: '07', label: 'Palet Warna Baku', desc: 'Royal Blue, Emerald, Amber', icon: Palette },
            { id: 'table', num: '08', label: 'Tabel & Paging', desc: 'Density Luwes/Rapat & Shimmer', icon: TableIcon },
            { id: 'modals', num: '09', label: 'Modal, Alert & Drawer', desc: 'Confirm, Form, Alert, Drawer', icon: Bell },
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
      {/* TAB 1: FILTER & FORM INPUT (AUTOCOMPLETE ↑/↓, MULTI-SELECT, RANGE + JAM) */}
      {/* ========================================================================= */}
      {activeTab === 'forms' && (
        <div className="space-y-4">
          {/* Card: Autocomplete with Keyboard Arrow Navigation (Poin 1) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 1
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Filter Autocomplete dengan Navigasi Panah Naik / Turun (↑ / ↓)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ketik untuk menyaring opsi, gunakan <strong>panah atas/bawah keyboard</strong> untuk memilih baris, dan tekan <strong>Enter</strong> untuk memilih tanpa perlu menyentuh mouse.
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Autocomplete Combobox dengan Navigasi Keyboard */}
              <div className="space-y-2 p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <ArrowUpDown size={13} className="text-blue-600" />
                    Autocomplete Keyboard-Friendly
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    ↑ / ↓ + Enter
                  </span>
                </div>

                <AutocompleteCombobox
                  label="Pilih Unit Kerja (Ketik & Gunakan Panah ↑/↓)"
                  placeholder="Ketik nama unit (misal: Biologi, Keuangan)..."
                  options={sampleUnits}
                  value={autocompleteUnit}
                  onChange={setAutocompleteUnit}
                />

                <span className="text-[11px] text-gray-500 font-medium block pt-1">
                  Unit terpilih: <strong className="text-blue-700">{sampleUnits.find(u => u.value === autocompleteUnit)?.label || 'Belum dipilih'}</strong>
                </span>
              </div>

              {/* Multi-Select Filter */}
              <div className="space-y-2 p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Multi-Select Filter (Banyak Pilihan)
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Centang + Tag
                  </span>
                </div>

                <MultiSelectFilter
                  label="Pilih Beberapa Unit (Multi-Select)"
                  placeholder="Pilih beberapa unit kerja..."
                  options={sampleUnits}
                  selectedValues={selectedUnits}
                  onChange={setSelectedUnits}
                  maxDisplayTags={2}
                />

                <span className="text-[11px] text-gray-500 font-medium block pt-1">
                  Terpilih ({selectedUnits.length}): <span className="font-mono text-indigo-700 font-bold">[{selectedUnits.join(', ')}]</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card: Rentang Tanggal + Jam (Poin 2) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 2
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Rentang Tanggal & Jam Laporan (Unified Popover dengan Jam)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Komponen <code className="text-blue-600 font-bold">&lt;DateRangePicker showTime /&gt;</code> menyajikan tanggal awal & akhir beserta <strong>jam mulai & jam selesai</strong> dalam satu popover terpadu (1x klik).
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <DateRangePicker
                  label="Rentang Tanggal & Jam Lengkap (1x Klik)"
                  value={dateRange}
                  onChange={setDateRange}
                  showTime={true}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Aktif: {dateRange.startDate} ({dateRange.startTime}) s/d {dateRange.endDate} ({dateRange.endTime})
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Tanggal & Jam Tunggal
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

          {/* Upload Textbox & Kamera */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Fasilitas Upload: Textbox File, Tombol Kamera / Browse, & Drag-Drop
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Pilih berkas lewat textbox, ambil foto fisik kuitansi via kamera HP, atau seret ke area dropzone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                  Input Textbox Berkas & Tombol Kamera
                </span>

                <div className="flex items-center gap-1.5">
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

              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
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
      {/* TAB 2: UKURAN & JENIS FONT (POIN 3: TYPOGRAPHY SYSTEM & TESTER)           */}
      {/* ========================================================================= */}
      {activeTab === 'typography' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                  Poin 3
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Standarisasi Ukuran & Jenis Font (Typography System)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Aturan baku ukuran huruf (*font scale*), ketebalan (*weight*), dan jenis font (*Sans vs Monospace*) agar tampilan halaman rapi, mudah dibaca, dan tidak tumpang tindih.
              </p>
            </div>

            {/* 1. Aturan Jenis Font (Sans vs Mono) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                    1. Font Sans-Serif (Inter / System UI)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    font-sans
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-sans">
                  Digunakan untuk semua judul halaman, label formulir, teks paragraf, tombol aksi, dan nama unit kerja. Memberikan kesan modern, bersih, dan nyaman di mata.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-sans text-gray-700">
                  Contoh: <strong>Direktorat Keuangan Universitas Gadjah Mada</strong>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                    2. Font Monospace (Tabular Numbers)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                    font-mono
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-sans">
                  Wajib digunakan untuk <strong>nominal uang rupiah</strong>, persentase, kode akun MAK, dan tanggal/jam agar setiap angka memiliki lebar yang sama dan lurus rata kanan di tabel.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono font-bold text-emerald-700 text-right">
                  Rp 1.250.000.000 | 511111 | 2026-09-25
                </div>
              </div>
            </div>

            {/* 2. Tabel Skala Ukuran Font Baku */}
            <div className="space-y-2">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                Tabel Skala & Kegunaan Ukuran Font
              </span>

              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                      <th className="py-2.5 px-3">Tingkat / Level</th>
                      <th className="py-2.5 px-3">Ukuran (Pixel)</th>
                      <th className="py-2.5 px-3">Class Tailwind</th>
                      <th className="py-2.5 px-3">Contoh Visual</th>
                      <th className="py-2.5 px-3">Kaidah Penggunaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-gray-900">Judul Halaman (H1)</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">24 px</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">text-2xl font-black</td>
                      <td className="py-3 px-3 font-black text-2xl text-gray-900 leading-none">Judul Utama Halaman</td>
                      <td className="py-3 px-3 text-gray-500 text-[11px]">Header teratas setiap halaman</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-gray-900">Judul Card / Section (H2)</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">20 px</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">text-xl font-black</td>
                      <td className="py-3 px-3 font-black text-xl text-gray-800 leading-none">Judul Modul / Card</td>
                      <td className="py-3 px-3 text-gray-500 text-[11px]">Header kartu KPI, modal popover</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-gray-900">Sub-Judul Card (H3)</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">14 px</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">text-sm font-bold</td>
                      <td className="py-3 px-3 font-bold text-sm text-gray-800 leading-none">Sub-Judul Bagian Fitur</td>
                      <td className="py-3 px-3 text-gray-500 text-[11px]">Header tabel, filter title</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-gray-900">Teks Isi / Sel Tabel (Body)</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">12 px</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">text-xs font-semibold</td>
                      <td className="py-3 px-3 text-xs font-semibold text-gray-700">Teks isi data tabel standar</td>
                      <td className="py-3 px-3 text-gray-500 text-[11px]">Data baris tabel, deskripsi, form input</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-gray-900">Header Kolom Tabel (TH)</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">11 px</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">text-[11px] font-black uppercase</td>
                      <td className="py-3 px-3 text-[11px] font-black uppercase tracking-wider text-gray-600">KODE AKUN</td>
                      <td className="py-3 px-3 text-gray-500 text-[11px]">Header kolom tabel berjarak rapi</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-gray-900">Micro Badge / Status</td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600">8.5 - 9.5 px</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-gray-500">text-[8.5px] font-black uppercase</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[8.5px] font-black uppercase tracking-wider">
                          DISUSETUJUI
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-500 text-[11px]">Badge sub-menu dan status transaksi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Live Font Tester Playground */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                Uji Coba Langsung Ukuran Font (Live Font Tester)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={sampleTesterText}
                    onChange={(e) => setSampleTesterText(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    placeholder="Ketik teks untuk diuji..."
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={testerSize}
                    onChange={(e) => setTesterSize(e.target.value)}
                    className="h-9 px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-bold text-gray-700 flex-1"
                  >
                    <option value="text-2xl">24px (H1)</option>
                    <option value="text-xl">20px (H2)</option>
                    <option value="text-lg">18px (Large)</option>
                    <option value="text-base">16px (H3)</option>
                    <option value="text-sm">14px (Medium)</option>
                    <option value="text-xs">12px (Body/Tabel)</option>
                    <option value="text-[11px]">11px (Header Tabel)</option>
                    <option value="text-[9px]">9px (Micro Badge)</option>
                  </select>

                  <select
                    value={testerWeight}
                    onChange={(e) => setTesterWeight(e.target.value)}
                    className="h-9 px-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none font-bold text-gray-700 flex-1"
                  >
                    <option value="font-black">Black (900)</option>
                    <option value="font-bold">Bold (700)</option>
                    <option value="font-semibold">Semibold (600)</option>
                    <option value="font-medium">Medium (500)</option>
                    <option value="font-normal">Regular (400)</option>
                  </select>
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 min-h-[60px] flex items-center justify-center text-center">
                <span className={`${testerSize} ${testerWeight} text-gray-900 transition-all`}>
                  {sampleTesterText || 'Ketik teks di atas'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEMPLATE CARD (KLIK KARTU ADA GARIS TEPI MENYALA)                   */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Template Card Interaktif (Klik Kartu ➔ Garis Tepi Menyala / Ring Focus)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Silakan <strong>klik salah satu kartu di bawah ini</strong>: Kartu yang aktif akan mendapatkan garis tepi bergradien warna tebal (*ring outline*) dengan tanda centang aktif.
              </p>
            </div>

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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TEMPLATE GRAFIK (BAR, LINE, DONUT, GAUGE)                          */}
      {/* ========================================================================= */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                Koleksi Template Grafik Baku Lengkap
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Bar Komparasi, Tren Garis Bulanan, Donut Komposisi, dan Speedometer Gauge Target.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar Chart */}
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

              {/* Line / Area Chart */}
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

                <div className="h-32 w-full pt-2 flex flex-col justify-end">
                  <svg className="w-full h-24 overflow-visible" viewBox="0 0 300 80">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,70 Q50,60 100,45 T200,30 T300,10 L300,80 L0,80 Z" fill="url(#areaGradient)" />
                    <path d="M0,70 Q50,60 100,45 T200,30 T300,10" fill="none" stroke="#059669" strokeWidth="3" />
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

              {/* Donut Chart */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart size={16} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-800">3. Donut: Komposisi Belanja</span>
                  </div>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                    Total 100%
                  </span>
                </div>

                <div className="flex items-center justify-around gap-4 pt-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-blue-600" strokeDasharray="45, 100" strokeWidth="3.8" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-emerald-500" strokeDasharray="30, 100" strokeWidth="3.8" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="text-purple-500" strokeDasharray="25, 100" strokeWidth="3.8" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
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

              {/* Gauge Chart */}
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
      {/* TAB 5: TAB PILIHAN MENU (3 VARIASI GAYA TAB)                              */}
      {/* ========================================================================= */}
      {activeTab === 'tab-styles' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Katalog Gaya Tab Pilihan (Tab Selection Standards)
            </h2>

            {/* Gaya 1: Pill Gradient */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Gaya 1: Glow Pill Tabs (Dipakai di Sub-Menu Suite)
              </span>
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

            {/* Gaya 2: Underline Tab */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Gaya 2: Underline Line Tabs (Dipakai di Rincian Laporan)
              </span>
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

            {/* Gaya 3: Segmented Capsule */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Gaya 3: Segmented Capsule Bar (Gaya iOS / Switch Filter)
              </span>
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
      {/* TAB 6: EDITOR & STANDAR UKURAN GAMBAR                                     */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
              Template Editor Dokumen & Standar Ukuran Menampilkan Gambar
            </h2>

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
      {/* TAB 7: PALET WARNA BAKU                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'colors' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            Palet Warna Baku (Color Tokens & Standar Semantik)
          </h2>
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
      {/* TAB 8: TABEL & PAGING (DENSITY & SIMULASI LOADING / KOSONG)                */}
      {/* ========================================================================= */}
      {activeTab === 'table' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Standarisasi Tabel Data, Paging & Kerapatan (Density)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {tableDensity === 'compact' ? 'Mode Rapat (Compact)' : 'Mode Luwes (Comfortable)'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Teks rata kiri, angka/uang rata kanan (font mono), status rata tengah. Dilengkapi pengatur kerapatan baris.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Density Toggle */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">Kerapatan:</span>
                <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
              </div>

              {/* Simulation Mode Controls */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setTableSimState('normal')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tableSimState === 'normal'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setTableSimState('loading')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tableSimState === 'loading'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Loading Shimmer
                </button>
                <button
                  type="button"
                  onClick={() => setTableSimState('empty')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    tableSimState === 'empty'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Data Kosong
                </button>
              </div>

              <ExportButtons onExportExcel={() => alert('Excel')} onExportWord={() => alert('Word')} />
            </div>
          </div>

          {/* Conditional Rendering: Loading Skeleton vs Empty State vs Normal Table */}
          {tableSimState === 'loading' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                <span>⚡ <strong>Simulasi Skeleton Shimmer:</strong> Pengganti animasi putaran loading konvensional agar perpindahan halaman mulus & tidak berkedip.</span>
                <button
                  onClick={() => setTableSimState('normal')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-200 text-[11px]"
                >
                  Kembalikan Normal
                </button>
              </div>
              <SkeletonTable rows={5} columns={8} showStatCards={false} />
            </div>
          )}

          {tableSimState === 'empty' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>🔍 <strong>Simulasi Empty State:</strong> Memberikan panduan aksi solutif saat hasil pencarian atau filter bernilai 0 rekaman.</span>
                <button
                  onClick={() => setTableSimState('normal')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 text-[11px]"
                >
                  Kembalikan Normal
                </button>
              </div>
              <EmptyState
                type="search"
                title="Pagu Anggaran Tidak Ditemukan"
                description="Tidak ada data belanja pagu yang sesuai dengan filter atau kata kunci pencarian yang sedang aktif."
                actionLabel="Reset & Tampilkan Semua"
                onAction={() => setTableSimState('normal')}
              />
            </div>
          )}

          {tableSimState === 'normal' && (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                      <th className={`text-center w-12 ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>No</th>
                      <th className={`${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Kode Akun</th>
                      <th className={`${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Uraian Akun</th>
                      <th className={`${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Unit Kerja</th>
                      <th className={`text-right ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Pagu Usulan</th>
                      <th className={`text-right ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Realisasi</th>
                      <th className={`text-center ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Status</th>
                      <th className={`text-center w-24 ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sampleTableData.map((row, idx) => (
                      <tr 
                        key={row.id} 
                        className={`hover:bg-blue-50/40 transition-colors even:bg-slate-50/30 ${
                          tableDensity === 'compact' ? 'text-[11px]' : 'text-xs'
                        }`}
                      >
                        <td className={`text-center text-gray-400 font-mono ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                          {idx + 1}
                        </td>
                        <td className={`font-mono font-bold text-indigo-700 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                          {row.kode}
                        </td>
                        <td className={`font-semibold text-gray-800 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                          {row.nama}
                        </td>
                        <td className={`text-gray-600 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                          {row.unit}
                        </td>
                        <td className={`text-right font-mono font-bold text-gray-900 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                          Rp {row.pagu.toLocaleString('id-ID')}
                        </td>
                        <td className={`text-right font-mono text-emerald-700 font-semibold ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                          Rp {row.realisasi.toLocaleString('id-ID')}
                        </td>
                        <td className={`text-center ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                          <StatusBadge status={row.status} />
                        </td>
                        <td className={`text-center ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
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
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: MODAL, ALERT & DRAWER (SISTEM DIALOG, NOTIFIKASI & PANEL SAMPING)   */}
      {/* ========================================================================= */}
      {activeTab === 'modals' && (
        <div className="space-y-6">
          {/* 1. Banner Alert & Callout Kontekstual */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  1. Banner Alert Kontekstual (Inline Page Alerts & Callouts)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pemberitahuan tersemat di dalam halaman atau kartu untuk instruksi, batas waktu, atau peringatan pagu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`<BannerAlert
  type="warning"
  variant="accent-left"
  title="Batas Akhir Revisi Pagu"
  message="Pengajuan perubahan usulan pagu anggaran tahun 2026 akan ditutup pada 30 September 2026 pukul 23:59 WIB."
  actionText="Lihat Jadwal Revisi"
  onAction={() => router.push('/jadwal')}
  onClose={() => setVisible(false)}
/>`, 'banner-alert-code')}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedCode === 'banner-alert-code' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedCode === 'banner-alert-code' ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Info Alert */}
              <BannerAlert
                type="info"
                variant="accent-left"
                title="Sinkronisasi Data Simaster"
                message="Data RKAT unit kerja telah tersinkronisasi otomatis dengan server pusat pada pukul 08:30 WIB."
                actionText="Periksa Log"
                onAction={() => alert('Membuka log sinkronisasi')}
              />

              {/* Warning Alert */}
              {showWarningBanner ? (
                <BannerAlert
                  type="warning"
                  variant="accent-left"
                  title="Peringatan Batas Waktu Revisi"
                  message="Masa revisi usulan pagu berakhir dalam 5 hari kerja. Pastikan seluruh berkas telah diunggah."
                  actionText="Cek Dokumen"
                  onAction={() => alert('Membuka daftar berkas')}
                  onClose={() => setShowWarningBanner(false)}
                />
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-gray-200 flex items-center justify-between text-xs text-gray-400">
                  <span>Banner Peringatan telah ditutup oleh pengguna.</span>
                  <button
                    onClick={() => setShowWarningBanner(true)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Tampilkan Lagi
                  </button>
                </div>
              )}

              {/* Danger Alert */}
              <BannerAlert
                type="danger"
                variant="accent-left"
                title="Pagu Anggaran Melebihi Batas Plafon"
                message="Total usulan belanja modal Fakultas Kedokteran melebihi plafon indikatif sebesar Rp 45.000.000."
              />

              {/* Success Alert */}
              <BannerAlert
                type="success"
                variant="accent-left"
                title="Verifikasi Administrasi Lengkap"
                message="Seluruh berkas persyaratan dan surat keputusan telah diverifikasi sah oleh Tim Verifikator."
              />
            </div>
          </div>

          {/* 2. Modal Form Pengisian Data (FormModal) & Panel Samping (DetailDrawer) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kartu Uji Form Modal */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  2. Modal Form Input (FormModal)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  Size: LG / XL
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Dialog entri data / tambah usulan tanpa perlu berpindah halaman (dilengkapi header sticky, form scrollable, & tombol simpan beranimasi loading).
              </p>

              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Form Entri Pagu Unit</span>
                  <span className="text-[11px] text-gray-500">Simulasi input nominal pagu & kode akun BAS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus size={14} /> Buka Form Modal
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(`<FormModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Input Usulan Pagu Baru"
  subtitle="Formulir alokasi belanja unit"
  size="lg"
  isLoading={isLoading}
  onSubmit={handleSubmit}
>
  {/* Input fields di sini */}
</FormModal>`, 'form-modal-code')}
                  className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {copiedCode === 'form-modal-code' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  {copiedCode === 'form-modal-code' ? 'Tersalin' : 'Salin Sintaks FormModal'}
                </button>
              </div>
            </div>

            {/* Kartu Uji Detail Drawer (Slide-Over) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <PanelRightClose className="w-4 h-4 text-indigo-600" />
                  3. Panel Samping Slide-Over (DetailDrawer)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  Offcanvas Right
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Panel inspeksi yang meluncur mulus dari sisi kanan layar, sangat ideal untuk membaca jejak rekam audit, catatan review, atau rincian transaksi tabel.
              </p>

              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Inspeksi Berkas TR-UGM-2026</span>
                  <span className="text-[11px] text-gray-500">Jejak audit, metadata akun & verifikator</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Eye size={14} /> Buka Panel Samping
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(`<DetailDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  title="Detail Usulan Pagu"
  badge={<StatusBadge status="disetujui" />}
  width="xl"
>
  {/* Konten detail atau audit trail di sini */}
</DetailDrawer>`, 'drawer-code')}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  {copiedCode === 'drawer-code' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                  {copiedCode === 'drawer-code' ? 'Tersalin' : 'Salin Sintaks DetailDrawer'}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Modal Dialog Konfirmasi Baku (ConfirmModal) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  4. Modal Dialog Konfirmasi Baku (Backdrop Blur & Safe Confirm)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Mencegah kekeliruan fatal pengguna pada aksi destruktif (Hapus, Tolak, Simpan Perubahan).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  variant="danger"
  title="Konfirmasi Hapus Usulan"
  description="Apakah Anda yakin ingin menghapus data ini secara permanen?"
  confirmText="Ya, Hapus Data"
  onConfirm={async () => { await handleDelete(); }}
/>`, 'confirm-modal-code')}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedCode === 'confirm-modal-code' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedCode === 'confirm-modal-code' ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Trigger Danger Modal */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                  Danger / Destruktif
                </span>
                <h4 className="text-xs font-bold text-gray-800">Hapus Data & Penolakan Usulan</h4>
                <p className="text-[11px] text-gray-500">Ikon tempat sampah merah & tombol konfirmasi rose mencolok.</p>
                <button
                  type="button"
                  onClick={() => {
                    setModalVariant('danger');
                    setModalTitle('Konfirmasi Hapus Usulan Pagu');
                    setModalDesc('Apakah Anda yakin ingin menghapus usulan Belanja Modal Fakultas Biologi? Data yang dihapus tidak dapat dipulihkan.');
                    setModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} /> Uji Modal Hapus (Danger)
                </button>
              </div>

              {/* Trigger Warning Modal */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Warning / Koreksi
                </span>
                <h4 className="text-xs font-bold text-gray-800">Kembalikan untuk Revisi</h4>
                <p className="text-[11px] text-gray-500">Ikon peringatan kuning amber untuk pengembalian dokumen.</p>
                <button
                  type="button"
                  onClick={() => {
                    setModalVariant('warning');
                    setModalTitle('Kembalikan Dokumen untuk Revisi');
                    setModalDesc('Dokumen RKA akan dikembalikan ke Unit Kerja dengan catatan revisi yang telah dilampirkan.');
                    setModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle size={13} /> Uji Modal Revisi (Warning)
                </button>
              </div>

              {/* Trigger Primary/Success Modal */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  Primary / Approval
                </span>
                <h4 className="text-xs font-bold text-gray-800">Persetujuan & Penguncian Data</h4>
                <p className="text-[11px] text-gray-500">Ikon tanda tanya biru untuk validasi akhir pengesahan anggaran.</p>
                <button
                  type="button"
                  onClick={() => {
                    setModalVariant('primary');
                    setModalTitle('Setujui Usulan Pagu Anggaran');
                    setModalDesc('Apakah Anda yakin ingin menyetujui seluruh mata anggaran usulan ini dan meneruskannya ke SK Rektor?');
                    setModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={13} /> Uji Modal Setujui (Primary)
                </button>
              </div>
            </div>
          </div>

          {/* 4. Toast Notification System */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  5. Toast Notifikasi Mengambang (Floating Feedback Alerts)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Umpan balik seketika di pojok kanan atas setelah aksi API/DB (hilang otomatis setelah 4.5 detik).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`// Trigger toast dari komponen manapun
triggerToast('success', 'Data Berhasil Disimpan', 'Pagu telah disesuaikan.');
triggerToast('error', 'Gagal Memproses Permintaan', 'Koneksi database timeout.');`, 'toast-code')}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedCode === 'toast-code' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedCode === 'toast-code' ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => triggerToast('success', 'Berhasil Disimpan!', 'Penyesuaian data pagu unit berhasil direkam ke database.')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <CheckCircle2 size={15} className="text-emerald-600" /> Toast Sukses
              </button>

              <button
                type="button"
                onClick={() => triggerToast('error', 'Gagal Memproses!', 'Nomor rekening atau kode akun belanja tidak terdaftar.')}
                className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <AlertCircle size={15} className="text-rose-600" /> Toast Gagal
              </button>

              <button
                type="button"
                onClick={() => triggerToast('warning', 'Peringatan Anggaran!', 'Sisa saldo pagu unit telah mencapai 92% dari batas maksimal.')}
                className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <AlertCircle size={15} className="text-amber-600" /> Toast Peringatan
              </button>

              <button
                type="button"
                onClick={() => triggerToast('info', 'Informasi Pemeliharaan', 'Sinkronisasi data RKAT terjadwal akan berlangsung pukul 23:00 WIB.')}
                className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Info size={15} className="text-blue-600" /> Toast Info
              </button>
            </div>
          </div>

          {/* 5. Galeri Empty State Interaktif */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" />
                  6. Empty State Baku (Tampilan Saat Data Kosong / Gagal)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  4 varian siap pakai untuk mencegah layar kosong membingungkan bagi pengguna.
                </p>
              </div>

              {/* Varian Selector */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                {[
                  { id: 'search', label: 'Filter Kosong' },
                  { id: 'empty', label: 'Belum Ada Data' },
                  { id: 'error', label: 'Koneksi Error' },
                  { id: 'unauthorized', label: 'Akses Ditolak' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEmptyStateVariant(item.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      emptyStateVariant === item.id
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Render of EmptyState */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80">
              <EmptyState
                type={emptyStateVariant}
                onAction={() => alert(`Aksi utama untuk tipe: ${emptyStateVariant}`)}
                onSecondaryAction={() => alert('Aksi sekunder dipicu')}
                secondaryLabel={emptyStateVariant === 'error' ? 'Bantuan Teknis' : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
