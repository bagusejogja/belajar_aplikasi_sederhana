'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings, Save, Loader2, Link2, Calendar, Hash, FileText, Clock, Cloud
} from 'lucide-react';

export default function PengaturanFormPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    judul_form: '',
    tahun_aktif: '',
    periode_aktif: '',
    waktu_buka: '',
    waktu_tutup: '',
    r2_folder: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Tidak ada data (baris id=1 belum ada)
          console.warn("Data setting belum ada, siap untuk insert baru.");
        } else {
          throw error;
        }
      }

      if (data) {
        setFormData({
          judul_form: data.judul_form || '',
          tahun_aktif: data.tahun_aktif ? String(data.tahun_aktif) : '',
          periode_aktif: data.periode_aktif ? String(data.periode_aktif) : '',
          // Potong timezone 'Z' dari ISO string agar pas dengan <input type="datetime-local">
          waktu_buka: data.waktu_buka ? data.waktu_buka.slice(0, 16) : '',
          waktu_tutup: data.waktu_tutup ? data.waktu_tutup.slice(0, 16) : '',
          r2_folder: data.r2_folder || ''
        });
      }
    } catch (err: any) {
      console.error("Gagal mengambil data pengaturan:", err);
      // Tampilkan error di console saja untuk sementara, jika tabel belum ada
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Format datetime agar bisa ditangkap dengan baik oleh PostgreSQL (ISO 8601)
      const formattedBuka = formData.waktu_buka ? new Date(formData.waktu_buka).toISOString() : null;
      const formattedTutup = formData.waktu_tutup ? new Date(formData.waktu_tutup).toISOString() : null;

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 1,
          judul_form: formData.judul_form,
          tahun_aktif: formData.tahun_aktif ? parseInt(formData.tahun_aktif) : null,
          periode_aktif: formData.periode_aktif ? parseInt(formData.periode_aktif) : null,
          waktu_buka: formattedBuka,
          waktu_tutup: formattedTutup,
          r2_folder: formData.r2_folder
        });

      if (error) throw error;
      
      alert("✅ Pengaturan berhasil disimpan!");
    } catch (err: any) {
      console.error("Gagal menyimpan pengaturan:", err);
      alert("❌ Gagal menyimpan: " + err.message + "\n\nPastikan tabel 'app_settings' sudah dibuat di Supabase.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Settings size={150} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Link2 size={14} /> Integrasi Eksternal
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4">Pengaturan Form</h1>
          <p className="text-gray-500 font-medium max-w-md">Kelola konfigurasi judul, tahun, dan periode aktif untuk aplikasi form publik Anda dari halaman ini.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 max-w-2xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-sm font-bold">Memuat Data...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" />
                Judul Form
              </label>
              <input
                type="text"
                name="judul_form"
                value={formData.judul_form}
                onChange={handleChange}
                placeholder="Masukkan judul form publik..."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                required
              />
              <p className="text-[10px] font-medium text-gray-400 mt-1">Judul ini akan ditampilkan sebagai *header* pada form publik.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" />
                  Tahun Aktif
                </label>
                <input
                  type="number"
                  name="tahun_aktif"
                  value={formData.tahun_aktif}
                  onChange={handleChange}
                  placeholder="Contoh: 2026"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Hash size={14} className="text-indigo-500" />
                  Periode Aktif
                </label>
                <input
                  type="number"
                  name="periode_aktif"
                  value={formData.periode_aktif}
                  onChange={handleChange}
                  placeholder="Contoh: 1"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} className="text-emerald-500" />
                  Waktu Buka
                </label>
                <input
                  type="datetime-local"
                  name="waktu_buka"
                  value={formData.waktu_buka}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} className="text-rose-500" />
                  Waktu Tutup
                </label>
                <input
                  type="datetime-local"
                  name="waktu_tutup"
                  value={formData.waktu_tutup}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Cloud size={14} className="text-sky-500" />
                Folder Penyimpanan Cloudflare R2
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">/</span>
                <input
                  type="text"
                  name="r2_folder"
                  value={formData.r2_folder}
                  onChange={handleChange}
                  placeholder="Contoh: usulan_2026_smt2"
                  className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <p className="text-[10px] font-medium text-gray-400 mt-1">Nama folder target di dalam Bucket Cloudflare R2 (https://dash.cloudflare.com/...). Kosongkan jika ingin menyimpan di root.</p>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 w-full px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Simpan Pengaturan
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
