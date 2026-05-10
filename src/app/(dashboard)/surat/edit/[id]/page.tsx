'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateSuratRevisi } from '@/app/actions/surat';
import Select from 'react-select';
import { 
  Save, ArrowLeft, FileText, Calendar, 
  Building2, User, CheckCircle2, Loader2,
  ExternalLink, Info, Edit3
} from 'lucide-react';

export default function EditSuratPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listUnit, setListUnit] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({
    tahun_anggaran: 2026,
    unit_id: null,
    no_surat: '',
    perihal_surat: '',
    tanggal_surat: '',
    pic: '',
    tanggal_disposisi: '',
    tanggal_selesai: '',
    link_google_drive: '',
    jenis_json: [],
  });

  const [existingFile, setExistingFile] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [params.id]);

  const fetchInitialData = async () => {
    try {
      // 1. Ambil List Unit
      const { data: units } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
      const unitOptions = units?.map(u => ({ value: u.id, label: u.nama_unit })) || [];
      setListUnit(unitOptions);

      // 2. Ambil Data Surat
      const { data: surat, error } = await supabase
        .from('surat_revisi')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (surat) {
        setFormData({
          ...surat,
          unit_id: unitOptions.find(u => u.value === surat.unit_id) || null,
          jenis_json: Array.isArray(surat.jenis_json) ? surat.jenis_json : [],
        });
        setExistingFile(surat.file_upload || '');
      }
    } catch (error: any) {
      alert("Gagal memuat data surat: " + error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { 
        ...formData, 
        unit_id: formData.unit_id?.value 
      };
      
      // Cleanup payload
      delete payload.id;
      delete payload.created_at;
      delete payload.gov_units;

      const result = await updateSuratRevisi(params.id as string, payload);
      if (result.success) {
        alert("Arsip Surat Berhasil Diperbarui!");
        router.push('/surat');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert("Gagal update surat: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-32 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Edit3 size={14} /> Update Archive
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Edit Arsip Surat</h1>
          <p className="text-gray-500 font-medium mt-1">Perbarui detail dokumen atau status penyelesaian revisi.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} /> KEMBALI
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* CARD 1: INFO UTAMA */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
              <Info size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Detail Dokumen</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No Surat *</label>
              <input 
                type="text" 
                name="no_surat"
                value={formData.no_surat}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Surat *</label>
              <input 
                type="date" 
                name="tanggal_surat"
                value={formData.tanggal_surat}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-700"
              />
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Perihal Surat</label>
            <textarea 
              name="perihal_surat"
              value={formData.perihal_surat}
              onChange={handleInputChange}
              rows={2}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-700"
            />
          </div>
        </div>

        {/* CARD 2: UNIT & PIC */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
              <Building2 size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Unit & PIC Terkait</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Unit Kerja</label>
              <Select 
                options={listUnit} 
                value={formData.unit_id}
                onChange={(val) => setFormData({...formData, unit_id: val})}
                placeholder="Pilih Unit..."
                styles={{
                  control: (base) => ({ ...base, borderRadius: '1.25rem', padding: '0.4rem', border: 'none', backgroundColor: '#f9fafb', fontWeight: 'bold' }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">PIC / Person In Charge</label>
              <input 
                type="text" 
                name="pic"
                value={formData.pic}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* CARD 3: STATUS PROSES */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Status & Penyelesaian</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Disposisi</label>
              <input 
                type="date" 
                name="tanggal_disposisi"
                value={formData.tanggal_disposisi}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Selesai (Jika Sudah)</label>
              <input 
                type="date" 
                name="tanggal_selesai"
                value={formData.tanggal_selesai}
                onChange={handleInputChange}
                className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 font-black text-emerald-700"
              />
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <FileText size={32} className="text-gray-400" />
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">File Lampiran Terupload</p>
                 <p className="text-sm font-bold text-gray-600 truncate max-w-[300px]">{existingFile ? "Tersedia di Cloudflare R2" : "Tidak ada file"}</p>
               </div>
            </div>
            {existingFile && (
              <a href={existingFile} target="_blank" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-100">
                <ExternalLink size={16} /> LIHAT FILE
              </a>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full md:w-[400px] bg-gray-900 text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={24} className="animate-spin text-indigo-400" /> : <Save size={24} className="text-indigo-400" />}
            {isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
          </button>
        </div>
      </form>
    </div>
  );
}
