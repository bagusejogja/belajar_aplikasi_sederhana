'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Loader2, Send, Info, Trash2, UploadCloud, X } from 'lucide-react';

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
            keterangan: editingTrx.keterangan || null,
            toko: editingTrx.toko || null,
            ref_akun_id: editingTrx.ref_akun_id,
            ref_personel_id: editingTrx.ref_personel_id,
            ref_jenis_belanja_id: editingTrx.ref_jenis_belanja_id,
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
    <div className="space-y-6">
      <div className="bg-amber-500 rounded-3xl p-8 flex items-center justify-between text-white shadow-xl shadow-amber-200">
         <div>
            <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><ShieldAlert size={32}/> Perbaikan Input (Revisi Lengkap)</h2>
            <p className="text-amber-50 font-medium">Klik pada transaksi yang ditolak untuk mengedit semua rinciannya (tanggal, uang, hingga Foto Lampiran).</p>
         </div>
      </div>

      {loading ? (
         <div className="flex justify-center h-40 items-center"><Loader2 size={40} className="animate-spin text-amber-500"/></div>
      ) : revisiTrx.length === 0 ? (
         <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
            <h3 className="text-xl font-bold text-gray-700 mb-2">Kerja Bagus! 🎉</h3>
            <p>Tidak ada transaksi yang perlu Anda perbaiki dari Admin.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {revisiTrx.map(trx => (
               <div key={trx.id} className="bg-white p-6 rounded-3xl shadow-sm border border-red-200 flex flex-col gap-4 relative overflow-hidden group hover:border-red-400 transition-all cursor-pointer" onClick={() => openEditor(trx)}>
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-inner">
                     <p className="text-xs font-black text-red-800 uppercase tracking-widest mb-1 flex items-center gap-2"><Info size={14}/> CATATAN REVISI :</p>
                     <p className="text-red-900 font-medium text-sm">"{trx.catatan_verifikasi || 'Tidak ada pesan.'}"</p>
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-400">{trx.tanggal}</p>
                     <p className="font-black text-xl">{trx.uraian}</p>
                  </div>
                  <button className="bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white py-3 rounded-xl font-bold transition-colors">
                     BUKA MODE EDIT LENGKAP
                  </button>
               </div>
            ))}
         </div>
      )}

      {/* Editor Modal (Mini Input Form) */}
      {editingTrx && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-8 overflow-y-auto backdrop-blur-sm">
             <div className="bg-white max-w-4xl w-full rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-full">
                <div className="p-6 bg-amber-500 text-white flex justify-between items-center shrink-0">
                   <div>
                      <h3 className="text-2xl font-black">Edit & Kirim Ulang!</h3>
                      <p className="text-sm font-medium opacity-80">Catatan Admin: {editingTrx.catatan_verifikasi}</p>
                   </div>
                   <button onClick={() => !saving && setEditingTrx(null)} className="p-2 bg-black/20 hover:bg-red-500 rounded-full transition-colors"><X size={24}/></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/50">
                    {/* Baris 1: Tipe, Tanggal, Nominal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Tipe Transaksi</label>
                          <select value={editingTrx.tipe_kas} onChange={e => setEditingTrx({...editingTrx, tipe_kas: e.target.value})} className="w-full mt-2 p-3 font-bold bg-white border border-gray-200 rounded-xl outline-none">
                             <option value="Pengeluaran">🔴 Keluar (Kredit)</option>
                             <option value="Pemasukan">🟢 Masuk (Debit)</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Tanggal</label>
                          <input type="date" value={editingTrx.tanggal} onChange={e => setEditingTrx({...editingTrx, tanggal: e.target.value})} className="w-full mt-2 p-3 font-bold bg-white border border-gray-200 rounded-xl outline-none" />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Nominal Uang Asli</label>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="bg-gray-100 p-3 rounded-xl border font-black text-gray-500">Rp</span>
                             <input type="number" value={editingTrx.nominal} onChange={e => setEditingTrx({...editingTrx, nominal: Number(e.target.value)})} className="w-full p-3 font-black bg-white border border-gray-200 rounded-xl outline-none" />
                          </div>
                       </div>
                    </div>

                    {/* Baris 2: Uraian, Toko */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Uraian Transaksi</label>
                          <input type="text" value={editingTrx.uraian} onChange={e => setEditingTrx({...editingTrx, uraian: e.target.value})} className="w-full mt-2 p-3 font-bold bg-white border border-gray-200 rounded-xl outline-none" />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Nama Toko (Jika Ada)</label>
                          <input type="text" value={editingTrx.toko || ''} onChange={e => setEditingTrx({...editingTrx, toko: e.target.value})} className="w-full mt-2 p-3 font-bold bg-white border border-gray-200 rounded-xl outline-none" />
                       </div>
                    </div>

                    {/* Baris 3: Dropdown Referensi Standar (Bukan React-Select, agar simpel saat edit) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-4 rounded-2xl border border-gray-100">
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Akun (Opsional)</label>
                          <select value={editingTrx.ref_akun_id || ''} onChange={e => setEditingTrx({...editingTrx, ref_akun_id: e.target.value || null})} className="w-full p-3 font-bold bg-gray-50 border rounded-xl outline-none text-sm">
                             <option value="">- Tanpa Akun -</option>
                             {listAkun.map(r => <option key={r.id} value={r.id}>{r.nama_akun}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Pihak / Personel (Opsional)</label>
                          <select value={editingTrx.ref_personel_id || ''} onChange={e => setEditingTrx({...editingTrx, ref_personel_id: e.target.value || null})} className="w-full p-3 font-bold bg-gray-50 border rounded-xl outline-none text-sm">
                             <option value="">- Tanpa Personel -</option>
                             {listPersonel.map(r => <option key={r.id} value={r.id}>{r.nama_orang}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Jenis Belanja (Opsional)</label>
                          <select value={editingTrx.ref_jenis_belanja_id || ''} onChange={e => setEditingTrx({...editingTrx, ref_jenis_belanja_id: e.target.value || null})} className="w-full p-3 font-bold bg-gray-50 border rounded-xl outline-none text-sm">
                             <option value="">- Tanpa Belanja -</option>
                             {listBelanja.map(r => <option key={r.id} value={r.id}>{r.nama_belanja}</option>)}
                          </select>
                       </div>
                    </div>

                    {/* Baris 4: Foto / Bukti */}
                    <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl">
                       <h4 className="font-black text-indigo-900 mb-4 border-b border-indigo-100 pb-2 flex items-center gap-2"><UploadCloud size={18}/> Perbaikan Lampiran Foto</h4>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {[
                              { label: 'Nota', key: 'foto_nota', state: fileNota, setter: setFileNota },
                              { label: 'Kegiatan', key: 'foto_kegiatan', state: fileKeg, setter: setFileKeg },
                              { label: 'Barang', key: 'foto_barang', state: fileBrg, setter: setFileBrg },
                              { label: 'Transfer', key: 'foto_bukti_transfer', state: fileTrf, setter: setFileTrf }
                           ].map((item, idx) => {
                               const oldLinks = (editingTrx[item.key] || "").split(',').map((s:string) => s.trim()).filter(Boolean);
                               return (
                                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200">
                                     <p className="text-xs font-black text-gray-500 uppercase mb-2">[{item.label}] LAMA</p>
                                     <div className="flex gap-2 flex-wrap mb-3 min-h-[40px]">
                                        {oldLinks.length === 0 ? <span className="text-[10px] text-gray-300 italic">Kosong</span> : oldLinks.map((lnk: string, il: number) => (
                                            <div key={il} className="relative group">
                                               <img src={lnk} className="w-12 h-12 object-cover rounded shadow-sm border" onError={(e) => (e.target as any).src='https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png'}/>
                                               <button onClick={() => removeOldPhoto(item.key, lnk)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"><Trash2 size={10} /></button>
                                            </div>
                                        ))}
                                     </div>
                                     <p className="text-xs font-black text-indigo-500 uppercase mb-2">[{item.label}] UPLOAD BARU</p>
                                     <input 
                                        type="file" multiple accept="image/*" 
                                        onChange={(e) => item.setter(Array.from(e.target.files || []))} 
                                        className="text-[10px] text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 w-full"
                                     />
                                  </div>
                               )
                           })}
                       </div>
                    </div>

                </div>

                <div className="p-6 bg-white border-t border-gray-100 shrink-0 flex gap-4">
                    <button disabled={saving} onClick={() => setEditingTrx(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-xl transition-colors">Batal Edit</button>
                    <button disabled={saving} onClick={kirimUlang} className="flex-[2] bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 tracking-widest">
                       {saving ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />} SIMPAN & KIRIM ULANG KE PEJABAT
                    </button>
                </div>
             </div>
          </div>
      )}

    </div>
  );
}
