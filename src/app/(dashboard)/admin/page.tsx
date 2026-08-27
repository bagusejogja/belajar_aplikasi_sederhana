"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Wallet, CheckCircle2, Clock, Shield, Building2, FileText, BarChart3 } from 'lucide-react';

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

export default function AdminDashboard() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State: 'summary' | 'data' | 'pivot'
  const [activeTab, setActiveTab] = useState<'summary'|'data'|'pivot'>('summary');
  const [groupBy, setGroupBy] = useState<string[]>(['custom_status']);

  // Filter State untuk Tab 2 (Tabel Data Detail) & Reaktivitas Card
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedAiFilter, setSelectedAiFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEvaluatingRules, setIsEvaluatingRules] = useState(false);

  const handleReEvaluateRules = async () => {
    setIsEvaluatingRules(true);
    try {
      const res = await fetch('/api/budgets/re-evaluate-rules', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(`Berhasil merevaluasi aturan! ${json.count} data usulan diperbarui sesuai Master Aturan.`);
        fetchBudgets();
      } else {
        alert('Gagal merevaluasi: ' + json.error);
      }
    } catch (e) {
      alert('Terjadi kesalahan.');
    } finally {
      setIsEvaluatingRules(false);
    }
  };

  const pivotFields = [
    { id: 'unitkerja_nama', label: 'Unit Kerja' },
    { id: 'kunci', label: 'Status Kunci (Y/N)' },
    { id: 'custom_status', label: 'Label Status' },
    { id: 'kunci_by', label: 'Sumber Kunci (AI/RULE)' },
    { id: 'akun', label: 'Kode Akun' }
  ];

  const toggleGroupBy = (field: string) => {
    if (groupBy.includes(field)) {
      setGroupBy(groupBy.filter(f => f !== field));
    } else {
      setGroupBy([...groupBy, field]);
    }
  };

  const unitOptions = useMemo(() => {
    const units = Array.from(new Set(budgets.map(b => b.unitkerja_nama).filter(Boolean))).sort();
    return units as string[];
  }, [budgets]);

  const availableStatusList = useMemo(() => {
    const statuses = Array.from(new Set(budgets.map(b => b.custom_status).filter(Boolean)));
    return statuses as string[];
  }, [budgets]);

  // Data Terfilter berdasar Unit Kerja, Status Filter, Filter AI & Search Term
  const filteredDetailBudgets = useMemo(() => {
    return budgets.filter(b => {
      // Filter Unit Kerja
      const matchUnit = selectedUnitFilter === 'ALL' || b.unitkerja_nama === selectedUnitFilter;
      if (!matchUnit) return false;

      // Filter Status
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
        if (!b.ai_confidence || b.kunci === 'Y' || (b.custom_status && b.custom_status.trim() !== '')) return false;
      } else if (selectedAiFilter === 'RULE_ONLY') {
        if (b.kunci_by !== 'RULE') return false;
      }

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (b.id_db || '').toLowerCase().includes(q) ||
        (b.deskripsi || '').toLowerCase().includes(q) ||
        (b.akun || '').toLowerCase().includes(q) ||
        (b.unitkerja_nama || '').toLowerCase().includes(q) ||
        (b.custom_status || '').toLowerCase().includes(q)
      );
    }).sort((a, b) => {
      const numA = parseInt(a.id_db) || 0;
      const numB = parseInt(b.id_db) || 0;
      return numA - numB;
    });
  }, [budgets, selectedUnitFilter, selectedStatusFilter, selectedAiFilter, searchTerm]);

  // Reset Halaman Pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUnitFilter, selectedStatusFilter, selectedAiFilter, searchTerm, pageSize]);

  // Data Terpaginasi (Slice berdasar Page)
  const paginatedBudgets = useMemo(() => {
    if (pageSize === 'ALL') return filteredDetailBudgets;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredDetailBudgets.slice(start, start + size);
  }, [filteredDetailBudgets, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'ALL' || filteredDetailBudgets.length === 0) return 1;
    return Math.ceil(filteredDetailBudgets.length / Number(pageSize));
  }, [filteredDetailBudgets, pageSize]);

  // Hitungan Reaktif untuk Top Cards (Berdasar Data Terfilter)
  const displayBudgets = filteredDetailBudgets;
  const totalUsulan = displayBudgets.length;
  const totalAnggaranSum = displayBudgets.reduce((acc, b) => acc + (Number(b.total) || 0), 0);
  
  const adaStatusItems = displayBudgets.filter(b => b.kunci === 'Y' || (b.custom_status && b.custom_status.trim() !== ''));
  const totalAdaStatusSum = adaStatusItems.reduce((acc, b) => acc + (Number(b.total) || 0), 0);

  const tanpaStatusItems = displayBudgets.filter(b => b.kunci !== 'Y' && (!b.custom_status || b.custom_status.trim() === ''));
  const totalTanpaStatusSum = tanpaStatusItems.reduce((acc, b) => acc + (Number(b.total) || 0), 0);

  const terkunciRule = displayBudgets.filter(b => b.kunci === 'Y' && b.kunci_by === 'RULE').length;
  const saranAi = displayBudgets.filter(b => b.kunci === 'Y' && b.kunci_by === 'AI').length;

  const groupedData = useMemo(() => {
    if (groupBy.length === 0) return { "Total Keseluruhan": { count: budgets.length, sum: budgets.reduce((acc, b) => acc + (b.total || 0), 0) } };
    
    const result: any = {};
    budgets.forEach(budget => {
      const keyParts = groupBy.map(f => {
        let val = budget[f];
        if (f === 'kunci' && val === 'Y') val = 'Terkunci (Y)';
        if (f === 'kunci' && val === 'N') val = 'Bebas (N)';
        return val || '(Kosong)';
      });
      const key = keyParts.join(' ➔ ');
      
      if (!result[key]) result[key] = { count: 0, sum: 0, keyParts };
      result[key].count += 1;
      result[key].sum += (budget.total || 0);
    });
    
    return Object.entries(result).sort((a: any, b: any) => b[1].sum - a[1].sum);
  }, [budgets, groupBy]);

  // Summary per Unit Kerja computation
  const unitSummaryData = useMemo(() => {
    const map = new Map<string, {
      unit: string;
      totalCount: number;
      totalAnggaran: number;
      adaStatusCount: number;
      adaStatusAnggaran: number;
      tanpaStatusCount: number;
      tanpaStatusAnggaran: number;
    }>();

    budgets.forEach(b => {
      const unit = b.unitkerja_nama || '(Belum Diisi)';
      if (!map.has(unit)) {
        map.set(unit, {
          unit,
          totalCount: 0,
          totalAnggaran: 0,
          adaStatusCount: 0,
          adaStatusAnggaran: 0,
          tanpaStatusCount: 0,
          tanpaStatusAnggaran: 0,
        });
      }

      const item = map.get(unit)!;
      const nominal = Number(b.total) || 0;
      item.totalCount += 1;
      item.totalAnggaran += nominal;

      const hasStatus = b.kunci === 'Y' || (b.custom_status && b.custom_status.trim() !== '');
      if (hasStatus) {
        item.adaStatusCount += 1;
        item.adaStatusAnggaran += nominal;
      } else {
        item.tanpaStatusCount += 1;
        item.tanpaStatusAnggaran += nominal;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAnggaran - a.totalAnggaran);
  }, [budgets]);

  const fetchBudgets = async () => {
    setLoading(true);
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

  const handleBulkApprove = async () => {
    try {
      const res = await fetch('/api/budgets/bulk-approve', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Berhasil menyetujui semua saran AI.');
        fetchBudgets();
      } else {
        alert('Gagal: ' + json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan.');
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
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <span className="text-lg">🛡️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Dashboard Admin Review Anggaran
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {filteredDetailBudgets.length} Usulan Item
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Saran AI keyakinan tinggi disorot mencolok dengan aksi Setujui AI 1-Klik.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <button 
            onClick={handleReEvaluateRules}
            disabled={isEvaluatingRules}
            className="h-9 px-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <span>{isEvaluatingRules ? 'Memproses...' : '⚡ Re-Evaluasi Rules'}</span>
          </button>

          <button 
            onClick={() => {
              const liveUrl = `${window.location.origin}/api/budgets/export-excel`;
              navigator.clipboard.writeText(liveUrl);
              alert(`URL Live Power Query Excel disalin:\n${liveUrl}`);
            }}
            className="h-9 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>🔗 Power Query</span>
          </button>

          <button 
            onClick={() => exportToExcelCSV(filteredDetailBudgets, 'Data_Usulan_Anggaran')}
            className="h-9 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>📥 Export Excel</span>
          </button>

          <Link href="/review-anggaran/rules">
            <button className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95">
              <span>Master Aturan</span>
            </button>
          </Link>

          <button 
            onClick={handleBulkApprove}
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span>Bulk Approve AI</span>
          </button>
        </div>
      </div>

        {/* Global Summary Cards (REAKTIF SESUAI FILTER FILTERED DATA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Anggaran */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">TOTAL ANGGARAN</span>
                <div className="text-xl font-black text-gray-900 font-mono tracking-tight">
                  Rp {new Intl.NumberFormat('id-ID').format(totalAnggaranSum)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100">
                <Wallet size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
              <span>{totalUsulan} Usulan Item</span>
              {selectedUnitFilter !== 'ALL' ? (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold truncate max-w-[100px]">{selectedUnitFilter}</span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-mono font-bold">100%</span>
              )}
            </div>
          </div>
          
          {/* Ada Status (Kunci) */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">ADA STATUS (KUNCI)</span>
                <div className="text-xl font-black text-emerald-700 font-mono tracking-tight">
                  Rp {new Intl.NumberFormat('id-ID').format(totalAdaStatusSum)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
              <span>{adaStatusItems.length} Item Terkunci</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">
                {totalAnggaranSum > 0 ? Math.round((totalAdaStatusSum / totalAnggaranSum) * 100) : 0}%
              </span>
            </div>
          </div>
          
          {/* Tanpa Status (Bebas) */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">TANPA STATUS (BEBAS)</span>
                <div className="text-xl font-black text-amber-700 font-mono tracking-tight">
                  Rp {new Intl.NumberFormat('id-ID').format(totalTanpaStatusSum)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
              <span>{tanpaStatusItems.length} Item Bebas</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-mono font-bold">
                {totalAnggaranSum > 0 ? Math.round((totalTanpaStatusSum / totalAnggaranSum) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Sumber Kunci */}
          <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">SUMBER KUNCI</span>
                <div className="text-sm font-black text-gray-900 flex items-center gap-2 mt-1">
                  <span className="text-indigo-700 font-mono">RULE: {terkunciRule}</span>
                  <span className="text-purple-700 font-mono">AI: {saranAi}</span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Shield size={18} />
              </div>
            </div>
            <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-indigo-100/60 pt-2">
              <span>Evaluasi Otomatis</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Auto</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1.5 rounded-2xl border border-gray-200 w-max mb-4">
          <button 
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'summary' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('summary')}
          >
            <Building2 size={14} /> Summary Unit Kerja
          </button>
          <button 
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'data' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('data')}
          >
            <FileText size={14} /> Tabel Data Detail ({filteredDetailBudgets.length})
          </button>
          <button 
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${activeTab === 'pivot' ? 'bg-white text-gray-900 shadow-xs font-black' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('pivot')}
          >
            <BarChart3 size={14} /> Analisis Pivot Multi-Dimensi
          </button>
        </div>

        {/* TAB 1: SUMMARY PER UNIT KERJA */}
        {activeTab === 'summary' && (
          <Card className="bg-white border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-4 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-gray-900">Ringkasan Anggaran Per Unit Kerja</CardTitle>
                <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Perbandingan total usulan anggaran, anggaran berkategori Kunci (Ada Status), dan Bebas (Tanpa Status).
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBudgets} className="h-8 text-xs font-bold border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl">
                🔄 Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-gray-500 text-xs uppercase font-bold">Unit Kerja</TableHead>
                    <TableHead className="text-gray-500 text-center text-xs uppercase font-bold">Total Item</TableHead>
                    <TableHead className="text-gray-500 text-right text-xs uppercase font-bold">Total Anggaran (Rp)</TableHead>
                    <TableHead className="text-gray-500 text-right text-xs uppercase font-bold text-emerald-700">Ada Status / Terkunci (Rp)</TableHead>
                    <TableHead className="text-gray-500 text-right text-xs uppercase font-bold text-amber-700">Tanpa Status / Bebas (Rp)</TableHead>
                    <TableHead className="text-gray-500 text-center text-xs uppercase font-bold">% Terkunci</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">Memuat data...</TableCell>
                    </TableRow>
                  ) : unitSummaryData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">Belum ada data usulan.</TableCell>
                    </TableRow>
                  ) : (
                    unitSummaryData.map((u, idx) => {
                      const pct = u.totalAnggaran > 0 ? Math.round((u.adaStatusAnggaran / u.totalAnggaran) * 100) : 0;
                      return (
                        <TableRow key={u.unit} className="border-b border-gray-100 even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 transition-colors">
                          <TableCell className="font-bold text-sm text-gray-900 py-3.5 px-4">{u.unit}</TableCell>
                          <TableCell className="text-center font-mono text-sm font-semibold text-gray-800">{u.totalCount}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-gray-900">
                            {new Intl.NumberFormat('id-ID').format(u.totalAnggaran)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 bg-emerald-50/40">
                            {new Intl.NumberFormat('id-ID').format(u.adaStatusAnggaran)}
                            <div className="text-xs text-emerald-800 font-semibold">{u.adaStatusCount} Item</div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm text-amber-600 bg-amber-50/40">
                            {new Intl.NumberFormat('id-ID').format(u.tanpaStatusAnggaran)}
                            <div className="text-xs text-amber-800 font-semibold">{u.tanpaStatusCount} Item</div>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            <Badge className={`text-xs font-bold px-2.5 py-0.5 ${pct > 50 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              {pct}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: TABEL DATA DETAIL + PAGINATION 100-250-500 */}
        {activeTab === 'data' && (
          <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-xl text-gray-900">Usulan Anggaran Detail ({filteredDetailBudgets.length} Data)</CardTitle>
                <CardDescription className="text-gray-500">
                  Filter Keyakinan AI dan tombol ⚡ Setujui AI 1-Klik mempermudah validasi manual Anda.
                </CardDescription>
              </div>

              {/* AUTOCOMPLETE FILTER UNIT KERJA, FILTER KEYAKINAN AI & FILTER STATUS */}
              <div className="flex flex-wrap items-center gap-2">
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
                  placeholder="Cari ID DB, akun, deskripsi..." 
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">Memuat data...</TableCell>
                  </TableRow>
                ) : paginatedBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">Belum ada data usulan yang sesuai filter.</TableCell>
                  </TableRow>
                ) : (
                  paginatedBudgets.map((b, idx) => {
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
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* PAGINATION FOOTER */}
            {filteredDetailBudgets.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
                {/* Left: Info */}
                <div className="flex items-center gap-2">
                  <span>
                    Menampilkan <strong className="text-gray-900">{pageSize === 'ALL' ? 1 : (currentPage - 1) * Number(pageSize) + 1}</strong> - <strong className="text-gray-900">{pageSize === 'ALL' ? filteredDetailBudgets.length : Math.min(currentPage * Number(pageSize), filteredDetailBudgets.length)}</strong> dari <strong className="text-gray-900">{filteredDetailBudgets.length}</strong> data
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
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value="ALL">Semua</option>
                  </select>
                </div>

                {/* Right: Page Navigation */}
                {pageSize !== 'ALL' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                      title="Halaman Pertama"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                      title="Sebelumnya"
                    >
                      ‹ Prev
                    </button>
                    
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
                      Hal {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                      title="Selanjutnya"
                    >
                      Next ›
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                      title="Halaman Terakhir"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* TAB 3: ANALISIS PIVOT */}
        {activeTab === 'pivot' && (
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Analisis Pengelompokan Data (Pivot)</CardTitle>
              <CardDescription className="text-gray-500">
                Pilih kolom di bawah ini untuk mengelompokkan data dan melihat total anggarannya.
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-4">
                {pivotFields.map(field => {
                  const isActive = groupBy.includes(field.id);
                  return (
                    <Badge 
                      key={field.id}
                      onClick={() => toggleGroupBy(field.id)}
                      className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${isActive ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'}`}
                    >
                      {field.label} {isActive && '✕'}
                    </Badge>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50 border-b border-gray-200">
                    <TableRow>
                      <TableHead className="text-gray-500">Grup: {groupBy.map(g => pivotFields.find(p=>p.id===g)?.label).join(' ➔ ') || 'Semua Data'}</TableHead>
                      <TableHead className="text-gray-500 text-center">Jumlah Usulan</TableHead>
                      <TableHead className="text-gray-500 text-right">Total Anggaran (Rp)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupBy.length === 0 ? (
                      <TableRow className="border-b border-gray-100">
                        <TableCell className="font-bold text-gray-900">Total Keseluruhan</TableCell>
                        <TableCell className="text-center text-gray-700">{(groupedData as any)["Total Keseluruhan"]?.count || 0}</TableCell>
                        <TableCell className="text-right text-indigo-700 font-bold font-mono">
                          {new Intl.NumberFormat('id-ID').format((groupedData as any)["Total Keseluruhan"]?.sum || 0)}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (groupedData as any[]).map(([key, data]) => (
                        <TableRow key={key} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell className="font-bold text-gray-800">{key}</TableCell>
                          <TableCell className="text-center text-gray-700">{data.count} item</TableCell>
                          <TableCell className="text-right text-indigo-700 font-bold font-mono">
                            {new Intl.NumberFormat('id-ID').format(data.sum)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
}
