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
  ChevronLeft,
  UploadCloud,
  Edit3,
  CheckCircle2,
  Tag,
  FileCheck,
  Upload,
  Receipt,
  Camera,
  Package,
  CreditCard,
  RotateCcw,
  Wallet,
  AlertTriangle,
  Check,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';
import { getSafeFileUrl, getDownloadSafeFileUrl } from '@/lib/fileHelper';

type AttachmentState = { files: File[]; url: string };

interface TransaksiPenelitian {
  id: number;
  created_at?: string;
  tanggal_transaksi: string;
  kategori: string;
  nominal: number;
  uraian: string;
  catatan?: string | null;
  tipe_transaksi: string;
  status_kasbon: string;
  nama_penerima?: string | null;
  nominal_kasbon?: number;
  nominal_realisasi?: number;
  selisih_kasbon?: number;
  tanggal_penyelesaian?: string | null;
  catatan_penyelesaian?: string | null;
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
  const [filterTab, setFilterTab] = useState<'ALL' | 'kasbon_waiting' | 'kasbon_done' | 'langsung'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal Foto Preview
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  // Modal Selesaikan Kasbon
  const [selectedKasbonToSettle, setSelectedKasbonToSettle] = useState<TransaksiPenelitian | null>(null);
  const [settleTanggal, setSettleTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [settleNominalRealisasi, setSettleNominalRealisasi] = useState<string>('');
  const [settleCatatan, setSettleCatatan] = useState<string>('');
  const [settleAttachments, setSettleAttachments] = useState<{
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
  const [isSettling, setIsSettling] = useState<boolean>(false);

  // Modal Edit Transaksi
  const [editingItem, setEditingItem] = useState<TransaksiPenelitian | null>(null);
  const [editTanggal, setEditTanggal] = useState<string>('');
  const [editKategori, setEditKategori] = useState<string>('Penelitian');
  const [editNominal, setEditNominal] = useState<string>('');
  const [editUraian, setEditUraian] = useState<string>('');
  const [editCatatan, setEditCatatan] = useState<string>('');
  const [editNamaPenerima, setEditNamaPenerima] = useState<string>('');

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
    if (!confirm(`Hapus catatan transaksi pengeluaran/kasbon #${id}? Data yang dihapus tidak dapat dikembalikan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/catatan-penelitian?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Transaksi #${id} berhasil dihapus`);
        setDataList(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error('Gagal menghapus: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
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

  // Open Modal Selesaikan Kasbon
  const handleOpenSettleModal = (item: TransaksiPenelitian) => {
    setSelectedKasbonToSettle(item);
    setSettleTanggal(new Date().toISOString().split('T')[0]);
    setSettleNominalRealisasi(item.nominal_kasbon ? String(item.nominal_kasbon) : String(item.nominal));
    setSettleCatatan('');
    setSettleAttachments({
      nota: { files: [], url: '' },
      kegiatan: { files: [], url: '' },
      barang: { files: [], url: '' },
      transfer: { files: [], url: '' }
    });
  };

  // Submit Modal Selesaikan Kasbon
  const handleSettleKasbonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasbonToSettle) return;

    if (!settleNominalRealisasi || isNaN(Number(settleNominalRealisasi)) || Number(settleNominalRealisasi) <= 0) {
      toast.error('Total nominal belanja riil sesuai nota harus diisi!');
      return;
    }

    setIsSettling(true);
    const toastId = toast.loading('Menyimpan nota penyelesaian kasbon...');

    try {
      const [notaUrls, kegiatanUrls, barangUrls, transferUrls] = await Promise.all([
        uploadMultipleFiles(settleAttachments.nota.files),
        uploadMultipleFiles(settleAttachments.kegiatan.files),
        uploadMultipleFiles(settleAttachments.barang.files),
        uploadMultipleFiles(settleAttachments.transfer.files),
      ]);

      const notaFinal = notaUrls.join(', ');
      const kegiatanFinal = kegiatanUrls.join(', ');
      const barangFinal = barangUrls.join(', ');
      const transferFinal = transferUrls.join(', ');

      const res = await fetch('/api/catatan-penelitian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'selesaikan_kasbon',
          id: selectedKasbonToSettle.id,
          nominal_kasbon: selectedKasbonToSettle.nominal_kasbon || selectedKasbonToSettle.nominal,
          nominal_realisasi: Number(settleNominalRealisasi),
          tanggal_penyelesaian: settleTanggal,
          catatan_penyelesaian: settleCatatan.trim(),
          foto_bukti_1: notaFinal || selectedKasbonToSettle.foto_bukti_1,
          foto_bukti_2: kegiatanFinal || selectedKasbonToSettle.foto_bukti_2,
          foto_bukti_3: barangFinal || selectedKasbonToSettle.foto_bukti_3,
          foto_bukti_4: transferFinal || selectedKasbonToSettle.foto_bukti_4,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyelesaikan kasbon');
      }

      toast.success(`Kasbon #${selectedKasbonToSettle.id} berhasil diselesaikan dengan nota!`, { id: toastId });
      setSelectedKasbonToSettle(null);
      fetchData();
    } catch (err: any) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsSettling(false);
    }
  };

  // Open Modal Edit
  const handleOpenEdit = (item: TransaksiPenelitian) => {
    setEditingItem(item);
    setEditTanggal(item.tanggal_transaksi);
    setEditKategori(item.kategori || 'Penelitian');
    setEditNominal(String(item.nominal));
    setEditUraian(item.uraian || '');
    setEditCatatan(item.catatan || '');
    setEditNamaPenerima(item.nama_penerima || '');

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

  // Submit Update Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editNominal || isNaN(Number(editNominal)) || Number(editNominal) <= 0) {
      toast.error('Nominal harus berupa angka valid!');
      return;
    }
    if (!editUraian.trim()) {
      toast.error('Uraian kegiatan wajib diisi!');
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading('Menyimpan perubahan transaksi...');

    try {
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

      const newNominal = Number(editNominal);
      const nominalFields: Record<string, number> = {};
      if (editingItem.tipe_transaksi === 'Kasbon') {
        if (editingItem.status_kasbon === 'Selesai') {
          // Kasbon selesai: nominal yang diedit = belanja riil, selisih dihitung ulang
          const awal = Number(editingItem.nominal_kasbon || 0);
          nominalFields.nominal_realisasi = newNominal;
          nominalFields.selisih_kasbon = awal - newNominal;
        } else {
          // Masih menunggu nota: nominal yang diedit = nominal kasbon
          nominalFields.nominal_kasbon = newNominal;
        }
      } else {
        nominalFields.nominal_realisasi = newNominal;
      }

      const payload = {
        id: editingItem.id,
        ...nominalFields,
        tanggal_transaksi: editTanggal,
        kategori: editKategori,
        nominal: newNominal,
        nama_penerima: editNamaPenerima.trim() || null,
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

      toast.success('Transaksi berhasil diperbarui!', { id: toastId });
      setDataList(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...payload } : item));
      setEditingItem(null);
    } catch (err: any) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter Data Tab & Search
  const filteredData = useMemo(() => {
    let list = dataList;

    // Filter berdasarkan tab kasbon
    if (filterTab === 'kasbon_waiting') {
      list = list.filter(it => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Menunggu Nota');
    } else if (filterTab === 'kasbon_done') {
      list = list.filter(it => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Selesai');
    } else if (filterTab === 'langsung') {
      list = list.filter(it => it.tipe_transaksi !== 'Kasbon');
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      (item.uraian && item.uraian.toLowerCase().includes(q)) ||
      (item.catatan && item.catatan.toLowerCase().includes(q)) ||
      (item.nama_penerima && item.nama_penerima.toLowerCase().includes(q)) ||
      (item.kategori && item.kategori.toLowerCase().includes(q))
    );
  }, [dataList, filterTab, searchQuery]);

  // Statistik Metrik
  const kasbonWaitingCount = useMemo(() => {
    return dataList.filter(it => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Menunggu Nota').length;
  }, [dataList]);

  const kasbonWaitingTotal = useMemo(() => {
    return dataList
      .filter(it => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Menunggu Nota')
      .reduce((acc, curr) => acc + (Number(curr.nominal_kasbon || curr.nominal) || 0), 0);
  }, [dataList]);

  const kasbonDoneCount = useMemo(() => {
    return dataList.filter(it => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Selesai').length;
  }, [dataList]);

  const totalRealisasiBelanja = useMemo(() => {
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

  // Export Excel Lengkap dengan Kolom Kasbon
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data untuk diekspor!');
      return;
    }

    try {
      const exportRows = filteredData.map((item, index) => {
        const isKasbon = item.tipe_transaksi === 'Kasbon';
        const kasbonVal = Number(item.nominal_kasbon || (isKasbon ? item.nominal : 0));
        const realisasiVal = Number(item.nominal_realisasi || (!isKasbon ? item.nominal : 0));
        const diffVal = Number(item.selisih_kasbon || 0);

        return {
          'No': index + 1,
          'Tanggal Transaksi': item.tanggal_transaksi,
          'Jenis Transaksi': isKasbon ? 'Kasbon (Uang Muka)' : 'Pengeluaran Langsung',
          'Status Kasbon': isKasbon ? item.status_kasbon : 'Selesai',
          'Penerima Kasbon / PIC': item.nama_penerima || '-',
          'Kategori': item.kategori,
          'Nominal Kasbon Awal': isKasbon ? kasbonVal : 0,
          'Realisasi Belanja Riil': isKasbon ? (item.status_kasbon === 'Selesai' ? realisasiVal : 0) : item.nominal,
          'Selisih Kasbon': isKasbon ? diffVal : 0,
          'Keterangan Selisih': isKasbon && item.status_kasbon === 'Selesai' 
            ? (diffVal > 0 ? `Sisa Kembali Rp ${diffVal.toLocaleString('id-ID')}` : diffVal < 0 ? `Kurang Bayar Rp ${Math.abs(diffVal).toLocaleString('id-ID')}` : 'Pas/Lunas')
            : (isKasbon ? 'Belum Ada Nota' : '-'),
          'Tanggal Penyelesaian Nota': item.tanggal_penyelesaian || '-',
          'Uraian Rincian Kegiatan': item.uraian,
          'Catatan': item.catatan || '',
          'Catatan Penyelesaian': item.catatan_penyelesaian || '',
          'Foto Nota': item.foto_nota || item.foto_bukti_1 || '',
          'Foto Kegiatan': item.foto_kegiatan || item.foto_bukti_2 || '',
          'Foto Barang': item.foto_barang || item.foto_bukti_3 || '',
          'Foto Bukti Transfer': item.foto_bukti_transfer || item.foto_bukti_4 || '',
          'Diinput Oleh': item.created_by || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap_Penelitian_Kasbon");
      XLSX.writeFile(wb, `Laporan_Catatan_Penelitian_Kasbon_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  // Pagination
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (pageSize === -1) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Kalkulasi preview selisih pada modal penyelesaian
  const modalKasbonAwal = selectedKasbonToSettle ? Number(selectedKasbonToSettle.nominal_kasbon || selectedKasbonToSettle.nominal) : 0;
  const modalBelanjaRiil = Number(settleNominalRealisasi) || 0;
  const modalSelisih = modalKasbonAwal - modalBelanjaRiil;

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto space-y-6">
      
      {/* Sub-Tab Navigation */}
      <CatatanPenelitianTabs />

      {/* ========================================================== */}
      {/* 📊 4 KARTU METRIK RINGKASAN KASBON & PENGELUARAN           */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Belanja Riil */}
        <div className="bg-white p-4.5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Total Belanja Riil</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {formatRupiah(totalRealisasiBelanja)}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Akumulasi pengeluaran nota yang terfilter</p>
        </div>

        {/* Card 2: Kasbon Menunggu Nota (Outstanding) */}
        <div className="bg-white p-4.5 rounded-3xl border border-amber-200/90 shadow-2xs space-y-1.5 bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} />
              <span>Kasbon Menunggu Nota</span>
            </span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Wallet size={16} />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
            {formatRupiah(kasbonWaitingTotal)}
          </div>
          <p className="text-[11px] text-amber-700 font-bold">
            {kasbonWaitingCount} kasbon sedang dipegang &amp; belum selesai
          </p>
        </div>

        {/* Card 3: Kasbon Selesai */}
        <div className="bg-white p-4.5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Kasbon Selesai Nota</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-900 font-mono">
            {kasbonDoneCount}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Kegiatan telah melengkapi nota SPJ</p>
        </div>

        {/* Card 4: Foto Lampiran */}
        <div className="bg-white p-4.5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Foto Bukti Lampiran</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ImageIcon size={16} />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono">
            {totalFotoLampiran}
          </div>
          <p className="text-[11px] text-gray-400 font-medium">Nota, kegiatan, barang, &amp; transfer</p>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 🔍 FILTER TAB & PENCARIAN                                 */}
      {/* ========================================================== */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-2xs space-y-4">
        
        {/* Quick Filter Tabs Model Kasbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-100 scrollbar-none">
          <button
            type="button"
            onClick={() => { setFilterTab('ALL'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Semua Transaksi</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
              {dataList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setFilterTab('kasbon_waiting'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'kasbon_waiting'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock size={12} />
            <span>⏳ Kasbon Menunggu Nota</span>
            {kasbonWaitingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-900 text-white text-[10px] font-mono">
                {kasbonWaitingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { setFilterTab('kasbon_done'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'kasbon_done'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>✅ Kasbon Selesai</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-mono">
              {kasbonDoneCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setFilterTab('langsung'); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'langsung'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Receipt size={12} />
            <span>🧾 Pengeluaran Langsung</span>
          </button>
        </div>

        {/* Search & Date Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari uraian, nama penerima kasbon, atau catatan..."
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

          <div className="flex items-center gap-2 flex-wrap">
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

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="h-10 px-3 bg-gray-50/70 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Penelitian">Penelitian (Umum)</option>
              <option value="Hewan & Bahan Penelitian">Hewan &amp; Bahan Penelitian (Kelinci, dll)</option>
              <option value="Perlengkapan Penelitian">Perlengkapan &amp; Alat Penelitian</option>
              <option value="Pengabdian">Pengabdian</option>
              <option value="Operasional Lab">Operasional Lab</option>
              <option value="Perjalanan Dinas">Perjalanan Dinas</option>
              <option value="Konsumsi & Rapat">Konsumsi &amp; Rapat</option>
              <option value="Jasa & Honor">Jasa &amp; Honor</option>
              <option value="Lainnya">Lainnya</option>
            </select>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Segarkan Data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : ''} />
            </button>

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
      {/* 📋 TABEL DATA TRANSAKSI & MONITORING KASBON                */}
      {/* ========================================================== */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-3.5 w-28">Tanggal</th>
                <th className="py-3.5 px-3.5 w-36">Jenis &amp; Status</th>
                <th className="py-3.5 px-3.5 w-44">Kategori &amp; PIC</th>
                <th className="py-3.5 px-3.5">Uraian / Keperluan</th>
                <th className="py-3.5 px-3.5 text-right w-44">Nominal / Kasbon</th>
                <th className="py-3.5 px-3 text-center w-36">Foto Bukti</th>
                <th className="py-3.5 px-3.5 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    <RefreshCw size={24} className="animate-spin text-indigo-600 mx-auto mb-2" />
                    <span>Memuat data pengeluaran &amp; kasbon...</span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 space-y-2">
                    <FileText size={32} className="mx-auto text-gray-300" />
                    <p className="font-bold text-gray-500">Belum ada transaksi pada filter ini.</p>
                    <p className="text-[11px] text-gray-400">Silakan ubah filter atau lakukan input kasbon/pengeluaran baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  const isKasbon = item.tipe_transaksi === 'Kasbon';
                  const isWaiting = isKasbon && item.status_kasbon === 'Menunggu Nota';
                  const isDone = isKasbon && item.status_kasbon === 'Selesai';

                  const notaPhotos = parseUrls(item.foto_nota || item.foto_bukti_1);
                  const kegiatanPhotos = parseUrls(item.foto_kegiatan || item.foto_bukti_2);
                  const barangPhotos = parseUrls(item.foto_barang || item.foto_bukti_3);
                  const transferPhotos = parseUrls(item.foto_bukti_transfer || item.foto_bukti_4);
                  const totalPhotos = notaPhotos.length + kegiatanPhotos.length + barangPhotos.length + transferPhotos.length;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isWaiting ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-3 text-center font-bold text-gray-400 align-top">
                        {rowNum}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3.5 px-3.5 font-bold text-gray-800 align-top whitespace-nowrap">
                        <div className="font-mono">{item.tanggal_transaksi}</div>
                        {item.tanggal_penyelesaian && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            Selesai: {item.tanggal_penyelesaian}
                          </div>
                        )}
                      </td>

                      {/* Jenis & Status */}
                      <td className="py-3.5 px-3.5 align-top space-y-1">
                        {isWaiting ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock size={10} />
                            <span>Kasbon: Menunggu Nota</span>
                          </span>
                        ) : isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 size={10} />
                            <span>Kasbon: Selesai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <Receipt size={10} />
                            <span>Pengeluaran Langsung</span>
                          </span>
                        )}
                      </td>

                      {/* Kategori & PIC */}
                      <td className="py-3.5 px-3.5 align-top space-y-0.5">
                        <span className="text-xs font-bold text-gray-900 block">
                          {item.kategori}
                        </span>
                        {item.nama_penerima ? (
                          <span className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                            <UserCheck size={11} />
                            <span>PIC: {item.nama_penerima}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">-</span>
                        )}
                      </td>

                      {/* Uraian */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="font-medium text-gray-800 leading-relaxed max-w-md">
                          {item.uraian}
                        </div>
                        {item.catatan && (
                          <div className="text-[11px] text-gray-400 italic mt-0.5">
                            Catatan: {item.catatan}
                          </div>
                        )}
                        {item.catatan_penyelesaian && (
                          <div className="text-[11px] text-emerald-700 font-medium mt-1 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-200">
                            Penyelesaian: {item.catatan_penyelesaian}
                          </div>
                        )}
                      </td>

                      {/* Nominal / Kasbon */}
                      <td className="py-3.5 px-3.5 align-top text-right space-y-1">
                        {isKasbon ? (
                          <div>
                            <div className="text-xs font-black text-amber-900 font-mono">
                              Kasbon: {formatRupiah(item.nominal_kasbon || item.nominal)}
                            </div>
                            {item.status_kasbon === 'Selesai' && (
                              <>
                                <div className="text-[11px] font-black text-emerald-700 font-mono">
                                  Belanja: {formatRupiah(item.nominal_realisasi || item.nominal)}
                                </div>
                                {Number(item.selisih_kasbon || 0) !== 0 && (
                                  <div className={`text-[10px] font-black font-mono ${
                                    Number(item.selisih_kasbon) > 0 ? 'text-emerald-700' : 'text-rose-600'
                                  }`}>
                                    {Number(item.selisih_kasbon) > 0 
                                      ? `Sisa: ${formatRupiah(item.selisih_kasbon || 0)}` 
                                      : `Nombok: ${formatRupiah(Math.abs(item.selisih_kasbon || 0))}`}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs font-black text-gray-900 font-mono">
                            {formatRupiah(item.nominal)}
                          </div>
                        )}
                      </td>

                      {/* Foto Bukti */}
                      <td className="py-3.5 px-3 align-top text-center">
                        {totalPhotos === 0 ? (
                          <span className="text-[10px] text-gray-400 italic">Tanpa Foto</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {notaPhotos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => openGallery('Foto Nota / Kwitansi', notaPhotos)}
                                className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold hover:bg-rose-100"
                                title={`${notaPhotos.length} Foto Nota`}
                              >
                                Nota ({notaPhotos.length})
                              </button>
                            )}
                            {kegiatanPhotos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => openGallery('Foto Kegiatan', kegiatanPhotos)}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold hover:bg-blue-100"
                                title={`${kegiatanPhotos.length} Foto Kegiatan`}
                              >
                                Keg ({kegiatanPhotos.length})
                              </button>
                            )}
                            {barangPhotos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => openGallery('Foto Barang', barangPhotos)}
                                className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold hover:bg-amber-100"
                                title={`${barangPhotos.length} Foto Barang`}
                              >
                                Brg ({barangPhotos.length})
                              </button>
                            )}
                            {transferPhotos.length > 0 && (
                              <button
                                type="button"
                                onClick={() => openGallery('Foto Bukti Transfer', transferPhotos)}
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold hover:bg-emerald-100"
                                title={`${transferPhotos.length} Bukti Transfer`}
                              >
                                Trf ({transferPhotos.length})
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-3.5 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Tombol Selesaikan Nota jika Kasbon masih menunggu */}
                          {isWaiting && (
                            <button
                              type="button"
                              onClick={() => handleOpenSettleModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition-all cursor-pointer active:scale-95"
                              title="Selesaikan kasbon dengan nota belanja"
                            >
                              <Receipt size={11} />
                              <span>Selesaikan</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            title="Edit Data"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            title="Hapus Data"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-slate-50/70 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 font-bold text-gray-700 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={-1}>Semua Baris</option>
            </select>
            <span>
              Menampilkan {paginatedData.length} dari {filteredData.length} transaksi
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || pageSize === -1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft size={13} className="inline mr-0.5" />
              <span>Sebelumnya</span>
            </button>
            <span className="px-3 py-1 font-black text-gray-800 bg-white border border-gray-200 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || pageSize === -1}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all cursor-pointer"
            >
              <span>Selanjutnya</span>
              <ChevronRight size={13} className="inline ml-0.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* MODAL SELESAIKAN KASBON DARI LAPORAN                       */}
      {/* ========================================================== */}
      {selectedKasbonToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col p-6 sm:p-7 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Receipt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Penyelesaian Kasbon &amp; Realisasi Nota
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Kasbon #{selectedKasbonToSettle.id} ({selectedKasbonToSettle.nama_penerima || 'PIC'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKasbonToSettle(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 block">Penerima Kasbon</span>
                  <span className="text-xs font-black text-gray-900">
                    {selectedKasbonToSettle.nama_penerima || 'PIC Kegiatan'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 block">Tanggal Kasbon</span>
                  <span className="text-xs font-bold text-gray-700">
                    {selectedKasbonToSettle.tanggal_transaksi}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-amber-700 block">Uang Muka Kasbon</span>
                  <span className="text-sm font-black text-amber-900 font-mono">
                    {formatRupiah(modalKasbonAwal)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-gray-600">
                <span className="font-bold text-gray-700">Uraian Kasbon: </span>
                <span>{selectedKasbonToSettle.uraian}</span>
              </div>
            </div>

            <form onSubmit={handleSettleKasbonSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-600" />
                    <span>Tanggal Penyelesaian / Nota</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={settleTanggal}
                    onChange={(e) => setSettleTanggal(e.target.value)}
                    className="w-full text-xs font-bold text-gray-800 border border-gray-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={13} className="text-emerald-600" />
                      <span>Total Belanja Riil Nota (Rp)</span>
                      <span className="text-rose-500">*</span>
                    </span>
                    {modalBelanjaRiil > 0 && (
                      <span className="text-[11px] font-black text-emerald-700 font-mono">
                        {formatRupiah(modalBelanjaRiil)}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">Rp</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={settleNominalRealisasi}
                      onChange={(e) => setSettleNominalRealisasi(e.target.value)}
                      placeholder="0"
                      className="w-full text-xs font-bold text-gray-900 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Kalkulator Selisih Visual */}
              <div className={`p-4 rounded-2xl border transition-all ${
                modalSelisih > 0 
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : modalSelisih < 0
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-blue-50/80 border-blue-300 text-blue-950'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                      {modalSelisih > 0 ? (
                        <>
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span>Status: Sisa Kasbon Lebih (Uang Dikembalikan)</span>
                        </>
                      ) : modalSelisih < 0 ? (
                        <>
                          <AlertTriangle size={15} className="text-amber-600" />
                          <span>Status: Kurang Bayar (Reimbursement / Nombok)</span>
                        </>
                      ) : (
                        <>
                          <Check size={15} className="text-blue-600" />
                          <span>Status: Pas / Selesai Sempurna</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] opacity-80">
                      {modalSelisih > 0 
                        ? `Uang kasbon awal lebih besar dari belanja riil. Sisa ${formatRupiah(modalSelisih)} disetorkan kembali.`
                        : modalSelisih < 0
                        ? `Belanja riil melebihi kasbon. Kekurangan ${formatRupiah(Math.abs(modalSelisih))} diganti reimburse.`
                        : 'Total belanja nota tepat sama dengan uang muka kasbon yang diberikan.'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase opacity-70 block">
                      {modalSelisih >= 0 ? 'Sisa Dikembalikan' : 'Kurang Bayar'}
                    </span>
                    <span className="text-base font-black font-mono">
                      {formatRupiah(Math.abs(modalSelisih))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Catatan Penyelesaian Kasbon</label>
                <input
                  type="text"
                  value={settleCatatan}
                  onChange={(e) => setSettleCatatan(e.target.value)}
                  placeholder="Contoh: Sisa kasbon sudah dikembalikan tunai ke bendahara..."
                  className="w-full text-xs font-medium text-gray-800 border border-gray-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedKasbonToSettle(null)}
                  disabled={isSettling}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSettling ? (
                    <>
                      <RotateCcw size={13} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Simpan &amp; Selesaikan Kasbon</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL EDIT TRANSAKSI                                       */}
      {/* ========================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900">Edit Catatan Transaksi #{editingItem.id}</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Kategori</label>
                  <select
                    value={editKategori}
                    onChange={(e) => setEditKategori(e.target.value)}
                    className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2.5"
                  >
                    <option value="Penelitian">Penelitian (Umum)</option>
                    <option value="Hewan & Bahan Penelitian">Hewan &amp; Bahan Penelitian (Kelinci, dll)</option>
                    <option value="Perlengkapan Penelitian">Perlengkapan &amp; Alat Penelitian</option>
                    <option value="Pengabdian">Pengabdian</option>
                    <option value="Operasional Lab">Operasional Lab</option>
                    <option value="Perjalanan Dinas">Perjalanan Dinas</option>
                    <option value="Konsumsi & Rapat">Konsumsi &amp; Rapat</option>
                    <option value="Jasa & Honor">Jasa &amp; Honor</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {editingItem.tipe_transaksi === 'Kasbon' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nama Penerima Kasbon (PIC)</label>
                  <input
                    type="text"
                    value={editNamaPenerima}
                    onChange={(e) => setEditNamaPenerima(e.target.value)}
                    className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2.5"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {editingItem.tipe_transaksi === 'Kasbon'
                    ? (editingItem.status_kasbon === 'Selesai' ? 'Nominal Belanja Riil (Rp)' : 'Nominal Kasbon (Rp)')
                    : 'Nominal (Rp)'}
                </label>
                <input
                  type="number"
                  required
                  value={editNominal}
                  onChange={(e) => setEditNominal(e.target.value)}
                  className="w-full text-xs font-bold border border-gray-200 rounded-xl p-2.5 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Uraian Kegiatan</label>
                <textarea
                  required
                  rows={2}
                  value={editUraian}
                  onChange={(e) => setEditUraian(e.target.value)}
                  className="w-full text-xs font-medium border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  className="w-full text-xs font-medium border border-gray-200 rounded-xl p-2.5"
                />
              </div>

              {/* Lampiran Pendukung */}
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-black text-gray-800 block">Lampiran Pendukung</label>
                {([
                  ['nota', 'Foto Nota / Kuitansi'],
                  ['kegiatan', 'Foto Kegiatan'],
                  ['barang', 'Foto Barang / Hewan'],
                  ['transfer', 'Bukti Transfer / Kasbon'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="p-2.5 bg-slate-50 border border-gray-200 rounded-xl space-y-1.5">
                    <div className="text-[11px] font-bold text-gray-700">{label}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {editPhotos[key].map((url, i) => (
                        <div key={url + i} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg pl-2 pr-1 py-1 text-[10px] font-bold">
                          <a href={getSafeFileUrl(url)} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            File {i + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() => setEditPhotos(prev => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== i) }))}
                            className="p-0.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                            title="Hapus lampiran"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      {editNewFiles[key].map((f, i) => (
                        <div key={f.name + i} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg pl-2 pr-1 py-1 text-[10px] font-bold text-emerald-800">
                          <span className="max-w-[140px] truncate">{f.name} (baru)</span>
                          <button
                            type="button"
                            onClick={() => setEditNewFiles(prev => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== i) }))}
                            className="p-0.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                      {editPhotos[key].length === 0 && editNewFiles[key].length === 0 && (
                        <span className="text-[10px] text-gray-400 font-medium">Belum ada lampiran</span>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer">
                      <Upload size={12} />
                      <span>Tambah File</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const picked = Array.from(e.target.files || []);
                          if (picked.length) setEditNewFiles(prev => ({ ...prev, [key]: [...prev[key], ...picked] }));
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL GALLERY PREVIEW FOTO LAMPIRAN                        */}
      {/* ========================================================== */}
      {previewPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black text-gray-800">{previewTitle} ({activePhotoIdx + 1} dari {previewPhotos.length})</h4>
              <button onClick={() => setPreviewPhotos([])} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src={previewPhotos[activePhotoIdx]}
                alt="Bukti Lampiran"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {previewPhotos.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {previewPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                      activePhotoIdx === i ? 'border-indigo-600 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={url} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
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
