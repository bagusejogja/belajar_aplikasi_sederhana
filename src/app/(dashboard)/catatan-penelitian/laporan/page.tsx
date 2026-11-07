'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  RefreshCw, 
  Trash2, 
  Eye, 
  X, 
  CheckCircle2, 
  DollarSign, 
  Image as ImageIcon, 
  ExternalLink,
  PlusCircle,
  FileText,
  Clock,
  Layers,
  ChevronRight
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

  // Modal Foto Preview
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
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
      let c = 0;
      if (curr.foto_bukti_1) c++;
      if (curr.foto_bukti_2) c++;
      if (curr.foto_bukti_3) c++;
      if (curr.foto_bukti_4) c++;
      return count + c;
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
        'Link Foto Bukti 1': item.foto_bukti_1 || '',
        'Link Foto Bukti 2': item.foto_bukti_2 || '',
        'Link Foto Bukti 3': item.foto_bukti_3 || '',
        'Link Foto Bukti 4': item.foto_bukti_4 || '',
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
      {/* 📋 TABEL DATA PENGELUARAN PENELITIAN & 4 FOTO BUKTI        */}
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
            Klik foto bukti untuk memperbesar pratinjau
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
                  <th className="py-3 px-4 w-32">Kategori</th>
                  <th className="py-3 px-4">Uraian / Rincian Kegiatan</th>
                  <th className="py-3 px-4 w-36 text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4 w-64 text-center">Lampiran 4 Foto Bukti</th>
                  <th className="py-3 px-4 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredData.map((item, index) => (
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

                    {/* 4 Kolom Foto Bukti Lampiran */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Bukti 1 */}
                        {item.foto_bukti_1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPhotoUrl(item.foto_bukti_1 || null);
                              setPreviewTitle(`Foto Bukti 1: ${item.uraian}`);
                            }}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 shadow-2xs hover:scale-105 transition-all cursor-pointer shrink-0"
                            title="Lihat Foto Bukti 1 (Nota/Kuitansi)"
                          >
                            <img src={item.foto_bukti_1} alt="B1" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center text-[9px] font-bold text-gray-300" title="Tidak ada foto 1">
                            B1 -
                          </div>
                        )}

                        {/* Bukti 2 */}
                        {item.foto_bukti_2 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPhotoUrl(item.foto_bukti_2 || null);
                              setPreviewTitle(`Foto Bukti 2: ${item.uraian}`);
                            }}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 shadow-2xs hover:scale-105 transition-all cursor-pointer shrink-0"
                            title="Lihat Foto Bukti 2 (Faktur Bayar)"
                          >
                            <img src={item.foto_bukti_2} alt="B2" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center text-[9px] font-bold text-gray-300" title="Tidak ada foto 2">
                            B2 -
                          </div>
                        )}

                        {/* Bukti 3 */}
                        {item.foto_bukti_3 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPhotoUrl(item.foto_bukti_3 || null);
                              setPreviewTitle(`Foto Bukti 3: ${item.uraian}`);
                            }}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 shadow-2xs hover:scale-105 transition-all cursor-pointer shrink-0"
                            title="Lihat Foto Bukti 3 (Dokumentasi)"
                          >
                            <img src={item.foto_bukti_3} alt="B3" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center text-[9px] font-bold text-gray-300" title="Tidak ada foto 3">
                            B3 -
                          </div>
                        )}

                        {/* Bukti 4 */}
                        {item.foto_bukti_4 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewPhotoUrl(item.foto_bukti_4 || null);
                              setPreviewTitle(`Foto Bukti 4: ${item.uraian}`);
                            }}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 shadow-2xs hover:scale-105 transition-all cursor-pointer shrink-0"
                            title="Lihat Foto Bukti 4 (Lampiran Lain)"
                          >
                            <img src={item.foto_bukti_4} alt="B4" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center text-[9px] font-bold text-gray-300" title="Tidak ada foto 4">
                            B4 -
                          </div>
                        )}

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
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ========================================================== */}
      {/* 🖼️ MODAL PRATINJAU FOTO BUKTI RESOLUSI PENUH              */}
      {/* ========================================================== */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-3 p-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-xs font-black text-gray-900 truncate max-w-md">
                {previewTitle}
              </h4>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhotoUrl}
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
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="bg-gray-950 rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center">
              <img
                src={previewPhotoUrl}
                alt="Lampiran Bukti"
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

