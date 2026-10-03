'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, Loader2, Search, FileText, Eye, Check, Copy, XCircle, 
  FileSpreadsheet, Wallet, CheckCircle2, Clock, User, RefreshCw,
  Filter, Calendar, ExternalLink, Paperclip, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { getSafeFileUrl } from '@/lib/fileHelper';
import StatCard from '@/components/shared/StatCard';
import GalleryLightbox, { GalleryItem, getSafeImageUrl } from '@/components/shared/GalleryLightbox';
import { TableActionButton, TableActionGroup } from '@/components/shared/ActionButtons';

export default function RekapTransferPage() {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Tanggal Awal = Tanggal 1 Bulan Berjalan (Waktu Lokal)
  const getLocalMonthStart = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  // Tanggal Akhir = Hari Ini (Waktu Lokal)
  const getLocalToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Date Filters
  const [dateFilterField, setDateFilterField] = useState<'tanggal_pengajuan' | 'tanggal_transfer'>('tanggal_pengajuan');
  const [startDate, setStartDate] = useState(getLocalMonthStart);
  const [endDate, setEndDate] = useState(getLocalToday);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  
  // Image Preview & Copy State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedName, setCopiedName] = useState(false);

  // Users Map
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const [galleryState, setGalleryState] = useState<{
    isOpen: boolean;
    items: GalleryItem[];
    currentIndex: number;
    title: string;
    subtitle: string;
  }>({
    isOpen: false,
    items: [],
    currentIndex: 0,
    title: '',
    subtitle: '',
  });

  const getTransferAttachments = (item: any): GalleryItem[] => {
    if (!item) return [];
    const res: GalleryItem[] = [];
    const addCategory = (label: string, fieldVal: string | null | undefined) => {
      if (!fieldVal) return;
      const links = String(fieldVal).split(',').map((s) => s.trim()).filter(Boolean);
      links.forEach((url) => {
        const isFolder = url.includes('/folders/');
        res.push({
          src: isFolder ? '' : getSafeImageUrl(url),
          original: url,
          label,
          isFolder,
        });
      });
    };

    addCategory('Nota / Kwitansi', item.nota_url);
    addCategory('Foto Kegiatan', item.foto_kegiatan);
    addCategory('Foto Barang', item.foto_barang);
    addCategory('Bukti Transfer Bank', item.foto_bukti_transfer);
    return res;
  };

  const openGallery = (item: any, initialUrl?: string) => {
    const allAtt = getTransferAttachments(item);
    const imageItems = allAtt.filter((i) => !i.isFolder && i.src);
    if (imageItems.length === 0) {
      return;
    }

    let idx = 0;
    if (initialUrl) {
      const foundIdx = imageItems.findIndex(
        (i) => i.original === initialUrl || i.src === initialUrl || initialUrl.includes(i.original)
      );
      if (foundIdx !== -1) idx = foundIdx;
    }

    setGalleryState({
      isOpen: true,
      items: imageItems,
      currentIndex: idx,
      title: item.kegiatan || 'Pengajuan Transfer Dana',
      subtitle: `Rp ${Number(item.nominal || 0).toLocaleString('id-ID')} • ${item.tanggal_transfer || item.tanggal_pengajuan || '-'}`,
    });
  };

  const extractTransferTime = (item: any) => {
    if (!item) return null;
    if (item.foto_bukti_transfer) {
      const match = item.foto_bukti_transfer.match(/transfer_(\d{13})/);
      if (match && match[1]) {
        const ts = Number(match[1]);
        if (!isNaN(ts)) {
          return new Date(ts).toISOString();
        }
      }
    }
    return item.tanggal_transfer;
  };

  const formatFullDateTime = (isoDate: string | null | undefined, fallbackDate?: string | null) => {
    const target = isoDate || fallbackDate;
    if (!target) return '-';
    try {
      const d = new Date(target);
      if (isNaN(d.getTime())) return target;
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta'
      }).format(d) + ' WIB';
    } catch {
      return target;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pengajuan_transfer')
        .select(`
          *,
          master_rekening(nama_rekening, no_rekening, ref_bank(nama_bank)),
          ref_jenis_belanja(nama_belanja, akun_id, ref_akun(nomor_akun, nama_akun))
        `);

      if (dateFilterField === 'tanggal_transfer') {
        query = query
          .not('tanggal_transfer', 'is', null)
          .gte('tanggal_transfer', startDate)
          .lte('tanggal_transfer', endDate);
      } else {
        query = query
          .gte('tanggal_pengajuan', startDate)
          .lte('tanggal_pengajuan', endDate);
      }

      const [transferRes, usersRes] = await Promise.all([
        query.order('created_at', { ascending: false }),
        supabase.from('app_users').select('id, email')
      ]);
        
      if (transferRes.error) throw transferRes.error;
      setListData(transferRes.data || []);

      if (usersRes.data) {
        const map: Record<string, string> = {};
        usersRes.data.forEach((u: any) => {
          map[u.id] = u.email;
        });
        setUsersMap(map);
      }
    } catch (err: any) {
      console.error("Gagal menarik data", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, dateFilterField]);

  const openDetail = (item: any) => {
    setSelectedData(item);
    setIsModalOpen(true);
  };

  const filteredData = listData.filter(item => 
     item.kegiatan?.toLowerCase().includes(search.toLowerCase()) || 
     item.barang?.toLowerCase().includes(search.toLowerCase()) ||
     item.master_rekening?.nama_rekening?.toLowerCase().includes(search.toLowerCase()) ||
     item.status?.toLowerCase().includes(search.toLowerCase()) ||
     item.ref_jenis_belanja?.nama_belanja?.toLowerCase().includes(search.toLowerCase()) ||
     item.ref_jenis_belanja?.ref_akun?.nama_akun?.toLowerCase().includes(search.toLowerCase()) ||
     item.ref_jenis_belanja?.ref_akun?.nomor_akun?.includes(search)
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate, dateFilterField]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = React.useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const formatRp = (angka: number) => {
     return new Intl.NumberFormat('id-ID').format(angka || 0);
  };

  const handleCopy = (text: string, type: 'rek' | 'name') => {
     navigator.clipboard.writeText(text);
     if (type === 'rek') {
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
     } else {
         setCopiedName(true);
         setTimeout(() => setCopiedName(false), 2000);
     }
  };

  // Render Galeri Lampiran Lengkap 4 Kategori (Nota, Foto Kegiatan, Foto Barang, Bukti Transfer)
  const renderLampiranThumbnails = (item: any) => {
    const categories = [
      { 
        key: 'nota', 
        label: 'Nota / Kwitansi', 
        val: item?.nota_url, 
        icon: '🧾', 
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        emptyDesc: 'Tidak dilampirkan oleh pengaju'
      },
      { 
        key: 'kegiatan', 
        label: 'Foto Kegiatan', 
        val: item?.foto_kegiatan, 
        icon: '📸', 
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        emptyDesc: 'Tidak dilampirkan oleh pengaju'
      },
      { 
        key: 'barang', 
        label: 'Foto Barang', 
        val: item?.foto_barang, 
        icon: '📦', 
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        emptyDesc: 'Tidak dilampirkan oleh pengaju'
      },
      { 
        key: 'transfer', 
        label: 'Bukti Transfer Bank', 
        val: item?.foto_bukti_transfer, 
        icon: '💳', 
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        emptyDesc: item?.status === 'Disetujui' ? 'Belum diunggah bendahara' : 'Menunggu persetujuan transfer'
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {categories.map((cat) => {
          const links = cat.val 
            ? String(cat.val).split(',').map((s: string) => s.trim()).filter(Boolean) 
            : [];
          const hasFiles = links.length > 0;

          return (
            <div 
              key={cat.key}
              className={`rounded-2xl border transition-all p-3 flex flex-col justify-between ${
                hasFiles 
                  ? 'bg-white border-gray-200/90 shadow-2xs hover:border-indigo-300' 
                  : 'bg-gray-50/70 border-dashed border-gray-200/90'
              }`}
            >
              {/* Header Kategori */}
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span className="text-[11px] font-black text-gray-900 truncate">
                    {cat.label}
                  </span>
                </div>
                {hasFiles ? (
                  <span className={`px-2 py-0.5 rounded-full border font-bold text-[9px] shrink-0 ${cat.badgeColor}`}>
                    {links.length} Berkas
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-bold text-[9px] shrink-0 border border-gray-200">
                    Nihil
                  </span>
                )}
              </div>

              {/* Konten Gambar Berkas / Empty State */}
              {hasFiles ? (
                <div className="space-y-2">
                  <div className={`grid gap-1.5 ${links.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {links.map((lnk: string, lIdx: number) => {
                      const safeUrl = getSafeFileUrl(lnk);
                      const isImage = lnk.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif)$/) != null || lnk.includes('r2.dev') || lnk.includes('google.com');

                      return (
                        <div 
                          key={lIdx}
                          onClick={() => openGallery(item, lnk)}
                          className="group relative h-24 bg-gray-100 rounded-xl overflow-hidden cursor-pointer border border-gray-200/80 hover:shadow-xs transition-all flex items-center justify-center"
                          title="Klik untuk pratinjau layar penuh"
                        >
                          {isImage ? (
                            <img 
                              src={safeUrl || lnk}
                              alt={`${cat.label} ${lIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('/api/image-cors') && lnk.startsWith('http')) {
                                  target.src = `/api/image-cors?url=${encodeURIComponent(lnk)}`;
                                }
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-center text-gray-500">
                              <FileText size={22} className="text-indigo-600 mb-1" />
                              <span className="text-[10px] font-bold text-gray-700 truncate max-w-[80px]">Dokumen</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold gap-1">
                            <Eye size={12} /> Buka
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tombol Akses / Tab Baru */}
                  <div className="pt-1 flex flex-wrap gap-1.5 border-t border-gray-100">
                    {links.map((lnk: string, lIdx: number) => {
                      const safeUrl = getSafeFileUrl(lnk);
                      return (
                        <a 
                          key={lIdx}
                          href={safeUrl || lnk}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink size={10} /> Berkas #{lIdx + 1}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Empty Placeholder Card Ketika Tidak Ada Lampiran */
                <div className="py-4 px-2 flex flex-col items-center justify-center text-center rounded-xl bg-white/70 border border-gray-100/90">
                  <span className="text-lg opacity-40 mb-1">{cat.icon}</span>
                  <p className="text-[11px] font-bold text-gray-500">Tidak Dilampirkan</p>
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                    {cat.emptyDesc}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const downloadExcel = () => {
     if (filteredData.length === 0) return alert("Tidak ada data untuk diunduh");

     const exportData = filteredData.map((d, index) => ({
        'No': index + 1,
        'Tgl Pengajuan': d.tanggal_pengajuan,
        'Tgl Transfer': d.tanggal_transfer || '-',
        'Kode Akun': d.ref_jenis_belanja?.ref_akun?.nomor_akun || '-',
        'Nama Akun': d.ref_jenis_belanja?.ref_akun?.nama_akun || d.ref_jenis_belanja?.nama_belanja || '-',
        'Kategori Belanja': d.ref_jenis_belanja?.nama_belanja || '-',
        'Nama Rekening': d.master_rekening?.nama_rekening || '-',
        'Bank': d.master_rekening?.ref_bank?.nama_bank || '-',
        'No Rekening': d.master_rekening?.no_rekening || '-',
        'Nominal': d.nominal,
        'Kegiatan': d.kegiatan || '-',
        'Pengaju': d.barang || '-',
        'Catatan': d.catatan || '-',
        'Status': d.status || '-'
     }));

     const ws = XLSX.utils.json_to_sheet(exportData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, "Rekap Transfer");
     XLSX.writeFile(wb, `Rekap_Transfer_${dateFilterField}_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Rekap & Riwayat Transfer
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {filteredData.length} Transaksi
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Laporan riwayat transaksi dan arsip persetujuan transfer kas & bank.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={downloadExcel} 
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={13} />
            <span>Unduh Excel</span>
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS (4 Modern KPI Summary Cards sesuai Design System dengan Light Pastel Gradient & Neon Glow) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          title="TOTAL NOMINAL"
          value={`Rp ${formatRp(filteredData.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0))}`}
          subtitle={`${filteredData.length} Total Transaksi Terfilter`}
          icon={Wallet}
          variant="indigo"
          lightBg={true}
        />
        <StatCard
          title="TOTAL DISETUJUI"
          value={`${filteredData.filter(d => d.status === 'Disetujui').length} Transaksi`}
          subtitle="Transfer berhasil diproses"
          icon={CheckCircle2}
          variant="emerald"
          trend={{ value: 'Disetujui', isUp: true, isGood: true }}
          lightBg={true}
        />
        <StatCard
          title="TOTAL MENUNGGU"
          value={`${filteredData.filter(d => d.status !== 'Disetujui' && d.status !== 'Ditolak').length} Transaksi`}
          subtitle="Menunggu persetujuan transfer"
          icon={Clock}
          variant="amber"
          trend={{ value: 'Menunggu', isGood: false }}
          lightBg={true}
        />
        <StatCard
          title="TOTAL DITOLAK"
          value={`${filteredData.filter(d => d.status === 'Ditolak').length} Transaksi`}
          subtitle="Pengajuan ditolak / batal"
          icon={XCircle}
          variant="rose"
          trend={{ value: 'Ditolak', isUp: false, isGood: false }}
          lightBg={true}
        />
      </div>

      {/* FILTER DATE & SEARCH BAR */}
      <div className="bg-white p-3 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Unified Filter Group (Selalu Berdampingan Horizontal, Bebas Wrap) */}
        <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto pb-1 xl:pb-0 shrink-0">
          {/* Rentang Tanggal Input: Tgl Awal s.d. Tgl Akhir */}
          <div className="flex items-center gap-1.5 bg-gray-50/90 p-1 rounded-xl border border-gray-200/80 shadow-2xs shrink-0">
            <div className="flex items-center gap-1 pl-2 text-gray-500">
              <Calendar size={13} className="text-indigo-600 shrink-0" />
            </div>
            <div className="relative">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 text-xs font-bold text-gray-800 cursor-pointer shadow-2xs" 
                title={dateFilterField === 'tanggal_pengajuan' ? 'Tanggal Awal Pengajuan' : 'Tanggal Awal Transfer'}
              />
            </div>
            <span className="text-gray-400 font-bold text-xs px-0.5">s/d</span>
            <div className="relative">
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 ring-indigo-500/20 text-xs font-bold text-gray-800 cursor-pointer shadow-2xs" 
                title={dateFilterField === 'tanggal_pengajuan' ? 'Tanggal Akhir Pengajuan' : 'Tanggal Akhir Transfer'}
              />
            </div>
          </div>

          {/* Switch Segmented Control Filter Jenis Tanggal (Persis Sebelah Kanan Tanggal) */}
          <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200/80 shadow-2xs shrink-0">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-1.5 flex items-center gap-1 shrink-0">
              <Filter size={11} className="text-indigo-600 shrink-0" /> Basis:
            </span>
            <button
              type="button"
              onClick={() => setDateFilterField('tanggal_pengajuan')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilterField === 'tanggal_pengajuan'
                  ? 'bg-white text-indigo-700 shadow-xs font-black ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-800 font-semibold'
              }`}
              title="Filter berdasarkan tanggal pengajuan dibuat"
            >
              <Clock size={12} className={dateFilterField === 'tanggal_pengajuan' ? 'text-indigo-600' : 'text-gray-400'} />
              <span>Tgl Pengajuan</span>
            </button>
            <button
              type="button"
              onClick={() => setDateFilterField('tanggal_transfer')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                dateFilterField === 'tanggal_transfer'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-gray-500 hover:text-gray-800 font-semibold'
              }`}
              title="Filter berdasarkan tanggal transfer dieksekusi"
            >
              <CheckCircle2 size={12} className={dateFilterField === 'tanggal_transfer' ? 'text-white' : 'text-emerald-500'} />
              <span>Tgl Transfer</span>
            </button>
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Cari uraian, akun, pengaju, status..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold text-gray-700"
          />
        </div>
      </div>

      {/* TABEL DATA REKAP */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                <Loader2 size={32} className="animate-spin mb-2 text-indigo-500" />
                <p className="text-xs font-medium">Memuat data rekap...</p>
             </div>
          ) : filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-16 text-gray-400">
                <Database size={36} className="mb-2 opacity-40" />
                <p className="text-xs font-medium">Tidak ada data transaksi pada rentang {dateFilterField === 'tanggal_pengajuan' ? 'tanggal pengajuan' : 'tanggal transfer'} ini</p>
             </div>
          ) : (
             <table className="w-full text-left text-xs">
                {/* Header Tanggal Atas Bawah */}
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                   <tr>
                      <th className="py-3 px-4 min-w-[140px]">
                        <div className="flex flex-col leading-tight">
                          <span className="text-indigo-700 font-black">Tgl Pengajuan</span>
                          <span className="text-emerald-700 font-bold text-[9px] mt-0.5">Tgl Transfer</span>
                        </div>
                      </th>
                      <th className="py-3 px-4 min-w-[180px]">Tujuan Transfer</th>
                      <th className="py-3 px-4 min-w-[220px]">Uraian / Kegiatan</th>
                      <th className="py-3 px-4 text-right min-w-[120px]">Nominal</th>
                      <th className="py-3 px-4 text-center min-w-[100px]">Status</th>
                      <th className="py-3 px-4 text-center min-w-[90px]">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                   {paginatedData.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                         {/* Tanggal dengan Warna Jelas */}
                         <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                  <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[11px] font-mono shadow-2xs">
                                     {item.tanggal_pengajuan || '-'}
                                  </span>
                               </div>
                               {item.tanggal_transfer ? (
                                  <div className="flex items-center gap-1.5">
                                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                     <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-mono shadow-2xs">
                                        {item.tanggal_transfer}
                                     </span>
                                  </div>
                               ) : (
                                  <span className="text-[10px] text-gray-400 italic pl-3">
                                     Belum transfer
                                  </span>
                               )}
                            </div>
                         </td>

                         {/* Tujuan Transfer */}
                         <td className="py-3.5 px-4">
                            <p className="font-bold text-gray-900">{item.master_rekening?.nama_rekening || '-'}</p>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                               {item.master_rekening?.ref_bank?.nama_bank} - {item.master_rekening?.no_rekening}
                            </p>
                             {item.barang && (
                                <p className="text-[11px] text-gray-500 font-medium mt-1.5 flex items-center gap-1">
                                   <span className="text-gray-400">Pengaju:</span>
                                   <span className="text-indigo-600 font-semibold truncate max-w-[200px]" title={item.barang}>
                                      {item.barang}
                                   </span>
                                </p>
                             )}
                         </td>

                         {/* Uraian dengan Wrap Text */}
                         <td className="py-3.5 px-4 min-w-[200px] max-w-[360px]">
                            <p className="font-bold text-gray-800 whitespace-normal break-words leading-relaxed">
                               {item.kegiatan || '-'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {item.ref_jenis_belanja?.ref_akun?.nomor_akun && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-200">
                                  #{item.ref_jenis_belanja.ref_akun.nomor_akun} - {item.ref_jenis_belanja.ref_akun.nama_akun}
                                </span>
                              )}
                              
                            </div>
                            {getTransferAttachments(item).filter(i => !i.isFolder).length > 0 && (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openGallery(item);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                                  title="Buka galeri & zoom semua foto lampiran transaksi ini"
                                >
                                  <Eye size={11} className="text-amber-600" />
                                  <span>{getTransferAttachments(item).filter(i => !i.isFolder).length} Foto Lampiran</span>
                                </button>
                              </div>
                            )}
                         </td>

                         {/* Nominal */}
                         <td className="py-3.5 px-4 text-right font-black text-gray-900 font-mono text-sm">
                            Rp {formatRp(item.nominal)}
                         </td>

                         {/* Status */}
                         <td className="py-3.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                               item.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                               item.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                               'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                               {item.status}
                            </span>
                         </td>

                         {/* Aksi */}
                         <td className="py-2.5 px-3 text-center whitespace-nowrap">
                             <TableActionGroup>
                                <TableActionButton 
                                   icon={Eye} 
                                   variant="primary" 
                                   title="Lihat Detail Transaksi & Lampiran" 
                                   label="Detail"
                                   size="sm" 
                                   onClick={() => openDetail(item)}
                                />
                                {item.status === 'Ditolak' && (
                                   <TableActionButton 
                                      icon={RefreshCw} 
                                      variant="danger" 
                                      title="Perbaiki & Ajukan Ulang Transaksi" 
                                      label="Perbaiki"
                                      size="sm" 
                                      onClick={() => {
                                         window.location.href = `/input-transfer/edit/${item.id}`;
                                      }}
                                   />
                                )}
                             </TableActionGroup>
                          </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
            {/* Left: Info */}
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-gray-900">{itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-gray-900">{itemsPerPage === -1 ? filteredData.length : Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> dari <strong className="text-gray-900">{filteredData.length}</strong> transaksi
              </span>
            </div>

            {/* Center: Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>Semua</option>
              </select>
            </div>

            {/* Right: Page Navigation */}
            {itemsPerPage !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs cursor-pointer"
                  title="Halaman Pertama"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold cursor-pointer"
                  title="Sebelumnya"
                >
                  ‹ Prev
                </button>
                
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
                  Hal {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold cursor-pointer"
                  title="Selanjutnya"
                >
                  Next ›
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs cursor-pointer"
                  title="Halaman Terakhir"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL PENGAJUAN (Lengkap No & Nama Akun serta Galeri Lampiran Foto) */}
      {isModalOpen && selectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-150">
           <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-gray-200">
              <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                 <div className="flex items-center gap-2">
                    <FileText className="text-indigo-600" size={20} />
                    <h2 className="text-base font-black text-gray-900">Detail Pengajuan Transfer</h2>
                 </div>
                 <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)} 
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                 >
                    <XCircle size={22}/>
                 </button>
              </div>
              
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                 
                 {/* BANNER NOTIFIKASI JIKA DITOLAK */}
                 {selectedData.status === 'Ditolak' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-white border border-rose-200 space-y-2.5 shadow-xs">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wide">
                             <XCircle size={16} className="text-rose-600 shrink-0" />
                             <span>Pengajuan Ini Ditolak</span>
                          </div>
                          <a 
                             href={`/input-transfer/edit/${selectedData.id}`}
                             className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto active:scale-95"
                          >
                             <RefreshCw size={12} />
                             <span>Perbaiki &amp; Ajukan Ulang Sekarang</span>
                          </a>
                       </div>
                       {selectedData.catatan && (
                          <div className="bg-white/90 p-3 rounded-xl border border-rose-200/80 text-xs text-rose-950 whitespace-pre-line leading-relaxed font-medium">
                             {selectedData.catatan}
                          </div>
                       )}
                    </div>
                 )}

                 {/* TOP 2 CARD LAYOUT (Status/Waktu vs Nominal/Peruntukan) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Card 1: Status & Log */}
                    <div className="bg-gray-50/90 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                       <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Status & Log Pengajuan</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                             selectedData.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                             selectedData.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                             'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                             ● {selectedData.status}
                          </span>
                       </div>

                       <div className="space-y-2.5 text-xs">
                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <User size={11} className="text-gray-400" /> Pembuat Pengajuan (User):
                             </p>
                             <p className="font-bold text-indigo-700 text-xs mt-0.5 break-all" title={selectedData.barang || usersMap[selectedData.created_by] || '-'}>
                                {selectedData.barang || usersMap[selectedData.created_by] || '-'}
                             </p>
                          </div>

                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Clock size={11} className="text-gray-400" /> Waktu Diajukan (Presisi):
                             </p>
                             <p className="font-bold text-gray-800 font-mono text-[11px] mt-0.5">
                                {formatFullDateTime(selectedData.created_at, selectedData.tanggal_pengajuan)}
                             </p>
                          </div>

                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 size={11} className="text-emerald-500" /> Waktu Eksekusi Transfer:
                             </p>
                             <p className="font-bold text-emerald-700 font-mono text-[11px] mt-0.5">
                                {selectedData.status === 'Disetujui' 
                                   ? formatFullDateTime(extractTransferTime(selectedData), selectedData.tanggal_transfer)
                                   : selectedData.status === 'Ditolak'
                                   ? 'Ditolak'
                                   : 'Menunggu Persetujuan'}
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Card 2: Nominal & Mata Anggaran */}
                    <div className="bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 p-4 rounded-2xl border border-indigo-200/80 flex flex-col justify-between space-y-3">
                       <div>
                          <div className="flex items-center justify-between mb-1.5">
                             <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Nominal Transfer</span>
                             <span className="px-2 py-0.5 bg-indigo-100/80 text-indigo-800 text-[10px] font-bold rounded-md border border-indigo-200">
                                {selectedData.ref_jenis_belanja?.nama_belanja || 'Kas'}
                             </span>
                          </div>
                          <p className="text-2xl font-black text-indigo-700 font-mono tracking-tight">
                             Rp {formatRp(selectedData.nominal)}
                          </p>
                       </div>

                       {/* No dan Nama Akun */}
                       <div className="pt-2.5 border-t border-indigo-100/80 space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mata Anggaran / Akun Beban:</span>
                          {selectedData.ref_jenis_belanja?.ref_akun ? (
                             <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-[11px] shadow-2xs">
                                   {selectedData.ref_jenis_belanja.ref_akun.nomor_akun}
                                </span>
                                <span className="font-bold text-gray-900 text-xs">
                                   {selectedData.ref_jenis_belanja.ref_akun.nama_akun}
                                </span>
                             </div>
                          ) : (
                             <p className="font-semibold text-gray-700 text-xs">
                                {selectedData.ref_jenis_belanja?.nama_belanja || 'Akun Belum Ditentukan'}
                             </p>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Rekening Tujuan Box */}
                 <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                    <h3 className="text-xs font-black text-indigo-800 uppercase flex items-center gap-2"><Database size={14}/> Rekening Tujuan</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Nama Rekening</p>
                          <div className="flex items-center gap-2">
                             <p className="font-bold text-gray-900 text-xs">{selectedData.master_rekening?.nama_rekening || '-'}</p>
                             <button onClick={() => handleCopy(selectedData.master_rekening?.nama_rekening || '', 'name')} className="p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-colors" title="Copy Nama">
                                {copiedName ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                             </button>
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Bank</p>
                          <p className="font-bold text-gray-900 text-xs">{selectedData.master_rekening?.ref_bank?.nama_bank || '-'}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Nomor Rekening</p>
                          <div className="flex items-center gap-2">
                             <p className="font-mono font-bold text-gray-900 text-xs">{selectedData.master_rekening?.no_rekening || '-'}</p>
                             <button onClick={() => handleCopy(selectedData.master_rekening?.no_rekening || '', 'rek')} className="p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-colors" title="Copy Rekening">
                                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Uraian / Rincian Kegiatan (Wrap Text) */}
                 <div className="space-y-3">
                    <div>
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Uraian / Rincian Kegiatan</p>
                       <div className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-200/70 whitespace-pre-wrap break-words leading-relaxed text-xs">
                          {selectedData.kegiatan || '-'}
                       </div>
                    </div>
                    {selectedData.catatan && (
                       <div>
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Catatan Tambahan</p>
                          <div className="font-medium text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200/70 italic whitespace-pre-wrap break-words text-xs">
                             {selectedData.catatan}
                          </div>
                       </div>
                    )}
                 </div>

                 {/* LAMPIRAN & FOTO DOKUMEN LENGKAP (Nota, Kegiatan, Barang, Bukti Transfer) */}
                 <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2">
                       <Paperclip size={14} className="text-indigo-600" />
                       <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                          Lampiran Berkas &amp; Foto Dokumentasi
                       </span>
                    </div>
                    {renderLampiranThumbnails(selectedData)}
                 </div>

              </div>
              
              <div className="p-3.5 px-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                 <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-9 px-5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 text-xs transition-colors cursor-pointer"
                 >
                    Tutup
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* REUSABLE INTERACTIVE GALLERY LIGHTBOX */}
      <GalleryLightbox
        isOpen={galleryState.isOpen}
        items={galleryState.items}
        currentIndex={galleryState.currentIndex}
        title={galleryState.title}
        subtitle={galleryState.subtitle}
        onClose={() => setGalleryState((prev) => ({ ...prev, isOpen: false }))}
        onIndexChange={(idx) => setGalleryState((prev) => ({ ...prev, currentIndex: idx }))}
      />
    </div>
  );
}
