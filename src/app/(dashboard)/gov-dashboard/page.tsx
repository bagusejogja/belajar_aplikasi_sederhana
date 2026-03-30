'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Filter, Loader2, Download, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Activity, CreditCard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';

export default function GovDashboardPage() {
  const [stats, setStats] = useState({ totalPagu: 0, totalSpent: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topUnits, setTopUnits] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: units } = await supabase.from('gov_units').select('id, nama_unit');
      const { data: trxs } = await supabase
        .from('gov_transactions')
        .select('*')
        .gte('tanggal', `${selectedYear}-01-01`)
        .lte('tanggal', `${selectedYear}-12-31`);

      if (units && trxs) {
          // Calculate Totals
        const totalPagu = trxs.filter(t => 
          t.jenis === 'pagu awal' || t.jenis === 'tambah pagu' || t.jenis === 'realokasi tambah'
        ).reduce((s, t) => s + Number(t.nominal), 0) -
        trxs.filter(t => 
          t.jenis === 'pengurangan pagu' || t.jenis === 'realokasi kurang'
        ).reduce((s, t) => s + Number(t.nominal), 0);
        
        const totalSpent = trxs.filter(t => t.jenis === 'realisasi')
                            .reduce((s, t) => s + Number(t.nominal), 0);
        
        setStats({ totalPagu, totalSpent, count: trxs.length });

        // Chart Data (By Type)
        const byType = [
           { name: 'Pagu Awal', val: trxs.filter(t => t.jenis === 'pagu awal').reduce((s, t) => s + Number(t.nominal), 0) },
           { name: 'Realisasi', val: trxs.filter(t => t.jenis === 'realisasi').reduce((s, t) => s + Number(t.nominal), 0) },
           { name: 'Tambah Pagu', val: trxs.filter(t => t.jenis === 'tambah pagu').reduce((s, t) => s + Number(t.nominal), 0) }
        ];
        setChartData(byType);

        // Top 5 Spenders
        const unitRanking = units.map(u => {
          const spent = trxs.filter(t => t.unit_id === u.id && t.jenis === 'realisasi')
                           .reduce((s, t) => s + Number(t.nominal), 0);
          return { name: u.nama_unit, spent };
        }).sort((a, b) => b.spent - a.spent).slice(0, 5);

        setTopUnits(unitRanking);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  if (loading) return (
    <div className="p-40 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Data Real-Time...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* GLOSSY HEADER */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-indigo-600/10 rounded-tl-[10rem] blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl group transition-all hover:scale-105">
                 <Activity size={48} className="text-blue-300 animate-pulse" />
              </div>
              <div>
                 <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Workspace <span className="text-indigo-400">Governance</span></h1>
                 <div className="flex items-center gap-4">
                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Pusat Analisis & Strategi Anggaran • </p>
                    <select 
                       value={selectedYear}
                       onChange={e => setSelectedYear(Number(e.target.value))}
                       className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-[10px] font-black uppercase outline-none cursor-pointer hover:bg-white/20 transition-all"
                    >
                       <option value={2024} className="text-slate-900">TA 2024</option>
                       <option value={2025} className="text-slate-900">TA 2025</option>
                       <option value={2026} className="text-slate-900">TA 2026</option>
                    </select>
                 </div>
              </div>
           </div>
           
           <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md flex flex-col items-end">
              <p className="text-white/40 font-black text-[10px] uppercase tracking-widest mb-1">Status Penyerapan</p>
              <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">{((stats.totalSpent / stats.totalPagu)*100).toFixed(1)}% <span className="text-xs uppercase tracking-normal font-bold text-white/50">Used</span></h4>
           </div>
        </div>
      </div>

      {/* MACRO STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col justify-between group hover:border-indigo-200 transition-all">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6"><Wallet size={20} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aggregated Budget</p>
               <h4 className="text-2xl font-black text-slate-900 tracking-tighter">IDR {stats.totalPagu.toLocaleString('id-ID')}</h4>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col justify-between group">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6"><ArrowDownRight size={20} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Realization</p>
               <h4 className="text-2xl font-black text-slate-900 tracking-tighter">IDR {stats.totalSpent.toLocaleString('id-ID')}</h4>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col justify-between group">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6"><CreditCard size={20} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Funds</p>
               <h4 className="text-2xl font-black text-emerald-600 tracking-tighter">IDR {(stats.totalPagu - stats.totalSpent).toLocaleString('id-ID')}</h4>
            </div>
         </div>
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-indigo-200">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6"><Activity size={20} /></div>
            <div>
               <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Total Entries</p>
               <h4 className="text-2xl font-black tracking-tighter">{stats.count} Transaksi</h4>
            </div>
         </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         {/* CHART Penyerapan */}
         <div className="xl:col-span-8 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3">
               <TrendingUp className="text-indigo-600" /> Komposisi Alokasi vs Serapan
            </h4>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                     <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 'black', fontSize: '12px' }}
                     />
                     <Bar dataKey="val" radius={[12, 12, 12, 12]} barSize={60}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 1 ? '#6366f1' : '#e2e8f0'} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* TOP SPENDERS */}
         <div className="xl:col-span-4 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-8">Top 5 Unit Kerja (Spending)</h4>
            <div className="space-y-6">
               {topUnits.map((u, i) => (
                  <div key={i} className="flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-[10px] group-hover:bg-indigo-500 transition-colors">{i+1}</div>
                        <p className="text-xs font-bold text-white/80 line-clamp-1">{u.name}</p>
                     </div>
                     <p className="text-[10px] font-black text-blue-300">IDR {(u.spent/1000000).toFixed(1)}M</p>
                  </div>
               ))}
               {topUnits.length === 0 && <p className="text-slate-500 italic text-xs">Belum ada realisasi belanja.</p>}
            </div>
            
            <button className="w-full mt-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">Lihat Semua Laporan</button>
         </div>
      </div>
    </div>
  );
}
