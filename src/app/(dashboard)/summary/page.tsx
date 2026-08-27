'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PieChart, Loader2, Calendar, Printer, ChevronDown, ChevronRight, X, AlertCircle, Layers } from 'lucide-react';

const extractGdriveLink = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    return val.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0 && s.startsWith('http'));
  }
  return [];
};

export default function SummaryPage() {
   const d = new Date();
   const defaultBulan = d.getMonth() + 1;
   const defaultTahun = d.getFullYear();
   
   const [bulanPilih, setBulan] = useState(defaultBulan);
   const [tahunPilih, setTahun] = useState(defaultTahun);
   
   const [summaryData, setSummaryData] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // State Accordion
   // Untuk melacak baris mana yang sedang terbuka
   const [expandedGroup2Digit, setExpandedGroup2Digit] = useState<string | null>(null);
   const [expandedGroupAkun, setExpandedGroupAkun] = useState<string | null>(null);

   const [previewImage, setPreviewImage] = useState<string | null>(null);

   useEffect(() => {
      fetchSummary();
   }, [bulanPilih, tahunPilih]);

   const fetchSummary = async () => {
      setLoading(true);
      setExpandedGroup2Digit(null);
      setExpandedGroupAkun(null);
      try {
         let allTrx: any[] = [];
         let isSelesai = false;
         let ambilMulai = 0;
         const batasAmbil = 1000;

         while (!isSelesai) {
             const { data, error } = await supabase
                 .from('transactions')
                 .select('*, ref_akun(nomor_akun, nama_akun), ref_personel(nama_orang)')
                 .neq('disetujui', 'Ditolak')
                 .order('tanggal', { ascending: true })
                 .order('id', { ascending: true })
                 .range(ambilMulai, ambilMulai + batasAmbil - 1);
                 
             if (error) throw error;
             
             if (data && data.length > 0) {
                 allTrx = [...allTrx, ...data];
                 if (data.length < batasAmbil) isSelesai = true;
                 else ambilMulai += batasAmbil;
             } else {
                 isSelesai = true;
             }
         }
         
         // Filter Tanggal menggunakan JavaScript Date agar stabil dari format apapun
         const currentMonthData = allTrx.filter(t => {
            if (!t.tanggal) return false;
            const dt = new Date(t.tanggal);
            return dt.getFullYear() === tahunPilih && dt.getMonth() + 1 === bulanPilih;
         });

         // Struktur Data:
         // 2-Digit Group => Sub-Group (Nomor Akun Lengkap) => Items
         const groupMap: { [key: string]: { nama: string, masuk: number, keluar: number, subGroups: any } } = {};

         currentMonthData.forEach(t => {
            const akun = t.ref_akun as any || {};
            const nomor_akun = akun.nomor_akun || '99999.00';
            const nama_akun = akun.nama_akun || 'Tanpa Akun';
            
            const head2Digit = String(nomor_akun).substring(0, 2);
            
            // Inisialisasi Group 2-Digit
            if (!groupMap[head2Digit]) {
               groupMap[head2Digit] = { nama: `Grup Induk [${head2Digit}]`, masuk: 0, keluar: 0, subGroups: {} };
            }
            
            // Inisialisasi Sub-Group Akun Asli
            if (!groupMap[head2Digit].subGroups[nomor_akun]) {
               groupMap[head2Digit].subGroups[nomor_akun] = { nama_akun: nama_akun, masuk: 0, keluar: 0, items: [] };
            }
            
            const masuk = Number(t.uang_masuk) || 0;
            const keluar = Number(t.uang_keluar) || 0;

            // Tambah Total ke 2-Digit Group
            groupMap[head2Digit].masuk += masuk;
            groupMap[head2Digit].keluar += keluar;
            
            // Tambah Total ke Sub-Group Akun
            groupMap[head2Digit].subGroups[nomor_akun].masuk += masuk;
            groupMap[head2Digit].subGroups[nomor_akun].keluar += keluar;
            
            // Simpan Transaksinya di Sub-Group
            groupMap[head2Digit].subGroups[nomor_akun].items.push(t);
         });

         // Format Array untuk Render UI
         const finalArr = Object.keys(groupMap).map(k2Digit => {
            const grp = groupMap[k2Digit];
            
            const subGroupsArr = Object.keys(grp.subGroups).map(noAkun => {
               return {
                  nomor_akun: noAkun,
                  nama_akun: grp.subGroups[noAkun].nama_akun,
                  masuk: grp.subGroups[noAkun].masuk,
                  keluar: grp.subGroups[noAkun].keluar,
                  items: grp.subGroups[noAkun].items
               };
            }).sort((a, b) => a.nomor_akun.localeCompare(b.nomor_akun));

            return {
               kode: k2Digit,
               nama: grp.nama,
               masuk: grp.masuk,
               keluar: grp.keluar,
               subGroupsArr: subGroupsArr
            };
         }).sort((a, b) => a.kode.localeCompare(b.kode));

         setSummaryData(finalArr);
      } catch (err: any) {
         console.error("Gagal menarik data ringkasan:", err);
      } finally {
         setLoading(false);
      }
   };

   // Helper untuk mengambil list link foto
   const getPhotoList = (str: string | null) => {
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

   const totalMasuk = summaryData.reduce((acc, c) => acc + c.masuk, 0);
   const totalKeluar = summaryData.reduce((acc, c) => acc + c.keluar, 0);

   return (
      <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
         {/* SLIM & UNIFIED TOP TOOLBAR */}
         <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3">
               <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
                  <Layers size={20} />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                     <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                        Ringkasan Kas Kecil
                     </h1>
                     <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        Bulan {bulanPilih} / {tahunPilih}
                     </span>
                  </div>
                  <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                     Ringkasan multi-level mutasi kas kecil per Induk 2-Digit dan Akun Anggaran.
                  </p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
               <select 
                  value={bulanPilih} 
                  onChange={e => setBulan(Number(e.target.value))} 
                  className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer"
               >
                  {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>Bulan {i+1}</option>)}
               </select>
               <select 
                  value={tahunPilih} 
                  onChange={e => setTahun(Number(e.target.value))} 
                  className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer"
               >
                  {[2023, 2024, 2025, 2026, 2027].map(t => <option key={t} value={t}>{t}</option>)}
               </select>
               <button 
                  onClick={() => window.print()} 
                  className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
               >
                  <Printer size={13}/> <span>Cetak PDF</span>
               </button>
            </div>
         </div>

         {/* ARENA TABEL */}
         <div className="bg-white rounded-2xl print:rounded-none shadow-xs border border-gray-200/80 overflow-hidden min-h-[300px]">
            {loading ? (
               <div className="h-48 flex flex-col items-center justify-center text-indigo-600">
                  <Loader2 size={32} className="animate-spin mb-2 text-indigo-500" />
                  <p className="text-xs font-medium text-gray-500">Memuat ringkasan kas...</p>
               </div>
            ) : summaryData.length === 0 ? (
               <div className="text-center py-16 text-gray-500 font-medium flex flex-col items-center p-8">
                   <AlertCircle size={36} className="mb-2 text-gray-400 opacity-60" />
                   <p className="text-xs">Tidak ditemukan transaksi pada periode {tahunPilih}-{bulanPilih.toString().padStart(2, '0')}</p>
               </div>
            ) : (
               <div>
                  <div className="hidden print:block text-center mb-6 border-b border-black pb-3">
                     <h1 className="text-xl font-black tracking-wider uppercase">Laporan Ringkasan Kas Kecil</h1>
                     <p className="font-bold text-gray-700 text-xs mt-1">Periode: Bulan {bulanPilih} Tahun {tahunPilih}</p>
                  </div>

                  <table className="w-full text-left border-collapse text-xs">
                     <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                           <th className="py-3 px-4 w-10">{/* Panah Kolaps */}</th>
                           <th className="py-3 px-4 w-28">Kode Induk</th>
                           <th className="py-3 px-4">Grup Induk</th>
                           <th className="py-3 px-4 text-right">Total Debit (+)</th>
                           <th className="py-3 px-4 text-right">Total Kredit (-)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 font-medium">
                        {summaryData.map(grp => {
                           // STATUS LEVEL 1 (2-Digit Group)
                           const isExpand2Digit = expandedGroup2Digit === grp.kode;
                           
                           return (
                              <React.Fragment key={grp.kode}>
                                 {/* BARIS LEVEL 1: Grup 2 Digit */}
                                 <tr 
                                    onClick={() => setExpandedGroup2Digit(isExpand2Digit ? null : grp.kode)} 
                                    className={`transition-colors cursor-pointer group ${isExpand2Digit ? 'bg-indigo-600 text-white border-none' : 'hover:bg-gray-50'} print:text-black print:bg-gray-200`}
                                 >
                                    <td className={`p-4 ${isExpand2Digit ? 'text-white' : 'text-indigo-400'} group-hover:text-indigo-600`}>
                                       {isExpand2Digit ? <ChevronDown size={20} strokeWidth={3}/> : <ChevronRight size={20} />}
                                    </td>
                                    <td className={`p-4 font-black text-xl tracking-wider ${isExpand2Digit ? 'text-white' : 'text-indigo-600'}`}>[{grp.kode}]</td>
                                    <td className={`p-4 font-bold ${isExpand2Digit ? 'text-white' : 'text-gray-700'}`}>
                                       {grp.nama} 
                                       <span className={`text-[10px] ml-2 px-2 py-0.5 rounded-full ${isExpand2Digit ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                          {grp.subGroupsArr.length} Sub-Akun
                                       </span>
                                    </td>
                                    <td className={`p-4 font-black text-right ${isExpand2Digit ? 'text-white' : 'text-emerald-600'}`}>Rp {grp.masuk.toLocaleString('id-ID')}</td>
                                    <td className={`p-4 font-black text-right ${isExpand2Digit ? 'text-white' : 'text-red-500'}`}>Rp {grp.keluar.toLocaleString('id-ID')}</td>
                                 </tr>
                                 
                                 {/* DATA ANAK LEVEL 2 (Daftar Akun Lengkap) */}
                                 {isExpand2Digit && (
                                    <tr className="bg-indigo-50/30 border-b border-indigo-100 print:bg-transparent">
                                       <td colSpan={5} className="p-0">
                                          <div className="py-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                             
                                             <table className="w-full text-left text-sm border-collapse">
                                                <tbody className="divide-y divide-gray-100">
                                                   
                                                   {grp.subGroupsArr.map((sub: any) => {
                                                       const isExpandAkun = expandedGroupAkun === sub.nomor_akun;

                                                       return (
                                                          <React.Fragment key={sub.nomor_akun}>
                                                             {/* BARIS LEVEL 2: Sub-Akun Lengkap */}
                                                             <tr 
                                                                 onClick={() => setExpandedGroupAkun(isExpandAkun ? null : sub.nomor_akun)} 
                                                                 className={`cursor-pointer transition-colors ${isExpandAkun ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50'}`}
                                                             >
                                                                 <td className="p-3 pl-8 text-blue-400 w-[5%]">{isExpandAkun ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</td>
                                                                 <td className="p-3 font-bold text-gray-700 w-[15%]">{sub.nomor_akun}</td>
                                                                 <td className="p-3 font-medium text-gray-800 w-[30%]">{sub.nama_akun} <span className="text-[10px] bg-gray-100 px-1 rounded ml-1 text-gray-400">{sub.items.length} trx</span></td>
                                                                 <td className="p-3 text-right font-bold text-emerald-600 w-[25%]">{sub.masuk > 0 ? `Rp ${sub.masuk.toLocaleString('id-ID')}` : '-'}</td>
                                                                 <td className="p-3 text-right font-bold text-red-500 w-[25%]">{sub.keluar > 0 ? `Rp ${sub.keluar.toLocaleString('id-ID')}` : '-'}</td>
                                                             </tr>

                                                             {/* DATA ANAK LEVEL 3 (Tabel Transaksi & Foto) */}
                                                             {isExpandAkun && (
                                                                <tr className="bg-blue-50/20">
                                                                   <td colSpan={5} className="p-0 border-b border-blue-200">
                                                                      <div className="px-12 py-4 animate-in slide-in-from-top-1 fade-in duration-150">
                                                                          <table className="w-full text-left text-xs bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-blue-100 overflow-hidden">
                                                                             <thead className="bg-blue-50/50">
                                                                                <tr className="text-gray-500 uppercase tracking-widest border-b border-blue-100">
                                                                                   <th className="p-3 w-28">Tanggal</th>
                                                                                   <th className="p-3 w-56">Uraian Transaksi</th>
                                                                                   <th className="p-3 w-32">Kreator / Toko</th>
                                                                                   <th className="p-3 w-40 text-center">Foto Lampiran</th>
                                                                                   <th className="p-3 text-right font-bold w-32">Nominal Rp</th>
                                                                                </tr>
                                                                             </thead>
                                                                             <tbody className="divide-y divide-gray-50">
                                                                                {sub.items.map((it: any) => {
                                                                                   const isT_Masuk = Number(it.uang_masuk) > 0;
                                                                                   const valNom = isT_Masuk ? it.uang_masuk : it.uang_keluar;
                                                                                   
                                                                                   const allPhotos = [
                                                                                       ...extractGdriveLink(it.foto_nota), 
                                                                                       ...extractGdriveLink(it.foto_kegiatan), 
                                                                                       ...extractGdriveLink(it.foto_barang), 
                                                                                       ...extractGdriveLink(it.foto_bukti_transfer)
                                                                                   ];

                                                                                   return (
                                                                                      <tr key={it.id} className="hover:bg-blue-50/30">
                                                                                         <td className="p-3 text-gray-500 whitespace-nowrap">{it.tanggal}</td>
                                                                                         <td className="p-3 font-bold text-gray-800 leading-snug">{it.uraian}</td>
                                                                                         <td className="p-3 text-[10px] text-gray-500 leading-tight">
                                                                                            <span className="font-bold text-gray-700">{it.ref_personel?.nama_orang || '?'}</span><br/>
                                                                                            {it.toko || '-'}
                                                                                         </td>
                                                                                         <td className="p-3 text-center">
                                                                                            <div className="flex flex-wrap gap-1 justify-center max-w-[120px] mx-auto">
                                                                                               {allPhotos.length === 0 ? (
                                                                                                  <span className="text-[10px] italic text-gray-300">- Kosong -</span>
                                                                                               ) : (
                                                                                                  allPhotos.map((lnk, ii) => (
                                                                                                     <img 
                                                                                                         key={ii} src={lnk} 
                                                                                                         onClick={(e) => { e.stopPropagation(); setPreviewImage(lnk); }}
                                                                                                         className="w-10 h-10 object-cover rounded shadow border border-gray-200 cursor-pointer hover:border-black transition-colors bg-white hover:z-10 relative" 
                                                                                                         title="Klik untuk memperbesar"
                                                                                                         onError={(e) => (e.target as any).src='https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png'}
                                                                                                     />
                                                                                                  ))
                                                                                               )}
                                                                                            </div>
                                                                                         </td>
                                                                                         <td className={`p-3 text-right font-black ${isT_Masuk ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                                            {Number(valNom).toLocaleString('id-ID')}
                                                                                         </td>
                                                                                      </tr>
                                                                                   )
                                                                                })}
                                                                             </tbody>
                                                                          </table>
                                                                      </div>
                                                                   </td>
                                                                </tr>
                                                             )}
                                                          </React.Fragment>
                                                       )
                                                   })}
                                                </tbody>
                                             </table>

                                          </div>
                                       </td>
                                    </tr>
                                 )}
                              </React.Fragment>
                           );
                        })}

                        <tr className="bg-gray-50 print:bg-transparent border-t-4 border-gray-400 print:border-black font-black text-xl">
                           <td colSpan={3} className="p-4 text-right tracking-widest">TOTAL DEBIT / KREDIT</td>
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

         {/* Modal Pembesaran Gambar (Mengambang di Atas Segalanya) */}
         {previewImage && (
            <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
               <div className="absolute top-6 right-6 p-2 bg-red-600 bg-opacity-30 hover:bg-opacity-100 rounded-full cursor-pointer text-white transition-all shadow-lg ring-2 ring-white/10">
                  <X size={24} />
               </div>
               <img src={previewImage} alt="Preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5" onClick={(e) => e.stopPropagation()} onError={(e) => {
                  (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
               }} />
            </div>
         )}
      </div>
   );
}
