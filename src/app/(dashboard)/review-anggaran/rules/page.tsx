"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Wand2, Plus, Search, Trash2, Edit2, Download, Upload, 
  RefreshCw, CheckCircle2, ShieldCheck, Database, Layers,
  Building2, ArrowRight, ArrowLeft, Loader2, Sparkles, X, Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Autocomplete Input / Filter Unit Kerja untuk Rule Form & Filter (Navigasi Keyboard ↑ ↓ + Enter)
function UnitAutocompleteInput({ units, value, onChange, placeholder = "Pilih / Ketik Unit Kerja..." }: { units: string[], value: string, onChange: (val: string) => void, placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filtered = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  const allOptions = useMemo(() => {
    return ['*', ...filtered];
  }, [filtered]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
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
        onChange(allOptions[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
      } else if (query.trim()) {
        onChange(query.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" onKeyDown={handleKeyDown}>
      <div className="flex gap-1">
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-white border-gray-200 text-gray-900 text-xs font-semibold h-9 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-600 transition-colors cursor-pointer"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari unit (Navigasi ↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              <div
                onClick={() => {
                  onChange('*');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors ${
                  highlightedIndex === 0 ? 'bg-indigo-600 text-white font-bold' : value === '*' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                * (Semua Unit Kerja)
              </div>
              {filtered.map((u, idx) => {
                const itemIdx = idx + 1;
                const isHighlighted = highlightedIndex === itemIdx;
                const isSelected = value === u;
                return (
                  <div
                    key={u}
                    onClick={() => {
                      onChange(u);
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

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [unit, setUnit] = useState('*');
  const [akun, setAkun] = useState('*');
  const [keyword, setKeyword] = useState('');
  const [priority, setPriority] = useState('99');
  const [customStatus, setCustomStatus] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Filter, Sort & Pagination states
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'UNIT' | 'CREATED'>('UNIT');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<number | 'ALL'>(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Paste Zone Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Edit Modal State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchRulesAndUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rules');
      const json = await res.json();
      if (json.success) setRules(json.data);
      
      const resUnits = await fetch('/api/budgets/list');
      const jsonUnits = await resUnits.json();
      if (jsonUnits.success) {
        const units = Array.from(new Set(jsonUnits.data.map((b: any) => b.unitkerja_nama))).filter(Boolean) as string[];
        setUnitList(units);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Gagal memuat aturan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndUnits();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword && akun === '*' && unit === '*') {
      toast.error('Harap isi setidaknya Keyword, Unit Kerja, atau Akun spesifik.');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitkerja_nama: unit, akun, kata_kunci_deskripsi: keyword, priority, custom_status: customStatus })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Aturan baru berhasil ditambahkan!');
        setUnit('*');
        setAkun('*');
        setKeyword('');
        setPriority('99');
        setCustomStatus('');
        fetchRulesAndUnits();
      } else {
        toast.error(json.error || 'Gagal menambahkan aturan.');
      }
    } catch (error: any) {
      toast.error('Gagal menambah aturan: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (rule: any) => {
    setEditingRule({
      id: rule.id,
      unitkerja_nama: rule.unitkerja_nama || '*',
      akun: rule.akun || '*',
      kata_kunci_deskripsi: rule.kata_kunci_deskripsi || '',
      priority: (rule.priority || 99).toString(),
      custom_status: rule.custom_status || 'Wajib Ada'
    });
    setEditDialogOpen(true);
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.id) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRule.id,
          unitkerja_nama: editingRule.unitkerja_nama,
          akun: editingRule.akun,
          kata_kunci_deskripsi: editingRule.kata_kunci_deskripsi,
          priority: editingRule.priority,
          custom_status: editingRule.custom_status
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Aturan berhasil diperbarui!');
        setEditDialogOpen(false);
        setEditingRule(null);
        fetchRulesAndUnits();
      } else {
        toast.error('Gagal memperbarui aturan: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan saat memperbarui aturan.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImportRules = async () => {
    if (!pasteData.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pasteData })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil mengimpor ${json.count} aturan baru!`);
        setDialogOpen(false);
        setPasteData('');
        fetchRulesAndUnits();
      } else {
        toast.error('Gagal mengimpor aturan: ' + json.error);
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan sistem: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm('Hapus aturan ini?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/rules?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Aturan berhasil dihapus.');
        fetchRulesAndUnits();
      } else {
        toast.error(json.error || 'Gagal menghapus');
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan: ' + error.message);
    }
  };

  const handleApplyRules = async () => {
    setIsApplying(true);
    const toastId = toast.loading('Menerapkan seluruh aturan ke data usulan...');
    try {
      const res = await fetch('/api/budgets/re-evaluate-rules', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil! ${json.count} data usulan telah dievaluasi ulang sesuai aturan saat ini.`, { id: toastId });
      } else {
        toast.error('Gagal: ' + json.error, { id: toastId });
      }
    } catch (error: any) {
      toast.error('Terjadi kesalahan: ' + error.message, { id: toastId });
    } finally {
      setIsApplying(false);
    }
  };

  // Processing Filter & Sorting untuk Rules
  const filteredAndSortedRules = useMemo(() => {
    let result = rules.filter(r => {
      const matchUnit = selectedUnitFilter === 'ALL' || (r.unitkerja_nama || '').toLowerCase().includes(selectedUnitFilter.toLowerCase());
      if (!matchUnit) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (r.unitkerja_nama || '').toLowerCase().includes(q) ||
        (r.akun || '').toLowerCase().includes(q) ||
        (r.kata_kunci_deskripsi || '').toLowerCase().includes(q) ||
        (r.custom_status || '').toLowerCase().includes(q)
      );
    });

    // Sort Rules
    return result.sort((a, b) => {
      if (sortBy === 'UNIT') {
        const uA = (a.unitkerja_nama || 'ZZZ').toLowerCase();
        const uB = (b.unitkerja_nama || 'ZZZ').toLowerCase();
        if (uA !== uB) return uA.localeCompare(uB);
        return (a.priority || 99) - (b.priority || 99);
      } else if (sortBy === 'PRIORITY') {
        return (a.priority || 99) - (b.priority || 99);
      } else {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });
  }, [rules, selectedUnitFilter, sortBy, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUnitFilter, sortBy, searchTerm, pageSize]);

  const paginatedRules = useMemo(() => {
    if (pageSize === 'ALL') return filteredAndSortedRules;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredAndSortedRules.slice(start, start + size);
  }, [filteredAndSortedRules, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'ALL' || filteredAndSortedRules.length === 0) return 1;
    return Math.ceil(filteredAndSortedRules.length / Number(pageSize));
  }, [filteredAndSortedRules, pageSize]);

  const handleExportExcel = () => {
    if (!filteredAndSortedRules || filteredAndSortedRules.length === 0) {
      toast.error('Tidak ada data aturan untuk diekspor.');
      return;
    }

    const exportData = filteredAndSortedRules.map((r, idx) => ({
      'No': idx + 1,
      'Unit Kerja': r.unitkerja_nama || '*',
      'Kode Akun': r.akun || '*',
      'Kata Kunci / Frasa Deskripsi': r.kata_kunci_deskripsi || '-',
      'Level (Priority)': r.priority || 99,
      'Status Final': r.custom_status || 'Wajib Ada'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Rules');
    XLSX.writeFile(workbook, `Master_Aturan_Rule_Engine_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('File Excel Master Aturan berhasil diunduh!');
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* 1. SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/review-anggaran">
            <button className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer" title="Kembali ke Landing">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-2.5 rounded-xl text-white shadow-xs">
            <Wand2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Master Aturan Penelaahan (Rule Engine)
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                Deterministic Engine
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Mendukung multi unit (dipisah &apos;|&apos;), multi kode akun, dan pencocokan frasa deskripsi eksak.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={handleExportExcel}
            className="h-9 px-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Download size={13} />
            <span>Export Excel</span>
          </button>

          <button 
            onClick={() => setDialogOpen(true)}
            className="h-9 px-3.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Upload size={13} />
            <span>Import TSV (Paste)</span>
          </button>

          <button 
            onClick={handleApplyRules} 
            disabled={isApplying}
            className="h-9 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={isApplying ? 'animate-spin' : ''} />
            <span>Terapkan ke Data</span>
          </button>
        </div>
      </div>

      {/* 2. 4 MODERN KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL ATURAN */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">TOTAL ATURAN AKTIF</span>
              <div className="text-xl font-black text-gray-900 font-mono tracking-tight flex items-baseline gap-1">
                {rules.length} <span className="text-xs font-semibold text-gray-500">Aturan</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Wand2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Filter Keyword & Akun</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Tersinkron</span>
          </div>
        </div>

        {/* CARD 2: TOTAL UNIT TERDAFTAR */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">CAKUPAN UNIT KERJA</span>
              <div className="text-xl font-black text-indigo-700 font-mono tracking-tight flex items-baseline gap-1">
                {unitList.length} <span className="text-xs font-semibold text-indigo-600">Unit</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-indigo-700 flex items-center justify-between border-t border-indigo-100/60 pt-2">
            <span>Unit Terdeteksi</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold">Auto-Sync</span>
          </div>
        </div>

        {/* CARD 3: HASIL FILTER DATA */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">ATURAN TERFILTER</span>
              <div className="text-xl font-black text-amber-700 font-mono tracking-tight flex items-baseline gap-1">
                {filteredAndSortedRules.length} <span className="text-xs font-semibold text-amber-600">Data</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Search size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>Pencarian Kata Kunci</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">Aktif</span>
          </div>
        </div>

        {/* CARD 4: STATUS EVALUASI ENGINE */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">KEAMANAN ATURAN</span>
              <div className="text-sm font-black text-gray-900 truncate mt-1">
                Prioritas Mandatori
              </div>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Terkunci Otomatis</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Siap Evaluasi</span>
          </div>
        </div>
      </div>

      {/* 3. FORM TAMBAH ATURAN BARU */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-indigo-600" />
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">Tambah Aturan Penelaahan Baru</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Bisa memasukkan beberapa Unit atau Kode Akun dipisah pipa (&apos;|&apos;)</span>
        </div>

        <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="space-y-1 lg:col-span-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Unit Kerja (Bisa Multi | atau *)</label>
            <UnitAutocompleteInput 
              units={unitList} 
              value={unit} 
              onChange={(val) => setUnit(val)} 
              placeholder="Misal: Direktorat Aset | Komite Audit"
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Kode Akun (Multi | atau *)</label>
            <Input 
              value={akun} 
              onChange={e => setAkun(e.target.value)} 
              className="bg-white border-gray-200 text-gray-900 text-xs font-mono h-9 rounded-xl focus:ring-2 focus:ring-indigo-500/20" 
              placeholder="53102 | 53103 atau *" 
            />
          </div>

          <div className="space-y-1 lg:col-span-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Kata Kunci / Frasa (Deskripsi)</label>
            <Input 
              value={keyword} 
              onChange={e => setKeyword(e.target.value)} 
              className="bg-white border-gray-200 text-gray-900 text-xs h-9 rounded-xl focus:ring-2 focus:ring-indigo-500/20" 
              placeholder="Frasa eksak / kata kunci" 
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Label Status</label>
            <Input 
              value={customStatus} 
              onChange={e => setCustomStatus(e.target.value)} 
              className="bg-white border-gray-200 text-gray-900 text-xs h-9 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold" 
              placeholder="Wajib Ada" 
            />
          </div>

          <div className="space-y-1 lg:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Level</label>
            <Input 
              type="number" 
              value={priority} 
              onChange={e => setPriority(e.target.value)} 
              className="bg-white border-gray-200 text-gray-900 text-xs h-9 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-mono text-center" 
              placeholder="99" 
              min="1" 
              max="999" 
            />
          </div>

          <div className="lg:col-span-1">
            <button 
              type="submit" 
              disabled={isAdding} 
              className="w-full h-9 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
              <span>Tambah</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. TABEL DAFTAR ATURAN */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 px-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">
              Daftar Aturan Rule Engine ({filteredAndSortedRules.length} Aturan)
            </h3>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Urutkan berdasarkan unit kerja atau level prioritas evaluasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="UNIT">🏢 Urut Unit Kerja (A-Z)</option>
              <option value="PRIORITY">⚡ Urut Priority Level</option>
              <option value="CREATED">🕒 Urut Terbaru</option>
            </select>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input 
                type="text"
                placeholder="Cari unit, akun, kata kunci..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4 w-36">Kode Akun</th>
                <th className="py-3 px-4">Kata Kunci / Frasa Deskripsi</th>
                <th className="py-3 px-4 w-20 text-center">Level</th>
                <th className="py-3 px-4 w-32 text-center">Status Final</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs font-medium">
                    <Loader2 size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Memuat daftar aturan...
                  </td>
                </tr>
              ) : paginatedRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs font-medium space-y-2">
                    <Wand2 size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-600">Belum ada aturan yang sesuai filter.</p>
                    <p className="text-[11px] text-gray-400">Gunakan form di atas untuk menambahkan aturan baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedRules.map((rule, idx) => (
                  <tr key={rule.id} className="even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 whitespace-nowrap transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-gray-400 text-xs">
                      {(pageSize === 'ALL' ? 0 : (currentPage - 1) * Number(pageSize)) + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-xs text-gray-900">
                      {rule.unitkerja_nama || '*'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-700">
                      {rule.akun || '*'}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-800 max-w-md truncate" title={rule.kata_kunci_deskripsi}>
                      {rule.kata_kunci_deskripsi || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-xs text-gray-700">
                      {rule.priority || 99}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rule.custom_status || 'Wajib Ada'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(rule)}
                          className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Edit Aturan"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(rule.id)}
                          className="h-7 px-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Hapus Aturan"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controller */}
        <div className="p-4 px-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50/50 text-xs text-gray-600 font-medium">
          <div className="flex items-center gap-2">
            <span>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="h-7 px-2 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 outline-none"
            >
              <option value={20}>20 Per Halaman</option>
              <option value={50}>50 Per Halaman</option>
              <option value={100}>100 Per Halaman</option>
              <option value="ALL">Semua ({filteredAndSortedRules.length})</option>
            </select>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(1)} 
                disabled={currentPage === 1}
                className="h-7 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                &laquo;
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className="h-7 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                &lsaquo;
              </button>
              <span className="px-2 font-bold text-gray-800">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="h-7 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                &rsaquo;
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)} 
                disabled={currentPage === totalPages}
                className="h-7 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-gray-100 transition-colors"
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. MODAL DIALOG EDIT ATURAN */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border-gray-200 sm:max-w-[600px] w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-0">
          <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Edit2 size={16} />
              </div>
              <DialogTitle className="text-sm font-black text-gray-900">Edit Aturan Rule Engine</DialogTitle>
            </div>
          </div>

          {editingRule && (
            <form onSubmit={handleUpdateRule} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Unit Kerja (Multi | atau *)</label>
                <UnitAutocompleteInput 
                  units={unitList} 
                  value={editingRule.unitkerja_nama} 
                  onChange={(val) => setEditingRule({ ...editingRule, unitkerja_nama: val })} 
                  placeholder="Misal: Direktorat Aset | Komite Audit"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Kode Akun (Multi | atau *)</label>
                  <Input 
                    value={editingRule.akun} 
                    onChange={e => setEditingRule({ ...editingRule, akun: e.target.value })} 
                    className="bg-white border-gray-200 text-gray-900 text-xs font-mono h-9 rounded-xl focus:ring-2 focus:ring-indigo-500/20" 
                    placeholder="53102 | 53103 atau *" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Level (Priority)</label>
                  <Input 
                    type="number" 
                    value={editingRule.priority} 
                    onChange={e => setEditingRule({ ...editingRule, priority: e.target.value })} 
                    className="bg-white border-gray-200 text-gray-900 text-xs h-9 font-mono rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-center" 
                    placeholder="99" 
                    min="1" 
                    max="999" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Kata Kunci / Frasa (Deskripsi)</label>
                <Textarea 
                  value={editingRule.kata_kunci_deskripsi} 
                  onChange={e => setEditingRule({ ...editingRule, kata_kunci_deskripsi: e.target.value })} 
                  className="bg-white border-gray-200 text-gray-900 text-xs h-20 rounded-xl focus:ring-2 focus:ring-indigo-500/20" 
                  placeholder="Frasa eksak atau kata kunci dipisah |" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">Label Status Final</label>
                <Input 
                  value={editingRule.custom_status} 
                  onChange={e => setEditingRule({ ...editingRule, custom_status: e.target.value })} 
                  className="bg-white border-gray-200 text-gray-900 text-xs h-9 rounded-xl focus:ring-2 focus:ring-indigo-500/20 font-bold" 
                  placeholder="Wajib Ada" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditDialogOpen(false)} 
                  disabled={isUpdating}
                  className="h-8 px-4 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="h-8 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold disabled:opacity-70 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. MODAL DIALOG IMPORT PASTE ZONE */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-gray-900 border-gray-200 sm:max-w-[680px] w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-0">
          <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <DialogTitle className="text-sm font-black text-gray-900">Import Master Aturan dari Excel (TSV)</DialogTitle>
              <DialogDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                Salin baris aturan dari Excel lalu tempelkan (*paste*) pada kotak di bawah.
              </DialogDescription>
            </div>
            <button 
              type="button" 
              onClick={() => setPasteData(`unitkerjaNama\takun\tkata_kunci_deskripsi\tlevel\tcustom_status
Komite Audit | Majelis Wali Amanat\t*\tAktivitas terkait dengan review, penyusunan, pengembangan dan revisi prosedur dan pedoman\t1\tWajib Ada
Direktorat Aset\t53102 | 53103\tPerbaikan dan Pemeliharaan\t1\tWajib Ada`)}
              className="text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              ✨ Contoh Format
            </button>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-[11px] text-gray-500 font-semibold">
              Format Kolom: <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded font-mono">unitkerjaNama | akun | kata_kunci_deskripsi | level | custom_status</code>
            </p>
            <Textarea 
              placeholder="Paste data TSV dari Excel di sini..." 
              className="h-56 bg-gray-50 border-gray-200 text-gray-800 font-mono text-xs rounded-xl"
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
            />
          </div>

          <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setDialogOpen(false)} 
              disabled={isImporting}
              className="h-8 px-4 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button 
              type="button" 
              onClick={handleImportRules} 
              disabled={isImporting}
              className="h-8 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-70 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isImporting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              <span>Import Aturan Sekarang</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
