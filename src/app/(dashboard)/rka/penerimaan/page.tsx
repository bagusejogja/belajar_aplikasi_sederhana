"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Search, Plus, Upload, Download, RefreshCw, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Building2, 
  Layers, FolderTree, Sparkles, X, ArrowUpDown, FileSpreadsheet,
  Save, RotateCcw, Copy, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Autocomplete Filter Unit Kerja (Navigasi Keyboard ↑ ↓ + Enter, Terurut A-Z)
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
    <div className="relative inline-block text-left w-full" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-2xs flex items-center justify-between gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
      >
        <span className="truncate">
          {selectedUnit === 'ALL' ? `🏢 Semua Fakultas/Unit (${units.length})` : selectedUnit}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-80 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari fakultas/unit (↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
            />
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors ${
                  highlightedIndex === 0 ? 'bg-emerald-600 text-white font-bold' : selectedUnit === 'ALL' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                🏢 Semua Fakultas/Unit ({units.length})
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
                      isHighlighted ? 'bg-emerald-600 text-white font-bold' : isSelected ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
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

export default function RkaPenerimaanPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNotCreated, setTableNotCreated] = useState(false);

  // Filters State
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'ID' | 'PAGU' | 'UNIT'>('ID');

  // Master Units
  const [masterUnits, setMasterUnits] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(50);

  // Paste Zone & Modals State
  const [showInlinePasteZone, setShowInlinePasteZone] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Add / Edit Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newRow, setNewRow] = useState<any>({
    renterimaId: '',
    unit_kerja: '',
    nama_akun_penerimaan: '',
    tahun: 2027,
    renterimaIsAktif: 1,
    renterimaVolume: 1,
    renterimaTarif: 0,
    renterimaJumlah: 0,
    renterimaPagu: 0,
    status: 'Sedang Diproses',
    keterangan: '',
    sumber_dana: 'Dana Masyarakat Tidak Mengikat'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/rka/penerimaan?tahun=${tahunFilter}`;
      if (unitFilter !== 'ALL') url += `&unit=${encodeURIComponent(unitFilter)}`;
      if (statusFilter !== 'ALL') url += `&status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data || []);
        if (json.tableNotCreated) {
          setTableNotCreated(true);
        } else {
          setTableNotCreated(false);
        }
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
  }, [tahunFilter, unitFilter, statusFilter]);

  // Ambil daftar master unit dari api/rka/rules?units=1
  useEffect(() => {
    fetch('/api/rka/rules?units=1')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.units) {
          setMasterUnits(json.units);
        }
      })
      .catch(err => console.error('Error fetching units:', err));
  }, []);

  // Options unit kerja terurut A-Z
  const unitOptions = useMemo(() => {
    const combined = new Set<string>([...masterUnits, ...dataList.map(d => d.unit_kerja).filter(Boolean)]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' }));
  }, [dataList, masterUnits]);

  // Helper format rupiah
  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Filter & Search Data
  const filteredData = useMemo(() => {
    let result = [...dataList];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(d => 
        (d.nama_akun_penerimaan && d.nama_akun_penerimaan.toLowerCase().includes(q)) ||
        (d.keterangan && d.keterangan.toLowerCase().includes(q)) ||
        (d.unit_kerja && d.unit_kerja.toLowerCase().includes(q)) ||
        (d.sumber_dana && d.sumber_dana.toLowerCase().includes(q)) ||
        (d.renterima_id && String(d.renterima_id).includes(q))
      );
    }

    if (sortBy === 'PAGU') {
      result.sort((a, b) => (Number(b.renterima_pagu) || 0) - (Number(a.renterima_pagu) || 0));
    } else if (sortBy === 'UNIT') {
      result.sort((a, b) => (a.unit_kerja || '').localeCompare(b.unit_kerja || '', 'id', { numeric: true }));
    } else {
      result.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    }

    return result;
  }, [dataList, search, sortBy]);

  // Perhitungan KPI Stats Dinamis
  const metrics = useMemo(() => {
    let totalPagu = 0;
    let totalVolume = 0;
    let totalJumlah = 0;
    let totalSedangDiproses = 0;
    let totalDisetujui = 0;
    const unitsSet = new Set<string>();

    filteredData.forEach(d => {
      const pagu = Number(d.renterima_pagu) || 0;
      const vol = Number(d.renterima_volume) || 0;
      const jml = Number(d.renterima_jumlah) || 0;
      totalPagu += pagu;
      totalVolume += vol;
      totalJumlah += jml;
      if (d.unit_kerja) unitsSet.add(d.unit_kerja);
      if (d.status === 'Sedang Diproses') totalSedangDiproses++;
      else if (d.status === 'Disetujui' || d.status === 'Selesai') totalDisetujui++;
    });

    return {
      totalPagu,
      totalVolume,
      totalJumlah,
      totalSedangDiproses,
      totalDisetujui,
      unitCount: unitsSet.size,
      totalCount: filteredData.length,
      grandTotalCount: dataList.length
    };
  }, [filteredData, dataList]);

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalItems / (pageSize as number));
  const paginatedData = useMemo(() => {
    if (pageSize === 'ALL') return filteredData;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredData.slice(start, start + (pageSize as number));
  }, [filteredData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tahunFilter, unitFilter, statusFilter, search, pageSize, sortBy]);

  // Parser Paste TSV
  const parsedPasteLines = useMemo(() => {
    if (!pasteText.trim()) return [];
    const lines = pasteText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    const firstLineCols = lines[0].split('\t').map(c => c.trim().toLowerCase());
    const isHeader = firstLineCols.some(c => 
      c.includes('renterimaid') || 
      c.includes('unit_kerja') || 
      c.includes('nama_akun') || 
      c.includes('pagu') ||
      c.includes('volume')
    );

    const dataRows = isHeader ? lines.slice(1) : lines;
    const parsed: any[] = [];

    dataRows.forEach(line => {
      if (!line.trim()) return;
      const cols = line.split('\t').map(c => c.trim());
      if (cols.length >= 4) {
        parsed.push({
          renterimaId: cols[0] || '',
          unit_kerja: cols[1] || '',
          nama_akun_penerimaan: cols[2] || '',
          tahun: parseInt(cols[3]) || 2027,
          renterimaIsAktif: cols[4] !== undefined ? parseInt(cols[4]) || 1 : 1,
          renterimaVolume: cols[5] !== undefined ? parseFloat(cols[5].replace(/,/g, '.')) || 0 : 0,
          renterimaTarif: cols[6] !== undefined ? parseFloat(cols[6].replace(/,/g, '.')) || 0 : 0,
          renterimaJumlah: cols[7] !== undefined ? parseFloat(cols[7].replace(/,/g, '.')) || 0 : 0,
          renterimaPagu: cols[8] !== undefined ? parseFloat(cols[8].replace(/,/g, '.')) || 0 : 0,
          status: cols[9] || 'Sedang Diproses',
          keterangan: cols[10] || '',
          sumber_dana: cols[11] || 'Dana Masyarakat Tidak Mengikat'
        });
      }
    });

    return parsed;
  }, [pasteText]);

  // Isi contoh TSV sesuai permintaan pengguna
  const handleFillSampleTSV = () => {
    const sample = `renterimaId\tunit_kerja\tnama_akun_penerimaan\ttahun\trenterimaIsAktif\trenterimaVolume\trenterimaTarif\trenterimaJumlah\trenterimaPagu\tstatus\tketerangan\tsumber_dana\n114717\t08000010 Fakultas Ilmu Budaya\t41101.04.03.02 Penerimaan UKT S1 | UKT Pendidikan Unggul Bersubsidi 25%\t2027\t1\t24\t5700000.00\t136800000.00\t136800000.00\tSedang Diproses\tS1 BAHASA DAN SASTRA INDONESIA - tahun anggaran 2027 - angkatan 2026\tDana Masyarakat Tidak Mengikat`;
    setPasteText(sample);
  };

  // Bulk Import
  const handleBulkImport = async () => {
    if (parsedPasteLines.length === 0) return toast.error('Tidak ada baris data TSV yang valid');
    setIsImporting(true);
    try {
      const res = await fetch('/api/rka/penerimaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulk: true, rows: parsedPasteLines })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Berhasil mengimpor ${json.count || parsedPasteLines.length} baris penerimaan!`);
        setPasteText('');
        setShowInlinePasteZone(false);
        fetchData();
      } else {
        if (json.tableNotCreated) setTableNotCreated(true);
        toast.error('Gagal impor: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error saat impor: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Tambah Single Record
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/rka/penerimaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data penerimaan berhasil ditambahkan');
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

  // Edit Single Record
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/rka/penerimaan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Data penerimaan berhasil diperbarui');
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

  // Delete Record
  const handleDeleteRow = async (id: number) => {
    if (!confirm(`Hapus baris penerimaan ID #${id}?`)) return;
    try {
      const res = await fetch(`/api/rka/penerimaan?id=${id}`, { method: 'DELETE' });
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
      'ID RKA': d.renterima_id || d.id,
      'Tahun': d.tahun,
      'Unit Kerja': d.unit_kerja,
      'Nama Akun Penerimaan': d.nama_akun_penerimaan,
      'Volume': Number(d.renterima_volume) || 0,
      'Tarif (Rp)': Number(d.renterima_tarif) || 0,
      'Jumlah (Rp)': Number(d.renterima_jumlah) || 0,
      'Pagu Penerimaan (Rp)': Number(d.renterima_pagu) || 0,
      'Status': d.status || 'Sedang Diproses',
      'Keterangan': d.keterangan || '-',
      'Sumber Dana': d.sumber_dana || 'Dana Masyarakat Tidak Mengikat'
    }));

    const ws = XLSX.utils.json_to_sheet(mapped);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 8 },
      { wch: 35 },
      { wch: 50 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 45 },
      { wch: 30 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RKAT_Penerimaan');
    XLSX.writeFile(wb, `RKAT_Penerimaan_${tahunFilter}_${new Date().getTime()}.xlsx`);
  };

  const [copiedSql, setCopiedSql] = useState(false);
  const handleCopySql = () => {
    const sqlText = `CREATE TABLE IF NOT EXISTS public.rkat_penerimaan (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    renterima_id BIGINT,
    unit_kerja TEXT NOT NULL,
    nama_akun_penerimaan TEXT NOT NULL,
    tahun INT DEFAULT 2027,
    renterima_is_aktif INT DEFAULT 1,
    renterima_volume NUMERIC(18,2) DEFAULT 0,
    renterima_tarif NUMERIC(18,2) DEFAULT 0,
    renterima_jumlah NUMERIC(18,2) DEFAULT 0,
    renterima_pagu NUMERIC(18,2) DEFAULT 0,
    status TEXT DEFAULT 'Sedang Diproses',
    keterangan TEXT,
    sumber_dana TEXT DEFAULT 'Dana Masyarakat Tidak Mengikat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.rkat_penerimaan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to rkat_penerimaan" ON public.rkat_penerimaan;
CREATE POLICY "Allow all access to rkat_penerimaan" ON public.rkat_penerimaan FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    toast.success('Script SQL berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Wallet size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  RKAT Penerimaan
                </h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase">
                  TA {tahunFilter}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Penerimaan UKT, Tarif, Volume &amp; Pagu Usulan RKAT per Unit Kerja
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInlinePasteZone(!showInlinePasteZone)}
            className={`h-9 rounded-xl text-xs font-bold gap-1.5 shadow-2xs transition-colors ${
              showInlinePasteZone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>{showInlinePasteZone ? 'Tutup Paste Zone' : 'Buka Paste Zone (TSV)'}</span>
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

          <Link href="/rka/pengeluaran">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <FolderTree size={14} className="text-indigo-600" />
              <span>RKA Pengeluaran</span>
            </Button>
          </Link>

          <Link href="/rka/laporan">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Layers size={14} className="text-gray-600" />
              <span>Rekap Laporan</span>
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

      {/* Banner Jika Tabel Supabase Belum Dibuat */}
      {tableNotCreated && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950">
                  Tabel Database `rkat_penerimaan` Belum Dibuat di Supabase
                </h3>
                <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
                  File SQL migration telah disiapkan di file <code>supabase_rka_penerimaan_migration.sql</code>. Klik tombol di kanan untuk menyalin script lalu jalankan di Supabase SQL Editor.
                </p>
              </div>
            </div>
            <Button
              onClick={handleCopySql}
              size="sm"
              className="h-9 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs gap-1.5 shrink-0"
            >
              {copiedSql ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Script SQL'}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Pagu Usulan Penerimaan
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              Rp {formatRp(metrics.totalPagu)}
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>{metrics.totalCount.toLocaleString('id-ID')} {metrics.totalCount !== metrics.grandTotalCount ? `(terfilter dari ${metrics.grandTotalCount.toLocaleString('id-ID')})` : 'Baris Data'}</span>
              <Badge variant="secondary" className="text-[10px] font-bold">TA {tahunFilter}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-xs bg-gradient-to-b from-white to-emerald-50/30">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Volume / Kuantitas Target
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700">
              {metrics.totalVolume.toLocaleString('id-ID')} Target
            </div>
            <div className="text-xs text-emerald-700 font-semibold flex items-center justify-between pt-1 border-t border-emerald-100/60">
              <span>Total Hitung: Rp {formatRp(metrics.totalJumlah)}</span>
              <span className="text-[10px] text-gray-500">Vol × Tarif</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-blue-100 shadow-xs bg-gradient-to-b from-white to-blue-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block flex items-center gap-1">
              <span>🏢</span> <span>Unit Kerja / Fakultas Terdata</span>
            </span>
            <div className="text-2xl font-black font-mono text-blue-950">
              {metrics.unitCount} Unit
            </div>
            <div className="text-xs text-blue-800 font-semibold flex items-center justify-between pt-1 border-t border-blue-200/60">
              <span>Rata-rata Usulan</span>
              <span className="text-[10px] font-mono text-gray-600">
                Rp {metrics.unitCount > 0 ? formatRp(metrics.totalPagu / metrics.unitCount) : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-200 shadow-xs bg-gradient-to-b from-white to-amber-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
              <span>⏳</span> <span>Status Usulan</span>
            </span>
            <div className="text-2xl font-black font-mono text-amber-950">
              {metrics.totalSedangDiproses} Diproses
            </div>
            <div className="text-xs text-amber-800 font-semibold flex items-center justify-between pt-1 border-t border-amber-200/60">
              <span>Disetujui: {metrics.totalDisetujui}</span>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                {metrics.totalCount > 0 ? ((metrics.totalDisetujui / metrics.totalCount) * 100).toFixed(0) : 0}% Selesai
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DEDICATED INLINE PASTE ZONE SECTION RKAT PENERIMAAN */}
      {showInlinePasteZone && (
        <Card className="rounded-2xl border-emerald-200/80 shadow-xs bg-gradient-to-b from-white to-emerald-50/15 overflow-hidden animate-in fade-in duration-200">
          <CardHeader className="p-5 pb-3 border-b border-emerald-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet size={16} />
                </div>
                <CardTitle className="text-sm font-black text-gray-900">
                  Paste Zone: Import Massal RKAT Penerimaan (TSV / Excel)
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500 font-medium">
                Salin kolom dari spreadsheet Excel: <code>renterimaId, unit_kerja, nama_akun_penerimaan, tahun, renterimaIsAktif, renterimaVolume, renterimaTarif, renterimaJumlah, renterimaPagu, status, keterangan, sumber_dana</code>
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFillSampleTSV}
                className="h-8 rounded-xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold gap-1 shadow-2xs"
              >
                <span>Contoh Data FIB (2027)</span>
              </Button>
              {pasteText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPasteText('')}
                  className="h-8 rounded-xl text-xs text-gray-500 hover:text-gray-900"
                >
                  <RotateCcw size={13} className="mr-1" />
                  <span>Bersihkan</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-3">
            <div>
              <Textarea
                rows={6}
                placeholder="Salin baris data dari Excel lalu paste di sini..."
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                className="w-full bg-white border-gray-300 text-gray-900 font-mono text-xs rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-600 shadow-2xs max-w-full leading-relaxed"
              />
            </div>

            {/* Live Preview Indicator & Save Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs font-bold px-2.5 py-1 ${
                  parsedPasteLines.length > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}>
                  {parsedPasteLines.length > 0 ? `✓ Ditemukan ${parsedPasteLines.length} baris penerimaan valid` : 'Menunggu data dipaste...'}
                </Badge>
                {parsedPasteLines.length > 0 && (
                  <span className="text-xs text-gray-500 font-medium">
                    (Siap disimpan ke database rkat_penerimaan)
                  </span>
                )}
              </div>

              <Button
                onClick={handleBulkImport}
                disabled={isImporting || parsedPasteLines.length === 0}
                className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-50 gap-2 cursor-pointer active:scale-95"
              >
                {isImporting ? <RefreshCw className="animate-spin" size={15} /> : <Save size={15} />}
                <span>{isImporting ? 'Mengimpor Data...' : `Simpan ${parsedPasteLines.length} Baris Penerimaan ke Database`}</span>
              </Button>
            </div>

            {/* Pratinjau Mini */}
            {parsedPasteLines.length > 0 && (
              <div className="border border-emerald-100 rounded-xl overflow-hidden bg-white mt-3">
                <div className="px-3 py-2 bg-emerald-50/50 border-b border-emerald-100 text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                  <span>Pratinjau Pembacaan Data ({parsedPasteLines.length} baris):</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Maks 5 baris pertama</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2">ID RKA</th>
                        <th className="px-3 py-2">Fakultas / Unit Kerja</th>
                        <th className="px-3 py-2">Akun Penerimaan</th>
                        <th className="px-3 py-2 text-center">Vol</th>
                        <th className="px-3 py-2 text-right">Tarif</th>
                        <th className="px-3 py-2 text-right">Pagu Penerimaan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[11px] font-medium">
                      {parsedPasteLines.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 font-mono text-gray-500">{row.renterimaId}</td>
                          <td className="px-3 py-1.5 font-bold text-gray-900 truncate max-w-[180px]">{row.unit_kerja}</td>
                          <td className="px-3 py-1.5 font-semibold text-gray-950 truncate max-w-[260px]">{row.nama_akun_penerimaan}</td>
                          <td className="px-3 py-1.5 text-center font-mono text-gray-700">{row.renterimaVolume}</td>
                          <td className="px-3 py-1.5 font-mono text-right text-gray-600">Rp {formatRp(row.renterimaTarif)}</td>
                          <td className="px-3 py-1.5 font-mono font-bold text-right text-emerald-700">Rp {formatRp(row.renterimaPagu)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FILTER CONTROL SECTION */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Tahun */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Tahun Anggaran
              </label>
              <select
                value={tahunFilter}
                onChange={e => setTahunFilter(e.target.value)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value="2027">TA 2027</option>
                <option value="2026">TA 2026</option>
                <option value="2025">TA 2025</option>
                <option value="ALL">Semua Tahun</option>
              </select>
            </div>

            {/* 2. Unit Kerja (A-Z) */}
            <div className="lg:col-span-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                KODE &amp; NAMA UNIT KERJA (A-Z)
              </label>
              <UnitAutocompleteFilter
                units={unitOptions}
                selectedUnit={unitFilter}
                onSelect={u => setUnitFilter(u)}
              />
            </div>

            {/* 3. Status */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Status Usulan
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="Sedang Diproses">Sedang Diproses</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            {/* 4. Urutkan */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Urutkan Data
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
              >
                <option value="ID">Urut ID Default</option>
                <option value="PAGU">Pagu Tertinggi</option>
                <option value="UNIT">Unit Kerja A-Z</option>
              </select>
            </div>
          </div>

          {/* Baris Pencarian Teks */}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input
                placeholder="Cari akun penerimaan, keterangan, unit kerja, sumber dana..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-gray-50/60 border-gray-200 focus:bg-white focus:ring-2 focus:ring-emerald-600 font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {(unitFilter !== 'ALL' || statusFilter !== 'ALL' || search !== '') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUnitFilter('ALL');
                  setStatusFilter('ALL');
                  setSearch('');
                  setSortBy('ID');
                }}
                className="h-9 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
              >
                <RotateCcw size={13} className="mr-1" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TABEL RKAT PENERIMAAN */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-200 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">#</th>
                <th className="px-5 py-3.5 min-w-[320px]">Fakultas / Unit Kerja &amp; Akun Penerimaan</th>
                <th className="px-4 py-3.5 min-w-[280px]">Rincian Kuantitas, Tarif &amp; Keterangan</th>
                <th className="px-5 py-3.5 text-right min-w-[160px]">Pagu Penerimaan</th>
                <th className="px-4 py-3.5 text-center min-w-[120px]">Status</th>
                <th className="px-3 py-3.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-emerald-600" size={24} />
                    <span className="font-semibold text-xs">Memuat data RKAT penerimaan...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <Wallet size={36} className="mx-auto mb-2 opacity-30 text-emerald-600" />
                    <p className="font-bold text-gray-600">Belum ada data penerimaan yang cocok</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Gunakan tombol &quot;Buka Paste Zone (TSV)&quot; di atas untuk menyalin data dari Excel.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const no = pageSize === 'ALL' ? idx + 1 : (currentPage - 1) * (pageSize as number) + idx + 1;
                  const pagu = Number(row.renterima_pagu) || 0;
                  const tarif = Number(row.renterima_tarif) || 0;
                  const vol = Number(row.renterima_volume) || 0;

                  return (
                    <tr key={row.id || idx} className="hover:bg-gray-50/80 transition-colors">
                      {/* NO */}
                      <td className="px-4 py-4 text-center font-mono text-gray-400 text-xs align-top pt-4">
                        {no}
                      </td>

                      {/* KOLOM 1: UNIT KERJA & AKUN PENERIMAAN */}
                      <td className="px-5 py-4 align-top space-y-1.5">
                        {/* Unit Kerja Badge */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                            <Building2 size={12} className="text-emerald-700" />
                            <span>{row.unit_kerja || 'Unit Kerja Belum Diisi'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            TA {row.tahun || 2027} • ID: {row.renterima_id || row.id}
                          </span>
                        </div>

                        {/* Akun Penerimaan (Bersih tanpa background box) */}
                        <div className="font-bold text-gray-950 text-xs sm:text-sm leading-snug">
                          {row.nama_akun_penerimaan || '-'}
                        </div>

                        {/* Sumber Dana */}
                        <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                          <span className="font-bold text-gray-600">Sumber Dana:</span>
                          <span>{row.sumber_dana || 'Dana Masyarakat Tidak Mengikat'}</span>
                        </div>
                      </td>

                      {/* KOLOM 2: KUANTITAS, TARIF & KETERANGAN */}
                      <td className="px-4 py-4 align-top space-y-1">
                        {/* Rincian Perhitungan */}
                        <div className="text-xs font-mono font-semibold text-gray-800">
                          {vol.toLocaleString('id-ID')} Vol × Rp {formatRp(tarif)}
                        </div>

                        {/* Keterangan */}
                        {row.keterangan && (
                          <div className="text-[11px] text-gray-600 font-medium leading-relaxed">
                            {row.keterangan}
                          </div>
                        )}
                      </td>

                      {/* KOLOM 3: PAGU PENERIMAAN */}
                      <td className="px-5 py-4 align-top text-right">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                            Pagu Penerimaan
                          </span>
                          <div className="font-black font-mono text-emerald-700 text-sm sm:text-base">
                            Rp {formatRp(pagu)}
                          </div>
                        </div>
                      </td>

                      {/* KOLOM 4: STATUS */}
                      <td className="px-4 py-4 align-top text-center pt-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          row.status === 'Disetujui' || row.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {row.status || 'Sedang Diproses'}
                        </span>
                      </td>

                      {/* KOLOM 5: AKSI */}
                      <td className="px-3 py-4 text-center align-top pt-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRow({ ...row });
                              setEditModalOpen(true);
                            }}
                            className="p-1.5 bg-gray-100 hover:bg-emerald-600 text-gray-600 hover:text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                            title="Edit Data Penerimaan"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1.5 bg-gray-100 hover:bg-rose-600 text-gray-600 hover:text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                            title="Hapus Data"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
          <div>
            Menampilkan <strong>{pageSize === 'ALL' ? totalItems : Math.min((currentPage - 1) * (pageSize as number) + 1, totalItems)}</strong> sampai <strong>{pageSize === 'ALL' ? totalItems : Math.min(currentPage * (pageSize as number), totalItems)}</strong> dari <strong>{totalItems.toLocaleString('id-ID')}</strong> baris data
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-8 text-xs rounded-lg"
              >
                Sebelumnya
              </Button>
              <span className="px-2 font-bold text-gray-800">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-8 text-xs rounded-lg"
              >
                Berikutnya
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
              className="h-8 px-2 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 outline-none cursor-pointer"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="ALL">Semua Data</option>
            </select>
          </div>
        </div>
      </Card>

      {/* MODAL TAMBAH DATA */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">Tambah Data RKAT Penerimaan</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">ID RKA (renterimaId)</label>
                  <Input
                    placeholder="Contoh: 114717"
                    value={newRow.renterimaId}
                    onChange={e => setNewRow({ ...newRow, renterimaId: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tahun Anggaran</label>
                  <Input
                    type="number"
                    value={newRow.tahun}
                    onChange={e => setNewRow({ ...newRow, tahun: parseInt(e.target.value) || 2027 })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Fakultas / Unit Kerja</label>
                <Input
                  placeholder="Contoh: 08000010 Fakultas Ilmu Budaya"
                  value={newRow.unit_kerja}
                  onChange={e => setNewRow({ ...newRow, unit_kerja: e.target.value })}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nama Akun Penerimaan</label>
                <Input
                  placeholder="Contoh: 41101.04.03.02 Penerimaan UKT S1..."
                  value={newRow.nama_akun_penerimaan}
                  onChange={e => setNewRow({ ...newRow, nama_akun_penerimaan: e.target.value })}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Volume</label>
                  <Input
                    type="number"
                    value={newRow.renterimaVolume}
                    onChange={e => {
                      const vol = parseFloat(e.target.value) || 0;
                      const tarif = parseFloat(newRow.renterimaTarif) || 0;
                      setNewRow({ ...newRow, renterimaVolume: vol, renterimaPagu: vol * tarif, renterimaJumlah: vol * tarif });
                    }}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tarif (Rp)</label>
                  <Input
                    type="number"
                    value={newRow.renterimaTarif}
                    onChange={e => {
                      const tarif = parseFloat(e.target.value) || 0;
                      const vol = parseFloat(newRow.renterimaVolume) || 0;
                      setNewRow({ ...newRow, renterimaTarif: tarif, renterimaPagu: vol * tarif, renterimaJumlah: vol * tarif });
                    }}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pagu Penerimaan</label>
                  <Input
                    type="number"
                    value={newRow.renterimaPagu}
                    onChange={e => setNewRow({ ...newRow, renterimaPagu: parseFloat(e.target.value) || 0 })}
                    className="text-xs h-8 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Keterangan / Prodi / Angkatan</label>
                <Textarea
                  rows={2}
                  placeholder="Contoh: S1 BAHASA DAN SASTRA INDONESIA - tahun anggaran 2027..."
                  value={newRow.keterangan}
                  onChange={e => setNewRow({ ...newRow, keterangan: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status</label>
                  <select
                    value={newRow.status}
                    onChange={e => setNewRow({ ...newRow, status: e.target.value })}
                    className="w-full h-8 px-2 border rounded-lg text-xs"
                  >
                    <option value="Sedang Diproses">Sedang Diproses</option>
                    <option value="Disetujui">Disetujui</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Sumber Dana</label>
                  <Input
                    value={newRow.sumber_dana}
                    onChange={e => setNewRow({ ...newRow, sumber_dana: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button variant="outline" type="button" size="sm" onClick={() => setAddModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isSaving ? 'Menyimpan...' : 'Simpan Data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT DATA */}
      {editModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100">
              <h3 className="font-black text-gray-900 text-sm">Edit Data Penerimaan #{editingRow.id}</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Fakultas / Unit Kerja</label>
                <Input
                  value={editingRow.unit_kerja || ''}
                  onChange={e => setEditingRow({ ...editingRow, unit_kerja: e.target.value })}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nama Akun Penerimaan</label>
                <Input
                  value={editingRow.nama_akun_penerimaan || ''}
                  onChange={e => setEditingRow({ ...editingRow, nama_akun_penerimaan: e.target.value })}
                  required
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Volume</label>
                  <Input
                    type="number"
                    value={editingRow.renterima_volume || 0}
                    onChange={e => {
                      const vol = parseFloat(e.target.value) || 0;
                      const tarif = parseFloat(editingRow.renterima_tarif) || 0;
                      setEditingRow({ ...editingRow, renterima_volume: vol, renterima_pagu: vol * tarif, renterima_jumlah: vol * tarif });
                    }}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tarif (Rp)</label>
                  <Input
                    type="number"
                    value={editingRow.renterima_tarif || 0}
                    onChange={e => {
                      const tarif = parseFloat(e.target.value) || 0;
                      const vol = parseFloat(editingRow.renterima_volume) || 0;
                      setEditingRow({ ...editingRow, renterima_tarif: tarif, renterima_pagu: vol * tarif, renterima_jumlah: vol * tarif });
                    }}
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Pagu Penerimaan</label>
                  <Input
                    type="number"
                    value={editingRow.renterima_pagu || 0}
                    onChange={e => setEditingRow({ ...editingRow, renterima_pagu: parseFloat(e.target.value) || 0 })}
                    className="text-xs h-8 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Keterangan</label>
                <Textarea
                  rows={2}
                  value={editingRow.keterangan || ''}
                  onChange={e => setEditingRow({ ...editingRow, keterangan: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status</label>
                  <select
                    value={editingRow.status || 'Sedang Diproses'}
                    onChange={e => setEditingRow({ ...editingRow, status: e.target.value })}
                    className="w-full h-8 px-2 border rounded-lg text-xs"
                  >
                    <option value="Sedang Diproses">Sedang Diproses</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Sumber Dana</label>
                  <Input
                    value={editingRow.sumber_dana || ''}
                    onChange={e => setEditingRow({ ...editingRow, sumber_dana: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button variant="outline" type="button" size="sm" onClick={() => setEditModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isSaving ? 'Menyimpan...' : 'Perbarui Data'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
