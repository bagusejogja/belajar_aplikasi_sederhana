'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Filter, Loader2, Download, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard, Scale
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, ComposedChart, Legend, Line
} from 'recharts';

export default function GovDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  
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

        // --- CALCULATION LOGIC ---
        const filteredTrxs = tData.filter(t => 
           (selectedUnit === 'all' || t.unit_id === Number(selectedUnit)) &&
           (selectedAccount === 'all' || t.account_id === Number(selectedAccount))
        );

        const paguAdd = filteredTrxs.filter(t => ['pagu awal', 'tambah pagu', 'realokasi tambah'].includes(t.jenis))
                           .reduce((s, t) => s + Number(t.nominal), 0);
        const paguSub = filteredTrxs.filter(t => ['pengurangan pagu', 'realokasi kurang'].includes(t.jenis))
                           .reduce((s, t) => s + Number(t.nominal), 0);
        const totalPagu = paguAdd - paguSub;
        const totalSpent = filteredTrxs.filter(t => t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0);
        
        setStats({ 
          totalPagu, 
          totalSpent, 
          balance: totalPagu - totalSpent, 
          percent: totalPagu > 0 ? (totalSpent / totalPagu) * 100 : 0 
        });

        // --- MONTHLY DATA (CHART & TABLE 1) ---
        let runningSpent = 0;
        const monthAgg = months.map((m, idx) => {
           const mNum = idx + 1;
           const mTrxs = filteredTrxs.filter(t => new Date(t.tanggal).getMonth() + 1 === mNum);
           const spent = mTrxs.filter(t => t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0);
           runningSpent += spent;
           return {
              name: m,
              pagu: totalPagu, // Visual reference
              spent: spent,
              cumulative: runningSpent,
              balance: totalPagu - runningSpent,
              percent: totalPagu > 0 ? (runningSpent / totalPagu) * 100 : 0
           };
        });
        setMonthlyData(monthAgg);

        // --- PIVOT DATA (TABLE 2) ---
        const pivot = aData.map(acc => {
           const accTrxs = filteredTrxs.filter(t => t.account_id === acc.id);
           const monthlyRealization = months.map((_, idx) => {
              return accTrxs.filter(t => (new Date(t.tanggal).getMonth() + 1 === idx + 1) && t.jenis === 'realisasi')
                           .reduce((s, t) => s + Number(t.nominal), 0);
           });
           
           const accPaguAdd = accTrxs.filter(t => ['pagu awal', 'tambah pagu', 'realokasi tambah'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0);
           const accPaguSub = accTrxs.filter(t => ['pengurangan pagu', 'realokasi kurang'].includes(t.jenis)).reduce((s, t) => s + Number(t.nominal), 0);
           const accPagu = accPaguAdd - accPaguSub;
           const accSpent = monthlyRealization.reduce((s, v) => s + v, 0);

           return {
              ...acc,
              monthlyRealization,
              totalPagu: accPagu,
              totalSpent: accSpent,
              balance: accPagu - accSpent,
              percent: accPagu > 0 ? (accSpent / accPagu) * 100 : 0
           };
        }).filter(a => a.totalPagu > 0 || a.totalSpent > 0);
        setPivotData(pivot);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedUnit, selectedAccount]);

  if (loading) return (
    <div className="p-40 flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Menghitung Data Finansial...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20 max-w-[1600px] mx-auto">
      {/* 1. FILTER BAR (Matching Image Layout) */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
         <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-8 uppercase flex items-center gap-3">
            <Filter size={24} className="text-indigo-600" /> Ringkasan Dana Pemerintah
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jenis Filter</label>
               <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-500">
                  <option>Gaji & Tunjangan</option>
                  <option>Belanja Barang</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tahun Anggaran</label>
               <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-500"
               >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Akun</label>
               <select 
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-500"
               >
                  <option value="all">Semua Akun</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>[{a.account_code}] {a.account_name}</option>)}
               </select>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Unit Kerja</label>
               <select 
                  value={selectedUnit}
                  onChange={e => setSelectedUnit(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-500"
               >
                  <option value="all">Semua Unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.nama_unit}</option>)}
               </select>
            </div>
         </div>
      </div>

      {/* 2. KPI SUMMARY CARDS (Blue, Green, Yellow) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-[2.5rem] p-8 text-white shadow-xl flex items-center justify-between group">
            <div>
               <p className="text-[12px] font-bold text-blue-200/60 uppercase tracking-widest mb-1">Pagu {selectedYear}</p>
               <h4 className="text-4xl font-black tracking-tighter italic">IDR {stats.totalPagu.toLocaleString('id-ID')}</h4>
               <p className="text-[10px] mt-2 opacity-40 font-bold uppercase tracking-widest">Aggregate Allocation TA 2025</p>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/20">
               <Wallet size={40} className="text-white/60" />
            </div>
         </div>

         <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2.5rem] p-8 text-white shadow-xl flex items-center justify-between">
            <div>
               <p className="text-[12px] font-bold text-emerald-100/60 uppercase tracking-widest mb-1">Realisasi {selectedYear}</p>
               <h4 className="text-4xl font-black tracking-tighter italic">IDR {stats.totalSpent.toLocaleString('id-ID')}</h4>
               <p className="text-[10px] mt-2 bg-white/10 inline-block px-3 py-1 rounded-full font-bold uppercase tracking-widest">Absorption Rate: {stats.percent.toFixed(2)}%</p>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/20">
               <TrendingUp size={40} className="text-white/60" />
            </div>
         </div>

         <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] p-8 text-white shadow-xl flex items-center justify-between">
            <div>
               <p className="text-[12px] font-bold text-amber-50/60 uppercase tracking-widest mb-1">Sisa Pagu</p>
               <h4 className="text-4xl font-black tracking-tighter italic">IDR {stats.balance.toLocaleString('id-ID')}</h4>
               <p className="text-[10px] mt-2 opacity-60 font-bold uppercase tracking-widest">Available Balance</p>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/20">
               <Scale size={40} className="text-white/60" />
            </div>
         </div>
      </div>

      {/* 3. CHART: KOMPOSISI REALISASI (Composite Bar + Area) */}
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
         <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center justify-between">
            <span>Komposisi Realisasi vs Pagu {selectedYear}</span>
            <div className="flex gap-4">
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /> <span className="text-[9px]">Pagu Tahunan</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded-full" /> <span className="text-[9px]">Realisasi Kumulatif</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-200 rounded-full" /> <span className="text-[9px]">Realisasi Bulanan</span></div>
            </div>
         </h4>
         <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={monthlyData}>
                  <XAxis dataKey="name" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} width={80} tickFormatter={(v) => `IDR ${(v/1000000000).toFixed(1)}M`} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                     itemStyle={{ fontWeight: 'black', fontSize: '11px' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  
                  <Line type="monotone" dataKey="pagu" stroke="#3b82f6" strokeWidth={3} dot={false} strokeDasharray="10 5" />
                  <Bar dataKey="spent" fill="#fde68a" radius={[12, 12, 0, 0]} barSize={25} />
                  <Area type="monotone" dataKey="cumulative" fill="url(#colorSpent)" stroke="#f87171" strokeWidth={3} fillOpacity={0.1} />
                  
                  <defs>
                     <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
               </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* 4. TABLE: RINGKASAN BULANAN PAGU & REALISASI */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-8 border-b bg-slate-50 italic">
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Ringkasan Serapan Bulanan</h4>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
               <thead>
                  <tr className="bg-white text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                     <th className="p-6 border-b">Bulan</th>
                     <th className="p-6 border-b">Pagu Tahunan</th>
                     <th className="p-6 border-b">Realisasi Bulanan</th>
                     <th className="p-6 border-b">Realisasi Kumulatif</th>
                     <th className="p-6 border-b">% Realisasi</th>
                     <th className="p-6 border-b">Sisa Pagu</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {monthlyData.map((d, i) => (
                     <tr key={i} className="hover:bg-slate-50 transition-all font-bold text-xs text-slate-600">
                        <td className="p-6 font-black text-slate-800 italic uppercase">{d.name}</td>
                        <td className="p-6">IDR {stats.totalPagu.toLocaleString('id-ID')}</td>
                        <td className="p-6 text-amber-600 font-black">IDR {d.spent.toLocaleString('id-ID')}</td>
                        <td className="p-6 text-red-500">IDR {d.cumulative.toLocaleString('id-ID')}</td>
                        <td className="p-6">
                           <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black">{d.percent.toFixed(2)}%</span>
                        </td>
                        <td className="p-6 font-black text-emerald-600">IDR {d.balance.toLocaleString('id-ID')}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* 5. TABLE: CROSS-TAB ACCOUNT VS MONTHS */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden mt-12">
         <div className="p-10 border-b bg-indigo-900 text-white flex justify-between items-center">
            <div>
               <h4 className="text-lg font-black uppercase italic tracking-tighter">Penggunaan Pagu Berdasarkan Bulan TA {selectedYear}</h4>
               <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-1">Cross-Tabulation Analysis per Master Account</p>
            </div>
            <div className="flex gap-4">
               <button className="bg-white/10 px-6 py-3 rounded-xl text-[10px] font-black hover:bg-white/20 transition-all">EKSPOR EXCEL</button>
               <button className="bg-white text-indigo-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-black/20">PREVIEW LAPORAN</button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
               <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
                     <th className="p-4 border-b border-r text-left" rowSpan={2}>Kode & Nama Akun (Mata Anggaran)</th>
                     <th className="p-2 border-b border-r" colSpan={6}>Semester 1</th>
                     <th className="p-2 border-b border-r" colSpan={6}>Semester 2</th>
                     <th className="p-4 border-b" rowSpan={2}>Total Realisasi</th>
                     <th className="p-4 border-b" rowSpan={2}>Total Pagu</th>
                  </tr>
                  <tr className="text-[8px] font-black text-slate-400 uppercase text-center">
                     {months.map(m => <th key={m} className="p-2 border-b border-r">{m.substring(0,3)}</th>)}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 italic">
                  {pivotData.map((d, i) => (
                     <tr key={i} className="hover:bg-slate-50 transition-all text-[10px]">
                        <td className="p-4 border-r sticky left-0 bg-white group-hover:bg-slate-50 z-[2]">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-800 uppercase tracking-tighter">[{d.account_code}]</span>
                              <span className="text-[9px] font-bold text-slate-400 line-clamp-1">{d.account_name}</span>
                           </div>
                        </td>
                        {d.monthlyRealization.map((m: number, idx: number) => (
                           <td key={idx} className="p-2 border-r text-right font-bold text-slate-500 whitespace-nowrap">
                              {m > 0 ? m.toLocaleString('id-ID') : '-'}
                           </td>
                        ))}
                        <td className="p-4 bg-indigo-50 font-black text-indigo-700 text-right">
                           {d.totalSpent.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 bg-slate-900 text-white font-black text-right">
                           {d.totalPagu.toLocaleString('id-ID')}
                        </td>
                     </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-indigo-600 text-white font-black text-[10px]">
                     <td className="p-6 uppercase">TOTAL AGREGAT</td>
                     {months.map((_, idx) => {
                        const totalM = pivotData.reduce((s, d) => s + d.monthlyRealization[idx], 0);
                        return <td key={idx} className="p-2 text-right">{totalM.toLocaleString('id-ID')}</td>
                     })}
                     <td className="p-6 text-right">IDR {stats.totalSpent.toLocaleString('id-ID')}</td>
                     <td className="p-6 text-right">IDR {stats.totalPagu.toLocaleString('id-ID')}</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
