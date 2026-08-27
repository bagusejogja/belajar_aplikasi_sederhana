'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Settings, Save, Loader2, Link2, Calendar, Hash, FileText, Clock, Cloud, RefreshCw, CheckCircle2, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

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
          console.warn("Data setting belum ada, siap untuk insert baru.");
        } else {
          throw error;
        }
      }

      if (data) {
        const toLocalDatetimeLocal = (utcString: string | null) => {
          if (!utcString) return '';
          const d = new Date(utcString);
          if (isNaN(d.getTime())) return '';
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        setFormData({
          judul_form: data.judul_form || '',
          tahun_aktif: data.tahun_aktif ? String(data.tahun_aktif) : '',
          periode_aktif: data.periode_aktif ? String(data.periode_aktif) : '',
          waktu_buka: toLocalDatetimeLocal(data.waktu_buka),
          waktu_tutup: toLocalDatetimeLocal(data.waktu_tutup),
          r2_folder: data.r2_folder || ''
        });
      }
    } catch (err: any) {
      console.error("Gagal mengambil data pengaturan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formattedBuka = formData.waktu_buka ? new Date(formData.waktu_buka).toISOString() : null;
      const formattedTutup = formData.waktu_tutup ? new Date(formData.waktu_tutup).toISOString() : null;

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 1,
          judul_form: formData.judul_form.trim(),
          tahun_aktif: formData.tahun_aktif ? parseInt(formData.tahun_aktif) : null,
          periode_aktif: formData.periode_aktif ? parseInt(formData.periode_aktif) : null,
          waktu_buka: formattedBuka,
          waktu_tutup: formattedTutup,
          r2_folder: formData.r2_folder?.trim() || ''
        });

      if (error) throw error;
      toast.success("Pengaturan form publik berhasil disimpan!");
    } catch (err: any) {
      console.error("Gagal menyimpan pengaturan:", err);
      toast.error("Gagal menyimpan: " + err.message);
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
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 rounded-xl text-white shadow-xs">
            <Settings size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Pengaturan Form Publik</h2>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                Tahun {formData.tahun_aktif || 'Aktif'}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Kelola judul form, periode aktif, jadwal buka/tutup, dan folder Cloudflare R2.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettings}
          className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-colors shadow-2xs self-end md:self-auto"
          title="Refresh Data"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* FORM CARD */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-xs font-bold text-gray-500">Memuat data pengaturan...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Judul Form */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-600" />
                Judul Form Publik <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="judul_form"
                value={formData.judul_form}
                onChange={handleChange}
                placeholder="Masukkan judul form publik..."
                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">Judul ini akan ditampilkan sebagai header pada form publik.</p>
            </div>

            {/* Tahun & Periode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-600" />
                  Tahun Anggaran Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="tahun_aktif"
                  value={formData.tahun_aktif}
                  onChange={handleChange}
                  placeholder="Contoh: 2026"
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Hash size={13} className="text-indigo-600" />
                  Periode / Semester Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="periode_aktif"
                  value={formData.periode_aktif}
                  onChange={handleChange}
                  placeholder="Contoh: 1"
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Waktu Buka & Tutup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock size={13} className="text-emerald-600" />
                  Waktu Buka Form
                </label>
                <input
                  type="datetime-local"
                  name="waktu_buka"
                  value={formData.waktu_buka}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock size={13} className="text-rose-600" />
                  Waktu Tutup Form
                </label>
                <input
                  type="datetime-local"
                  name="waktu_tutup"
                  value={formData.waktu_tutup}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Folder R2 */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Cloud size={13} className="text-sky-600" />
                Folder Penyimpanan Cloudflare R2
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold text-xs">/</span>
                <input
                  type="text"
                  name="r2_folder"
                  value={formData.r2_folder}
                  onChange={handleChange}
                  placeholder="Contoh: usulan_2026_smt2"
                  className="w-full pl-7 pr-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-800 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Nama sub-folder target di dalam Bucket Cloudflare R2. Kosongkan jika ingin menyimpan di root.</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
