"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import * as XLSX from 'xlsx';

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
  const [pageSize, setPageSize] = useState<number | 'ALL'>(100);
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
    if (groupBy.length === 0) return { "Total Keseluruhan": { count: filteredDetailBudgets.length, sum: filteredDetailBudgets.reduce((acc, b) => acc + (b.total || 0), 0) } };
    
    const result: any = {};
    filteredDetailBudgets.forEach(budget => {
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
  }, [filteredDetailBudgets, groupBy]);

  // Summary per Unit Kerja computation (REAKTIF SESUAI FILTER DATA DETAIL)
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

    filteredDetailBudgets.forEach(b => {
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
  }, [filteredDetailBudgets]);

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

  const exportToExcelByTab = (tab: 'summary' | 'data' | 'pivot') => {
    const workbook = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().slice(0, 10);
    
    if (tab === 'summary') {
      if (!unitSummaryData || unitSummaryData.length === 0) {
        alert('Tidak ada data summary unit untuk diekspor.');
        return;
      }
      const dataToExport = unitSummaryData.map((item, idx) => {
        const pct = item.totalCount > 0 ? ((item.adaStatusCount / item.totalCount) * 100).toFixed(1) + '%' : '0%';
        return {
          'No': idx + 1,
          'Unit Kerja': item.unit,
          'Total Usulan (Item)': item.totalCount,
          'Total Nominal (Rp)': item.totalAnggaran,
          'Usulan Terkunci (Item)': item.adaStatusCount,
          'Pagu Terkunci (Rp)': item.adaStatusAnggaran,
          'Usulan Bebas (Item)': item.tanpaStatusCount,
          'Pagu Bebas (Rp)': item.tanpaStatusAnggaran,
          '% Keterkuncian': pct
        };
      });
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, ws, 'Summary Unit');
      XLSX.writeFile(workbook, `Rekap_Summary_Unit_Kerja_${dateStr}.xlsx`);

    } else if (tab === 'data') {
      if (!filteredDetailBudgets || filteredDetailBudgets.length === 0) {
        alert('Tidak ada data detail untuk diekspor.');
        return;
      }
      const dataToExport = filteredDetailBudgets.map((b, idx) => ({
        'No': idx + 1,
        'ID DB': b.id_db || '',
        'Unit Kerja': b.unitkerja_nama || '',
        'Kode Akun': b.akun || '',
        'Nama Komponen': b.komponen_nama || '',
        'Deskripsi Usulan': b.deskripsi || '',
        'Lingkup': b.lingkup || '',
        'Maksud Tujuan': b.maksud_tujuan || '',
        'Vol': b.vol || 1,
        'Tarif (Rp)': b.tarif || 0,
        'Total Nominal (Rp)': b.total || 0,
        'Status Kunci': b.kunci || 'N',
        'Sumber Kunci': b.kunci_by || '-',
        'Label Status': b.custom_status || ''
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, ws, 'Detail Usulan');
      XLSX.writeFile(workbook, `Detail_Usulan_Anggaran_${dateStr}.xlsx`);

    } else if (tab === 'pivot') {
      const isArray = Array.isArray(groupedData);
      const dataToExport = isArray
        ? (groupedData as [string, any][]).map(([key, val], idx) => ({
            'No': idx + 1,
            'Dimensi Grouping': key,
            'Jumlah Usulan (Item)': val.count,
            'Total Nominal (Rp)': val.sum
          }))
        : [{
            'No': 1,
            'Dimensi Grouping': 'Total Keseluruhan',
            'Jumlah Usulan (Item)': (groupedData as any)["Total Keseluruhan"]?.count || 0,
            'Total Nominal (Rp)': (groupedData as any)["Total Keseluruhan"]?.sum || 0
          }];

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, ws, 'Pivot Analysis');
      XLSX.writeFile(workbook, `Pivot_Analysis_Anggaran_${dateStr}.xlsx`);
    }
  };

  const generateFormattedPDFReport = (tab: 'summary' | 'data' | 'pivot') => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk membuka laporan PDF.');
      return;
    }

    const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
    const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let tabTitle = 'SUMMARY REKAPITULASI PER UNIT KERJA';
    if (tab === 'data') tabTitle = 'RINCIAN DETAIL USULAN ANGGARAN';
    if (tab === 'pivot') tabTitle = 'ANALISIS MATRIX PIVOT UNTUK REVIEW ANGGARAN';

    let tableHeaderHTML = '';
    let tableRowsHTML = '';
    let totalSummaryRowHTML = '';

    if (tab === 'summary') {
      tableHeaderHTML = `
        <tr>
          <th style="width: 40px; text-align: center;">No</th>
          <th>Unit Kerja</th>
          <th style="text-align: right;">Total Usulan</th>
          <th style="text-align: right;">Total Pagu (Rp)</th>
          <th style="text-align: right;">Pagu Terkunci (Rp)</th>
          <th style="text-align: right;">Pagu Bebas (Rp)</th>
          <th style="text-align: center;">% Coverage</th>
        </tr>
      `;
      tableRowsHTML = unitSummaryData.map((item, idx) => {
        const pct = item.totalCount > 0 ? ((item.adaStatusCount / item.totalCount) * 100).toFixed(1) + '%' : '0%';
        return `
          <tr>
            <td style="text-align: center; color: #64748b;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a;">${item.unit}</td>
            <td style="text-align: right; font-family: monospace;">${formatRp(item.totalCount)} item</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700;">Rp ${formatRp(item.totalAnggaran)}</td>
            <td style="text-align: right; font-family: monospace; color: #047857; font-weight: 700;">Rp ${formatRp(item.adaStatusAnggaran)}</td>
            <td style="text-align: right; font-family: monospace; color: #64748b;">Rp ${formatRp(item.tanpaStatusAnggaran)}</td>
            <td style="text-align: center;"><span class="badge badge-emerald">${pct}</span></td>
          </tr>
        `;
      }).join('');

      totalSummaryRowHTML = `
        <tr class="total-row">
          <td colspan="2" style="font-weight: 800;">TOTAL KESELURUHAN</td>
          <td style="text-align: right; font-family: monospace;">${formatRp(totalUsulan)} item</td>
          <td style="text-align: right; font-family: monospace;">Rp ${formatRp(totalAnggaranSum)}</td>
          <td style="text-align: right; font-family: monospace; color: #047857;">Rp ${formatRp(totalAdaStatusSum)}</td>
          <td style="text-align: right; font-family: monospace;">Rp ${formatRp(totalTanpaStatusSum)}</td>
          <td style="text-align: center;">${totalUsulan > 0 ? ((adaStatusItems.length / totalUsulan) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
      `;
    } else if (tab === 'data') {
      tableHeaderHTML = `
        <tr>
          <th style="width: 35px; text-align: center;">No</th>
          <th>Unit Kerja</th>
          <th style="width: 80px;">Kode Akun</th>
          <th>Deskripsi Usulan / Kegiatan</th>
          <th style="text-align: right; width: 110px;">Total (Rp)</th>
          <th style="text-align: center; width: 90px;">Status</th>
          <th style="text-align: center; width: 70px;">Sumber</th>
        </tr>
      `;
      tableRowsHTML = filteredDetailBudgets.slice(0, 500).map((b, idx) => {
        const isKunci = b.kunci === 'Y' || (b.custom_status && b.custom_status.trim() !== '');
        const badgeClass = isKunci ? 'badge-emerald' : 'badge-gray';
        const label = b.custom_status || (b.kunci === 'Y' ? 'Wajib Ada' : 'Bebas (N)');
        return `
          <tr>
            <td style="text-align: center; color: #64748b;">${idx + 1}</td>
            <td style="font-weight: 600; color: #1e293b;">${b.unitkerja_nama || '-'}</td>
            <td style="font-family: monospace; font-weight: 700; color: #4338ca;">${b.akun || '-'}</td>
            <td style="color: #334155;">${b.deskripsi || '-'}</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700;">Rp ${formatRp(Number(b.total) || 0)}</td>
            <td style="text-align: center;"><span class="badge ${badgeClass}">${label}</span></td>
            <td style="text-align: center; font-size: 10px; font-weight: 700; color: #64748b;">${b.kunci_by || '-'}</td>
          </tr>
        `;
      }).join('');

      totalSummaryRowHTML = `
        <tr class="total-row">
          <td colspan="4" style="font-weight: 800;">TOTAL DATA (SAMPAI BARIS KE-${Math.min(filteredDetailBudgets.length, 500)})</td>
          <td style="text-align: right; font-family: monospace;">Rp ${formatRp(totalAnggaranSum)}</td>
          <td colspan="2" style="text-align: center; font-weight: 700;">${totalUsulan} Item Terfilter</td>
        </tr>
      `;
    } else { // pivot
      tableHeaderHTML = `
        <tr>
          <th style="width: 40px; text-align: center;">No</th>
          <th>Dimensi Kategori / Grouping</th>
          <th style="text-align: right;">Jumlah Item Usulan</th>
          <th style="text-align: right;">Total Nominal Anggaran (Rp)</th>
          <th style="text-align: center;">% Share Nominal</th>
        </tr>
      `;
      const pivotEntries = Array.isArray(groupedData) 
        ? groupedData 
        : Object.entries(groupedData);

      tableRowsHTML = pivotEntries.map(([key, val]: any, idx: number) => {
        const itemVal = val?.sum !== undefined ? val : { count: val?.count || 0, sum: val?.sum || 0 };
        const sharePct = totalAnggaranSum > 0 ? ((itemVal.sum / totalAnggaranSum) * 100).toFixed(1) + '%' : '0%';
        return `
          <tr>
            <td style="text-align: center; color: #64748b;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a;">${key}</td>
            <td style="text-align: right; font-family: monospace;">${formatRp(itemVal.count)} item</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700; color: #4338ca;">Rp ${formatRp(itemVal.sum)}</td>
            <td style="text-align: center;"><span class="badge badge-indigo">${sharePct}</span></td>
          </tr>
        `;
      }).join('');

      totalSummaryRowHTML = `
        <tr class="total-row">
          <td colspan="2" style="font-weight: 800;">TOTAL KESELURUHAN PIVOT</td>
          <td style="text-align: right; font-family: monospace;">${formatRp(totalUsulan)} item</td>
          <td style="text-align: right; font-family: monospace; color: #4338ca;">Rp ${formatRp(totalAnggaranSum)}</td>
          <td style="text-align: center;">100%</td>
        </tr>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan_Review_Anggaran_${tab}_${new Date().toISOString().slice(0,10)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 15mm;
          }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #ffffff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .header-bar {
            background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
            color: #ffffff;
            padding: 20px 24px;
            border-radius: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header-title h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #ffffff;
          }
          .header-title p {
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #a5b4fc;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header-badge {
            background: rgba(255,255,255,0.12);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            color: #e0e7ff;
            text-align: right;
          }
          .cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 20px;
          }
          .card {
            border-radius: 14px;
            padding: 14px 16px;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
          }
          .card-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #64748b;
            margin-bottom: 6px;
          }
          .card-value {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            font-family: monospace;
          }
          .card-sub {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            margin-top: 2px;
          }
          .card-emerald { background: #ecfdf5; border-color: #a7f3d0; }
          .card-emerald .card-title { color: #047857; }
          .card-emerald .card-value { color: #065f46; }
          .card-indigo { background: #eef2ff; border-color: #c7d2fe; }
          .card-indigo .card-title { color: #4338ca; }
          .card-indigo .card-value { color: #3730a3; }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 10px;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            font-size: 11px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            padding: 10px 12px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          td {
            padding: 8px 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          tr:nth-child(even) td { background: #f8fafc; }
          tr.total-row td {
            background: #e0e7ff !important;
            color: #1e1b4b;
            font-weight: 800;
            border-top: 2px solid #6366f1;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 800;
          }
          .badge-emerald { background: #d1fae5; color: #065f46; }
          .badge-indigo { background: #e0e7ff; color: #3730a3; }
          .badge-gray { background: #f1f5f9; color: #475569; }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <div class="header-title">
            <p>UNIVERSITAS GADJAH MADA — DIREKTORAT KEUANGAN</p>
            <h1>${tabTitle}</h1>
          </div>
          <div class="header-badge">
            <div>Unit Filter: ${selectedUnitFilter === 'ALL' ? 'Semua Unit Kerja' : selectedUnitFilter}</div>
            <div style="margin-top: 2px; opacity: 0.8;">Tanggal: ${nowStr}</div>
          </div>
        </div>

        <div class="cards-grid">
          <div class="card">
            <div class="card-title">TOTAL USULAN ANGGARAN</div>
            <div class="card-value">${formatRp(totalUsulan)} Item</div>
            <div class="card-sub">Rp ${formatRp(totalAnggaranSum)}</div>
          </div>
          <div class="card card-emerald">
            <div class="card-title">PAGU TERKUNCI (WAJIB)</div>
            <div class="card-value">${formatRp(adaStatusItems.length)} Item</div>
            <div class="card-sub">Rp ${formatRp(totalAdaStatusSum)}</div>
          </div>
          <div class="card">
            <div class="card-title">PAGU BEBAS (N)</div>
            <div class="card-value">${formatRp(tanpaStatusItems.length)} Item</div>
            <div class="card-sub">Rp ${formatRp(totalTanpaStatusSum)}</div>
          </div>
          <div class="card card-indigo">
            <div class="card-title">COVERAGE PENGUNCIAN</div>
            <div class="card-value">${totalUsulan > 0 ? ((adaStatusItems.length / totalUsulan) * 100).toFixed(1) + '%' : '0%'}</div>
            <div class="card-sub">${terkunciRule} Rule | ${saranAi} AI</div>
          </div>
        </div>

        <table>
          <thead>
            ${tableHeaderHTML}
          </thead>
          <tbody>
            ${tableRowsHTML}
            ${totalSummaryRowHTML}
          </tbody>
        </table>

        <div class="footer">
          <div>Dokumen Resmi Penelaahan Budget Review Engine & AI — Universitas Gadjah Mada</div>
          <div>Halaman 1 dari 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      <div className="w-full space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link href="/review-anggaran">
              <Button variant="ghost" className="text-gray-500 hover:text-gray-900 px-0 w-fit">&larr; Kembali ke Overview</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900">Dashboard Admin Review</h1>
              <p className="text-gray-500 font-medium">Saran AI keyakinan tinggi disorot mencolok dengan tombol ⚡ Setujui AI 1-Klik.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50 font-bold"
              onClick={handleReEvaluateRules}
              disabled={isEvaluatingRules}
            >
              {isEvaluatingRules ? 'Memproses Rule...' : '⚡ Re-Evaluasi Rules'}
            </Button>
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
              onClick={() => exportToExcelByTab(activeTab)}
            >
              📥 Export Excel ({activeTab === 'summary' ? 'Summary' : activeTab === 'data' ? 'Detail' : 'Pivot'})
            </Button>
            <Button 
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
              onClick={() => generateFormattedPDFReport(activeTab)}
            >
              📄 Export PDF Report
            </Button>
            <Button 
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold"
              onClick={() => {
                const liveUrl = `${window.location.origin}/api/budgets/export-excel`;
                navigator.clipboard.writeText(liveUrl);
                alert(`URL Live Power Query Excel disalin:\n${liveUrl}\n\nPetunjuk di Excel:\nBuka Excel -> Data -> From Web / Dari Web -> Paste URL ini -> Refresh Kapan Saja!`);
              }}
            >
              🔗 Power Query
            </Button>
            <Link href="/review-anggaran/rules">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-bold">
                Kelola Master Aturan
              </Button>
            </Link>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
              onClick={handleBulkApprove}
            >
              Bulk Approve AI
            </Button>
          </div>
        </header>

        {/* Global Summary Cards (REAKTIF SESUAI FILTER FILTERED DATA) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Anggaran</CardTitle>
                {selectedUnitFilter !== 'ALL' && <Badge variant="secondary" className="text-[10px]">{selectedUnitFilter}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-gray-900 font-mono">
                Rp {new Intl.NumberFormat('id-ID').format(totalAnggaranSum)}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">{totalUsulan} Usulan Item</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ada Status (Kunci)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                Rp {new Intl.NumberFormat('id-ID').format(totalAdaStatusSum)}
              </div>
              <p className="text-xs text-emerald-700 mt-1 font-medium">
                {adaStatusItems.length} Item ({totalAnggaranSum > 0 ? Math.round((totalAdaStatusSum / totalAnggaranSum) * 100) : 0}%)
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-amber-600 uppercase tracking-wider">Tanpa Status (Bebas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600 font-mono">
                Rp {new Intl.NumberFormat('id-ID').format(totalTanpaStatusSum)}
              </div>
              <p className="text-xs text-amber-700 mt-1 font-medium">
                {tanpaStatusItems.length} Item ({totalAnggaranSum > 0 ? Math.round((totalTanpaStatusSum / totalAnggaranSum) * 100) : 0}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Sumber Kunci (Rule vs AI)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm font-bold text-gray-800">
                <span className="text-indigo-700">RULE: {terkunciRule}</span>
                <span className="text-purple-700">AI: {saranAi}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-medium">Otomatis Dievaluasi</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-max mb-6 border border-gray-200">
          <button 
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'summary' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'}`}
            onClick={() => setActiveTab('summary')}
          >
            🏢 Summary Per Unit Kerja
          </button>
          <button 
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'data' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'}`}
            onClick={() => setActiveTab('data')}
          >
            📋 Tabel Data Detail ({filteredDetailBudgets.length})
          </button>
          <button 
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'pivot' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'}`}
            onClick={() => setActiveTab('pivot')}
          >
            📊 Analisis Pivot Multi-Dimensi
          </button>
        </div>

        {/* TAB 1: SUMMARY PER UNIT KERJA */}
        {activeTab === 'summary' && (
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Ringkasan Anggaran Per Unit Kerja</CardTitle>
                <CardDescription className="text-gray-500">
                  Perbandingan total usulan anggaran, anggaran yang berkategori Kunci (Ada Status), dan Bebas (Tanpa Status).
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToExcelByTab('summary')} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold">
                  📥 Excel Summary
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateFormattedPDFReport('summary')} className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold">
                  📄 PDF Laporan
                </Button>
                <Button variant="outline" size="sm" onClick={fetchBudgets} className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs">
                  🔄 Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-gray-50 border-b border-gray-200">
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

                <Button variant="outline" size="sm" onClick={() => exportToExcelByTab('data')} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold h-9">
                  📥 Excel Detail
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateFormattedPDFReport('data')} className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold h-9">
                  📄 PDF Laporan
                </Button>
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
                  <option value="ALL">Semua ({filteredDetailBudgets.length} Data)</option>
                </select>
                <span>
                  | Menampilkan {pageSize === 'ALL' ? filteredDetailBudgets.length : Math.min(filteredDetailBudgets.length, (currentPage - 1) * Number(pageSize) + 1)} - {pageSize === 'ALL' ? filteredDetailBudgets.length : Math.min(filteredDetailBudgets.length, currentPage * Number(pageSize))} dari {filteredDetailBudgets.length} data
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
        )}

        {/* TAB 3: ANALISIS PIVOT */}
        {activeTab === 'pivot' && (
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
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
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToExcelByTab('pivot')} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold">
                  📥 Excel Pivot
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateFormattedPDFReport('pivot')} className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold">
                  📄 PDF Laporan
                </Button>
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
    </div>
  );
}
