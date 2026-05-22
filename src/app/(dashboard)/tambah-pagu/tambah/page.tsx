'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createTambahPagu } from '@/app/actions/tambah-pagu';
import Select from 'react-select';
import { 
  Save, ArrowLeft, FileText, Calendar, 
  Building2, Tag, DollarSign, MessageSquare, 
  UploadCloud, CheckCircle2, Loader2, Sparkles,
  Link as LinkIcon, Info
} from 'lucide-react';

export default function TambahPaguFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listUnit, setListUnit] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    tahun_anggaran: 2026,
    unit_id: null as any,
    jenis_tambah_pagu: 'Penugasan',
    status_pengajuan: 'Draft',
    
    // Data Pengajuan
    no_surat_pengajuan: '',
    tanggal_surat_pengajuan: new Date().toISOString().split('T')[0],
    hal_surat_pengajuan: '',
    subyek_pengajuan_di_simaster_persuratan: '',
    nominal_diajukan: '',
    link_surat_pengajuan: '',
    ringkasan_surat_pengajuan: '',
    
    // Data Tanggapan
    no_surat_tanggapan: '',
    tanggal_surat_tanggapan: '',
    hal_surat_tanggapan: '',
    subyek_tanggapan_di_simaster_persuratan: '',
    link_surat_tanggapan: '',
    nominal_tanggapan: '', // Point: Migrated from nominal_disetujui
  });

  const [filePengajuan, setFilePengajuan] = useState<File | null>(null);
  const [fileTanggapan, setFileTanggapan] = useState<File | null>(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    const { data } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
    if (data) {
      setListUnit(data.map(u => ({ value: u.id, label: u.nama_unit })));
    }
    setIsLoading(false);
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
    if (!formData.unit_id || !formData.no_surat_pengajuan) {
      alert("Mohon lengkapi data wajib (Unit & No Surat Pengajuan)");
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      
      // Map form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'unit_id') {
          data.append(key, value?.value || '');
        } else if (key === 'nominal_diajukan' || key === 'nominal_tanggapan') {
          data.append(key, value || '0');
        } else if (value !== null && value !== undefined) {
          data.append(key, value.toString());
        }
      });

      // Files
      if (filePengajuan) data.append('file_surat_pengajuan', filePengajuan);
      if (fileTanggapan) data.append('file_surat_tanggapan', fileTanggapan);

      // Gunakan API Route (Lebih Stabil)
      const response = await fetch('/api/tambah-pagu/tambah', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (result.success) {
        alert("Data Tambah Pagu Berhasil Disimpan!");
        router.push('/tambah-pagu');
      } else {
        throw new Error(result.error || "Gagal simpan via API");
      }
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-emerald-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-32 px-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles size={14} /> New Entry
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tambah Usulan Pagu</h1>
          <p className="text-gray-500 font-medium mt-1">Lengkapi formulir di bawah untuk mencatat usulan anggaran baru.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} /> KEMBALI
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* CARD 1: INFORMASI DASAR */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
            <Building2 size={120} />
          </div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 shadow-sm">
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
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-100 transition-all font-bold text-gray-700"
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
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-100 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
              >
                <option value="Penugasan">🚀 Penugasan</option>
                <option value="Inisiatif Unit">💡 Inisiatif Unit</option>
                <option value="Pindah Pagu">🔄 Pindah Pagu</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Status Saat Ini</label>
              <select 
                name="status_pengajuan"
                value={formData.status_pengajuan}
                onChange={handleInputChange}
                className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-black text-indigo-700 appearance-none cursor-pointer"
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

        {/* CARD 2: DATA PENGAJUAN (SURAT MASUK) */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shadow-sm">
              <FileText size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">I. Data Pengajuan (Surat Masuk)</h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No Surat Pengajuan</label>
                <input 
                  type="text" 
                  name="no_surat_pengajuan"
                  value={formData.no_surat_pengajuan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-100 transition-all font-bold text-gray-700"
                  placeholder="cth: 123/UN1/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Surat Pengajuan</label>
                <input 
                  type="date" 
                  name="tanggal_surat_pengajuan"
                  value={formData.tanggal_surat_pengajuan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-100 transition-all font-bold text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hal / Perihal Surat Pengajuan</label>
              <textarea 
                name="hal_surat_pengajuan"
                value={formData.hal_surat_pengajuan}
                onChange={handleInputChange}
                rows={2}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-100 transition-all font-medium text-gray-700"
                placeholder="Tulis perihal surat pengajuan..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subyek Pengajuan di Simaster</label>
              <input 
                type="text" 
                name="subyek_pengajuan_di_simaster_persuratan"
                value={formData.subyek_pengajuan_di_simaster_persuratan}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-blue-100 transition-all font-medium text-xs italic text-gray-500"
                placeholder="Salin subyek lengkap dari Simaster..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Link GDrive / SharePoint</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="link_surat_pengajuan"
                    value={formData.link_surat_pengajuan}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-blue-100 transition-all text-sm italic text-blue-600"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Upload File (Max 10MB)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => setFilePengajuan(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full py-3.5 px-6 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${filePengajuan ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-blue-300 group-hover:bg-blue-50/30'}`}>
                    <UploadCloud size={20} />
                    <span className="text-sm font-bold truncate max-w-[200px]">
                      {filePengajuan ? filePengajuan.name : "Pilih File Surat Pengajuan"}
                    </span>
                  </div>
                </div>
              </div>
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
                  <div className="flex gap-1">
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft', false); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all text-xs">Left</button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyCenter', false); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all text-xs">Center</button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyRight', false); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all text-xs">Right</button>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyFull', false); }} className="w-8 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all text-xs">Justify</button>
                  </div>
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false); }} className="px-3 h-8 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-all text-[10px] font-bold tracking-tighter">LIST •</button>
                </div>
                <div 
                  contentEditable
                  onInput={(e) => {
                    formData.ringkasan_surat_pengajuan = e.currentTarget.innerHTML;
                  }}
                  className="w-full p-8 outline-none font-medium text-gray-700 leading-relaxed text-sm min-h-[300px] bg-white focus:bg-emerald-50/5 transition-colors prose-custom"
                  dangerouslySetInnerHTML={{ __html: formData.ringkasan_surat_pengajuan }}
                />
                <style dangerouslySetInnerHTML={{ __html: `
                  .prose-custom ul {
                    list-style-type: disc !important;
                    list-style-position: inside !important;
                    padding-left: 1rem !important;
                    display: block !important;
                  }
                  .prose-custom li {
                    display: list-item !important;
                    margin-bottom: 0.5rem;
                  }
                  .prose-custom ol {
                    list-style-type: decimal !important;
                    list-style-position: inside !important;
                    padding-left: 1rem !important;
                  }
                `}} />
              </div>
              <p className="text-[9px] text-gray-400 px-4 italic">* Ketik teks, blok, lalu klik LIST • untuk membuat poin-poin.</p>
            </div>
          </div>
        </div>

        {/* CARD 3: DATA TANGGAPAN (SURAT KELUAR / APPROVAL) */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100 border-l-8 border-l-indigo-600">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">II. Data Tanggapan (Surat Keluar / Approval)</h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">No Surat Tanggapan</label>
                <input 
                  type="text" 
                  name="no_surat_tanggapan"
                  value={formData.no_surat_tanggapan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-gray-700"
                  placeholder="Input jika usulan sudah ditanggapi..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanggal Surat Tanggapan</label>
                <input 
                  type="date" 
                  name="tanggal_surat_tanggapan"
                  value={formData.tanggal_surat_tanggapan}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hal / Perihal Surat Tanggapan</label>
              <textarea 
                name="hal_surat_tanggapan"
                value={formData.hal_surat_tanggapan}
                onChange={handleInputChange}
                rows={2}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium text-gray-700"
                placeholder="Ringkasan keputusan dalam surat tanggapan..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subyek Tanggapan di Simaster</label>
              <input 
                type="text" 
                name="subyek_tanggapan_di_simaster_persuratan"
                value={formData.subyek_tanggapan_di_simaster_persuratan}
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium text-xs italic text-gray-500"
                placeholder="Salin subyek lengkap dari Simaster..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Link Surat Tanggapan</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="link_surat_tanggapan"
                    value={formData.link_surat_tanggapan}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-100 transition-all text-sm italic text-indigo-600"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Upload Surat Tanggapan</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => setFileTanggapan(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full py-3.5 px-6 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${fileTanggapan ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-indigo-300 group-hover:bg-indigo-50/30'}`}>
                    <UploadCloud size={20} />
                    <span className="text-sm font-bold truncate max-w-[200px]">
                      {fileTanggapan ? fileTanggapan.name : "Pilih File Surat Tanggapan"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

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
                  className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-black text-indigo-800 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING ACTION BAR */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-4">
            <button 
              type="button"
              onClick={() => router.back()}
              className="px-8 py-4 text-gray-400 hover:text-white font-bold text-sm transition-all uppercase tracking-widest"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-gray-900 py-4 rounded-[2rem] font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isSaving ? "SEDANG MENYIMPAN..." : "SIMPAN USULAN PAGU"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
