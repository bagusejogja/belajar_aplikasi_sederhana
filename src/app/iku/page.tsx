'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Target, Filter, Search, ChevronDown, ChevronUp, Download,
  Layers, CheckCircle2, Award, BookOpen, ExternalLink,
  RefreshCw, FileSpreadsheet, ArrowLeft, Building2, HelpCircle,
  Trash2, ArrowRightLeft, AlertTriangle, RotateCcw,
  Check, X, Eye, EyeOff, PieChart as PieChartIcon, CheckSquare, Square
} from 'lucide-react';
import ExcelJS from 'exceljs';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer,
  Cell, Legend
} from 'recharts';

interface IkuItem {
  id: number;
  tujuan_id: string;
  tujuan_kode: string;
  tujuan_nama: string;
  indikator_tujuan_id: string;
  indikator_tujuan_kode: string;
  indikator_tujuan_nama: string;
  sasaran_id: string;
  sasaran_kode: string;
  sasaran_nama: string;
  indikator_sasaran_id: string;
  indikator_sasaran_kode: string;
  indikator_sasaran_nama: string;
  program_id: string;
  program_kode: string;
  program_nama: string;
  indikator_program_id: string;
  indikator_program_kode: string;
  indikator_program_nama: string;
  kegiatan_id: string;
  kegiatan_kode: string;
  kegiatan_nama: string;
  ref_iku: string;
  ref_tahun_iku: number;
}

interface IkuGroup {
  ref_iku: string;
  ref_tahun_iku: number;
  count: number;
  items: IkuItem[];
}

const PIE_COLORS = [
  '#2563eb', '#3b82f6', '#4f46e5', '#6366f1', '#7c3aed',
  '#8b5cf6', '#9333ea', '#a855f7', '#0891b2', '#06b6d4',
  '#0d9488', '#14b8a6', '#059669', '#10b981', '#d97706',
  '#f59e0b', '#e11d48', '#f43f5e'
];

export default function PemetaanIkuPublicPage() {
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRef, setSelectedRef] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<IkuGroup[]>([]);
  const [masters, setMasters] = useState<Array<{ id: number; ref_tahun_iku: number; nama_ref_iku: string }>>([]);
  const [totalMatched, setTotalMatched] = useState<number>(0);

  // POIN 2: Accordion default tertutup semua saja
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // POIN 4: Cukup paging di dalam isi tabel kegiatan masing-masing grup (innerPages)
  const [innerPages, setInnerPages] = useState<Record<string, number>>({});
  const innerPageSize = 15;

  // Paging untuk Tabel Flat
  const [flatTablePage, setFlatTablePage] = useState<number>(1);
  const [flatTableSize, setFlatTableSize] = useState<number>(25);

  // POIN 1: Grafik default tertutup saja (false)
  const [showChart, setShowChart] = useState<boolean>(false);

  // Searchable Combobox Filter IKU di kiri
  const [isIkuComboboxOpen, setIsIkuComboboxOpen] = useState<boolean>(false);
  const [ikuSearchKeyword, setIkuSearchKeyword] = useState<string>('');
  const comboboxRef = useRef<HTMLDivElement>(null);

  // POIN 3: Searchable Combobox per baris untuk "Pindah Antar IKU / Aksi"
  const [activeMoveItemId, setActiveMoveItemId] = useState<number | null>(null);
  const [moveSearchText, setMoveSearchText] = useState<string>('');
  const movePopoverRef = useRef<HTMLDivElement>(null);

  // POIN 6: Checkbox penanda kegiatan sudah dicek (disimpan di localStorage)
  const [checkedItemIds, setCheckedItemIds] = useState<Record<number, boolean>>({});

  // Feedback toast message
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 5000);
  };

  // Muat status centang dari localStorage saat pertama kali load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('iku_checked_items_store');
      if (saved) {
        setCheckedItemIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Gagal memuat status centang dari storage:', e);
    }
  }, []);

  // Simpan status centang ke localStorage
  const toggleCheckItem = (id: number) => {
    setCheckedItemIds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('iku_checked_items_store', JSON.stringify(next));
      } catch (e) {
        console.warn('Gagal menyimpan centang ke storage:', e);
      }
      return next;
    });
  };

  const checkAllItemsInGroup = (items: IkuItem[], check: boolean) => {
    setCheckedItemIds(prev => {
      const next = { ...prev };
      items.forEach(it => {
        if (check) next[it.id] = true;
        else delete next[it.id];
      });
      try {
        localStorage.setItem('iku_checked_items_store', JSON.stringify(next));
      } catch (e) {
        console.warn('Gagal menyimpan centang ke storage:', e);
      }
      return next;
    });
  };

  // Close comboboxes when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsIkuComboboxOpen(false);
      }
      if (movePopoverRef.current && !movePopoverRef.current.contains(event.target as Node)) {
        setActiveMoveItemId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchIkuData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tahun: selectedTahun,
        q: searchQuery,
        ref: selectedRef === 'ALL' ? '' : selectedRef,
        mode: 'grouped',
      });
      const res = await fetch(`/api/iku?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        const fetchedGroups: IkuGroup[] = json.groups || [];
        setGroups(fetchedGroups);
        setMasters(json.masters || []);
        setTotalMatched(json.totalMatchedRows || 0);

        // POIN 2: Default tertutup semua saja saat fetch data
        setExpandedGroups({});
      }
    } catch (err) {
      console.error('Error fetching IKU data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIkuData();
    setFlatTablePage(1);
  }, [selectedTahun, selectedRef]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIkuData();
      setFlatTablePage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Accordion Toggle
  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    groups.forEach(g => {
      allOpen[`${g.ref_tahun_iku}_${g.ref_iku}`] = true;
    });
    setExpandedGroups(allOpen);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  // POIN 3 & 4: Fungsi Memindahkan IKU
  const handleMoveIku = async (itemId: number, newRefIku: string) => {
    setIsUpdatingId(itemId);
    setActiveMoveItemId(null);
    try {
      const res = await fetch('/api/iku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'move',
          id: itemId,
          target_iku: newRefIku
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Kegiatan berhasil dipindahkan ke: "${newRefIku}"`, 'success');
        await fetchIkuData();
      } else {
        showToast(json.error || 'Gagal memindahkan kegiatan', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Koneksi gagal: ' + err.message, 'error');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // POIN 5: Melepas IKU (Hapus) -> tertampung di Belum Ada IKU
  const handleRemoveIku = async (item: IkuItem) => {
    if (!confirm(`Lepas kegiatan "${item.kegiatan_nama}" dari ${item.ref_iku}?\nKegiatan ini akan otomatis tertampung di grup "Belum Ada IKU".`)) {
      return;
    }
    setIsUpdatingId(item.id);
    try {
      const res = await fetch('/api/iku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          id: item.id
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Kegiatan "${item.kegiatan_kode}" berhasil dilepas dan kini tersimpan di tabel "Belum Ada IKU".`, 'info');
        await fetchIkuData();
      } else {
        showToast(json.error || 'Gagal melepaskan IKU', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Koneksi gagal: ' + err.message, 'error');
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Flattened items for Table View & Excel Export
  const allFlattenedItems = useMemo(() => {
    const list: IkuItem[] = [];
    groups.forEach(g => {
      list.push(...g.items);
    });
    return list;
  }, [groups]);

  const paginatedTableItems = useMemo(() => {
    const start = (flatTablePage - 1) * flatTableSize;
    return allFlattenedItems.slice(start, start + flatTableSize);
  }, [allFlattenedItems, flatTablePage, flatTableSize]);

  // POIN 4: Data Grafik diurutkan secara alfabetis (A-Z)
  const chartData = useMemo(() => {
    return groups
      .filter(g => g.count > 0)
      .map((g) => {
        const match = g.ref_iku.match(/^(?:\[?(IKU\s*[0-9A-Za-z.-]+)\]?)/i);
        const shortName = match ? match[1] : g.ref_iku.slice(0, 18) + '...';
        return {
          name: shortName,
          fullName: g.ref_iku,
          count: g.count,
          tahun: g.ref_tahun_iku
        };
      })
      .sort((a, b) => {
        if (a.fullName === 'Belum Ada IKU') return 1;
        if (b.fullName === 'Belum Ada IKU') return -1;
        return a.fullName.localeCompare(b.fullName, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [groups]);

  // Hitung jumlah kegiatan yang belum ada IKU (Poin 5)
  const unmappedGroup = useMemo(() => {
    return groups.find(g => g.ref_iku === 'Belum Ada IKU');
  }, [groups]);
  const unmappedCount = unmappedGroup ? unmappedGroup.count : 0;

  // Total Checked Items Counter
  const totalCheckedCount = useMemo(() => {
    return Object.values(checkedItemIds).filter(Boolean).length;
  }, [checkedItemIds]);

  // POIN 4: Filter options combobox diurutkan alfabetis (Sort by Abjad)
  const filteredComboboxMasters = useMemo(() => {
    const q = ikuSearchKeyword.toLowerCase().trim();
    const sorted = [...masters].sort((a, b) => 
      a.nama_ref_iku.localeCompare(b.nama_ref_iku, undefined, { numeric: true, sensitivity: 'base' })
    );
    if (!q) return sorted;
    return sorted.filter(m => m.nama_ref_iku.toLowerCase().includes(q) || String(m.ref_tahun_iku).includes(q));
  }, [masters, ikuSearchKeyword]);

  // POIN 3: Options untuk popover pindah IKU
  const filteredMoveMasters = useMemo(() => {
    const q = moveSearchText.toLowerCase().trim();
    const sorted = [...masters].sort((a, b) => 
      a.nama_ref_iku.localeCompare(b.nama_ref_iku, undefined, { numeric: true, sensitivity: 'base' })
    );
    if (!q) return sorted;
    return sorted.filter(m => m.nama_ref_iku.toLowerCase().includes(q));
  }, [masters, moveSearchText]);

  // POIN 5: Ekspor Excel Khusus 1 IKU
  const handleExportExcelGroup = async (group: IkuGroup) => {
    const workbook = new ExcelJS.Workbook();
    const cleanSheetName = (group.ref_iku.slice(0, 28) || 'IKU').replace(/[*?:/\\\[\]]/g, '_');
    const sheet = workbook.addWorksheet(cleanSheetName);

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Status Cek', key: 'status_cek', width: 14 },
      { header: 'Tahun IKU', key: 'ref_tahun_iku', width: 12 },
      { header: 'Referensi IKU', key: 'ref_iku', width: 45 },
      { header: 'Kode Tujuan', key: 'tujuan_kode', width: 12 },
      { header: 'Nama Tujuan', key: 'tujuan_nama', width: 35 },
      { header: 'Kode Indikator Tujuan', key: 'indikator_tujuan_kode', width: 14 },
      { header: 'Indikator Tujuan', key: 'indikator_tujuan_nama', width: 35 },
      { header: 'Kode Sasaran', key: 'sasaran_kode', width: 14 },
      { header: 'Nama Sasaran', key: 'sasaran_nama', width: 35 },
      { header: 'Kode Indikator Sasaran', key: 'indikator_sasaran_kode', width: 14 },
      { header: 'Indikator Sasaran', key: 'indikator_sasaran_nama', width: 35 },
      { header: 'Kode Program', key: 'program_kode', width: 16 },
      { header: 'Nama Program', key: 'program_nama', width: 35 },
      { header: 'Kode Indikator Program', key: 'indikator_program_kode', width: 14 },
      { header: 'Indikator Program', key: 'indikator_program_nama', width: 35 },
      { header: 'Kode Kegiatan (RKAT)', key: 'kegiatan_kode', width: 18 },
      { header: 'Nama Kegiatan (RKAT)', key: 'kegiatan_nama', width: 40 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    group.items.forEach((item, idx) => {
      sheet.addRow({
        no: idx + 1,
        status_cek: checkedItemIds[item.id] ? 'Sudah Dicek' : 'Belum Dicek',
        ref_tahun_iku: item.ref_tahun_iku,
        ref_iku: item.ref_iku,
        tujuan_kode: item.tujuan_kode,
        tujuan_nama: item.tujuan_nama,
        indikator_tujuan_kode: item.indikator_tujuan_kode,
        indikator_tujuan_nama: item.indikator_tujuan_nama,
        sasaran_kode: item.sasaran_kode,
        sasaran_nama: item.sasaran_nama,
        indikator_sasaran_kode: item.indikator_sasaran_kode,
        indikator_sasaran_nama: item.indikator_sasaran_nama,
        program_kode: item.program_kode,
        program_nama: item.program_nama,
        indikator_program_kode: item.indikator_program_kode,
        indikator_program_nama: item.indikator_program_nama,
        kegiatan_kode: item.kegiatan_kode,
        kegiatan_nama: item.kegiatan_nama,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFileName = group.ref_iku.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Pemetaan_${cleanFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast(`File Excel khusus "${group.ref_iku.slice(0, 30)}..." berhasil diunduh.`, 'success');
  };

  // Ekspor Excel Global
  const handleExportExcelAll = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Pemetaan IKU ${selectedTahun}`);

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Status Cek', key: 'status_cek', width: 14 },
      { header: 'Tahun IKU', key: 'ref_tahun_iku', width: 12 },
      { header: 'Referensi IKU', key: 'ref_iku', width: 45 },
      { header: 'Kode Tujuan', key: 'tujuan_kode', width: 12 },
      { header: 'Nama Tujuan', key: 'tujuan_nama', width: 35 },
      { header: 'Kode Indikator Tujuan', key: 'indikator_tujuan_kode', width: 14 },
      { header: 'Indikator Tujuan', key: 'indikator_tujuan_nama', width: 35 },
      { header: 'Kode Sasaran', key: 'sasaran_kode', width: 14 },
      { header: 'Nama Sasaran', key: 'sasaran_nama', width: 35 },
      { header: 'Kode Indikator Sasaran', key: 'indikator_sasaran_kode', width: 14 },
      { header: 'Indikator Sasaran', key: 'indikator_sasaran_nama', width: 35 },
      { header: 'Kode Program', key: 'program_kode', width: 16 },
      { header: 'Nama Program', key: 'program_nama', width: 35 },
      { header: 'Kode Indikator Program', key: 'indikator_program_kode', width: 14 },
      { header: 'Indikator Program', key: 'indikator_program_nama', width: 35 },
      { header: 'Kode Kegiatan (RKAT)', key: 'kegiatan_kode', width: 18 },
      { header: 'Nama Kegiatan (RKAT)', key: 'kegiatan_nama', width: 40 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let counter = 1;
    allFlattenedItems.forEach(item => {
      sheet.addRow({
        no: counter++,
        status_cek: checkedItemIds[item.id] ? 'Sudah Dicek' : 'Belum Dicek',
        ref_tahun_iku: item.ref_tahun_iku,
        ref_iku: item.ref_iku,
        tujuan_kode: item.tujuan_kode,
        tujuan_nama: item.tujuan_nama,
        indikator_tujuan_kode: item.indikator_tujuan_kode,
        indikator_tujuan_nama: item.indikator_tujuan_nama,
        sasaran_kode: item.sasaran_kode,
        sasaran_nama: item.sasaran_nama,
        indikator_sasaran_kode: item.indikator_sasaran_kode,
        indikator_sasaran_nama: item.indikator_sasaran_nama,
        program_kode: item.program_kode,
        program_nama: item.program_nama,
        indikator_program_kode: item.indikator_program_kode,
        indikator_program_nama: item.indikator_program_nama,
        kegiatan_kode: item.kegiatan_kode,
        kegiatan_nama: item.kegiatan_nama,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pemetaan_IKU_${selectedTahun}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast(`Seluruh data pemetaan (${allFlattenedItems.length} kegiatan) berhasil diunduh.`, 'success');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/40 text-slate-800 antialiased font-sans">
      
      {/* POIN 7: PUBLIC NAVBAR BERSIH (TANPA TOMBOL FORM RKAT, MONITORING MAK, PORTAL KEUANGAN DI KANAN ATAS) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/iku" 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 hover:scale-105 transition-all"
              title="Katalog IKU"
            >
              <Target size={22} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  PORTAL PUBLIK
                </span>
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">•</span>
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Katalog Hirarki Kegiatan RKAT</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                Pemetaan Indikator Kinerja Utama (IKU)
              </h1>
            </div>
          </div>

          {/* Kanan atas bersih tanpa tombol redirect internal sesuai permintaan Poin 7 */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="hidden sm:inline bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Tahun Anggaran {selectedTahun === 'all' ? '2025 - 2026' : selectedTahun}
            </span>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFIKASI */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in slide-in-from-top-4 ${
          toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toastMsg.type === 'info' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toastMsg.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />}
          {toastMsg.type === 'info' && <AlertTriangle size={18} className="text-amber-600 shrink-0" />}
          {toastMsg.type === 'error' && <X size={18} className="text-rose-600 shrink-0" />}
          <p className="text-xs font-bold max-w-sm">{toastMsg.text}</p>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-bold">
                <Award size={14} className="text-amber-300" />
                <span>Referensi &amp; Penyelarasan RKA Terpadu</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                Kamus Pemetaan IKU &amp; Hirarki Kegiatan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Penyelarasan hirarki Tujuan, Sasaran, Program, dan Kegiatan RKAT ke Referensi IKU Kemendikbudristek / PTN-BH. Mendukung checklist verifikasi kegiatan, pemindahan kegiatan antar IKU, serta unduh Excel per IKU.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* POIN 1: Tombol Toggle Grafik Pie */}
              <button
                type="button"
                onClick={() => setShowChart(!showChart)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 active:scale-95 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                  showChart 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="Buka / tutup visualisasi grafik pie distribusi kegiatan"
              >
                <PieChartIcon size={14} />
                <span>{showChart ? 'Tutup Grafik Pie' : 'Buka Grafik Pie'}</span>
              </button>

              {/* Tombol Unduh Excel Seluruh Data */}
              <button
                type="button"
                onClick={handleExportExcelAll}
                disabled={loading || allFlattenedItems.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
                title="Unduh seluruh hasil pemetaan aktif ke file Excel"
              >
                <Download size={14} />
                <span>Unduh Semua ({allFlattenedItems.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                TAHUN AKTIF
              </span>
              <div className="text-xl font-black text-slate-900 font-mono">
                {selectedTahun === 'all' ? 'Semua Tahun' : `Tahun ${selectedTahun}`}
              </div>
              <span className="text-[11px] font-bold text-blue-600">
                {selectedTahun === '2026' ? '17 Master IKU Baru' : selectedTahun === '2025' ? '11 Master IKU' : '28 Total Master'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Target size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                MASTER REFERENSI
              </span>
              <div className="text-xl font-black text-indigo-900 font-mono">
                {masters.length} <span className="text-xs font-bold text-slate-400 font-sans">IKU</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600">
                {groups.length} Grup Ditampilkan (A-Z)
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Layers size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                KEGIATAN TERPETAKAN
              </span>
              <div className="text-xl font-black text-emerald-900 font-mono">
                {totalMatched.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-400 font-sans">Baris</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">
                {totalCheckedCount} kegiatan sudah dicek
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* POIN 5: METRIC BELUM TERPETAKAN */}
          <div 
            onClick={() => {
              setSelectedRef('Belum Ada IKU');
              setViewMode('grouped');
              const el = document.getElementById('group-unmapped-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl p-4 border-2 border-amber-300 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-500 transition-all group"
            title="Klik untuk melihat tampungan kegiatan yang belum ada IKU (hasil lepas/hapus)"
          >
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1 mb-0.5">
                <AlertTriangle size={12} className="text-amber-600" />
                <span>TAMPUNGAN BELUM ADA IKU</span>
              </span>
              <div className="text-xl font-black text-amber-950 font-mono">
                {unmappedCount} <span className="text-xs font-bold text-amber-700 font-sans">Kegiatan</span>
              </div>
              <span className="text-[11px] font-black text-amber-800 group-hover:underline">
                👉 Klik untuk tinjau &amp; petakan
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300 shadow-2xs group-hover:scale-105 transition-all">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        {/* POIN 1: GRAFIK PIE CHART (DEFAULT TERTUTUP, BISA DIBUKA LEWAT BANNER) */}
        {showChart && chartData.length > 0 && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PieChartIcon size={17} className="text-blue-600" />
                  <span>Grafik Distribusi Jumlah Kegiatan per IKU (Tahun {selectedTahun === 'all' ? '2025 - 2026' : selectedTahun})</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Diagram proporsi kegiatan RKAT terhadap masing-masing IKU (Sort by Abjad). Klik potongan diagram untuk menyaring.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {chartData.length} Indikator Terpetakan
                </span>
                <button
                  type="button"
                  onClick={() => setShowChart(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  title="Tutup Grafik"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="h-80 w-full flex items-center justify-center relative pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderRadius: '1rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      maxWidth: '340px'
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} Kegiatan (${Math.round((Number(val) / (totalMatched || 1)) * 100)}%)`,
                      item.payload.fullName
                    ]}
                  />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={55}
                    outerRadius={105}
                    paddingAngle={2}
                    animationDuration={600}
                    onClick={(entry: any) => {
                      const targetName = entry?.payload?.fullName || entry?.fullName;
                      if (targetName) {
                        setSelectedRef(targetName);
                        setViewMode('grouped');
                      }
                    }}
                    cursor="pointer"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-pie-${index}`} 
                        fill={entry.fullName === 'Belum Ada IKU' ? '#f59e0b' : PIE_COLORS[index % PIE_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={48}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-[10px] font-bold text-slate-600 mr-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Info */}
              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-xl font-black text-slate-900 font-mono tracking-tight leading-none">
                  {totalMatched}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Total Kegiatan
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOOLBAR FILTER & COMBOBOX ANTI KEPOTONG */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            
            {/* POIN 2: COMBOBOX DI SEBELAH KIRI (lg:col-span-8) DENGAN TEKS PENUH TIDAK KEPOTONG */}
            <div className="lg:col-span-8 space-y-1 relative" ref={comboboxRef}>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Filter size={13} className="text-blue-600" />
                  <span>Pilih Referensi IKU (Filter Lengkap):</span>
                </span>
                {selectedRef !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedRef('ALL')}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Tampilkan Semua IKU
                  </button>
                )}
              </label>

              {/* Combobox Trigger Button */}
              <button
                type="button"
                onClick={() => setIsIkuComboboxOpen(!isIkuComboboxOpen)}
                className="w-full text-left pl-3.5 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-2xs relative flex items-center justify-between"
              >
                <div className="leading-snug pr-2 break-words">
                  {selectedRef === 'ALL' ? (
                    <span className="text-slate-800">🌟 Tampilkan Seluruh Referensi IKU ({masters.length} IKU) — Sort by Abjad</span>
                  ) : selectedRef === 'Belum Ada IKU' ? (
                    <span className="text-amber-800 font-black">⚠️ [Tampungan] Belum Ada IKU ({unmappedCount} Kegiatan)</span>
                  ) : (
                    <span className="text-blue-900 font-extrabold">{selectedRef}</span>
                  )}
                </div>
                <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isIkuComboboxOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </button>

              {/* Combobox Dropdown Popover (Wrap text, Searchable, 100% Tidak Kepotong) */}
              {isIkuComboboxOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2 max-h-[420px] flex flex-col animate-in fade-in zoom-in-95">
                  {/* Search inside combobox */}
                  <div className="relative shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={ikuSearchKeyword}
                      onChange={e => setIkuSearchKeyword(e.target.value)}
                      placeholder="Ketik untuk mencari referensi IKU..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                    {ikuSearchKeyword && (
                      <button
                        type="button"
                        onClick={() => setIkuSearchKeyword('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* List Options (POIN 4: Diurutkan secara abjad A-Z) */}
                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1 pr-1 space-y-1 max-h-[320px]">
                    {/* Option All */}
                    <div
                      onClick={() => {
                        setSelectedRef('ALL');
                        setIsIkuComboboxOpen(false);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer text-xs font-bold transition-colors flex items-center justify-between ${
                        selectedRef === 'ALL' ? 'bg-blue-50 text-blue-800 font-black' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span>🌟 Tampilkan Seluruh Referensi IKU ({masters.length} IKU)</span>
                      {selectedRef === 'ALL' && <Check size={14} className="text-blue-600 shrink-0" />}
                    </div>

                    {/* Option Belum Ada IKU */}
                    <div
                      onClick={() => {
                        setSelectedRef('Belum Ada IKU');
                        setIsIkuComboboxOpen(false);
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer text-xs font-bold transition-colors flex items-center justify-between ${
                        selectedRef === 'Belum Ada IKU' ? 'bg-amber-100 text-amber-900 font-black' : 'hover:bg-amber-50 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        <span>⚠️ [Tampungan Lepas/Hapus] Belum Ada IKU</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                        {unmappedCount} kegiatan
                      </span>
                    </div>

                    {/* Master List (Sort by Abjad A-Z) */}
                    {filteredComboboxMasters.map(m => {
                      const matchG = groups.find(g => g.ref_iku === m.nama_ref_iku);
                      const count = matchG ? matchG.count : 0;
                      const isSelected = selectedRef === m.nama_ref_iku;

                      return (
                        <div
                          key={`${m.ref_tahun_iku}_${m.id}`}
                          onClick={() => {
                            setSelectedRef(m.nama_ref_iku);
                            setIsIkuComboboxOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer text-xs transition-colors space-y-1 ${
                            isSelected ? 'bg-blue-50 border border-blue-200 text-blue-900 font-black' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                              Tahun {m.ref_tahun_iku}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">
                              {count} kegiatan
                            </span>
                          </div>
                          <p className="leading-snug break-words whitespace-normal font-semibold">
                            {m.nama_ref_iku}
                          </p>
                        </div>
                      );
                    })}

                    {filteredComboboxMasters.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Tidak ada referensi IKU yang cocok dengan kata kunci "{ikuSearchKeyword}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* KANAN: Tahun & View Mode (lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row items-stretch sm:items-end justify-between lg:justify-end gap-2.5">
              {/* Tahun Pill */}
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Tahun IKU:
                </span>
                <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1 w-full sm:w-auto">
                  {['2026', '2025', 'all'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedTahun(t);
                        setSelectedRef('ALL');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        selectedTahun === t
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      {t === 'all' ? 'Semua' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Format:
                </span>
                <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('grouped')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'grouped' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers size={13} />
                    <span>Grup IKU</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet size={13} />
                    <span>Tabel Flat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BARIS 2: SEARCH INPUT & QUICK BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100 items-center">
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari kode/nama kegiatan, kode/nama program, kode/nama sasaran, kode/nama tujuan..."
                className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Actions & Accordion Controls */}
            <div className="md:col-span-4 flex flex-wrap items-center justify-end gap-2">
              {viewMode === 'grouped' && (
                <>
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Buka Semua
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Tutup Semua
                  </button>
                </>
              )}

              {(searchQuery || selectedRef !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRef('ALL');
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-bold text-slate-500">Memuat data pemetaan IKU &amp; hirarki kegiatan...</p>
          </div>
        )}

        {/* CONTENT VIEW: GROUPED ACCORDION (POIN 1, 2, 3, 4, 5, 6) */}
        {!loading && viewMode === 'grouped' && (
          <div className="space-y-4">

            {/* EMPTY STATE */}
            {groups.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
                <Target size={36} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-black text-slate-700">Tidak ada data pemetaan yang cocok</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Coba ubah kata kunci pencarian atau ganti filter tahun untuk melihat data lainnya.
                </p>
              </div>
            ) : (
              /* POIN 4: Seluruh grup tampil sekaligus (tanpa pagination luar) diurutkan alfabet A-Z */
              groups.map((group, groupIdx) => {
                const groupKey = `${group.ref_tahun_iku}_${group.ref_iku}`;
                const isExpanded = !!expandedGroups[groupKey];
                const isUnmapped = group.ref_iku === 'Belum Ada IKU';

                // Paging di dalam tabel kegiatan grup accordion (15 kegiatan per page)
                const currentInnerPage = innerPages[groupKey] || 1;
                const totalInnerPages = Math.ceil(group.items.length / innerPageSize) || 1;
                const paginatedItems = group.items.slice((currentInnerPage - 1) * innerPageSize, currentInnerPage * innerPageSize);

                return (
                  <div
                    key={groupKey}
                    id={isUnmapped ? 'group-unmapped-section' : undefined}
                    className={`bg-white rounded-3xl border shadow-xs overflow-hidden transition-all duration-200 ${
                      isUnmapped 
                        ? 'border-2 border-amber-400 ring-2 ring-amber-200/60' 
                        : 'border-slate-200/90 hover:border-blue-300/80'
                    }`}
                  >
                    {/* Header Group Accordion */}
                    <div
                      onClick={() => toggleGroup(groupKey)}
                      className={`p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                        isUnmapped 
                          ? (isExpanded ? 'bg-gradient-to-r from-amber-100 via-orange-50 to-white' : 'bg-amber-50/80 hover:bg-amber-100/70') 
                          : (isExpanded ? 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white' : 'hover:bg-slate-50/70')
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border font-black text-xs ${
                          isUnmapped
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : group.count > 0 
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs shadow-blue-200' 
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {isUnmapped ? '⚠️' : groupIdx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                              isUnmapped 
                                ? 'bg-amber-200 text-amber-900 border-amber-300 font-extrabold' 
                                : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                            }`}>
                              {isUnmapped ? 'TAMPUNGAN LEPAS / HAPUS' : `TAHUN ${group.ref_tahun_iku}`}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              isUnmapped
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                                : group.count > 0 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {group.count} Kegiatan Terpetakan
                            </span>
                          </div>
                          <h3 className={`text-xs sm:text-sm font-black mt-1 leading-snug break-words ${
                            isUnmapped ? 'text-amber-950 font-black' : 'text-slate-900'
                          }`}>
                            {isUnmapped ? '⚠️ Kegiatan Belum Ada IKU (Tampungan Hasil Lepas / Hapus)' : group.ref_iku}
                          </h3>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {/* POIN 5: Tombol Unduh Excel per IKU */}
                        {group.count > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportExcelGroup(group);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-700 border border-emerald-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            title={`Unduh file Excel khusus untuk: ${group.ref_iku}`}
                          >
                            <Download size={13} />
                            <span className="hidden sm:inline">Unduh Excel IKU Ini</span>
                          </button>
                        )}

                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${
                          isExpanded 
                            ? (isUnmapped ? 'bg-amber-600 text-white rotate-180' : 'bg-blue-600 text-white rotate-180') 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {/* BODY TABEL DENGAN POIN 1, 3, 5, 6 */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-white p-4 sm:p-5 space-y-3">
                        {group.count === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            Belum ada rincian kegiatan yang terpetakan ke referensi IKU ini.
                          </div>
                        ) : (
                          <>
                            {/* Inner Pagination Header & Tombol Checklist Massal */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-slate-500 px-1 pb-1">
                              <div className="flex items-center gap-3">
                                <span>
                                  Menampilkan {(currentInnerPage - 1) * innerPageSize + 1} - {Math.min(currentInnerPage * innerPageSize, group.items.length)} dari {group.items.length} kegiatan
                                </span>

                                {/* POIN 6: Quick Check / Uncheck All Page */}
                                <div className="flex items-center gap-1 text-[11px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => checkAllItemsInGroup(paginatedItems, true)}
                                    className="text-emerald-700 hover:underline flex items-center gap-1"
                                    title="Tandai semua kegiatan di halaman ini sebagai sudah dicek"
                                  >
                                    <CheckSquare size={13} />
                                    <span>Centang Hal Ini</span>
                                  </button>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => checkAllItemsInGroup(paginatedItems, false)}
                                    className="text-slate-500 hover:underline"
                                    title="Batal centang kegiatan di halaman ini"
                                  >
                                    Batal Centang
                                  </button>
                                </div>
                              </div>

                              {totalInnerPages > 1 && (
                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    disabled={currentInnerPage <= 1}
                                    onClick={() => setInnerPages(p => ({ ...p, [groupKey]: Math.max(1, (p[groupKey] || 1) - 1) }))}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-bold"
                                  >
                                    ‹ Prev
                                  </button>
                                  <span className="font-bold text-slate-800 text-[11px]">
                                    Hal {currentInnerPage} / {totalInnerPages}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={currentInnerPage >= totalInnerPages}
                                    onClick={() => setInnerPages(p => ({ ...p, [groupKey]: (p[groupKey] || 1) + 1 }))}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-bold"
                                  >
                                    Next ›
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-wider">
                                    {/* POIN 6: Kolom Checkbox Cek */}
                                    <th className="py-3 px-3 text-center w-12">Cek</th>
                                    {/* 1. Tujuan */}
                                    <th className="py-3 px-4 min-w-[210px]">Tujuan</th>
                                    {/* 2. Sasaran */}
                                    <th className="py-3 px-4 min-w-[210px]">Sasaran</th>
                                    {/* 3. Program */}
                                    <th className="py-3 px-4 min-w-[220px]">Program</th>
                                    {/* 4. Kegiatan (RKAT) PALING KANAN */}
                                    <th className="py-3 px-4 min-w-[240px]">Kegiatan (RKAT)</th>
                                    {/* 5. Aksi / Pindah IKU (Poin 3) */}
                                    <th className="py-3 px-3 text-center min-w-[220px] w-56">Pindah Antar IKU / Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                  {paginatedItems.map((it, itemIdx) => {
                                    const isUpdatingThis = isUpdatingId === it.id;
                                    const isChecked = !!checkedItemIds[it.id];

                                    return (
                                      <tr 
                                        key={`${it.id}_${itemIdx}`} 
                                        className={`transition-colors ${
                                          isChecked 
                                            ? 'bg-emerald-50/90 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600' 
                                            : 'hover:bg-blue-50/40'
                                        }`}
                                      >
                                        {/* POIN 6: Checkbox & No */}
                                        <td className="py-3 px-3 text-center align-top space-y-1">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleCheckItem(it.id)}
                                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                            title={isChecked ? 'Telah ditandai sudah dicek (Klik untuk batal)' : 'Klik untuk menandai sudah dicek'}
                                          />
                                          {isChecked && (
                                            <span className="block text-[9px] font-black text-emerald-800 uppercase tracking-tighter bg-emerald-100 rounded px-1 py-0.2">
                                              DICEK
                                            </span>
                                          )}
                                        </td>
                                        
                                        {/* POIN 3: Tujuan + Tulisan "Indikator:" yang jelas dengan kodenya */}
                                        <td className="py-3 px-4 align-top space-y-1.5">
                                          <div className="text-[11px] font-bold text-slate-900 leading-snug">
                                            <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] mr-1 border border-blue-200">
                                              {it.tujuan_kode || '-'}
                                            </span>
                                            {it.tujuan_nama}
                                          </div>
                                          {it.indikator_tujuan_nama && (
                                            <div className="text-[11px] text-slate-600 leading-tight bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                                              <span className="font-bold text-slate-800 mr-1.5">Indikator:</span>
                                              <span className="font-mono text-blue-800 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 mr-1.5 text-[10px]">
                                                {it.indikator_tujuan_kode || '-'}
                                              </span>
                                              <span>{it.indikator_tujuan_nama}</span>
                                            </div>
                                          )}
                                        </td>

                                        {/* POIN 3: Sasaran + Tulisan "Indikator:" yang jelas dengan kodenya */}
                                        <td className="py-3 px-4 align-top space-y-1.5">
                                          <div className="text-[11px] font-bold text-slate-900 leading-snug">
                                            <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] mr-1 border border-indigo-200">
                                              {it.sasaran_kode || '-'}
                                            </span>
                                            {it.sasaran_nama}
                                          </div>
                                          {it.indikator_sasaran_nama && (
                                            <div className="text-[11px] text-slate-600 leading-tight bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                                              <span className="font-bold text-slate-800 mr-1.5">Indikator:</span>
                                              <span className="font-mono text-indigo-800 font-bold bg-white px-1.5 py-0.5 rounded border border-indigo-200 mr-1.5 text-[10px]">
                                                {it.indikator_sasaran_kode || '-'}
                                              </span>
                                              <span>{it.indikator_sasaran_nama}</span>
                                            </div>
                                          )}
                                        </td>

                                        {/* POIN 3: Program + Tulisan "Indikator:" yang jelas dengan kodenya */}
                                        <td className="py-3 px-4 align-top space-y-1.5">
                                          <div className="text-[11px] font-bold text-slate-900 leading-snug">
                                            <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] mr-1 border border-purple-200">
                                              {it.program_kode || '-'}
                                            </span>
                                            {it.program_nama}
                                          </div>
                                          {it.indikator_program_nama && (
                                            <div className="text-[11px] text-slate-600 leading-tight bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                                              <span className="font-bold text-slate-800 mr-1.5">Indikator:</span>
                                              <span className="font-mono text-purple-800 font-bold bg-white px-1.5 py-0.5 rounded border border-purple-200 mr-1.5 text-[10px]">
                                                {it.indikator_program_kode || '-'}
                                              </span>
                                              <span>{it.indikator_program_nama}</span>
                                            </div>
                                          )}
                                        </td>

                                        {/* POIN 1: Kegiatan (RKAT) PALING KANAN */}
                                        <td className="py-3 px-4 align-top">
                                          <div className="font-mono text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md inline-block mb-1">
                                            {it.kegiatan_kode || '-'}
                                          </div>
                                          <p className="font-bold text-slate-900 text-xs leading-snug">
                                            {it.kegiatan_nama || '-'}
                                          </p>
                                        </td>

                                        {/* POIN 3: Dropdown Autocomplete Pindah Antar IKU & Tombol Hapus (Lepas IKU) */}
                                        <td className="py-3 px-3 align-top relative">
                                          <div className="flex flex-col gap-1.5">
                                            
                                            {/* POIN 3: Searchable Autocomplete Combobox Popover */}
                                            <div className="relative">
                                              <button
                                                type="button"
                                                disabled={isUpdatingThis}
                                                onClick={() => {
                                                  if (activeMoveItemId === it.id) {
                                                    setActiveMoveItemId(null);
                                                  } else {
                                                    setActiveMoveItemId(it.id);
                                                    setMoveSearchText('');
                                                  }
                                                }}
                                                className="w-full inline-flex items-center justify-between gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
                                                title="Klik untuk memilih IKU tujuan pemindahan kegiatan ini"
                                              >
                                                <span className="flex items-center gap-1 truncate max-w-[150px]">
                                                  <ArrowRightLeft size={11} className="text-blue-600 shrink-0" />
                                                  <span>Pindah ke IKU...</span>
                                                </span>
                                                <ChevronDown size={12} className="text-slate-400 shrink-0" />
                                              </button>

                                              {/* Popover Autocomplete */}
                                              {activeMoveItemId === it.id && (
                                                <div 
                                                  ref={movePopoverRef}
                                                  className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 w-72 sm:w-80 space-y-2 animate-in fade-in zoom-in-95"
                                                >
                                                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                                    <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1">
                                                      <Target size={11} /> Pilih IKU Tujuan:
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() => setActiveMoveItemId(null)}
                                                      className="p-0.5 text-slate-400 hover:text-slate-600"
                                                    >
                                                      <X size={13} />
                                                    </button>
                                                  </div>

                                                  {/* Search input in popover */}
                                                  <div className="relative">
                                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                      type="text"
                                                      autoFocus
                                                      value={moveSearchText}
                                                      onChange={e => setMoveSearchText(e.target.value)}
                                                      placeholder="Ketik cari IKU..."
                                                      className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                                                    />
                                                  </div>

                                                  {/* Opsi Lepas ke Belum Ada IKU */}
                                                  <div
                                                    onClick={() => handleMoveIku(it.id, 'Belum Ada IKU')}
                                                    className="p-2 rounded-lg cursor-pointer text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 flex items-center gap-1.5 transition-colors border border-amber-200"
                                                  >
                                                    <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                                                    <span>⚠️ Lepas ke 'Belum Ada IKU'</span>
                                                  </div>

                                                  {/* List Master Options (Sort by Abjad) */}
                                                  <div className="overflow-y-auto divide-y divide-slate-100 max-h-56 pr-0.5 space-y-0.5">
                                                    {filteredMoveMasters.map(m => (
                                                      <div
                                                        key={`pop_${it.id}_${m.id}`}
                                                        onClick={() => handleMoveIku(it.id, m.nama_ref_iku)}
                                                        className={`p-2 rounded-lg cursor-pointer text-[10px] transition-colors leading-snug break-words whitespace-normal font-semibold ${
                                                          it.ref_iku === m.nama_ref_iku 
                                                            ? 'bg-blue-50 text-blue-900 font-black border border-blue-200' 
                                                            : 'hover:bg-slate-50 text-slate-800'
                                                        }`}
                                                      >
                                                        {m.nama_ref_iku}
                                                      </div>
                                                    ))}

                                                    {filteredMoveMasters.length === 0 && (
                                                      <div className="p-3 text-center text-[10px] text-slate-400">
                                                        Tidak ada IKU yang cocok dengan "{moveSearchText}"
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* POIN 5: Tombol Hapus -> tertampung ke Belum Ada IKU */}
                                            {it.ref_iku !== 'Belum Ada IKU' ? (
                                              <button
                                                type="button"
                                                disabled={isUpdatingThis}
                                                onClick={() => handleRemoveIku(it)}
                                                className="inline-flex items-center justify-center gap-1 w-full px-2 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                                                title="Hapus pemetaan IKU: kegiatan akan ditampung ke tabel belum ada IKU"
                                              >
                                                {isUpdatingThis ? (
                                                  <RefreshCw size={11} className="animate-spin" />
                                                ) : (
                                                  <Trash2 size={11} />
                                                )}
                                                <span>Lepas IKU (Hapus)</span>
                                              </button>
                                            ) : (
                                              <span className="text-[10px] text-amber-800 font-black text-center bg-amber-100/80 py-0.5 rounded-lg border border-amber-300">
                                                Ditampung di 'Belum Ada IKU'
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Inner Pagination Footer */}
                            {totalInnerPages > 1 && (
                              <div className="flex items-center justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  disabled={currentInnerPage <= 1}
                                  onClick={() => setInnerPages(p => ({ ...p, [groupKey]: Math.max(1, (p[groupKey] || 1) - 1) }))}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-bold"
                                >
                                  ‹ Prev
                                </button>
                                <span className="font-bold text-slate-700 text-xs px-2">
                                  Halaman {currentInnerPage} dari {totalInnerPages}
                                </span>
                                <button
                                  type="button"
                                  disabled={currentInnerPage >= totalInnerPages}
                                  onClick={() => setInnerPages(p => ({ ...p, [groupKey]: (p[groupKey] || 1) + 1 }))}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-bold"
                                >
                                  Next ›
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>
        )}

        {/* CONTENT VIEW: TABLE FLAT (TABULAR) */}
        {!loading && viewMode === 'table' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Daftar Seluruh Pemetaan Kegiatan ({allFlattenedItems.length} Baris)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tampilan matriks tabel data per baris pemetaan hirarki RKAT ke referensi IKU (Sort by Abjad).
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>Per Halaman:</span>
                <select
                  value={flatTableSize}
                  onChange={e => {
                    setFlatTableSize(Number(e.target.value));
                    setFlatTablePage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">Cek</th>
                    <th className="py-3 px-3 text-center w-20">Tahun</th>
                    <th className="py-3 px-4 min-w-[200px]">Referensi IKU</th>
                    <th className="py-3 px-4 min-w-[200px]">Tujuan</th>
                    <th className="py-3 px-4 min-w-[200px]">Sasaran</th>
                    <th className="py-3 px-4 min-w-[200px]">Program</th>
                    <th className="py-3 px-4 min-w-[240px]">Kegiatan (RKAT)</th>
                    <th className="py-3 px-3 text-center w-40">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedTableItems.map((it, idx) => {
                    const isChecked = !!checkedItemIds[it.id];

                    return (
                      <tr 
                        key={`${it.id}_table_${idx}`} 
                        className={`transition-colors ${
                          isChecked 
                            ? 'bg-emerald-50/90 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600' 
                            : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-center align-top">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheckItem(it.id)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            title="Tandai sudah dicek"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                            {it.ref_tahun_iku}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-top font-bold text-slate-800 text-xs">
                          {it.ref_iku === 'Belum Ada IKU' ? (
                            <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-black">
                              Belum Ada IKU
                            </span>
                          ) : (
                            it.ref_iku
                          )}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-[11px] space-y-1">
                          <div>
                            <span className="font-mono font-bold text-blue-700 mr-1">{it.tujuan_kode}</span>
                            {it.tujuan_nama}
                          </div>
                          {it.indikator_tujuan_nama && (
                            <div className="text-[10px] text-slate-500">
                              <span className="font-bold mr-1">Indikator:</span>
                              <span className="font-mono">{it.indikator_tujuan_kode}</span> {it.indikator_tujuan_nama}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-[11px] space-y-1">
                          <div>
                            <span className="font-mono font-bold text-indigo-700 mr-1">{it.sasaran_kode}</span>
                            {it.sasaran_nama}
                          </div>
                          {it.indikator_sasaran_nama && (
                            <div className="text-[10px] text-slate-500">
                              <span className="font-bold mr-1">Indikator:</span>
                              <span className="font-mono">{it.indikator_sasaran_kode}</span> {it.indikator_sasaran_nama}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-[11px] space-y-1">
                          <div>
                            <span className="font-mono font-bold text-purple-700 mr-1">{it.program_kode}</span>
                            {it.program_nama}
                          </div>
                          {it.indikator_program_nama && (
                            <div className="text-[10px] text-slate-500">
                              <span className="font-bold mr-1">Indikator:</span>
                              <span className="font-mono">{it.indikator_program_kode}</span> {it.indikator_program_nama}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="font-mono text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md inline-block mb-1">
                            {it.kegiatan_kode || '-'}
                          </div>
                          <p className="font-bold text-slate-900 leading-snug">
                            {it.kegiatan_nama}
                          </p>
                        </td>
                        <td className="py-3 px-3 align-top text-center">
                          <select
                            value={it.ref_iku}
                            onChange={e => handleMoveIku(it.id, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700"
                          >
                            <option value="Belum Ada IKU">-- Belum Ada IKU --</option>
                            {masters.map(m => (
                              <option key={m.id} value={m.nama_ref_iku}>
                                {m.nama_ref_iku}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Table Flat */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan {(flatTablePage - 1) * flatTableSize + 1} - {Math.min(flatTablePage * flatTableSize, allFlattenedItems.length)} dari {allFlattenedItems.length} baris
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={flatTablePage <= 1}
                  onClick={() => setFlatTablePage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700">
                  Halaman {flatTablePage} dari {Math.ceil(allFlattenedItems.length / flatTableSize) || 1}
                </span>
                <button
                  type="button"
                  disabled={flatTablePage >= Math.ceil(allFlattenedItems.length / flatTableSize)}
                  onClick={() => setFlatTablePage(p => p + 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200 mt-12 text-center text-xs text-slate-400 font-medium">
        <p>© {new Date().getFullYear()} Portal Keuangan — Kamus &amp; Pemetaan Referensi Indikator Kinerja Utama (IKU)</p>
      </footer>
    </div>
  );
}
