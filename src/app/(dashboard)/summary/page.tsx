'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Printer, ChevronDown, ChevronRight, AlertCircle, Layers, ZoomIn, Image as ImageIcon } from 'lucide-react';
import MonthRangePicker, { MonthRange } from '@/components/shared/MonthRangePicker';
import GalleryLightbox, { GalleryItem, getSafeImageUrl } from '@/components/shared/GalleryLightbox';

export default function SummaryPage() {
   const now = new Date();
   const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
   const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

   const [monthRange, setMonthRange] = useState<MonthRange>({
      startMonth: currentMonthStr,
      endMonth: currentMonthStr,
      startDate: `${currentMonthStr}-01`,
      endDate: `${currentMonthStr}-${String(lastDayCurrentMonth).padStart(2, '0')}`,
   });
   
   const [summaryData, setSummaryData] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // State Accordion
   const [expandedGroup2Digit, setExpandedGroup2Digit] = useState<string | null>(null);
   const [expandedGroupAkun, setExpandedGroupAkun] = useState<string | null>(null);

   // Gallery Lightbox State
   const [galleryState, setGalleryState] = useState<{
      isOpen: boolean;
      items: GalleryItem[];
      currentIndex: number;
      title: string;
      subtitle: string;
   }>({
      isOpen: false,
      items: [],
      currentIndex: 0,
      title: '',
      subtitle: '',
   });

   useEffect(() => {
      fetchSummary();
   }, [monthRange.startMonth, monthRange.endMonth]);

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
         
         const startD = monthRange.startDate || `${monthRange.startMonth}-01`;
         const endD = monthRange.endDate || `${monthRange.endMonth}-31`;

         // Filter Tanggal berdasarkan Rentang Bulan
         const currentMonthData = allTrx.filter(t => {
            if (!t.tanggal) return false;
            const tDate = String(t.tanggal).slice(0, 10);
            return tDate >= startD && tDate <= endD;
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

   // Helper untuk ekstraksi dan normalisasi seluruh berkas lampiran transaksi
   const getItemAttachments = (it: any): GalleryItem[] => {
      const res: GalleryItem[] = [];
      const addCategory = (label: string, fieldVal: string | null | undefined) => {
         if (!fieldVal) return;
         const links = String(fieldVal).split(',').map((s: string) => s.trim()).filter(Boolean);
         links.forEach((url) => {
            res.push({
               src: getSafeImageUrl(url),
               original: url,
               label,
            });
         });
      };

      addCategory('Nota / Kwitansi', it.nota_url || it.foto_nota);
      addCategory('Foto Kegiatan', it.foto_kegiatan);
      addCategory('Foto Barang', it.foto_barang);
      addCategory('Bukti Transfer Bank', it.foto_bukti_transfer);
      return res;
   };

   const totalMasuk = summaryData.reduce((acc, c) => acc + c.masuk, 0);
   const totalKeluar = summaryData.reduce((acc, c) => acc + c.keluar, 0);

   return (
      <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
         {/* SLIM & UNIFIED TOP TOOLBAR */}
         <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3">
               <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2.5 rounded-xl text-white shadow-xs">
                  <Layers size={20} />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                     <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                        Ringkasan Kas Kecil
                     </h1>
                     <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        {monthRange.startMonth === monthRange.endMonth 
                           ? `Bulan: ${monthRange.startMonth}` 
                           : `Periode: ${monthRange.startMonth} s/d ${monthRange.endMonth}`}
                     </span>
                  </div>
                  <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                     Ringkasan multi-level mutasi kas kecil per Induk 2-Digit dan Akun Anggaran.
                  </p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
               {/* 2. MonthRangePicker (Rentang Bulan Murni Standar Design System) */}
               <div className="w-full sm:w-auto">
                  <MonthRangePicker
                     label="Filter Periode Bulan"
                     value={monthRange}
                     onChange={setMonthRange}
                     align="right"
                  />
               </div>

               <button 
                  onClick={() => window.print()} 
                  className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
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
                   <p className="text-xs">Tidak ditemukan transaksi pada periode {monthRange.startMonth} s/d {monthRange.endMonth}</p>
               </div>
            ) : (
               <div>
                  <div className="hidden print:block text-center mb-6 border-b border-black pb-3">
                     <h1 className="text-xl font-black tracking-wider uppercase">Laporan Ringkasan Kas Kecil</h1>
                     <p className="text-xs">Periode: {monthRange.startMonth} s/d {monthRange.endMonth}</p>
                  </div>

                  <table className="w-full text-left border-collapse text-sm">
                     <thead className="bg-gray-100 text-gray-600 uppercase text-[10px] tracking-wider border-b border-gray-200">
                        <tr>
                           <th className="py-3 px-4 w-12 text-center">Detail</th>
                           <th className="py-3 px-4 w-28">Kode Akun</th>
                           <th className="py-3 px-4">Uraian Kategori Akun</th>
                           <th className="py-3 px-4 text-right">Total Debit (+)</th>
                           <th className="py-3 px-4 text-right">Total Kredit (-)</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 font-medium">
                        {summaryData.map(grp => {
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

                                                             {/* DATA ANAK LEVEL 3 (Tabel Transaksi & Foto Lampiran) */}
                                                             {isExpandAkun && (
                                                                <tr className="bg-blue-50/20">
                                                                   <td colSpan={5} className="p-0 border-b border-blue-200">
                                                                      <div className="px-6 md:px-12 py-4 animate-in slide-in-from-top-1 fade-in duration-150">
                                                                          <table className="w-full text-left text-xs bg-white rounded-xl shadow-xs border border-blue-100 overflow-hidden">
                                                                             <thead className="bg-blue-50/50">
                                                                                <tr className="text-gray-500 uppercase tracking-widest border-b border-blue-100">
                                                                                   <th className="p-3 w-28">Tanggal</th>
                                                                                   <th className="p-3 w-56">Uraian Transaksi</th>
                                                                                   <th className="p-3 w-32">Kreator / Toko</th>
                                                                                   <th className="p-3 w-44 text-center">Foto Lampiran</th>
                                                                                   <th className="p-3 text-right font-bold w-32">Nominal Rp</th>
                                                                                </tr>
                                                                             </thead>
                                                                             <tbody className="divide-y divide-gray-50">
                                                                                {sub.items.map((it: any) => {
                                                                                   const isT_Masuk = Number(it.uang_masuk) > 0;
                                                                                   const valNom = isT_Masuk ? it.uang_masuk : it.uang_keluar;
                                                                                   const attachments = getItemAttachments(it);

                                                                                   return (
                                                                                      <tr key={it.id} className="hover:bg-blue-50/30">
                                                                                         <td className="p-3 text-gray-500 whitespace-nowrap font-mono">{it.tanggal}</td>
                                                                                         <td className="p-3 font-bold text-gray-800 leading-snug">{it.uraian}</td>
                                                                                         <td className="p-3 text-[10px] text-gray-500 leading-tight">
                                                                                            <span className="font-bold text-gray-700">{it.ref_personel?.nama_orang || '?'}</span><br/>
                                                                                            {it.toko || '-'}
                                                                                         </td>
                                                                                         <td className="p-3 text-center">
                                                                                            <div className="flex flex-wrap gap-1.5 justify-center max-w-[150px] mx-auto">
                                                                                               {attachments.length === 0 ? (
                                                                                                  <span className="text-[10px] italic text-gray-300">- Kosong -</span>
                                                                                               ) : (
                                                                                                  attachments.map((att, ii) => (
                                                                                                     <div 
                                                                                                         key={ii}
                                                                                                         onClick={(e) => { 
                                                                                                            e.stopPropagation(); 
                                                                                                            setGalleryState({
                                                                                                               isOpen: true,
                                                                                                               items: attachments,
                                                                                                               currentIndex: ii,
                                                                                                               title: it.uraian || 'Lampiran Transaksi',
                                                                                                               subtitle: `Rp ${Number(valNom).toLocaleString('id-ID')} • ${it.tanggal || '-'}`
                                                                                                            });
                                                                                                         }}
                                                                                                         className="group relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200/90 hover:border-indigo-500 shadow-2xs hover:shadow-xs cursor-pointer transition-all bg-gray-50 flex items-center justify-center shrink-0"
                                                                                                         title={`${att.label} - Klik pratinjau resolusi tinggi`}
                                                                                                     >
                                                                                                        <img 
                                                                                                           src={att.src} 
                                                                                                           alt={att.label}
                                                                                                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" 
                                                                                                           onError={(e) => {
                                                                                                              const target = e.target as HTMLImageElement;
                                                                                                              if (!target.src.includes('/api/image-cors') && att.original.startsWith('http')) {
                                                                                                                 target.src = `/api/image-cors?url=${encodeURIComponent(att.original)}`;
                                                                                                              }
                                                                                                           }}
                                                                                                        />
                                                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors">
                                                                                                           <ZoomIn size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                                                        </div>
                                                                                                     </div>
                                                                                                  ))
                                                                                               )}
                                                                                            </div>
                                                                                         </td>
                                                                                         <td className={`p-3 text-right font-black ${isT_Masuk ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                                            {Number(valNom).toLocaleString('id-ID')}
                                                                                         </td>
                                                                                      </tr>
                                                                                   );
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

         {/* Standard Gallery Lightbox untuk Pratinjau Resolusi Tinggi Foto Lampiran */}
         <GalleryLightbox
            isOpen={galleryState.isOpen}
            items={galleryState.items}
            currentIndex={galleryState.currentIndex}
            title={galleryState.title}
            subtitle={galleryState.subtitle}
            onClose={() => setGalleryState(prev => ({ ...prev, isOpen: false }))}
            onIndexChange={(idx) => setGalleryState(prev => ({ ...prev, currentIndex: idx }))}
         />
      </div>
   );
}
