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

  const renderLampiranLinks = (label: string, teks: string | null) => {
      if (!teks) return null;
      const links = teks.split(',').map(s => s.trim()).filter(s => s);
      
      return (
         <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs font-black text-gray-500 mb-4">{label}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {links.map((lnk, idx) => {
                   let imgSrc = lnk;
                   const isGDrive = lnk.match(/drive\.google\.com/);
                   const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
                   
                   if (gdriveMatch && gdriveMatch[1]) {
                      imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w800`;
                   }

                   return (
                      <div key={idx} className="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 hover:border-indigo-500 transition-all shadow-sm bg-gray-50 flex items-center justify-center aspect-[4/3] w-full" onClick={() => setPreviewImage({ src: imgSrc, original: lnk })}>
                         
                         <img src={imgSrc} alt="Bukti" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { 
                            (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                            (e.target as HTMLImageElement).className = 'w-16 h-16 object-contain mx-auto opacity-50';
                         }} />

                         <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-sm backdrop-blur-sm z-10">
                            🔍 Perbesar
                         </div>
                         
                         {isGDrive && (
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-3 py-1 font-black rounded-bl-xl z-0 shadow-sm">GDRIVE</div>
                         )}
                      </div>
                   );
               })}
            </div>
         </div>
      );
  };



  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <PieChart size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Mutasi Detail Kas Kecil
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {BULAN[bulanPilih - 1]} {tahunPilih}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Rincian mutasi kas kecil harian, saldo berjalan, dan verifikasi bukti nota.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select 
            value={bulanPilih} 
            onChange={(e) => setBulanPilih(Number(e.target.value))} 
            className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer"
          >
            {BULAN.map((b, i) => <option key={i} value={i+1}>{b}</option>)}
          </select>
          <input 
            type="number" 
            value={tahunPilih} 
            onChange={(e) => setTahunPilih(Number(e.target.value))} 
            className="h-9 px-3 border border-gray-200 w-20 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none" 
            min={2000} 
            max={2100} 
          />
          <button 
            onClick={() => window.print()} 
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 print:hidden"
          >
            <Download size={13} />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
         <div className="h-64 flex flex-col items-center justify-center text-indigo-600">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p className="text-xs font-medium text-gray-500">Memuat laporan kas kecil...</p>
         </div>
      ) : (
         <>
            {/* STATISTIK KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
               <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Saldo Awal Bulan</p>
                     <p className="text-lg font-black text-gray-900 leading-none">Rp {dataStats.initialBalance.toLocaleString('id-ID')}</p>
                     <p className="text-[10px] text-gray-500 font-semibold">1 {BULAN[bulanPilih - 1]} {tahunPilih}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600">
                     <PieChart size={18} />
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Pemasukan Bulan Ini</p>
                     <p className="text-lg font-black text-emerald-700 leading-none">Rp {dataStats.income.toLocaleString('id-ID')}</p>
                     <p className="text-[10px] text-gray-500 font-semibold">Total Debit (+)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                     <TrendingUp size={18} />
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Pengeluaran Bulan Ini</p>
                     <p className="text-lg font-black text-rose-700 leading-none">Rp {dataStats.expense.toLocaleString('id-ID')}</p>
                     <p className="text-[10px] text-gray-500 font-semibold">Total Kredit (-)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                     <TrendingDown size={18} />
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Sisa Kas Akhir Bulan</p>
                     <p className="text-lg font-black text-indigo-700 leading-none">Rp {(dataStats.initialBalance + dataStats.balance).toLocaleString('id-ID')}</p>
                     <p className="text-[10px] text-gray-500 font-semibold">Posisi Saldo Berjalan</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                     <PieChart size={18} />
                  </div>
               </div>
            </div>

            {/* TABEL DETAIL TRANSAKSI */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                     <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                        <tr>
                           <th className="py-3 px-4 w-12 text-center">ID</th>
                           <th className="py-3 px-4 w-28">Tanggal</th>
                           <th className="py-3 px-4">Uraian & Keterangan</th>
                           <th className="py-3 px-4 text-right">Nominal</th>
                           <th className="py-3 px-4 text-right bg-indigo-50/50">Saldo Berjalan</th>
                           <th className="py-3 px-4 text-center print:hidden">Aksi / Foto</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 font-medium">
                        {transactions.length === 0 ? (
                           <tr><td colSpan={6} className="py-12 text-center text-gray-400 font-medium">Bulan ini belum ada transaksi tercatat.</td></tr>
                        ) : transactions.map((trx) => {
                           const isExpanded = expandedRow === trx.id;
                           const isPemasukan = Number(trx.uang_masuk) > 0;
                           const nominal = isPemasukan ? Number(trx.uang_masuk) : Number(trx.uang_keluar);
                           
                           const isSah = trx.disetujui === 'Disetujui';
                           const rowBgClass = isSah 
                               ? 'hover:bg-indigo-50/20' 
                               : 'bg-rose-50/30 hover:bg-rose-50/50';

                           return (
                              <React.Fragment key={trx.id}>
                                 <tr className={`transition-colors ${rowBgClass}`}>
                                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px] text-center">{trx.id}</td>
                                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-700">{new Date(trx.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td className="py-3 px-4">
                                       <div className="flex items-center gap-2">
                                          <p className={`font-bold ${isSah ? 'text-gray-900' : 'text-rose-900'}`}>{trx.uraian}</p>
                                          {!isSah && <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase border border-rose-200">{trx.disetujui || 'Menunggu'}</span>}
                                       </div>
                                       <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] text-gray-500 font-semibold">
                                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">🧑 {trx.ref_personel?.nama_orang || '-'}</span>
                                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">🏷️ {trx.ref_akun?.nama_akun || '-'}</span>
                                          {trx.toko && <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">🛒 {trx.toko}</span>}
                                       </div>
                                    </td>

                                    <td className="py-3 px-4 text-right font-black font-mono">
                                       <span className={`px-2 py-0.5 rounded-md text-xs ${isPemasukan ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                          {isPemasukan ? '+' : '-'} Rp {nominal.toLocaleString('id-ID')}
                                       </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-black text-indigo-700 bg-indigo-50/30 whitespace-nowrap font-mono">
                                       Rp {trx._saldo_berjalan.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-3 px-4 text-center print:hidden">
                                       <button onClick={() => setExpandedRow(isExpanded ? null : trx.id)} className={`h-7 px-2.5 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                                          <span>Foto</span> {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                       </button>
                                       {((trx.foto_nota || trx.foto_kegiatan || trx.foto_barang || trx.foto_bukti_transfer) && !isExpanded) && (
                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1"></span>
                                       )}
                                    </td>
                                 </tr>

                                 {/* Panel Collapsible untuk melihat Foto/Lampiran */}
                                 {isExpanded && (
                                    <tr className="bg-gray-50/50 border-t border-gray-100 print:hidden">
                                       <td colSpan={6} className="p-4">
                                          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
                                             <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase text-[11px] tracking-wider">📂 Lampiran Fisik Transaksi</h4>
                                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {renderLampiranLinks("Bukti Nota / Kwitansi", trx.foto_nota)}
                                                {renderLampiranLinks("Dokumentasi Kegiatan", trx.foto_kegiatan)}
                                                {renderLampiranLinks("Foto Barang / Aset", trx.foto_barang)}
                                                {renderLampiranLinks("Bukti Transfer", trx.foto_bukti_transfer)}
                                             </div>
                                             {!(trx.foto_nota || trx.foto_kegiatan || trx.foto_barang || trx.foto_bukti_transfer) && (
                                                <div className="text-center py-4 text-gray-400 font-semibold italic text-xs">Tidak ada lampiran fisik.</div>
                                             )}
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
