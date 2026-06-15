'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingUp, Activity, ListFilter, Download, Filter, Table2, List, Image as ImageIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as htmlToImage from 'html-to-image';

export default function DashboardPenerimaan() {
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [allDataPenerimaan, setAllDataPenerimaan] = useState<any[]>([]);
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
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
      toast.error('Gagal mengambil data dashboard');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Data processing
  const dataPenerimaan = allDataPenerimaan.filter(d => d.tahun.toString() === tahun.toString());
  const filteredData = selectedJenis === 'ALL' 
    ? dataPenerimaan 
    : dataPenerimaan.filter(d => d.jenis_penerimaan_id.toString() === selectedJenis);

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
    if (selectedJenis !== 'ALL' && d.jenis_penerimaan_id.toString() !== selectedJenis) return;
    
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
  const targetJenis = selectedJenis === 'ALL' ? activeJenisPenerimaan : activeJenisPenerimaan.filter(j => j.id.toString() === selectedJenis);

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

  const comparisonData = pivotData.filter(p => p.rencana > 0 || p.total > 0).map(p => ({
    name: p.nama,
    Rencana: p.rencana,
    Realisasi: p.total
  }));

  const gaugeValue = Math.min(Number(persentase), 100);
  const gaugeColor = Number(persentase) >= 100 ? '#10b981' : Number(persentase) >= 50 ? '#f59e0b' : '#ef4444';
  const gaugeData = [
    { name: 'Capaian', value: gaugeValue },
    { name: 'Sisa', value: 100 - gaugeValue }
  ];

  const renderBadge = (percent: string | number) => {
    const p = Number(percent);
    if (p >= 100) return <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold whitespace-nowrap">{p.toFixed(2)}%</span>;
    if (p >= 50) return <span className="inline-block px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[11px] font-bold whitespace-nowrap">{p.toFixed(2)}%</span>;
    return <span className="inline-block px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold whitespace-nowrap">{p.toFixed(2)}%</span>;
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
      // Filter pivotData: dont export zeros if both rencana and total are 0
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
    if (!dashboardRef.current) return;
    try {
      toast.loading('Sedang merender gambar PNG...', { id: 'png-export' });
      const dataUrl = await htmlToImage.toPng(dashboardRef.current, {
        quality: 1,
        backgroundColor: '#f9fafb',
        pixelRatio: 2 // High Resolution
      });
      const link = document.createElement('a');
      link.download = `Dashboard_Penerimaan_${tahun}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Gambar PNG berhasil diunduh!', { id: 'png-export' });
    } catch (err: any) {
      toast.error('Gagal mengekspor gambar: ' + err.message, { id: 'png-export' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500" ref={dashboardRef}>
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Monitoring Penerimaan</h1>
          <p className="text-gray-500 mt-1">Analisis dan pelacakan capaian penerimaan secara terpadu.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2 bg-gray-50 p-2 px-4 rounded-2xl border border-gray-200">
              <Filter size={18} className="text-indigo-600"/>
              <select value={selectedJenis} onChange={e => setSelectedJenis(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none max-w-[200px] truncate">
                 <option value="ALL">Semua Jenis Penerimaan</option>
                 {activeJenisPenerimaan.map(j => (
                    <option key={j.id} value={j.id}>{j.nama_penerimaan}</option>
                 ))}
              </select>
           </div>
           <div className="flex items-center gap-2 bg-gray-50 p-2 px-4 rounded-2xl border border-gray-200">
              <ListFilter size={18} className="text-indigo-600"/>
              <select value={tahun} onChange={e => setTahun(e.target.value)} className="bg-transparent font-bold text-gray-800 outline-none">
                 {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
        </div>
      </div>

      {/* Tren Historis di Bawah Filter */}
      {!loading && trendData.length > 1 && (
        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[200px]">
           <h3 className="font-black text-gray-900 mb-2 text-xs uppercase px-2 text-gray-500">Riwayat Tren Rencana vs Realisasi ({trendData[0].tahun} - {trendData[trendData.length-1].tahun})</h3>
           <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                 <XAxis dataKey="tahun" tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                 <YAxis tickFormatter={formatMilyar} tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                 <Tooltip formatter={(val: any) => formatRupiah(val)} contentStyle={{borderRadius: '0.5rem', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                 <Legend wrapperStyle={{fontSize: '10px'}} iconType="circle" />
                 <Bar dataKey="Rencana" name="Total Rencana" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={15} />
                 <Line type="monotone" dataKey="Realisasi" name="Total Realisasi" stroke="#10b981" strokeWidth={3} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 5}} />
              </ComposedChart>
           </ResponsiveContainer>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 text-indigo-600 mb-2 relative"><Target size={20}/><span className="font-black text-xs tracking-widest uppercase">Pagu Rencana (Target)</span></div>
            <div className="text-3xl font-black text-gray-900 relative truncate" title={formatRupiah(totalRencana)}>{formatRupiah(totalRencana)}</div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center mb-2 relative">
               <div className="flex items-center gap-3 text-emerald-600"><Activity size={20}/><span className="font-black text-xs tracking-widest uppercase">Total Realisasi</span></div>
               <span className="font-bold text-xs text-gray-500">{persentase}%</span>
            </div>
            <div className="text-3xl font-black text-gray-900 relative truncate" title={formatRupiah(totalRealisasi)}>{formatRupiah(totalRealisasi)}</div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4 relative overflow-hidden">
               <div className="h-2 rounded-full transition-all duration-1000" style={{width: `${gaugeValue}%`, backgroundColor: gaugeColor}}></div>
            </div>
         </div>
         <div className={`p-6 rounded-[2rem] shadow-sm border flex flex-col justify-center relative overflow-hidden ${isSurplus ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl ${isSurplus ? 'bg-emerald-200/50' : 'bg-rose-200/50'}`}></div>
            <div className={`flex items-center gap-3 mb-2 relative ${isSurplus ? 'text-emerald-700' : 'text-rose-700'}`}>
               <AlertCircle size={20}/>
               <span className="font-black text-xs tracking-widest uppercase">{isSurplus ? 'Surplus / Kelebihan Target' : 'Kekurangan Target'}</span>
            </div>
            <div className={`text-3xl font-black relative truncate ${isSurplus ? 'text-emerald-900' : 'text-rose-900'}`} title={formatRupiah(Math.abs(kekurangan))}>
               {formatRupiah(Math.abs(kekurangan))}
            </div>
         </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-gray-100"><p className="text-gray-500 font-bold">Memuat Grafik...</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Speedometer Chart */}
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center h-[300px] relative">
                <h3 className="font-black text-gray-900 mb-2 text-sm text-center uppercase w-full absolute top-6">Indikator Capaian</h3>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="75%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell key="cell-0" fill={gaugeColor} />
                        <Cell key="cell-1" fill="#f3f4f6" />
                      </Pie>
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-10 flex flex-col items-center">
                   <span className="text-4xl font-black" style={{color: gaugeColor}}>{persentase}%</span>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Keseluruhan</span>
                </div>
             </div>

             {/* Bar Chart Komparasi Jenis Penerimaan */}
             <div className="md:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[300px]">
                <h3 className="font-black text-gray-900 mb-2 text-sm uppercase">Perbandingan Rencana vs Realisasi per Jenis</h3>
                {comparisonData.length === 0 ? (
                   <div className="flex-1 flex items-center justify-center text-gray-400 font-bold text-sm">Belum ada realisasi</div>
                ) : (
                   <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={comparisonData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0"/>
                         <XAxis type="number" tickFormatter={formatMilyar} tick={{fontSize: 10, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                         <YAxis type="category" dataKey="name" tick={{fontSize: 10, fill: '#374151', width: 100}} axisLine={false} tickLine={false} width={120} />
                         <Tooltip formatter={(val: any) => formatRupiah(val)} contentStyle={{borderRadius: '0.5rem', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                         <Legend wrapperStyle={{fontSize: '11px', fontWeight: 'bold', paddingTop: '10px'}} iconType="circle" />
                         <Bar dataKey="Rencana" fill="#f87171" radius={[0, 4, 4, 0]} barSize={12} />
                         <Bar dataKey="Realisasi" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                      </ComposedChart>
                   </ResponsiveContainer>
                )}
             </div>
          </div>

          {/* Grafik Terpadu */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[500px]">
            <h3 className="font-black text-gray-900 mb-6 text-sm flex items-center gap-2 uppercase"><TrendingUp size={18} className="text-indigo-600"/> Grafik Terpadu Realisasi & Target</h3>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatMilyar} tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => formatRupiah(val)} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                <Legend wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} iconType="circle" />
                
                <Bar dataKey="RealisasiBulanan" name="Realisasi Bulanan" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={30} />
                <Line type="stepAfter" dataKey="RencanaAktif" name="Pagu/Rencana Aktif" stroke="#f59e0b" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="AkumulasiRealisasi" name="Akumulasi Realisasi" stroke="#10b981" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Tabel Tabs */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex justify-between items-center bg-gray-50/80 p-4 border-b border-gray-100">
               <div className="flex gap-2 bg-gray-200/50 p-1 rounded-2xl">
                  <button onClick={() => setActiveTab('REKAPITULASI')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${activeTab === 'REKAPITULASI' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                     <Table2 size={16}/> Rekapitulasi 12 Bulan
                  </button>
                  <button onClick={() => setActiveTab('DETAIL')} className={`px-4 py-2 text-sm font-bold flex items-center gap-2 rounded-xl transition-all ${activeTab === 'DETAIL' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                     <List size={16}/> Detail Transaksi
                  </button>
               </div>
               <div className="flex gap-2">
                 <button onClick={downloadPNG} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                   <ImageIcon size={16}/> Export PNG
                 </button>
                 <button onClick={downloadCSV} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                   <Download size={16}/> Excel {activeTab === 'REKAPITULASI' ? 'Rekap' : 'Detail'}
                 </button>
               </div>
            </div>
            
            {activeTab === 'REKAPITULASI' ? (
               <div className="overflow-x-auto p-4">
                 <table className="w-full text-left text-sm text-gray-700">
                   <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] whitespace-nowrap">
                     <tr>
                       <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Penerimaan</th>
                       <th className="px-4 py-3 text-right border-r border-gray-200 text-indigo-600">Pagu (Rencana)</th>
                       {monthNames.map(m => <th key={m} className="px-4 py-3 text-right">{m}</th>)}
                       <th className="px-4 py-3 text-right border-l border-gray-200 text-emerald-600">Total Realisasi</th>
                       <th className="px-4 py-3 text-right">Selisih</th>
                       <th className="px-4 py-3 text-right">%</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {pivotData.filter(p => p.rencana > 0 || p.total > 0).length === 0 ? (
                       <tr><td colSpan={16} className="p-8 text-center text-gray-500 italic">Tidak ada data.</td></tr>
                     ) : pivotData.filter(p => p.rencana > 0 || p.total > 0).map((row) => (
                       <tr key={row.id} className="hover:bg-gray-50 whitespace-nowrap">
                         <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate max-w-[200px]" title={row.nama}>{row.nama}</td>
                         <td className="px-4 py-3 font-bold text-right text-indigo-700 border-r border-gray-100 bg-indigo-50/30">{formatRupiah(row.rencana)}</td>
                         {row.bulanan.map((val, idx) => (
                           <td key={idx} className="px-4 py-3 text-right">{val > 0 ? formatRupiah(val) : '-'}</td>
                         ))}
                         <td className="px-4 py-3 font-bold text-right text-emerald-700 border-l border-gray-100 bg-emerald-50/30">{formatRupiah(row.total)}</td>
                         <td className={`px-4 py-3 font-bold text-right ${row.selisih < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatRupiah(row.selisih)}</td>
                         <td className="px-4 py-3 text-right">{renderBadge(row.persentase)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            ) : (
               <div className="overflow-x-auto p-4">
                 <table className="w-full text-left text-sm text-gray-700">
                   <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] whitespace-nowrap">
                     <tr>
                       <th className="px-4 py-3">Nama Penerimaan</th>
                       <th className="px-4 py-3 text-right">Total Rencana</th>
                       <th className="px-4 py-3 text-right">Total Realisasi</th>
                       <th className="px-4 py-3 text-right">Selisih</th>
                       <th className="px-4 py-3 text-right">% Capaian</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {pivotData.filter(p => p.rencana > 0 || p.total > 0).length === 0 ? (
                       <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Tidak ada data.</td></tr>
                     ) : pivotData.filter(p => p.rencana > 0 || p.total > 0).sort((a,b) => Number(a.persentase) - Number(b.persentase)).map((row) => (
                       <tr key={row.id} className="hover:bg-gray-50 whitespace-nowrap">
                         <td className="px-4 py-3 font-medium text-gray-900">{row.nama}</td>
                         <td className="px-4 py-3 font-bold text-right text-indigo-700 bg-indigo-50/30">{formatRupiah(row.rencana)}</td>
                         <td className="px-4 py-3 font-bold text-right text-emerald-700 bg-emerald-50/30">{formatRupiah(row.total)}</td>
                         <td className={`px-4 py-3 font-bold text-right ${row.selisih < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatRupiah(row.selisih)}</td>
                         <td className="px-4 py-3 text-right">{renderBadge(row.persentase)}</td>
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
