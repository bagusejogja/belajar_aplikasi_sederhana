'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  Download, 
  RefreshCw, 
  Trash2, 
  Eye, 
  X, 
  DollarSign, 
  Image as ImageIcon, 
  ExternalLink,
  PlusCircle,
  FileText,
  Clock,
  Layers,
  ChevronRight,
  UploadCloud,
  Edit3,
  CheckCircle2,
  Tag,
  FileCheck,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';

interface TransaksiPenelitian {
  id: number;
  created_at?: string;
  tanggal_transaksi: string;
  kategori: string;
  nominal: number;
  uraian: string;
  catatan?: string | null;
  foto_nota?: string | null;
  foto_kegiatan?: string | null;
  foto_barang?: string | null;
  foto_bukti_transfer?: string | null;
  foto_bukti_1?: string | null;
  foto_bukti_2?: string | null;
  foto_bukti_3?: string | null;
  foto_bukti_4?: string | null;
  created_by?: string | null;
}

export default function LaporanCatatanPenelitianPage() {
  const [dataList, setDataList] = useState<TransaksiPenelitian[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterKategori, setFilterKategori] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal Foto Preview (Mendukung Multi-Foto per Kategori)
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  // Modal Edit State
  const [editingItem, setEditingItem] = useState<TransaksiPenelitian | null>(null);
  const [editTanggal, setEditTanggal] = useState<string>('');
  const [editKategori, setEditKategori] = useState<string>('Penelitian');
  const [editNominal, setEditNominal] = useState<string>('');
  const [editUraian, setEditUraian] = useState<string>('');
  const [editCatatan, setEditCatatan] = useState<string>('');

  // Foto yang ada di item yang sedang diedit
  const [editPhotos, setEditPhotos] = useState<{
    nota: string[];
    kegiatan: string[];
    barang: string[];
    transfer: string[];
  }>({
    nota: [],
    kegiatan: [],
    barang: [],
    transfer: []
  });

  // Berkas baru yang ditambahkan saat edit
  const [editNewFiles, setEditNewFiles] = useState<{
    nota: File[];
    kegiatan: File[];
    barang: File[];
    transfer: File[];
  }>({
    nota: [],
    kegiatan: [],
    barang: [],
    transfer: []
  });

  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
  };

  // Helper memisahkan string URL menjadi array
  const parseUrls = (val?: string | null): string[] => {
    if (!val || typeof val !== 'string') return [];
    return val.split(',').map(s => s.trim()).filter(Boolean);
  };

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/api/catatan-penelitian?';
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (filterKategori !== 'ALL') url += `&kategori=${encodeURIComponent(filterKategori)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data || []);
      } else {
        toast.error('Gagal memuat data: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, filterKategori]);

  // Hapus Transaksi
  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pengeluaran ini?')) return;

    try {
      const res = await fetch(`/api/catatan-penelitian?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Transaksi berhasil dihapus');
        setDataList(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error('Gagal menghapus: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  // Buka Modal Edit
  const handleOpenEdit = (item: TransaksiPenelitian) => {
    setEditingItem(item);
    setEditTanggal(item.tanggal_transaksi);
    setEditKategori(item.kategori || 'Penelitian');
    setEditNominal(String(item.nominal || ''));
    setEditUraian(item.uraian || '');
    setEditCatatan(item.catatan || '');

    setEditPhotos({
      nota: parseUrls(item.foto_nota || item.foto_bukti_1),
      kegiatan: parseUrls(item.foto_kegiatan || item.foto_bukti_2),
      barang: parseUrls(item.foto_barang || item.foto_bukti_3),
      transfer: parseUrls(item.foto_bukti_transfer || item.foto_bukti_4),
    });

    setEditNewFiles({
      nota: [],
      kegiatan: [],
      barang: [],
      transfer: []
    });
  };

  // Hapus existing photo saat edit
  const removeExistingPhoto = (type: keyof typeof editPhotos, idxToRemove: number) => {
    setEditPhotos(prev => ({
      ...prev,
      [type]: prev[type].filter((_, idx) => idx !== idxToRemove)
    }));
  };

  // Tambah file baru saat edit
  const handleAddEditFiles = (type: keyof typeof editNewFiles, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setEditNewFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...newFiles]
      }));
    }
  };

  // Hapus new file saat edit
  const removeNewFile = (type: keyof typeof editNewFiles, idxToRemove: number) => {
    setEditNewFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, idx) => idx !== idxToRemove)
    }));
  };

  // Helper upload files
  const uploadMultipleFiles = async (files: File[]) => {
    if (files.length === 0) return [];
    
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `penelitian_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}`;
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('fileName', fileName);
      uploadFormData.append('folder', 'lampiran_penelitian');

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

    return await Promise.all(uploadPromises);
  };

  // Simpan Update Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editNominal || isNaN(Number(editNominal)) || Number(editNominal) <= 0) {
      toast.error('Nominal pengeluaran harus berupa angka valid!');
      return;
    }
    if (!editUraian.trim()) {
      toast.error('Uraian kegiatan wajib diisi!');
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading('Menyimpan perubahan transaksi...');

    try {
      // Unggah berkas-berkas baru jika ada
      const [uploadedNota, uploadedKegiatan, uploadedBarang, uploadedTransfer] = await Promise.all([
        uploadMultipleFiles(editNewFiles.nota),
        uploadMultipleFiles(editNewFiles.kegiatan),
        uploadMultipleFiles(editNewFiles.barang),
        uploadMultipleFiles(editNewFiles.transfer),
      ]);

      const finalNota = [...editPhotos.nota, ...uploadedNota].filter(Boolean).join(', ');
      const finalKegiatan = [...editPhotos.kegiatan, ...uploadedKegiatan].filter(Boolean).join(', ');
      const finalBarang = [...editPhotos.barang, ...uploadedBarang].filter(Boolean).join(', ');
      const finalTransfer = [...editPhotos.transfer, ...uploadedTransfer].filter(Boolean).join(', ');

      const payload = {
        id: editingItem.id,
        tanggal_transaksi: editTanggal,
        kategori: editKategori,
        nominal: Number(editNominal),
        uraian: editUraian.trim(),
        catatan: editCatatan.trim(),
        foto_nota: finalNota,
        foto_kegiatan: finalKegiatan,
        foto_barang: finalBarang,
        foto_bukti_transfer: finalTransfer,
        foto_bukti_1: finalNota,
        foto_bukti_2: finalKegiatan,
        foto_bukti_3: finalBarang,
        foto_bukti_4: finalTransfer,
      };

      const res = await fetch('/api/catatan-penelitian', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui transaksi');
      }

      toast.success('Transaksi pengeluaran berhasil diperbarui!', { id: toastId });

      // Update local state
      setDataList(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...payload } : item));
      setEditingItem(null);
    } catch (err: any) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered Data di client jika ada search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return dataList;
    const q = searchQuery.toLowerCase();
    return dataList.filter(item => 
      (item.uraian && item.uraian.toLowerCase().includes(q)) ||
      (item.catatan && item.catatan.toLowerCase().includes(q)) ||
      (item.kategori && item.kategori.toLowerCase().includes(q))
    );
  }, [dataList, searchQuery]);

  // Statistik Ringkasan
  const totalNominal = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  }, [filteredData]);

  const totalFotoLampiran = useMemo(() => {
    return filteredData.reduce((count, curr) => {
      const n = parseUrls(curr.foto_nota || curr.foto_bukti_1).length;
      const k = parseUrls(curr.foto_kegiatan || curr.foto_bukti_2).length;
      const b = parseUrls(curr.foto_barang || curr.foto_bukti_3).length;
      const t = parseUrls(curr.foto_bukti_transfer || curr.foto_bukti_4).length;
      return count + n + k + b + t;
    }, 0);
  }, [filteredData]);

  // Export ke Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor!');
      return;
    }

    try {
      const exportRows = filteredData.map((item, index) => ({
        'No': index + 1,
        'Tanggal Transaksi': item.tanggal_transaksi,
        'Kategori': item.kategori,
        'Nominal Pengeluaran': item.nominal,
        'Uraian Rincian Kegiatan': item.uraian,
        'Catatan': item.catatan || '',
        'Link Nota / Kwitansi': item.foto_nota || item.foto_bukti_1 || '',
        'Link Foto Kegiatan': item.foto_kegiatan || item.foto_bukti_2 || '',
        'Link Foto Barang': item.foto_barang || item.foto_bukti_3 || '',
        'Link Bukti Transfer': item.foto_bukti_transfer || item.foto_bukti_4 || '',
        'Diinput Oleh': item.created_by || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran_Penelitian");
      XLSX.writeFile(wb, `Laporan_Pengeluaran_Penelitian_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Laporan Excel berhasil diunduh');
    } catch (err: any) {
      toast.error('Gagal export: ' + err.message);
    }
  };

  const openGallery = (title: string, urls: string[]) => {
    if (urls.length === 0) return;
    setPreviewTitle(title);
    setPreviewPhotos(urls);
    setActivePhotoIdx(0);
  };

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto space-y-6">
      
      {/* Sub-Tab Navigation */}
      <CatatanPenelitianTabs />

      {/* ========================================================== */}
      {/* 📊 3 KARTU METRIK RINGKASAN PENGELUARAN                    */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Pengeluaran</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatRupiah(totalNominal)}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Akumulasi seluruh transaksi terfilter</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Jumlah Transaksi</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <FileText size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {filteredData.length}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Transaksi pengeluaran tercatat</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Foto Lampiran Tersimpan</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ImageIcon size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {totalFotoLampiran}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Tersimpan di folder lampiran_penelitian</p>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 🔍 BARIS FILTER, PENCARIAN & AKSI EKSPOR                  */}
      {/* ========================================================== */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-4">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari uraian kegiatan atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-8 bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs">
                ×
              </button>
            )}
          </div>

          {/* Filter Rentang Tanggal */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 h-10">
              <Calendar size={13} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none"
                title="Dari Tanggal"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-700 outline-none"
                title="Sampai Tanggal"
              />
            </div>

            {/* Filter Kategori */}
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="h-10 px-3 bg-gray-50/70 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Penelitian">Penelitian</option>
              <option value="Pengabdian Masyarakat">Pengabdian</option>
              <option value="Operasional Riset">Operasional Riset</option>
            </select>

            {/* Tombol Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Segarkan Data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : ''} />
            </button>
          </div>

          {/* Tombol Ekspor Excel & Input Baru */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Download size={14} />
              <span>Export Excel</span>
            </button>

            <Link
              href="/catatan-penelitian"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <PlusCircle size={14} />
              <span>Input Baru</span>
            </Link>
          </div>

        </div>

      </div>

      {/* ========================================================== */}
      {/* 📋 TABEL DATA PENGELUARAN PENELITIAN & 4 KELOMPOK BUKTI   */}
      {/* ========================================================== */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Daftar Rincian Pengeluaran Kegiatan</h3>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              {filteredData.length} Data
            </span>
          </div>

          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
            Klik kelompok foto bukti untuk melihat seluruh berkas gambar
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-gray-500">Memuat data pengeluaran...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
              <FileSpreadsheet size={24} />
            </div>
            <h4 className="text-sm font-black text-gray-800">Tidak Ada Data Pengeluaran</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Belum ada transaksi yang dicatat atau sesuai dengan filter pencarian Anda.
            </p>
            <Link
              href="/catatan-penelitian"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Input Pengeluaran Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-28">Tanggal</th>
                  <th className="py-3 px-4 w-28">Kategori</th>
                  <th className="py-3 px-4">Uraian / Rincian Kegiatan</th>
                  <th className="py-3 px-4 w-36 text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4 w-80 text-center">Lampiran Foto Bukti (Nota, Kegiatan, Barang, Transfer)</th>
                  <th className="py-3 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredData.map((item, index) => {
                  const notaUrls = parseUrls(item.foto_nota || item.foto_bukti_1);
                  const kegiatanUrls = parseUrls(item.foto_kegiatan || item.foto_bukti_2);
                  const barangUrls = parseUrls(item.foto_barang || item.foto_bukti_3);
                  const transferUrls = parseUrls(item.foto_bukti_transfer || item.foto_bukti_4);

                  return (
                    <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                      
                      {/* No */}
                      <td className="py-3 px-4 text-center text-gray-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-4 font-bold text-gray-700 whitespace-nowrap">
                        {item.tanggal_transaksi}
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.kategori}
                        </span>
                      </td>

                      {/* Uraian & Catatan */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 leading-snug">{item.uraian}</p>
                        {item.catatan && (
                          <p className="text-[11px] text-gray-500 mt-0.5 italic">
                            Catatan: {item.catatan}
                          </p>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-700 whitespace-nowrap">
                        {formatRupiah(item.nominal)}
                      </td>

                      {/* 4 Kolom Kelompok Foto Bukti Lampiran */}
                      <td className="py-3 px-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                          
                          {/* Nota / Kwitansi */}
                          <button
                            type="button"
                            disabled={notaUrls.length === 0}
                            onClick={() => openGallery(`Nota / Kwitansi: ${item.uraian}`, notaUrls)}
                            className={`p-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center transition-all ${
                              notaUrls.length > 0 
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer shadow-2xs hover:scale-105' 
                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            }`}
                            title="Nota / Kwitansi"
                          >
                            <span className="truncate w-full font-black">Nota ({notaUrls.length})</span>
                          </button>

                          {/* Foto Kegiatan */}
                          <button
                            type="button"
                            disabled={kegiatanUrls.length === 0}
                            onClick={() => openGallery(`Foto Kegiatan: ${item.uraian}`, kegiatanUrls)}
                            className={`p-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center transition-all ${
                              kegiatanUrls.length > 0 
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer shadow-2xs hover:scale-105' 
                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            }`}
                            title="Foto Kegiatan"
                          >
                            <span className="truncate w-full font-black">Kegiatan ({kegiatanUrls.length})</span>
                          </button>

                          {/* Foto Barang */}
                          <button
                            type="button"
                            disabled={barangUrls.length === 0}
                            onClick={() => openGallery(`Foto Barang: ${item.uraian}`, barangUrls)}
                            className={`p-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center transition-all ${
                              barangUrls.length > 0 
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer shadow-2xs hover:scale-105' 
                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            }`}
                            title="Foto Barang"
                          >
                            <span className="truncate w-full font-black">Barang ({barangUrls.length})</span>
                          </button>

                          {/* Bukti Transfer */}
                          <button
                            type="button"
                            disabled={transferUrls.length === 0}
                            onClick={() => openGallery(`Bukti Transfer: ${item.uraian}`, transferUrls)}
                            className={`p-1.5 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center transition-all ${
                              transferUrls.length > 0 
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer shadow-2xs hover:scale-105' 
                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            }`}
                            title="Bukti Transfer"
                          >
                            <span className="truncate w-full font-black">Transfer ({transferUrls.length})</span>
                          </button>

                        </div>
                      </td>

                      {/* Aksi: Edit & Hapus */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ========================================================== */}
      {/* ✏️ MODAL EDIT TRANSAKSI PENGELUARAN                        */}
      {/* ========================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Edit Pengeluaran Kegiatan</h3>
                  <p className="text-[11px] text-gray-500">Perbarui rincian atau berkas foto lampiran</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-700 flex items-center gap-1">
                    <Calendar size={13} className="text-indigo-600" />
                    <span>Tanggal Transaksi</span>
                  </label>
                  <input
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-gray-700 flex items-center gap-1">
                    <Tag size={13} className="text-indigo-600" />
                    <span>Kategori</span>
                  </label>
                  <select
                    value={editKategori}
                    onChange={(e) => setEditKategori(e.target.value)}
                    required
                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="Penelitian">🔬 Penelitian</option>
                    <option value="Pengabdian Masyarakat">🤝 Pengabdian Masyarakat</option>
                    <option value="Operasional Riset">⚙️ Operasional Riset</option>
                    <option value="Lainnya">📋 Pengeluaran Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <DollarSign size={13} className="text-indigo-600" />
                    <span>Nominal Pengeluaran</span>
                  </span>
                  {editNominal && Number(editNominal) > 0 && (
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {formatRupiah(Number(editNominal))}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(e.target.value)}
                    required
                    min="1"
                    className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Uraian */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-700 flex items-center gap-1">
                  <FileText size={13} className="text-indigo-600" />
                  <span>Uraian / Rincian Kegiatan</span>
                </label>
                <input
                  type="text"
                  value={editUraian}
                  onChange={(e) => setEditUraian(e.target.value)}
                  required
                  className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Catatan */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-700 flex items-center gap-1">
                  <FileCheck size={13} className="text-amber-600" />
                  <span>Catatan Tambahan</span>
                </label>
                <textarea
                  rows={2}
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {/* 4 Kotak Foto Lampiran Saat Edit */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="text-[11px] font-black text-gray-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UploadCloud size={13} className="text-indigo-600" />
                    <span>Kelola Berkas Foto Bukti Lampiran</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Bisa hapus foto lama atau tambah foto baru</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(['nota', 'kegiatan', 'barang', 'transfer'] as const).map((key) => {
                    const title = key === 'nota' ? 'Nota/Kwitansi' : key === 'kegiatan' ? 'Kegiatan' : key === 'barang' ? 'Barang' : 'Transfer';
                    const existingList = editPhotos[key];
                    const newList = editNewFiles[key];

                    return (
                      <div key={key} className="border border-gray-200 rounded-xl p-2.5 bg-gray-50/60 space-y-1.5 text-center">
                        <p className="text-[10px] font-black text-gray-700 border-b border-gray-200/80 pb-1">
                          {title} ({existingList.length + newList.length})
                        </p>

                        {/* List Existing Photos */}
                        <div className="space-y-1 max-h-[70px] overflow-y-auto">
                          {existingList.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 px-1.5 py-0.5 rounded text-[9px] text-indigo-700 font-bold">
                              <span className="truncate max-w-[80%]">Foto {idx + 1}</span>
                              <button type="button" onClick={() => removeExistingPhoto(key, idx)} className="text-rose-500 hover:bg-rose-50 p-0.5 rounded">
                                <X size={10} />
                              </button>
                            </div>
                          ))}

                          {/* List New Selected Files */}
                          {newList.map((file, idx) => (
                            <div key={`new-${idx}`} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] text-emerald-800 font-bold">
                              <span className="truncate max-w-[80%]">+ {file.name}</span>
                              <button type="button" onClick={() => removeNewFile(key, idx)} className="text-rose-500 hover:bg-rose-50 p-0.5 rounded">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Tombol Tambah Foto */}
                        <label className="cursor-pointer w-full bg-white border border-gray-200 hover:border-indigo-400 py-1 rounded-lg text-[10px] font-black text-indigo-600 hover:bg-indigo-50 shadow-2xs block">
                          + Tambah Foto
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => handleAddEditFiles(key, e)}
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Aksi Modal */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🖼️ MODAL PRATINJAU GALERI FOTO BUKTI (MULTI-FOTO)          */}
      {/* ========================================================== */}
      {previewPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-3 p-5 animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-gray-900 truncate max-w-md">
                  {previewTitle}
                </h4>
                <p className="text-[11px] text-gray-500">
                  Menampilkan foto ke-{activePhotoIdx + 1} dari {previewPhotos.length} foto lampiran
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewPhotos[activePhotoIdx]}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  <span>Buka Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhotos([])}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Area Foto Utama */}
            <div className="bg-gray-950 rounded-2xl overflow-hidden h-[60vh] flex items-center justify-center relative">
              <img
                src={previewPhotos[activePhotoIdx]}
                alt={`Foto Bukti ${activePhotoIdx + 1}`}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            {/* Baris Thumbnail Navigasi (Jika > 1 Foto) */}
            {previewPhotos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto p-1 scrollbar-none">
                {previewPhotos.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activePhotoIdx === idx 
                        ? 'border-indigo-600 scale-105 shadow-sm' 
                        : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
