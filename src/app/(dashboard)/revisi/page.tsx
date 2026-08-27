'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Loader2, Send, Info, Trash2, UploadCloud, X, Sparkles, TrendingDown, Clock, Building2, CreditCard } from 'lucide-react';

export default function RevisiPage() {
  const [revisiTrx, setRevisiTrx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Referensi Data
  const [listAkun, setListAkun] = useState<any[]>([]);
  const [listPersonel, setListPersonel] = useState<any[]>([]);
  const [listBelanja, setListBelanja] = useState<any[]>([]);

  // State Modal Edit
  const [editingTrx, setEditingTrx] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // File Uploads Baru
  const [fileNota, setFileNota] = useState<File[]>([]);
  const [fileKeg, setFileKeg] = useState<File[]>([]);
  const [fileBrg, setFileBrg] = useState<File[]>([]);
  const [fileTrf, setFileTrf] = useState<File[]>([]);

  useEffect(() => {
     fetchRevisi();
     fetchReferences();
  }, []);

  const fetchReferences = async () => {
     try {
        const [a, p, b] = await Promise.all([
           supabase.from('ref_akun').select('*'),
           supabase.from('ref_personel').select('*'),
           supabase.from('ref_jenis_belanja').select('*')
        ]);
        if (a.data) setListAkun(a.data);
        if (p.data) setListPersonel(p.data);
        if (b.data) setListBelanja(b.data);
     } catch (err) {}
  };

  const fetchRevisi = async () => {
     setLoading(true);
     try {
        const { data, error } = await supabase
           .from('transactions')
           .select('*, ref_akun(nama_akun), ref_personel(nama_orang)')
           .eq('disetujui', 'Revisi')
           .order('tanggal', { ascending: false });

        if (error) throw error;
        setRevisiTrx(data || []);
     } catch (err) {
        console.error(err);
     } finally {
        setLoading(false);
     }
  };

  const openEditor = (trx: any) => {
      // Injeksi tipe kas untuk logika Edit
      const isPemasukan = Number(trx.uang_masuk) > 0;
      setEditingTrx({
          ...trx,
          nominal: isPemasukan ? Number(trx.uang_masuk) : Number(trx.uang_keluar),
          tipe_kas: isPemasukan ? 'Pemasukan' : 'Pengeluaran',
      });
      // Bersihkan file uplaods lama tiap buka modal
      setFileNota([]); setFileKeg([]); setFileBrg([]); setFileTrf([]);
  };

  // Logika membuang foto lama (berupa string URLs)
  const removeOldPhoto = (type: string, url: string) => {
      setEditingTrx((prev: any) => {
          let currentStr = prev[type] || "";
          let arr = currentStr.split(',').map((s:string) => s.trim()).filter(Boolean);
          arr = arr.filter((u:string) => u !== url);
          return { ...prev, [type]: arr.join(', ') };
      });
  };

  // Fungsi Upload File ke Supabase
  const uploadFiles = async (files: File[], bucketPath: string) => {
    if (files.length === 0) return "";
    const uploadedUrls: string[] = [];
    for (const file of files) {
       const fileExt = file.name.split('.').pop();
       const fileName = `${bucketPath}_${Math.random()}_${Date.now()}.${fileExt}`;
       const { error } = await supabase.storage.from('receipts').upload(`revisi/${fileName}`, file, { cacheControl: '3600', upsert: false });
       if (error) throw error;
       const { data } = supabase.storage.from('receipts').getPublicUrl(`revisi/${fileName}`);
       uploadedUrls.push(data.publicUrl);
    }
    return uploadedUrls.join(', ');
  };

  const kirimUlang = async () => {
     if (!editingTrx) return;
     setSaving(true);
     try {
        // Upload file baru jika ada
        const urlNotaBaru = await uploadFiles(fileNota, 'nota');
        const urlKegBaru = await uploadFiles(fileKeg, 'kegiatan');
        const urlBrgBaru = await uploadFiles(fileBrg, 'barang');
        const urlTrfBaru = await uploadFiles(fileTrf, 'transfer');

        // Gabungkan string URL lama + URL baru (dipisahkan koma)
        const finalNota = [editingTrx.foto_nota, urlNotaBaru].filter(Boolean).join(', ');
        const finalKeg = [editingTrx.foto_kegiatan, urlKegBaru].filter(Boolean).join(', ');
        const finalBrg = [editingTrx.foto_barang, urlBrgBaru].filter(Boolean).join(', ');
        const finalTrf = [editingTrx.foto_bukti_transfer, urlTrfBaru].filter(Boolean).join(', ');

        // Update Uang
        const nominalUpdate = editingTrx.tipe_kas === 'Pemasukan' 
          ? { uang_masuk: editingTrx.nominal, uang_keluar: 0 }
          : { uang_masuk: 0, uang_keluar: editingTrx.nominal };

        const payload = {
            tanggal: editingTrx.tanggal,
            uraian: editingTrx.uraian,
            ...nominalUpdate,
            toko: editingTrx.toko || null,
            akun_id: editingTrx.ref_akun_id || editingTrx.akun_id || null,
            personel_id: editingTrx.ref_personel_id || editingTrx.personel_id || null,
            foto_nota: finalNota || null,
            foto_kegiatan: finalKeg || null,
            foto_barang: finalBrg || null,
            foto_bukti_transfer: finalTrf || null,
            disetujui: 'Menunggu', 
            catatan_verifikasi: null // Bersihkan status revisi!
        };

        const { error } = await supabase.from('transactions').update(payload).eq('id', editingTrx.id);
        if (error) throw error;

        alert("Sukses! Form ini kembali masuk ke Meja Menunggu Admin.");
        setRevisiTrx(prev => prev.filter(t => t.id !== editingTrx.id));
        setEditingTrx(null); // Tutup
     } catch (err: any) {
        alert("Gagal menyimpan: " + err.message);
     } finally {
        setSaving(false);
     }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-rose-600 p-2 rounded-xl text-white shadow-xs">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Perbaikan Input Transaksi
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                {revisiTrx.length} Perlu Revisi
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Perbaiki data transaksi yang dikembalikan oleh Verifikator agar laporan tetap akurat.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-gray-400 font-bold text-[10px] uppercase">Total Nominal:</span>
            <span className="font-mono font-black text-gray-900">
              Rp {revisiTrx.reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center h-40 items-center"><Loader2 size={32} className="animate-spin text-amber-500"/></div>
      ) : revisiTrx.length === 0 ? (
         <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 shadow-xs">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Kerja Bagus! 🎉</h3>
            <p className="text-xs text-gray-500">Tidak ada transaksi yang perlu Anda perbaiki dari Verifikator.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {revisiTrx.map(trx => (
               <div key={trx.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-amber-400 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                  <div className="space-y-3">
                     <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Info size={12}/> Catatan Revisi:</p>
                        <p className="text-rose-900 font-semibold text-xs leading-relaxed">"{trx.catatan_verifikasi || 'Tidak ada pesan khusus.'}"</p>
                     </div>
                     <div>
                        <p className="text-[11px] font-semibold text-gray-400">{trx.tanggal}</p>
                        <p className="font-black text-base text-gray-900 mt-0.5">{trx.uraian}</p>
                     </div>
                  </div>
                  <button onClick={() => openEditor(trx)} className="h-9 w-full bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-200 hover:border-amber-500 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5">
                     <span>Buka Mode Edit</span>
                  </button>
               </div>
            ))}
         </div>
      )}

      {/* Editor Modal */}
      {editingTrx && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 md:p-6 overflow-y-auto backdrop-blur-sm">
             <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
                <div className="p-4 px-5 bg-amber-500 text-white flex justify-between items-center shrink-0">
                   <div>
                      <h3 className="text-base font-black">Edit & Kirim Ulang Transaksi</h3>
                      <p className="text-xs font-medium text-amber-100 mt-0.5">Catatan: {editingTrx.catatan_verifikasi}</p>
                   </div>
                   <button onClick={() => !saving && setEditingTrx(null)} className="p-1.5 bg-black/10 hover:bg-black/20 rounded-lg transition-colors"><X size={18}/></button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-gray-50/50 text-xs">
                    {/* Baris 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Transaksi</label>
                          <select value={editingTrx.tipe_kas} onChange={e => setEditingTrx({...editingTrx, tipe_kas: e.target.value})} className="w-full h-9 px-3 font-semibold bg-white border border-gray-200 rounded-xl outline-none text-xs">
                             <option value="Pengeluaran">🔴 Pengeluaran (Kredit)</option>
                             <option value="Pemasukan">🟢 Pemasukan (Debit)</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal</label>
                          <input type="date" value={editingTrx.tanggal} onChange={e => setEditingTrx({...editingTrx, tanggal: e.target.value})} className="w-full h-9 px-3 font-semibold bg-white border border-gray-200 rounded-xl outline-none text-xs" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nominal (Rp)</label>
                          <input type="number" value={editingTrx.nominal} onChange={e => setEditingTrx({...editingTrx, nominal: Number(e.target.value)})} className="w-full h-9 px-3 font-bold bg-white border border-gray-200 rounded-xl outline-none text-xs text-gray-800" />
                       </div>
                    </div>

                    {/* Baris 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Uraian Transaksi</label>
                          <input type="text" value={editingTrx.uraian} onChange={e => setEditingTrx({...editingTrx, uraian: e.target.value})} className="w-full h-9 px-3 font-semibold bg-white border border-gray-200 rounded-xl outline-none text-xs" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Toko / Rekanan</label>
                          <input type="text" value={editingTrx.toko || ''} onChange={e => setEditingTrx({...editingTrx, toko: e.target.value})} className="w-full h-9 px-3 font-semibold bg-white border border-gray-200 rounded-xl outline-none text-xs" />
                       </div>
                    </div>

                    {/* Baris 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-200/80">
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Akun (Opsional)</label>
                          <select value={editingTrx.ref_akun_id || ''} onChange={e => setEditingTrx({...editingTrx, ref_akun_id: e.target.value || null})} className="w-full h-9 px-2 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs">
                             <option value="">- Tanpa Akun -</option>
                             {listAkun.map(r => <option key={r.id} value={r.id}>{r.nama_akun}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Personel (Opsional)</label>
                          <select value={editingTrx.ref_personel_id || ''} onChange={e => setEditingTrx({...editingTrx, ref_personel_id: e.target.value || null})} className="w-full h-9 px-2 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs">
                             <option value="">- Tanpa Personel -</option>
                             {listPersonel.map(r => <option key={r.id} value={r.id}>{r.nama_orang}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Jenis Belanja</label>
                          <select value={editingTrx.ref_jenis_belanja_id || ''} onChange={e => setEditingTrx({...editingTrx, ref_jenis_belanja_id: e.target.value || null})} className="w-full h-9 px-2 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs">
                             <option value="">- Tanpa Belanja -</option>
                             {listBelanja.map(r => <option key={r.id} value={r.id}>{r.nama_belanja}</option>)}
                          </select>
                       </div>
                    </div>

                    {/* Baris 4 */}
                    <div className="bg-white border border-gray-200/80 p-4 rounded-xl space-y-3">
                       <h4 className="font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-1.5 text-xs"><UploadCloud size={14} className="text-indigo-600"/> Perbaikan Lampiran Foto</h4>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {[
                              { label: 'Nota', key: 'foto_nota', state: fileNota, setter: setFileNota },
                              { label: 'Kegiatan', key: 'foto_kegiatan', state: fileKeg, setter: setFileKeg },
                              { label: 'Barang', key: 'foto_barang', state: fileBrg, setter: setFileBrg },
                              { label: 'Transfer', key: 'foto_bukti_transfer', state: fileTrf, setter: setFileTrf }
                           ].map((item, idx) => {
                               const oldLinks = (editingTrx[item.key] || "").split(',').map((s:string) => s.trim()).filter(Boolean);
                               return (
                                  <div key={idx} className="bg-gray-50/60 p-3 rounded-xl border border-gray-200/60 space-y-2">
                                     <p className="text-[10px] font-bold text-gray-400 uppercase">[{item.label}] Foto Saat Ini</p>
                                     <div className="grid grid-cols-2 gap-2">
                                        {oldLinks.length === 0 ? <span className="text-[10px] text-gray-400 italic col-span-2">Tidak ada</span> : oldLinks.map((lnk: string, il: number) => {
                                            let imgSrc = lnk;
                                            const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
                                            if (gdriveMatch && gdriveMatch[1]) {
                                               imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w800`;
                                            }
                                            return (
                                                <div key={il} className="relative group overflow-hidden rounded-lg border shadow-2xs aspect-[4/3] bg-white">
                                                   <img src={imgSrc} onClick={() => setPreviewImage(imgSrc)} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onError={(e) => (e.target as any).src='https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png'}/>
                                                   <button onClick={() => removeOldPhoto(item.key, lnk)} className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                                                </div>
                                            );
                                        })}
                                     </div>
                                     <input 
                                        type="file" multiple accept="image/*" 
                                        onChange={(e) => item.setter(Array.from(e.target.files || []))} 
                                        className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 w-full bg-white p-1 rounded-lg border border-gray-200"
                                     />
                                  </div>
                               )
                           })}
                       </div>
                    </div>

                </div>

                <div className="p-3.5 px-5 bg-white border-t border-gray-100 shrink-0 flex justify-end gap-2">
                    <button disabled={saving} onClick={() => setEditingTrx(null)} className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors">Batal</button>
                    <button disabled={saving} onClick={kirimUlang} className="h-9 px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95">
                       {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} <span>Simpan & Kirim Ulang</span>
                    </button>
                </div>
             </div>
          </div>
      )}

      {/* Modal Pembesaran Gambar */}
      {previewImage && (
         <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview Bukti" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} onError={(e) => {
               (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
            }} />
            <button className="mt-4 bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors">
               Tutup
            </button>
         </div>
      )}

    </div>
  );
}
