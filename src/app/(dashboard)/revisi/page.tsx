'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileEdit, 
  RotateCcw, 
  Search, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Building2, 
  CreditCard, 
  User, 
  Coins, 
  Eye, 
  Send, 
  UploadCloud, 
  Trash2, 
  X, 
  Calendar, 
  Layers, 
  LayoutGrid, 
  Table as TableIcon,
  ExternalLink,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getLeafAccounts } from '@/lib/coaHelper';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import QuickFilterChips, { FilterChip } from '@/components/shared/QuickFilterChips';
import TablePagination from '@/components/shared/TablePagination';
import TableDensityToggle, { TableDensity } from '@/components/shared/TableDensityToggle';
import ExportButtons from '@/components/shared/ExportButtons';
import EmptyState from '@/components/shared/EmptyState';
import SkeletonTable from '@/components/shared/SkeletonTable';
import { 
  PrimaryButton, 
  SecondaryButton, 
  TableActionButton, 
  TableActionGroup 
} from '@/components/shared/ActionButtons';
import { logActivity } from '@/lib/activityLogger';

// Helper format Rupiah
const fmtRp = (n: number) => Math.round(Math.abs(n)).toLocaleString('id-ID');

export default function RevisiPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Referensi Data
  const [listAkun, setListAkun] = useState<any[]>([]);
  const [listPersonel, setListPersonel] = useState<any[]>([]);
  const [listBelanja, setListBelanja] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const leafAkunList = useMemo(() => getLeafAccounts(listAkun), [listAkun]);

  // View States
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [tableDensity, setTableDensity] = useState<TableDensity>('comfortable');

  // Filter States (Disederhanakan: tanpa dropdown Tipe Kas & DateRange)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusChip, setSelectedStatusChip] = useState<string>('all');
  const [showDitolak, setShowDitolak] = useState<boolean>(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modal State (Edit / View)
  const [modalTrx, setModalTrx] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Berkas Baru Upload Modal
  const [fileNota, setFileNota] = useState<File[]>([]);
  const [fileKeg, setFileKeg] = useState<File[]>([]);
  const [fileBrg, setFileBrg] = useState<File[]>([]);
  const [fileTrf, setFileTrf] = useState<File[]>([]);

  // Preview Lightbox
  const [previewImage, setPreviewImage] = useState<{ src: string; original: string } | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    try {
      const [a, p, b, u] = await Promise.all([
        supabase.from('ref_akun').select('*').order('nomor_akun'),
        supabase.from('ref_personel').select('*').order('nama_orang'),
        supabase.from('ref_jenis_belanja').select('*').order('nama_belanja'),
        supabase.from('app_users').select('id, email, role')
      ]);
      if (a.data) setListAkun(a.data);
      if (p.data) setListPersonel(p.data);
      if (b.data) setListBelanja(b.data);
      if (u.data) {
        const map: Record<string, string> = {};
        u.data.forEach((user: any) => {
          map[user.id] = user.email;
        });
        setUsersMap(map);
      }
    } catch (err) {
      console.error('Error fetching references:', err);
    }
  };

  /**
   * Mengambil data transaksi yang BELUM DISETUJUI UNTUK DIBAYAR:
   * 1. Status 'Revisi' (memerlukan perbaikan dari verifikator)
   * 2. Status 'Menunggu' (berada di antrean verifikasi kas)
   * 3. Status 'Ditolak' (ditolak oleh verifikator - view only)
   * Pengecualian wajib: status 'Disetujui' (sudah terbayar / selesai di verifikasi)
   */
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, ref_akun(id, nomor_akun, nama_akun), ref_personel(id, nama_orang)')
        .in('disetujui', ['Revisi', 'Menunggu', 'Ditolak'])
        .order('tanggal', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      toast.error('Gagal mengambil data transaksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper safe image CDN/Proxy
  const getSafeImage = (lnk: string) => {
    if (!lnk) return '';
    const clean = lnk.trim();
    if (clean.includes('/folders/')) return '';
    if (clean.startsWith('/api/image-cors')) return clean;

    let targetUrl = clean;
    const gdriveMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/) || clean.match(/id=([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1] && clean.includes('google.com')) {
      targetUrl = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1200`;
    }

    if (targetUrl.startsWith('http')) {
      return `/api/image-cors?url=${encodeURIComponent(targetUrl)}`;
    }

    return targetUrl;
  };

  // Stats Counters
  const stats = useMemo(() => {
    const revisiCount = transactions.filter(t => t.disetujui === 'Revisi').length;
    const menungguCount = transactions.filter(t => t.disetujui === 'Menunggu').length;
    const ditolakCount = transactions.filter(t => t.disetujui === 'Ditolak').length;
    const activeCount = revisiCount + menungguCount;

    const totalNominal = transactions.reduce((acc, curr) => {
      return acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0);
    }, 0);

    const nominalRevisi = transactions
      .filter(t => t.disetujui === 'Revisi')
      .reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0);

    const nominalMenunggu = transactions
      .filter(t => t.disetujui === 'Menunggu')
      .reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0);

    const nominalDitolak = transactions
      .filter(t => t.disetujui === 'Ditolak')
      .reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0);

    const totalActiveNominal = nominalRevisi + nominalMenunggu;

    return {
      activeCount,
      revisiCount,
      menungguCount,
      ditolakCount,
      totalCount: transactions.length,
      nominalRevisi,
      nominalMenunggu,
      nominalDitolak,
      totalActiveNominal,
      totalNominal
    };
  }, [transactions]);

  // Filter Chips Configuration (Hanya untuk Perlu Revisi & Menunggu Verifikasi)
  const filterChips: FilterChip[] = useMemo(() => [
    {
      id: 'all',
      label: 'Semua (Revisi & Menunggu)',
      count: stats.activeCount,
      icon: <Layers size={13} />
    },
    {
      id: 'Revisi',
      label: 'Perlu Revisi',
      count: stats.revisiCount,
      variant: 'amber',
      icon: <AlertCircle size={13} className="text-amber-500" />
    },
    {
      id: 'Menunggu',
      label: 'Menunggu Verifikasi',
      count: stats.menungguCount,
      variant: 'blue',
      icon: <Clock size={13} className="text-indigo-500" />
    }
  ], [stats]);

  // Filtered Transactions
  const filteredTrx = useMemo(() => {
    const list = transactions.filter(trx => {
      // 1. Status Filter: Mode Ditolak terpisah dari potret Revisi & Menunggu
      if (showDitolak) {
        if (trx.disetujui !== 'Ditolak') return false;
      } else {
        if (trx.disetujui !== 'Revisi' && trx.disetujui !== 'Menunggu') return false;
        if (selectedStatusChip !== 'all' && trx.disetujui !== selectedStatusChip) {
          return false;
        }
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const uraian = (trx.uraian || '').toLowerCase();
        const toko = (trx.toko || '').toLowerCase();
        const namaAkun = (trx.ref_akun?.nama_akun || '').toLowerCase();
        const nomorAkun = (trx.ref_akun?.nomor_akun || '').toLowerCase();
        const pic = (trx.ref_personel?.nama_orang || '').toLowerCase();
        const catatan = (trx.catatan_verifikasi || '').toLowerCase();
        const creator = (usersMap[trx.created_by] || trx.created_by || '').toLowerCase();

        const match = 
          uraian.includes(q) ||
          toko.includes(q) ||
          namaAkun.includes(q) ||
          nomorAkun.includes(q) ||
          pic.includes(q) ||
          catatan.includes(q) ||
          creator.includes(q);

        if (!match) return false;
      }

      return true;
    });

    // Sort priority: Perlu Revisi (1) -> Menunggu Verifikasi (2) -> Ditolak (3)
    const priorityMap: Record<string, number> = { 'Revisi': 1, 'Menunggu': 2, 'Ditolak': 3 };
    return list.sort((a, b) => {
      const pA = priorityMap[a.disetujui] || 4;
      const pB = priorityMap[b.disetujui] || 4;
      if (pA !== pB) return pA - pB;
      return (b.id || 0) - (a.id || 0);
    });
  }, [transactions, showDitolak, selectedStatusChip, searchQuery, usersMap]);

  // Paginated Transactions
  const totalPages = Math.ceil(filteredTrx.length / itemsPerPage);
  const paginatedTrx = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrx.slice(start, start + itemsPerPage);
  }, [filteredTrx, currentPage, itemsPerPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatusChip('all');
    setShowDitolak(false);
    setCurrentPage(1);
  };

  // Open Modal (Edit mode jika Revisi/Menunggu, View mode jika Ditolak)
  const openModal = (trx: any) => {
    const isPemasukan = Number(trx.uang_masuk) > 0;
    setModalTrx({
      ...trx,
      nominal: isPemasukan ? Number(trx.uang_masuk) : Number(trx.uang_keluar),
      tipe_kas: isPemasukan ? 'Pemasukan' : 'Pengeluaran',
      akun_id: trx.akun_id || trx.ref_akun_id || '',
      personel_id: trx.personel_id || trx.ref_personel_id || '',
    });
    setFileNota([]);
    setFileKeg([]);
    setFileBrg([]);
    setFileTrf([]);
  };

  // Remove existing photo URL from state
  const removeOldPhoto = (type: string, url: string) => {
    setModalTrx((prev: any) => {
      let currentStr = prev[type] || '';
      let arr = currentStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      arr = arr.filter((u: string) => u !== url);
      return { ...prev, [type]: arr.join(', ') };
    });
  };

  // Fungsi Upload File dengan fallback API & Storage
  const uploadFiles = async (files: File[], folder: string = 'revisi') => {
    if (files.length === 0) return '';
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();
        if (result.success && result.publicUrl) {
          uploadedUrls.push(result.publicUrl);
          continue;
        }
      } catch (e) {
        console.warn('API upload failed, attempting Supabase Storage fallback:', e);
      }

      // Fallback Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}_${Math.random().toString(36).substring(2, 8)}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('receipts').upload(`revisi/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) throw error;
      const { data } = supabase.storage.from('receipts').getPublicUrl(`revisi/${fileName}`);
      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls.join(', ');
  };

  // Simpan & Kirim Ulang Transaksi ke Meja Verifikasi
  const handleSaveAndResubmit = async () => {
    if (!modalTrx) return;
    if (modalTrx.disetujui === 'Ditolak') {
      toast.error('Transaksi dengan status Ditolak bersifat view-only dan tidak dapat diedit.');
      return;
    }
    if (!modalTrx.uraian || modalTrx.uraian.trim() === '') {
      toast.error('Uraian transaksi wajib diisi!');
      return;
    }
    if (!modalTrx.nominal || Number(modalTrx.nominal) <= 0) {
      toast.error('Nominal transaksi harus lebih dari 0!');
      return;
    }

    setSaving(true);
    try {
      // 1. Upload file baru
      const [urlNotaBaru, urlKegBaru, urlBrgBaru, urlTrfBaru] = await Promise.all([
        uploadFiles(fileNota, 'nota'),
        uploadFiles(fileKeg, 'kegiatan'),
        uploadFiles(fileBrg, 'barang'),
        uploadFiles(fileTrf, 'transfer'),
      ]);

      // 2. Gabungkan URL lama yang masih ada + URL baru
      const finalNota = [modalTrx.foto_nota, urlNotaBaru].filter(Boolean).join(', ');
      const finalKeg = [modalTrx.foto_kegiatan, urlKegBaru].filter(Boolean).join(', ');
      const finalBrg = [modalTrx.foto_barang, urlBrgBaru].filter(Boolean).join(', ');
      const finalTrf = [modalTrx.foto_bukti_transfer, urlTrfBaru].filter(Boolean).join(', ');

      const nominalAngka = Number(modalTrx.nominal);
      const isPemasukan = modalTrx.tipe_kas === 'Pemasukan';
      const uang_masuk = isPemasukan ? nominalAngka : 0;
      const uang_keluar = isPemasukan ? 0 : nominalAngka;

      // 3. Payload update - selalu kembalikan status ke 'Menunggu' & reset catatan_verifikasi
      const payload = {
        tanggal: modalTrx.tanggal,
        uraian: modalTrx.uraian,
        uang_masuk,
        uang_keluar,
        toko: modalTrx.toko || null,
        akun_id: modalTrx.akun_id || null,
        personel_id: modalTrx.personel_id || null,
        foto_nota: finalNota || null,
        foto_kegiatan: finalKeg || null,
        foto_barang: finalBrg || null,
        foto_bukti_transfer: finalTrf || null,
        disetujui: 'Menunggu',
        catatan_verifikasi: null,
      };

      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', modalTrx.id);

      if (error) throw error;

      // Log Aktivitas
      await logActivity({
        action_type: 'UPDATE',
        action_title: `Perbaikan Transaksi: Rp ${nominalAngka.toLocaleString('id-ID')} (${modalTrx.uraian})`,
        module: 'MASJID',
        path: '/revisi',
        details: {
          transaction_id: modalTrx.id,
          status_sebelumnya: modalTrx.disetujui,
          status_baru: 'Menunggu',
        }
      });

      toast.success('Sukses! Data telah diperbarui dan dikirim kembali ke Antrean Verifikasi.');
      
      setModalTrx(null);
      await fetchTransactions();
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      toast.error('Gagal menyimpan perbaikan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const exportRows = filteredTrx.map((trx, idx) => {
        const isPemasukan = Number(trx.uang_masuk) > 0;
        const nominal = isPemasukan ? Number(trx.uang_masuk) : Number(trx.uang_keluar);

        return {
          'No': idx + 1,
          'Status': trx.disetujui,
          'Tanggal': trx.tanggal,
          'Tipe': isPemasukan ? 'Pemasukan' : 'Pengeluaran',
          'Nominal (Rp)': nominal,
          'Uraian': trx.uraian || '-',
          'Nama Toko / Rekanan': trx.toko || '-',
          'Akun Anggaran': trx.ref_akun ? `${trx.ref_akun.nomor_akun} - ${trx.ref_akun.nama_akun}` : '-',
          'PIC Personel': trx.ref_personel?.nama_orang || '-',
          'Dibuat Oleh': usersMap[trx.created_by] || trx.created_by || '-',
          'Catatan Verifikator': trx.catatan_verifikasi || '-'
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Transaksi Belum Disetujui');
      XLSX.writeFile(wb, `Revisi_Transaksi_Kas_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Berhasil mengekspor data ke Excel!');
    } catch (err: any) {
      toast.error('Gagal export: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper render foto thumbnail di card
  const renderAttachmentThumbnails = (trx: any) => {
    const list: { label: string; url: string }[] = [];
    const add = (label: string, field: string | null) => {
      if (!field) return;
      field.split(',').map(s => s.trim()).filter(Boolean).forEach(url => {
        list.push({ label, url });
      });
    };

    add('Nota', trx.foto_nota);
    add('Transfer', trx.foto_bukti_transfer);
    add('Kegiatan', trx.foto_kegiatan);
    add('Barang', trx.foto_barang);

    if (list.length === 0) {
      return (
        <span className="text-[10px] text-gray-400 font-medium italic">Tidak ada lampiran</span>
      );
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {list.slice(0, 4).map((item, idx) => {
          const isFolder = item.url.includes('/folders/');
          const imgSrc = isFolder ? '' : getSafeImage(item.url);

          return (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (isFolder) {
                  window.open(item.url, '_blank');
                } else {
                  setPreviewImage({ src: imgSrc, original: item.url });
                }
              }}
              title={`${item.label} (Klik untuk memperbesar)`}
              className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:scale-105 transition-all shadow-2xs relative group shrink-0"
            >
              {isFolder ? (
                <span className="text-[9px] font-bold text-blue-600">Drive</span>
              ) : (
                <img
                  src={imgSrc}
                  alt={item.label}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('/api/image-cors') && item.url.startsWith('http')) {
                      target.src = `/api/image-cors?url=${encodeURIComponent(item.url)}`;
                    } else {
                      target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                    }
                  }}
                />
              )}
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7.5px] font-bold text-center leading-tight truncate px-0.5">
                {item.label}
              </span>
            </div>
          );
        })}
        {list.length > 4 && (
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
            +{list.length - 4}
          </span>
        )}
      </div>
    );
  };

  const isModalReadOnly = modalTrx?.disetujui === 'Ditolak';

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* 1. PAGE HEADER Sesuai Standar Design System */}
      <PageHeader
        title="Revisi & Perbaikan Transaksi"
        subtitle="Pusat koreksi data transaksi kas yang memerlukan perbaikan dari verifikator atau penyesuaian transaksi yang belum disetujui untuk dibayar."
        icon={FileEdit}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Revisi Transaksi' }
        ]}
        badge={{
          text: showDitolak
            ? `${stats.ditolakCount} Transaksi Ditolak`
            : `${stats.activeCount} Transaksi Perlu Tindakan`,
          variant: showDitolak ? 'purple' : (stats.revisiCount > 0 ? 'warning' : 'info')
        }}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <SecondaryButton
              size="sm"
              onClick={fetchTransactions}
              isLoading={loading}
              title="Perbarui data dari server"
            >
              <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </SecondaryButton>

            <ExportButtons
              size="sm"
              onExportExcel={handleExportExcel}
              onExportPdf={handlePrint}
              isExportingExcel={isExporting}
              excelLabel="Unduh Excel"
              pdfLabel="Cetak"
            />
          </div>
        }
      />

      {/* 2. STAT CARDS SUMMARY (Standar Light Design System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {!showDitolak ? (
          <>
            <StatCard
              title="Total Perlu Tindakan"
              value={stats.activeCount}
              subtitle="Revisi segera & antrean verifikasi"
              icon={Layers}
              variant="blue"
              lightBg={true}
            />
            <StatCard
              title="Perlu Revisi Segera"
              value={stats.revisiCount}
              subtitle={`Rp ${fmtRp(stats.nominalRevisi)} • Catatan Verifikator`}
              icon={AlertCircle}
              variant="amber"
              lightBg={true}
            />
            <StatCard
              title="Antrean Verifikasi"
              value={stats.menungguCount}
              subtitle={`Rp ${fmtRp(stats.nominalMenunggu)} • Menunggu persetujuan`}
              icon={Clock}
              variant="indigo"
              lightBg={true}
            />
            <StatCard
              title="Total Nilai Tertunda"
              value={`Rp ${fmtRp(stats.totalActiveNominal)}`}
              subtitle="Akumulasi nominal transaksi aktif"
              icon={Coins}
              variant="emerald"
              lightBg={true}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Data Ditolak"
              value={stats.ditolakCount}
              subtitle="Ditolak oleh verifikator kas"
              icon={XCircle}
              variant="rose"
              lightBg={true}
            />
            <StatCard
              title="Mode Tampilan"
              value="View Only"
              subtitle="Data arsip tolakan (tidak dapat diedit)"
              icon={Layers}
              variant="indigo"
              lightBg={true}
            />
            <StatCard
              title="Total Nilai Ditolak"
              value={`Rp ${fmtRp(stats.nominalDitolak)}`}
              subtitle="Akumulasi nominal transaksi ditolak"
              icon={Coins}
              variant="amber"
              lightBg={true}
            />
            <StatCard
              title="Transaksi Aktif Lainnya"
              value={stats.activeCount}
              subtitle={`${stats.revisiCount} revisi, ${stats.menungguCount} menunggu`}
              icon={AlertCircle}
              variant="blue"
              lightBg={true}
            />
          </>
        )}
      </div>

      {/* 3. TOOLBAR CONTROLS (Dibersihkan: Dropdown Tipe Kas & Tanggal Dihapus) */}
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
        {/* Row 1: Search & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari uraian, toko, akun, PIC, atau catatan verifikasi..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-8 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 text-gray-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right Toolbar: View Mode & Density */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200 text-xs shrink-0">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline text-[11px]">Kartu</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Tampilan Tabel"
              >
                <TableIcon size={14} />
                <span className="hidden sm:inline text-[11px]">Tabel</span>
              </button>
            </div>

            {viewMode === 'table' && (
              <TableDensityToggle
                density={tableDensity}
                onChange={setTableDensity}
              />
            )}

            {(searchQuery || selectedStatusChip !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="h-9 px-3 flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Quick Filter Chips & Tombol Terpisah Ditolak */}
        <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex-1 overflow-x-auto pb-1 sm:pb-0">
            {!showDitolak ? (
              <QuickFilterChips
                chips={filterChips}
                selectedChipId={selectedStatusChip}
                onSelect={(id) => {
                  setSelectedStatusChip(id);
                  setCurrentPage(1);
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                  <XCircle size={14} className="text-rose-500" />
                  Sedang Menampilkan Arsip Transaksi Ditolak ({stats.ditolakCount})
                </span>
              </div>
            )}
          </div>

          {/* Tombol Terpisah untuk Melihat Transaksi Ditolak */}
          <button
            type="button"
            onClick={() => {
              setShowDitolak(prev => !prev);
              setSelectedStatusChip('all');
              setCurrentPage(1);
            }}
            className={`h-8 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              showDitolak
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs hover:bg-rose-700'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <XCircle size={14} className={showDitolak ? 'text-white' : 'text-rose-500'} />
            <span>{showDitolak ? 'Kembali ke Revisi & Menunggu' : `Lihat Data Ditolak (${stats.ditolakCount})`}</span>
          </button>
        </div>
      </div>

      {/* 4. MAIN DATA VIEW */}
      {loading ? (
        <SkeletonTable rows={6} columns={7} />
      ) : filteredTrx.length === 0 ? (
        <EmptyState
          type={searchQuery || selectedStatusChip !== 'all' ? 'search' : 'empty'}
          title={searchQuery || selectedStatusChip !== 'all' ? 'Tidak Ada Transaksi yang Cocok' : 'Semua Transaksi Bersih! 🎉'}
          description={
            searchQuery || selectedStatusChip !== 'all'
              ? 'Tidak ditemukan transaksi yang sesuai dengan kata kunci atau filter status yang dipilih.'
              : 'Tidak ada transaksi yang perlu Anda perbaiki atau tertahan di meja verifikasi kas. Seluruh transaksi kas telah disetujui / terbayar.'
          }
          actionLabel="Bersihkan Filter"
          onAction={handleResetFilters}
        />
      ) : viewMode === 'card' ? (
        /* CARD VIEW - Standar Light Design System */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {paginatedTrx.map((trx) => {
            const isPemasukan = Number(trx.uang_masuk) > 0;
            const nominal = isPemasukan ? Number(trx.uang_masuk) : Number(trx.uang_keluar);
            const isRevisi = trx.disetujui === 'Revisi';
            const isMenunggu = trx.disetujui === 'Menunggu';
            const isDitolak = trx.disetujui === 'Ditolak';

            // Light Card Theme Styles based on Status
            const cardTheme = isRevisi
              ? 'bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-200/90 hover:border-amber-400 hover:shadow-[0_4px_20px_rgba(245,158,11,0.12)]'
              : isMenunggu
              ? 'bg-gradient-to-br from-blue-50/40 via-white to-white border-blue-200/90 hover:border-blue-400 hover:shadow-[0_4px_20px_rgba(59,130,246,0.12)]'
              : 'bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200/90 hover:border-rose-400 hover:shadow-[0_4px_20px_rgba(244,63,94,0.12)]';

            return (
              <div
                key={trx.id}
                className={`p-5 rounded-2xl border transition-all duration-200 select-none shadow-2xs hover:scale-[1.008] flex flex-col justify-between gap-4 relative overflow-hidden group ${cardTheme}`}
              >
                {/* Slim Status Bar Indicator */}
                <div
                  className={`absolute top-0 left-0 w-1.5 h-full ${
                    isRevisi
                      ? 'bg-amber-500'
                      : isMenunggu
                      ? 'bg-blue-500'
                      : 'bg-rose-500'
                  }`}
                />

                <div className="space-y-3.5">
                  {/* Top Bar: Status, Tipe Kas, Tanggal */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={
                          isRevisi ? 'warning' : isMenunggu ? 'pending' : 'rejected'
                        }
                        label={
                          isRevisi ? 'Perlu Revisi' : isMenunggu ? 'Menunggu Verifikasi' : 'Ditolak'
                        }
                        size="xs"
                      />
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isPemasukan
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isPemasukan ? '↑ Pemasukan' : '↓ Pengeluaran'}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-white/80 px-2 py-0.5 rounded-md border border-gray-200/60">
                      <Calendar size={12} className="text-gray-400" />
                      {trx.tanggal}
                    </span>
                  </div>

                  {/* Catatan Verifikator Box */}
                  {isRevisi && (
                    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 shadow-2xs">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertCircle size={13} className="text-amber-600" /> Catatan Revisi Verifikator:
                      </p>
                      <p className="text-amber-950 font-semibold text-xs leading-relaxed">
                        "{trx.catatan_verifikasi || 'Mohon lengkapi perbaikan berkas dan rincian data.'}"
                      </p>
                    </div>
                  )}

                  {isMenunggu && (
                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex items-center gap-2 text-blue-900 shadow-2xs">
                      <Clock size={13} className="text-blue-500 shrink-0" />
                      <p className="text-[11px] font-medium leading-tight">
                        Berada di antrean <strong>/verifikasi</strong>. Anda dapat mengoreksi data sebelum disetujui.
                      </p>
                    </div>
                  )}

                  {isDitolak && (
                    <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3 shadow-2xs">
                      <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <XCircle size={13} className="text-rose-600" /> Alasan Pengajuan Ditolak:
                      </p>
                      <p className="text-rose-950 font-semibold text-xs leading-relaxed">
                        "{trx.catatan_verifikasi || 'Pengajuan transaksi ini telah ditolak oleh verifikator.'}"
                      </p>
                    </div>
                  )}

                  {/* Uraian Transaksi */}
                  <div>
                    <h3 className="text-base font-black text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {trx.uraian}
                    </h3>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-gray-600">
                      {trx.ref_akun && (
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 shadow-2xs">
                          <span className="font-mono text-blue-600 font-bold">{trx.ref_akun.nomor_akun}</span>
                          <span className="truncate max-w-[180px]">{trx.ref_akun.nama_akun}</span>
                        </div>
                      )}

                      {trx.ref_personel?.nama_orang && (
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 shadow-2xs">
                          <Building2 size={12} className="text-gray-400" />
                          <span>{trx.ref_personel.nama_orang}</span>
                        </div>
                      )}

                      {trx.toko && (
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 shadow-2xs">
                          <CreditCard size={12} className="text-gray-400" />
                          <span>{trx.toko}</span>
                        </div>
                      )}

                      {trx.created_by && (
                        <div className="flex items-center gap-1 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100 text-[11px] text-indigo-700 font-medium">
                          <User size={11} className="text-indigo-500" />
                          <span>{usersMap[trx.created_by] || trx.created_by}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Box: Light Nominal & Lampiran Thumbnails */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Nominal */}
                    <div className={`p-3 rounded-xl border ${isPemasukan ? 'bg-emerald-50/80 border-emerald-200' : 'bg-slate-50/90 border-slate-200/80'} shadow-2xs`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isPemasukan ? 'text-emerald-700' : 'text-slate-500'}`}>
                        Nominal Transaksi
                      </p>
                      <p className={`text-lg font-black font-mono ${isPemasukan ? 'text-emerald-700' : 'text-slate-900'}`}>
                        Rp {fmtRp(nominal)}
                      </p>
                    </div>

                    {/* Galeri Lampiran Mini */}
                    <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-center shadow-2xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Lampiran Berkas
                      </p>
                      {renderAttachmentThumbnails(trx)}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-gray-200/70 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-gray-400 font-mono">
                    ID #{trx.id}
                  </span>

                  {isDitolak ? (
                    /* Ditolak: Hanya View Saja */
                    <button
                      onClick={() => openModal(trx)}
                      className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Lihat rincian transaksi ditolak"
                    >
                      <Eye size={14} className="text-slate-500" />
                      <span>Lihat Detail</span>
                    </button>
                  ) : (
                    /* Revisi / Menunggu: Buka Mode Edit */
                    <button
                      onClick={() => openModal(trx)}
                      className="h-9 px-4 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 hover:border-blue-600 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Edit transaksi ini"
                    >
                      <FileEdit size={14} />
                      <span>Buka Mode Edit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4 min-w-[220px]">Uraian & Toko</th>
                  <th className="py-3 px-4 min-w-[180px]">Akun & PIC</th>
                  <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                  <th className="py-3 px-4">Lampiran</th>
                  <th className="py-3 px-4 min-w-[200px]">Catatan Verifikasi</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paginatedTrx.map((trx, idx) => {
                  const isPemasukan = Number(trx.uang_masuk) > 0;
                  const nominal = isPemasukan ? Number(trx.uang_masuk) : Number(trx.uang_keluar);
                  const isRevisi = trx.disetujui === 'Revisi';
                  const isMenunggu = trx.disetujui === 'Menunggu';
                  const isDitolak = trx.disetujui === 'Ditolak';
                  const rowPadding = tableDensity === 'compact' ? 'py-2 px-4' : 'py-3.5 px-4';

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className={`${rowPadding} text-center font-mono text-gray-400 font-semibold`}>
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>

                      <td className={rowPadding}>
                        <StatusBadge
                          status={isRevisi ? 'warning' : isMenunggu ? 'pending' : 'rejected'}
                          label={isRevisi ? 'Revisi' : isMenunggu ? 'Menunggu' : 'Ditolak'}
                          size="xs"
                        />
                      </td>

                      <td className={`${rowPadding} whitespace-nowrap text-gray-600 font-semibold`}>
                        {trx.tanggal}
                      </td>

                      <td className={rowPadding}>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {trx.uraian}
                        </div>
                        {trx.toko && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                            <CreditCard size={11} className="text-gray-400" /> {trx.toko}
                          </div>
                        )}
                      </td>

                      <td className={rowPadding}>
                        {trx.ref_akun ? (
                          <div className="font-semibold text-gray-800 text-[11px]">
                            <span className="font-mono text-blue-600 mr-1">{trx.ref_akun.nomor_akun}</span>
                            {trx.ref_akun.nama_akun}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">- Tanpa Akun -</span>
                        )}
                        {trx.ref_personel?.nama_orang && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Building2 size={11} className="text-gray-400" /> {trx.ref_personel.nama_orang}
                          </div>
                        )}
                      </td>

                      <td className={`${rowPadding} text-right whitespace-nowrap`}>
                        <span className={`font-mono font-black ${isPemasukan ? 'text-emerald-700' : 'text-gray-900'}`}>
                          {isPemasukan ? '+ ' : '- '} Rp {fmtRp(nominal)}
                        </span>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">
                          {isPemasukan ? 'Pemasukan' : 'Pengeluaran'}
                        </div>
                      </td>

                      <td className={rowPadding}>
                        {renderAttachmentThumbnails(trx)}
                      </td>

                      <td className={rowPadding}>
                        {trx.catatan_verifikasi ? (
                          <div className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] leading-tight font-medium">
                            {trx.catatan_verifikasi}
                          </div>
                        ) : isMenunggu ? (
                          <span className="text-blue-600 text-[11px] font-semibold flex items-center gap-1">
                            <Clock size={12} /> Menunggu Verifikasi
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      <td className={`${rowPadding} text-center whitespace-nowrap`}>
                        <TableActionGroup>
                          {isDitolak ? (
                            <TableActionButton
                              icon={Eye}
                              variant="default"
                              title="Lihat Detail (View Saja)"
                              label="Lihat"
                              size="sm"
                              onClick={() => openModal(trx)}
                            />
                          ) : (
                            <TableActionButton
                              icon={FileEdit}
                              variant="primary"
                              title="Edit & Kirim Ulang"
                              label="Edit"
                              size="sm"
                              onClick={() => openModal(trx)}
                            />
                          )}
                        </TableActionGroup>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TABLE PAGINATION */}
      {filteredTrx.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTrx.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[8, 12, 24, 48, 100]}
          isLoading={loading}
        />
      )}

      {/* 6. MODAL (EDIT MODE jika Revisi/Menunggu, VIEW MODE jika Ditolak) */}
      {modalTrx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-4 px-5 text-white flex justify-between items-center shrink-0 ${
              isModalReadOnly 
                ? 'bg-gradient-to-r from-rose-600 via-rose-600 to-red-700' 
                : 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  {isModalReadOnly ? <Eye size={18} /> : <FileEdit size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    {isModalReadOnly ? 'Rincian Transaksi Ditolak (View Saja)' : 'Edit & Perbaiki Transaksi'}
                  </h3>
                  <p className="text-xs text-white/80 font-medium">
                    ID #{modalTrx.id} • Status: {modalTrx.disetujui}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !saving && setModalTrx(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-gray-50/50 text-xs">
              {/* Alert Status Banners */}
              {modalTrx.disetujui === 'Revisi' && modalTrx.catatan_verifikasi && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 shadow-2xs">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-amber-800 uppercase tracking-wider mb-0.5">
                      Instruksi Perbaikan dari Verifikator:
                    </h5>
                    <p className="font-semibold text-xs leading-relaxed">
                      "{modalTrx.catatan_verifikasi}"
                    </p>
                  </div>
                </div>
              )}

              {modalTrx.disetujui === 'Menunggu' && (
                <div className="bg-blue-50 border border-blue-200/90 rounded-xl p-3 flex items-start gap-2.5 text-blue-900 shadow-2xs">
                  <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-blue-800 uppercase tracking-wider mb-0.5">
                      Status Transaksi: Antrean Verifikasi
                    </h5>
                    <p className="font-medium text-xs leading-relaxed">
                      Transaksi ini saat ini sedang menunggu persetujuan verifikator. Anda dapat memperbaiki data atau melengkapi lampiran. Menyimpan form ini akan memperbarui data verifikasi secara langsung.
                    </p>
                  </div>
                </div>
              )}

              {modalTrx.disetujui === 'Ditolak' && (
                <div className="bg-rose-50 border border-rose-200/90 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 shadow-2xs">
                  <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-xs text-rose-800 uppercase tracking-wider mb-0.5">
                      Transaksi Ini Telah Ditolak:
                    </h5>
                    <p className="font-semibold text-xs leading-relaxed">
                      "{modalTrx.catatan_verifikasi || 'Transaksi ditolak oleh verifikator.'}"
                    </p>
                    <p className="text-[11px] text-rose-700/80 mt-1 italic">
                      * Sesuai ketentuan, transaksi yang telah ditolak hanya dapat dilihat (view saja) dan tidak dapat diubah di sini.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Baris 1: Tipe, Tanggal, Nominal */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Tipe Kas
                  </label>
                  {isModalReadOnly ? (
                    <div className="h-9 px-3 flex items-center font-bold bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800">
                      {modalTrx.tipe_kas === 'Pemasukan' ? '🟢 Pemasukan (Debit)' : '🔴 Pengeluaran (Kredit)'}
                    </div>
                  ) : (
                    <select
                      value={modalTrx.tipe_kas}
                      onChange={(e) => setModalTrx({ ...modalTrx, tipe_kas: e.target.value })}
                      className="w-full h-9 px-3 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs focus:bg-white focus:border-blue-500"
                    >
                      <option value="Pengeluaran">🔴 Pengeluaran (Kredit)</option>
                      <option value="Pemasukan">🟢 Pemasukan (Debit)</option>
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Tanggal Transaksi
                  </label>
                  {isModalReadOnly ? (
                    <div className="h-9 px-3 flex items-center font-semibold bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800">
                      {modalTrx.tanggal}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={modalTrx.tanggal}
                      onChange={(e) => setModalTrx({ ...modalTrx, tanggal: e.target.value })}
                      className="w-full h-9 px-3 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs focus:bg-white focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Nominal (Rp)
                  </label>
                  {isModalReadOnly ? (
                    <div className="h-9 px-3 flex items-center font-mono font-bold bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-900">
                      Rp {fmtRp(Number(modalTrx.nominal) || 0)}
                    </div>
                  ) : (
                    <>
                      <input
                        type="number"
                        value={modalTrx.nominal}
                        onChange={(e) => setModalTrx({ ...modalTrx, nominal: Number(e.target.value) })}
                        className="w-full h-9 px-3 font-mono font-bold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs text-gray-900 focus:bg-white focus:border-blue-500"
                      />
                      <span className="text-[10px] font-bold text-blue-600 block">
                        Rp {fmtRp(Number(modalTrx.nominal) || 0)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Form Baris 2: Uraian & Toko */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Uraian Transaksi {!isModalReadOnly && <span className="text-rose-500">*</span>}
                  </label>
                  {isModalReadOnly ? (
                    <div className="min-h-[36px] p-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900">
                      {modalTrx.uraian}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={modalTrx.uraian}
                      onChange={(e) => setModalTrx({ ...modalTrx, uraian: e.target.value })}
                      placeholder="Contoh: Belanja Konsumsi Rapat Pengurus..."
                      className="w-full h-9 px-3 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs focus:bg-white focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Nama Toko / Rekanan
                  </label>
                  {isModalReadOnly ? (
                    <div className="h-9 px-3 flex items-center font-semibold bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800">
                      {modalTrx.toko || '-'}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={modalTrx.toko || ''}
                      onChange={(e) => setModalTrx({ ...modalTrx, toko: e.target.value })}
                      placeholder="Contoh: Toko Berkah / PT Sejahtera"
                      className="w-full h-9 px-3 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs focus:bg-white focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Form Baris 3: Akun, Personel, Jenis Belanja */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Akun Anggaran
                  </label>
                  {isModalReadOnly ? (
                    <div className="h-9 px-3 flex items-center font-semibold bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800 truncate">
                      {modalTrx.ref_akun ? `${modalTrx.ref_akun.nomor_akun} - ${modalTrx.ref_akun.nama_akun}` : '- Tanpa Akun -'}
                    </div>
                  ) : (
                    <select
                      value={modalTrx.akun_id || ''}
                      onChange={(e) => setModalTrx({ ...modalTrx, akun_id: e.target.value || null })}
                      className="w-full h-9 px-2.5 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs focus:bg-white focus:border-blue-500 truncate"
                    >
                      <option value="">- Tanpa Akun -</option>
                      {modalTrx.akun_id && !leafAkunList.some(a => a.id === modalTrx.akun_id) && (
                        (() => {
                          const curr = listAkun.find(a => a.id === modalTrx.akun_id);
                          return curr ? (
                            <option key={curr.id} value={curr.id}>
                              (Akun Induk Lama) {curr.nomor_akun} - {curr.nama_akun}
                            </option>
                          ) : null;
                        })()
                      )}
                      {leafAkunList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nomor_akun} - {r.nama_akun}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Personel PIC
                  </label>
                  {isModalReadOnly ? (
                    <div className="h-9 px-3 flex items-center font-semibold bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800 truncate">
                      {modalTrx.ref_personel?.nama_orang || '- Tanpa Personel -'}
                    </div>
                  ) : (
                    <select
                      value={modalTrx.personel_id || ''}
                      onChange={(e) => setModalTrx({ ...modalTrx, personel_id: e.target.value || null })}
                      className="w-full h-9 px-2.5 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs focus:bg-white focus:border-blue-500 truncate"
                    >
                      <option value="">- Tanpa Personel -</option>
                      {listPersonel.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama_orang}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Jenis Belanja (Opsional)
                  </label>
                  {isModalReadOnly ? (
                    <div className="h-9 px-3 flex items-center font-semibold bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-800 truncate">
                      {listBelanja.find(b => b.id === modalTrx.ref_jenis_belanja_id)?.nama_belanja || '-'}
                    </div>
                  ) : (
                    <select
                      value={modalTrx.ref_jenis_belanja_id || ''}
                      onChange={(e) => setModalTrx({ ...modalTrx, ref_jenis_belanja_id: e.target.value || null })}
                      className="w-full h-9 px-2.5 font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs focus:bg-white focus:border-blue-500 truncate"
                    >
                      <option value="">- Tanpa Belanja -</option>
                      {listBelanja.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama_belanja}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Form Baris 4: Kelola Lampiran & Foto Bukti */}
              <div className="bg-white border border-gray-200/80 p-4 rounded-xl space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs">
                    <UploadCloud size={15} className="text-blue-600" />
                    <span>Lampiran Bukti Fisik Transaksi</span>
                  </h4>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    Klik foto untuk memperbesar tampilan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    { label: 'Nota / Kuitansi', key: 'foto_nota', state: fileNota, setter: setFileNota },
                    { label: 'Bukti Transfer', key: 'foto_bukti_transfer', state: fileTrf, setter: setFileTrf },
                    { label: 'Foto Kegiatan', key: 'foto_kegiatan', state: fileKeg, setter: setFileKeg },
                    { label: 'Foto Barang', key: 'foto_barang', state: fileBrg, setter: setFileBrg }
                  ].map((cat, idx) => {
                    const oldLinks = (modalTrx[cat.key] || '').split(',').map((s: string) => s.trim()).filter(Boolean);

                    return (
                      <div key={idx} className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                            [{cat.label}]
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {oldLinks.length} berkas
                          </span>
                        </div>

                        {/* Existing photos preview */}
                        <div className="grid grid-cols-3 gap-2 min-h-[50px] items-center">
                          {oldLinks.length === 0 ? (
                            <span className="text-[10px] text-gray-400 italic col-span-3 text-center py-2 bg-white rounded-lg border border-dashed border-gray-200">
                              Belum ada berkas
                            </span>
                          ) : (
                            oldLinks.map((lnk: string, il: number) => {
                              const isFolder = lnk.includes('/folders/');
                              const imgSrc = isFolder ? '' : getSafeImage(lnk);

                              return (
                                <div
                                  key={il}
                                  className="relative group overflow-hidden rounded-lg border border-gray-200 bg-white aspect-[4/3] shadow-2xs"
                                >
                                  {isFolder ? (
                                    <div
                                      onClick={() => window.open(lnk, '_blank')}
                                      className="w-full h-full flex flex-col items-center justify-center p-1 cursor-pointer bg-blue-50 text-blue-700"
                                    >
                                      <span className="text-[9px] font-bold">Google Drive</span>
                                    </div>
                                  ) : (
                                    <img
                                      src={imgSrc}
                                      alt="Lampiran"
                                      onClick={() => setPreviewImage({ src: imgSrc, original: lnk })}
                                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                                      }}
                                    />
                                  )}
                                  {!isModalReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => removeOldPhoto(cat.key, lnk)}
                                      title="Hapus foto ini"
                                      className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* File upload input (Hanya muncul jika bukan Read-Only / bukan Ditolak) */}
                        {!isModalReadOnly && (
                          <div className="pt-1">
                            <label className="text-[9px] font-bold text-gray-400 block mb-1 uppercase">
                              Unggah Foto Baru (+):
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf"
                              onChange={(e) => cat.setter(Array.from(e.target.files || []))}
                              className="text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 w-full bg-white p-1 rounded-lg border border-gray-200 cursor-pointer"
                            />
                            {cat.state.length > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 block mt-1">
                                ✓ {cat.state.length} file baru dipilih untuk diunggah
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 px-5 bg-white border-t border-gray-100 shrink-0 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                {isModalReadOnly
                  ? 'Mode pratinjau data transaksi ditolak (view-only).'
                  : 'Data akan langsung terbarui di tabel dan antrean verifikasi kas.'}
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <SecondaryButton
                  onClick={() => setModalTrx(null)}
                  disabled={saving}
                >
                  {isModalReadOnly ? 'Tutup' : 'Batal'}
                </SecondaryButton>

                {!isModalReadOnly && (
                  <PrimaryButton
                    onClick={handleSaveAndResubmit}
                    isLoading={saving}
                  >
                    <Send size={13} />
                    <span>Simpan & Kirim ke Verifikasi</span>
                  </PrimaryButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. LIGHTBOX PREVIEW LAMPIRAN BESAR */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={previewImage.src}
              alt="Preview Bukti"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl bg-white/5 p-1 border border-white/20"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
              }}
            />

            <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <a
                href={previewImage.original}
                target="_blank"
                rel="noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
              >
                <ExternalLink size={13} />
                <span>Buka Dokumen Asli</span>
              </a>

              <button
                onClick={() => setPreviewImage(null)}
                className="bg-white text-gray-900 hover:bg-gray-100 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg"
              >
                Tutup Preview
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
