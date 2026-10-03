'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search, 
  RotateCcw, 
  FolderOpen, 
  ExternalLink, 
  X,
  FileSpreadsheet,
  Printer,
  Calendar,
  Wallet,
  Eye,
  CheckCircle2,
  Paperclip,
  Landmark
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { getSafeFileUrl } from '@/lib/fileHelper';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import TablePagination from '@/components/shared/TablePagination';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import ExportButtons from '@/components/shared/ExportButtons';
import EmptyState from '@/components/shared/EmptyState';
import DateRangePicker, { DateRange } from '@/components/shared/DateRangePicker';
import AutocompleteCombobox, { ComboboxOption } from '@/components/shared/AutocompleteCombobox';

export default function ReportsPage() {
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

  // State Filter Rentang Tanggal (Standard DateRangePicker 1x Klik)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getLocalMonthStart(),
    endDate: getLocalToday()
  });

  // State Filter Sumber Rekening: default 'KAS' (Kas Tunai), 'ALL', atau ID Bank
  const [rekeningPilih, setRekeningPilih] = useState<string>('KAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State Data Transaksi & Statistik
  const [dataStats, setDataStats] = useState({ 
    income: 0, 
    expense: 0, 
    balance: 0, 
    initialBalance: 0 
  });
  const [allFilteredTransactions, setAllFilteredTransactions] = useState<any[]>([]);
  const [rekeningList, setRekeningList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Design System States
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // Expanded Row for Lampiran Bukti
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string, original: string } | null>(null);

  // 1. Fetch Master Rekening Bank
  useEffect(() => {
    const fetchRekening = async () => {
      try {
        const { data, error } = await supabase.from('ref_rekening').select('*').order('id', { ascending: true });
        if (error) throw error;
        if (data) setRekeningList(data);
      } catch (err) {
        console.error("Gagal menarik master rekening:", err);
      }
    };
    fetchRekening();
  }, []);

  const rekeningMap = useMemo(() => {
    const map: Record<string, string> = {
      'KAS': 'Kas Tunai (BKU)'
    };
    rekeningList.forEach(r => {
      const bankName = r.nama_bank || 'Bank';
      const noRek = r.nomor_rekening ? ` - ${r.nomor_rekening}` : '';
      map[String(r.id)] = `${bankName}${noRek}`;
    });
    return map;
  }, [rekeningList]);

  const rekeningOptions = useMemo<ComboboxOption[]>(() => {
    const opts: ComboboxOption[] = [
      { value: 'KAS', label: 'Kas Tunai (BKU Kas Kecil)', badge: 'Kas Tunai' },
      { value: 'ALL', label: 'Semua Rekening (Kas + Bank)', badge: 'Semua Rekening' }
    ];
    rekeningList.forEach(r => {
      const bankName = r.nama_bank || 'Bank';
      const noRek = r.nomor_rekening ? ` - ${r.nomor_rekening}` : '';
      opts.push({
        value: String(r.id),
        label: `${bankName}${noRek}`,
        badge: bankName,
        subtext: r.nomor_rekening ? `No. Rek: ${r.nomor_rekening}` : undefined
      });
    });
    return opts;
  }, [rekeningList]);

  // 2. Fetch Data Terpadu (Kas + Bank) dengan Paging Supabase > 1000 Baris
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      // A. Ambil SEMUA transaksi Kas Tunai (transactions)
      let allKas: any[] = [];
      let isSelesaiKas = false;
      let ambilMulaiKas = 0;
      const batasAmbil = 1000;

      while (!isSelesaiKas) {
        const { data, error } = await supabase
          .from('transactions')
          .select('id, tanggal, uraian, uang_masuk, uang_keluar, disetujui, toko, foto_nota, foto_kegiatan, foto_barang, foto_bukti_transfer, ref_akun(nama_akun), ref_personel(nama_orang)')
          .neq('disetujui', 'Ditolak')
          .order('tanggal', { ascending: true })
          .order('id', { ascending: true })
          .range(ambilMulaiKas, ambilMulaiKas + batasAmbil - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allKas = [...allKas, ...data];
          if (data.length < batasAmbil) isSelesaiKas = true;
          else ambilMulaiKas += batasAmbil;
        } else {
          isSelesaiKas = true;
        }
      }

      // B. Ambil SEMUA transaksi Rekening Bank (bank_transactions)
      let allBank: any[] = [];
      let isSelesaiBank = false;
      let ambilMulaiBank = 0;

      while (!isSelesaiBank) {
        const { data, error } = await supabase
          .from('bank_transactions')
          .select('id, waktu_transaksi, deskripsi, kredit, debet, rekening_id, noref_bank, foto_bukti, ref_akun(nama_akun)')
          .order('waktu_transaksi', { ascending: true })
          .order('id', { ascending: true })
          .range(ambilMulaiBank, ambilMulaiBank + batasAmbil - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allBank = [...allBank, ...data];
          if (data.length < batasAmbil) isSelesaiBank = true;
          else ambilMulaiBank += batasAmbil;
        } else {
          isSelesaiBank = true;
        }
      }

      // C. Normalisasi & Standarisasi Format Data Kas + Bank
      const combined = [
        ...allKas.map(k => {
          const tglStr = String(k.tanggal || '').split('T')[0];
          return {
            uid: `KAS-${k.id}`,
            tipe: 'KAS',
            idAsli: k.id,
            tanggal_str: tglStr,
            waktu_iso: tglStr ? `${tglStr}T00:00:00` : '',
            uraian: k.uraian || '-',
            masuk: Number(k.uang_masuk) || 0,
            keluar: Number(k.uang_keluar) || 0,
            rekening_id: 'KAS',
            status: k.disetujui || 'Selesai',
            nama_akun: k.ref_akun?.nama_akun || '-',
            keterangan_tambahan: [
              k.ref_personel?.nama_orang ? `Personel: ${k.ref_personel.nama_orang}` : null,
              k.toko ? `Toko: ${k.toko}` : null
            ].filter(Boolean).join(' | '),
            foto: [k.foto_nota, k.foto_kegiatan, k.foto_barang, k.foto_bukti_transfer].filter(Boolean).join(',')
          };
        }),
        ...allBank.map(b => {
          const tglStr = String(b.waktu_transaksi || '').split('T')[0];
          return {
            uid: `BANK-${b.id}`,
            tipe: 'BANK',
            idAsli: b.id,
            tanggal_str: tglStr,
            waktu_iso: b.waktu_transaksi || `${tglStr}T00:00:00`,
            uraian: b.deskripsi || '-',
            masuk: Number(b.kredit) || 0, // Kredit pada rekening bank = uang masuk (menambah saldo)
            keluar: Number(b.debet) || 0,  // Debet pada rekening bank = uang keluar (mengurangi saldo)
            rekening_id: String(b.rekening_id || '1'),
            status: 'Selesai',
            nama_akun: b.ref_akun?.nama_akun || '-',
            keterangan_tambahan: b.noref_bank ? `No. Ref: ${b.noref_bank}` : '',
            foto: b.foto_bukti || ''
          };
        })
      ];

      // D. Urutkan berdasarkan tanggal & waktu secara Kronologis Ascending untuk running balance
      combined.sort((a, b) => {
        if (a.tanggal_str !== b.tanggal_str) {
          return a.tanggal_str.localeCompare(b.tanggal_str);
        }
        return (a.waktu_iso || '').localeCompare(b.waktu_iso || '');
      });

      // E. Kalkulasi Saldo Berjalan & Saldo Awal Berdasarkan Rentang Tanggal
      let berjalan = 0;
      let totalIncomePeriod = 0;
      let totalExpensePeriod = 0;
      let saldoAwalPeriod = 0;

      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;

      const processedTrx = combined.map(trx => {
        // Cek filter rekening
        const matchRekening = rekeningPilih === 'ALL' || trx.rekening_id === rekeningPilih;
        
        if (matchRekening) {
          // Jika transaksi sebelum periode mulai, akumulasikan ke Saldo Awal
          if (trx.tanggal_str < startDate) {
            saldoAwalPeriod += (trx.masuk - trx.keluar);
          }
          // Update saldo berjalan kumulatif
          berjalan += (trx.masuk - trx.keluar);
        }

        return {
          ...trx,
          _saldo_berjalan: berjalan,
          matchRekening,
          inDateRange: trx.tanggal_str >= startDate && trx.tanggal_str <= endDate
        };
      });

      // F. Saring transaksi yang masuk dalam periode terpilih dan sesuai rekening
      const filtered = processedTrx.filter(t => t.matchRekening && t.inDateRange);

      filtered.forEach(t => {
        totalIncomePeriod += t.masuk;
        totalExpensePeriod += t.keluar;
      });

      setDataStats({
        income: totalIncomePeriod,
        expense: totalExpensePeriod,
        balance: totalIncomePeriod - totalExpensePeriod,
        initialBalance: saldoAwalPeriod
      });

      // Urutkan transaksi aktif dari yang paling baru (Descending) untuk tabel
      setAllFilteredTransactions([...filtered].reverse());

    } catch (err: any) {
      console.error("Gagal menarik data laporan:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, rekeningPilih]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Search Filter pada transaksi periode aktif
  const displayedTransactions = useMemo(() => {
    if (!searchQuery.trim()) return allFilteredTransactions;
    const q = searchQuery.toLowerCase().trim();
    return allFilteredTransactions.filter(trx => 
      trx.uraian?.toLowerCase().includes(q) ||
      trx.nama_akun?.toLowerCase().includes(q) ||
      trx.keterangan_tambahan?.toLowerCase().includes(q) ||
      trx.status?.toLowerCase().includes(q) ||
      rekeningMap[trx.rekening_id]?.toLowerCase().includes(q)
    );
  }, [allFilteredTransactions, searchQuery, rekeningMap]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, rekeningPilih, itemsPerPage]);

  // Pagination calculation
  const totalItems = displayedTransactions.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage) || 1;
  const currentTransactions = useMemo(() => {
    if (itemsPerPage === -1) return displayedTransactions;
    const start = (currentPage - 1) * itemsPerPage;
    return displayedTransactions.slice(start, start + itemsPerPage);
  }, [displayedTransactions, currentPage, itemsPerPage]);

  const formatRp = (angka: number) => {
    return Math.round(angka || 0).toLocaleString('id-ID');
  };

  const formatDateId = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const [y, m, d] = dateStr.split('-');
      const bln = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d} ${bln[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const rows = displayedTransactions.map((trx, idx) => ({
        'No': idx + 1,
        'Tanggal': trx.tanggal_str,
        'Sumber Rekening': rekeningMap[trx.rekening_id] || (trx.tipe === 'KAS' ? 'Kas Tunai (BKU)' : `Bank ${trx.rekening_id}`),
        'Uraian / Deskripsi': trx.uraian,
        'Akun Anggaran': trx.nama_akun,
        'Keterangan Tambahan': trx.keterangan_tambahan || '-',
        'Pemasukan (+)': trx.masuk > 0 ? trx.masuk : 0,
        'Pengeluaran (-)': trx.keluar > 0 ? trx.keluar : 0,
        'Saldo Berjalan': trx._saldo_berjalan,
        'Status': trx.status
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mutasi Kas & Bank');
      XLSX.writeFile(wb, `Laporan_Kas_Bank_${dateRange.startDate}_sd_${dateRange.endDate}.xlsx`);
    } catch (err) {
      console.error('Gagal export excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Render Lampiran Bukti
  const renderLampiranLinks = (label: string, teks: string | null) => {
    if (!teks) return null;
    const links = teks.split(',').map(s => s.trim()).filter(Boolean);
    if (links.length === 0) return null;

    return (
      <div className="w-full bg-white p-3.5 rounded-xl shadow-2xs border border-gray-100 mb-2">
        <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2.5 flex items-center gap-1.5">
          <Paperclip size={12} className="text-indigo-600" />
          <span>{label} ({links.length} Berkas)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {links.map((lnk, idx) => {
            const isGDriveFolder = lnk.includes('drive.google.com') && (lnk.includes('/folders/') || lnk.includes('folders/'));
            if (isGDriveFolder) {
              return (
                <div key={idx} className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={18} className="text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-900 truncate">Folder GDrive</p>
                      <p className="text-[10px] text-amber-700 truncate">Kumpulan berkas</p>
                    </div>
                  </div>
                  <a 
                    href={lnk} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="shrink-0 px-2 py-1 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>Buka</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              );
            }

            const safeUrl = getSafeFileUrl(lnk);
            let imgSrc = safeUrl || lnk;
            const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
            if (gdriveMatch && gdriveMatch[1]) {
              imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w800`;
            }

            return (
              <div 
                key={idx} 
                className="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 hover:border-indigo-500 transition-all shadow-2xs bg-gray-50 flex items-center justify-center aspect-[4/3] w-full" 
                onClick={() => setPreviewImage({ src: imgSrc, original: lnk })}
                title="Klik untuk pratinjau"
              >
                <img 
                  src={imgSrc} 
                  alt="Bukti Transaksi" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  onError={(e) => { 
                    (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                    (e.target as HTMLImageElement).className = 'w-12 h-12 object-contain mx-auto opacity-50';
                  }} 
                />
                <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs backdrop-blur-xs z-10">
                  🔍 Perbesar
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const resetFilters = () => {
    setDateRange({
      startDate: getLocalMonthStart(),
      endDate: getLocalToday()
    });
    setRekeningPilih('KAS');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 pb-24 font-sans text-gray-900 max-w-7xl mx-auto">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          .print-hidden { display: none !important; }
          body { background: white !important; font-size: 10px !important; }
          .print-header { display: block !important; text-align: center; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db !important; padding: 5px !important; font-size: 9px !important; color: #000 !important; }
          th { background-color: #f3f4f6 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />

      {/* 1. STANDAR PAGE HEADER */}
      <div className="print-hidden">
        <PageHeader
          title="Laporan Kas & Rekening Bank"
          subtitle="Jurnal mutasi kas kecil dan mutasi rekening bank terpadu dengan saldo berjalan, filter rekening, dan verifikasi bukti"
          icon={Building2}
          breadcrumbs={[
            { label: 'Laporan Keuangan' },
            { label: 'Mutasi Kas & Bank' }
          ]}
          badge={{ text: `${allFilteredTransactions.length} Transaksi`, variant: 'info' }}
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

      {/* 2. STATS CARDS (4 MODERN KPI SUMMARY CARDS SESUAI DESIGN SYSTEM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 print-hidden">
        <StatCard
          title="TOTAL SALDO AWAL"
          value={`Rp ${formatRp(dataStats.initialBalance)}`}
          icon={Wallet}
          subtitle={`Sebelum ${formatDateId(dateRange.startDate)}`}
          trend={{ 
            value: rekeningPilih === 'KAS' ? 'Kas Tunai' : rekeningPilih === 'ALL' ? 'Semua Rekening' : (rekeningMap[rekeningPilih] || 'Rekening Bank'), 
            isGood: true 
          }}
          variant="indigo"
          lightBg={true}
        />
        <StatCard
          title="TOTAL PEMASUKAN (+)"
          value={`Rp ${formatRp(dataStats.income)}`}
          icon={TrendingUp}
          trend={{ value: 'Kas Masuk', isUp: true, isGood: true }}
          subtitle="Penerimaan periode ini"
          variant="emerald"
          lightBg={true}
        />
        <StatCard
          title="TOTAL PENGELUARAN (-)"
          value={`Rp ${formatRp(dataStats.expense)}`}
          icon={TrendingDown}
          trend={{ value: 'Kas Keluar', isUp: false, isGood: false }}
          subtitle="Belanja & pengeluaran"
          variant="rose"
          lightBg={true}
        />
        <StatCard
          title="POSISI SALDO AKHIR"
          value={`Rp ${formatRp(dataStats.initialBalance + dataStats.balance)}`}
          icon={Coins}
          trend={{
            value: `${dataStats.balance >= 0 ? '+' : ''}Rp ${formatRp(dataStats.balance)}`,
            isUp: dataStats.balance >= 0,
            isGood: dataStats.balance >= 0
          }}
          subtitle={`Per ${formatDateId(dateRange.endDate)}`}
          variant="blue"
          lightBg={true}
        />
      </div>

      {/* 3. FILTER TOOLBAR: DATE RANGE PICKER + FILTER SUMBER REKENING + SEARCH BAR (STANDAR DESIGN SYSTEM) */}
      <div className="bg-white p-4 px-5 rounded-2xl border border-gray-200/90 shadow-2xs print-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Filter Rentang Tanggal (DateRangePicker 1x Klik) */}
          <div className="lg:col-span-4 w-full">
            <DateRangePicker
              label="Filter Rentang Tanggal (1x Klik)"
              value={dateRange}
              onChange={setDateRange}
              showTime={false}
            />
          </div>

          {/* 2. Filter Sumber Rekening (AutocompleteCombobox Design System - Default Kas Tunai) */}
          <div className="lg:col-span-4 w-full">
            <AutocompleteCombobox
              label="Sumber Rekening"
              icon={Landmark}
              placeholder="Pilih rekening kas / bank..."
              options={rekeningOptions}
              value={rekeningPilih}
              onChange={(val) => setRekeningPilih(val || 'KAS')}
            />
          </div>

          {/* 3. Pencarian Transaksi */}
          <div className="lg:col-span-3 w-full">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Search size={11} className="text-gray-400 shrink-0" />
              <span>Pencarian Transaksi</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari uraian, pihak, toko, akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* 4. Tombol Reset Filter */}
          <div className="lg:col-span-1 w-full flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={rekeningPilih === 'KAS' && !searchQuery && dateRange.startDate === getLocalMonthStart() && dateRange.endDate === getLocalToday()}
              className="w-full h-10 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset semua filter"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline lg:hidden xl:inline">Reset</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. TABEL TRANSAKSI MUTASI TERPADU */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        {/* Table Top Controls (Density Toggle & Info) */}
        <div className="p-3.5 px-5 bg-gray-50/70 border-b border-gray-200/80 flex items-center justify-between gap-3 print-hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Buku Mutasi Kas &amp; Bank
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-gray-200/80 text-gray-700 text-[10px] font-bold">
              {displayedTransactions.length} Data
            </span>
          </div>
          <div className="flex items-center gap-3">
            <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
          </div>
        </div>

        {/* Table Data Container */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <Loader2 size={36} className="animate-spin mb-2 text-indigo-600" />
              <p className="text-xs font-bold text-gray-600">Mengkonsolidasi data transaksi kas &amp; bank...</p>
            </div>
          ) : displayedTransactions.length === 0 ? (
            <EmptyState
              title="Tidak Ada Transaksi Ditemukan"
              description="Tidak ada transaksi mutasi kas atau bank pada rentang tanggal dan filter rekening yang dipilih."
              actionLabel="Reset Filter Periode"
              onAction={resetFilters}
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/90 border-b border-gray-200 text-[11px] font-black text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Tanggal</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Sumber Rekening</th>
                  <th className="py-3 px-4 min-w-[280px]">Uraian &amp; Akun Anggaran</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Pemasukan (+)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Pengeluaran (-)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Saldo Berjalan</th>
                  <th className="py-3 px-3.5 text-center w-20 print-hidden">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {currentTransactions.map((trx, index) => {
                  const noUrut = itemsPerPage === -1 ? index + 1 : (currentPage - 1) * itemsPerPage + index + 1;
                  const isExpanded = expandedRow === trx.uid;
                  const hasAttachment = Boolean(trx.foto);
                  const isBank = trx.tipe === 'BANK';
                  
                  // Deteksi status belum diverifikasi (Menunggu)
                  const isUnverified = trx.status === 'Menunggu' || (trx.tipe === 'KAS' && trx.status !== 'Disetujui' && trx.status !== 'Selesai');

                  // Density padding class
                  const pyClass = tableDensity === 'compact' ? 'py-2' : 'py-3.5';

                  return (
                    <React.Fragment key={trx.uid}>
                      <tr className={`transition-colors group ${
                        isUnverified 
                          ? 'bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500' 
                          : 'hover:bg-indigo-50/30'
                      }`}>
                        {/* No */}
                        <td className={`${pyClass} px-3.5 text-center text-gray-400 font-mono text-[11px]`}>
                          {noUrut}
                        </td>

                        {/* Tanggal */}
                        <td className={`${pyClass} px-3.5 whitespace-nowrap font-mono font-bold text-gray-800 text-[11px]`}>
                          {formatDateId(trx.tanggal_str)}
                        </td>

                        {/* Sumber Rekening & ID DB */}
                        <td className={`${pyClass} px-3.5 whitespace-nowrap`}>
                          <div className="space-y-1">
                            {isBank ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10.5px] shadow-2xs">
                                <Landmark size={11} className="text-indigo-600 shrink-0" />
                                <span>{rekeningMap[trx.rekening_id] || `Bank ${trx.rekening_id}`}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10.5px] shadow-2xs">
                                <Wallet size={11} className="text-emerald-600 shrink-0" />
                                <span>Kas Tunai (BKU)</span>
                              </span>
                            )}
                            <div>
                              <span className="inline-block text-[10px] font-mono font-bold text-gray-500 bg-gray-100/90 px-1.5 py-0.5 rounded border border-gray-200/90">
                                ID DB: #{trx.idAsli}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Uraian & Akun Anggaran (Wrap Text Penuh & Badge Menunggu) */}
                        <td className={`${pyClass} px-4`}>
                          <div className="space-y-1 max-w-[340px] whitespace-normal break-words">
                            {isUnverified && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black tracking-wide shadow-2xs">
                                  ● Menunggu
                                </span>
                                <span className="text-[10px] text-rose-600 font-semibold italic">
                                  Belum Diverifikasi
                                </span>
                              </div>
                            )}
                            <p className="font-bold text-gray-900 leading-snug">
                              {trx.uraian}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              {trx.nama_akun && trx.nama_akun !== '-' && (
                                <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                                  {trx.nama_akun}
                                </span>
                              )}
                              {trx.keterangan_tambahan && (
                                <span className="text-gray-400 italic">
                                  {trx.keterangan_tambahan}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Pemasukan */}
                        <td className={`${pyClass} px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap text-xs`}>
                          {trx.masuk > 0 ? `Rp ${formatRp(trx.masuk)}` : '-'}
                        </td>

                        {/* Pengeluaran */}
                        <td className={`${pyClass} px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap text-xs`}>
                          {trx.keluar > 0 ? `Rp ${formatRp(trx.keluar)}` : '-'}
                        </td>

                        {/* Saldo Berjalan */}
                        <td className={`${pyClass} px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap text-xs bg-slate-50/50`}>
                          Rp {formatRp(trx._saldo_berjalan)}
                        </td>

                        {/* Bukti Lampiran Action */}
                        <td className={`${pyClass} px-3.5 text-center whitespace-nowrap print-hidden`}>
                          {hasAttachment ? (
                            <button
                              type="button"
                              onClick={() => setExpandedRow(isExpanded ? null : trx.uid)}
                              className={`h-7 px-2 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs border ${
                                isExpanded 
                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                  : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                              title="Lihat lampiran bukti"
                            >
                              <Paperclip size={11} />
                              <span>Bukti</span>
                              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[10px] italic">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Row Accordion Lampiran Bukti */}
                      {isExpanded && hasAttachment && (
                        <tr className="bg-gray-50/80 border-b border-gray-200 print-hidden animate-in fade-in duration-150">
                          <td colSpan={8} className="p-4 px-6">
                            {renderLampiranLinks('Lampiran Berkas & Bukti Transaksi', trx.foto)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 5. TABLE PAGINATION FOOTER */}
        {displayedTransactions.length > 0 && (
          <div className="print-hidden">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 6. MODAL PRATINJAU GAMBAR LAYAR PENUH (LIGHTBOX) */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            type="button"
            className="absolute top-6 right-6 text-white bg-white/20 hover:bg-rose-600 p-2.5 rounded-full transition-colors font-bold cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <X size={20} />
          </button>
          
          <p className="absolute top-6 left-6 text-white font-bold bg-black/50 px-4 py-2 rounded-xl text-xs">
            Klik di mana saja untuk menutup
          </p>

          <div className="relative max-w-full max-h-[85vh] flex justify-center w-full">
            <img 
              src={previewImage.src} 
              alt="Bukti Lampiran" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-4 ring-white/10" 
              onClick={(e) => e.stopPropagation()} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                (e.target as HTMLImageElement).className = 'max-w-[200px] opacity-40 mx-auto';
              }} 
            />
          </div>

          <a 
            href={previewImage.original} 
            target="_blank" 
            rel="noreferrer" 
            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-lg flex items-center gap-2" 
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} /> 
            <span>Buka Berkas Asli di Tab Baru</span>
          </a>
        </div>
      )}

    </div>
  );
}
