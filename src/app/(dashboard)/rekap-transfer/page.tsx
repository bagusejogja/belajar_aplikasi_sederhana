'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, Loader2, Search, FileText, Eye, Check, Copy, XCircle, 
  FileSpreadsheet, Wallet, CheckCircle2, Clock, User, RefreshCw 
} from 'lucide-react';
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

  // Users Map
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const extractTransferTime = (item: any) => {
    if (!item) return null;
    if (item.foto_bukti_transfer) {
      const match = item.foto_bukti_transfer.match(/transfer_(\d{13})/);
      if (match && match[1]) {
        const ts = Number(match[1]);
        if (!isNaN(ts)) {
          return new Date(ts).toISOString();
        }
      }
    }
    return item.tanggal_transfer;
  };

  const formatFullDateTime = (isoDate: string | null | undefined, fallbackDate?: string | null) => {
    const target = isoDate || fallbackDate;
    if (!target) return '-';
    try {
      const d = new Date(target);
      if (isNaN(d.getTime())) return target;
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta'
      }).format(d) + ' WIB';
    } catch {
      return target;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transferRes, usersRes] = await Promise.all([
        supabase
          .from('pengajuan_transfer')
          .select(`
            *,
            master_rekening(nama_rekening, no_rekening, ref_bank(nama_bank)),
            ref_jenis_belanja(nama_belanja)
          `)
          .gte('tanggal_pengajuan', startDate)
          .lte('tanggal_pengajuan', endDate)
          .order('created_at', { ascending: false }),
        supabase.from('app_users').select('id, email')
      ]);
        
      if (transferRes.error) throw transferRes.error;
      setListData(transferRes.data || []);

      if (usersRes.data) {
        const map: Record<string, string> = {};
        usersRes.data.forEach((u: any) => {
          map[u.id] = u.email;
        });
        setUsersMap(map);
      }
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
        <div className="mb-3">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
           <div className="flex flex-wrap gap-2">
              {links.map((lnk, idx) => {
                 let imgSrc = lnk;
                 const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
                 if (gdriveMatch && gdriveMatch[1]) {
                    imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w200`;
                 } else if (lnk.includes('.r2.dev') || lnk.includes('r2.cloudflarestorage.com')) {
                    imgSrc = `/api/image-cors?url=${encodeURIComponent(lnk)}`;
                 }
                 const isImage = lnk.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) != null || gdriveMatch;
                 
                 return isImage ? (
                    <div key={idx} className="border border-gray-200 shadow-2xs bg-white p-1 rounded-xl cursor-pointer hover:border-indigo-500 transition-all" onClick={() => setPreviewImage(imgSrc)}>
                       <img 
                          src={imgSrc} 
                          alt="Lampiran" 
                          className="h-32 w-auto object-contain rounded-lg" 
                          onError={(e) => {
                             const target = e.target as HTMLImageElement;
                             if (!target.src.includes('/api/image-cors') && lnk.startsWith('http')) {
                                target.src = `/api/image-cors?url=${encodeURIComponent(lnk)}`;
                             }
                          }}
                       />
                    </div>
                 ) : (
                    <button key={idx} onClick={() => window.open(lnk, '_blank')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 transition-colors">
                       <Eye size={14}/> <span>Lihat {label} {idx + 1}</span>
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
        'Nama Rekening': d.master_rekening?.nama_rekening || '-',
        'Bank': d.master_rekening?.ref_bank?.nama_bank || '-',
        'No Rekening': d.master_rekening?.no_rekening || '-',
        'Nominal': d.nominal,
        'Kegiatan': d.kegiatan || '-',
        'Catatan': d.catatan || '-',
        'Status': d.status || '-'
     }));

     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Rekap Transfer");
     XLSX.writeFile(wb, `Rekap_Transfer_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Rekap & Riwayat Transfer
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {filteredData.length} Transaksi
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Laporan riwayat transaksi dan arsip persetujuan transfer bank.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={downloadExcel} 
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <FileSpreadsheet size={13} />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Nominal */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-indigo-300 transition-all">
           <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-500">
              <Wallet size={100} className="text-indigo-600" />
           </div>
           <div className="flex items-center gap-3 mb-4 z-10">
              <div className="p-2.5 bg-indigo-50/80 rounded-xl text-indigo-600 border border-indigo-100">
                 <Wallet size={20} />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Nominal</h3>
           </div>
           <div className="z-10">
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                 <span className="text-base text-gray-400 font-bold mr-1">Rp</span>
                 {formatRp(filteredData.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0))}
              </p>
           </div>
        </div>

        {/* Card 2: Total Disetujui */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-all">
           <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-500">
              <CheckCircle2 size={100} className="text-emerald-600" />
           </div>
           <div className="flex items-center gap-3 mb-4 z-10">
              <div className="p-2.5 bg-emerald-50/80 rounded-xl text-emerald-600 border border-emerald-100">
                 <CheckCircle2 size={20} />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Disetujui</h3>
           </div>
           <div className="flex items-end gap-2 z-10">
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                 {filteredData.filter(d => d.status === 'Disetujui').length}
              </p>
              <p className="text-xs font-bold text-gray-400 mb-1.5">Transaksi</p>
           </div>
        </div>

        {/* Card 3: Menunggu */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-amber-300 transition-all">
           <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-500">
              <Clock size={100} className="text-amber-600" />
           </div>
           <div className="flex items-center gap-3 mb-4 z-10">
              <div className="p-2.5 bg-amber-50/80 rounded-xl text-amber-600 border border-amber-100">
                 <Clock size={20} />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menunggu</h3>
           </div>
           <div className="flex items-end gap-2 z-10">
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                 {filteredData.filter(d => d.status !== 'Disetujui' && d.status !== 'Ditolak').length}
              </p>
              <p className="text-xs font-bold text-gray-400 mb-1.5">Transaksi</p>
           </div>
        </div>

        {/* Card 4: Ditolak */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-rose-300 transition-all">
           <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-500">
              <XCircle size={100} className="text-rose-600" />
           </div>
           <div className="flex items-center gap-3 mb-4 z-10">
              <div className="p-2.5 bg-rose-50/80 rounded-xl text-rose-600 border border-rose-100">
                 <XCircle size={20} />
              </div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ditolak</h3>
           </div>
           <div className="flex items-end gap-2 z-10">
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                 {filteredData.filter(d => d.status === 'Ditolak').length}
              </p>
              <p className="text-xs font-bold text-gray-400 mb-1.5">Transaksi</p>
           </div>
        </div>
      </div>

      {/* FILTER DATE & SEARCH BAR */}
      <div className="bg-white p-3 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            className="h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold text-gray-700" 
          />
          <span className="text-gray-400 font-bold text-xs">s/d</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
            className="h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold text-gray-700" 
          />
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Cari uraian / nama / status..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold text-gray-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                <Loader2 size={32} className="animate-spin mb-2 text-indigo-500" />
                <p className="text-xs font-medium">Memuat data rekap...</p>
             </div>
          ) : filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                <Database size={36} className="mb-2 opacity-40" />
                <p className="text-xs font-medium">Tidak ada data transaksi pada rentang tanggal ini</p>
             </div>
          ) : (
             <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                   <tr>
                      <th className="py-3 px-4">Tgl Transfer</th>
                      <th className="py-3 px-4">Tujuan Transfer</th>
                      <th className="py-3 px-4">Uraian</th>
                      <th className="py-3 px-4 text-right">Nominal</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                   {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                         <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">{item.tanggal_transfer || item.tanggal_pengajuan || '-'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                               {item.tanggal_transfer ? 'Tgl Transfer' : 'Tgl Pengajuan'}
                            </div>
                         </td>
                         <td className="py-3 px-4">
                            <p className="font-bold text-gray-800">{item.master_rekening?.nama_rekening}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{item.master_rekening?.ref_bank?.nama_bank} - {item.master_rekening?.no_rekening}</p>
                         </td>
                         <td className="py-3 px-4 max-w-[220px]">
                            <p className="font-bold text-gray-700 truncate">{item.kegiatan}</p>
                         </td>
                         <td className="py-3 px-4 text-right font-black text-gray-900 font-mono text-sm">
                            Rp {formatRp(item.nominal)}
                         </td>
                         <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                               item.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                               item.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                               'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                               {item.status}
                            </span>
                         </td>
                         <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                               {item.status === 'Ditolak' && (
                                  <a 
                                     href={`/input-transfer/edit/${item.id}`}
                                     className="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition-all text-[11px] inline-flex items-center gap-1 shadow-2xs"
                                     title="Perbaiki & Ajukan Ulang"
                                  >
                                     <RefreshCw size={11} />
                                     <span>Perbaiki</span>
                                  </a>
                               )}
                               <button onClick={() => openDetail(item)} className="h-7 px-2.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 font-bold rounded-lg border border-gray-200 hover:border-indigo-200 transition-all text-[11px] inline-flex items-center gap-1 shadow-2xs">
                                  <Eye size={11} /> <span>Detail</span>
                               </button>
                            </div>
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
              
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                 
                 {/* BANNER NOTIFIKASI JIKA DITOLAK (DENGAN TOMBOL PERBAIKI LANGSUNG) */}
                 {selectedData.status === 'Ditolak' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-white border border-rose-200 space-y-2.5 shadow-xs">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wide">
                             <XCircle size={16} className="text-rose-600 shrink-0" />
                             <span>Pengajuan Ini Ditolak</span>
                          </div>
                          <a 
                             href={`/input-transfer/edit/${selectedData.id}`}
                             className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto active:scale-95"
                          >
                             <RefreshCw size={12} />
                             <span>Perbaiki &amp; Ajukan Ulang Sekarang</span>
                          </a>
                       </div>
                       {selectedData.catatan && (
                          <div className="bg-white/90 p-3 rounded-xl border border-rose-200/80 text-xs text-rose-950 whitespace-pre-line leading-relaxed font-medium">
                             {selectedData.catatan}
                          </div>
                       )}
                    </div>
                 )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                     {/* Card Siklus Waktu & Pengaju */}
                     <div className="bg-gray-50/90 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                           <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Status & Log Pengajuan</span>
                           <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              selectedData.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              selectedData.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                           }`}>
                              ● {selectedData.status}
                           </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                 <User size={11} className="text-gray-400" /> Pembuat Pengajuan (User):
                              </p>
                              <p className="font-bold text-indigo-700 text-xs mt-0.5 break-all" title={selectedData.barang || usersMap[selectedData.created_by] || '-'}>
                                 {selectedData.barang || usersMap[selectedData.created_by] || '-'}
                              </p>
                           </div>

                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                 <Clock size={11} className="text-gray-400" /> Waktu Diajukan (Presisi):
                              </p>
                              <p className="font-bold text-gray-800 font-mono text-[11px] mt-0.5">
                                 {formatFullDateTime(selectedData.created_at, selectedData.tanggal_pengajuan)}
                              </p>
                           </div>

                           <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                 <CheckCircle2 size={11} className="text-emerald-500" /> Waktu Eksekusi Transfer:
                              </p>
                              <p className="font-bold text-emerald-700 font-mono text-[11px] mt-0.5">
                                 {selectedData.status === 'Disetujui' 
                                    ? formatFullDateTime(extractTransferTime(selectedData), selectedData.tanggal_transfer)
                                    : selectedData.status === 'Ditolak'
                                    ? 'Ditolak'
                                    : 'Menunggu Persetujuan'}
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Card Nominal & Kategori */}
                     <div className="bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 p-4 rounded-2xl border border-indigo-200/80 flex flex-col justify-between">
                        <div>
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Nominal Transfer</span>
                              <span className="px-2 py-0.5 bg-indigo-100/80 text-indigo-800 text-[10px] font-bold rounded-md border border-indigo-200">
                                 {selectedData.ref_jenis_belanja?.nama_belanja || 'Kas'}
                              </span>
                           </div>
                           <p className="text-2xl font-black text-indigo-700 font-mono tracking-tight mt-2">
                              Rp {formatRp(selectedData.nominal)}
                           </p>
                        </div>

                        <div className="pt-3 border-t border-indigo-100/80 text-[11px] text-gray-500">
                           <p className="font-medium">Peruntukan: <strong className="text-gray-800">{selectedData.kegiatan}</strong></p>
                        </div>
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
