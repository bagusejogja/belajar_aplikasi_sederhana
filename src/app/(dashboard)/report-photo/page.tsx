'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Printer, Loader2, Calendar } from 'lucide-react';

export default function ReportPhotoPage() {
   const d = new Date();
   const defaultDate = d.toISOString().split('T')[0];
   const firstDayOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
   
   const [tglAwal, setTglAwal] = useState(firstDayOfMonth);
   const [tglAkhir, setTglAkhir] = useState(defaultDate);
   
   const [transactions, setTransactions] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchReport();
   }, []);

   const fetchReport = async () => {
      setLoading(true);
      try {
         const { data, error } = await supabase
               .from('transactions')
               .select('*, ref_akun!inner(nomor_akun, nama_akun), ref_personel(nama_orang)')
               .eq('disetujui', 'Disetujui')
               .gte('tanggal_disetujui', tglAwal)
               .lte('tanggal_disetujui', tglAkhir)
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

   const totalTrxAll = transactions.length;

   const renderFotoKecil = (teks: string | null) => {
      if (!teks) return null;
      const links = teks.split(',').map(s => s.trim()).filter(Boolean);
      return links.map((lnk, idx) => {
          let imgSrc = lnk;
          const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
          if (gdriveMatch && gdriveMatch[1]) {
             imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w600`;
          }
          return (
             <div key={idx} className="border border-gray-200 shadow-sm bg-white p-1 rounded inline-block mx-1 mb-2">
                <img src={imgSrc} alt="Lampiran" className="h-40 w-auto object-contain max-w-full" onError={(e) => { 
                   (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                }} />
             </div>
          );
      });
   };

   return (
      <div className="space-y-6 max-w-5xl mx-auto">
         {/* KONTROL PANEL (Sembunyi saat Print PDF) */}
         <div className="print:hidden bg-indigo-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><FileText size={32}/> Cetak Bukti Fisik</h2>
               <p className="text-indigo-100 font-medium text-sm">Filter <strong>TANGGAL DISETUJUI (ACC)</strong> untuk mengunci laporan akhir.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center bg-white/10 p-4 rounded-2xl w-full md:w-auto backdrop-blur-sm">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Mulai:</span>
                  <input type="date" value={tglAwal} onChange={e => setTglAwal(e.target.value)} className="bg-white text-indigo-900 border-0 font-bold rounded-xl outline-none p-2 text-sm" />
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Sampai:</span>
                  <input type="date" value={tglAkhir} onChange={e => setTglAkhir(e.target.value)} className="bg-white text-indigo-900 border-0 font-bold rounded-xl outline-none p-2 text-sm" />
               </div>
               
               <button onClick={fetchReport} className="bg-amber-500 text-white hover:bg-amber-600 px-4 py-2.5 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md">
                  BUAT LAPORAN
               </button>
               <button onClick={() => window.print()} className="bg-white text-indigo-600 hover:bg-gray-100 px-4 py-2.5 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md">
                  <Printer size={18}/> PDF
               </button>
            </div>
         </div>

         {/* ARENA CETAK (Print Area) */}
         <div className="bg-white p-8 print:p-0 min-h-[500px] text-sm text-gray-900 print:text-black">
            {loading ? (
               <div className="h-full flex items-center justify-center print:hidden"><Loader2 size={40} className="animate-spin text-indigo-600"/></div>
            ) : transactions.length === 0 ? (
               <div className="text-center py-20 text-gray-400 font-bold print:hidden">Tidak ada transaksi yang di-ACC pada rentang tanggal tersebut.</div>
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
                           {transactions.map((trx, i) => {
                              const isPemasukan = Number(trx.uang_masuk) > 0;
                              const nominal = isPemasukan ? trx.uang_masuk : trx.uang_keluar;
                              const akunKey = trx.ref_akun ? trx.ref_akun.nomor_akun : '99999.00';
                              const akunNama = trx.ref_akun ? trx.ref_akun.nama_akun : 'Tanpa Akun';

                              return (
                                 <tr key={i} className="border-b border-gray-300 align-top break-inside-avoid">
                                    <td className="p-3 border-r border-gray-300 font-black text-[13px] text-center">
                                       {new Date(trx.tanggal_disetujui).toLocaleDateString('id-ID').replace(/\//g, '-')}
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
