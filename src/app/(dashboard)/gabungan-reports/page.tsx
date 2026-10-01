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
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import TablePagination from '@/components/shared/TablePagination';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import ExportButtons from '@/components/shared/ExportButtons';
import EmptyState from '@/components/shared/EmptyState';

// Helper: Nama Bulan
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function GabunganReportsPage() {
  const tglSekarang = new Date();
  const [bulanPilih, setBulanPilih] = useState(tglSekarang.getMonth() + 1);
  const [tahunPilih, setTahunPilih] = useState(tglSekarang.getFullYear());
  const [rekeningPilih, setRekeningPilih] = useState('ALL'); // ALL, KAS, atau ID Rekening Bank
  const [searchQuery, setSearchQuery] = useState('');
  
  const [dataStats, setDataStats] = useState({ income: 0, expense: 0, balance: 0, initialBalance: 0 });
  const [allFilteredTransactions, setAllFilteredTransactions] = useState<any[]>([]);
  const [rekeningList, setRekeningList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Design System States
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Expanded Row for Lampiran Bukti
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string, original: string } | null>(null);

  // Fetch Rekening Master
  useEffect(() => {
    const fetchRekening = async () => {
      const { data } = await supabase.from('ref_rekening').select('*');
      if (data) setRekeningList(data);
    };
    fetchRekening();
  }, []);

  const rekeningMap = useMemo(() => {
    const map: Record<string, string> = {};
    rekeningList.forEach(r => {
      map[String(r.id)] = r.nama_rekening || r.nama || (r.no_rekening ? `Rek. ${r.no_rekening}` : `Bank ${r.id}`);
    });
    return map;
  }, [rekeningList]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setCurrentPage(1); // Reset page
    try {
      // 1. Ambil SEMUA transaksi KAS (transactions)
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
        } else { isSelesaiKas = true; }
      }

      // 2. Ambil SEMUA transaksi BANK (bank_transactions)
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
        } else { isSelesaiBank = true; }
      }

      // 3. Gabungkan Data (Standardisasi Format)
      const combined = [
        ...allKas.map(k => ({
          uid: `KAS-${k.id}`,
          tipe: 'KAS',
          idAsli: k.id,
          tanggal: new Date(k.tanggal),
          uraian: k.uraian,
          masuk: Number(k.uang_masuk) || 0,
          keluar: Number(k.uang_keluar) || 0,
          rekening_id: 'KAS',
          status: k.disetujui || 'Selesai',
          nama_akun: k.ref_akun?.nama_akun || '-',
          keterangan_tambahan: `Personel: ${k.ref_personel?.nama_orang || '-'}, Toko: ${k.toko || '-'}`,
          foto: [k.foto_nota, k.foto_kegiatan, k.foto_barang, k.foto_bukti_transfer].filter(Boolean).join(',')
        })),
        ...allBank.map(b => ({
          uid: `BANK-${b.id}`,
          tipe: 'BANK',
          idAsli: b.id,
          tanggal: new Date(b.waktu_transaksi),
          uraian: b.deskripsi,
          masuk: Number(b.kredit) || 0, // Kredit bank = uang masuk (menambah saldo)
          keluar: Number(b.debet) || 0, // Debet bank = uang keluar (mengurangi saldo)
          rekening_id: b.rekening_id?.toString() || 'BANK',
          status: 'Selesai',
          nama_akun: b.ref_akun?.nama_akun || '-',
          keterangan_tambahan: `Ref: ${b.noref_bank || '-'}`,
          foto: b.foto_bukti || ''
        }))
      ];

      // 4. Urutkan berdasarkan waktu secara Ascending untuk hitung saldo berjalan
      combined.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

      // 5. Kalkulasi Saldo Berjalan & Filter Rekening + Waktu
      let berjalan = 0; 
      let totalIncomeBulanIni = 0;
      let totalExpenseBulanIni = 0;
      let saldoAwalBulan = 0;

      const processedTrx = combined.map(trx => {
        const tTahun = trx.tanggal.getFullYear();
        const tBulan = trx.tanggal.getMonth() + 1;

        // Filter Rekening (Jika ALL, dihitung semua. Jika spesifik, saldo berjalan hanya dari rekening itu)
        const matchRekening = rekeningPilih === 'ALL' || trx.rekening_id === rekeningPilih;
        
        if (matchRekening) {
          const isBeforeTargetMonth = tTahun < tahunPilih || (tTahun === tahunPilih && tBulan < bulanPilih);
          if (isBeforeTargetMonth) {
            saldoAwalBulan = berjalan + trx.masuk - trx.keluar; 
          }
          berjalan += trx.masuk - trx.keluar;
        }

        return { ...trx, _saldo_berjalan: berjalan, _tahun: tTahun, _bulan: tBulan, matchRekening };
      });

      // 6. Saring transaksi untuk Tampilan (Hanya Bulan, Tahun & Rekening yg dipilih)
      const filtered = processedTrx.filter(t => t._tahun === tahunPilih && t._bulan === bulanPilih && t.matchRekening);
      
      filtered.forEach(t => {
        totalIncomeBulanIni += t.masuk;
        totalExpenseBulanIni += t.keluar;
      });

      setDataStats({ 
        income: totalIncomeBulanIni, 
        expense: totalExpenseBulanIni, 
        balance: totalIncomeBulanIni - totalExpenseBulanIni,
        initialBalance: saldoAwalBulan 
      });
      
      // Reverse untuk menampilkan dari yang terbaru di paling atas
      setAllFilteredTransactions([...filtered].reverse());

    } catch (err) {
      console.error("Gagal menarik laporan gabungan", err);
    } finally {
      setLoading(false);
    }
  }, [bulanPilih, tahunPilih, rekeningPilih]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Search Filter on active month transactions
  const displayedTransactions = useMemo(() => {
    if (!searchQuery.trim()) return allFilteredTransactions;
    const q = searchQuery.toLowerCase().trim();
    return allFilteredTransactions.filter(trx => 
      trx.uraian?.toLowerCase().includes(q) ||
      trx.nama_akun?.toLowerCase().includes(q) ||
      trx.keterangan_tambahan?.toLowerCase().includes(q) ||
      trx.status?.toLowerCase().includes(q)
    );
  }, [allFilteredTransactions, searchQuery]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, bulanPilih, tahunPilih, rekeningPilih, itemsPerPage]);

  // Pagination calculation
  const totalItems = displayedTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const currentTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayedTransactions.slice(start, start + itemsPerPage);
  }, [displayedTransactions, currentPage, itemsPerPage]);

  // Export Excel
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const rows = displayedTransactions.map((trx, idx) => ({
        'No': idx + 1,
        'Sumber Rekening': trx.tipe === 'BANK' ? (rekeningMap[trx.rekening_id] || `Bank ${trx.rekening_id}`) : 'Kas Tunai (BKU)',
        'Tanggal': trx.tanggal.toLocaleDateString('id-ID'),
        'Uraian / Deskripsi': trx.uraian,
        'Akun Anggaran': trx.nama_akun,
        'Keterangan Tambahan': trx.keterangan_tambahan,
        'Pemasukan (+)': trx.masuk > 0 ? trx.masuk : 0,
        'Pengeluaran (-)': trx.keluar > 0 ? trx.keluar : 0,
        'Saldo Berjalan': trx._saldo_berjalan,
        'Status Verifikasi': trx.status
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Gabungan');
      XLSX.writeFile(wb, `Laporan_Gabungan_${BULAN[bulanPilih - 1]}_${tahunPilih}.xlsx`);
    } catch (err) {
      console.error('Gagal export excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const renderLampiranLinks = (label: string, teks: string | null) => {
    if (!teks) return null;
    const links = teks.split(',').map(s => s.trim()).filter(s => s);
    if (links.length === 0) return null;
    
    return (
      <div className="w-full bg-white p-4 rounded-xl shadow-2xs border border-gray-100 mb-2">
        <p className="text-[11px] font-black uppercase text-gray-500 tracking-wider mb-3">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {links.map((lnk, idx) => {
            // Deteksi tautan folder Google Drive
            const isGDriveFolder = lnk.includes('drive.google.com') && (lnk.includes('/folders/') || lnk.includes('folders/'));
            if (isGDriveFolder) {
              return (
                <div key={idx} className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={20} className="text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-900 truncate">Folder Google Drive</p>
                      <p className="text-[10px] text-amber-700 truncate">Kumpulan nota transaksi</p>
                    </div>
                  </div>
                  <a 
                    href={lnk} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="shrink-0 px-2.5 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>Buka</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              );
            }

            let imgSrc = lnk;
            const isGDrive = lnk.match(/drive\.google\.com/);
            const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
            if (gdriveMatch && gdriveMatch[1]) {
              imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w800`;
            }

            return (
              <div 
                key={idx} 
                className="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 hover:border-indigo-500 transition-all shadow-2xs bg-gray-50 flex items-center justify-center aspect-[4/3] w-full" 
                onClick={() => setPreviewImage({ src: imgSrc, original: lnk })}
              >
                <img 
                  src={imgSrc} 
                  alt="Bukti Transaksi" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  onError={(e) => { 
                    (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                    (e.target as HTMLImageElement).className = 'w-14 h-14 object-contain mx-auto opacity-50';
                  }} 
                />
                <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-xs backdrop-blur-xs z-10">
                  🔍 Perbesar Gambar
                </div>
                {isGDrive && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] px-2 py-0.5 font-black rounded-bl-lg z-0 shadow-2xs">
                    GDRIVE
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const resetFilters = () => {
    setBulanPilih(tglSekarang.getMonth() + 1);
    setTahunPilih(tglSekarang.getFullYear());
    setRekeningPilih('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 pb-24 font-sans text-gray-900">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          .print-hidden { display: none !important; }
          body { background: white !important; font-size: 10px !important; }
          .print-header { display: block !important; text-align: center; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #d1d5db !important; padding: 5px !important; font-size: 9px !important; color: #000 !important; }
          th { background-color: #f3f4f6 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-full-table { display: table-row-group !important; }
          .web-paged-table { display: none !important; }
        }
      `}} />

      {/* 1. STANDAR PAGE HEADER (DESIGN SYSTEM) */}
      <div className="print-hidden">
        <PageHeader
          title="Laporan Gabungan (Bank + Kas)"
          subtitle="Konsolidasi mutasi kas kecil dan transaksi rekening bank dengan verifikasi bukti & paging terpadu"
          icon={Building2}
          breadcrumbs={[
            { label: 'Laporan Keuangan' },
            { label: 'Laporan Gabungan' }
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

      {/* 2. STATCARDS KPI METRICS (DESIGN SYSTEM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print-hidden">
        <StatCard
          title="Saldo Awal Bulan"
          value={`Rp ${dataStats.initialBalance.toLocaleString('id-ID')}`}
          subtitle={`Posisi 1 ${BULAN[bulanPilih - 1]} ${tahunPilih}`}
          icon={Building2}
          variant="blue"
        />
        <StatCard
          title="Total Masuk Bulan Ini"
          value={`Rp ${dataStats.income.toLocaleString('id-ID')}`}
          subtitle="Kas & Bank (+)"
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Total Keluar Bulan Ini"
          value={`Rp ${dataStats.expense.toLocaleString('id-ID')}`}
          subtitle="Kas & Bank (-)"
          icon={TrendingDown}
          variant="rose"
        />
        <StatCard
          title="Sisa Saldo Akhir"
          value={`Rp ${(dataStats.initialBalance + dataStats.balance).toLocaleString('id-ID')}`}
          subtitle="Posisi Gabungan Berjalan"
          icon={Coins}
          variant="indigo"
        />
      </div>

      {/* 3. INTERACTIVE FILTER CONSOLE (DESIGN SYSTEM) */}
      <div className="print-hidden bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-blue-600" />
            <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Filter Konsolidasi Laporan
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">Kerapatan:</span>
              <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
            </div>

            {(searchQuery || rekeningPilih !== 'ALL') && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                title="Reset Filter"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
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
                placeholder="Cari uraian / nama akun..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-xs font-semibold bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Sumber Dana / Rekening */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Sumber Rekening / Kas
            </label>
            <select
              value={rekeningPilih}
              onChange={e => setRekeningPilih(e.target.value)}
              className="w-full h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">Semua Sumber Dana</option>
              <option value="KAS">Hanya Kas Tunai (BKU)</option>
              {rekeningList.map(r => (
                <option key={r.id} value={String(r.id)}>
                  {r.nama_rekening || r.nama || (r.no_rekening ? `Rek. ${r.no_rekening}` : `Bank Rekening ${r.id}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Bulan */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Bulan Transaksi
            </label>
            <select
              value={bulanPilih}
              onChange={e => setBulanPilih(Number(e.target.value))}
              className="w-full h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all"
            >
              {BULAN.map((b, i) => (
                <option key={i} value={i + 1}>{b}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Tahun Transaksi
            </label>
            <input
              type="number"
              value={tahunPilih}
              onChange={e => setTahunPilih(Number(e.target.value))}
              className="w-full h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              min={2000}
              max={2100}
            />
          </div>
        </div>
      </div>

      {/* PRINT HEADER ONLY */}
      <div className="hidden print-header">
        <h1 className="text-xl font-black uppercase tracking-widest text-gray-900">
          LAPORAN GABUNGAN REKENING & KAS
        </h1>
        <p className="text-xs font-semibold mt-1 text-gray-600">
          Periode: {BULAN[bulanPilih - 1]} {tahunPilih} | Sumber Dana: {rekeningPilih === 'ALL' ? 'Semua Sumber Dana' : rekeningPilih === 'KAS' ? 'Kas Tunai (BKU)' : rekeningMap[rekeningPilih] || `Bank ${rekeningPilih}`}
        </p>
      </div>

      {/* 4. DATA TABLE (DESIGN SYSTEM & MANDATORY NOMINAL SATU BARIS) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-blue-600 space-y-3 bg-white rounded-2xl border border-gray-200/90 p-8 shadow-2xs">
          <Loader2 size={36} className="animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-gray-500">Menggabungkan data kas dan mutasi bank...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-black uppercase tracking-wider">
                  <th className={`w-20 text-center ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Sumber</th>
                  <th className={`w-28 ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Tanggal</th>
                  <th className={`${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Uraian / Deskripsi</th>
                  {/* CRITICAL: NOMINAL HEADER & DATA STRICTLY ONE LINE */}
                  <th className={`text-right w-44 whitespace-nowrap ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-4'}`}>
                    Nominal
                  </th>
                  <th className={`text-right w-40 whitespace-nowrap bg-indigo-50/50 ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-4'}`}>
                    Saldo Berjalan
                  </th>
                  <th className={`text-center w-24 print:hidden ${tableDensity === 'compact' ? 'py-2 px-2.5' : 'py-3 px-3'}`}>Bukti</th>
                </tr>
              </thead>

              {/* WEB PAGED TABLE BODY */}
              <tbody className="divide-y divide-gray-100 web-paged-table">
                {currentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState
                        type="search"
                        title="Tidak Ada Transaksi"
                        description={`Tidak ditemukan transaksi pada bulan ${BULAN[bulanPilih - 1]} ${tahunPilih} untuk filter yang Anda terapkan.`}
                        actionLabel="Bersihkan Filter"
                        onAction={resetFilters}
                      />
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((trx) => {
                    const isExpanded = expandedRow === trx.uid;
                    const isPemasukan = trx.masuk > 0;
                    const nominal = isPemasukan ? trx.masuk : trx.keluar;
                    const isSah = trx.status === 'Selesai' || trx.status === 'Disetujui';
                    const rowBgClass = isSah 
                      ? 'hover:bg-blue-50/40 transition-colors even:bg-slate-50/30' 
                      : 'bg-rose-50/30 hover:bg-rose-50/50 transition-colors';

                    return (
                      <React.Fragment key={trx.uid}>
                        <tr className={`${rowBgClass} ${tableDensity === 'compact' ? 'text-[11px]' : 'text-xs'}`}>
                          {/* Sumber Rekening */}
                          <td className={`text-center ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                              trx.tipe === 'BANK' 
                                ? 'bg-sky-50 text-sky-700 border-sky-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {trx.tipe === 'BANK' ? (rekeningMap[trx.rekening_id] || `Bank ${trx.rekening_id}`) : 'Kas'}
                            </span>
                          </td>

                          {/* Tanggal */}
                          <td className={`whitespace-nowrap font-medium text-gray-700 ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                            {trx.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Uraian */}
                          <td className={`${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-3'}`}>
                            <div className="flex items-center gap-2">
                              <p className={`font-bold ${isSah ? 'text-gray-900' : 'text-rose-900'}`}>{trx.uraian}</p>
                              {!isSah && (
                                <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase border border-rose-200">
                                  {trx.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] text-gray-500 font-semibold">
                              <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                🏷️ {trx.nama_akun}
                              </span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                {trx.keterangan_tambahan}
                              </span>
                            </div>
                          </td>

                          {/* CRITICAL: NOMINAL SATU BARIS (WHITESPACE-NOWRAP & INLINE-BLOCK) */}
                          <td className={`text-right font-black font-mono whitespace-nowrap ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-4'}`}>
                            <span className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              isPemasukan 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {isPemasukan ? '+' : '-'} Rp {nominal.toLocaleString('id-ID')}
                            </span>
                          </td>

                          {/* Saldo Berjalan (Juga Satu Baris) */}
                          <td className={`text-right font-black text-indigo-700 bg-indigo-50/30 whitespace-nowrap font-mono ${tableDensity === 'compact' ? 'py-1.5 px-2.5' : 'py-2.5 px-4'}`}>
                            Rp {trx._saldo_berjalan.toLocaleString('id-ID')}
                          </td>

                          {/* Bukti Tombol */}
                          <td className={`text-center print:hidden ${tableDensity === 'compact' ? 'py-1.5 px-2' : 'py-2.5 px-3'}`}>
                            <button 
                              type="button"
                              onClick={() => setExpandedRow(isExpanded ? null : trx.uid)} 
                              className={`h-7 px-2.5 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer ${
                                isExpanded 
                                  ? 'bg-blue-600 text-white shadow-2xs' 
                                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              <span>Bukti</span> 
                              {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                            </button>
                            {trx.foto && !isExpanded && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1"></span>
                            )}
                          </td>
                        </tr>

                        {/* Panel Collapsible Foto Bukti */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-t border-gray-100 print:hidden">
                            <td colSpan={6} className="p-4">
                              <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                  <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                                    <FolderOpen size={14} className="text-blue-600" />
                                    <span>Lampiran Dokumen Transaksi ({trx.uid})</span>
                                  </h4>
                                  <button 
                                    onClick={() => setExpandedRow(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                {trx.foto ? renderLampiranLinks("Bukti Lampiran Fisik", trx.foto) : (
                                  <div className="text-center py-4 text-gray-400 font-semibold italic text-xs">
                                    Tidak ada lampiran fisik atau foto bukti tersimpan.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>

              {/* PRINT FULL TABLE BODY */}
              <tbody className="hidden print-full-table divide-y divide-gray-200">
                {displayedTransactions.map((trx, idx) => {
                  const isPemasukan = trx.masuk > 0;
                  const nominal = isPemasukan ? trx.masuk : trx.keluar;
                  return (
                    <tr key={`print-${trx.uid}`}>
                      <td className="text-center font-bold">
                        {trx.tipe === 'BANK' ? (rekeningMap[trx.rekening_id] || `Bank ${trx.rekening_id}`) : 'Kas'}
                      </td>
                      <td className="whitespace-nowrap">
                        {trx.tanggal.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className="font-bold">{trx.uraian}</span>
                        <div className="text-[8px] text-gray-500">{trx.nama_akun} | {trx.keterangan_tambahan}</div>
                      </td>
                      <td className="text-right font-mono font-bold whitespace-nowrap">
                        {isPemasukan ? '+' : '-'} Rp {nominal.toLocaleString('id-ID')}
                      </td>
                      <td className="text-right font-mono font-bold whitespace-nowrap">
                        Rp {trx._saldo_berjalan.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
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
                pageSizeOptions={[25, 50, 100, 200]}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal Gambar Layar Penuh (Design System) */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 transition-all" 
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-rose-600 p-2.5 rounded-full transition-all cursor-pointer font-bold"
            onClick={() => setPreviewImage(null)}
          >
            <X size={20} />
          </button>
          <div className="relative max-w-full max-h-[85vh] flex justify-center w-full">
            <img 
              src={previewImage.src} 
              alt="Preview Bukti" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl ring-4 ring-white/10" 
              onClick={(e) => e.stopPropagation()} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                (e.target as HTMLImageElement).className = 'max-w-[200px] opacity-30 mx-auto';
              }} 
            />
          </div>
          <a 
            href={previewImage.original} 
            target="_blank" 
            rel="noreferrer" 
            className="mt-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 text-xs" 
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
            <span>Buka Tautan Asli / Google Drive Berkualitas Tinggi</span>
          </a>
        </div>
      )}
    </div>
  );
}
