'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Copy, 
  Check, 
  Eye, 
  Clock, 
  Tag, 
  Layers,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';

export default function CatatanPenelitianInputPage() {
  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState<string>('Penelitian');
  const [nominal, setNominal] = useState<string>('');
  const [uraian, setUraian] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  // 4 Kolom Lampiran Foto Bukti
  const [fotoBukti1, setFotoBukti1] = useState<string>('');
  const [fotoBukti2, setFotoBukti2] = useState<string>('');
  const [fotoBukti3, setFotoBukti3] = useState<string>('');
  const [fotoBukti4, setFotoBukti4] = useState<string>('');

  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tableNotCreated, setTableNotCreated] = useState<boolean>(false);
  const [recentList, setRecentList] = useState<any[]>([]);

  // Format Rupiah Helper
  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Upload handler untuk 4 kolom foto bukti
  const handleUploadPhoto = async (index: 1 | 2 | 3 | 4, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Format berkas harus berupa foto gambar (JPG, PNG, WEBP) atau PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran berkas maksimal 10 MB');
      return;
    }

    setUploadingIdx(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'lampiran_penelitian'); // Folder khusus terpisah di Cloudflare R2

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengunggah foto lampiran');
      }

      if (index === 1) setFotoBukti1(json.publicUrl);
      if (index === 2) setFotoBukti2(json.publicUrl);
      if (index === 3) setFotoBukti3(json.publicUrl);
      if (index === 4) setFotoBukti4(json.publicUrl);

      toast.success(`Foto Bukti ${index} berhasil diunggah ke folder penelitian`);
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal upload: ' + err.message);
    } finally {
      setUploadingIdx(null);
    }
  };

  // Fetch recent data untuk pratinjau input terakhir
  const fetchRecent = async () => {
    try {
      const res = await fetch('/api/catatan-penelitian?limit=5');
      const json = await res.json();
      if (json.success) {
        setRecentList((json.data || []).slice(0, 5));
        if (json.tableNotCreated) {
          setTableNotCreated(true);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nominal || isNaN(Number(nominal)) || Number(nominal) <= 0) {
      toast.error('Nominal rincian pengeluaran harus diisi dengan angka valid!');
      return;
    }

    if (!uraian.trim()) {
      toast.error('Uraian rincian kegiatan pengeluaran wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tanggal_transaksi: tanggal,
        kategori,
        nominal: Number(nominal),
        uraian: uraian.trim(),
        catatan: catatan.trim(),
        foto_bukti_1: fotoBukti1 || null,
        foto_bukti_2: fotoBukti2 || null,
        foto_bukti_3: fotoBukti3 || null,
        foto_bukti_4: fotoBukti4 || null,
        created_by: 'User Portalkeu'
      };

      const res = await fetch('/api/catatan-penelitian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan transaksi pengeluaran');
      }

      toast.success('Pengeluaran berhasil dicatat!');

      // Reset form
      setNominal('');
      setUraian('');
      setCatatan('');
      setFotoBukti1('');
      setFotoBukti2('');
      setFotoBukti3('');
      setFotoBukti4('');

      if (json.tableNotCreated) {
        setTableNotCreated(true);
      }

      fetchRecent();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto space-y-6">
      
      {/* Sub-Tab Navigation */}
      <CatatanPenelitianTabs />

      {/* Banner SQL Migration Jika Tabel Belum Dibuat */}
      {tableNotCreated && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black">Tabel Supabase `catatan_penelitian` Belum Terbuat</h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Data saat ini tersimpan di memori lokal. Jalankan file <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[10px]">supabase_catatan_penelitian_migration.sql</code> di Supabase SQL Editor untuk penyimpanan cloud permanen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.catatan_penelitian (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tanggal_transaksi DATE NOT NULL DEFAULT CURRENT_DATE,
    kategori VARCHAR(100) NOT NULL DEFAULT 'Penelitian',
    nominal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    uraian TEXT NOT NULL,
    catatan TEXT,
    foto_bukti_1 TEXT,
    foto_bukti_2 TEXT,
    foto_bukti_3 TEXT,
    foto_bukti_4 TEXT,
    created_by VARCHAR(255)
);
ALTER TABLE public.catatan_penelitian ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read catatan_penelitian" ON public.catatan_penelitian FOR SELECT USING (true);
CREATE POLICY "Allow public insert catatan_penelitian" ON public.catatan_penelitian FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update catatan_penelitian" ON public.catatan_penelitian FOR UPDATE USING (true);
CREATE POLICY "Allow public delete catatan_penelitian" ON public.catatan_penelitian FOR DELETE USING (true);`);
              toast.success('Script SQL berhasil disalin ke clipboard');
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Copy size={13} />
            <span>Salin Script SQL</span>
          </button>
        </div>
      )}

      {/* Main Layout: Form Kiri + Pratinjau Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ========================================================== */}
        {/* FORM INPUT PENGELUARAN PENELITIAN (2 KOLOM)               */}
        {/* ========================================================== */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
          
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <PlusCircle size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">Formulir Pengeluaran Kegiatan</h2>
                <p className="text-xs text-gray-500 font-medium">Khusus transaksi pengeluaran mandiri dengan lampiran 4 bukti terpisah</p>
              </div>
            </div>

            <span className="text-[11px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Hanya Pengeluaran
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Baris 1: Tanggal Transaksi & Dropdown Isian (Penelitian) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Tanggal Transaksi */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-600" />
                  <span>Tanggal Transaksi <strong className="text-rose-500">*</strong></span>
                </label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                />
              </div>

              {/* Dropdown Isian: Default 'Penelitian' */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <Tag size={14} className="text-indigo-600" />
                  <span>Kategori Isian <strong className="text-rose-500">*</strong></span>
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  required
                  className="w-full h-10 px-3 bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                >
                  <option value="Penelitian">🔬 Penelitian (Default)</option>
                  <option value="Pengabdian Masyarakat">🤝 Pengabdian Masyarakat</option>
                  <option value="Operasional Riset">⚙️ Operasional Riset</option>
                  <option value="Lainnya">📋 Pengeluaran Lainnya</option>
                </select>
              </div>

            </div>

            {/* Baris 2: Nominal Rincian */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-indigo-600" />
                  <span>Nominal Rincian Pengeluaran <strong className="text-rose-500">*</strong></span>
                </span>
                {nominal && Number(nominal) > 0 && (
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                    {formatRupiah(nominal)}
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  required
                  min="1"
                  className="w-full h-11 pl-11 pr-3 bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Baris 3: Uraian / Rincian Kegiatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-600" />
                <span>Uraian / Rincian Kegiatan <strong className="text-rose-500">*</strong></span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pembelian Bahan Reagen Lab Kimia & ATK Analisis Sampel..."
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
                required
                className="w-full h-10 px-3 bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Baris 4: Catatan / Catat Tambahan */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <FileCheck size={14} className="text-amber-600" />
                <span>Catatan Tambahan / Catat Sendiri</span>
              </label>
              <textarea
                rows={2}
                placeholder="Catatan pengingat pribadi, kode bukti fisik, toko penyedia, atau nomor inventaris..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full p-3 bg-amber-50/30 hover:bg-white focus:bg-white border border-amber-200/80 rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all resize-none"
              />
            </div>

            {/* ========================================================== */}
            {/* 📸 4 KOLOM LAMPIRAN FOTO BUKTI (FOLDER: lampiran_penelitian) */}
            {/* ========================================================== */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon size={15} className="text-indigo-600" />
                    <span>Lampiran Foto Bukti (4 Kolom Terpisah)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">Tersimpan di folder khusus <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px] font-bold">lampiran_penelitian</code></p>
                </div>
                <span className="text-[10px] font-bold text-gray-400">Format: JPG, PNG, WEBP, PDF</span>
              </div>

              {/* 4 Kolom Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Kolom Foto 1 */}
                <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-gray-700">Foto Bukti 1</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Nota / Kuitansi</span>
                  </div>

                  {fotoBukti1 ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white aspect-4/3 flex items-center justify-center">
                      <img src={fotoBukti1} alt="Bukti 1" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={fotoBukti1} target="_blank" rel="noreferrer" className="p-1.5 bg-white text-gray-800 rounded-lg hover:scale-110 transition-transform">
                          <Eye size={14} />
                        </a>
                        <button type="button" onClick={() => setFotoBukti1('')} className="p-1.5 bg-rose-600 text-white rounded-lg hover:scale-110 transition-transform">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl aspect-4/3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-2 text-center">
                      {uploadingIdx === 1 ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400 group-hover:text-indigo-600" />
                          <span className="text-[10px] font-bold text-gray-600">Unggah Bukti 1</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => e.target.files?.[0] && handleUploadPhoto(1, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Kolom Foto 2 */}
                <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-gray-700">Foto Bukti 2</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Faktur Bayar</span>
                  </div>

                  {fotoBukti2 ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white aspect-4/3 flex items-center justify-center">
                      <img src={fotoBukti2} alt="Bukti 2" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={fotoBukti2} target="_blank" rel="noreferrer" className="p-1.5 bg-white text-gray-800 rounded-lg hover:scale-110 transition-transform">
                          <Eye size={14} />
                        </a>
                        <button type="button" onClick={() => setFotoBukti2('')} className="p-1.5 bg-rose-600 text-white rounded-lg hover:scale-110 transition-transform">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl aspect-4/3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-2 text-center">
                      {uploadingIdx === 2 ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400 group-hover:text-indigo-600" />
                          <span className="text-[10px] font-bold text-gray-600">Unggah Bukti 2</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => e.target.files?.[0] && handleUploadPhoto(2, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Kolom Foto 3 */}
                <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-gray-700">Foto Bukti 3</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Dokumentasi</span>
                  </div>

                  {fotoBukti3 ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white aspect-4/3 flex items-center justify-center">
                      <img src={fotoBukti3} alt="Bukti 3" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={fotoBukti3} target="_blank" rel="noreferrer" className="p-1.5 bg-white text-gray-800 rounded-lg hover:scale-110 transition-transform">
                          <Eye size={14} />
                        </a>
                        <button type="button" onClick={() => setFotoBukti3('')} className="p-1.5 bg-rose-600 text-white rounded-lg hover:scale-110 transition-transform">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl aspect-4/3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-2 text-center">
                      {uploadingIdx === 3 ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400 group-hover:text-indigo-600" />
                          <span className="text-[10px] font-bold text-gray-600">Unggah Bukti 3</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => e.target.files?.[0] && handleUploadPhoto(3, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Kolom Foto 4 */}
                <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-gray-700">Foto Bukti 4</span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Lampiran Lain</span>
                  </div>

                  {fotoBukti4 ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white aspect-4/3 flex items-center justify-center">
                      <img src={fotoBukti4} alt="Bukti 4" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <a href={fotoBukti4} target="_blank" rel="noreferrer" className="p-1.5 bg-white text-gray-800 rounded-lg hover:scale-110 transition-transform">
                          <Eye size={14} />
                        </a>
                        <button type="button" onClick={() => setFotoBukti4('')} className="p-1.5 bg-rose-600 text-white rounded-lg hover:scale-110 transition-transform">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl aspect-4/3 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-2 text-center">
                      {uploadingIdx === 4 ? (
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={16} className="text-gray-400 group-hover:text-indigo-600" />
                          <span className="text-[10px] font-bold text-gray-600">Unggah Bukti 4</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => e.target.files?.[0] && handleUploadPhoto(4, e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Pastikan data pengeluaran dan foto bukti sudah sesuai.
              </span>
              <button
                type="submit"
                disabled={isSubmitting || uploadingIdx !== null}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Simpan Pengeluaran</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* ========================================================== */}
        {/* SIDEBAR PRATINJAU & RECENT ENTRIES (1 KOLOM)              */}
        {/* ========================================================== */}
        <div className="space-y-5">
          
          {/* Quick Action Link ke Laporan */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-sm border border-indigo-800/50 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-amber-300 flex items-center justify-center">
                <FileSpreadsheet size={18} />
              </div>
              <h3 className="text-xs font-black tracking-tight">Rekapitulasi &amp; Laporan</h3>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              Lihat seluruh riwayat pengeluaran penelitian, filter per rentang tanggal, cetak laporan SPJ, dan ekspor ke file Excel.
            </p>
            <Link
              href="/catatan-penelitian/laporan"
              className="inline-flex items-center justify-between w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
            >
              <span>Buka Menu Laporan</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Transaksi Terakhir Diinput */}
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-600" />
                <span>Transaksi Terakhir</span>
              </h4>
              <span className="text-[10px] font-bold text-gray-400">{recentList.length} Entri</span>
            </div>

            {recentList.length === 0 ? (
              <div className="py-8 text-center text-gray-400 space-y-1">
                <p className="text-xs font-bold">Belum Ada Pengeluaran</p>
                <p className="text-[10px]">Transaksi yang Anda input akan tampil di sini</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentList.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-gray-50/70 hover:bg-indigo-50/40 rounded-2xl border border-gray-200/80 transition-colors space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-gray-500">{item.tanggal_transaksi}</span>
                      <span className="font-black text-emerald-700">{formatRupiah(item.nominal)}</span>
                    </div>
                    <p className="text-xs font-black text-gray-800 line-clamp-1">{item.uraian}</p>
                    {item.catatan && (
                      <p className="text-[10px] text-gray-500 line-clamp-1 italic">"{item.catatan}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

