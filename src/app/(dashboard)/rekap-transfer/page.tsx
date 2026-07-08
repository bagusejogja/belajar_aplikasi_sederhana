'use client';

import React, { useState, useEffect } from 'react';
import { Database, Loader2, Search, FileText, Eye, Check, Copy, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export default function RekapTransferPage() {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Date Filters
  const [startDate, setStartDate] = useState(() => {
     const d = new Date();
     d.setDate(1);
     return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  
  // Image Preview & Copy State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedName, setCopiedName] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengajuan_transfer')
        .select(`
          *,
          master_rekening(nama_rekening, no_rekening, ref_bank(nama_bank)),
          ref_jenis_belanja(nama_belanja)
        `)
        .gte('tanggal_transfer', startDate)
        .lte('tanggal_transfer', endDate)
        .order('tanggal_transfer', { ascending: false });
        
      if (error) throw error;
      setListData(data || []);
    } catch (err: any) {
      console.error("Gagal menarik data", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const openDetail = (item: any) => {
    setSelectedData(item);
    setIsModalOpen(true);
  };

  const filteredData = listData.filter(item => 
     item.kegiatan?.toLowerCase().includes(search.toLowerCase()) || 
     item.master_rekening?.nama_rekening?.toLowerCase().includes(search.toLowerCase()) ||
     item.status?.toLowerCase().includes(search.toLowerCase())
  );

  const formatRp = (angka: number) => {
     return new Intl.NumberFormat('id-ID').format(angka);
  };

  const handleCopy = (text: string, type: 'rek' | 'name') => {
     navigator.clipboard.writeText(text);
     if (type === 'rek') {
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
     } else {
         setCopiedName(true);
         setTimeout(() => setCopiedName(false), 2000);
     }
  };

  const renderFotoKecil = (teks: string | null, label: string) => {
     if (!teks) return null;
     const links = teks.split(',').map(s => s.trim()).filter(Boolean);
     return (
        <div className="mb-4">
           <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
           <div className="flex flex-wrap gap-2">
              {links.map((lnk, idx) => {
                 let imgSrc = lnk;
                 const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
                 if (gdriveMatch && gdriveMatch[1]) {
                    imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w200`;
                 }
                 const isImage = lnk.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) != null || gdriveMatch;
                 
                 return isImage ? (
                    <div key={idx} className="border border-gray-200 shadow-sm bg-white p-1 rounded-xl cursor-pointer hover:border-indigo-500 hover:ring-4 ring-indigo-50 transition-all" onClick={() => setPreviewImage(lnk)}>
                       <img src={imgSrc} alt="Lampiran" className="h-40 w-auto object-contain rounded-lg" />
                    </div>
                 ) : (
                    <button key={idx} onClick={() => window.open(lnk, '_blank')} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-2 transition-colors">
                       <Eye size={16}/> Lihat {label} {idx + 1}
                    </button>
                 );
              })}
           </div>
        </div>
     );
  };

  const downloadExcel = () => {
     if (filteredData.length === 0) return alert("Tidak ada data untuk diunduh");

     const exportData = filteredData.map((d, index) => ({
        'No': index + 1,
        'Tgl Pengajuan': d.tanggal_pengajuan,
        'Tgl Transfer': d.tanggal_transfer || '-',
        'Kategori Belanja': d.ref_jenis_belanja?.nama_belanja || '-',
        'Rekening Tujuan': d.master_rekening?.nama_rekening || '-',
        'Nomor Rekening': d.master_rekening?.no_rekening || '-',
        'Bank': d.master_rekening?.ref_bank?.nama_bank || '-',
        'Nominal': d.nominal,
        'Uraian': d.kegiatan || '-',
        'Status': d.status
     }));

     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Rekap Transfer");
     XLSX.writeFile(wb, `Rekap_Transfer_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-100 p-2 rounded-xl">
                 <Database className="text-indigo-600" size={24} />
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Rekap & Riwayat Transfer</h1>
           </div>
           <p className="text-gray-500 font-medium">Laporan seluruh transaksi pengajuan transfer.</p>
        </div>
        <button onClick={downloadExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200">
           Unduh Excel
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
           
           <div className="flex gap-4 w-full md:w-auto items-center bg-gray-100 p-2 rounded-2xl">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border-none rounded-xl p-2 text-sm font-bold text-gray-700 outline-none" />
              <span className="text-gray-400 font-bold">s/d</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border-none rounded-xl p-2 text-sm font-bold text-gray-700 outline-none" />
           </div>

           <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                 type="text" 
                 placeholder="Cari uraian/nama/status..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all text-sm font-medium"
              />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                <p className="font-medium">Memuat data rekap...</p>
             </div>
          ) : filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 text-gray-400">
                <Database size={48} className="mb-4 opacity-50" />
                <p className="font-medium">Tidak ada data transaksi</p>
             </div>
          ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                   <tr>
                      <th className="py-4 px-6">Tgl Transfer</th>
                      <th className="py-4 px-6">Tujuan Transfer</th>
                      <th className="py-4 px-6">Uraian</th>
                      <th className="py-4 px-6 text-right">Nominal</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                         <td className="py-4 px-6 font-bold text-gray-900">{item.tanggal_transfer || '-'}</td>
                         <td className="py-4 px-6">
                            <p className="font-bold text-gray-800">{item.master_rekening?.nama_rekening}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.master_rekening?.ref_bank?.nama_bank} - {item.master_rekening?.no_rekening}</p>
                         </td>
                         <td className="py-4 px-6 max-w-[200px]">
                            <p className="font-bold text-gray-700 truncate">{item.kegiatan}</p>
                         </td>
                         <td className="py-4 px-6 text-right font-black text-gray-900">
                            Rp {formatRp(item.nominal)}
                         </td>
                         <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                               item.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                               item.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                               'bg-amber-100 text-amber-700'
                            }`}>
                               {item.status}
                            </span>
                         </td>
                         <td className="py-4 px-6 text-center">
                            <button onClick={() => openDetail(item)} className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-bold rounded-xl transition-colors text-xs flex items-center gap-2 mx-auto">
                               <Eye size={14} /> Detail
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
        </div>
      </div>

      {isModalOpen && selectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="text-indigo-600"/> Detail Pengajuan</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><XCircle size={24}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tanggal Pengajuan & Transfer</p>
                       <p className="font-bold text-gray-800 flex items-center gap-2"><span className="text-gray-400">Pengajuan:</span> {selectedData.tanggal_pengajuan}</p>
                       <p className="font-bold text-indigo-700 flex items-center gap-2 mb-2"><span className="text-gray-400">Transfer:</span> {selectedData.tanggal_transfer || '-'}</p>
                       <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                               selectedData.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                               selectedData.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                               'bg-amber-100 text-amber-700'
                            }`}>
                               {selectedData.status}
                       </span>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-center items-end text-right">
                       <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Nominal Transfer</p>
                       <p className="font-black text-2xl text-indigo-600">Rp {formatRp(selectedData.nominal)}</p>
                    </div>
                 </div>

                 <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 space-y-3">
                    <h3 className="text-xs font-black text-indigo-800 uppercase flex items-center gap-2"><Database size={14}/> Rekening Tujuan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Nama Rekening</p>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-gray-900 text-sm">{selectedData.master_rekening?.nama_rekening}</p>
                             <button onClick={() => handleCopy(selectedData.master_rekening?.nama_rekening || '', 'name')} className="p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-colors" title="Copy Nama">
                                {copiedName ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                             </button>
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Bank</p>
                          <p className="font-bold text-gray-900 text-sm">{selectedData.master_rekening?.ref_bank?.nama_bank}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Nomor Rekening</p>
                          <div className="flex items-center gap-2">
                             <p className="font-mono font-bold text-gray-900 text-sm">{selectedData.master_rekening?.no_rekening}</p>
                             <button onClick={() => handleCopy(selectedData.master_rekening?.no_rekening || '', 'rek')} className="p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-colors" title="Copy Rekening">
                                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Uraian / Rincian Kegiatan</p>
                       <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{selectedData.kegiatan}</p>
                    </div>
                    {selectedData.catatan && (
                       <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Catatan Tambahan</p>
                          <p className="font-medium text-gray-800 bg-amber-50 p-3 rounded-xl border border-amber-100 italic">{selectedData.catatan}</p>
                       </div>
                    )}
                 </div>

                 <div className="border-t border-gray-100 pt-4">
                    {renderFotoKecil(selectedData.nota_url, "Lampiran Nota")}
                    {renderFotoKecil(selectedData.foto_kegiatan, "Foto Kegiatan")}
                    {renderFotoKecil(selectedData.foto_barang, "Foto Barang")}
                    {renderFotoKecil(selectedData.foto_bukti_transfer, "Bukti Transfer")}
                 </div>

              </div>
           </div>
        </div>
      )}

      {/* Modal Gambar Layar Penuh */}
      {previewImage && (
         <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-red-500 p-3 rounded-full transition-colors font-bold group">X</button>
            <p className="absolute top-6 left-6 text-white font-bold bg-black/50 px-4 py-2 rounded-xl">Klik di mana saja untuk menutup</p>
            <div className="relative max-w-full max-h-[85vh] flex justify-center w-full">
               <img src={previewImage} alt="Preview Bukti" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-4 ring-white/10" onClick={(e) => e.stopPropagation()} onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                  (e.target as HTMLImageElement).className = 'max-w-[200px] opacity-30 mx-auto';
               }} />
            </div>
            <a href={previewImage} target="_blank" rel="noreferrer" className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
               🔗 Buka di Tab Baru
            </a>
         </div>
      )}
    </div>
  );
}
