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
  Link as LinkIcon,
  Wallet,
  Receipt,
  UserCheck,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import CatatanPenelitianTabs from '@/components/CatatanPenelitianTabs';
import NotaKasbonModal from '@/components/NotaKasbonModal';

type AttachmentState = { files: File[]; url: string };

interface KasbonItem {
  id: number;
  tanggal_transaksi: string;
  kategori: string;
  nominal: number;
  nominal_kasbon: number;
  nominal_realisasi: number;
  selisih_kasbon: number;
  uraian: string;
  catatan?: string | null;
  nama_penerima?: string | null;
  tipe_transaksi: string;
  status_kasbon: string;
  notas?: any[];
  foto_nota?: string | null;
  foto_kegiatan?: string | null;
  foto_barang?: string | null;
  foto_bukti_transfer?: string | null;
  foto_bukti_1?: string | null;
  foto_bukti_2?: string | null;
  foto_bukti_3?: string | null;
  foto_bukti_4?: string | null;
}

export default function CatatanPenelitianInputPage() {
  // Mode Pilihan Form: 'kasbon' (Uang Muka) vs 'langsung' (Nota Langsung Ada)
  const [formMode, setFormMode] = useState<'kasbon' | 'langsung'>('kasbon');

  // State Form Kasbon / Pengeluaran
  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState<string>('Penelitian');
  const [namaPenerima, setNamaPenerima] = useState<string>('');
  const [nominal, setNominal] = useState<string>('');
  const [uraian, setUraian] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  // 4 Kategori Lampiran Foto Bukti
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
  
  // Kasbon Aktif (Menunggu Nota)
  const [activeKasbonList, setActiveKasbonList] = useState<KasbonItem[]>([]);
  const [totalKasbonOutstanding, setTotalKasbonOutstanding] = useState<number>(0);

  // Modal Selesaikan Kasbon State
  const [selectedKasbonToSettle, setSelectedKasbonToSettle] = useState<KasbonItem | null>(null);
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

  // Format Rupiah Helper
  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Handler memilih file per kategori lampiran
  const handleAttachmentChange = (
    type: keyof typeof attachments, 
    e: React.ChangeEvent<HTMLInputElement>,
    isModal = false
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => f.size <= 10 * 1024 * 1024);
      if (validFiles.length < newFiles.length) {
        toast.error('Beberapa file diabaikan karena ukurannya melebihi 10MB.');
      }
      
      if (isModal) {
        setSettleAttachments(prev => ({
          ...prev,
          [type]: { ...prev[type], files: [...prev[type].files, ...validFiles] }
        }));
      } else {
        setAttachments(prev => ({
          ...prev,
          [type]: { ...prev[type], files: [...prev[type].files, ...validFiles] }
        }));
      }
    }
  };

  // Hapus satu file dari daftar per kategori
  const removeFile = (type: keyof typeof attachments, indexToRemove: number, isModal = false) => {
    if (isModal) {
      setSettleAttachments(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          files: prev[type].files.filter((_, idx) => idx !== indexToRemove)
        }
      }));
    } else {
      setAttachments(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          files: prev[type].files.filter((_, idx) => idx !== indexToRemove)
        }
      }));
    }
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

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls.filter(Boolean).join(', ');
  };

  // Fetch daftar kasbon aktif
  const fetchActiveKasbon = async () => {
    try {
      const res = await fetch('/api/catatan-penelitian?tipe=Kasbon&status=Menunggu%20Nota');
      const json = await res.json();
      if (json.success) {
        setActiveKasbonList(json.data || []);
        setTotalKasbonOutstanding(json.totalKasbonOutstanding || 0);
        setTableNotCreated(!!json.tableNotCreated);
      }
    } catch {}
  };

  useEffect(() => {
    fetchActiveKasbon();
  }, []);

  // Submit Handler: Input Kasbon Baru atau Pengeluaran Langsung
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nominal || isNaN(Number(nominal)) || Number(nominal) <= 0) {
      toast.error('Nominal harus diisi dengan angka valid!');
      return;
    }

    if (formMode === 'kasbon' && !namaPenerima.trim()) {
      toast.error('Nama penerima / pemegang kasbon wajib diisi!');
      return;
    }

    if (!uraian.trim()) {
      toast.error('Uraian rincian kegiatan wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      formMode === 'kasbon'
        ? 'Mencatat pengajuan kasbon kegiatan (Menunggu Nota)...'
        : 'Mengunggah berkas foto & mencatat pengeluaran...'
    );

    try {
      // Unggah foto jika ada lampiran
      const [notaUrl, kegiatanUrl, barangUrl, transferUrl] = await Promise.all([
        attachments.nota.files.length > 0 ? uploadMultipleFiles(attachments.nota.files) : attachments.nota.url,
        attachments.kegiatan.files.length > 0 ? uploadMultipleFiles(attachments.kegiatan.files) : attachments.kegiatan.url,
        attachments.barang.files.length > 0 ? uploadMultipleFiles(attachments.barang.files) : attachments.barang.url,
        attachments.transfer.files.length > 0 ? uploadMultipleFiles(attachments.transfer.files) : attachments.transfer.url,
      ]);

      const isKasbon = formMode === 'kasbon';
      const numNominal = Number(nominal);

      const payload = {
        tanggal_transaksi: tanggal,
        kategori,
        nominal: numNominal,
        uraian: uraian.trim(),
        catatan: catatan.trim(),
        tipe_transaksi: isKasbon ? 'Kasbon' : 'Pengeluaran Langsung',
        status_kasbon: isKasbon ? 'Menunggu Nota' : 'Selesai',
        nama_penerima: isKasbon ? namaPenerima.trim() : null,
        nominal_kasbon: isKasbon ? numNominal : 0,
        nominal_realisasi: isKasbon ? 0 : numNominal,
        selisih_kasbon: isKasbon ? numNominal : 0,
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
        throw new Error(json.error || 'Gagal menyimpan transaksi');
      }

      toast.success(
        isKasbon
          ? `Kasbon Rp ${numNominal.toLocaleString('id-ID')} untuk ${namaPenerima} berhasil dicatat!`
          : 'Pengeluaran & berkas foto berhasil dicatat!',
        { id: toastId }
      );

      // Reset form
      setNominal('');
      setNamaPenerima('');
      setUraian('');
      setCatatan('');
      setAttachments({
        nota: { files: [], url: '' },
        kegiatan: { files: [], url: '' },
        barang: { files: [], url: '' },
        transfer: { files: [], url: '' }
      });

      setTableNotCreated(false);
      fetchActiveKasbon();
    } catch (err: any) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Buka Modal Selesaikan Kasbon
  const handleOpenSettleModal = (item: KasbonItem) => {
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

  // Handler Submit Penyelesaian Kasbon (Nota Belanja Riil)
  const handleSettleKasbonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasbonToSettle) return;

    if (!settleNominalRealisasi || isNaN(Number(settleNominalRealisasi)) || Number(settleNominalRealisasi) <= 0) {
      toast.error('Total nominal belanja riil sesuai nota harus diisi!');
      return;
    }

    setIsSettling(true);
    const toastId = toast.loading('Menyimpan nota penyelesaian & menghitung selisih kasbon...');

    try {
      // Unggah foto nota jika ada
      const [notaUrl, kegiatanUrl, barangUrl, transferUrl] = await Promise.all([
        settleAttachments.nota.files.length > 0 ? uploadMultipleFiles(settleAttachments.nota.files) : settleAttachments.nota.url,
        settleAttachments.kegiatan.files.length > 0 ? uploadMultipleFiles(settleAttachments.kegiatan.files) : settleAttachments.kegiatan.url,
        settleAttachments.barang.files.length > 0 ? uploadMultipleFiles(settleAttachments.barang.files) : settleAttachments.barang.url,
        settleAttachments.transfer.files.length > 0 ? uploadMultipleFiles(settleAttachments.transfer.files) : settleAttachments.transfer.url,
      ]);

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
          foto_bukti_1: notaUrl || selectedKasbonToSettle.foto_bukti_1,
          foto_bukti_2: kegiatanUrl || selectedKasbonToSettle.foto_bukti_2,
          foto_bukti_3: barangUrl || selectedKasbonToSettle.foto_bukti_3,
          foto_bukti_4: transferUrl || selectedKasbonToSettle.foto_bukti_4,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyelesaikan kasbon');
      }

      toast.success(`Kasbon #${selectedKasbonToSettle.id} berhasil diselesaikan dengan nota!`, { id: toastId });
      setSelectedKasbonToSettle(null);
      fetchActiveKasbon();
    } catch (err: any) {
      toast.error('Error: ' + err.message, { id: toastId });
    } finally {
      setIsSettling(false);
    }
  };

  // Kalkulasi preview selisih pada modal penyelesaian
  const kasbonAwal = selectedKasbonToSettle ? Number(selectedKasbonToSettle.nominal_kasbon || selectedKasbonToSettle.nominal) : 0;
  const belanjaRiil = Number(settleNominalRealisasi) || 0;
  const selisihNominal = kasbonAwal - belanjaRiil;

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
                Jalankan script <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-[10px]">supabase_catatan_penelitian_migration.sql</code> di Supabase SQL Editor untuk fitur kasbon &amp; foto cloud permanen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`ALTER TABLE public.catatan_penelitian 
    ADD COLUMN IF NOT EXISTS tipe_transaksi VARCHAR(50) NOT NULL DEFAULT 'Pengeluaran Langsung',
    ADD COLUMN IF NOT EXISTS status_kasbon VARCHAR(50) NOT NULL DEFAULT 'Selesai',
    ADD COLUMN IF NOT EXISTS nama_penerima VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nominal_kasbon NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS nominal_realisasi NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS selisih_kasbon NUMERIC(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tanggal_penyelesaian DATE,
    ADD COLUMN IF NOT EXISTS catatan_penyelesaian TEXT;`);
              toast.success('Script SQL Kasbon berhasil disalin!');
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Copy size={13} />
            <span>Salin Script SQL</span>
          </button>
        </div>
      )}

      {/* KPI HEADER KASBON BERJALAN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
              <Clock size={12} />
              <span>Kasbon Belum Ada Nota</span>
            </span>
            <div className="text-xl font-black text-amber-900 font-mono">
              {formatRupiah(totalKasbonOutstanding)}
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              {activeKasbonList.length} kegiatan sedang memegang uang muka
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
            <Wallet size={22} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 border border-indigo-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
              <Receipt size={12} />
              <span>Model Transaksi</span>
            </span>
            <div className="text-sm font-black text-indigo-950">
              Kasbon &amp; Realisasi Nota Belakangan
            </div>
            <p className="text-[11px] text-indigo-700 font-medium">
              Uang kasbon dicairkan, nota diselesaikan saat belanja rampung
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Kalkulasi Selisih Otomatis</span>
            </span>
            <div className="text-sm font-black text-emerald-950">
              Sisa Kembali &amp; Reimbursement
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              Sistem otomatis mendeteksi sisa uang lebih atau nombok
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Form Kiri + Kasbon Aktif Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================== */}
        {/* FORM INPUT PENGELUARAN / KASBON                           */}
        {/* ========================================================== */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
          
          {/* Header & Toggle Mode (Kasbon vs Langsung) */}
          <div className="space-y-3 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                  formMode === 'kasbon' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {formMode === 'kasbon' ? <Wallet size={19} /> : <PlusCircle size={19} />}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                    {formMode === 'kasbon' ? 'Pencatatan Kasbon (Uang Muka Kegiatan)' : 'Formulir Pengeluaran Langsung'}
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {formMode === 'kasbon' 
                      ? 'Nota diserahkan dan diselesaikan nanti setelah barang dibeli / kegiatan selesai'
                      : 'Transaksi yang langsung memiliki bukti nota / kuitansi riil'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch Mode */}
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormMode('kasbon')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    formMode === 'kasbon'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wallet size={13} />
                  <span>Model Kasbon</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormMode('langsung')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    formMode === 'langsung'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Receipt size={13} />
                  <span>Langsung Nota</span>
                </button>
              </div>
            </div>

            {/* Banner Penjelasan Mode Kasbon */}
            {formMode === 'kasbon' && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">Alur Kasbon Berjalan:</span>
                  <p className="text-amber-800 leading-relaxed font-normal">
                    Catat uang kasbon yang diserahkan kepada pemegang kegiatan/peneliti. Status kasbon akan berstatus <strong>Menunggu Nota</strong> sampai Anda mengklik <em>&quot;Selesaikan Nota&quot;</em> setelah belanja riil selesai.
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Baris 1: Tanggal & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-600" />
                  <span>{formMode === 'kasbon' ? 'Tanggal Penyerahan Kasbon' : 'Tanggal Transaksi'}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs font-bold text-gray-800 border border-gray-200 rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <Tag size={13} className="text-indigo-600" />
                  <span>Kategori Kegiatan</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full text-xs font-bold text-gray-800 border border-gray-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                >
                  <option value="Penelitian">Penelitian (Umum / Analisis Lab)</option>
                  <option value="Hewan & Bahan Penelitian">Hewan &amp; Bahan Penelitian (Kelinci, Tikus, Reagen, dll)</option>
                  <option value="Perlengkapan Penelitian">Perlengkapan &amp; Alat Penelitian</option>
                  <option value="Pengabdian">Pengabdian Masyarakat</option>
                  <option value="Operasional Lab">Operasional Lab &amp; Fasilitas</option>
                  <option value="Perjalanan Dinas">Perjalanan Dinas / Transportasi</option>
                  <option value="Konsumsi & Rapat">Konsumsi &amp; Rapat Koordinasi</option>
                  <option value="Jasa & Honor">Jasa Profesi / Honor Asisten</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Jika Mode Kasbon: Input Nama Penerima Kasbon (PIC) */}
            {formMode === 'kasbon' && (
              <div className="space-y-1">
                <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <UserCheck size={13} className="text-amber-600" />
                  <span>Nama Penerima / Pemegang Kasbon (PIC / Peneliti)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaPenerima}
                  onChange={(e) => setNamaPenerima(e.target.value)}
                  placeholder="Contoh: Dr. Budi Santoso / Mas Ardi (Laboran)"
                  className="w-full text-xs font-bold text-gray-800 border border-gray-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all placeholder:text-gray-400"
                />
              </div>
            )}

            {/* Baris Nominal */}
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign size={13} className={formMode === 'kasbon' ? 'text-amber-600' : 'text-emerald-600'} />
                  <span>{formMode === 'kasbon' ? 'Nominal Uang Kasbon (Uang Muka)' : 'Nominal Pengeluaran Riil (Rp)'}</span>
                  <span className="text-rose-500">*</span>
                </span>
                {nominal && !isNaN(Number(nominal)) && Number(nominal) > 0 && (
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-mono">
                    {formatRupiah(nominal)}
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
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs font-bold text-gray-900 border border-gray-200 rounded-xl pl-9 pr-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono"
                />
              </div>
            </div>

            {/* Uraian Kegiatan / Tujuan Kasbon */}
            <div className="space-y-1">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-600" />
                <span>{formMode === 'kasbon' ? 'Keperluan / Rencana Pembelanjaan Kasbon' : 'Uraian Rincian Belanja'}</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={uraian}
                onChange={(e) => setUraian(e.target.value)}
                placeholder={formMode === 'kasbon' 
                  ? "Contoh: Kasbon pembelian reagen kimia lab dan konsumsi pengujian sampel..."
                  : "Contoh: Pembelian bahan habis pakai penelitian uji spektrofotometri..."}
                className="w-full text-xs font-medium text-gray-800 border border-gray-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none placeholder:text-gray-400"
              />
            </div>

            {/* Catatan Tambahan (Opsional) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Estimasi selesai belanja 3 hari kerja..."
                className="w-full text-xs font-medium text-gray-800 border border-gray-200 rounded-xl p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Lampiran Foto: Jika Kasbon bersifat opsional, jika Langsung ditampilkan 4 kategori */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <ImageIcon size={13} />
                  <span>
                    {formMode === 'kasbon' 
                      ? 'Foto Bukti Kasbon Awal (Kuitansi / Transfer Uang Muka - Opsional)' 
                      : 'Lampiran 4 Kategori Bukti Nota (Multi-Foto)'}
                  </span>
                </span>
                {formMode === 'kasbon' && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Nota belanja bisa diisi belakangan
                  </span>
                )}
              </div>

              {/* 4 Kotak Upload */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'nota', label: formMode === 'kasbon' ? '1. Bukti Kasbon' : '1. Nota / Kwitansi', icon: Receipt },
                  { key: 'kegiatan', label: '2. Foto Kegiatan', icon: Calendar },
                  { key: 'barang', label: '3. Foto Barang', icon: Tag },
                  { key: 'transfer', label: '4. Bukti Transfer', icon: DollarSign },
                ].map(({ key, label, icon: Icon }) => {
                  const typeKey = key as keyof typeof attachments;
                  const fileCount = attachments[typeKey].files.length;
                  return (
                    <div 
                      key={key} 
                      className="border border-dashed border-gray-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-white rounded-2xl p-2.5 text-center transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-center gap-1 text-[11px] font-black text-gray-700 mb-1">
                          <Icon size={12} className="text-indigo-600" />
                          <span>{label}</span>
                        </div>
                        {fileCount > 0 ? (
                          <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                            {fileCount} Foto Dipilih
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium">Belum ada file</span>
                        )}
                      </div>

                      <div className="mt-2">
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-2xs">
                          <UploadCloud size={11} />
                          <span>Pilih Foto</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={(e) => handleAttachmentChange(typeKey, e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Preview list */}
                      {fileCount > 0 && (
                        <div className="mt-1.5 space-y-1 text-left max-h-16 overflow-y-auto">
                          {attachments[typeKey].files.map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[9px] bg-white p-1 rounded border border-gray-200">
                              <span className="truncate max-w-[70px] text-gray-700">{f.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(typeKey, idx)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                  formMode === 'kasbon'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-200'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-200'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>{formMode === 'kasbon' ? 'Catat Kasbon (Menunggu Nota)' : 'Simpan Pengeluaran'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================== */}
        {/* SISI KANAN: DAFTAR KASBON AKTIF & MONITORING REALISASI     */}
        {/* ========================================================== */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-900">
                    Kasbon Aktif (Menunggu Nota)
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {activeKasbonList.length} kasbon belum diselesaikan notanya
                  </p>
                </div>
              </div>

              <Link
                href="/catatan-penelitian/laporan"
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
              >
                <span>Lihat Semua</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            {activeKasbonList.length === 0 ? (
              <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-gray-200 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <h4 className="text-xs font-bold text-gray-800">Semua Kasbon Telah Selesai</h4>
                <p className="text-[11px] text-gray-400">
                  Tidak ada kasbon yang berstatus &quot;Menunggu Nota&quot;. Semua pengeluaran telah di-SPJ-kan.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {activeKasbonList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-gradient-to-br from-amber-50/40 via-white to-slate-50/40 border border-amber-200/90 rounded-2xl space-y-2.5 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            ⏳ Menunggu Nota
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {item.tanggal_transaksi}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-gray-900 truncate">
                          {item.nama_penerima ? `PIC: ${item.nama_penerima}` : 'Kasbon Kegiatan'}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black text-amber-900 font-mono">
                          {formatRupiah(item.nominal_kasbon || item.nominal)}
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">Uang Muka</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed font-normal bg-white/70 p-2 rounded-xl border border-gray-100">
                      {item.uraian}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-bold text-gray-400">
                        Kategori: {item.kategori}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSettleModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <Receipt size={13} />
                        <span>Selesaikan Nota</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Link ke Halaman Laporan */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-200 uppercase tracking-wider">
                Laporan &amp; Rekapitulasi SPJ
              </span>
              <FileSpreadsheet size={16} className="text-blue-300" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Pantau laporan lengkap realisasi belanja, cetak rekap Excel, periksa foto nota bukti, dan cek selisih sisa kasbon di halaman Laporan.
            </p>
            <Link
              href="/catatan-penelitian/laporan"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white pt-1 transition-colors"
            >
              <span>Buka Laporan &amp; Monitoring Kasbon</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {selectedKasbonToSettle && (
        <NotaKasbonModal
          kasbon={selectedKasbonToSettle as any}
          onClose={() => setSelectedKasbonToSettle(null)}
          onSaved={() => { setSelectedKasbonToSettle(null); fetchActiveKasbon(); }}
        />
      )}

    </div>
  );
}
