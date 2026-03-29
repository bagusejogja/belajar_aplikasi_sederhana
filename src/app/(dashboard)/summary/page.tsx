'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PieChart, Loader2, Calendar, Printer } from 'lucide-react';

export default function SummaryPage() {
   const d = new Date();
   const defaultBulan = d.getMonth() + 1;
   const defaultTahun = d.getFullYear();
   
   const [bulanPilih, setBulan] = useState(defaultBulan);
   const [tahunPilih, setTahun] = useState(defaultTahun);
   
   const [summaryData, setSummaryData] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchSummary();
   }, [bulanPilih, tahunPilih]);

   const fetchSummary = async () => {
      setLoading(true);
      try {
         const { data, error } = await supabase
               .from('transactions')
               .select('uang_masuk, uang_keluar, disetujui, ref_akun(nomor_akun, nama_akun)')
               .eq('disetujui', 'Disetujui'); // Hanya data Sah
               
         if (error) throw error;
         
         const rawData = data || [];
         
         // Logic Grouping by 2-digit Akun & Filter Per Bulan
         // Karena kita tidak menyimpan _bulan/_tahun di db awal, kita filter di js
         const filtered = rawData.filter(t => {
            // Kita bisa filter berdasarkan tanggal transaksi atau tanggal disetujui? Kita pakai tanggal disetujui sesuai permintaan
            // Wait, asumsi "perbulan" adalah laporan general, kita filter by transaksi bulan? Laporan ringkasan biasanya by tanggal transaksi (tapi yg sudah sah).
            // Tapi karena kolom _bulan tidak ditarik, kita harus tarik 'tanggal' dari DB atau filter seluruh data dulu
            return true; 
         });
         
         // Tunggu, saya harus merevisi Query untuk menarik 'tanggal' agar bisa difilter perbulan dengan benar
         const { data: trxData, error: errTrx } = await supabase
               .from('transactions')
               .select('tanggal, uang_masuk, uang_keluar, disetujui, ref_akun(nomor_akun, nama_akun)')
               .eq('disetujui', 'Disetujui');
               
         if (errTrx) throw errTrx;
         
         // Filter Per Bulan
         const blnStr = bulanPilih.toString().padStart(2, '0');
         const thnStr = tahunPilih.toString();
         const prefixTanggal = `${thnStr}-${blnStr}`;

         const currentMonthData = (trxData || []).filter(t => t.tanggal && t.tanggal.startsWith(prefixTanggal));

         // Aggregation
         const groupMap: { [key: string]: { nama: string, masuk: number, keluar: number } } = {};

         currentMonthData.forEach(t => {
            const akun = t.ref_akun as any;
            if (!akun || !akun.nomor_akun) return; // Skip jika tidak ada akun
            
            const groupCode = String(akun.nomor_akun).substring(0, 2);
            if (!groupMap[groupCode]) {
               // Berusaha mencari nama representatif untuk grup ini (bisa diambil dari nama akun pertama yg muncul)
               // Idealnya ada tabel Header Akun, tapi kita pakai nama akun pertama sementara
               groupMap[groupCode] = { nama: `Group Akun ${groupCode}`, masuk: 0, keluar: 0 };
            }
            
            groupMap[groupCode].masuk += Number(t.uang_masuk) || 0;
            groupMap[groupCode].keluar += Number(t.uang_keluar) || 0;
         });

         const arrGroup = Object.keys(groupMap).map(k => ({
            kode: k,
            ...groupMap[k]
         })).sort((a, b) => a.kode.localeCompare(b.kode)); // Urut abjad kode
         
         setSummaryData(arrGroup);
      } catch (err) {
         console.error("Gagal menarik data", err);
      } finally {
         setLoading(false);
      }
   };

   // Total Hitungan
   const totalMasuk = summaryData.reduce((acc, c) => acc + c.masuk, 0);
   const totalKeluar = summaryData.reduce((acc, c) => acc + c.keluar, 0);

   return (
      <div className="space-y-6 max-w-5xl mx-auto">
         {/* KONTROL PANEL */}
         <div className="print:hidden bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><PieChart size={32}/> Ringkasan Akun (2 Digit)</h2>
               <p className="text-indigo-100 font-medium">Rekapitulasi total Pemasukan & Pengeluaran berdasarkan Induk/Grup Akun.</p>
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

         {/* ARENA CETAK */}
         <div className="bg-white rounded-3xl print:rounded-none shadow-sm print:shadow-none p-8 border border-gray-100 print:border-none min-h-[400px]">
            {loading ? (
               <div className="h-full flex items-center justify-center print:hidden"><Loader2 size={40} className="animate-spin text-indigo-600"/></div>
            ) : summaryData.length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-bold print:hidden">Belum ada transaksi sah di bulan ini.</div>
            ) : (
               <div>
                  <div className="hidden print:block text-center mb-10 border-b-2 border-black pb-4">
                     <h1 className="text-3xl font-black tracking-widest uppercase">Laporan Ringkasan Grup Akun</h1>
                     <p className="font-bold text-gray-700 mt-2">Periode Transaksi: Bulan {bulanPilih} Tahun {tahunPilih}</p>
                  </div>

                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b-2 border-gray-300 print:border-black text-xs font-black text-gray-500 uppercase tracking-widest">
                           <th className="p-4 w-1/4">Kode Grup (2 Digit)</th>
                           <th className="p-4 w-1/4">Nama Grup Akun</th>
                           <th className="p-4 text-right w-1/4">Total Debit (Masuk)</th>
                           <th className="p-4 text-right w-1/4">Total Kredit (Keluar)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 print:divide-black">
                        {summaryData.map(grp => (
                           <tr key={grp.kode} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-black text-lg text-indigo-600">{grp.kode}</td>
                              <td className="p-4 font-bold text-gray-700">{grp.nama}</td>
                              <td className="p-4 font-black text-right text-emerald-600">Rp {grp.masuk.toLocaleString('id-ID')}</td>
                              <td className="p-4 font-black text-right text-red-600">Rp {grp.keluar.toLocaleString('id-ID')}</td>
                           </tr>
                        ))}
                        <tr className="bg-gray-50 print:bg-transparent border-t-4 border-gray-400 print:border-black font-black text-lg">
                           <td colSpan={2} className="p-4 text-right">TOTAL KESELURUHAN</td>
                           <td className="p-4 text-right text-emerald-700">Rp {totalMasuk.toLocaleString('id-ID')}</td>
                           <td className="p-4 text-right text-red-700">Rp {totalKeluar.toLocaleString('id-ID')}</td>
                        </tr>
                     </tbody>
                  </table>

                  <div className="mt-10 pt-4 border-t border-gray-200">
                     <p className="text-sm font-bold text-gray-500">Saldo Akhir (Masuk - Keluar): <span className={`text-xl font-black ${totalMasuk - totalKeluar >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>Rp {(totalMasuk - totalKeluar).toLocaleString('id-ID')}</span></p>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
