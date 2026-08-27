'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Printer, Loader2, Calendar } from 'lucide-react';

const CompressedImage = ({ src, alt, className, style }: any) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    if (src.includes('drive.google.com/thumbnail')) {
      setDataUrl(src);
      return;
    }

    const proxyUrl = `/api/image-cors?url=${encodeURIComponent(src)}`;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        setDataUrl(canvas.toDataURL('image/jpeg', 0.4));
      }
    };
    img.onerror = () => {
       setDataUrl(src);
    };
    img.src = proxyUrl;
  }, [src]);

  if (!dataUrl) {
    return <div className="h-20 w-16 flex items-center justify-center bg-gray-50"><Loader2 size={16} className="animate-spin text-gray-300"/></div>;
  }

  return <img src={dataUrl} alt={alt} className={className} style={style} />;
};

export default function ReportPhotoPage() {
   const d = new Date();
   const defaultDate = d.toISOString().split('T')[0];
   const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
   
   const [tglAwal, setTglAwal] = useState(firstDayOfMonth);
   const [tglAkhir, setTglAkhir] = useState(defaultDate);
   const [showUangMasuk, setShowUangMasuk] = useState(false);
   
   const [transactions, setTransactions] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchReport();
   }, []);

   const fetchReport = async () => {
      setLoading(true);
      try {
         // Konversi tanggal WIB ke UTC murni:
         // WIB = UTC+7, jadi 00:00 WIB = 17:00 UTC hari sebelumnya
         // dan 23:59:59 WIB = 16:59:59 UTC hari yang sama
         const toUtcStart = (dateStr: string) => {
           // dateStr = 'YYYY-MM-DD' dalam WIB
           // 00:00:00 WIB = tanggal kemarin jam 17:00:00 UTC
           const d = new Date(`${dateStr}T00:00:00`);
           d.setHours(d.getHours() - 7); // kurangi 7 jam untuk dapat UTC
           return d.toISOString();
         };
         const toUtcEnd = (dateStr: string) => {
           // 23:59:59 WIB = hari yang sama jam 16:59:59 UTC
           const d = new Date(`${dateStr}T23:59:59`);
           d.setHours(d.getHours() - 7);
           return d.toISOString();
         };

         const { data, error } = await supabase
               .from('transactions')
               .select('*, ref_akun!inner(nomor_akun, nama_akun), ref_personel(nama_orang)')
               .eq('disetujui', 'Disetujui')
               .gte('tanggal_disetujui', toUtcStart(tglAwal))
               .lte('tanggal_disetujui', toUtcEnd(tglAkhir))
               .order('tanggal_disetujui', { ascending: true });

         if (error) throw error;
         setTransactions(data || []);
      } catch (err) {
         console.error("Gagal menarik data", err);
      } finally {
         setLoading(false);
      }
   };

   // Mengelompokkan data untuk Rekap Atas
   let totalAll = 0;
   const rekapMap: { [akun: string]: { nama: string, trx: number, total: number } } = {};

   transactions.forEach(t => {
       const isPemasukan = Number(t.uang_masuk) > 0;
       if (isPemasukan && !showUangMasuk) return; // Skip uang masuk jika checkbox tidak dicentang

       const nominal = isPemasukan ? Number(t.uang_masuk) : Number(t.uang_keluar);
       const akunKey = t.ref_akun ? t.ref_akun.nomor_akun : '99999.00';
       const akunNama = t.ref_akun ? t.ref_akun.nama_akun : 'Tanpa Akun';

       if (!rekapMap[akunKey]) {
          rekapMap[akunKey] = { nama: akunNama, trx: 0, total: 0 };
       }
       rekapMap[akunKey].trx += 1;
       rekapMap[akunKey].total += nominal;
       totalAll += nominal;
   });

   const rekapArray = Object.keys(rekapMap).map(k => ({
       kode: k,
       ...rekapMap[k]
   })).sort((a, b) => a.kode.localeCompare(b.kode));

   const filteredTransactions = transactions.filter(t => showUangMasuk || Number(t.uang_masuk) <= 0);
   const totalTrxAll = filteredTransactions.length;

    const renderFotoKecil = (teks: string | null) => {
       if (!teks) return null;
       const links = teks.split(',').map(s => s.trim()).filter(Boolean);
       return links.map((lnk, idx) => {
            let imgSrc = lnk;
            const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
            if (gdriveMatch && gdriveMatch[1]) {
               imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w200`;
            }
            
            return (
               <div key={idx} className="border border-gray-200 shadow-sm bg-white p-0.5 rounded inline-block mx-1 mb-2 overflow-hidden">
                  <CompressedImage 
                     src={imgSrc} 
                     alt="Lampiran" 
                     className="max-w-full" 
                     style={{ height: '140px', width: 'auto', objectFit: 'contain', imageRendering: '-webkit-optimize-contrast' }}
                  />
               </div>
            );
       });
    };

   return (
      <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
         {/* SLIM & UNIFIED TOP TOOLBAR */}
         <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3">
               <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
                  <FileText size={20} />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                     <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                        Pengajuan & Bukti Kas Kecil
                     </h1>
                     <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        {totalTrxAll} Transaksi
                     </span>
                  </div>
                  <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                     Filter tanggal disetujui (ACC) untuk mencetak arsip pengajuan kas fisik berlampiran foto.
                  </p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
               <input 
                  type="date" 
                  value={tglAwal} 
                  onChange={e => setTglAwal(e.target.value)} 
                  className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none" 
               />
               <span className="text-gray-400 font-bold text-xs">s/d</span>
               <input 
                  type="date" 
                  value={tglAkhir} 
                  onChange={e => setTglAkhir(e.target.value)} 
                  className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none" 
               />
               <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer select-none bg-gray-50 border border-gray-200 px-2.5 h-9 rounded-xl">
                  <input 
                     type="checkbox" 
                     checked={showUangMasuk} 
                     onChange={e => setShowUangMasuk(e.target.checked)} 
                     className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span>Uang Masuk</span>
               </label>
               <button 
                  onClick={fetchReport} 
                  className="h-9 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all active:scale-95"
               >
                  Filter
               </button>
               <button 
                  onClick={() => {
                     const originalTitle = document.title;
                     document.title = `pengajuan kas kecil ${tglAwal.replace(/-/g, '_')}`;
                     window.print();
                     setTimeout(() => { document.title = originalTitle; }, 1000);
                  }} 
                  className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
               >
                  <Printer size={13}/>
                  <span>Cetak PDF</span>
               </button>
            </div>
         </div>

         {/* ARENA CETAK */}
         <div className="bg-white rounded-2xl print:rounded-none shadow-xs border border-gray-200/80 p-6 md:p-8 print:p-0 min-h-[500px] text-xs text-gray-900 print:text-black">
            {loading ? (
               <div className="h-48 flex flex-col items-center justify-center text-indigo-600">
                  <Loader2 size={32} className="animate-spin mb-2 text-indigo-500"/>
                  <p className="text-xs font-medium text-gray-500">Menyiapkan cetakan berkas fisik...</p>
               </div>
            ) : transactions.length === 0 ? (
               <div className="text-center py-16 text-gray-400 font-medium print:hidden">Tidak ada transaksi yang disetujui pada rentang tanggal tersebut.</div>
            ) : (
               <div className="space-y-6">
                  {/* Kop Kepala / Judul PDF */}
                  <div className="mb-6">
                     <h1 className="text-2xl font-black mb-2">Penggunaan Kas</h1>
                     <p className="text-xs text-gray-600">
                        Periode Filter ACC: <strong>{new Date(tglAwal).toLocaleDateString('id-ID')} s/d {new Date(tglAkhir).toLocaleDateString('id-ID')}</strong><br/>
                        Total Transaksi: {totalTrxAll}
                     </p>
                  </div>

                  {/* TABEL REKAPITULASI (Mockup Kas Kecil) */}
                  <div className="border border-gray-300 rounded overflow-hidden">
                     <div className="bg-gray-100 font-bold p-3 border-b border-gray-300">
                        REKAP PENGGUNAAN KAS
                     </div>
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-gray-300 bg-gray-50 text-xs">
                              <th className="p-3 border-r border-gray-300">NoAkun — Nama Akun</th>
                              <th className="p-3 border-r border-gray-300 text-center">Trx</th>
                              <th className="p-3 border-r border-gray-300 text-right">Total</th>
                              <th className="p-3 text-right">%</th>
                           </tr>
                        </thead>
                        <tbody>
                           {rekapArray.map((r, i) => (
                              <tr key={i} className="border-b border-gray-200">
                                 <td className="p-3 border-r border-gray-300 font-bold text-[13px]">{r.kode} — {r.nama}</td>
                                 <td className="p-3 border-r border-gray-300 text-center font-bold text-[13px]">{r.trx}</td>
                                 <td className="p-3 border-r border-gray-300 text-right font-bold text-[13px]">{r.total.toLocaleString('id-ID')}</td>
                                 <td className="p-3 text-right text-[13px]">{(totalAll > 0 ? (r.total / totalAll * 100).toFixed(2) : 0)}%</td>
                              </tr>
                           ))}
                           <tr className="bg-gray-100 font-black">
                              <td className="p-3 border-r border-gray-300 tracking-widest">TOTAL KESELURUHAN</td>
                              <td className="p-3 border-r border-gray-300 text-center">{totalTrxAll}</td>
                              <td className="p-3 border-r border-gray-300 text-right">{totalAll.toLocaleString('id-ID')}</td>
                              <td className="p-3 text-right">100,00%</td>
                           </tr>
                        </tbody>
                     </table>
                  </div>

                  {/* TABEL DETAIL FISIK FOTO */}
                  <div className="border border-gray-300 mt-8 rounded overflow-hidden break-before-page">
                     <div className="bg-gray-100 font-bold p-3 border-b border-gray-300">
                        DETAIL PENGGUNAAN & BUKTI LAMPIRAN
                     </div>
                     <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                           <tr className="border-b border-gray-300 bg-gray-50 text-xs leading-tight">
                              <th className="p-3 border-r border-gray-300 w-[12%] text-center">Tanggal</th>
                              <th className="p-3 border-r border-gray-300 w-[73%]">Detail (Akun + Uraian + Toko/Penerima + Dibelanjakan + Lampiran)</th>
                              <th className="p-3 text-right w-[15%]">Total Nominal</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredTransactions.map((trx, i) => {
                              const isPemasukan = Number(trx.uang_masuk) > 0;
                              const nominal = isPemasukan ? trx.uang_masuk : trx.uang_keluar;
                              const akunKey = trx.ref_akun ? trx.ref_akun.nomor_akun : '99999.00';
                              const akunNama = trx.ref_akun ? trx.ref_akun.nama_akun : 'Tanpa Akun';

                              return (
                                 <tr key={i} className="border-b border-gray-300 align-top break-inside-avoid">
                                    <td className="p-3 border-r border-gray-300 font-black text-[13px] text-center">
                                       {new Date(trx.tanggal_disetujui).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\//g, '-')}
                                    </td>
                                    <td className="p-4 border-r border-gray-300">
                                       <div className="mb-4">
                                          <p className="font-black text-[14px] leading-snug">{akunKey} — {akunNama}</p>
                                          <p className="text-[13px] text-gray-800 leading-relaxed font-bold mt-1">{trx.uraian}</p>
                                          <p className="text-[12px] text-gray-600 mt-1 uppercase tracking-tight">Toko/Penerima/Subjek: <span className="font-bold">{trx.toko || '-'}</span></p>
                                          <p className="text-[12px] text-gray-500 italic mt-0.5">Dibelanjakan / Diinput oleh: {trx.ref_personel?.nama_orang || '-'}</p>
                                       </div>
                                       
                                       {/* Kontainer Foto Rapat/Compact sesuai request */}
                                       <div className="flex flex-wrap gap-2 shrink-0">
                                          {renderFotoKecil(trx.foto_nota)}
                                          {renderFotoKecil(trx.foto_kegiatan)}
                                          {renderFotoKecil(trx.foto_barang)}
                                          {renderFotoKecil(trx.foto_bukti_transfer)}
                                       </div>
                                    </td>
                                    <td className="p-4 text-right font-black text-[14px]">
                                       {Number(nominal).toLocaleString('id-ID')}
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>

               </div>
            )}
         </div>
      </div>
   );
}
