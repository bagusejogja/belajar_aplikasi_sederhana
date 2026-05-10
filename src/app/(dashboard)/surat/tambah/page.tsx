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
    "Buka Akses", "Realokasi", "Revisi", "Pemindahan", "Penggunaan Luncuran"
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

    setIsSaving(true);
    try {
      const data = new FormData();
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

      const result = await createSuratRevisi(data);
      if (result.success) {
        alert("Arsip Surat Berhasil Disimpan!");
        router.push('/surat');
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="h-screen flex justify-center items-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tambah Arsip Surat</h1>
          <p className="text-gray-500 font-medium mt-1">Pencatatan revisi RKAT menggunakan data unit pemerintah.</p>
        </div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft size={18} /> Kembali
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Card 0: Scan AI Zone */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/30">
                <Sparkles size={32} className="text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Smart Scan AI</h3>
                <p className="text-indigo-100 text-sm font-medium opacity-80">Upload surat Anda, biar AI yang mengisi form untuk Anda.</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl font-bold text-sm backdrop-blur-sm text-center truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : "Pilih File Surat..."}
                </div>
              </div>
              <button 
                type="button"
                onClick={handleScanAI}
                disabled={isScanning || !selectedFile}
                className="bg-amber-400 hover:bg-amber-500 text-amber-950 px-8 py-3 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isScanning ? "MEMPROSES..." : "SCAN DENGAN AI"}
              </button>
            </div>
          </div>
        </div>

        {/* Card 1: Informasi Dasar */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-2">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><FileEdit size={20}/></div>
            <h2 className="font-bold text-gray-800">Informasi Surat</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tahun Anggaran *</label>
              <input 
                type="number" 
                name="tahun_anggaran" 
                value={formData.tahun_anggaran} 
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-gray-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Unit Kerja Pemerintah *</label>
              <Select 
                options={listUnit} 
                value={formData.unit_id} 
                onChange={(val: any) => {
                  // AUTO-FILL PIC saat Unit dipilih
                  const defaultPIC = val?.pic ? { value: val.pic, label: val.pic } : formData.pic;
                  setFormData({
                    ...formData, 
                    unit_id: val,
                    pic: defaultPIC // Isi otomatis PIC-nya
                  });
                }}
                placeholder="Pilih Unit (gov_unit)..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.4rem', border: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }),
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nomor Surat *</label>
              <input 
                type="text" 
                name="no_surat" 
                value={formData.no_surat} 
                onChange={handleInputChange}
                placeholder="cth: 3025/UN1/FA.1/..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tanggal Surat *</label>
              <input 
                type="date" 
                name="tanggal_surat" 
                value={formData.tanggal_surat} 
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Perihal Surat *</label>
            <input 
              type="text" 
              name="perihal_surat" 
              value={formData.perihal_surat} 
              onChange={handleInputChange}
              placeholder="Isi perihal surat secara lengkap..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Subyek di Persuratan Simaster</label>
            <input 
              type="text" 
              name="subyek_simaster" 
              value={formData.subyek_simaster} 
              onChange={handleInputChange}
              placeholder="Salin subyek dari Simaster..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-medium"
            />
          </div>
        </div>

        {/* Card 2: Detail Proses */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-2">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><CheckCircle2 size={20}/></div>
            <h2 className="font-bold text-gray-800">Detail Proses & Jenis</h2>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Jenis Revisi (Bisa pilih lebih dari 1)</label>
            <div className="flex flex-wrap gap-2">
              {jenisOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleJenis(option)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    jenisSelected.includes(option)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">PIC *</label>
              <Select 
                options={listPIC} 
                value={formData.pic} 
                onChange={(val) => setFormData({...formData, pic: val})}
                placeholder="Pilih PIC..."
                styles={{
                  control: (base) => ({ ...base, borderRadius: '1rem', padding: '0.4rem', border: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }),
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tgl Disposisi</label>
              <input 
                type="date" 
                name="tanggal_disposisi" 
                value={formData.tanggal_disposisi} 
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-100 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tgl Selesai</label>
              <input 
                type="date" 
                name="tanggal_selesai" 
                value={formData.tanggal_selesai} 
                onChange={handleInputChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-100 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Budget & Lampiran */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-2">
            <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><UploadCloud size={20}/></div>
            <h2 className="font-bold text-gray-800">Budget & Dokumen Pendukung</h2>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Baris RKAT yang Dirubah</label>
            <input 
              type="text" 
              name="baris_rkat_dirubah" 
              value={formData.baris_rkat_dirubah} 
              onChange={handleInputChange}
              placeholder="cth: 521211 - Belanja Bahan Operasional..."
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-amber-100 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nominal Semula</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                <input 
                  type="text" 
                  name="nominal_semula" 
                  value={formatNumber(formData.nominal_semula)} 
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-amber-100 transition-all font-bold text-gray-700"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nominal Menjadi</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-400">Rp</span>
                <input 
                  type="text" 
                  name="nominal_menjadi" 
                  value={formatNumber(formData.nominal_menjadi)} 
                  onChange={handleInputChange}
                  className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-bold text-indigo-700"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2"><LinkIcon size={12}/> Link Google Drive</label>
              <input 
                type="text" 
                name="link_google_drive" 
                value={formData.link_google_drive} 
                onChange={handleInputChange}
                placeholder="https://drive.google.com/..."
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-100 transition-all text-sm italic"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2"><UploadCloud size={12}/> Dokumen Terpilih</label>
              <div className="relative group/upload">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full bg-indigo-50/50 border border-indigo-100 border-dashed border-2 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group-hover/upload:bg-indigo-100/50 transition-all">
                  <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {selectedFile ? <CheckCircle2 size={24} /> : <UploadCloud size={24} />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-gray-700">
                      {selectedFile ? selectedFile.name : "Klik atau seret file ke sini"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">PDF atau Gambar (Maks 10MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full md:w-[400px] bg-gray-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            {isSaving ? "SEDANG MENYIMPAN..." : "SIMPAN ARSIP SURAT"}
          </button>
        </div>
      </form>
    </div>
  );
}
