'use client';
import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Activity, ListFilter, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPenerimaan() {
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [dataPenerimaan, setDataPenerimaan] = useState<any[]>([]);
  const [jenisPenerimaan, setJenisPenerimaan] = useState<any[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

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

  // Filter by Jenis Penerimaan if selected
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

  const formatRupiah = (val: any) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  const formatMilyar = (val: any) => `${(val / 1000000000).toFixed(2)} M`;

  // Function to download CSV
  const downloadCSV = () => {
    const headers = ['ID', 'TIPE DATA', 'TAHUN', 'BULAN', 'NOMINAL', 'NAMA UNIT', 'KODE UNIT', 'TANGGAL BAYAR', 'TRX ID', 'PAYMENT CODE'];
    const rows = filteredData.map(d => [
      d.jenis_penerimaan_id,
      d.tipe_data,
      d.tahun,
      d.bulan,
      d.nominal,
      `"${d.nama_unit || ''}"`,
      `"${d.kode_unit || ''}"`,
      `"${d.tanggal_pembayaran || ''}"`,
      `"${d.trx_id || ''}"`,
      `"${d.payment_code || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_penerimaan_${tahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                 {jenisPenerimaan.filter(j => j.status === 'active').map(j => (
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
                
                {/* Realisasi Bulanan - Batang */}
                <Bar dataKey="RealisasiBulanan" name="Realisasi Bulanan" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={30} />
                
                {/* Rencana Aktif - Garis Lurus (Step) */}
                <Line type="stepAfter" dataKey="RencanaAktif" name="Pagu/Rencana Aktif" stroke="#f59e0b" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                
                {/* Akumulasi Realisasi - Garis Naik (Monotone) */}
                <Line type="monotone" dataKey="AkumulasiRealisasi" name="Akumulasi Realisasi" stroke="#10b981" strokeWidth={4} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Tabel Detail */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 uppercase"><ListFilter size={18} className="text-gray-500"/> Tabel Detail Transaksi</h3>
              <button onClick={downloadCSV} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <Download size={16}/> Download Excel
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3">Bulan</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3">Nama Unit</th>
                    <th className="px-4 py-3">Kode Unit</th>
                    <th className="px-4 py-3">Tgl Bayar</th>
                    <th className="px-4 py-3">Trx ID</th>
                    <th className="px-4 py-3">Payment Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500 italic">Tidak ada transaksi di tahun ini.</td></tr>
                  ) : filteredData.sort((a,b) => a.bulan - b.bulan).map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 whitespace-nowrap">
                      <td className="px-4 py-3 font-mono text-center bg-gray-50/50">{row.bulan}</td>
                      <td className="px-4 py-3 font-bold">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase ${row.tipe_data === 'RENCANA' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.tipe_data}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-right text-gray-900">{formatRupiah(row.nominal)}</td>
                      <td className="px-4 py-3">{row.nama_unit || '-'}</td>
                      <td className="px-4 py-3">{row.kode_unit || '-'}</td>
                      <td className="px-4 py-3">{row.tanggal_pembayaran || '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.trx_id || '-'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{row.payment_code || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
