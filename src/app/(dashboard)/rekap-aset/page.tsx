'use client';

import React, { useState, useEffect } from 'react';
import { Box, Loader2, Database, Image as ImageIcon } from 'lucide-react';
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
      // Perlu diingat bahwa bank_transactions mungkin me-link ke akun_id
      const { data: bankData } = await supabase
        .from('bank_transactions')
        .select('*, pengajuan_transfer(*)')
        .in('akun_id', akunIds);

      // Gabungkan data
      let mergedData: any[] = [];

      if (trxData) {
        trxData.forEach(t => {
          if (t.uang_keluar > 0) { // Aset biasanya dibeli (uang keluar)
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
          if (b.debet > 0) { // Uang keluar di bank
             const pengajuan = b.pengajuan_transfer || {};
             mergedData.push({
               source: 'Bank',
               id: `bank-${b.id}`,
               tanggal: b.waktu_transaksi ? b.waktu_transaksi.split(' ')[0] : '', // Extract date
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

  if (loading) {
     return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-6">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-100">
              <Box size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-gray-900">Rekap Aset</h2>
              <p className="text-gray-500 font-medium">Laporan Rekapitulasi Pembelian Aset Tetap (Akun 55)</p>
           </div>
        </div>
      </div>

      {dataAset.length === 0 ? (
         <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 flex flex-col items-center justify-center text-gray-400">
            <Database size={48} className="mb-4 opacity-50" />
            <p className="font-bold">Belum ada transaksi aset yang dicatat.</p>
         </div>
      ) : (
         <div className="space-y-8">
            {dataAset.map((group, idx) => (
               <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                     <h3 className="font-black text-indigo-900 text-lg flex items-center gap-2">
                        {group.akun.nomor_akun} - {group.akun.nama_akun}
                     </h3>
                     <div className="bg-white px-4 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Total Aset:</span>
                        <span className="font-black text-emerald-600">Rp {fmtRp(group.total)}</span>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider">
                           <tr>
                              <th className="p-4 font-bold">Tanggal Perolehan</th>
                              <th className="p-4 font-bold">Keterangan / Uraian</th>
                              <th className="p-4 font-bold text-right">Nominal</th>
                              <th className="p-4 font-bold text-center">Foto Barang</th>
                              <th className="p-4 font-bold text-center">Bukti Trx</th>
                              <th className="p-4 font-bold text-center">Bukti Transfer</th>
                              <th className="p-4 font-bold text-center">Sumber</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {group.items.map((item: any) => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="p-4 font-bold text-gray-700 whitespace-nowrap">{formatDate(item.tanggal)}</td>
                                 <td className="p-4 text-gray-600 font-medium max-w-[300px] truncate">{item.keterangan}</td>
                                 <td className="p-4 text-right font-black text-emerald-600 whitespace-nowrap">Rp {fmtRp(item.nominal)}</td>
                                 <td className="p-4 text-center">
                                    {item.foto_barang ? (
                                       <button onClick={() => setSelectedImage(item.foto_barang)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg inline-block transition-colors">
                                          <ImageIcon size={18} />
                                       </button>
                                    ) : <span className="text-gray-300">-</span>}
                                 </td>
                                 <td className="p-4 text-center">
                                    {item.foto_bukti ? (
                                       <button onClick={() => setSelectedImage(item.foto_bukti)} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg inline-block transition-colors">
                                          <ImageIcon size={18} />
                                       </button>
                                    ) : <span className="text-gray-300">-</span>}
                                 </td>
                                 <td className="p-4 text-center">
                                    {item.bukti_transfer ? (
                                       <button onClick={() => setSelectedImage(item.bukti_transfer)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg inline-block transition-colors">
                                          <ImageIcon size={18} />
                                       </button>
                                    ) : <span className="text-gray-300">-</span>}
                                 </td>
                                 <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${item.source === 'Kas Kecil' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
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

      {/* MODAL FOTO */}
      {selectedImage && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
               <img src={selectedImage} alt="Preview" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain bg-white" />
               <p className="mt-4 text-white font-medium text-sm bg-black/50 px-4 py-2 rounded-full">Klik dimana saja untuk menutup</p>
            </div>
         </div>
      )}
    </div>
  );
}
