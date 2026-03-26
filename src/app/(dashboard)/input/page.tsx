'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Info, ImagePlus, UploadCloud, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RefPersonel, RefJenisBelanja } from '@/types';
import Select from 'react-select';

export default function InputPage() {
  const [listPersonel, setListPersonel] = useState<RefPersonel[]>([]);
  const [listBelanja, setListBelanja] = useState<RefJenisBelanja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [tipeTransaksi, setTipeTransaksi] = useState<'Pengeluaran' | 'Pemasukan'>('Pengeluaran');
  const [formData, setFormData] = useState({
     tanggal: new Date().toISOString().split('T')[0],
     jenis_belanja_id: null as any,
     personel_id: null as any,
     toko: '',
     uraian: '',
     nominal: '',
  });

  // State File Update (Dukung Banyak File)
  type AttachmentState = { files: File[]; url: string };
  const [attachments, setAttachments] = useState<{
     nota: AttachmentState,
     kegiatan: AttachmentState,
     barang: AttachmentState,
     transfer: AttachmentState
  }>({
     nota: { files: [], url: '' },
     kegiatan: { files: [], url: '' },
     barang: { files: [], url: '' },
     transfer: { files: [], url: '' }
  });

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
     try {
        const [belanjaRes, personelRes] = await Promise.all([
           supabase.from('ref_jenis_belanja').select('*').eq('status', 'Aktif').order('id', { ascending: true }),
           supabase.from('ref_personel').select('*').eq('status', 'Aktif').order('id', { ascending: true })
        ]);

        if (belanjaRes.data) setListBelanja(belanjaRes.data as any);
        if (personelRes.data) setListPersonel(personelRes.data as any);
     } catch (error) {
        console.error("Gagal menarik data Master:", error);
     } finally {
        setIsLoading(false);
     }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
     const { name, value } = e.target;
     setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttachmentChange = (type: keyof typeof attachments, e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files.length > 0) {
         const newFiles = Array.from(e.target.files);
         // Filter ukuran
         const validFiles = newFiles.filter(f => f.size <= 3 * 1024 * 1024);
         if (validFiles.length < newFiles.length) {
             alert("Beberapa file diabaikan karena ukurannya melebihi 3MB.");
         }
         
         setAttachments(prev => ({ 
             ...prev, 
             [type]: { ...prev[type], files: [...prev[type].files, ...validFiles] } 
         }));
     }
  };

  const removeFile = (type: keyof typeof attachments, indexToRemove: number) => {
     setAttachments(prev => ({
         ...prev,
         [type]: {
             ...prev[type],
             files: prev[type].files.filter((_, idx) => idx !== indexToRemove)
         }
     }));
  };

  // Upload BANYAK FILE secara paralel dan kembalikan URL yang digabung koma
  const uploadMultipleFiles = async (files: File[]) => {
     if (files.length === 0) return '';
     
     const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from('receipts').upload(fileName, file);
        if (error) throw error;
        
        const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        return pubData.publicUrl;
     });

     const urls = await Promise.all(uploadPromises);
     return urls.join(','); // Pisahkan URL gambar dengan koma
  };

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.jenis_belanja_id || !formData.personel_id || !formData.uraian || !formData.nominal) {
        alert("Lengkapi Jenis Belanja, Personel, Uraian, dan Nominal!");
        return;
     }

     setIsSaving(true);
     try {
        const selectedBelanja = listBelanja.find(b => b.id === formData.jenis_belanja_id.value);
        if (!selectedBelanja) throw new Error("Jenis Belanja tidak valid");

        // Proses Gambar
        const notaUrl = attachments.nota.files.length > 0 ? await uploadMultipleFiles(attachments.nota.files) : attachments.nota.url;
        const kegiatanUrl = attachments.kegiatan.files.length > 0 ? await uploadMultipleFiles(attachments.kegiatan.files) : attachments.kegiatan.url;
        const barangUrl = attachments.barang.files.length > 0 ? await uploadMultipleFiles(attachments.barang.files) : attachments.barang.url;
        const transferUrl = attachments.transfer.files.length > 0 ? await uploadMultipleFiles(attachments.transfer.files) : attachments.transfer.url;

        const nominalAngka = Number(formData.nominal) || 0;
        const uang_masuk = tipeTransaksi === 'Pemasukan' ? nominalAngka : 0;
        const uang_keluar = tipeTransaksi === 'Pengeluaran' ? nominalAngka : 0;

        const { error } = await supabase.from('transactions').insert([
           {
              tanggal: formData.tanggal,
              akun_id: selectedBelanja.akun_id,
              personel_id: formData.personel_id.value,
              toko: formData.toko || null,
              uraian: formData.uraian,
              uang_masuk,
              uang_keluar,
              foto_nota: notaUrl || null,
              foto_kegiatan: kegiatanUrl || null,
              foto_barang: barangUrl || null,
              foto_bukti_transfer: transferUrl || null,
              disetujui: 'Menunggu'
           }
        ]);

        if (error) throw error;
        
        alert("Transaksi BERHASIL disimpan lengkap dengan Beberapa Fotonya! 🚀");
        setFormData({ tanggal: new Date().toISOString().split('T')[0], jenis_belanja_id: null, personel_id: null, toko: '', uraian: '', nominal: '' });
        setAttachments({
           nota: { files: [], url: '' }, kegiatan: { files: [], url: '' },
           barang: { files: [], url: '' }, transfer: { files: [], url: '' }
        });
     } catch (err: any) {
        alert("Gagal menyimpan: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  if (isLoading) return <div className="h-64 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  const optionBelanja = listBelanja.map(b => ({ value: b.id, label: b.nama_belanja }));
  const optionPersonel = listPersonel.map(p => ({ value: p.id, label: p.nama_orang }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 overflow-hidden max-w-5xl mx-auto">
         <form onSubmit={handleSave} className="space-y-8">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
               <button type="button" onClick={() => setTipeTransaksi('Pengeluaran')} className={`flex-1 flex justify-center items-center py-3 px-4 rounded-xl font-black transition-all ${tipeTransaksi === 'Pengeluaran' ? 'bg-red-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>PENGELUARAN KAS (-)</button>
               <button type="button" onClick={() => setTipeTransaksi('Pemasukan')} className={`flex-1 flex justify-center items-center py-3 px-4 rounded-xl font-black transition-all ${tipeTransaksi === 'Pemasukan' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>PEMASUKAN KAS (+)</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tgl Transaksi</label>
                  <input type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} required className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3.5 outline-none font-medium" />
               </div>
               <div className="space-y-2 relative z-50">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Barang / Kategori Belanja</label>
                  <Select options={optionBelanja} placeholder="Ketik disini..." value={formData.jenis_belanja_id} onChange={(val) => setFormData({...formData, jenis_belanja_id: val})} styles={{ control: (b) => ({...b, padding: '4px', borderRadius: '1rem', background: '#f9fafb'}) }} />
               </div>
               <div className="space-y-2 relative z-40">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Personel Pemohon</label>
                  <Select options={optionPersonel} placeholder="Cari..." value={formData.personel_id} onChange={(val) => setFormData({...formData, personel_id: val})} styles={{ control: (b) => ({...b, padding: '4px', borderRadius: '1rem', background: '#f9fafb'}) }} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal Rincian</label>
                  <div className="relative">
                     <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black ${tipeTransaksi === 'Pemasukan' ? 'text-emerald-500' : 'text-red-500'}`}>Rp</span>
                     <input type="number" name="nominal" value={formData.nominal} onChange={handleInputChange} required className={`w-full bg-${tipeTransaksi === 'Pemasukan' ? 'emerald' : 'red'}-50 border border-${tipeTransaksi === 'Pemasukan' ? 'emerald' : 'red'}-100 text-${tipeTransaksi === 'Pemasukan' ? 'emerald' : 'red'}-700 rounded-2xl pl-12 pr-4 py-4 outline-none font-black text-xl`} placeholder="0" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Toko & Catatan Uraian</label>
                  <div className="flex flex-col gap-2">
                     <input type="text" name="toko" value={formData.toko} onChange={handleInputChange} placeholder="Nama Toko..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3" />
                     <input type="text" name="uraian" required value={formData.uraian} onChange={handleInputChange} placeholder="Uraian Pembayaran..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3" />
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
               <label className="text-sm font-bold text-indigo-800 flex items-center gap-2"><UploadCloud/> Lampiran Foto (BISA PILIH LEBIH DARI 1 GAMBAR!)</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.keys(attachments) as Array<keyof typeof attachments>).map((key) => {
                     const item = attachments[key];
                     const title = key === 'nota' ? 'Nota/Kwitansi' : key === 'kegiatan' ? 'Kegiatan' : key === 'barang' ? 'Barang' : 'Bukti TF';
                     
                     return (
                        <div key={key} className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-start text-center relative hover:bg-gray-50 transition-all min-h-[160px] p-2">
                           <p className="font-bold text-xs text-gray-700 w-full mb-2 pt-2 border-b pb-2">📂 {title} - ({item.files.length} File)</p>
                           
                           {/* Daftar File List yang Dipilih */}
                           <div className="w-full flex-1 overflow-y-auto max-h-[80px] space-y-1 mb-2">
                              {item.files.map((file, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-indigo-50 px-2 py-1 rounded text-[10px] text-indigo-700 font-bold mx-1">
                                    <span className="truncate max-w-[80%]">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(key, idx)} className="text-red-500 hover:bg-red-200 p-0.5 rounded"><X size={12}/></button>
                                 </div>
                              ))}
                           </div>

                           <label className="cursor-pointer w-[90%] bg-white border border-gray-200 py-2 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all text-center">
                              + Pilih File / Foto
                              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAttachmentChange(key, e)} />
                           </label>
                           
                           {item.files.length === 0 && (
                              <input type="text" placeholder="Atau Link GDrive (Pakai Koma)..." value={item.url} onChange={(e) => setAttachments(p => ({ ...p, [key]: { ...p[key], url: e.target.value } }))} className="w-[90%] mt-2 bg-gray-50 border border-gray-200 text-[10px] p-2 rounded shadow-inner" />
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="flex justify-center pt-8 border-t border-gray-100">
               <button type="submit" disabled={isSaving} className="px-10 py-5 w-full bg-indigo-600 text-white rounded-2xl font-black shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-lg">
                  {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} {isSaving ? "Mengunggah..." : "SIMPAN"}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
