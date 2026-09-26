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
  Tag,
  Database,
  Network,
  GitBranch,
  Link as LinkIcon,
  Users,
  Scale,
  PlusCircle,
  ClipboardPaste
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
import DocumentViewerModal from '@/components/shared/DocumentViewerModal';
import VerificationStepper from '@/components/shared/VerificationStepper';
import QuickFilterChips from '@/components/shared/QuickFilterChips';
import ThemeToggle from '@/components/shared/ThemeToggle';
import TreeView, { TreeNodeItem } from '@/components/shared/TreeView';
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

  // Document Viewer Demo State
  const [docViewerOpen, setDocViewerOpen] = useState(false);

  // Quick Filter Chips State
  const [selectedQuickChip, setSelectedQuickChip] = useState('all');

  // Verification Stepper State
  const [activeStepIdx, setActiveStepIdx] = useState(2);

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

  // Tree View State & Sample Data
  const [treeTab, setTreeTab] = useState<'unit' | 'akun'>('unit');
  const [selectedTreeNode, setSelectedTreeNode] = useState<TreeNodeItem | null>({
    id: 'u-5',
    label: 'Fakultas Biologi',
    code: '02000010',
    type: 'faculty',
    badge: 'Fakultas',
    amount: 12500000000,
  });

  const sampleUnitTreeData: TreeNodeItem[] = [
    {
      id: 'ugm-root',
      label: 'Universitas Gadjah Mada',
      code: 'UGM-00',
      type: 'faculty',
      badge: 'Pusat',
      badgeVariant: 'blue',
      children: [
        {
          id: 'kptu',
          label: 'Kantor Pimpinan Universitas (KPTU)',
          code: 'KPTU-01',
          type: 'faculty',
          badge: 'Rektorat',
          badgeVariant: 'slate',
          children: [
            { id: 'u-1', label: 'Majelis Wali Amanat (MWA)', code: '010101', type: 'unit', badge: 'KPTU', amount: 1540000000 },
            { id: 'u-2', label: 'Dewan Guru Besar (DGB)', code: '010201', type: 'unit', badge: 'KPTU', amount: 890000000 },
            { id: 'u-3', label: 'Direktorat Keuangan', code: '010802', type: 'unit', badge: 'Direktorat', amount: 4820000000 },
            { id: 'u-4', label: 'Direktorat Perencanaan', code: '010801', type: 'unit', badge: 'Direktorat', amount: 3250000000 },
          ],
        },
        {
          id: 'agro',
          label: 'Klaster Agro & Hayati',
          code: 'KLS-02',
          type: 'faculty',
          badge: 'Klaster',
          badgeVariant: 'emerald',
          children: [
            {
              id: 'u-5',
              label: 'Fakultas Biologi',
              code: '02000010',
              type: 'faculty',
              badge: 'Fakultas',
              amount: 12500000000,
              children: [
                { id: 'dep-bio-1', label: 'Departemen Biologi Tropika', code: '020100', type: 'department', amount: 4500000000 },
                { id: 'lab-bio-2', label: 'Laboratorium Genetika & Bioteknologi', code: '020200', type: 'unit', amount: 2100000000 },
              ],
            },
            {
              id: 'u-6',
              label: 'Fakultas Pertanian',
              code: '02020010',
              type: 'faculty',
              badge: 'Fakultas',
              amount: 14200000000,
            },
          ],
        },
        {
          id: 'saintek',
          label: 'Klaster Sains & Teknologi',
          code: 'KLS-04',
          type: 'faculty',
          badge: 'Klaster',
          badgeVariant: 'amber',
          children: [
            {
              id: 'u-7',
              label: 'Fakultas Teknik',
              code: '04000010',
              type: 'faculty',
              badge: 'Fakultas',
              amount: 28900000000,
              children: [
                { id: 'dep-te-1', label: 'Departemen Teknik Elektro & TI', code: '040100', type: 'department', amount: 8200000000 },
                { id: 'dep-ts-2', label: 'Departemen Teknik Sipil & Lingkungan', code: '040200', type: 'department', amount: 7400000000 },
              ],
            },
            {
              id: 'u-8',
              label: 'Fakultas MIPA',
              code: '05000010',
              type: 'faculty',
              badge: 'Fakultas',
              amount: 16800000000,
            },
          ],
        },
        {
          id: 'soshum',
          label: 'Klaster Sosial Humaniora',
          code: 'KLS-06',
          type: 'faculty',
          badge: 'Klaster',
          badgeVariant: 'blue',
          children: [
            {
              id: 'u-9',
              label: 'Fakultas Ekonomika dan Bisnis',
              code: '03000010',
              type: 'faculty',
              badge: 'Fakultas',
              amount: 22400000000,
            },
            {
              id: 'u-10',
              label: 'Fakultas Hukum',
              code: '06000010',
              type: 'faculty',
              badge: 'Fakultas',
              amount: 11900000000,
            },
          ],
        },
      ],
    },
  ];

  const sampleAccountTreeData: TreeNodeItem[] = [
    {
      id: 'acc-5',
      label: '5 - Belanja Negara & PTNBH',
      code: '5',
      type: 'account_group',
      badge: 'Akun Utama',
      badgeVariant: 'blue',
      children: [
        {
          id: 'acc-51',
          label: '51 - Belanja Pegawai',
          code: '51',
          type: 'account_subgroup',
          badge: 'Kelompok',
          badgeVariant: 'slate',
          children: [
            {
              id: 'acc-5111',
              label: '5111 - Gaji dan Tunjangan Pokok PNS',
              code: '5111',
              type: 'account_subgroup',
              children: [
                { id: 'acc-511111', label: 'Belanja Gaji Pokok PNS', code: '511111', type: 'account_item', badge: 'Operasional', badgeVariant: 'emerald', amount: 1250000000 },
                { id: 'acc-511119', label: 'Belanja Pembulatan Gaji PNS', code: '511119', type: 'account_item', badge: 'Operasional', badgeVariant: 'slate', amount: 45000000 },
                { id: 'acc-511129', label: 'Belanja Uang Makan PNS', code: '511129', type: 'account_item', badge: 'Operasional', badgeVariant: 'emerald', amount: 340000000 },
              ],
            },
            {
              id: 'acc-5121',
              label: '5121 - Belanja Pegawai Non-PNS / Tendik Kontrak',
              code: '5121',
              type: 'account_subgroup',
              children: [
                { id: 'acc-512111', label: 'Belanja Honorarium Tendik Kontrak PTNBH', code: '512111', type: 'account_item', badge: 'Kontrak', badgeVariant: 'amber', amount: 620000000 },
              ],
            },
          ],
        },
        {
          id: 'acc-52',
          label: '52 - Belanja Barang dan Jasa',
          code: '52',
          type: 'account_subgroup',
          badge: 'Kelompok',
          badgeVariant: 'slate',
          children: [
            {
              id: 'acc-5211',
              label: '5211 - Belanja Barang Operasional Perkantoran',
              code: '5211',
              type: 'account_subgroup',
              children: [
                { id: 'acc-521111', label: 'Belanja Keperluan Sehari-hari Perkantoran / ATK', code: '521111', type: 'account_item', badge: 'Rutin', badgeVariant: 'emerald', amount: 280000000 },
                { id: 'acc-521115', label: 'Belanja Daya dan Jasa (Langganan Listrik & PDAM)', code: '521115', type: 'account_item', badge: 'Utilitas', badgeVariant: 'blue', amount: 890000000 },
              ],
            },
            {
              id: 'acc-5212',
              label: '5212 - Belanja Bahan Praktikum & Penunjang Akademik',
              code: '5212',
              type: 'account_subgroup',
              children: [
                { id: 'acc-521211', label: 'Belanja Bahan Praktikum & Reagen Kimia Laboratorium', code: '521211', type: 'account_item', badge: 'Akademik', badgeVariant: 'emerald', amount: 450000000 },
                { id: 'acc-521213', label: 'Belanja Honorarium Output Narasumber Seminar', code: '521213', type: 'account_item', badge: 'Honor', badgeVariant: 'amber', amount: 175000000 },
              ],
            },
            {
              id: 'acc-5241',
              label: '5241 - Belanja Perjalanan Dinas Jabatan',
              code: '5241',
              type: 'account_subgroup',
              children: [
                { id: 'acc-524111', label: 'Belanja Perjalanan Dinas Biasa Dalam Daerah', code: '524111', type: 'account_item', badge: 'Dinas', badgeVariant: 'slate', amount: 95000000 },
                { id: 'acc-524113', label: 'Belanja Perjalanan Dinas Luar Daerah / Konsorsium', code: '524113', type: 'account_item', badge: 'Dinas', badgeVariant: 'amber', amount: 210000000 },
              ],
            },
          ],
        },
        {
          id: 'acc-53',
          label: '53 - Belanja Modal',
          code: '53',
          type: 'account_subgroup',
          badge: 'Investasi',
          badgeVariant: 'amber',
          children: [
            {
              id: 'acc-5321',
              label: '5321 - Belanja Modal Peralatan dan Mesin',
              code: '5321',
              type: 'account_subgroup',
              children: [
                { id: 'acc-532111', label: 'Pengadaan Alat Spektrofotometer Riset Terpadu', code: '532111', type: 'account_item', badge: 'Aset', badgeVariant: 'rose', amount: 1650000000 },
                { id: 'acc-532114', label: 'Pengadaan Server Komputasi Kinerja Tinggi (HPC)', code: '532114', type: 'account_item', badge: 'Aset TI', badgeVariant: 'blue', amount: 980000000 },
              ],
            },
          ],
        },
      ],
    },
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

      {/* Interactive Document / PDF Viewer Modal */}
      <DocumentViewerModal
        isOpen={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        title="SK_Rektor_Penetapan_Pagu_2026.pdf"
        fileSize="2.4 MB"
        uploadedAt="25 Sep 2026, 14:15 WIB"
        uploader="Direktorat Keuangan UGM"
        status="disetujui"
      />

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
            { id: 'cards', num: '03', label: 'Template Card & Tree', desc: 'KPI 4-Kolom & Pohon Hierarki', icon: Layout },
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
      {/* TAB 3: TEMPLATE CARD & TREE VIEW (FORMAT BAKU REVIEW-ANGGARAN & GOV-MAPPING) */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-6">
          {/* BAGIAN A: 4 MODERN KPI SUMMARY CARDS */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase">
                    Standar Baku
                  </span>
                  <h2 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-wider">
                    4 Modern KPI Summary Cards (Standar Unit Kerja & Gov-Mapping)
                  </h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Format baku kartu ringkasan eksekutif 4-kolom seperti di modul <code>/review-anggaran/unit-kerja</code> dan <code>/gov-mapping</code> (Pemetaan PIC). Klik kartu untuk simulasi filter aktif (garis tepi menyala).
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">\n  {/* CARD 1: TOTAL */}\n  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">\n    <div className="flex items-start justify-between">\n      <div>\n        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">TOTAL ANGGARAN USULAN</span>\n        <div className="text-xl font-black text-gray-900 font-mono tracking-tight">\n          Rp 48.250.000.000\n        </div>\n      </div>\n      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">\n        <Layers size={18} />\n      </div>\n    </div>\n    <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">\n      <span>142 Usulan Item</span>\n      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Semua Unit</span>\n    </div>\n  </div>\n</div>`,
                    'kpi-card'
                  )
                }
                className="h-8 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                {copiedCode === 'kpi-card' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'kpi-card' ? 'Tersalin!' : 'Salin Kode Card'}</span>
              </button>
            </div>

            {/* 4 Modern KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'total_anggaran',
                  title: 'TOTAL ANGGARAN USULAN',
                  titleColor: 'text-gray-400 dark:text-slate-400',
                  value: 'Rp 48.250.000.000',
                  valueUnit: '',
                  valueColor: 'text-gray-900 dark:text-slate-100',
                  icon: Layers,
                  iconBox: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60',
                  footerLeft: '142 Usulan Item',
                  footerBadge: 'Semua Unit',
                  footerBadgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400',
                  footerBorder: 'border-gray-100 dark:border-slate-800',
                  footerTextColor: 'text-gray-500 dark:text-slate-400',
                  activeRing: 'ring-2 ring-indigo-600 border-indigo-500 dark:border-indigo-500 bg-indigo-50/15',
                },
                {
                  id: 'terkunci_status',
                  title: 'TERKUNCI STATUS (WAJIB)',
                  titleColor: 'text-emerald-600 dark:text-emerald-400',
                  value: 'Rp 31.800.000.000',
                  valueUnit: '',
                  valueColor: 'text-emerald-700 dark:text-emerald-400',
                  icon: ShieldCheck,
                  iconBox: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/60',
                  footerLeft: '98 Item Terkunci',
                  footerBadge: '65.8% Pagu',
                  footerBadgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300',
                  footerBorder: 'border-emerald-100/60 dark:border-emerald-900/40',
                  footerTextColor: 'text-emerald-700 dark:text-emerald-400',
                  activeRing: 'ring-2 ring-emerald-600 border-emerald-500 dark:border-emerald-500 bg-emerald-50/15',
                },
                {
                  id: 'pagu_bebas',
                  title: 'PAGU BEBAS (TANPA STATUS)',
                  titleColor: 'text-amber-600 dark:text-amber-400',
                  value: 'Rp 16.450.000.000',
                  valueUnit: '',
                  valueColor: 'text-amber-700 dark:text-amber-400',
                  icon: Database,
                  iconBox: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/60',
                  footerLeft: '44 Item Bebas',
                  footerBadge: '34.2% Pagu',
                  footerBadgeClass: 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300',
                  footerBorder: 'border-amber-100/60 dark:border-amber-900/40',
                  footerTextColor: 'text-amber-700 dark:text-amber-400',
                  activeRing: 'ring-2 ring-amber-500 border-amber-500 dark:border-amber-500 bg-amber-50/15',
                },
                {
                  id: 'pemetaan_coverage',
                  title: 'SUMBER ATURAN & PIC',
                  titleColor: 'text-purple-600 dark:text-purple-400',
                  value: '82 Rule',
                  valueUnit: '| 16 AI',
                  valueColor: 'text-purple-700 dark:text-purple-300',
                  icon: LinkIcon,
                  iconBox: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/60',
                  footerLeft: 'Coverage Penguncian',
                  footerBadge: '69.0%',
                  footerBadgeClass: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300',
                  footerBorder: 'border-purple-100/60 dark:border-purple-900/40',
                  footerTextColor: 'text-purple-700 dark:text-purple-400',
                  activeRing: 'ring-2 ring-purple-500 border-purple-500 dark:border-purple-500 bg-purple-50/15',
                },
              ].map((card) => {
                const Icon = card.icon;
                const isSelected = selectedCardId === card.id;

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 cursor-pointer relative select-none flex flex-col justify-between shadow-xs ${
                      isSelected
                        ? `${card.activeRing} shadow-md scale-[1.01]`
                        : 'border-gray-200/80 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase flex items-center gap-0.5 shadow-2xs">
                        <Check size={9} strokeWidth={3} />
                        <span>Filter Aktif</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="pr-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${card.titleColor}`}>
                          {card.title}
                        </span>
                        <div className={`text-xl font-black font-mono tracking-tight flex items-baseline gap-1.5 ${card.valueColor}`}>
                          {card.value}
                          {card.valueUnit && (
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                              {card.valueUnit}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl shrink-0 ${card.iconBox}`}>
                        <Icon size={18} />
                      </div>
                    </div>

                    <div className={`mt-3 text-xs font-bold flex items-center justify-between border-t pt-2 ${card.footerBorder} ${card.footerTextColor}`}>
                      <span>{card.footerLeft}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${card.footerBadgeClass}`}>
                        {card.footerBadge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BAGIAN B: TEMPLATE POHON HIERARKIS (TREE VIEW COMPONENT) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                    Komponen Baru
                  </span>
                  <h2 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <FolderTree size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Template Struktur Pohon Hierarkis (Hierarchical Tree View)
                  </h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Komponen pohon bertingkat untuk struktur hierarki Unit Kerja UGM (Pusat ➔ Fakultas ➔ Departemen ➔ Lab) dan hierarki Bagan Akun Standar (BAS). Mendukung pencarian, expand/collapse, dan seleksi node aktif.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `import TreeView, { TreeNodeItem } from '@/components/shared/TreeView';\n\n// Gunakan TreeView di halaman Anda:\n<TreeView\n  data={treeData}\n  selectedId={selectedId}\n  onSelect={(node) => console.log('Node terpilih:', node)}\n  defaultExpandedIds={['ugm-root', 'kptu', 'agro']}\n  searchable={true}\n  showExpandCollapseAll={true}\n/>`,
                    'tree-view-code'
                  )
                }
                className="h-8 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
              >
                {copiedCode === 'tree-view-code' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'tree-view-code' ? 'Tersalin!' : 'Salin Kode TreeView'}</span>
              </button>
            </div>

            {/* Tree Type Selector Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTreeTab('unit');
                  setSelectedTreeNode(sampleUnitTreeData[0]?.children?.[1]?.children?.[0] || sampleUnitTreeData[0]);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  treeTab === 'unit'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                }`}
              >
                <Building2 size={14} />
                <span>Pohon Struktur Unit Kerja UGM</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTreeTab('akun');
                  setSelectedTreeNode(sampleAccountTreeData[0]?.children?.[0]?.children?.[0]?.children?.[0] || sampleAccountTreeData[0]);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  treeTab === 'akun'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                }`}
              >
                <FolderTree size={14} />
                <span>Pohon Bagan Akun Standar (BAS 2026)</span>
              </button>
            </div>

            {/* 2-Column Layout: Left = TreeView, Right = Active Node Detail Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Kolom Kiri: TreeView */}
              <div className="lg:col-span-7">
                <TreeView
                  data={treeTab === 'unit' ? sampleUnitTreeData : sampleAccountTreeData}
                  selectedId={selectedTreeNode?.id}
                  onSelect={(node) => setSelectedTreeNode(node)}
                  defaultExpandedIds={['ugm-root', 'kptu', 'agro', 'acc-5', 'acc-51', 'acc-52']}
                  searchable={true}
                  showExpandCollapseAll={true}
                />
              </div>

              {/* Kolom Kanan: Detail Node Inspector */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-200/80 dark:border-slate-700">
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Tag size={13} className="text-blue-600" />
                        Detail Node Terpilih (Inspector)
                      </span>
                      {selectedTreeNode?.badge && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {selectedTreeNode.badge}
                        </span>
                      )}
                    </div>

                    {selectedTreeNode ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 block">
                            Nama Elemen
                          </span>
                          <h3 className="text-base font-black text-gray-900 dark:text-slate-100 tracking-tight">
                            {selectedTreeNode.label}
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Kode Unik</span>
                            <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-xs">
                              {selectedTreeNode.code || '-'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Tipe Node</span>
                            <span className="font-semibold text-gray-700 dark:text-slate-300 text-xs capitalize">
                              {selectedTreeNode.type || 'Sub-Item'}
                            </span>
                          </div>
                        </div>

                        {selectedTreeNode.amount !== undefined && (
                          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50">
                            <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block mb-0.5">
                              Estimasi Alokasi Pagu
                            </span>
                            <div className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-300 tracking-tight">
                              Rp {new Intl.NumberFormat('id-ID').format(selectedTreeNode.amount)}
                            </div>
                          </div>
                        )}

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 space-y-1.5 text-xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block">Status Cabang</span>
                          <p className="text-gray-600 dark:text-slate-300">
                            {selectedTreeNode.children && selectedTreeNode.children.length > 0 ? (
                              <span>Memiliki <strong>{selectedTreeNode.children.length} sub-item/cabang</strong> di bawahnya.</span>
                            ) : (
                              <span>Merupakan <strong>node level akhir (terminal node)</strong> yang dapat langsung dipilih untuk penganggaran/transaksi.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-gray-400">
                        Klik salah satu node pada pohon di samping untuk melihat rincian datanya.
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-200/70 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                      ID: {selectedTreeNode?.id || '-'}
                    </span>
                    <PrimaryButton
                      onClick={() =>
                        triggerToast(
                          'success',
                          'Node Dipilih',
                          `${selectedTreeNode?.label} (${selectedTreeNode?.code || 'ID: ' + selectedTreeNode?.id}) terpilih untuk pemrosesan.`
                        )
                      }
                    >
                      Gunakan Node Ini
                    </PrimaryButton>
                  </div>
                </div>
              </div>
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

            {/* Gaya 4: Master Suite 4-Column Grid Tabs (Baru) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Gaya 4: Master Suite 4-Column Navigation Card (Dipakai di Master Unit & PIC Suite)
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Resmi: /gov-units, /gov-pics, /gov-mapping, /units
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { id: 'gov-units', title: 'Master Unit Kerja & PIC', badge: 'Organisasi & PIC', icon: Building2, active: false },
                  { id: 'gov-pics', title: 'Master PIC & Email', badge: 'PIC & Kontak', icon: Users, active: true },
                  { id: 'gov-mapping', title: 'Pemetaan PIC -> Unit', badge: 'Mapping', icon: LinkIcon, active: false },
                  { id: 'units', title: 'Tabel Unit Dasar (DB)', badge: 'Ref DB', icon: Database, active: false },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs select-none border min-h-[46px] transition-all ${
                        item.active
                          ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 ring-1 ring-blue-500/40 scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200/90'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        item.active ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col items-start min-w-0 pr-1 gap-0.5">
                        <span className="line-clamp-1 font-bold tracking-tight text-[12px] leading-tight">
                          {item.title}
                        </span>
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider leading-none ${
                          item.active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gaya 5: Tambah Pagu & Mutasi Suite 6-Column Grid Tabs (Baru) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Gaya 5: Tambah Pagu & Mutasi Suite (6-Column Navigation Card)
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Resmi: /tambah-pagu, /tambah, /komparasi, /analisis, /potret-mutasi-pagu, /copas-pagu
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: 'daftar', title: 'Daftar Usulan', badge: 'Monitoring', icon: Layout, active: true },
                  { id: 'tambah', title: 'Input Pagu Baru', badge: 'Form Usulan', icon: PlusCircle, active: false },
                  { id: 'komparasi', title: 'Komparasi Versi', badge: 'Audit Versi', icon: Scale, active: false },
                  { id: 'analisis', title: 'Analisis Pagu', badge: 'Global Pagu', icon: FileSpreadsheet, active: false },
                  { id: 'potret', title: 'Potret Mutasi', badge: 'Mutasi Pagu', icon: PieChart, active: false },
                  { id: 'copas', title: 'Copas Pagu', badge: 'Copas Zone', icon: ClipboardPaste, active: false },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs select-none border min-h-[46px] transition-all ${
                        item.active
                          ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 ring-1 ring-blue-500/40 scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200/90'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        item.active ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col items-start min-w-0 pr-1 gap-0.5">
                        <span className="line-clamp-1 font-bold tracking-tight text-[12px] leading-tight">
                          {item.title}
                        </span>
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider leading-none ${
                          item.active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
              {/* Quick Filter Chips Baku */}
              <div className="pb-1">
                <QuickFilterChips
                  chips={[
                    { id: 'all', label: 'Semua Rekaman', count: 48 },
                    { id: 'pending', label: 'Perlu Review Saya', count: 12 },
                    { id: 'high', label: 'Pagu > 1 Milyar', count: 8 },
                    { id: 'low-balance', label: 'Saldo Menipis (<10%)', count: 5 },
                    { id: 'approved', label: 'Disetujui', count: 23 },
                  ]}
                  selectedChipId={selectedQuickChip}
                  onSelect={setSelectedQuickChip}
                />
              </div>

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

          {/* 7. Pratinjau Dokumen / PDF In-App (DocumentViewerModal) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  7. Pratinjau Dokumen / PDF In-App (DocumentViewerModal)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Memeriksa lampiran SK Rektor, Nota Dinas, atau bukti kwitansi langsung di browser tanpa perlu mendownload file lokal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`<DocumentViewerModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="SK_Rektor_Penetapan_Pagu_2026.pdf"
  fileSize="2.4 MB"
  uploader="Direktorat Keuangan UGM"
  status="disetujui"
/>`, 'doc-viewer-code')}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedCode === 'doc-viewer-code' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                {copiedCode === 'doc-viewer-code' ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-100 text-rose-700">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">
                    SK_Rektor_Penetapan_Pagu_2026.pdf
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Dilengkapi kontrol Zoom In/Out, Putar 90°, Unduh, Cetak, dan Pratinjau Resolusi Tinggi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDocViewerOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ZoomIn size={14} /> Buka Pratinjau Dokumen
              </button>
            </div>
          </div>

          {/* 8. Alur Tahapan Verifikasi & Persetujuan (Workflow Stepper) */}
          <div className="space-y-2">
            <VerificationStepper
              currentStepIndex={activeStepIdx}
              onStepClick={(step, idx) => {
                setActiveStepIdx(idx);
                triggerToast('info', `Tahap ${idx + 1}: ${step.title}`, `Status: ${step.status.toUpperCase()} • Penanggung Jawab: ${step.role}`);
              }}
            />
            <div className="flex justify-end pr-2">
              <button
                type="button"
                onClick={() => handleCopy(`<VerificationStepper
  currentStepIndex={2}
  onStepClick={(step, index) => console.log(step)}
/>`, 'stepper-code')}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                {copiedCode === 'stepper-code' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                {copiedCode === 'stepper-code' ? 'Tersalin' : 'Salin Sintaks Stepper'}
              </button>
            </div>
          </div>

          {/* 9. Mode Gelap & Pencarian Cepat Global */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Mode Gelap / Terang (ThemeToggle)</span>
                <ThemeToggle />
              </div>
              <p className="text-[11px] text-gray-500">
                Peralihan tema instan yang tersimpan di browser untuk kenyamanan mata pengguna saat lembur malam hari.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">Pencarian Cepat (Ctrl + K)</span>
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 rounded border border-slate-300">
                  Ctrl + K
                </kbd>
              </div>
              <p className="text-[11px] text-gray-500">
                Tekan <code className="font-bold text-blue-600">Ctrl + K</code> di keyboard untuk mencari menu, unit kerja, atau unduh format Excel dalam 1 detik.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
