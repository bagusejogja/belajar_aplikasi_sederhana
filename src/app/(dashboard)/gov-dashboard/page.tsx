'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Filter, Loader2, Download, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard, 
  Scale, Percent, Landmark, RefreshCw, Layers, Calendar, ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, ComposedChart, Legend, Line 
} from 'recharts';

export default function GovDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  
  // New States for requested features
  const [isCumulative, setIsCumulative] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'budget' | 'estimation'>('budget');
  const [refMonth, setRefMonth] = useState(new Date().getMonth() + 1);

  const [units, setUnits] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [stats, setStats] = useState({ totalPagu: 0, totalSpent: 0, balance: 0, percent: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [pivotData, setPivotData] = useState<any[]>([]);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: uData } = await supabase.from('gov_units').select('*').order('nama_unit');
      const { data: aData } = await supabase.from('gov_accounts').select('*').order('account_code');
      
      let query = supabase.from('gov_transactions').select('*')
        .gte('tanggal', `${selectedYear}-01-01`)
        .lte('tanggal', `${selectedYear}-12-31`);
      
      const { data: tData } = await query;

      if (uData && aData && tData) {
        setUnits(uData);
        setAccounts(aData);
        setTransactions(tData);

        // --- GLOBAL STATS ---
        const filteredTrxs = tData.filter(t => 
           (selectedUnit === 'all' || t.unit_id === Number(selectedUnit)) &&
           (selectedAccount === 'all' || t.account_id === Number(selectedAccount))
        );

        const totalPagu = filteredTrxs.filter(t => ['pagu awal', 'tambah pagu', 'realokasi tambah'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0) -
                         filteredTrxs.filter(t => ['pengurangan pagu', 'realokasi kurang'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0);
        const totalSpent = filteredTrxs.filter(t => t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0);
        
        setStats({ 
          totalPagu, 
          totalSpent, 
          balance: totalPagu - totalSpent, 
          percent: totalPagu > 0 ? (totalSpent / totalPagu) * 100 : 0 
        });

        // --- MONTHLY DATA (CHART & TABLE 1) ---
        let runningSpent = 0;
        let runningPagu = 0;
        const monthAgg = months.map((m, idx) => {
           const mNum = idx + 1;
           const mTrxs = filteredTrxs.filter(t => new Date(t.tanggal).getMonth() + 1 === mNum);
           
           const mPaguAdd = mTrxs.filter(t => ['pagu awal', 'tambah pagu', 'realokasi tambah'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0);
           const mPaguSub = mTrxs.filter(t => ['pengurangan pagu', 'realokasi kurang'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0);
           const spent = mTrxs.filter(t => t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0);
           
           runningPagu += (mPaguAdd - mPaguSub);
           runningSpent += spent;
           
           return {
              name: m,
              pagu: runningPagu,
              spent: spent,
              cumulative: runningSpent,
              balance: runningPagu - runningSpent,
              percent: runningPagu > 0 ? (runningSpent / runningPagu) * 100 : 0
           };
        });
        setMonthlyData(monthAgg);

        // --- PIVOT DATA (CROSS-TAB & ANALYSIS TABLE) ---
        const pivot = aData.map(acc => {
           const accTrxs = filteredTrxs.filter(t => t.account_id === acc.id);
           
           // Aggregation for Pagu (Awal + Tambah - Kurang)
           const accPagu = accTrxs.filter(t => ['pagu awal', 'tambah pagu', 'realokasi tambah'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0) -
                          accTrxs.filter(t => ['pengurangan pagu', 'realokasi kurang'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0);
           
           // Monthly Realization
           let runningAccSpent = 0;
           const monthlyVals = months.map((_, idx) => {
              const val = accTrxs.filter(t => (new Date(t.tanggal).getMonth() + 1 === idx + 1) && t.jenis === 'realisasi')
                               .reduce((s, t) => s + Number(t.nominal), 0);
              runningAccSpent += val;
              return isCumulative ? runningAccSpent : val;
           });

           const totalRealization = accTrxs.filter(t => t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0);
           const currentMonthRealization = accTrxs.filter(t => (new Date(t.tanggal).getMonth() + 1 === refMonth) && t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0);

           // Estimation logic: Realisasi Bulan N * (12 - N)
           const remainingMonths = 12 - refMonth;
           const kebutuhan = currentMonthRealization * remainingMonths;
           const sisaPagu = accPagu - totalRealization;
           const perkiraanPosisiAkhir = sisaPagu - kebutuhan;

           return {
              ...acc,
              monthlyRealization: monthlyVals,
              totalPagu: accPagu,
              totalSpent: totalRealization,
              balance: accPagu - totalRealization,
              percent: accPagu > 0 ? (totalRealization / accPagu) * 100 : 0,
              // Estimation metrics
              refRealization: currentMonthRealization,
              kebutuhan,
              perkiraanPosisiAkhir
           };
        }).filter(a => a.totalPagu > 0 || a.totalSpent > 0);
        setPivotData(pivot);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedUnit, selectedAccount, isCumulative, refMonth]);

  const handleExport = () => {
    const headers = ['Kode Akun', 'Nama Akun', 'Pagu Tahunan', 'Total Realisasi', 'Sisa Pagu', '%'];
    const rows = pivotData.map(d => [
      `"${d.account_code}"`, `"${d.account_name}"`, d.totalPagu, d.totalSpent, d.balance, d.percent.toFixed(2) + '%'
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Laporan_Govt_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatIDR = (val: number) => (Number(val) || 0).toLocaleString('id-ID');

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Landmark size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Dashboard Dana Pemerintah</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                TA {selectedYear}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Monitoring serapan pagu belanja gaji, tunjangan, dan operasional pemerintah</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Tahun */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9 shrink-0">
            <Calendar size={14} className="text-gray-400" />
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>

          {/* Akun */}
          <div className="w-44">
            <select 
              value={selectedAccount} 
              onChange={e => setSelectedAccount(e.target.value)} 
              className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-2.5 text-xs font-semibold text-gray-800 outline-none cursor-pointer truncate"
            >
              <option value="all">Semua Akun</option>
              {accounts.map(a => <option key={a.id} value={a.id}>[{a.account_code}] {a.account_name}</option>)}
            </select>
          </div>

          {/* Unit Kerja */}
          <div className="w-40">
            <select 
              value={selectedUnit} 
              onChange={e => setSelectedUnit(e.target.value)} 
              className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl px-2.5 text-xs font-semibold text-gray-800 outline-none cursor-pointer truncate"
            >
              <option value="all">Semua Unit</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Pagu */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pagu {selectedYear}</p>
            <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate" title={`Rp ${formatIDR(stats.totalPagu)}`}>
              Rp {formatIDR(stats.totalPagu)}
            </h3>
            <span className="text-[10px] font-semibold text-indigo-600">Alokasi Anggaran Belanja</span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wallet size={20} />
          </div>
        </div>

        {/* Total Realisasi */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Realisasi</p>
              <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                {stats.percent.toFixed(2)}% Terpakai
              </span>
            </div>
            <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate" title={`Rp ${formatIDR(stats.totalSpent)}`}>
              Rp {formatIDR(stats.totalSpent)}
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
               <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(stats.percent, 100)}%` }}></div>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Sisa Pagu */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sisa Pagu Anggaran</p>
            <h3 className="text-base font-black text-emerald-700 mt-0.5 font-mono truncate" title={`Rp ${formatIDR(stats.balance)}`}>
              Rp {formatIDR(stats.balance)}
            </h3>
            <span className="text-[10px] font-semibold text-emerald-600">Saldo Tersedia</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Scale size={20} />
          </div>
        </div>
      </div>

      {/* CHART: KOMPOSISI REALISASI VS PAGU */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col h-[380px]">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                <Activity size={14} />
              </div>
              <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">
                Komposisi Realisasi vs Pagu TA {selectedYear}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> <span>Pagu</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-rose-400 rounded-full" /> <span>Kumulatif</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-amber-300 rounded-full" /> <span>Bulanan</span></div>
            </div>
         </div>
         <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <XAxis dataKey="name" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} width={80} tickFormatter={(v) => `Rp ${(v/1000000000).toFixed(1)}M`} tick={{fill: '#64748b'}} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '11px' }}
                     formatter={(value: any) => `Rp ${formatIDR(value)}`}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Line type="stepAfter" dataKey="pagu" name="Pagu Dinamis" stroke="#3b82f6" strokeWidth={2.5} dot={false} strokeDasharray="6 4" />
                  <Bar dataKey="spent" name="Realisasi Bulanan" fill="#fde68a" radius={[4, 4, 0, 0]} barSize={22} />
                  <Area type="monotone" dataKey="cumulative" name="Realisasi Kumulatif" fill="url(#colorSpentGov)" stroke="#f87171" strokeWidth={2.5} fillOpacity={0.15} />
                  <defs>
                     <linearGradient id="colorSpentGov" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
               </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* TABLE 1: RINGKASAN BULANAN */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
         <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-xs">Ringkasan Serapan Bulanan</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                     <th className="py-3 px-4">Bulan</th>
                     <th className="py-3 px-4 text-right">Pagu Moving</th>
                     <th className="py-3 px-4 text-right text-amber-600">Realisasi Bulanan</th>
                     <th className="py-3 px-4 text-right text-rose-600">Realisasi Kumulatif</th>
                     <th className="py-3 px-4 text-center">% Realisasi</th>
                     <th className="py-3 px-4 text-right text-emerald-700">Sisa Pagu</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {monthlyData.map((d, i) => (
                     <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-gray-900 text-xs">{d.name}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-800 text-xs text-right">Rp {formatIDR(d.pagu)}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-600 text-xs text-right">Rp {formatIDR(d.spent)}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-rose-600 text-xs text-right">Rp {formatIDR(d.cumulative)}</td>
                        <td className="py-2.5 px-4 text-center">
                           <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono">
                             {d.percent.toFixed(2)}%
                           </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 text-xs text-right">Rp {formatIDR(d.balance)}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* TABLE 2: CROSS-TAB MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
         <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
               <h3 className="font-bold text-gray-900 text-xs">
                 Penggunaan Pagu Berdasarkan Bulan TA {selectedYear}
               </h3>
               <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  Analisis per Master Akun • {isCumulative ? 'Kumulatif (Jan s/d N)' : 'Per Bulan Individual'}
               </p>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex bg-gray-200/60 p-0.5 rounded-xl">
                  <button 
                    onClick={() => setIsCumulative(false)} 
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${!isCumulative ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Per Bulan
                  </button>
                  <button 
                    onClick={() => setIsCumulative(true)} 
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${isCumulative ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Kumulatif
                  </button>
               </div>
               <button 
                 onClick={handleExport} 
                 className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
               >
                  <Download size={13} /> <span>Export CSV</span>
               </button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[9px] tracking-wider text-center">
                    <th className="py-2.5 px-4 text-left border-r border-gray-200 sticky left-0 bg-gray-50/90 z-10" rowSpan={2}>
                      Kode & Nama Akun (Mata Anggaran)
                    </th>
                    <th className="py-2 px-2 border-r border-gray-200 bg-indigo-50/40 text-indigo-900" colSpan={6}>Semester 1</th>
                    <th className="py-2 px-2 border-r border-gray-200 bg-blue-50/40 text-blue-900" colSpan={6}>Semester 2</th>
                    <th className="py-2.5 px-4 border-r border-gray-200 bg-indigo-50/60 text-indigo-900 text-right" rowSpan={2}>Total Realisasi</th>
                    <th className="py-2.5 px-4 bg-gray-900 text-white text-right" rowSpan={2}>Total Pagu</th>
                  </tr>
                  <tr className="bg-gray-50/60 border-b border-gray-200 text-[8px] font-black text-gray-400 uppercase text-center">
                    {months.map(m => <th key={m} className="py-1.5 px-2 border-r border-gray-200">{m.substring(0,3)}</th>)}
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {pivotData.map((d, i) => (
                     <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-2 px-4 border-r border-gray-100 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-1">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-gray-900 text-xs">[{d.account_code}]</span>
                            <span className="text-[10px] text-gray-500 font-semibold truncate max-w-[220px]">{d.account_name}</span>
                          </div>
                        </td>
                        {d.monthlyRealization.map((m: number, idx: number) => (
                          <td key={idx} className="py-2 px-2 border-r border-gray-100 text-right font-mono text-xs text-gray-700 whitespace-nowrap">
                            {m > 0 ? m.toLocaleString('id-ID') : '-'}
                          </td>
                        ))}
                        <td className="py-2 px-4 bg-indigo-50/30 border-r border-gray-100 font-mono font-bold text-indigo-700 text-right text-xs">
                          {d.totalSpent.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-4 bg-gray-50 font-mono font-bold text-gray-900 text-right text-xs">
                          {d.totalPagu.toLocaleString('id-ID')}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* TABLE 3: ANALYSIS TABLE (BUDGET VS ESTIMATION) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
         <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-xs">
                Tabel Akhir Per Akun: Berdasar {analysisMode === 'budget' ? 'Anggaran (Pagu)' : 'Perkiraan Proyeksi'}
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Analisis proyeksi kebutuhan sisa bulan berjalan</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
               <div className="flex bg-gray-200/60 p-0.5 rounded-xl">
                  <button 
                    onClick={() => setAnalysisMode('budget')} 
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${analysisMode === 'budget' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Anggaran
                  </button>
                  <button 
                    onClick={() => setAnalysisMode('estimation')} 
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${analysisMode === 'estimation' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Perkiraan
                  </button>
               </div>

               {analysisMode === 'estimation' && (
                  <select 
                    value={refMonth} 
                    onChange={e => setRefMonth(Number(e.target.value))} 
                    className="h-8 bg-white border border-gray-200 rounded-xl px-2.5 text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                  >
                     {months.map((m, idx) => <option key={idx} value={idx + 1}>Acuan: {m}</option>)}
                  </select>
               )}

               <button 
                 onClick={fetchData} 
                 className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
               >
                 <TrendingUp size={13} /> <span>Terapkan</span>
               </button>
            </div>
         </div>

         {/* SUMMARY TILES FOR ANALYSIS */}
         <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50/40 border-b border-gray-200">
            <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
               <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><PieChart size={18} /></div>
               <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Jumlah Akun</p><h5 className="text-sm font-black text-gray-900">{pivotData.length} Akun</h5></div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
               <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Wallet size={18} /></div>
               <div className="min-w-0"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Pagu</p>
               <h5 className="text-xs font-mono font-black text-gray-900 truncate">Rp {formatIDR(stats.totalPagu)}</h5></div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
               <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><TrendingUp size={18} /></div>
               <div className="min-w-0"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Realisasi</p>
               <h5 className="text-xs font-mono font-black text-emerald-700 truncate">Rp {formatIDR(stats.totalSpent)}</h5></div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
               <div className="bg-amber-50 p-2 rounded-lg text-amber-600"><Scale size={18} /></div>
               <div className="min-w-0"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Sisa Dana</p>
               <h5 className="text-xs font-mono font-black text-gray-900 truncate">Rp {formatIDR(stats.balance)}</h5></div>
            </div>

            {analysisMode === 'estimation' && (
               <>
                  <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs flex items-center gap-3">
                     <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Activity size={18} /></div>
                     <div className="min-w-0"><p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider truncate">Realisasi {months[refMonth-1]}</p>
                     <h5 className="text-xs font-mono font-black text-blue-900 truncate">Rp {formatIDR(pivotData.reduce((s,d) => s+d.refRealization, 0))}</h5></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center gap-3">
                     <div className="bg-amber-50 p-2 rounded-lg text-amber-600"><CreditCard size={18} /></div>
                     <div className="min-w-0"><p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider truncate">Kebutuhan x ({12-refMonth} Bln)</p>
                     <h5 className="text-xs font-mono font-black text-amber-900 truncate">Rp {formatIDR(pivotData.reduce((s,d) => s+d.kebutuhan, 0))}</h5></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex items-center gap-3">
                     <div className="bg-rose-50 p-2 rounded-lg text-rose-600"><TrendingDown size={18} /></div>
                     <div className="min-w-0"><p className="text-[9px] font-bold text-rose-600 uppercase tracking-wider truncate">Perkiraan Posisi Akhir</p>
                     <h5 className="text-xs font-mono font-black text-rose-900 truncate">Rp {formatIDR(pivotData.reduce((s,d) => s+d.perkiraanPosisiAkhir, 0))}</h5></div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex items-center gap-3">
                     <div className="bg-gray-100 p-2 rounded-lg text-gray-700"><Percent size={18} /></div>
                     <div className="min-w-0"><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">% Penyerapan</p>
                     <h5 className="text-xs font-mono font-black text-gray-900 truncate">{stats.percent.toFixed(2)}%</h5></div>
                  </div>
               </>
            )}
         </div>

         {/* DATA TABLE FOR ANALYSIS */}
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                     <th className="py-3 px-4">Akun</th>
                     <th className="py-3 px-4 text-right">Pagu</th>
                     <th className="py-3 px-4 text-right">Realisasi</th>
                     <th className="py-3 px-4 text-center">%</th>
                     {analysisMode === 'budget' ? (
                        <th className="py-3 px-4 text-right">Kurang/Sisa</th>
                     ) : (
                        <>
                           <th className="py-3 px-4 text-right text-indigo-700">Realisasi {months[refMonth-1]}</th>
                           <th className="py-3 px-4 text-right">Kebutuhan x ({12-refMonth} bln)</th>
                           <th className="py-3 px-4 text-right text-rose-600">Perkiraan Posisi Akhir</th>
                        </>
                     )}
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {pivotData.map((d, i) => (
                     <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-2.5 px-4">
                           <div className="flex flex-col">
                             <span className="text-gray-900 font-bold font-mono text-xs">[{d.account_code}]</span>
                             <span className="text-[10px] text-gray-500 font-semibold">{d.account_name}</span>
                           </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-800 text-xs text-right">Rp {formatIDR(d.totalPagu)}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-gray-800 text-xs text-right">Rp {formatIDR(d.totalSpent)}</td>
                        <td className="py-2.5 px-4 text-center">
                           <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono">
                             {d.percent.toFixed(2)}%
                           </span>
                        </td>
                        {analysisMode === 'budget' ? (
                           <td className="py-2.5 px-4 font-mono font-bold text-emerald-700 text-xs text-right">Rp {formatIDR(d.balance)}</td>
                        ) : (
                           <>
                              <td className="py-2.5 px-4 font-mono font-bold text-indigo-700 text-xs text-right">Rp {formatIDR(d.refRealization)}</td>
                              <td className="py-2.5 px-4 font-mono font-bold text-gray-700 text-xs text-right">Rp {formatIDR(d.kebutuhan)}</td>
                              <td className={`py-2.5 px-4 font-mono font-bold text-xs text-right ${d.perkiraanPosisiAkhir < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                                 Rp {formatIDR(d.perkiraanPosisiAkhir)}
                              </td>
                           </>
                        )}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
