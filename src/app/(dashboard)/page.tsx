'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, Info } from 'lucide-react';

export default function VerificationPage() {
  const [pendingTrx, setPendingTrx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string, original: string } | null>(null);
  const [catatan, setCatatan] = useState<{ [id: number]: string }>({});


  useEffect(() => {
     fetchPending();
  }, []);

  const fetchPending = async () => {
     setLoading(true);
     try {
        const { data, error } = await supabase
           .from('transactions')
           .select('*, ref_akun(nama_akun), ref_personel(nama_orang)')
           .eq('disetujui', 'Menunggu')
           .order('tanggal', { ascending: false });

        if (error) throw error;
        setPendingTrx(data || []);
     } catch (err) {
        console.error(err);
     } finally {
        setLoading(false);
     }
  };

  const verifikasiTransaksi = async (id: number, status: string) => {
     setProcessingId(id);
     try {
        const payload: any = { 
            disetujui: status, 
            tanggal_disetujui: new Date().toISOString().split('T')[0]
        };
        
        // Jika status Revisi atau Ditolak, sertakan catatan
        if (status === 'Revisi' || status === 'Ditolak') {
            if (!catatan[id] || catatan[id].trim() === '') {
                alert("Mohon isi Catatan Alasan (di kotak bawah) untuk staf agar mereka tahu apa yang salah!");
                setProcessingId(null);
                return;
            }
            payload.catatan_verifikasi = catatan[id];
        } else {
            payload.catatan_verifikasi = null; // Bersihkan catatan jika diterima
        }

        const { error } = await supabase
           .from('transactions')
           .update(payload)
           .eq('id', id);

        if (error) throw error;
        // Hapus dari list
        setPendingTrx(prev => prev.filter(t => t.id !== id));
        
        // Bersihkan state catatan
        setCatatan(prev => {
           const newC = { ...prev };
           delete newC[id];
           return newC;
        });

     } catch (err: any) {
        alert("Gagal memverifikasi: " + err.message);
     } finally {
        setProcessingId(null);
     }
  };

  const renderFoto = (label: string, teks: string | null) => {
     if (!teks) return null; // Sembunyikan jika kosong
     const links = teks.split(',').map(s => s.trim()).filter(Boolean);
     
     return (
        <div className="mb-4">
           <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">{label}</h4>
           <div className="flex flex-col gap-3">
              {links.map((lnk, idx) => {
                  let imgSrc = lnk;
                  const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
                  if (gdriveMatch && gdriveMatch[1]) {
                     imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w800`;
                  }

                  return (
                     <div key={idx} onClick={() => setPreviewImage({ src: imgSrc, original: lnk })} className="cursor-pointer overflow-hidden rounded-xl border-2 border-indigo-100 hover:border-indigo-400 shadow-sm relative group bg-gray-50 max-w-sm">
                        <img src={imgSrc} alt="Lampiran" className="w-full h-auto max-h-64 object-contain" onError={(e) => {
                           (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                           (e.target as any).className = 'w-16 h-16 object-contain opacity-50 m-6';
                        }} />
                        <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <span className="text-white font-bold bg-black/50 px-3 py-1.5 rounded-full text-xs">🔍 Klik Perbesar</span>
                        </div>
                     </div>
                  );
              })}
           </div>
        </div>
     );
  };


  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-3xl p-8 flex items-center justify-between text-white shadow-xl shadow-indigo-200">
         <div>
            <h2 className="text-3xl font-black mb-2">Verifikasi Transaksi</h2>
            <p className="text-indigo-100 font-medium">Bantu periksa bukti foto dan sahkan transaksi yang masuk agar tampil di Laporan Utama.</p>
         </div>
         <div className="hidden md:flex bg-white/20 p-4 rounded-2xl items-center justify-center font-black text-4xl shadow-inner">
            {pendingTrx.length}
         </div>
      </div>

      {loading ? (
         <div className="flex justify-center h-40 items-center"><Loader2 size={40} className="animate-spin text-indigo-500"/></div>
      ) : pendingTrx.length === 0 ? (
         <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
            <h3 className="text-xl font-bold text-gray-700">Tidak ada tanggungan!</h3>
            <p>Semua transaksi masuk sudah selesai diperiksa dan bersih.</p>
         </div>
      ) : (
         <div className="grid gap-4">
            {pendingTrx.map(trx => {
               const isPemasukan = Number(trx.uang_masuk) > 0;
               const nominal = isPemasukan ? trx.uang_masuk : trx.uang_keluar;
               
               return (
                  <div key={trx.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-indigo-200 transition-all">
                     <div className={`absolute top-0 left-0 w-2 h-full ${isPemasukan ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                     
                     
                     <div className="flex-1 flex flex-col xl:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                           <div className="flex justify-between items-start bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                              <div>
                                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{trx.tanggal}</p>
                                 <h3 className="text-xl font-black text-gray-900 leading-tight">{trx.uraian}</h3>
                                 <p className="text-sm font-bold text-gray-500 mt-2">🧑 {trx.ref_personel?.nama_orang || '?'} &nbsp;•&nbsp; 🛒 {trx.toko || '-'}</p>
                              </div>
                              <div className="text-right shrink-0 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">TOTAL NOMINAL</p>
                                 <p className={`text-xl font-black ${isPemasukan ? 'text-emerald-600' : 'text-red-600'}`}>Rp {Number(nominal).toLocaleString('id-ID')}</p>
                              </div>
                           </div>

                           {/* Catatan Area */}
                           <div className="mt-4">
                              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Tulis Catatan / Alasan (Jika Revisi/Ditolak):</label>
                              <textarea 
                                 className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-gray-300 min-h-[80px]" 
                                 placeholder="Tulis alasan jika Anda meminta staf memperbaikinya..."
                                 value={catatan[trx.id] || ''}
                                 onChange={(e) => setCatatan({...catatan, [trx.id]: e.target.value})}
                              />
                           </div>
                        </div>

                        {/* Foto Section Vertikal */}
                        <div className="flex-1 bg-white rounded-2xl p-5 border border-gray-200 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] min-w-[300px]">
                           <div className="flex items-center gap-2 mb-4 text-indigo-700 font-black">
                              <Info size={18}/> <span>GALERI LAMPIRAN</span>
                           </div>
                           <div className="space-y-4">
                              {renderFoto("📸 Bukti Nota", trx.foto_nota)}
                              {renderFoto("📸 Bukti Kegiatan", trx.foto_kegiatan)}
                              {renderFoto("📸 Bukti Barang", trx.foto_barang)}
                              {renderFoto("💸 Bukti Transfer", trx.foto_bukti_transfer)}
                              
                              {!(trx.foto_nota || trx.foto_kegiatan || trx.foto_barang || trx.foto_bukti_transfer) && (
                                 <div className="text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">Tidak ada lampiran yang disertakan staf.</div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-3 justify-center shrink-0 border-t xl:border-t-0 xl:border-l border-gray-100 pt-6 xl:pt-0 xl:pl-6 min-w-[200px]">
                        <button disabled={processingId === trx.id} onClick={() => verifikasiTransaksi(trx.id, 'Disetujui')} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-6 rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50">
                           {processingId === trx.id ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={20}/>} TERIMA (SAH)
                        </button>
                        <button disabled={processingId === trx.id} onClick={() => verifikasiTransaksi(trx.id, 'Revisi')} className="w-full flex items-center justify-center gap-2 bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white font-black py-3 px-6 rounded-xl transition-all disabled:opacity-50">
                           {processingId === trx.id ? <Loader2 size={18} className="animate-spin"/> : <Info size={18}/>} KEMBALIKAN (REVISI)
                        </button>
                        <button disabled={processingId === trx.id} onClick={() => verifikasiTransaksi(trx.id, 'Ditolak')} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 mt-4">
                           {processingId === trx.id ? <Loader2 size={18} className="animate-spin"/> : <XCircle size={18}/>} TOLAK MENTAH
                        </button>
                     </div>
                  </div>

               );
            })}
         </div>
      )}

      {/* Modal Preview */}
      {previewImage && (
         <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <img src={previewImage.src} alt="Preview Bukti" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} onError={(e) => {
               (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
            }} />
            <a href={previewImage.original} target="_blank" rel="noreferrer" className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold" onClick={(e) => e.stopPropagation()}>
               🔗 Buka Link Asli
            </a>
         </div>
      )}
    </div>
  );
}
