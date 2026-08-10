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
import * as XLSX from 'xlsx';

// Autocomplete Filter Unit Kerja (dengan Navigasi Keyboard ↑ ↓ + Enter)
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
        className="h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-sm flex items-center justify-between gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[200px]"
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
                  highlightedIndex === 0 ? 'bg-indigo-600 text-white font-bold' : selectedUnit === 'ALL' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <span>🏢 Semua Unit Kerja ({units.length})</span>
                {selectedUnit === 'ALL' && <span className={highlightedIndex === 0 ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>}
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
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors flex items-center justify-between ${
                      isHighlighted ? 'bg-indigo-600 text-white font-bold' : isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span className="truncate">{u}</span>
                    {isSelected && <span className={isHighlighted ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>}
                  </div>
                );
              })}
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

  const handleExportExcel = () => {
    if (!filteredBudgets || filteredBudgets.length === 0) {
      alert('Tidak ada data usulan untuk diekspor.');
      return;
    }

    const exportData = filteredBudgets.map((b, idx) => ({
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Usulan Unit Kerja');
    XLSX.writeFile(workbook, `Usulan_Anggaran_Unit_Kerja_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const generateFormattedPDFReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Harap izinkan popup browser untuk membuka laporan PDF.');
      return;
    }

    const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
    const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const totalUsulan = filteredBudgets.length;
    const totalAnggaranSum = filteredBudgets.reduce((acc, b) => acc + (Number(b.total) || 0), 0);
    const adaStatusItems = filteredBudgets.filter(b => b.kunci === 'Y' || (b.custom_status && b.custom_status.trim() !== ''));
    const totalAdaStatusSum = adaStatusItems.reduce((acc, b) => acc + (Number(b.total) || 0), 0);
    const tanpaStatusItems = filteredBudgets.filter(b => b.kunci !== 'Y' && (!b.custom_status || b.custom_status.trim() === ''));
    const totalTanpaStatusSum = tanpaStatusItems.reduce((acc, b) => acc + (Number(b.total) || 0), 0);

    const tableRowsHTML = filteredBudgets.slice(0, 500).map((b, idx) => {
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan_Usulan_Anggaran_Unit_Kerja_${new Date().toISOString().slice(0,10)}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm 15mm; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .header-bar { background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); color: #ffffff; padding: 20px 24px; border-radius: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .header-title h1 { margin: 0; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; }
          .header-title p { margin: 4px 0 0 0; font-size: 11px; color: #a5b4fc; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          .header-badge { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #e0e7ff; text-align: right; }
          .cards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
          .card { border-radius: 14px; padding: 14px 16px; border: 1px solid #e2e8f0; background: #f8fafc; }
          .card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 6px; }
          .card-value { font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace; }
          .card-sub { font-size: 11px; font-weight: 700; color: #475569; margin-top: 2px; }
          .card-emerald { background: #ecfdf5; border-color: #a7f3d0; }
          .card-emerald .card-title { color: #047857; }
          .card-emerald .card-value { color: #065f46; }
          .card-indigo { background: #eef2ff; border-color: #c7d2fe; }
          .card-indigo .card-title { color: #4338ca; }
          .card-indigo .card-value { color: #3730a3; }
          table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 10px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; font-size: 11px; }
          th { background: #0f172a; color: #ffffff; padding: 10px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
          tr:nth-child(even) td { background: #f8fafc; }
          tr.total-row td { background: #e0e7ff !important; color: #1e1b4b; font-weight: 800; border-top: 2px solid #6366f1; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; }
          .badge-emerald { background: #d1fae5; color: #065f46; }
          .badge-gray { background: #f1f5f9; color: #475569; }
          .footer { margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <div class="header-title">
            <p>UNIVERSITAS GADJAH MADA — PORTAL USULAN UNIT KERJA</p>
            <h1>LAPORAN DETAIL USULAN ANGGARAN</h1>
          </div>
          <div class="header-badge">
            <div>Unit: ${selectedUnitFilter === 'ALL' ? 'Semua Unit Kerja' : selectedUnitFilter}</div>
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
            <div class="card-sub">Hasil Penelaahan AI & Rule</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">No</th>
              <th>Unit Kerja</th>
              <th style="width: 80px;">Kode Akun</th>
              <th>Deskripsi Usulan / Kegiatan</th>
              <th style="text-align: right; width: 110px;">Total (Rp)</th>
              <th style="text-align: center; width: 90px;">Status</th>
              <th style="text-align: center; width: 70px;">Sumber</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
            <tr class="total-row">
              <td colspan="4" style="font-weight: 800;">TOTAL DATA (SAMPAI BARIS KE-${Math.min(filteredBudgets.length, 500)})</td>
              <td style="text-align: right; font-family: monospace;">Rp ${formatRp(totalAnggaranSum)}</td>
              <td colspan="2" style="text-align: center; font-weight: 700;">${totalUsulan} Item Terfilter</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>Dokumen Penelaahan Budget Review Engine — Universitas Gadjah Mada</div>
          <div>Halaman 1 dari 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
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
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
              onClick={handleExportExcel}
            >
              📥 Export Excel (.xlsx)
            </Button>
            <Button 
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 font-bold"
              onClick={generateFormattedPDFReport}
            >
              📄 Export PDF Report
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
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
