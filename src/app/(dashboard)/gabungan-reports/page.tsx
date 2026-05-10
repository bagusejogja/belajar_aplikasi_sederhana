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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
         <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
               <Building2 size={28} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-gray-900">Laporan Gabungan (Bank + Kas)</h2>
               <p className="text-sm font-medium text-gray-500 mt-1">Konsolidasi seluruh transaksi dengan sistem paging.</p>
            </div>
         </div>
         <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <select value={rekeningPilih} onChange={(e) => setRekeningPilih(e.target.value)} className="px-4 py-2 border rounded-xl font-bold bg-indigo-50 text-indigo-700 outline-none">
               <option value="ALL">Semua Sumber Dana</option>
               <option value="KAS">Hanya Kas Tunai (BKU)</option>
               <option value="1">Bank Rekening 1</option>
               <option value="2">Bank Rekening 2</option>
               <option value="3">Bank Rekening 3</option>
            </select>
            <select value={bulanPilih} onChange={(e) => setBulanPilih(Number(e.target.value))} className="px-4 py-2 border rounded-xl font-bold bg-gray-50 outline-none">
               {BULAN.map((b, i) => <option key={i} value={i+1}>{b}</option>)}
            </select>
            <input type="number" value={tahunPilih} onChange={(e) => setTahunPilih(Number(e.target.value))} className="px-4 py-2 border w-24 rounded-xl font-bold bg-gray-50 outline-none" min={2000} max={2100} />
            
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl shadow-md font-bold text-sm print:hidden hover:bg-indigo-700 transition-colors">
               <Download size={16} /> Cetak
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
                  <p className="text-emerald-700/70 font-bold text-[10px] uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Masuk Bulan Ini</p>
                  <h3 className="text-xl font-black text-emerald-700">Rp {dataStats.income.toLocaleString('id-ID')}</h3>
               </div>
               <div className="bg-red-50 p-5 rounded-3xl shadow-sm">
                  <p className="text-red-700/70 font-bold text-[10px] uppercase mb-1 flex items-center gap-1"><TrendingDown size={12}/> Keluar Bulan Ini</p>
                  <h3 className="text-xl font-black text-red-700">Rp {dataStats.expense.toLocaleString('id-ID')}</h3>
               </div>
               <div className="bg-indigo-600 p-5 rounded-3xl shadow-sm text-white">
                  <p className="text-indigo-200 font-bold text-[10px] uppercase mb-1">Sisa Saldo Akhir</p>
                  <h3 className="text-xl font-black">Rp {(dataStats.initialBalance + dataStats.balance).toLocaleString('id-ID')}</h3>
               </div>
            </div>

            {/* Tabel Transaksi */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                     <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                        <tr>
                           <th className="p-4 w-10">Sumber</th>
                           <th className="p-4 w-24">Tanggal</th>
                           <th className="p-4 w-1/3">Uraian / Deskripsi</th>
                           <th className="p-4 text-right">Nominal (Rupiah)</th>
                           <th className="p-4 text-right bg-indigo-50/50">Saldo Berjalan</th>
                           <th className="p-4 text-center print:hidden">Bukti</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {currentTransactions.length === 0 ? (
                           <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-medium">Bulan ini belum ada transaksi di sumber dana terpilih.</td></tr>
                        ) : currentTransactions.map((trx) => {
                           const isExpanded = expandedRow === trx.uid;
                           const isPemasukan = trx.masuk > 0;
                           const nominal = isPemasukan ? trx.masuk : trx.keluar;
                           const isSah = trx.status === 'Selesai' || trx.status === 'Disetujui';
                           const rowBgClass = isSah ? 'hover:bg-gray-50' : 'bg-red-50/40 hover:bg-red-50'; 

                           return (
                              <React.Fragment key={trx.uid}>
                                 <tr className={`transition-colors group ${rowBgClass}`}>
                                    <td className="p-4 text-center">
                                       <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${trx.tipe === 'BANK' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                          {trx.tipe === 'BANK' ? `BANK ${trx.rekening_id}` : 'KAS'}
                                       </span>
                                    </td>
                                    <td className="p-4 whitespace-nowrap font-medium text-xs">{trx.tanggal.toLocaleDateString('id-ID')}</td>
                                    <td className="p-4">
                                       <div className="flex items-center gap-2">
                                          <p className={`font-bold ${isSah ? 'text-gray-900' : 'text-red-900'} uppercase text-xs leading-tight`}>{trx.uraian}</p>
                                          {!isSah && <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase shadow-sm animate-pulse">{trx.status}</span>}
                                       </div>
                                       <p className="text-[9px] text-gray-500 flex gap-2 mt-1 flex-wrap font-mono uppercase">
                                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">ACC: {trx.nama_akun}</span>
                                          <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{trx.keterangan_tambahan}</span>
                                       </p>
                                    </td>
                                    <td className="p-4 text-right font-black">
                                       <span className={`px-2 py-1 rounded-lg text-xs ${isPemasukan ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                          {isPemasukan ? '+' : '-'} Rp {nominal.toLocaleString('id-ID')}
                                       </span>
                                    </td>
                                    <td className="p-4 text-right font-black text-indigo-700 bg-indigo-50/20 whitespace-nowrap text-xs">
                                       Rp {trx._saldo_berjalan.toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-4 text-center print:hidden pb-4">
                                       <button onClick={() => setExpandedRow(isExpanded ? null : trx.uid)} className={`px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 mx-auto transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} mb-1`}>
                                          CEK {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                       </button>
                                       {trx.foto && !isExpanded && (
                                          <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full mt-1 uppercase">Ada Bukti</span>
                                       )}
                                    </td>
                                 </tr>

                                 {/* Panel Collapsible Foto */}
                                 {isExpanded && (
                                    <tr className="bg-gray-50 border-t-0 shadow-inner print:hidden">
                                       <td colSpan={6} className="p-4">
                                          <div className="col-span-12 bg-white/50 p-6 rounded-2xl border border-indigo-50 shadow-inner mt-4">
                                             <h4 className="font-black text-indigo-900 mb-6 border-b border-indigo-100 pb-2 uppercase text-sm tracking-widest">📂 Lampiran Fisik Transaksi ({trx.uid})</h4>
                                             {trx.foto ? renderLampiranLinks("BUKTI LAMPIRAN", trx.foto) : (
                                                <div className="text-center py-6 text-gray-400 font-bold italic text-sm">Tidak ada lampiran fisik tersimpan.</div>
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
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between print:hidden">
                     <p className="text-xs font-bold text-gray-500">
                        Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allFilteredTransactions.length)} dari {allFilteredTransactions.length} transaksi
                     </p>
                     <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                           <ChevronLeft size={16} />
                        </button>
                        <span className="px-4 py-2 text-sm font-black text-gray-700 bg-white border border-gray-200 rounded-lg">
                           Halaman {currentPage} / {totalPages}
                        </span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                           <ChevronRight size={16} />
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
