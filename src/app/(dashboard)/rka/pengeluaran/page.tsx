"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderTree, Search, Plus, Upload, Download, RefreshCw, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Building2, 
  Sparkles, Layers, Landmark, Wallet, Filter, X, ArrowUpDown,
  BookOpen, Eye, Save, ExternalLink, ChevronLeft, ChevronRight,
  PieChart, BarChart3, CheckSquare, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Autocomplete Filter Unit Kerja (dengan Navigasi Keyboard ↑ ↓ + Enter seperti di modul review-anggaran)
function UnitAutocompleteFilter({ units, selectedUnit, onSelect }: { units: string[], selectedUnit: string, onSelect: (unit: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredUnits = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  const allOptions = useMemo(() => {
    return ['ALL', ...filteredUnits];
  }, [filteredUnits]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < allOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : allOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allOptions.length > 0 && allOptions[highlightedIndex]) {
        onSelect(allOptions[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-2xs flex items-center justify-between gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[200px]"
      >
        <span className="truncate">
          {selectedUnit === 'ALL' ? `🏢 Semua Unit (${units.length})` : selectedUnit}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-72 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari unit (Navigasi ↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors ${
                  highlightedIndex === 0 ? 'bg-indigo-600 text-white font-bold' : selectedUnit === 'ALL' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                🏢 Semua Unit ({units.length})
              </div>
              {filteredUnits.map((u, idx) => {
                const itemIdx = idx + 1;
                const isHighlighted = highlightedIndex === itemIdx;
                const isSelected = selectedUnit === u;
                return (
                  <div
                    key={u}
                    onClick={() => {
                      onSelect(u);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors ${
                      isHighlighted ? 'bg-indigo-600 text-white font-bold' : isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function RkaPengeluaranPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'semua' | 'kementerian' | 'webometrics' | 'unmapped'>('semua');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'ID' | 'ANGGARAN' | 'UNIT'>('ID');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(50);

  // Modals
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRow, setNewRow] = useState<any>({
    tahun_anggaran: 2027,
    unit: '',
    tujuan: '',
    sasaran: '',
    program: '',
    indikator_program: '',
    target: '',
    cascading_kinerja_target_satuan: '',
    kelompok_indikator_program: '',
    cascading_kinerja_iku: '',
    kegiatan: '',
    lingkup_kegiatan: '',
    sumber_dana_nama: 'Dana Masyarakat Tidak Mengikat',
    prioritas: 'Pertama',
    akun_utama: '52 Belanja Barang dan Jasa',
    sub_akun: '',
    akun_detail: '',
    uraian_belanja: '',
    anggaran: '0',
    realisasi: '0',
    rncn_pengeluaran_is_aprove: 'Belum',
    laporan_kementerian: '',
    laporan_webometrics: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/rka/pengeluaran?tahun=${tahunFilter}`;
      if (unitFilter !== 'ALL') url += `&unit=${encodeURIComponent(unitFilter)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data);
      } else {
        toast.error('Gagal memuat data: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Kesalahan jaringan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tahunFilter, unitFilter]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // List Units unik untuk filter dropdown
  const unitOptions = useMemo(() => {
    return Array.from(new Set(dataList.map(d => d.unit).filter(Boolean))) as string[];
  }, [dataList]);

  // Filter Data berdasarkan Tab
  const filteredData = useMemo(() => {
    let list = [...dataList];

    if (activeTab === 'kementerian') {
      list = list.filter(d => d.laporan_kementerian && d.laporan_kementerian.trim() !== '');
    } else if (activeTab === 'webometrics') {
      list = list.filter(d => d.laporan_webometrics && d.laporan_webometrics.trim() !== '');
    } else if (activeTab === 'unmapped') {
      list = list.filter(d => (!d.laporan_kementerian || d.laporan_kementerian.trim() === '') && (!d.laporan_webometrics || d.laporan_webometrics.trim() === ''));
    }

    if (sortBy === 'ANGGARAN') {
      list.sort((a, b) => (Number(b.anggaran) || 0) - (Number(a.anggaran) || 0));
    } else if (sortBy === 'UNIT') {
      list.sort((a, b) => (a.unit || '').localeCompare(b.unit || ''));
    } else {
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
    }

    return list;
  }, [dataList, activeTab, sortBy]);

  // Pagination Logic
  const totalItems = filteredData.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalItems / (pageSize as number)) || 1;
  const paginatedData = useMemo(() => {
    if (pageSize === 'ALL') return filteredData;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredData.slice(start, start + (pageSize as number));
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, tahunFilter, unitFilter, search, pageSize]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalAnggaran = dataList.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);
    const totalRealisasi = dataList.reduce((acc, d) => acc + (Number(d.realisasi) || 0), 0);
    const sisaAnggaran = totalAnggaran - totalRealisasi;
    const persenSerapan = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(2) : '0';

    const kemenRows = dataList.filter(d => d.laporan_kementerian && d.laporan_kementerian.trim() !== '');
    const kemenTotal = kemenRows.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);

    const weboRows = dataList.filter(d => d.laporan_webometrics && d.laporan_webometrics.trim() !== '');
    const weboTotal = weboRows.reduce((acc, d) => acc + (Number(d.anggaran) || 0), 0);

    return {
      totalCount: dataList.length,
      totalAnggaran,
      totalRealisasi,
      sisaAnggaran,
      persenSerapan,
      kemenCount: kemenRows.length,
      kemenTotal,
      weboCount: weboRows.length,
      weboTotal
    };
  }, [dataList]);

  // Format Rupiah
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Bulk Import TSV
  const handleBulkImport = async () => {
    if (!pasteText.trim()) return toast.error('Silakan paste data TSV terlebih dahulu');
    setIsImporting(true);
    try {
      const res = await fetch('/api/rka/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pasteText })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil mengimpor ${json.count} baris data RKAT Pengeluaran!`);
        setPasteModalOpen(false);
        setPasteText('');
        fetchData();
      } else {
        toast.error('Gagal mengimpor: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Gagal import: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Single Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...newRow,
        tahun_anggaran: parseInt(newRow.tahun_anggaran) || 2027,
        anggaran: parseFloat(newRow.anggaran) || 0,
        realisasi: parseFloat(newRow.realisasi) || 0,
        target: newRow.target ? parseFloat(newRow.target) : null
      };

      const res = await fetch('/api/rka/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data pengeluaran berhasil ditambahkan');
        setAddModalOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menyimpan: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editingRow,
        tahun_anggaran: parseInt(editingRow.tahun_anggaran) || 2027,
        anggaran: parseFloat(editingRow.anggaran) || 0,
        realisasi: parseFloat(editingRow.realisasi) || 0,
        target: editingRow.target ? parseFloat(editingRow.target) : null
      };

      const res = await fetch('/api/rka/pengeluaran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data berhasil diperbarui');
        setEditModalOpen(false);
        setEditingRow(null);
        fetchData();
      } else {
        toast.error('Gagal update: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Row
  const handleDeleteRow = async (id: number) => {
    if (!confirm(`Hapus baris pengeluaran ID #${id}?`)) return;
    try {
      const res = await fetch(`/api/rka/pengeluaran?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Baris data berhasil dihapus');
        setDataList(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Gagal menghapus: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) return toast.error('Tidak ada data untuk di-export');

    const mapped = filteredData.map((d, i) => ({
      'No': i + 1,
      'Tahun': d.tahun_anggaran,
      'Unit Kerja': d.unit,
      'Tujuan': d.tujuan,
      'Sasaran': d.sasaran,
      'Program': d.program,
      'Indikator Program': d.indikator_program,
      'Target': d.target,
      'Satuan Target': d.cascading_kinerja_target_satuan,
      'Kelompok Indikator': d.kelompok_indikator_program,
      'IKU': d.cascading_kinerja_iku,
      'Kegiatan': d.kegiatan,
      'Lingkup Kegiatan': d.lingkup_kegiatan,
      'Sumber Dana': d.sumber_dana_nama,
      'Prioritas': d.prioritas,
      'Akun Utama': d.akun_utama,
      'Sub Akun': d.sub_akun,
      'Akun Detail': d.akun_detail,
      'Uraian Belanja': d.uraian_belanja,
      'Pagu Anggaran (Rp)': Number(d.anggaran) || 0,
      'Realisasi (Rp)': Number(d.realisasi) || 0,
      'Sisa Anggaran (Rp)': (Number(d.anggaran) || 0) - (Number(d.realisasi) || 0),
      'Status Approval': d.rncn_pengeluaran_is_aprove,
      'Laporan Kementerian': d.laporan_kementerian || '-',
      'Laporan Webometrics': d.laporan_webometrics || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(mapped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RKAT_Pengeluaran');
    XLSX.writeFile(wb, `RKAT_Pengeluaran_${tahunFilter}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Halaman (Seragam dengan Modul Lain) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <FolderTree size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  RKAT Pengeluaran &amp; Identifikasi Laporan
                </h1>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold uppercase">
                  TA {tahunFilter}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Data terstruktur Rencana Kerja &amp; Anggaran Pengeluaran Unit Kerja UGM
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPasteModalOpen(true)}
            className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Upload size={14} className="text-indigo-600" />
            <span>Paste TSV / Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Plus size={14} className="text-emerald-600" />
            <span>Tambah Data</span>
          </Button>

          <Link href="/rka/rules">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Sparkles size={14} className="text-indigo-600" />
              <span>Rule Engine</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 rounded-xl border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 w-9 p-0 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50 shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards (Seragam dengan Card shadcn/ui) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Pagu Anggaran
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              Rp {formatRp(metrics.totalAnggaran)}
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>{metrics.totalCount.toLocaleString('id-ID')} Baris Data</span>
              <Badge variant="secondary" className="text-[10px] font-bold">TA {tahunFilter}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-xs bg-gradient-to-b from-white to-emerald-50/30">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Realisasi Belanja
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700">
              Rp {formatRp(metrics.totalRealisasi)}
            </div>
            <div className="text-xs text-emerald-700 font-semibold flex items-center justify-between pt-1 border-t border-emerald-100/60">
              <span>Serapan: {metrics.persenSerapan}%</span>
              <span className="text-[10px] text-gray-500 font-mono">Sisa: Rp {formatRp(metrics.sisaAnggaran)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-indigo-100 shadow-xs bg-gradient-to-b from-white to-indigo-50/30">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
              🏛️ Laporan Kementerian
            </span>
            <div className="text-2xl font-black font-mono text-indigo-700">
              Rp {formatRp(metrics.kemenTotal)}
            </div>
            <div className="text-xs text-indigo-700 font-semibold flex items-center justify-between pt-1 border-t border-indigo-100/60">
              <span>{metrics.kemenCount.toLocaleString('id-ID')} Teridentifikasi</span>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                {metrics.totalCount > 0 ? ((metrics.kemenCount / metrics.totalCount) * 100).toFixed(1) : 0}% Data
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-100 shadow-xs bg-gradient-to-b from-white to-amber-50/30">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              🌐 Laporan Webometrics
            </span>
            <div className="text-2xl font-black font-mono text-amber-700">
              Rp {formatRp(metrics.weboTotal)}
            </div>
            <div className="text-xs text-amber-700 font-semibold flex items-center justify-between pt-1 border-t border-amber-100/60">
              <span>{metrics.weboCount.toLocaleString('id-ID')} Teridentifikasi</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                {metrics.totalCount > 0 ? ((metrics.weboCount / metrics.totalCount) * 100).toFixed(1) : 0}% Data
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar & Controls */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto">
              {[
                { id: 'semua', label: 'Semua Belanja' },
                { id: 'kementerian', label: '🏛️ Laporan Kementerian' },
                { id: 'webometrics', label: '🌐 Laporan Webometrics' },
                { id: 'unmapped', label: '⚠️ Belum Teridentifikasi' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Dropdown & Unit Autocomplete */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Tahun Filter */}
              <select
                value={tahunFilter}
                onChange={e => setTahunFilter(e.target.value)}
                className="h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="2027">Tahun 2027</option>
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
                <option value="ALL">Semua Tahun</option>
              </select>

              {/* Unit Autocomplete Filter */}
              <UnitAutocompleteFilter
                units={unitOptions}
                selectedUnit={unitFilter}
                onSelect={(u) => setUnitFilter(u)}
              />

              {/* Sort Order */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="ID">Urut ID Default</option>
                <option value="ANGGARAN">Pagu Nominal Tertinggi</option>
                <option value="UNIT">Nama Unit Kerja</option>
              </select>
            </div>
          </div>

          {/* Search Box & Summary Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Cari kata kunci uraian belanja, program, kegiatan, akun detail, nama unit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl py-2 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-medium focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Per Page Selector */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium shrink-0">
              <span>Tampilkan:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                className="h-8 bg-white border border-gray-200 rounded-lg px-2 text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value="ALL">Semua ({totalItems.toLocaleString('id-ID')})</option>
              </select>
              <span>baris</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Data Table */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <span className="text-xs font-bold text-gray-500">Memuat seluruh baris data RKAT Pengeluaran...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <FolderTree size={40} className="text-gray-300" />
            <h3 className="text-sm font-bold text-gray-700">Tidak ada data belanja yang cocok</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Pastikan tabel <code>rkat_pengeluaran</code> sudah dieksekusi di Supabase atau coba ubah kata kunci filter Anda.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center">#</th>
                    <th className="px-4 py-3 min-w-[200px]">Unit Kerja &amp; Program</th>
                    <th className="px-4 py-3 min-w-[260px]">Kegiatan &amp; Uraian Belanja</th>
                    <th className="px-4 py-3 min-w-[160px]">Akun Belanja</th>
                    <th className="px-4 py-3 text-right min-w-[130px]">Pagu Anggaran</th>
                    <th className="px-4 py-3 text-right min-w-[130px]">Realisasi</th>
                    <th className="px-4 py-3 min-w-[170px]">🏛️ Laporan Kementerian</th>
                    <th className="px-4 py-3 min-w-[170px]">🌐 Laporan Webometrics</th>
                    <th className="px-3 py-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {paginatedData.map((row, idx) => {
                    const rowNumber = pageSize === 'ALL' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                    const anggaran = Number(row.anggaran) || 0;
                    const realisasi = Number(row.realisasi) || 0;
                    const sisa = anggaran - realisasi;
                    const pct = anggaran > 0 ? Math.min(100, Math.round((realisasi / anggaran) * 100)) : 0;

                    return (
                      <tr key={row.id || idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3.5 py-3 text-center text-gray-400 font-mono text-[11px] align-top pt-3.5">
                          {rowNumber}
                        </td>

                        {/* Unit & Program */}
                        <td className="px-4 py-3 align-top space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-indigo-600 shrink-0" />
                            <span className="font-bold text-gray-900 text-xs">{row.unit || 'Unit UGM'}</span>
                          </div>
                          {row.program && (
                            <div className="text-[11px] text-gray-600 font-normal line-clamp-2">
                              {row.program}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-400 flex items-center gap-1">
                            <span>TA {row.tahun_anggaran || 2027}</span>
                            <span>•</span>
                            <span>Prioritas: <strong>{row.prioritas || '-'}</strong></span>
                          </div>
                        </td>

                        {/* Kegiatan & Uraian Belanja */}
                        <td className="px-4 py-3 align-top space-y-1">
                          <div className="font-bold text-gray-900 text-xs leading-snug">
                            {row.uraian_belanja || row.kegiatan || '-'}
                          </div>
                          {row.lingkup_kegiatan && (
                            <div className="text-[11px] text-indigo-700 font-medium">
                              Lingkup: {row.lingkup_kegiatan}
                            </div>
                          )}
                          {row.kegiatan && (
                            <div className="text-[10px] text-gray-400 font-mono line-clamp-1">
                              {row.kegiatan}
                            </div>
                          )}
                        </td>

                        {/* Akun Belanja */}
                        <td className="px-4 py-3 align-top space-y-1">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold bg-gray-50 text-gray-800 border-gray-200 block w-fit">
                            {row.akun_detail || row.sub_akun || row.akun_utama || '-'}
                          </Badge>
                          <div className="text-[10px] text-gray-500 line-clamp-1">
                            {row.sumber_dana_nama || '-'}
                          </div>
                        </td>

                        {/* Anggaran */}
                        <td className="px-4 py-3 text-right align-top space-y-0.5">
                          <div className="font-black font-mono text-gray-900 text-xs">
                            Rp {formatRp(anggaran)}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Sisa: Rp {formatRp(sisa)}
                          </div>
                        </td>

                        {/* Realisasi & Serapan */}
                        <td className="px-4 py-3 text-right align-top space-y-1">
                          <div className="font-bold font-mono text-emerald-700 text-xs">
                            Rp {formatRp(realisasi)}
                          </div>
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-14 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 font-mono">{pct}%</span>
                          </div>
                        </td>

                        {/* Laporan Kementerian */}
                        <td className="px-4 py-3 align-top">
                          {row.laporan_kementerian ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-[10px] font-bold leading-tight">
                              🏛️ {row.laporan_kementerian}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Belum diset</span>
                          )}
                        </td>

                        {/* Laporan Webometrics */}
                        <td className="px-4 py-3 align-top">
                          {row.laporan_webometrics ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold leading-tight">
                              🌐 {row.laporan_webometrics}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Belum diset</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-3 py-3 text-center align-top pt-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingRow({ ...row });
                                setEditModalOpen(true);
                              }}
                              className="p-1.5 bg-gray-100 hover:bg-indigo-600 text-gray-600 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Edit Data & Tagging Laporan"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1.5 bg-gray-100 hover:bg-rose-600 text-gray-600 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Hapus Baris Data"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
              <div>
                Menampilkan <strong>{pageSize === 'ALL' ? totalItems : Math.min((currentPage - 1) * (pageSize as number) + 1, totalItems)}</strong> sampai <strong>{pageSize === 'ALL' ? totalItems : Math.min(currentPage * (pageSize as number), totalItems)}</strong> dari <strong>{totalItems.toLocaleString('id-ID')}</strong> total baris data
              </div>

              {pageSize !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    <ChevronLeft size={14} />
                    <span>Sebelumnya</span>
                  </Button>

                  <div className="px-3 py-1 font-bold text-gray-700 bg-white border border-gray-200 rounded-lg text-xs">
                    Halaman {currentPage} dari {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* MODAL 1: PASTE ZONE TSV BULK IMPORT */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="text-indigo-600" size={20} />
                <h3 className="font-bold text-gray-900 text-sm">Paste Zone Data RKAT Pengeluaran (TSV / Excel)</h3>
              </div>
              <button onClick={() => setPasteModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl text-xs text-gray-600 space-y-1 border border-gray-200">
              <p className="font-bold text-gray-800">Format Kolom Baku (Tab-Delimited dari Excel):</p>
              <p className="font-mono text-[10px] text-gray-500 overflow-x-auto whitespace-nowrap">
                Tahun_Anggaran • Unit • Tujuan • Sasaran • Program • IndikatorProgram • target • cascading_kinerja_target_satuan • Kelompok_Indikator_Program • cascading_kinerja_iku • Kegiatan • Lingkup_Kegiatan • sumberdanaNama • Prioritas • AkunUtama • SubAkun • AkunDetail • Uraian_belanja • Anggaran • Realisasi • rncnpengeluaranIsAprove
              </p>
              <p className="text-[11px] text-indigo-600 font-medium">
                Cukup salin (copy) seluruh baris dari spreadsheet Excel lalu paste ke textarea di bawah. Sistem akan otomatis membagi per kolom dan menyimpannya ke database.
              </p>
            </div>

            <textarea
              rows={10}
              placeholder="Paste baris data TSV / Excel di sini..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3.5 text-xs font-mono text-gray-800 outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPasteModalOpen(false)}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleBulkImport}
                disabled={isImporting || !pasteText.trim()}
                className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5 shadow-sm"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                {isImporting ? 'Menyimpan...' : 'Simpan Seluruh Data'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROW & TAGGING */}
      {editModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="text-indigo-600" size={18} />
                <h3 className="font-bold text-gray-900 text-sm">Edit Baris Pengeluaran &amp; Identifikasi Laporan</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tahun Anggaran</label>
                  <Input
                    type="number"
                    value={editingRow.tahun_anggaran || 2027}
                    onChange={e => setEditingRow({ ...editingRow, tahun_anggaran: e.target.value })}
                    className="h-9 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unit Kerja</label>
                  <Input
                    type="text"
                    value={editingRow.unit || ''}
                    onChange={e => setEditingRow({ ...editingRow, unit: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Uraian Belanja</label>
                <textarea
                  rows={2}
                  value={editingRow.uraian_belanja || ''}
                  onChange={e => setEditingRow({ ...editingRow, uraian_belanja: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Akun Detail</label>
                  <Input
                    type="text"
                    value={editingRow.akun_detail || ''}
                    onChange={e => setEditingRow({ ...editingRow, akun_detail: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Lingkup Kegiatan</label>
                  <Input
                    type="text"
                    value={editingRow.lingkup_kegiatan || ''}
                    onChange={e => setEditingRow({ ...editingRow, lingkup_kegiatan: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pagu Anggaran (Rp)</label>
                  <Input
                    type="number"
                    value={editingRow.anggaran || 0}
                    onChange={e => setEditingRow({ ...editingRow, anggaran: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Realisasi (Rp)</label>
                  <Input
                    type="number"
                    value={editingRow.realisasi || 0}
                    onChange={e => setEditingRow({ ...editingRow, realisasi: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Tagging / Identifikasi Laporan */}
              <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2.5">
                <span className="font-bold text-indigo-950 block text-xs">Identifikasi Format Laporan Khusus</span>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1 text-[11px]">🏛️ Format Laporan Kementerian</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Beasiswa Mahasiswa Asing / Publikasi..."
                    value={editingRow.laporan_kementerian || ''}
                    onChange={e => setEditingRow({ ...editingRow, laporan_kementerian: e.target.value })}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1 text-[11px]">🌐 Format Laporan Webometrics</label>
                  <Input
                    type="text"
                    placeholder="Contoh: International Student Mobility / Web Visibility..."
                    value={editingRow.laporan_webometrics || ''}
                    onChange={e => setEditingRow({ ...editingRow, laporan_webometrics: e.target.value })}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-1.5"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH DATA MANUAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="text-emerald-600" size={18} />
                <h3 className="font-bold text-gray-900 text-sm">Tambah Pengeluaran RKA Baru</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tahun Anggaran</label>
                  <Input
                    type="number"
                    value={newRow.tahun_anggaran}
                    onChange={e => setNewRow({ ...newRow, tahun_anggaran: e.target.value })}
                    className="h-9 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unit Kerja</label>
                  <Input
                    type="text"
                    placeholder="Contoh: 05000010 Fakultas Filsafat"
                    value={newRow.unit}
                    onChange={e => setNewRow({ ...newRow, unit: e.target.value })}
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Uraian Belanja</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi uraian belanja..."
                  value={newRow.uraian_belanja}
                  onChange={e => setNewRow({ ...newRow, uraian_belanja: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Akun Detail</label>
                  <Input
                    type="text"
                    placeholder="Contoh: 52501 Beasiswa Mahasiswa"
                    value={newRow.akun_detail}
                    onChange={e => setNewRow({ ...newRow, akun_detail: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Lingkup Kegiatan</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Beasiswa bagi mahasiswa asing"
                    value={newRow.lingkup_kegiatan}
                    onChange={e => setNewRow({ ...newRow, lingkup_kegiatan: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pagu Anggaran (Rp)</label>
                  <Input
                    type="number"
                    value={newRow.anggaran}
                    onChange={e => setNewRow({ ...newRow, anggaran: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Realisasi (Rp)</label>
                  <Input
                    type="number"
                    value={newRow.realisasi}
                    onChange={e => setNewRow({ ...newRow, realisasi: e.target.value })}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2.5">
                <span className="font-bold text-emerald-950 block text-xs">Identifikasi Format Laporan Khusus</span>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1 text-[11px]">🏛️ Format Laporan Kementerian</label>
                  <Input
                    type="text"
                    placeholder="Format kementerian..."
                    value={newRow.laporan_kementerian}
                    onChange={e => setNewRow({ ...newRow, laporan_kementerian: e.target.value })}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1 text-[11px]">🌐 Format Laporan Webometrics</label>
                  <Input
                    type="text"
                    placeholder="Format webometrics..."
                    value={newRow.laporan_webometrics}
                    onChange={e => setNewRow({ ...newRow, laporan_webometrics: e.target.value })}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(false)}
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                  Simpan Data
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
