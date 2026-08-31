'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Save, Loader2, UploadCloud, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activityLogger';
import Select from 'react-select';
import Link from 'next/link';

export default function EditPengajuanTransferPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

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

  const [initialStatus, setInitialStatus] = useState<string>('');

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
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
     try {
        const [belanjaRes, rekRes, detailRes] = await Promise.all([
           supabase.from('ref_jenis_belanja').select('*').eq('status', 'Aktif').order('id', { ascending: true }),
           supabase.from('master_rekening').select('*, ref_bank(nama_bank)').order('nama_rekening', { ascending: true }),
           supabase.from('pengajuan_transfer').select('*, master_rekening(*, ref_bank(nama_bank)), ref_jenis_belanja(*)').eq('id', id).single()
        ]);

        if (belanjaRes.data) setListBelanja(belanjaRes.data);
        if (rekRes.data) setListRekening(rekRes.data);

        if (detailRes.data) {
           const d = detailRes.data;
           setInitialStatus(d.status || '');
           
           let matchedBelanja = null;
           if (d.kategori_belanja_id && belanjaRes.data) {
              const b = belanjaRes.data.find(x => x.id === d.kategori_belanja_id);
              if (b) matchedBelanja = { value: b.id, label: b.nama_belanja };
           }

           let matchedRek = null;
           if (d.rek_tujuan_id && rekRes.data) {
              const r = rekRes.data.find(x => x.rek_id === d.rek_tujuan_id);
              if (r) {
                matchedRek = { value: r.rek_id, label: `${r.nama_rekening} - ${r.ref_bank?.nama_bank}` };
                setSelectedRekeningDetail(r);
              }
           }

           setFormData({
              tanggal: d.tanggal_pengajuan || new Date().toISOString().split('T')[0],
              kategori_belanja_id: matchedBelanja,
              rek_tujuan_id: matchedRek,
              nominal: d.nominal ? String(d.nominal) : '',
              kegiatan: d.kegiatan || '',
              barang: d.barang || '',
              catatan: d.catatan || ''
           });

           setAttachments({
              nota: { files: [], url: d.nota_url || '' },
              kegiatan: { files: [], url: d.foto_kegiatan || '' },
              barang: { files: [], url: d.foto_barang || '' }
           });
        }
     } catch (error) {
        console.error("Gagal menarik data detail pengajuan:", error);
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
             [key]: { ...prev[key], files: [...prev[key].files, ...validFiles] } 
         }));
     }
  };

  const removeFile = (key: keyof typeof attachments, indexToRemove: number) => {
     setAttachments(prev => ({
         ...prev,
         [key]: {
             ...prev[key],
             files: prev[key].files.filter((_, idx) => idx !== indexToRemove)
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

  const handleUpdateAndResubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.kategori_belanja_id || !formData.rek_tujuan_id || !formData.nominal || !formData.kegiatan) {
        alert("Lengkapi Kategori Belanja, Dibayarkan Ke, Nominal, dan Uraian!");
        return;
     }

     setIsSaving(true);
     try {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id || null;

        // Upload any new files and append to existing url
        let finalNota = attachments.nota.url;
        if (attachments.nota.files.length > 0) {
           const newUploaded = await uploadMultipleFiles(attachments.nota.files);
           finalNota = finalNota ? `${finalNota},${newUploaded}` : newUploaded;
        }

        let finalKegiatan = attachments.kegiatan.url;
        if (attachments.kegiatan.files.length > 0) {
           const newUploaded = await uploadMultipleFiles(attachments.kegiatan.files);
           finalKegiatan = finalKegiatan ? `${finalKegiatan},${newUploaded}` : newUploaded;
        }

        let finalBarang = attachments.barang.url;
        if (attachments.barang.files.length > 0) {
           const newUploaded = await uploadMultipleFiles(attachments.barang.files);
           finalBarang = finalBarang ? `${finalBarang},${newUploaded}` : newUploaded;
        }

        const nominalAngka = Number(formData.nominal) || 0;

        // Bersihkan catatan penolakan jika ada atau tambahkan keterangan revisi
        const cleanCatatan = formData.catatan;

        const { error } = await supabase.from('pengajuan_transfer').update({
           kategori_belanja_id: formData.kategori_belanja_id.value,
           rek_tujuan_id: formData.rek_tujuan_id.value,
           nominal: nominalAngka,
           kegiatan: formData.kegiatan,
           catatan: cleanCatatan,
           nota_url: finalNota || null,
           foto_kegiatan: finalKegiatan || null,
           foto_barang: finalBarang || null,
           status: 'Diajukan', // Otomatis reset status menjadi Diajukan
        }).eq('id', id);

        if (error) throw error;
        
        logActivity({
          user_id: currentUserId || undefined,
          user_email: sessionData?.session?.user?.email,
          action_type: 'UPDATE',
          action_title: `Revisi & Ajukan Ulang Transfer #${id}: Rp ${nominalAngka.toLocaleString('id-ID')} (${formData.kegiatan})`,
          module: 'MASJID',
          path: `/input-transfer/edit/${id}`,
          details: {
            id,
            nominal: nominalAngka,
            kegiatan: formData.kegiatan,
            tanggal: formData.tanggal,
            rek_tujuan_id: formData.rek_tujuan_id.value
          }
        });

        // Kirim Notifikasi Email
        const targetEmail = sessionData?.session?.user?.email;
        if (targetEmail) {
          try {
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: targetEmail,
                subject: `[Revisi & Diajukan Ulang] Transfer - Rp ${nominalAngka.toLocaleString('id-ID')} (${formData.kegiatan})`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #4f46e5; margin-top: 0;">Pengajuan Transfer Telah Diperbaiki & Diajukan Ulang</h2>
                    <p>Halo, pengajuan pembayaran transfer Anda dengan ID <strong>#${id}</strong> telah berhasil diperbaiki dan statusnya kini <strong>Diajukan Kembali</strong>.</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                      <tr>
                        <td style="padding: 8px 0; color: #64748b; width: 140px;"><strong>Tanggal:</strong></td>
                        <td style="padding: 8px 0; color: #1e293b;">${formData.tanggal}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b;"><strong>Nominal:</strong></td>
                        <td style="padding: 8px 0; color: #059669; font-weight: bold; font-size: 16px;">Rp ${nominalAngka.toLocaleString('id-ID')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b;"><strong>Uraian Kegiatan:</strong></td>
                        <td style="padding: 8px 0; color: #1e293b;">${formData.kegiatan}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #64748b;"><strong>Status Baru:</strong></td>
                        <td style="padding: 8px 0; color: #d97706; font-weight: bold;">Diajukan (Siap Ditinjau Ulang)</td>
                      </tr>
                    </table>
                    <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                      Pemberitahuan otomatis dari Sistem Keuangan & Verifikasi Online.
                    </div>
                  </div>
                `
              })
            }).catch(e => console.error("Gagal kirim notif email:", e));
          } catch (mailErr) {
            console.error("Gagal trigger send-email:", mailErr);
          }
        }

        alert("Pengajuan Transfer BERHASIL diperbaiki dan telah diajukan ulang ke reviewer! 🚀");
        router.push('/rekap-transfer');
     } catch (err: any) {
        alert("Gagal memperbarui: " + err.message);
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
         
         <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-6">
            <div>
              <Link href="/rekap-transfer" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-indigo-600 mb-2 transition-colors">
                <ArrowLeft size={14} /> Kembali ke Rekap
              </Link>
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                 <RefreshCw className="text-indigo-600" /> Perbaiki &amp; Ajukan Ulang Transfer
              </h1>
              <p className="text-gray-500 mt-1 text-xs">Perbaiki rincian pengajuan yang ditolak agar dapat ditinjau kembali oleh reviewer.</p>
            </div>
            {initialStatus && (
               <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                  initialStatus === 'Ditolak' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-700'
               }`}>
                  Status Saat Ini: {initialStatus}
               </span>
            )}
         </div>

         <form onSubmit={handleUpdateAndResubmit} className="space-y-8">
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Catatan Tambahan / Alasan Revisi</label>
                  <textarea name="catatan" value={formData.catatan} onChange={handleInputChange} placeholder="Catatan opsional atau keterangan revisi..." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3" rows={3} />
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
               <label className="text-sm font-bold text-indigo-800 flex items-center gap-2"><UploadCloud/> Tambah Lampiran Foto Baru</label>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(Object.keys(attachments) as Array<keyof typeof attachments>).map((key) => {
                     const item = attachments[key];
                     const title = key === 'nota' ? 'Nota/Kwitansi' : key === 'kegiatan' ? 'Kegiatan' : 'Barang';
                     
                     return (
                        <div key={key} className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-start text-center relative hover:bg-gray-50 transition-all min-h-[160px] p-2">
                           <p className="font-bold text-xs text-gray-700 w-full mb-2 pt-2 border-b pb-2">📂 {title} - ({item.files.length} File Baru)</p>
                           
                           {item.url && (
                              <p className="text-[10px] text-emerald-600 font-semibold mb-1">✓ Berkas lama tersimpan</p>
                           )}

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
                                 <UploadCloud size={14}/> Tambah File
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
                  {isSaving ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
                  SIMPAN PERBAIKAN &amp; AJUKAN ULANG
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
