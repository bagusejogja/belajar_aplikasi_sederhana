'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, PieChart, TrendingDown, TrendingUp, Search, Filter, Loader2, Download, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GovReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Fetch Units
      const { data: units } = await supabase.from('gov_units').select('id, nama_unit, kode_unit, group_org').order('nama_unit');
      // Fetch Transactions
      const { data: trxs } = await supabase.from('gov_transactions').select('unit_id, nominal, jenis');

      if (units && trxs) {
        const report = units.map(unit => {
          const unitTrxs = trxs.filter(t => t.unit_id === unit.id);
          
          // Logic Pagu vs Realisasi
          const pagu = unitTrxs.filter(t => 
             t.jenis === 'pagu awal' || t.jenis === 'tambah pagu' || t.jenis === 'realokasi tambah'
          ).reduce((sum, t) => sum + Number(t.nominal), 0) - 
          unitTrxs.filter(t => 
             t.jenis === 'pengurangan pagu' || t.jenis === 'realokasi kurang'
          ).reduce((sum, t) => sum + Number(t.nominal), 0);

          const spent = unitTrxs.filter(t => t.jenis === 'realisasi').reduce((sum, t) => sum + Number(t.nominal), 0);
          
          return {
            ...unit,
            pagu,
            spent,
            balance: pagu - spent,
            percent: pagu > 0 ? (spent / pagu) * 100 : 0
          };
        });
        setData(report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredData = data.filter(d => 
    d.nama_unit.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.kode_unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPagu = data.reduce((s, d) => s + d.pagu, 0);
  const totalSpent = data.reduce((s, d) => s + d.spent, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
           <div>
              <div className="flex items-center gap-4 mb-4">
                 <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-lg shadow-indigo-200">
                    <PieChart size={32} />
                 </div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Pagu & Realisasi</h1>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                 Monitoring Anggaran Pemerintah (UGM) • <span className="text-emerald-500">Live Workspace</span>
              </p>
           </div>

           <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                 <input 
                    type="text" 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Cari Unit Kerja..."
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-slate-700" 
                 />
              </div>
              <button className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                 <Download size={24} />
              </button>
           </div>
        </div>
      </div>

      {/* OVERALL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute right-6 top-6 bg-white/10 p-3 rounded-2xl">
               <Wallet size={24} className="text-blue-300" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Total Alokasi Pagu</p>
            <h4 className="text-3xl font-black tracking-tight">IDR {totalPagu.toLocaleString('id-ID')}</h4>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-blue-300/60 tracking-wider">
               <ArrowUpRight size={14} /> DANA AKTIF TA 2025
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
            <div className="absolute right-6 top-6 bg-red-50 p-3 rounded-2xl">
               <TrendingDown size={24} className="text-red-500" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Realisasi</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tight">IDR {totalSpent.toLocaleString('id-ID')}</h4>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black tracking-wider">
               <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full">{((totalSpent/totalPagu)*100).toFixed(2)}% TERPAKAI</span>
            </div>
         </div>

         <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute right-6 top-6 bg-white/20 p-3 rounded-2xl">
               <TrendingUp size={24} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Sisa Anggaran</p>
            <h4 className="text-3xl font-black tracking-tight">IDR {(totalPagu - totalSpent).toLocaleString('id-ID')}</h4>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-white/60 tracking-wider uppercase">
               SIAP DIGUNAKAN
            </div>
         </div>
      </div>

      {/* REPORT TABLE */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
         {loading ? (
            <div className="p-40 flex flex-col items-center justify-center gap-6">
               <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  <PieChart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-200" size={24} />
               </div>
               <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Komputasi Data Anggaran...</p>
            </div>
         ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-slate-50">
                     <tr className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                        <th className="p-8 border-b">Unit Kerja / Organisasi</th>
                        <th className="p-8 border-b">Alokasi Pagu</th>
                        <th className="p-8 border-b">Realisasi</th>
                        <th className="p-8 border-b">Sisa Saldo</th>
                        <th className="p-8 border-b">% Serapan</th>
                        <th className="p-8 border-b text-center">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-all group">
                           <td className="p-8">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <Building2 size={20} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="font-black text-slate-800 tracking-tight leading-tight mb-1">{row.nama_unit}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.kode_unit} • {row.group_org}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-8 font-black text-slate-900">IDR {row.pagu.toLocaleString('id-ID')}</td>
                           <td className="p-8">
                              <span className="font-black text-red-500">IDR {row.spent.toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-8">
                              <span className="font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">IDR {row.balance.toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-8">
                              <div className="w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full transition-all duration-1000 ${row.percent > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${Math.min(row.percent, 100)}%` }} 
                                 />
                              </div>
                              <p className="text-[9px] font-black mt-2 text-slate-400 tracking-tighter">{row.percent.toFixed(1)}% TERPAKAI</p>
                           </td>
                           <td className="p-8 text-center text-slate-200">
                              <ChevronRight size={20} />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
    </div>
  );
}
