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
  Edit3,
  CheckCircle2,
  Tag,
  Upload,
  Receipt,
  RotateCcw,
  Wallet,
  AlertTriangle,
  UserCheck,
  Printer,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';
import NotaKasbonModal from '@/components/NotaKasbonModal';
import { getSafeFileUrl } from '@/lib/fileHelper';

// Komponen gambar kompresi untuk cetak PDF tanpa terhalang CORS / R2
const CompressedImage = ({ src, alt, className, style }: any) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    if (src.includes('drive.google.com/thumbnail')) {
      setDataUrl(src);
      return;
    }

    const proxyUrl = `/api/image-cors?url=${encodeURIComponent(src)}`;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 380;
      const MAX_HEIGHT = 380;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        setDataUrl(canvas.toDataURL('image/jpeg', 0.5));
      }
    };
    img.onerror = () => {
      setDataUrl(src);
    };
    img.src = proxyUrl;
  }, [src]);

  if (!dataUrl) {
    return (
      <div className="h-20 w-20 flex items-center justify-center bg-gray-50 border border-gray-200 rounded text-gray-400 text-[10px]">
        Loading...
      </div>
    );
  }

  return <img src={dataUrl} alt={alt} className={className} style={style} />;
};

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
  notas?: any[];
  nota_count?: number;
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

  // Mode Tampilan: 'table' (Tabel interaktif) atau 'print_preview' (Pratinjau cetak PDF)
  const [viewMode, setViewMode] = useState<'table' | 'print_preview'>('table');

  // Toggle ekspansi rincian nota per baris ID
  const [expandedNotaRows, setExpandedNotaRows] = useState<Record<number, boolean>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal Foto Preview
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  // Modal Selesaikan / Tambah Nota Kasbon
  const [selectedKasbonToSettle, setSelectedKasbonToSettle] = useState<TransaksiPenelitian | null>(null);

  // Modal Edit Induk Transaksi
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

  const toggleExpandNota = (id: number) => {
    setExpandedNotaRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Fetch Data dari API
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

  // Buka kembali kasbon yang sudah ditutup (jika ada nota susulan)
  const handleReopenKasbon = async (item: TransaksiPenelitian) => {
    if (!confirm(`Buka kembali kasbon #${item.id} (${item.nama_penerima || 'PIC'}) karena masih ada nota susulan?`)) return;
    try {
      const res = await fetch('/api/catatan-penelitian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'buka_kembali', kasbon_id: item.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Gagal membuka kembali');
      toast.success('Kasbon dibuka kembali. Silakan tambah nota susulan.');
      fetchData();
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    }
  };

  // Open Modal Edit Induk
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

  // Submit Update Edit Induk
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
          const awal = Number(editingItem.nominal_kasbon || 0);
          nominalFields.nominal_realisasi = newNominal;
          nominalFields.selisih_kasbon = awal - newNominal;
        } else {
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

  // Data Rekapitulasi per Kategori untuk Laporan PDF (persis report-photo)
  const rekapKategori = useMemo(() => {
    const map: Record<string, { kategori: string; trx: number; totalKasbon: number; totalBelanja: number; selisih: number }> = {};
    let grandKasbon = 0;
    let grandBelanja = 0;

    filteredData.forEach(item => {
      const kat = item.kategori || 'Penelitian';
      const isKasbon = item.tipe_transaksi === 'Kasbon';
      const kasbonVal = isKasbon ? Number(item.nominal_kasbon || item.nominal || 0) : 0;
      const belanjaVal = Number(item.nominal_realisasi || item.nominal || 0);

      if (!map[kat]) {
        map[kat] = { kategori: kat, trx: 0, totalKasbon: 0, totalBelanja: 0, selisih: 0 };
      }
      map[kat].trx += 1;
      map[kat].totalKasbon += kasbonVal;
      map[kat].totalBelanja += belanjaVal;
      map[kat].selisih += (kasbonVal - belanjaVal);

      grandKasbon += kasbonVal;
      grandBelanja += belanjaVal;
    });

    const rows = Object.values(map).sort((a, b) => b.totalBelanja - a.totalBelanja);
    return { rows, grandKasbon, grandBelanja, grandTrx: filteredData.length };
  }, [filteredData]);

  // Export Excel
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
          'Realisasi Belanja Riil': isKasbon ? ((item.status_kasbon === 'Selesai' || (item.nota_count || 0) > 0) ? realisasiVal : 0) : item.nominal,
          'Jumlah Nota': isKasbon ? (item.nota_count || 0) : '',
          'Selisih Kasbon': isKasbon ? diffVal : 0,
          'Keterangan Selisih': isKasbon && (item.status_kasbon === 'Selesai' || (item.nota_count || 0) > 0)
            ? (item.status_kasbon === 'Selesai' ? '' : '(Sementara) ') + (diffVal > 0 ? `Sisa Kembali Rp ${diffVal.toLocaleString('id-ID')}` : diffVal < 0 ? `Kurang Bayar Rp ${Math.abs(diffVal).toLocaleString('id-ID')}` : 'Pas/Lunas')
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

  // Cetak PDF (Print Langsung ala report-photo)
  const handlePrintPdf = () => {
    const originalTitle = document.title;
    const tglLabel = startDate && endDate ? `${startDate}_sd_${endDate}` : (startDate || endDate || 'semua_periode');
    document.title = `laporan_pengeluaran_kasbon_penelitian_${tglLabel}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
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

  // Helper render foto thumbnail kecil untuk cetak PDF
  const renderCetakThumbnails = (urlText?: string | null, label?: string) => {
    const urls = parseUrls(urlText);
    if (urls.length === 0) return null;

    return urls.map((u, idx) => {
      let imgSrc = u;
      const gdriveMatch = u.match(/\/d\/([a-zA-Z0-9_-]+)/) || u.match(/id=([a-zA-Z0-9_-]+)/);
      if (gdriveMatch && gdriveMatch[1]) {
        imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w200`;
      }
      return (
        <div key={idx} className="border border-gray-300 shadow-2xs bg-white p-0.5 rounded-sm inline-block mr-1.5 mb-1.5 overflow-hidden">
          <CompressedImage 
            src={imgSrc} 
            alt={label || "Lampiran"} 
            className="max-w-full" 
            style={{ height: '95px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen pb-24 max-w-7xl mx-auto space-y-4">
      
      {/* Sub-Tab Navigation (Hidden on Print) */}
      <div className="print:hidden">
        <CatatanPenelitianTabs />
      </div>

      {/* ========================================================== */}
      {/* 📊 4 KARTU METRIK RINGKASAN (Compact & Elegant)           */}
      {/* ========================================================== */}
      <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Card 1: Total Belanja Riil */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Total Belanja Riil</span>
            <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
              {formatRupiah(totalRealisasiBelanja)}
            </div>
            <p className="text-[10px] text-gray-400">Pengeluaran terfilter</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
            <DollarSign size={18} />
          </div>
        </div>

        {/* Card 2: Kasbon Menunggu Nota (Outstanding) */}
        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-3.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Clock size={11} />
              <span>Kasbon Belum Nota</span>
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-900 font-mono">
              {formatRupiah(kasbonWaitingTotal)}
            </div>
            <p className="text-[10px] text-amber-800 font-bold">{kasbonWaitingCount} kasbon berjalan</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
            <Wallet size={18} />
          </div>
        </div>

        {/* Card 3: Kasbon Selesai */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Kasbon Selesai SPJ</span>
            <div className="text-lg sm:text-xl font-black text-indigo-900 font-mono">
              {kasbonDoneCount}
            </div>
            <p className="text-[10px] text-gray-400">Nota SPJ lengkap</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Card 4: Foto Lampiran */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Foto Lampiran</span>
            <div className="text-lg sm:text-xl font-black text-blue-900 font-mono">
              {totalFotoLampiran}
            </div>
            <p className="text-[10px] text-gray-400">Nota, kegiatan, barang</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
            <ImageIcon size={18} />
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 🔍 SLIM TOOLBAR & FILTER (Compact & Functional)            */}
      {/* ========================================================== */}
      <div className="print:hidden bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
        
        {/* Baris 1: Tab Filter Status Kasbon & Pilihan Tampilan Layar vs PDF */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => { setFilterTab('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Semua</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono">
                {dataList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setFilterTab('kasbon_waiting'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === 'kasbon_waiting'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock size={12} />
              <span>⏳ Menunggu Nota</span>
              {kasbonWaitingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-900 text-white text-[10px] font-mono">
                  {kasbonWaitingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setFilterTab('kasbon_done'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === 'kasbon_done'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>✅ Selesai</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-mono">
                {kasbonDoneCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setFilterTab('langsung'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === 'langsung'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <Receipt size={12} />
              <span>🧾 Langsung Nota</span>
            </button>
          </div>

          {/* Toggle Mode: Tabel Interaktif vs Pratinjau Cetak */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-[10px] font-bold text-gray-400">Tampilan:</span>
            <div className="inline-flex p-0.5 bg-gray-100 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Tabel Data
              </button>
              <button
                type="button"
                onClick={() => setViewMode('print_preview')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'print_preview' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Printer size={12} />
                <span>Pratinjau PDF</span>
              </button>
            </div>
          </div>

        </div>

        {/* Baris 2: Pencarian, Filter Tanggal, Dropdown Kategori & Tombol Aksi */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          
          {/* Input Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari uraian, nama penerima kasbon, toko, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-7 bg-gray-50/70 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs">
                ×
              </button>
            )}
          </div>

          {/* Filter Tanggal & Kategori */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-50/70 border border-gray-200 rounded-xl px-2.5 h-9">
              <Calendar size={12} className="text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-gray-700 outline-none"
                title="Dari Tanggal"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-gray-700 outline-none"
                title="Sampai Tanggal"
              />
            </div>

            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="h-9 px-2.5 bg-gray-50/70 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Penelitian">Penelitian (Umum)</option>
              <option value="Hewan & Bahan Penelitian">Hewan &amp; Bahan (Kelinci, dll)</option>
              <option value="Perlengkapan Penelitian">Perlengkapan &amp; Alat</option>
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
              className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Segarkan Data"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : ''} />
            </button>

            {/* Tombol Cetak PDF (ala report-photo) */}
            <button
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
              title="Cetak Laporan PDF Berlampiran Foto Fisik"
            >
              <Printer size={13} />
              <span>Cetak PDF</span>
            </button>

            {/* Tombol Export Excel */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 h-9 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
              title="Unduh Rekapitulasi Excel"
            >
              <Download size={13} />
              <span>Excel</span>
            </button>

            {/* Tombol Input Baru */}
            <Link
              href="/catatan-penelitian"
              className="inline-flex items-center gap-1 px-3 h-9 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
            >
              <PlusCircle size={13} />
              <span>Baru</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ========================================================== */}
      {/* 📋 VIEW 1: TABEL INTERAKTIF DATA (Concise & Beautified)     */}
      {/* ========================================================== */}
      {viewMode === 'table' && (
        <div className="print:hidden bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-2.5 text-center w-10">No</th>
                  <th className="py-2.5 px-3 w-28">Tanggal</th>
                  <th className="py-2.5 px-3 w-36">Status</th>
                  <th className="py-2.5 px-3 w-40">Kategori &amp; PIC</th>
                  <th className="py-2.5 px-3">Uraian &amp; Rincian Nota</th>
                  <th className="py-2.5 px-3 text-right w-40">Kasbon / Realisasi</th>
                  <th className="py-2.5 px-2.5 text-center w-32">Foto Bukti</th>
                  <th className="py-2.5 px-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-gray-400">
                      <RefreshCw size={22} className="animate-spin text-indigo-600 mx-auto mb-1.5" />
                      <span>Memuat data catatan penelitian...</span>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-gray-400 space-y-1.5">
                      <FileText size={28} className="mx-auto text-gray-300" />
                      <p className="font-bold text-gray-600 text-xs">Tidak ada data transaksi pada filter ini.</p>
                      <p className="text-[11px] text-gray-400">Silakan ubah kata kunci atau rentang tanggal pencarian.</p>
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
                    const isExpanded = !!expandedNotaRows[item.id];
                    const notasList = item.notas || [];

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isWaiting ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* No */}
                        <td className="py-2.5 px-2.5 text-center font-bold text-gray-400 align-top text-[11px]">
                          {rowNum}
                        </td>

                        {/* Tanggal */}
                        <td className="py-2.5 px-3 font-bold text-gray-800 align-top whitespace-nowrap">
                          <div className="font-mono text-xs">{item.tanggal_transaksi}</div>
                          {item.tanggal_penyelesaian && (
                            <div className="text-[10px] text-emerald-700 font-medium">
                              Selesai: {item.tanggal_penyelesaian}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 align-top space-y-1">
                          {isWaiting ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock size={10} />
                              <span>{(item.nota_count || 0) > 0 ? `Terbuka (${item.nota_count} nota)` : 'Menunggu Nota'}</span>
                            </span>
                          ) : isDone ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 size={10} />
                              <span>Selesai SPJ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <Receipt size={10} />
                              <span>Langsung Nota</span>
                            </span>
                          )}
                        </td>

                        {/* Kategori & PIC */}
                        <td className="py-2.5 px-3 align-top space-y-0.5">
                          <span className="text-[11px] font-black text-gray-800 block line-clamp-1" title={item.kategori}>
                            {item.kategori}
                          </span>
                          {item.nama_penerima ? (
                            <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                              <UserCheck size={11} className="shrink-0" />
                              <span className="truncate max-w-[140px]" title={item.nama_penerima}>
                                {item.nama_penerima}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">-</span>
                          )}
                        </td>

                        {/* Uraian & Rincian Nota */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-gray-800 leading-snug text-xs">
                            {item.uraian}
                          </div>
                          
                          {item.catatan && (
                            <div className="text-[10px] text-gray-400 italic mt-0.5">
                              {item.catatan}
                            </div>
                          )}

                          {item.catatan_penyelesaian && (
                            <div className="text-[10px] text-emerald-800 font-medium mt-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                              Penyelesaian: {item.catatan_penyelesaian}
                            </div>
                          )}

                          {/* Rincian Nota Bertahap (Compact collapsible) */}
                          {isKasbon && notasList.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandNota(item.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 cursor-pointer transition-colors"
                                >
                                  <Receipt size={10} />
                                  <span>{notasList.length} Nota Rincian ({formatRupiah(item.nominal_realisasi || 0)})</span>
                                  {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="space-y-1 pt-1 animate-in fade-in duration-100">
                                  {notasList.map((n: any, ni: number) => (
                                    <div key={n.id} className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-0.5">
                                      <div className="font-black text-slate-800 flex justify-between gap-2 border-b border-slate-200/60 pb-0.5">
                                        <span>Nota #{ni + 1} · {n.tanggal_nota}{n.toko ? ` (${n.toko})` : ''}</span>
                                        <span className="font-mono text-emerald-800">{formatRupiah(n.total)}</span>
                                      </div>
                                      <div className="text-gray-600 pt-0.5 leading-relaxed">
                                        {(n.items || []).map((it: any) => `${it.nama} ${it.qty}${it.satuan ? ' ' + it.satuan : ''} × ${formatRupiah(it.harga)}`).join('; ')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Nominal / Kasbon */}
                        <td className="py-2.5 px-3 align-top text-right space-y-0.5">
                          {isKasbon ? (
                            <div>
                              <div className="text-xs font-black text-amber-900 font-mono">
                                Kasbon: {formatRupiah(item.nominal_kasbon || item.nominal)}
                              </div>
                              {(item.status_kasbon === 'Selesai' || (item.nota_count || 0) > 0) && (
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
                        <td className="py-2.5 px-2.5 align-top text-center">
                          {totalPhotos === 0 ? (
                            <span className="text-[10px] text-gray-400 italic">Tanpa Foto</span>
                          ) : (
                            <div className="flex items-center justify-center gap-1 flex-wrap">
                              {notaPhotos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openGallery('Foto Nota / Kwitansi', notaPhotos)}
                                  className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold hover:bg-rose-100 cursor-pointer transition-colors"
                                  title={`${notaPhotos.length} Foto Nota`}
                                >
                                  Nota ({notaPhotos.length})
                                </button>
                              )}
                              {barangPhotos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openGallery('Foto Barang / Hewan', barangPhotos)}
                                  className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold hover:bg-amber-100 cursor-pointer transition-colors"
                                  title={`${barangPhotos.length} Foto Barang`}
                                >
                                  Brg ({barangPhotos.length})
                                </button>
                              )}
                              {kegiatanPhotos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openGallery('Foto Kegiatan', kegiatanPhotos)}
                                  className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold hover:bg-blue-100 cursor-pointer transition-colors"
                                  title={`${kegiatanPhotos.length} Foto Kegiatan`}
                                >
                                  Keg ({kegiatanPhotos.length})
                                </button>
                              )}
                              {transferPhotos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => openGallery('Foto Bukti Transfer', transferPhotos)}
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold hover:bg-emerald-100 cursor-pointer transition-colors"
                                  title={`${transferPhotos.length} Bukti Transfer`}
                                >
                                  Trf ({transferPhotos.length})
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-3 align-top text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            
                            {/* Tombol Input / Tambah Nota */}
                            {isWaiting && (
                              <button
                                type="button"
                                onClick={() => setSelectedKasbonToSettle(item)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-2xs transition-all cursor-pointer active:scale-95"
                                title="Tambah nota / rincian belanja kasbon"
                              >
                                <Receipt size={11} />
                                <span>{(item.nota_count || 0) > 0 ? '+ Nota' : 'Nota'}</span>
                              </button>
                            )}

                            {/* Tombol Buka Kembali */}
                            {isDone && (
                              <button
                                type="button"
                                onClick={() => handleReopenKasbon(item)}
                                className="inline-flex items-center gap-1 px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Buka kembali karena masih ada nota susulan"
                              >
                                <RotateCcw size={10} />
                                <span>Buka</span>
                              </button>
                            )}

                            {/* Tombol Edit Induk */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              title="Edit Data Transaksi"
                            >
                              <Edit3 size={12} />
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 size={12} />
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
          <div className="p-3 bg-slate-50/70 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Baris:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-white border border-gray-200 rounded-lg px-2 py-1 font-bold text-gray-700 outline-none text-xs"
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
      )}

      {/* ========================================================== */}
      {/* 📄 VIEW 2 / PRINT ARENA: CETAK LAPORAN PDF (Ala report-photo) */}
      {/* ========================================================== */}
      <div className={`bg-white rounded-2xl print:rounded-none shadow-xs border border-gray-200/90 p-6 md:p-8 print:p-0 min-h-[500px] text-xs text-gray-900 print:text-black ${
        viewMode === 'print_preview' ? 'block' : 'hidden print:block'
      }`}>
        
        {/* Banner Navigasi khusus saat mode Pratinjau Layar aktif */}
        {viewMode === 'print_preview' && (
          <div className="print:hidden mb-6 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 text-indigo-950">
            <div className="flex items-center gap-2">
              <Printer size={16} className="text-indigo-600" />
              <span className="text-xs font-bold">
                Mode Pratinjau Cetak PDF Aktif. Format tabel dan foto di bawah ini adalah tampilan dokumen yang akan dicetak.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Printer size={13} />
                <span>Cetak Sekarang</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-gray-100"
              >
                Kembali ke Tabel Data
              </button>
            </div>
          </div>
        )}

        {/* Kop Judul Dokumen Cetak */}
        <div className="mb-6 border-b-2 border-gray-900 pb-3">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Laporan Penggunaan Dana &amp; Kasbon Penelitian
          </h1>
          <p className="text-xs text-gray-700 mt-1">
            Periode: <strong>{startDate || 'Awal'} s/d {endDate || 'Sekarang'}</strong> &nbsp;|&nbsp; 
            Kategori: <strong>{filterKategori}</strong> &nbsp;|&nbsp; 
            Total Transaksi: <strong>{filteredData.length} Transaksi</strong> &nbsp;|&nbsp;
            Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* 1. TABEL REKAPITULASI DANA & KASBON (Persis report-photo) */}
        <div className="border border-gray-300 rounded overflow-hidden mb-6">
          <div className="bg-gray-100 font-black p-2.5 border-b border-gray-300 text-xs tracking-wider uppercase">
            REKAPITULASI PENGGUNAAN DANA BERDASARKAN KATEGORI
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50 text-[11px] font-black">
                <th className="p-2.5 border-r border-gray-300">Kategori Kegiatan</th>
                <th className="p-2.5 border-r border-gray-300 text-center w-16">Trx</th>
                <th className="p-2.5 border-r border-gray-300 text-right w-36">Total Kasbon (Rp)</th>
                <th className="p-2.5 border-r border-gray-300 text-right w-36">Belanja Riil (Rp)</th>
                <th className="p-2.5 border-r border-gray-300 text-right w-32">Sisa Kasbon (Rp)</th>
                <th className="p-2.5 text-right w-20">% Belanja</th>
              </tr>
            </thead>
            <tbody>
              {rekapKategori.rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="p-2.5 border-r border-gray-300 font-bold">{r.kategori}</td>
                  <td className="p-2.5 border-r border-gray-300 text-center font-bold">{r.trx}</td>
                  <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">{r.totalKasbon.toLocaleString('id-ID')}</td>
                  <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">{r.totalBelanja.toLocaleString('id-ID')}</td>
                  <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                    {r.selisih.toLocaleString('id-ID')}
                  </td>
                  <td className="p-2.5 text-right font-bold">
                    {rekapKategori.grandBelanja > 0 ? ((r.totalBelanja / rekapKategori.grandBelanja) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-black">
                <td className="p-2.5 border-r border-gray-300 tracking-wider">TOTAL KESELURUHAN</td>
                <td className="p-2.5 border-r border-gray-300 text-center">{rekapKategori.grandTrx}</td>
                <td className="p-2.5 border-r border-gray-300 text-right font-mono">{rekapKategori.grandKasbon.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border-r border-gray-300 text-right font-mono">{rekapKategori.grandBelanja.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border-r border-gray-300 text-right font-mono">{(rekapKategori.grandKasbon - rekapKategori.grandBelanja).toLocaleString('id-ID')}</td>
                <td className="p-2.5 text-right">100,0%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. TABEL DETAIL FISIK DENGAN LAMPIRAN FOTO (Break Page Ala report-photo) */}
        <div className="border border-gray-300 rounded overflow-hidden break-before-page">
          <div className="bg-gray-100 font-black p-2.5 border-b border-gray-300 text-xs tracking-wider uppercase">
            DETAIL PENGELUARAN &amp; BUKTI FISIK LAMPIRAN NOTA / KEGIATAN
          </div>
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50 text-[11px] leading-tight font-black">
                <th className="p-2.5 border-r border-gray-300 w-[14%] text-center">Tanggal &amp; Status</th>
                <th className="p-2.5 border-r border-gray-300 w-[66%]">Detail (Kategori + Uraian + PIC + Nota Rincian + Bukti Lampiran)</th>
                <th className="p-2.5 text-right w-[20%]">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((it, idx) => {
                const isKasbon = it.tipe_transaksi === 'Kasbon';
                const kasbonVal = isKasbon ? Number(it.nominal_kasbon || it.nominal || 0) : 0;
                const belanjaVal = Number(it.nominal_realisasi || it.nominal || 0);
                const sisaVal = Number(it.selisih_kasbon || 0);
                const notas = it.notas || [];

                return (
                  <tr key={it.id || idx} className="border-b border-gray-300 align-top break-inside-avoid">
                    {/* Tanggal & Status */}
                    <td className="p-3 border-r border-gray-300 font-black text-center space-y-1">
                      <div className="font-mono text-xs">{it.tanggal_transaksi}</div>
                      <div className="text-[10px] uppercase font-bold text-gray-700">
                        {isKasbon ? (it.status_kasbon === 'Selesai' ? 'Kasbon: Selesai' : 'Kasbon: Terbuka') : 'Pengeluaran Langsung'}
                      </div>
                      {it.tanggal_penyelesaian && (
                        <div className="text-[9px] text-gray-500 font-normal">
                          SPJ: {it.tanggal_penyelesaian}
                        </div>
                      )}
                    </td>

                    {/* Detail Uraian, PIC, Nota & Foto */}
                    <td className="p-3 border-r border-gray-300 space-y-2">
                      <div>
                        <div className="font-black text-sm text-gray-900 leading-snug">
                          {it.kategori} &nbsp;—&nbsp; {it.uraian}
                        </div>
                        {it.nama_penerima && (
                          <div className="text-[11px] text-gray-800 font-bold mt-0.5">
                            Penerima Kasbon / PIC: <span className="underline">{it.nama_penerima}</span>
                          </div>
                        )}
                        {it.catatan && (
                          <div className="text-[10px] text-gray-500 italic mt-0.5">
                            Catatan: {it.catatan}
                          </div>
                        )}
                        {it.catatan_penyelesaian && (
                          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
                            Keterangan SPJ: {it.catatan_penyelesaian}
                          </div>
                        )}
                      </div>

                      {/* Rincian Nota Bertahap (jika ada) */}
                      {notas.length > 0 && (
                        <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] space-y-1">
                          <span className="font-black text-gray-700 block">Rincian Nota Belanja ({notas.length} Nota):</span>
                          {notas.map((n: any, ni: number) => (
                            <div key={n.id} className="pl-1.5 border-l-2 border-indigo-400">
                              <span className="font-bold text-gray-800">
                                Nota #{ni + 1} ({n.tanggal_nota}){n.toko ? ` - ${n.toko}` : ''}: &nbsp;
                              </span>
                              <span className="text-gray-700">
                                {(n.items || []).map((b: any) => `${b.nama} ${b.qty}${b.satuan ? ' ' + b.satuan : ''} @ ${formatRupiah(b.harga)}`).join(', ')}
                              </span>
                              <span className="font-mono font-bold text-gray-900 ml-1">
                                = {formatRupiah(n.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Lampiran Foto Fisik Ala report-photo */}
                      <div className="pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {renderCetakThumbnails(it.foto_nota || it.foto_bukti_1, 'Nota')}
                          {renderCetakThumbnails(it.foto_barang || it.foto_bukti_3, 'Barang')}
                          {renderCetakThumbnails(it.foto_kegiatan || it.foto_bukti_2, 'Kegiatan')}
                          {renderCetakThumbnails(it.foto_bukti_transfer || it.foto_bukti_4, 'Transfer')}
                        </div>
                      </div>
                    </td>

                    {/* Nominal */}
                    <td className="p-3 text-right font-black text-xs space-y-1">
                      {isKasbon ? (
                        <div>
                          <div className="text-gray-600 font-bold">
                            Kasbon: {kasbonVal.toLocaleString('id-ID')}
                          </div>
                          <div className="text-gray-950 font-black text-sm">
                            Belanja: {belanjaVal.toLocaleString('id-ID')}
                          </div>
                          <div className={`text-[10px] ${sisaVal >= 0 ? 'text-gray-700' : 'text-red-700'}`}>
                            {sisaVal >= 0 ? `Sisa: ${sisaVal.toLocaleString('id-ID')}` : `Kurang: ${Math.abs(sisaVal).toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm font-black text-gray-900">
                          {belanjaVal.toLocaleString('id-ID')}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Kolom Tanda Tangan Fisik untuk Pengesahan SPJ */}
        <div className="mt-8 pt-4 flex justify-between items-start text-xs text-center break-inside-avoid">
          <div className="w-56 space-y-16">
            <p>Mengetahui / Penanggung Jawab,</p>
            <p className="font-bold underline">( .................................................... )</p>
          </div>
          <div className="w-56 space-y-16">
            <p>Bendahara / Pemegang Kas,</p>
            <p className="font-bold underline">( .................................................... )</p>
          </div>
        </div>

      </div>

      {/* ========================================================== */}
      {/* 🧾 MODAL MULTI-NOTA KASBON (INPUT & EDIT NOTA)            */}
      {/* ========================================================== */}
      {selectedKasbonToSettle && (
        <NotaKasbonModal
          kasbon={selectedKasbonToSettle as any}
          onClose={() => setSelectedKasbonToSettle(null)}
          onSaved={() => {
            setSelectedKasbonToSettle(null);
            fetchData();
          }}
        />
      )}

      {/* ========================================================== */}
      {/* ✏️ MODAL EDIT TRANSAKSI INDUK                             */}
      {/* ========================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900">Edit Data Catatan Transaksi #{editingItem.id}</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
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
                        <div key={url + i} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg pl-2 pr-1 py-1 text-[10px] font-bold shadow-2xs">
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
                        <div key={f.name + i} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg pl-2 pr-1 py-1 text-[10px] font-bold text-emerald-800 shadow-2xs">
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
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
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
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 🖼️ MODAL GALLERY PREVIEW FOTO LAMPIRAN                      */}
      {/* ========================================================== */}
      {previewPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black text-gray-800">{previewTitle} ({activePhotoIdx + 1} dari {previewPhotos.length})</h4>
              <button onClick={() => setPreviewPhotos([])} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {/\.pdf($|\?)/i.test(previewPhotos[activePhotoIdx]) ? (
                <a
                  href={getSafeFileUrl(previewPhotos[activePhotoIdx])}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black"
                >
                  Buka File PDF
                </a>
              ) : (
                <img
                  key={previewPhotos[activePhotoIdx]}
                  src={getSafeFileUrl(previewPhotos[activePhotoIdx])}
                  alt="Bukti Lampiran"
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            <a
              href={getSafeFileUrl(previewPhotos[activePhotoIdx])}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-indigo-600 hover:underline self-center"
            >
              Buka di tab baru
            </a>

            {previewPhotos.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
                {previewPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activePhotoIdx === i ? 'border-indigo-600 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={getSafeFileUrl(url)} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
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
