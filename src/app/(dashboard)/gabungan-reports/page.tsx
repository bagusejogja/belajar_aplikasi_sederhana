'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Download, Loader2, ChevronDown, ChevronUp, Filter, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Helper: Nama Bulan
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function GabunganReportsPage() {
  const tglSekarang = new Date();
  const [bulanPilih, setBulanPilih] = useState(tglSekarang.getMonth() + 1);
  const [tahunPilih, setTahunPilih] = useState(tglSekarang.getFullYear());
  const [rekeningPilih, setRekeningPilih] = useState('ALL'); // ALL, KAS, atau ID Rekening Bank
  
  const [dataStats, setDataStats] = useState({ income: 0, expense: 0, balance: 0, initialBalance: 0 });
  const [allFilteredTransactions, setAllFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Menyimpan state row yang di-expand untuk melihat lampiran
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string, original: string } | null>(null);

  useEffect(() => {
     fetchReport();
  }, [bulanPilih, tahunPilih, rekeningPilih]);

  const fetchReport = async () => {
     setLoading(true);
     setCurrentPage(1); // Reset page
     try {
        // 1. Ambil SEMUA transaksi KAS (transactions)
        let allKas: any[] = [];
        let isSelesaiKas = false;
        let ambilMulaiKas = 0;
        const batasAmbil = 1000;

        while (!isSelesaiKas) {
            const { data, error } = await supabase
                .from('transactions')
                .select('id, tanggal, uraian, uang_masuk, uang_keluar, disetujui, toko, foto_nota, foto_kegiatan, foto_barang, foto_bukti_transfer, ref_akun(nama_akun), ref_personel(nama_orang)')
                .neq('disetujui', 'Ditolak')
                .order('tanggal', { ascending: true })
                .order('id', { ascending: true })
                .range(ambilMulaiKas, ambilMulaiKas + batasAmbil - 1);
            if (error) throw error;
            if (data && data.length > 0) {
                allKas = [...allKas, ...data];
                if (data.length < batasAmbil) isSelesaiKas = true;
                else ambilMulaiKas += batasAmbil;
            } else { isSelesaiKas = true; }
        }

        // 2. Ambil SEMUA transaksi BANK (bank_transactions)
        let allBank: any[] = [];
        let isSelesaiBank = false;
        let ambilMulaiBank = 0;

        while (!isSelesaiBank) {
            const { data, error } = await supabase
                .from('bank_transactions')
                .select('id, waktu_transaksi, deskripsi, kredit, debet, rekening_id, noref_bank, foto_bukti, ref_akun(nama_akun)')
                .order('waktu_transaksi', { ascending: true })
                .order('id', { ascending: true })
                .range(ambilMulaiBank, ambilMulaiBank + batasAmbil - 1);
            if (error) throw error;
            if (data && data.length > 0) {
                allBank = [...allBank, ...data];
                if (data.length < batasAmbil) isSelesaiBank = true;
                else ambilMulaiBank += batasAmbil;
            } else { isSelesaiBank = true; }
        }

        // 3. Gabungkan Data (Standardisasi Format)
        const combined = [
           ...allKas.map(k => ({
              uid: `KAS-${k.id}`,
              tipe: 'KAS',
              idAsli: k.id,
              tanggal: new Date(k.tanggal),
              uraian: k.uraian,
              masuk: Number(k.uang_masuk) || 0,
              keluar: Number(k.uang_keluar) || 0,
              rekening_id: 'KAS', // Anggap Kas sebagai rekening virtual
              status: k.disetujui || 'Selesai',
              nama_akun: k.ref_akun?.nama_akun || '-',
              keterangan_tambahan: `Personel: ${k.ref_personel?.nama_orang || '-'}, Toko: ${k.toko || '-'}`,
              foto: [k.foto_nota, k.foto_kegiatan, k.foto_barang, k.foto_bukti_transfer].filter(Boolean).join(',')
           })),
           ...allBank.map(b => ({
              uid: `BANK-${b.id}`,
              tipe: 'BANK',
              idAsli: b.id,
              tanggal: new Date(b.waktu_transaksi),
              uraian: b.deskripsi,
              masuk: Number(b.kredit) || 0, // Kredit bank = uang masuk (menambah saldo)
              keluar: Number(b.debet) || 0, // Debet bank = uang keluar (mengurangi saldo)
              rekening_id: b.rekening_id?.toString() || 'BANK',
              status: 'Selesai', // Bank otomatis selesai
              nama_akun: b.ref_akun?.nama_akun || '-',
              keterangan_tambahan: `Ref: ${b.noref_bank || '-'}`,
              foto: b.foto_bukti || ''
           }))
        ];

        // 4. Urutkan berdasarkan waktu secara Ascending untuk hitung saldo berjalan
        combined.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());

        // 5. Kalkulasi Saldo Berjalan & Filter Rekening + Waktu
        let berjalan = 0; 
        let totalIncomeBulanIni = 0;
        let totalExpenseBulanIni = 0;
        let saldoAwalBulan = 0;

        const processedTrx = combined.map(trx => {
           const tTahun = trx.tanggal.getFullYear();
           const tBulan = trx.tanggal.getMonth() + 1;

           // Filter Rekening (Jika ALL, dihitung semua. Jika spesifik, saldo berjalan hanya dari rekening itu)
           const matchRekening = rekeningPilih === 'ALL' || trx.rekening_id === rekeningPilih;
           
           if (matchRekening) {
              const isBeforeTargetMonth = tTahun < tahunPilih || (tTahun === tahunPilih && tBulan < bulanPilih);
              if (isBeforeTargetMonth) {
                 saldoAwalBulan = berjalan + trx.masuk - trx.keluar; 
              }
              berjalan += trx.masuk - trx.keluar;
           }

           return { ...trx, _saldo_berjalan: berjalan, _tahun: tTahun, _bulan: tBulan, matchRekening };
        });

        // 6. Saring transaksi untuk Tampilan (Hanya Bulan, Tahun & Rekening yg dipilih)
        const filtered = processedTrx.filter(t => t._tahun === tahunPilih && t._bulan === bulanPilih && t.matchRekening);
        
        filtered.forEach(t => {
           totalIncomeBulanIni += t.masuk;
           totalExpenseBulanIni += t.keluar;
        });

        setDataStats({ 
            income: totalIncomeBulanIni, 
            expense: totalExpenseBulanIni, 
            balance: totalIncomeBulanIni - totalExpenseBulanIni,
            initialBalance: saldoAwalBulan 
        });
        
        // Reverse untuk menampilkan dari yang terbaru di paling atas
        setAllFilteredTransactions([...filtered].reverse());

     } catch (err) {
        console.error("Gagal menarik laporan gabungan", err);
     } finally {
        setLoading(false);
     }
  };

  const renderLampiranLinks = (label: string, teks: string | null) => {
      if (!teks) return null;
      const links = teks.split(',').map(s => s.trim()).filter(s => s);
      if (links.length === 0) return null;
      
      return (
         <div className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
            <p className="text-xs font-black text-gray-500 mb-4">{label}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {links.map((lnk, idx) => {
                   let imgSrc = lnk;
                   const isGDrive = lnk.match(/drive\.google\.com/);
                   const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
                   if (gdriveMatch && gdriveMatch[1]) imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w800`;

                   return (
                      <div key={idx} className="relative group cursor-pointer overflow-hidden rounded-xl border border-gray-200 hover:border-indigo-500 transition-all shadow-sm bg-gray-50 flex items-center justify-center aspect-[4/3] w-full" onClick={() => setPreviewImage({ src: imgSrc, original: lnk })}>
                         <img src={imgSrc} alt="Bukti" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { 
                            (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                            (e.target as HTMLImageElement).className = 'w-16 h-16 object-contain mx-auto opacity-50';
                         }} />
                         <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold text-sm backdrop-blur-sm z-10">🔍 Perbesar</div>
                         {isGDrive && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-3 py-1 font-black rounded-bl-xl z-0 shadow-sm">GDRIVE</div>}
                      </div>
                   );
               })}
            </div>
         </div>
      );
  };

  // Logika Pagination
  const totalPages = Math.ceil(allFilteredTransactions.length / itemsPerPage);
  const currentTransactions = allFilteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
         <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
               <Building2 size={20} />
            </div>
            <div>
               <div className="flex items-center gap-2">
                  <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                     Laporan Gabungan (Bank + Kas)
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                     {allFilteredTransactions.length} Transaksi
                  </span>
               </div>
               <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                  Konsolidasi mutasi kas kecil dan transaksi rekening bank dengan paging terpadu.
               </p>
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select value={rekeningPilih} onChange={(e) => setRekeningPilih(e.target.value)} className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer">
               <option value="ALL">Semua Sumber Dana</option>
               <option value="KAS">Hanya Kas Tunai (BKU)</option>
               <option value="1">Bank Rekening 1</option>
               <option value="2">Bank Rekening 2</option>
               <option value="3">Bank Rekening 3</option>
            </select>
            <select value={bulanPilih} onChange={(e) => setBulanPilih(Number(e.target.value))} className="h-9 px-3 border border-gray-200 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none cursor-pointer">
               {BULAN.map((b, i) => <option key={i} value={i+1}>{b}</option>)}
            </select>
            <input type="number" value={tahunPilih} onChange={(e) => setTahunPilih(Number(e.target.value))} className="h-9 px-3 border border-gray-200 w-20 rounded-xl font-semibold bg-gray-50 hover:bg-white text-xs outline-none" min={2000} max={2100} />
            
            <button onClick={() => window.print()} className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 print:hidden">
               <Download size={13} /> <span>Cetak PDF</span>
            </button>
         </div>
      </div>

      {loading ? (
         <div className="h-64 flex flex-col items-center justify-center text-indigo-600">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p className="text-xs font-medium text-gray-500">Menggabungkan data kas dan bank...</p>
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
                     <Building2 size={18} />
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Total Masuk</p>
                     <p className="text-lg font-black text-emerald-700 leading-none">Rp {dataStats.income.toLocaleString('id-ID')}</p>
                     <p className="text-[10px] text-gray-500 font-semibold">Kas & Bank (+)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                     <TrendingUp size={18} />
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Total Keluar</p>
                     <p className="text-lg font-black text-rose-700 leading-none">Rp {dataStats.expense.toLocaleString('id-ID')}</p>
                     <p className="text-[10px] text-gray-500 font-semibold">Kas & Bank (-)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                     <TrendingDown size={18} />
                  </div>
               </div>

               <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Sisa Saldo Akhir</p>
                     <p className="text-lg font-black text-indigo-700 leading-none">Rp {(dataStats.initialBalance + dataStats.balance).toLocaleString('id-ID')}</p>
                     <p className="text-[10px] text-gray-500 font-semibold">Posisi Gabungan</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                     <Building2 size={18} />
                  </div>
               </div>
            </div>

            {/* TABEL TRANSAKSI */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                     <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                        <tr>
                           <th className="py-3 px-4 w-20 text-center">Sumber</th>
                           <th className="py-3 px-4 w-28">Tanggal</th>
                           <th className="py-3 px-4">Uraian / Deskripsi</th>
                           <th className="py-3 px-4 text-right">Nominal</th>
                           <th className="py-3 px-4 text-right bg-indigo-50/50">Saldo Berjalan</th>
                           <th className="py-3 px-4 text-center print:hidden">Bukti</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 font-medium">
                        {currentTransactions.length === 0 ? (
                           <tr><td colSpan={6} className="py-12 text-center text-gray-400 font-medium">Bulan ini belum ada transaksi di sumber dana terpilih.</td></tr>
                        ) : currentTransactions.map((trx) => {
                           const isExpanded = expandedRow === trx.uid;
                           const isPemasukan = trx.masuk > 0;
                           const nominal = isPemasukan ? trx.masuk : trx.keluar;
                           const isSah = trx.status === 'Selesai' || trx.status === 'Disetujui';
                           const rowBgClass = isSah ? 'hover:bg-indigo-50/20' : 'bg-rose-50/30 hover:bg-rose-50/50'; 

                           return (
                              <React.Fragment key={trx.uid}>
                                 <tr className={`transition-colors ${rowBgClass}`}>
                                    <td className="py-3 px-4 text-center">
                                       <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${trx.tipe === 'BANK' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                          {trx.tipe === 'BANK' ? `Bank ${trx.rekening_id}` : 'Kas'}
                                       </span>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-700">{trx.tanggal.toLocaleDateString('id-ID')}</td>
                                    <td className="py-3 px-4">
                                       <div className="flex items-center gap-2">
                                          <p className={`font-bold ${isSah ? 'text-gray-900' : 'text-rose-900'}`}>{trx.uraian}</p>
                                          {!isSah && <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase border border-rose-200">{trx.status}</span>}
                                       </div>
                                       <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px] text-gray-500 font-semibold">
                                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">🏷️ {trx.nama_akun}</span>
                                          <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{trx.keterangan_tambahan}</span>
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
                                       <button onClick={() => setExpandedRow(isExpanded ? null : trx.uid)} className={`h-7 px-2.5 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-all ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-indigo-50 hover:text-indigo-700'}`}>
                                          <span>Bukti</span> {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                       </button>
                                       {trx.foto && !isExpanded && (
                                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 ml-1"></span>
                                       )}
                                    </td>
                                 </tr>

                                 {/* Panel Collapsible Foto */}
                                 {isExpanded && (
                                    <tr className="bg-gray-50/50 border-t border-gray-100 print:hidden">
                                       <td colSpan={6} className="p-4">
                                          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
                                             <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase text-[11px] tracking-wider">📂 Lampiran Fisik Transaksi ({trx.uid})</h4>
                                             {trx.foto ? renderLampiranLinks("Bukti Lampiran", trx.foto) : (
                                                <div className="text-center py-4 text-gray-400 font-semibold italic text-xs">Tidak ada lampiran fisik tersimpan.</div>
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
               
               {/* Kontrol Pagination */}
               {totalPages > 1 && (
                  <div className="p-3 px-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between print:hidden">
                     <p className="text-xs font-semibold text-gray-500">
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allFilteredTransactions.length)} dari {allFilteredTransactions.length} transaksi
                     </p>
                     <div className="flex items-center gap-1.5">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">
                           <ChevronLeft size={14} />
                        </button>
                        <span className="px-3 h-8 flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg">
                           {currentPage} / {totalPages}
                        </span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors">
                           <ChevronRight size={14} />
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </>
      )}

      {/* Modal Gambar Layar Penuh */}
      {previewImage && (
         <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-red-500 p-3 rounded-full transition-colors font-bold group">X</button>
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
