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

// Autocomplete Input / Filter Unit Kerja untuk Rule Form & Filter
function UnitAutocompleteInput({ units, value, onChange, placeholder = "Pilih / Ketik Unit Kerja..." }: { units: string[], value: string, onChange: (val: string) => void, placeholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = units.filter(u => u.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative w-full">
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
              placeholder="Cari Unit Kerja..."
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
                  value === '*' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                * (Semua Unit Kerja)
              </div>
              {filtered.map((u) => (
                <div
                  key={u}
                  onClick={() => {
                    onChange(u);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors ${
                    value === u ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  {u}
                </div>
              ))}
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

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      <div className="w-full space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-500 hover:text-gray-900">&larr; Kembali</Button>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Master Aturan (Rule Engine)</h1>
              <p className="text-sm text-gray-500 font-medium">Mendukung multi unit (dipisah &apos;|&apos;), multi akun, dan frasa deskripsi eksak.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={() => setDialogOpen(true)}
            >
              + Import Aturan (Paste Zone)
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="bg-white text-gray-900 border-gray-200 sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <DialogTitle>Import Master Aturan dari Excel</DialogTitle>
                      <DialogDescription className="text-gray-500">
                        Copy baris aturan dari Excel dan paste ke kotak di bawah ini.
                      </DialogDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs shrink-0"
                      onClick={() => setPasteData(`unitkerjaNama\takun\tkata_kunci_deskripsi\tlevel\tcustom_status
Komite Audit | Majelis Wali Amanat\t*\tAktivitas terkait dengan review, penyusunan, pengembangan dan revisi prosedur dan pedoman\t1\tWajib Ada
Direktorat Aset\t53102 | 53103\tPerbaikan dan Pemeliharaan\t1\tWajib Ada`)}
                    >
                      ✨ Isi Contoh Format TSV Aturan Multi-Unit
                    </Button>
                  </div>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <p className="text-xs text-gray-500 font-semibold">
                    Urutan Kolom TSV: <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded font-mono">unitkerjaNama | akun | kata_kunci_deskripsi | level | custom_status</code>
                  </p>
                  <Textarea 
                    placeholder="Paste data TSV dari Excel di sini..." 
                    className="h-60 bg-gray-50 border-gray-300 text-gray-800 font-mono text-xs max-w-full break-all whitespace-pre-wrap"
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 shrink-0">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isImporting}>Batal</Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleImportRules} disabled={isImporting}>
                    {isImporting ? 'Memproses...' : 'Import Aturan Sekarang'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* FORM TAMBAH ATURAN BARU DENGAN AUTOCOMPLETE UNIT KERJA */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">Tambah Aturan Baru</h2>
            <p className="text-sm text-gray-500 font-medium">Bisa memasukkan beberapa Unit atau Kode Akun sekaligus dipisah pipa (&apos;|&apos;).</p>
          </div>
          <form onSubmit={handleAddRule} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-gray-600">Unit Kerja (Bisa Multi |)</label>
              <UnitAutocompleteInput 
                units={unitList} 
                value={unit} 
                onChange={(val) => setUnit(val)} 
                placeholder="Misal: Direktorat Aset | Komite Audit"
              />
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-xs font-bold text-gray-600">Kode Akun (Bisa Multi | atau *)</label>
              <Input value={akun} onChange={e => setAkun(e.target.value)} className="bg-white border-gray-300 text-gray-900 text-xs font-mono h-10" placeholder="Contoh: 53102 | 53103 atau *" />
            </div>
            <div className="space-y-2 flex-[2]">
              <label className="text-xs font-bold text-gray-600">Kata Kunci / Frasa (Deskripsi)</label>
              <Input value={keyword} onChange={e => setKeyword(e.target.value)} className="bg-white border-gray-300 text-gray-900 text-xs h-10" placeholder="Frasa eksak atau kata kunci dipisah |" />
            </div>
            <div className="space-y-2 flex-[1]">
              <label className="text-xs font-bold text-gray-600">Label (Status)</label>
              <Input value={customStatus} onChange={e => setCustomStatus(e.target.value)} className="bg-white border-gray-300 text-gray-900 text-xs h-10" placeholder="Wajib Ada" />
            </div>
            <div className="space-y-2 w-24 flex-shrink-0">
              <label className="text-xs font-bold text-gray-600">Level</label>
              <Input type="number" value={priority} onChange={e => setPriority(e.target.value)} className="bg-white border-gray-300 text-gray-900 text-xs h-10" placeholder="99" min="1" max="999" />
            </div>
            <Button type="submit" disabled={isAdding} className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto text-white h-10 font-bold px-6">
              {isAdding ? 'Menambah...' : '+ Tambah'}
            </Button>
          </form>
        </div>

        {/* DAFTAR ATURAN WITH PAGINATION, SORTING & AUTOCOMPLETE FILTER */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
            <div>
              <CardTitle className="text-lg text-gray-900">Daftar Aturan Aktif ({filteredAndSortedRules.length} Aturan)</CardTitle>
              <CardDescription className="text-gray-500">Urutkan berdasar Unit Kerja atau Priority Level.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="UNIT">🏢 Urut Unit Kerja (A-Z)</option>
                <option value="PRIORITY">⚡ Urut Priority Level</option>
                <option value="CREATED">🕒 Urut Terbaru</option>
              </select>

              <Input 
                placeholder="Cari unit, akun, kata kunci..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 w-52 h-9 text-xs"
              />

              <Button 
                onClick={handleApplyRules} 
                disabled={isApplying}
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 h-9 font-bold text-xs"
              >
                {isApplying ? 'Menerapkan...' : '🔄 Terapkan ke Semua Data'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <Table>
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow>
                  <TableHead className="text-gray-500 text-xs font-bold">Unit Kerja</TableHead>
                  <TableHead className="text-gray-500 text-xs font-bold">Kode Akun</TableHead>
                  <TableHead className="text-gray-500 text-xs font-bold">Kata Kunci / Frasa Deskripsi</TableHead>
                  <TableHead className="text-gray-500 text-center text-xs font-bold">Level</TableHead>
                  <TableHead className="text-gray-500 text-center text-xs font-bold">Status Final</TableHead>
                  <TableHead className="text-gray-500 text-right text-xs font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Memuat aturan...</TableCell></TableRow>
                ) : paginatedRules.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Belum ada aturan yang sesuai filter.</TableCell></TableRow>
                ) : paginatedRules.map(rule => (
                  <TableRow key={rule.id} className="border-b border-gray-100 even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 transition-colors">
                    <TableCell className="font-semibold text-xs text-gray-900">{rule.unitkerja_nama || '*'}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-indigo-700">{rule.akun || '*'}</TableCell>
                    <TableCell className="font-medium text-gray-800 text-xs leading-relaxed max-w-md">{rule.kata_kunci_deskripsi || '-'}</TableCell>
                    <TableCell className="text-center font-mono text-gray-700 text-xs font-bold">{rule.priority || 99}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold">
                        {rule.custom_status || 'Wajib Ada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs font-bold" onClick={() => handleDelete(rule.id)}>
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* CONTROLLER PAGINATION RULES */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="h-8 px-2 rounded-lg bg-white border border-gray-300 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value={20}>20 Per Halaman</option>
                  <option value={50}>50 Per Halaman</option>
                  <option value={100}>100 Per Halaman</option>
                  <option value="ALL">Semua ({filteredAndSortedRules.length} Aturan)</option>
                </select>
                <span>
                  | Menampilkan {pageSize === 'ALL' ? filteredAndSortedRules.length : Math.min(filteredAndSortedRules.length, (currentPage - 1) * Number(pageSize) + 1)} - {pageSize === 'ALL' ? filteredAndSortedRules.length : Math.min(filteredAndSortedRules.length, currentPage * Number(pageSize))} dari {filteredAndSortedRules.length} aturan
                </span>
              </div>

              {pageSize !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2 text-xs" 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                  >
                    &laquo; Pertama
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2 text-xs" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                  >
                    &lsaquo; Sblm
                  </Button>
                  <span className="px-2 font-bold text-gray-800">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2 text-xs" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                  >
                    Lanjut &rsaquo;
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2 text-xs" 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages}
                  >
                    Akhir &raquo;
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
