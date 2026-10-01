'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  RotateCcw, 
  Filter, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Wallet, 
  Loader2, 
  Building2,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import Select from 'react-select';
import * as XLSX from 'xlsx';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import TablePagination from '@/components/shared/TablePagination';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import ExportButtons from '@/components/shared/ExportButtons';
import EmptyState from '@/components/shared/EmptyState';

const fmt = (n: number) => Math.abs(n).toLocaleString('id-ID', { minimumFractionDigits: 2 });

const cleanNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = String(val).trim();
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

const parseAnyDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;
  const num = Number(s.replace(',', '.'));
  if (!isNaN(num) && num > 30000 && num < 60000) {
     const excelDate = new Date((num - 25569) * 86400 * 1000);
     if (!isNaN(excelDate.getTime())) return excelDate;
  }
  if (s.includes('/')) {
    const d2 = new Date(s.replace(/\//g, '-'));
    if (!isNaN(d2.getTime())) return d2;
  }
  return null;
};

export default function BukuBesarPage() {
  const [loading, setLoading] = useState(true);
  const [allTrx, setAllTrx] = useState<any[]>([]);
  const [allBank, setAllBank] = useState<any[]>([]);
  const [allAkun, setAllAkun] = useState<any[]>([]);
  const [allRekening, setAllRekening] = useState<any[]>([]);

  // Filters
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [selectedRekening, setSelectedRekening] = useState<string>('all');
  const [selectedAkun, setSelectedAkun] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state conforming to Design System
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const fetchAllPages = async (queryBuilder: any) => {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await queryBuilder.range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = [...allData, ...data];
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allData;
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [trxData, bankData, akunData, rekData] = await Promise.all([
        fetchAllPages(supabase.from('transactions').select('*').neq('disetujui', 'Ditolak')),
        fetchAllPages(supabase.from('bank_transactions').select('*')),
        fetchAllPages(supabase.from('ref_akun').select('*')),
        fetchAllPages(supabase.from('ref_rekening').select('*')),
      ]);
      setAllTrx(trxData);
      setAllBank(bankData);
      setAllAkun(akunData);
      setAllRekening(rekData);
    } catch (e) {
      console.error('Error fetching data for Buku Besar:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Unified Transactions
  const unifiedData = useMemo(() => {
    const akunMap: Record<string, any> = {};
    allAkun.forEach(a => { akunMap[a.id] = a; });

    let list: any[] = [];

    // Kas Kecil
    allTrx.forEach(t => {
      const d = parseAnyDate(t.tanggal);
      if (!d) return;
      const masuk = cleanNum(t.uang_masuk);
      const keluar = cleanNum(t.uang_keluar);
      if (masuk === 0 && keluar === 0) return;
      
      list.push({
        id: `kas-${t.id}`,
        tanggal: d,
        uraian: t.uraian || t.keterangan || '-',
        masuk,
        keluar,
        rekening_id: 'kas',
        nama_rekening: 'Kas Kecil (KK1)',
        akun_id: t.akun_id,
        nomor_akun: t.akun_id ? (akunMap[t.akun_id]?.nomor_akun || '-') : '-',
        nama_akun: t.akun_id ? (akunMap[t.akun_id]?.nama_akun || 'Tanpa Akun') : 'Tanpa Akun',
      });
    });

    // Bank
    const seen = new Set();
    const rekMap: Record<string, any> = {};
    allRekening.forEach(r => { rekMap[r.id] = r; });

    allBank.forEach(b => {
      const key = `${b.rekening_id}-${b.waktu_transaksi}-${b.noref_bank}-${b.debet}-${b.kredit}`;
      if (seen.has(key)) return;
      seen.add(key);

      const d = parseAnyDate(b.waktu_transaksi);
      if (!d) return;
      const masuk = cleanNum(b.kredit);
      const keluar = cleanNum(b.debet);
      if (masuk === 0 && keluar === 0) return;

      const rId = String(b.rekening_id || 'unknown');
      list.push({
        id: `bank-${b.id}`,
        tanggal: d,
        uraian: b.deskripsi || b.uraian || '-',
        masuk,
        keluar,
        rekening_id: rId,
        nama_rekening: rekMap[rId]?.nama_rekening || rekMap[rId]?.nama || (b.rekening_id ? `Bank Rekening ${b.rekening_id}` : 'Bank'),
        akun_id: b.akun_id,
        nomor_akun: b.akun_id ? (akunMap[b.akun_id]?.nomor_akun || '-') : '-',
        nama_akun: b.akun_id ? (akunMap[b.akun_id]?.nama_akun || 'Tanpa Akun') : 'Tanpa Akun',
      });
    });

    // Sort by date ascending
    list.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
    return list;
  }, [allTrx, allBank, allAkun, allRekening]);

  // Derived filter options for Akun
  const activeAkunOptions = useMemo(() => {
    const ids = new Set<string>();
    unifiedData.forEach(d => {
      if (d.akun_id && d.akun_id !== 'null' && d.akun_id !== 'undefined') ids.add(String(d.akun_id));
    });
    const options = Array.from(ids).map(id => {
      const a = allAkun.find(x => String(x.id) === id);
      return {
        id,
        nomor: a?.nomor_akun || '-',
        nama: a?.nama_akun || 'Unknown'
      };
    });
    options.sort((a, b) => a.nomor.localeCompare(b.nomor));
    return options;
  }, [unifiedData, allAkun]);

  // Calculate Ledger Data with Filters
  const ledgerData = useMemo(() => {
    if (!startDate || !endDate) return { rows: [], finalSaldo: 0, totalDebit: 0, totalKredit: 0 };
    
    const startT = new Date(`${startDate}T00:00:00`).getTime();
    const endT = new Date(`${endDate}T23:59:59`).getTime();

    const filteredRows: any[] = [];
    const q = searchQuery.toLowerCase().trim();

    unifiedData.forEach(d => {
      // Filter by Rekening
      if (selectedRekening !== 'all') {
        if (selectedRekening === 'kas') {
          if (d.rekening_id !== 'kas') return;
        } else if (selectedRekening === 'bank') {
          if (d.rekening_id === 'kas') return;
        } else {
          if (d.rekening_id !== selectedRekening) return;
        }
      }

      // Filter by Akun
      if (selectedAkun !== 'all' && String(d.akun_id) !== selectedAkun) return;

      // Filter by Date
      const t = d.tanggal.getTime();
      if (t < startT || t > endT) return;

      // Filter by Search Query
      if (q) {
        const matchUraian = d.uraian.toLowerCase().includes(q);
        const matchAkunNo = d.nomor_akun.toLowerCase().includes(q);
        const matchAkunNama = d.nama_akun.toLowerCase().includes(q);
        const matchRekening = d.nama_rekening.toLowerCase().includes(q);
        if (!matchUraian && !matchAkunNo && !matchAkunNama && !matchRekening) return;
      }

      filteredRows.push(d);
    });

    let runningSaldo = 0;
    let totalDebit = 0;
    let totalKredit = 0;

    const rowsWithSaldo = filteredRows.map(r => {
      runningSaldo += (r.masuk - r.keluar);
      totalDebit += r.masuk;
      totalKredit += r.keluar;
      return { ...r, runningSaldo };
    });

    return { 
      rows: rowsWithSaldo, 
      finalSaldo: runningSaldo,
      totalDebit,
      totalKredit
    };
  }, [unifiedData, startDate, endDate, selectedRekening, selectedAkun, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedRekening, selectedAkun, searchQuery, itemsPerPage]);

  // Paginated Rows
  const totalItems = ledgerData.rows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return ledgerData.rows.slice(start, start + itemsPerPage);
  }, [ledgerData.rows, currentPage, itemsPerPage]);

  // Export Excel
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const rows = ledgerData.rows.map((r, i) => ({
        'No': i + 1,
        'Tanggal': r.tanggal.toLocaleDateString('id-ID'),
        'Uraian & Keterangan': r.uraian,
        'Sumber Rekening / Kas': r.nama_rekening,
        'Nomor Akun': r.nomor_akun,
        'Nama Akun': r.nama_akun,
        'Debit (+)': r.masuk,
        'Kredit (-)': r.keluar,
        'Saldo Berjalan': r.runningSaldo,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Buku Besar');
      XLSX.writeFile(wb, `Buku_Besar_${startDate}_sd_${endDate}.xlsx`);
    } catch (err) {
      console.error('Gagal export excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const resetFilters = () => {
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setSelectedRekening('all');
    setSelectedAkun('all');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-blue-600 space-y-3">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-gray-500">Memuat Buku Besar (General Ledger)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 font-sans text-gray-900">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: portrait; margin: 12mm; }
          .print-hidden { display: none !important; }
          body { background: white !important; font-size: 11px !important; }
          .print-header { display: block !important; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db !important; padding: 6px !important; font-size: 10px !important; color: #000 !important; }
          th { background-color: #f3f4f6 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-full-table { display: table-row-group !important; }
          .web-paged-table { display: none !important; }
        }
      `}} />

      {/* 1. STANDARD PAGE HEADER (DESIGN SYSTEM) */}
      <div className="print-hidden">
        <PageHeader
          title="Buku Besar (General Ledger)"
          subtitle="Rincian kronologis mutasi debit & kredit per akun anggaran serta rekening kas/bank"
          icon={BookOpen}
          breadcrumbs={[
            { label: 'Akuntansi & Keuangan' },
            { label: 'Buku Besar' }
          ]}
          badge={{ text: `${ledgerData.rows.length} Transaksi`, variant: 'purple' }}
          actions={
            <ExportButtons
              onExportExcel={handleExportExcel}
              isExportingExcel={isExportingExcel}
              onExportPdf={() => window.print()}
              pdfLabel="Cetak PDF"
            />
          }
        />
      </div>

      {/* 2. STATCARDS KPI METRICS (DESIGN SYSTEM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print-hidden">
        <StatCard
          title="Total Masuk / Debit (+)"
          value={`Rp ${fmt(ledgerData.totalDebit)}`}
          subtitle="Pemasukan & Pemindahbukuan"
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Total Keluar / Kredit (-)"
          value={`Rp ${fmt(ledgerData.totalKredit)}`}
          subtitle="Pengeluaran Beban & Mutasi"
          icon={TrendingDown}
          variant="rose"
        />
        <StatCard
          title="Total Saldo Periode"
          value={`Rp ${fmt(ledgerData.finalSaldo)}`}
          subtitle="Akumulasi Selisih Periode"
          icon={Scale}
          variant="indigo"
        />
        <StatCard
          title="Volume Transaksi"
          value={`${ledgerData.rows.length} Data`}
          subtitle={`Periode ${new Date(startDate).toLocaleDateString('id-ID')} s/d ${new Date(endDate).toLocaleDateString('id-ID')}`}
          icon={Coins}
          variant="blue"
        />
      </div>

      {/* 3. INTERACTIVE FILTER CONSOLE (DESIGN SYSTEM) */}
      <div className="print-hidden bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-blue-600" />
            <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Filter Parameter Buku Besar
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">Kerapatan:</span>
              <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
            </div>

            {(searchQuery || selectedRekening !== 'all' || selectedAkun !== 'all') && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw size={12} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Quick Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Pencarian Cepat
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari uraian / kode akun..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-xs font-semibold bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Rentang Tanggal
            </label>
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9">
              <CalendarIcon size={13} className="text-gray-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none text-gray-700 w-full"
              />
              <span className="text-gray-300">-</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none text-gray-700 w-full"
              />
            </div>
          </div>

          {/* Rekening Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Sumber Dana / Kas
            </label>
            <select
              value={selectedRekening}
              onChange={e => setSelectedRekening(e.target.value)}
              className="w-full h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="all">Semua Rekening & Kas</option>
              <option value="kas">Kas Kecil (KK1)</option>
              <option value="bank">Semua Bank Saja</option>
              {allRekening.map(r => (
                <option key={r.id} value={String(r.id)}>
                  {r.nama_rekening || r.nama || (r.no_rekening ? `Rek. ${r.no_rekening}` : `Bank ${r.id}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Akun Anggaran Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Akun Anggaran (MAK)
            </label>
            <Select 
              options={[
                { value: 'all', label: 'Semua Akun (Gabungan)' }, 
                ...activeAkunOptions.map(a => ({ value: a.id, label: `${a.nomor} - ${a.nama}` }))
              ]}
              value={
                selectedAkun === 'all' 
                  ? { value: 'all', label: 'Semua Akun (Gabungan)' } 
                  : { 
                      value: selectedAkun, 
                      label: activeAkunOptions.find(a => a.id === selectedAkun) 
                        ? `${activeAkunOptions.find(a => a.id === selectedAkun)?.nomor} - ${activeAkunOptions.find(a => a.id === selectedAkun)?.nama}` 
                        : 'Pilih Akun' 
                    }
              }
              onChange={(val: any) => setSelectedAkun(val?.value || 'all')}
              styles={{
                control: (b) => ({ 
                  ...b, 
                  minHeight: '36px', 
                  height: '36px', 
                  borderRadius: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  backgroundColor: '#f9fafb', 
                  fontSize: '12px', 
                  fontWeight: 600,
                  boxShadow: 'none'
                }),
                valueContainer: (b) => ({ ...b, padding: '0 8px' }),
                menu: (b) => ({ ...b, zIndex: 50, fontSize: '12px', borderRadius: '0.75rem' }),
              }}
            />
          </div>
        </div>
      </div>

      {/* PRINT HEADER ONLY */}
      <div className="hidden print-header">
        <h1 className="text-xl font-black uppercase tracking-widest text-gray-900">BUKU BESAR (GENERAL LEDGER)</h1>
        <p className="text-xs font-semibold mt-1 text-gray-600">
          Periode: {new Date(startDate).toLocaleDateString('id-ID')} s/d {new Date(endDate).toLocaleDateString('id-ID')}
        </p>
        <p className="text-xs font-medium text-gray-600">
          Sumber Dana: {selectedRekening === 'all' ? 'Semua Rekening & Kas' : selectedRekening === 'kas' ? 'Kas Kecil (KK1)' : allRekening.find(r => String(r.id) === selectedRekening)?.nama_rekening || 'Bank'} | Akun: {selectedAkun === 'all' ? 'Semua Akun' : activeAkunOptions.find(a => a.id === selectedAkun)?.nama || '-'}
        </p>
      </div>

      {/* 4. TABLE VIEW (DESIGN SYSTEM) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                <th className={`w-12 text-center ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>No</th>
                <th className={`w-28 ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Tanggal</th>
                <th className={`${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Uraian Transaksi</th>
                <th className={`${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Sumber Dana</th>
                <th className={`${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Akun Anggaran</th>
                <th className={`text-right ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Debit (+)</th>
                <th className={`text-right ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Kredit (-)</th>
                <th className={`text-right w-36 ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Saldo Berjalan</th>
              </tr>
            </thead>

            {/* WEB PAGED TBODY */}
            <tbody className="divide-y divide-gray-100 web-paged-table">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <EmptyState
                      type="search"
                      title="Tidak Ada Mutasi Transaksi"
                      description="Tidak ada transaksi debit/kredit yang cocok dengan filter tanggal, rekening, atau akun terpilih."
                      actionLabel="Bersihkan Filter"
                      onAction={resetFilters}
                    />
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-blue-50/40 transition-colors even:bg-slate-50/30 ${
                        tableDensity === 'compact' ? 'text-[11px]' : 'text-xs'
                      }`}
                    >
                      <td className={`text-center font-mono text-gray-400 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        {itemIndex}
                      </td>
                      <td className={`whitespace-nowrap font-medium text-gray-700 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        {row.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={`font-semibold text-gray-900 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        {row.uraian}
                      </td>
                      <td className={`${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          row.rekening_id === 'kas'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {row.nama_rekening}
                        </span>
                      </td>
                      <td className={`${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200">
                            {row.nomor_akun}
                          </span>
                          <span className="text-gray-600 truncate max-w-[170px]" title={row.nama_akun}>
                            {row.nama_akun}
                          </span>
                        </div>
                      </td>
                      <td className={`text-right font-black font-mono whitespace-nowrap text-emerald-600 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        {row.masuk > 0 ? (
                          <div className="inline-flex items-center gap-0.5">
                            <ArrowDownRight size={12} className="text-emerald-500" />
                            <span>{fmt(row.masuk)}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className={`text-right font-black font-mono whitespace-nowrap text-rose-600 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        {row.keluar > 0 ? (
                          <div className="inline-flex items-center gap-0.5">
                            <ArrowUpRight size={12} className="text-rose-500" />
                            <span>{fmt(row.keluar)}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className={`text-right font-black font-mono whitespace-nowrap text-gray-900 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                        {fmt(row.runningSaldo)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* PRINT-ONLY FULL TABLE BODY */}
            <tbody className="hidden print-full-table divide-y divide-gray-200">
              {ledgerData.rows.map((row, idx) => (
                <tr key={`print-${row.id}`}>
                  <td className="text-center font-mono text-gray-500">{idx + 1}</td>
                  <td className="whitespace-nowrap font-medium text-gray-700">
                    {row.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="font-semibold text-gray-900">{row.uraian}</td>
                  <td>{row.nama_rekening}</td>
                  <td>{row.nomor_akun} - {row.nama_akun}</td>
                  <td className="text-right font-mono font-bold text-emerald-700">
                    {row.masuk > 0 ? fmt(row.masuk) : '-'}
                  </td>
                  <td className="text-right font-mono font-bold text-rose-700">
                    {row.keluar > 0 ? fmt(row.keluar) : '-'}
                  </td>
                  <td className="text-right font-mono font-bold text-gray-900">
                    {fmt(row.runningSaldo)}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* SUMMARY FOOTER */}
            {ledgerData.rows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold border-t-2 border-gray-200 text-xs">
                  <td colSpan={5} className="py-3 px-4 text-right text-gray-700 uppercase tracking-wider text-[11px] font-black">
                    Total Debit & Kredit Periode
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-mono font-black whitespace-nowrap">
                    {fmt(ledgerData.totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-700 font-mono font-black whitespace-nowrap">
                    {fmt(ledgerData.totalKredit)}
                  </td>
                  <td className="py-3 px-4 text-right text-indigo-700 font-mono font-black whitespace-nowrap bg-indigo-50/50">
                    {fmt(ledgerData.finalSaldo)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 5. TABLE PAGINATION (DESIGN SYSTEM) */}
        {totalItems > 0 && (
          <div className="print-hidden">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              pageSizeOptions={[15, 25, 50, 100]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
