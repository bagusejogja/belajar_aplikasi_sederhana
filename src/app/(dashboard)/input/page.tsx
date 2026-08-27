'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, Info, ImagePlus, UploadCloud, X, Send, FileEdit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RefPersonel, RefJenisBelanja } from '@/types';
import Select from 'react-select';
import toast from 'react-hot-toast';

export default function InputPage() {
  const [listPersonel, setListPersonel] = useState<RefPersonel[]>([]);
  const [listBelanja, setListBelanja] = useState<RefJenisBelanja[]>([]);
  const [listRekening, setListRekening] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [tipeTransaksi, setTipeTransaksi] = useState<'Pengeluaran' | 'Pemasukan' | 'Transfer'>('Pengeluaran');
  const [formData, setFormData] = useState({
     tanggal: new Date().toISOString().split('T')[0],
     jenis_belanja_id: null as any,
     personel_id: null as any,
     rek_tujuan_id: null as any,
     toko: '',
     uraian: '',
     nominal: '',
     catatan: ''
  });

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
        const [belanjaRes, personelRes, rekRes] = await Promise.all([
           supabase.from('ref_jenis_belanja').select('*').eq('status', 'Aktif').order('id', { ascending: true }),
           supabase.from('ref_personel').select('*').eq('status', 'Aktif').order('id', { ascending: true }),
           supabase.from('master_rekening').select('*, ref_bank(nama_bank)').order('nama_rekening', { ascending: true })
        ]);

        if (belanjaRes.data) setListBelanja(belanjaRes.data as any);
        if (personelRes.data) setListPersonel(personelRes.data as any);
        if (rekRes.data) setListRekening(rekRes.data as any);
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

   const uploadMultipleFiles = async (files: File[]) => {
      if (files.length === 0) return '';
      
      const uploadPromises = files.map(async (file) => {
         const fileExt = file.name.split('.').pop();
         const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
         const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}`;
         
         const uploadFormData = new FormData();
         uploadFormData.append('file', file);
         uploadFormData.append('fileName', fileName);

         const response = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
         });

         const result = await response.json();
         if (!response.ok || !result.success) {
            throw new Error(result.error || `Gagal mengunggah file ${file.name}`);
         }
         return result.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls.filter(Boolean).join(', ');
   };

  const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.nominal || isNaN(Number(formData.nominal))) {
        toast.error("Nominal transaksi harus diisi dengan angka valid!");
        return;
     }

     if (tipeTransaksi === 'Transfer' && !formData.rek_tujuan_id) {
        toast.error("Rekening Tujuan wajib dipilih untuk transaksi Transfer!");
        return;
     }

     if (tipeTransaksi !== 'Transfer' && !formData.jenis_belanja_id) {
        toast.error("Jenis Belanja / Kategori wajib dipilih!");
        return;
     }

     if (tipeTransaksi !== 'Transfer' && !formData.personel_id) {
        toast.error("Personel Pemohon wajib dipilih!");
        return;
     }

     setIsSaving(true);
     try {
        const nominalAngka = Number(formData.nominal);
        const selectedBelanja = listBelanja.find(b => b.id === formData.jenis_belanja_id?.value);
        const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;

        const notaUrl = attachments.nota.files.length > 0 ? await uploadMultipleFiles(attachments.nota.files) : attachments.nota.url;
        const kegiatanUrl = attachments.kegiatan.files.length > 0 ? await uploadMultipleFiles(attachments.kegiatan.files) : attachments.kegiatan.url;
        const barangUrl = attachments.barang.files.length > 0 ? await uploadMultipleFiles(attachments.barang.files) : attachments.barang.url;

        if (tipeTransaksi === 'Transfer') {
           const { error } = await supabase.from('pengajuan_transfer').insert([
              {
                 tgl_pengajuan: formData.tanggal,
                 jenis_belanja_id: formData.jenis_belanja_id ? formData.jenis_belanja_id.value : null,
                 rek_tujuan_id: formData.rek_tujuan_id.value,
                 nominal: nominalAngka,
                 uraian: formData.uraian,
                 catatan: formData.catatan || null,
                 status_approval: 'Menunggu',
                 foto_nota: notaUrl || null,
                 foto_kegiatan: kegiatanUrl || null,
                 foto_barang: barangUrl || null,
                 created_by: currentUserId
              }
           ]);
           if (error) throw error;
        } else {
           if (!selectedBelanja) throw new Error("Jenis Belanja tidak valid");
           const transferUrl = attachments.transfer.files.length > 0 ? await uploadMultipleFiles(attachments.transfer.files) : attachments.transfer.url;
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
                 disetujui: 'Menunggu',
                 created_by: currentUserId
              }
           ]);
           if (error) throw error;
        }
        
        toast.success(`Data ${tipeTransaksi} berhasil disimpan!`);
        setFormData({ tanggal: new Date().toISOString().split('T')[0], jenis_belanja_id: null, personel_id: null, rek_tujuan_id: null, toko: '', uraian: '', nominal: '', catatan: '' });
        setAttachments({
           nota: { files: [], url: '' }, kegiatan: { files: [], url: '' },
           barang: { files: [], url: '' }, transfer: { files: [], url: '' }
        });
     } catch (err: any) {
        toast.error("Gagal menyimpan: " + err.message);
     } finally {
        setIsSaving(false);
     }
  };

  if (isLoading) return <div className="h-64 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  const optionBelanja = listBelanja.map(b => ({ value: b.id, label: b.nama_belanja }));
  const optionPersonel = listPersonel.map(p => ({ value: p.id, label: p.nama_orang }));
  const optionRekening = listRekening.map(r => ({
      value: r.rek_id,
      label: `${r.nama_rekening} - ${r.ref_bank?.nama_bank} (${r.no_rekening})`
  }));

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <FileEdit size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Input Transaksi Kas Masjid
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {tipeTransaksi}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Pencatatan pengeluaran, pemasukan, dan pengajuan transfer dana masjid.
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1">
          <button 
            type="button" 
            onClick={() => setTipeTransaksi('Pengeluaran')} 
            className={`h-7 px-3 rounded-lg font-bold text-xs transition-all ${tipeTransaksi === 'Pengeluaran' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Pengeluaran (-)
          </button>
          <button 
            type="button" 
            onClick={() => setTipeTransaksi('Pemasukan')} 
            className={`h-7 px-3 rounded-lg font-bold text-xs transition-all ${tipeTransaksi === 'Pemasukan' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Pemasukan (+)
          </button>
          <button 
            type="button" 
            onClick={() => setTipeTransaksi('Transfer')} 
            className={`h-7 px-3 rounded-lg font-bold text-xs transition-all ${tipeTransaksi === 'Transfer' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Transfer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 md:p-6 overflow-hidden">
         <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">{tipeTransaksi === 'Transfer' ? 'Tgl Pengajuan' : 'Tgl Transaksi'}</label>
                  <input type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} required className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700" />
               </div>
               <div className="space-y-1.5 relative z-50">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">{tipeTransaksi === 'Transfer' ? 'Kategori Belanja' : 'Barang / Kategori Belanja'}</label>
                  <Select options={optionBelanja} placeholder="Pilih Kategori..." value={formData.jenis_belanja_id} onChange={(val) => setFormData({...formData, jenis_belanja_id: val})} className="text-xs" styles={{ control: (b) => ({...b, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', background: '#f9fafb', fontSize: '0.75rem', fontWeight: '600'}), valueContainer: (b) => ({ ...b, padding: '0 8px' }) }} />
               </div>
               {tipeTransaksi === 'Transfer' ? (
                  <div className="space-y-1.5 relative z-40">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Dibayarkan Ke (Rekening)</label>
                     <Select options={optionRekening} placeholder="Pilih Rekening Tujuan..." value={formData.rek_tujuan_id} onChange={(val) => setFormData({...formData, rek_tujuan_id: val})} className="text-xs" styles={{ control: (b) => ({...b, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', background: '#f9fafb', fontSize: '0.75rem', fontWeight: '600'}), valueContainer: (b) => ({ ...b, padding: '0 8px' }) }} />
                  </div>
               ) : (
                  <div className="space-y-1.5 relative z-40">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Personel Pemohon</label>
                     <Select options={optionPersonel} placeholder="Cari Personel..." value={formData.personel_id} onChange={(val) => setFormData({...formData, personel_id: val})} className="text-xs" styles={{ control: (b) => ({...b, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', background: '#f9fafb', fontSize: '0.75rem', fontWeight: '600'}), valueContainer: (b) => ({ ...b, padding: '0 8px' }) }} />
                  </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Nominal {tipeTransaksi === 'Transfer' ? 'Transfer' : 'Rincian'}</label>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-400">Rp</span>
                     <input type="number" name="nominal" value={formData.nominal} onChange={handleInputChange} required className="w-full h-9 pl-9 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-bold text-xs text-gray-700" placeholder="0" />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Uraian / Rincian Kegiatan</label>
                  <div className="flex flex-col gap-2">
                     {tipeTransaksi !== 'Transfer' && (
                        <input type="text" name="toko" value={formData.toko} onChange={handleInputChange} placeholder="Nama Toko / Rekanan..." className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700" />
                     )}
                     <input type="text" name="uraian" required value={formData.uraian} onChange={handleInputChange} placeholder={tipeTransaksi === 'Transfer' ? "Contoh: Honor Narasumber A.n Budi..." : "Uraian Pembayaran..."} className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700" />
                     {tipeTransaksi === 'Transfer' && (
                        <input type="text" name="catatan" value={formData.catatan} onChange={handleInputChange} placeholder="Catatan Opsional..." className="w-full h-9 px-3 bg-amber-50/40 hover:bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 ring-amber-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700" />
                     )}
                  </div>
               </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
               <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5"><UploadCloud size={14} className="text-indigo-600"/> Lampiran Foto Bukti</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(Object.keys(attachments) as Array<keyof typeof attachments>).map((key) => {
                     if (tipeTransaksi === 'Transfer' && key === 'transfer') return null;
                     
                     const item = attachments[key];
                     const title = key === 'nota' ? 'Nota / Kwitansi' : key === 'kegiatan' ? 'Foto Kegiatan' : key === 'barang' ? 'Foto Barang' : 'Bukti Transfer';
                     
                     return (
                        <div key={key} className="border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-start text-center hover:bg-gray-50 transition-all p-2.5 space-y-1.5">
                           <p className="font-bold text-[11px] text-gray-700 w-full pb-1 border-b border-gray-100">{title} ({item.files.length})</p>
                           
                           <div className="w-full flex-1 overflow-y-auto max-h-[60px] space-y-1">
                              {item.files.map((file, idx) => (
                                 <div key={idx} className="flex items-center justify-between bg-indigo-50 px-2 py-0.5 rounded-lg text-[10px] text-indigo-700 font-bold">
                                    <span className="truncate max-w-[80%]">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(key, idx)} className="text-rose-500 hover:bg-rose-100 p-0.5 rounded"><X size={11}/></button>
                                 </div>
                              ))}
                           </div>

                           <label className="cursor-pointer w-full bg-white border border-gray-200 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 shadow-2xs transition-all text-center block">
                              + Pilih File
                              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAttachmentChange(key, e)} />
                           </label>
                           
                           {item.files.length === 0 && (
                              <input type="text" placeholder="Atau Link GDrive..." value={item.url} onChange={(e) => setAttachments(p => ({ ...p, [key]: { ...p[key], url: e.target.value } }))} className="w-full bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded-lg outline-none font-mono" />
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
               <button type="submit" disabled={isSaving} className={`h-10 px-6 ${tipeTransaksi === 'Pemasukan' ? 'bg-emerald-600 hover:bg-emerald-700' : tipeTransaksi === 'Transfer' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'} text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95`}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : (tipeTransaksi === 'Transfer' ? <Send size={14} /> : <Save size={14} />)} 
                  <span>{isSaving ? "Mengunggah..." : (tipeTransaksi === 'Transfer' ? "Kirim Pengajuan Transfer" : "Simpan Transaksi Kas")}</span>
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
