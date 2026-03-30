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

// ───── Summary Card ─────
function SummaryCard({ label, value, icon, color }: any) {
  return (
    <div className={`rounded-2xl p-6 text-white flex items-center justify-between shadow-lg ${color}`}>
      <div>
        <p className="text-sm font-semibold opacity-80">{label}</p>
        <p className="text-3xl font-black mt-1 tracking-tight">{fmt(value)}</p>
      </div>
      <div className="text-white/30 text-6xl">{icon}</div>
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
  const [expandedCoa, setExpandedCoa] = useState<Record<string, boolean>>({});
  const [expandedKel, setExpandedKel] = useState<Record<string, boolean>>({});
  const [expandedAnak, setExpandedAnak] = useState<Record<string, boolean>>({});
  const [coaMonthTable, setCoaMonthTable] = useState<any[]>([]);

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

  const filterByYear = (rows: any[], field: string) =>
    rows.filter(r => {
      const d = parseAnyDate(r[field]);
      return d !== null && d.getFullYear() === tahun;
    });

  const filterBeforeYear = (rows: any[], field: string) =>
    rows.filter(r => {
      const d = parseAnyDate(r[field]);
      return d !== null && d.getFullYear() < tahun;
    });

  const compute = () => {
    // ── BANK per rekening ──  
    const bankBefore = filterBeforeYear(allBank, 'waktu_transaksi');
    const bankYear   = filterByYear(allBank, 'waktu_transaksi');

    // Grouping Rekening dan Saldo
    const rekMap: Record<string, any> = {};
    
    // Inisialisasi dengan data Master Rekening
    allRekening.forEach(r => {
      const idStr = String(r.id);
      rekMap[idStr] = { 
        id: r.id, 
        nama: r.nama_rekening || r.nama || r.no_rekening || `Rek-${r.id}`, 
        saldoAwal: 0, masuk: 0, keluar: 0 
      };
    });

    // MASUKKAN DATA BANK SEBELUM TAHUN INI (Saldo Awal)
    bankBefore.forEach(b => {
      const rId = String(b.rekening_id || 'unknown');
      if (!rekMap[rId]) {
        rekMap[rId] = { id: rId, nama: `Rekening ID: ${rId}`, saldoAwal: 0, masuk: 0, keluar: 0 };
      }
      rekMap[rId].saldoAwal += cleanNum(b.kredit) - cleanNum(b.debet);
    });

    // MASUKKAN DATA BANK TAHUN INI (Mutasi)
    bankYear.forEach(b => {
      const rId = String(b.rekening_id || 'unknown');
      if (!rekMap[rId]) {
        rekMap[rId] = { id: rId, nama: `Rekening ID: ${rId}`, saldoAwal: 0, masuk: 0, keluar: 0 };
      }
      rekMap[rId].masuk += cleanNum(b.kredit);
      rekMap[rId].keluar += cleanNum(b.debet);
    });

    // ── DATA KAS KECIL dari transactions ──
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

    // Gabungkan Semua ke List
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

    // ── CHART BULANAN ──
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
    // running saldo
    let saldo = total.saldoAwal;
    const cd = monthlyData.map(m => {
      saldo += m.masuk - m.keluar;
      return { ...m, saldo };
    });
    setChartData(cd);

    // ── COA TREE ──
    // Build tree: Induk (ends 0000) → Kelompok (no dot, no 0000) → Anak (has dot)
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

    // Aggregate amounts per akun_id for the year.
    // PENTING: bank_transactions.akun_id = integer (contoh: 51)
    //          ref_akun.id bisa UUID atau integer - normalisasi sebagai String!
    // Buat lookup: String(ref_akun.id) → ref_akun
    const akunByStrId: Record<string, any> = {};
    allAkun.forEach(a => { akunByStrId[String(a.id)] = a; });

    const trxAmt: Record<string, { masuk: number; keluar: number; ct: number }> = {};
    [...trxYear, ...bankYear].forEach((row: any) => {
      const aId = String(row.akun_id ?? '');
      if (!aId || aId === '' || aId === 'null' || aId === 'undefined') return;
      if (!trxAmt[aId]) trxAmt[aId] = { masuk: 0, keluar: 0, ct: 0 };
      trxAmt[aId].masuk += cleanNum(row.uang_masuk ?? row.kredit);
      trxAmt[aId].keluar += cleanNum(row.uang_keluar ?? row.debet);
      trxAmt[aId].ct += 1;
    });

    // Roll up ke kelompok dan induk (pakai String(id) agar cocok dengan trxAmt key)
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

    setCoaTree(result);

    const months = BULAN.map((_, idx) => idx + 1);
    // Buat Set ID per induk (string agar cocok dengan trxAmt)
    const coaRows = result.map((induk: any) => {
      // Kumpulkan semua ID anak dari induk ini
      const idSet = new Set<string>();
      idSet.add(String(induk.id));
      induk.kelompoks.forEach((k: any) => {
        idSet.add(String(k.id));
        k.anaks.forEach((a: any) => idSet.add(String(a.id)));
      });

      const monthTotals: Record<number, { masuk: number; keluar: number }> = {};
      months.forEach(m => { monthTotals[m] = { masuk: 0, keluar: 0 }; });
      [...trxYear, ...bankYear].forEach((row: any) => {
        const aId = String(row.akun_id ?? '');
        if (!idSet.has(aId)) return;
        const rawDate = row.tanggal || row.waktu_transaksi;
        const d = parseAnyDate(rawDate);
        if (!d || isNaN(d.getTime())) return;
        const m = d.getMonth() + 1;
        monthTotals[m].masuk += cleanNum(row.uang_masuk ?? row.kredit);
        monthTotals[m].keluar += cleanNum(row.uang_keluar ?? row.debet);
      });
      const tot = months.reduce((s, m) => s + monthTotals[m].masuk + monthTotals[m].keluar, 0);
      return { ...induk, monthTotals, tot };
    }).filter((r: any) => r.tot > 0);

    setCoaMonthTable(coaRows);
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

  const masukInduk = coaTree.filter(i => Number(i.nomor_akun?.[0]) <= 2 || i.masuk > i.keluar);
  const keluarInduk = coaTree.filter(i => Number(i.nomor_akun?.[0]) >= 5);

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

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Saldo Awal (awal tahun sebelumnya)" value={summary.saldoAwal} icon="🏦" color="bg-gray-700" />
        <SummaryCard label="Uang Masuk (setahun)" value={summary.masuk} icon={<TrendingDown size={56} />} color="bg-emerald-600" />
        <SummaryCard label="Uang Keluar (setahun)" value={summary.keluar} icon={<TrendingUp size={56} />} color="bg-amber-500" />
        <SummaryCard label="Saldo Akhir Tahun" value={summary.saldoAkhir} icon={<PiggyBank size={56} />} color="bg-cyan-600" />
      </div>

      {/* PER-REKENING TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-800 text-lg">Ringkasan per Rekening</h3>
          <span className="text-xs text-gray-400 font-medium">Saldo Awal + Masuk − Keluar = Saldo Akhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Rekening</th>
                <th className="p-4 text-right">Saldo Awal</th>
                <th className="p-4 text-right text-emerald-600">Uang Masuk</th>
                <th className="p-4 text-right text-amber-600">Uang Keluar</th>
                <th className="p-4 text-right text-cyan-600">Saldo Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {perRekening.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-gray-800">{r.nama}</td>
                  <td className="p-4 text-right font-mono text-gray-600">{fmt(r.saldoAwal)}</td>
                  <td className="p-4 text-right font-mono text-emerald-600 font-bold">{fmt(r.masuk)}</td>
                  <td className="p-4 text-right font-mono text-amber-600 font-bold">{fmt(r.keluar)}</td>
                  <td className="p-4 text-right font-mono text-cyan-700 font-black">{fmt(r.saldoAwal + r.masuk - r.keluar)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-black text-gray-900">
                <td className="p-4 uppercase text-xs tracking-wider">TOTAL</td>
                <td className="p-4 text-right font-mono">{fmt(summary.saldoAwal)}</td>
                <td className="p-4 text-right font-mono text-emerald-700">{fmt(summary.masuk)}</td>
                <td className="p-4 text-right font-mono text-amber-700">{fmt(summary.keluar)}</td>
                <td className="p-4 text-right font-mono text-cyan-700">{fmt(summary.saldoAkhir)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL COA: MASUK & KELUAR side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* DETAIL UANG MASUK */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <TrendingDown size={20} className="text-emerald-600" />
            <h3 className="font-black text-emerald-800">Detail Uang Masuk</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {coaTree.filter(i => i.masuk > 0).map((induk: any) => (
              <div key={induk.id}>
                <button
                  onClick={() => toggleCoa(induk.id)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-black">
                    {expandedCoa[induk.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{induk.nomor_akun}</span>
                    <span>{induk.nama_akun}</span>
                    <span className="text-xs font-medium opacity-70">{induk.ct} trx</span>
                  </div>
                  <span className="font-black text-sm">{fmt(induk.masuk)}</span>
                </button>

                {expandedCoa[induk.id] && (
                  <div className="bg-gray-50">
                    {induk.kelompoks.filter((k: any) => k.masuk > 0).map((kel: any) => (
                      <div key={kel.id}>
                        <button
                          onClick={() => toggleKel(kel.id)}
                          className="w-full flex items-center justify-between px-8 py-2.5 hover:bg-emerald-50 text-left"
                        >
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            {expandedKel[kel.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs font-black">{kel.nomor_akun}</span>
                            {kel.nama_akun}
                            <span className="text-xs font-normal text-gray-400">{kel.ct} trx</span>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">{fmt(kel.masuk)}</span>
                        </button>
                        {expandedKel[kel.id] && kel.anaks.filter((a: any) => a.masuk > 0).map((anak: any) => (
                          <div key={anak.id} className="flex items-center justify-between px-14 py-2 border-b border-gray-100 hover:bg-white">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="bg-teal-500 text-white px-1.5 rounded text-[10px] font-black">{anak.nomor_akun}</span>
                              {anak.nama_akun}
                              <span className="text-gray-400">{anak.ct} trx</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-500">{fmt(anak.masuk)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DETAIL UANG KELUAR */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
            <TrendingUp size={20} className="text-amber-600" />
            <h3 className="font-black text-amber-800">Detail Uang Keluar</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {coaTree.filter(i => i.keluar > 0).map((induk: any) => (
              <div key={`k-${induk.id}`}>
                <button
                  onClick={() => setExpandedAnak(p => ({ ...p, [induk.id]: !p[induk.id] }))}
                  className="w-full flex items-center justify-between px-5 py-3 bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  <div className="flex items-center gap-3 text-sm font-black">
                    {expandedAnak[induk.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{induk.nomor_akun}</span>
                    <span>{induk.nama_akun}</span>
                    <span className="text-xs font-medium opacity-70">{induk.ct} trx</span>
                  </div>
                  <span className="font-black text-sm">{fmt(induk.keluar)}</span>
                </button>

                {expandedAnak[induk.id] && (
                  <div className="bg-gray-50">
                    {induk.kelompoks.filter((k: any) => k.keluar > 0).map((kel: any) => (
                      <div key={kel.id}>
                        <button
                          onClick={() => toggleKel(`out-${kel.id}`)}
                          className="w-full flex items-center justify-between px-8 py-2.5 hover:bg-amber-50 text-left"
                        >
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            {expandedKel[`out-${kel.id}`] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs font-black">{kel.nomor_akun}</span>
                            {kel.nama_akun}
                            <span className="text-xs font-normal text-gray-400">{kel.ct} trx</span>
                          </div>
                          <span className="text-sm font-bold text-amber-600">{fmt(kel.keluar)}</span>
                        </button>
                        {expandedKel[`out-${kel.id}`] && kel.anaks.filter((a: any) => a.keluar > 0).map((anak: any) => (
                          <div key={anak.id} className="flex items-center justify-between px-14 py-2 border-b border-gray-100 hover:bg-white">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="bg-amber-400 text-white px-1.5 rounded text-[10px] font-black">{anak.nomor_akun}</span>
                              {anak.nama_akun}
                              <span className="text-gray-400">{anak.ct} trx</span>
                            </div>
                            <span className="text-xs font-bold text-amber-500">{fmt(anak.keluar)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
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

      {/* COA MONTH TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-black text-gray-800 text-lg">Group COA Induk/Kelompok — Mutasi Absolut per Bulan</h3>
          <p className="text-xs text-gray-400 mt-1">Mutasi = ABS(Masuk) + ABS(Belanja, Keluar) = Total. Kolom ini hanya yang ada data. Scroll kanan utk ringkasan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="text-xs text-left min-w-[900px] w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 w-16">Kode</th>
                <th className="p-3 min-w-[180px]">Nama</th>
                {BULAN.map((b, i) => (
                  <th key={i} className="p-3 text-right">
                    <div className="font-bold">{b}</div>
                    <div className="text-gray-400 text-[10px]">Mutasi</div>
                  </th>
                ))}
                <th className="p-3 text-right bg-gray-700">TOTAL<br /><span className="text-gray-400 text-[10px]">Mutasi</span></th>
              </tr>
            </thead>
            <tbody>
              {/* SALDO AWAL */}
              <tr className="bg-gray-100 font-black text-gray-700 border-b-2 border-gray-300">
                <td className="p-3 text-indigo-600">▶ Saldo Awal</td>
                <td className="p-3 text-xs">Modal Awal & Kas</td>
                {BULAN.map((_, i) => (
                  <td key={i} className="p-3 text-right font-mono text-xs">{i === 0 ? fmt(summary.saldoAwal) : '-'}</td>
                ))}
                <td className="p-3 text-right font-mono text-indigo-700">{fmt(summary.saldoAwal)}</td>
              </tr>

              {coaMonthTable.map((induk: any, ri: number) => (
                <tr key={ri} className={`border-b border-gray-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-indigo-50/30 transition-colors`}>
                  <td className="p-3 font-black">
                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px]">{induk.nomor_akun}</span>
                  </td>
                  <td className="p-3 font-bold text-gray-800">{induk.nama_akun}</td>
                  {BULAN.map((_, i) => {
                    const m = i + 1;
                    const tot = (induk.monthTotals[m]?.masuk || 0) + (induk.monthTotals[m]?.keluar || 0);
                    return (
                      <td key={i} className="p-3 text-right font-mono text-gray-600">
                        {tot > 0 ? fmt(tot) : <span className="text-gray-200">-</span>}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right font-black font-mono text-indigo-700">{fmt(induk.tot)}</td>
                </tr>
              ))}

              {/* SALDO AKHIR */}
              <tr className="bg-cyan-600 text-white font-black border-t-2 border-cyan-700">
                <td className="p-3">▶ Saldo Akhir</td>
                <td className="p-3 text-sm">Modal Akhir & Saldo</td>
                {BULAN.map((_, i) => {
                  const m = i + 1;
                  const cd = chartData[i];
                  return (
                    <td key={i} className="p-3 text-right font-mono text-sm">
                      {cd && (cd.masuk > 0 || cd.keluar > 0) ? fmt(cd.saldo) : <span className="opacity-30">-</span>}
                    </td>
                  );
                })}
                <td className="p-3 text-right font-mono bg-cyan-700">{fmt(summary.saldoAkhir)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
