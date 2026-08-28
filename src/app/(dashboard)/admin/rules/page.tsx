"use client";

import { useState, useEffect, useMemo } from 'react';
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
          className="bg-white border-gray-300 text-gray-900 text-xs font-semibold h-10"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 h-10 rounded-xl bg-gray-100 border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-200"
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
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
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
    } catch (e) {
      console.error(e);
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
      alert('Harap isi setidaknya Keyword, Unit Kerja, atau Akun spesifik.');
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
        setUnit('*');
        setAkun('*');
        setKeyword('');
        setPriority('99');
        setCustomStatus('');
        fetchRulesAndUnits();
      } else {
        alert(json.error);
      }
    } catch (error) {
      alert('Gagal menambah aturan');
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
        setEditDialogOpen(false);
        setEditingRule(null);
        fetchRulesAndUnits();
      } else {
        alert('Gagal memperbarui aturan: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memperbarui aturan.');
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
        alert(`Berhasil mengimpor ${json.count} aturan baru!`);
        setDialogOpen(false);
        setPasteData('');
        fetchRulesAndUnits();
      } else {
        alert('Gagal mengimpor aturan: ' + json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus aturan ini?')) return;
    try {
      const res = await fetch(`/api/rules?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchRulesAndUnits();
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan.');
    }
  };

  const handleApplyRules = async () => {
    setIsApplying(true);
    try {
      const res = await fetch('/api/budgets/re-evaluate-rules', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(`Berhasil! ${json.count} data usulan telah diperbarui sesuai aturan saat ini.`);
      } else {
        alert('Gagal: ' + json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sistem.');
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
      alert('Tidak ada data aturan untuk diekspor.');
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
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-24 font-sans text-gray-900">
      <div className="w-full space-y-4">
        
        {/* ROW 1: SLIM TOP TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="shrink-0">
              <Button variant="ghost" className="h-8 px-2 text-gray-500 hover:text-gray-900">&larr;</Button>
            </Link>
            <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
              <span className="text-lg leading-none">⚙️</span>
            </div>
            <div>
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Master Aturan (Rule Engine)</h1>
              <p className="text-gray-500 font-medium text-[11px] mt-0.5">Mendukung multi unit (dipisah &apos;|&apos;), multi akun, dan frasa deskripsi eksak.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <Button 
              variant="outline"
              className="h-9 px-3.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
              onClick={handleExportExcel}
            >
              📥 Export Excel (.xlsx)
            </Button>
            <Button 
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold text-xs rounded-xl transition-all active:scale-95"
              onClick={() => setDialogOpen(true)}
            >
              + Import Aturan (Paste Zone)
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="bg-white text-gray-900 border-gray-200 sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader>
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <DialogTitle className="text-lg font-black text-gray-900">Import Master Aturan dari Excel</DialogTitle>
                      <DialogDescription className="text-gray-500 text-xs">
                        Copy baris aturan dari Excel dan paste ke kotak di bawah ini.
                      </DialogDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs shrink-0 rounded-xl font-bold"
                      onClick={() => setPasteData(`unitkerjaNama\takun\tkata_kunci_deskripsi\tlevel\tcustom_status
Komite Audit | Majelis Wali Amanat\t*\tAktivitas terkait dengan review, penyusunan, pengembangan dan revisi prosedur dan pedoman\t1\tWajib Ada
Direktorat Aset\t53102 | 53103\tPerbaikan dan Pemeliharaan\t1\tWajib Ada`)}
                    >
                      ✨ Isi Contoh TSV
                    </Button>
                  </div>
                </DialogHeader>
                <div className="py-2 space-y-2">
                  <p className="text-[11px] text-gray-500 font-semibold">
                    Urutan Kolom TSV: <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded font-mono">unitkerjaNama | akun | kata_kunci_deskripsi | level | custom_status</code>
                  </p>
                  <Textarea 
                    placeholder="Paste data TSV dari Excel di sini..." 
                    className="h-60 bg-gray-50 border-gray-300 text-gray-800 font-mono text-xs max-w-full break-all whitespace-pre-wrap rounded-xl"
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 shrink-0 pt-2">
                  <Button variant="ghost" className="rounded-xl h-9 text-xs font-bold" onClick={() => setDialogOpen(false)} disabled={isImporting}>Batal</Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 text-xs font-bold shadow-xs" onClick={handleImportRules} disabled={isImporting}>
                    {isImporting ? 'Memproses...' : 'Import Aturan Sekarang'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* FORM TAMBAH ATURAN BARU DENGAN AUTOCOMPLETE UNIT KERJA */}
        <div className="bg-white p-4 px-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider shrink-0">
            <span className="text-indigo-500">✨</span> TAMBAH ATURAN BARU:
          </div>
          <form onSubmit={handleAddRule} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-gray-600">Unit Kerja (Bisa Multi |)</label>
              <UnitAutocompleteInput 
                units={unitList} 
                value={unit} 
                onChange={(val) => setUnit(val)} 
                placeholder="Misal: Direktorat Aset | Komite Audit"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-gray-600">Kode Akun (Bisa Multi | atau *)</label>
              <Input value={akun} onChange={e => setAkun(e.target.value)} className="bg-white border-gray-300 rounded-xl text-gray-900 text-xs font-mono h-9" placeholder="Contoh: 53102 | 53103 atau *" />
            </div>
            <div className="space-y-1.5 flex-[2]">
              <label className="text-[11px] font-bold text-gray-600">Kata Kunci / Frasa (Deskripsi)</label>
              <Input value={keyword} onChange={e => setKeyword(e.target.value)} className="bg-white border-gray-300 rounded-xl text-gray-900 text-xs h-9" placeholder="Frasa eksak atau kata kunci dipisah |" />
            </div>
            <div className="space-y-1.5 flex-[1]">
              <label className="text-[11px] font-bold text-gray-600">Label (Status)</label>
              <Input value={customStatus} onChange={e => setCustomStatus(e.target.value)} className="bg-white border-gray-300 rounded-xl text-gray-900 text-xs h-9" placeholder="Wajib Ada" />
            </div>
            <div className="space-y-1.5 w-20 flex-shrink-0">
              <label className="text-[11px] font-bold text-gray-600">Level</label>
              <Input type="number" value={priority} onChange={e => setPriority(e.target.value)} className="bg-white border-gray-300 rounded-xl text-gray-900 text-xs h-9" placeholder="99" min="1" max="999" />
            </div>
            <Button type="submit" disabled={isAdding} className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto rounded-xl shadow-xs text-white h-9 font-bold px-5 active:scale-95">
              {isAdding ? 'Menambah...' : '+ Tambah'}
            </Button>
          </form>
        </div>

        {/* DAFTAR ATURAN WITH PAGINATION, SORTING & AUTOCOMPLETE FILTER */}
        <Card className="border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 p-4 px-5 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-2">
                Daftar Aturan Aktif
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-bold ml-2">
                  {filteredAndSortedRules.length} Aturan
                </Badge>
              </CardTitle>
              <CardDescription className="text-[11px] text-gray-500 font-medium">Urutkan berdasar Unit Kerja atau Priority Level.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="UNIT">🏢 Urut Unit (A-Z)</option>
                <option value="PRIORITY">⚡ Urut Priority</option>
                <option value="CREATED">🕒 Urut Terbaru</option>
              </select>

              <div className="relative">
                <Input 
                  placeholder="Cari unit, akun, kata kunci..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-white border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 w-52 h-9 text-xs font-medium"
                />
              </div>

              <Button 
                onClick={handleApplyRules} 
                disabled={isApplying}
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 h-9 font-bold text-xs rounded-xl shadow-2xs"
              >
                {isApplying ? 'Menerapkan...' : '🔄 Terapkan ke Semua Data'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/80 text-gray-400 font-black text-[10px] uppercase tracking-wider border-b border-gray-200">
                <TableRow>
                  <TableHead className="w-[150px]">Unit Kerja</TableHead>
                  <TableHead className="w-[100px]">Kode Akun</TableHead>
                  <TableHead>Kata Kunci / Frasa Deskripsi</TableHead>
                  <TableHead className="w-[80px] text-center">Level</TableHead>
                  <TableHead className="w-[120px] text-center">Status Final</TableHead>
                  <TableHead className="w-[120px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Memuat aturan...</TableCell></TableRow>
                ) : paginatedRules.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Belum ada aturan yang sesuai filter.</TableCell></TableRow>
                ) : paginatedRules.map(rule => (
                  <TableRow key={rule.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <TableCell className="font-black text-[11px] text-gray-900">{rule.unitkerja_nama || '*'}</TableCell>
                    <TableCell className="font-mono text-[11px] font-bold text-indigo-700">{rule.akun || '*'}</TableCell>
                    <TableCell className="font-medium text-gray-700 text-[11px] leading-relaxed max-w-md">{rule.kata_kunci_deskripsi || '-'}</TableCell>
                    <TableCell className="text-center font-mono text-gray-700 text-[11px] font-bold">{rule.priority || 99}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px]">
                        {rule.custom_status || 'Wajib Ada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 px-2 text-xs font-bold" 
                          onClick={() => handleOpenEdit(rule)}
                        >
                          ✏️ Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs font-bold" 
                          onClick={() => handleDelete(rule.id)}
                        >
                          🗑️ Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* CONTROLLER PAGINATION RULES */}
            {filteredAndSortedRules.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
                {/* Left: Info */}
                <div className="flex items-center gap-2">
                  <span>
                    Menampilkan <strong className="text-gray-900">{pageSize === 'ALL' ? 1 : (currentPage - 1) * Number(pageSize) + 1}</strong> - <strong className="text-gray-900">{pageSize === 'ALL' ? filteredAndSortedRules.length : Math.min(currentPage * Number(pageSize), filteredAndSortedRules.length)}</strong> dari <strong className="text-gray-900">{filteredAndSortedRules.length}</strong> aturan
                  </span>
                </div>

                {/* Center: Rows per page */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="ALL">Semua</option>
                  </select>
                </div>

                {/* Right: Page Navigation */}
                {pageSize !== 'ALL' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &laquo;
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lsaquo;
                    </button>
                    <span className="px-3 font-bold text-gray-800">
                      Hal {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &rsaquo;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &raquo;
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DIALOG MODAL EDIT ATURAN */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-white text-gray-900 border-gray-200 sm:max-w-[650px] w-full max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-gray-900">✏️ Edit Aturan Rule Engine</DialogTitle>
              <DialogDescription className="text-gray-500 text-xs">
                Ubah detail aturan untuk Unit Kerja, Kode Akun, Kata Kunci, Level, atau Status Final.
              </DialogDescription>
            </DialogHeader>

            {editingRule && (
              <form onSubmit={handleUpdateRule} className="space-y-4 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Unit Kerja (Bisa Multi | atau *)</label>
                  <UnitAutocompleteInput 
                    units={unitList} 
                    value={editingRule.unitkerja_nama} 
                    onChange={(val) => setEditingRule({ ...editingRule, unitkerja_nama: val })} 
                    placeholder="Misal: Direktorat Aset | Komite Audit"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Kode Akun (Bisa Multi | atau *)</label>
                    <Input 
                      value={editingRule.akun} 
                      onChange={e => setEditingRule({ ...editingRule, akun: e.target.value })} 
                      className="bg-white border-gray-300 text-gray-900 text-xs font-mono h-10" 
                      placeholder="Contoh: 53102 | 53103 atau *" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Level (Priority)</label>
                    <Input 
                      type="number" 
                      value={editingRule.priority} 
                      onChange={e => setEditingRule({ ...editingRule, priority: e.target.value })} 
                      className="bg-white border-gray-300 text-gray-900 text-xs h-10 font-mono" 
                      placeholder="99" 
                      min="1" 
                      max="999" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Kata Kunci / Frasa (Deskripsi)</label>
                  <Textarea 
                    value={editingRule.kata_kunci_deskripsi} 
                    onChange={e => setEditingRule({ ...editingRule, kata_kunci_deskripsi: e.target.value })} 
                    className="bg-white border-gray-300 text-gray-900 text-xs h-20" 
                    placeholder="Frasa eksak atau kata kunci dipisah |" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600">Label Status Final (Custom Status)</label>
                  <Input 
                    value={editingRule.custom_status} 
                    onChange={e => setEditingRule({ ...editingRule, custom_status: e.target.value })} 
                    className="bg-white border-gray-300 text-gray-900 text-xs h-10 font-bold" 
                    placeholder="Wajib Ada" 
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                  <Button type="button" variant="ghost" className="rounded-xl h-9 text-xs font-bold" onClick={() => setEditDialogOpen(false)} disabled={isUpdating}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl h-9 text-xs shadow-xs" disabled={isUpdating}>
                    {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
