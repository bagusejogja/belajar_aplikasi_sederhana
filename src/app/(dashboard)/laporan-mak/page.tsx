'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileSpreadsheet, 
  Printer, 
  RotateCcw, 
  Calendar, 
  Landmark, 
  FolderTree, 
  Search, 
  ChevronDown, 
  ChevronUp,
  ChevronRight, 
  ChevronsUpDown, 
  Layers, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Coins, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  X,
  Loader2,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import * as XLSX from 'xlsx';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import ExportButtons from '@/components/shared/ExportButtons';
import AutocompleteCombobox, { ComboboxOption } from '@/components/shared/AutocompleteCombobox';
import MonthRangePicker, { MonthRange } from '@/components/shared/MonthRangePicker';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import EmptyState from '@/components/shared/EmptyState';

// Helper Format Rupiah tanpa desimal sesuai standar Design System
const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString('id-ID');

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

// Standar Nomenklatur Golongan MAK (UGM / Masjid)
const GOLONGAN_MAK_NAMES: Record<string, string> = {
  '11': 'Kas & Setara Kas',
  '12': 'Piutang & Uang Muka Kegiatan',
  '41': 'Penerimaan Infaq, Wakaf & Kerjasama',
  '42': 'Penerimaan Usaha & Bagi Hasil',
  '43': 'Penerimaan Bank & Jasa Giro',
  '51': 'Bisyaroh & Tunjangan Takmir/Petugas',
  '52': 'Kerumahtanggaan, Konsumsi & Operasional',
  '53': 'Pemeliharaan, Perbaikan & Gedung',
  '54': 'Perjalanan Dinas & Akomodasi',
  '55': 'Pembelian Aset & Inventaris',
  '90': 'Koreksi & Transaksi Antar Kas',
};

// Opsi Pilihan Periode
const PERIODE_OPTIONS: ComboboxOption[] = [
  { value: 'ALL', label: 'Tahun Anggaran Penuh (12 Bulan)', badge: 'Tahunan' },
  { value: 'Q1', label: 'Triwulan I (Januari - Maret)', badge: 'Triwulan' },
  { value: 'Q2', label: 'Triwulan II (April - Juni)', badge: 'Triwulan' },
  { value: 'Q3', label: 'Triwulan III (Juli - September)', badge: 'Triwulan' },
  { value: 'Q4', label: 'Triwulan IV (Oktober - Desember)', badge: 'Triwulan' },
  { value: 'S1', label: 'Semester I (Januari - Juni)', badge: 'Semester' },
  { value: 'S2', label: 'Semester II (Juli - Desember)', badge: 'Semester' },
  { value: 'M01', label: 'Bulan Januari', badge: 'Jan' },
  { value: 'M02', label: 'Bulan Februari', badge: 'Feb' },
  { value: 'M03', label: 'Bulan Maret', badge: 'Mar' },
  { value: 'M04', label: 'Bulan April', badge: 'Apr' },
  { value: 'M05', label: 'Bulan Mei', badge: 'Mei' },
  { value: 'M06', label: 'Bulan Juni', badge: 'Jun' },
  { value: 'M07', label: 'Bulan Juli', badge: 'Jul' },
  { value: 'M08', label: 'Bulan Agustus', badge: 'Ags' },
  { value: 'M09', label: 'Bulan September', badge: 'Sep' },
  { value: 'M10', label: 'Bulan Oktober', badge: 'Okt' },
  { value: 'M11', label: 'Bulan November', badge: 'Nov' },
  { value: 'M12', label: 'Bulan Desember', badge: 'Des' },
];

export default function LaporanMakPage() {
  const [loading, setLoading] = useState(true);
  const [allTrx, setAllTrx] = useState<any[]>([]);
  const [allBank, setAllBank] = useState<any[]>([]);
  const [allAkun, setAllAkun] = useState<any[]>([]);
  const [allRekening, setAllRekening] = useState<any[]>([]);

  // Filter States
  const [tahun, setTahun] = useState<number>(2026);
  const [monthRange, setMonthRange] = useState<MonthRange>({
    startMonth: '2026-01',
    endMonth: '2026-12',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  });

  const handleMonthRangeChange = (newRange: MonthRange) => {
    setMonthRange(newRange);
    const newYear = parseInt(newRange.startMonth.split('-')[0], 10);
    if (!isNaN(newYear) && newYear !== tahun) {
      setTahun(newYear);
    }
  };
  const [selectedRekening, setSelectedRekening] = useState<string>('ALL');
  const [selectedMakGroup, setSelectedMakGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI States
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [hierarchyLevel, setHierarchyLevel] = useState<number>(4);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [showCharts, setShowCharts] = useState(true);

  // 1. Fetch Seluruh Transaksi & Master
  const fetchAllPages = async (queryBuilder: any, pageSize = 1000) => {
    let allData: any[] = [];
    let from = 0;
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [trxData, bankData, akunData, rekData] = await Promise.all([
        fetchAllPages(
          supabase
            .from('transactions')
            .select('*, ref_akun(nomor_akun, nama_akun)')
            .neq('disetujui', 'Ditolak')
            .order('tanggal', { ascending: true })
            .order('id', { ascending: true })
        ),
        fetchAllPages(
          supabase
            .from('bank_transactions')
            .select('*')
            .order('waktu_transaksi', { ascending: true })
            .order('id', { ascending: true })
        ),
        fetchAllPages(
          supabase
            .from('ref_akun')
            .select('*')
            .order('nomor_akun', { ascending: true })
        ),
        fetchAllPages(
          supabase
            .from('ref_rekening')
            .select('*')
            .order('id', { ascending: true })
        ),
      ]);

      setAllTrx(trxData);
      setAllBank(bankData);
      setAllAkun(akunData);
      setAllRekening(rekData);
    } catch (err) {
      console.error('Gagal mengambil data laporan MAK:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Daftar Pilihan Sumber Rekening
  const rekeningOptions = useMemo<ComboboxOption[]>(() => {
    const opts: ComboboxOption[] = [
      { value: 'ALL', label: 'Semua Rekening (Kas + Bank)', badge: 'Semua' },
      { value: 'KAS', label: 'Kas Tunai / Kas Kecil', badge: 'Kas' },
    ];
    allRekening.forEach((r) => {
      const bankName = r.nama_bank || 'Bank';
      const noRek = r.nomor_rekening ? ` - ${r.nomor_rekening}` : '';
      opts.push({
        value: String(r.id),
        label: `${bankName}${noRek}`,
        badge: bankName,
        subtext: r.nomor_rekening ? `No. Rek: ${r.nomor_rekening}` : undefined,
      });
    });
    return opts;
  }, [allRekening]);

  // 3. Daftar Pilihan Golongan MAK
  const makGroupOptions = useMemo<ComboboxOption[]>(() => {
    const opts: ComboboxOption[] = [
      { value: 'ALL', label: 'Semua Kelompok MAK (Belanja & Pendapatan)', badge: 'Semua' },
      { value: '51', label: 'MAK 51 - Bisyaroh & Tunjangan Takmir/Petugas', badge: 'Belanja' },
      { value: '52', label: 'MAK 52 - Kerumahtanggaan, Konsumsi & Operasional', badge: 'Belanja' },
      { value: '53', label: 'MAK 53 - Pemeliharaan, Perbaikan & Gedung', badge: 'Belanja' },
      { value: '54', label: 'MAK 54 - Perjalanan Dinas & Akomodasi', badge: 'Belanja' },
      { value: '55', label: 'MAK 55 - Pembelian Aset & Inventaris', badge: 'Belanja' },
      { value: '41', label: 'MAK 41 - Penerimaan Infaq, Wakaf & Kerjasama', badge: 'Penerimaan' },
      { value: '42', label: 'MAK 42 - Penerimaan Usaha & Bagi Hasil', badge: 'Penerimaan' },
      { value: '43', label: 'MAK 43 - Penerimaan Bank & Jasa Giro', badge: 'Penerimaan' },
    ];
    return opts;
  }, []);

  // 4. Kalkulasi Bulan Aktif Berdasarkan Filter Periode MonthRangePicker (Tanpa Tanggal)
  const targetMonths = useMemo<number[]>(() => {
    if (!monthRange?.startMonth || !monthRange?.endMonth) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
    const [sY, sM] = monthRange.startMonth.split('-').map(Number);
    const [eY, eM] = monthRange.endMonth.split('-').map(Number);

    const months: number[] = [];
    for (let y = sY; y <= eY; y++) {
      if (y === tahun) {
        const start = y === sY ? sM : 1;
        const end = y === eY ? eM : 12;
        for (let m = start; m <= end; m++) {
          months.push(m);
        }
      }
    }
    return months.length > 0 ? months : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [monthRange, tahun]);

  // Label periode terpilih untuk cetak dan judul (Format Bulan & Tahun Baku)
  const labelPeriodeTerpilih = useMemo(() => {
    if (!monthRange?.startMonth || !monthRange?.endMonth) return `Tahun Anggaran ${tahun}`;
    const [sY, sM] = monthRange.startMonth.split('-');
    const [eY, eM] = monthRange.endMonth.split('-');
    const MONTH_NAMES_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const sName = MONTH_NAMES_ID[parseInt(sM, 10) - 1] || sM;
    const eName = MONTH_NAMES_ID[parseInt(eM, 10) - 1] || eM;

    if (monthRange.startMonth === monthRange.endMonth) {
      return `${sName} ${sY}`;
    }
    if (sY === eY) {
      return `${sName} — ${eName} ${sY}`;
    }
    return `${sName} ${sY} — ${eName} ${eY}`;
  }, [monthRange, tahun]);

  // 5. Data Processing: Hitung Saldo Awal, Realisasi Periode, & Kelompok MAK
  const { 
    makTree, 
    totalIncome, 
    totalExpense, 
    saldoAwal, 
    saldoAkhir, 
    totalTransaksi 
  } = useMemo(() => {
    if (loading) {
      return { 
        makTree: [], 
        totalIncome: 0, 
        totalExpense: 0, 
        saldoAwal: 0, 
        saldoAkhir: 0, 
        totalTransaksi: 0 
      };
    }

    // Mapping Akun Cepat
    const akunMap: Record<string, any> = {};
    allAkun.forEach((a) => {
      akunMap[String(a.id)] = a;
      akunMap[String(a.nomor_akun)] = a;
    });

    // Tanggal Awal Periode untuk Saldo Awal Kumulatif
    const minMonth = Math.min(...targetMonths);
    const startPeriodDate = new Date(tahun, minMonth - 1, 1, 0, 0, 0, 0);

    let calcSaldoAwal = 0;
    let countTrx = 0;

    // Mapping Transaksi Kas & Bank ke Akun
    const akunTotals: Record<string, { masuk: number; keluar: number }> = {};

    const registerAmount = (akunId: any, nomorAkun: string | undefined, masuk: number, keluar: number) => {
      let resolvedNo = nomorAkun || (akunId ? akunMap[String(akunId)]?.nomor_akun : undefined);
      if (!resolvedNo) resolvedNo = '90000.99'; // Default akun tak terklasifikasi

      if (!akunTotals[resolvedNo]) {
        akunTotals[resolvedNo] = { masuk: 0, keluar: 0 };
      }
      akunTotals[resolvedNo].masuk += masuk;
      akunTotals[resolvedNo].keluar += keluar;
    };

    // A. Transaksi Kas Tunai
    allTrx.forEach((t) => {
      const d = parseAnyDate(t.tanggal);
      if (!d) return;

      // Filter Rekening
      if (selectedRekening !== 'ALL' && selectedRekening !== 'KAS') return;

      const masuk = Number(t.uang_masuk) || 0;
      const keluar = Number(t.uang_keluar) || 0;

      // Cek apakah sebelum periode mulai
      if (d < startPeriodDate) {
        calcSaldoAwal += masuk - keluar;
      }

      // Cek apakah dalam tahun & bulan target
      if (d.getFullYear() === tahun && targetMonths.includes(d.getMonth() + 1)) {
        countTrx += 1;
        const noAkun = t.ref_akun?.nomor_akun || akunMap[String(t.akun_id)]?.nomor_akun;
        registerAmount(t.akun_id, noAkun, masuk, keluar);
      }
    });

    // B. Transaksi Bank
    allBank.forEach((b) => {
      const d = parseAnyDate(b.waktu_transaksi);
      if (!d) return;

      const rId = String(b.rekening_id || '1');
      if (selectedRekening !== 'ALL') {
        if (selectedRekening === 'KAS') return;
        if (selectedRekening !== rId) return;
      }

      const masuk = cleanNum(b.kredit);
      const keluar = cleanNum(b.debet);

      // Cek apakah sebelum periode mulai
      if (d < startPeriodDate) {
        calcSaldoAwal += masuk - keluar;
      }

      // Cek apakah dalam tahun & bulan target
      if (d.getFullYear() === tahun && targetMonths.includes(d.getMonth() + 1)) {
        countTrx += 1;
        const noAkun = b.ref_akun?.nama_akun || akunMap[String(b.akun_id)]?.nomor_akun;
        registerAmount(b.akun_id, noAkun, masuk, keluar);
      }
    });

    // C. Bangun Hirarki Bagan Akun MAK (Induk -> Golongan MAK -> Kelompok -> Detail)
    // Level 1: Induk (40000 Pendapatan & 50000 Belanja)
    const tree: any[] = [
      {
        id: 'induk-40000',
        nomor_akun: '40000',
        nama_akun: 'PENERIMAAN & PENDAPATAN',
        isInduk: true,
        golongans: {},
        masuk: 0,
        keluar: 0,
      },
      {
        id: 'induk-50000',
        nomor_akun: '50000',
        nama_akun: 'PENGELUARAN & BELANJA (MAK)',
        isInduk: true,
        golongans: {},
        masuk: 0,
        keluar: 0,
      },
    ];

    const getInduk = (prefix: string) => {
      if (prefix === '4') return tree[0];
      if (prefix === '5') return tree[1];
      return null;
    };

    // Populasi Struktur Akun dari Master Akun
    allAkun.forEach((a) => {
      const no = String(a.nomor_akun).trim();
      if (!no || no.endsWith('0000')) return;

      const prefix = no.charAt(0);
      const induk = getInduk(prefix);
      if (!induk) return;

      const golKey = no.substring(0, 2);
      if (!induk.golongans[golKey]) {
        induk.golongans[golKey] = {
          id: `gol-${golKey}`,
          nomor_akun: golKey,
          nama_akun: GOLONGAN_MAK_NAMES[golKey] || `Kelompok MAK ${golKey}`,
          isGolongan: true,
          kelompoks: {},
          masuk: 0,
          keluar: 0,
        };
      }

      // Level 3: Kelompok Akun (tanpa titik)
      if (!no.includes('.')) {
        induk.golongans[golKey].kelompoks[no] = {
          id: `kel-${no}`,
          nomor_akun: no,
          nama_akun: a.nama_akun || `Akun ${no}`,
          isKelompok: true,
          anaks: [],
          masuk: 0,
          keluar: 0,
        };
      }
    });

    // Masukkan Sub-Akun / Rincian Anak (mengandung titik)
    allAkun.forEach((a) => {
      const no = String(a.nomor_akun).trim();
      if (no.includes('.')) {
        const prefix = no.charAt(0);
        const induk = getInduk(prefix);
        if (!induk) return;

        const golKey = no.substring(0, 2);
        const kelKey = no.split('.')[0];
        if (induk.golongans[golKey]?.kelompoks[kelKey]) {
          induk.golongans[golKey].kelompoks[kelKey].anaks.push({
            id: `anak-${no}`,
            nomor_akun: no,
            nama_akun: a.nama_akun || `Rincian ${no}`,
            isAnak: true,
            masuk: 0,
            keluar: 0,
          });
        }
      }
    });

    // D. Agregasi Nominal Realisasi ke dalam Hirarki Tree
    Object.entries(akunTotals).forEach(([noAkun, totals]) => {
      const prefix = noAkun.charAt(0);
      const induk = getInduk(prefix);
      if (!induk) return;

      const golKey = noAkun.substring(0, 2);
      if (!induk.golongans[golKey]) {
        induk.golongans[golKey] = {
          id: `gol-${golKey}`,
          nomor_akun: golKey,
          nama_akun: GOLONGAN_MAK_NAMES[golKey] || `Kelompok MAK ${golKey}`,
          isGolongan: true,
          kelompoks: {},
          masuk: 0,
          keluar: 0,
        };
      }

      const kelKey = noAkun.includes('.') ? noAkun.split('.')[0] : noAkun;
      if (!induk.golongans[golKey].kelompoks[kelKey]) {
        induk.golongans[golKey].kelompoks[kelKey] = {
          id: `kel-${kelKey}`,
          nomor_akun: kelKey,
          nama_akun: akunMap[kelKey]?.nama_akun || `Kelompok ${kelKey}`,
          isKelompok: true,
          anaks: [],
          masuk: 0,
          keluar: 0,
        };
      }

      if (noAkun.includes('.')) {
        let anak = induk.golongans[golKey].kelompoks[kelKey].anaks.find((x: any) => x.nomor_akun === noAkun);
        if (!anak) {
          anak = {
            id: `anak-${noAkun}`,
            nomor_akun: noAkun,
            nama_akun: akunMap[noAkun]?.nama_akun || `Rincian ${noAkun}`,
            isAnak: true,
            masuk: 0,
            keluar: 0,
          };
          induk.golongans[golKey].kelompoks[kelKey].anaks.push(anak);
        }
        anak.masuk += totals.masuk;
        anak.keluar += totals.keluar;
      }

      // Akumulasikan ke Kelompok, Golongan MAK, dan Induk
      induk.golongans[golKey].kelompoks[kelKey].masuk += totals.masuk;
      induk.golongans[golKey].kelompoks[kelKey].keluar += totals.keluar;

      induk.golongans[golKey].masuk += totals.masuk;
      induk.golongans[golKey].keluar += totals.keluar;

      induk.masuk += totals.masuk;
      induk.keluar += totals.keluar;
    });

    // E. Konversi Map ke Array & Urutkan
    const finalTree = tree.map((induk) => {
      const golArray = Object.values(induk.golongans).map((gol: any) => {
        const kelArray = Object.values(gol.kelompoks).map((kel: any) => {
          kel.anaks.sort((a: any, b: any) => a.nomor_akun.localeCompare(b.nomor_akun));
          return kel;
        });
        kelArray.sort((a: any, b: any) => a.nomor_akun.localeCompare(b.nomor_akun));
        return { ...gol, kelompoks: kelArray };
      });
      golArray.sort((a: any, b: any) => a.nomor_akun.localeCompare(b.nomor_akun));
      return { ...induk, golongans: golArray };
    });

    const inc = tree[0]?.masuk || 0;
    const exp = tree[1]?.keluar || 0;

    return {
      makTree: finalTree,
      totalIncome: inc,
      totalExpense: exp,
      saldoAwal: calcSaldoAwal,
      saldoAkhir: calcSaldoAwal + inc - exp,
      totalTransaksi: countTrx,
    };
  }, [allTrx, allBank, allAkun, allRekening, tahun, targetMonths, selectedRekening, loading]);

  // Data Visualisasi Grafik Realisasi MAK
  const chartMonthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyBuckets = monthNames.map((m, idx) => ({
      bulan: m,
      bulanNum: idx + 1,
      penerimaan: 0,
      pengeluaran: 0,
    }));

    allTrx.forEach((t) => {
      const d = parseAnyDate(t.tanggal);
      if (!d || d.getFullYear() !== tahun) return;
      if (selectedRekening !== 'ALL' && selectedRekening !== 'KAS') return;
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyBuckets[mIdx].penerimaan += Number(t.uang_masuk) || 0;
        monthlyBuckets[mIdx].pengeluaran += Number(t.uang_keluar) || 0;
      }
    });

    allBank.forEach((b) => {
      const d = parseAnyDate(b.waktu_transaksi);
      if (!d || d.getFullYear() !== tahun) return;
      const rId = String(b.rekening_id || '1');
      if (selectedRekening !== 'ALL') {
        if (selectedRekening === 'KAS') return;
        if (selectedRekening !== rId) return;
      }
      const mIdx = d.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        monthlyBuckets[mIdx].penerimaan += cleanNum(b.kredit);
        monthlyBuckets[mIdx].pengeluaran += cleanNum(b.debet);
      }
    });

    return monthlyBuckets.filter((b) => targetMonths.includes(b.bulanNum));
  }, [allTrx, allBank, tahun, selectedRekening, targetMonths]);

  const chartMakBelanja = useMemo(() => {
    const belanjaInduk = makTree.find((i: any) => i.nomor_akun === '50000');
    if (!belanjaInduk || !belanjaInduk.golongans) return [];
    const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];
    return belanjaInduk.golongans
      .filter((g: any) => g.keluar > 0)
      .map((g: any, idx: number) => {
        const rawName = GOLONGAN_MAK_NAMES[g.nomor_akun] || g.nama_akun || `MAK ${g.nomor_akun}`;
        return {
          kode: g.nomor_akun,
          name: `MAK ${g.nomor_akun}`,
          label: rawName.length > 22 ? rawName.slice(0, 20) + '...' : rawName,
          fullName: `MAK ${g.nomor_akun} - ${rawName}`,
          nominal: g.keluar,
          color: colors[idx % colors.length],
        };
      })
      .sort((a: any, b: any) => b.nominal - a.nominal);
  }, [makTree]);

  // Toggle Collapse / Expand Node
  const toggleNode = (id: string, defaultExpanded: boolean) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : !defaultExpanded,
    }));
  };

  const setHierarchyTo = (lvl: number) => {
    setHierarchyLevel(lvl);
    const newMap: Record<string, boolean> = {};
    makTree.forEach((induk) => {
      newMap[induk.id] = lvl >= 2;
      induk.golongans.forEach((gol: any) => {
        newMap[gol.id] = lvl >= 3;
        gol.kelompoks.forEach((kel: any) => {
          newMap[kel.id] = lvl >= 4;
        });
      });
    });
    setExpandedNodes(newMap);
  };

  // Filter Search & Kelompok MAK pada Tampilan Baris
  const filteredTree = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return makTree.map((induk) => {
      let golongans = induk.golongans;

      // Filter Golongan MAK
      if (selectedMakGroup !== 'ALL') {
        golongans = golongans.filter((g: any) => g.nomor_akun === selectedMakGroup);
      }

      // Filter Search Query
      if (q) {
        golongans = golongans.map((g: any) => {
          const kelompoks = g.kelompoks.map((k: any) => {
            const anaks = k.anaks.filter((a: any) => 
              a.nomor_akun.toLowerCase().includes(q) || a.nama_akun.toLowerCase().includes(q)
            );
            const matchKel = k.nomor_akun.toLowerCase().includes(q) || k.nama_akun.toLowerCase().includes(q);
            return { ...k, anaks, _match: matchKel || anaks.length > 0 };
          }).filter((k: any) => k._match);

          const matchGol = g.nomor_akun.toLowerCase().includes(q) || g.nama_akun.toLowerCase().includes(q);
          return { ...g, kelompoks, _match: matchGol || kelompoks.length > 0 };
        }).filter((g: any) => g._match);
      }

      return { ...induk, golongans };
    });
  }, [makTree, selectedMakGroup, searchQuery]);

  // Export Excel Hirarkis MAK
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const rows: any[] = [];

      filteredTree.forEach((induk) => {
        if (induk.masuk === 0 && induk.keluar === 0) return;
        const isPengeluaran = induk.nomor_akun === '50000';
        const baseTotal = isPengeluaran ? totalExpense : totalIncome;
        const indukNominal = isPengeluaran ? induk.keluar : induk.masuk;

        rows.push({
          'Kode MAK': induk.nomor_akun,
          'Uraian Mata Anggaran Kegiatan': induk.nama_akun,
          'Nominal': indukNominal,
          '% Porsi': '100%',
          'Tingkat': 'INDUK',
        });

        induk.golongans.forEach((gol: any) => {
          if (gol.masuk === 0 && gol.keluar === 0) return;
          const golNominal = isPengeluaran ? gol.keluar : gol.masuk;
          const pctGol = baseTotal > 0 ? `${((golNominal / baseTotal) * 100).toFixed(1)}%` : '0.0%';

          rows.push({
            'Kode MAK': `MAK ${gol.nomor_akun}`,
            'Uraian Mata Anggaran Kegiatan': `  ${gol.nama_akun}`,
            'Nominal': golNominal,
            '% Porsi': pctGol,
            'Tingkat': 'GOLONGAN MAK',
          });

          gol.kelompoks.forEach((kel: any) => {
            if (kel.masuk === 0 && kel.keluar === 0) return;
            const kelNominal = isPengeluaran ? kel.keluar : kel.masuk;
            const pctKel = baseTotal > 0 ? `${((kelNominal / baseTotal) * 100).toFixed(1)}%` : '0.0%';

            rows.push({
              'Kode MAK': kel.nomor_akun,
              'Uraian Mata Anggaran Kegiatan': `    ${kel.nama_akun}`,
              'Nominal': kelNominal,
              '% Porsi': pctKel,
              'Tingkat': 'KELOMPOK',
            });

            kel.anaks.forEach((anak: any) => {
              const anakNominal = isPengeluaran ? anak.keluar : anak.masuk;
              if (anakNominal === 0) return;
              const pctAnak = baseTotal > 0 ? `${((anakNominal / baseTotal) * 100).toFixed(1)}%` : '0.0%';

              rows.push({
                'Kode MAK': anak.nomor_akun,
                'Uraian Mata Anggaran Kegiatan': `      ${anak.nama_akun}`,
                'Nominal': anakNominal,
                '% Porsi': pctAnak,
                'Tingkat': 'DETAIL ANAK',
              });
            });
          });
        });
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Realisasi MAK');
      XLSX.writeFile(wb, `Laporan_Realisasi_MAK_${tahun}_${monthRange.startMonth}_sd_${monthRange.endMonth}.xlsx`);
    } catch (err) {
      console.error('Gagal export excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const resetFilters = () => {
    setMonthRange({
      startMonth: `${tahun}-01`,
      endMonth: `${tahun}-12`,
      startDate: `${tahun}-01-01`,
      endDate: `${tahun}-12-31`,
    });
    setSelectedRekening('ALL');
    setSelectedMakGroup('ALL');
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 pb-24 font-sans text-gray-900 max-w-7xl mx-auto">
      {/* Print Stylesheet Landscape & Header Khusus Cetak */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          .print-hidden, nav, header, aside, .sticky, button { display: none !important; }
          body { background: white !important; font-size: 10.5px !important; color: black !important; }
          .print-header { display: block !important; text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 8px; }
          .print-signature { display: flex !important; justify-content: space-between; margin-top: 36px; page-break-inside: avoid; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #94a3b8 !important; padding: 4px 6px !important; font-size: 10px !important; }
          th { background-color: #f1f5f9 !important; font-weight: 900 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-bg-golongan { background-color: #e2e8f0 !important; font-weight: 800 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-bg-induk { background-color: #cbd5e1 !important; font-weight: 900 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-card-box { border: 1px solid #cbd5e1 !important; padding: 8px !important; border-radius: 8px !important; }
        }
      `}} />

      {/* HEADER KHUSUS CETAK PDF / DOKUMEN CETAK RESMI */}
      <div className="hidden print-header">
        <h1 className="text-xl font-black uppercase tracking-wider text-black">
          Laporan Realisasi Kas &amp; Bank per Mata Anggaran Kegiatan (MAK)
        </h1>
        <p className="text-xs font-bold text-gray-800 mt-1">
          Tahun Anggaran {tahun} | Periode: {labelPeriodeTerpilih}
        </p>
        <p className="text-[11px] text-gray-600 mt-0.5">
          Sumber Dana: {selectedRekening === 'ALL' ? 'Semua Rekening (Kas + Bank)' : selectedRekening === 'KAS' ? 'Kas Tunai' : (rekeningOptions.find(r => r.value === selectedRekening)?.label || 'Bank')} | Dicetak Pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* 1. STANDARD PAGE HEADER */}
      <div className="print-hidden">
        <PageHeader
          title="Laporan"
          subtitle="Rekapitulasi mutasi dan realisasi belanja & penerimaan dikelompokkan per Mata Anggaran Kegiatan (MAK) standar UGM / FKG"
          icon={FileSpreadsheet}
          breadcrumbs={[
            { label: 'Laporan Keuangan' },
            { label: 'Laporan' }
          ]}
          badge={{ text: `${totalTransaksi} Transaksi`, variant: 'info' }}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCharts(prev => !prev)}
                className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                  showCharts
                    ? 'border-indigo-300 bg-indigo-50/80 text-indigo-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                }`}
                title="Tampilkan atau sembunyikan grafik analisis"
              >
                <BarChart3 size={13} className={showCharts ? 'text-indigo-600' : 'text-gray-500'} />
                <span className="hidden sm:inline">{showCharts ? 'Tutup Grafik' : 'Grafik Analisis'}</span>
              </button>

              <button
                type="button"
                onClick={fetchData}
                className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                title="Muat ulang data"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <ExportButtons
                onExportExcel={handleExportExcel}
                isExportingExcel={isExportingExcel}
                onExportPdf={() => window.print()}
                pdfLabel="Cetak PDF"
              />
            </div>
          }
        />
      </div>

      {/* 2. STATS CARDS (4 MODERN KPI SUMMARY CARDS SESUAI DESIGN SYSTEM DENGAN LIGHT PASTEL GRADIENT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 print-hidden">
        <StatCard
          title="TOTAL SALDO AWAL"
          value={`Rp ${fmt(saldoAwal)}`}
          icon={Wallet}
          subtitle={`Posisi sebelum awal periode`}
          trend={{ 
            value: selectedRekening === 'KAS' ? 'Kas Tunai' : selectedRekening === 'ALL' ? 'Semua Rekening' : 'Bank', 
            isGood: true 
          }}
          variant="indigo"
          lightBg={true}
        />
        <StatCard
          title="TOTAL PENERIMAAN (+)"
          value={`Rp ${fmt(totalIncome)}`}
          icon={TrendingUp}
          trend={{ value: 'Infaq & Giro', isUp: true, isGood: true }}
          subtitle="Penerimaan periode ini"
          variant="emerald"
          lightBg={true}
        />
        <StatCard
          title="TOTAL PENGELUARAN (-)"
          value={`Rp ${fmt(totalExpense)}`}
          icon={TrendingDown}
          trend={{ value: 'Realisasi MAK', isUp: false, isGood: false }}
          subtitle="Belanja operasional & kegiatan"
          variant="rose"
          lightBg={true}
        />
        <StatCard
          title="POSISI SALDO AKHIR"
          value={`Rp ${fmt(saldoAkhir)}`}
          icon={Coins}
          trend={{
            value: `${totalIncome - totalExpense >= 0 ? '+' : ''}Rp ${fmt(totalIncome - totalExpense)}`,
            isUp: totalIncome >= totalExpense,
            isGood: totalIncome >= totalExpense
          }}
          subtitle="Saldo berjalan di akhir periode"
          variant="blue"
          lightBg={true}
        />
      </div>

      {/* 2.5 VISUALISASI GRAFIK ANALISIS MAK (DESIGN SYSTEM STANDARDS) */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 print-hidden">
          {/* Grafik 1: Proporsi Belanja per Golongan MAK */}
          <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
              <div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-indigo-600" />
                  <span>Realisasi Belanja per MAK</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Komposisi pengeluaran belanja periode {labelPeriodeTerpilih}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Rp {fmt(totalExpense)}
              </span>
            </div>

            {chartMakBelanja.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
                <span>Belum ada transaksi belanja pada periode ini</span>
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMakBelanja} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}Jt` : `${v}`}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#334155', fontWeight: 700 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      width={65}
                    />
                    <RechartsTooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          const pct = totalExpense > 0 ? ((d.nominal / totalExpense) * 100).toFixed(1) : '0';
                          return (
                            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 shadow-xl text-xs font-sans">
                              <p className="font-black text-gray-900">{d.fullName}</p>
                              <p className="text-gray-600 mt-1 flex items-center justify-between gap-4">
                                <span>Nominal:</span>
                                <span className="font-extrabold text-indigo-700">Rp {fmt(d.nominal)}</span>
                              </p>
                              <p className="text-gray-500 text-[10px] mt-0.5">Porsi: {pct}% dari total pengeluaran</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="nominal" radius={[0, 6, 6, 0]}>
                      {chartMakBelanja.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Grafik 2: Tren Bulanan Penerimaan vs Pengeluaran */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs flex flex-col">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2.5">
              <div>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChart size={14} className="text-emerald-600" />
                  <span>Tren Kas Bulanan: Penerimaan vs Pengeluaran</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Perbandingan mutasi masuk &amp; keluar per bulan (TA {tahun})</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Penerimaan
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Pengeluaran
                </span>
              </div>
            </div>

            {chartMonthlyData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-400 text-xs">
                <span>Belum ada data bulanan pada periode ini</span>
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMonthlyData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="bulan" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }} 
                    />
                    <YAxis 
                      tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}Jt` : `${v}`}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      width={55}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 shadow-xl text-xs font-sans min-w-[180px]">
                              <p className="font-black text-gray-900 mb-1.5 border-b border-gray-100 pb-1">Bulan {label} {tahun}</p>
                              {payload.map((entry: any, index: number) => (
                                <div key={`item-${index}`} className="flex items-center justify-between gap-3 py-0.5">
                                  <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                                    {entry.name}:
                                  </span>
                                  <span className="font-extrabold text-gray-900">Rp {fmt(entry.value)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="penerimaan" name="Penerimaan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. FILTER TOOLBAR: COMBOBOX PERIODE + REKENING + KELOMPOK MAK + SEARCH (DESIGN SYSTEM) */}
      <div className="bg-white p-4 px-5 rounded-2xl border border-gray-200/90 shadow-2xs print-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Filter Periode Realisasi (MonthRangePicker Sesuai Design System) */}
          <div className="lg:col-span-3 w-full">
            <MonthRangePicker
              label="Filter Periode Realisasi"
              value={monthRange}
              onChange={handleMonthRangeChange}
              className="w-full"
            />
          </div>

          {/* 2. Combobox Filter Sumber Rekening */}
          <div className="lg:col-span-3 w-full">
            <AutocompleteCombobox
              label="Sumber Rekening"
              icon={Landmark}
              placeholder="Pilih kas atau rekening bank..."
              options={rekeningOptions}
              value={selectedRekening}
              onChange={(val) => setSelectedRekening(val || 'ALL')}
            />
          </div>

          {/* 3. Combobox Filter Kelompok MAK (51, 52, 53, dst.) */}
          <div className="lg:col-span-3 w-full">
            <AutocompleteCombobox
              label="Kelompok MAK (Belanja / Masuk)"
              icon={FolderTree}
              placeholder="Pilih kelompok MAK..."
              options={makGroupOptions}
              value={selectedMakGroup}
              onChange={(val) => setSelectedMakGroup(val || 'ALL')}
            />
          </div>

          {/* 4. Pencarian Cepat Nama Akun / Kode MAK */}
          <div className="lg:col-span-2 w-full">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Search size={11} className="text-gray-400 shrink-0" />
              <span>Cari Akun / MAK</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik kode / uraian..."
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

          {/* 5. Tombol Reset Filter */}
          <div className="lg:col-span-1 w-full flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={monthRange.startMonth === `${tahun}-01` && monthRange.endMonth === `${tahun}-12` && selectedRekening === 'ALL' && selectedMakGroup === 'ALL' && !searchQuery}
              className="w-full h-10 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset semua filter"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline lg:hidden xl:inline">Reset</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. TABEL LAPORAN REALISASI MAK (HIRARKI GROUP PER MAK SEPERTI FKG / UGM) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-3.5 px-5 bg-gray-50/70 border-b border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree size={14} className="text-blue-600" />
              <span>Struktur Realisasi Akun per MAK</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
              {labelPeriodeTerpilih}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Smart Segmented Level Bar Sesuai Design System Tab 08 (Hanya Pill Hirarki) */}
            <div className="inline-flex items-center rounded-xl p-0.5 bg-slate-100 border border-slate-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setHierarchyTo(1)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  hierarchyLevel === 1
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Tingkat 1: Tampilkan hanya Induk (40000 / 50000)"
              >
                Induk
              </button>
              <button
                type="button"
                onClick={() => setHierarchyTo(2)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  hierarchyLevel === 2
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Tingkat 2: Buka sampai Golongan MAK (51, 52, dst)"
              >
                +Golongan
              </button>
              <button
                type="button"
                onClick={() => setHierarchyTo(3)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  hierarchyLevel === 3
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Tingkat 3: Buka sampai Kelompok Akun"
              >
                +Kelompok
              </button>
              <button
                type="button"
                onClick={() => setHierarchyTo(4)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  hierarchyLevel === 4
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Tingkat 4: Buka semua sampai Rincian Sub-Akun"
              >
                +Rincian
              </button>
            </div>

            <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
          </div>
        </div>

        {/* Table Container dengan Dinamika Luwes / Rapat (Table Density) */}
        {(() => {
          const isCompact = tableDensity === 'compact';
          const cellHdr = isCompact ? 'py-2 px-3 text-[10px]' : 'py-3 px-4 text-[11px]';
          const cellHdrCenter = isCompact ? 'py-2 px-2.5 text-[10px]' : 'py-3 px-3.5 text-[11px]';
          const cellInduk = isCompact ? 'py-1.5 px-3 text-[11px]' : 'py-3 px-4 text-xs';
          const cellIndukCenter = isCompact ? 'py-1.5 px-2.5 text-[10px]' : 'py-3 px-3.5 text-xs';
          const cellGol = isCompact ? 'py-1.5 px-3 pl-6 text-[10.5px]' : 'py-2.5 px-4 pl-7 text-xs';
          const cellGolCenter = isCompact ? 'py-1.5 px-2.5 text-[10px]' : 'py-2.5 px-3.5 text-[11px]';
          const cellKel = isCompact ? 'py-1 px-3 pl-10 text-[10px]' : 'py-2 px-4 pl-12 text-[11px]';
          const cellKelCenter = isCompact ? 'py-1 px-2.5 text-[9px]' : 'py-2 px-3.5 text-[10px]';
          const cellAnak = isCompact ? 'py-0.5 px-3 pl-14 text-[9.5px]' : 'py-1.5 px-4 pl-16 text-[11px]';
          const cellAnakCenter = isCompact ? 'py-0.5 px-2.5 text-[8.5px]' : 'py-1.5 px-3.5 text-[9.5px]';
          const cellSubtotal = isCompact ? 'py-1.5 px-3 text-[10px]' : 'py-2 px-4 text-[10.5px]';
          const cellSubtotalCenter = isCompact ? 'py-1.5 px-2.5 text-[10px]' : 'py-2 px-3.5 text-[10.5px]';
          const cellTotal = isCompact ? 'py-2 px-3 text-[10.5px]' : 'py-2.5 px-4 text-[11px]';
          const cellTotalCenter = isCompact ? 'py-2 px-2.5 text-[10px]' : 'py-2.5 px-3.5 text-xs';
          const cellFooter = isCompact ? 'py-2 px-3 text-xs' : 'py-3.5 px-4 text-xs';

          return (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                  <Loader2 size={36} className="animate-spin mb-2 text-indigo-600" />
                  <p className="text-xs font-bold text-gray-600">Mengkonsolidasi dan mengelompokkan data per MAK...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`bg-gray-50/90 border-b border-gray-200 font-black text-gray-500 uppercase tracking-wider ${isCompact ? 'text-[10px]' : 'text-[11px]'}`}>
                      <th className={`w-48 ${cellHdr}`}>Kode MAK</th>
                      <th className={`min-w-[320px] ${cellHdr}`}>Uraian Mata Anggaran Kegiatan</th>
                      <th className={`text-right whitespace-nowrap w-52 ${cellHdr}`}>Nominal</th>
                      <th className={`text-center w-28 whitespace-nowrap ${cellHdrCenter}`}>% Porsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredTree.map((induk) => {
                      const isIndukExpanded = expandedNodes[induk.id] ?? (hierarchyLevel >= 2);
                      const isPengeluaran = induk.nomor_akun === '50000';
                      const baseTotal = isPengeluaran ? totalExpense : totalIncome;
                      const indukNominal = isPengeluaran ? induk.keluar : induk.masuk;

                      return (
                        <React.Fragment key={induk.id}>
                          {/* BARIS TINGKAT 1: INDUK (40000 / 50000) */}
                          <tr 
                            onClick={() => toggleNode(induk.id, hierarchyLevel >= 2)}
                            className="bg-slate-100/90 hover:bg-slate-200/90 transition-colors font-black cursor-pointer border-t-2 border-b border-slate-300 print-bg-induk"
                          >
                            <td className={`font-mono text-gray-900 flex items-center gap-2 ${cellInduk}`}>
                              {isIndukExpanded ? <ChevronDown size={isCompact ? 12 : 14} className="shrink-0 text-gray-600 print-hidden" /> : <ChevronRight size={isCompact ? 12 : 14} className="shrink-0 text-gray-600 print-hidden" />}
                              <span>{induk.nomor_akun}</span>
                            </td>
                            <td className={`text-gray-900 tracking-wide ${cellInduk}`}>
                              {induk.nama_akun}
                            </td>
                            <td className={`text-right font-mono font-black text-indigo-950 whitespace-nowrap bg-indigo-50/50 ${cellInduk}`}>
                              Rp {fmt(indukNominal)}
                            </td>
                            <td className={`text-center font-mono font-bold text-gray-700 ${cellIndukCenter}`}>
                              100%
                            </td>
                          </tr>

                          {/* GOLONGAN MAK & SUB-AKUN */}
                          {isIndukExpanded && induk.golongans.map((gol: any) => {
                            const isGolExpanded = expandedNodes[gol.id] ?? (hierarchyLevel >= 3);
                            const golNominal = isPengeluaran ? gol.keluar : gol.masuk;
                            const pctGol = baseTotal > 0 ? ((golNominal / baseTotal) * 100).toFixed(1) : '0.0';

                            return (
                              <React.Fragment key={gol.id}>
                                {/* BARIS TINGKAT 2: GOLONGAN MAK (51, 52, 53, 41, dst.) */}
                                <tr 
                                  onClick={() => toggleNode(gol.id, hierarchyLevel >= 3)}
                                  className="bg-indigo-50/40 hover:bg-indigo-100/50 transition-colors font-bold cursor-pointer border-t border-b border-indigo-100 print-bg-golongan"
                                >
                                  <td className={`font-mono text-indigo-900 flex items-center gap-1.5 ${cellGol}`}>
                                    {isGolExpanded ? <ChevronDown size={isCompact ? 11 : 13} className="shrink-0 text-indigo-600 print-hidden" /> : <ChevronRight size={isCompact ? 11 : 13} className="shrink-0 text-indigo-600 print-hidden" />}
                                    <span className="bg-indigo-100/90 text-indigo-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                                      MAK {gol.nomor_akun}
                                    </span>
                                  </td>
                                  <td className={`text-indigo-950 font-bold ${cellGol}`}>
                                    {gol.nama_akun}
                                  </td>
                                  <td className={`text-right font-mono font-bold text-indigo-900 whitespace-nowrap bg-indigo-50/30 ${cellGol}`}>
                                    Rp {fmt(golNominal)}
                                  </td>
                                  <td className={`text-center font-mono font-bold text-indigo-800 ${cellGolCenter}`}>
                                    {pctGol}%
                                  </td>
                                </tr>

                                {/* BARIS TINGKAT 3: KELOMPOK AKUN */}
                                {isGolExpanded && gol.kelompoks.map((kel: any) => {
                                  const isKelExpanded = expandedNodes[kel.id] ?? (hierarchyLevel >= 4);
                                  const visibleAnaks = (kel.anaks || []).filter((anak: any) => {
                                    const anakNominal = isPengeluaran ? anak.keluar : anak.masuk;
                                    return anakNominal !== 0;
                                  });
                                  const hasAnak = visibleAnaks.length > 0;
                                  const kelNominal = isPengeluaran ? kel.keluar : kel.masuk;
                                  const pctKel = baseTotal > 0 ? ((kelNominal / baseTotal) * 100).toFixed(1) : '0.0';

                                  return (
                                    <React.Fragment key={kel.id}>
                                      <tr 
                                        onClick={hasAnak ? () => toggleNode(kel.id, hierarchyLevel >= 4) : undefined}
                                        className={`hover:bg-slate-50 transition-colors ${hasAnak ? 'cursor-pointer' : ''}`}
                                      >
                                        <td className={`font-mono text-gray-700 flex items-center gap-1.5 ${cellKel}`}>
                                          {hasAnak && (
                                            isKelExpanded ? <ChevronDown size={isCompact ? 10 : 11} className="shrink-0 text-gray-400 print-hidden" /> : <ChevronRight size={isCompact ? 10 : 11} className="shrink-0 text-gray-400 print-hidden" />
                                          )}
                                          <span>{kel.nomor_akun}</span>
                                        </td>
                                        <td className={`text-gray-800 font-semibold ${isCompact ? 'py-1 px-3 text-[10.5px]' : 'py-2 px-4 text-xs'}`}>
                                          {kel.nama_akun}
                                        </td>
                                        <td className={`text-right font-mono font-bold text-gray-800 whitespace-nowrap ${isCompact ? 'py-1 px-3 text-[10.5px]' : 'py-2 px-4 text-xs'}`}>
                                          Rp {fmt(kelNominal)}
                                        </td>
                                        <td className={`text-center font-mono text-gray-500 ${cellKelCenter}`}>
                                          {pctKel}%
                                        </td>
                                      </tr>

                                      {/* BARIS TINGKAT 4: RINCIAN ANAK (MAK TERKECIL NOMINAL 0 TIDAK DITAMPILKAN) */}
                                      {isKelExpanded && visibleAnaks.map((anak: any) => {
                                        const anakNominal = isPengeluaran ? anak.keluar : anak.masuk;
                                        const pctAnak = baseTotal > 0 ? ((anakNominal / baseTotal) * 100).toFixed(1) : '0.0';

                                        return (
                                          <tr key={anak.id} className="hover:bg-amber-50/30 transition-colors bg-gray-50/30">
                                            <td className={`font-mono text-gray-500 ${cellAnak}`}>
                                              {anak.nomor_akun}
                                            </td>
                                            <td className={`text-gray-600 italic ${cellAnak}`}>
                                              {anak.nama_akun}
                                            </td>
                                            <td className={`text-right font-mono text-gray-700 whitespace-nowrap ${cellAnak}`}>
                                              Rp {fmt(anakNominal)}
                                            </td>
                                            <td className={`text-center font-mono text-gray-400 ${cellAnakCenter}`}>
                                              {pctAnak}%
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </React.Fragment>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>

                  {/* BARIS AKHIR: SURPLUS / DEFISIT PERIODE */}
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-xs">
                      <td colSpan={2} className={`uppercase tracking-wider ${cellFooter}`}>
                        SURPLUS / (DEFISIT) NETTO REALISASI PERIODE INI
                      </td>
                      <td className={`text-right font-mono text-amber-300 font-black ${isCompact ? 'py-2 px-3 text-xs' : 'py-3.5 px-4 text-sm'}`}>
                        {totalIncome - totalExpense >= 0 ? '+' : '-'}Rp {fmt(Math.abs(totalIncome - totalExpense))}
                      </td>
                      <td className={`text-center font-mono text-slate-300 ${cellFooter}`}>
                        {totalExpense > 0 ? `${((totalIncome / totalExpense) * 100).toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          );
        })()}
      </div>

      {/* TANDA TANGAN RESMI PADA CETAK PDF (PRINT VIEW) */}
      <div className="hidden print:flex justify-between items-start pt-10 text-xs text-black page-break-inside-avoid">
        <div className="text-center w-64 space-y-16">
          <p className="font-bold">Mengetahui,<br />Ketua Takmir Masjid Kampus</p>
          <div>
            <p className="font-bold border-b border-black inline-block pb-0.5 min-w-[160px]">
              Prof. Dr. Ir. H. Pengurus
            </p>
            <p className="text-[10px] text-gray-600">NIP. 19700101 199503 1 001</p>
          </div>
        </div>

        <div className="text-center w-64 space-y-16">
          <p className="font-bold">Yogyakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Bendahara / Pemroses Anggaran</p>
          <div>
            <p className="font-bold border-b border-black inline-block pb-0.5 min-w-[160px]">
              Bagus Sri Widodo
            </p>
            <p className="text-[10px] text-gray-600">NIP. 19850215 201012 1 002</p>
          </div>
        </div>
      </div>
    </div>
  );
}
