'use client';
import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Activity, ListFilter, Download, Filter, Table2, List } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPenerimaan() {
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [dataPenerimaan, setDataPenerimaan] = useState<any[]>([]);
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'REKAPITULASI' | 'DETAIL'>('DETAIL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, resJenis] = await Promise.all([
         fetch(`/api/penerimaan/data?tahun=${tahun}`),
         fetch(`/api/penerimaan/jenis`)
      ]);
      const jsonData = await resData.json();
      const jsonJenis = await resJenis.json();
      
      if (jsonData.success) setDataPenerimaan(jsonData.data || []);
      if (jsonJenis.success) setJenisPenerimaan(jsonJenis.data || []);
    } catch (e) {
      toast.error('Gagal mengambil data dashboard');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tahun]);

  // Data processing
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

  for (let i = 1; i <= 12; i++) {
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

  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-500">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 text-indigo-600 mb-2 relative"><Target size={20}/><span className="font-black text-xs tracking-widest uppercase">Pagu Rencana Aktif</span></div>
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
        <>
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
               <button onClick={downloadCSV} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                 <Download size={16}/> Excel {activeTab === 'REKAPITULASI' ? 'Rekap' : 'Detail'}
               </button>
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
                         <td className={`px-4 py-3 font-bold text-right ${row.selisih < 0 ? 'text-red-500' : 'text-gray-900'}`}>{formatRupiah(row.selisih)}</td>
                         <td className="px-4 py-3 font-bold text-right">{row.persentase}%</td>
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
                     {pivotData.length === 0 ? (
                       <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">Tidak ada data.</td></tr>
                     ) : pivotData.map((row) => (
                       <tr key={row.id} className="hover:bg-gray-50 whitespace-nowrap">
                         <td className="px-4 py-3 font-medium text-gray-900">{row.nama}</td>
                         <td className="px-4 py-3 font-bold text-right text-indigo-700 bg-indigo-50/30">{formatRupiah(row.rencana)}</td>
                         <td className="px-4 py-3 font-bold text-right text-emerald-700 bg-emerald-50/30">{formatRupiah(row.total)}</td>
                         <td className={`px-4 py-3 font-bold text-right ${row.selisih < 0 ? 'text-red-500' : 'text-gray-900'}`}>{formatRupiah(row.selisih)}</td>
                         <td className="px-4 py-3 font-bold text-right">{row.persentase}%</td>
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
