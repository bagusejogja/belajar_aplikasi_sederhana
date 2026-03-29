'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PieChart, Loader2, Calendar, Printer, ChevronDown, ChevronRight, Image as ImageIcon, X } from 'lucide-react';

export default function SummaryPage() {
   const d = new Date();
   const defaultBulan = d.getMonth() + 1;
   const defaultTahun = d.getFullYear();
   
   const [bulanPilih, setBulan] = useState(defaultBulan);
   const [tahunPilih, setTahun] = useState(defaultTahun);
   
   const [summaryData, setSummaryData] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Accordion & Modal State
   const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
   const [previewImage, setPreviewImage] = useState<string | null>(null);

   useEffect(() => {
      fetchSummary();
   }, [bulanPilih, tahunPilih]);

   const fetchSummary = async () => {
      setLoading(true);
      try {
         const { data: trxData, error: errTrx } = await supabase
               .from('transactions')
               .select('*, ref_akun(nomor_akun, nama_akun), ref_personel(nama_orang)')
               .eq('disetujui', 'Disetujui');
               
         if (errTrx) throw errTrx;
         
         const blnStr = bulanPilih.toString().padStart(2, '0');
         const thnStr = tahunPilih.toString();
         const prefixTanggal = `${thnStr}-${blnStr}`;

         const currentMonthData = (trxData || []).filter(t => t.tanggal && t.tanggal.startsWith(prefixTanggal));

         const groupMap: { [key: string]: { nama: string, masuk: number, keluar: number, items: any[] } } = {};

         currentMonthData.forEach(t => {
            const akun = t.ref_akun as any;
            if (!akun || !akun.nomor_akun) return;
            
            const groupCode = String(akun.nomor_akun).substring(0, 2);
            if (!groupMap[groupCode]) {
               groupMap[groupCode] = { nama: `Grup Akun Kepala ${groupCode}`, masuk: 0, keluar: 0, items: [] };
            }
            
            groupMap[groupCode].masuk += Number(t.uang_masuk) || 0;
            groupMap[groupCode].keluar += Number(t.uang_keluar) || 0;
            groupMap[groupCode].items.push(t);
         });

         const arrGroup = Object.keys(groupMap).map(k => ({
            kode: k,
            ...groupMap[k]
         })).sort((a, b) => a.kode.localeCompare(b.kode));
         
         setSummaryData(arrGroup);
      } catch (err) {
         console.error("Gagal menarik data", err);
      } finally {
         setLoading(false);
      }
   };

   const totalMasuk = summaryData.reduce((acc, c) => acc + c.masuk, 0);
   const totalKeluar = summaryData.reduce((acc, c) => acc + c.keluar, 0);

   const extractGdriveLink = (str: string | null) => {
      if (!str) return [];
      const links = str.split(',').map(s => s.trim()).filter(Boolean);
      return links.map(lnk => {
         const match = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
         if (match && match[1]) {
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
         }
         return lnk;
      });
   };

   return (
      <div className="space-y-6 max-w-6xl mx-auto">
         {/* KONTROL PANEL */}
         <div className="print:hidden bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><PieChart size={32}/> Ringkasan Akun (2 Digit)</h2>
               <p className="text-indigo-100 font-medium text-sm">Rekapitulasi total Pemasukan & Pengeluaran berdasarkan Grup Akun 2 digit pertama.</p>
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
                        <tr className="border-b-2 border-gray-300 print:border-black text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-50/50">
                           <th className="p-4 w-[5%]">{/* Panah Kolaps */}</th>
                           <th className="p-4 w-[15%]">Kode 2 Digit</th>
                           <th className="p-4 w-[30%]">Nama Grup Akun</th>
                           <th className="p-4 text-right w-[25%]">S.Debit (Masuk)</th>
                           <th className="p-4 text-right w-[25%]">S.Kredit (Keluar)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 print:divide-black">
                        {summaryData.map(grp => {
                           const isExpand = expandedGroup === grp.kode;
                           return (
                              <React.Fragment key={grp.kode}>
                                 <tr 
                                    onClick={() => setExpandedGroup(isExpand ? null : grp.kode)} 
                                    className={`transition-colors cursor-pointer group ${isExpand ? 'bg-indigo-50 border-b-0' : 'hover:bg-gray-50'}`}
                                 >
                                    <td className="p-4 text-indigo-400 group-hover:text-indigo-600">
                                       {isExpand ? <ChevronDown size={20} strokeWidth={3}/> : <ChevronRight size={20} />}
                                    </td>
                                    <td className="p-4 font-black text-xl text-indigo-600 tracking-wider">[{grp.kode}]</td>
                                    <td className="p-4 font-bold text-gray-700">{grp.nama} <span className="text-[10px] ml-2 bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{grp.items.length} trx</span></td>
                                    <td className="p-4 font-black text-right text-emerald-600">Rp {grp.masuk.toLocaleString('id-ID')}</td>
                                    <td className="p-4 font-black text-right text-red-600">Rp {grp.keluar.toLocaleString('id-ID')}</td>
                                 </tr>
                                 
                                 {/* Data Anak (Collapsible) */}
                                 {isExpand && (
                                    <tr className="bg-indigo-50/50 border-b border-indigo-100">
                                       <td colSpan={5} className="p-0">
                                          <div className="px-10 py-6 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200">
                                             <div className="bg-white rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] border border-indigo-100/50 p-4">
                                                <table className="w-full text-left text-sm">
                                                   <thead>
                                                      <tr className="text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                                                         <th className="pb-3 pl-2 w-28">Tanggal</th>
                                                         <th className="pb-3 w-40">Detail No.Akun</th>
                                                         <th className="pb-3 auto">Uraian Transaksi</th>
                                                         <th className="pb-3 w-40 text-center">Foto / Lampiran</th>
                                                         <th className="pb-3 pr-2 w-32 text-right">Nominal</th>
                                                      </tr>
                                                   </thead>
                                                   <tbody className="divide-y divide-gray-50">
                                                      {grp.items.map((it: any) => {
                                                          const isT_Masuk = Number(it.uang_masuk) > 0;
                                                          const valNom = isT_Masuk ? it.uang_masuk : it.uang_keluar;
                                                          
                                                          // Kumpulkan semua link foto transaksi ini
                                                          const allPhotos = [
                                                              ...extractGdriveLink(it.foto_nota), 
                                                              ...extractGdriveLink(it.foto_kegiatan), 
                                                              ...extractGdriveLink(it.foto_barang), 
                                                              ...extractGdriveLink(it.foto_bukti_transfer)
                                                          ];

                                                          return (
                                                             <tr key={it.id} className="hover:bg-gray-50/50">
                                                                <td className="py-4 pl-2 font-medium text-gray-500 text-[11px] whitespace-nowrap">{it.tanggal}</td>
                                                                <td className="py-4 font-bold text-gray-700 text-xs">{it.ref_akun?.nomor_akun}</td>
                                                                <td className="py-4">
                                                                   <p className="font-bold text-gray-900">{it.uraian}</p>
                                                                   <p className="text-[10px] text-gray-400 mt-0.5">Oleh: {it.ref_personel?.nama_orang || '?'} • Toko: {it.toko || '-'}</p>
                                                                </td>
                                                                <td className="py-4 text-center">
                                                                   <div className="flex flex-wrap gap-1 justify-center max-w-[120px] mx-auto">
                                                                      {allPhotos.length === 0 ? (
                                                                         <span className="text-[10px] italic text-gray-300">- Kosong -</span>
                                                                      ) : (
                                                                         allPhotos.map((lnk, ii) => (
                                                                            <img 
                                                                                key={ii} src={lnk} 
                                                                                onClick={(e) => { e.stopPropagation(); setPreviewImage(lnk); }}
                                                                                className="w-8 h-8 object-cover rounded shadow-sm border border-gray-200 cursor-pointer hover:scale-125 hover:z-10 transition-transform bg-white" 
                                                                                onError={(e) => (e.target as any).src='https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png'}
                                                                            />
                                                                         ))
                                                                      )}
                                                                   </div>
                                                                </td>
                                                                <td className={`py-4 pr-2 text-right font-black ${isT_Masuk ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                   Rp {Number(valNom).toLocaleString('id-ID')}
                                                                </td>
                                                             </tr>
                                                          )
                                                      })}
                                                   </tbody>
                                                </table>
                                             </div>
                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </React.Fragment>
                           );
                        })}

                        <tr className="bg-gray-50 print:bg-transparent border-t-4 border-gray-400 print:border-black font-black text-xl">
                           <td colSpan={3} className="p-4 text-right">TOTAL KESELURUHAN DEBIT / KREDIT</td>
                           <td className="p-4 text-right text-emerald-700">Rp {totalMasuk.toLocaleString('id-ID')}</td>
                           <td className="p-4 text-right text-red-700">Rp {totalKeluar.toLocaleString('id-ID')}</td>
                        </tr>
                     </tbody>
                  </table>

                  <div className="mt-8 pt-8 border-t border-gray-200 flex justify-end">
                     <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 text-right">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Saldo Bersih Berjalan:</p>
                        <p className={`text-4xl font-black ${(totalMasuk - totalKeluar) >= 0 ? 'text-indigo-600' : 'text-red-600'} tracking-tight`}>
                           Rp {(totalMasuk - totalKeluar).toLocaleString('id-ID')}
                        </p>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Modal Pembesaran Gambar */}
         {previewImage && (
            <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
               <div className="absolute top-6 right-6 p-2 bg-red-600 bg-opacity-20 hover:bg-opacity-100 rounded-full cursor-pointer text-white transition-all">
                  <X size={24} />
               </div>
               <img src={previewImage} alt="Perview Bukti Transaksi" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" onClick={(e) => e.stopPropagation()} onError={(e) => {
                  (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
               }} />
            </div>
         )}
      </div>
   );
}
