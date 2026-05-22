'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings, Save, Loader2, Link2, Calendar, Hash, FileText
} from 'lucide-react';

export default function PengaturanFormPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    judul_form: '',
    tahun_aktif: '',
    periode_aktif: ''
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
          periode_aktif: data.periode_aktif ? String(data.periode_aktif) : ''
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
      // Upsert: update jika ada (id=1), insert jika belum ada
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 1,
          judul_form: formData.judul_form,
          tahun_aktif: formData.tahun_aktif ? parseInt(formData.tahun_aktif) : null,
          periode_aktif: formData.periode_aktif ? parseInt(formData.periode_aktif) : null,
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
