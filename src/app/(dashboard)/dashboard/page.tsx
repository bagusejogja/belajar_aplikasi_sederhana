'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, TrendingUp, TrendingDown, Wallet, PiggyBank, ChevronDown, ChevronRight, Filter, BarChart2 } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts';

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 2 });

// Fungsi membersihkan angka dari string (handle titik/koma ribuan)
const cleanNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).trim();
  // Jika ada titik ribuan dan koma desimal, bersihkan. 
  // Tapi hati-hati dengan format DB yang mungkin sudah bersih.
  // Strategi: Jika ada koma, asumsikan itu desimal ala Indo, ganti ke titik.
  let cleaned = s;
  if (s.includes(',') && s.includes('.')) {
    // Format "1.000,00" -> "1000.00"
    cleaned = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    // Format "1000,00" -> "1000.00"
    cleaned = s.replace(',', '.');
  }
  const n = Number(cleaned);
  return isNaN(n) ? 0 : n;
};

// Fungsi parse tanggal universal: sangat tangguh terhadap format apapun
const parseAnyDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  
  const s = String(val).trim();
  if (!s) return null;

  // 1. Coba parse ISO atau format standar JS
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return d;

  // 2. Coba handle format Excel Serial (misal: "45300.5")
  const num = Number(s.replace(',', '.'));
  if (!isNaN(num) && num > 30000 && num < 60000) {
     // 30rb ~ thn 1982, 60rb ~ thn 2064
     const excelDate = new Date((num - 25569) * 86400 * 1000);
     if (!isNaN(excelDate.getTime())) return excelDate;
  }
  
  // 3. Fallback: coba paksa ganti '/' ke '-' jika ada
  if (s.includes('/')) {
    const d2 = new Date(s.replace(/\//g, '-'));
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
};

// ───── Summary Card Ultra Premium (Soft Bright) ─────
function SummaryCard({ label, value, icon, color, subValue, subLabel }: any) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-6 text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group border border-white/20 ${color}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-40 pointer-events-none"></div>
      
      {/* Decorative Icon Background */}
      <div className="absolute -right-6 -bottom-8 text-white/10 text-[9rem] transform -rotate-12 group-hover:rotate-0 transition-transform duration-700 select-none pointer-events-none">
        {icon}
      </div>
      
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[130px]">
        <div>
          <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-3 drop-shadow-sm">{label}</p>
          <div className="flex flex-col">
            <span className="text-xs font-bold opacity-40">IDR</span>
            <h4 className="text-3xl font-black tracking-tight drop-shadow-md">
               {fmt(value).split(',')[0]}<span className="text-sm opacity-60 font-medium">,{fmt(value).split(',')[1] || '00'}</span>
            </h4>
          </div>
        </div>

        {subValue !== undefined && (
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end transition-colors group-hover:border-white/30">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{subLabel}</span>
              <span className="text-xs font-mono font-black text-white/90">{fmt(subValue)}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-md">
               <TrendingUp size={12} className="text-white/60" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ───── Custom Tooltip Chart ─────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-gray-900 text-white rounded-xl p-4 shadow-2xl text-xs space-y-1 border border-gray-700">
      <p className="font-black text-sm mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>Rp {fmt(p.value)}</strong>
        </p>
      ))}
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
  const [coaTree, setCoaTree] = useState<any[]>([]);
  const [coaMonthTable, setCoaMonthTable] = useState<any[]>([]);
  const [expandedCoa, setExpandedCoa] = useState<Record<string, boolean>>({});
  const [expandedKel, setExpandedKel] = useState<Record<string, boolean>>({});
  const [expandPosisiAwal, setExpandPosisiAwal] = useState(false);
  const [expandPosisiAkhir, setExpandPosisiAkhir] = useState(false);
  const [monthlyAccountSaldo, setMonthlyAccountSaldo] = useState<any[]>([]);

  const tahunList = [2023, 2024, 2025, 2026, 2027];

  // ────── FETCH dengan Pagination (atasi limit 1000 Supabase) ──────
  const fetchAllPages = async (builder: any, pageSize = 1000) => {
    let allData: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await builder.range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = [...allData, ...data];
      // Jika data yang didapat kurang dari yang diminta, berarti sudah habis
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return allData;
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [trxData, bankData, akunData, rekData] = await Promise.all([
        fetchAllPages(supabase.from('transactions').select('*, ref_akun(nomor_akun, nama_akun)').neq('disetujui', 'Ditolak').order('tanggal', { ascending: true })),
        fetchAllPages(supabase.from('bank_transactions').select('*').order('waktu_transaksi', { ascending: true })),
        fetchAllPages(supabase.from('ref_akun').select('*').order('nomor_akun', { ascending: true })),
        fetchAllPages(supabase.from('ref_rekening').select('*')),
      ]);
      setAllTrx(trxData);
      setAllBank(bankData);
      setAllAkun(akunData);
      setAllRekening(rekData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ────── COMPUTE ──────
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
    // ── BANK per rekening ──  
    const seen = new Set();
    const uniqueBank = allBank.filter(b => {
      const key = `${b.rekening_id}-${b.waktu_transaksi}-${b.noref_bank}-${b.debet}-${b.kredit}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const bankBefore = filterBeforeYear(uniqueBank, 'waktu_transaksi');
    const bankYear   = filterByYear(uniqueBank, 'waktu_transaksi');

    const rekMap: Record<string, any> = {};
    allRekening.forEach(r => {
      const idStr = String(r.id);
      rekMap[idStr] = { 
        id: r.id, 
        nama: r.nama_rekening || r.nama || r.no_rekening || `Rek-${r.id}`, 
        saldoAwal: 0, masuk: 0, keluar: 0 
      };
    });

    bankBefore.forEach(b => {
      const rId = String(b.rekening_id || 'unknown');
      if (!rekMap[rId]) {
        rekMap[rId] = { id: rId, nama: `Rekening ID: ${rId}`, saldoAwal: 0, masuk: 0, keluar: 0 };
      }
      rekMap[rId].saldoAwal += cleanNum(b.kredit) - cleanNum(b.debet);
    });

    bankYear.forEach(b => {
      const rId = String(b.rekening_id || 'unknown');
      if (!rekMap[rId]) {
        rekMap[rId] = { id: rId, nama: `Rekening ID: ${rId}`, saldoAwal: 0, masuk: 0, keluar: 0 };
      }
      rekMap[rId].masuk += cleanNum(b.kredit);
      rekMap[rId].keluar += cleanNum(b.debet);
    });

    const trxYear = filterByYear(allTrx, 'tanggal');
    const trxBefore = filterBeforeYear(allTrx, 'tanggal');

    const kasRek = { id: 'kas', nama: 'Kas Kecil - KK1', saldoAwal: 0, masuk: 0, keluar: 0 };
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
    setChartData(cd);

    const akunMap: Record<string, any> = {};
    allAkun.forEach(a => { akunMap[a.id] = a; });

    const indukMap: Record<string, any> = {};
    allAkun.forEach(a => {
      const no = String(a.nomor_akun);
      if (no.endsWith('0000') && !no.includes('.')) {
        indukMap[no] = { ...a, kelompoks: {} };
      }
    });
    allAkun.forEach(a => {
      const no = String(a.nomor_akun);
      if (!no.endsWith('0000') && !no.includes('.')) {
        const parentKey = no[0] + '0000';
        if (indukMap[parentKey]) {
          indukMap[parentKey].kelompoks[no] = { ...a, anaks: [] };
        }
      }
    });
    allAkun.forEach(a => {
      const no = String(a.nomor_akun);
      if (no.includes('.')) {
        const kelNo = no.split('.')[0];
        const parentKey = kelNo[0] + '0000';
        if (indukMap[parentKey]?.kelompoks[kelNo]) {
          indukMap[parentKey].kelompoks[kelNo].anaks.push(a);
        }
      }
    });

    const trxAmt: Record<string, { masuk: number; keluar: number; ct: number }> = {};
    [...trxYear, ...bankYear].forEach((row: any) => {
      const aId = String(row.akun_id ?? '');
      if (!aId || aId === '' || aId === 'null' || aId === 'undefined') return;
      if (!trxAmt[aId]) trxAmt[aId] = { masuk: 0, keluar: 0, ct: 0 };
      trxAmt[aId].masuk += cleanNum(row.uang_masuk ?? row.kredit);
      trxAmt[aId].keluar += cleanNum(row.uang_keluar ?? row.debet);
      trxAmt[aId].ct += 1;
    });

    const result = Object.values(indukMap).map((induk: any) => {
      const kels = Object.values(induk.kelompoks).map((kel: any) => {
        const anaks = kel.anaks.map((anak: any) => {
          const amt = trxAmt[String(anak.id)] || { masuk: 0, keluar: 0, ct: 0 };
          return { ...anak, masuk: amt.masuk, keluar: amt.keluar, ct: amt.ct };
        });
        const kelTot = anaks.reduce((acc: any, a: any) => ({ masuk: acc.masuk + a.masuk, keluar: acc.keluar + a.keluar, ct: acc.ct + a.ct }), { masuk: 0, keluar: 0, ct: 0 });
        const kelDirect = trxAmt[String(kel.id)] || { masuk: 0, keluar: 0, ct: 0 };
        return {
          ...kel, anaks,
          masuk: kelTot.masuk + kelDirect.masuk,
          keluar: kelTot.keluar + kelDirect.keluar,
          ct: kelTot.ct + kelDirect.ct,
        };
      });
      const indukTot = kels.reduce((acc: any, k: any) => ({ masuk: acc.masuk + k.masuk, keluar: acc.keluar + k.keluar, ct: acc.ct + k.ct }), { masuk: 0, keluar: 0, ct: 0 });
      const indukDirect = trxAmt[String(induk.id)] || { masuk: 0, keluar: 0, ct: 0 };
      return {
        ...induk, kelompoks: kels,
        masuk: indukTot.masuk + indukDirect.masuk,
        keluar: indukTot.keluar + indukDirect.keluar,
        ct: indukTot.ct + indukDirect.ct,
      };
    }).filter((i: any) => i.masuk + i.keluar > 0 || i.ct > 0);

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

    const finalTree = result.map((induk: any) => {
      const indukIdSet = new Set<string>([String(induk.id)]);
      const kels = induk.kelompoks.map((kel: any) => {
        const kelIdSet = new Set<string>([String(kel.id)]);
        const anaks = kel.anaks.map((anak: any) => {
          const anakIdSet = new Set<string>([String(anak.id)]);
          kelIdSet.add(String(anak.id));
          indukIdSet.add(String(anak.id));
          return { ...anak, monthTotals: getMonthTotals(anakIdSet) };
        });
        indukIdSet.add(String(kel.id));
        return { ...kel, anaks, monthTotals: getMonthTotals(kelIdSet) };
      });
      return { ...induk, kelompoks: kels, monthTotals: getMonthTotals(indukIdSet) };
    });

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
          const mBank = bankYear.filter(b => String(b.rekening_id) === String(r.id) && parseAnyDate(b.waktu_transaksi)?.getMonth() + 1 === m);
          mIn = mBank.reduce((s, b) => s + cleanNum(b.kredit), 0);
          mOut = mBank.reduce((s, b) => s + cleanNum(b.debet), 0);
        }
        cur += mIn - mOut;
        perMonth[m] = cur;
      });
      return { ...r, monthlySaldo: perMonth };
    });

    setMonthlyAccountSaldo(accRunning);
    setCoaMonthTable(finalTree);
    setCoaTree(finalTree);
  };

  const toggleCoa = (id: string) => setExpandedCoa(p => ({ ...p, [id]: !p[id] }));
  const toggleKel = (id: string) => setExpandedKel(p => ({ ...p, [id]: !p[id] }));

  const yFmt = (v: number) => {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}M`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}jt`;
    return `${(v / 1e3).toFixed(0)}rb`;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={48} className="animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <BarChart2 size={36} /> Dashboard Keuangan Masjid
            </h2>
            <p className="text-indigo-200 mt-1 font-medium">Gabungan Transaksi Kas + Mutasi Bank • Laporan Interaktif</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl p-3">
            <Filter size={18} className="text-indigo-200" />
            <select
              value={tahun}
              onChange={e => setTahun(Number(e.target.value))}
              className="bg-transparent text-white font-black text-lg outline-none cursor-pointer"
            >
              {tahunList.map(y => <option key={y} value={y} className="text-gray-900">{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS GRID - SOFT BRIGHT COLORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="Saldo Awal" 
          value={summary.saldoAwal} 
          icon={<Wallet size={80} />} 
          color="bg-slate-500" 
          subLabel="1 Jan"
          subValue={summary.saldoAwal}
        />
        <SummaryCard 
          label="Uang Masuk" 
          value={summary.masuk} 
          icon={<TrendingDown size={80} />} 
          color="bg-emerald-400" 
          subLabel="Penerimaan"
          subValue={summary.masuk}
        />
        <SummaryCard 
          label="Uang Keluar" 
          value={summary.keluar} 
          icon={<TrendingUp size={80} />} 
          color="bg-rose-400" 
          subLabel="Pengeluaran"
          subValue={summary.keluar}
        />
        <SummaryCard 
          label="Saldo Akhir" 
          value={summary.saldoAkhir} 
          icon={<PiggyBank size={80} />} 
          color="bg-sky-500" 
          subLabel="Sisa Dana"
          subValue={summary.saldoAkhir}
        />
      </div>

      {/* CHART BULANAN - IMPROVED */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Tren Arus Kas Bulanan</h3>
            <p className="text-xs text-gray-400 mt-1">Pergerakan Saldo dan Surplus per Bulan</p>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }} barGap={8}>
              <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="bln" 
                tick={{ fontSize: 13, fontWeight: 800, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tickFormatter={yFmt} 
                tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingBottom: 20 }} />
              <Bar dataKey="masuk" name="Masuk" fill="#34d399" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="keluar" name="Keluar" fill="#f87171" radius={[6, 6, 0, 0]} barSize={24} />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                name="Saldo Berjalan" 
                stroke="#6366f1" 
                strokeWidth={5} 
                dot={{ r: 7, fill: '#6366f1', strokeWidth: 4, stroke: '#fff' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* COA MONTH TABLE - DYNAMIC TREE ENHANCED */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-black text-gray-800 text-lg">Group COA Induk/Kelompok — Mutasi Per Bulan</h3>
            <p className="text-xs text-gray-500 mt-1 italic">Klik nama akun untuk melihat rincian kelompok dan anak akun di bawahnya.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {(() => {
            const activeMonthIdx = BULAN.map((_, i) => i + 1).filter(m => {
              return coaMonthTable.some(row => (row.monthTotals[m]?.masuk || 0) + (row.monthTotals[m]?.keluar || 0) > 0);
            });

            if (activeMonthIdx.length === 0) {
              return <div className="p-10 text-center text-gray-400 font-medium">Tidak ada data transaksi untuk tahun {tahun}</div>;
            }

            const TableRow = ({ row, depth = 0, type = 'induk' }: any) => {
              const isInduk = type === 'induk';
              const isKel = type === 'kel';
              const expanded = isInduk ? expandedCoa[row.id] : isKel ? expandedKel[row.id] : false;
              const toggle = isInduk ? () => toggleCoa(row.id) : isKel ? () => toggleKel(row.id) : null;
              const hasChildren = (isInduk && row.kelompoks?.length > 0) || (isKel && row.anaks?.length > 0);

              return (
                <>
                  <tr className={`hover:bg-slate-50 transition-colors ${isInduk ? 'bg-slate-50/50 font-bold' : ''}`}>
                    <td 
                      className="p-3 border-r bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] cursor-pointer select-none"
                      onClick={toggle || undefined}
                      style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
                    >
                      <div className="flex items-center gap-2">
                        {hasChildren ? (
                           expanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-400" />
                        ) : <div className="w-3.5" />}
                        <div className="flex flex-col truncate">
                          <span className="text-[8px] text-gray-400 leading-none">{row.nomor_akun}</span>
                          <span className={`${isInduk ? 'text-[11px] font-black' : 'text-[11px] font-medium'} text-gray-700`}>{row.nama_akun}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right bg-white border-r text-[10px] font-mono text-gray-400 italic">
                      {isInduk ? fmt(row.saldoAwal || 0) : ''}
                    </td>
                    {activeMonthIdx.map(m => {
                      const val = row.monthTotals[m] || { masuk: 0, keluar: 0 };
                      const diff = val.masuk - val.keluar;
                      return (
                        <td key={m} className={`p-2 text-right border-r font-mono font-bold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : 'text-gray-200'}`}>
                          {diff !== 0 ? fmt(Math.abs(diff)) : '-'}
                        </td>
                      );
                    })}
                    <td className={`p-3 text-right font-black bg-slate-900 text-sky-300 text-[11px] border-l border-slate-700 sticky right-0 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.1)]`}>
                      {fmt(row.masuk - row.keluar)}
                    </td>
                  </tr>
                  {expanded && isInduk && row.kelompoks.map((k: any) => <TableRow key={k.id} row={k} depth={1} type="kel" />)}
                  {expanded && isKel && row.anaks.map((a: any) => <TableRow key={a.id} row={a} depth={2} type="anak" />)}
                </>
              );
            };

            return (
              <table className="text-[11px] text-left border-separate border-spacing-0 min-w-full">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-tighter sticky top-0 z-[60]">
                    <th className="p-4 border-r border-slate-700 bg-slate-900 sticky left-0 z-[70] min-w-[250px] text-xs font-black">Akun Hirarki</th>
                    <th className="p-4 border-r border-slate-700 text-center text-xs bg-slate-900">Saldo Awal</th>
                    {activeMonthIdx.map(m => (
                      <th key={m} className="p-2 border-r border-slate-700 text-center bg-slate-800 text-xs shadow-inner">
                        {BULAN[m-1]}
                      </th>
                    ))}
                    <th className="p-4 text-center bg-slate-900 sticky right-0 z-[70] border-l border-slate-700 text-xs font-black shadow-[-4px_0_15px_rgba(0,0,0,0.3)]">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {/* ROW POSISI AWAL KEUANGAN (Collapsible) */}
                   <tr className="bg-slate-800 text-white font-black cursor-pointer group sticky top-[52px] z-[50]" onClick={() => setExpandPosisiAwal(!expandPosisiAwal)}>
                      <td className="p-4 sticky left-0 bg-slate-800 z-[55] border-r border-slate-700 flex items-center gap-2 group-hover:bg-slate-700 transition-colors">
                        {expandPosisiAwal ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span className="text-sky-400">▶</span> TOTAL POSISI AWAL
                      </td>
                      <td className="p-4 text-right border-r border-slate-700 text-sky-100 bg-slate-800/80 font-mono text-xs">{fmt(summary.saldoAwal)}</td>
                      {activeMonthIdx.map(m => {
                        const prevM = m - 1;
                        const val = prevM === 0 ? summary.saldoAwal : (chartData[prevM - 1]?.saldo || 0);
                        return <td key={m} className="p-2 text-right border-r border-slate-700 font-mono text-sky-400 bg-slate-800/50">{fmt(val)}</td>;
                      })}
                      <td className="p-4 text-right bg-slate-900 font-black sticky right-0 z-[55] border-l border-slate-700 text-sky-300 font-mono text-xs shadow-[-4px_0_15px_rgba(0,0,0,0.4)]">{fmt(summary.saldoAwal)}</td>
                   </tr>

                   {expandPosisiAwal && monthlyAccountSaldo.map((r, ri) => (
                     <tr key={`awal-${r.id}`} className="bg-slate-700/10 text-[10px] text-slate-500 italic">
                        <td className="p-3 pl-12 border-r sticky left-0 bg-white z-[40] truncate max-w-[200px] border-b">{r.nama}</td>
                        <td className="p-3 text-right border-r bg-slate-50/50 border-b">{fmt(r.saldoAwal)}</td>
                        {activeMonthIdx.map(m => {
                          const val = m === 1 ? r.saldoAwal : (r.monthlySaldo[m-1] || 0);
                          return <td key={`awal-${r.id}-${m}`} className="p-1 text-right border-r font-mono opacity-60 border-b">{fmt(val)}</td>;
                        })}
                        <td className="p-3 text-right bg-slate-900 text-sky-400/70 border-l border-slate-800 sticky right-0 z-[40] font-bold border-b shadow-[-4px_0_10px_rgba(0,0,0,0.2)]">{fmt(r.saldoAwal)}</td>
                     </tr>
                   ))}

                   {coaMonthTable.map((induk: any) => <TableRow key={induk.id} row={induk} />)}
                  
                   {/* ROW POSISI AKHIR KEUANGAN (Collapsible) */}
                   <tr className="bg-slate-900 text-white font-black cursor-pointer group sticky bottom-[0px] z-[60] shadow-[0_-8px_20px_rgba(0,0,0,0.2)]" onClick={() => setExpandPosisiAkhir(!expandPosisiAkhir)}>
                    <td className="p-4 border-r border-slate-700 sticky left-0 bg-slate-900 z-[65] flex items-center gap-2 uppercase text-xs group-hover:bg-slate-800 transition-colors border-t border-slate-700">
                      {expandPosisiAkhir ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="text-sky-400">▶</span> TOTAL POSISI AKHIR
                    </td>
                    <td className="p-4 text-right border-r border-slate-700 opacity-40 bg-slate-900/60 border-t border-slate-700">-</td>
                    {activeMonthIdx.map(m => (
                      <td key={m} className="p-2 text-right border-r border-slate-700 font-mono text-sky-200 text-xs bg-slate-900 border-t border-slate-700">
                        {fmt(chartData[m-1]?.saldo || 0)}
                      </td>
                    ))}
                    <td className="p-4 text-right font-mono bg-slate-950 sticky right-0 z-[65] border-l border-slate-700 text-cyan-200 text-xs shadow-[-4px_0_20px_rgba(0,0,0,0.5)] border-t border-slate-700">{fmt(summary.saldoAkhir)}</td>
                  </tr>

                   {expandPosisiAkhir && monthlyAccountSaldo.map((r, ri) => (
                     <tr key={`akhir-${r.id}`} className="bg-slate-900 text-[10px] text-slate-400 italic">
                        <td className="p-3 pl-12 border-r sticky left-0 bg-slate-900 z-[40] truncate max-w-[200px] border-t border-slate-800">{r.nama}</td>
                        <td className="p-3 text-right border-r bg-slate-900/80 opacity-40 border-t border-slate-800">-</td>
                        {activeMonthIdx.map(m => (
                          <td key={`akhir-${r.id}-${m}`} className="p-1 text-right border-r font-mono opacity-60 border-t border-slate-800">{fmt(r.monthlySaldo[m] || 0)}</td>
                        ))}
                        <td className="p-3 text-right bg-slate-900 border-l border-slate-800 sticky right-0 z-[40] font-black border-t text-cyan-400 shadow-[-4px_0_10px_rgba(0,0,0,0.3)]">{fmt(r.monthlySaldo[activeMonthIdx[activeMonthIdx.length-1] as number] || 0)}</td>
                     </tr>
                   ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
