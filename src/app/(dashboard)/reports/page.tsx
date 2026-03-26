'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper: Nama Bulan
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function ReportsPage() {
  const tglSekarang = new Date();
  const [bulanPilih, setBulanPilih] = useState(tglSekarang.getMonth() + 1);
  const [tahunPilih, setTahunPilih] = useState(tglSekarang.getFullYear());
  
  const [dataStats, setDataStats] = useState({ income: 0, expense: 0, balance: 0, initialBalance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Menyimpan state row yang di-expand untuk melihat lampiran
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string, original: string } | null>(null);


  useEffect(() => {
     fetchReport();
  }, [bulanPilih, tahunPilih]);

  const fetchReport = async () => {
     setLoading(true);
     try {
        // Ambil SEMUA transaksi melebih batas 1000 row bawaan Supabase
        let allTrx: any[] = [];
        let isSelesai = false;
        let ambilMulai = 0;
        const batasAmbil = 1000;

        while (!isSelesai) {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    ref_akun(nama_akun),
                    ref_personel(nama_orang)
                `)
                .neq('disetujui', 'Ditolak')
                .order('tanggal', { ascending: true })
                .order('id', { ascending: true })

                .range(ambilMulai, ambilMulai + batasAmbil - 1);

                
            if (error) throw error;
            
            if (data && data.length > 0) {
                allTrx = [...allTrx, ...data];
                // Jika data yang didapat lebih sedikit dari 1000, berarti sudah di ujung
                if (data.length < batasAmbil) isSelesai = true;
                else ambilMulai += batasAmbil;
            } else {
                isSelesai = true;
            }
        }

        if (allTrx.length === 0) return;

        // Tentukan batas waktu filter
        let berjalan = 0; // Saldo global dimulai dari 0
        let totalIncomeBulanIni = 0;
        let totalExpenseBulanIni = 0;
        let saldoAwalBulan = 0;

        // Proses kalkulasi per baris (Running Balance & Saldo Awal)
        const processedTrx = allTrx.map(trx => {
           let mas = Number(trx.uang_masuk) || 0;
           let kel = Number(trx.uang_keluar) || 0;
           
           // Parsing tanggal yang kebal (mendukung teks maupun timestamp)
           const trxDate = new Date(trx.tanggal);
           const tTahun = trxDate.getFullYear();
           const tBulan = trxDate.getMonth() + 1;

           // Cek apakah transaksi ini sebelum bulan dan tahun yang dipilih
           const isBeforeTargetMonth = tTahun < tahunPilih || (tTahun === tahunPilih && tBulan < bulanPilih);
           
           if (isBeforeTargetMonth) {
              saldoAwalBulan = berjalan + mas - kel; // Timpa terus saldo hingga mentok pas di akhir bulan lalu
           }

           berjalan += mas - kel;
           
           return { ...trx, _saldo_berjalan: berjalan, _tahun: tTahun, _bulan: tBulan };
        });

        // Saring transaksi HANYA JIKA Tahun & Bulannya sama dengan pilihan Filter
        const filtered = processedTrx.filter(t => t._tahun === tahunPilih && t._bulan === bulanPilih);
        
        filtered.forEach(t => {
           totalIncomeBulanIni += (Number(t.uang_masuk) || 0);

           totalExpenseBulanIni += (Number(t.uang_keluar) || 0);
        });

        setDataStats({ 
            income: totalIncomeBulanIni, 
            expense: totalExpenseBulanIni, 
            balance: totalIncomeBulanIni - totalExpenseBulanIni,
            initialBalance: saldoAwalBulan 
        });
        
        setTransactions([...filtered].reverse());

     } catch (err) {
        console.error("Gagal menarik laporan", err);
     } finally {
        setLoading(false);
     }
  };

  const renderLampiranLinks = (teks: string | null) => {
      if (!teks) return <span className="text-gray-400 italic text-xs font-medium bg-gray-100/50 px-2 py-1 rounded">Tidak ada foto</span>;
      const links = teks.split(',').map(s => s.trim()).filter(s => s);
      
      return links.map((lnk, idx) => {
         // Deteksi Google Drive URL
         let imgSrc = lnk;
         let originalLink = lnk;
         let isGDrive = false;
         
         const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
         if (gdriveMatch && gdriveMatch[1]) {
             isGDrive = true;
             // Menggunakan API Thumbnail Rahasia Google Drive (Lebih aman dari CORS dan limit ukuran)
             imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w800`;
         }

         return (
            <div key={idx} className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-indigo-100 hover:border-indigo-500 transition-all shadow-sm bg-gray-50 flex items-center justify-center p-1 w-full max-w-[200px]" style={{ aspectRatio: '3/2' }} onClick={() => setPreviewImage({ src: imgSrc, original: originalLink })}>
               
               {/* Gambar asli */}
               <img src={imgSrc} alt="Bukti" className="w-full h-full object-contain rounded-lg" onError={(e) => { 
                  // Jika gambar Google Drive gagal karena limitasi / private, tampilkan logo link
                  (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                  (e.target as HTMLImageElement).className = 'w-10 h-10 object-contain mx-auto opacity-50';
               }} />

               <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white font-bold text-[10px] backdrop-blur-sm z-10 rounded-xl">
                  <span className="bg-white/20 p-1.5 rounded-full mb-1">🔍</span>
                  Perbesar
               </div>
               
               {isGDrive && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] px-2 font-bold rounded-bl-xl z-0 shadow-sm">GDRIVE</div>
               )}
            </div>
         );
      });

  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
         <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
               <PieChart size={28} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-gray-900">Buku Kas (Laporan)</h2>
            </div>
         </div>
         <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Filter Bulan dan Tahun */}
            <select value={bulanPilih} onChange={(e) => setBulanPilih(Number(e.target.value))} className="px-4 py-2 border rounded-xl font-bold bg-gray-50 outline-none">
               {BULAN.map((b, i) => <option key={i} value={i+1}>{b}</option>)}
            </select>
            <input type="number" value={tahunPilih} onChange={(e) => setTahunPilih(Number(e.target.value))} className="px-4 py-2 border w-24 rounded-xl font-bold bg-gray-50 outline-none" min={2000} max={2100} />
            
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-md font-bold text-sm ml-auto print:hidden hover:bg-indigo-700 transition-colors">
               <Download size={16} /> Cetak & Download PDF
            </button>
         </div>
      </div>


      {loading ? (
         <div className="h-64 flex flex-col items-center justify-center text-indigo-600">
            <Loader2 size={40} className="animate-spin mb-4" />
         </div>
      ) : (
         <>
            {/* Statistik Atas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <p className="text-gray-400 font-bold text-[10px] uppercase mb-1">Saldo Awal Bulan</p>
                  <h3 className="text-xl font-black text-gray-700">Rp {dataStats.initialBalance.toLocaleString('id-ID')}</h3>
               </div>
               <div className="bg-emerald-50 p-5 rounded-3xl shadow-sm">
                  <p className="text-emerald-700/70 font-bold text-[10px] uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Pemasukan Bulan Ini</p>
                  <h3 className="text-xl font-black text-emerald-700">Rp {dataStats.income.toLocaleString('id-ID')}</h3>
               </div>
               <div className="bg-red-50 p-5 rounded-3xl shadow-sm">
                  <p className="text-red-700/70 font-bold text-[10px] uppercase mb-1 flex items-center gap-1"><TrendingDown size={12}/> Pengeluaran Bulan Ini</p>
                  <h3 className="text-xl font-black text-red-700">Rp {dataStats.expense.toLocaleString('id-ID')}</h3>
               </div>
               <div className="bg-indigo-600 p-5 rounded-3xl shadow-sm text-white">
                  <p className="text-indigo-200 font-bold text-[10px] uppercase mb-1">Sisa Kas Akhir Bulan Ini</p>
                  <h3 className="text-xl font-black">Rp {(dataStats.initialBalance + dataStats.balance).toLocaleString('id-ID')}</h3>
               </div>
            </div>

            {/* Tabel Detail Transaksi Tembus Pandang */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                     <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                        <tr>
                           <th className="p-4 w-10">Id</th>
                           <th className="p-4 w-24">Tanggal</th>
                           <th className="p-4 w-1/3">Uraian & Keterangan</th>
                           <th className="p-4 text-right">Nominal (Rupiah)</th>
                           <th className="p-4 text-right bg-indigo-50/50">Saldo Berjalan</th>
                           <th className="p-4 text-center print:hidden">Aksi / Foto</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {transactions.length === 0 ? (
                           <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-medium">Bulan ini belum ada transaksi tercatat.</td></tr>
                        ) : transactions.map((trx, idx) => {
                           const isExpanded = expandedRow === trx.id;
                           const isPemasukan = Number(trx.uang_masuk) > 0;
                           const nominal = isPemasukan ? Number(trx.uang_masuk) : Number(trx.uang_keluar);
                           
                           // Pengecekan status untuk warna tabel
                           const isSah = trx.disetujui === 'Disetujui';
                           const rowBgClass = isSah 
                               ? 'hover:bg-gray-50' 
                               : 'bg-red-50/40 hover:bg-red-50'; // Background merah tipis untuk yang belum sah

                           return (
                              <React.Fragment key={trx.id}>
                                 <tr className={`transition-colors group ${rowBgClass}`}>
                                    <td className="p-4 text-gray-400 font-medium text-xs whitespace-nowrap">{trx.id}</td>
                                    <td className="p-4 whitespace-nowrap font-medium">{new Date(trx.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td className="p-4">
                                       <div className="flex items-center gap-2">
                                          <p className={`font-bold ${isSah ? 'text-gray-900' : 'text-red-900'}`}>{trx.uraian}</p>
                                          {!isSah && <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase shadow-sm animate-pulse">{trx.disetujui || 'Menunggu'}</span>}
                                       </div>
                                       <p className="text-[10px] text-gray-500 flex gap-2 mt-1 flex-wrap">
                                          <span className="bg-gray-100 px-2 py-0.5 rounded">🧑 {trx.ref_personel?.nama_orang || '?'}</span>
                                          <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">🏷️ {trx.ref_akun?.nama_akun || '?'}</span>
                                          <span className="bg-gray-100 px-2 py-0.5 rounded">🛒 {trx.toko || 'Tanpa Toko'}</span>
                                       </p>
                                    </td>

                                    <td className="p-4 text-right font-black">
                                       <span className={`px-2 py-1 rounded-lg text-xs ${isPemasukan ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                          {isPemasukan ? '+' : '-'} Rp {nominal.toLocaleString('id-ID')}
                                       </span>
                                    </td>
                                    <td className="p-4 text-right font-black text-indigo-700 bg-indigo-50/20 whitespace-nowrap">
                                       Rp {trx._saldo_berjalan.toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-4 text-center print:hidden pb-4">
                                       <button onClick={() => setExpandedRow(isExpanded ? null : trx.id)} className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 mx-auto transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} mb-1`}>
                                          FOTO {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                       </button>
                                       {((trx.foto_nota || trx.foto_kegiatan || trx.foto_barang || trx.foto_bukti_transfer) && !isExpanded) && (
                                          <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full mt-1">Ada Foto</span>
                                       )}
                                    </td>
                                 </tr>

                                 
                                 {/* Panel Collapsible untuk melihat Foto/Lampiran */}
                                 {isExpanded && (
                                    <tr className="bg-gray-50 border-t-0 shadow-inner print:hidden">
                                       <td colSpan={6} className="p-4">
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-white rounded-2xl border border-gray-200">

                                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 border-b pb-2">Lampiran Nota</p>
                                                <div className="flex flex-wrap gap-2">{renderLampiranLinks(trx.foto_nota)}</div>
                                             </div>
                                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 border-b pb-2">Lampiran Kegiatan</p>
                                                <div className="flex flex-wrap gap-2">{renderLampiranLinks(trx.foto_kegiatan)}</div>
                                             </div>
                                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 border-b pb-2">Lampiran Barang</p>
                                                <div className="flex flex-wrap gap-2">{renderLampiranLinks(trx.foto_barang)}</div>
                                             </div>
                                             <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-3 border-b pb-2">Bukti Transfer</p>
                                                <div className="flex flex-wrap gap-2">{renderLampiranLinks(trx.foto_bukti_transfer)}</div>
                                             </div>
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
            </div>
         </>
      )}

      {/* Modal Gambar Layar Penuh */}
      {previewImage && (
         <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-red-500 p-3 rounded-full transition-colors font-bold group">
               X
            </button>
            <p className="absolute top-6 left-6 text-white font-bold bg-black/50 px-4 py-2 rounded-xl">Klik di mana saja untuk menutup</p>
            <div className="relative max-w-full max-h-[85vh] flex justify-center w-full">
               <img src={previewImage.src} alt="Preview Bukti" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-4 ring-white/10" onClick={(e) => e.stopPropagation()} onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                  (e.target as HTMLImageElement).className = 'max-w-[200px] opacity-30 mx-auto';
               }} />
            </div>
            
            <a href={previewImage.original} target="_blank" rel="noreferrer" className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
               🔗 Klik Di Sini Jika Foto Blur / Google Drive Asli
            </a>

         </div>
      )}

    </div>
  );
}
