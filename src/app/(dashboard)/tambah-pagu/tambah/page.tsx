'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import { 
  Save, ArrowLeft, FileText, Calendar, 
  Building2, Tag, DollarSign, MessageSquare, 
  UploadCloud, CheckCircle2, Loader2, Sparkles,
  Link as LinkIcon, Info, Search, Lock, X, RefreshCw, AlertCircle
} from 'lucide-react';

export default function TambahPaguFormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [listUnit, setListUnit] = useState<any[]>([]);
  
  // Analisis Riwayat Modal & Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listAnalisis, setListAnalisis] = useState<any[]>([]);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [searchAnalisis, setSearchAnalisis] = useState('');
  const [selectedAnalisis, setSelectedAnalisis] = useState<any | null>(null);

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
    nominal_tanggapan: '',
  });

  const [filePengajuan, setFilePengajuan] = useState<File | null>(null);
  const [fileTanggapan, setFileTanggapan] = useState<File | null>(null);

  useEffect(() => {
    fetchUnits();
    fetchAnalisisAndUsed();
  }, []);

  const fetchUnits = async () => {
    const { data } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
    if (data) {
      setListUnit(data.map(u => ({ value: u.id, label: u.nama_unit })));
    }
    setIsLoading(false);
  };

  const fetchAnalisisAndUsed = async () => {
    setLoadingAnalisis(true);
    try {
      // 1. Fetch all records from app_analisis_utama
      const { data: dataAnalisis } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, tanggal_surat, perihal, unit_pengirim, total_anggaran, nominal_disetujui, keputusan, link_lampiran, subyek_persuratan_simaster, analisis_html, created_at')
        .order('created_at', { ascending: false });

      // 2. Fetch existing tambah_pagu to check used no_surat
      const { data: dataTambahPagu } = await supabase
        .from('tambah_pagu')
        .select('no_surat_pengajuan, no_surat_tanggapan');

      const usedNoSuratSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
        });
      }

      if (dataAnalisis) {
        const processed = dataAnalisis.map(item => {
          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          const isUsed = usedNoSuratSet.has(cleanNoSurat);

          let subyekSimaster = item.subyek_persuratan_simaster || '';
          let keputusan = item.keputusan || '';
          let nominalDisetujui = item.nominal_disetujui || '0';

          if (item.analisis_html) {
            try {
              const parsed = JSON.parse(item.analisis_html);
              if (!subyekSimaster && parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
              if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
              if (nominalDisetujui === '0' && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
            } catch(e) {}
          }

          return {
            ...item,
            subyek_persuratan_simaster: subyekSimaster,
            keputusan: keputusan || 'diajukan',
            nominal_disetujui: nominalDisetujui,
            is_used: isUsed
          };
        });

        setListAnalisis(processed);
      }
    } catch (e) {
      console.error("Gagal load data analisis:", e);
    }
    setLoadingAnalisis(false);
  };

  const cleanNumericString = (val: any) => {
    if (!val) return '';
    const s = val.toString().trim();
    if (!s.includes(',') && s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 2 && parts[0].length > 3) {
        return Math.round(parseFloat(s) || 0).toString();
      }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return Math.round(parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0).toString();
  };

  const handleSelectAnalisis = (item: any) => {
    if (item.is_used) {
      alert(`⚠️ Surat ini (No: ${item.no_surat || '-'}) sudah pernah digunakan di Tambah Pagu! Silakan pilih surat lain atau input manual.`);
      return;
    }

    // Match unit_pengirim to listUnit
    let matchedUnit = null;
    if (item.unit_pengirim && listUnit.length > 0) {
      const rawUnitLower = item.unit_pengirim.toLowerCase();
      matchedUnit = listUnit.find(u => 
        u.label.toLowerCase() === rawUnitLower ||
        u.label.toLowerCase().includes(rawUnitLower) ||
        rawUnitLower.includes(u.label.toLowerCase())
      );
    }

    // Map keputusan to status_pengajuan
    let statusMapped = 'Draft';
    const kep = (item.keputusan || '').toLowerCase();
    if (kep === 'disetujui semua' || kep === 'disetujui 100%') statusMapped = 'Disetujui Semua';
    else if (kep === 'disetujui sebagian') statusMapped = 'Disetujui Sebagian';
    else if (kep === 'ditolak') statusMapped = 'Ditolak';
    else statusMapped = 'Diajukan';

    const numDiajukan = cleanNumericString(item.total_anggaran);
    const numDisetujui = cleanNumericString(item.nominal_disetujui);

    setFormData(prev => ({
      ...prev,
      unit_id: matchedUnit || prev.unit_id,
      no_surat_pengajuan: item.no_surat || prev.no_surat_pengajuan,
      tanggal_surat_pengajuan: item.tanggal_surat || prev.tanggal_surat_pengajuan,
      hal_surat_pengajuan: item.perihal || prev.hal_surat_pengajuan,
      subyek_pengajuan_di_simaster_persuratan: item.subyek_persuratan_simaster || prev.subyek_pengajuan_di_simaster_persuratan,
      nominal_diajukan: numDiajukan || prev.nominal_diajukan,
      nominal_tanggapan: numDisetujui !== '0' ? numDisetujui : prev.nominal_tanggapan,
      status_pengajuan: statusMapped,
      link_surat_pengajuan: item.link_lampiran || prev.link_surat_pengajuan
    }));

    setSelectedAnalisis(item);
    setIsModalOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedAnalisis(null);
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

      // Submit via API Route
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

  const filteredAnalisisList = listAnalisis.filter(item => {
    if (!searchAnalisis) return true;
    const lower = searchAnalisis.toLowerCase();
    return (
      (item.no_surat && item.no_surat.toLowerCase().includes(lower)) ||
      (item.perihal && item.perihal.toLowerCase().includes(lower)) ||
      (item.unit_pengirim && item.unit_pengirim.toLowerCase().includes(lower)) ||
      (item.subyek_persuratan_simaster && item.subyek_persuratan_simaster.toLowerCase().includes(lower))
    );
  });

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-emerald-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-32 px-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles size={14} /> New Entry
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tambah Usulan Pagu</h1>
          <p className="text-gray-500 font-medium mt-1">Impor dari hasil analisis AI atau ketik manual untuk mencatat usulan baru.</p>
        </div>
        <button 
          onClick={() => router.push('/tambah-pagu')}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-xs"
        >
          <ArrowLeft size={18} /> KEMBALI
        </button>
      </div>

      {/* IMPORT BANNER SECTION */}
      <div className="mb-10">
        {!selectedAnalisis ? (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
                <Sparkles size={14} /> Impor Data Otomatis
              </div>
              <h3 className="text-xl font-black text-white">Impor dari Hasil Analisis Pagu (/analisis)</h3>
              <p className="text-slate-300 text-xs font-medium max-w-xl">
                Pilih dokumen analisis surat yang sudah ada di modul /analisis agar tidak perlu mengetik ulang data pengajuan, unit, dan nominal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="relative z-10 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0"
            >
              <FileText size={16} /> Pilih Dari Riwayat Analisis
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-[2.5rem] p-6 text-emerald-950 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl shrink-0 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-700 tracking-wider">
                  Data Terhubung Dengan Hasil Analisis
                </div>
                <h4 className="font-black text-base text-emerald-950">
                  {selectedAnalisis.perihal || 'Dokumen Analisis'}
                </h4>
                <p className="text-xs text-emerald-800 font-medium">
                  No Surat: <span className="font-mono font-bold">{selectedAnalisis.no_surat || '-'}</span> | Unit: <span className="font-bold">{selectedAnalisis.unit_pengirim || '-'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all"
              >
                Ganti Pilihan
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-4 py-2.5 bg-white border border-emerald-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <X size={14} /> Lepas Link (Manual)
              </button>
            </div>
          </div>
        )}
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-40">
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

      {/* MODAL PILIH ANALISIS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1">
                  <Sparkles size={14} className="text-amber-400" /> Database Riwayat Hasil Analisis AI (/analisis)
                </div>
                <h3 className="text-2xl font-black tracking-tight">Pilih Dokumen Analisis untuk Diimpor</h3>
                <p className="text-slate-400 text-xs font-medium">Klik pada surat yang tersedia untuk mengisi form Tambah Pagu secara otomatis.</p>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search & Tools */}
            <div className="p-4 md:p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text"
                  placeholder="Cari perihal, no surat, subyek, unit..."
                  value={searchAnalisis}
                  onChange={e => setSearchAnalisis(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={fetchAnalisisAndUsed}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
              >
                <RefreshCw size={14} className={loadingAnalisis ? "animate-spin" : ""} /> Refresh Data
              </button>
            </div>

            {/* Modal List Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              {loadingAnalisis ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                </div>
              ) : filteredAnalisisList.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={48} className="mx-auto opacity-20 mb-3" />
                  <p className="font-bold text-gray-600">Tidak ada riwayat analisis yang cocok.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredAnalisisList.map((item, idx) => (
                    <div 
                      key={item.id_analisis || idx}
                      className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        item.is_used 
                          ? 'bg-gray-50 border-gray-200 opacity-60' 
                          : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-lg cursor-pointer'
                      }`}
                      onClick={() => !item.is_used && handleSelectAnalisis(item)}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          
                          {item.is_used ? (
                            <span className="flex items-center gap-1 px-3 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-rose-200">
                              <Lock size={12}/> Sudah Digunakan di Tambah Pagu
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-200">
                              <Sparkles size={12}/> Tersedia (Siap Diimpor)
                            </span>
                          )}
                        </div>

                        <h4 className="font-black text-gray-900 text-base leading-snug">
                          {item.perihal || 'Tanpa Perihal'}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-500">
                          <span>No Surat: <strong className="font-mono text-gray-700">{item.no_surat || '-'}</strong></span>
                          <span>•</span>
                          <span>Unit: <strong className="text-gray-700">{item.unit_pengirim || '-'}</strong></span>
                          {item.subyek_persuratan_simaster && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 font-bold">Simaster: {item.subyek_persuratan_simaster}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Usulan:</span>
                          <span className="text-sm font-black font-mono text-gray-900">
                            Rp {formatNumber(item.total_anggaran || '0')}
                          </span>
                        </div>

                        {item.is_used ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl flex items-center gap-1 cursor-not-allowed"
                          >
                            <Lock size={14}/> Tidak Bisa Dipilih
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectAnalisis(item)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1"
                          >
                            Impor Data Ini <ArrowLeft size={14} className="rotate-180" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs transition-all"
              >
                Tutup Modal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
