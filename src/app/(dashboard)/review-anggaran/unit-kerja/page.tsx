"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';

// Autocomplete Filter Unit Kerja
function UnitAutocompleteFilter({ units, selectedUnit, onSelect }: { units: string[], selectedUnit: string, onSelect: (unit: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredUnits = units.filter(u => u.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-sm flex items-center justify-between gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[180px]"
      >
        <span className="truncate">
          {selectedUnit === 'ALL' ? `🏢 Semua Unit (${units.length})` : selectedUnit}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-64 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari Unit Kerja..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors flex items-center justify-between ${
                  selectedUnit === 'ALL' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <span>🏢 Semua Unit Kerja ({units.length})</span>
                {selectedUnit === 'ALL' && <span className="text-indigo-600">✓</span>}
              </div>
              {filteredUnits.map((u) => (
                <div
                  key={u}
                  onClick={() => {
                    onSelect(u);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors flex items-center justify-between ${
                    selectedUnit === u ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span className="truncate">{u}</span>
                  {selectedUnit === u && <span className="text-indigo-600 font-bold">✓</span>}
                </div>
              ))}
              {filteredUnits.length === 0 && (
                <div className="p-2 text-gray-400 text-center">Unit tidak ditemukan</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Autocomplete Status Combobox (HANYA berisi opsi yang ADA di data)
function StatusAutocomplete({ value, kunci, availableStatuses = [], onSelect }: { value: string, kunci: string, availableStatuses?: string[], onSelect: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const combinedStatusList = useMemo(() => {
    const defaultCore = ['N', 'Wajib'];
    const customFromData = availableStatuses.filter(s => s && s !== 'N' && s !== 'Wajib');
    const set = new Set([...defaultCore, ...customFromData]);
    return Array.from(set);
  }, [availableStatuses]);

  const currentStatusVal = kunci === 'N' && !value ? 'N' : (value || (kunci === 'Y' ? 'Wajib' : 'N'));

  const getBadgeClass = (val: string) => {
    if (val === 'N') return 'bg-gray-100 text-gray-700 border-gray-300';
    if (val === 'Wajib' || val === 'Wajib Ada') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    return 'bg-indigo-50 text-indigo-800 border-indigo-300';
  };

  const getLabel = (val: string) => {
    if (val === 'N') return '🔓 Bebas (N)';
    if (val === 'Wajib') return '🔒 Wajib (Y)';
    return val;
  };

  const filtered = combinedStatusList.filter(s => getLabel(s).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 shadow-sm transition-all hover:scale-105 ${getBadgeClass(currentStatusVal)}`}
      >
        <span>{getLabel(currentStatusVal)}</span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari / Ketik status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-300 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.map((s) => (
                <div
                  key={s}
                  onClick={() => {
                    onSelect(s);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-semibold transition-colors flex items-center justify-between ${
                    currentStatusVal === s ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  <span>{getLabel(s)}</span>
                  {currentStatusVal === s && <span className="text-indigo-600 font-bold">✓</span>}
                </div>
              ))}
              {query.trim() && !filtered.some(s => s.toLowerCase() === query.toLowerCase()) && (
                <div
                  onClick={() => {
                    onSelect(query.trim());
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg cursor-pointer font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-center"
                >
                  + Gunakan Status: &quot;{query.trim()}&quot;
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function UnitKerjaDashboard() {
  const [pasteData, setPasteData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDetailData, setViewDetailData] = useState<any>(null);
  
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedAiFilter, setSelectedAiFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [pageSize, setPageSize] = useState<number | 'ALL'>(100);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets/list');
      const json = await res.json();
      if (json.success) {
        setBudgets(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch budgets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const unitOptions = useMemo(() => {
    const units = Array.from(new Set(budgets.map(b => b.unitkerja_nama).filter(Boolean))).sort();
    return units as string[];
  }, [budgets]);

  const availableStatusList = useMemo(() => {
    const statuses = Array.from(new Set(budgets.map(b => b.custom_status).filter(Boolean)));
    return statuses as string[];
  }, [budgets]);

  const handleImport = async () => {
    if (!pasteData.trim()) return;
    
    setIsImporting(true);
    try {
      const response = await fetch('/api/budgets/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pasteData }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Berhasil mengimpor ${result.count} data usulan anggaran!`);
        setDialogOpen(false);
        setPasteData('');
        fetchBudgets();
      } else {
        alert('Gagal mengimpor data: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleQuickStatusChange = async (budget: any, newStatusVal: string) => {
    let kunciVal = 'Y';
    let customStatusVal = newStatusVal;

    if (newStatusVal === 'N') {
      kunciVal = 'N';
      customStatusVal = '';
    } else if (newStatusVal === 'Wajib') {
      kunciVal = 'Y';
      customStatusVal = 'Wajib Ada';
    }

    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, kunci: kunciVal, custom_status: customStatusVal, kunci_by: 'MANUAL' } : b));

    try {
      await fetch('/api/budgets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: budget.id,
          kunci: kunciVal,
          custom_status: customStatusVal,
          kunci_by: 'MANUAL'
        }),
      });
    } catch (e) {
      console.error('Failed to update status', e);
      fetchBudgets();
    }
  };

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const matchUnit = selectedUnitFilter === 'ALL' || b.unitkerja_nama === selectedUnitFilter;
      if (!matchUnit) return false;

      if (selectedStatusFilter === 'KUNCI') {
        if (b.kunci !== 'Y') return false;
      } else if (selectedStatusFilter === 'BEBAS') {
        if (b.kunci === 'Y') return false;
      } else if (selectedStatusFilter !== 'ALL') {
        if ((b.custom_status || '') !== selectedStatusFilter) return false;
      }

      // Filter Keyakinan AI
      if (selectedAiFilter === 'HIGH_CONFIDENCE') {
        if (!b.ai_confidence || b.ai_confidence < 0.75) return false;
      } else if (selectedAiFilter === 'PENDING_AI') {
        // AI merekomendasikan tapi belum disetujui di status final
        if (!b.ai_confidence || b.kunci === 'Y' || (b.custom_status && b.custom_status.trim() !== '')) return false;
      } else if (selectedAiFilter === 'RULE_ONLY') {
        if (b.kunci_by !== 'RULE') return false;
      }

      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (b.id_db || '').toLowerCase().includes(q) ||
        (b.deskripsi || '').toLowerCase().includes(q) ||
        (b.akun || '').toLowerCase().includes(q) ||
        (b.unitkerja_nama || '').toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const numA = parseInt(a.id_db) || 0;
      const numB = parseInt(b.id_db) || 0;
      return numA - numB;
    });
  }, [budgets, selectedUnitFilter, selectedStatusFilter, selectedAiFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUnitFilter, selectedStatusFilter, selectedAiFilter, searchTerm, pageSize]);

  const paginatedBudgets = useMemo(() => {
    if (pageSize === 'ALL') return filteredBudgets;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredBudgets.slice(start, start + size);
  }, [filteredBudgets, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'ALL' || filteredBudgets.length === 0) return 1;
    return Math.ceil(filteredBudgets.length / Number(pageSize));
  }, [filteredBudgets, pageSize]);

  const exportToExcelCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const headers = ['ID DB', 'Unit Kerja', 'Kode Akun', 'Nama Komponen', 'Deskripsi Usulan', 'Lingkup', 'Maksud Tujuan', 'Vol', 'Tarif (Rp)', 'Total (Rp)', 'Status Kunci', 'Sumber Kunci', 'Label Status'];
    const csvRows = [
      headers.join('\t'),
      ...data.map(b => [
        `"${(b.id_db || '').toString().replace(/"/g, '""')}"`,
        `"${(b.unitkerja_nama || '').toString().replace(/"/g, '""')}"`,
        `"${(b.akun || '').toString().replace(/"/g, '""')}"`,
        `"${(b.komponen_nama || '').toString().replace(/"/g, '""')}"`,
        `"${(b.deskripsi || '').toString().replace(/"/g, '""')}"`,
        `"${(b.lingkup || '').toString().replace(/"/g, '""')}"`,
        `"${(b.maksud_tujuan || '').toString().replace(/"/g, '""')}"`,
        b.vol || 1,
        b.tarif || 0,
        b.total || 0,
        `"${b.kunci || 'N'}"`,
        `"${b.kunci_by || '-'}"`,
        `"${(b.custom_status || '').toString().replace(/"/g, '""')}"`
      ].join('\t'))
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      <div className="w-full space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link href="/review-anggaran">
              <Button variant="ghost" className="text-gray-500 hover:text-gray-900 px-0">&larr; Kembali ke Overview</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Dashboard Unit Kerja</h1>
              <p className="text-gray-500 font-medium">Saran AI keyakinan tinggi disorot mencolok dengan tombol ⚡ Setujui AI 1-Klik.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => exportToExcelCSV(filteredBudgets, 'Data_Usulan_Unit_Kerja')}
            >
              📥 Export ke Excel
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={() => setDialogOpen(true)}
            >
              + Import Data (Paste Zone)
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="bg-white text-gray-900 border-gray-200 sm:max-w-[750px] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex justify-between items-center gap-2">
                    <div>
                      <DialogTitle>Import Data Anggaran dari Excel</DialogTitle>
                      <DialogDescription className="text-gray-500">
                        Copy baris kolom dari Excel dan paste ke kotak di bawah ini.
                      </DialogDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs shrink-0"
                      onClick={() => setPasteData(`id_angg\tusulan_pagu_indikatif_lingkup\tusulan_pagu_indikatif_maksud_tujuan\tkomponen_nama\tsatuan\tusulan_pagu_indikatif_anggaran_deskripsi\ttarif\tvol\ttotal\tunitkerjaNama\takun
2746\tLangganan Daya Listrik dan Retribusi Air\tterpenuhinya ketersediaan layanan listrik\tLangganan Daya Listrik\t\\N\tLangganan Daya Listrik\t 2.450.000.000,00 \t12\t 29.400.000.000,00 \tDirektorat Aset\t52201 - Langganan Daya Listrik
2748\tLangganan Daya Listrik dan Retribusi Air\tterpenuhinya ketersediaan layanan listrik\tLangganan Daya Listrik\t\\N\tLangganan Jasa Pengoperasian dan Pemeliharaan PLTS\t 9.000.000,00 \t12\t 108.000.000,00 \tDirektorat Aset\t52201 - Langganan Daya Listrik`)}
                    >
                      ✨ Isi Contoh Format TSV (Real Data)
                    </Button>
                  </div>
                </DialogHeader>
                <div className="py-4 space-y-2">
                  <p className="text-xs text-gray-500 font-semibold">
                    Urutan Kolom TSV: <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded font-mono">id_db | unit | akun | komponen | deskripsi | lingkup | maksud_tujuan | vol | tarif | total</code>
                  </p>
                  <Textarea 
                    placeholder="Paste data TSV dari Excel di sini..." 
                    className="h-64 bg-gray-50 border-gray-300 text-gray-800 font-mono text-xs max-w-full break-all whitespace-pre-wrap"
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 shrink-0">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isImporting}>Batal</Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleImport} disabled={isImporting}>
                    {isImporting ? 'Memproses...' : 'Import Data Sekarang'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-xl text-gray-900">Daftar Usulan Terkini ({filteredBudgets.length} Data)</CardTitle>
                <CardDescription className="text-gray-500">
                  Filter Keyakinan AI dan tombol ⚡ Setujui AI 1-Klik mempermudah validasi manual Anda.
                </CardDescription>
              </div>

              {/* FILTER UNIT, STATUS & FILTER KEYAKINAN AI */}
              <div className="flex flex-wrap gap-2 items-center">
                <UnitAutocompleteFilter 
                  units={unitOptions} 
                  selectedUnit={selectedUnitFilter} 
                  onSelect={(u) => setSelectedUnitFilter(u)} 
                />

                {/* FILTER KEYAKINAN AI */}
                <select
                  value={selectedAiFilter}
                  onChange={e => setSelectedAiFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-purple-50 border border-purple-300 text-xs font-bold text-purple-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="ALL">🤖 Semua Evaluasi AI</option>
                  <option value="HIGH_CONFIDENCE">🔥 AI Keyakinan Tinggi (≥ 75%)</option>
                  <option value="PENDING_AI">⚡ Perlu Persetujuan AI</option>
                  <option value="RULE_ONLY">📌 Master Rule (Reff)</option>
                </select>

                {/* FILTER STATUS (HANYA STATUS YANG ADA DI DATA) */}
                <select
                  value={selectedStatusFilter}
                  onChange={e => setSelectedStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="ALL">📌 Semua Status</option>
                  <option value="KUNCI">🔒 Terkunci (Y)</option>
                  <option value="BEBAS">🔓 Bebas (N)</option>
                  {availableStatusList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <Input 
                  placeholder="Cari ID DB, deskripsi..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 w-44 h-9 text-xs"
                />

                <Button variant="outline" size="sm" onClick={fetchBudgets} className="border-gray-300 text-gray-700 hover:bg-gray-50 h-9">
                  🔄 Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader className="bg-gray-50 border-b border-gray-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-gray-500 text-xs uppercase font-bold">ID DB</TableHead>
                  <TableHead className="text-gray-500 text-xs uppercase font-bold">Rincian Usulan (Unit | Lingkup | Akun | Deskripsi)</TableHead>
                  <TableHead className="text-gray-500 text-center text-xs uppercase font-bold">Vol</TableHead>
                  <TableHead className="text-gray-500 text-right text-xs uppercase font-bold">Tarif (Rp)</TableHead>
                  <TableHead className="text-gray-500 text-right text-xs uppercase font-bold">Total (Rp)</TableHead>
                  <TableHead className="text-gray-500 text-center text-xs uppercase font-bold">Evaluasi (Reff & AI)</TableHead>
                  <TableHead className="text-gray-500 text-center text-xs uppercase font-bold">Status Final</TableHead>
                  <TableHead className="text-gray-500 text-right text-xs uppercase font-bold">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">Memuat data...</TableCell>
                  </TableRow>
                ) : paginatedBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">Belum ada data usulan yang sesuai filter.</TableCell>
                  </TableRow>
                ) : (
                  paginatedBudgets.map((b) => {
                    const cleanDeskripsi = (b.deskripsi && b.deskripsi !== '\\N' ? b.deskripsi : '') || 
                                           (b.komponen_nama && b.komponen_nama !== '\\N' ? b.komponen_nama : '') || 
                                           (b.maksud_tujuan && b.maksud_tujuan !== '\\N' ? b.maksud_tujuan : '-');
                    const isHighConfidenceAi = b.ai_confidence && b.ai_confidence >= 0.75;
                    const isPendingAiApproval = isHighConfidenceAi && (b.kunci === 'N' || !b.custom_status);

                    return (
                      <TableRow 
                        key={b.id} 
                        className={`border-b border-gray-100 transition-colors ${
                          isPendingAiApproval 
                            ? 'bg-purple-50/40 hover:bg-purple-100/60 border-l-4 border-l-purple-500' 
                            : 'even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60'
                        }`}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-gray-600">{b.id_db || `-`}</TableCell>

                        <TableCell className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                🏢 {b.unitkerja_nama || '-'}
                              </span>
                              {b.lingkup && b.lingkup !== '\\N' && (
                                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                  {b.lingkup}
                                </span>
                              )}
                            </div>

                            <div className="font-mono text-xs font-semibold text-indigo-700 mt-0.5">
                              {b.akun}
                            </div>

                            <div className="font-semibold text-sm text-gray-900 leading-relaxed mt-0.5" title={cleanDeskripsi}>
                              {cleanDeskripsi}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-mono text-sm font-semibold text-gray-700">{b.vol || 1}</TableCell>
                        <TableCell className="text-right text-gray-700 font-mono text-sm font-semibold">
                          {new Intl.NumberFormat('id-ID').format(b.tarif || 0)}
                        </TableCell>
                        <TableCell className="text-right text-indigo-700 font-mono font-bold text-sm">
                          {new Intl.NumberFormat('id-ID').format(b.total || 0)}
                        </TableCell>

                        {/* STATUS REFF & AI MENCOLOK / HIGHLIGHT PADA AI KEYAKINAN TINGGI */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1.5 text-[11px]">
                            {b.kunci_by === 'RULE' ? (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold" title="Ditentukan oleh Master Aturan (Reff)">
                                Reff: {b.custom_status || 'Wajib Ada'}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">Reff: -</span>
                            )}

                            {/* REKOMENDASI AI HIGHLIGHT GRADIENT UNTUK KEYAKINAN TINGGI (≥75%) */}
                            {b.ai_confidence ? (
                              <div className="flex flex-col items-center gap-1">
                                <span 
                                  className={`px-2.5 py-1 rounded-xl font-extrabold flex items-center gap-1 shadow-sm transition-all ${
                                    isHighConfidenceAi
                                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white animate-pulse'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}
                                  title={b.ai_reason || 'Rekomendasi AI'}
                                >
                                  <span>🤖 AI: Wajib</span>
                                  <span>({Math.round(b.ai_confidence * 100)}%)</span>
                                </span>

                                {/* TOMBOL 1-KLIK SETUJUI AI */}
                                {isPendingAiApproval && (
                                  <button
                                    onClick={() => handleQuickStatusChange(b, 'Wajib')}
                                    className="text-[10px] font-black text-purple-900 bg-purple-200 hover:bg-purple-300 px-2 py-0.5 rounded-md border border-purple-400 transition-all shadow-sm flex items-center gap-0.5 hover:scale-105 active:scale-95"
                                    title="Klik 1-kali untuk menyetujui saran AI ini menjadi Status Final Wajib"
                                  >
                                    ⚡ Setujui AI
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        
                        {/* COMBO BOX AUTOCOMPLETE STATUS FINAL */}
                        <TableCell className="text-center">
                          <StatusAutocomplete 
                            value={b.custom_status || ''} 
                            kunci={b.kunci || 'N'} 
                            availableStatuses={availableStatusList}
                            onSelect={(newVal) => handleQuickStatusChange(b, newVal)} 
                          />
                        </TableCell>

                        {/* TOMBOL LIHAT DETAIL */}
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewDetailData(b)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 px-2.5 text-xs font-bold"
                          >
                            👁️ Lihat Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* CONTROLLER PAGINATION 100 - 250 - 500 */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="h-8 px-2 rounded-lg bg-white border border-gray-300 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value={100}>100 Per Halaman</option>
                  <option value={250}>250 Per Halaman</option>
                  <option value={500}>500 Per Halaman</option>
                  <option value="ALL">Semua ({filteredBudgets.length} Data)</option>
                </select>
                <span>
                  | Menampilkan {pageSize === 'ALL' ? filteredBudgets.length : Math.min(filteredBudgets.length, (currentPage - 1) * Number(pageSize) + 1)} - {pageSize === 'ALL' ? filteredBudgets.length : Math.min(filteredBudgets.length, currentPage * Number(pageSize))} dari {filteredBudgets.length} data
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

      {/* DIALOG VIEW DETAIL */}
      <Dialog open={!!viewDetailData} onOpenChange={(open) => !open && setViewDetailData(null)}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[650px] p-6">
          <DialogHeader className="border-b border-gray-100 pb-3">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              👁️ Detail Usulan Anggaran
              <Badge variant="outline" className="font-mono text-xs">{viewDetailData?.id_db}</Badge>
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs">
              Rincian data usulan anggaran (Tampilan Read-Only / Tidak dapat diubah dari modal ini).
            </DialogDescription>
          </DialogHeader>

          {viewDetailData && (
            <div className="space-y-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Unit Kerja</span>
                  <span className="font-bold text-gray-900">🏢 {viewDetailData.unitkerja_nama || '-'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Kode Akun</span>
                  <span className="font-mono font-bold text-indigo-700">{viewDetailData.akun || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <span className="text-xs font-semibold text-gray-500 block mb-1">Volume (Vol)</span>
                  <span className="font-mono font-bold text-gray-900 text-base">{viewDetailData.vol || 1}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 block mb-1">Tarif (Rp)</span>
                  <span className="font-mono font-bold text-gray-900 text-base">
                    Rp {new Intl.NumberFormat('id-ID').format(viewDetailData.tarif || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-indigo-700 block mb-1">Total (Rp)</span>
                  <span className="font-mono font-black text-indigo-700 text-base">
                    Rp {new Intl.NumberFormat('id-ID').format(viewDetailData.total || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-indigo-700 block mb-1">📌 Status Referensi (Reff / Master Rule)</span>
                  {viewDetailData.kunci_by === 'RULE' ? (
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                      🔒 {viewDetailData.custom_status || 'Wajib Ada'}
                    </Badge>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500">Tidak ada penguncian khusus di Master Aturan</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-700 block mb-1">🤖 Status Analisis AI</span>
                  {viewDetailData.ai_confidence ? (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                      {viewDetailData.kunci === 'Y' ? '🔒 Wajib' : '🔓 Bebas'} ({Math.round(viewDetailData.ai_confidence * 100)}%)
                    </Badge>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500">Belum dianalisis AI</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {viewDetailData.komponen_nama && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block mb-0.5">Nama Komponen</span>
                    <p className="font-semibold text-gray-800">{viewDetailData.komponen_nama}</p>
                  </div>
                )}

                {viewDetailData.lingkup && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block mb-0.5">Lingkup Kegiatan</span>
                    <p className="font-medium text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200/60 text-xs">
                      {viewDetailData.lingkup}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold text-gray-500 block mb-0.5">Deskripsi Usulan</span>
                  <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-200 leading-relaxed text-sm">
                    {viewDetailData.deskripsi || '-'}
                  </p>
                </div>

                {viewDetailData.maksud_tujuan && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block mb-0.5">Maksud & Tujuan</span>
                    <p className="text-gray-700 text-xs italic bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {viewDetailData.maksud_tujuan}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 block">Alasan / Pertimbangan AI</span>
                  <span className="text-xs font-bold text-purple-700">{viewDetailData.ai_reason || 'Diidentifikasi berdasarkan histori dan relevansi belanja.'}</span>
                </div>
                <Button variant="outline" onClick={() => setViewDetailData(null)}>Tutup</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
