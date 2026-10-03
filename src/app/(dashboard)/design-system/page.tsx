'use client';

import React, { useState, useMemo } from 'react';
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
  X,
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
  Strikethrough,
  Code,
  Quote,
  Highlighter,
  Minus,
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
  ArrowUpRight,
  ExternalLink,
  ArrowDownRight,
  Activity,
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
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TablePagination from '@/components/shared/TablePagination';
import ExportButtons from '@/components/shared/ExportButtons';
import StatusBadge from '@/components/shared/StatusBadge';
import StatCard from '@/components/shared/StatCard';
import MultiSelectFilter from '@/components/shared/MultiSelectFilter';
import AutocompleteCombobox from '@/components/shared/AutocompleteCombobox';
import DateRangePicker, { DateRange } from '@/components/shared/DateRangePicker';
import MonthRangePicker, { MonthRange } from '@/components/shared/MonthRangePicker';
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
import GalleryLightbox, { GalleryItem } from '@/components/shared/GalleryLightbox';
import { 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton, 
  TableActionButton,
  TableActionGroup 
} from '@/components/shared/ActionButtons';

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<
    'forms' | 'typography' | 'cards' | 'charts' | 'tab-styles' | 'editor' | 'colors' | 'table' | 'modals'
  >('forms');

  // Interactive Gallery Lightbox Demo State
  const [isDemoGalleryOpen, setIsDemoGalleryOpen] = useState(false);
  const [demoGalleryIndex, setDemoGalleryIndex] = useState(0);
  const sampleGalleryItems: GalleryItem[] = [
    {
      src: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
      original: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
      label: 'Kuitansi & Bukti Pembayaran No. TRF-2026-001 (Bukti Transfer Vendor Konsumsi)'
    },
    {
      src: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
      original: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
      label: 'Faktur Pajak & Invoice Pengadaan Alat Tulis (PPh 22 & Rincian Belanja)'
    },
    {
      src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      original: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      label: 'Nota Rekapitulasi & Surat Perintah Bayar (Otorisasi Pencairan Bendahara)'
    }
  ];

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
  const [demoSearchKeyword, setDemoSearchKeyword] = useState<string>('');
  const [autocompleteUnit, setAutocompleteUnit] = useState<string>('3');
  const [singleStatus, setSingleStatus] = useState<string>('approved');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['1', '3']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['approved', 'pending']);

  // Poin 2A: Filter Rentang Tanggal Laporan (Tanpa Jam)
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange>({
    startDate: '2026-09-01',
    endDate: '2026-09-30'
  });

  // Poin 2A: Filter Rentang Bulan Laporan (Tanpa Menampilkan Tanggal)
  const [monthRangeFilter, setMonthRangeFilter] = useState<MonthRange>({
    startMonth: '2026-03',
    endMonth: '2026-10',
    startDate: '2026-03-01',
    endDate: '2026-10-31',
  });

  // Poin 2B: Input Tanggal & Jam Data Transaksi (Form Input Data, Bukan Filter)
  const [formDate, setFormDate] = useState<string>('2026-10-01');
  const [formStartTime, setFormStartTime] = useState<string>('08:30');
  const [formEndTime, setFormEndTime] = useState<string>('16:00');
  const [dateTimeVal, setDateTimeVal] = useState<string>('2026-10-01T08:30');
  const [singleDate, setSingleDate] = useState<string>('2026-10-01');

  // Poin 3 (Baru): Typography Tester State
  const [sampleTesterText, setSampleTesterText] = useState<string>('Universitas Gadjah Mada - Sistem Verifikasi Anggaran Terpadu');
  const [testerSize, setTesterSize] = useState<string>('text-lg');
  const [testerWeight, setTesterWeight] = useState<string>('font-bold');

  // Upload Textbox & Camera & Direct Upload
  const [uploadTextPath, setUploadTextPath] = useState<string>('SK_Rektor_Penetapan_Pagu_2026.pdf');
  const [directUploadPath, setDirectUploadPath] = useState<string>('Surat_Pengantar_Dekan_2026.pdf');
  const [isDirectUploading, setIsDirectUploading] = useState<boolean>(false);
  const [directUploadProgress, setDirectUploadProgress] = useState<number>(0);
  const [directUploadSuccess, setDirectUploadSuccess] = useState<boolean>(false);

  // Paste Zone Demo State & Parsed Data (Standar 8 Kolom: [1] ID DB, [2] Nama Unit, [3] Tahun, [4] Nominal, [5] Sumber Dana, [6] Keterangan, [7] Status Pagu, [8] Jenis Anggaran)
  const [demoPasteText, setDemoPasteText] = useState<string>('');
  const sampleTSVRows = `101\tFakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan\t2026\t1850000000\tBOPTN\tOperasional Lab Biomedis & Riset Terpadu\tDisetujui\tBelanja Barang
102\tFakultas Teknik\t2026\t2450000000\tRKAT-UGM\tPemeliharaan Fasilitas Laboratorium Terpadu\tDisetujui\tBelanja Modal
103\tDirektorat Sistem & Sumber Daya Informasi (DSSDI)\t2026\t950000000\tAPBN\tUpgrade Infrastruktur Jaringan & Server Kampus\tUsulan\tBelanja Modal
104\tPerpustakaan Pusat UGM\t2026\t620000000\tPNBP\tLangganan Basis Data Jurnal Ilmiah Internasional\tDisetujui\tOperasional`;

  const parsedPasteRows = useMemo(() => {
    if (!demoPasteText.trim()) return [];
    const lines = demoPasteText.split(/\r?\n/).filter(line => line.trim().length > 0);
    return lines.map((line, idx) => {
      const parts = line.split('\t').map(p => p.trim());
      const isHeader = idx === 0 && (
        parts[0]?.toLowerCase().includes('id') || 
        parts[0]?.toLowerCase().includes('[1]') ||
        parts[1]?.toLowerCase().includes('unit') || 
        parts[1]?.toLowerCase().includes('nama') ||
        parts[2]?.toLowerCase().includes('tahun')
      );
      if (isHeader) return null;

      const idDb = parts[0] || `auto-${idx + 1}`;
      const namaUnit = parts[1] || '';
      const tahun = parts[2] || '2026';
      const rawNominal = (parts[3] || '0').replace(/[^0-9.-]+/g, '');
      const nominal = parseFloat(rawNominal) || 0;
      const sumberDana = parts[4] || 'BOPTN';
      const keterangan = parts[5] || '-';
      const statusPagu = parts[6] || 'Disetujui';
      const jenisAnggaran = parts[7] || 'Operasional';

      const isValid = Boolean(namaUnit && tahun && nominal > 0);
      const issues = !namaUnit ? 'Nama Unit kosong' : !tahun ? 'Tahun kosong' : nominal <= 0 ? 'Nominal harus > 0' : null;

      return {
        id: `row-${idx}`,
        lineNum: idx + 1,
        idDb,
        namaUnit,
        tahun,
        nominal,
        sumberDana,
        keterangan,
        statusPagu,
        jenisAnggaran,
        isValid,
        issues
      };
    }).filter(Boolean) as Array<{
      id: string;
      lineNum: number;
      idDb: string;
      namaUnit: string;
      tahun: string;
      nominal: number;
      sumberDana: string;
      keterangan: string;
      statusPagu: string;
      jenisAnggaran: string;
      isValid: boolean;
      issues: string | null;
    }>;
  }, [demoPasteText]);

  // Interactive Charts Demo State
  const [chartYear, setChartYear] = useState<'2026' | '2025' | '2024'>('2026');
  const [chartUnitFilter, setChartUnitFilter] = useState<'all' | 'fakultas' | 'pusat'>('all');
  const [chartMetricType, setChartMetricType] = useState<'nominal' | 'percent'>('nominal');
  const [chartGaugeVal, setChartGaugeVal] = useState<number>(78.5);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number>(0);
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [showPaguBar, setShowPaguBar] = useState<boolean>(true);
  const [showRealisasiBar, setShowRealisasiBar] = useState<boolean>(true);
  const [barHoveredIndex, setBarHoveredIndex] = useState<number | null>(null);
  const [sortRankingAsc, setSortRankingAsc] = useState<boolean>(false);

  // Data Koleksi Grafik Interaktif
  const chartUnitData = useMemo(() => {
    const mult = chartYear === '2026' ? 1.0 : chartYear === '2025' ? 0.88 : 0.74;
    const base = [
      { unit: 'Fakultas Biologi', type: 'fakultas', pagu: Math.round(1250 * mult), real: Math.round(1050 * mult), target: 84 },
      { unit: 'Fakultas Teknik', type: 'fakultas', pagu: Math.round(2800 * mult), real: Math.round(2350 * mult), target: 83.9 },
      { unit: 'Direktorat Keuangan', type: 'pusat', pagu: Math.round(950 * mult), real: Math.round(840 * mult), target: 88.4 },
      { unit: 'Fakultas Kedokteran', type: 'fakultas', pagu: Math.round(2100 * mult), real: Math.round(1800 * mult), target: 85.7 },
      { unit: 'Direktorat Perencanaan', type: 'pusat', pagu: Math.round(750 * mult), real: Math.round(560 * mult), target: 74.6 },
      { unit: 'Sekolah Vokasi', type: 'fakultas', pagu: Math.round(1450 * mult), real: Math.round(1210 * mult), target: 83.4 },
    ];
    if (chartUnitFilter === 'fakultas') return base.filter(b => b.type === 'fakultas');
    if (chartUnitFilter === 'pusat') return base.filter(b => b.type === 'pusat');
    return base;
  }, [chartYear, chartUnitFilter]);

  const monthlyTrendData = useMemo(() => {
    const mult = chartYear === '2026' ? 1.0 : chartYear === '2025' ? 0.9 : 0.75;
    return [
      { m: 'Jan', target: Math.round(1.5 * mult * 10) / 10, actual: Math.round(1.4 * mult * 10) / 10 },
      { m: 'Feb', target: Math.round(2.8 * mult * 10) / 10, actual: Math.round(2.6 * mult * 10) / 10 },
      { m: 'Mar', target: Math.round(4.2 * mult * 10) / 10, actual: Math.round(4.1 * mult * 10) / 10 },
      { m: 'Apr', target: Math.round(5.8 * mult * 10) / 10, actual: Math.round(5.5 * mult * 10) / 10 },
      { m: 'Mei', target: Math.round(7.2 * mult * 10) / 10, actual: Math.round(6.9 * mult * 10) / 10 },
      { m: 'Jun', target: Math.round(8.9 * mult * 10) / 10, actual: Math.round(8.7 * mult * 10) / 10 },
      { m: 'Jul', target: Math.round(10.5 * mult * 10) / 10, actual: Math.round(10.1 * mult * 10) / 10 },
      { m: 'Agu', target: Math.round(12.3 * mult * 10) / 10, actual: Math.round(11.8 * mult * 10) / 10 },
      { m: 'Sep', target: Math.round(14.0 * mult * 10) / 10, actual: Math.round(13.6 * mult * 10) / 10 },
      { m: 'Okt', target: Math.round(15.8 * mult * 10) / 10, actual: Math.round(14.9 * mult * 10) / 10 },
      { m: 'Nov', target: Math.round(17.5 * mult * 10) / 10, actual: Math.round(16.5 * mult * 10) / 10 },
      { m: 'Des', target: Math.round(19.2 * mult * 10) / 10, actual: Math.round(18.4 * mult * 10) / 10 },
    ];
  }, [chartYear]);

  const donutCategories = [
    { label: 'Belanja Pegawai (51)', percent: 42, nominal: 'Rp 52,5 M', color: 'bg-blue-600', stroke: '#2563eb', desc: 'Gaji, tunjangan fungsional & honor dosen/tendik' },
    { label: 'Belanja Barang & Jasa (52)', percent: 33, nominal: 'Rp 41,2 M', color: 'bg-emerald-500', stroke: '#10b981', desc: 'Operasional, utilitas, ATK, & pemeliharaan' },
    { label: 'Belanja Modal & Alat (53)', percent: 18, nominal: 'Rp 22,5 M', color: 'bg-purple-600', stroke: '#9333ea', desc: 'Pengadaan peralatan lab, server TI, & fisik' },
    { label: 'Hibah Riset & Pengabdian', percent: 7, nominal: 'Rp 8,8 M', color: 'bg-amber-500', stroke: '#f59e0b', desc: 'Dana riset dosen, inovasi, & publikasi' },
  ];

  const waterfallData = [
    { label: 'Pagu Awal SK', amount: 100.0, type: 'base', desc: 'SK Rektor penetapan pagu indikatif 2026' },
    { label: 'Usulan Tambahan', amount: 18.5, type: 'positive', desc: 'Pengajuan tambahan praktikum & akreditasi' },
    { label: 'Efisiensi Penghematan', amount: -6.2, type: 'negative', desc: 'Penyisiran belanja konsumsi & perjalanan' },
    { label: 'Pergeseran Antar Akun', amount: 2.1, type: 'positive', desc: 'Realokasi dana cadangan operasional' },
    { label: 'Pagu Final Berjalan', amount: 114.4, type: 'total', desc: 'Total pagu definitif aktif yang disahkan' },
  ];

  const rankingData = useMemo(() => {
    const list = [
      { rank: 1, unit: 'Fakultas Biologi', percent: 92.4, status: 'Optimal', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { rank: 2, unit: 'Direktorat Keuangan', percent: 89.1, status: 'Optimal', statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { rank: 3, unit: 'Fakultas Kedokteran', percent: 85.7, status: 'Baik', statusColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { rank: 4, unit: 'Fakultas Teknik', percent: 83.9, status: 'Baik', statusColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { rank: 5, unit: 'Sekolah Vokasi', percent: 81.2, status: 'Baik', statusColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { rank: 6, unit: 'Direktorat Perencanaan', percent: 74.6, status: 'Perlu Dorongan', statusColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    ];
    return sortRankingAsc ? [...list].reverse() : list;
  }, [sortRankingAsc]);

  const heatmapMatrix = [
    { cluster: 'Klaster Agro (Pertanian, Kehutanan, Peternakan)', q1: 78, q2: 85, q3: 91, q4: 95 },
    { cluster: 'Klaster Sains & Teknologi (Teknik, MIPA, Geografi)', q1: 72, q2: 81, q3: 88, q4: 93 },
    { cluster: 'Klaster Medika (FK-KMK, FKG, Farmasi)', q1: 82, q2: 89, q3: 93, q4: 97 },
    { cluster: 'Klaster Sosial Humaniora (FEB, Hukum, Fisipol)', q1: 75, q2: 83, q3: 87, q4: 92 },
    { cluster: 'Sekolah Pascasarjana & Vokasi', q1: 70, q2: 79, q3: 85, q4: 90 },
  ];

  // Card Selection (Colored Border Ring)
  const [selectedCardId, setSelectedCardId] = useState<string>('pagu');

  // Tab Styles Demo
  const [demoPillTab, setDemoPillTab] = useState<string>('tab1');
  const [demoUnderlineTab, setDemoUnderlineTab] = useState<string>('all');
  const [demoSegmentedTab, setDemoSegmentedTab] = useState<string>('monthly');

  // Editor Demo State
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [activeAvatarShape, setActiveAvatarShape] = useState<'circle' | 'square'>('circle');
  const [showLightboxModal, setShowLightboxModal] = useState<boolean>(false);
  const [lightboxImageTitle, setLightboxImageTitle] = useState<string>('Bukti Kuitansi & Faktur Pajak Belanja');
  const [editorContent, setEditorContent] = useState<string>(
    `Yth. Pimpinan Unit Kerja di Lingkungan Universitas Gadjah Mada,

Bersama ini kami sampaikan petunjuk teknis penyesuaian usulan pagu anggaran & realisasi belanja semester berjalan:

• Seluruh transaksi belanja wajib mencantumkan kode MAK (Mata Anggaran Kegiatan) yang valid.
• Pembayaran di atas Rp 50.000.000,- wajib melampirkan berkas SPK dan berita acara serah terima (BAST).
• Pengajuan verifikasi SPJ selambat-lambatnya diajukan pada tanggal 25 setiap bulannya.

Daftar Rincian Akun & Alokasi Pagu Kegiatan:
| Kode MAK | Uraian Kegiatan / Belanja | Pagu (Rp) | Realisasi (Rp) | Status |
| 521211 | Bahan Kimia Praktikum & Reagen | 450.000.000 | 310.000.000 | Disetujui |
| 521213 | Honor Narasumber Seminar & Reviewer | 180.000.000 | 120.000.000 | Proses |
| 532111 | Pengadaan Spektrofotometer Dual-Beam | 850.000.000 | 850.000.000 | Selesai |

Catatan Penting:
> "Pastikan semua bukti kuitansi bertanda tangan basah dan telah divalidasi oleh Pejabat Pembuat Komitmen (PPK)."

Atas perhatian dan kerja sama Bapak/Ibu, kami sampaikan terima kasih.`
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

  // Accordion Single Row & Group Row State & Sample Data
  const [expandedSingleRows, setExpandedSingleRows] = useState<Record<number, boolean>>({ 1: true });
  const [expandedGroupRows, setExpandedGroupRows] = useState<Record<string, boolean>>({ 'grp-ft': true });

  const sampleSingleAccordionData = [
    {
      id: 1,
      kode: '521211',
      nama: 'Belanja Bahan Kimia Praktikum & Reagen Laboratorium',
      unit: 'Fakultas Biologi',
      pagu: 450000000,
      realisasi: 310000000,
      status: 'disetujui',
      children: [
        { no: 'TRX-01', tanggal: '2026-02-15', uraian: 'Pengadaan Buffer & Enzim Taq Polymerase', vendor: 'PT Bio Farma Medica', nominal: 125000000, status: 'Lunas' },
        { no: 'TRX-02', tanggal: '2026-04-10', uraian: 'Reagen Kit Ekstraksi DNA/RNA Tanaman', vendor: 'CV Graha Science', nominal: 95000000, status: 'Lunas' },
        { no: 'TRX-03', tanggal: '2026-07-22', uraian: 'Bahan Habis Pakai Mikrobiologi & Cawan Petri', vendor: 'PT Labora Jaya', nominal: 90000000, status: 'Proses SPK' },
      ]
    },
    {
      id: 2,
      kode: '521213',
      nama: 'Honorarium Narasumber Seminar & Reviewer Paper',
      unit: 'Fakultas Teknik',
      pagu: 180000000,
      realisasi: 120000000,
      status: 'proses',
      children: [
        { no: 'TRX-04', tanggal: '2026-03-05', uraian: 'Honor Keynote Speaker Tokyo University (Prof. Tanaka)', vendor: 'Transfer Bank Valas', nominal: 60000000, status: 'Lunas' },
        { no: 'TRX-05', tanggal: '2026-03-06', uraian: 'Honor Moderator & Reviewer Paper Konferensi Nasional', vendor: 'Internal Dosen UGM', nominal: 60000000, status: 'Lunas' },
      ]
    },
    {
      id: 3,
      kode: '532111',
      nama: 'Pengadaan Alat Spektrofotometer UV-Vis Dual-Beam',
      unit: 'Direktorat Penelitian',
      pagu: 850000000,
      realisasi: 850000000,
      status: 'disetujui',
      children: [
        { no: 'TRX-06', tanggal: '2026-05-18', uraian: 'Unit Spektrofotometer Shimadzu UV-2600i Bergaransi', vendor: 'PT Duta Sarana Lab', nominal: 780000000, status: 'Lunas' },
        { no: 'TRX-07', tanggal: '2026-05-25', uraian: 'Instalasi, Uji Fungsi & Pelatihan Teknis Laboran', vendor: 'PT Duta Sarana Lab', nominal: 70000000, status: 'Lunas' },
      ]
    }
  ];

  const sampleGroupRowsData = [
    {
      groupId: 'grp-ft',
      groupName: 'Fakultas Teknik (FT)',
      cluster: 'Saintek',
      totalPagu: 1450000000,
      totalRealisasi: 980000000,
      status: 'proses',
      children: [
        { 
          id: 'ft-1', 
          kode: '040101', 
          nama: 'Departemen Teknik Sipil & Lingkungan', 
          pic: 'Dr. Ir. Budi W.', 
          pagu: 550000000, 
          realisasi: 390000000, 
          status: 'disetujui',
          grandChildren: [
            { id: 'ft-1-1', kode: '040101-LAB01', nama: 'Laboratorium Mekanika Tanah & Geoteknik', pic: 'Prof. Joko Sujono', pagu: 300000000, realisasi: 220000000, status: 'disetujui' },
            { id: 'ft-1-2', kode: '040101-LAB02', nama: 'Laboratorium Rekayasa Struktur & Bahan Bangunan', pic: 'Dr. Karlina', pagu: 250000000, realisasi: 170000000, status: 'disetujui' },
          ]
        },
        { 
          id: 'ft-2', 
          kode: '040201', 
          nama: 'Departemen Teknik Elektro & Teknologi Informasi', 
          pic: 'Prof. Dr. Ir. Sunarno', 
          pagu: 520000000, 
          realisasi: 380000000, 
          status: 'disetujui',
          grandChildren: [
            { id: 'ft-2-1', kode: '040201-LAB01', nama: 'Laboratorium Sistem Tenaga Listrik & Energi Terbarukan', pic: 'Dr. Suharyanto', pagu: 270000000, realisasi: 200000000, status: 'disetujui' },
            { id: 'ft-2-2', kode: '040201-LAB02', nama: 'Laboratorium Jaringan Komputer & Keamanan Siber', pic: 'Dr. Widyawan', pagu: 250000000, realisasi: 180000000, status: 'disetujui' },
          ]
        },
        { 
          id: 'ft-3', 
          kode: '040301', 
          nama: 'Departemen Teknik Mesin & Industri', 
          pic: 'Dr. Fauzun, S.T., M.T.', 
          pagu: 380000000, 
          realisasi: 210000000, 
          status: 'proses',
          grandChildren: [
            { id: 'ft-3-1', kode: '040301-LAB01', nama: 'Laboratorium Desain Manufaktur Presisi (CNC)', pic: 'Dr. Muslim Mahardika', pagu: 220000000, realisasi: 120000000, status: 'proses' },
            { id: 'ft-3-2', kode: '040301-LAB02', nama: 'Laboratorium Ergonomi & Sistem Industri', pic: 'Ir. Subagyo, Ph.D.', pagu: 160000000, realisasi: 90000000, status: 'disetujui' },
          ]
        },
      ]
    },
    {
      groupId: 'grp-fkkmk',
      groupName: 'Fakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan (FKKMK)',
      cluster: 'Kesehatan',
      totalPagu: 2100000000,
      totalRealisasi: 1850000000,
      status: 'disetujui',
      children: [
        { 
          id: 'med-1', 
          kode: '050101', 
          nama: 'Departemen Ilmu Kesehatan Anak', 
          pic: 'dr. Ida Safitri, Sp.A(K)', 
          pagu: 1100000000, 
          realisasi: 980000000, 
          status: 'disetujui',
          grandChildren: [
            { id: 'med-1-1', kode: '050101-DIV01', nama: 'Divisi Pediatri Gawat Darurat & Intensive Care (PICU)', pic: 'dr. Intan F., Sp.A', pagu: 600000000, realisasi: 550000000, status: 'disetujui' },
            { id: 'med-1-2', kode: '050101-DIV02', nama: 'Divisi Nutrisi & Penyakit Metabolik Anak', pic: 'dr. Titis P., Sp.A', pagu: 500000000, realisasi: 430000000, status: 'disetujui' },
          ]
        },
        { 
          id: 'med-2', 
          kode: '050201', 
          nama: 'Departemen Bedah & Bedah Saraf', 
          pic: 'dr. Rachmat Andi, Sp.B', 
          pagu: 1000000000, 
          realisasi: 870000000, 
          status: 'disetujui',
          grandChildren: [
            { id: 'med-2-1', kode: '050201-DIV01', nama: 'Divisi Bedah Digestif & Laparoskopi', pic: 'dr. Hendra W., Sp.B', pagu: 550000000, realisasi: 490000000, status: 'disetujui' },
            { id: 'med-2-2', kode: '050201-DIV02', nama: 'Divisi Bedah Saraf & Neurotrauma', pic: 'dr. Adi Santoso, Sp.BS', pagu: 450000000, realisasi: 380000000, status: 'disetujui' },
          ]
        },
      ]
    },
    {
      groupId: 'grp-ditkeu',
      groupName: 'Direktorat Keuangan',
      cluster: 'Kantor Pimpinan Universitas',
      totalPagu: 890000000,
      totalRealisasi: 420000000,
      status: 'revisi',
      children: [
        { 
          id: 'keu-1', 
          kode: '010802A', 
          nama: 'Subdirektorat Anggaran & Perbendaharaan', 
          pic: 'Drs. Hendro Wibowo', 
          pagu: 490000000, 
          realisasi: 260000000, 
          status: 'proses',
          grandChildren: [
            { id: 'keu-1-1', kode: '010802A-S01', nama: 'Seksi Perencanaan & Alokasi Pagu Anggaran', pic: 'Bagus S., M.Acc.', pagu: 250000000, realisasi: 140000000, status: 'disetujui' },
            { id: 'keu-1-2', kode: '010802A-S02', nama: 'Seksi Verifikasi SPJ & Kas Operasional', pic: 'Nurul H., S.E.', pagu: 240000000, realisasi: 120000000, status: 'proses' },
          ]
        },
        { 
          id: 'keu-2', 
          kode: '010802B', 
          nama: 'Subdirektorat Akuntansi & Pelaporan Keuangan', 
          pic: 'Sri Mulyani, S.E., M.Acc.', 
          pagu: 400000000, 
          realisasi: 160000000, 
          status: 'revisi',
          grandChildren: [
            { id: 'keu-2-1', kode: '010802B-S01', nama: 'Seksi Pembukuan & Rekonsiliasi Bank', pic: 'Wahyu P., S.Ak.', pagu: 210000000, realisasi: 90000000, status: 'proses' },
            { id: 'keu-2-2', kode: '010802B-S02', nama: 'Seksi Penyusunan Laporan Keuangan Tahunan', pic: 'Rina S., S.E.', pagu: 190000000, realisasi: 70000000, status: 'revisi' },
          ]
        },
      ]
    }
  ];

  const isAllSingleExpanded = sampleSingleAccordionData.every(r => !!expandedSingleRows[r.id]);
  const toggleAllSingleRows = () => {
    if (isAllSingleExpanded) {
      setExpandedSingleRows({});
    } else {
      const next: Record<number, boolean> = {};
      sampleSingleAccordionData.forEach(r => { next[r.id] = true; });
      setExpandedSingleRows(next);
    }
  };

  // State dan Logika Buka Tutup Perjenjang untuk Template 3 (Induk -> Anak -> Cucu)
  const [expandedGroupSubRows, setExpandedGroupSubRows] = useState<Record<string, boolean>>({ 'ft-1': true });
  const [groupRowsMode, setGroupRowsMode] = useState<'expanding' | 'collapsing'>('expanding');

  const setGroupRowsTo = (level: 1 | 2 | 3) => {
    if (level === 1) {
      setExpandedGroupRows({});
      setExpandedGroupSubRows({});
      setGroupRowsMode('expanding');
    } else if (level === 2) {
      const nextGroup: Record<string, boolean> = {};
      sampleGroupRowsData.forEach(g => { nextGroup[g.groupId] = true; });
      setExpandedGroupRows(nextGroup);
      setExpandedGroupSubRows({});
      setGroupRowsMode('expanding');
    } else if (level === 3) {
      const nextGroup: Record<string, boolean> = {};
      const nextSub: Record<string, boolean> = {};
      sampleGroupRowsData.forEach(g => {
        nextGroup[g.groupId] = true;
        g.children.forEach(c => {
          if (c.grandChildren && c.grandChildren.length > 0) {
            nextSub[c.id] = true;
          }
        });
      });
      setExpandedGroupRows(nextGroup);
      setExpandedGroupSubRows(nextSub);
      setGroupRowsMode('collapsing');
    }
  };

  const handleStepGroupRows = () => {
    const allGroups = sampleGroupRowsData.every(g => !!expandedGroupRows[g.groupId]);
    const allSubs = sampleGroupRowsData.every(g => g.children.every(c => !c.grandChildren || !!expandedGroupSubRows[c.id]));

    if (!allGroups) {
      setGroupRowsTo(2);
    } else if (!allSubs && groupRowsMode === 'expanding') {
      setGroupRowsTo(3);
    } else if (allSubs) {
      setGroupRowsTo(2);
      setGroupRowsMode('collapsing');
    } else {
      setGroupRowsTo(1);
    }
  };

  const getGroupRowsButtonInfo = () => {
    const allGroups = sampleGroupRowsData.every(g => !!expandedGroupRows[g.groupId]);
    const allSubs = sampleGroupRowsData.every(g => g.children.every(c => !c.grandChildren || !!expandedGroupSubRows[c.id]));

    if (!allGroups) {
      return {
        label: 'Buka Tingkat 2 (Anak)',
        levelText: 'Level 1: Induk Saja',
        icon: ChevronDown,
        level: 1
      };
    }
    if (allSubs) {
      return {
        label: 'Tutup Tingkat 3 (Cucu)',
        levelText: 'Level 3: Lengkap (+Cucu)',
        icon: ChevronUp,
        level: 3
      };
    }
    if (groupRowsMode === 'collapsing') {
      return {
        label: 'Tutup Semua (Kembali ke Induk)',
        levelText: 'Level 2: Cucu Ditutup',
        icon: ChevronUp,
        level: 2
      };
    }
    return {
      label: 'Buka Tingkat 3 (Cucu)',
      levelText: 'Level 2: +Anak Terbuka',
      icon: ChevronDown,
      level: 2
    };
  };

  const isAllGroupExpanded = sampleGroupRowsData.every(g => !!expandedGroupRows[g.groupId]);
  const toggleAllGroupRows = handleStepGroupRows;

  // 3-Level Nested Hierarchy Table State & Sample Data (Parent -> Child -> Grandchild)
  const [expandedThreeLevelParent, setExpandedThreeLevelParent] = useState<Record<string, boolean>>({ 'grp-ft': true });
  const [expandedThreeLevelChild, setExpandedThreeLevelChild] = useState<Record<string, boolean>>({ 'dept-teti': true });

  const sampleThreeLevelData = [
    {
      id: 'grp-ft',
      name: 'Fakultas Teknik (FT)',
      code: '040000',
      cluster: 'Saintek',
      totalPagu: 2450000000,
      totalRealisasi: 1820000000,
      status: 'proses',
      children: [
        {
          id: 'dept-teti',
          name: 'Departemen Teknik Elektro & Teknologi Informasi',
          code: '040201',
          pic: 'Prof. Dr. Ir. Sunarno',
          pagu: 980000000,
          realisasi: 750000000,
          status: 'disetujui',
          grandChildren: [
            { id: 'lab-1', kode: '040201-LAB01', nama: 'Laboratorium Sistem Tenaga Listrik & Energi Terbarukan', pic: 'Dr. Eng. Suharyanto', pagu: 350000000, realisasi: 280000000, status: 'disetujui' },
            { id: 'lab-2', kode: '040201-LAB02', nama: 'Laboratorium Jaringan Komputer & Keamanan Siber', pic: 'Dr. Widyawan, S.T., M.Sc.', pagu: 380000000, realisasi: 310000000, status: 'disetujui' },
            { id: 'lab-3', kode: '040201-LAB03', nama: 'Laboratorium Sistem Tertanam & Robotika Cerdas', pic: 'Dr. Adha Imam Cahyadi', pagu: 250000000, realisasi: 160000000, status: 'proses' },
          ]
        },
        {
          id: 'dept-tsl',
          name: 'Departemen Teknik Sipil & Lingkungan',
          code: '040101',
          pic: 'Dr. Ir. Budi Wibowo',
          pagu: 820000000,
          realisasi: 610000000,
          status: 'disetujui',
          grandChildren: [
            { id: 'lab-4', kode: '040101-LAB01', nama: 'Laboratorium Mekanika Tanah & Geoteknik', pic: 'Prof. Ir. Joko Sujono', pagu: 450000000, realisasi: 360000000, status: 'disetujui' },
            { id: 'lab-5', kode: '040101-LAB02', nama: 'Laboratorium Rekayasa Sungai & Hidrolika', pic: 'Dr. Karlina, S.T., M.T.', pagu: 370000000, realisasi: 250000000, status: 'proses' },
          ]
        },
        {
          id: 'dept-tmi',
          name: 'Departemen Teknik Mesin & Industri',
          code: '040301',
          pic: 'Dr. Fauzun, S.T., M.T.',
          pagu: 650000000,
          realisasi: 460000000,
          status: 'proses',
          grandChildren: [
            { id: 'lab-6', kode: '040301-LAB01', nama: 'Laboratorium Desain & Manufaktur Presisi (CNC)', pic: 'Dr. Muslim Mahardika', pagu: 380000000, realisasi: 290000000, status: 'disetujui' },
            { id: 'lab-7', kode: '040301-LAB02', nama: 'Laboratorium Ergonomi & Tata Letak Pabrik', pic: 'Ir. Subagyo, Ph.D.', pagu: 270000000, realisasi: 170000000, status: 'proses' },
          ]
        }
      ]
    },
    {
      id: 'grp-fkkmk',
      name: 'Fakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan (FKKMK)',
      code: '050000',
      cluster: 'Kesehatan',
      totalPagu: 2100000000,
      totalRealisasi: 1850000000,
      status: 'disetujui',
      children: [
        {
          id: 'dept-ika',
          name: 'Departemen Ilmu Kesehatan Anak',
          code: '050101',
          pic: 'dr. Ida Safitri, Sp.A(K)',
          pagu: 1100000000,
          realisasi: 980000000,
          status: 'disetujui',
          grandChildren: [
            { id: 'lab-8', kode: '050101-DIV01', nama: 'Divisi Pediatri Gawat Darurat & Intensive Care (PICU)', pic: 'dr. Intan F., Sp.A', pagu: 600000000, realisasi: 550000000, status: 'disetujui' },
            { id: 'lab-9', kode: '050101-DIV02', nama: 'Divisi Nutrisi & Penyakit Metabolik Anak', pic: 'dr. Titis P., Sp.A', pagu: 500000000, realisasi: 430000000, status: 'disetujui' },
          ]
        },
        {
          id: 'dept-bedah',
          name: 'Departemen Bedah & Bedah Saraf',
          code: '050201',
          pic: 'dr. Rachmat Andi, Sp.B',
          pagu: 1000000000,
          realisasi: 870000000,
          status: 'disetujui',
          grandChildren: [
            { id: 'lab-10', kode: '050201-DIV01', nama: 'Divisi Bedah Digestif & Minimal Invasif Laparoskopi', pic: 'dr. Hendra W., Sp.B-KBD', pagu: 550000000, realisasi: 490000000, status: 'disetujui' },
            { id: 'lab-11', kode: '050201-DIV02', nama: 'Divisi Bedah Saraf, Spine & Neurotrauma', pic: 'dr. Adi Santoso, Sp.BS', pagu: 450000000, realisasi: 380000000, status: 'disetujui' },
          ]
        }
      ]
    }
  ];

  // State dan Logika Buka Tutup Perjenjang untuk Template 4 (Induk -> Anak -> Cucu)
  const [threeLevelMode, setThreeLevelMode] = useState<'expanding' | 'collapsing'>('expanding');

  const setThreeLevelTo = (level: 1 | 2 | 3) => {
    if (level === 1) {
      setExpandedThreeLevelParent({});
      setExpandedThreeLevelChild({});
      setThreeLevelMode('expanding');
    } else if (level === 2) {
      const nextParent: Record<string, boolean> = {};
      sampleThreeLevelData.forEach(p => { nextParent[p.id] = true; });
      setExpandedThreeLevelParent(nextParent);
      setExpandedThreeLevelChild({});
      setThreeLevelMode('expanding');
    } else if (level === 3) {
      const nextParent: Record<string, boolean> = {};
      const nextChild: Record<string, boolean> = {};
      sampleThreeLevelData.forEach(p => {
        nextParent[p.id] = true;
        p.children.forEach(c => {
          nextChild[c.id] = true;
        });
      });
      setExpandedThreeLevelParent(nextParent);
      setExpandedThreeLevelChild(nextChild);
      setThreeLevelMode('collapsing');
    }
  };

  const handleStepThreeLevels = () => {
    const allParents = sampleThreeLevelData.every(p => !!expandedThreeLevelParent[p.id]);
    const allChildren = sampleThreeLevelData.every(p => p.children.every(c => !!expandedThreeLevelChild[c.id]));

    if (!allParents) {
      setThreeLevelTo(2);
    } else if (!allChildren && threeLevelMode === 'expanding') {
      setThreeLevelTo(3);
    } else if (allChildren) {
      setThreeLevelTo(2);
      setThreeLevelMode('collapsing');
    } else {
      setThreeLevelTo(1);
    }
  };

  const getThreeLevelButtonInfo = () => {
    const allParents = sampleThreeLevelData.every(p => !!expandedThreeLevelParent[p.id]);
    const allChildren = sampleThreeLevelData.every(p => p.children.every(c => !!expandedThreeLevelChild[c.id]));

    if (!allParents) {
      return {
        label: 'Buka Tingkat 2 (Anak)',
        levelText: 'Level 1: Induk Saja',
        icon: ChevronDown,
        level: 1
      };
    }
    if (allChildren) {
      return {
        label: 'Tutup Tingkat 3 (Cucu)',
        levelText: 'Level 3: Lengkap (+Cucu)',
        icon: ChevronUp,
        level: 3
      };
    }
    if (threeLevelMode === 'collapsing') {
      return {
        label: 'Tutup Semua (Kembali ke Induk)',
        levelText: 'Level 2: Cucu Ditutup',
        icon: ChevronUp,
        level: 2
      };
    }
    return {
      label: 'Buka Tingkat 3 (Cucu)',
      levelText: 'Level 2: +Anak Terbuka',
      icon: ChevronDown,
      level: 2
    };
  };

  const isAllThreeLevelExpanded = 
    sampleThreeLevelData.every(p => !!expandedThreeLevelParent[p.id]) &&
    sampleThreeLevelData.every(p => p.children.every(c => !!expandedThreeLevelChild[c.id]));

  const toggleAllThreeLevels = handleStepThreeLevels;

  // =========================================================================
  // STATE & DATA SAMPLE: PIVOT MATRIX BAGAN AKUN STANDAR (COA) 12-BULAN
  // =========================================================================
  const [pivotHierarchyLevel, setPivotHierarchyLevel] = useState<number>(3);
  const [pivotSearchQuery, setPivotSearchQuery] = useState<string>('');
  const [pivotCategoryFilter, setPivotCategoryFilter] = useState<'all' | '4' | '5' | '1'>('all');
  const [pivotExpandedNodes, setPivotExpandedNodes] = useState<Record<string, boolean>>({
    'pvt-induk-4': true,
    'pvt-induk-5': true,
    'pvt-gol-41': true,
    'pvt-gol-51': true,
    'pvt-gol-52': true,
    'pvt-kel-411': true,
    'pvt-kel-511': true,
  });
  const [pivotTableDensity, setPivotTableDensity] = useState<TableDensity>('comfortable');
  const [pivotExpandPosisiAwal, setPivotExpandPosisiAwal] = useState<boolean>(false);
  const [pivotExpandPosisiAkhir, setPivotExpandPosisiAkhir] = useState<boolean>(false);

  const samplePivotCoaData = [
    {
      id: 'pvt-induk-4',
      nomor_akun: '40000',
      nama_akun: 'PENERIMAAN KAS & INFAQ MASJID',
      isInduk: true,
      saldoAwal: 0,
      months: [42500000, 38000000, 56000000, 68000000, 49000000, 45000000, 52000000, 47000000, 51000000, 64000000, 58000000, 75000000],
      golongans: [
        {
          id: 'pvt-gol-41',
          nomor_akun: '41',
          nama_akun: 'Penerimaan Infaq, Wakaf & Donasi',
          isGol: true,
          months: [41000000, 36500000, 54200000, 66000000, 47500000, 43200000, 50100000, 45500000, 49200000, 62000000, 56200000, 72800000],
          kelompoks: [
            {
              id: 'pvt-kel-411',
              nomor_akun: '41100',
              nama_akun: 'Infaq Kotak Jumat & Harian',
              isKel: true,
              months: [28000000, 25000000, 36000000, 44000000, 31000000, 29000000, 33000000, 30000000, 32000000, 41000000, 37000000, 48000000],
              anaks: [
                { id: 'pvt-anak-41101', nomor_akun: '41100.01', nama_akun: 'Infaq Kotak Sholat Jumat Utama', months: [20000000, 18000000, 26000000, 32000000, 22000000, 21000000, 24000000, 22000000, 23000000, 30000000, 27000000, 35000000] },
                { id: 'pvt-anak-41102', nomor_akun: '41100.02', nama_akun: 'Infaq Kotak Harian & Jamaah Wanita', months: [8000000, 7000000, 10000000, 12000000, 9000000, 8000000, 9000000, 8000000, 9000000, 11000000, 10000000, 13000000] },
              ]
            },
            {
              id: 'pvt-kel-412',
              nomor_akun: '41200',
              nama_akun: 'Donasi Non-Tunai & QRIS',
              isKel: true,
              months: [13000000, 11500000, 18200000, 22000000, 16500000, 14200000, 17100000, 15500000, 17200000, 21000000, 19200000, 24800000],
              anaks: [
                { id: 'pvt-anak-41201', nomor_akun: '41200.01', nama_akun: 'QRIS Dinamis Masjid (BSI & BNI)', months: [13000000, 11500000, 18200000, 22000000, 16500000, 14200000, 17100000, 15500000, 17200000, 21000000, 19200000, 24800000] },
              ]
            }
          ]
        },
        {
          id: 'pvt-gol-43',
          nomor_akun: '43',
          nama_akun: 'Penerimaan Bagi Hasil & Jasa Giro Bank',
          isGol: true,
          months: [1500000, 1500000, 1800000, 2000000, 1500000, 1800000, 1900000, 1500000, 1800000, 2000000, 1800000, 2200000],
          kelompoks: [
            {
              id: 'pvt-kel-431',
              nomor_akun: '43100',
              nama_akun: 'Bagi Hasil Tabungan Syariah (BSI)',
              isKel: true,
              months: [1500000, 1500000, 1800000, 2000000, 1500000, 1800000, 1900000, 1500000, 1800000, 2000000, 1800000, 2200000],
              anaks: []
            }
          ]
        }
      ]
    },
    {
      id: 'pvt-induk-5',
      nomor_akun: '50000',
      nama_akun: 'BEBAN OPERASIONAL & REALISASI MAK',
      isInduk: true,
      saldoAwal: 0,
      months: [32000000, 34500000, 48000000, 52000000, 39500000, 38000000, 41000000, 43500000, 42000000, 47000000, 46000000, 58000000],
      golongans: [
        {
          id: 'pvt-gol-51',
          nomor_akun: '51',
          nama_akun: 'Bisyaroh & Tunjangan Petugas',
          isGol: true,
          months: [18000000, 18000000, 22000000, 24000000, 18000000, 18000000, 18000000, 18000000, 18000000, 21000000, 19000000, 24000000],
          kelompoks: [
            {
              id: 'pvt-kel-511',
              nomor_akun: '51100',
              nama_akun: 'Bisyaroh Imam Rawatib, Muadzin & Marbot',
              isKel: true,
              months: [12000000, 12000000, 15000000, 16000000, 12000000, 12000000, 12000000, 12000000, 12000000, 14000000, 13000000, 16000000],
              anaks: [
                { id: 'pvt-anak-51101', nomor_akun: '51100.01', nama_akun: 'Honor Imam Rawatib 5 Waktu', months: [7000000, 7000000, 8500000, 9000000, 7000000, 7000000, 7000000, 7000000, 7000000, 8000000, 7500000, 9000000] },
                { id: 'pvt-anak-51102', nomor_akun: '51100.02', nama_akun: 'Honor Muadzin & Petugas Marbot', months: [5000000, 5000000, 6500000, 7000000, 5000000, 5000000, 5000000, 5000000, 5000000, 6000000, 5500000, 7000000] },
              ]
            },
            {
              id: 'pvt-kel-512',
              nomor_akun: '51200',
              nama_akun: 'Bisyaroh Penceramah & Khatib Jumat',
              isKel: true,
              months: [6000000, 6000000, 7000000, 8000000, 6000000, 6000000, 6000000, 6000000, 6000000, 7000000, 6000000, 8000000],
              anaks: []
            }
          ]
        },
        {
          id: 'pvt-gol-52',
          nomor_akun: '52',
          nama_akun: 'Kerumahtanggaan, Konsumsi & Operasional',
          isGol: true,
          months: [9000000, 10500000, 16000000, 18000000, 12500000, 11000000, 13000000, 14500000, 13500000, 15000000, 16000000, 19000000],
          kelompoks: [
            {
              id: 'pvt-kel-521',
              nomor_akun: '52100',
              nama_akun: 'Alat Kebersihan, Pewangi & Operasional Sanitasi',
              isKel: true,
              months: [4000000, 4500000, 6000000, 7000000, 5000000, 4500000, 5000000, 5500000, 5000000, 6000000, 6000000, 7500000],
              anaks: []
            },
            {
              id: 'pvt-kel-522',
              nomor_akun: '52200',
              nama_akun: 'Konsumsi Kajian Rutin, Rapat & Buka Puasa',
              isKel: true,
              months: [5000000, 6000000, 10000000, 11000000, 7500000, 6500000, 8000000, 9000000, 8500000, 9000000, 10000000, 11500000],
              anaks: []
            }
          ]
        },
        {
          id: 'pvt-gol-53',
          nomor_akun: '53',
          nama_akun: 'Pemeliharaan Gedung, AC & Sound System',
          isGol: true,
          months: [5000000, 6000000, 10000000, 10000000, 9000000, 9000000, 10000000, 11000000, 10500000, 11000000, 11000000, 15000000],
          kelompoks: [
            {
              id: 'pvt-kel-531',
              nomor_akun: '53100',
              nama_akun: 'Servis AC Central & Peremajaan Sound System',
              isKel: true,
              months: [5000000, 6000000, 10000000, 10000000, 9000000, 9000000, 10000000, 11000000, 10500000, 11000000, 11000000, 15000000],
              anaks: []
            }
          ]
        }
      ]
    },
    {
      id: 'pvt-induk-1',
      nomor_akun: '10000',
      nama_akun: 'KAS & SETARA KAS (SALDO MUTASI)',
      isInduk: true,
      saldoAwal: 245000000,
      months: [12000000, 15000000, 18000000, 14000000, 16000000, 17500000, 19000000, 16500000, 18500000, 20000000, 19500000, 22000000],
      golongans: [
        {
          id: 'pvt-gol-11',
          nomor_akun: '11',
          nama_akun: 'Kas & Rekening Operasional Bank',
          isGol: true,
          months: [12000000, 15000000, 18000000, 14000000, 16000000, 17500000, 19000000, 16500000, 18500000, 20000000, 19500000, 22000000],
          kelompoks: [
            {
              id: 'pvt-kel-111',
              nomor_akun: '11110',
              nama_akun: 'Mutasi Kas Operasional Tunai',
              isKel: true,
              months: [4000000, 5000000, 6000000, 4500000, 5000000, 5500000, 6000000, 5000000, 6000000, 7000000, 6500000, 7000000],
              anaks: []
            },
            {
              id: 'pvt-kel-112',
              nomor_akun: '11120',
              nama_akun: 'Mutasi Rekening Giro Utama (BSI & BNI)',
              isKel: true,
              months: [8000000, 10000000, 12000000, 9500000, 11000000, 12000000, 13000000, 11500000, 12500000, 13000000, 13000000, 15000000],
              anaks: []
            }
          ]
        }
      ]
    },
    {
      id: 'pvt-induk-9',
      nomor_akun: '90000',
      nama_akun: 'KOREKSI & PENYESUAIAN REKENING BANK',
      isInduk: true,
      saldoAwal: 0,
      months: [500000, 0, 750000, 0, 300000, 0, 450000, 0, 0, 600000, 0, 250000],
      golongans: [
        {
          id: 'pvt-gol-91',
          nomor_akun: '91',
          nama_akun: 'Koreksi Selisih Kas & Kliring Bank',
          isGol: true,
          months: [500000, 0, 750000, 0, 300000, 0, 450000, 0, 0, 600000, 0, 250000],
          kelompoks: [
            {
              id: 'pvt-kel-911',
              nomor_akun: '91100',
              nama_akun: 'Penyesuaian Bunga / Biaya Administrasi Giro',
              isKel: true,
              months: [500000, 0, 750000, 0, 300000, 0, 450000, 0, 0, 600000, 0, 250000],
              anaks: []
            }
          ]
        }
      ]
    }
  ];

  const samplePivotRekeningSaldo = [
    { id: 'rek-bsi', nama: 'BSI Giro Operasional (Rek. 7001234567)', awal: 145000000, saldos: [155500000, 159000000, 167000000, 183000000, 192500000, 199500000, 210500000, 214000000, 223000000, 240000000, 252000000, 269000000] },
    { id: 'rek-bni', nama: 'BNI Giro Masjid (Rek. 0123456789)', awal: 85000000, saldos: [85000000, 85000000, 85000000, 85000000, 85000000, 85000000, 85000000, 85000000, 85000000, 85000000, 85000000, 85000000] },
    { id: 'rek-kas', nama: 'Kas Tunai Bendahara', awal: 15000000, saldos: [15000000, 15000000, 15000000, 15000000, 15000000, 15000000, 15000000, 15000000, 15000000, 15000000, 15000000, 15000000] },
  ];

  const setPivotHierarchyTo = (lvl: number) => {
    setPivotHierarchyLevel(lvl);
    const newMap: Record<string, boolean> = {};
    samplePivotCoaData.forEach((induk) => {
      newMap[induk.id] = lvl >= 2;
      induk.golongans.forEach((gol) => {
        newMap[gol.id] = lvl >= 3;
        gol.kelompoks.forEach((kel) => {
          newMap[kel.id] = lvl >= 4;
        });
      });
    });
    setPivotExpandedNodes(newMap);
  };

  const togglePivotNode = (id: string, defaultExpanded: boolean) => {
    setPivotExpandedNodes(prev => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : !defaultExpanded
    }));
  };

  const filteredPivotData = useMemo(() => {
    const q = pivotSearchQuery.toLowerCase().trim();
    return samplePivotCoaData.filter((induk) => {
      if (pivotCategoryFilter !== 'all') {
        if (!induk.nomor_akun.startsWith(pivotCategoryFilter)) return false;
      }
      return true;
    }).map((induk) => {
      if (!q) return induk;
      const filteredGols = induk.golongans.map((g) => {
        const filteredKels = g.kelompoks.map((k) => {
          const matchAnaks = k.anaks.filter(a => a.nomor_akun.includes(q) || a.nama_akun.toLowerCase().includes(q));
          const matchKel = k.nomor_akun.includes(q) || k.nama_akun.toLowerCase().includes(q);
          return { ...k, anaks: matchAnaks, _matched: matchKel || matchAnaks.length > 0 };
        }).filter(k => (k as any)._matched);

        const matchGol = g.nomor_akun.includes(q) || g.nama_akun.toLowerCase().includes(q);
        return { ...g, kelompoks: filteredKels, _matched: matchGol || filteredKels.length > 0 };
      }).filter(g => (g as any)._matched);

      return { ...induk, golongans: filteredGols };
    });
  }, [pivotCategoryFilter, pivotSearchQuery]);

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

  const handleSimulateDirectUpload = () => {
    if (!directUploadPath.trim()) {
      triggerToast('warning', 'Pilih Berkas Terlebih Dahulu', 'Silakan pilih atau ketik nama dokumen sebelum mengunggah.');
      return;
    }
    setIsDirectUploading(true);
    setDirectUploadProgress(20);
    setDirectUploadSuccess(false);

    setTimeout(() => setDirectUploadProgress(70), 300);
    setTimeout(() => {
      setDirectUploadProgress(100);
      setIsDirectUploading(false);
      setDirectUploadSuccess(true);
      triggerToast('success', 'Berkas Berhasil Diunggah', `${directUploadPath} berhasil disimpan ke server storage.`);
    }, 800);
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
                  Filter Autocomplete dengan Navigasi Panah Naik / Turun (↑ / ↓) & Textbox Pencarian
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ketik untuk menyaring opsi, gunakan <strong>panah atas/bawah keyboard (↑ / ↓)</strong> untuk memilih baris, dan tekan <strong>Enter</strong> untuk memilih tanpa mouse. Dilengkapi pasangan Textbox <em>Cari Kode / Nama</em> dan Combobox <em>Group Org</em> sesuai standar tampilan sistem.
              </p>
            </div>

            {/* Baris 1: Textbox Cari Kode / Nama & Autocomplete Keyboard-Friendly */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Textbox: CARI KODE / NAMA */}
                <div className="space-y-2 p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Search size={13} className="text-blue-600" />
                      Textbox Pencarian Cepat
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Realtime Filter
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      CARI KODE / NAMA
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        type="text"
                        placeholder="Ketik untuk mencari..."
                        value={demoSearchKeyword}
                        onChange={(e) => setDemoSearchKeyword(e.target.value)}
                        className="w-full h-10 pl-9 pr-9 bg-white hover:bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-medium placeholder:text-gray-400 shadow-2xs"
                      />
                      {demoSearchKeyword && (
                        <button
                          onClick={() => setDemoSearchKeyword('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                          title="Hapus pencarian"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-gray-500 font-medium block pt-0.5">
                    Hasil ketik: <strong className="text-blue-700">{demoSearchKeyword ? `"${demoSearchKeyword}"` : '(Ketik kata kunci pencarian)'}</strong>
                  </span>
                </div>

                {/* 2. Autocomplete Combobox dengan Navigasi Keyboard & Garis Pemisah Panah */}
                <div className="space-y-2 p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <ArrowUpDown size={13} className="text-blue-600" />
                      Autocomplete Keyboard-Friendly (Unit Kerja)
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      ↑ / ↓ + Enter
                    </span>
                  </div>

                  <AutocompleteCombobox
                    label="PILIH UNIT KERJA (KETIK & GUNAKAN PANAH ↑/↓)"
                    icon={Building2}
                    placeholder="Ketik nama unit (misal: Biologi, Keuangan)..."
                    options={sampleUnits}
                    value={autocompleteUnit}
                    onChange={setAutocompleteUnit}
                  />

                  <span className="text-[11px] text-gray-500 font-medium block pt-0.5">
                    Unit terpilih: <strong className="text-blue-700">{sampleUnits.find(u => u.value === autocompleteUnit)?.label || 'Belum dipilih'}</strong>
                  </span>
                </div>
              </div>

              {/* 3. Multi-Select Filter dengan Garis Samping Kiri Anak Panah Kebawah */}
              <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Multi-Select Filter (Banyak Pilihan Sekaligus)
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Centang + Tag + Garis Pemisah Panah
                  </span>
                </div>

                <div className="max-w-xl">
                  <MultiSelectFilter
                    label="PILIH BEBERAPA UNIT (MULTI-SELECT)"
                    icon={Building2}
                    placeholder="Pilih beberapa unit kerja..."
                    options={sampleUnits}
                    selectedValues={selectedUnits}
                    onChange={setSelectedUnits}
                    maxDisplayTags={3}
                  />
                </div>

                <span className="text-[11px] text-gray-500 font-medium block pt-0.5">
                  Terpilih ({selectedUnits.length}): <span className="font-mono text-indigo-700 font-bold">[{selectedUnits.map(id => sampleUnits.find(u => u.value === id)?.label || id).join(', ')}]</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 1: Filter Rentang Tanggal & Bulan Laporan (Poin 2A - Tanpa Jam & Murni Bulan) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  Poin 2A • Filter Laporan
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Filter Rentang Tanggal &amp; Bulan Laporan (Tanpa Jam, 1x Klik Preset)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Katalog baku pemilih rentang waktu untuk <strong>filter tabel data, query laporan, dan monitoring</strong>. Tersedia dalam dua mode baku: <strong>Rentang Tanggal Harian</strong> (<code className="text-blue-600 font-bold">&lt;DateRangePicker showTime=&#123;false&#125; /&gt;</code>) dan <strong>Rentang Bulan Murni Tanpa Tanggal</strong> (<code className="text-indigo-600 font-bold">&lt;MonthRangePicker /&gt;</code>).
              </p>
            </div>

            {/* Sub-Card 1: DateRangePicker (Rentang Tanggal Harian - Tanpa Jam) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200/70">
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-blue-600" />
                  1. DateRangePicker (Rentang Tanggal Harian — Tanpa Jam)
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200/70">
                  Format: YYYY-MM-DD
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2">
                  <DateRangePicker
                    label="Filter Rentang Tanggal (1x Klik)"
                    value={dateRangeFilter}
                    onChange={setDateRangeFilter}
                    showTime={false}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-bold text-gray-500">Rentang Aktif:</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                      {dateRangeFilter.startDate} s/d {dateRangeFilter.endDate}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-200/80 space-y-1.5 text-xs">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Karakteristik Komponen:</span>
                  <ul className="text-gray-600 text-[11px] space-y-1 list-disc list-inside">
                    <li>Preset 1-klik: Hari Ini, 7 Hari, 30 Hari, Bulan Ini, Bulan Lalu</li>
                    <li>Pemilih Cepat Per Bulan &amp; Tahun (Jan - Des)</li>
                    <li>Digunakan pada: <strong>Rekap Transfer, Jurnal Kas, Laporan Realisasi</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sub-Card 2: MonthRangePicker (Rentang Bulan Murni - Tanpa Menampilkan Tanggal) */}
            <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600" />
                    2. MonthRangePicker (Rentang Bulan Murni — Tanpa Menampilkan Tanggal)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase">
                    Komponen Baru
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-100/80 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200/70">
                  Format: YYYY-MM
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="md:col-span-2 space-y-2.5">
                  <MonthRangePicker
                    label="Pilih Rentang Bulan Laporan (Murni Bulan)"
                    value={monthRangeFilter}
                    onChange={setMonthRangeFilter}
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-gray-500">Rentang Bulan Terpilih:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-black text-[11px] shadow-2xs">
                      {monthRangeFilter.startMonth} s/d {monthRangeFilter.endMonth}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white text-indigo-900 font-mono text-[10.5px] font-bold border border-indigo-200">
                      Query Database: {monthRangeFilter.startDate} s/d {monthRangeFilter.endDate}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-200/80 space-y-1.5 text-xs shadow-2xs">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Karakteristik MonthRangePicker:</span>
                  <ul className="text-gray-600 text-[11px] space-y-1 list-disc list-inside">
                    <li><strong>Murni Bulan:</strong> Hanya memilih bulan &amp; tahun, angka tanggal hari tidak ditampilkan.</li>
                    <li><strong>Visual Highlight:</strong> Sorotan kontinu dari bulan awal sampai bulan akhir.</li>
                    <li><strong>Preset 1-Klik:</strong> Bulan Ini, Q1-Q4 (Triwulan), Semester 1 &amp; 2, Tahun Penuh (12 Bulan).</li>
                    <li><strong>Output Otomatis:</strong> Langsung menyertakan rentang tanggal lengkap (YYYY-MM-01 s/d YYYY-MM-lastDay) untuk filter SQL/API.</li>
                    <li>Cocok untuk: <strong>Laporan Keuangan Bulanan, Bagan Akun Standar (COA), Rekapitulasi Tahunan</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Input Tanggal & Jam Data Transaksi (Poin 2B - Form Input) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Poin 2B • Input Formulir
                </span>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Input Tanggal &amp; Jam Transaksi (Form Input Data, Bukan Filter)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Komponen input tanggal dan waktu yang digunakan untuk <strong>pengisian form transaksi, jadwal kegiatan, dan approval bukti transfer</strong> (bukan untuk filter laporan).
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* 1. Input Tanggal & Jam Pelaksanaan Tunggal */}
                <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} className="text-emerald-600" />
                      1. Waktu Transaksi Tunggal (Datetime)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const y = now.getFullYear();
                        const m = String(now.getMonth() + 1).padStart(2, '0');
                        const d = String(now.getDate()).padStart(2, '0');
                        const h = String(now.getHours()).padStart(2, '0');
                        const min = String(now.getMinutes()).padStart(2, '0');
                        setDateTimeVal(`${y}-${m}-${d}T${h}:${min}`);
                      }}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Set Sekarang
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Tanggal &amp; Jam Pelaksanaan:
                    </label>
                    <input
                      type="datetime-local"
                      value={dateTimeVal}
                      onChange={(e) => setDateTimeVal(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-gray-800 cursor-pointer"
                    />
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 text-[11px] text-emerald-900 font-mono">
                    <strong>Payload Form:</strong> {`{ waktu_eksekusi: "${dateTimeVal}:00+07:00" }`}
                  </div>
                </div>

                {/* 2. Input Rentang Jam Kegiatan (Tanggal + Jam Mulai s.d Selesai) */}
                <div className="bg-white p-4 rounded-xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-600" />
                      2. Jadwal Acara (Tanggal + Rentang Jam)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setFormStartTime('08:00'); setFormEndTime('16:00'); }}
                        className="px-1.5 py-0.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-[9.5px] font-bold rounded transition-colors cursor-pointer"
                      >
                        08-16
                      </button>
                      <button
                        type="button"
                        onClick={() => { setFormStartTime('13:00'); setFormEndTime('17:00'); }}
                        className="px-1.5 py-0.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-[9.5px] font-bold rounded transition-colors cursor-pointer"
                      >
                        13-17
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Tanggal Kegiatan:
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Jam Mulai:
                      </label>
                      <input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Jam Selesai:
                      </label>
                      <input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-800 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 font-mono">
                    <strong>Payload Form:</strong> {`{ tanggal: "${formDate}", jam: "${formStartTime} - ${formEndTime}" }`}
                  </div>
                </div>

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

            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Input Textbox Berkas & Tombol Kamera / Browse */}
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                      1. Textbox Berkas & Tombol Kamera / Browse
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      Mobile & Desktop
                    </span>
                  </div>

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

                {/* 2. Textbox Berkas dengan Tombol Upload Langsung (Sebelah Kanan) */}
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                      2. Textbox Berkas dengan Tombol Upload Langsung
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Inline Action
                    </span>
                  </div>

                  {/* Unified Input Container: Tombol Upload & Browse Menyatu di Dalam Textbox */}
                  <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl shadow-2xs hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all pl-3.5 pr-1.5 h-10">
                    <FileText size={15} className="text-gray-400 shrink-0 mr-2" />
                    <input
                      type="text"
                      value={directUploadPath}
                      onChange={(e) => {
                        setDirectUploadPath(e.target.value);
                        setDirectUploadSuccess(false);
                      }}
                      placeholder="Ketik nama berkas atau pilih dari perangkat..."
                      className="w-full bg-transparent text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none pr-2"
                    />

                    {/* Cluster Tombol Aksi di DALAM Textbox Sebelah Kanan */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label
                        className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Pilih berkas dari komputer"
                      >
                        <FolderTree size={12} />
                        <span className="hidden sm:inline">Browse</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setDirectUploadPath(e.target.files[0].name);
                              setDirectUploadSuccess(false);
                            }
                          }}
                        />
                      </label>

                      {/* Garis Pemisah Vertikal | */}
                      <div className="h-4 w-px bg-gray-200/90 mx-0.5" />

                      {/* Tombol Upload Interaktif Langsung Menyatu di Kanan */}
                      <button
                        type="button"
                        disabled={isDirectUploading}
                        onClick={handleSimulateDirectUpload}
                        className="h-7 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 disabled:opacity-60"
                        title="Klik untuk mengunggah berkas sekarang"
                      >
                        {isDirectUploading ? (
                          <>
                            <RefreshCw size={11} className="animate-spin" />
                            <span>Mengunggah...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={12} />
                            <span>Upload</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Upload Progress Bar atau Status Sukses */}
                  {isDirectUploading && (
                    <div className="space-y-1 p-2 bg-blue-50/70 border border-blue-200 rounded-xl">
                      <div className="flex justify-between text-[11px] font-bold text-blue-800">
                        <span>Sedang mengunggah {directUploadPath}...</span>
                        <span className="font-mono">{directUploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                          style={{ width: `${directUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!isDirectUploading && directUploadSuccess && (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle size={15} className="text-emerald-600 shrink-0" />
                        <span className="truncate font-semibold text-emerald-900">{directUploadPath}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                        Tersimpan di Cloud
                      </span>
                    </div>
                  )}

                  {!isDirectUploading && !directUploadSuccess && directUploadPath && (
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-100 text-xs text-gray-500">
                      <span className="truncate text-[11px]">Siap unggah: <strong className="text-gray-800">{directUploadPath}</strong></span>
                      <span className="text-[10px] text-gray-400 font-mono">Format PDF/DOCX/JPG</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Area Drag & Dropzone Berkas */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  3. Area Drag & Dropzone Berkas (Seret & Lepas Dokumen)
                </span>
                <FileUploadDropzone
                  label=""
                  maxSizeMB={15}
                  onFileSelect={(f) => {
                    setUploadTextPath(f.name);
                    setDirectUploadPath(f.name);
                    setDirectUploadSuccess(false);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Pedoman Standar Paste Zone (Bulk Import Clipboard Excel dengan Keterangan Format Data) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                    Poin 2D • Standar Excel / TSV Paste Zone
                  </span>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    Pedoman Standar Paste Zone (Import Massal Clipboard Excel dengan Keterangan Data)
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format baku kotak input salin-tempel (<em>copy-paste</em>) massal dari Microsoft Excel atau Google Sheets. Memungkinkan penginputan puluhan hingga ribuan baris data transaksi anggaran secara instan tanpa perlu repot menyimpan file CSV manual.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `<div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-center gap-3">\n  <div className="min-w-[130px] flex flex-col items-center justify-center p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl text-indigo-700 text-center shrink-0">\n    <FileSpreadsheet size={24} className="mb-1 text-indigo-600" />\n    <p className="text-[10px] font-bold uppercase tracking-wider">Paste Zone</p>\n    <span className="text-[9px] text-indigo-500 font-medium">Excel Clipboard</span>\n  </div>\n  <div className="flex-1 w-full">\n    <textarea\n      onPaste={handleExcelPaste}\n      placeholder="COPY baris dari EXCEL lalu PASTE di sini...\\nFormat: [1] ID DB [TAB] [2] Nama Unit [TAB] [3] Tahun [TAB] [4] Nominal [TAB] [5] Sumber Dana [TAB] [6] Keterangan [TAB] [7] Status Pagu [TAB] [8] Jenis Anggaran"\n      className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 focus:bg-white rounded-xl py-2.5 px-3.5 outline-none transition-all font-mono text-xs text-gray-800 placeholder:text-gray-400 resize-none h-20 shadow-2xs"\n    />\n  </div>\n</div>`,
                    'paste-zone-code'
                  )
                }
                className="h-8 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                {copiedCode === 'paste-zone-code' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedCode === 'paste-zone-code' ? 'Tersalin!' : 'Salin Kode Paste Zone'}</span>
              </button>
            </div>

            {/* TABEL KETERANGAN FORMAT DATA YANG DI-PASTE-KAN */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/70">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <FileSpreadsheet size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Tabel Keterangan Spesifikasi Kolom Data (8 Kolom Baku)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Pastikan susunan kolom sel di spreadsheet Excel sesuai urutan header baku dari kiri ke kanan.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("[1] ID DB\t[2] Nama Unit\t[3] Tahun\t[4] Nominal\t[5] Sumber Dana\t[6] Keterangan\t[7] Status Pagu\t[8] Jenis Anggaran");
                    triggerToast('info', 'Header Excel Disalin', 'Header 8-kolom baku siap di-paste ke baris 1 spreadsheet Excel Anda.');
                  }}
                  className="h-7 px-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                >
                  <Copy size={11} />
                  <span>Salin Header Kolom Excel (8 Kolom)</span>
                </button>
              </div>

              {/* Quick Header Ribbon */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-gray-200/80">
                <span className="text-[10px] font-black uppercase text-gray-400 mr-1">Urutan Header:</span>
                {[
                  '[1] ID DB',
                  '[2] Nama Unit',
                  '[3] Tahun',
                  '[4] Nominal',
                  '[5] Sumber Dana',
                  '[6] Keterangan',
                  '[7] Status Pagu',
                  '[8] Jenis Anggaran'
                ].map((colName, cIdx) => (
                  <span key={cIdx} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold">
                    {colName}
                  </span>
                ))}
              </div>

              {/* Data Spec Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-center w-14">Kolom</th>
                      <th className="py-2.5 px-3 w-40">Nama Field Header</th>
                      <th className="py-2.5 px-3 w-36">Tipe &amp; Format</th>
                      <th className="py-2.5 px-3 text-center w-24">Kewajiban</th>
                      <th className="py-2.5 px-3">Keterangan &amp; Ketentuan Baku</th>
                      <th className="py-2.5 px-3 w-48 font-mono">Contoh Isi Sel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      {
                        col: 'A (1)',
                        field: '[1] ID DB',
                        type: 'String / Angka',
                        badge: 'ID Referensi / PK',
                        required: false,
                        desc: 'ID unik baris pada database. Jika diisi sistem akan melakukan sinkronisasi/update baris lama; jika kosong akan otomatis di-generate sebagai entri baru.',
                        example: '101'
                      },
                      {
                        col: 'B (2)',
                        field: '[2] Nama Unit',
                        type: 'Teks (String)',
                        badge: 'Unit Kerja / Fakultas',
                        required: true,
                        desc: 'Nama fakultas, direktorat, lembaga, departemen, atau unit kerja penanggung jawab alokasi anggaran.',
                        example: 'Fakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan'
                      },
                      {
                        col: 'C (3)',
                        field: '[3] Tahun',
                        type: 'Angka (4 Digit)',
                        badge: 'YYYY (Tahun Anggaran)',
                        required: true,
                        desc: 'Tahun anggaran belanja atau penetapan pagu (misal: 2026, 2025, 2024).',
                        example: '2026'
                      },
                      {
                        col: 'D (4)',
                        field: '[4] Nominal',
                        type: 'Angka (Numeric)',
                        badge: 'Rupiah Bersih',
                        required: true,
                        desc: 'Nilai alokasi anggaran dalam Rupiah. Simbol "Rp", pemisah titik ribuan, atau koma desimal otomatis dibersihkan.',
                        example: '1850000000'
                      },
                      {
                        col: 'E (5)',
                        field: '[5] Sumber Dana',
                        type: 'Pilihan (Enum)',
                        badge: 'BOPTN / RKAT / APBN / PNBP',
                        required: true,
                        desc: 'Asal pembiayaan anggaran (contoh: BOPTN, RKAT-UGM, APBN, PNBP, Hibah Penelitian).',
                        example: 'BOPTN'
                      },
                      {
                        col: 'F (6)',
                        field: '[6] Keterangan',
                        type: 'Teks Bebas',
                        badge: 'Maks. 500 Karakter',
                        required: false,
                        desc: 'Uraian rincian peruntukan pengadaan, catatan kegiatan, atau deskripsi kebutuhan anggaran belanja.',
                        example: 'Operasional Lab Biomedis & Riset Terpadu'
                      },
                      {
                        col: 'G (7)',
                        field: '[7] Status Pagu',
                        type: 'Pilihan (Enum)',
                        badge: 'Disetujui / Usulan / Revisi',
                        required: false,
                        desc: 'Status verifikasi pagu anggaran di sistem ("Disetujui", "Usulan", "Revisi", "Draft"). Default: Disetujui.',
                        example: 'Disetujui'
                      },
                      {
                        col: 'H (8)',
                        field: '[8] Jenis Anggaran',
                        type: 'Pilihan (Enum)',
                        badge: 'Barang / Modal / Operasional',
                        required: false,
                        desc: 'Klasifikasi pos belanja ("Belanja Barang", "Belanja Modal", "Operasional", "Gaji & Tunjangan"). Default: Belanja Barang.',
                        example: 'Belanja Barang'
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-500 text-[11px]">
                          {row.col}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-gray-900 font-mono text-xs">
                          {row.field}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                            {row.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            row.required ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.required ? 'Wajib' : 'Opsional'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                          {row.desc}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-700 font-semibold">
                          {row.example}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ketentuan Cerdas Sistem */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-800">
                  <Info size={14} className="text-amber-600" /> Aturan Pintar Parser Paste Zone:
                </span>
                <ul className="text-[11px] list-disc list-inside space-y-0.5 text-amber-800/90 pl-1">
                  <li><strong>Header Otomatis Dieliminasi:</strong> Jika baris pertama berisi kata kunci &quot;ID DB&quot;, &quot;[1]&quot;, &quot;Nama Unit&quot;, atau &quot;Tahun&quot;, sistem tidak akan memasukkannya sebagai baris data.</li>
                  <li><strong>Normalisasi Format Uang:</strong> Teks seperti &quot;Rp 1.850.000.000,00&quot; atau &quot;1850000000&quot; otomatis dikonversi ke nilai angka murni.</li>
                  <li><strong>Pemisah Tabulator Baku (TSV):</strong> Mendukung salin sel multi-baris langsung dari Microsoft Excel desktop, Office 365, maupun Google Sheets via tombol keyboard <strong>Ctrl + C</strong> lalu <strong>Ctrl + V</strong>.</li>
                </ul>
              </div>
            </div>

            {/* LIVE INTERACTIVE PASTE ZONE BOX */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardPaste size={14} className="text-indigo-600" />
                  Area Uji Coba Paste Zone Interaktif
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoPasteText(sampleTSVRows);
                      triggerToast('success', 'Contoh Data Dimuat', '4 baris data pagu unit UGM berhasil diisikan ke Paste Zone.');
                    }}
                    className="h-8 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-indigo-200 shadow-2xs"
                  >
                    <Sparkles size={13} className="text-indigo-600" />
                    <span>✨ Isi Contoh Format TSV (8 Kolom)</span>
                  </button>

                  {demoPasteText && (
                    <button
                      type="button"
                      onClick={() => setDemoPasteText('')}
                      className="h-8 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <X size={13} />
                      <span>Bersihkan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Paste Zone Component Layout */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-indigo-200/90 shadow-2xs flex flex-col md:flex-row items-stretch gap-3.5 bg-gradient-to-br from-white via-indigo-50/15 to-blue-50/20">
                <div className="min-w-[130px] flex flex-col items-center justify-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 text-center shrink-0">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs mb-2">
                    <FileSpreadsheet size={22} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-indigo-900 leading-tight">Paste Zone</p>
                  <span className="text-[9px] text-indigo-600 font-semibold mt-0.5">Excel Clipboard</span>
                  <span className="text-[8.5px] px-1.5 py-0.5 mt-2 rounded bg-indigo-100/80 text-indigo-700 font-mono font-bold">
                    8 Kolom TSV
                  </span>
                </div>

                <div className="flex-1 w-full space-y-1.5">
                  <textarea
                    rows={4}
                    value={demoPasteText}
                    onChange={(e) => setDemoPasteText(e.target.value)}
                    placeholder="COPY data baris tabel dari EXCEL (blok beberapa baris lalu Ctrl+C), kemudian PASTE (Ctrl+V) di sini...&#10;Format urutan kolom: [1] ID DB [TAB] [2] Nama Unit [TAB] [3] Tahun [TAB] [4] Nominal [TAB] [5] Sumber Dana [TAB] [6] Keterangan [TAB] [7] Status Pagu [TAB] [8] Jenis Anggaran"
                    className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl p-3.5 outline-none transition-all font-mono text-xs text-gray-800 placeholder:text-gray-400 placeholder:font-sans resize-none min-h-[105px] shadow-2xs leading-relaxed"
                  />
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
                    <span>Tekan <strong>Ctrl + V</strong> di dalam kotak untuk menempelkan data dari Excel</span>
                    <span className="font-mono">{demoPasteText.length} karakter • {parsedPasteRows.length} baris valid</span>
                  </div>
                </div>
              </div>

              {/* REAL-TIME PREVIEW & VALIDATION SUMMARY */}
              {parsedPasteRows.length > 0 && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Total Baris</span>
                      <span className="text-base font-black text-gray-900 font-mono">{parsedPasteRows.length} Baris</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Lolos Validasi</span>
                      <span className="text-base font-black text-emerald-800 font-mono">
                        {parsedPasteRows.filter(r => r.isValid).length} Baris
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">Perlu Koreksi</span>
                      <span className="text-base font-black text-amber-800 font-mono">
                        {parsedPasteRows.filter(r => !r.isValid).length} Baris
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-0.5">Total Nilai Pagu</span>
                      <span className="text-base font-black text-indigo-900 font-mono">
                        Rp {parsedPasteRows.reduce((s, r) => s + r.nominal, 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Realtime Table Preview */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
                    <div className="p-3 px-4 bg-gray-50/80 border-b border-gray-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-900">
                        Pratinjau Hasil Pembacaan Data ({parsedPasteRows.length} Baris Terurai dengan 8 Kolom Baku)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Siap Di-commit ke Database
                      </span>
                    </div>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3 text-center w-10">No</th>
                          <th className="py-2.5 px-3 w-16 text-center">Status</th>
                          <th className="py-2.5 px-3 w-20 font-mono">[1] ID DB</th>
                          <th className="py-2.5 px-3 font-mono">[2] Nama Unit</th>
                          <th className="py-2.5 px-3 w-16 font-mono text-center">[3] Tahun</th>
                          <th className="py-2.5 px-3 text-right w-36 font-mono">[4] Nominal</th>
                          <th className="py-2.5 px-3 w-28 font-mono">[5] Sumber Dana</th>
                          <th className="py-2.5 px-3 font-mono">[6] Keterangan</th>
                          <th className="py-2.5 px-3 text-center w-24 font-mono">[7] Status Pagu</th>
                          <th className="py-2.5 px-3 text-center w-28 font-mono">[8] Jenis Anggaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedPasteRows.map((row) => (
                          <tr key={row.id} className={row.isValid ? "hover:bg-indigo-50/20" : "bg-rose-50/40"}>
                            <td className="py-2 px-3 text-center font-mono font-bold text-gray-400 text-xs">
                              {row.lineNum}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  <CheckCircle2 size={11} /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-rose-700 text-[10px] font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" title={row.issues || ''}>
                                  <AlertCircle size={11} /> Cek
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-gray-500 text-[11px]">
                              {row.idDb}
                            </td>
                            <td className="py-2 px-3 font-semibold text-gray-900">
                              {row.namaUnit}
                            </td>
                            <td className="py-2 px-3 font-mono text-center text-gray-700 text-xs font-bold">
                              {row.tahun}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700 text-xs">
                              Rp {row.nominal.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                {row.sumberDana}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-gray-600 text-[11px] max-w-[200px] truncate" title={row.keterangan}>
                              {row.keterangan}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {row.statusPagu}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                {row.jenisAnggaran}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
      {/* TAB 4: TEMPLATE GRAFIK LENGKAP & INTERAKTIF (BAR, LINE, DONUT, GAUGE, DLL) */}
      {/* ========================================================================= */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          {/* Header & Interactive Control Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-blue-600 w-5 h-5" />
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                    Koleksi Template Grafik Baku & Interaktif
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                    Interaktif Realtime
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Katalog visualisasi data keuangan: Bar Komparasi, Tren Spline Bulanan, Donut Interaktif, Speedometer Slider, Waterfall Mutasi, Ranking Unit, dan Matriks Heatmap.
                </p>
              </div>

              {/* Quick Global Controls for Demo */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase px-1">Tahun:</span>
                {(['2026', '2025', '2024'] as const).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setChartYear(yr)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      chartYear === yr
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                    }`}
                  >
                    {yr}
                  </button>
                ))}

                <div className="h-4 w-px bg-gray-300 mx-1" />

                <span className="text-[10px] font-bold text-gray-400 uppercase px-1">Unit:</span>
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: 'fakultas', label: 'Fakultas' },
                    { id: 'pusat', label: 'Pusat' },
                  ] as const
                ).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setChartUnitFilter(u.id)}
                    className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      chartUnitFilter === u.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-white'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid 2 Kolom untuk Grafik Utama */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 1. INTERACTIVE GROUPED BAR CHART */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">1. Bar Chart: Pagu vs Realisasi per Unit</span>
                      <span className="text-[10px] text-gray-400">Tahun {chartYear} ({chartUnitData.length} unit)</span>
                    </div>
                  </div>

                  {/* Toggle series checkboxes */}
                  <div className="flex items-center gap-3 text-[11px]">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-blue-700">
                      <input
                        type="checkbox"
                        checked={showPaguBar}
                        onChange={(e) => setShowPaguBar(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span>Pagu</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-emerald-700">
                      <input
                        type="checkbox"
                        checked={showRealisasiBar}
                        onChange={(e) => setShowRealisasiBar(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-0"
                      />
                      <span>Realisasi</span>
                    </label>
                  </div>
                </div>

                {/* Bars List with Tooltip on Hover */}
                <div className="space-y-3 pt-1">
                  {chartUnitData.map((item, idx) => {
                    const isHovered = barHoveredIndex === idx;
                    const pct = Math.round((item.real / item.pagu) * 100);
                    return (
                      <div
                        key={item.unit}
                        onMouseEnter={() => setBarHoveredIndex(idx)}
                        onMouseLeave={() => setBarHoveredIndex(null)}
                        className={`p-2 rounded-xl transition-all ${
                          isHovered ? 'bg-white shadow-sm ring-1 ring-blue-200' : 'hover:bg-white/60'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[11px] font-semibold text-gray-700 mb-1">
                          <span className="font-bold">{item.unit}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[10px] text-gray-400">{pct}%</span>
                            <span className="text-blue-700 font-bold">Rp {item.real.toLocaleString()} Jt</span>
                          </div>
                        </div>

                        {/* Double Bar (Pagu & Realisasi) */}
                        <div className="space-y-1">
                          {showPaguBar && (
                            <div className="w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden flex" title={`Pagu: Rp ${item.pagu} Jt`}>
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (item.pagu / 3000) * 100)}%` }}
                              />
                            </div>
                          )}
                          {showRealisasiBar && (
                            <div className="w-full h-2.5 bg-gray-200/80 rounded-full overflow-hidden flex" title={`Realisasi: Rp ${item.real} Jt`}>
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (item.real / 3000) * 100)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Interactive Tooltip Card when hovered */}
                        {isHovered && (
                          <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 animate-in fade-in-50 duration-150">
                            <span>Target: <strong className="text-gray-800">{item.target}%</strong></span>
                            <span>Sisa Anggaran: <strong className="text-rose-600">Rp {(item.pagu - item.real).toLocaleString()} Jt</strong></span>
                            <span className="text-emerald-700 font-bold">Status: {pct >= item.target ? '✓ Memenuhi Target' : '⚠️ Dibawah Target'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. INTERACTIVE SPLINE AREA / LINE CHART (TREN BULANAN) */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">2. Tren Kumulatif Realisasi (Spline Area)</span>
                      <span className="text-[10px] text-gray-400">Target vs Aktual Tahun {chartYear}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Jan - Des (12 Bulan)
                  </span>
                </div>

                {/* SVG Spline Chart */}
                <div className="relative pt-4">
                  <svg className="w-full h-36 overflow-visible" viewBox="0 0 330 110">
                    <defs>
                      <linearGradient id="areaInteractiveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                      </linearGradient>
                      <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid horizontal lines */}
                    <line x1="0" y1="20" x2="330" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="0" y1="55" x2="330" y2="55" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="330" y2="90" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Area path for actual */}
                    <path
                      d="M 10 90 Q 50 82 90 70 T 170 48 T 250 25 T 320 12 L 320 90 L 10 90 Z"
                      fill="url(#areaInteractiveGrad)"
                    />

                    {/* Target line (Dashed Blue) */}
                    <path
                      d="M 10 88 Q 50 80 90 66 T 170 44 T 250 20 T 320 8"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    {/* Actual spline line (Emerald Solid) */}
                    <path
                      d="M 10 90 Q 50 82 90 70 T 170 48 T 250 25 T 320 12"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3"
                    />

                    {/* Interactive dots for months */}
                    {[
                      { x: 10, y: 90, idx: 0 },
                      { x: 65, y: 76, idx: 2 },
                      { x: 120, y: 62, idx: 4 },
                      { x: 175, y: 46, idx: 6 },
                      { x: 230, y: 30, idx: 8 },
                      { x: 285, y: 18, idx: 10 },
                      { x: 320, y: 12, idx: 11 },
                    ].map((pt) => {
                      const isSelected = hoveredMonthIdx === pt.idx;
                      return (
                        <g key={pt.idx} className="cursor-pointer" onClick={() => setHoveredMonthIdx(pt.idx)}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSelected ? 6 : 4}
                            className={`transition-all duration-200 ${
                              isSelected ? 'fill-emerald-600 stroke-white stroke-2' : 'fill-emerald-700 hover:scale-125'
                            }`}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Month Pill Selector & Legend */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-bold text-blue-600">
                        <span className="w-2.5 h-0.5 bg-blue-500 border border-blue-600" /> Target RKA
                      </span>
                      <span className="flex items-center gap-1 font-bold text-emerald-600">
                        <span className="w-2.5 h-1.5 bg-emerald-500 rounded-sm" /> Realisasi Aktual
                      </span>
                    </div>
                    <span>Klik bulan untuk melihat detail</span>
                  </div>

                  {/* Month Buttons */}
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-center">
                    {monthlyTrendData.map((d, i) => (
                      <button
                        key={d.m}
                        onClick={() => setHoveredMonthIdx(i)}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          hoveredMonthIdx === i
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white hover:bg-emerald-50 text-gray-600 border border-gray-100'
                        }`}
                      >
                        {d.m}
                      </button>
                    ))}
                  </div>

                  {/* Detail Snapshot Card */}
                  {hoveredMonthIdx !== null ? (
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in-50 duration-150">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Posisi Kumulatif Bulan:</span>
                        <strong className="block text-gray-800">{monthlyTrendData[hoveredMonthIdx]?.m} {chartYear}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-blue-600">Target: Rp {monthlyTrendData[hoveredMonthIdx]?.target} M</span>
                        <strong className="block text-emerald-700 font-mono text-sm">Aktual: Rp {monthlyTrendData[hoveredMonthIdx]?.actual} M</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-white/70 rounded-xl border border-gray-100 text-[11px] text-gray-400 text-center">
                      Total s.d. Des {chartYear}: <strong className="text-emerald-700">Rp 18,4 M</strong> (95,8% dari Target Rp 19,2 M)
                    </div>
                  )}
                </div>
              </div>

              {/* 3. INTERACTIVE DONUT & PIE COMPOSITION CHART */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart size={16} className="text-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">3. Donut: Komposisi Belanja Mata Anggaran</span>
                      <span className="text-[10px] text-gray-400">Klik kategori untuk rincian</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Total Rp 125,0 M
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-2">
                  {/* SVG Donut */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-gray-100" strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      {/* Slice 1: Pegawai 42% */}
                      <path
                        className={`transition-all duration-300 cursor-pointer ${activeDonutIndex === 0 ? 'opacity-100 stroke-[5.5]' : 'opacity-85 stroke-[4.5]'}`}
                        onClick={() => setActiveDonutIndex(0)}
                        stroke="#2563eb"
                        strokeDasharray="42, 100"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Slice 2: Barang/Jasa 33% */}
                      <path
                        className={`transition-all duration-300 cursor-pointer ${activeDonutIndex === 1 ? 'opacity-100 stroke-[5.5]' : 'opacity-85 stroke-[4.5]'}`}
                        onClick={() => setActiveDonutIndex(1)}
                        stroke="#10b981"
                        strokeDasharray="33, 100"
                        strokeDashoffset="-42"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Slice 3: Modal 18% */}
                      <path
                        className={`transition-all duration-300 cursor-pointer ${activeDonutIndex === 2 ? 'opacity-100 stroke-[5.5]' : 'opacity-85 stroke-[4.5]'}`}
                        onClick={() => setActiveDonutIndex(2)}
                        stroke="#9333ea"
                        strokeDasharray="18, 100"
                        strokeDashoffset="-75"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Slice 4: Hibah 7% */}
                      <path
                        className={`transition-all duration-300 cursor-pointer ${activeDonutIndex === 3 ? 'opacity-100 stroke-[5.5]' : 'opacity-85 stroke-[4.5]'}`}
                        onClick={() => setActiveDonutIndex(3)}
                        stroke="#f59e0b"
                        strokeDasharray="7, 100"
                        strokeDashoffset="-93"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center flex flex-col items-center">
                      <span className="text-base font-black text-gray-900 font-mono leading-none">
                        {donutCategories[activeDonutIndex]?.percent}%
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Proporsi</span>
                    </div>
                  </div>

                  {/* Interactive Legend List */}
                  <div className="space-y-1.5 flex-1 w-full">
                    {donutCategories.map((cat, idx) => {
                      const isSelected = activeDonutIndex === idx;
                      return (
                        <div
                          key={cat.label}
                          onClick={() => setActiveDonutIndex(idx)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-white border-purple-300 shadow-xs ring-1 ring-purple-100'
                              : 'bg-white/50 border-gray-100 hover:bg-white text-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${cat.color} shrink-0`} />
                            <div>
                              <span className="font-bold text-gray-800 block text-[11px]">{cat.label}</span>
                              <span className="text-[10px] text-gray-400">{cat.desc}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-gray-900 text-[11px] block">{cat.nominal}</span>
                            <span className="text-[10px] font-bold text-purple-700 font-mono">{cat.percent}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. INTERACTIVE GAUGE / SPEEDOMETER DENGAN RANGE SLIDER */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">4. Gauge: Capaian Kinerja (Interactive Slider)</span>
                      <span className="text-[10px] text-gray-400">Geser slider atau pilih preset</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${
                    chartGaugeVal >= 80
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : chartGaugeVal >= 60
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {chartGaugeVal >= 80 ? 'Target Tercapai' : chartGaugeVal >= 60 ? 'Mendekati Target' : 'Perlu Evaluasi'}
                  </span>
                </div>

                {/* Speedometer Gauge Visual */}
                <div className="flex flex-col items-center justify-center pt-1">
                  <div className="relative w-44 h-24 overflow-hidden flex items-end justify-center">
                    {/* Background track */}
                    <div className="w-44 h-44 rounded-full border-[16px] border-gray-100 transform -rotate-45" />

                    {/* Colored Fill */}
                    <div
                      className={`absolute w-44 h-44 rounded-full border-[16px] border-transparent transition-all duration-300 ${
                        chartGaugeVal >= 80
                          ? 'border-t-emerald-500 border-r-emerald-500'
                          : chartGaugeVal >= 60
                          ? 'border-t-amber-500 border-r-amber-500'
                          : 'border-t-rose-500 border-r-rose-500'
                      }`}
                      style={{
                        transform: `rotate(${-45 + (chartGaugeVal / 100) * 180}deg)`,
                      }}
                    />

                    {/* Center Display Value */}
                    <div className="absolute bottom-0 text-center">
                      <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                        {chartGaugeVal.toFixed(1)}%
                      </span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase">
                        Realisasi Fisik & Anggaran
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between w-full text-[10px] text-gray-400 font-mono px-4 pt-1">
                    <span>0% (Awal)</span>
                    <span className="font-bold text-amber-600">60% Waspada</span>
                    <span className="font-bold text-emerald-600">80% Target</span>
                    <span>100%</span>
                  </div>

                  {/* Interactive Slider Input */}
                  <div className="w-full space-y-2 pt-3 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Simulasi Slider:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={chartGaugeVal}
                        onChange={(e) => setChartGaugeVal(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <span className="font-mono text-xs font-bold text-gray-800 w-12 text-right">
                        {chartGaugeVal}%
                      </span>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      {[
                        { label: '50% (Kritis)', val: 50 },
                        { label: '74% (Sedang)', val: 74.2 },
                        { label: '85% (Optimal)', val: 85 },
                        { label: '98% (Sempurna)', val: 98 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          onClick={() => setChartGaugeVal(preset.val)}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white hover:bg-blue-50 text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 3 Kolom untuk Grafik Tambahan (Waterfall, Ranking Bar, Heatmap) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 5. WATERFALL CHART (VARIANCE BRIDGE) */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Scale size={15} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-800">5. Waterfall: Mutasi Pagu</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                    Miliar Rp
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {waterfallData.map((w, idx) => {
                    const isPositive = w.amount > 0 && w.type !== 'base' && w.type !== 'total';
                    const isNegative = w.amount < 0;
                    return (
                      <div key={w.label} className="p-1.5 rounded-lg bg-white border border-gray-100 text-xs hover:border-blue-200 transition-all">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-gray-700">{w.label}</span>
                          <span className={`font-mono font-bold ${
                            isNegative ? 'text-rose-600' : isPositive ? 'text-emerald-600' : 'text-blue-700'
                          }`}>
                            {isPositive ? `+${w.amount}` : w.amount} M
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1 flex">
                          <div
                            className={`h-full rounded-full ${
                              w.type === 'base' || w.type === 'total'
                                ? 'bg-blue-600'
                                : isNegative
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (Math.abs(w.amount) / 120) * 100)}%` }}
                          />
                        </div>
                        <span className="block text-[9.5px] text-gray-400 mt-1 truncate">{w.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. HORIZONTAL RANKING BAR CHART */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={15} className="text-emerald-600" />
                    <span className="text-xs font-bold text-gray-800">6. Ranking Serapan Unit</span>
                  </div>
                  <button
                    onClick={() => setSortRankingAsc(!sortRankingAsc)}
                    className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {sortRankingAsc ? '▲ Terendah' : '▼ Tertinggi'}
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {rankingData.map((r, i) => (
                    <div key={r.unit} className="p-1.5 rounded-lg bg-white border border-gray-100 text-xs">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                            i === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {i + 1}
                          </span>
                          <span className="font-bold text-gray-800 truncate">{r.unit}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-700 shrink-0">{r.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300"
                          style={{ width: `${r.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. HEATMAP MATRIX PENYERAPAN ANGGARAN */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Layers size={15} className="text-indigo-600" />
                    <span className="text-xs font-bold text-gray-800">7. Heatmap: Triwulan x Klaster</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    Matrix Q1-Q4
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-gray-400 text-center uppercase">
                    <span className="text-left">Klaster</span>
                    <span>Q1</span>
                    <span>Q2</span>
                    <span>Q3</span>
                    <span>Q4</span>
                  </div>

                  {heatmapMatrix.map((row) => (
                    <div key={row.cluster} className="grid grid-cols-5 gap-1 items-center">
                      <span className="text-[10px] font-semibold text-gray-700 truncate" title={row.cluster}>
                        {row.cluster.split(' ')[1] || row.cluster}
                      </span>
                      {[row.q1, row.q2, row.q3, row.q4].map((val, qIdx) => {
                        const intensity =
                          val >= 90 ? 'bg-emerald-600 text-white font-bold' :
                          val >= 80 ? 'bg-emerald-400 text-emerald-950 font-bold' :
                          val >= 70 ? 'bg-emerald-200 text-emerald-900' :
                          'bg-emerald-100 text-emerald-800';
                        return (
                          <div
                            key={qIdx}
                            className={`p-1 rounded text-center text-[10px] font-mono transition-transform hover:scale-110 cursor-pointer ${intensity}`}
                            title={`Q${qIdx + 1}: ${val}%`}
                          >
                            {val}%
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                    <span>Warna: Semakin pekat = Serapan tinggi</span>
                    <span className="text-emerald-700 font-bold">&gt;90% Optimal</span>
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

            {/* Gaya 5: Tambah Pagu & Mutasi Suite 3-Column Navigation Grid (Baru) */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Gaya 5: Tambah Pagu & Mutasi Suite (3 Tombol per Baris, Sisanya di Baris Berikutnya)
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Resmi: /tambah-pagu, /tambah, /komparasi, /analisis, /potret-mutasi-pagu, /copas-pagu
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                      className={`flex items-center gap-3 p-2.5 px-3.5 rounded-xl font-bold text-xs select-none border min-h-[48px] transition-all ${
                        item.active
                          ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 ring-1 ring-blue-500/40 scale-[1.01]'
                          : 'bg-white text-slate-700 border-slate-200/90'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        item.active ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col items-start min-w-0 pr-1 gap-0.5">
                        <span className="line-clamp-1 font-bold tracking-tight text-[12.5px] leading-tight">
                          {item.title}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider leading-none ${
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
      {/* ========================================================================= */}
      {/* TAB 6: EDITOR & STANDAR UKURAN GAMBAR                                     */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* BAGIAN 1: TEMPLATE EDITOR DOKUMEN & NASKAH DINAS RESMI */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={17} className="text-blue-600" />
                  <span>Template Editor Dokumen &amp; Naskah Dinas Keuangan</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Toolbar komponen penulisan naskah dinas, dokumen SPJ, tabel perincian anggaran, daftar bullet &amp; nomor, serta checklist verifikasi.
                </p>
              </div>

              {/* Mode Switcher: Raw Editor vs Rich Document Preview */}
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEditorMode('edit')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorMode === 'edit'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Pencil size={13} />
                  <span>Mode Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    editorMode === 'preview'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Eye size={13} />
                  <span>Pratinjau Naskah Dinas</span>
                </button>
              </div>
            </div>

            {/* Editor Container */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {/* Rich Format Toolbar */}
              <div className="bg-slate-50/95 border-b border-gray-200 p-2.5 flex items-center gap-1 flex-wrap select-none">
                {/* 1. History Group */}
                <div className="flex items-center gap-0.5">
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Undo (Batalkan)"><Undo2 size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Redo (Ulangi)"><Redo2 size={14} /></button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* 2. Text Formatting Group */}
                <div className="flex items-center gap-0.5">
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-800 font-black cursor-pointer transition-colors" title="Tebal (Bold)"><Bold size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 italic cursor-pointer transition-colors" title="Miring (Italic)"><Italic size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 underline cursor-pointer transition-colors" title="Garis Bawah (Underline)"><Underline size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Coret Teks (Strikethrough)"><Strikethrough size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-indigo-700 cursor-pointer transition-colors font-mono" title="Kode / Format Akun Monospace"><Code size={14} /></button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* 3. Heading & Typography Group */}
                <div className="flex items-center gap-0.5">
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Judul Utama (H1)"><Heading1 size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Sub Judul (H2)"><Heading2 size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Teks Normal / Paragraf"><Type size={14} /></button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* 4. Lists & Checkbox Group (Sesuai Permintaan User: Bullet & List) */}
                <div className="flex items-center gap-0.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditorContent(prev => prev + '\n\n• Poin Ketentuan Baru: Verifikasi kelengkapan bukti transaksi');
                      triggerToast('info', 'Editor Dokumen', 'Poin Bullet disisipkan');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-blue-700 font-bold cursor-pointer transition-colors flex items-center gap-1" 
                    title="Daftar Poin (Bullet List)"
                  >
                    <List size={15} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditorContent(prev => prev + '\n\n1. Tahap Pertama: Pengajuan nota dinas oleh unit pemohon\n2. Tahap Kedua: Verifikasi kelayakan oleh tim anggaran');
                      triggerToast('info', 'Editor Dokumen', 'Daftar Nomor disisipkan');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-indigo-700 font-bold cursor-pointer transition-colors" 
                    title="Daftar Nomor (Numbered List)"
                  >
                    <ListOrdered size={15} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditorContent(prev => prev + '\n\n[x] Kelengkapan Surat Tugas (SPT)\n[x] Kuitansi asli bertanda tangan bendahara\n[ ] Bukti potong pajak PPh');
                      triggerToast('info', 'Editor Dokumen', 'Daftar Ceklis disisipkan');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-emerald-700 cursor-pointer transition-colors" 
                    title="Daftar Ceklis / Tugas (Checklist)"
                  >
                    <CheckSquare size={14} />
                  </button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* 5. Table & Structured Elements Group (Sesuai Permintaan User: Table) */}
                <div className="flex items-center gap-0.5">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditorContent(prev => prev + '\n\n| Kode MAK | Uraian Mata Anggaran | Pagu (Rp) | Realisasi (Rp) |\n| 521211 | Belanja Bahan Praktikum | 450.000.000 | 310.000.000 |\n| 521213 | Honorarium Narasumber | 180.000.000 | 120.000.000 |');
                      triggerToast('info', 'Editor Dokumen', 'Template Tabel Anggaran disisipkan');
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shadow-2xs" 
                    title="Sisipkan Tabel Data Keuangan"
                  >
                    <TableIcon size={14} className="text-emerald-700" />
                    <span className="hidden md:inline text-[11px]">Tabel</span>
                  </button>

                  <button 
                    type="button" 
                    onClick={() => {
                      setEditorContent(prev => prev + '\n\n> "Catatan Verifikator: Seluruh dokumen pendukung telah diperiksa dan disetujui sesuai pagu DIPA."');
                      triggerToast('info', 'Editor Dokumen', 'Kutipan Catatan disisipkan');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-amber-700 cursor-pointer transition-colors" 
                    title="Kutipan / Catatan Khusus (Blockquote)"
                  >
                    <Quote size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditorContent(prev => prev + '\n\n---\n');
                      triggerToast('info', 'Editor Dokumen', 'Garis Pemisah disisipkan');
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 cursor-pointer transition-colors" 
                    title="Garis Pemisah Horisontal"
                  >
                    <Minus size={14} />
                  </button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* 6. Alignment Group */}
                <div className="flex items-center gap-0.5">
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Rata Kiri"><AlignLeft size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Rata Tengah"><AlignCenter size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Rata Kanan"><AlignRight size={14} /></button>
                  <button type="button" className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" title="Rata Kanan-Kiri (Justify)"><AlignJustify size={14} /></button>
                </div>

                <div className="w-px h-4 bg-gray-300 mx-1" />

                {/* 7. Media, Lampiran & Highlight */}
                <div className="flex items-center gap-0.5">
                  <button 
                    type="button" 
                    onClick={() => triggerToast('info', 'Media', 'Dialog unggah gambar/nota disimulasikan')}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" 
                    title="Sisipkan Foto / Nota Transaksi"
                  >
                    <ImageIcon size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => triggerToast('info', 'Tautan', 'Dialog sisipkan link dokumen')}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-blue-700 cursor-pointer transition-colors" 
                    title="Sisipkan Tautan (Link)"
                  >
                    <LinkIcon size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => triggerToast('info', 'Lampiran', 'Dialog sisipkan berkas SPJ')}
                    className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-700 cursor-pointer transition-colors" 
                    title="Lampirkan Dokumen Pendukung"
                  >
                    <Paperclip size={14} />
                  </button>
                  <button 
                    type="button" 
                    className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 cursor-pointer transition-colors" 
                    title="Sorotan Stabilo Kuning (Highlight)"
                  >
                    <Highlighter size={14} />
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Auto-Save On
                  </span>
                </div>
              </div>

              {/* Quick Template Injection Pills */}
              <div className="bg-slate-100/70 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-gray-400 font-bold shrink-0 text-[10px] uppercase tracking-wider mr-1">Template Cepat:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditorContent(prev => prev + '\n\n| No | Kode MAK | Uraian Kegiatan Belanja | Pagu (Rp) | Realisasi (Rp) | Status |\n| 1 | 521211 | Belanja Bahan Kimia Praktikum | 450.000.000 | 310.000.000 | Disetujui |\n| 2 | 521213 | Honor Narasumber Seminar & Reviewer | 180.000.000 | 120.000.000 | Proses |');
                    triggerToast('success', 'Tabel Disisipkan', 'Format tabel perincian anggaran telah ditambahkan ke dokumen.');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <TableIcon size={12} className="text-emerald-700" />
                  <span>+ Tabel Anggaran MAK</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorContent(prev => prev + '\n\n• Poin 1: Wajib melampirkan kuitansi dan faktur pajak PPh 21/23\n• Poin 2: Verifikasi bukti transfer bank rekening penyedia\n• Poin 3: Berita acara serah terima pekerjaan (BAST) bertanda tangan');
                    triggerToast('success', 'Bullet Disisipkan', 'Daftar poin ketentuan telah ditambahkan.');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 font-bold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <List size={12} className="text-blue-700" />
                  <span>+ Poin Ketentuan (Bullet)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorContent(prev => prev + '\n\n1. Pemohon mengajukan berkas usulan melalui portal verifikasi\n2. Verifikator memeriksa kelengkapan SPJ dalam 2 hari kerja\n3. Bendahara memproses pemindahbukuan ke rekening bank');
                    triggerToast('success', 'Nomor Disisipkan', 'Tahapan nomor terurut telah ditambahkan.');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <ListOrdered size={12} className="text-indigo-700" />
                  <span>+ Urutan Tahapan (Numbered)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorContent(prev => prev + '\n\n[x] Surat Perintah Kerja (SPK) Nomor: 042/FT/2026\n[x] Faktur Pajak Elektronik e-Faktur tervalidasi\n[ ] Berita Acara Pemeriksaan Barang (BAPB)\n[ ] Foto dokumentasi fisik serah terima alat');
                    triggerToast('success', 'Ceklis Disisipkan', 'Daftar ceklis verifikasi telah ditambahkan.');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 font-bold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <CheckSquare size={12} className="text-purple-700" />
                  <span>+ Ceklis Kelengkapan SPJ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditorContent(prev => prev + '\n\n> "PERHATIAN: Pengeluaran di atas Rp 100.000.000,- wajib melalui penelaahan PPK dan Pejabat Pengadaan Barang/Jasa."');
                    triggerToast('success', 'Kutipan Disisipkan', 'Callout catatan penting telah ditambahkan.');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Quote size={12} className="text-amber-700" />
                  <span>+ Catatan Disposisi (Quote)</span>
                </button>
              </div>

              {/* Editor Workspace View */}
              {editorMode === 'edit' ? (
                <div className="p-4 md:p-6 bg-slate-100/70 min-h-[280px] flex justify-center">
                  <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
                    <textarea
                      rows={12}
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      placeholder="Ketik isi naskah dinas, dokumen usulan anggaran, atau catatan verifikasi di sini..."
                      className="w-full text-xs text-gray-800 leading-relaxed font-sans focus:outline-none resize-y min-h-[220px]"
                    />
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                      <div>
                        <span>{editorContent.length} Karakter</span> &bull; <span>{editorContent.trim().split(/\s+/).filter(Boolean).length} Kata</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(editorContent);
                            triggerToast('success', 'Disalin', 'Seluruh teks dokumen berhasil disalin ke clipboard.');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer transition-colors"
                        >
                          Salin Naskah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode Pratinjau Naskah Dinas Resmi (Letterhead Preview) */
                <div className="p-4 md:p-8 bg-slate-100/80 min-h-[360px] flex justify-center">
                  <div className="w-full max-w-3xl bg-white border border-gray-300 rounded-xl p-8 shadow-md space-y-6 font-sans text-xs text-gray-900">
                    {/* Kop Surat Resmi Universitas Gadjah Mada */}
                    <div className="border-b-2 border-black pb-3 text-center space-y-1">
                      <div className="text-[11px] font-bold text-gray-700 tracking-wider">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</div>
                      <div className="text-base font-black text-black tracking-wide">UNIVERSITAS GADJAH MADA</div>
                      <div className="text-xs font-bold text-gray-900">DIREKTORAT KEUANGAN</div>
                      <div className="text-[10px] text-gray-600">Gedung Pusat Sayap Selatan Bulaksumur Yogyakarta 55281 | Telepon: (0274) 588688 | Laman: www.ugm.ac.id</div>
                      <div className="w-full border-t border-black mt-2 pt-0.5"></div>
                    </div>

                    {/* Metadata Naskah */}
                    <div className="flex justify-between items-start text-xs">
                      <div className="space-y-1 font-medium">
                        <div><span className="font-bold w-20 inline-block">Nomor</span>: 1420/UN1.P.IV/DIR-KEU/2026</div>
                        <div><span className="font-bold w-20 inline-block">Sifat</span>: Penting &amp; Segera</div>
                        <div><span className="font-bold w-20 inline-block">Lampiran</span>: 1 (satu) Berkas Rincian MAK</div>
                        <div><span className="font-bold w-20 inline-block">Hal</span>: Petunjuk Pelaksanaan Realisasi Belanja &amp; Verifikasi SPJ</div>
                      </div>
                      <div className="text-right text-gray-600">
                        Yogyakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Alamat Penerima */}
                    <div className="space-y-0.5">
                      <p className="font-medium">Yth. Pimpinan Fakultas, Sekolah, dan Unit Kerja</p>
                      <p className="font-medium">Di Lingkungan Universitas Gadjah Mada</p>
                      <p className="font-medium">Yogyakarta</p>
                    </div>

                    {/* Isi Dokumen Terformat */}
                    <div className="space-y-3.5 leading-relaxed text-justify">
                      <p>
                        Bersama ini kami sampaikan petunjuk teknis penyesuaian usulan pagu anggaran serta mekanisme verifikasi pertanggungjawaban belanja semester berjalan bagi seluruh unit kerja di lingkungan Universitas Gadjah Mada.
                      </p>

                      {/* Contoh Bullet List Terformat */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Ketentuan Utama Pelaksanaan Belanja:</span>
                        <ul className="space-y-1 text-slate-700 pl-4 list-disc">
                          <li>Seluruh transaksi belanja wajib mencantumkan kode Mata Anggaran Kegiatan (MAK) yang valid dan sesuai peruntukan.</li>
                          <li>Pembayaran di atas Rp 50.000.000,- wajib melampirkan berkas SPK dan berita acara serah terima (BAST) fisik.</li>
                          <li>Pengajuan verifikasi SPJ selambat-lambatnya diajukan pada tanggal 25 setiap bulannya ke loket Direktorat Keuangan.</li>
                        </ul>
                      </div>

                      {/* Contoh Tabel Rincian Data Keuangan */}
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Tabel Ringkasan Alokasi Pagu MAK Prioritas:</span>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 border-b border-gray-200 text-slate-700 font-bold text-[11px]">
                                <th className="py-2 px-3">Kode MAK</th>
                                <th className="py-2 px-3">Uraian Mata Anggaran Kegiatan</th>
                                <th className="py-2 px-3 text-right">Pagu (Rp)</th>
                                <th className="py-2 px-3 text-right">Realisasi (Rp)</th>
                                <th className="py-2 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              <tr>
                                <td className="py-2 px-3 font-mono font-bold text-indigo-700">521211</td>
                                <td className="py-2 px-3">Belanja Bahan Praktikum Laboratorium &amp; Kimia</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">Rp 450.000.000</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">Rp 310.000.000</td>
                                <td className="py-2 px-3 text-center"><StatusBadge status="disetujui" /></td>
                              </tr>
                              <tr className="bg-slate-50/50">
                                <td className="py-2 px-3 font-mono font-bold text-indigo-700">521213</td>
                                <td className="py-2 px-3">Honorarium Narasumber Seminar &amp; Reviewer Paper</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">Rp 180.000.000</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">Rp 120.000.000</td>
                                <td className="py-2 px-3 text-center"><StatusBadge status="proses" /></td>
                              </tr>
                              <tr>
                                <td className="py-2 px-3 font-mono font-bold text-indigo-700">532111</td>
                                <td className="py-2 px-3">Pengadaan Spektrofotometer Dual-Beam Presisi</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">Rp 850.000.000</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">Rp 850.000.000</td>
                                <td className="py-2 px-3 text-center"><StatusBadge status="disetujui" /></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Contoh Callout / Catatan Disposisi (Blockquote) */}
                      <blockquote className="p-3 bg-amber-50/90 border-l-4 border-amber-500 rounded-r-xl text-amber-950 font-medium italic flex items-start gap-2">
                        <Quote size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          &quot;Catatan Khusus: Pastikan seluruh bukti kuitansi bertanda tangan basah dan telah divalidasi oleh Pejabat Pembuat Komitmen (PPK) sebelum diajukan ke bendahara pengeluaran.&quot;
                        </span>
                      </blockquote>

                      <p>
                        Demikian petunjuk pelaksanaan ini kami sampaikan untuk menjadi pedoman bersama. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.
                      </p>
                    </div>

                    {/* Tanda Tangan Resmi */}
                    <div className="pt-6 flex justify-end">
                      <div className="text-center w-64 space-y-14">
                        <div>
                          <p className="font-bold">Direktur Keuangan</p>
                          <p className="text-[10px] text-gray-500">Universitas Gadjah Mada</p>
                        </div>
                        <div>
                          <p className="font-bold underline text-black">Prof. Dr. Ir. Syaiful Anwar, M.Si.</p>
                          <p className="text-[10px] text-gray-600 font-mono">NIP 19680312 199303 1 002</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BAGIAN 2: STANDAR SPEKTRUM UKURAN AVATAR / PIC (7 TINGKATAN: XS s/d 3XL TERMASUK UKURAN BESAR & EKSTRA BESAR) */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Users size={17} className="text-indigo-600" />
                  <span>Spektrum Standar Ukuran Avatar / PIC Pengguna &amp; Verifikator</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Standar dimensi visual foto profil pengguna, verifikator, dan PIC kegiatan mulai dari ukuran terkecil di tabel hingga ukuran ekstra besar (ID card &amp; SK).
                </p>
              </div>

              {/* Avatar Shape Toggle: Circle vs Squircle */}
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveAvatarShape('circle')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeAvatarShape === 'circle' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bulat (Circle)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAvatarShape('square')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeAvatarShape === 'square' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Squircle (Rounded-2xl)
                </button>
              </div>
            </div>

            {/* Grid 7 Ukuran Avatar Komprehensif (Termasuk Ukuran Besar & Ekstra Besar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5 pt-2">
              {/* 1. XS (24px) */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2 hover:bg-slate-100/70 transition-colors">
                <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  XS (24px)
                </span>
                <div className={`w-6 h-6 ${activeAvatarShape === 'circle' ? 'rounded-full' : 'rounded-md'} bg-blue-600 text-white flex items-center justify-center font-bold text-[9px] shadow-2xs relative`}>
                  <span>BW</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white"></span>
                </div>
                <div>
                  <span className="block text-xs font-black text-slate-800">24 &times; 24 px</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">Tabel Baris, Audit Log, Tag Komentar</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-6 h-6</code>
              </div>

              {/* 2. SM (32px) */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2 hover:bg-slate-100/70 transition-colors">
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  SM (32px)
                </span>
                <div className={`w-8 h-8 ${activeAvatarShape === 'circle' ? 'rounded-full' : 'rounded-lg'} bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shadow-2xs relative`}>
                  <span>BW</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div>
                  <span className="block text-xs font-black text-slate-800">32 &times; 32 px</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">Header Topbar, Dropdown User, Chat</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-8 h-8</code>
              </div>

              {/* 3. MD (40px) - Standar */}
              <div className="bg-blue-50/40 p-3.5 rounded-2xl border border-blue-200 flex flex-col items-center justify-between text-center gap-2 hover:bg-blue-50/70 transition-colors">
                <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full shadow-2xs">
                  MD (40px) &bull; Standar
                </span>
                <div className={`w-10 h-10 ${activeAvatarShape === 'circle' ? 'rounded-full' : 'rounded-xl'} bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs relative`}>
                  <span>BW</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div>
                  <span className="block text-xs font-black text-slate-900">40 &times; 40 px</span>
                  <span className="text-[10px] text-slate-600 leading-tight block mt-0.5">Kartu PIC, Form Usulan, List Verifikator</span>
                </div>
                <code className="text-[9px] font-mono text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">w-10 h-10</code>
              </div>

              {/* 4. LG (56px) - Sedang */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2 hover:bg-slate-100/70 transition-colors">
                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  LG (56px)
                </span>
                <div className={`w-14 h-14 ${activeAvatarShape === 'circle' ? 'rounded-full' : 'rounded-xl'} bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-xs relative`}>
                  <span>BW</span>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div>
                  <span className="block text-xs font-black text-slate-800">56 &times; 56 px</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">Modal Dialog Approval, Drawer Detail</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-14 h-14</code>
              </div>

              {/* 5. XL (72px) - Agak Besar */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2 hover:bg-slate-100/70 transition-colors">
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  XL (72px)
                </span>
                <div className={`w-[72px] h-[72px] ${activeAvatarShape === 'circle' ? 'rounded-full' : 'rounded-2xl'} bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center font-black text-lg shadow-sm relative`}>
                  <span>BW</span>
                  <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div>
                  <span className="block text-xs font-black text-slate-800">72 &times; 72 px</span>
                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">Ringkasan Profil Pengguna, Card Tim</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-[72px] h-[72px]</code>
              </div>

              {/* 6. 2XL (96px) - Ukuran Besar (Requested!) */}
              <div className="bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200 flex flex-col items-center justify-between text-center gap-2 hover:bg-emerald-50/70 transition-colors">
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                  2XL (96px) &bull; Besar
                </span>
                <div className={`w-24 h-24 ${activeAvatarShape === 'circle' ? 'rounded-full' : 'rounded-2xl'} bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-2xl shadow-md relative`}>
                  <span>BW</span>
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                    <Check size={11} className="text-white font-bold" />
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-black text-emerald-950">96 &times; 96 px</span>
                  <span className="text-[10px] text-slate-600 leading-tight block mt-0.5">Halaman Akun Pengguna (/users), ID Card</span>
                </div>
                <code className="text-[9px] font-mono text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">w-24 h-24</code>
              </div>

              {/* 7. 3XL (128px) - Ukuran Ekstra Besar (Requested!) */}
              <div className="bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-200 flex flex-col items-center justify-between text-center gap-2 hover:bg-indigo-50/70 transition-colors">
                <span className="text-[10px] font-black uppercase text-indigo-900 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full shadow-2xs">
                  3XL (128px) &bull; Ekstra Besar
                </span>
                <div className={`w-32 h-32 ${activeAvatarShape === 'circle' ? 'rounded-full' : 'rounded-3xl'} bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white flex flex-col items-center justify-center shadow-lg relative border-2 border-indigo-300/50`}>
                  <span className="text-3xl font-black tracking-wider">BW</span>
                  <span className="text-[9px] uppercase tracking-widest text-indigo-200 font-bold mt-0.5">Verifikator</span>
                  <span className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                    <ShieldCheck size={14} className="text-white" />
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-black text-indigo-950">128 &times; 128 px</span>
                  <span className="text-[10px] text-slate-600 leading-tight block mt-0.5">Pasfoto SK Rektor, Biodata Resmi, Cetak ID</span>
                </div>
                <code className="text-[9px] font-mono text-indigo-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200">w-32 h-32</code>
              </div>
            </div>
          </div>

          {/* BAGIAN 3: STANDAR UKURAN GAMBAR BUKTI TRANSAKSI, NOTA, DOKUMEN & SPANDUK */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={17} className="text-emerald-600" />
                <span>Standar Ukuran Menampilkan Bukti Transaksi, Nota &amp; Dokumen</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Rasio aspek standar untuk foto kuitansi kasir, struk transfer ATM, berkas lembar SPJ A4, dan dokumentasi foto kegiatan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* 1. Thumbnail Mini Bukti (64x64) */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  Rasio 1:1
                </span>
                <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center text-indigo-700 shadow-2xs p-1">
                  <FileText size={20} className="mb-0.5" />
                  <span className="text-[10px] font-black font-mono">64 &times; 64</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-800">Thumbnail Struk</span>
                  <span className="text-[10px] text-gray-500">Tabel Mutasi &amp; Buku Kas</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-16 h-16</code>
              </div>

              {/* 2. Thumbnail Sedang Nota (96x96) */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  Rasio 1:1
                </span>
                <div className="w-24 h-24 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-blue-700 shadow-2xs p-1">
                  <Camera size={24} className="mb-1 text-blue-600" />
                  <span className="text-[10px] font-black font-mono">96 &times; 96</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-800">Preview Nota</span>
                  <span className="text-[10px] text-gray-500">Drawer Rincian SPJ</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-24 h-24</code>
              </div>

              {/* 3. Struk & Nota Vertikal (120x160 - Rasio 3:4) */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  Rasio 3:4 (Thermal)
                </span>
                <div className="w-28 h-36 rounded-xl bg-white border border-gray-300 flex flex-col items-center justify-between p-2 shadow-2xs text-gray-600 font-mono text-[9px]">
                  <div className="border-b border-gray-200 w-full pb-1 text-center font-bold text-gray-800">STRUK KASIR</div>
                  <div className="space-y-0.5 w-full text-left text-[8px] text-gray-500">
                    <div>TRX: #84920</div>
                    <div>Item: Reagen x3</div>
                    <div className="font-bold text-gray-800">Rp 125.000.000</div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 w-full pt-1 text-[8px] text-center text-gray-400">LUNAS BANK</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-800">Struk ATM / EDC</span>
                  <span className="text-[10px] text-gray-500">Bukti Transfer Kasir</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-28 h-36</code>
              </div>

              {/* 4. Berkas Surat & SPJ (140x190 - Rasio A4) */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  Rasio A4 (1:1.41)
                </span>
                <div className="w-32 h-44 rounded-xl bg-white border-2 border-indigo-200 flex flex-col items-center justify-between p-2.5 shadow-2xs text-gray-700">
                  <div className="w-full text-center border-b border-gray-200 pb-1">
                    <span className="font-bold text-[9px] text-indigo-900 block">SURAT TUGAS</span>
                    <span className="text-[7.5px] text-gray-400">No. 102/UN1/2026</span>
                  </div>
                  <div className="w-full space-y-1 py-1">
                    <div className="h-1 bg-gray-200 rounded w-full"></div>
                    <div className="h-1 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="w-full flex justify-end">
                    <div className="w-10 h-3 bg-indigo-50 border border-indigo-200 rounded text-[7px] text-center text-indigo-700 font-bold">TTD BASAH</div>
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-800">Berkas Surat &amp; SPJ</span>
                  <span className="text-[10px] text-gray-500">Miniatur Lembar Dokumen</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-32 h-44</code>
              </div>

              {/* 5. Foto Kegiatan / Banner (240x135 - Rasio 16:9 Lanskap) */}
              <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between text-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  Rasio 16:9 (Lanskap)
                </span>
                <div className="w-44 h-24 rounded-xl bg-gradient-to-tr from-slate-800 via-indigo-950 to-blue-900 border border-slate-700 flex flex-col items-center justify-center p-2 shadow-2xs text-white">
                  <ImageIcon size={22} className="text-blue-400 mb-1" />
                  <span className="text-[10px] font-bold text-center">Dokumentasi Lapangan</span>
                  <span className="text-[8px] text-blue-200">Workshop &amp; Pelatihan CNC</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-800">Foto Kegiatan</span>
                  <span className="text-[10px] text-gray-500">Arsip Foto &amp; Spanduk</span>
                </div>
                <code className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">w-44 h-24</code>
              </div>

              {/* 6. Modal Lightbox Fullscreen Simulation */}
              <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200 flex flex-col items-center justify-between text-center gap-2">
                <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-md shadow-2xs">
                  Resolusi Penuh (90vh)
                </span>
                <button
                  type="button"
                  onClick={() => setShowLightboxModal(true)}
                  className="w-40 h-24 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center p-2 shadow-sm hover:from-blue-700 hover:to-indigo-800 transition-all cursor-pointer group"
                >
                  <ZoomIn size={22} className="mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black">Buka Lightbox</span>
                  <span className="text-[9px] text-blue-100">Klik untuk Simulasi</span>
                </button>
                <div>
                  <span className="block text-xs font-bold text-gray-900">Modal Lightbox</span>
                  <span className="text-[10px] text-gray-500">Zoom In/Out, Rotate, Download</span>
                </div>
                <code className="text-[9px] font-mono text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">Max 90vh Screen</code>
              </div>
            </div>
          </div>

          {/* SIMULASI MODAL LIGHTBOX INTERAKTIF */}
          {showLightboxModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-0">
                {/* Modal Header */}
                <div className="p-4 px-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                  <div className="flex items-center gap-2.5">
                    <FileText size={18} className="text-blue-400" />
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">{lightboxImageTitle}</h4>
                      <p className="text-[10px] text-slate-400">Format: Bukti Kuitansi Asli &bull; Resolusi 1920 &times; 1080 px &bull; Ukuran 1.4 MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => triggerToast('info', 'Unduh Berkas', 'Mengunduh salinan berkas bukti...')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                      title="Unduh Berkas"
                    >
                      Unduh
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLightboxModal(false)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Tutup Modal"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Modal Image Viewport */}
                <div className="p-8 flex items-center justify-center bg-black/60 min-h-[380px] max-h-[70vh] overflow-auto">
                  <div className="max-w-md w-full bg-white text-gray-900 p-6 rounded-xl border border-gray-300 shadow-xl space-y-4 font-mono text-xs">
                    <div className="text-center border-b-2 border-black pb-2">
                      <div className="font-bold text-sm">PT DUTA SARANA LAB INSTRUMENTS</div>
                      <div className="text-[10px] text-gray-600">Jl. Kaliurang KM 9.5 Sleman Yogyakarta</div>
                      <div className="text-[11px] font-black mt-1">KUITANSI PEMBAYARAN RESMI</div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span>No Bukti</span><span className="font-bold">KW-2026/04/0081</span></div>
                      <div className="flex justify-between"><span>Tanggal</span><span>18 Mei 2026</span></div>
                      <div className="flex justify-between"><span>Diterima Dari</span><span className="font-bold">Fakultas Teknik UGM</span></div>
                      <div className="flex justify-between"><span>Untuk Belanja</span><span>Spektrofotometer Shimadzu</span></div>
                      <div className="flex justify-between"><span>Mata Anggaran</span><span className="font-bold text-blue-700">MAK 532111</span></div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-black text-sm flex justify-between items-center">
                      <span>JUMLAH TOTAL</span>
                      <span>Rp 780.000.000,-</span>
                    </div>
                    <div className="pt-2 flex justify-between items-end text-[10px] text-gray-600 font-sans">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">LUNAS BANK TRANSFER</span>
                      </div>
                      <div className="text-center">
                        <div className="h-10 border-b border-gray-400 w-28"></div>
                        <span>Cap &amp; Tanda Tangan Kasir</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="p-3 px-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
                  <span>Gunakan roda mouse untuk zoom in/out atau geser untuk memeriksa keaslian bukti</span>
                  <button
                    type="button"
                    onClick={() => setShowLightboxModal(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Tutup Preview
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BAGIAN 5: TEMPLATE PRATINJAU GALERI INTERAKTIF & LIGHTBOX */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase">
                    Komponen Standar
                  </span>
                  <h2 className="text-sm font-black text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Template Pratinjau Galeri Interaktif & Lightbox (Full Interactive Lightbox)
                  </h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Komponen lightbox interaktif untuk pemeriksaan bukti transaksi kas, nota belanja, dan berkas transfer. Dilengkapi kontrol zoom mendalam, navigasi beruntun, serta proxy bypass ISP Indihome.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDemoGalleryOpen(true)}
                  className="h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Eye size={13} />
                  <span>Buka Demo Galeri Interaktif</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `import GalleryLightbox, { GalleryItem } from '@/components/shared/GalleryLightbox';\n\n// Buka galeri di halaman Anda:\n<GalleryLightbox\n  isOpen={isOpen}\n  items={galleryItems}\n  currentIndex={activeIndex}\n  title="Pengajuan Transfer Dana"\n  subtitle="Rp 3.500.000 • 2026-10-03"\n  onClose={() => setIsOpen(false)}\n  onIndexChange={(idx) => setActiveIndex(idx)}\n/>`,
                      'gallery-lightbox-code'
                    )
                  }
                  className="h-8 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode === 'gallery-lightbox-code' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedCode === 'gallery-lightbox-code' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>
            </div>

            {/* 6 Fitur Utama Kartu Spesifikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">Fitur 1</span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Zoom In & Zoom Out (50% - 400%)</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Mendukung pembesaran presisi melalui tombol (+ / -), roda gulir mouse (mouse wheel), serta double-click cepat.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">Fitur 2</span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Geser / Pan & Drag</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Ketika gambar diperbesar di atas 100%, kursor otomatis berubah menjadi grab/grabbing untuk menggeser dokumen ke seluruh sudut.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">Fitur 3</span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Rotasi 90° Searah Jarum Jam</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Memutar foto nota atau kuitansi yang terunggah terbalik atau menyamping (shortcut keyboard huruf 'R').
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">Fitur 4</span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Navigasi Next / Prev</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Tombol panah circular melayang serta shortcut keyboard (Panah Kiri & Kanan) untuk memeriksa banyak berkas berurutan.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 block">Fitur 5</span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Strip Thumbnail Bawah</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Pratinjau strip foto mini di bagian bawah dengan highlight aktif ring-amber untuk melompat ke berkas mana saja dengan 1 klik.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">Fitur 6</span>
                <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">Bypass ISP Indihome</h4>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                  Deteksi otomatis domain eksternal dan Google Drive untuk dialirkan via proxy gambar internal ('/api/image-cors') tanpa terblokir.
                </p>
              </div>
            </div>

            {/* Thumbnail Pratinjau Demo Interaktif */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-800">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Klik salah satu sampel berkas berikut untuk menguji langsung:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {sampleGalleryItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setDemoGalleryIndex(idx);
                      setIsDemoGalleryOpen(true);
                    }}
                    className="group relative h-24 rounded-xl overflow-hidden cursor-pointer border border-gray-200 dark:border-slate-700 bg-white shadow-2xs hover:border-indigo-400 transition-all hover:scale-105 active:scale-95"
                  >
                    <img src={item.src} alt={item.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center text-white">
                      <Eye size={16} className="mb-0.5" />
                      <span className="text-[9px] font-bold leading-tight">{item.label}</span>
                    </div>
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-bold text-white text-center truncate px-1 py-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
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
                        <td className={`text-center ${tableDensity === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'}`}>
                          <TableActionGroup>
                            <TableActionButton 
                              icon={Eye} 
                              variant="primary" 
                              title="Lihat Detail Akun" 
                              size={tableDensity === 'compact' ? 'xs' : 'sm'} 
                              onClick={() => triggerToast('info', 'Membuka Detail', `Membuka detail akun ${row.kode}`)}
                            />
                            <TableActionButton 
                              icon={Pencil} 
                              variant="warning" 
                              title="Ubah Data Usulan" 
                              size={tableDensity === 'compact' ? 'xs' : 'sm'} 
                              onClick={() => triggerToast('warning', 'Mode Edit', `Membuka form edit untuk ${row.nama}`)}
                            />
                            <TableActionButton 
                              icon={Trash2} 
                              variant="danger" 
                              title="Hapus Usulan" 
                              size={tableDensity === 'compact' ? 'xs' : 'sm'} 
                              onClick={() => {
                                setModalTitle(`Hapus Akun ${row.kode}?`);
                                setModalDesc(`Apakah Anda yakin ingin menghapus data pengajuan untuk ${row.nama}? Tindakan ini permanen.`);
                                setModalVariant('danger');
                                setModalOpen(true);
                              }}
                            />
                          </TableActionGroup>
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

              {/* ========================================================================= */}
              {/* SUB-SECTION 1: TEMPLATE EXPANDABLE SINGLE ROW (CHILD TRANSAKSI/SURAT)     */}
              {/* ========================================================================= */}
              <div className="pt-6 border-t border-gray-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Layers size={16} className="text-indigo-600" />
                      <span>Template 2: Single Row Accordion (Expandable Child Rows)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pola baris tunggal yang dapat diperluas untuk menginspeksi rincian transaksi / sub-item langsung di bawah baris induk tanpa berpindah halaman.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={toggleAllSingleRows}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      {isAllSingleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isAllSingleExpanded ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                        <th className="w-10 text-center py-3 px-2">
                          <button
                            type="button"
                            onClick={toggleAllSingleRows}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 transition-colors"
                            title={isAllSingleExpanded ? "Tutup Semua Accordion" : "Buka Semua Accordion"}
                          >
                            {isAllSingleExpanded ? <ChevronUp size={15} className="text-indigo-600 font-bold" /> : <ChevronDown size={15} />}
                          </button>
                        </th>
                        <th className="w-10 text-center py-3 px-2">No</th>
                        <th className="py-3 px-3">Kode & Uraian Akun</th>
                        <th className="py-3 px-3">Unit Kerja</th>
                        <th className="text-right py-3 px-3">Pagu (Rp)</th>
                        <th className="text-right py-3 px-3">Realisasi (Rp)</th>
                        <th className="text-center py-3 px-3">Status</th>
                        <th className="text-center w-20 py-3 px-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sampleSingleAccordionData.map((row, idx) => {
                        const isExpanded = !!expandedSingleRows[row.id];
                        return (
                          <React.Fragment key={row.id}>
                            {/* Baris Induk */}
                            <tr
                              onClick={() => setExpandedSingleRows(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
                              className={`cursor-pointer transition-colors ${
                                isExpanded 
                                  ? 'bg-indigo-50/50 hover:bg-indigo-50/70 border-l-4 border-l-indigo-600 font-medium' 
                                  : 'hover:bg-slate-50 border-l-4 border-l-transparent text-gray-700'
                              }`}
                            >
                              <td className="text-center py-3 px-2">
                                <button className="p-1 rounded-md text-slate-400 hover:text-indigo-600">
                                  {isExpanded ? <ChevronUp size={15} className="text-indigo-600" /> : <ChevronDown size={15} />}
                                </button>
                              </td>
                              <td className="text-center font-mono text-gray-400 text-xs py-3 px-2">{idx + 1}</td>
                              <td className="py-3 px-3">
                                <div className="font-mono font-bold text-indigo-700 text-xs">{row.kode}</div>
                                <div className="font-semibold text-gray-900 text-xs">{row.nama}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Memiliki {row.children.length} rincian SPK/transaksi</div>
                              </td>
                              <td className="py-3 px-3 text-xs text-gray-600">{row.unit}</td>
                              <td className="text-right font-mono font-bold text-gray-900 text-xs py-3 px-3">
                                Rp {row.pagu.toLocaleString('id-ID')}
                              </td>
                              <td className="text-right font-mono font-semibold text-emerald-700 text-xs py-3 px-3">
                                Rp {row.realisasi.toLocaleString('id-ID')}
                              </td>
                              <td className="text-center py-3 px-3">
                                <StatusBadge status={row.status} />
                              </td>
                              <td className="text-center py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                <TableActionGroup>
                                  <TableActionButton 
                                    icon={Eye} 
                                    variant="indigo" 
                                    title="Lihat Detail Transaksi" 
                                    label="Detail" 
                                    size="sm" 
                                    onClick={() => setDrawerOpen(true)}
                                  />
                                </TableActionGroup>
                              </td>
                            </tr>

                            {/* Baris Anak (Accordion Detail) */}
                            {isExpanded && (
                              <tr className="bg-indigo-50/30 border-b border-indigo-100">
                                <td colSpan={8} className="p-4 pl-12 pr-6">
                                  <div className="bg-white rounded-xl border border-indigo-200/80 p-3.5 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-gray-800">
                                          Rincian Surat Perintah Kerja (SPK) & Bukti Transaksi: {row.nama}
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                        Total {row.children.length} Transaksi
                                      </span>
                                    </div>

                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                          <th className="py-2 px-2.5">No Referensi</th>
                                          <th className="py-2 px-2.5">Tanggal</th>
                                          <th className="py-2 px-2.5">Uraian / Deskripsi Belanja</th>
                                          <th className="py-2 px-2.5">Penyedia / Vendor</th>
                                          <th className="text-right py-2 px-2.5">Nominal (Rp)</th>
                                          <th className="text-center py-2 px-2.5">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {row.children.map((child, cIdx) => (
                                          <tr key={cIdx} className="hover:bg-slate-50/80">
                                            <td className="py-2 px-2.5 font-mono font-bold text-indigo-700 text-[11px]">{child.no}</td>
                                            <td className="py-2 px-2.5 text-gray-500 text-[11px]">📅 {child.tanggal}</td>
                                            <td className="py-2 px-2.5 font-medium text-gray-800">{child.uraian}</td>
                                            <td className="py-2 px-2.5 text-gray-600">{child.vendor}</td>
                                            <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700">
                                              Rp {child.nominal.toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-2 px-2.5 text-center">
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                child.status === 'Lunas' 
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                              }`}>
                                                {child.status}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SUB-SECTION 2: TEMPLATE MULTI-LEVEL GROUP ROW HIERARKI (PUNYA ANAK-ANAK & CUCU) */}
              {/* ========================================================================= */}
              {(() => {
                const groupInfo = getGroupRowsButtonInfo();
                return (
                  <div className="pt-6 border-t border-gray-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <FolderTree size={16} className="text-emerald-600" />
                          <span>Template 3: Multi-Level Group Row (Parent Group Memiliki Anak &amp; Cucu)</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Pola pengelompokan data bertingkat (Grouping) berdasarkan Fakultas / Unit Induk dengan baris anak (departemen) dan cucu (laboratorium/sub-kegiatan) dengan tombol buka/tutup perjenjang.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Smart Segmented Level & Stepper Bar */}
                        <div className="inline-flex items-center rounded-xl p-0.5 bg-slate-100 border border-slate-200/90 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setGroupRowsTo(1)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              groupInfo.level === 1
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                            title="Tingkat 1: Tampilkan hanya Induk"
                          >
                            Induk
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupRowsTo(2)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              groupInfo.level === 2
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                            title="Tingkat 2: Buka sampai Anak (Departemen)"
                          >
                            +Anak
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupRowsTo(3)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              groupInfo.level === 3
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                            title="Tingkat 3: Buka semua sampai Cucu (Laboratorium)"
                          >
                            +Cucu
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                            <th className="w-10 text-center py-3 px-2">
                              <span className="text-slate-400 font-bold text-xs">#</span>
                            </th>
                            <th className="py-3 px-3">Nama Group Unit Kerja / Departemen / Lab</th>
                            <th className="py-3 px-3">Klaster / PIC</th>
                            <th className="text-right py-3 px-3">Subtotal Pagu (Rp)</th>
                            <th className="text-right py-3 px-3">Subtotal Realisasi (Rp)</th>
                            <th className="text-center py-3 px-3">Status</th>
                            <th className="text-center w-28 py-3 px-3">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sampleGroupRowsData.map((group) => {
                            const isGroupOpen = !!expandedGroupRows[group.groupId];
                            const persentase = Math.round((group.totalRealisasi / group.totalPagu) * 100);

                            return (
                              <React.Fragment key={group.groupId}>
                                {/* Baris Header Group (Parent) */}
                                <tr
                                  onClick={() => setExpandedGroupRows(prev => ({ ...prev, [group.groupId]: !prev[group.groupId] }))}
                                  className="bg-slate-100/90 hover:bg-slate-200/80 cursor-pointer border-b border-slate-200 font-bold transition-colors"
                                >
                                  <td className="text-center py-3 px-2">
                                    <button className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors">
                                      {isGroupOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      {isGroupOpen ? (
                                        <FolderOpen size={16} className="text-emerald-600 shrink-0" />
                                      ) : (
                                        <Folder size={16} className="text-emerald-600 shrink-0" />
                                      )}
                                      <span className="font-black text-slate-900 text-xs">{group.groupName}</span>
                                      <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
                                        {group.children.length} Anak Unit
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-xs text-slate-600 font-semibold">
                                    <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                      {group.cluster}
                                    </span>
                                  </td>
                                  <td className="text-right font-mono font-black text-slate-900 text-xs py-3 px-3">
                                    Rp {group.totalPagu.toLocaleString('id-ID')}
                                  </td>
                                  <td className="text-right font-mono font-black text-emerald-800 text-xs py-3 px-3">
                                    <div>Rp {group.totalRealisasi.toLocaleString('id-ID')}</div>
                                    <div className="text-[10px] text-emerald-600 font-sans font-bold">{persentase}% Serapan</div>
                                  </td>
                                  <td className="text-center py-3 px-3">
                                    <StatusBadge status={group.status} />
                                  </td>
                                  <td className="text-center py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[10px] text-slate-400 font-bold">Parent Group</span>
                                  </td>
                                </tr>

                                {/* Baris Anak-anak (Children Rows) */}
                                {isGroupOpen && (
                                  group.children.map((child, cIdx) => {
                                    const isSubOpen = !!expandedGroupSubRows[child.id];
                                    const hasCucu = child.grandChildren && child.grandChildren.length > 0;

                                    return (
                                      <React.Fragment key={child.id}>
                                        <tr
                                          onClick={hasCucu ? () => setExpandedGroupSubRows(prev => ({ ...prev, [child.id]: !prev[child.id] })) : undefined}
                                          className={`hover:bg-emerald-50/40 bg-white transition-colors text-xs border-b border-slate-100 ${hasCucu ? 'cursor-pointer' : ''}`}
                                        >
                                          <td className="text-center py-2.5 px-2">
                                            {hasCucu ? (
                                              <button 
                                                type="button" 
                                                onClick={(e) => { e.stopPropagation(); setExpandedGroupSubRows(prev => ({ ...prev, [child.id]: !prev[child.id] })); }}
                                                className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                                              >
                                                {isSubOpen ? <ChevronUp size={13} className="text-emerald-700 font-bold" /> : <ChevronDown size={13} />}
                                              </button>
                                            ) : (
                                              <span className="text-slate-300 font-mono text-[11px]">{cIdx + 1}</span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 pl-8">
                                            <div className="flex items-center gap-2">
                                              <span className="text-emerald-500 font-mono">↳</span>
                                              <Building2 size={14} className="text-emerald-700 shrink-0" />
                                              <div>
                                                <div className="font-bold text-slate-800">{child.nama}</div>
                                                <div className="font-mono text-[10px] text-indigo-600 font-bold">Kode: {child.kode}</div>
                                              </div>
                                              {hasCucu && (
                                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full shadow-2xs ml-1">
                                                  Level 2 ({child.grandChildren.length} Lab/Cucu)
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2.5 px-3 text-slate-600 text-xs">
                                            👤 {child.pic}
                                          </td>
                                          <td className="text-right font-mono font-bold text-slate-700 text-xs py-2.5 px-3">
                                            Rp {child.pagu.toLocaleString('id-ID')}
                                          </td>
                                          <td className="text-right font-mono font-semibold text-emerald-700 text-xs py-2.5 px-3">
                                            Rp {child.realisasi.toLocaleString('id-ID')}
                                          </td>
                                          <td className="text-center py-2.5 px-3">
                                            <StatusBadge status={child.status} />
                                          </td>
                                          <td className="text-center py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-1.5">
                                              {hasCucu && (
                                                <button
                                                  type="button"
                                                  onClick={() => setExpandedGroupSubRows(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                                                  className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                                                >
                                                  {isSubOpen ? 'Tutup Cucu' : 'Buka Cucu'}
                                                </button>
                                              )}
                                              <TableActionButton 
                                                icon={Eye} 
                                                variant="primary" 
                                                title="Lihat Rincian Unit" 
                                                size="xs" 
                                                onClick={() => triggerToast('info', 'Unit Kerja', `Membuka detail ${child.nama}`)}
                                              />
                                            </div>
                                          </td>
                                        </tr>

                                        {/* Baris Cucu (GrandChildren Rows) */}
                                        {isSubOpen && hasCucu && child.grandChildren.map((gc: any, gIdx: number) => (
                                          <tr
                                            key={gc.id}
                                            className="hover:bg-slate-50/80 bg-slate-50/40 transition-colors text-xs border-b border-slate-100"
                                          >
                                            <td className="text-center py-2 px-2 text-slate-300 font-mono text-[10px]">
                                              {gIdx + 1}
                                            </td>
                                            <td className="py-2 px-3 pl-16">
                                              <div className="flex items-center gap-2">
                                                <span className="text-slate-300 font-mono text-xs">↳ ↳</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                                <div>
                                                  <div className="font-medium text-slate-800 text-xs">{gc.nama}</div>
                                                  <div className="text-[10px] text-slate-400">Level 3 (Rincian Unit / Lab)</div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="py-2 px-3 text-xs text-slate-600">
                                              <div className="font-mono text-[10px] font-bold text-slate-600">{gc.kode}</div>
                                              <div className="text-[10px] text-slate-500">👤 {gc.pic}</div>
                                            </td>
                                            <td className="text-right font-mono font-medium text-slate-700 text-xs py-2 px-3">
                                              Rp {gc.pagu.toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-right font-mono font-semibold text-emerald-700 text-xs py-2 px-3">
                                              Rp {gc.realisasi.toLocaleString('id-ID')}
                                            </td>
                                            <td className="text-center py-2 px-3">
                                              <StatusBadge status={gc.status} />
                                            </td>
                                            <td className="text-center py-2 px-3">
                                              <span className="text-[10px] text-slate-400 font-bold">Cucu</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </React.Fragment>
                                    );
                                  })
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================================= */}
              {/* SUB-SECTION 3: TEMPLATE 3-LEVEL NESTED HIERARCHY (ANAK MEMILIKI ANAK LAGI) */}
              {/* ========================================================================= */}
              {(() => {
                const threeInfo = getThreeLevelButtonInfo();
                return (
                  <div className="pt-6 border-t border-gray-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <Layers size={16} className="text-violet-600" />
                          <span>Template 4: 3-Level Nested Collapse Hierarchy (Induk &rarr; Anak &rarr; Cucu)</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Hierarki bertingkat 3 level: Baris Induk (Fakultas), Anak (Departemen), dan Cucu (Laboratorium) dengan tombol buka/tutup perjenjang bertahap.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Smart Segmented Level & Stepper Bar */}
                        <div className="inline-flex items-center rounded-xl p-0.5 bg-slate-100 border border-slate-200/90 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setThreeLevelTo(1)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              threeInfo.level === 1
                                ? 'bg-violet-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                            title="Tingkat 1: Tampilkan hanya Induk"
                          >
                            Induk
                          </button>
                          <button
                            type="button"
                            onClick={() => setThreeLevelTo(2)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              threeInfo.level === 2
                                ? 'bg-violet-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                            title="Tingkat 2: Buka sampai Anak (Departemen)"
                          >
                            +Anak
                          </button>
                          <button
                            type="button"
                            onClick={() => setThreeLevelTo(3)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                              threeInfo.level === 3
                                ? 'bg-violet-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                            title="Tingkat 3: Buka semua sampai Cucu (Laboratorium)"
                          >
                            +Cucu
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Level Legends */}
                    <div className="flex flex-wrap items-center gap-2 py-1">
                      <span className="text-[11px] font-bold text-gray-400">Tingkatan Hierarki:</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                        <Folder size={11} className="text-slate-600" /> Level 1: Unit Induk (Fakultas)
                      </span>
                      <span className="text-gray-300 text-xs">&rarr;</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <Building2 size={11} className="text-indigo-600" /> Level 2: Sub-Unit (Departemen) - Expandable
                      </span>
                      <span className="text-gray-300 text-xs">&rarr;</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Level 3: Rincian Kegiatan / Lab (Cucu)
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-2xs bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                            <th className="w-10 text-center py-3 px-2">
                              <span className="text-slate-400 font-bold text-xs">#</span>
                            </th>
                            <th className="py-3 px-3">Struktur Hierarki Unit / Sub-Unit / Lab</th>
                            <th className="py-3 px-3">Kode & PIC</th>
                            <th className="text-right py-3 px-3">Pagu (Rp)</th>
                            <th className="text-right py-3 px-3">Realisasi (Rp)</th>
                            <th className="text-center py-3 px-3">Status</th>
                            <th className="text-center w-24 py-3 px-3">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sampleThreeLevelData.map((parent) => {
                            const isParentOpen = !!expandedThreeLevelParent[parent.id];
                            const parentPercent = Math.round((parent.totalRealisasi / parent.totalPagu) * 100);

                            return (
                              <React.Fragment key={parent.id}>
                                {/* LEVEL 1: Baris Induk (Fakultas / Unit Utama) */}
                                <tr
                                  onClick={() => setExpandedThreeLevelParent(prev => ({ ...prev, [parent.id]: !prev[parent.id] }))}
                                  className="bg-slate-100/90 hover:bg-slate-200/80 cursor-pointer border-b border-slate-200 font-bold transition-colors"
                                >
                                  <td className="text-center py-3 px-2">
                                    <button className="p-1 rounded-md text-slate-700 hover:bg-slate-200 transition-colors">
                                      {isParentOpen ? <ChevronUp size={16} className="text-slate-800 font-bold" /> : <ChevronDown size={16} />}
                                    </button>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      {isParentOpen ? (
                                        <FolderOpen size={17} className="text-amber-600 shrink-0" />
                                      ) : (
                                        <Folder size={17} className="text-amber-600 shrink-0" />
                                      )}
                                      <span className="font-black text-slate-900 text-xs">{parent.name}</span>
                                      <span className="text-[10px] font-bold bg-white text-slate-800 border border-slate-300 px-2 py-0.5 rounded-full shadow-2xs">
                                        Level 1 ({parent.children.length} Departemen)
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-xs text-slate-600 font-semibold">
                                    <span className="font-mono text-[11px] font-bold text-slate-700 mr-2">{parent.code}</span>
                                    <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                      {parent.cluster}
                                    </span>
                                  </td>
                                  <td className="text-right font-mono font-black text-slate-900 text-xs py-3 px-3">
                                    Rp {parent.totalPagu.toLocaleString('id-ID')}
                                  </td>
                                  <td className="text-right font-mono font-black text-emerald-800 text-xs py-3 px-3">
                                    <div>Rp {parent.totalRealisasi.toLocaleString('id-ID')}</div>
                                    <div className="text-[10px] text-emerald-600 font-sans font-bold">{parentPercent}% Serapan</div>
                                  </td>
                                  <td className="text-center py-3 px-3">
                                    <StatusBadge status={parent.status} />
                                  </td>
                                  <td className="text-center py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[10px] text-slate-400 font-bold">Induk</span>
                                  </td>
                                </tr>

                                {/* LEVEL 2: Baris Anak (Departemen) */}
                                {isParentOpen && parent.children.map((child) => {
                                  const isChildOpen = !!expandedThreeLevelChild[child.id];
                                  const childPercent = Math.round((child.realisasi / child.pagu) * 100);

                                  return (
                                    <React.Fragment key={child.id}>
                                      <tr
                                        onClick={() => setExpandedThreeLevelChild(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                                        className={`cursor-pointer transition-colors border-b border-indigo-100/70 ${
                                          isChildOpen ? 'bg-indigo-50/70 hover:bg-indigo-100/50' : 'bg-indigo-50/30 hover:bg-indigo-50/60'
                                        }`}
                                      >
                                        <td className="text-center py-2.5 px-2">
                                          <button className="p-1 rounded-md text-indigo-700 hover:bg-indigo-200/60 transition-colors ml-2 cursor-pointer">
                                            {isChildOpen ? <ChevronUp size={14} className="text-indigo-700 font-bold" /> : <ChevronDown size={14} />}
                                          </button>
                                        </td>
                                        <td className="py-2.5 px-3 pl-8">
                                          <div className="flex items-center gap-2">
                                            <span className="text-indigo-400 font-mono">↳</span>
                                            <Building2 size={15} className="text-indigo-600 shrink-0" />
                                            <span className="font-bold text-indigo-950 text-xs">{child.name}</span>
                                            <span className="text-[10px] font-bold bg-white text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full shadow-2xs">
                                              Level 2 ({child.grandChildren.length} Lab/Cucu)
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-xs text-slate-600">
                                          <div className="font-mono text-[11px] font-bold text-indigo-700">{child.code}</div>
                                          <div className="text-[10px] text-slate-500">PIC: {child.pic}</div>
                                        </td>
                                        <td className="text-right font-mono font-bold text-slate-800 text-xs py-2.5 px-3">
                                          Rp {child.pagu.toLocaleString('id-ID')}
                                        </td>
                                        <td className="text-right font-mono font-bold text-emerald-700 text-xs py-2.5 px-3">
                                          <div>Rp {child.realisasi.toLocaleString('id-ID')}</div>
                                          <div className="text-[10px] text-emerald-600 font-sans">{childPercent}% Serapan</div>
                                        </td>
                                        <td className="text-center py-2.5 px-3">
                                          <StatusBadge status={child.status} />
                                        </td>
                                        <td className="text-center py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={() => setExpandedThreeLevelChild(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                                            className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-2 py-0.5 rounded-md hover:bg-indigo-50 transition-colors shadow-2xs cursor-pointer"
                                          >
                                            {isChildOpen ? 'Tutup Cucu' : 'Buka Cucu'}
                                          </button>
                                        </td>
                                      </tr>

                                      {/* LEVEL 3: Baris Cucu (Laboratorium / Sub-Kegiatan) */}
                                      {isChildOpen && child.grandChildren.map((grandChild, gIdx) => (
                                        <tr
                                          key={grandChild.id}
                                          className="bg-white hover:bg-slate-50/80 transition-colors text-xs border-b border-slate-100"
                                        >
                                          <td className="text-center py-2 px-2 text-slate-300 font-mono text-[10px]">
                                            {gIdx + 1}
                                          </td>
                                          <td className="py-2 px-3 pl-16">
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-300 font-mono text-xs">↳ ↳</span>
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                              <div>
                                                <div className="font-medium text-slate-800 text-xs">{grandChild.nama}</div>
                                                <div className="text-[10px] text-slate-400">Level 3 (Grandchild Unit)</div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-xs text-slate-600">
                                            <div className="font-mono text-[10px] font-bold text-slate-600">{grandChild.kode}</div>
                                            <div className="text-[10px] text-slate-500">👤 {grandChild.pic}</div>
                                          </td>
                                          <td className="text-right font-mono font-medium text-slate-700 text-xs py-2 px-3">
                                            Rp {grandChild.pagu.toLocaleString('id-ID')}
                                          </td>
                                          <td className="text-right font-mono font-semibold text-emerald-700 text-xs py-2 px-3">
                                            Rp {grandChild.realisasi.toLocaleString('id-ID')}
                                          </td>
                                          <td className="text-center py-2 px-3">
                                            <StatusBadge status={grandChild.status} />
                                          </td>
                                          <td className="text-center py-2 px-3">
                                            <TableActionGroup>
                                              <TableActionButton icon={Eye} variant="primary" title="Lihat Rincian" size="xs" onClick={() => triggerToast('info', 'Rincian Akun', `Melihat rincian ${grandChild.nama}`)} />
                                              <TableActionButton icon={Pencil} variant="warning" title="Edit" size="xs" onClick={() => triggerToast('warning', 'Edit Akun', `Mengedit ${grandChild.nama}`)} />
                                            </TableActionGroup>
                                          </td>
                                        </tr>
                                      ))}
                                    </React.Fragment>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================================= */}
              {/* SUB-SECTION 4: TEMPLATE 5 - PIVOT MATRIX BAGAN AKUN STANDAR (COA) 12-BULAN */}
              {/* ========================================================================= */}
              {(() => {
                const BULAN_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const padClass = pivotTableDensity === 'compact' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 text-xs';
                const headPad = pivotTableDensity === 'compact' ? 'px-2.5 py-2 text-[11px]' : 'px-3.5 py-3 text-xs';
                const fmt = (num: number) => (num !== undefined && num !== null) ? num.toLocaleString('id-ID') : '0';

                // Hitung total penerimaan, total beban, dan surplus per bulan
                const monthlyPenerimaan = BULAN_NAMES.map((_, i) => {
                  const induk4 = samplePivotCoaData.find(d => d.nomor_akun.startsWith('4'));
                  return induk4?.months[i] || 0;
                });
                const monthlyBeban = BULAN_NAMES.map((_, i) => {
                  const induk5 = samplePivotCoaData.find(d => d.nomor_akun.startsWith('5'));
                  return induk5?.months[i] || 0;
                });
                const totalPenerimaanSetahun = monthlyPenerimaan.reduce((a, b) => a + b, 0);
                const totalBebanSetahun = monthlyBeban.reduce((a, b) => a + b, 0);

                const saldoAwalTotal = samplePivotRekeningSaldo.reduce((acc, r) => acc + r.awal, 0);
                // Running saldo per bulan
                const monthlyNetto = monthlyPenerimaan.map((p, i) => p - monthlyBeban[i]);
                const runningSaldo = monthlyNetto.reduce((acc: number[], curr: number, idx: number) => {
                  const prev = idx === 0 ? saldoAwalTotal : acc[idx - 1];
                  acc.push(prev + curr);
                  return acc;
                }, []);
                const saldoAkhirTotal = runningSaldo[11] || saldoAwalTotal;

                return (
                  <div className="pt-6 border-t border-gray-200/80 space-y-4">
                    {/* Header Template 5 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Template 5
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            Matrix Pivot Finansial &amp; Akuntansi
                          </span>
                        </div>
                        <h3 className="text-base font-black text-gray-900 tracking-tight mt-0.5 flex items-center gap-2">
                          <span>Pivot Matrix Bagan Akun Standar (COA) — Mutasi 12-Bulan</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tabel multi-periode dengan <strong>Dual Sticky Solid Column</strong> (Akun kiri + Total kanan 100% kedap), selektor jenjang hierarki, dan rincian saldo rekening terintegrasi.
                        </p>
                      </div>

                      {/* Controls Toolbar: Jenjang Pills + Density Toggle */}
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        {/* Selector Jenjang Hierarki Bertahap */}
                        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 shadow-inner">
                          {[
                            { lvl: 1, label: 'Induk', title: 'Level 1: Tampilkan Akun Induk Saja' },
                            { lvl: 2, label: '+Golongan', title: 'Level 2: Buka Hingga Golongan (41, 51, dst)' },
                            { lvl: 3, label: '+Kelompok', title: 'Level 3: Buka Hingga Kelompok Sub-Akun' },
                            { lvl: 4, label: '+Detail', title: 'Level 4: Buka Seluruh Anak Rekening Detail' },
                          ].map((item) => (
                            <button
                              key={item.lvl}
                              type="button"
                              onClick={() => setPivotHierarchyTo(item.lvl)}
                              title={item.title}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                                pivotHierarchyLevel === item.lvl
                                  ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/60 font-black'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        {/* Density Toggle Luwes / Rapat */}
                        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setPivotTableDensity('comfortable')}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                              pivotTableDensity === 'comfortable'
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Format Luwes (Comfortable Pad)"
                          >
                            <Rows size={12} />
                            <span>Luwes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPivotTableDensity('compact')}
                            className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 ${
                              pivotTableDensity === 'compact'
                                ? 'bg-white text-slate-800 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                            title="Format Rapat (Compact Pad)"
                          >
                            <AlignJustify size={12} />
                            <span>Rapat</span>
                          </button>
                        </div>

                        {/* Copy Code */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`// Dual Sticky Pivot Matrix COA (Zero-Bleed Solid Columns)\n// sticky left-0: bg-white | bg-indigo-50\n// sticky right-0: bg-indigo-100 (Induk) | bg-slate-100 (Gol) | bg-white (Kel/Detail)\n// shadow-[-5px_0_12px_rgba(0,0,0,0.06)]`);
                            triggerToast('success', 'Kode Disalin', 'Pola CSS Dual Sticky Solid berhasil disalin ke clipboard');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs flex items-center gap-1"
                        >
                          <Copy size={12} />
                          <span>Salin Pola</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Bar: Quick Category Chips & Live Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                          <Filter size={12} />
                          Filter:
                        </span>
                        {[
                          { id: 'all', label: 'Semua Akun' },
                          { id: '4', label: '4xxxx Penerimaan' },
                          { id: '5', label: '5xxxx Beban & Realisasi' },
                          { id: '1', label: '1xxxx Kas & Bank' },
                          { id: '9', label: '9xxxx Koreksi' },
                        ].map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setPivotCategoryFilter(c.id as any)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all border ${
                              pivotCategoryFilter === c.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={pivotSearchQuery}
                          onChange={(e) => setPivotSearchQuery(e.target.value)}
                          placeholder="Cari kode atau uraian akun..."
                          className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        {pivotSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPivotSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Matrix Pivot Table (Dual Sticky Solid) */}
                    <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                        <table className="text-left border-separate border-spacing-0 min-w-full">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 uppercase tracking-tight sticky top-0 z-[60]">
                              {/* Sticky Kolom Kiri: Akun Hirarki */}
                              <th className={`${headPad} border-r border-slate-200 bg-slate-100 sticky left-0 z-[70] min-w-[280px] font-black text-slate-800`}>
                                Akun Hirarki
                              </th>
                              <th className={`${headPad} border-r border-slate-200 text-right bg-slate-100 font-bold min-w-[110px]`}>
                                Saldo Awal
                              </th>
                              {BULAN_NAMES.map((m, idx) => (
                                <th key={idx} className={`${headPad} border-r border-slate-200 text-right bg-slate-100 font-bold min-w-[92px]`}>
                                  {m}
                                </th>
                              ))}
                              {/* Sticky Kolom Kanan: Total Setahun (Solid 100% Opaque Bebas Tembus) */}
                              <th className={`${headPad} text-right bg-indigo-100 sticky right-0 z-[70] border-l border-indigo-200 font-black min-w-[130px] text-indigo-950 shadow-[-5px_0_15px_rgba(0,0,0,0.08)]`}>
                                Total Setahun
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-xs">
                            {/* ============================================================ */}
                            {/* BARIS STICKY: TOTAL POSISI AWAL (WARNA SOFT INDIGO)          */}
                            {/* ============================================================ */}
                            <tr
                              className="bg-[#e0e7ff] text-indigo-950 font-black cursor-pointer group sticky top-[37px] z-[50] border-b border-indigo-200/80 shadow-xs"
                              onClick={() => setPivotExpandPosisiAwal(!pivotExpandPosisiAwal)}
                            >
                              <td className={`${padClass} sticky left-0 bg-[#e0e7ff] text-indigo-950 z-[55] border-r border-indigo-200 flex items-center gap-2 group-hover:bg-[#c7d2fe] transition-colors font-sans font-black`}>
                                {pivotExpandPosisiAwal ? <ChevronDown size={14} className="text-indigo-700" /> : <ChevronRight size={14} className="text-indigo-600" />}
                                <span className="text-indigo-600 font-bold">▶</span> TOTAL POSISI AWAL
                              </td>
                              <td className={`${padClass} text-right border-r border-indigo-200 text-indigo-950 bg-[#e0e7ff] font-bold`}>
                                {fmt(saldoAwalTotal)}
                              </td>
                              {BULAN_NAMES.map((_, idx) => {
                                const prevSaldo = idx === 0 ? saldoAwalTotal : runningSaldo[idx - 1];
                                return (
                                  <td key={idx} className={`${padClass} text-right border-r border-indigo-200 bg-[#e0e7ff] text-indigo-950 font-bold`}>
                                    {fmt(prevSaldo)}
                                  </td>
                                );
                              })}
                              <td className={`${padClass} text-right bg-[#c7d2fe] font-black sticky right-0 z-[55] border-l border-indigo-300 text-indigo-950 shadow-[-4px_0_12px_rgba(0,0,0,0.06)]`}>
                                {fmt(saldoAwalTotal)}
                              </td>
                            </tr>

                            {/* RINCIAN POSISI AWAL PER REKENING (EXPANDABLE) */}
                            {pivotExpandPosisiAwal && samplePivotRekeningSaldo.map((rek) => (
                              <tr key={`pvt-awal-${rek.id}`} className="bg-indigo-50/40 text-slate-600 italic">
                                <td className={`${padClass} pl-8 border-r border-slate-100 sticky left-0 bg-white z-[40] truncate max-w-[260px] font-sans font-medium`}>
                                  ↳ {rek.nama}
                                </td>
                                <td className={`${padClass} text-right border-r border-slate-100 bg-slate-50 font-medium`}>
                                  {fmt(rek.awal)}
                                </td>
                                {BULAN_NAMES.map((_, idx) => (
                                  <td key={idx} className={`${padClass} text-right border-r border-slate-100 opacity-70`}>
                                    {fmt(rek.awal)}
                                  </td>
                                ))}
                                <td className={`${padClass} text-right bg-white text-indigo-800 border-l border-indigo-200 sticky right-0 z-[40] font-bold shadow-[-5px_0_10px_rgba(0,0,0,0.05)]`}>
                                  {fmt(rek.awal)}
                                </td>
                              </tr>
                            ))}

                            {/* ============================================================ */}
                            {/* DATA TABEL COA (INDUK -> GOLONGAN -> KELOMPOK -> DETAIL)     */}
                            {/* ============================================================ */}
                            {filteredPivotData.map((induk) => {
                              const isIndukExpanded = pivotExpandedNodes[induk.id] ?? (pivotHierarchyLevel >= 2);
                              const totalInduk = induk.months.reduce((a, b) => a + b, 0);
                              const accPrefix = String(induk.nomor_akun).charAt(0);
                              const isPenerimaan = accPrefix === '4';
                              const isBeban = accPrefix === '5';
                              const isKas = accPrefix === '1';
                              const isKoreksi = accPrefix === '9' || induk.nama_akun.toLowerCase().includes('koreksi');

                              // Theme Gradasi Soft Berjenjang: Induk ➔ Golongan ➔ Kelompok ➔ Anak
                              // Penerimaan: Hijau, Beban: Merah, Kas: Ungu, Koreksi: Kuning, Lainnya: Biru
                              const theme = isPenerimaan ? {
                                // 4xxxx Penerimaan: Gradasi Hijau / Emerald Soft
                                induk: {
                                  row: 'bg-[#a7f3d0] text-emerald-950 font-black border-t-2 border-emerald-400',
                                  stickyLeft: 'bg-[#a7f3d0] text-emerald-950 border-r border-emerald-300',
                                  monthCell: 'bg-[#a7f3d0] text-emerald-950 font-bold border-r border-emerald-300/80',
                                  stickyRight: 'bg-[#86efac] text-emerald-950 font-black border-l border-emerald-300 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-emerald-950 font-black',
                                  chevron: 'text-emerald-900',
                                },
                                gol: {
                                  row: 'bg-[#d1fae5] text-emerald-950 font-extrabold hover:bg-[#bbf7d0] transition-colors',
                                  stickyLeft: 'bg-[#d1fae5] text-emerald-950 border-r border-emerald-200',
                                  monthCell: 'bg-[#d1fae5] text-emerald-950 font-bold border-r border-emerald-200/80',
                                  stickyRight: 'bg-[#bbf7d0] text-emerald-950 font-extrabold border-l border-emerald-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-emerald-900 font-extrabold',
                                  chevron: 'text-emerald-800',
                                },
                                kel: {
                                  row: 'bg-[#ecfdf5] text-emerald-900 font-semibold hover:bg-[#d1fae5] transition-colors',
                                  stickyLeft: 'bg-[#ecfdf5] text-emerald-900 border-r border-emerald-100',
                                  monthCell: 'bg-[#ecfdf5] text-emerald-800 font-medium border-r border-emerald-100/70',
                                  stickyRight: 'bg-[#d1fae5] text-emerald-900 font-bold border-l border-emerald-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-emerald-800 font-bold',
                                  chevron: 'text-emerald-700',
                                },
                                anak: {
                                  row: 'bg-white hover:bg-emerald-50/40 text-slate-700 transition-colors',
                                  stickyLeft: 'bg-white text-slate-700 border-r border-slate-100',
                                  monthCell: 'bg-white text-slate-600 border-r border-slate-100',
                                  stickyRight: 'bg-white text-emerald-700 font-medium border-l border-emerald-100 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                }
                              } : isBeban ? {
                                // 5xxxx Beban & Realisasi: Gradasi Merah Soft (Rose / Red Soft)
                                induk: {
                                  row: 'bg-[#fecdd3] text-rose-950 font-black border-t-2 border-rose-400',
                                  stickyLeft: 'bg-[#fecdd3] text-rose-950 border-r border-rose-300',
                                  monthCell: 'bg-[#fecdd3] text-rose-950 font-bold border-r border-rose-300/80',
                                  stickyRight: 'bg-[#fda4af] text-rose-950 font-black border-l border-rose-300 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-rose-950 font-black',
                                  chevron: 'text-rose-900',
                                },
                                gol: {
                                  row: 'bg-[#ffe4e6] text-rose-950 font-extrabold hover:bg-[#fecdd3] transition-colors',
                                  stickyLeft: 'bg-[#ffe4e6] text-rose-950 border-r border-rose-200',
                                  monthCell: 'bg-[#ffe4e6] text-rose-950 font-bold border-r border-rose-200/80',
                                  stickyRight: 'bg-[#fecdd3] text-rose-950 font-extrabold border-l border-rose-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-rose-900 font-extrabold',
                                  chevron: 'text-rose-800',
                                },
                                kel: {
                                  row: 'bg-[#fff1f2] text-rose-900 font-semibold hover:bg-[#ffe4e6] transition-colors',
                                  stickyLeft: 'bg-[#fff1f2] text-rose-900 border-r border-rose-100',
                                  monthCell: 'bg-[#fff1f2] text-rose-800 font-medium border-r border-rose-100/70',
                                  stickyRight: 'bg-[#ffe4e6] text-rose-900 font-bold border-l border-rose-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-rose-800 font-bold',
                                  chevron: 'text-rose-700',
                                },
                                anak: {
                                  row: 'bg-white hover:bg-rose-50/40 text-slate-700 transition-colors',
                                  stickyLeft: 'bg-white text-slate-700 border-r border-slate-100',
                                  monthCell: 'bg-white text-slate-600 border-r border-slate-100',
                                  stickyRight: 'bg-white text-rose-700 font-medium border-l border-rose-100 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                }
                              } : isKas ? {
                                // 1xxxx Kas & Bank: Gradasi Ungu Soft (Purple / Violet)
                                induk: {
                                  row: 'bg-[#e9d5ff] text-purple-950 font-black border-t-2 border-purple-400',
                                  stickyLeft: 'bg-[#e9d5ff] text-purple-950 border-r border-purple-300',
                                  monthCell: 'bg-[#e9d5ff] text-purple-950 font-bold border-r border-purple-300/80',
                                  stickyRight: 'bg-[#d8b4fe] text-purple-950 font-black border-l border-purple-300 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-purple-950 font-black',
                                  chevron: 'text-purple-900',
                                },
                                gol: {
                                  row: 'bg-[#f3e8ff] text-purple-950 font-extrabold hover:bg-[#e9d5ff] transition-colors',
                                  stickyLeft: 'bg-[#f3e8ff] text-purple-950 border-r border-purple-200',
                                  monthCell: 'bg-[#f3e8ff] text-purple-950 font-bold border-r border-purple-200/80',
                                  stickyRight: 'bg-[#e9d5ff] text-purple-950 font-extrabold border-l border-purple-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-purple-900 font-extrabold',
                                  chevron: 'text-purple-800',
                                },
                                kel: {
                                  row: 'bg-[#faf5ff] text-purple-900 font-semibold hover:bg-[#f3e8ff] transition-colors',
                                  stickyLeft: 'bg-[#faf5ff] text-purple-900 border-r border-purple-100',
                                  monthCell: 'bg-[#faf5ff] text-purple-800 font-medium border-r border-purple-100/70',
                                  stickyRight: 'bg-[#f3e8ff] text-purple-900 font-bold border-l border-purple-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-purple-800 font-bold',
                                  chevron: 'text-purple-700',
                                },
                                anak: {
                                  row: 'bg-white hover:bg-purple-50/40 text-slate-700 transition-colors',
                                  stickyLeft: 'bg-white text-slate-700 border-r border-slate-100',
                                  monthCell: 'bg-white text-slate-600 border-r border-slate-100',
                                  stickyRight: 'bg-white text-purple-700 font-medium border-l border-purple-100 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                }
                              } : isKoreksi ? {
                                // 9xxxx Koreksi: Gradasi Kuning Soft (Amber / Yellow)
                                induk: {
                                  row: 'bg-[#fef08a] text-amber-950 font-black border-t-2 border-amber-400',
                                  stickyLeft: 'bg-[#fef08a] text-amber-950 border-r border-amber-300',
                                  monthCell: 'bg-[#fef08a] text-amber-950 font-bold border-r border-amber-300/80',
                                  stickyRight: 'bg-[#fde047] text-amber-950 font-black border-l border-amber-300 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-amber-950 font-black',
                                  chevron: 'text-amber-900',
                                },
                                gol: {
                                  row: 'bg-[#fef9c3] text-amber-950 font-extrabold hover:bg-[#fef08a] transition-colors',
                                  stickyLeft: 'bg-[#fef9c3] text-amber-950 border-r border-amber-200',
                                  monthCell: 'bg-[#fef9c3] text-amber-950 font-bold border-r border-amber-200/80',
                                  stickyRight: 'bg-[#fef08a] text-amber-950 font-extrabold border-l border-amber-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-amber-900 font-extrabold',
                                  chevron: 'text-amber-800',
                                },
                                kel: {
                                  row: 'bg-[#fefce8] text-amber-900 font-semibold hover:bg-[#fef9c3] transition-colors',
                                  stickyLeft: 'bg-[#fefce8] text-amber-900 border-r border-amber-100',
                                  monthCell: 'bg-[#fefce8] text-amber-800 font-medium border-r border-amber-100/70',
                                  stickyRight: 'bg-[#fef9c3] text-amber-900 font-bold border-l border-amber-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-amber-800 font-bold',
                                  chevron: 'text-amber-700',
                                },
                                anak: {
                                  row: 'bg-white hover:bg-amber-50/40 text-slate-700 transition-colors',
                                  stickyLeft: 'bg-white text-slate-700 border-r border-slate-100',
                                  monthCell: 'bg-white text-slate-600 border-r border-slate-100',
                                  stickyRight: 'bg-white text-amber-700 font-medium border-l border-amber-100 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                }
                              } : {
                                // Kategori Lainnya (Biru / Sky Soft)
                                induk: {
                                  row: 'bg-[#bae6fd] text-sky-950 font-black border-t-2 border-sky-400',
                                  stickyLeft: 'bg-[#bae6fd] text-sky-950 border-r border-sky-300',
                                  monthCell: 'bg-[#bae6fd] text-sky-950 font-bold border-r border-sky-300/80',
                                  stickyRight: 'bg-[#7dd3fc] text-sky-950 font-black border-l border-sky-300 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-sky-950 font-black',
                                  chevron: 'text-sky-900',
                                },
                                gol: {
                                  row: 'bg-[#e0f2fe] text-sky-950 font-extrabold hover:bg-[#bae6fd] transition-colors',
                                  stickyLeft: 'bg-[#e0f2fe] text-sky-950 border-r border-sky-200',
                                  monthCell: 'bg-[#e0f2fe] text-sky-950 font-bold border-r border-sky-200/80',
                                  stickyRight: 'bg-[#bae6fd] text-sky-950 font-extrabold border-l border-sky-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-sky-900 font-extrabold',
                                  chevron: 'text-sky-800',
                                },
                                kel: {
                                  row: 'bg-[#f0f9ff] text-sky-900 font-semibold hover:bg-[#e0f2fe] transition-colors',
                                  stickyLeft: 'bg-[#f0f9ff] text-sky-900 border-r border-sky-100',
                                  monthCell: 'bg-[#f0f9ff] text-sky-800 font-medium border-r border-sky-100/70',
                                  stickyRight: 'bg-[#e0f2fe] text-sky-900 font-bold border-l border-sky-200 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                  badge: 'text-sky-800 font-bold',
                                  chevron: 'text-sky-700',
                                },
                                anak: {
                                  row: 'bg-white hover:bg-sky-50/40 text-slate-700 transition-colors',
                                  stickyLeft: 'bg-white text-slate-700 border-r border-slate-100',
                                  monthCell: 'bg-white text-slate-600 border-r border-slate-100',
                                  stickyRight: 'bg-white text-sky-700 font-medium border-l border-sky-100 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]',
                                }
                              };

                              return (
                                <React.Fragment key={induk.id}>
                                  {/* ROW INDUK (LEVEL 1 - SUM UTAMA / TUA SOFT) */}
                                  <tr className={theme.induk.row}>
                                    <td
                                      className={`${padClass} ${theme.induk.stickyLeft} sticky left-0 z-20 font-sans cursor-pointer select-none`}
                                      onClick={() => togglePivotNode(induk.id, true)}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isIndukExpanded ? <ChevronDown size={14} className={`${theme.induk.chevron} shrink-0`} /> : <ChevronRight size={14} className={`${theme.induk.chevron} shrink-0`} />}
                                        <span className={`font-mono text-xs font-black ${theme.induk.badge}`}>{induk.nomor_akun}</span>
                                        <span className="text-xs font-black uppercase tracking-tight">{induk.nama_akun}</span>
                                      </div>
                                    </td>
                                    <td className={`${padClass} text-right ${theme.induk.monthCell} opacity-60`}>
                                      -
                                    </td>
                                    {induk.months.map((val, mIdx) => (
                                      <td key={mIdx} className={`${padClass} text-right ${theme.induk.monthCell}`}>
                                        {fmt(val)}
                                      </td>
                                    ))}
                                    {/* Total Setahun Induk (Solid Bebas Tembus) */}
                                    <td className={`${padClass} text-right font-black sticky right-0 z-20 ${theme.induk.stickyRight}`}>
                                      {fmt(totalInduk)}
                                    </td>
                                  </tr>

                                  {/* ROW GOLONGAN (LEVEL 2 - SUM GOLONGAN / AGAK MUDA SOFT) */}
                                  {isIndukExpanded && induk.golongans.map((gol) => {
                                    const isGolExpanded = pivotExpandedNodes[gol.id] ?? (pivotHierarchyLevel >= 3);
                                    const totalGol = gol.months.reduce((a, b) => a + b, 0);

                                    return (
                                      <React.Fragment key={gol.id}>
                                        <tr className={theme.gol.row}>
                                          <td
                                            className={`${padClass} pl-7 ${theme.gol.stickyLeft} sticky left-0 z-10 font-sans cursor-pointer select-none`}
                                            onClick={() => togglePivotNode(gol.id, true)}
                                          >
                                            <div className="flex items-center gap-2">
                                              {isGolExpanded ? <ChevronDown size={13} className={`${theme.gol.chevron} shrink-0`} /> : <ChevronRight size={13} className={`${theme.gol.chevron} shrink-0`} />}
                                              <span className={`font-mono text-[11px] font-bold ${theme.gol.badge}`}>{gol.nomor_akun}</span>
                                              <span className="text-xs font-bold">{gol.nama_akun}</span>
                                            </div>
                                          </td>
                                          <td className={`${padClass} text-right ${theme.gol.monthCell} opacity-50`}>
                                            -
                                          </td>
                                          {gol.months.map((val, mIdx) => (
                                            <td key={mIdx} className={`${padClass} text-right ${theme.gol.monthCell}`}>
                                              {fmt(val)}
                                            </td>
                                          ))}
                                          {/* Total Setahun Golongan (Solid Bebas Tembus) */}
                                          <td className={`${padClass} text-right font-extrabold sticky right-0 z-10 ${theme.gol.stickyRight}`}>
                                            {fmt(totalGol)}
                                          </td>
                                        </tr>

                                        {/* ROW KELOMPOK (LEVEL 3 - SUM KELOMPOK / MUDA SOFT) */}
                                        {isGolExpanded && gol.kelompoks.map((kel) => {
                                          const isKelExpanded = pivotExpandedNodes[kel.id] ?? (pivotHierarchyLevel >= 4);
                                          const totalKel = kel.months.reduce((a, b) => a + b, 0);
                                          const hasChildren = kel.anaks && kel.anaks.length > 0;

                                          return (
                                            <React.Fragment key={kel.id}>
                                              <tr className={theme.kel.row}>
                                                <td
                                                  className={`${padClass} pl-12 ${theme.kel.stickyLeft} sticky left-0 z-10 font-sans ${hasChildren ? 'cursor-pointer select-none' : ''}`}
                                                  onClick={hasChildren ? () => togglePivotNode(kel.id, false) : undefined}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    {hasChildren ? (
                                                      isKelExpanded ? <ChevronDown size={12} className={`${theme.kel.chevron} shrink-0`} /> : <ChevronRight size={12} className={`${theme.kel.chevron} shrink-0`} />
                                                    ) : <div className="w-3 shrink-0" />}
                                                    <span className={`font-mono text-[11px] font-bold ${theme.kel.badge}`}>{kel.nomor_akun}</span>
                                                    <span className="text-xs font-semibold">{kel.nama_akun}</span>
                                                  </div>
                                                </td>
                                                <td className={`${padClass} text-right ${theme.kel.monthCell} opacity-40`}>
                                                  -
                                                </td>
                                                {kel.months.map((val, mIdx) => (
                                                  <td key={mIdx} className={`${padClass} text-right ${theme.kel.monthCell}`}>
                                                    {val > 0 ? fmt(val) : '-'}
                                                  </td>
                                                ))}
                                                {/* Total Setahun Kelompok (Solid Bebas Tembus) */}
                                                <td className={`${padClass} text-right font-bold sticky right-0 z-10 ${theme.kel.stickyRight}`}>
                                                  {fmt(totalKel)}
                                                </td>
                                              </tr>

                                              {/* ROW DETAIL / ANAK (LEVEL 4 - RINCIAN TRANSAKSI / PUTIH BERSIH) */}
                                              {isKelExpanded && kel.anaks.map((anak) => {
                                                const totalAnak = anak.months.reduce((a, b) => a + b, 0);

                                                return (
                                                  <tr key={anak.id} className={theme.anak.row}>
                                                    <td className={`${padClass} pl-16 ${theme.anak.stickyLeft} sticky left-0 z-10 font-sans`}>
                                                      <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                                                        <span className="font-mono text-[10px] text-slate-400">{anak.nomor_akun}</span>
                                                        <span className="text-[11px] text-slate-700 truncate max-w-[220px]" title={anak.nama_akun}>
                                                          {anak.nama_akun}
                                                        </span>
                                                      </div>
                                                    </td>
                                                    <td className={`${padClass} text-right ${theme.anak.monthCell} text-slate-300`}>
                                                      -
                                                    </td>
                                                    {anak.months.map((val, mIdx) => (
                                                      <td key={mIdx} className={`${padClass} text-right ${theme.anak.monthCell}`}>
                                                        {val > 0 ? fmt(val) : '-'}
                                                      </td>
                                                    ))}
                                                    {/* Total Setahun Detail (Solid Putih Bebas Tembus) */}
                                                    <td className={`${padClass} text-right font-medium sticky right-0 z-10 ${theme.anak.stickyRight}`}>
                                                      {fmt(totalAnak)}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </React.Fragment>
                                          );
                                        })}
                                      </React.Fragment>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}

                            {/* ============================================================ */}
                            {/* BARIS SURPLUS / DEFISIT BERJALAN BULANAN                     */}
                            {/* ============================================================ */}
                            <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                              <td className={`${padClass} border-r border-slate-200 sticky left-0 z-20 bg-slate-100 font-sans uppercase text-slate-800`}>
                                ⚖ SURPLUS / (DEFISIT) NETTO
                              </td>
                              <td className={`${padClass} text-right bg-slate-100 border-r border-slate-200 text-slate-400`}>
                                -
                              </td>
                              {monthlyNetto.map((diff, mIdx) => (
                                <td
                                  key={mIdx}
                                  className={`${padClass} text-right border-r border-slate-200 font-bold ${
                                    diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-rose-700' : 'text-slate-400'
                                  }`}
                                >
                                  {diff !== 0 ? fmt(diff) : '-'}
                                </td>
                              ))}
                              <td className={`${padClass} text-right font-black border-l border-indigo-200 sticky right-0 z-20 bg-indigo-100 text-indigo-950 shadow-[-5px_0_12px_rgba(0,0,0,0.06)]`}>
                                {fmt(totalPenerimaanSetahun - totalBebanSetahun)}
                              </td>
                            </tr>

                            {/* ============================================================ */}
                            {/* BARIS STICKY: TOTAL POSISI AKHIR (SERAGAM DENGAN POSISI AWAL)*/}
                            {/* ============================================================ */}
                            <tr
                              className="bg-[#e0e7ff] text-indigo-950 font-black cursor-pointer group sticky bottom-0 z-[60] shadow-[0_-6px_16px_rgba(0,0,0,0.08)] border-t-2 border-indigo-300"
                              onClick={() => setPivotExpandPosisiAkhir(!pivotExpandPosisiAkhir)}
                            >
                              <td className={`${padClass} border-r border-indigo-200 sticky left-0 bg-[#e0e7ff] text-indigo-950 z-[65] flex items-center gap-2 uppercase group-hover:bg-[#c7d2fe] transition-colors font-sans`}>
                                {pivotExpandPosisiAkhir ? <ChevronDown size={14} className="text-indigo-700" /> : <ChevronRight size={14} className="text-indigo-600" />}
                                <span className="text-indigo-600 font-bold">▶</span> TOTAL POSISI AKHIR
                              </td>
                              <td className={`${padClass} text-right border-r border-indigo-200 text-slate-400 bg-[#e0e7ff]`}>
                                -
                              </td>
                              {runningSaldo.map((saldo, idx) => (
                                <td key={idx} className={`${padClass} text-right border-r border-indigo-200 bg-[#e0e7ff] text-indigo-950 font-bold`}>
                                  {fmt(saldo)}
                                </td>
                              ))}
                              {/* Total Posisi Akhir (Solid Soft Indigo-200 Bebas Tembus) */}
                              <td className={`${padClass} text-right bg-[#c7d2fe] sticky right-0 z-[65] border-l border-indigo-300 text-indigo-950 font-black shadow-[-4px_0_15px_rgba(0,0,0,0.08)]`}>
                                {fmt(saldoAkhirTotal)}
                              </td>
                            </tr>

                            {/* RINCIAN POSISI AKHIR PER REKENING (EXPANDABLE) */}
                            {pivotExpandPosisiAkhir && samplePivotRekeningSaldo.map((rek) => (
                              <tr key={`pvt-akhir-${rek.id}`} className="bg-slate-50 text-slate-600 italic">
                                <td className={`${padClass} pl-8 border-r border-slate-100 sticky left-0 bg-white z-[40] truncate max-w-[260px] font-sans font-medium`}>
                                  ↳ {rek.nama}
                                </td>
                                <td className={`${padClass} text-right border-r border-slate-100 bg-slate-50 opacity-40`}>
                                  -
                                </td>
                                {rek.saldos.map((s, idx) => (
                                  <td key={idx} className={`${padClass} text-right border-r border-slate-100 opacity-70`}>
                                    {fmt(s)}
                                  </td>
                                ))}
                                <td className={`${padClass} text-right bg-white border-l border-indigo-200 sticky right-0 z-[40] font-black text-indigo-800 shadow-[-5px_0_10px_rgba(0,0,0,0.05)]`}>
                                  {fmt(rek.saldos[11])}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Technical Guideline Card: Solusi 100% Solid Opaque Sticky Right */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 border border-indigo-100 flex items-start gap-3 text-xs text-slate-700">
                      <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-indigo-950 flex items-center gap-2">
                          <span>Standar Dual Sticky Solid: Zero Background Bleed-Through</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Fixed &amp; Verified
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          Pada tabel pivot multi-bulan horizontal dengan scroll ganda, kolom sticky kanan (<strong>Total Setahun</strong>) wajib menggunakan background solid 100% tanpa alpha opacity (contoh: soft <code>bg-[#c7d2fe]</code> untuk Posisi Awal, <code>bg-indigo-100</code> untuk Induk, <code>bg-slate-100</code> untuk Golongan, <code>bg-white</code> untuk Kelompok/Detail, dan soft <code>bg-[#cbd5e1]</code> untuk Posisi Akhir) serta dilengkapi drop shadow ke kiri (<code>shadow-[-5px_0_12px_rgba(0,0,0,0.06)]</code>). Menghilangkan penggunaan class transparan menjamin angka bulanan yang melintas di baliknya <strong>tidak terlihat mendobel</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ========================================================================= */}
              {/* SUB-SECTION 5: STANDARISASI TEMPLATE KOLOM AKSI (ACTION COLUMNS CATALOG)  */}
              {/* ========================================================================= */}
              <div className="pt-6 border-t border-gray-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      <span>Standarisasi Template Kolom &quot;Aksi&quot; (Action Columns Suite)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Pilihan template terstandar untuk tombol tindakan di kolom tabel berdasarkan tingkat urgensi, alur kerja, dan jumlah aksi.
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                    Design System Standards
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* TEMPLATE A: TRIO ACTION GROUP (DEFAULT) */}
                  <div className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/50 space-y-3 hover:bg-slate-50 hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Template 1: Trio Compact Pill</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Master Data</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Format standar untuk baris data umum. Menyediakan aksi cepat Detail (Biru), Edit (Amber), dan Hapus (Rose).
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center">
                      <TableActionGroup>
                        <TableActionButton icon={Eye} variant="primary" title="Lihat Detail" size="sm" onClick={() => triggerToast('info', 'Aksi Detail', 'Tombol detail ditekan')} />
                        <TableActionButton icon={Pencil} variant="warning" title="Ubah Data" size="sm" onClick={() => triggerToast('warning', 'Aksi Edit', 'Tombol edit ditekan')} />
                        <TableActionButton icon={Trash2} variant="danger" title="Hapus Data" size="sm" onClick={() => triggerToast('error', 'Aksi Hapus', 'Tombol hapus ditekan')} />
                      </TableActionGroup>
                    </div>
                  </div>

                  {/* TEMPLATE B: PRIMARY BUTTON WITH LABEL */}
                  <div className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/50 space-y-3 hover:bg-slate-50 hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Template 2: Action with Text Label</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">High Clarity</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Disertai label teks untuk aksi prioritas tinggi yang memerlukan kejelasan instan oleh pengguna.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center gap-1.5">
                      <TableActionGroup>
                        <TableActionButton icon={Eye} variant="indigo" label="Buka Nota" title="Lihat Nota" size="sm" onClick={() => triggerToast('info', 'Buka Nota', 'Membuka dokumen nota analisis')} />
                        <TableActionButton icon={Pencil} variant="warning" title="Ubah Dokumen" size="sm" onClick={() => triggerToast('warning', 'Edit Dokumen', 'Membuka form koreksi')} />
                      </TableActionGroup>
                    </div>
                  </div>

                  {/* TEMPLATE C: QUICK APPROVAL / VERIFIKASI */}
                  <div className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/50 space-y-3 hover:bg-slate-50 hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Template 3: Quick Approval Switch</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Verifikasi</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Khusus alur kerja persetujuan pagu: tombol hijau untuk Setujui Penuh dan tombol merah untuk Tolak / Kembalikan.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center">
                      <TableActionGroup>
                        <TableActionButton icon={CheckCircle2} variant="success" label="Setujui" title="Setujui Usulan" size="sm" onClick={() => triggerToast('success', 'Disetujui', 'Usulan pagu telah disetujui')} />
                        <TableActionButton icon={X} variant="danger" label="Tolak" title="Tolak Usulan" size="sm" onClick={() => triggerToast('error', 'Ditolak', 'Usulan pagu ditolak / dikembalikan')} />
                      </TableActionGroup>
                    </div>
                  </div>

                  {/* TEMPLATE D: DOKUMEN CETAK & PREVIEW */}
                  <div className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/50 space-y-3 hover:bg-slate-50 hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Template 4: Dokumen & Cetak Cetak</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Laporan</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ditujukan untuk baris yang menghasilkan berkas fisik: Pratinjau PDF, Cetak Langsung, dan Ekspor Excel.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center">
                      <TableActionGroup>
                        <TableActionButton icon={Eye} variant="primary" title="Pratinjau PDF" size="sm" onClick={() => setDocViewerOpen(true)} />
                        <TableActionButton icon={Printer} variant="default" title="Cetak Langsung" size="sm" onClick={() => triggerToast('info', 'Cetak', 'Menyiapkan dialog pencetakan nota')} />
                        <TableActionButton icon={FileSpreadsheet} variant="success" title="Unduh Excel" size="sm" onClick={() => triggerToast('success', 'Excel', 'Mengunduh rekap dalam format Excel')} />
                      </TableActionGroup>
                    </div>
                  </div>

                  {/* TEMPLATE E: HYBRID DETAIL & POP-UP MODAL */}
                  <div className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/50 space-y-3 hover:bg-slate-50 hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Template 5: Executive Action Console</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Dual View + Edit</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standar Tambah Pagu: Konsol 2-tingkat dengan tombol utama Pop-up Detail Cepat (Modal) + tombol Halaman Penuh & Edit Usulan.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center">
                      <div className="flex flex-col gap-1.5 w-full max-w-[200px] p-1.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl shadow-2xs">
                        <button
                          onClick={() => triggerToast('info', 'Pop-up Modal', 'Membuka pop-up inspeksi cepat usulan')}
                          className="relative overflow-hidden w-full flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-xs shadow-indigo-300/40 text-[11px] font-bold transition-all cursor-pointer group active:scale-[0.97]"
                        >
                          <div className="flex items-center gap-1.5">
                            <Eye size={13} className="text-indigo-100 group-hover:scale-125 transition-transform" />
                            <span>Pop-up Detail</span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-white/20 text-white rounded-md">Modal</span>
                          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => triggerToast('info', 'Halaman Penuh', 'Membuka halaman rincian penuh')}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-white hover:bg-slate-800 text-slate-700 hover:text-white rounded-xl border border-slate-200/90 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            <ExternalLink size={11} className="text-slate-500" />
                            <span>Halaman</span>
                          </button>
                          <button
                            onClick={() => triggerToast('warning', 'Edit Usulan', 'Membuka form koreksi usulan')}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-50/90 hover:bg-amber-600 text-amber-800 hover:text-white rounded-xl border border-amber-200/90 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            <Pencil size={11} className="text-amber-600" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TEMPLATE F: ACCORDION EXPAND TRIGGER */}
                  <div className="p-4 rounded-2xl border border-gray-200/80 bg-slate-50/50 space-y-3 hover:bg-slate-50 hover:shadow-xs transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Template 6: Single Inspector Pill</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Sub-Item</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Desain tombol tunggal hemat ruang dengan rounded lembut untuk tabel bersarang atau baris anak.
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center">
                      <TableActionGroup>
                        <TableActionButton icon={Eye} variant="primary" label="Lihat Rincian" title="Periksa Item" size="sm" onClick={() => triggerToast('info', 'Rincian', 'Membuka rincian sub-item')} />
                      </TableActionGroup>
                    </div>
                  </div>
                </div>
              </div>
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
  variant="chevron" // Pilihan: 'cards' | 'chevron' | 'timeline' | 'compact'
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

      {/* Lightbox Demo Interaktif */}
      <GalleryLightbox
        isOpen={isDemoGalleryOpen}
        items={sampleGalleryItems}
        currentIndex={demoGalleryIndex}
        title="Pratinjau Bukti & Lampiran Transaksi Keuangan"
        subtitle="Dokumen Verifikasi Belanja Kas & Bank • Demo Interaktif"
        onClose={() => setIsDemoGalleryOpen(false)}
        onIndexChange={(idx) => setDemoGalleryIndex(idx)}
      />
    </div>
  );
}
