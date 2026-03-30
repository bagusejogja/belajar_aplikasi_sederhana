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

// ───── Summary Card Ultra Premium ─────
function SummaryCard({ label, value, icon, color, subValue, subLabel }: any) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-7 text-white shadow-2xl transition-all duration-500 hover:translate-y-[-5px] hover:shadow-indigo-500/20 group ${color}`}>
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
      
      {/* Floating Animated Icon */}
      <div className="absolute -right-6 -bottom-8 text-white/5 text-[10rem] transform -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110 select-none pointer-events-none">
        {icon}
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <p className="text-[11px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold opacity-40">Rp</span>
            <h4 className="text-3xl md:text-4xl font-black tracking-tighter drop-shadow-md">
              {fmt(value).split(',')[0]}<span className="text-sm opacity-50 font-medium">,{fmt(value).split(',')[1] || '00'}</span>
            </h4>
          </div>
        </div>

        {subValue !== undefined && (
          <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center group-hover:border-white/20 transition-colors">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{subLabel}</span>
              <span className="text-xs font-mono font-black text-white/90">{fmt(subValue)}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md group-hover:bg-white/20 transition-all">
               <TrendingUp size={14} className={value >= 0 ? "text-emerald-300" : "text-rose-300"} />
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

      {/* SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SummaryCard 
          label="Saldo Awal" 
          value={summary.saldoAwal} 
          icon={<Wallet size={120} />} 
          color="bg-slate-800" 
          subLabel="Posisi 1 Jan"
          subValue={summary.saldoAwal}
        />
        <div className="grid grid-cols-1 gap-6">
          <SummaryCard 
            label="Total Uang Masuk" 
            value={summary.masuk} 
            icon={<TrendingDown size={120} />} 
            color="bg-emerald-600" 
            subLabel="Penerimaan"
            subValue={summary.masuk}
          />
          <SummaryCard 
            label="Total Uang Keluar" 
            value={summary.keluar} 
            icon={<TrendingUp size={120} />} 
            color="bg-rose-500" 
            subLabel="Pengeluaran"
            subValue={summary.keluar}
          />
        </div>
        <SummaryCard 
          label="Saldo Akhir" 
          value={summary.saldoAkhir} 
          icon={<PiggyBank size={120} />} 
          color="bg-cyan-600" 
          subLabel="Milik Masjid"
          subValue={summary.saldoAkhir}
        />
      </div>

      {/* CHART BULANAN */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-gray-800 text-lg">Grafik Bulanan — Masuk, Keluar, Saldo, Surplus/Defisit</h3>
            <p className="text-xs text-gray-400 mt-1">Hanya bulan yang ada datanya terlihat aktif</p>
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="bln" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis tickFormatter={yFmt} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
              <Bar dataKey="masuk" name="Masuk" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="keluar" name="Keluar" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="surplus" name="Surplus/Defisit" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.surplus >= 0 ? '#6366f1' : '#ef4444'} opacity={0.7} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#0891b2" strokeWidth={3} dot={{ r: 4 }} />
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
                  <tr className={`hover:bg-indigo-50/30 transition-colors ${isInduk ? 'bg-gray-50/30 font-bold border-b border-gray-100' : ''}`}>
                    <td 
                      className="p-3 border-r bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] cursor-pointer select-none"
                      onClick={toggle || undefined}
                      style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
                    >
                      <div className="flex items-center gap-2">
                        {hasChildren ? (
                           expanded ? <ChevronDown size={14} className="text-indigo-500" /> : <ChevronRight size={14} className="text-gray-400" />
                        ) : <div className="w-3.5" />}
                        <div className="flex flex-col truncate">
                          <span className="text-[8px] text-gray-400 leading-none">{row.nomor_akun}</span>
                          <span className={`${isInduk ? 'text-xs' : 'text-[11px]'} text-gray-800`}>{row.nama_akun}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-right bg-gray-50/50 border-r text-[10px] font-mono text-gray-400 italic">
                      {isInduk ? fmt(row.saldoAwal || 0) : ''}
                    </td>
                    {activeMonthIdx.map(m => {
                      const val = row.monthTotals[m] || { masuk: 0, keluar: 0 };
                      const diff = val.masuk - val.keluar;
                      return (
                        <td key={m} className={`p-2 text-right border-r font-mono font-bold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-gray-200'}`}>
                          {diff !== 0 ? fmt(Math.abs(diff)) : '-'}
                        </td>
                      );
                    })}
                    <td className={`p-3 text-right font-black bg-indigo-50/50 text-xs border-l border-indigo-100`}>
                      {fmt(row.masuk - row.keluar)}
                    </td>
                  </tr>
                  {expanded && isInduk && row.kelompoks.map((k: any) => <TableRow key={k.id} row={k} depth={1} type="kel" />)}
                  {expanded && isKel && row.anaks.map((a: any) => <TableRow key={a.id} row={a} depth={2} type="anak" />)}
                </>
              );
            };

            return (
              <table className="text-[10px] text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-tighter sticky top-0 z-20">
                    <th className="p-4 border-r border-slate-700 bg-slate-900 sticky left-0 z-30 min-w-[220px]">Akun Hirarki</th>
                    <th className="p-4 border-r border-slate-700 text-center">Saldo Awal</th>
                    {activeMonthIdx.map(m => (
                      <th key={m} className="p-2 border-r border-slate-700 text-center bg-slate-800">
                        {BULAN[m-1]}
                      </th>
                    ))}
                    <th className="p-4 text-center bg-indigo-900 sticky right-0 z-10 border-l border-indigo-700">Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {/* ROW POSISI AWAL KEUANGAN (Collapsible) */}
                   <tr className="bg-slate-800 text-white font-black cursor-pointer group" onClick={() => setExpandPosisiAwal(!expandPosisiAwal)}>
                      <td className="p-4 sticky left-0 bg-slate-800 z-10 border-r border-slate-700 flex items-center gap-2">
                        {expandPosisiAwal ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="text-indigo-300">▶</span> POSISI AWAL KEUANGAN
                      </td>
                      <td className="p-4 text-right border-r border-slate-700 text-indigo-200 bg-slate-800/50">{fmt(summary.saldoAwal)}</td>
                      {activeMonthIdx.map(m => {
                        const prevM = m - 1;
                        const val = prevM === 0 ? summary.saldoAwal : (chartData[prevM - 1]?.saldo || 0);
                        return <td key={m} className="p-2 text-right border-r border-slate-700 font-mono text-indigo-300">{fmt(val)}</td>;
                      })}
                      <td className="p-4 text-right bg-indigo-950 font-black sticky right-0 z-10 border-l border-indigo-800 text-indigo-200">{fmt(summary.saldoAwal)}</td>
                   </tr>

                   {expandPosisiAwal && monthlyAccountSaldo.map((r, ri) => (
                     <tr key={`awal-${r.id}`} className="bg-slate-700/30 text-[9px] text-gray-500 italic">
                        <td className="p-2 pl-10 border-r sticky left-0 bg-white z-10 truncate max-w-[150px]">{r.nama}</td>
                        <td className="p-2 text-right border-r bg-gray-50">{fmt(r.saldoAwal)}</td>
                        {activeMonthIdx.map(m => {
                          const val = m === 1 ? r.saldoAwal : (r.monthlySaldo[m-1] || 0);
                          return <td key={`awal-${r.id}-${m}`} className="p-1 text-right border-r font-mono opacity-60">{fmt(val)}</td>;
                        })}
                        <td className="p-2 text-right bg-indigo-50 border-l sticky right-0 z-10 font-bold">{fmt(r.saldoAwal)}</td>
                     </tr>
                   ))}

                   {coaMonthTable.map((induk: any) => <TableRow key={induk.id} row={induk} />)}
                  
                   {/* ROW POSISI AKHIR KEUANGAN (Collapsible) */}
                   <tr className="bg-cyan-700 text-white font-black cursor-pointer group" onClick={() => setExpandPosisiAkhir(!expandPosisiAkhir)}>
                    <td className="p-4 border-r border-cyan-800 sticky left-0 bg-cyan-700 z-10 flex items-center gap-2 uppercase">
                      {expandPosisiAkhir ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="text-cyan-200">▶</span> POSISI AKHIR KEUANGAN
                    </td>
                    <td className="p-4 text-right border-r border-cyan-800 opacity-50 bg-cyan-800/20">-</td>
                    {activeMonthIdx.map(m => (
                      <td key={m} className="p-2 text-right border-r border-cyan-800 font-mono text-cyan-100">
                        {fmt(chartData[m-1]?.saldo || 0)}
                      </td>
                    ))}
                    <td className="p-4 text-right font-mono bg-cyan-900 sticky right-0 z-10 border-l border-cyan-800 text-cyan-200">{fmt(summary.saldoAkhir)}</td>
                  </tr>

                   {expandPosisiAkhir && monthlyAccountSaldo.map((r, ri) => (
                     <tr key={`akhir-${r.id}`} className="bg-cyan-50/50 text-[9px] text-gray-500 italic">
                        <td className="p-2 pl-10 border-r sticky left-0 bg-white z-10 truncate max-w-[150px]">{r.nama}</td>
                        <td className="p-2 text-right border-r bg-gray-50 opacity-40">-</td>
                        {activeMonthIdx.map(m => (
                          <td key={`akhir-${r.id}-${m}`} className="p-1 text-right border-r font-mono opacity-60">{fmt(r.monthlySaldo[m] || 0)}</td>
                        ))}
                        <td className="p-2 text-right bg-cyan-50 border-l sticky right-0 z-10 font-bold">{fmt(r.monthlySaldo[activeMonthIdx[activeMonthIdx.length-1]] || 0)}</td>
                     </tr>
                   ))}

                   {/* FOOTER SURPLUS */}
                   <tr className="bg-slate-900 text-white text-[9px]">
                    <td className="p-2 border-r sticky left-0 bg-slate-900 z-10 opacity-50 pl-10">Surplus / (Defisit) Bulanan</td>
                    <td className="p-2 text-right border-r opacity-30">-</td>
                    {activeMonthIdx.map(m => {
                      const cd = chartData[m-1] || { masuk: 0, keluar: 0 };
                      const diff = cd.masuk - cd.keluar;
                      return (
                        <td key={m} className={`p-1 text-right border-r font-mono ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fmt(diff)}
                        </td>
                      );
                    })}
                    <td className="p-2 text-right font-mono bg-indigo-900 sticky right-0 z-10 opacity-50">{fmt(summary.masuk - summary.keluar)}</td>
                  </tr>
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
