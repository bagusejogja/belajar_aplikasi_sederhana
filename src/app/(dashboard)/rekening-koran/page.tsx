'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Table as TableIcon,
  Download, 
  Eye, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  ExternalLink, 
  Link2, 
  Copy, 
  Check, 
  UploadCloud, 
  Building2, 
  Calendar, 
  CreditCard, 
  Wallet, 
  ShieldCheck, 
  Database, 
  Layers, 
  ArrowUpRight, 
  AlertCircle, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  CheckCircle2,
  FolderTree,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { getSafeFileUrl, getDownloadSafeFileUrl } from '@/lib/fileHelper';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export interface RekeningKoranItem {
  id: string;
  tahun: number;
  bulan: number;
  nama_bulan: string;
  rekening_id?: string | number;
  nama_bank: string;
  nomor_rekening: string;
  nama_rekening: string;
  tipe_sumber: 'file' | 'link';
  file_url: string;
  file_name: string;
  file_type: 'pdf' | 'excel' | 'csv';
  file_size?: string;
  r2_key?: string;
  saldo_awal?: number | null;
  saldo_akhir?: number | null;
  keterangan?: string;
  uploader?: string;
  created_at: string;
}

export interface BankAccount {
  id: number;
  nama_bank: string;
  nomor_rekening: string;
  nama_pemilik: string;
  status?: string;
}

const BULAN_OPTIONS = [
  { value: 1, label: '01 - Januari' },
  { value: 2, label: '02 - Februari' },
  { value: 3, label: '03 - Maret' },
  { value: 4, label: '04 - April' },
  { value: 5, label: '05 - Mei' },
  { value: 6, label: '06 - Juni' },
  { value: 7, label: '07 - Juli' },
  { value: 8, label: '08 - Agustus' },
  { value: 9, label: '09 - September' },
  { value: 10, label: '10 - Oktober' },
  { value: 11, label: '11 - November' },
  { value: 12, label: '12 - Desember' },
];

export default function RekeningKoranMasjidPage() {
  const [items, setItems] = useState<RekeningKoranItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTahun, setSelectedTahun] = useState<string>('ALL');
  const [selectedRekening, setSelectedRekening] = useState<string>('ALL');
  const [selectedFileType, setSelectedFileType] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'accordion' | 'tree'>('accordion');

  // Collapse States (Set of expanded keys)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2026, 2025]));
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(['2026-3', '2026-2', '2026-1']));

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'link'>('file');

  // Form State
  const [formTahun, setFormTahun] = useState<number>(2026);
  const [formBulan, setFormBulan] = useState<number>(new Date().getMonth() + 1);
  const [formSelectedRekeningId, setFormSelectedRekeningId] = useState<string>('');
  const [formNamaBank, setFormNamaBank] = useState<string>('Bank Syariah Indonesia (BSI)');
  const [formNoRekening, setFormNoRekening] = useState<string>('7666333211');
  const [formNamaRekening, setFormNamaRekening] = useState<string>('MARDLIYYAH ISLAMIC CENTER');
  const [formSaldoAwal, setFormSaldoAwal] = useState<string>('');
  const [formSaldoAkhir, setFormSaldoAkhir] = useState<string>('');
  const [formKeterangan, setFormKeterangan] = useState<string>('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formLinkUrl, setFormLinkUrl] = useState<string>('');
  const [formLinkJudul, setFormLinkJudul] = useState<string>('');
  const [formLinkType, setFormLinkType] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<RekeningKoranItem | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [sheetData, setSheetData] = useState<{ headers: string[]; rows: any[][] } | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<RekeningKoranItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/masjid/rekening-koran');
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        if (json.accounts && json.accounts.length > 0) {
          setBankAccounts(json.accounts);
          if (!formSelectedRekeningId) {
            setFormSelectedRekeningId(String(json.accounts[0].id));
            setFormNamaBank(json.accounts[0].nama_bank);
            setFormNoRekening(json.accounts[0].nomor_rekening);
            setFormNamaRekening(json.accounts[0].nama_pemilik);
          }
        }
      } else {
        toast.error(json.error || 'Gagal memuat rekening koran');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.error('Gagal terhubung ke server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync rekening selection in form
  const handleSelectRekeningChange = (val: string) => {
    setFormSelectedRekeningId(val);
    if (val === 'CUSTOM') {
      setFormNamaBank('');
      setFormNoRekening('');
      setFormNamaRekening('');
    } else {
      const found = bankAccounts.find(a => String(a.id) === val);
      if (found) {
        setFormNamaBank(found.nama_bank);
        setFormNoRekening(found.nomor_rekening);
        setFormNamaRekening(found.nama_pemilik);
      }
    }
  };

  // Toggle Collapse
  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    const allY = new Set<number>();
    const allM = new Set<string>();
    items.forEach(it => {
      allY.add(it.tahun);
      allM.add(`${it.tahun}-${it.bulan}`);
    });
    setExpandedYears(allY);
    setExpandedMonths(allM);
  };

  const collapseAll = () => {
    setExpandedYears(new Set());
    setExpandedMonths(new Set());
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = it.file_name?.toLowerCase().includes(q);
        const matchBank = it.nama_bank?.toLowerCase().includes(q);
        const matchRek = it.nomor_rekening?.toLowerCase().includes(q);
        const matchKet = it.keterangan?.toLowerCase().includes(q);
        if (!matchName && !matchBank && !matchRek && !matchKet) return false;
      }
      // Tahun
      if (selectedTahun !== 'ALL' && it.tahun !== Number(selectedTahun)) {
        return false;
      }
      // Rekening
      if (selectedRekening !== 'ALL') {
        const matchesRek = it.nomor_rekening === selectedRekening || String(it.rekening_id) === selectedRekening;
        if (!matchesRek) return false;
      }
      // File Type
      if (selectedFileType !== 'ALL') {
        if (selectedFileType === 'link') {
          if (it.tipe_sumber !== 'link') return false;
        } else {
          if (it.file_type !== selectedFileType) return false;
        }
      }
      return true;
    });
  }, [items, searchQuery, selectedTahun, selectedRekening, selectedFileType]);

  // Grouped by Tahun -> Bulan -> Items
  const groupedData = useMemo(() => {
    const groups: { [tahun: number]: { [bulan: number]: RekeningKoranItem[] } } = {};

    filteredItems.forEach(it => {
      if (!groups[it.tahun]) groups[it.tahun] = {};
      if (!groups[it.tahun][it.bulan]) groups[it.tahun][it.bulan] = [];
      groups[it.tahun][it.bulan].push(it);
    });

    // Urutkan tahun desc
    const sortedYears = Object.keys(groups)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedYears.map(year => {
      const monthObj = groups[year];
      const sortedMonths = Object.keys(monthObj)
        .map(Number)
        .sort((a, b) => b - a);

      return {
        year,
        months: sortedMonths.map(month => ({
          month,
          monthName: BULAN_OPTIONS.find(b => b.value === month)?.label.split(' - ')[1] || `Bulan ${month}`,
          items: monthObj[month]
        }))
      };
    });
  }, [filteredItems]);

  // Available unique bank accounts & years for filters
  const uniqueAccounts = useMemo(() => {
    const map = new Map<string, { no_rek: string; nama_bank: string; nama_rekening: string }>();
    items.forEach(it => {
      if (it.nomor_rekening && !map.has(it.nomor_rekening)) {
        map.set(it.nomor_rekening, {
          no_rek: it.nomor_rekening,
          nama_bank: it.nama_bank,
          nama_rekening: it.nama_rekening
        });
      }
    });
    bankAccounts.forEach(ba => {
      if (ba.nomor_rekening && !map.has(ba.nomor_rekening)) {
        map.set(ba.nomor_rekening, {
          no_rek: ba.nomor_rekening,
          nama_bank: ba.nama_bank,
          nama_rekening: ba.nama_pemilik
        });
      }
    });
    return Array.from(map.values());
  }, [items, bankAccounts]);

  const uniqueYears = useMemo(() => {
    const setY = new Set<number>([2026, 2025]);
    items.forEach(it => setY.add(it.tahun));
    return Array.from(setY).sort((a, b) => b - a);
  }, [items]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalDocs = items.length;
    const totalRekening = uniqueAccounts.length;
    const docs2026 = items.filter(i => i.tahun === 2026).length;
    const totalPdf = items.filter(i => i.file_type === 'pdf').length;
    const totalExcel = items.filter(i => i.file_type === 'excel').length;
    const totalCsv = items.filter(i => i.file_type === 'csv').length;

    return {
      totalDocs,
      totalRekening,
      docs2026,
      totalPdf,
      totalExcel,
      totalCsv
    };
  }, [items, uniqueAccounts]);

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadTab === 'file' && !formFile) {
      toast.error('Silakan pilih berkas file rekening koran (PDF, Excel, atau CSV)!');
      return;
    }
    if (uploadTab === 'link' && !formLinkUrl.trim()) {
      toast.error('Silakan masukkan tautan URL dokumen rekening koran!');
      return;
    }

    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Mengunggah rekening koran ke Cloudflare R2...');

      const formData = new FormData();
      formData.append('tahun', String(formTahun));
      formData.append('bulan', String(formBulan));
      formData.append('rekening_id', formSelectedRekeningId);
      formData.append('nama_bank', formNamaBank);
      formData.append('nomor_rekening', formNoRekening);
      formData.append('nama_rekening', formNamaRekening);
      if (formSaldoAwal) formData.append('saldo_awal', formSaldoAwal.replace(/[^0-9]/g, ''));
      if (formSaldoAkhir) formData.append('saldo_akhir', formSaldoAkhir.replace(/[^0-9]/g, ''));
      formData.append('keterangan', formKeterangan);
      formData.append('uploader', 'Admin Keuangan Masjid');

      if (uploadTab === 'file' && formFile) {
        formData.append('tipe_sumber', 'file');
        formData.append('file', formFile);
      } else {
        formData.append('tipe_sumber', 'link');
        formData.append('link_url', formLinkUrl);
        formData.append('link_judul', formLinkJudul || `Tautan Rekening Koran ${formNamaBank} Bulan ${formBulan}`);
        formData.append('file_type', formLinkType);
      }

      const res = await fetch('/api/masjid/rekening-koran', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      toast.dismiss(loadingToast);

      if (json.success) {
        toast.success(json.message || 'Rekening koran berhasil diarsipkan!');
        setIsUploadOpen(false);
        // Reset form
        setFormFile(null);
        setFormLinkUrl('');
        setFormLinkJudul('');
        setFormSaldoAwal('');
        setFormSaldoAkhir('');
        setFormKeterangan('');
        // Expand year & month uploaded
        setExpandedYears(prev => new Set(prev).add(formTahun));
        setExpandedMonths(prev => new Set(prev).add(`${formTahun}-${formBulan}`));
        fetchData();
      } else {
        toast.error(json.error || 'Gagal mengunggah rekening koran');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Terjadi kesalahan saat mengunggah');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch('/api/masjid/rekening-koran', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemToDelete.id,
          tahun: itemToDelete.tahun,
          r2_key: itemToDelete.r2_key
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Dokumen rekening koran berhasil dihapus!');
        setItemToDelete(null);
        fetchData();
      } else {
        toast.error(json.error || 'Gagal menghapus dokumen');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(false);
    }
  };

  // Preview Handling
  const handleOpenPreview = async (item: RekeningKoranItem) => {
    setPreviewItem(item);
    setPreviewZoom(100);
    setPreviewRotation(0);
    setSheetData(null);

    // Jika Excel atau CSV, coba parse isinya secara interaktif
    if (item.file_type === 'excel' || item.file_type === 'csv') {
      try {
        setSheetLoading(true);
        const safeUrl = getSafeFileUrl(item.file_url, item.file_name);
        const resp = await fetch(safeUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          if (jsonData && jsonData.length > 0) {
            const rawHeaders = jsonData[0].map((h: any, i: number) => String(h || `Kolom ${i + 1}`));
            const rows = jsonData.slice(1, 200); // Limit 200 baris untuk performa
            setSheetData({ headers: rawHeaders, rows });
          }
        }
      } catch (err) {
        console.warn('Gagal membaca sheet interaktif:', err);
      } finally {
        setSheetLoading(false);
      }
    }
  };

  // Helper File Icon & Badges
  const renderFileIcon = (type: 'pdf' | 'excel' | 'csv', isLink: boolean, size = 18) => {
    if (isLink) {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
          <Link2 size={size} />
        </div>
      );
    }
    switch (type) {
      case 'excel':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={size} />
          </div>
        );
      case 'csv':
        return (
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0">
            <TableIcon size={size} />
          </div>
        );
      case 'pdf':
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
            <FileText size={size} />
          </div>
        );
    }
  };

  const renderFormatBadge = (type: 'pdf' | 'excel' | 'csv', isLink: boolean) => {
    if (isLink) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          LINK
        </span>
      );
    }
    switch (type) {
      case 'excel':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            EXCEL
          </span>
        );
      case 'csv':
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            CSV
          </span>
        );
      case 'pdf':
      default:
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            PDF
          </span>
        );
    }
  };

  const formatRupiah = (val?: number | null) => {
    if (val === null || val === undefined) return '-';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Header Halaman */}
      <PageHeader
        title="Rekening Koran Bulanan Masjid"
        subtitle="Pusat arsip dan pemantauan rekening koran kas masjid (CSV, Excel, PDF) terstruktur per tahun, bulan, dan rekening bank dengan penyimpanan aman di Cloudflare R2."
        icon={FileSpreadsheet}
        badge={{ text: 'Grup Masjid', variant: 'purple' }}
        breadcrumbs={[
          { label: 'Masjid', href: '/dashboard' },
          { label: 'Rekening Koran Bulanan' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              title="Perbarui Data"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Unggah Rekening Koran</span>
            </button>
          </div>
        }
      />

      {/* 2. 4 Kartu KPI Ringkasan (Design System Standard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Dokumen */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-1">
                Total Arsip Dokumen
              </span>
              <div className="text-2xl font-black text-gray-900 dark:text-slate-100 font-mono">
                {stats.totalDocs}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
              <Database size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2">
            <span>Komposisi Format:</span>
            <span className="font-mono text-[11px] text-gray-700 dark:text-slate-300">
              {stats.totalPdf} PDF • {stats.totalExcel} XLS • {stats.totalCsv} CSV
            </span>
          </div>
        </div>

        {/* Card 2: Rekening Bank Terdaftar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-1">
                Rekening Kas Masjid
              </span>
              <div className="text-2xl font-black text-gray-900 dark:text-slate-100 font-mono">
                {stats.totalRekening}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2">
            <span>Akun Utama:</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-black text-[11px]">
              BSI (7666333211)
            </span>
          </div>
        </div>

        {/* Card 3: Tahun Berjalan 2026 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-1">
                Arsip Tahun 2026
              </span>
              <div className="text-2xl font-black text-gray-900 dark:text-slate-100 font-mono">
                {stats.docs2026} Dokumen
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2">
            <span>Status Periode:</span>
            <span className="text-indigo-700 dark:text-indigo-300 font-black text-[11px]">
              Q1 Berjalan (Aktif)
            </span>
          </div>
        </div>

        {/* Card 4: Penyimpanan Cloudflare R2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block mb-1">
                Folder Cloudflare R2
              </span>
              <div className="text-base font-black text-gray-900 dark:text-slate-100 font-mono truncate max-w-[170px]" title="rekening_koran_masjid">
                rekening_koran_masjid/
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
              <UploadCloud size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2">
            <span>Proteksi DNS:</span>
            <span className="text-amber-700 dark:text-amber-300 font-black text-[11px] flex items-center gap-1">
              <ShieldCheck size={12} /> Safe Proxy Active
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Tampilan Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama berkas, nomor rekening, bank, atau keterangan..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Rekening */}
            <div className="relative min-w-[200px]">
              <select
                value={selectedRekening}
                onChange={(e) => setSelectedRekening(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 pr-8 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">Semua Rekening Bank ({uniqueAccounts.length})</option>
                {uniqueAccounts.map(acc => (
                  <option key={acc.no_rek} value={acc.no_rek}>
                    {acc.nama_bank} - {acc.no_rek}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Tahun */}
            <div className="relative min-w-[120px]">
              <select
                value={selectedTahun}
                onChange={(e) => setSelectedTahun(e.target.value)}
                className="w-full appearance-none px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 pr-8 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">Semua Tahun</option>
                {uniqueYears.map(yr => (
                  <option key={yr} value={yr}>Tahun {yr}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* View Switcher: Accordion vs Tree View */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('accordion')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'accordion'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
                }`}
              >
                <Layers size={13} />
                <span>Kolaps Accordion</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
                }`}
              >
                <FolderTree size={13} />
                <span>Hierarki Pohon</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Format Pills & Expand/Collapse Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800/80 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 mr-1">
              Format:
            </span>
            {[
              { id: 'ALL', label: 'Semua Format' },
              { id: 'pdf', label: 'PDF Dokumen' },
              { id: 'excel', label: 'Excel (.xlsx)' },
              { id: 'csv', label: 'CSV Data' },
              { id: 'link', label: 'Tautan / Link' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFileType(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  selectedFileType === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Buka Semua (Expand)
            </button>
            <span className="text-gray-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] font-bold text-gray-500 dark:text-slate-400 hover:underline cursor-pointer"
            >
              Tutup Semua (Collapse)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Konten Utama: Kolaps Tahun -> Bulan -> Rekening */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-gray-200/80 dark:border-slate-800 shadow-xs">
          <RefreshCw size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-500">Memuat arsip rekening koran dari Cloudflare R2...</p>
        </div>
      ) : groupedData.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <FileSpreadsheet size={28} />
          </div>
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-200">
            Tidak Ditemukan Dokumen Rekening Koran
          </h3>
          <p className="text-xs text-gray-400 dark:text-slate-500 max-w-sm mx-auto">
            Tidak ada dokumen yang sesuai dengan kata kunci pencarian atau filter yang dipilih.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedTahun('ALL');
              setSelectedRekening('ALL');
              setSelectedFileType('ALL');
            }}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedData.map(({ year, months }) => {
            const isYearOpen = expandedYears.has(year);
            const totalDocsInYear = months.reduce((acc, m) => acc + m.items.length, 0);

            return (
              <div
                key={year}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                {/* Header Level 1: Tahun */}
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className="w-full p-4 bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-all cursor-pointer border-b border-gray-200/60 dark:border-slate-800 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {year}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-gray-900 dark:text-slate-100 tracking-tight">
                          Tahun Anggaran {year}
                        </h2>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {totalDocsInYear} Berkas
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Arsip mutasi bank per bulan dan rekening kas masjid
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 hidden sm:inline">
                      {isYearOpen ? 'Tutup Tahun' : 'Buka Tahun'}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-gray-200/70 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300">
                      {isYearOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>
                </button>

                {/* Body Level 1: Daftar Bulan (Jika Tahun Terbuka) */}
                {isYearOpen && (
                  <div className="p-4 space-y-3 bg-gray-50/40 dark:bg-slate-900/60">
                    {months.map(({ month, monthName, items: monthDocs }) => {
                      const monthKey = `${year}-${month}`;
                      const isMonthOpen = expandedMonths.has(monthKey);

                      return (
                        <div
                          key={monthKey}
                          className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200/70 dark:border-slate-700/80 shadow-2xs overflow-hidden"
                        >
                          {/* Header Level 2: Bulan */}
                          <button
                            type="button"
                            onClick={() => toggleMonth(monthKey)}
                            className="w-full p-3 px-4 bg-white hover:bg-gray-50/80 dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center justify-between transition-all cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <Calendar size={13} />
                              </div>
                              <span className="text-xs font-black text-gray-900 dark:text-slate-100 tracking-tight">
                                {monthName} {year}
                              </span>
                              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                {monthDocs.length} Dokumen Rekening
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isMonthOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            </div>
                          </button>

                          {/* Body Level 2: Daftar Rekening & Berkas (Jika Bulan Terbuka) */}
                          {isMonthOpen && (
                            <div className="border-t border-gray-100 dark:border-slate-700/80 divide-y divide-gray-100 dark:divide-slate-700/50">
                              {monthDocs.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3.5 px-4 hover:bg-slate-50/80 dark:hover:bg-slate-750/50 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                                >
                                  {/* Info Berkas & Rekening */}
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    {renderFileIcon(item.file_type, item.tipe_sumber === 'link')}
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4
                                          onClick={() => handleOpenPreview(item)}
                                          className="text-xs font-black text-gray-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate transition-colors"
                                          title={item.file_name}
                                        >
                                          {item.file_name}
                                        </h4>
                                        {renderFormatBadge(item.file_type, item.tipe_sumber === 'link')}
                                        <span className="text-[10px] font-mono text-gray-400">
                                          {item.file_size || 'N/A'}
                                        </span>
                                      </div>

                                      {/* Rekening Info Pill */}
                                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-500 dark:text-slate-400">
                                        <span className="font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                                          <CreditCard size={11} className="text-blue-600" />
                                          {item.nama_bank}
                                        </span>
                                        <span>•</span>
                                        <span className="font-mono font-bold text-gray-900 dark:text-slate-100">
                                          {item.nomor_rekening}
                                        </span>
                                        <span>•</span>
                                        <span className="truncate max-w-[200px]" title={item.nama_rekening}>
                                          {item.nama_rekening}
                                        </span>
                                      </div>

                                      {/* Saldo & Keterangan */}
                                      {(item.saldo_awal !== null || item.saldo_akhir !== null || item.keterangan) && (
                                        <div className="pt-1 flex items-center gap-3 text-[11px] flex-wrap">
                                          {item.saldo_awal !== null && (
                                            <span className="text-gray-500">
                                              Saldo Awal: <strong className="font-mono text-gray-800 dark:text-slate-200">{formatRupiah(item.saldo_awal)}</strong>
                                            </span>
                                          )}
                                          {item.saldo_akhir !== null && (
                                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                              Saldo Akhir: <strong className="font-mono font-bold text-emerald-800 dark:text-emerald-300">{formatRupiah(item.saldo_akhir)}</strong>
                                            </span>
                                          )}
                                          {item.keterangan && (
                                            <span className="text-gray-400 italic truncate max-w-sm" title={item.keterangan}>
                                              &ldquo;{item.keterangan}&rdquo;
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Tombol Aksi: View, Download, Delete */}
                                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPreview(item)}
                                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="Lihat / Preview Dokumen"
                                    >
                                      <Eye size={12} />
                                      <span>Lihat</span>
                                    </button>

                                    <a
                                      href={getDownloadSafeFileUrl(item.file_url, item.file_name)}
                                      download={item.file_name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      title="Unduh File Rekening Koran"
                                    >
                                      <Download size={12} />
                                      <span>Unduh</span>
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() => setItemToDelete(item)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer"
                                      title="Hapus Dokumen"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal Unggah Dokumen / Tautan Link */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-5 px-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">
                    Unggah Rekening Koran Bulanan
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Disimpan otomatis ke folder Cloudflare R2: <strong>rekening_koran_masjid/</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Tab Selector: File vs Link */}
              <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-1 border border-gray-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setUploadTab('file')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    uploadTab === 'file'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <UploadCloud size={13} />
                  <span>Unggah Berkas File (R2)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab('link')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    uploadTab === 'link'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Link2 size={13} />
                  <span>Tautan Online / Cloud Link</span>
                </button>
              </div>

              {/* Grid: Tahun & Bulan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                    Tahun Anggaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formTahun}
                    onChange={(e) => setFormTahun(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {[2026, 2025, 2024, 2023].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                    Bulan Rekening <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formBulan}
                    onChange={(e) => setFormBulan(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {BULAN_OPTIONS.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rekening Bank Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                  Pilih Rekening Kas Masjid <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSelectedRekeningId}
                  onChange={(e) => handleSelectRekeningChange(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {bankAccounts.map(ba => (
                    <option key={ba.id} value={String(ba.id)}>
                      {ba.nama_bank} - {ba.nomor_rekening} ({ba.nama_pemilik})
                    </option>
                  ))}
                  <option value="CUSTOM">+ Rekening Lainnya (Ketik Manual)...</option>
                </select>
              </div>

              {/* Jika CUSTOM, munculkan input manual */}
              {formSelectedRekeningId === 'CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Nama Bank</label>
                    <input
                      type="text"
                      value={formNamaBank}
                      onChange={(e) => setFormNamaBank(e.target.value)}
                      placeholder="BSI, Mandiri, dll."
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">No. Rekening</label>
                    <input
                      type="text"
                      value={formNoRekening}
                      onChange={(e) => setFormNoRekening(e.target.value)}
                      placeholder="1234567890"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500">Nama Pemilik</label>
                    <input
                      type="text"
                      value={formNamaRekening}
                      onChange={(e) => setFormNamaRekening(e.target.value)}
                      placeholder="MIC / Takmir"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* File Dropzone atau Link Input */}
              {uploadTab === 'file' ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                    Berkas Dokumen (CSV, Excel, atau PDF) <span className="text-rose-500">*</span>
                  </label>
                  <div
                    onClick={() => document.getElementById('r2-file-input')?.click()}
                    className="p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-gray-50/50 hover:bg-blue-50/20 text-center cursor-pointer transition-all"
                  >
                    <input
                      id="r2-file-input"
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    <UploadCloud size={28} className="mx-auto mb-2 text-blue-600" />
                    {formFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-black text-gray-900 dark:text-slate-100">{formFile.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          Ukuran: {Math.round(formFile.size / 1024)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-300">
                          Klik untuk memilih berkas atau seret ke sini
                        </p>
                        <p className="text-[11px] text-gray-400">
                          Format didukung: <strong>.pdf</strong>, <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                      Tautan URL Dokumen (Google Drive, Cloud Storage, dll.) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formLinkUrl}
                      onChange={(e) => setFormLinkUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Judul Tautan / Berkas</label>
                      <input
                        type="text"
                        value={formLinkJudul}
                        onChange={(e) => setFormLinkJudul(e.target.value)}
                        placeholder="Contoh: RK BSI Maret 2026 Drive"
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">Tipe Konten Dokumen</label>
                      <select
                        value={formLinkType}
                        onChange={(e) => setFormLinkType(e.target.value as any)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                      >
                        <option value="pdf">PDF Dokumen</option>
                        <option value="excel">Excel (.xlsx)</option>
                        <option value="csv">CSV Data</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Saldo Awal & Akhir */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                    Saldo Awal (Opsional)
                  </label>
                  <input
                    type="number"
                    value={formSaldoAwal}
                    onChange={(e) => setFormSaldoAwal(e.target.value)}
                    placeholder="Contoh: 150000000"
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                    Saldo Akhir (Opsional)
                  </label>
                  <input
                    type="number"
                    value={formSaldoAkhir}
                    onChange={(e) => setFormSaldoAkhir(e.target.value)}
                    placeholder="Contoh: 185000000"
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400 block">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Catatan rekonsiliasi, keterangan mutasi, atau perihal dokumen..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Notice Cloudflare */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 rounded-xl flex items-start gap-2 text-xs text-blue-900 dark:text-blue-300">
                <Info size={15} className="shrink-0 text-blue-600 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Berkas fisik akan otomatis diunggah ke Cloudflare R2 pada direktori <strong>rekening_koran_masjid/</strong> dengan perlindungan bypass ISP sehingga aman diakses dari jaringan manapun.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Simpan &amp; Unggah</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Interaktif Preview / View Dokumen */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
            {/* Header Preview */}
            <div className="p-4 px-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs">
              <div className="flex items-center gap-3 min-w-0">
                {renderFileIcon(previewItem.file_type, previewItem.tipe_sumber === 'link', 16)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 truncate max-w-md">
                      {previewItem.file_name}
                    </h3>
                    {renderFormatBadge(previewItem.file_type, previewItem.tipe_sumber === 'link')}
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {previewItem.nama_bank} • Rek: {previewItem.nomor_rekening} • {previewItem.nama_bulan} {previewItem.tahun}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                {previewItem.file_type === 'pdf' && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(50, z - 20))}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-600 transition-all"
                      title="Perkecil Zoom"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-1 text-gray-600">{previewZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(200, z + 20))}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-600 transition-all"
                      title="Perbesar Zoom"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                      className="p-1.5 hover:bg-white rounded-lg text-gray-600 transition-all"
                      title="Putar Dokumen"
                    >
                      <RotateCw size={14} />
                    </button>
                  </div>
                )}

                <a
                  href={getDownloadSafeFileUrl(previewItem.file_url, previewItem.file_name)}
                  download={previewItem.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Unduh</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content Body Preview */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100/60 dark:bg-slate-950 flex items-center justify-center">
              {previewItem.file_type === 'pdf' ? (
                previewItem.tipe_sumber === 'link' && previewItem.file_url.includes('drive.google.com') ? (
                  <iframe
                    src={previewItem.file_url.replace('/view', '/preview')}
                    className="w-full h-full rounded-2xl border border-gray-200 bg-white shadow-xs"
                    title="Google Drive Preview"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform"
                    style={{ transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)` }}
                  >
                    <iframe
                      src={getSafeFileUrl(previewItem.file_url, previewItem.file_name)}
                      className="w-full h-full rounded-2xl border border-gray-200 bg-white shadow-md"
                      title="PDF Preview"
                    />
                  </div>
                )
              ) : previewItem.file_type === 'excel' || previewItem.file_type === 'csv' ? (
                sheetLoading ? (
                  <div className="text-center p-8 space-y-2">
                    <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-500">Membaca data spreadsheet...</p>
                  </div>
                ) : sheetData && sheetData.rows.length > 0 ? (
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
                    <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-emerald-700" />
                        Pratinjau Lembar Kerja (Menampilkan {sheetData.rows.length} Baris Pertama)
                      </span>
                      <span className="text-[11px] font-mono text-emerald-800">
                        {sheetData.headers.length} Kolom
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10">
                            {sheetData.headers.map((h, i) => (
                              <th key={i} className="p-2.5 px-3 font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider text-[10px] whitespace-nowrap border-r border-gray-200/50">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-mono text-[11px]">
                          {sheetData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              {sheetData.headers.map((_, cIdx) => (
                                <td key={cIdx} className="p-2 px-3 whitespace-nowrap text-gray-700 dark:text-slate-300 border-r border-gray-100">
                                  {row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 space-y-3 max-w-md shadow-xs">
                    <FileSpreadsheet size={40} className="text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-black text-gray-800">Berkas Spreadsheet Siap Diunduh</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Berkas rekening koran berformat <strong>{previewItem.file_type.toUpperCase()}</strong> dapat diunduh langsung untuk dianalisis di Microsoft Excel atau Google Sheets.
                    </p>
                    <a
                      href={getDownloadSafeFileUrl(previewItem.file_url, previewItem.file_name)}
                      download={previewItem.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20"
                    >
                      <Download size={14} />
                      <span>Unduh {previewItem.file_type.toUpperCase()} Sekarang</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-gray-200 space-y-3 max-w-md shadow-xs">
                  <ExternalLink size={40} className="text-blue-600 mx-auto" />
                  <h4 className="text-sm font-black text-gray-800">Tautan Rekening Koran Eksternal</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Dokumen ini diarsipkan menggunakan tautan eksternal. Klik tombol di bawah untuk membuka pada tab baru.
                  </p>
                  <a
                    href={previewItem.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/20"
                  >
                    <ExternalLink size={14} />
                    <span>Buka Tautan Asli</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer Preview Info */}
            <div className="p-3.5 px-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span>Diunggah oleh: <strong>{previewItem.uploader || 'Admin Keuangan'}</strong></span>
                <span>Waktu: <strong>{new Date(previewItem.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Konfirmasi Hapus */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">
                Hapus Dokumen Rekening Koran?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Anda yakin ingin menghapus <strong>{itemToDelete.file_name}</strong>? Tindakan ini juga akan menghapus berkas fisik dari storage Cloudflare R2 jika tersedia.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Ya, Hapus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
