'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Clock, 
  Tag, 
  FileCheck,
  X,
  Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';

type AttachmentState = { files: File[]; url: string };

export default function CatatanPenelitianInputPage() {
  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState<string>('Penelitian');
  const [nominal, setNominal] = useState<string>('');
  const [uraian, setUraian] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  // 4 Kategori Lampiran Foto Bukti (Persis seperti di /input)
  const [attachments, setAttachments] = useState<{
    nota: AttachmentState;
    kegiatan: AttachmentState;
    barang: AttachmentState;
    transfer: AttachmentState;
  }>({
    nota: { files: [], url: '' },
    kegiatan: { files: [], url: '' },
    barang: { files: [], url: '' },
    transfer: { files: [], url: '' }
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [tableNotCreated, setTableNotCreated] = useState<boolean>(false);
  const [recentList, setRecentList] = useState<any[]>([]);

  // Format Rupiah Helper
  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Handler memilih file per kategori lampiran (bisa lebih dari 1 gambar)
  const handleAttachmentChange = (type: keyof typeof attachments, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => f.size <= 10 * 1024 * 1024);
      if (validFiles.length < newFiles.length) {
        toast.error('Beberapa file diabaikan karena ukurannya melebihi 10MB.');
      }
      
      setAttachments(prev => ({
        ...prev,
        [type]: { ...prev[type], files: [...prev[type].files, ...validFiles] }
      }));
    }
  };

  // Hapus satu file dari daftar per kategori
  const removeFile = (type: keyof typeof attachments, indexToRemove: number) => {
    setAttachments(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        files: prev[type].files.filter((_, idx) => idx !== indexToRemove)
      }
    }));
  };

  // Helper upload multiple files ke folder khusus 'lampiran_penelitian'
  const uploadMultipleFiles = async (files: File[]) => {
    if (files.length === 0) return '';
    
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `penelitian_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}`;
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileName', fileName);
      uploadFormData.append('folder', 'lampiran_penelitian'); // Folder khusus penelitian

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Gagal mengunggah file ${file.name}`);
      }
      return result.publicUrl;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls.filter(Boolean).join(', ');
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
    const toastId = toast.loading('Mengunggah berkas lampiran ke folder penelitian & menyimpan data...');

    try {
      // Unggah foto-foto lampiran secara paralel per kategori
      const [notaUrl, kegiatanUrl, barangUrl, transferUrl] = await Promise.all([
        attachments.nota.files.length > 0 
          ? uploadMultipleFiles(attachments.nota.files) 
          : attachments.nota.url,
        attachments.kegiatan.files.length > 0 
          ? uploadMultipleFiles(attachments.kegiatan.files) 
          : attachments.kegiatan.url,
        attachments.barang.files.length > 0 
          ? uploadMultipleFiles(attachments.barang.files) 
          : attachments.barang.url,
        attachments.transfer.files.length > 0 
          ? uploadMultipleFiles(attachments.transfer.files) 
          : attachments.transfer.url,
      ]);

      const payload = {
        tanggal_transaksi: tanggal,
        kategori,
        nominal: Number(nominal),
        uraian: uraian.trim(),
        catatan: catatan.trim(),
        foto_nota: notaUrl || null,
        foto_kegiatan: kegiatanUrl || null,
        foto_barang: barangUrl || null,
        foto_bukti_transfer: transferUrl || null,
        foto_bukti_1: notaUrl || null,
        foto_bukti_2: kegiatanUrl || null,
        foto_bukti_3: barangUrl || null,
        foto_bukti_4: transferUrl || null,
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

      toast.success('Pengeluaran & berkas foto berhasil dicatat!', { id: toastId });

      // Reset form
      setNominal('');
      setUraian('');
      setCatatan('');
      setAttachments({
        nota: { files: [], url: '' },
        kegiatan: { files: [], url: '' },
        barang: { files: [], url: '' },
        transfer: { files: [], url: '' }
      });

      if (json.tableNotCreated) {
        setTableNotCreated(true);
      }

      fetchRecent();
    } catch (err: any) {
      toast.error('Error: ' + err.message, { id: toastId });
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
    foto_nota TEXT,
    foto_kegiatan TEXT,
    foto_barang TEXT,
    foto_bukti_transfer TEXT,
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
        {/* FORM INPUT PENGELUARAN PENELITIAN                         */}
        {/* ========================================================== */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
          
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <PlusCircle size={22} />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">Formulir Pengeluaran Kegiatan</h2>
                <p className="text-xs text-gray-500 font-medium">Khusus transaksi pengeluaran mandiri dengan lampiran foto multi-berkas</p>
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
            {/* 📸 LAMPIRAN FOTO BUKTI (PERSIS SEPERTI DI /INPUT)           */}
            {/* Terdiri: Nota/Kwitansi (0); Foto Kegiatan (0);             */}
            {/* Foto Barang (0); Bukti Transfer (0) - Bisa > 1 Gambar      */}
            {/* ========================================================== */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <UploadCloud size={15} className="text-indigo-600" />
                  <span>Lampiran Foto Bukti (Bisa Lebih Dari 1 Gambar per Kategori)</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Folder: lampiran_penelitian
                </span>
              </div>

              {/* 4 Kotak Lampiran Foto Bukti Berjejer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(attachments) as Array<keyof typeof attachments>).map((key) => {
                  const item = attachments[key];
                  const title = key === 'nota' 
                    ? 'Nota / Kwitansi' 
                    : key === 'kegiatan' 
                    ? 'Foto Kegiatan' 
                    : key === 'barang' 
                    ? 'Foto Barang' 
                    : 'Bukti Transfer';

                  return (
                    <div 
                      key={key} 
                      className="border border-dashed border-gray-300 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-start text-center hover:bg-gray-50/80 transition-all p-3 space-y-2 bg-white shadow-2xs"
                    >
                      {/* Header Kategori + Counter: Nota / Kwitansi (0) */}
                      <p className="font-black text-xs text-gray-800 w-full pb-1.5 border-b border-gray-100 flex items-center justify-between px-1">
                        <span>{title}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.files.length > 0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          ({item.files.length})
                        </span>
                      </p>
                      
                      {/* Daftar File yang Dipilih */}
                      <div className="w-full flex-1 overflow-y-auto max-h-[75px] min-h-[40px] space-y-1">
                        {item.files.length === 0 ? (
                          <div className="py-2 text-[10px] text-gray-400 flex flex-col items-center justify-center">
                            <ImageIcon size={16} className="text-gray-300 mb-0.5" />
                            <span>Belum ada foto</span>
                          </div>
                        ) : (
                          item.files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-indigo-50/80 px-2 py-1 rounded-lg text-[10px] text-indigo-700 font-bold border border-indigo-100">
                              <span className="truncate max-w-[80%]" title={file.name}>{file.name}</span>
                              <button 
                                type="button" 
                                onClick={() => removeFile(key, idx)} 
                                className="text-rose-500 hover:bg-rose-100 p-0.5 rounded transition-colors cursor-pointer"
                                title="Hapus foto ini"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Tombol Pilih File (Multiple) */}
                      <label className="cursor-pointer w-full bg-white border border-gray-200 hover:border-indigo-400 py-1.5 rounded-xl text-xs font-black text-indigo-600 hover:bg-indigo-50 shadow-2xs transition-all text-center block">
                        + Pilih File
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          multiple 
                          className="hidden" 
                          onChange={(e) => handleAttachmentChange(key, e)} 
                        />
                      </label>
                      
                      {/* Input Alternatif Link GDrive */}
                      {item.files.length === 0 && (
                        <input 
                          type="text" 
                          placeholder="Atau Link GDrive..." 
                          value={item.url} 
                          onChange={(e) => setAttachments(p => ({ ...p, [key]: { ...p[key], url: e.target.value } }))} 
                          className="w-full bg-gray-50 border border-gray-200 text-[10px] px-2 py-1 rounded-lg outline-none font-mono focus:border-indigo-400" 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Seluruh foto bukti akan diunggah ke folder penelitian.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan &amp; Mengunggah...</span>
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
