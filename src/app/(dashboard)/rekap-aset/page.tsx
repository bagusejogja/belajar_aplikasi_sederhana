'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, Loader2, Database, Image as ImageIcon, 
  RefreshCw, Layers, DollarSign, ArrowDownRight, 
  Building2, X, Eye, CheckCircle2, FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper for formatting Rp
const fmtRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

// Helper for formatting Date (dd-mm-yyyy)
const formatDate = (dateStr: string) => {
   if (!dateStr) return '-';
   const d = new Date(dateStr);
   if (isNaN(d.getTime())) return dateStr;
   return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export default function RekapAsetPage() {
  const [dataAset, setDataAset] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Foto
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageTitle, setImageTitle] = useState<string>('');

  useEffect(() => {
    fetchAset();
  }, []);

  const fetchAset = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan akun yang kepalanya 55
      const { data: akun55 } = await supabase
        .from('ref_akun')
        .select('id, nomor_akun, nama_akun')
        .like('nomor_akun', '55%');

      if (!akun55 || akun55.length === 0) {
        setDataAset([]);
        setLoading(false);
        return;
      }

      const akunIds = akun55.map(a => a.id);
      const akunMap = Object.fromEntries(akun55.map(a => [a.id, a]));

      // 2. Ambil data dari Kas Kecil (transactions)
      const { data: trxData } = await supabase
        .from('transactions')
        .select('*')
        .in('akun_id', akunIds);

      // 3. Ambil data dari Bank (bank_transactions)
      const { data: bankData } = await supabase
        .from('bank_transactions')
        .select('*, pengajuan_transfer(*)')
        .in('akun_id', akunIds);

      // Gabungkan data
      let mergedData: any[] = [];

      if (trxData) {
        trxData.forEach(t => {
          if (t.uang_keluar > 0) {
             mergedData.push({
               source: 'Kas Kecil',
               id: `kas-${t.id}`,
               tanggal: t.tanggal,
               akun_id: t.akun_id,
               nama_akun: akunMap[t.akun_id]?.nama_akun || 'Unknown',
               keterangan: t.uraian,
               nominal: t.uang_keluar,
               foto_barang: t.foto_barang,
               foto_bukti: t.foto_nota || t.foto_kegiatan,
               bukti_transfer: null,
             });
          }
        });
      }

      if (bankData) {
        bankData.forEach(b => {
          if (b.debet > 0) {
             const pengajuan = b.pengajuan_transfer || {};
             mergedData.push({
               source: 'Bank',
               id: `bank-${b.id}`,
               tanggal: b.waktu_transaksi ? b.waktu_transaksi.split(' ')[0] : '',
               akun_id: b.akun_id,
               nama_akun: akunMap[b.akun_id]?.nama_akun || 'Unknown',
               keterangan: b.deskripsi,
               nominal: b.debet,
               foto_barang: pengajuan.foto_barang || b.foto_barang || null,
               foto_bukti: pengajuan.nota_url || pengajuan.foto_kegiatan || b.foto_nota || b.foto_kegiatan || null,
               bukti_transfer: b.bukti_transfer || null,
             });
          }
        });
      }

      // Sort by date ascending
      mergedData.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

      // Group by Account
      const groupedData: any[] = [];
      akun55.forEach(akun => {
         const items = mergedData.filter(m => m.akun_id === akun.id);
         if (items.length > 0) {
            groupedData.push({
               akun: akun,
               items: items,
               total: items.reduce((sum, i) => sum + i.nominal, 0)
            });
         }
      });

      setDataAset(groupedData);

    } catch (error) {
      console.error("Gagal menarik data aset:", error);
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (url: string, title: string) => {
    setSelectedImage(url);
    setImageTitle(title);
  };

  // Calculations for KPI Cards
  const totalNominalAset = dataAset.reduce((sum, g) => sum + g.total, 0);
  const totalItemAset = dataAset.reduce((sum, g) => sum + g.items.length, 0);
  const totalKasKecil = dataAset.reduce((sum, g) => sum + g.items.filter((i: any) => i.source === 'Kas Kecil').reduce((s: number, i: any) => s + i.nominal, 0), 0);
  const totalBank = dataAset.reduce((sum, g) => sum + g.items.filter((i: any) => i.source === 'Bank').reduce((s: number, i: any) => s + i.nominal, 0), 0);

  if (loading) {
     return (
       <div className="flex h-96 flex-col items-center justify-center gap-3">
         <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
         <span className="text-xs font-semibold text-gray-500">Memuat Rekap Aset Tetap...</span>
       </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Box size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Rekap Aset Tetap</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">Akun Kepala 55</span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">Laporan rekapitulasi pembelian aset tetap dari Kas Kecil dan Rekening Bank</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={fetchAset}
            className="h-9 px-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className="text-gray-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Nilai Aset */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Nilai Aset</p>
            <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono">Rp {fmtRp(totalNominalAset)}</h3>
            <span className="text-[10px] font-semibold text-emerald-600">{dataAset.length} Akun Aset Terdaftar</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Total Item / Transaksi */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Transaksi</p>
            <h3 className="text-base font-black text-gray-900 mt-0.5">{totalItemAset} <span className="text-xs font-semibold text-gray-500">Unit/Trx</span></h3>
            <span className="text-[10px] font-semibold text-indigo-600">Perolehan Aset</span>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Box size={20} />
          </div>
        </div>

        {/* Dari Kas Kecil */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sumber Kas Kecil</p>
            <h3 className="text-base font-black text-blue-700 mt-0.5 font-mono">Rp {fmtRp(totalKasKecil)}</h3>
            <span className="text-[10px] font-semibold text-blue-600">Tunai / Nota Langsung</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Layers size={20} />
          </div>
        </div>

        {/* Dari Bank */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sumber Bank</p>
            <h3 className="text-base font-black text-purple-700 mt-0.5 font-mono">Rp {fmtRp(totalBank)}</h3>
            <span className="text-[10px] font-semibold text-purple-600">Transfer / Rekening</span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 size={20} />
          </div>
        </div>
      </div>

      {/* ASSET TABLES GROUPED BY ACCOUNT */}
      {dataAset.length === 0 ? (
         <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 mb-3">
              <Database size={36} />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Belum Ada Transaksi Aset</h3>
            <p className="text-gray-400 text-xs mt-1">Transaksi pada akun kepala 55 akan otomatis muncul di halaman ini.</p>
         </div>
      ) : (
         <div className="space-y-4">
            {dataAset.map((group, idx) => (
               <div key={idx} className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                  {/* Account Header */}
                  <div className="p-3.5 px-5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap justify-between items-center gap-3">
                     <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
                          {group.akun.nomor_akun}
                        </span>
                        <h3 className="font-black text-gray-900 text-sm">
                          {group.akun.nama_akun}
                        </h3>
                        <span className="text-gray-400 text-xs font-semibold">
                          ({group.items.length} transaksi)
                        </span>
                     </div>
                     <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-gray-200 shadow-2xs">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subtotal:</span>
                        <span className="font-mono font-black text-xs text-emerald-600">Rp {fmtRp(group.total)}</span>
                     </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-gray-50/80 border-b border-gray-200">
                              <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider w-28">Tanggal</th>
                              <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider">Keterangan / Uraian</th>
                              <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider text-right w-36">Nominal</th>
                              <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider text-center w-24">Foto Barang</th>
                              <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider text-center w-24">Bukti Trx</th>
                              <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider text-center w-24">Bukti TF</th>
                              <th className="py-3 px-4 text-gray-400 font-black uppercase text-[10px] tracking-wider text-center w-28">Sumber</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {group.items.map((item: any) => (
                              <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                                 <td className="py-2.5 px-4 text-xs font-semibold text-gray-600 whitespace-nowrap">
                                    {formatDate(item.tanggal)}
                                 </td>
                                 <td className="py-2.5 px-4 text-xs font-semibold text-gray-800">
                                    {item.keterangan}
                                 </td>
                                 <td className="py-2.5 px-4 text-right font-mono font-bold text-xs text-gray-900 whitespace-nowrap">
                                    Rp {fmtRp(item.nominal)}
                                 </td>
                                 <td className="py-2.5 px-4 text-center">
                                    {item.foto_barang ? (
                                       <button 
                                          onClick={() => openImageModal(item.foto_barang, `Foto Barang - ${item.keterangan}`)} 
                                          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg inline-flex items-center gap-1 text-[10px] font-bold transition-colors border border-indigo-100"
                                          title="Lihat Foto Barang"
                                       >
                                          <ImageIcon size={13} />
                                          <span>Foto</span>
                                       </button>
                                    ) : <span className="text-gray-300 text-xs">-</span>}
                                 </td>
                                 <td className="py-2.5 px-4 text-center">
                                    {item.foto_bukti ? (
                                       <button 
                                          onClick={() => openImageModal(item.foto_bukti, `Bukti Transaksi / Nota - ${item.keterangan}`)} 
                                          className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg inline-flex items-center gap-1 text-[10px] font-bold transition-colors border border-amber-100"
                                          title="Lihat Nota / Bukti"
                                       >
                                          <FileText size={13} />
                                          <span>Nota</span>
                                       </button>
                                    ) : <span className="text-gray-300 text-xs">-</span>}
                                 </td>
                                 <td className="py-2.5 px-4 text-center">
                                    {item.bukti_transfer ? (
                                       <button 
                                          onClick={() => openImageModal(item.bukti_transfer, `Bukti Transfer Bank - ${item.keterangan}`)} 
                                          className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg inline-flex items-center gap-1 text-[10px] font-bold transition-colors border border-emerald-100"
                                          title="Lihat Bukti Transfer"
                                       >
                                          <CheckCircle2 size={13} />
                                          <span>TF</span>
                                       </button>
                                    ) : <span className="text-gray-300 text-xs">-</span>}
                                 </td>
                                 <td className="py-2.5 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                       item.source === 'Kas Kecil' 
                                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                          : 'bg-purple-50 text-purple-700 border-purple-200'
                                    }`}>
                                       {item.source}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* MODAL PREVIEW FOTO */}
      {selectedImage && (
         <div 
           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150" 
           onClick={() => setSelectedImage(null)}
         >
            <div 
              className="relative max-w-3xl w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
               {/* Modal Header */}
               <div className="p-3.5 px-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
                  <div className="flex items-center gap-2">
                     <ImageIcon size={16} className="text-indigo-600" />
                     <h3 className="font-bold text-gray-900 text-xs truncate max-w-md">{imageTitle || 'Preview Dokumen Lampiran'}</h3>
                  </div>
                  <button 
                     onClick={() => setSelectedImage(null)}
                     className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg transition-colors"
                  >
                     <X size={16} />
                  </button>
               </div>

               {/* Modal Content */}
               <div className="p-4 bg-gray-950/5 flex items-center justify-center flex-1 overflow-auto max-h-[75vh]">
                  <img 
                     src={selectedImage} 
                     alt="Lampiran Aset" 
                     className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-sm bg-white" 
                  />
               </div>

               {/* Modal Footer */}
               <div className="p-3 px-5 border-t border-gray-200 bg-white flex justify-end">
                  <button
                     onClick={() => setSelectedImage(null)}
                     className="h-8 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all"
                  >
                     Tutup
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
