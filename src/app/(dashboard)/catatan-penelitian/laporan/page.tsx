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
  UploadCloud
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
                  <th className="py-3 px-4 w-16 text-center">Aksi</th>
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

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <Trash2 size={15} />
                        </button>
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
