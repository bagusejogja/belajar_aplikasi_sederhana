'use client';
import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Activity, ListFilter, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPenerimaan() {
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [dataRealisasi, setDataRealisasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/penerimaan/data?tahun=${tahun}`);
      const json = await res.json();
      if (json.success) setDataRealisasi(json.data || []);
    } catch (e) {
      toast.error('Gagal mengambil data dashboard');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tahun]);

  // Kalkulasi Total Setahun
  const totalRencana = dataRealisasi.reduce((acc, curr) => acc + (Number(curr.rencana) || 0), 0);
  const totalRealisasi = dataRealisasi.reduce((acc, curr) => acc + (Number(curr.realisasi) || 0), 0);
  const persentase = totalRencana > 0 ? ((totalRealisasi / totalRencana) * 100).toFixed(2) : 0;

  // Persiapkan Data Bulanan (Gabungan dari semua jenis penerimaan per bulan)
  const monthlyData: any[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  let accumRencana = 0;
  let accumRealisasi = 0;

  for (let i = 1; i <= 12; i++) {
    const dataBulanIni = dataRealisasi.filter(d => d.bulan === i);
    const sumRencana = dataBulanIni.reduce((acc, curr) => acc + (Number(curr.rencana) || 0), 0);
    const sumRealisasi = dataBulanIni.reduce((acc, curr) => acc + (Number(curr.realisasi) || 0), 0);

    accumRencana += sumRencana;
    accumRealisasi += sumRealisasi;

    monthlyData.push({
      bulanId: i,
      name: monthNames[i - 1],
      Rencana: sumRencana,
      Realisasi: sumRealisasi,
      AkumulasiRencana: accumRencana,
      AkumulasiRealisasi: accumRealisasi
    });
  }

  const formatRupiah = (val: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  const formatMilyar = (val: any) => `${(val / 1000000000).toFixed(2)} M`;

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Monitoring Penerimaan</h1>
          <p className="text-gray-500 mt-1">Analisis dan pelacakan capaian penerimaan secara bulanan dan akumulatif.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
           <div className="flex items-center gap-2 px-4">
              <ListFilter size={18} className="text-indigo-600"/>
              <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none">
                 {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 text-indigo-600 mb-2 relative"><Target size={20}/><span className="font-black text-xs tracking-widest uppercase">Total Rencana</span></div>
            <div className="text-3xl font-black text-gray-900 relative">{formatRupiah(totalRencana)}</div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 text-emerald-600 mb-2 relative"><Activity size={20}/><span className="font-black text-xs tracking-widest uppercase">Total Realisasi</span></div>
            <div className="text-3xl font-black text-gray-900 relative">{formatRupiah(totalRealisasi)}</div>
         </div>
         <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg flex flex-col justify-center relative overflow-hidden text-white">
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 text-indigo-200 mb-2 relative"><TrendingUp size={20}/><span className="font-black text-xs tracking-widest uppercase">Persentase Capaian</span></div>
            <div className="text-4xl font-black relative">{persentase}%</div>
         </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100"><p className="text-gray-500 font-bold">Memuat Grafik...</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafik Bulanan (Isolated Month) */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[450px]">
            <h3 className="font-black text-gray-900 mb-6 text-sm flex items-center gap-2"><BarChart3 size={18} className="text-indigo-600"/> TREN BULANAN (Target vs Realisasi)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatMilyar} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => formatRupiah(val)} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} iconType="circle" />
                <Bar dataKey="Rencana" fill="#e0e7ff" radius={[6, 6, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="Realisasi" stroke="#4f46e5" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Grafik Akumulasi (Year-To-Date) */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[450px]">
            <h3 className="font-black text-gray-900 mb-6 text-sm flex items-center gap-2"><TrendingUp size={18} className="text-emerald-600"/> TREN AKUMULASI (Year-To-Date)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAkumRealisasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatMilyar} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => formatRupiah(val)} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} iconType="circle" />
                <Line type="step" dataKey="AkumulasiRencana" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="YTD Rencana" dot={false} />
                <Area type="monotone" dataKey="AkumulasiRealisasi" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorAkumRealisasi)" name="YTD Realisasi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
