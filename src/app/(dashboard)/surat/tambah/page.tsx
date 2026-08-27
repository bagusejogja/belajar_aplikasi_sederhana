'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, FileEdit, ArrowLeft, UploadCloud, Link as LinkIcon, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import { createSuratRevisi } from '@/app/actions/surat';
import { scanSuratWithAI } from '@/app/actions/ai-scan';

export default function TambahSuratPage() {
  const router = useRouter();
  const [listUnit, setListUnit] = useState<any[]>([]);
  const [listPIC, setListPIC] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [formData, setFormData] = useState({
    tahun_anggaran: new Date().getFullYear(),
    unit_id: null as any,
    no_surat: '',
    tanggal_surat: new Date().toISOString().split('T')[0],
    perihal_surat: '',
    subyek_simaster: '',
    pic: null as any,
    tanggal_disposisi: '',
    tanggal_selesai: '',
    baris_rkat_dirubah: '',
    nominal_semula: '',
    nominal_menjadi: '',
    link_google_drive: '',
  });

  const [jenisSelected, setJenisSelected] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const jenisOptions = [
    "Buka Akses", "Realokasi", "Revisi", "Pemindahan", "Penggunaan Luncuran", "Efisiensi"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: unitData } = await supabase
        .from('gov_units')
        .select('id, nama_unit, pic')
        .order('nama_unit', { ascending: true });

      if (unitData) {
        // 1. Set Daftar Unit
        setListUnit(unitData.map(u => ({ 
          value: u.id, 
          label: u.nama_unit,
          pic: u.pic 
        })));

        // 2. Set Daftar PIC dari semua PIC unik yang ada di gov_units
        const uniquePICs = Array.from(new Set(unitData.map(u => u.pic).filter(Boolean)))
          .sort()
          .map(pic => ({ value: pic, label: pic }));
        
        setListPIC(uniquePICs);
      }
    } catch (error) {
      console.error("Gagal mengambil data referensi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // FORMATTER RIBUAN
  const formatNumber = (num: string) => {
    if (!num) return '';
    const clean = num.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumber = (formatted: string) => {
    return formatted.replace(/\D/g, '');
  };

  // FUNGSI SCAN AI (AKTIF)
  const handleScanAI = async () => {
    if (!selectedFile) {
      alert("Silakan pilih file surat (PDF/Gambar) terlebih dahulu!");
      return;
    }

    setIsScanning(true);
    try {
      const scanFormData = new FormData();
      scanFormData.append('file', selectedFile);

      const result = await scanSuratWithAI(scanFormData);
      
      if (result.success && result.data) {
        const { no_surat, tanggal_surat, perihal_surat, unit_kerja } = result.data;
        
        // Cari unit yang paling cocok (Fuzzy Match sederhana)
        let matchedUnit = null;
        if (unit_kerja) {
          matchedUnit = listUnit.find(u => 
            u.label.toLowerCase().includes(unit_kerja.toLowerCase()) || 
            unit_kerja.toLowerCase().includes(u.label.toLowerCase())
          );
        }

        // Update form secara otomatis
        setFormData(prev => ({
          ...prev,
          no_surat: no_surat || prev.no_surat,
          tanggal_surat: tanggal_surat || prev.tanggal_surat,
          perihal_surat: perihal_surat || prev.perihal_surat,
          unit_id: matchedUnit || prev.unit_id
        }));

        alert(`✨ AI Berhasil membaca dokumen!\n- No Surat: ${no_surat || '-'}\n- Unit: ${matchedUnit?.label || 'Tidak terdeteksi otomatis'}`);
      } else {
        throw new Error(result.error || "Gagal mengekstrak data");
      }

    } catch (err: any) {
      alert("Gagal melakukan scan AI: " + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nominal_semula' || name === 'nominal_menjadi') {
      const numericValue = parseNumber(value);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleJenis = (jenis: string) => {
    setJenisSelected(prev => 
      prev.includes(jenis) ? prev.filter(j => j !== jenis) : [...prev, jenis]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unit_id || !formData.no_surat || !formData.perihal_surat) {
      alert("Mohon lengkapi data wajib (Unit, No Surat, Perihal)");
      return;
    }

    // CEK UKURAN FILE (Vercel limit 4.5MB)
    if (selectedFile && selectedFile.size > 4 * 1024 * 1024) {
      alert("⚠️ Ukuran file terlalu besar! Maksimal adalah 4MB agar bisa tersimpan di server. Mohon kecilkan ukuran PDF/Gambar Anda.");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = new FormData();
      
      if (session?.user?.id) {
        data.append('user_id', session.user.id);
      }
      
      data.append('unit_id', formData.unit_id.value);
      data.append('tahun_anggaran', formData.tahun_anggaran.toString());
      data.append('no_surat', formData.no_surat);
      data.append('tanggal_surat', formData.tanggal_surat);
      data.append('perihal_surat', formData.perihal_surat);
      data.append('subyek_simaster', formData.subyek_simaster);
      data.append('jenis_json', JSON.stringify(jenisSelected));
      data.append('pic', formData.pic?.value || '');
      data.append('tanggal_disposisi', formData.tanggal_disposisi);
      data.append('tanggal_selesai', formData.tanggal_selesai);
      data.append('baris_rkat_dirubah', formData.baris_rkat_dirubah);
      data.append('nominal_semula', formData.nominal_semula);
      data.append('nominal_menjadi', formData.nominal_menjadi);
      data.append('link_google_drive', formData.link_google_drive);
      
      if (selectedFile) {
        data.append('file_upload', selectedFile);
      }

      // Gunakan API Route agar lebih stabil di semua komputer
      const response = await fetch('/api/surat/tambah', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      
      if (result.success) {
        alert("Arsip Surat Berhasil Disimpan!");
        router.push('/surat');
      } else {
        throw new Error(result.error || "Gagal menyimpan melalui API");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <FileEdit size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Tambah Arsip Surat
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Revisi RKAT
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Pencatatan arsip surat usulan revisi RKAT menggunakan data unit kerja pemerintah.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            type="button"
            onClick={() => router.back()}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <ArrowLeft size={13} />
            <span>Kembali</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Card 0: Scan AI Zone */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-5 md:p-6 shadow-xs text-white relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 text-amber-300">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black tracking-tight text-white">Smart Scan AI</h3>
                <p className="text-indigo-200 text-xs font-medium">Upload surat (PDF/Gambar), biarkan AI mengekstrak data form otomatis.</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="h-9 bg-white/10 hover:bg-white/15 border border-white/20 px-3.5 rounded-xl font-bold text-xs backdrop-blur-sm text-center truncate max-w-[200px] flex items-center justify-center">
                  {selectedFile ? selectedFile.name : "Pilih File Surat..."}
                </div>
              </div>
              <button 
                type="button"
                onClick={handleScanAI}
                disabled={isScanning || !selectedFile}
                className="h-9 bg-amber-400 hover:bg-amber-500 text-amber-950 px-4 rounded-xl font-black text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{isScanning ? "MEMPROSES..." : "SCAN DENGAN AI"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 1: Informasi Dasar */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600"><FileEdit size={16}/></div>
            <h2 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Informasi Surat</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Tahun Anggaran *</label>
              <input 
                type="number" 
                name="tahun_anggaran" 
                value={formData.tahun_anggaran} 
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-bold text-xs text-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Unit Kerja Pemerintah *</label>
              <Select 
                options={listUnit} 
                value={formData.unit_id} 
                onChange={(val: any) => {
                  const defaultPIC = val?.pic ? { value: val.pic, label: val.pic } : formData.pic;
                  setFormData({
                    ...formData, 
                    unit_id: val,
                    pic: defaultPIC
                  });
                }}
                placeholder="Pilih Unit (gov_unit)..."
                className="text-xs"
                styles={{
                  control: (base) => ({ 
                    ...base, 
                    minHeight: '36px', 
                    height: '36px', 
                    borderRadius: '0.75rem', 
                    borderColor: '#e5e7eb', 
                    backgroundColor: '#f9fafb',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }),
                  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                  input: (base) => ({ ...base, margin: 0, padding: 0 }),
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Nomor Surat *</label>
              <input 
                type="text" 
                name="no_surat" 
                value={formData.no_surat} 
                onChange={handleInputChange}
                placeholder="cth: 3025/UN1/FA.1/..."
                className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Tanggal Surat *</label>
              <input 
                type="date" 
                name="tanggal_surat" 
                value={formData.tanggal_surat} 
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Perihal Surat *</label>
            <input 
              type="text" 
              name="perihal_surat" 
              value={formData.perihal_surat} 
              onChange={handleInputChange}
              placeholder="Isi perihal surat secara lengkap..."
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Subyek di Persuratan Simaster</label>
            <input 
              type="text" 
              name="subyek_simaster" 
              value={formData.subyek_simaster} 
              onChange={handleInputChange}
              placeholder="Salin subyek dari Simaster..."
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700"
            />
          </div>
        </div>

        {/* Card 2: Detail Proses */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600"><CheckCircle2 size={16}/></div>
            <h2 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Detail Proses & Jenis</h2>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Jenis Revisi (Bisa pilih lebih dari 1)</label>
            <div className="flex flex-wrap gap-1.5">
              {jenisOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleJenis(option)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold border transition-all ${
                    jenisSelected.includes(option)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">PIC *</label>
              <Select 
                options={listPIC} 
                value={formData.pic} 
                onChange={(val) => setFormData({...formData, pic: val})}
                placeholder="Pilih PIC..."
                className="text-xs"
                styles={{
                  control: (base) => ({ 
                    ...base, 
                    minHeight: '36px', 
                    height: '36px', 
                    borderRadius: '0.75rem', 
                    borderColor: '#e5e7eb', 
                    backgroundColor: '#f9fafb',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }),
                  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
                  input: (base) => ({ ...base, margin: 0, padding: 0 }),
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Tgl Disposisi</label>
              <input 
                type="date" 
                name="tanggal_disposisi" 
                value={formData.tanggal_disposisi} 
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Tgl Selesai</label>
              <input 
                type="date" 
                name="tanggal_selesai" 
                value={formData.tanggal_selesai} 
                onChange={handleInputChange}
                className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-emerald-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Budget & Lampiran */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-gray-200/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
            <div className="bg-amber-50 p-1.5 rounded-lg text-amber-600"><UploadCloud size={16}/></div>
            <h2 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Budget & Dokumen Pendukung</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Baris RKAT yang Dirubah</label>
            <input 
              type="text" 
              name="baris_rkat_dirubah" 
              value={formData.baris_rkat_dirubah} 
              onChange={handleInputChange}
              placeholder="cth: 521211 - Belanja Bahan Operasional..."
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-amber-500/20 focus:bg-white transition-all font-medium text-xs text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Nominal Semula</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-gray-400">Rp</span>
                <input 
                  type="text" 
                  name="nominal_semula" 
                  value={formatNumber(formData.nominal_semula)} 
                  onChange={handleInputChange}
                  className="w-full h-9 pl-9 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-amber-500/20 focus:bg-white transition-all font-bold text-xs text-gray-700"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Nominal Menjadi</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-indigo-500">Rp</span>
                <input 
                  type="text" 
                  name="nominal_menjadi" 
                  value={formatNumber(formData.nominal_menjadi)} 
                  onChange={handleInputChange}
                  className="w-full h-9 pl-9 pr-3 bg-indigo-50/30 hover:bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all font-bold text-xs text-indigo-700"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5 flex items-center gap-1.5"><LinkIcon size={11}/> Link Google Drive</label>
              <input 
                type="text" 
                name="link_google_drive" 
                value={formData.link_google_drive} 
                onChange={handleInputChange}
                placeholder="https://drive.google.com/..."
                className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5 flex items-center gap-1.5"><UploadCloud size={11}/> Dokumen Terpilih</label>
              <div className="relative group/upload">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full h-16 bg-gray-50 border border-gray-200 border-dashed rounded-xl px-4 flex items-center justify-center gap-2.5 group-hover/upload:bg-gray-100 transition-all">
                  <div className={`p-1.5 rounded-lg ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-600'}`}>
                    {selectedFile ? <CheckCircle2 size={16} /> : <UploadCloud size={16} />}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-gray-700 truncate max-w-[240px]">
                      {selectedFile ? selectedFile.name : "Klik / seret file ke sini"}
                    </p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">PDF / Gambar (Maks 10MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSaving}
            className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? "SEDANG MENYIMPAN..." : "SIMPAN ARSIP SURAT"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
