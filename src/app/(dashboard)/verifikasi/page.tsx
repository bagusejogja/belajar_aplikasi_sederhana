'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Loader2, LayoutDashboard, 
  Clock, AlertCircle, Eye, Sparkles, Building2, CreditCard, User
} from 'lucide-react';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function VerificationPage() {
  const [pendingTrx, setPendingTrx] = useState<any[]>([]);
  const [listAkun, setListAkun] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
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
        const [trxRes, akunRes, userRes] = await Promise.all([
           supabase.from('transactions')
              .select('*, ref_akun(nama_akun, nomor_akun), ref_personel(nama_orang)')
              .eq('disetujui', 'Menunggu')
              .order('tanggal', { ascending: false }),
           supabase.from('ref_akun').select('id, nomor_akun, nama_akun').order('nomor_akun'),
           supabase.from('app_users').select('id, email, role')
        ]);

        if (trxRes.error) throw trxRes.error;
        setPendingTrx(trxRes.data || []);
        setListAkun(akunRes.data || []);

        if (userRes.data) {
          const map: Record<string, string> = {};
          userRes.data.forEach((u: any) => {
            map[u.id] = u.email;
          });
          setUsersMap(map);
        }
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
                toast.error("Mohon isi Catatan Alasan untuk staf agar mereka tahu apa yang salah!");
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
        toast.success(`Berhasil! Transaksi telah ${status}`);

     } catch (err: any) {
        toast.error("Gagal memverifikasi: " + err.message);
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
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-xl text-white shadow-xs">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Verifikasi Kas Masjid
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                {pendingTrx.length} Menunggu Verifikasi
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Pusat validasi dan persetujuan bukti transaksi kas masjid secara teliti & akuntabel.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-gray-400 font-bold text-[10px] uppercase">Total Tertunda:</span>
            <span className="font-mono font-black text-gray-900">
              Rp {pendingTrx.reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center h-40 items-center"><Loader2 size={40} className="animate-spin text-indigo-500"/></div>
      ) : pendingTrx.length === 0 ? (
         <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 shadow-xs">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-800">Tidak ada tanggungan!</h3>
            <p className="text-xs text-gray-500 mt-1">Semua transaksi masuk sudah selesai diperiksa dan terverifikasi.</p>
         </div>
      ) : (
         <div className="grid gap-4">
            {pendingTrx.map(trx => {
               const isPemasukan = Number(trx.uang_masuk) > 0;
               const nominal = isPemasukan ? trx.uang_masuk : trx.uang_keluar;
               
               return <div key={trx.id} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-300 transition-all duration-300 group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${isPemasukan ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                           <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isPemasukan ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                 {isPemasukan ? '↑ Pemasukan' : '↓ Pengeluaran'}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                                 <Clock size={12} /> {trx.tanggal}
                              </span>
                           </div>

                           <div>
                              <h3 className="text-base font-black text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">{trx.uraian}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-gray-500">
                                 <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600">
                                    <Building2 size={13} className="text-gray-400" /> {trx.ref_personel?.nama_orang || 'Tanpa PIC'}
                                 </div>
                                 {trx.toko && (
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600">
                                       <CreditCard size={13} className="text-gray-400" /> {trx.toko}
                                    </div>
                                 )}
                                 {trx.created_by && (
                                    <div className="flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/80 text-indigo-700 font-medium">
                                       <User size={12} className="text-indigo-500" />
                                       <span>Dibuat: <strong className="font-bold">{usersMap[trx.created_by] || trx.created_by}</strong></span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/60 space-y-3">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Klasifikasi Akun Anggaran</label>
                                 <Select 
                                    options={listAkun.map(a => ({ value: a.id, label: `${a.nomor_akun} - ${a.nama_akun}` }))}
                                    value={
                                       selectedAkun[trx.id] 
                                       ? { value: selectedAkun[trx.id], label: listAkun.find(a => a.id === selectedAkun[trx.id])?.nama_akun } 
                                       : (trx.akun_id ? { value: trx.akun_id, label: trx.ref_akun ? `${trx.ref_akun.nomor_akun} - ${trx.ref_akun.nama_akun}` : 'Pilih Akun' } : null)
                                    }
                                    onChange={(val: any) => setSelectedAkun({...selectedAkun, [trx.id]: val?.value})}
                                    className="text-xs"
                                    styles={{
                                       control: (b) => ({ ...b, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: 'white', fontSize: '0.75rem', fontWeight: '600' }),
                                       valueContainer: (b) => ({ ...b, padding: '0 8px' }),
                                    }}
                                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                 />
                              </div>

                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Catatan / Instruksi Verifikasi</label>
                                 <textarea 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all placeholder:text-gray-400 min-h-[70px]" 
                                    placeholder="Berikan instruksi revisi atau alasan jika ditolak..."
                                    value={catatan[trx.id] || ''}
                                    onChange={(e) => setCatatan({...catatan, [trx.id]: e.target.value})}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="lg:w-[320px] space-y-3">
                           <div className={`p-4 rounded-xl ${isPemasukan ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'} border flex flex-col items-center justify-center text-center`}>
                              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isPemasukan ? 'text-emerald-600' : 'text-rose-600'}`}>Total Nominal</p>
                              <p className={`text-xl font-black font-mono ${isPemasukan ? 'text-emerald-700' : 'text-rose-700'}`}>
                                 Rp {Number(nominal).toLocaleString('id-ID')}
                              </p>
                           </div>

                           <div className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/80">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                 <Eye size={12} /> Galeri Lampiran
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                 {renderFoto("Nota", trx.foto_nota)}
                                 {renderFoto("Kegiatan", trx.foto_kegiatan)}
                                 {renderFoto("Barang", trx.foto_barang)}
                                 {renderFoto("Transfer", trx.foto_bukti_transfer)}
                              </div>
                              {!(trx.foto_nota || trx.foto_kegiatan || trx.foto_barang || trx.foto_bukti_transfer) && (
                                 <div className="py-6 text-center bg-white rounded-lg border border-dashed border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Tanpa Lampiran
                                 </div>
                              )}
                           </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 pt-3.5 border-t border-gray-100 justify-end">
                         <button 
                           onClick={() => verifikasiTransaksi(trx.id, 'Ditolak')} 
                           disabled={processingId === trx.id}
                           className="h-9 px-4 flex items-center justify-center gap-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                         >
                            {processingId === trx.id ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={14} />} <span>Tolak</span>
                         </button>
                         <button 
                           onClick={() => verifikasiTransaksi(trx.id, 'Revisi')} 
                           disabled={processingId === trx.id}
                           className="h-9 px-4 flex items-center justify-center gap-1.5 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                         >
                            {processingId === trx.id ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={14} />} <span>Revisi</span>
                         </button>
                         <button 
                           onClick={() => verifikasiTransaksi(trx.id, 'Disetujui')} 
                           disabled={processingId === trx.id}
                           className="h-9 px-5 flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50"
                         >
                            {processingId === trx.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={14} />} <span>Setujui Transaksi</span>
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
            className="fixed inset-0 z-50 bg-slate-900/40 flex flex-col items-center justify-center p-4 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
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
