'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, UploadCloud, X, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';

export default function InputTransferPage() {
  const [listBelanja, setListBelanja] = useState<any[]>([]);
  const [listRekening, setListRekening] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
     tanggal: new Date().toISOString().split('T')[0],
     kategori_belanja_id: null as any,
     rek_tujuan_id: null as any,
     nominal: '',
     kegiatan: '',
     barang: '',
     catatan: ''
  });

  // Selected Rekening details for preview
  const [selectedRekeningDetail, setSelectedRekeningDetail] = useState<any>(null);

  // File Upload State
  type AttachmentState = { files: File[]; url: string };
  const [attachments, setAttachments] = useState<{ nota: AttachmentState, kegiatan: AttachmentState, barang: AttachmentState }>({
     nota: { files: [], url: '' },
     kegiatan: { files: [], url: '' },
     barang: { files: [], url: '' }
  });

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
     try {
        const [belanjaRes, rekRes] = await Promise.all([
           supabase.from('ref_jenis_belanja').select('*').eq('status', 'Aktif').order('id', { ascending: true }),
           supabase.from('master_rekening').select('*, ref_bank(nama_bank)').order('nama_rekening', { ascending: true })
        ]);

        if (belanjaRes.data) setListBelanja(belanjaRes.data);
        if (rekRes.data) setListRekening(rekRes.data);
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

  const handleRekeningChange = (val: any) => {
     setFormData({ ...formData, rek_tujuan_id: val });
     if (val) {
        const detail = listRekening.find(r => r.rek_id === val.value);
        setSelectedRekeningDetail(detail);
     } else {
        setSelectedRekeningDetail(null);
     }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof attachments) => {
     if (e.target.files && e.target.files.length > 0) {
         const newFiles = Array.from(e.target.files);
         const validFiles = newFiles.filter(f => f.size <= 3 * 1024 * 1024);
         if (validFiles.length < newFiles.length) {
             alert("Beberapa file diabaikan karena ukurannya melebihi 3MB.");
         }
         
         setAttachments(prev => ({
             ...prev,
             [key]: { files: [...prev[key].files, ...validFiles], url: '' } 
         }));
     }
  };

  const removeFile = (key: keyof typeof attachments, indexToRemove: number) => {
     setAttachments(prev => ({
         ...prev,
         [key]: {
             files: prev[key].files.filter((_, idx) => idx !== indexToRemove),
             url: ''
         }
     }));
  };

   const uploadMultipleFiles = async (files: File[]) => {
      if (files.length === 0) return '';
      
      const uploadPromises = files.map(async (file) => {
         try {
            const upData = new FormData();
            upData.append('file', file);
            upData.append('folder', 'transfer');

            const response = await fetch('/api/upload', {
               method: 'POST',
               body: upData
            });

            const result = await response.json();

            if (!result.success) {
               throw new Error(result.error || "Gagal upload file");
            }
            
            return result.publicUrl;
         } catch (err: any) {
            console.error("Gagal Upload via API:", err);
            throw err;
         }
      });

      const urls = await Promise.all(uploadPromises);
      return urls.join(',');
   };

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.kategori_belanja_id || !formData.rek_tujuan_id || !formData.nominal || !formData.kegiatan) {
        alert("Lengkapi Kategori Belanja, Dibayarkan Ke, Nominal, dan Uraian!");
        return;
     }

     setIsSaving(true);
     try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id || null;

        const notaUrl = attachments.nota.files.length > 0 ? await uploadMultipleFiles(attachments.nota.files) : attachments.nota.url;
        const kegiatanUrl = attachments.kegiatan.files.length > 0 ? await uploadMultipleFiles(attachments.kegiatan.files) : attachments.kegiatan.url;
        const barangUrl = attachments.barang.files.length > 0 ? await uploadMultipleFiles(attachments.barang.files) : attachments.barang.url;
        const nominalAngka = Number(formData.nominal) || 0;

        const { error } = await supabase.from('pengajuan_transfer').insert([
           {
              tanggal_pengajuan: formData.tanggal,
              kategori_belanja_id: formData.kategori_belanja_id.value,
              rek_tujuan_id: formData.rek_tujuan_id.value,
              nominal: nominalAngka,
              kegiatan: formData.kegiatan,
              barang: sessionData?.session?.user?.email || 'Sistem',
              catatan: formData.catatan,
              nota_url: notaUrl || null,
              foto_kegiatan: kegiatanUrl || null,
              foto_barang: barangUrl || null,
              status: 'Diajukan',
              created_by: currentUserId
           }
        ]);

        if (error) throw error;
        
        alert("Pengajuan Transfer BERHASIL disimpan dan menunggu persetujuan! 🚀");
        setFormData({ 
           tanggal: new Date().toISOString().split('T')[0], 
           kategori_belanja_id: null, 
           rek_tujuan_id: null, 
           nominal: '', 
           kegiatan: '', 
           barang: '', 
           catatan: '' 
        });
        setSelectedRekeningDetail(null);
        setAttachments({
           nota: { files: [], url: '' },
           kegiatan: { files: [], url: '' },
           barang: { files: [], url: '' }
        });
     } catch (err: any) {
        alert("Gagal menyimpan: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  if (isLoading) return <div className="h-64 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  const optionBelanja = listBelanja.map(b => ({ value: b.id, label: b.nama_belanja }));
  const optionRekening = listRekening.map(r => ({ value: r.rek_id, label: `${r.nama_rekening} - ${r.ref_bank?.nama_bank}` }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 overflow-hidden max-w-4xl mx-auto mt-6">
         
         <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
               <Send className="text-indigo-600" /> Pengajuan Pembayaran via Transfer
            </h1>
            <p className="text-gray-500 mt-1">Isi formulir di bawah ini untuk mengajukan pembayaran transfer bank.</p>
         </div>

         <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Pengajuan</label>
                  <input type="date" name="tanggal" value={formData.tanggal} readOnly className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-3.5 outline-none font-medium text-gray-500 cursor-not-allowed" />
               </div>
               
               <div className="space-y-2 relative z-50">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori Belanja <span className="text-red-500">*</span></label>
                  <Select options={optionBelanja} placeholder="Pilih Kategori..." value={formData.kategori_belanja_id} onChange={(val) => setFormData({...formData, kategori_belanja_id: val})} styles={{ control: (b) => ({...b, padding: '4px', borderRadius: '1rem', background: '#f9fafb'}) }} />
               </div>
            </div>

            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-50 space-y-4">
               <div className="space-y-2 relative z-40">
                  <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Dibayarkan Ke <span className="text-red-500">*</span></label>
                  <Select options={optionRekening} placeholder="Pilih Rekening Tujuan..." value={formData.rek_tujuan_id} onChange={handleRekeningChange} styles={{ control: (b) => ({...b, padding: '4px', borderRadius: '1rem', background: '#ffffff'}) }} />
               </div>
               
               {selectedRekeningDetail && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-indigo-100">
                     <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Nama Rek. Tujuan</p>
                        <p className="font-bold text-gray-800">{selectedRekeningDetail.nama_rekening}</p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Nomor Rekening</p>
                        <p className="font-mono font-bold text-gray-800">{selectedRekeningDetail.no_rekening}</p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Bank</p>
                        <p className="font-bold text-gray-800">{selectedRekeningDetail.ref_bank?.nama_bank}</p>
                     </div>
                  </div>
               )}
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nominal Transfer <span className="text-red-500">*</span></label>
               <div className="relative max-w-md">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-500">Rp</span>
                  <input type="number" name="nominal" value={formData.nominal} onChange={handleInputChange} required className="w-full bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl pl-12 pr-4 py-4 outline-none font-black text-2xl" placeholder="0" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Uraian <span className="text-red-500">*</span></label>
                  <input type="text" name="kegiatan" required value={formData.kegiatan} onChange={handleInputChange} placeholder="Contoh: Konsumsi Rapat..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3" />
               </div>
               <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Catatan Tambahan</label>
                  <textarea name="catatan" value={formData.catatan} onChange={handleInputChange} placeholder="Catatan opsional..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3" rows={2} />
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
               <label className="text-sm font-bold text-indigo-800 flex items-center gap-2"><UploadCloud/> Lampiran Foto (BISA PILIH LEBIH DARI 1 GAMBAR!)</label>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(Object.keys(attachments) as Array<keyof typeof attachments>).map((key) => {
                     const item = attachments[key];
                     const title = key === 'nota' ? 'Nota/Kwitansi' : key === 'kegiatan' ? 'Kegiatan' : 'Barang';
                     
                     return (
                        <div key={key} className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-start text-center relative hover:bg-gray-50 transition-all min-h-[160px] p-2">
                           <p className="font-bold text-xs text-gray-700 w-full mb-2 pt-2 border-b pb-2">📂 {title} - ({item.files.length} File)</p>
                           
                           <div className="w-full flex-1 overflow-y-auto max-h-[80px] space-y-1 mb-2">
                              {item.files.map((file, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-indigo-50 px-2 py-1 rounded text-[10px] text-indigo-700 font-bold mx-1">
                                    <span className="truncate max-w-[80%]">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(key, idx)} className="text-red-500 hover:bg-red-200 p-0.5 rounded"><X size={12}/></button>
                                 </div>
                              ))}
                           </div>
                           
                           <div className="w-full mt-auto">
                              <input 
                                 type="file" 
                                 multiple
                                 accept="image/*,.pdf"
                                 onChange={(e) => handleAttachmentChange(e, key as any)}
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <button type="button" className="w-full bg-indigo-100 text-indigo-700 font-bold text-[10px] py-1.5 rounded-xl flex items-center justify-center gap-1">
                                 <UploadCloud size={14}/> Pilih File
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
               <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-xl shadow-indigo-200 transition-all disabled:opacity-50"
               >
                  {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                  KIRIM PENGAJUAN
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
