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
  Globe,
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
  Info,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { getSafeFileUrl, getDownloadSafeFileUrl } from '@/lib/fileHelper';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export interface RekeningKoranItem {
  id: string;
  tahun: number;
  bulan: number; // 1-12
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

export interface ExtraLinkItem {
  id: string;
  url: string;
  type: 'pdf' | 'excel' | 'csv';
  judul: string;
}

export interface GroupedRekeningRow {
  rekeningKey: string;
  rekening_id?: string | number;
  nama_bank: string;
  nomor_rekening: string;
  nama_rekening: string;
  saldo_awal: number | null;
  saldo_akhir: number | null;
  keterangan?: string;
  uploader?: string;
  created_at: string;
  pdfDoc?: RekeningKoranItem;
  excelDoc?: RekeningKoranItem;
  csvDoc?: RekeningKoranItem;
  otherDocs: RekeningKoranItem[];
  allDocs: RekeningKoranItem[];
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
  const [viewMode, setViewMode] = useState<'accordion' | 'tree'>('tree');

  // Collapse States (Set of expanded keys)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2026, 2025]));
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(['2026-4', '2026-3', '2026-2', '2026-1']));

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'link'>('file');

  // Form State
  const [formTahun, setFormTahun] = useState<number>(2026);
  const [formBulan, setFormBulan] = useState<number>(new Date().getMonth() + 1);
  const [formSelectedRekeningId, setFormSelectedRekeningId] = useState<string>('1');
  const [formNamaBank, setFormNamaBank] = useState<string>('Bank Syariah Indonesia');
  const [formNoRekening, setFormNoRekening] = useState<string>('7666333211');
  const [formNamaRekening, setFormNamaRekening] = useState<string>('MARDLIYYAH ISLAMIC CENTER');
  const [formSaldoAwal, setFormSaldoAwal] = useState<string>('');
  const [formSaldoAkhir, setFormSaldoAkhir] = useState<string>('');
  const [formKeterangan, setFormKeterangan] = useState<string>('');

  // 1. Unggah Berkas File (R2) -> Bisa 3 type file sekaligus!
  const [formFilePdf, setFormFilePdf] = useState<File | null>(null);
  const [formFileExcel, setFormFileExcel] = useState<File | null>(null);
  const [formFileCsv, setFormFileCsv] = useState<File | null>(null);

  // 2. Tautan Online / Cloud Link -> Box per ekstensi + Judul otomatis default
  const [linkPdfUrl, setLinkPdfUrl] = useState<string>('');
  const [linkExcelUrl, setLinkExcelUrl] = useState<string>('');
  const [linkCsvUrl, setLinkCsvUrl] = useState<string>('');
  const [customJudul, setCustomJudul] = useState<string>('');
  const [isJudulOverridden, setIsJudulOverridden] = useState<boolean>(false);
  const [extraLinks, setExtraLinks] = useState<ExtraLinkItem[]>([]);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<RekeningKoranItem | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [sheetData, setSheetData] = useState<{ headers: string[]; rows: any[][] } | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);

  // Delete State
  const [itemToDelete, setItemToDelete] = useState<RekeningKoranItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active Dropdown State per Rekening
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Helper Salin Tautan ke Papan Klip
  const copyToClipboard = async (url: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedUrl(url);
      toast.success('Tautan berhasil disalin ke clipboard');
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      toast.error('Gagal menyalin tautan');
    }
  };

  // Formula Judul Otomatis: [yy_mm] [id rekening]_[nama bank]_[no rekening]_[nama rekening]
  const autoGeneratedTitle = useMemo(() => {
    const yy = String(formTahun).slice(-2);
    const mm = String(formBulan).padStart(2, '0');
    const idRek = formSelectedRekeningId || '1';
    const cleanBank = formNamaBank || 'BSI';
    const noRek = formNoRekening || '7666333211';
    const pemilik = formNamaRekening || 'MARDLIYYAH ISLAMIC CENTER';
    return `[${yy}_${mm}] [${idRek}]_${cleanBank}_${noRek}_${pemilik}`;
  }, [formTahun, formBulan, formSelectedRekeningId, formNamaBank, formNoRekening, formNamaRekening]);

  // Current active judul
  const effectiveJudul = isJudulOverridden ? customJudul : autoGeneratedTitle;

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
          // Set default selected jika belum diatur
          const firstAcc = json.accounts[0];
          setFormSelectedRekeningId(String(firstAcc.id));
          setFormNamaBank(firstAcc.nama_bank);
          setFormNoRekening(firstAcc.nomor_rekening);
          setFormNamaRekening(firstAcc.nama_pemilik);
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

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.rk-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync rekening selection from ref_rekening
  const handleSelectRekeningChange = (val: string) => {
    setFormSelectedRekeningId(val);
    const found = bankAccounts.find(a => String(a.id) === val);
    if (found) {
      setFormNamaBank(found.nama_bank);
      setFormNoRekening(found.nomor_rekening);
      setFormNamaRekening(found.nama_pemilik);
    }
  };

  // Helper Multi-file drop Handler
  const handleFilesDropped = (droppedFiles: FileList | File[]) => {
    Array.from(droppedFiles).forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'pdf') {
        setFormFilePdf(file);
      } else if (['xlsx', 'xls'].includes(ext)) {
        setFormFileExcel(file);
      } else if (ext === 'csv') {
        setFormFileCsv(file);
      } else {
        toast.error(`Format file .${ext} tidak didukung (Gunakan PDF, Excel, atau CSV)`);
      }
    });
  };

  // Quick Open Modal Pre-filled for a specific Rekening and Month
  const handleOpenAddForRekening = (tahun: number, bulan: number, rek: GroupedRekeningRow) => {
    setFormTahun(tahun);
    setFormBulan(bulan);
    if (rek.rekening_id) {
      handleSelectRekeningChange(String(rek.rekening_id));
    } else {
      setFormNamaBank(rek.nama_bank);
      setFormNoRekening(rek.nomor_rekening);
      setFormNamaRekening(rek.nama_rekening);
    }
    if (rek.saldo_awal !== null) setFormSaldoAwal(String(rek.saldo_awal));
    if (rek.saldo_akhir !== null) setFormSaldoAkhir(String(rek.saldo_akhir));
    if (rek.keterangan) setFormKeterangan(rek.keterangan);
    setIsUploadOpen(true);
  };


  // Convert Google Docs / Drive URLs to Embeddable Preview iframe
  const getOnlineEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('docs.google.com/spreadsheets/d/')) {
      return url.replace(/\/edit.*$/, '/preview?widget=true&headers=false');
    }
    if (url.includes('drive.google.com/file/d/')) {
      return url.replace(/\/view.*$/, '/preview');
    }
    if (url.includes('drive.google.com/open?id=')) {
      const id = url.split('id=')[1]?.split('&')[0];
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    return null;
  };

  // Quick Open Modal Pre-filled for a specific Rekening, Month, and Slot Format
  const handleQuickAddSlot = (tahun: number, bulan: number, rek: GroupedRekeningRow, format?: 'pdf' | 'excel' | 'csv') => {
    setFormTahun(tahun);
    setFormBulan(bulan);
    if (rek.rekening_id) {
      handleSelectRekeningChange(String(rek.rekening_id));
    } else {
      setFormNamaBank(rek.nama_bank);
      setFormNoRekening(rek.nomor_rekening);
      setFormNamaRekening(rek.nama_rekening);
    }
    if (rek.saldo_awal !== null) setFormSaldoAwal(String(rek.saldo_awal));
    if (rek.saldo_akhir !== null) setFormSaldoAkhir(String(rek.saldo_akhir));
    if (rek.keterangan) setFormKeterangan(rek.keterangan);

    // Sebagian besar link online, default tab 'link'
    setUploadTab('link');
    setIsUploadOpen(true);
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

  const expandYearsOnly = () => {
    const allY = new Set<number>();
    items.forEach(it => allY.add(it.tahun));
    setExpandedYears(allY);
    setExpandedMonths(new Set());
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
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = it.file_name.toLowerCase().includes(q);
        const matchBank = it.nama_bank.toLowerCase().includes(q);
        const matchRek = it.nomor_rekening.includes(q);
        const matchPemilik = it.nama_rekening.toLowerCase().includes(q);
        const matchKet = (it.keterangan || '').toLowerCase().includes(q);
        if (!matchName && !matchBank && !matchRek && !matchPemilik && !matchKet) {
          return false;
        }
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

  // Grouped by Tahun -> Bulan -> Rekening (SIMPLIFIED & UNIFIED TABLE)
  const groupedData = useMemo(() => {
    const groups: { [tahun: number]: { [bulan: number]: RekeningKoranItem[] } } = {};

    filteredItems.forEach(it => {
      if (!groups[it.tahun]) groups[it.tahun] = {};
      if (!groups[it.tahun][it.bulan]) groups[it.tahun][it.bulan] = [];
      groups[it.tahun][it.bulan].push(it);
    });

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
        months: sortedMonths.map(month => {
          const rawDocs = monthObj[month];
          
          // Satukan data per rekening kas masjid (karena saldo awal & akhir sama untuk akun yang sama)
          const rekeningMap = new Map<string, GroupedRekeningRow>();

          rawDocs.forEach(doc => {
            const rKey = doc.nomor_rekening || String(doc.rekening_id) || doc.nama_bank;
            if (!rekeningMap.has(rKey)) {
              rekeningMap.set(rKey, {
                rekeningKey: rKey,
                rekening_id: doc.rekening_id,
                nama_bank: doc.nama_bank,
                nomor_rekening: doc.nomor_rekening,
                nama_rekening: doc.nama_rekening,
                saldo_awal: typeof doc.saldo_awal === 'number' ? doc.saldo_awal : null,
                saldo_akhir: typeof doc.saldo_akhir === 'number' ? doc.saldo_akhir : null,
                keterangan: doc.keterangan || '',
                uploader: doc.uploader,
                created_at: doc.created_at,
                otherDocs: [],
                allDocs: [doc]
              });
            } else {
              const existing = rekeningMap.get(rKey)!;
              existing.allDocs.push(doc);
              if (existing.saldo_awal === null && typeof doc.saldo_awal === 'number') {
                existing.saldo_awal = doc.saldo_awal;
              }
              if (existing.saldo_akhir === null && typeof doc.saldo_akhir === 'number') {
                existing.saldo_akhir = doc.saldo_akhir;
              }
              if (!existing.keterangan && doc.keterangan) existing.keterangan = doc.keterangan;
            }

            const current = rekeningMap.get(rKey)!;
            if (doc.file_type === 'pdf') {
              if (!current.pdfDoc) current.pdfDoc = doc;
              else current.otherDocs.push(doc);
            } else if (doc.file_type === 'excel') {
              if (!current.excelDoc) current.excelDoc = doc;
              else current.otherDocs.push(doc);
            } else if (doc.file_type === 'csv') {
              if (!current.csvDoc) current.csvDoc = doc;
              else current.otherDocs.push(doc);
            } else {
              current.otherDocs.push(doc);
            }
          });

          return {
            month,
            monthName: BULAN_OPTIONS.find(b => b.value === month)?.label.split(' - ')[1] || `Bulan ${month}`,
            rekeningGroups: Array.from(rekeningMap.values()),
            totalFiles: rawDocs.length
          };
        })
      };
    });
  }, [filteredItems]);

  // Available unique bank accounts & years for filters
  const uniqueAccounts = useMemo(() => {
    const map = new Map<string, { no_rek: string; nama_bank: string; nama_rekening: string }>();
    bankAccounts.forEach(ba => {
      if (ba.nomor_rekening && !map.has(ba.nomor_rekening)) {
        map.set(ba.nomor_rekening, {
          no_rek: ba.nomor_rekening,
          nama_bank: ba.nama_bank,
          nama_rekening: ba.nama_pemilik
        });
      }
    });
    items.forEach(it => {
      if (it.nomor_rekening && !map.has(it.nomor_rekening)) {
        map.set(it.nomor_rekening, {
          no_rek: it.nomor_rekening,
          nama_bank: it.nama_bank,
          nama_rekening: it.nama_rekening
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

  // Submit Upload Form (Multi-file & Multi-link)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadTab === 'file') {
      if (!formFilePdf && !formFileExcel && !formFileCsv) {
        toast.error('Pilih minimal 1 file dokumen rekening koran (PDF, Excel, atau CSV)!');
        return;
      }
    } else {
      const hasAnyLink = linkPdfUrl.trim() || linkExcelUrl.trim() || linkCsvUrl.trim() || extraLinks.some(el => el.url.trim());
      if (!hasAnyLink) {
        toast.error('Silakan isi minimal satu tautan link dokumen rekening koran!');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Menyimpan rekening koran ke Cloudflare R2 & database...');

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

      if (uploadTab === 'file') {
        formData.append('tipe_sumber', 'file');
        if (formFilePdf) formData.append('file_pdf', formFilePdf);
        if (formFileExcel) formData.append('file_excel', formFileExcel);
        if (formFileCsv) formData.append('file_csv', formFileCsv);
      } else {
        formData.append('tipe_sumber', 'link');
        formData.append('link_judul', effectiveJudul);
        if (linkPdfUrl.trim()) formData.append('link_pdf', linkPdfUrl.trim());
        if (linkExcelUrl.trim()) formData.append('link_excel', linkExcelUrl.trim());
        if (linkCsvUrl.trim()) formData.append('link_csv', linkCsvUrl.trim());
        if (extraLinks.length > 0) {
          formData.append('extra_links', JSON.stringify(extraLinks.filter(el => el.url.trim())));
        }
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
        setFormFilePdf(null);
        setFormFileExcel(null);
        setFormFileCsv(null);
        setLinkPdfUrl('');
        setLinkExcelUrl('');
        setLinkCsvUrl('');
        setCustomJudul('');
        setIsJudulOverridden(false);
        setExtraLinks([]);
        setFormSaldoAwal('');
        setFormSaldoAkhir('');
        setFormKeterangan('');
        
        // Auto expand year and month
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

    // Jika item adalah tautan online, biarkan tampilan modal cloud viewer menanganinya tanpa fetch CORS
    if (item.tipe_sumber === 'link') {
      return;
    }

    // Jika file fisik Excel atau CSV di R2, parse isi file untuk spreadsheet viewer
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
            const rows = jsonData.slice(1, 200);
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

  // Helpers
  const formatRupiah = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const addExtraLink = () => {
    setExtraLinks(prev => [
      ...prev,
      {
        id: `extra-${Date.now()}`,
        url: '',
        type: 'pdf',
        judul: `Part ${prev.length + 2}`
      }
    ]);
  };

  const removeExtraLink = (id: string) => {
    setExtraLinks(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Rekening Koran Bulanan Masjid"
        badge={{ text: 'Grup Masjid', variant: 'purple' }}
        subtitle="Pusat arsip dan pemantauan rekening koran kas masjid (CSV, Excel, PDF) terstruktur per tahun, bulan, dan rekening kas masjid dengan penyimpanan Cloudflare R2."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Muat Ulang Data"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => {
                setFormFilePdf(null);
                setFormFileExcel(null);
                setFormFileCsv(null);
                setLinkPdfUrl('');
                setLinkExcelUrl('');
                setLinkCsvUrl('');
                setExtraLinks([]);
                setIsUploadOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus size={15} />
              <span>Unggah Rekening Koran</span>
            </button>
          </div>
        }
      />

      {/* 2. 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Total Arsip Dokumen
              </p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-mono mt-1">
                {stats.totalDocs}
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <Database size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800/80 pt-2">
            <span>Komposisi:</span>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="text-rose-600">{stats.totalPdf} PDF</span>
              <span>•</span>
              <span className="text-emerald-600">{stats.totalExcel} XLS</span>
              <span>•</span>
              <span className="text-teal-600">{stats.totalCsv} CSV</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Rekening Kas Masjid
              </p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-mono mt-1">
                {stats.totalRekening}
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800/80 pt-2">
            <span>Akun Utama:</span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {bankAccounts[0]?.nama_bank ? `${bankAccounts[0].nama_bank} (${bankAccounts[0].nomor_rekening})` : 'BSI (7666333211)'}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Arsip Tahun 2026
              </p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-slate-100 font-mono mt-1">
                {stats.docs2026} <span className="text-xs font-normal text-gray-400">Dokumen</span>
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Calendar size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800/80 pt-2">
            <span>Status Periode:</span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              Tahun Aktif Berjalan
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                Folder Cloudflare R2
              </p>
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 font-mono mt-1 truncate">
                rekening_koran_masjid/
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
              <UploadCloud size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 dark:text-slate-400 flex items-center justify-between border-t border-gray-100 dark:border-slate-800/80 pt-2">
            <span>Multi-File:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              <ShieldCheck size={12} />
              PDF + XLS + CSV Aktif
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Kontrol Bilah Pencarian */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Input Pencarian */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama berkas, nomor rekening, bank, atau keterangan..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filter Rekening */}
            <select
              value={selectedRekening}
              onChange={(e) => setSelectedRekening(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Rekening Bank ({uniqueAccounts.length})</option>
              {uniqueAccounts.map(acc => (
                <option key={acc.no_rek} value={acc.no_rek}>
                  {acc.nama_bank} - {acc.no_rek}
                </option>
              ))}
            </select>

            {/* Filter Tahun */}
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Tahun</option>
              {uniqueYears.map(y => (
                <option key={y} value={String(y)}>Tahun {y}</option>
              ))}
            </select>

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

        {/* Quick Filter Format Pills & Controls */}
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

          {/* Tiered Expand / Collapse Controls */}
          <div className="flex items-center gap-1.5 bg-gray-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-gray-200/70 dark:border-slate-700/70 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 px-1.5 hidden sm:inline">
              Jenjang:
            </span>
            <button
              type="button"
              onClick={expandYearsOnly}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-2xs transition-all cursor-pointer"
              title="Buka hanya jenjang Level 1 (Tahun)"
            >
              Tahun Saja
            </button>
            <span className="text-gray-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition-all cursor-pointer"
              title="Buka semua jenjang Tahun dan Bulan"
            >
              Buka Semua
            </button>
            <span className="text-gray-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:shadow-2xs transition-all cursor-pointer"
              title="Tutup semua jenjang"
            >
              Tutup Semua
            </button>
          </div>
        </div>
      </div>

      {/* 4. Konten Utama: Kolaps Tahun -> Bulan -> Rekening (SIMPLE & UNIFIED) */}
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
      ) : viewMode === 'tree' ? (
        /* ================= HIERARKI POHON (TREE VIEW) ================= */
        <div className="space-y-4 animate-in fade-in">
          {groupedData.map(({ year, months }) => {
            const isYearOpen = expandedYears.has(year);
            const totalFilesInYear = months.reduce((acc, m) => acc + m.totalFiles, 0);

            return (
              <div
                key={year}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-xs transition-all"
              >
                {/* Year Root Node */}
                <div
                  onClick={() => toggleYear(year)}
                  className="flex items-center justify-between cursor-pointer group select-none py-1 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {isYearOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Tahun Anggaran {year}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {totalFilesInYear} Berkas
                    </span>
                  </div>
                  <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                    {isYearOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Months Branch */}
                {isYearOpen && (
                  <div className="ml-5 pl-4 border-l-2 border-indigo-200/80 dark:border-indigo-900/60 mt-2 space-y-3">
                    {months.map(({ month, monthName, rekeningGroups, totalFiles }) => {
                      const monthKey = `${year}-${month}`;
                      const isMonthOpen = expandedMonths.has(monthKey);

                      return (
                        <div key={monthKey} className="space-y-2">
                          {/* Month Node */}
                          <div
                            onClick={() => toggleMonth(monthKey)}
                            className="flex items-center justify-between cursor-pointer group select-none py-1 px-2 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                {isMonthOpen ? <FolderOpen size={13} /> : <Folder size={13} />}
                              </div>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {monthName} {year}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {rekeningGroups.length} Akun • {totalFiles} Berkas
                              </span>
                            </div>
                            <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                              {isMonthOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                          </div>

                          {/* Rekening & Files Branch */}
                          {isMonthOpen && (
                            <div className="ml-4 pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2 mt-1">
                              {rekeningGroups.map(rek => (
                                <div
                                  key={rek.rekeningKey}
                                  className="bg-slate-50/70 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/60 space-y-2"
                                >
                                  {/* Rekening Header in Tree */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <CreditCard size={14} className="text-blue-600 shrink-0" />
                                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                                        {rek.nama_bank}
                                      </span>
                                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950 px-1.5 py-0.2 rounded">
                                        {rek.nomor_rekening}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium truncate max-w-xs">
                                        ({rek.nama_rekening})
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddForRekening(year, month, rek)}
                                      className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                    >
                                      <Plus size={11} />
                                      <span>Tambah Berkas</span>
                                    </button>
                                  </div>

                                  {/* Files List in Tree */}
                                  {rek.allDocs.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic pl-3">Belum ada dokumen terunggah</p>
                                  ) : (
                                    <div className="ml-2 pl-3 border-l-2 border-dashed border-slate-300 dark:border-slate-700 space-y-1.5">
                                      {rek.allDocs.map(doc => {
                                        const isPdf = doc.file_type === 'pdf';
                                        const isExcel = doc.file_type === 'excel';
                                        const isCsv = doc.file_type === 'csv';
                                        const isLink = doc.tipe_sumber === 'link';

                                        return (
                                          <div
                                            key={doc.id}
                                            className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-750 text-xs hover:border-blue-400 transition-all shadow-2xs"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              {isPdf && <FileText size={15} className="text-rose-600 shrink-0" />}
                                              {isExcel && <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />}
                                              {isCsv && <TableIcon size={15} className="text-teal-600 shrink-0" />}
                                              {!isPdf && !isExcel && !isCsv && <Link2 size={15} className="text-blue-600 shrink-0" />}
                                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate" title={doc.file_name}>
                                                {doc.file_name}
                                              </span>
                                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                                                {isLink ? 'Link' : (doc.file_size || doc.file_type.toUpperCase())}
                                              </span>
                                            </div>

                                            {/* Action Toolbar */}
                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenPreview(doc)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                                                title="Pratinjau Dokumen"
                                              >
                                                <Eye size={13} />
                                              </button>
                                              {isLink ? (
                                                <>
                                                  <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                                                    title="Buka Tautan Online"
                                                  >
                                                    <ExternalLink size={13} />
                                                  </a>
                                                  <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(doc.file_url)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                                                    title="Salin Tautan"
                                                  >
                                                    <Copy size={13} />
                                                  </button>
                                                </>
                                              ) : (
                                                <a
                                                  href={getDownloadSafeFileUrl(doc.file_url, doc.file_name)}
                                                  download={doc.file_name}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer"
                                                  title="Unduh File"
                                                >
                                                  <Download size={13} />
                                                </a>
                                              )}
                                              <button
                                                type="button"
                                                onClick={() => setItemToDelete(doc)}
                                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-400 hover:text-rose-600 cursor-pointer"
                                                title="Hapus"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
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
      ) : (
        /* ================= KOLAPS ACCORDION VIEW ================= */
        
        <div className="space-y-4">
          {groupedData.map(({ year, months }) => {
            const isYearOpen = expandedYears.has(year);
            const totalFilesInYear = months.reduce((acc, m) => acc + m.totalFiles, 0);

            return (
              <div
                key={year}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs transition-all"
              >
                {/* Header Level 1: Tahun */}
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className={`w-full p-4 bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 flex items-center justify-between transition-all cursor-pointer border-b border-gray-200/60 dark:border-slate-800 text-left ${isYearOpen ? 'rounded-t-2xl' : 'rounded-2xl'}`}
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
                          {totalFilesInYear} Berkas Rekening
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
                    {months.map(({ month, monthName, rekeningGroups, totalFiles }) => {
                      const monthKey = `${year}-${month}`;
                      const isMonthOpen = expandedMonths.has(monthKey);

                      return (
                        <div
                          key={monthKey}
                          className="bg-white dark:bg-slate-800/90 rounded-xl border border-gray-200/70 dark:border-slate-700/80 shadow-2xs"
                        >
                          {/* Header Level 2: Bulan (Dipercantik, Elegan, dan Bergradasi) */}
                          <button
                            type="button"
                            onClick={() => toggleMonth(monthKey)}
                            className={`w-full p-3.5 px-4.5 flex items-center justify-between transition-all cursor-pointer text-left ${
                              isMonthOpen
                                ? 'bg-gradient-to-r from-indigo-50/90 via-slate-50/70 to-blue-50/60 dark:from-indigo-950/40 dark:via-slate-850 dark:to-slate-800 border-b border-indigo-100/80 dark:border-indigo-900/50'
                                : 'bg-white hover:bg-slate-50/80 dark:bg-slate-800 dark:hover:bg-slate-750'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                                <span className="text-[11px] font-mono">{String(month).padStart(2, '0')}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                    {monthName} {year}
                                  </span>
                                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/70 px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                                    {rekeningGroups.length} Akun Bank
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded-full">
                                    {totalFiles} Berkas Terarsip
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Mutasi rekening koran dan arsip dokumen kas periode {monthName}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">
                                {isMonthOpen ? 'Tutup Bulan' : 'Buka Bulan'}
                              </span>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                isMonthOpen 
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rotate-180' 
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}>
                                <ChevronDown size={14} />
                              </div>
                            </div>
                          </button>

                          {/* Body Level 2: Rekening Rows (SIMPLE & UNIFIED - SALDO CUKUP DITAMPILKAN 1 KALI) */}
                          {isMonthOpen && (
                            <div className="border-t border-gray-100 dark:border-slate-700/80 divide-y divide-gray-100 dark:divide-slate-700/50">
                              {rekeningGroups.map((rek) => {
                                const selisihMutasi = (rek.saldo_akhir !== null && rek.saldo_awal !== null)
                                  ? rek.saldo_akhir - rek.saldo_awal
                                  : null;

                                const dropdownKey = `${year}-${month}-${rek.rekeningKey}`;
                                const isDropdownOpen = openDropdownId === dropdownKey;

                                return (
                                  <div
                                    key={rek.rekeningKey}
                                    className={`p-3 pl-5 sm:pl-7 pr-4 hover:bg-slate-50/70 dark:hover:bg-slate-750/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors border-l-2 border-indigo-200/80 dark:border-indigo-900/60 ml-2 sm:ml-4 my-1 rounded-r-xl ${
                                      isDropdownOpen ? 'relative z-30 bg-blue-50/20 dark:bg-blue-950/20' : 'relative z-10'
                                    }`}
                                  >
                                    {/* 1. Rekening Kas Info (Dibuat Lebih Ringkas & Tidak Melebihi Parent Bulan) */}
                                    <div className="space-y-1 min-w-[240px] max-w-md">
                                      <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                                          <CreditCard size={13} />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                                              {rek.nama_bank}
                                            </h4>
                                            <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-900/50 px-1.5 py-0.2 rounded-md">
                                              {rek.nomor_rekening}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                            <Wallet size={11} className="text-slate-400 shrink-0" />
                                            <span className="truncate text-slate-600 dark:text-slate-300" title={rek.nama_rekening}>
                                              {rek.nama_rekening}
                                            </span>
                                          </div>
                                          {rek.keterangan && (
                                            <div className="mt-0.5">
                                              <span className="inline-flex items-center gap-1 text-[9px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 px-1.5 py-0.2 rounded italic truncate max-w-xs" title={rek.keterangan}>
                                                <Info size={9} className="shrink-0 text-amber-600 not-italic" />
                                                &ldquo;{rek.keterangan}&rdquo;
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* 2. Saldo Awal, Saldo Akhir, dan Mutasi Bersih (Desain Kompak) */}
                                    <div className="flex items-center gap-3.5 bg-slate-50/80 dark:bg-slate-900/70 p-2 px-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 text-[10px] shrink-0 shadow-2xs">
                                      <div>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-black tracking-wider">
                                          Saldo Awal
                                        </span>
                                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                          {formatRupiah(rek.saldo_awal)}
                                        </span>
                                      </div>

                                      <div className="w-4 h-4 rounded-full bg-slate-200/70 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                        <ArrowRight size={10} />
                                      </div>

                                      <div>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-black tracking-wider">
                                          Saldo Akhir
                                        </span>
                                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-[11px]">
                                          {formatRupiah(rek.saldo_akhir)}
                                        </span>
                                      </div>

                                      {selisihMutasi !== null && (
                                        <div className="hidden sm:block pl-2.5 border-l border-slate-200 dark:border-slate-800">
                                          <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-black tracking-wider">
                                            Mutasi Bersih
                                          </span>
                                          <span className={`inline-flex items-center gap-0.5 font-mono font-black text-[11px] ${
                                            selisihMutasi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                          }`}>
                                            {selisihMutasi >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                            {formatRupiah(selisihMutasi)}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* 3. Berkas & Aksi Dropdown Menu */}
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                      {/* Dropdown Menu Container */}
                                      <div className="relative rk-dropdown-container">
                                        <button
                                          type="button"
                                          onClick={() => setOpenDropdownId(isDropdownOpen ? null : dropdownKey)}
                                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                                            isDropdownOpen
                                              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 ring-2 ring-blue-500/30'
                                              : rek.allDocs.length > 0
                                                ? 'bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 hover:bg-slate-800 border-slate-900 dark:border-slate-600'
                                                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900 hover:bg-blue-100'
                                          }`}
                                        >
                                          <SlidersHorizontal size={13} className={isDropdownOpen ? 'text-white' : rek.allDocs.length > 0 ? 'text-blue-300' : 'text-blue-600'} />
                                          <span>Aksi Berkas</span>
                                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                            isDropdownOpen
                                              ? 'bg-white/20 text-white'
                                              : rek.allDocs.length > 0
                                                ? 'bg-blue-500/30 text-blue-200'
                                                : 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                          }`}>
                                            {rek.allDocs.length}
                                          </span>
                                          <ChevronDown size={13} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {/* Dropdown Menu Popover */}
                                        {isDropdownOpen && (
                                          <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-3.5 z-50 space-y-3 animate-in fade-in zoom-in-95">
                                            {/* Header Dropdown */}
                                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block">
                                                  Pilihan Aksi Berkas
                                                </span>
                                                <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate max-w-[210px]">
                                                  {rek.nama_bank} - {rek.nomor_rekening}
                                                </p>
                                              </div>
                                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                                                {rek.allDocs.length} Dokumen
                                              </span>
                                            </div>

                                            {/* Daftar Berkas & Aksi */}
                                            {rek.allDocs.length === 0 ? (
                                              <div className="p-4 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                                  Belum ada berkas rekening koran pada bulan ini.
                                                </p>
                                              </div>
                                            ) : (
                                              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                {rek.allDocs.map((doc) => {
                                                  const isPdf = doc.file_type === 'pdf';
                                                  const isExcel = doc.file_type === 'excel';
                                                  const isCsv = doc.file_type === 'csv';
                                                  const isLink = doc.tipe_sumber === 'link';

                                                  return (
                                                    <div
                                                      key={doc.id}
                                                      className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/80 border border-gray-200/70 dark:border-slate-700/80 hover:border-gray-300 dark:hover:border-slate-600 transition-all flex items-center justify-between gap-2"
                                                    >
                                                      {/* File Info */}
                                                      <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                          isPdf
                                                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                                                            : isExcel
                                                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                                                              : isCsv
                                                                ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-600'
                                                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'
                                                        }`}>
                                                          {isPdf && <FileText size={15} />}
                                                          {isExcel && <FileSpreadsheet size={15} />}
                                                          {isCsv && <TableIcon size={15} />}
                                                          {!isPdf && !isExcel && !isCsv && <Link2 size={15} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                          <p className="text-xs font-bold text-gray-800 dark:text-slate-200 truncate" title={doc.file_name}>
                                                            {doc.file_name}
                                                          </p>
                                                          <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                                              isPdf
                                                                ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                                                                : isExcel
                                                                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                                                  : isCsv
                                                                    ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300'
                                                                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                                            }`}>
                                                              {doc.file_type.toUpperCase()}
                                                            </span>
                                                            <span className="text-[10px] text-gray-400">
                                                              {isLink ? 'Tautan Online' : (doc.file_size || 'File')}
                                                            </span>
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {/* Actions Toolbar */}
                                                      <div className="flex items-center gap-1 shrink-0">
                                                        {/* Pratinjau (View) */}
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setOpenDropdownId(null);
                                                            handleOpenPreview(doc);
                                                          }}
                                                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                                          title="Lihat / Pratinjau Dokumen"
                                                        >
                                                          <Eye size={13} />
                                                        </button>

                                                        {/* Unduh (Download) / Buka Link */}
                                                        {isLink ? (
                                                          <>
                                                            <a
                                                              href={doc.file_url}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:text-emerald-600 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                                                              title="Buka Tautan di Tab Baru"
                                                            >
                                                              <ExternalLink size={13} />
                                                            </a>
                                                            <button
                                                              type="button"
                                                              onClick={() => copyToClipboard(doc.file_url)}
                                                              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:text-blue-600 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                                                              title="Salin Tautan"
                                                            >
                                                              {copiedUrl === doc.file_url ? (
                                                                <Check size={13} className="text-emerald-600" />
                                                              ) : (
                                                                <Copy size={13} />
                                                              )}
                                                            </button>
                                                          </>
                                                        ) : (
                                                          <a
                                                            href={getDownloadSafeFileUrl(doc.file_url, doc.file_name)}
                                                            download={doc.file_name}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:text-emerald-600 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                                                            title="Unduh Berkas"
                                                          >
                                                            <Download size={13} />
                                                          </a>
                                                        )}

                                                        {/* Hapus (Delete) */}
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            setOpenDropdownId(null);
                                                            setItemToDelete(doc);
                                                          }}
                                                          className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                                                          title="Hapus Dokumen"
                                                        >
                                                          <Trash2 size={13} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {/* Footer Dropdown: Quick Slots & Tambah Berkas */}
                                            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
                                              {(!rek.pdfDoc || !rek.excelDoc || !rek.csvDoc) && (
                                                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-slate-400">
                                                  <span>Format belum ada:</span>
                                                  <div className="flex items-center gap-1">
                                                    {!rek.pdfDoc && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setOpenDropdownId(null);
                                                          handleQuickAddSlot(year, month, rek, 'pdf');
                                                        }}
                                                        className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-[10px] font-bold transition-all cursor-pointer"
                                                        title="Tambah Berkas / Tautan PDF"
                                                      >
                                                        + PDF
                                                      </button>
                                                    )}
                                                    {!rek.excelDoc && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setOpenDropdownId(null);
                                                          handleQuickAddSlot(year, month, rek, 'excel');
                                                        }}
                                                        className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold transition-all cursor-pointer"
                                                        title="Tambah Berkas / Tautan Excel"
                                                      >
                                                        + Excel
                                                      </button>
                                                    )}
                                                    {!rek.csvDoc && (
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setOpenDropdownId(null);
                                                          handleQuickAddSlot(year, month, rek, 'csv');
                                                        }}
                                                        className="px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-900 text-[10px] font-bold transition-all cursor-pointer"
                                                        title="Tambah Berkas / Tautan CSV"
                                                      >
                                                        + CSV
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOpenDropdownId(null);
                                                  handleOpenAddForRekening(year, month, rek);
                                                }}
                                                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                              >
                                                <Plus size={14} />
                                                <span>Tambah / Unggah Berkas Baru</span>
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
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
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modal Unggah Dokumen / Tautan Link */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden">
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
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                  <span>Unggah Berkas File (R2) — Hingga 3 Format</span>
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
                    {[2027, 2026, 2025, 2024, 2023].map(y => (
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

              {/* Rekening Bank Selector: Berasal dari ref tabel ref_rekening */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400">
                    Pilih Rekening Kas Masjid <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-gray-400">
                    Sumber: Referensi Rekening (ref_rekening)
                  </span>
                </div>
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
                </select>
              </div>

              {/* 1. TAB UNGGAH BERKAS FILE (BISA 3 TYPE FILE SEKALIGUS) */}
              {uploadTab === 'file' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400">
                      Pilih Berkas File (Bisa Unggah 3 Tipe Sekaligus) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-gray-400 font-bold">
                      Format: .pdf, .xlsx, .csv
                    </span>
                  </div>

                  {/* Dropzone Utama (Drag & drop multiple files) */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files) handleFilesDropped(e.dataTransfer.files);
                    }}
                    className="p-3 border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl text-center"
                  >
                    <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                      Seret berkas PDF, Excel, atau CSV ke sini, atau klik tombol pilih di masing-masing slot di bawah:
                    </p>
                  </div>

                  {/* 3 Dedicated Slots: PDF, Excel, CSV */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* Slot 1: Berkas PDF */}
                    <div className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/30 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileText size={15} className="text-rose-600" />
                          <span className="text-xs font-black text-rose-800 dark:text-rose-300">Format PDF</span>
                        </div>
                        {formFilePdf && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>

                      {formFilePdf ? (
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-rose-100 dark:border-rose-900 text-left">
                          <p className="text-[11px] font-bold text-gray-900 dark:text-slate-100 truncate" title={formFilePdf.name}>
                            {formFilePdf.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                            <span>{Math.round(formFilePdf.size / 1024)} KB</span>
                            <button
                              type="button"
                              onClick={() => setFormFilePdf(null)}
                              className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400">Berkas scan / rekening koran resmi .pdf</p>
                      )}

                      <label className="w-full py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-center text-[11px] font-black cursor-pointer transition-all block">
                        <span>{formFilePdf ? 'Ganti File PDF' : '+ Pilih File PDF'}</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) setFormFilePdf(e.target.files[0]);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Slot 2: Berkas Excel */}
                    <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/30 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet size={15} className="text-emerald-600" />
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">Format Excel</span>
                        </div>
                        {formFileExcel && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>

                      {formFileExcel ? (
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900 text-left">
                          <p className="text-[11px] font-bold text-gray-900 dark:text-slate-100 truncate" title={formFileExcel.name}>
                            {formFileExcel.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                            <span>{Math.round(formFileExcel.size / 1024)} KB</span>
                            <button
                              type="button"
                              onClick={() => setFormFileExcel(null)}
                              className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400">Ekspor rincian transaksi .xlsx / .xls</p>
                      )}

                      <label className="w-full py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center text-[11px] font-black cursor-pointer transition-all block">
                        <span>{formFileExcel ? 'Ganti File Excel' : '+ Pilih File Excel'}</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) setFormFileExcel(e.target.files[0]);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Slot 3: Berkas CSV */}
                    <div className="p-3 rounded-2xl border border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/30 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TableIcon size={15} className="text-teal-600" />
                          <span className="text-xs font-black text-teal-800 dark:text-teal-300">Format CSV</span>
                        </div>
                        {formFileCsv && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>

                      {formFileCsv ? (
                        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-teal-100 dark:border-teal-900 text-left">
                          <p className="text-[11px] font-bold text-gray-900 dark:text-slate-100 truncate" title={formFileCsv.name}>
                            {formFileCsv.name}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                            <span>{Math.round(formFileCsv.size / 1024)} KB</span>
                            <button
                              type="button"
                              onClick={() => setFormFileCsv(null)}
                              className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400">Data mentah transaksi bank .csv</p>
                      )}

                      <label className="w-full py-1.5 bg-white dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-center text-[11px] font-black cursor-pointer transition-all block">
                        <span>{formFileCsv ? 'Ganti File CSV' : '+ Pilih File CSV'}</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) setFormFileCsv(e.target.files[0]);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* 2. TAB TAUTAN ONLINE / CLOUD LINK (BOX PER EKSTENSI + JUDUL OTOMATIS) */
                <div className="space-y-3.5">
                  {/* Judul Otomatis Formula */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400">
                        Format Judul Tautan / Berkas (Otomatis)
                      </label>
                      {isJudulOverridden && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsJudulOverridden(false);
                            setCustomJudul('');
                          }}
                          className="text-[10px] text-blue-600 hover:underline font-bold"
                        >
                          Reset ke Format Standar
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={effectiveJudul}
                      onChange={(e) => {
                        setIsJudulOverridden(true);
                        setCustomJudul(e.target.value);
                      }}
                      className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-[10px] text-gray-400">
                      Format standar otomatis: <code>[yy_mm] [id rekening]_[nama bank]_[no rekening]_[nama rekening]</code>
                    </p>
                  </div>

                  {/* 3 Box Input Per Ekstensi */}
                  <div className="space-y-2.5">
                    {/* Box 1: Tautan PDF */}
                    <div className="p-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-rose-800 dark:text-rose-300">
                        <FileText size={14} className="text-rose-600" />
                        <span>Tautan Link Berkas PDF (.pdf)</span>
                      </div>
                      <input
                        type="url"
                        value={linkPdfUrl}
                        onChange={(e) => setLinkPdfUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/... (Link Dokumen PDF)"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
                      />
                    </div>

                    {/* Box 2: Tautan Excel */}
                    <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                        <FileSpreadsheet size={14} className="text-emerald-600" />
                        <span>Tautan Link Berkas Excel (.xlsx / .xls)</span>
                      </div>
                      <input
                        type="url"
                        value={linkExcelUrl}
                        onChange={(e) => setLinkExcelUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/... (Link Spreadsheet Excel)"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    {/* Box 3: Tautan CSV */}
                    <div className="p-3 rounded-2xl border border-teal-200 dark:border-teal-900 bg-teal-50/30 dark:bg-teal-950/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-black text-teal-800 dark:text-teal-300">
                        <TableIcon size={14} className="text-teal-600" />
                        <span>Tautan Link Berkas CSV (.csv)</span>
                      </div>
                      <input
                        type="url"
                        value={linkCsvUrl}
                        onChange={(e) => setLinkCsvUrl(e.target.value)}
                        placeholder="https://... (Link Data Mentah CSV)"
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>

                  {/* Dynamic Extra Links (Jika 1 bulan isinya lebih dr 1 file link / part) */}
                  {extraLinks.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                      <p className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-slate-400">
                        Tautan Tambahan (Part 2 / File Terpisah)
                      </p>
                      {extraLinks.map((el, idx) => (
                        <div key={el.id} className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-2">
                          <input
                            type="text"
                            value={el.judul}
                            onChange={(e) => {
                              const v = e.target.value;
                              setExtraLinks(prev => prev.map(item => item.id === el.id ? { ...item, judul: v } : item));
                            }}
                            placeholder="Judul / Keterangan Part"
                            className="w-1/3 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                          <input
                            type="url"
                            value={el.url}
                            onChange={(e) => {
                              const v = e.target.value;
                              setExtraLinks(prev => prev.map(item => item.id === el.id ? { ...item, url: v } : item));
                            }}
                            placeholder="https://..."
                            className="flex-1 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeExtraLink(el.id)}
                            className="p-2 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addExtraLink}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Tambah Tautan Ekstra (Part 2 / Lampiran Lain)</span>
                  </button>
                </div>
              )}

              {/* Saldo Awal & Saldo Akhir */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Saldo Awal (Opsional)</label>
                  <input
                    type="number"
                    value={formSaldoAwal}
                    onChange={(e) => setFormSaldoAwal(e.target.value)}
                    placeholder="Contoh: 150000000"
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500">Saldo Akhir (Opsional)</label>
                  <input
                    type="number"
                    value={formSaldoAkhir}
                    onChange={(e) => setFormSaldoAkhir(e.target.value)}
                    placeholder="Contoh: 185000000"
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Catatan / Keterangan Transaksi</label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Contoh: Rekening koran operasional bulan berjalan tuntas rekonsiliasi"
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              {/* Footer Modal Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Simpan ke R2 & Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Preview Dokumen Interaktif */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            {/* Header Modal Preview */}
            <div className="p-4 px-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
                  {previewItem.file_type === 'excel' ? <FileSpreadsheet size={16} /> : previewItem.file_type === 'csv' ? <TableIcon size={16} /> : <FileText size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 truncate" title={previewItem.file_name}>
                      {previewItem.file_name}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {previewItem.file_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {previewItem.nama_bank} • Rek: {previewItem.nomor_rekening} • {previewItem.nama_bulan} {previewItem.tahun}
                  </p>
                </div>
              </div>

              {/* Kontrol Preview: Zoom, Rotate, Download, Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                {previewItem.file_type === 'pdf' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(prev => Math.max(50, prev - 25))}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 cursor-pointer"
                      title="Perkecil"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-[11px] font-mono font-bold text-gray-500 w-12 text-center">
                      {previewZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(prev => Math.min(200, prev + 25))}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 cursor-pointer"
                      title="Perbesar"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRotation(prev => (prev + 90) % 360)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 cursor-pointer"
                      title="Putar Dokumen"
                    >
                      <RotateCw size={14} />
                    </button>
                  </>
                )}

                <a
                  href={getDownloadSafeFileUrl(previewItem.file_url, previewItem.file_name)}
                  download={previewItem.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ml-2"
                >
                  <Download size={13} />
                  <span>Unduh</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-500 flex items-center justify-center cursor-pointer ml-1"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Konten Dokumen */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              {previewItem.file_type === 'excel' || previewItem.file_type === 'csv' ? (
                sheetLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">Membaca isi berkas transaksi {previewItem.file_type.toUpperCase()}...</p>
                  </div>
                ) : sheetData && sheetData.headers.length > 0 ? (
                  <div className="w-full h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <FileSpreadsheet size={14} />
                        Pratinjau Lembar Kerja (Menampilkan {sheetData.rows.length} Baris Pertama)
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {sheetData.headers.length} Kolom
                      </span>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 border-b border-gray-200 dark:border-slate-700">
                          <tr>
                            {sheetData.headers.map((h, i) => (
                              <th key={i} className="p-2.5 px-3 font-black text-[11px] uppercase tracking-wider text-gray-700 dark:text-slate-300 border-r border-gray-200 dark:border-slate-700 last:border-r-0">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {sheetData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50">
                              {sheetData.headers.map((_, cIdx) => (
                                <td key={cIdx} className="p-2 px-3 text-[11px] font-mono text-gray-700 dark:text-slate-300 border-r border-gray-100 dark:border-slate-800 last:border-r-0">
                                  {row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 max-w-md space-y-3">
                    <FileSpreadsheet size={36} className="text-emerald-600 mx-auto" />
                    <h4 className="text-sm font-black text-gray-800 dark:text-slate-200">
                      Pratinjau Lembar Kerja Tidak Langsung Tersedia
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Berkas siap diunduh untuk dibuka langsung melalui Microsoft Excel atau aplikasi spreadsheet lainnya.
                    </p>
                    <a
                      href={getDownloadSafeFileUrl(previewItem.file_url, previewItem.file_name)}
                      download={previewItem.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <Download size={14} />
                      <span>Unduh File Excel ({previewItem.file_size || 'N/A'})</span>
                    </a>
                  </div>
                )
              ) : previewItem.tipe_sumber === 'link' && previewItem.file_url.includes('drive.google.com') ? (
                <iframe
                  src={previewItem.file_url.replace('/view', '/preview')}
                  className="w-full h-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white"
                  title="Google Drive Document Viewer"
                />
              ) : (
                <div
                  style={{
                    transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease-in-out',
                    width: '100%',
                    height: '100%'
                  }}
                  className="flex items-center justify-center"
                >
                  <iframe
                    src={getSafeFileUrl(previewItem.file_url, previewItem.file_name)}
                    className="w-full h-full rounded-xl border border-gray-200 dark:border-slate-800 bg-white"
                    title="PDF Viewer"
                  />
                </div>
              )}
            </div>

            {/* Footer Modal Preview */}
            <div className="p-3 px-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <div className="flex items-center gap-2">
                <span>Diunggah oleh: <strong>{previewItem.uploader || 'Admin'}</strong></span>
                <span>•</span>
                <span>Waktu: {new Date(previewItem.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">
                Hapus Dokumen Rekening Koran?
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Anda akan menghapus berkas <strong>&ldquo;{itemToDelete.file_name}&rdquo;</strong>. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Dokumen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
