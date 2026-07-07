'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Loader2, LayoutDashboard, 
  Clock, AlertCircle, Eye, Sparkles, Building2, CreditCard 
} from 'lucide-react';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerificationPage() {
  const [pendingTrx, setPendingTrx] = useState<any[]>([]);
  const [listAkun, setListAkun] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string, original: string } | null>(null);
  const [catatan, setCatatan] = useState<{ [id: number]: string }>({});
  const [selectedAkun, setSelectedAkun] = useState<{ [id: number]: string }>({});


  useEffect(() => {
     fetchPending();
  }, []);

  const fetchPending = async () => {
     setLoading(true);
     try {
        const [trxRes, akunRes] = await Promise.all([
           supabase.from('transactions')
              .select('*, ref_akun(nama_akun, nomor_akun), ref_personel(nama_orang)')
              .eq('disetujui', 'Menunggu')
              .order('tanggal', { ascending: false }),
           supabase.from('ref_akun').select('id, nomor_akun, nama_akun').order('nomor_akun')
        ]);

        if (trxRes.error) throw trxRes.error;
        setPendingTrx(trxRes.data || []);
        setListAkun(akunRes.data || []);
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
        
        if (status === 'Revisi' || status === 'Ditolak') {
            if (!catatan[id] || catatan[id].trim() === '') {
                alert("Mohon isi Catatan Alasan untuk staf agar mereka tahu apa yang salah!");
                setProcessingId(null);
                return;
            }
            payload.catatan_verifikasi = catatan[id];
        } else {
            payload.catatan_verifikasi = null;
        }

        if (selectedAkun[id]) {
            payload.akun_id = selectedAkun[id];
        }

        const { error } = await supabase
           .from('transactions')
           .update(payload)
           .eq('id', id);

        if (error) throw error;
        setPendingTrx(prev => prev.filter(t => t.id !== id));
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
     if (!teks) return null;
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
                     <div key={idx} onClick={() => setPreviewImage({ src: imgSrc, original: lnk })} className="cursor-pointer overflow-hidden rounded-xl border-2 border-indigo-100 hover:border-indigo-400 shadow-sm relative group bg-gray-50 max-w-sm flex items-center justify-center">
                        <img 
                           src={imgSrc} 
                           alt="Lampiran" 
                           className="w-full h-auto max-h-64 object-contain" 
                           onError={(e) => {
                              // Gunakan SVG lokal sebagai placeholder jika gambar gagal dimuat (misal PDF)
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNCAydjRzMiA0IDQgNEgyIi8+PHBhdGggZD0iTTQgMjJWMm0xNiAyMHYtOG0wIDBoLTQiLz48L3N2Zz4=';
                              (e.target as HTMLImageElement).className = 'w-16 h-16 object-contain opacity-50 m-6';
                           }} 
                        />
                        <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <span className="text-white font-bold bg-black/50 px-3 py-1.5 rounded-full text-xs">🔍 Buka Lampiran</span>
                        </div>
                     </div>
                  );
              })}
           </div>
        </div>
     );
  };


  return (
    <div className="space-y-8 pb-20">
      <div className="relative bg-slate-900 rounded-[3.5rem] p-10 overflow-hidden shadow-2xl border border-white/5">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
         
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="text-center lg:text-left">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  <Sparkles size={12} /> AI Security Shield Active
               </div>
               <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight italic uppercase">
                  Verification <span className="text-indigo-400">Hub</span>
               </h1>
               <p className="text-slate-400 font-medium mt-3 max-w-lg">Pusat kendali validasi transaksi keuangan. Periksa bukti fisik dengan teliti untuk menjaga akuntabilitas.</p>
            </div>
            
            <div className="flex flex-wrap lg:flex-nowrap gap-4">
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center min-w-[140px] hover:bg-white/10 transition-colors">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Surat</span>
                  <span className="text-4xl font-black text-white">{pendingTrx.length}</span>
               </div>
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center min-w-[200px] hover:bg-white/10 transition-colors">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Nominal</span>
                  <span className="text-2xl font-black text-white truncate">
                     Rp {pendingTrx.reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0).toLocaleString('id-ID')}
                  </span>
               </div>
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center min-w-[140px] hover:bg-white/10 transition-colors hidden xl:flex">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status</span>
                  <LayoutDashboard size={32} className="text-emerald-500 mt-1" />
               </div>
            </div>
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
               
               return <div key={trx.id} className="bg-white/80 backdrop-blur-md p-8 rounded-[3.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-2 h-full ${isPemasukan ? 'bg-emerald-500' : 'bg-rose-500'} opacity-20 group-hover:opacity-100 transition-all duration-500`}></div>
                      
                      <div className="flex flex-col lg:flex-row gap-10">
                        <div className="flex-1 space-y-8">
                           <div className="flex flex-wrap items-center gap-4">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isPemasukan ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                 {isPemasukan ? '↑ Pemasukan' : '↓ Pengeluaran'}
                              </span>
                              <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <Clock size={12} /> {trx.tanggal}
                              </span>
                           </div>

                           <div>
                              <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">{trx.uraian}</h3>
                              <div className="flex items-center gap-4 mt-4 text-sm font-bold text-slate-400">
                                 <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                    <Building2 size={14} className="text-slate-300" /> {trx.ref_personel?.nama_orang || 'Tanpa PIC'}
                                 </div>
                                 {trx.toko && (
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                       <CreditCard size={14} className="text-slate-300" /> {trx.toko}
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100/50 space-y-6">
                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Klasifikasi Akun Anggaran</label>
                                 <Select 
                                    options={listAkun.map(a => ({ value: a.id, label: `${a.nomor_akun} - ${a.nama_akun}` }))}
                                    value={
                                       selectedAkun[trx.id] 
                                       ? { value: selectedAkun[trx.id], label: listAkun.find(a => a.id === selectedAkun[trx.id])?.nama_akun } 
                                       : (trx.akun_id ? { value: trx.akun_id, label: trx.ref_akun ? `${trx.ref_akun.nomor_akun} - ${trx.ref_akun.nama_akun}` : 'Pilih Akun' } : null)
                                    }
                                    onChange={(val: any) => setSelectedAkun({...selectedAkun, [trx.id]: val?.value})}
                                    styles={{
                                       control: (b) => ({ ...b, borderRadius: '1.25rem', border: 'none', backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', padding: '0.4rem' }),
                                    }}
                                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                 />
                              </div>

                              <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block px-1">Feedback Verifikasi</label>
                                 <textarea 
                                    className="w-full bg-white border-none rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-4 ring-indigo-50 transition-all placeholder:text-slate-300 min-h-[100px] shadow-sm shadow-indigo-100/20" 
                                    placeholder="Berikan instruksi revisi atau alasan penolakan di sini..."
                                    value={catatan[trx.id] || ''}
                                    onChange={(e) => setCatatan({...catatan, [trx.id]: e.target.value})}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="lg:w-[400px] space-y-6">
                           <div className={`p-8 rounded-[3rem] ${isPemasukan ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'} border-2 flex flex-col items-center justify-center text-center`}>
                              <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${isPemasukan ? 'text-emerald-500' : 'text-rose-500'}`}>Total Amount</p>
                              <p className={`text-3xl font-black font-mono ${isPemasukan ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 Rp {Number(nominal).toLocaleString('id-ID')}
                              </p>
                           </div>

                           <div className="bg-white rounded-[3rem] p-6 border border-slate-100 shadow-sm">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                                 <Eye size={14} /> Attachment Gallery
                              </p>
                              <div className="grid grid-cols-2 gap-4">
                                 {renderFoto("Nota", trx.foto_nota)}
                                 {renderFoto("Kegiatan", trx.foto_kegiatan)}
                                 {renderFoto("Barang", trx.foto_barang)}
                                 {renderFoto("Transfer", trx.foto_bukti_transfer)}
                              </div>
                              {!(trx.foto_nota || trx.foto_kegiatan || trx.foto_barang || trx.foto_bukti_transfer) && (
                                 <div className="py-10 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    No Attachments
                                 </div>
                              )}
                           </div>
                        </div>
                      </div>

                      <div className="mt-10 flex flex-wrap gap-4 pt-8 border-t border-slate-100">
                         <button 
                           onClick={() => verifikasiTransaksi(trx.id, 'Ditolak')} 
                           disabled={processingId === trx.id}
                           className="flex-1 min-w-[180px] flex items-center justify-center gap-3 px-8 py-5 bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50"
                         >
                            {processingId === trx.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={18} />} TOLAK
                         </button>
                         <button 
                           onClick={() => verifikasiTransaksi(trx.id, 'Revisi')} 
                           disabled={processingId === trx.id}
                           className="flex-1 min-w-[180px] flex items-center justify-center gap-3 px-8 py-5 bg-white border border-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50"
                         >
                            {processingId === trx.id ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={18} />} REVISI
                         </button>
                         <button 
                           onClick={() => verifikasiTransaksi(trx.id, 'Disetujui')} 
                           disabled={processingId === trx.id}
                           className="flex-[2] min-w-[250px] flex items-center justify-center gap-4 px-8 py-5 bg-slate-900 text-white hover:bg-black rounded-[2rem] font-black text-lg shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                         >
                            {processingId === trx.id ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} className="text-emerald-400" />} SETUJUI TRANSAKSI
                         </button>
                      </div>
                   </div>;
            })}
         </div>
      )}

      <AnimatePresence>
      {previewImage && (
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
            <motion.img 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               src={previewImage.src} alt="Preview Bukti" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} onError={(e) => {
               (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
            }} />
            <a href={previewImage.original} target="_blank" rel="noreferrer" className="mt-6 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all border border-white/20 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
               🔗 BUKA DOKUMEN ASLI
            </a>
         </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
