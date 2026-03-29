'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Printer, Loader2, Calendar } from 'lucide-react';

export default function ReportPhotoPage() {
   const d = new Date();
   const defaultBulan = d.getMonth() + 1;
   const defaultTahun = d.getFullYear();
   
   const [bulanPilih, setBulan] = useState(defaultBulan);
   const [tahunPilih, setTahun] = useState(defaultTahun);
   
   const [transactions, setTransactions] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchReport();
   }, [bulanPilih, tahunPilih]);

   const fetchReport = async () => {
      setLoading(true);
      try {
         // Mencari rentang tanggal dalam bulan dan tahun yang dipilih
         const startDate = new Date(tahunPilih, bulanPilih - 1, 1).toISOString().split('T')[0];
         const endDate = new Date(tahunPilih, bulanPilih, 0).toISOString().split('T')[0];

         const { data, error } = await supabase
               .from('transactions')
               .select('*, ref_akun(nama_akun), ref_personel(nama_orang)')
               .eq('disetujui', 'Disetujui')
               .gte('tanggal_disetujui', startDate)
               .lte('tanggal_disetujui', endDate)
               .order('tanggal_disetujui', { ascending: true });

         if (error) throw error;
         setTransactions(data || []);
      } catch (err) {
         console.error("Gagal menarik data", err);
      } finally {
         setLoading(false);
      }
   };

   // Render foto dengan ukuran raksasa cocok untuk PDF
   const renderFotoPDF = (label: string, teks: string | null) => {
      if (!teks) return null;
      const links = teks.split(',').map(s => s.trim()).filter(Boolean);
      
      return (
         <div className="mb-6 break-inside-avoid">
            <h4 className="text-sm font-black text-gray-800 border-b-2 border-black pb-1 mb-4">{label}</h4>
            <div className="grid grid-cols-2 gap-6">
               {links.map((lnk, idx) => {
                   let imgSrc = lnk;
                   const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
                   if (gdriveMatch && gdriveMatch[1]) {
                      imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1200`; // Ukuran resolusi maksimal untuk print
                   }
                   return (
                      <div key={idx} className="border border-gray-300 rounded overflow-hidden aspect-[4/3] bg-gray-50 flex items-center justify-center print:border-black print:border-2">
                         <img src={imgSrc} alt="Bukti" className="w-full h-full object-contain" onError={(e) => { 
                            (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                            (e.target as any).className = 'w-16 h-16 opacity-50 mx-auto object-contain';
                         }} />
                      </div>
                   );
               })}
            </div>
         </div>
      );
   };

   return (
      <div className="space-y-6 max-w-7xl mx-auto">
         {/* KONTROL PANEL (Sembunyi saat Print PDF) */}
         <div className="print:hidden bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><FileText size={32}/> Cetak Bukti Fisik</h2>
               <p className="text-indigo-100 font-medium">Berdasarkan Filter <span className="bg-orange-500 px-2 py-0.5 rounded text-white font-bold ml-1">BULAN DISETUJUI (ACC)</span>. Foto ditampilkan berukuran raksasa.</p>
            </div>
            
            <div className="flex gap-4 items-center bg-white/10 p-4 rounded-2xl w-full md:w-auto backdrop-blur-sm">
               <Calendar className="text-indigo-200"/>
               <select value={bulanPilih} onChange={e => setBulan(Number(e.target.value))} className="bg-white/20 text-white border-0 font-bold rounded-xl outline-none p-2 appearance-none text-center cursor-pointer">
                  {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1} className="text-black">Bulan {i+1}</option>)}
               </select>
               <select value={tahunPilih} onChange={e => setTahun(Number(e.target.value))} className="bg-white/20 text-white border-0 font-bold rounded-xl outline-none p-2 appearance-none text-center cursor-pointer">
                  {[2023, 2024, 2025, 2026, 2027].map(t => <option key={t} value={t} className="text-black">{t}</option>)}
               </select>
               <button onClick={() => window.print()} className="ml-4 bg-white text-indigo-600 hover:bg-gray-100 px-6 py-2.5 rounded-xl font-black transition-transform hover:scale-105 flex items-center gap-2 drop-shadow-md">
                  <Printer size={18}/> CETAK PDF
               </button>
            </div>
         </div>

         {/* ARENA CETAK (Print Area) */}
         <div className="bg-white rounded-xl print:rounded-none shadow-sm print:shadow-none p-8 print:p-0 min-h-[500px]">
            {loading ? (
               <div className="h-full flex items-center justify-center print:hidden"><Loader2 size={40} className="animate-spin text-indigo-600"/></div>
            ) : transactions.length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-bold print:hidden">Tidak ada transaksi yang di-ACC pada bulan ini.</div>
            ) : (
               <div className="space-y-12">
                  <div className="hidden print:block text-center mb-8 border-b-4 border-black pb-4">
                     <h1 className="text-3xl font-black uppercase">LAPORAN BUKTI FISIK TRANSAKSI</h1>
                     <p className="font-bold text-gray-600">Bulan ACC: {bulanPilih} / {tahunPilih}</p>
                  </div>

                  {transactions.map((trx, idx) => {
                      const isPemasukan = Number(trx.uang_masuk) > 0;
                      const nominal = isPemasukan ? trx.uang_masuk : trx.uang_keluar;
                      
                      return (
                         <div key={trx.id} className="border-2 border-dashed border-gray-300 print:border-solid print:border-black p-6 rounded-2xl print:rounded-none break-inside-avoid shadow-sm print:shadow-none">
                            
                            {/* Kop Transaksi */}
                            <div className="flex justify-between items-start border-b border-gray-200 print:border-black pb-4 mb-6">
                               <div className="space-y-1">
                                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-100 print:bg-transparent print:border print:border-black inline-block px-2 py-1 rounded">No Reg: #{trx.id} | ACC: {new Date(trx.tanggal_disetujui).toLocaleDateString('id-ID')}</p>
                                  <h3 className="text-2xl font-black text-gray-900 leading-tight mt-2">{trx.uraian}</h3>
                                  <p className="text-sm font-bold text-gray-600">Akun: {trx.ref_akun?.nama_akun || '-'} • Pemohon: {trx.ref_personel?.nama_orang || '-'} • Toko: {trx.toko || '-'}</p>
                               </div>
                               <div className="text-right shrink-0 bg-gray-50 print:bg-transparent p-4 rounded-xl border border-gray-200 print:border-black">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Total {isPemasukan ? 'Pemasukan' : 'Pengeluaran'}</p>
                                  <p className="text-2xl font-black text-gray-900">Rp {Number(nominal).toLocaleString('id-ID')}</p>
                               </div>
                            </div>

                            {/* Zona Foto Raksasa */}
                            <div className="space-y-2">
                               {renderFotoPDF("📝 BUKTI NOTA / KWITANSI", trx.foto_nota)}
                               {renderFotoPDF("📸 DOKUMENTASI KEGIATAN", trx.foto_kegiatan)}
                               {renderFotoPDF("📦 FOTO BARANG / ASET", trx.foto_barang)}
                               {renderFotoPDF("💸 BUKTI TRANSFER", trx.foto_bukti_transfer)}
                               
                               {!(trx.foto_nota || trx.foto_kegiatan || trx.foto_barang || trx.foto_bukti_transfer) && (
                                  <div className="text-center py-6 border-2 border-dotted border-gray-300 text-gray-400 font-bold italic text-sm">(Berkas Kosong - Tidak ada lampiran)</div>
                               )}
                            </div>
                         </div>
                      );
                  })}
               </div>
            )}
         </div>
      </div>
   );
}
