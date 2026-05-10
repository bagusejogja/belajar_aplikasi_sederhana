'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateTambahPagu } from '@/app/actions/tambah-pagu';
import Select from 'react-select';
import { 
  Save, ArrowLeft, FileText, Calendar, 
  Building2, Tag, DollarSign, MessageSquare, 
  UploadCloud, CheckCircle2, Loader2, Sparkles,
  Link as LinkIcon, Info, ExternalLink
} from 'lucide-react';

export default function EditPaguPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listUnit, setListUnit] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<any>({
    tahun_anggaran: 2026,
    unit_id: null,
    jenis_tambah_pagu: 'Penugasan',
    status_pengajuan: 'Draft',
    no_surat_pengajuan: '',
    tanggal_surat_pengajuan: '',
    hal_surat_pengajuan: '',
    subyek_pengajuan_di_simaster_persuratan: '',
    nominal_diajukan: '',
    link_surat_pengajuan: '',
    ringkasan_surat_pengajuan: '',
    no_surat_tanggapan: '',
    tanggal_surat_tanggapan: '',
    hal_surat_tanggapan: '',
    subyek_tanggapan_di_simaster_persuratan: '',
    link_surat_tanggapan: '',
    nominal_tanggapan: '', // Point: Migrated from nominal_disetujui
  });

  const [existingFiles, setExistingFiles] = useState({
    pengajuan: '',
    tanggapan: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, [params.id]);

  const fetchInitialData = async () => {
    try {
      const { data: units } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
      const unitOptions = units?.map(u => ({ value: u.id, label: u.nama_unit })) || [];
      setListUnit(unitOptions);

      const { data: pagu, error } = await supabase
        .from('tambah_pagu')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (pagu) {
        setFormData({
          ...pagu,
          unit_id: unitOptions.find(u => u.value === pagu.unit_id) || null,
        });
        setExistingFiles({
          pengajuan: pagu.file_surat_pengajuan || '',
          tanggapan: pagu.file_surat_tanggapan || ''
        });
      }
    } catch (error: any) {
      alert("Gagal memuat data: " + error.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: string) => {
    if (!num) return '';
    const clean = num.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (formatted: string) => {
    return formatted.replace(/\D/g, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nominal_diajukan' || name === 'nominal_tanggapan') {
      const numericValue = parseNumber(value);
      setFormData((prev: any) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData, unit_id: formData.unit_id?.value };
      
      // Pastikan nominal dikirim sebagai number murni ke DB
      const cleanPayload = {
        tahun_anggaran: payload.tahun_anggaran,
        unit_id: payload.unit_id,
        jenis_tambah_pagu: payload.jenis_tambah_pagu,
        status_pengajuan: payload.status_pengajuan,
        no_surat_pengajuan: payload.no_surat_pengajuan,
        tanggal_surat_pengajuan: payload.tanggal_surat_pengajuan,
        hal_surat_pengajuan: payload.hal_surat_pengajuan,
        subyek_pengajuan_di_simaster_persuratan: payload.subyek_pengajuan_di_simaster_persuratan,
        nominal_diajukan: parseInt(payload.nominal_diajukan || 0),
        link_surat_pengajuan: payload.link_surat_pengajuan,
        ringkasan_surat_pengajuan: payload.ringkasan_surat_pengajuan,
        no_surat_tanggapan: payload.no_surat_tanggapan,
        tanggal_surat_tanggapan: payload.tanggal_surat_tanggapan,
        hal_surat_tanggapan: payload.hal_surat_tanggapan,
        subyek_tanggapan_di_simaster_persuratan: payload.subyek_tanggapan_di_simaster_persuratan,
        link_surat_tanggapan: payload.link_surat_tanggapan,
        nominal_tanggapan: parseInt(payload.nominal_tanggapan || 0),
      };

      const result = await updateTambahPagu(params.id as string, cleanPayload);
      if (result.success) {
        alert("Perubahan Berhasil Disimpan!");
        router.push('/tambah-pagu');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert("Gagal update: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-emerald-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-32 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles size={14} /> Update Entry
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Edit Usulan Pagu</h1>
          <p className="text-gray-500 font-medium mt-1">Perbarui data usulan atau status persetujuan pagu.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} /> KEMBALI
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm">
              <Info size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Informasi Dasar</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tahun Anggaran</label>
              <input 
                type="number" 
                name="tahun_anggaran"
                value={formData.tahun_anggaran}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-gray-700"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Unit Kerja Pengaju *</label>
              <Select 
                options={listUnit} 
                value={formData.unit_id}
                onChange={(val) => setFormData({...formData, unit_id: val})}
                placeholder="Pilih Unit Kerja..."
                styles={{
                  control: (base) => ({ ...base, borderRadius: '1.25rem', padding: '0.4rem', border: '1px solid #f3f4f6', backgroundColor: '#f9fafb', fontWeight: 'bold' }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jenis Usulan</label>
              <select 
                name="jenis_tambah_pagu"
                value={formData.jenis_tambah_pagu}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
              >
                <option value="Penugasan">🚀 Penugasan</option>
                <option value="Inisiatif Unit">💡 Inisiatif Unit</option>
                <option value="Pindah Pagu">🔄 Pindah Pagu</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status Pengajuan</label>
              <select 
                name="status_pengajuan"
                value={formData.status_pengajuan}
                onChange={handleInputChange}
                className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-100 transition-all font-black text-emerald-700 appearance-none cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui Sebagian">Disetujui Sebagian</option>
                <option value="Disetujui Semua">Disetujui Semua</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nominal Usulan (Rp)</label>
              <input 
                type="text" 
                name="nominal_diajukan"
                value={formatNumber(formData.nominal_diajukan)}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-black text-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shadow-sm">
              <FileText size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">I. Data Pengajuan (Surat Masuk)</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No Surat Pengajuan</label>
                <input 
                  type="text" 
                  name="no_surat_pengajuan"
                  value={formData.no_surat_pengajuan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Surat Pengajuan</label>
                <input 
                  type="date" 
                  name="tanggal_surat_pengajuan"
                  value={formData.tanggal_surat_pengajuan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hal Surat Pengajuan</label>
              <textarea 
                name="hal_surat_pengajuan"
                value={formData.hal_surat_pengajuan}
                onChange={handleInputChange}
                rows={2}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">File Pengajuan Terupload</label>
              {existingFiles.pengajuan ? (
                <a 
                  href={existingFiles.pengajuan} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 font-bold hover:bg-blue-100 transition-all"
                >
                  <ExternalLink size={20} /> LIHAT FILE SURAT PENGIRIMAN
                </a>
              ) : (
                <p className="text-xs text-gray-400 italic p-4 bg-gray-50 rounded-2xl">Belum ada file terupload.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                Ringkasan Substansi Pengajuan <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[8px]">Rich Text Active</div>
              </label>
              <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm bg-white">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex flex-wrap gap-4 text-gray-400">
                  <div className="flex gap-1">
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all font-black">B</button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all italic">I</button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline', false); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all underline">U</button>
                  </div>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false); }} className="px-3 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all text-[10px] font-bold tracking-tighter">LIST •</button>
                </div>
                <div 
                  contentEditable
                  onInput={(e) => {
                    formData.ringkasan_surat_pengajuan = e.currentTarget.innerHTML;
                  }}
                  className="w-full p-8 outline-none font-medium text-gray-700 leading-relaxed text-sm min-h-[250px] prose-custom"
                  dangerouslySetInnerHTML={{ __html: formData.ringkasan_surat_pengajuan }}
                />
                <style dangerouslySetInnerHTML={{ __html: `
                  .prose-custom ul { list-style-type: disc !important; list-style-position: inside !important; padding-left: 1rem !important; }
                  .prose-custom li { display: list-item !important; margin-bottom: 0.5rem; }
                `}} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 border-l-8 border-l-indigo-600">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">II. Data Tanggapan (Approval)</h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No Surat Tanggapan</label>
                <input 
                  type="text" 
                  name="no_surat_tanggapan"
                  value={formData.no_surat_tanggapan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Surat Tanggapan</label>
                <input 
                  type="date" 
                  name="tanggal_surat_tanggapan"
                  value={formData.tanggal_surat_tanggapan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nominal Disetujui (Rp)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-500">Rp</span>
                  <input 
                    type="text" 
                    name="nominal_tanggapan"
                    value={formatNumber(formData.nominal_tanggapan)}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl pl-12 pr-4 py-4 outline-none font-black text-indigo-800 text-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">File Tanggapan Terupload</label>
                {existingFiles.tanggapan ? (
                  <a 
                    href={existingFiles.tanggapan} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 font-bold hover:bg-indigo-100 transition-all"
                  >
                    <ExternalLink size={20} /> LIHAT FILE SURAT TANGGAPAN
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 italic p-4 bg-gray-50 rounded-2xl">Belum ada file terupload.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center justify-between gap-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 text-gray-400 hover:text-white font-bold text-sm transition-all"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-[2rem] font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isSaving ? "MENYIMPAN..." : "UPDATE DATA PAGU"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Edit2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
}
