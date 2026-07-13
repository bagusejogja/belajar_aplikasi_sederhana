'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, Loader2, FileText, AlertCircle, Building2, Search } from 'lucide-react';

export default function InputMakPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [unitSearch, setUnitSearch] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [pic, setPic] = useState('');
  const [uniquePics, setUniquePics] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [noteFiles, setNoteFiles] = useState<FileList | null>(null);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('gov_units').select('id, nama_unit, pic').order('nama_unit');
      if (data) {
        setUnits(data);
        setUniquePics(Array.from(new Set(data.map(u => u.pic).filter(Boolean))));
      }
    };
    fetchUnits();
  }, []);

  // Auto-fill PIC ketika Unit dipilih
  useEffect(() => {
    if (unitSearch && units.length > 0) {
      const selected = units.find(u => u.nama_unit.toLowerCase() === unitSearch.toLowerCase());
      if (selected && selected.pic) {
        setPic(selected.pic);
      }
    }
  }, [unitSearch, units]);

  const handleUpload = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      // Cari Unit berdasarkan string pencarian (autocomplete)
      const selectedUnit = units.find(u => u.nama_unit.toLowerCase() === unitSearch.toLowerCase());
      
      if (!selectedUnit) {
        throw new Error('Unit Kerja tidak valid. Silakan pilih dari saran yang muncul.');
      }

      if (!email || !tahun || !excelFile || !noteFiles || noteFiles.length === 0) {
        throw new Error('Harap lengkapi semua field dan dokumen!');
      }

      // Upload excel
      const excelUrl = await handleUpload(excelFile, 'mak_excel');
      
      // Upload multiple catatan
      const noteUrls: { url: string, name: string }[] = [];
      for (let i = 0; i < noteFiles.length; i++) {
        const file = noteFiles[i];
        const url = await handleUpload(file, 'mak_notes');
        noteUrls.push({ url, name: file.name });
      }

      const payload = {
        email: email,
        unit: selectedUnit.nama_unit,
        pic: pic || selectedUnit.pic || '-', 
        tahun: tahun,
        status: 'Proses Revisi', 
        kategori: 'Perubahan MAK', 
        lampiran_excel: excelUrl,
        lampiran_catatan: noteUrls // jsonb array
      };

      const { error } = await supabase.from('mak_submissions').insert(payload);
      
      if (error) throw error;

      setSuccess(true);
      setUnitSearch('');
      setPic('');
      setEmail('');
      setExcelFile(null);
      setNoteFiles(null);
      
      // Reset file inputs visually
      (document.getElementById('excel-upload') as HTMLInputElement).value = '';
      (document.getElementById('note-upload') as HTMLInputElement).value = '';
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <FileText size={150} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-3">
              <FileText size={14} /> Anggaran • Formulir Layanan
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
              Pengajuan Perubahan <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500">
                Tolakan Verifikator
              </span>
            </h1>
            <p className="text-gray-500 font-medium max-w-lg text-sm leading-relaxed border-l-4 border-indigo-200 pl-4">
              Form ini untuk pengajuan perubahan data sesuai hasil verifikasi. Harap lengkapi dengan dokumen pendukungnya.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-6 relative overflow-hidden">
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-start gap-3 border border-red-100">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="font-medium text-sm">{errorMsg}</p>
            </div>
          )}

          {success && (
            <div className="p-5 bg-emerald-50 text-emerald-700 rounded-2xl flex flex-col items-center justify-center gap-3 border border-emerald-100 text-center">
              <CheckCircle className="text-emerald-500" size={48} />
              <p className="font-bold text-lg">Pengajuan MAK Berhasil Dikirim!</p>
              <p className="text-sm font-medium text-emerald-600/80">Data telah masuk dan Anda akan menerima email pemberitahuan saat pengajuan ini telah diproses oleh admin.</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Email Pengaju */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                1. Email Pengaju
              </label>
              <input
                type="email"
                placeholder="masukkan email Anda..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1.5 font-medium">Anda akan menerima email pemberitahuan di alamat ini setelah tim Admin memproses pengajuan Anda.</p>
            </div>

            {/* Unit Kerja (Autocomplete) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Building2 size={16} className="text-indigo-500" /> 2. Unit Kerja
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  list="unit-list"
                  type="text"
                  placeholder="Ketik untuk mencari unit kerja..."
                  value={unitSearch}
                  onChange={e => setUnitSearch(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
                <datalist id="unit-list">
                  {units.map(u => (
                    <option key={u.id} value={u.nama_unit} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* PIC (Dropdown) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                PIC (Penanggung Jawab)
              </label>
              <select
                value={pic}
                onChange={e => setPic(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="">Pilih PIC (Opsional / Otomatis sesuai Unit)</option>
                {uniquePics.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Anggaran Tahun */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">3. Tahun Anggaran</label>
              <div className="relative">
                <input
                  type="number"
                  value={tahun}
                  disabled
                  readOnly
                  className="w-full px-4 py-3 bg-gray-100 border-none rounded-xl text-sm font-black text-gray-500 cursor-not-allowed select-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-200 px-2 py-0.5 rounded-md">Otomatis</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Tahun anggaran otomatis sesuai tahun berjalan dan tidak dapat diubah.</p>
            </div>

            {/* Matrik Excel */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">4. Matrik Excel (.xls, .xlsx)</label>
              <div className="relative">
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={e => setExcelFile(e.target.files?.[0] || null)}
                  required
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-3 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 transition-colors
                    bg-gray-50 rounded-xl"
                />
              </div>
            </div>

            {/* Catatan Verifikator (Multiple) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">5. File Catatan Verifikator (Bisa Lebih Dari 1)</label>
              <div className="relative">
                <input
                  id="note-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setNoteFiles(e.target.files)}
                  required
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-3 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100 transition-colors
                    bg-gray-50 rounded-xl"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">Bisa berupa screenshot atau dokumen dari verifikator yang menjadi dasar permintaan.</p>
              {noteFiles && noteFiles.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {Array.from(noteFiles).map((file, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              {isLoading ? 'Menyimpan...' : 'Kirim Pengajuan MAK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
