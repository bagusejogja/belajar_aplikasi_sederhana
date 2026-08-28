'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Target, TrendingUp, Activity, ListFilter, 
  Download, Filter, Table2, List, Image as ImageIcon, 
  AlertCircle, ChevronDown, ChevronUp, Award,
  Layers, DollarSign, ArrowUpRight, ArrowDownRight,
  RefreshCw, CheckCircle2, Sparkles, PieChart as PieIcon
} from 'lucide-react';
import Select from 'react-select';
import Link from 'next/link';
import toast from 'react-hot-toast';
import * as htmlToImage from 'html-to-image';

export default function DashboardPenerimaan() {
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [allDataPenerimaan, setAllDataPenerimaan] = useState<any[]>([]);
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  const [selectedJenisOptions, setSelectedJenisOptions] = useState<any[]>([]);
  const [showTrend, setShowTrend] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'REKAPITULASI' | 'DETAIL'>('DETAIL');
  const dashboardRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, resJenis] = await Promise.all([
         fetch(`/api/penerimaan/data`),
         fetch(`/api/penerimaan/jenis`)
      ]);
      const jsonData = await resData.json();
      const jsonJenis = await resJenis.json();
      
      if (jsonData.success) setAllDataPenerimaan(jsonData.data || []);
      if (jsonJenis.success) setJenisPenerimaan(jsonJenis.data || []);
    } catch (e) {
      toast.error('Gagal mengambil data dashboard penerimaan');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Data processing
  const isAllSelected = selectedJenisOptions.length === 0;
  const selectedJenisIds = selectedJenisOptions.map(opt => opt.value);

  const dataPenerimaan = allDataPenerimaan.filter(d => d.tahun.toString() === tahun.toString());
  const filteredData = isAllSelected 
    ? dataPenerimaan 
    : dataPenerimaan.filter(d => selectedJenisIds.includes(d.jenis_penerimaan_id.toString()));

  const dataRencana = filteredData.filter(d => d.tipe_data === 'RENCANA');
  const dataRealisasi = filteredData.filter(d => d.tipe_data === 'REALISASI');

  const totalRencana = dataRencana.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const totalRealisasi = dataRealisasi.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const persentase = totalRencana > 0 ? ((totalRealisasi / totalRencana) * 100).toFixed(2) : 0;

  const monthlyData: any[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  let accumRencana = 0;
  let accumRealisasi = 0;

  const maxMonthData = filteredData.reduce((max, curr) => Math.max(max, curr.bulan), 1);
  const maxMonth = Math.max(1, Math.min(12, maxMonthData));

  for (let i = 1; i <= maxMonth; i++) {
    const sumRencanaBulanIni = dataRencana.filter(d => d.bulan === i).reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
    const sumRealisasiBulanIni = dataRealisasi.filter(d => d.bulan === i).reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

    accumRencana += sumRencanaBulanIni;
    accumRealisasi += sumRealisasiBulanIni;

    monthlyData.push({
      bulanId: i,
      name: monthNames[i - 1],
      RealisasiBulanan: sumRealisasiBulanIni,
      RencanaAktif: accumRencana,
      AkumulasiRealisasi: accumRealisasi
    });
  }

  // Trend Data for History Chart
  const trendDataMap = new Map();
  allDataPenerimaan.forEach(d => {
    if (!isAllSelected && !selectedJenisIds.includes(d.jenis_penerimaan_id.toString())) return;
    
    if (!trendDataMap.has(d.tahun)) {
      trendDataMap.set(d.tahun, { tahun: d.tahun.toString(), Rencana: 0, Realisasi: 0 });
    }
    const item = trendDataMap.get(d.tahun);
    if (d.tipe_data === 'RENCANA') item.Rencana += Number(d.nominal) || 0;
    if (d.tipe_data === 'REALISASI') item.Realisasi += Number(d.nominal) || 0;
  });
  const trendData = Array.from(trendDataMap.values()).sort((a: any, b: any) => Number(a.tahun) - Number(b.tahun));

  // Pivot Table Logic
  const activeJenisPenerimaan = jenisPenerimaan.filter(j => j.status === 'active');
  const targetJenis = isAllSelected ? activeJenisPenerimaan : activeJenisPenerimaan.filter(j => selectedJenisIds.includes(j.id.toString()));

  const pivotData = targetJenis.map(jenis => {
    const dRencana = dataPenerimaan.filter(d => d.jenis_penerimaan_id === jenis.id && d.tipe_data === 'RENCANA');
    const totalRencanaJenis = dRencana.reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
    
    const dRealisasi = dataPenerimaan.filter(d => d.jenis_penerimaan_id === jenis.id && d.tipe_data === 'REALISASI');
    const bulanRealisasi = Array(12).fill(0);
    let totalRealisasiJenis = 0;
    
    for (let i=1; i<=12; i++) {
      const val = dRealisasi.filter(d => d.bulan === i).reduce((sum, d) => sum + (Number(d.nominal) || 0), 0);
      bulanRealisasi[i-1] = val;
      totalRealisasiJenis += val;
    }
    
    return {
      id: jenis.id,
      nama: jenis.nama_penerimaan,
      rencana: totalRencanaJenis,
      bulanan: bulanRealisasi,
      total: totalRealisasiJenis,
      selisih: totalRealisasiJenis - totalRencanaJenis,
      persentase: totalRencanaJenis > 0 ? ((totalRealisasiJenis / totalRencanaJenis) * 100).toFixed(2) : 0
    };
  });

  const formatRupiah = (val: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  const formatMilyar = (val: any) => `${(val / 1000000000).toFixed(2)} M`;

  const kekurangan = totalRencana - totalRealisasi;
  const isSurplus = kekurangan < 0;

  const topAchievers = [...pivotData]
    .filter(p => p.rencana > 0)
    .sort((a, b) => Number(b.persentase) - Number(a.persentase))
    .slice(0, 3);

  const gaugeValue = Math.min(Number(persentase), 100);
  const gaugeColor = Number(persentase) >= 100 ? '#10b981' : Number(persentase) >= 50 ? '#f59e0b' : '#ef4444';
  const gaugeData = [
    { name: 'Capaian', value: gaugeValue },
    { name: 'Sisa', value: 100 - gaugeValue }
  ];

  const renderBadge = (percent: string | number) => {
    const p = Number(percent);
    if (p >= 100) return <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold font-mono whitespace-nowrap">{p.toFixed(2)}%</span>;
    if (p >= 50) return <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold font-mono whitespace-nowrap">{p.toFixed(2)}%</span>;
    return <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold font-mono whitespace-nowrap">{p.toFixed(2)}%</span>;
  };

  const getProgressColor = (percent: string | number) => {
    const p = Number(percent);
    if (p >= 100) return 'bg-emerald-500';
    if (p >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Function to download CSV
  const downloadCSV = () => {
    if (activeTab === 'DETAIL') {
      const headers = ['Nama Penerimaan', 'Total Rencana', 'Total Realisasi', 'Selisih', '% Capaian'];
      const rows = pivotData.map(d => [
        `"${d.nama || ''}"`,
        d.rencana,
        d.total,
        d.selisih,
        d.persentase
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `data_penerimaan_${tahun}_ringkasan.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Nama Penerimaan', 'Pagu (Rencana)', ...monthNames, 'Total Realisasi', 'Selisih', '% Capaian'];
      const activePivot = pivotData.filter(p => p.rencana > 0 || p.total > 0);
      const rows = activePivot.map(p => [
        `"${p.nama}"`,
        p.rencana,
        ...p.bulanan,
        p.total,
        p.selisih,
        p.persentase
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `data_penerimaan_${tahun}_rekapitulasi.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadPNG = async () => {
    if (typeof window === 'undefined') return;
    const dashboardElement = dashboardRef.current;
    if (!dashboardElement) return;

    const toastId = toast.loading('Mempersiapkan gambar untuk diunduh...');
    
    try {
      const dataUrl = await htmlToImage.toPng(dashboardElement, {
        quality: 1,
        backgroundColor: '#f9fafb',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `Dashboard_Penerimaan_${tahun}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Gambar PNG berhasil diunduh!', { id: toastId });
    } catch (err: any) {
      toast.error('Gagal mengekspor gambar: ' + err.message, { id: toastId });
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900" ref={dashboardRef}>
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Target size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Dashboard Penerimaan</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Tahun {tahun}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Monitoring target rencana vs realisasi penerimaan institusi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <Link 
            href="/penerimaan/komparasi" 
            className="h-9 px-3.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <TrendingUp size={14} />
            <span className="hidden sm:inline">Komparasi Tahunan</span>
          </Link>

          <div className="w-full sm:w-64">
            <Select 
              isMulti
              options={activeJenisPenerimaan.map(j => ({ value: j.id.toString(), label: j.nama_penerimaan }))}
              value={selectedJenisOptions}
              onChange={(selected) => setSelectedJenisOptions(selected as any[])}
              placeholder="Semua Jenis Penerimaan"
              className="text-xs font-semibold"
              classNamePrefix="select"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '36px',
                  height: '36px',
                  borderRadius: '0.75rem',
                  borderColor: '#e5e7eb',
                  fontSize: '11px',
                  fontWeight: '600',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#cbd5e1' }
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: '#e0e7ff',
                  borderRadius: '0.375rem',
                  padding: '0 2px'
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: '#4338ca',
                  fontSize: '10px',
                  fontWeight: '700'
                }),
                valueContainer: (base) => ({
                  ...base,
                  height: '36px',
                  padding: '0 6px'
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: '36px'
                })
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 h-9 shrink-0">
            <ListFilter size={14} className="text-gray-400" />
            <select 
              value={tahun} 
              onChange={e => setTahun(e.target.value)} 
              className="bg-transparent font-bold text-xs text-gray-800 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
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

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
         {/* Target Pagu Rencana */}
         <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Pagu Rencana</p>
              <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate" title={formatRupiah(totalRencana)}>
                {formatRupiah(totalRencana)}
              </h3>
              <span className="text-[10px] font-semibold text-indigo-600">Alokasi Penerimaan Tahun {tahun}</span>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Target size={20} />
            </div>
         </div>

         {/* Total Realisasi */}
         <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Realisasi</p>
                <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                  {persentase}%
                </span>
              </div>
              <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate" title={formatRupiah(totalRealisasi)}>
                {formatRupiah(totalRealisasi)}
              </h3>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                 <div className="h-1.5 rounded-full transition-all duration-1000" style={{ width: `${gaugeValue}%`, backgroundColor: gaugeColor }}></div>
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <Activity size={20} />
            </div>
         </div>

         {/* Surplus / Defisit */}
         <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${isSurplus ? 'bg-white border-emerald-200' : 'bg-white border-rose-200'}`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isSurplus ? 'Surplus Capaian Target' : 'Kekurangan Target'}
              </p>
              <h3 className={`text-base font-black mt-0.5 font-mono truncate ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`} title={formatRupiah(Math.abs(kekurangan))}>
                {formatRupiah(Math.abs(kekurangan))}
              </h3>
              <span className={`text-[10px] font-semibold ${isSurplus ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isSurplus ? 'Melampaui target rencana' : 'Belum mencapai target'}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl ${isSurplus ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isSurplus ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
         </div>
      </div>

      {/* TREN HISTORIS COLLAPSIBLE */}
      {!loading && trendData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all duration-300">
           <button 
             onClick={() => setShowTrend(!showTrend)} 
             className="w-full flex items-center justify-between p-3.5 px-5 bg-gray-50/60 hover:bg-gray-100/80 transition-colors"
           >
             <div className="flex items-center gap-2">
               <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                 <Activity size={14} />
               </div>
               <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">Riwayat Tren Rencana vs Realisasi Antar-Tahun</h3>
             </div>
             <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold">
               <span>{showTrend ? 'Tutup Grafik' : 'Buka Grafik'}</span>
               {showTrend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </div>
           </button>
           
           <div className={`transition-all duration-300 ease-in-out ${showTrend ? 'max-h-[320px] opacity-100 p-4 border-t border-gray-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
             <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                     <XAxis dataKey="tahun" tick={{fontSize: 11, fill: '#4b5563', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                     <YAxis tickFormatter={formatMilyar} tick={{fontSize: 11, fill: '#374151', fontWeight: 'bold'}} width={80} axisLine={false} tickLine={false} />
                     <Tooltip formatter={(val: any) => formatRupiah(val)} contentStyle={{borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'}} cursor={{fill: '#f8fafc'}} />
                     <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '6px'}} iconType="circle" />
                     <Bar dataKey="Rencana" name="Total Rencana" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={22} />
                     <Line type="monotone" dataKey="Realisasi" name="Total Realisasi" stroke="#10b981" strokeWidth={2.5} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </ComposedChart>
               </ResponsiveContainer>
             </div>
           </div>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200/80 gap-2">
          <RefreshCw size={24} className="animate-spin text-indigo-600" />
          <p className="text-gray-500 text-xs font-semibold">Memuat Data Visual...</p>
        </div>
      ) : (
        <>
          {/* CHARTS ROW: GAUGE + TOP ACHIEVERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             {/* Gauge Indikator Capaian */}
             <div className="md:col-span-1 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col items-center justify-center h-[260px] relative">
                <div className="w-full flex items-center gap-2 mb-1">
                  <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                    <PieIcon size={14} />
                  </div>
                  <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">Indikator Capaian</h3>
                </div>
                <div className="w-full h-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                          data={gaugeData}
                          cx="50%"
                          cy="75%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell key="cell-0" fill={gaugeColor} />
                          <Cell key="cell-1" fill="#f1f5f9" />
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-4 flex flex-col items-center">
                     <span className="text-3xl font-black font-mono tracking-tight" style={{ color: gaugeColor }}>{persentase}%</span>
                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Capaian Pagu</span>
                  </div>
                </div>
             </div>

             {/* Top Achievers Leaderboard */}
             <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col h-[260px]">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="p-1 bg-amber-50 text-amber-600 rounded-md">
                     <Award size={14} />
                   </div>
                   <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">3 Penerimaan Tertinggi</h3>
                 </div>
                 
                 {topAchievers.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 font-bold text-xs">Belum ada data capaian penerimaan.</div>
                 ) : (
                    <div className="flex flex-col gap-3 flex-1 justify-center">
                       {topAchievers.map((achiever, idx) => {
                          const isFirst = idx === 0;
                          const medalColor = idx === 0 ? 'text-amber-600 bg-amber-50 border border-amber-200' : idx === 1 ? 'text-gray-600 bg-gray-50 border border-gray-200' : 'text-amber-700 bg-amber-50/50 border border-amber-100';
                          return (
                            <div key={achiever.id} className="flex items-center gap-3">
                               <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${medalColor} shrink-0`}>
                                 {idx + 1}
                                </div>
                               <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-end mb-1">
                                     <div className={`font-bold truncate ${isFirst ? 'text-gray-900 text-xs' : 'text-gray-700 text-xs'}`}>{achiever.nama}</div>
                                     <div className={`font-mono font-black ${isFirst ? 'text-emerald-600 text-xs' : 'text-emerald-500 text-xs'}`}>{achiever.persentase}%</div>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                     <div 
                                       className={`h-full ${getProgressColor(achiever.persentase)} transition-all duration-1000 ease-out`} 
                                       style={{ width: `${Math.min(Number(achiever.persentase), 100)}%` }}
                                     ></div>
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 )}
             </div>
          </div>

          {/* INTEGRATED MONTHLY COMPOSED CHART */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                <TrendingUp size={14} />
              </div>
              <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">Grafik Bulanan: Realisasi vs Target Akumulatif</h3>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tickFormatter={formatMilyar} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} width={80}/>
                  <Tooltip formatter={(val: any) => formatRupiah(val)} contentStyle={{borderRadius: '0.75rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '11px'}} cursor={{fill: '#f8fafc'}} />
                  <Legend wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} iconType="circle" />
                  
                  <Bar yAxisId="left" dataKey="RealisasiBulanan" name="Realisasi Bulanan" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={24} />
                  <Line yAxisId="left" type="stepAfter" dataKey="RencanaAktif" name="Pagu/Rencana Aktif" stroke="#f59e0b" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                  <Line yAxisId="left" type="monotone" dataKey="AkumulasiRealisasi" name="Akumulasi Realisasi" stroke="#10b981" strokeWidth={3} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 5}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TABBED TABLE CARD */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex flex-col overflow-hidden">
            {/* Table Control Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 px-4 bg-gray-50/60 border-b border-gray-200 gap-2">
               <div className="flex gap-1.5 bg-gray-200/60 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('REKAPITULASI')} 
                    className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-lg transition-all ${
                      activeTab === 'REKAPITULASI' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                     <Table2 size={13}/> Rekap 12 Bulan
                  </button>
                  <button 
                    onClick={() => setActiveTab('DETAIL')} 
                    className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 rounded-lg transition-all ${
                      activeTab === 'DETAIL' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                     <List size={13}/> Detail Transaksi
                  </button>
               </div>
               
               <div className="flex items-center gap-2">
                 <button 
                   onClick={downloadPNG} 
                   className="h-8 px-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                 >
                   <ImageIcon size={13}/> Export PNG
                 </button>
                 <button 
                   onClick={downloadCSV} 
                   className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                 >
                   <Download size={13}/> Excel {activeTab === 'REKAPITULASI' ? 'Rekap' : 'Detail'}
                 </button>
               </div>
            </div>
            
            {/* Table Content */}
            {activeTab === 'REKAPITULASI' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                        <th className="py-3 px-4 sticky left-0 bg-gray-50/90 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">Nama Penerimaan</th>
                        <th className="py-3 px-4 text-right border-r border-gray-200 text-indigo-700 bg-indigo-50/30">Pagu (Rencana)</th>
                        {monthNames.map(m => <th key={m} className="py-3 px-3 text-right">{m}</th>)}
                        <th className="py-3 px-4 text-right border-l border-gray-200 text-emerald-700 bg-emerald-50/30">Total Realisasi</th>
                        <th className="py-3 px-4 text-right">Selisih</th>
                        <th className="py-3 px-4 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pivotData.filter(p => p.rencana > 0 || p.total > 0).length === 0 ? (
                        <tr><td colSpan={16} className="py-8 text-center text-gray-400 text-xs italic">Tidak ada data penerimaan pada filter ini.</td></tr>
                      ) : pivotData.filter(p => p.rencana > 0 || p.total > 0).map((row) => (
                        <tr key={row.id} className="even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 whitespace-nowrap transition-colors">
                          <td className="py-2.5 px-4 font-bold text-gray-800 sticky left-0 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate max-w-[220px] text-xs" title={row.nama}>{row.nama}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-right text-indigo-700 border-r border-gray-100 bg-indigo-50/10 text-xs">{formatRupiah(row.rencana)}</td>
                          {row.bulanan.map((val, idx) => (
                            <td key={idx} className="py-2.5 px-3 font-mono text-right text-xs text-gray-600">{val > 0 ? formatRupiah(val) : '-'}</td>
                          ))}
                          <td className="py-2.5 px-4 font-mono font-bold text-right text-emerald-700 border-l border-gray-100 bg-emerald-50/10 text-xs">{formatRupiah(row.total)}</td>
                          <td className={`py-2.5 px-4 font-mono font-bold text-right text-xs ${row.selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatRupiah(row.selisih)}</td>
                          <td className="py-2.5 px-4 text-right">{renderBadge(row.persentase)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                        <th className="py-3 px-4">Nama Penerimaan</th>
                        <th className="py-3 px-4 text-right w-44">Total Rencana</th>
                        <th className="py-3 px-4 text-right w-44">Total Realisasi</th>
                        <th className="py-3 px-4 text-right w-40">Selisih</th>
                        <th className="py-3 px-4 text-right w-24">% Capaian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pivotData.filter(p => p.rencana > 0 || p.total > 0).length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-xs italic">Tidak ada data penerimaan pada filter ini.</td></tr>
                      ) : pivotData.filter(p => p.rencana > 0 || p.total > 0).sort((a,b) => Number(a.persentase) - Number(b.persentase)).map((row) => (
                        <tr key={row.id} className="even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 whitespace-nowrap transition-colors">
                          <td className="py-3 px-4">
                             <div className="font-bold text-gray-900 text-xs">{row.nama}</div>
                             <div className="w-full max-w-[260px] h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden flex" title={`${row.persentase}% tercapai`}>
                                <div className={`h-full ${getProgressColor(row.persentase)} transition-all duration-1000`} style={{ width: `${Math.min(Number(row.persentase), 100)}%` }}></div>
                             </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-right text-indigo-700 bg-indigo-50/10 text-xs">{formatRupiah(row.rencana)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-right text-emerald-700 bg-emerald-50/10 text-xs">{formatRupiah(row.total)}</td>
                          <td className={`py-3 px-4 font-mono font-bold text-right text-xs ${row.selisih < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatRupiah(row.selisih)}</td>
                          <td className="py-3 px-4 text-right">{renderBadge(row.persentase)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
