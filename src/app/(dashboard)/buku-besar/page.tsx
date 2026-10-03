'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BookOpen, 
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
  Printer,
  Landmark,
  FolderTree,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import TablePagination from '@/components/shared/TablePagination';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import ExportButtons from '@/components/shared/ExportButtons';
import EmptyState from '@/components/shared/EmptyState';
import DateRangePicker, { DateRange } from '@/components/shared/DateRangePicker';
import AutocompleteCombobox, { ComboboxOption } from '@/components/shared/AutocompleteCombobox';

// Format Rupiah tanpa desimal sen sesuai Design System
const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString('id-ID');

const formatDateId = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

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

  // Helper: Tanggal awal bulan & hari ini (waktu lokal)
  const getLocalMonthStart = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  const getLocalToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Filters (DateRangePicker 1x Klik standar Design System)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getLocalMonthStart(),
    endDate: getLocalToday()
  });
  const startDate = dateRange.startDate;
  const endDate = dateRange.endDate;

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

  const rekeningComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const opts: ComboboxOption[] = [
      { value: 'all', label: 'Semua Rekening & Kas', badge: 'Semua' },
      { value: 'kas', label: 'Kas Tunai / Kas Kecil', badge: 'Kas' },
    ];
    allRekening.forEach(r => {
      const bankName = r.nama_bank || 'Bank';
      const noRek = r.nomor_rekening || r.no_rekening ? ` - ${r.nomor_rekening || r.no_rekening}` : '';
      opts.push({
        value: String(r.id),
        label: `${bankName}${noRek}`,
        badge: bankName,
        subtext: r.nomor_rekening || r.no_rekening ? `No. Rek: ${r.nomor_rekening || r.no_rekening}` : undefined
      });
    });
    return opts;
  }, [allRekening]);

  const akunComboboxOptions = useMemo<ComboboxOption[]>(() => {
    const opts: ComboboxOption[] = [
      { value: 'all', label: 'Semua Akun Anggaran (MAK)', badge: 'Semua' }
    ];
    activeAkunOptions.forEach(a => {
      opts.push({
        value: a.id,
        label: `${a.nomor} - ${a.nama}`,
        badge: a.nomor,
        subtext: a.nama
      });
    });
    return opts;
  }, [activeAkunOptions]);

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
    setDateRange({
      startDate: getLocalMonthStart(),
      endDate: getLocalToday()
    });
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

      {/* 2. STATCARDS KPI METRICS (4 MODERN KPI SUMMARY CARDS SESUAI DESIGN SYSTEM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 print-hidden">
        <StatCard
          title="TOTAL MASUK / DEBIT (+)"
          value={`Rp ${fmt(ledgerData.totalDebit)}`}
          subtitle="Pemasukan & Pemindahbukuan"
          icon={TrendingUp}
          trend={{ value: 'Kas Masuk', isUp: true, isGood: true }}
          variant="emerald"
          lightBg={true}
        />
        <StatCard
          title="TOTAL KELUAR / KREDIT (-)"
          value={`Rp ${fmt(ledgerData.totalKredit)}`}
          subtitle="Pengeluaran Beban & Mutasi"
          icon={TrendingDown}
          trend={{ value: 'Kas Keluar', isUp: false, isGood: false }}
          variant="rose"
          lightBg={true}
        />
        <StatCard
          title="TOTAL SALDO PERIODE"
          value={`Rp ${fmt(ledgerData.finalSaldo)}`}
          subtitle="Akumulasi Selisih Periode"
          icon={Scale}
          trend={{
            value: `${ledgerData.finalSaldo >= 0 ? '+' : ''}Rp ${fmt(ledgerData.finalSaldo)}`,
            isUp: ledgerData.finalSaldo >= 0,
            isGood: ledgerData.finalSaldo >= 0
          }}
          variant="indigo"
          lightBg={true}
        />
        <StatCard
          title="VOLUME TRANSAKSI"
          value={`${ledgerData.rows.length} Data`}
          subtitle={`Periode ${formatDateId(dateRange.startDate)} s/d ${formatDateId(dateRange.endDate)}`}
          icon={BookOpen}
          variant="blue"
          lightBg={true}
        />
      </div>

      {/* 3. FILTER TOOLBAR: DATE RANGE PICKER + REKENING + AKUN MAK + SEARCH BAR (STANDAR DESIGN SYSTEM) */}
      <div className="bg-white p-4 px-5 rounded-2xl border border-gray-200/90 shadow-2xs print-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Filter Rentang Tanggal */}
          <div className="lg:col-span-3 w-full">
            <DateRangePicker
              label="Filter Rentang Tanggal (1x Klik)"
              value={dateRange}
              onChange={setDateRange}
              showTime={false}
            />
          </div>

          {/* 2. Filter Sumber Rekening */}
          <div className="lg:col-span-3 w-full">
            <AutocompleteCombobox
              label="Sumber Rekening"
              icon={Landmark}
              placeholder="Pilih rekening kas / bank..."
              options={rekeningComboboxOptions}
              value={selectedRekening}
              onChange={(val) => setSelectedRekening(val || 'all')}
            />
          </div>

          {/* 3. Filter Akun MAK */}
          <div className="lg:col-span-3 w-full">
            <AutocompleteCombobox
              label="Akun Anggaran (MAK)"
              icon={FolderTree}
              placeholder="Pilih akun atau ketik kode..."
              options={akunComboboxOptions}
              value={selectedAkun}
              onChange={(val) => setSelectedAkun(val || 'all')}
            />
          </div>

          {/* 4. Pencarian Cepat */}
          <div className="lg:col-span-2 w-full">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Search size={11} className="text-gray-400 shrink-0" />
              <span>Pencarian Cepat</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari uraian, kode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-3.5 pr-8 text-xs bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-gray-800 transition-all shadow-2xs placeholder:text-gray-400 placeholder:font-bold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  title="Hapus kata kunci"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* 5. Tombol Reset Filter */}
          <div className="lg:col-span-1 w-full flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={selectedRekening === 'all' && selectedAkun === 'all' && !searchQuery && dateRange.startDate === getLocalMonthStart() && dateRange.endDate === getLocalToday()}
              className="w-full h-10 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset semua filter"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline lg:hidden xl:inline">Reset</span>
            </button>
          </div>

        </div>
      </div>

      {/* PRINT HEADER ONLY */}
      <div className="hidden print-header">
        <h1 className="text-xl font-black uppercase tracking-widest text-gray-900">BUKU BESAR (GENERAL LEDGER)</h1>
        <p className="text-xs font-semibold mt-1 text-gray-600">
          Periode: {formatDateId(dateRange.startDate)} s/d {formatDateId(dateRange.endDate)}
        </p>
        <p className="text-xs font-medium text-gray-600">
          Sumber Dana: {selectedRekening === 'all' ? 'Semua Rekening & Kas' : selectedRekening === 'kas' ? 'Kas Kecil (KK1)' : allRekening.find(r => String(r.id) === selectedRekening)?.nama_rekening || 'Bank'} | Akun: {selectedAkun === 'all' ? 'Semua Akun' : activeAkunOptions.find(a => a.id === selectedAkun)?.nama || '-'}
        </p>
      </div>

      {/* 4. TABLE VIEW (DESIGN SYSTEM) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        {/* Table Top Bar with Density Toggle */}
        <div className="p-3.5 px-5 bg-gray-50/70 border-b border-gray-200/80 flex items-center justify-between gap-3 print-hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Daftar Transaksi Buku Besar
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-700 text-[10px] font-bold">
              {ledgerData.rows.length} Transaksi
            </span>
          </div>
          <div className="flex items-center gap-3">
            <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
          </div>
        </div>
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
