'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  BarChart2, 
  Printer,
  RefreshCw,
  Search,
  Building2,
  FolderOpen,
  Folder,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  SlidersHorizontal,
  Table as TableIcon,
  Activity,
  Calendar
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import SkeletonTable from '@/components/shared/SkeletonTable';
import EmptyState from '@/components/shared/EmptyState';
import ExportButtons from '@/components/shared/ExportButtons';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import QuickFilterChips from '@/components/shared/QuickFilterChips';
import ToastNotification, { ToastItem } from '@/components/shared/ToastNotification';
import { PrimaryButton, SecondaryButton } from '@/components/shared/ActionButtons';

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

// Format Rupiah bulat (tanpa desimal ,00)
const fmt = (n: number) => {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Math.round(n).toLocaleString('id-ID');
};

// Fungsi membersihkan angka dari string (handle titik/koma ribuan)
const cleanNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).trim();
  let cleaned = s;
  if (s.includes(',') && s.includes('.')) {
    cleaned = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    cleaned = s.replace(',', '.');
  }
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
};

// Fungsi parse tanggal universal
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

// Nama Baku Golongan Akun (2 Digit Pertama)
const GOLONGAN_NAMES: Record<string, string> = {
  '11': 'Kas & Setara Kas',
  '12': 'Piutang & Uang Muka',
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

// Custom Tooltip Recharts Ultra-Modern & Elegan
function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  
  const masukVal = payload.find((p: any) => p.dataKey === 'masuk')?.value || 0;
  const keluarVal = payload.find((p: any) => p.dataKey === 'keluar')?.value || 0;
  const saldoVal = payload.find((p: any) => p.dataKey === 'saldo')?.value || 0;
  const diff = masukVal - keluarVal;

  return (
    <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-2xl p-4 shadow-2xl text-xs space-y-3 border border-slate-700/80 backdrop-blur-xl min-w-[220px]">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-indigo-400" />
          <span className="font-black text-sm tracking-wide text-white">Bulan {label}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          diff >= 0 ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800'
        }`}>
          {diff >= 0 ? `+Rp ${fmt(diff)}` : `-Rp ${fmt(Math.abs(diff))}`}
        </span>
      </div>

      <div className="space-y-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-300 font-sans text-xs">
            <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            Uang Masuk:
          </span>
          <strong className="text-emerald-400 font-bold">Rp {fmt(masukVal)}</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-slate-300 font-sans text-xs">
            <span className="w-2.5 h-2.5 rounded-md bg-rose-500 shadow-sm shadow-rose-500/50" />
            Uang Keluar:
          </span>
          <strong className="text-rose-400 font-bold">Rp {fmt(keluarVal)}</strong>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-indigo-300 font-sans font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            Saldo Berjalan:
          </span>
          <strong className="text-indigo-300 font-black font-mono">Rp {fmt(saldoVal)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Raw data
  const [allTrx, setAllTrx] = useState<any[]>([]);
  const [allBank, setAllBank] = useState<any[]>([]);
  const [allAkun, setAllAkun] = useState<any[]>([]);
  const [allRekening, setAllRekening] = useState<any[]>([]);

  // Computed
  const [summary, setSummary] = useState({ saldoAwal: 0, masuk: 0, keluar: 0, saldoAkhir: 0 });
  const [perRekening, setPerRekening] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [coaMonthTable, setCoaMonthTable] = useState<any[]>([]);
  const [hierarchyLevel, setHierarchyLevel] = useState<number>(1);
  const [expandedCoa, setExpandedCoa] = useState<Record<string, boolean>>({});
  const [expandedGol, setExpandedGol] = useState<Record<string, boolean>>({});
  const [expandedKel, setExpandedKel] = useState<Record<string, boolean>>({});
  const [expandPosisiAwal, setExpandPosisiAwal] = useState(false);
  const [expandPosisiAkhir, setExpandPosisiAkhir] = useState(false);
  const [monthlyAccountSaldo, setMonthlyAccountSaldo] = useState<any[]>([]);

  // Design System Standard States
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('all');
  const [showRekeningBreakdown, setShowRekeningBreakdown] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Chart Series Toggles
  const [chartSeries, setChartSeries] = useState({
    masuk: true,
    keluar: true,
    saldo: true,
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const triggerToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const newId = Date.now().toString();
    const newToast: ToastItem = { id: newId, type, title, message };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newId));
    }, 4000);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const tahunList = [2023, 2024, 2025, 2026, 2027];

  // FETCH dengan Pagination
  const fetchAllPages = async (builder: any, pageSize = 1000) => {
    let allData: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await builder.range(from, from + pageSize - 1);
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
        fetchAllPages(supabase.from('transactions').select('*, ref_akun(nomor_akun, nama_akun)').neq('disetujui', 'Ditolak').order('tanggal', { ascending: true }).order('id', { ascending: true })),
        fetchAllPages(supabase.from('bank_transactions').select('*').order('waktu_transaksi', { ascending: true }).order('id', { ascending: true })),
        fetchAllPages(supabase.from('ref_akun').select('*').order('nomor_akun', { ascending: true })),
        fetchAllPages(supabase.from('ref_rekening').select('*')),
      ]);
      setAllTrx(trxData);
      setAllBank(bankData);
      setAllAkun(akunData);
      setAllRekening(rekData);
    } catch (e) {
      console.error(e);
      triggerToast('error', 'Gagal Memuat Data', 'Terjadi kesalahan saat mengambil data dari database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // COMPUTE DATA
  useEffect(() => {
    if (loading) return;
    compute();
  }, [loading, tahun, allTrx, allBank, allAkun, allRekening]);

  const filterByYear = (rows: any[], field: string) => {
    const start = new Date(tahun, 0, 1, 0, 0, 0, 0).getTime();
    const end = new Date(tahun, 11, 31, 23, 59, 59, 999).getTime();
    return rows.filter(r => {
      const d = parseAnyDate(r[field]);
      if (!d) return false;
      const t = d.getTime();
      return t >= start && t <= end;
    });
  };

  const filterBeforeYear = (rows: any[], field: string) => {
    const start = new Date(tahun, 0, 1, 0, 0, 0, 0).getTime();
    return rows.filter(r => {
      const d = parseAnyDate(r[field]);
      if (!d) return false;
      return d.getTime() < start;
    });
  };

  const compute = () => {
    const seen = new Set();
    const uniqueBank = allBank.filter(b => {
      const key = `${b.rekening_id}-${b.waktu_transaksi}-${b.noref_bank}-${b.debet}-${b.kredit}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const bankBefore = filterBeforeYear(uniqueBank, 'waktu_transaksi');
    const bankYear   = filterByYear(uniqueBank, 'waktu_transaksi');

    // 1. REKENING BANK & KAS KECIL MAP
    const rekMap: Record<string, any> = {};
    allRekening.forEach(r => {
      const idStr = String(r.id);
      const namaBank = r.nama_bank || '';
      const noRek = r.nomor_rekening || '';
      const pemilik = r.nama_pemilik || '';

      // Tampilkan Nama Bank dan No Rekening yang Jelas (Bukan "Rek-1")
      let displayName = '';
      if (namaBank && noRek) {
        displayName = `${namaBank} - ${noRek}`;
      } else if (namaBank) {
        displayName = namaBank;
      } else if (noRek) {
        displayName = `No. Rek: ${noRek}`;
      } else {
        displayName = pemilik || `Rekening Bank #${r.id}`;
      }

      rekMap[idStr] = { 
        id: r.id, 
        nama: displayName,
        nama_bank: namaBank,
        nomor_rekening: noRek,
        nama_pemilik: pemilik,
        saldoAwal: 0, masuk: 0, keluar: 0 
      };
    });

    bankBefore.forEach(b => {
      const rId = String(b.rekening_id || 'unknown');
      if (!rekMap[rId]) {
        rekMap[rId] = { id: rId, nama: `Rekening #${rId}`, saldoAwal: 0, masuk: 0, keluar: 0 };
      }
      rekMap[rId].saldoAwal += cleanNum(b.kredit) - cleanNum(b.debet);
    });

    bankYear.forEach(b => {
      const rId = String(b.rekening_id || 'unknown');
      if (!rekMap[rId]) {
        rekMap[rId] = { id: rId, nama: `Rekening #${rId}`, saldoAwal: 0, masuk: 0, keluar: 0 };
      }
      rekMap[rId].masuk += cleanNum(b.kredit);
      rekMap[rId].keluar += cleanNum(b.debet);
    });

    const trxYear = filterByYear(allTrx, 'tanggal');
    const trxBefore = filterBeforeYear(allTrx, 'tanggal');

    const kasRek = { 
      id: 'kas', 
      nama: 'Kas Kecil (Tunai)', 
      nama_bank: 'Kas Tunai Masjid',
      nomor_rekening: 'Operasional',
      nama_pemilik: 'Takmir',
      saldoAwal: 0, masuk: 0, keluar: 0 
    };

    trxBefore.forEach(t => { 
      kasRek.saldoAwal += (Number(t.uang_masuk) || 0) - (Number(t.uang_keluar) || 0); 
    });
    trxYear.forEach(t => {
      kasRek.masuk += Number(t.uang_masuk) || 0;
      kasRek.keluar += Number(t.uang_keluar) || 0;
    });

    const rekList = [...Object.values(rekMap), kasRek]
      .filter(r => Math.abs(r.saldoAwal) > 0.1 || Math.abs(r.masuk) > 0.1 || Math.abs(r.keluar) > 0.1);

    const total = rekList.reduce((acc, r) => ({
      saldoAwal: acc.saldoAwal + r.saldoAwal,
      masuk: acc.masuk + r.masuk,
      keluar: acc.keluar + r.keluar,
    }), { saldoAwal: 0, masuk: 0, keluar: 0 });

    setPerRekening(rekList);
    setSummary({
      saldoAwal: total.saldoAwal,
      masuk: total.masuk,
      keluar: total.keluar,
      saldoAkhir: total.saldoAwal + total.masuk - total.keluar,
    });

    // 2. CHART BULANAN
    const monthlyData = BULAN.map((bln, idx) => {
      const m = idx + 1;
      const trxM = trxYear.filter(t => { const d = parseAnyDate(t.tanggal); return d && d.getMonth() + 1 === m; });
      const bankM = bankYear.filter(b => { const d = parseAnyDate(b.waktu_transaksi); return d && d.getMonth() + 1 === m; });
      const masuk = trxM.reduce((s, t) => s + (Number(t.uang_masuk) || 0), 0)
        + bankM.reduce((s, b) => s + cleanNum(b.kredit), 0);
      const keluar = trxM.reduce((s, t) => s + (Number(t.uang_keluar) || 0), 0)
        + bankM.reduce((s, b) => s + cleanNum(b.debet), 0);
      const surplus = masuk - keluar;
      return { bln, masuk, keluar, surplus };
    });
    let saldo = total.saldoAwal;
    const cd = monthlyData.map(m => {
      saldo += m.masuk - m.keluar;
      return { ...m, saldo };
    });
    
    let lastActiveMonthIdx = -1;
    for (let i = 0; i < 12; i++) {
        if (cd[i].masuk > 0 || cd[i].keluar > 0) lastActiveMonthIdx = i;
    }
    const finalCd = lastActiveMonthIdx >= 0 ? cd.slice(0, lastActiveMonthIdx + 1) : (cd[0].saldo > 0 ? [cd[0]] : []);
    setChartData(finalCd);

    // 3. TREE HIERARKI BAGAN AKUN STANDAR (COA) BERLAPIS:
    // Induk (Level 1: 50000 Biaya) 
    //   -> Golongan (Level 2: 51..., 52..., 53..., 54..., 55...)
    //     -> Kelompok (Level 3: 51010, 51020, dst)
    //       -> Detail / Anak (Level 4: 51010.01, 51010.02, dst)

    const indukMap: Record<string, any> = {};
    allAkun.forEach(a => {
      const no = String(a.nomor_akun);
      if (no.endsWith('0000') && !no.includes('.')) {
        indukMap[no] = { ...a, golongans: {} };
      }
    });

    // Buat Golongan (2 Digit: 51, 52, 53, 41, 43, dsb) & Kelompok (5 digit tanpa titik)
    allAkun.forEach(a => {
      const no = String(a.nomor_akun);
      if (no.endsWith('0000')) return;

      const indukKey = no[0] + '0000';
      if (!indukMap[indukKey]) return;

      const golKey = no.substring(0, 2);
      if (!indukMap[indukKey].golongans[golKey]) {
        indukMap[indukKey].golongans[golKey] = {
          id: `gol-${golKey}`,
          nomor_akun: golKey,
          nama_akun: GOLONGAN_NAMES[golKey] || `Kelompok ${golKey}`,
          isGolongan: true,
          kelompoks: {},
        };
      }

      if (!no.includes('.')) {
        indukMap[indukKey].golongans[golKey].kelompoks[no] = { ...a, anaks: [] };
      }
    });

    // Masukkan Detail Anak (titik, contoh: 51010.01)
    allAkun.forEach(a => {
      const no = String(a.nomor_akun);
      if (no.includes('.')) {
        const indukKey = no[0] + '0000';
        const golKey = no.substring(0, 2);
        const kelKey = no.split('.')[0];
        if (indukMap[indukKey]?.golongans[golKey]?.kelompoks[kelKey]) {
          indukMap[indukKey].golongans[golKey].kelompoks[kelKey].anaks.push(a);
        }
      }
    });

    // Total Nominal per Akun
    const trxAmt: Record<string, { masuk: number; keluar: number; ct: number }> = {};
    [...trxYear, ...bankYear].forEach((row: any) => {
      const aId = String(row.akun_id ?? '');
      if (!aId || aId === '' || aId === 'null' || aId === 'undefined') return;
      if (!trxAmt[aId]) trxAmt[aId] = { masuk: 0, keluar: 0, ct: 0 };
      trxAmt[aId].masuk += cleanNum(row.uang_masuk ?? row.kredit);
      trxAmt[aId].keluar += cleanNum(row.uang_keluar ?? row.debet);
      trxAmt[aId].ct += 1;
    });

    // Total Bulanan per Akun
    const monthlyTrxAmt: Record<string, Record<number, { masuk: number; keluar: number }>> = {};
    [...trxYear, ...bankYear].forEach((row: any) => {
      const aId = String(row.akun_id ?? '');
      if (!aId || aId === 'null') return;
      const d = parseAnyDate(row.tanggal || row.waktu_transaksi);
      if (!d) return;
      const m = d.getMonth() + 1;
      if (!monthlyTrxAmt[aId]) {
        monthlyTrxAmt[aId] = {};
        BULAN.forEach((_, i) => { monthlyTrxAmt[aId][i+1] = { masuk: 0, keluar: 0 }; });
      }
      monthlyTrxAmt[aId][m].masuk += cleanNum(row.uang_masuk ?? row.kredit);
      monthlyTrxAmt[aId][m].keluar += cleanNum(row.uang_keluar ?? row.debet);
    });

    const getMonthTotals = (idSet: Set<string>) => {
      const mt: Record<number, { masuk: number; keluar: number }> = {};
      BULAN.forEach((_, i) => { mt[i+1] = { masuk: 0, keluar: 0 }; });
      idSet.forEach(id => {
        const amt = monthlyTrxAmt[id];
        if (amt) {
          BULAN.forEach((_, i) => {
            mt[i+1].masuk += amt[i+1].masuk;
            mt[i+1].keluar += amt[i+1].keluar;
          });
        }
      });
      return mt;
    };

    // Rollup Akun 4 Tingkat
    const result = Object.values(indukMap).map((induk: any) => {
      const indukIdSet = new Set<string>([String(induk.id)]);

      const gols = Object.values(induk.golongans).map((gol: any) => {
        const golIdSet = new Set<string>();

        const kels = Object.values(gol.kelompoks).map((kel: any) => {
          const kelIdSet = new Set<string>([String(kel.id)]);

          const anaks = (kel.anaks || []).map((anak: any) => {
            const anakIdSet = new Set<string>([String(anak.id)]);
            kelIdSet.add(String(anak.id));
            golIdSet.add(String(anak.id));
            indukIdSet.add(String(anak.id));
            const amt = trxAmt[String(anak.id)] || { masuk: 0, keluar: 0, ct: 0 };
            return { ...anak, masuk: amt.masuk, keluar: amt.keluar, ct: amt.ct, monthTotals: getMonthTotals(anakIdSet) };
          });

          golIdSet.add(String(kel.id));
          indukIdSet.add(String(kel.id));

          const kelTot = anaks.reduce((acc: any, a: any) => ({ masuk: acc.masuk + a.masuk, keluar: acc.keluar + a.keluar, ct: acc.ct + a.ct }), { masuk: 0, keluar: 0, ct: 0 });
          const kelDirect = trxAmt[String(kel.id)] || { masuk: 0, keluar: 0, ct: 0 };

          return {
            ...kel,
            anaks,
            masuk: kelTot.masuk + kelDirect.masuk,
            keluar: kelTot.keluar + kelDirect.keluar,
            ct: kelTot.ct + kelDirect.ct,
            monthTotals: getMonthTotals(kelIdSet),
          };
        }).filter((k: any) => k.masuk + k.keluar > 0 || k.ct > 0);

        const golTot = kels.reduce((acc: any, k: any) => ({ masuk: acc.masuk + k.masuk, keluar: acc.keluar + k.keluar, ct: acc.ct + k.ct }), { masuk: 0, keluar: 0, ct: 0 });

        return {
          ...gol,
          kelompoks: kels,
          masuk: golTot.masuk,
          keluar: golTot.keluar,
          ct: golTot.ct,
          monthTotals: getMonthTotals(golIdSet),
        };
      }).filter((g: any) => g.masuk + g.keluar > 0 || g.ct > 0);

      const indukTot = gols.reduce((acc: any, g: any) => ({ masuk: acc.masuk + g.masuk, keluar: acc.keluar + g.keluar, ct: acc.ct + g.ct }), { masuk: 0, keluar: 0, ct: 0 });
      const indukDirect = trxAmt[String(induk.id)] || { masuk: 0, keluar: 0, ct: 0 };

      return {
        ...induk,
        golongans: gols,
        masuk: indukTot.masuk + indukDirect.masuk,
        keluar: indukTot.keluar + indukDirect.keluar,
        ct: indukTot.ct + indukDirect.ct,
        monthTotals: getMonthTotals(indukIdSet),
      };
    }).filter((i: any) => i.masuk + i.keluar > 0 || i.ct > 0);

    const accRunning: any[] = rekList.map(r => {
      const perMonth: Record<number, number> = {};
      let cur = r.saldoAwal;
      BULAN.forEach((_, i) => {
        const m = i + 1;
        let mIn = 0, mOut = 0;
        if (r.id === 'kas') {
          const mTrx = trxYear.filter(t => { const d = parseAnyDate(t.tanggal); return d && d.getMonth() + 1 === m; });
          mIn = mTrx.reduce((s, t) => s + (Number(t.uang_masuk) || 0), 0);
          mOut = mTrx.reduce((s, t) => s + (Number(t.uang_keluar) || 0), 0);
        } else {
          const mBank = bankYear.filter(b => { const d = parseAnyDate(b.waktu_transaksi); return String(b.rekening_id) === String(r.id) && d && d.getMonth() + 1 === m; });
          mIn = mBank.reduce((s, b) => s + cleanNum(b.kredit), 0);
          mOut = mBank.reduce((s, b) => s + cleanNum(b.debet), 0);
        }
        cur += mIn - mOut;
        perMonth[m] = cur;
      });
      return { ...r, monthlySaldo: perMonth };
    });

    setMonthlyAccountSaldo(accRunning);
    setCoaMonthTable(result);
  };

  const toggleCoa = (id: string) => setExpandedCoa(p => ({ ...p, [id]: p[id] !== undefined ? !p[id] : !(hierarchyLevel >= 2) }));
  const toggleGol = (id: string) => setExpandedGol(p => ({ ...p, [id]: p[id] !== undefined ? !p[id] : !(hierarchyLevel >= 3) }));
  const toggleKel = (id: string) => setExpandedKel(p => ({ ...p, [id]: p[id] !== undefined ? !p[id] : !(hierarchyLevel >= 4) }));

  // Expand / Collapse Bertingkat Sesuai Standar Template Design System Tab 08
  const setHierarchyTo = (lvl: number) => {
    setHierarchyLevel(lvl);
    const nextCoa: Record<string, boolean> = {};
    const nextGol: Record<string, boolean> = {};
    const nextKel: Record<string, boolean> = {};
    coaMonthTable.forEach((induk: any) => {
      nextCoa[induk.id] = lvl >= 2;
      (induk.golongans || []).forEach((gol: any) => {
        nextGol[gol.id] = lvl >= 3;
        (gol.kelompoks || []).forEach((kel: any) => {
          nextKel[kel.id] = lvl >= 4;
        });
      });
    });
    setExpandedCoa(nextCoa);
    setExpandedGol(nextGol);
    setExpandedKel(nextKel);
    if (lvl === 1) {
      setExpandPosisiAwal(false);
      setExpandPosisiAkhir(false);
    }
  };

  const handleExpandAll = () => setHierarchyTo(4);
  const handleCollapseAll = () => setHierarchyTo(1);

  const yFmt = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}M`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}jt`;
    return `${(v / 1e3).toFixed(0)}rb`;
  };

  // Active Month Indices
  const activeMonthIdx = useMemo(() => {
    return BULAN.map((_, i) => i + 1).filter(m => {
      return coaMonthTable.some(row => (row.monthTotals[m]?.masuk || 0) + (row.monthTotals[m]?.keluar || 0) > 0);
    });
  }, [coaMonthTable]);

  // Filtered COA Month Table (Search & Quick Category Chips)
  const filteredCoaMonthTable = useMemo(() => {
    let list = coaMonthTable;
    
    // Quick filter category
    if (selectedCategoryChip === '4') {
      list = list.filter(induk => String(induk.nomor_akun).startsWith('4'));
    } else if (selectedCategoryChip === '5') {
      list = list.filter(induk => String(induk.nomor_akun).startsWith('5'));
    } else if (selectedCategoryChip === '1') {
      list = list.filter(induk => String(induk.nomor_akun).startsWith('1'));
    } else if (selectedCategoryChip === '9') {
      list = list.filter(induk => String(induk.nomor_akun).startsWith('9') || induk.nama_akun?.toLowerCase().includes('koreksi'));
    }

    // Search filter
    if (!searchKeyword.trim()) return list;

    const kw = searchKeyword.toLowerCase();
    return list.map(induk => {
      const indukMatch = induk.nama_akun?.toLowerCase().includes(kw) || String(induk.nomor_akun).toLowerCase().includes(kw);

      const matchingGols = (induk.golongans || []).map((gol: any) => {
        const golMatch = gol.nama_akun?.toLowerCase().includes(kw) || String(gol.nomor_akun).toLowerCase().includes(kw);

        const matchingKels = (gol.kelompoks || []).map((kel: any) => {
          const kelMatch = kel.nama_akun?.toLowerCase().includes(kw) || String(kel.nomor_akun).toLowerCase().includes(kw);
          const matchingAnaks = (kel.anaks || []).filter((anak: any) => 
            anak.nama_akun?.toLowerCase().includes(kw) || String(anak.nomor_akun).toLowerCase().includes(kw)
          );
          if (kelMatch || matchingAnaks.length > 0) {
            return { ...kel, anaks: matchingAnaks.length > 0 ? matchingAnaks : kel.anaks };
          }
          return null;
        }).filter(Boolean);

        if (golMatch || matchingKels.length > 0) {
          return { ...gol, kelompoks: matchingKels.length > 0 ? matchingKels : gol.kelompoks };
        }
        return null;
      }).filter(Boolean);

      if (indukMatch || matchingGols.length > 0) {
        return { ...induk, golongans: matchingGols.length > 0 ? matchingGols : induk.golongans };
      }
      return null;
    }).filter(Boolean);
  }, [coaMonthTable, selectedCategoryChip, searchKeyword]);

  // Real Excel (.xlsx) Export Handler
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const exportRows: any[] = [];
      
      // 1. Baris Posisi Awal
      const awalRow: any = {
        'Kode Akun': '-',
        'Nama Akun / Uraian': 'TOTAL POSISI AWAL',
        'Tingkat': 'Summary',
        'Saldo Awal': summary.saldoAwal,
      };
      activeMonthIdx.forEach(m => {
        const prevM = m - 1;
        const val = prevM === 0 ? summary.saldoAwal : (chartData[prevM - 1]?.saldo || 0);
        awalRow[BULAN[m - 1]] = val;
      });
      awalRow['Saldo Akhir'] = summary.saldoAwal;
      exportRows.push(awalRow);

      // 2. Baris Hierarki Akun (Induk -> Golongan -> Kelompok -> Detail)
      coaMonthTable.forEach((induk: any) => {
        const indukRow: any = {
          'Kode Akun': induk.nomor_akun,
          'Nama Akun / Uraian': induk.nama_akun,
          'Tingkat': 'Induk Utama',
          'Saldo Awal': induk.saldoAwal || 0,
        };
        activeMonthIdx.forEach(m => {
          const val = induk.monthTotals[m] || { masuk: 0, keluar: 0 };
          indukRow[BULAN[m - 1]] = val.masuk - val.keluar;
        });
        indukRow['Saldo Akhir'] = induk.masuk - induk.keluar;
        exportRows.push(indukRow);

        (induk.golongans || []).forEach((gol: any) => {
          const golRow: any = {
            'Kode Akun': `  ${gol.nomor_akun}`,
            'Nama Akun / Uraian': `  ${gol.nama_akun}`,
            'Tingkat': 'Golongan',
            'Saldo Awal': 0,
          };
          activeMonthIdx.forEach(m => {
            const val = gol.monthTotals[m] || { masuk: 0, keluar: 0 };
            golRow[BULAN[m - 1]] = val.masuk - val.keluar;
          });
          golRow['Saldo Akhir'] = gol.masuk - gol.keluar;
          exportRows.push(golRow);

          (gol.kelompoks || []).forEach((kel: any) => {
            const kelRow: any = {
              'Kode Akun': `    ${kel.nomor_akun}`,
              'Nama Akun / Uraian': `    ${kel.nama_akun}`,
              'Tingkat': 'Kelompok',
              'Saldo Awal': 0,
            };
            activeMonthIdx.forEach(m => {
              const val = kel.monthTotals[m] || { masuk: 0, keluar: 0 };
              kelRow[BULAN[m - 1]] = val.masuk - val.keluar;
            });
            kelRow['Saldo Akhir'] = kel.masuk - kel.keluar;
            exportRows.push(kelRow);

            (kel.anaks || []).forEach((anak: any) => {
              const anakRow: any = {
                'Kode Akun': `      ${anak.nomor_akun}`,
                'Nama Akun / Uraian': `      ${anak.nama_akun}`,
                'Tingkat': 'Detail',
                'Saldo Awal': 0,
              };
              activeMonthIdx.forEach(m => {
                const val = anak.monthTotals[m] || { masuk: 0, keluar: 0 };
                anakRow[BULAN[m - 1]] = val.masuk - val.keluar;
              });
              anakRow['Saldo Akhir'] = anak.masuk - anak.keluar;
              exportRows.push(anakRow);
            });
          });
        });
      });

      // 3. Baris Posisi Akhir
      const akhirRow: any = {
        'Kode Akun': '-',
        'Nama Akun / Uraian': 'TOTAL POSISI AKHIR',
        'Tingkat': 'Summary',
        'Saldo Awal': '-',
      };
      activeMonthIdx.forEach(m => {
        akhirRow[BULAN[m - 1]] = chartData[m - 1]?.saldo || 0;
      });
      akhirRow['Saldo Akhir'] = summary.saldoAkhir;
      exportRows.push(akhirRow);

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Dashboard_${tahun}`);
      XLSX.writeFile(workbook, `Laporan_Dashboard_Konsolidasi_${tahun}.xlsx`);
      triggerToast('success', 'Export Excel Berhasil', `File Laporan_Dashboard_Konsolidasi_${tahun}.xlsx telah diunduh.`);
    } catch (err: any) {
      triggerToast('error', 'Export Gagal', err.message || 'Terjadi gangguan saat membuat berkas Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Surplus / Defisit Bersih
  const netSurplus = summary.masuk - summary.keluar;
  const avgMasuk = Math.round(summary.masuk / Math.max(1, activeMonthIdx.length));
  const avgKeluar = Math.round(summary.keluar / Math.max(1, activeMonthIdx.length));

  // Render Shimmer Skeleton State jika masih memuat data
  if (loading) {
    return (
      <div className="space-y-4 pb-16">
        <PageHeader
          title="Dashboard Keuangan & Konsolidasi"
          subtitle="Memuat ringkasan kas, mutasi rekening bank, dan buku besar..."
          icon={BarChart2}
          breadcrumbs={[
            { label: 'Beranda', href: '/dashboard' },
            { label: 'Dashboard Konsolidasi' },
          ]}
          badge={{ text: `Tahun Anggaran ${tahun}`, variant: 'purple' }}
        />
        <SkeletonTable rows={8} columns={10} showStatCards={true} statCardCount={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 font-sans text-gray-900 dark:text-slate-100">
      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} position="top-right" />

      {/* FORCE LANDSCAPE & STYLING CETAK PDF TANPA TERPOTONG */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            size: landscape; 
            margin: 6mm 4mm; 
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box !important;
          }

          body, html {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .print:hidden, nav, header, aside, .sticky, button {
            display: none !important;
          }

          .print-card-container {
             display: flex !important;
             gap: 12px !important;
             margin-bottom: 16px !important;
          }

          .print-card {
             flex: 1;
             border: 1px solid #64748b !important;
             background-color: #ffffff !important;
             padding: 6px 10px !important;
             border-radius: 4px !important;
             box-shadow: none !important;
             color: #000000 !important;
             min-height: auto !important;
          }

          .print-card * {
             color: #000000 !important;
             opacity: 1 !important;
             text-shadow: none !important;
             box-shadow: none !important;
          }

          /* Sembunyikan elemen web yang tidak perlu */
          svg.lucide-chevron-right, svg.lucide-chevron-down { display: none !important; }
          .overflow-x-auto { overflow: visible !important; }

          /* TABEL CETAK PAS 100% KERTAS LANDSCAPE AGAR BULAN TIDAK TERPOTONG */
          table { 
            width: 100% !important; 
            max-width: 100% !important;
            table-layout: fixed !important; 
            border-collapse: collapse !important; 
          }

          table tr { background-color: transparent !important; }

          th, td { 
             border: 0.5px solid #64748b !important;
             color: #000000 !important; 
             background-color: #ffffff !important; 
             box-shadow: none !important;
             padding: 3px 2px !important;
             font-size: 7.5px !important;
             line-height: 1.15 !important;
             opacity: 1 !important;
             min-width: 0 !important;
             word-break: break-all !important;
             white-space: normal !important;
          }

          th { 
             background-color: #e2e8f0 !important; 
             font-weight: 900 !important; 
             text-align: center !important;
             font-size: 8px !important;
          }

          /* Kolom 1 (Akun Hirarki) proporsi 22% */
          table th:first-child, table td:first-child {
             width: 22% !important;
             max-width: 22% !important;
             text-align: left !important;
             padding-left: 4px !important;
             font-size: 8px !important;
             overflow: hidden !important;
             text-overflow: ellipsis !important;
          }

          /* Sembunyikan Saldo Awal di tabel mutasi agar 12 bulan tidak terpotong */
          table th:nth-child(2), table td:nth-child(2) {
             display: none !important;
          }

          /* Kolom 12 Bulan Rata ~5.8% masing-masing */
          table th:not(:first-child):not(:last-child), table td:not(:first-child):not(:last-child) {
             width: 5.8% !important;
             text-align: right !important;
             font-size: 7px !important;
             padding: 2.5px 1.5px !important;
          }

          /* Kolom Total Setahun ~8.4% */
          table th:last-child, table td:last-child {
             width: 8.4% !important;
             text-align: right !important;
             font-weight: bold !important;
             font-size: 7.5px !important;
          }
          
          /* WARNA CETAK KHUSUS SESUAI COA */
          tr.print-induk-masuk td {
             background-color: #bbf7d0 !important;
             font-weight: bold !important;
             color: #000000 !important;
          }
          tr.print-gol-masuk td {
             background-color: #dcfce7 !important;
             font-weight: 700 !important;
             color: #000000 !important;
          }
          tr.print-kel-masuk td {
             background-color: #f0fdf4 !important;
             font-weight: 600 !important;
             color: #000000 !important;
          }

          tr.print-induk-keluar td {
             background-color: #fecaca !important;
             font-weight: bold !important;
             color: #000000 !important;
          }
          tr.print-gol-keluar td {
             background-color: #fee2e2 !important;
             font-weight: 700 !important;
             color: #000000 !important;
          }
          tr.print-kel-keluar td {
             background-color: #fff1f2 !important;
             font-weight: 600 !important;
             color: #000000 !important;
          }
          
          tr.print-induk td {
             background-color: #e2e8f0 !important; 
             font-weight: bold !important;
             color: #000000 !important;
          }
          tr.print-gol td {
             background-color: #f1f5f9 !important; 
             font-weight: 700 !important;
             color: #000000 !important;
          }
          tr.print-kel td {
             background-color: #f8fafc !important; 
             font-weight: 600 !important;
             color: #000000 !important;
          }
          
          tr.print-anak td {
             background-color: #ffffff !important; 
             font-weight: normal !important;
          }

          .print-expand { display: table-row !important; }
        }
      `}} />

      {/* 1. STANDARD PAGE HEADER (Design System Baku) */}
      <div className="print:hidden">
        <PageHeader
          title="Dashboard Keuangan & Konsolidasi"
          subtitle="Konsolidasi transaksi kas masjid, mutasi rekening bank, dan pembukuan akun secara interaktif"
          icon={BarChart2}
          breadcrumbs={[
            { label: 'Beranda', href: '/dashboard' },
            { label: 'Dashboard Konsolidasi' },
          ]}
          badge={{ text: `Tahun Anggaran ${tahun}`, variant: 'purple' }}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Year Filter Pill */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-8 sm:h-9 shadow-2xs">
                <Filter size={13} className="text-slate-400 dark:text-slate-500" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tahun:</span>
                <select
                  value={tahun}
                  onChange={e => {
                    const newYr = Number(e.target.value);
                    setTahun(newYr);
                    triggerToast('info', 'Periode Berubah', `Memuat data konsolidasi tahun ${newYr}`);
                  }}
                  className="bg-transparent text-slate-900 dark:text-slate-100 font-bold text-xs outline-none cursor-pointer"
                >
                  {tahunList.map(y => (
                    <option key={y} value={y} className="text-slate-900 bg-white dark:bg-slate-800">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchAll}
                title="Muat Ulang Data Server"
                className="h-8 sm:h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
              </button>

              {/* Export Buttons */}
              <ExportButtons
                onExportExcel={handleExportExcel}
                onExportPdf={() => window.print()}
                isExportingExcel={isExportingExcel}
                excelLabel="Unduh Excel"
                pdfLabel="Cetak PDF"
                size="sm"
              />
            </div>
          }
        />
      </div>

      {/* HEADER KHUSUS CETAK PDF */}
      <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-3">
        <h1 className="text-2xl font-black tracking-widest uppercase">Laporan Konsolidasi Kas & Bank Masjid</h1>
        <p className="font-bold text-gray-700 text-xs mt-1">Tahun Anggaran: {tahun} | Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* 2. STAT CARDS GRID (Design System Baku: 4 Kolom, Ketahanan Likuiditas Ditiadakan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 print:flex print-card-container">
        <StatCard
          title="TOTAL SALDO AWAL"
          value={`Rp ${fmt(summary.saldoAwal)}`}
          subtitle={`Posisi per 1 Januari ${tahun}`}
          icon={Wallet}
          variant="indigo"
          lightBg={true}
        />
        <StatCard
          title="TOTAL PENERIMAAN"
          value={`Rp ${fmt(summary.masuk)}`}
          subtitle="Infaq, Donasi & Mutasi Bank"
          icon={TrendingDown}
          variant="emerald"
          trend={{ value: 'Penerimaan', isUp: true, isGood: true }}
          lightBg={true}
        />
        <StatCard
          title="TOTAL PENGELUARAN"
          value={`Rp ${fmt(summary.keluar)}`}
          subtitle="Operasional, Belanja & Mutasi"
          icon={TrendingUp}
          variant="rose"
          trend={{ value: 'Pengeluaran', isUp: false, isGood: false }}
          lightBg={true}
        />
        <StatCard
          title="POSISI SALDO AKHIR"
          value={`Rp ${fmt(summary.saldoAkhir)}`}
          subtitle="Total Kas Kecil + Rekening Bank"
          icon={PiggyBank}
          variant="blue"
          lightBg={true}
        />
      </div>

      {/* 3. RINCIAN LIKUIDITAS REKENING BANK & KAS KECIL (Nama Bank & No Rek Lengkap) */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 md:p-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-2xs print:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-slate-200">
              Rincian Likuiditas Rekening Bank & Kas Kecil
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
              {perRekening.length} Kantong Dana
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowRekeningBreakdown(!showRekeningBreakdown)}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showRekeningBreakdown ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}</span>
            {showRekeningBreakdown ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>

        {showRekeningBreakdown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
            {perRekening.map((rek) => {
              const rekSaldoAkhir = rek.saldoAwal + rek.masuk - rek.keluar;
              const isKas = rek.id === 'kas';

              return (
                <div
                  key={rek.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xs transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      {isKas ? (
                        <Wallet size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <CreditCard size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="text-xs font-black text-gray-900 dark:text-slate-100 block truncate" title={rek.nama}>
                          {rek.nama_bank || rek.nama}
                        </span>
                        {rek.nomor_rekening && (
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-mono block">
                            No. Rek: {rek.nomor_rekening}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      isKas 
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                        : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {isKas ? 'Kas Tunai' : 'Bank'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Saldo Awal:</span>
                      <span>Rp {fmt(rek.saldoAwal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>+ Masuk:</span>
                      <span>Rp {fmt(rek.masuk)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>- Keluar:</span>
                      <span>Rp {fmt(rek.keluar)}</span>
                    </div>
                    <div className="flex justify-between font-black text-gray-900 dark:text-slate-100 pt-1.5 border-t border-slate-200/80 dark:border-slate-700/80">
                      <span>Saldo Akhir:</span>
                      <span className={rekSaldoAkhir >= 0 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                        Rp {fmt(rekSaldoAkhir)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. GRAFIK TREN ARUS KAS BULANAN (DIPERCANTIK: GLOW AREA + KPI SUMMARY + MODERN BAR) */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-2xs border border-gray-200/90 dark:border-slate-800 p-5 md:p-6 space-y-4 print:hidden">
        {/* Top Header of Chart */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                <Activity size={16} />
              </div>
              <h3 className="font-black text-gray-900 dark:text-slate-100 text-sm uppercase tracking-wider">
                Tren Arus Kas Bulanan (Tahun {tahun})
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Visualisasi dinamika mutasi uang masuk, belanja keluar, serta saldo kas berjalan
            </p>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Net Surplus / Defisit Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-2xs ${
              netSurplus >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}>
              {netSurplus >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>Net {netSurplus >= 0 ? 'Surplus' : 'Defisit'}: Rp {fmt(Math.abs(netSurplus))}</span>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="text-slate-400">Rata-rata Masuk:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">Rp {fmt(avgMasuk)}/bln</strong>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <span className="text-slate-400">Rata-rata Keluar:</span>
              <strong className="text-rose-600 dark:text-rose-400 font-mono">Rp {fmt(avgKeluar)}/bln</strong>
            </div>

            {/* Series Toggles (Modern Pills) */}
            <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-slate-800 p-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={chartSeries.masuk}
                  onChange={(e) => setChartSeries({ ...chartSeries, masuk: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <span>Uang Masuk</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-rose-700 dark:text-rose-400 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={chartSeries.keluar}
                  onChange={(e) => setChartSeries({ ...chartSeries, keluar: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-0"
                />
                <span>Uang Keluar</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-indigo-700 dark:text-indigo-400 hover:opacity-80 transition-opacity">
                <input
                  type="checkbox"
                  checked={chartSeries.saldo}
                  onChange={(e) => setChartSeries({ ...chartSeries, saldo: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Saldo</span>
              </label>
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-[380px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }} barGap={8}>
              <defs>
                {/* Glow Area untuk Saldo Berjalan */}
                <linearGradient id="saldoGlowArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="60%" stopColor="#818cf8" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>

                {/* Rounded Bar Gradient Masuk */}
                <linearGradient id="masukBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>

                {/* Rounded Bar Gradient Keluar */}
                <linearGradient id="keluarBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.8} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" opacity={0.6} />

              <XAxis 
                dataKey="bln" 
                tick={{ fontSize: 12, fontWeight: 800, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
                dy={8}
              />

              <YAxis 
                tickFormatter={yFmt} 
                tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomChartTooltip />} />

              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingBottom: 15 }} 
              />

              {/* Area Saldo Berjalan (Glow Bawah) */}
              {chartSeries.saldo && (
                <Area 
                  type="monotone" 
                  dataKey="saldo" 
                  fill="url(#saldoGlowArea)" 
                  stroke="none" 
                  isAnimationActive={true}
                />
              )}

              {/* Bar Masuk */}
              {chartSeries.masuk && (
                <Bar 
                  dataKey="masuk" 
                  name="Uang Masuk" 
                  fill="url(#masukBarGradient)" 
                  radius={[8, 8, 2, 2]} 
                  barSize={20} 
                  isAnimationActive={true}
                />
              )}

              {/* Bar Keluar */}
              {chartSeries.keluar && (
                <Bar 
                  dataKey="keluar" 
                  name="Uang Keluar" 
                  fill="url(#keluarBarGradient)" 
                  radius={[8, 8, 2, 2]} 
                  barSize={20} 
                  isAnimationActive={true}
                />
              )}

              {/* Line Saldo Berjalan */}
              {chartSeries.saldo && (
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  name="Saldo Berjalan" 
                  stroke="#4f46e5" 
                  strokeWidth={3.5} 
                  dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2.5, stroke: '#ffffff' }} 
                  activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 3 }}
                  isAnimationActive={true}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. COA MONTH TABLE HIERARKI BAKU (Induk -> Golongan 51,52,53 -> Kelompok -> Detail) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-gray-200/90 dark:border-slate-800 overflow-hidden space-y-0">
        {/* Table Top Toolbar */}
        <div className="p-4 px-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-850/60 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 print:hidden">
          <div className="space-y-0.5">
            <h3 className="font-black text-gray-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-2">
              <TableIcon size={16} className="text-blue-600 dark:text-blue-400" /> 
              Bagan Akun Standar (COA) — Mutasi Per Bulan
            </h3>
            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
              Hirarki bertingkat: Induk ➔ Golongan (51, 52, 53...) ➔ Kelompok ➔ Detail. Klik nama akun untuk membuka rinciannya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* Search Input Filter */}
            <div className="relative min-w-[210px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Cari kode atau nama akun..."
                className="w-full pl-8 pr-3 h-8 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            {/* Selector Jenjang Hierarki Bertahap Sesuai Template Design System Tab 08 */}
            <div className="inline-flex items-center rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs">
              {[
                { lvl: 1, label: 'Induk', title: 'Tingkat 1: Tampilkan hanya Akun Induk (40000 / 50000)' },
                { lvl: 2, label: '+Golongan', title: 'Tingkat 2: Buka sampai Golongan MAK (41, 51, dst)' },
                { lvl: 3, label: '+Kelompok', title: 'Tingkat 3: Buka sampai Kelompok Sub-Akun' },
                { lvl: 4, label: '+Detail', title: 'Tingkat 4: Buka seluruh Rincian Akun Detail' },
              ].map((item) => (
                <button
                  key={item.lvl}
                  type="button"
                  onClick={() => setHierarchyTo(item.lvl)}
                  title={item.title}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    hierarchyLevel === item.lvl
                      ? 'bg-indigo-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Table Density Toggle */}
            <TableDensityToggle density={tableDensity} onChange={setTableDensity} />
          </div>
        </div>

        {/* Quick Filter Chips (All, Penerimaan, Pengeluaran, Kas & Bank) */}
        <div className="px-5 py-2.5 bg-slate-50/40 dark:bg-slate-850/40 border-b border-gray-100 dark:border-slate-800 print:hidden flex items-center justify-between">
          <QuickFilterChips
            selectedChipId={selectedCategoryChip}
            onSelect={setSelectedCategoryChip}
            chips={[
              { id: 'all', label: 'Semua Akun' },
              { id: '4', label: 'Penerimaan (4xxxx)', variant: 'emerald' },
              { id: '5', label: 'Biaya / Pengeluaran (5xxxx)', variant: 'rose' },
              { id: '1', label: 'Kas & Bank (1xxxx)', variant: 'blue' },
              { id: '9', label: 'Koreksi (9xxxx)', variant: 'amber' },
            ]}
          />

          <span className="text-[11px] text-gray-400 dark:text-slate-500 font-mono hidden md:inline">
            Menampilkan {filteredCoaMonthTable.length} akun utama
          </span>
        </div>

        {/* Table Content Container */}
        <div className="overflow-x-auto">
          {(() => {
            if (activeMonthIdx.length === 0) {
              return (
                <EmptyState
                  type="empty"
                  title={`Tidak Ada Data Transaksi Tahun ${tahun}`}
                  description="Belum ada transaksi kas atau mutasi bank yang tercatat pada tahun anggaran yang dipilih."
                  actionLabel="Muat Ulang Data"
                  onAction={fetchAll}
                />
              );
            }

            if (filteredCoaMonthTable.length === 0) {
              return (
                <EmptyState
                  type="search"
                  title="Akun Tidak Ditemukan"
                  description={`Tidak ditemukan akun yang cocok dengan kata kunci "${searchKeyword}". Silakan periksa kembali atau bersihkan filter.`}
                  actionLabel="Bersihkan Pencarian"
                  onAction={() => {
                    setSearchKeyword('');
                    setSelectedCategoryChip('all');
                  }}
                />
              );
            }

            // Cell Padding berdasarkan Density (Luwes vs Rapat)
            const cellPadClass = tableDensity === 'compact' ? 'py-1.5 px-2 text-[11px]' : 'py-3 px-3 text-xs';
            const headPadClass = tableDensity === 'compact' ? 'py-2 px-2 text-[11px]' : 'py-3.5 px-3 text-xs';

            const renderTable = (mode: 'web' | 'print-summary' | 'print-detail') => {
              const wrapperClass = mode === 'web' ? 'print:hidden' : mode === 'print-summary' ? 'hidden print:table mb-12' : 'hidden print:table';

              // Komponen Baris Rekursif Hirarki 4 Tingkat
              const TableRow = ({ row, depth = 0, type = 'induk', isHiddenByParent = false }: any) => {
                const isInduk = type === 'induk';
                const isGol = type === 'gol';
                const isKel = type === 'kel';
                const isAnak = type === 'anak';

                const isExpanded = mode === 'web' 
                  ? (isInduk 
                      ? (expandedCoa[row.id] ?? (hierarchyLevel >= 2)) 
                      : isGol 
                        ? (expandedGol[row.id] ?? (hierarchyLevel >= 3)) 
                        : isKel 
                          ? (expandedKel[row.id] ?? (hierarchyLevel >= 4)) 
                          : false)
                  : mode === 'print-detail';

                const toggle = mode === 'web' 
                  ? (isInduk ? () => toggleCoa(row.id) : isGol ? () => toggleGol(row.id) : isKel ? () => toggleKel(row.id) : null)
                  : null;

                const hasChildren = (isInduk && row.golongans?.length > 0) || (isGol && row.kelompoks?.length > 0) || (isKel && row.anaks?.length > 0);
                const shouldRenderChildren = mode !== 'print-summary' && (mode === 'print-detail' || isExpanded);

                if (row.masuk === 0 && row.keluar === 0) return null;

                const isHiddenAccount = row.nama_akun?.toLowerCase().includes('koreksi bank') || (row.nomor_akun?.startsWith('10') && mode !== 'web');
                if (mode !== 'web' && isHiddenAccount) return null;

                const accPrefix = String(row.nomor_akun).charAt(0);
                const isKoreksi = accPrefix === '9' || row.nama_akun?.toLowerCase().includes('koreksi');
                const isKas = accPrefix === '1';
                const isPenerimaan = accPrefix === '4';
                const isBeban = accPrefix === '5';
                const isPengeluaran = isBeban;
                const typeSuffix = isPenerimaan ? '-masuk' : isPengeluaran ? '-keluar' : '';
                const printClass = mode !== 'web' 
                  ? (isInduk ? `print-induk${typeSuffix}` : isGol ? `print-gol${typeSuffix}` : isKel ? `print-kel${typeSuffix}` : 'print-anak')
                  : '';

                // Style Baris Berdasarkan Kategori Akun & Tingkat Hirarki:
                // 4xxxx Penerimaan -> Hijau Soft (Emerald)
                // 5xxxx Biaya      -> Merah Soft (Rose)
                // 1xxxx Kas & Bank -> Ungu Soft (Purple)
                // 9xxxx Koreksi    -> Kuning Soft (Amber)
                // Lainnya          -> Biru Soft (Sky)
                let rowBgClass = 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors';
                let labelStyle = 'font-normal text-gray-600 dark:text-slate-400';
                let badgePrefix = '';
                let stickyLeftBg = 'bg-white dark:bg-slate-900';
                let stickyRightBg = 'bg-white text-indigo-800 dark:bg-[#0f172a] dark:text-indigo-300';
                let badgeBg = 'text-slate-400 dark:text-slate-500 font-mono';
                let monthCellBg = 'border-indigo-50 dark:border-slate-800';

                if (isPenerimaan) {
                  // 4xxxx Penerimaan: Gradasi Hijau Soft (Emerald)
                  if (isInduk) {
                    rowBgClass = 'bg-[#a7f3d0] dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-black border-t-2 border-emerald-400';
                    labelStyle = 'font-black text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm';
                    stickyLeftBg = 'bg-[#a7f3d0] text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100';
                    monthCellBg = 'bg-[#a7f3d0] dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 font-bold border-emerald-300/80';
                    stickyRightBg = 'bg-[#86efac] text-emerald-950 dark:bg-emerald-800 dark:text-emerald-100 font-black';
                    badgeBg = 'text-emerald-950 dark:text-emerald-100 font-black';
                  } else if (isGol) {
                    rowBgClass = 'bg-[#d1fae5] dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 font-extrabold hover:bg-[#bbf7d0]';
                    labelStyle = 'font-extrabold text-emerald-950 dark:text-emerald-100 text-xs';
                    badgePrefix = 'Gol. ';
                    stickyLeftBg = 'bg-[#d1fae5] text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200';
                    monthCellBg = 'bg-[#d1fae5] dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold border-emerald-200/80';
                    stickyRightBg = 'bg-[#bbf7d0] text-emerald-950 dark:bg-emerald-900 dark:text-emerald-200 font-extrabold';
                    badgeBg = 'text-emerald-900 dark:text-emerald-200 font-extrabold';
                  } else if (isKel) {
                    rowBgClass = 'bg-[#ecfdf5] dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-semibold hover:bg-[#d1fae5]';
                    labelStyle = 'font-bold text-emerald-900 dark:text-emerald-200 text-xs';
                    stickyLeftBg = 'bg-[#ecfdf5] text-emerald-900 dark:bg-slate-900 dark:text-emerald-300';
                    monthCellBg = 'bg-[#ecfdf5] dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-medium border-emerald-100/70';
                    stickyRightBg = 'bg-[#d1fae5] text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-bold';
                    badgeBg = 'text-emerald-800 dark:text-emerald-300 font-bold';
                  } else {
                    stickyLeftBg = 'bg-white dark:bg-slate-900';
                    monthCellBg = 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100';
                    stickyRightBg = 'bg-white text-emerald-700 dark:bg-slate-900 dark:text-emerald-300 font-medium';
                    badgeBg = 'text-slate-400 dark:text-slate-500 font-normal';
                  }
                } else if (isBeban) {
                  // 5xxxx Biaya / Beban: Gradasi Merah Soft (Rose)
                  if (isInduk) {
                    rowBgClass = 'bg-[#fecdd3] dark:bg-rose-950/70 text-rose-950 dark:text-rose-100 font-black border-t-2 border-rose-400';
                    labelStyle = 'font-black text-rose-950 dark:text-rose-100 text-xs sm:text-sm';
                    stickyLeftBg = 'bg-[#fecdd3] text-rose-950 dark:bg-rose-900 dark:text-rose-100';
                    monthCellBg = 'bg-[#fecdd3] dark:bg-rose-900/60 text-rose-950 dark:text-rose-100 font-bold border-rose-300/80';
                    stickyRightBg = 'bg-[#fda4af] text-rose-950 dark:bg-rose-800 dark:text-rose-100 font-black';
                    badgeBg = 'text-rose-950 dark:text-rose-100 font-black';
                  } else if (isGol) {
                    rowBgClass = 'bg-[#ffe4e6] dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 font-extrabold hover:bg-[#fecdd3]';
                    labelStyle = 'font-extrabold text-rose-950 dark:text-rose-100 text-xs';
                    badgePrefix = 'Gol. ';
                    stickyLeftBg = 'bg-[#ffe4e6] text-rose-950 dark:bg-rose-950 dark:text-rose-200';
                    monthCellBg = 'bg-[#ffe4e6] dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold border-rose-200/80';
                    stickyRightBg = 'bg-[#fecdd3] text-rose-950 dark:bg-rose-900 dark:text-rose-200 font-extrabold';
                    badgeBg = 'text-rose-900 dark:text-rose-200 font-extrabold';
                  } else if (isKel) {
                    rowBgClass = 'bg-[#fff1f2] dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-semibold hover:bg-[#ffe4e6]';
                    labelStyle = 'font-bold text-rose-900 dark:text-rose-200 text-xs';
                    stickyLeftBg = 'bg-[#fff1f2] text-rose-900 dark:bg-slate-900 dark:text-rose-300';
                    monthCellBg = 'bg-[#fff1f2] dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 font-medium border-rose-100/70';
                    stickyRightBg = 'bg-[#ffe4e6] text-rose-900 dark:bg-rose-950 dark:text-rose-300 font-bold';
                    badgeBg = 'text-rose-800 dark:text-rose-300 font-bold';
                  } else {
                    stickyLeftBg = 'bg-white dark:bg-slate-900';
                    monthCellBg = 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100';
                    stickyRightBg = 'bg-white text-rose-700 dark:bg-slate-900 dark:text-rose-300 font-medium';
                    badgeBg = 'text-slate-400 dark:text-slate-500 font-normal';
                  }
                } else if (isKas) {
                  // 1xxxx Kas & Bank: Gradasi Ungu Soft (Purple / Violet)
                  if (isInduk) {
                    rowBgClass = 'bg-[#e9d5ff] dark:bg-purple-950/70 text-purple-950 dark:text-purple-100 font-black border-t-2 border-purple-400';
                    labelStyle = 'font-black text-purple-950 dark:text-purple-100 text-xs sm:text-sm';
                    stickyLeftBg = 'bg-[#e9d5ff] text-purple-950 dark:bg-purple-900 dark:text-purple-100';
                    monthCellBg = 'bg-[#e9d5ff] dark:bg-purple-900/60 text-purple-950 dark:text-purple-100 font-bold border-purple-300/80';
                    stickyRightBg = 'bg-[#d8b4fe] text-purple-950 dark:bg-purple-800 dark:text-purple-100 font-black';
                    badgeBg = 'text-purple-950 dark:text-purple-100 font-black';
                  } else if (isGol) {
                    rowBgClass = 'bg-[#f3e8ff] dark:bg-purple-950/50 text-purple-950 dark:text-purple-100 font-extrabold hover:bg-[#e9d5ff]';
                    labelStyle = 'font-extrabold text-purple-950 dark:text-purple-100 text-xs';
                    badgePrefix = 'Gol. ';
                    stickyLeftBg = 'bg-[#f3e8ff] text-purple-950 dark:bg-purple-950 dark:text-purple-200';
                    monthCellBg = 'bg-[#f3e8ff] dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 font-bold border-purple-200/80';
                    stickyRightBg = 'bg-[#e9d5ff] text-purple-950 dark:bg-purple-900 dark:text-purple-200 font-extrabold';
                    badgeBg = 'text-purple-900 dark:text-purple-200 font-extrabold';
                  } else if (isKel) {
                    rowBgClass = 'bg-[#faf5ff] dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-semibold hover:bg-[#f3e8ff]';
                    labelStyle = 'font-bold text-purple-900 dark:text-purple-200 text-xs';
                    stickyLeftBg = 'bg-[#faf5ff] text-purple-900 dark:bg-slate-900 dark:text-purple-300';
                    monthCellBg = 'bg-[#faf5ff] dark:bg-purple-950/20 text-purple-800 dark:text-purple-300 font-medium border-purple-100/70';
                    stickyRightBg = 'bg-[#f3e8ff] text-purple-900 dark:bg-purple-950 dark:text-purple-300 font-bold';
                    badgeBg = 'text-purple-800 dark:text-purple-300 font-bold';
                  } else {
                    stickyLeftBg = 'bg-white dark:bg-slate-900';
                    monthCellBg = 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100';
                    stickyRightBg = 'bg-white text-purple-700 dark:bg-slate-900 dark:text-purple-300 font-medium';
                    badgeBg = 'text-slate-400 dark:text-slate-500 font-normal';
                  }
                } else if (isKoreksi) {
                  // 9xxxx Koreksi: Gradasi Kuning Soft (Amber / Yellow)
                  if (isInduk) {
                    rowBgClass = 'bg-[#fef08a] dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 font-black border-t-2 border-amber-400';
                    labelStyle = 'font-black text-amber-950 dark:text-amber-100 text-xs sm:text-sm';
                    stickyLeftBg = 'bg-[#fef08a] text-amber-950 dark:bg-amber-900 dark:text-amber-100';
                    monthCellBg = 'bg-[#fef08a] dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 font-bold border-amber-300/80';
                    stickyRightBg = 'bg-[#fde047] text-amber-950 dark:bg-amber-800 dark:text-amber-100 font-black';
                    badgeBg = 'text-amber-950 dark:text-amber-100 font-black';
                  } else if (isGol) {
                    rowBgClass = 'bg-[#fef9c3] dark:bg-amber-950/50 text-amber-950 dark:text-amber-100 font-extrabold hover:bg-[#fef08a]';
                    labelStyle = 'font-extrabold text-amber-950 dark:text-amber-100 text-xs';
                    badgePrefix = 'Gol. ';
                    stickyLeftBg = 'bg-[#fef9c3] text-amber-950 dark:bg-amber-950 dark:text-amber-200';
                    monthCellBg = 'bg-[#fef9c3] dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 font-bold border-amber-200/80';
                    stickyRightBg = 'bg-[#fef08a] text-amber-950 dark:bg-amber-900 dark:text-amber-200 font-extrabold';
                    badgeBg = 'text-amber-900 dark:text-amber-200 font-extrabold';
                  } else if (isKel) {
                    rowBgClass = 'bg-[#fefce8] dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold hover:bg-[#fef9c3]';
                    labelStyle = 'font-bold text-amber-900 dark:text-amber-200 text-xs';
                    stickyLeftBg = 'bg-[#fefce8] text-amber-900 dark:bg-slate-900 dark:text-amber-300';
                    monthCellBg = 'bg-[#fefce8] dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-medium border-amber-100/70';
                    stickyRightBg = 'bg-[#fef9c3] text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold';
                    badgeBg = 'text-amber-800 dark:text-amber-300 font-bold';
                  } else {
                    stickyLeftBg = 'bg-white dark:bg-slate-900';
                    monthCellBg = 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100';
                    stickyRightBg = 'bg-white text-amber-700 dark:bg-slate-900 dark:text-amber-300 font-medium';
                    badgeBg = 'text-slate-400 dark:text-slate-500 font-normal';
                  }
                } else {
                  // Kategori Lainnya (Biru / Sky Soft)
                  if (isInduk) {
                    rowBgClass = 'bg-[#bae6fd] dark:bg-sky-950/70 text-sky-950 dark:text-sky-100 font-black border-t-2 border-sky-400';
                    labelStyle = 'font-black text-sky-950 dark:text-sky-100 text-xs sm:text-sm';
                    stickyLeftBg = 'bg-[#bae6fd] text-sky-950 dark:bg-sky-900 dark:text-sky-100';
                    monthCellBg = 'bg-[#bae6fd] dark:bg-sky-900/60 text-sky-950 dark:text-sky-100 font-bold border-sky-300/80';
                    stickyRightBg = 'bg-[#7dd3fc] text-sky-950 dark:bg-sky-800 dark:text-sky-100 font-black';
                    badgeBg = 'text-sky-950 dark:text-sky-100 font-black';
                  } else if (isGol) {
                    rowBgClass = 'bg-[#e0f2fe] dark:bg-sky-950/50 text-sky-950 dark:text-sky-100 font-extrabold hover:bg-[#bae6fd]';
                    labelStyle = 'font-extrabold text-sky-950 dark:text-sky-100 text-xs';
                    badgePrefix = 'Gol. ';
                    stickyLeftBg = 'bg-[#e0f2fe] text-sky-950 dark:bg-sky-950 dark:text-sky-200';
                    monthCellBg = 'bg-[#e0f2fe] dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 font-bold border-sky-200/80';
                    stickyRightBg = 'bg-[#bae6fd] text-sky-950 dark:bg-sky-900 dark:text-sky-200 font-extrabold';
                    badgeBg = 'text-sky-900 dark:text-sky-200 font-extrabold';
                  } else if (isKel) {
                    rowBgClass = 'bg-[#f0f9ff] dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 font-semibold hover:bg-[#e0f2fe]';
                    labelStyle = 'font-bold text-sky-900 dark:text-sky-200 text-xs';
                    stickyLeftBg = 'bg-[#f0f9ff] text-sky-900 dark:bg-slate-900 dark:text-sky-300';
                    monthCellBg = 'bg-[#f0f9ff] dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 font-medium border-sky-100/70';
                    stickyRightBg = 'bg-[#e0f2fe] text-sky-900 dark:bg-sky-950 dark:text-sky-300 font-bold';
                    badgeBg = 'text-sky-800 dark:text-sky-300 font-bold';
                  } else {
                    stickyLeftBg = 'bg-white dark:bg-slate-900';
                    monthCellBg = 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100';
                    stickyRightBg = 'bg-white text-sky-700 dark:bg-slate-900 dark:text-sky-300 font-medium';
                    badgeBg = 'text-slate-400 dark:text-slate-500 font-normal';
                  }
                }

                return (
                  <React.Fragment key={`${type}-${row.id}`}>
                    <tr className={`${rowBgClass} ${isHiddenByParent ? (mode === 'print-detail' ? '' : 'hidden') : ''} ${printClass}`}>
                      <td 
                        className={`${cellPadClass} border-r border-gray-100 dark:border-slate-800 sticky left-0 z-10 ${stickyLeftBg} shadow-[2px_0_5px_rgba(0,0,0,0.02)] ${hasChildren ? 'cursor-pointer select-none' : ''}`}
                        onClick={hasChildren ? (toggle || undefined) : undefined}
                        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
                      >
                        <div className="flex items-center gap-2">
                          {hasChildren ? (
                             isExpanded ? <ChevronDown size={14} className="text-gray-500 dark:text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          ) : <div className="w-3.5 shrink-0" />}
                          <div className="flex items-center gap-2 truncate">
                            <span className={`text-[11px] font-mono shrink-0 ${badgeBg}`}>
                              {badgePrefix}{row.nomor_akun}
                            </span>
                            <span className={`${labelStyle} truncate`} title={row.nama_akun}>
                              {row.nama_akun}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Saldo Awal (Disembunyikan pada cetak landscape agar bulan muat utuh) */}
                      <td className={`${cellPadClass} text-right border-r border-indigo-50 dark:border-slate-800 font-mono text-gray-400 dark:text-slate-500 italic`}>
                        {isInduk ? fmt(row.saldoAwal || 0) : ''}
                      </td>

                      {/* Kolom 12 Bulan Mutasi (Senada dengan Akun Hirarki & Total Setahun) */}
                      {activeMonthIdx.map(m => {
                        const val = row.monthTotals[m] || { masuk: 0, keluar: 0 };
                        const diff = val.masuk - val.keluar;
                        return (
                          <td key={m} className={`${cellPadClass} text-right border-r font-mono font-bold ${monthCellBg}`}>
                            {diff !== 0 ? fmt(Math.abs(diff)) : '-'}
                          </td>
                        );
                      })}

                      {/* Total Saldo Akhir (Kolom Terakhir Sticky Kanan Solid 100% Opaque Bebas Tembus) */}
                      <td className={`${cellPadClass} text-right font-black border-l border-indigo-200 dark:border-slate-800 sticky right-0 z-10 shadow-[-5px_0_12px_rgba(0,0,0,0.06)] ${stickyRightBg}`}>
                        {fmt(isPengeluaran ? Math.abs(row.masuk - row.keluar) : (row.masuk - row.keluar))}
                      </td>
                    </tr>

                    {/* Anak Hirarki Golongan (51, 52, 53) */}
                    {shouldRenderChildren && isInduk && (row.golongans || []).map((g: any) => (
                      <TableRow key={g.id} row={g} depth={1} type="gol" isHiddenByParent={isHiddenByParent} />
                    ))}

                    {/* Anak Hirarki Kelompok (51010, 51020) */}
                    {shouldRenderChildren && isGol && (row.kelompoks || []).map((k: any) => (
                      <TableRow key={k.id} row={k} depth={2} type="kel" isHiddenByParent={isHiddenByParent} />
                    ))}

                    {/* Anak Hirarki Detail (.01, .02) */}
                    {shouldRenderChildren && isKel && (row.anaks || []).map((a: any) => (
                      <TableRow key={a.id} row={a} depth={3} type="anak" isHiddenByParent={isHiddenByParent} />
                    ))}
                  </React.Fragment>
                );
              };

              return (
                <div className={mode !== 'web' ? wrapperClass : ''}>
                  {mode === 'print-summary' && <h2 className="hidden print:block text-lg font-black mb-3 uppercase">Ringkasan Mutasi Bagan Akun</h2>}
                  {mode === 'print-detail' && <h2 className="hidden print:block text-lg font-black mb-3 uppercase mt-6 border-t-2 border-black pt-6">Rincian Lengkap Seluruh Mutasi Akun</h2>}
                  
                  <table className={`text-left border-separate border-spacing-0 min-w-full ${mode === 'web' ? wrapperClass : ''}`}>
                    <thead>
                      <tr className="bg-indigo-50/80 dark:bg-slate-800 text-indigo-950 dark:text-slate-100 uppercase tracking-tighter sticky top-0 z-[60]">
                        <th className={`${headPadClass} border-r border-indigo-100 dark:border-slate-700 bg-indigo-50 dark:bg-slate-800 sticky left-0 z-[70] min-w-[240px] font-black`}>
                          Akun Hirarki
                        </th>
                        <th className={`${headPadClass} border-r border-indigo-100 dark:border-slate-700 text-center bg-indigo-50 dark:bg-slate-800 font-bold min-w-[110px]`}>
                          Saldo Awal
                        </th>
                        {activeMonthIdx.map(m => (
                          <th key={m} className={`${headPadClass} border-r border-indigo-100 dark:border-slate-700 text-center bg-indigo-100/50 dark:bg-slate-750 font-bold min-w-[85px]`}>
                            {BULAN[m-1]}
                          </th>
                        ))}
                        <th className={`${headPadClass} text-center bg-[#e0e7ff] dark:bg-[#1e293b] sticky right-0 z-[70] border-l border-indigo-200 dark:border-slate-700 font-black min-w-[120px] shadow-[-5px_0_15px_rgba(0,0,0,0.08)]`}>
                          Total Setahun
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {/* BARIS POSISI AWAL (WARNA SOFT INDIGO) */}
                      <tr 
                        className="bg-[#e0e7ff] text-indigo-950 font-black cursor-pointer group sticky top-[48px] z-[50] border-b border-indigo-200/80 dark:border-slate-800 shadow-xs" 
                        onClick={mode === 'web' ? () => setExpandPosisiAwal(!expandPosisiAwal) : undefined}
                      >
                        <td className={`${cellPadClass} sticky left-0 bg-[#e0e7ff] text-indigo-950 dark:bg-[#1e1b4b] dark:text-indigo-200 z-[55] border-r border-indigo-200 dark:border-slate-800 flex items-center gap-2 group-hover:bg-[#c7d2fe] dark:group-hover:bg-[#2e2a72] transition-colors`}>
                          {mode === 'web' ? (expandPosisiAwal ? <ChevronDown size={15} className="text-indigo-700 dark:text-indigo-400" /> : <ChevronRight size={15} className="text-indigo-600 dark:text-indigo-400" />) : <div className="w-4" />}
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">▶</span> TOTAL POSISI AWAL
                        </td>
                        <td className={`${cellPadClass} text-right border-r border-indigo-200 dark:border-slate-800 text-indigo-950 dark:text-indigo-100 bg-[#e0e7ff] dark:bg-[#1e1b4b]/80 font-mono font-bold`}>
                          {fmt(summary.saldoAwal)}
                        </td>
                        {activeMonthIdx.map(m => {
                          const prevM = m - 1;
                          const val = prevM === 0 ? summary.saldoAwal : (chartData[prevM - 1]?.saldo || 0);
                          return (
                            <td key={m} className={`${cellPadClass} text-right border-r border-indigo-200 dark:border-slate-800 font-mono text-indigo-950 dark:text-indigo-100 bg-[#e0e7ff] dark:bg-[#1e1b4b]/60 font-semibold`}>
                              {fmt(val)}
                            </td>
                          );
                        })}
                        <td className={`${cellPadClass} text-right bg-[#c7d2fe] dark:bg-[#2e2a72] font-black sticky right-0 z-[55] border-l border-indigo-300 dark:border-slate-700 text-indigo-950 dark:text-indigo-100 font-mono shadow-[-4px_0_12px_rgba(0,0,0,0.06)]`}>
                          {fmt(summary.saldoAwal)}
                        </td>
                      </tr>

                      {/* RINCIAN POSISI AWAL PER REKENING / KAS */}
                      {((mode === 'web' && expandPosisiAwal) || mode === 'print-detail') && monthlyAccountSaldo.map((r) => (
                        <tr key={`awal-${r.id}`} className="bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-600 dark:text-slate-400 italic">
                          <td className={`${cellPadClass} pl-10 border-r border-indigo-50 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-[40] truncate max-w-[200px]`}>
                            {r.nama}
                          </td>
                          <td className={`${cellPadClass} text-right border-r border-indigo-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 font-mono`}>
                            {fmt(r.saldoAwal)}
                          </td>
                          {activeMonthIdx.map(m => {
                            const val = m === 1 ? r.saldoAwal : (r.monthlySaldo[m-1] || 0);
                            return (
                              <td key={`awal-${r.id}-${m}`} className={`${cellPadClass} text-right border-r border-indigo-50 dark:border-slate-800 font-mono opacity-70`}>
                                {fmt(val)}
                              </td>
                            );
                          })}
                          <td className={`${cellPadClass} text-right bg-white dark:bg-[#0f172a] text-indigo-700 dark:text-indigo-300 border-l border-indigo-200 dark:border-slate-800 sticky right-0 z-[40] font-bold font-mono shadow-[-5px_0_10px_rgba(0,0,0,0.05)]`}>
                            {fmt(r.saldoAwal)}
                          </td>
                        </tr>
                      ))}

                      {/* DATA TABEL COA (TERSTRUKTUR: INDUK -> GOLONGAN 51,52,53 -> KELOMPOK -> DETAIL) */}
                      {filteredCoaMonthTable.map((induk: any) => <TableRow key={induk.id} row={induk} />)}
                      
                      {/* BARIS POSISI AKHIR (SERAGAM DENGAN POSISI AWAL) */}
                      <tr 
                        className="bg-[#e0e7ff] text-indigo-950 font-black cursor-pointer group sticky bottom-[0px] z-[60] shadow-[0_-6px_16px_rgba(0,0,0,0.08)] border-t-2 border-indigo-300 dark:border-slate-700" 
                        onClick={mode === 'web' ? () => setExpandPosisiAkhir(!expandPosisiAkhir) : undefined}
                      >
                        <td className={`${cellPadClass} border-r border-indigo-200 dark:border-slate-700 sticky left-0 bg-[#e0e7ff] dark:bg-slate-800 text-indigo-950 dark:text-slate-100 z-[65] flex items-center gap-2 uppercase group-hover:bg-[#c7d2fe] dark:group-hover:bg-slate-700 transition-colors`}>
                          {mode === 'web' ? (expandPosisiAkhir ? <ChevronDown size={15} className="text-indigo-700 dark:text-slate-300" /> : <ChevronRight size={15} className="text-indigo-600 dark:text-slate-400" />) : <div className="w-4" />}
                          <span className="text-indigo-600 dark:text-slate-400 font-bold">▶</span> TOTAL POSISI AKHIR
                        </td>
                        <td className={`${cellPadClass} text-right border-r border-indigo-200 dark:border-slate-700 text-slate-400 bg-[#e0e7ff] dark:bg-slate-850 font-mono`}>
                          -
                        </td>
                        {activeMonthIdx.map(m => (
                          <td key={m} className={`${cellPadClass} text-right border-r border-indigo-200 dark:border-slate-700 font-mono text-indigo-950 dark:text-slate-200 bg-[#e0e7ff] dark:bg-slate-850 font-bold`}>
                            {fmt(chartData[m-1]?.saldo || 0)}
                          </td>
                        ))}
                        <td className={`${cellPadClass} text-right font-mono bg-[#c7d2fe] dark:bg-slate-800 sticky right-0 z-[65] border-l border-indigo-300 dark:border-slate-700 text-indigo-950 dark:text-white font-black shadow-[-4px_0_15px_rgba(0,0,0,0.08)]`}>
                          {fmt(summary.saldoAkhir)}
                        </td>
                      </tr>

                      {/* RINCIAN POSISI AKHIR PER REKENING / KAS */}
                      {((mode === 'web' && expandPosisiAkhir) || mode === 'print-detail') && monthlyAccountSaldo.map((r) => (
                        <tr key={`akhir-${r.id}`} className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 italic">
                          <td className={`${cellPadClass} pl-10 border-r border-slate-100 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-[40] truncate max-w-[200px] border-t`}>
                            {r.nama}
                          </td>
                          <td className={`${cellPadClass} text-right border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 opacity-40 border-t`}>
                            -
                          </td>
                          {activeMonthIdx.map(m => (
                            <td key={`akhir-${r.id}-${m}`} className={`${cellPadClass} text-right border-r border-slate-100 dark:border-slate-800 font-mono opacity-70 border-t`}>
                              {fmt(r.monthlySaldo[m] || 0)}
                            </td>
                          ))}
                          <td className={`${cellPadClass} text-right bg-white dark:bg-[#0f172a] border-l border-indigo-200 dark:border-slate-800 sticky right-0 z-[40] font-black border-t text-indigo-700 dark:text-indigo-300 font-mono shadow-[-5px_0_10px_rgba(0,0,0,0.05)]`}>
                            {fmt(r.monthlySaldo[activeMonthIdx[activeMonthIdx.length-1] as number] || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            };

            return (
              <>
                {renderTable('web')}
                {renderTable('print-summary')}
                {renderTable('print-detail')}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
