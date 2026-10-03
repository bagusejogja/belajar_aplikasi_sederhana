'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, Loader2, CheckCircle, CheckCircle2, XCircle, Search, FileText, 
  Eye, AlertCircle, Copy, Check, UploadCloud, ShieldCheck, 
  ArrowRight, Calendar, Landmark, User, FileImage, ExternalLink,
  ChevronDown, ChevronUp, Paperclip, ImageIcon, Clock, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { getSafeFileUrl } from '@/lib/fileHelper';

export default function ApprovalTransferPage() {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Gallery Modal Lightbox State (Zoom, Next/Prev, Rotate)
  const [galleryModal, setGalleryModal] = useState<{
    isOpen: boolean;
    items: { src: string; original: string; label: string; isFolder: boolean }[];
    currentIndex: number;
    title: string;
    nominal: number;
    tanggal: string;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [statusFilter, setStatusFilter] = useState<'Diajukan' | 'Disetujui' | 'Ditolak'>('Diajukan');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLampiran, setShowLampiran] = useState(false);
  
  // Image Preview & Copy State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedRekId, setCopiedRekId] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState(false);

  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [tglTransfer, setTglTransfer] = useState(new Date().toISOString().split('T')[0]);
  const [catatanReviewer, setCatatanReviewer] = useState('');
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const getSafeImage = (url: string | null | undefined): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.includes('drive.google.com')) {
      return `/api/image-cors?url=${encodeURIComponent(trimmed)}`;
    }
    return getSafeFileUrl(trimmed) || trimmed;
  };

  const getTransferAttachments = (item: any) => {
    if (!item) return [];
    const res: { src: string; original: string; label: string; isFolder: boolean }[] = [];
    const addCategory = (label: string, fieldVal: string | null | undefined) => {
      if (!fieldVal) return;
      const links = String(fieldVal).split(',').map((s) => s.trim()).filter(Boolean);
      links.forEach((url) => {
        const isFolder = url.includes('/folders/');
        res.push({
          src: isFolder ? '' : getSafeImage(url),
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
      toast.error('Tidak ada berkas gambar yang dapat dipratinjau');
      return;
    }

    let idx = 0;
    if (initialUrl) {
      const foundIdx = imageItems.findIndex(
        (i) => i.original === initialUrl || i.src === initialUrl || initialUrl.includes(i.original)
      );
      if (foundIdx !== -1) idx = foundIdx;
    }

    setGalleryModal({
      isOpen: true,
      items: imageItems,
      currentIndex: idx,
      title: item.kegiatan || 'Pengajuan Transfer Dana',
      nominal: Number(item.nominal) || 0,
      tanggal: item.tanggal_pengajuan || '-',
    });
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Gallery Navigation & Zoom Handlers
  const handleNext = () => {
    if (!galleryModal || galleryModal.items.length <= 1) return;
    setGalleryModal((prev) => {
      if (!prev) return null;
      const nextIdx = (prev.currentIndex + 1) % prev.items.length;
      return { ...prev, currentIndex: nextIdx };
    });
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrev = () => {
    if (!galleryModal || galleryModal.items.length <= 1) return;
    setGalleryModal((prev) => {
      if (!prev) return null;
      const prevIdx = (prev.currentIndex - 1 + prev.items.length) % prev.items.length;
      return { ...prev, currentIndex: prevIdx };
    });
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleJumpTo = (index: number) => {
    setGalleryModal((prev) => {
      if (!prev) return null;
      return { ...prev, currentIndex: index };
    });
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(0.5, Math.round((prev - 0.25) * 100) / 100);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleCloseGallery = () => {
    setGalleryModal(null);
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard shortcut listener for Gallery Lightbox
  useEffect(() => {
    if (!galleryModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseGallery();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRotate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryModal]);

  // Drag & Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2);
    }
  };

  const extractTransferTime = (item: any) => {
    if (!item?.foto_bukti_transfer) return null;
    const match = item.foto_bukti_transfer.match(/transfer_(\d{13})/);
    if (match && match[1]) {
      return new Date(parseInt(match[1])).toISOString();
    }
    return null;
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
      const [transferRes, usersRes] = await Promise.all([
        supabase
          .from('pengajuan_transfer')
          .select(`
            *,
            master_rekening(nama_rekening, no_rekening, ref_bank(nama_bank)),
            ref_jenis_belanja(nama_belanja, akun_id, ref_akun(nomor_akun, nama_akun))
          `)
          .eq('status', statusFilter)
          .order('created_at', { ascending: false }),
        supabase.from('app_users').select('id, email')
      ]);
        
      if (transferRes.error) throw transferRes.error;
      
      const nowMs = Date.now();
      const activeItems = (transferRes.data || []).filter((item: any) => {
        if (statusFilter !== 'Diajukan') return true;
        const itemDate = item.created_at ? new Date(item.created_at).getTime() : (item.tanggal_pengajuan ? new Date(item.tanggal_pengajuan).getTime() : 0);
        if (!itemDate) return true;
        // Hanya tampilkan jika waktu tayang sudah tiba (sekarang >= waktu pengajuan)
        return itemDate <= nowMs;
      });

      setListData(activeItems);

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
  }, [statusFilter]);

  const openDetail = (item: any) => {
    setSelectedData(item);
    setBuktiFile(null);
    setShowLampiran(false);
    setCatatanReviewer('');
    setTglTransfer(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleAction = async (status_update: 'Disetujui' | 'Ditolak') => {
    if (status_update === 'Disetujui' && !buktiFile) {
      toast.error("Peringatan: Anda WAJIB mengunggah file Bukti Transfer sebelum menyetujui!");
      return;
    }

    if (status_update === 'Ditolak') {
      if (!catatanReviewer.trim()) {
        toast.error("Alasan penolakan WAJIB diisi pada kolom catatan di bawah!");
        return;
      }
    }

    const confirmMsg = status_update === 'Disetujui' 
      ? `Yakin ingin MENYETUJUI transfer sebesar Rp ${formatRp(selectedData.nominal)} ke ${selectedData.master_rekening?.nama_rekening}?`
      : `Yakin ingin MENOLAK pengajuan transfer ini dengan alasan:\n"${catatanReviewer.trim()}"?`;

    if (!confirm(confirmMsg)) return;
    
    setIsProcessing(true);
    try {
      let buktiUrl = null;
      if (status_update === 'Disetujui' && buktiFile) {
        const upData = new FormData();
        upData.append('file', buktiFile);
        upData.append('folder', 'transfer');

        const response = await fetch('/api/upload', { method: 'POST', body: upData });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Gagal mengunggah bukti transfer');
        buktiUrl = result.publicUrl;
      }

      const updatePayload: any = { 
        status: status_update, 
        foto_bukti_transfer: buktiUrl || null,
        tanggal_transfer: status_update === 'Disetujui' ? tglTransfer : null
      };

      if (status_update === 'Ditolak') {
        updatePayload.catatan = `[DITOLAK] Alasan: ${catatanReviewer.trim()}${selectedData.catatan ? `\n\nCatatan Awal: ${selectedData.catatan}` : ''}`;
      } else if (catatanReviewer.trim()) {
        updatePayload.catatan = `${selectedData.catatan ? `${selectedData.catatan}\n\n` : ''}[DISETUJUI] Catatan: ${catatanReviewer.trim()}`;
      }

      const { error } = await supabase
        .from('pengajuan_transfer')
        .update(updatePayload)
        .eq('id', selectedData.id);
        
      if (error) throw error;

      // Kirim Notifikasi Email Otomatis ke Pembuat Pengajuan
      const targetEmail = selectedData.barang || usersMap[selectedData.created_by];
      if (targetEmail && targetEmail.includes('@')) {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            subject: `[Pengajuan Transfer ${status_update}] - Rp ${formatRp(selectedData.nominal)} (${selectedData.kegiatan})`,
            attachments: (status_update === 'Disetujui' && buktiUrl) ? [
              { filename: `Bukti_Transfer_${selectedData.id}.jpg`, path: buktiUrl }
            ] : undefined,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 14px; background: #ffffff;">
                <div style="background: ${status_update === 'Disetujui' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'}; padding: 16px; border-radius: 10px; color: #ffffff; text-align: center; margin-bottom: 20px;">
                  <h2 style="margin: 0; font-size: 18px;">Pengajuan Transfer ${status_update.toUpperCase()}</h2>
                  <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Sistem Notifikasi Kas & Verifikasi</p>
                </div>
                <p style="font-size: 14px; color: #334155;">Halo,</p>
                <p style="font-size: 13px; color: #475569;">Pengajuan transfer kas yang Anda ajukan telah <strong>${status_update.toLowerCase()}</strong> oleh bagian bendahara/keuangan.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
                  <tr><td style="padding: 7px 0; color: #64748b; width: 35%; border-bottom: 1px solid #f1f5f9;">Kegiatan / Uraian:</td><td style="padding: 7px 0; font-weight: bold; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${selectedData.kegiatan}</td></tr>
                  <tr style="background: #f8fafc;"><td style="padding: 7px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Nominal:</td><td style="padding: 7px 8px; font-weight: bold; color: #4338ca; font-size: 15px; border-bottom: 1px solid #f1f5f9;">Rp ${formatRp(selectedData.nominal)}</td></tr>
                  <tr><td style="padding: 7px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Rekening Tujuan:</td><td style="padding: 7px 0; font-weight: bold; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${selectedData.master_rekening?.nama_rekening} (${selectedData.master_rekening?.ref_bank?.nama_bank || ''} - ${selectedData.master_rekening?.no_rekening})</td></tr>
                  ${status_update === 'Disetujui' ? `<tr style="background: #f8fafc;"><td style="padding: 7px 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Tanggal Transfer:</td><td style="padding: 7px 8px; font-weight: bold; color: #059669; border-bottom: 1px solid #f1f5f9;">${tglTransfer}</td></tr>` : ''}
                  ${catatanReviewer.trim() ? `<tr><td style="padding: 7px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Catatan Reviewer:</td><td style="padding: 7px 0; color: ${status_update === 'Ditolak' ? '#dc2626' : '#1e293b'}; font-weight: bold; border-bottom: 1px solid #f1f5f9;">${catatanReviewer.trim()}</td></tr>` : ''}
                </table>

                ${status_update === 'Disetujui' && buktiUrl ? `
                  <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
                    <p style="font-weight: bold; color: #1e293b; margin: 0 0 12px 0; font-size: 13px;">📸 Bukti Transfer Resmi Telah Diunggah:</p>
                    <div style="max-width: 420px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 2px 5px rgba(0,0,0,0.06); background: #ffffff;">
                      <img src="${buktiUrl}" alt="Bukti Transfer" style="width: 100%; display: block; max-height: 380px; object-fit: contain;" />
                    </div>
                    <div style="margin-top: 14px;">
                      <a href="${buktiUrl}" target="_blank" style="display: inline-block; padding: 9px 18px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 12px;">Buka Bukti Transfer Resolusi Penuh</a>
                    </div>
                  </div>
                ` : ''}

                ${status_update === 'Ditolak' ? `
                  <div style="background-color: #fff1f2; padding: 14px; border-radius: 8px; border-left: 4px solid #f43f5e; margin: 16px 0;">
                    <p style="margin: 0; color: #9f1239; font-size: 13px;">
                      <strong>Perhatian:</strong> Silakan buka menu <em>Rekap Transfer</em> di aplikasi, lalu klik tombol <strong>"Perbaiki"</strong> untuk merevisi dan mengajukan ulang pengajuan Anda.
                    </p>
                  </div>
                ` : ''}
                
                <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center;">
                  Pemberitahuan Otomatis Sistem Verifikasi Kas & Transfer
                </p>
              </div>
            `
          })
        }).catch(() => {});
      }

      setIsModalOpen(false);
      toast.success(
        status_update === 'Disetujui' 
          ? "Pengajuan Transfer BERHASIL disetujui & bukti transfer tersimpan!" 
          : "Pengajuan Transfer telah DITOLAK dan notifikasi dikirimkan."
      );
      fetchData();
    } catch (err: any) {
      toast.error("Gagal memproses: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredData = listData.filter(item => 
    item.kegiatan?.toLowerCase().includes(search.toLowerCase()) || 
    item.barang?.toLowerCase().includes(search.toLowerCase()) ||
    item.master_rekening?.nama_rekening?.toLowerCase().includes(search.toLowerCase()) ||
    item.master_rekening?.no_rekening?.includes(search)
  );

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = React.useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID').format(angka || 0);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRekId(id);
    setTimeout(() => setCopiedRekId(null), 2000);
  };

  const getLampiranFiles = (item: any) => {
    if (!item) return [];
    const list = [
      { label: 'Nota / Kwitansi', val: item.nota_url },
      { label: 'Foto Kegiatan', val: item.foto_kegiatan },
      { label: 'Foto Barang', val: item.foto_barang },
      { label: 'Bukti Transfer', val: item.foto_bukti_transfer },
    ];
    const files: { label: string; url: string }[] = [];
    list.forEach(cat => {
      if (cat.val) {
        cat.val.split(',').forEach((s: string) => {
          const tr = s.trim();
          if (tr) files.push({ label: cat.label, url: tr });
        });
      }
    });
    return files;
  };

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
        emptyDesc: item?.status === 'Disetujui' ? 'Belum diunggah bendahara' : 'Wajib diunggah saat menyetujui'
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
                  ? 'bg-white border-gray-200/90 shadow-2xs hover:border-amber-300' 
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
                          className="group relative h-20 bg-gray-100 rounded-xl overflow-hidden cursor-pointer border border-gray-200/80 hover:shadow-xs transition-all flex items-center justify-center"
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
                              <FileImage size={22} className="text-amber-600 mb-1" />
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
                          className="text-[10px] text-amber-700 hover:text-amber-900 font-bold inline-flex items-center gap-1 hover:underline"
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

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-2 rounded-xl text-white shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Approval Transfer
              </h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                statusFilter === 'Diajukan' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : statusFilter === 'Disetujui' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {statusFilter} ({filteredData.length})
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Persetujuan & upload bukti transfer pengajuan kas.
            </p>
          </div>
        </div>

        {/* Status Filter Toggle */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1">
          <button 
            type="button"
            onClick={() => setStatusFilter('Diajukan')} 
            className={`h-7 px-3.5 rounded-lg font-bold text-xs transition-all ${
              statusFilter === 'Diajukan' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Diajukan
          </button>
          <button 
            type="button"
            onClick={() => setStatusFilter('Disetujui')} 
            className={`h-7 px-3.5 rounded-lg font-bold text-xs transition-all ${
              statusFilter === 'Disetujui' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Disetujui
          </button>
          <button 
            type="button"
            onClick={() => setStatusFilter('Ditolak')} 
            className={`h-7 px-3.5 rounded-lg font-bold text-xs transition-all ${
              statusFilter === 'Ditolak' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ditolak
          </button>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="bg-white p-3 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Cari kegiatan, penerima, atau rekening..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-amber-500/20 focus:bg-white transition-all text-xs font-semibold text-gray-700"
          />
        </div>
        <p className="text-[11px] font-semibold text-gray-400 hidden sm:block">
          Total <span className="text-gray-900 font-bold">{filteredData.length}</span> data
        </p>
      </div>

      {/* TABEL PENGAJUAN */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <Loader2 size={32} className="animate-spin mb-2 text-amber-500" />
              <p className="text-xs font-medium">Memuat data pengajuan transfer...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-gray-400">
              <Database size={36} className="mb-2 opacity-30" />
              <p className="text-xs font-medium">Tidak ada data untuk status {statusFilter}</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[110px] whitespace-nowrap">Tgl Pengajuan</th>
                  <th className="py-3 px-4">Rekening Tujuan</th>
                  <th className="py-3 px-4">Uraian / Kegiatan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/20 transition-colors font-medium">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[11px] font-mono shadow-2xs inline-block">
                        {item.tanggal_pengajuan || '-'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{item.master_rekening?.nama_rekening || '-'}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono mt-0.5">
                        <span>{item.master_rekening?.ref_bank?.nama_bank} - {item.master_rekening?.no_rekening}</span>
                        {item.master_rekening?.no_rekening && (
                          <button 
                            type="button" 
                            onClick={() => handleCopyText(item.master_rekening.no_rekening, `table-${item.id}`)}
                            className="p-1 hover:bg-indigo-50 rounded text-indigo-600 transition-colors"
                            title="Salin No Rekening"
                          >
                            {copiedRekId === `table-${item.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                      {item.barang && (
                        <p className="text-[11px] text-gray-500 font-medium mt-1.5 flex items-center gap-1">
                          <span className="text-gray-400">Pengaju:</span>
                          <span className="text-indigo-600 font-semibold truncate max-w-[200px]" title={item.barang}>
                            {item.barang}
                          </span>
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 min-w-[240px] max-w-[480px]">
                      <p className="font-bold text-gray-800 whitespace-normal break-words leading-relaxed">{item.kegiatan || '-'}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {item.ref_jenis_belanja?.ref_akun?.nomor_akun && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[10px] border border-indigo-200">
                            #{item.ref_jenis_belanja.ref_akun.nomor_akun} - {item.ref_jenis_belanja.ref_akun.nama_akun}
                          </span>
                        )}
                        
                      </div>
                      {getTransferAttachments(item).filter((i: any) => !i.isFolder).length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGallery(item);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                            title="Klik untuk melihat & zoom galeri lampiran transaksi ini"
                          >
                            <Eye size={11} className="text-amber-600" />
                            <span>{getTransferAttachments(item).filter((i: any) => !i.isFolder).length} Foto Lampiran</span>
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-600 font-mono text-sm">
                      Rp {formatRp(item.nominal)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        type="button"
                        onClick={() => openDetail(item)} 
                        className={`h-8 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs ${
                          statusFilter === 'Diajukan'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {statusFilter === 'Diajukan' ? (
                          <>
                            <span>Proses Transfer</span>
                            <ArrowRight size={13} />
                          </>
                        ) : (
                          <>
                            <Eye size={13} />
                            <span>Detail</span>
                          </>
                        )}
                      </button>
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
                Menampilkan <strong className="text-gray-900">{itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-gray-900">{itemsPerPage === -1 ? filteredData.length : Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> dari <strong className="text-gray-900">{filteredData.length}</strong> data
              </span>
            </div>

            {/* Center: Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
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
                  className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                  title="Halaman Pertama"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                  title="Sebelumnya"
                >
                  ‹ Prev
                </button>
                
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black">
                  Hal {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                  title="Selanjutnya"
                >
                  Next ›
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                  title="Halaman Terakhir"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STREAMLINED & COMPACT APPROVAL MODAL */}
      {isModalOpen && selectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] border border-gray-200">
            
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${
                  selectedData.status === 'Diajukan' 
                    ? 'bg-amber-100 text-amber-800' 
                    : selectedData.status === 'Disetujui' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  <FileText size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 leading-tight">
                    {selectedData.status === 'Diajukan' ? 'Persetujuan Transfer Dana' : 'Detail Pengajuan Transfer'}
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">ID #{selectedData.id} • Tgl Pengajuan: {selectedData.tanggal_pengajuan}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            {/* Modal Body - 2 Column Clean Layout */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* TOP BANNER: 2 CARD LAYOUT (Status & Log Pengajuan vs Nominal & Rekening) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Card Siklus Waktu & Pengaju */}
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

                {/* Card Nominal & Rekening Tujuan */}
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

                  {/* Rekening Tujuan Box */}
                  <div className="pt-2.5 border-t border-indigo-100/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Landmark size={11} className="text-indigo-600" /> Rekening Tujuan:
                      </span>
                      <span className="font-bold text-[10px] text-indigo-900 bg-white px-1.5 py-0.2 rounded border border-indigo-200">
                        {selectedData.master_rekening?.ref_bank?.nama_bank || 'Bank'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-white/90 p-2 rounded-xl border border-indigo-100">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">
                          {selectedData.master_rekening?.nama_rekening || '-'}
                        </p>
                        <p className="font-mono font-bold text-xs text-indigo-900">
                          {selectedData.master_rekening?.no_rekening || '-'}
                        </p>
                      </div>
                      {selectedData.master_rekening?.no_rekening && (
                        <button 
                          type="button" 
                          onClick={() => handleCopyText(selectedData.master_rekening.no_rekening, 'modal-rek')} 
                          className="h-7 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-all text-[11px] inline-flex items-center gap-1 shrink-0 shadow-2xs"
                          title="Salin Nomor Rekening"
                        >
                          {copiedRekId === 'modal-rek' ? (
                            <>
                              <Check size={11} className="text-emerald-600" />
                              <span className="text-emerald-600">Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Kegiatan, Akun & Catatan */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 space-y-2.5 text-xs">
                {/* No dan Nama Akun */}
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Mata Anggaran / Akun Beban:</span>
                  {selectedData.ref_jenis_belanja?.ref_akun ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
                        {selectedData.ref_jenis_belanja.ref_akun.nomor_akun}
                      </span>
                      <span className="font-black text-gray-900 text-xs">
                        {selectedData.ref_jenis_belanja.ref_akun.nama_akun}
                      </span>
                      {selectedData.ref_jenis_belanja?.nama_belanja && (
                        <span className="text-[11px] text-gray-500 font-medium italic">
                          ({selectedData.ref_jenis_belanja.nama_belanja})
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-700">
                      {selectedData.ref_jenis_belanja?.nama_belanja || 'Akun Belum Ditentukan'}
                    </p>
                  )}
                </div>

                {/* Uraian / Rincian Kegiatan dengan wrap text penuh */}
                <div className="pt-2 border-t border-gray-200/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Uraian / Rincian Kegiatan:</span>
                  <div className="bg-white p-3 rounded-xl border border-gray-200/70 font-semibold text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                    {selectedData.kegiatan || '-'}
                  </div>
                </div>

                {selectedData.catatan && (
                  <div className="pt-2 border-t border-gray-200/60">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">Catatan Tambahan:</span>
                    <p className="font-medium text-amber-900 italic whitespace-pre-wrap break-words">{selectedData.catatan}</p>
                  </div>
                )}
              </div>

              {/* ACTION SECTION (KHUSUS STATUS DIAJUKAN) */}
              {selectedData.status === 'Diajukan' ? (
                <div className="bg-gradient-to-br from-amber-50/60 to-indigo-50/50 p-4 rounded-xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <UploadCloud size={16} className="text-amber-600" />
                    <h3 className="text-xs font-bold text-gray-900">Validasi & Upload Bukti Transfer</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Tanggal Transfer */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Tanggal Transfer <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="date" 
                        value={tglTransfer} 
                        onChange={(e) => setTglTransfer(e.target.value)} 
                        className="w-full h-9 px-3 bg-white border border-gray-300 rounded-xl font-bold text-xs text-gray-800 outline-none focus:ring-2 ring-indigo-500/20"
                      />
                    </div>

                    {/* File Upload Box */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Upload Bukti Transfer <span className="text-rose-500">*</span>
                      </label>
                      <label className="cursor-pointer flex items-center justify-between h-9 px-3 bg-white hover:bg-gray-50 border border-dashed border-indigo-300 rounded-xl transition-all shadow-2xs group">
                        <span className="text-xs font-semibold text-gray-600 truncate max-w-[200px]">
                          {buktiFile ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <Check size={13} className="text-emerald-600" /> {buktiFile.name}
                            </span>
                          ) : (
                            <span className="text-indigo-600 font-bold flex items-center gap-1">
                              <UploadCloud size={13} /> Pilih file bukti transfer...
                            </span>
                          )}
                        </span>
                        <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={(e) => setBuktiFile(e.target.files ? e.target.files[0] : null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Catatan / Alasan Penolakan Visual Textarea */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Catatan Reviewer / Alasan Penolakan</span>
                      <span className="text-rose-600 font-bold normal-case">*Wajib diisi jika MENOLAK</span>
                    </label>
                    <textarea 
                      rows={2}
                      value={catatanReviewer}
                      onChange={(e) => setCatatanReviewer(e.target.value)}
                      placeholder="Tuliskan alasan penolakan (wajib jika tolak) atau pesan/catatan persetujuan (opsional)..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-medium text-xs text-gray-800 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 placeholder:text-gray-400 transition-all"
                    />
                  </div>
                </div>
              ) : (
                /* STATUS DISERUJUI / DITOLAK */
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status Eksekusi</span>
                    <span className={`font-black uppercase text-xs ${
                      selectedData.status === 'Disetujui' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {selectedData.status}
                    </span>
                  </div>
                  {selectedData.tanggal_transfer && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tanggal Ditransfer</span>
                      <span className="font-bold text-gray-800 font-mono">{selectedData.tanggal_transfer}</span>
                    </div>
                  )}
                </div>
              )}

              {/* LAMPIRAN & FOTO DOKUMEN (LANGSUNG TAMPIL) */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                    <Paperclip size={13} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    Lampiran &amp; Foto Dokumen
                  </span>
                </div>
                {renderLampiranThumbnails(selectedData)}
              </div>

            </div>
            
            {/* Modal Footer / Action Buttons */}
            <div className="p-3.5 px-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-4 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 text-xs transition-colors"
              >
                Tutup
              </button>

              {selectedData.status === 'Diajukan' && (
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    disabled={isProcessing} 
                    onClick={() => handleAction('Ditolak')} 
                    className="h-9 px-4 text-rose-600 hover:bg-rose-50 font-bold rounded-xl border border-rose-200 transition-colors text-xs disabled:opacity-50"
                  >
                    {isProcessing ? 'Proses...' : 'Tolak'}
                  </button>
                  <button 
                    type="button"
                    disabled={isProcessing} 
                    onClick={() => handleAction('Disetujui')} 
                    className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-xs text-xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                  >
                    {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    <span>{isProcessing ? 'Menyimpan...' : 'Setujui & Simpan Transfer'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* INTERACTIVE GALLERY LIGHTBOX MODAL WITH ZOOM, ROTATE, NEXT/PREV */}
      <AnimatePresence>
      {galleryModal && galleryModal.items.length > 0 && (() => {
        const currentItem = galleryModal.items[galleryModal.currentIndex];
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/90 flex flex-col justify-between overflow-hidden select-none backdrop-blur-md"
            onClick={handleCloseGallery}
          >
            {/* TOP BAR KONTROL */}
            <div 
              className="p-3 px-5 bg-black/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white shrink-0 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Kiri: Kategori & Info Transaksi */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/15 border border-white/20 text-white shrink-0">
                  {currentItem.label}
                </span>
                <div className="hidden sm:block truncate">
                  <h4 className="text-xs font-bold truncate max-w-sm lg:max-w-md text-white">
                    {galleryModal.title}
                  </h4>
                  <p className="text-[10px] text-white/70 font-mono">
                    Rp {galleryModal.nominal.toLocaleString('id-ID')} • {galleryModal.tanggal}
                  </p>
                </div>
              </div>

              {/* Tengah: Indikator Nomor Foto */}
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 text-xs font-bold shrink-0">
                <span className="text-amber-300 font-mono">Foto {galleryModal.currentIndex + 1}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/80 font-mono">{galleryModal.items.length}</span>
              </div>

              {/* Kanan: Toolbar Tombol Zoom, Rotate, Link, Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  title="Perkecil Zoom (-)"
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-30 cursor-pointer text-white/90 hover:text-white"
                >
                  <ZoomOut size={16} />
                </button>

                <button 
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Ukuran 100% (0)"
                  className="px-2.5 py-1 hover:bg-white/20 rounded-xl transition-colors text-xs font-mono font-bold cursor-pointer text-white/90 hover:text-white"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>

                <button 
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  title="Perbesar Zoom (+)"
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-30 cursor-pointer text-white/90 hover:text-white"
                >
                  <ZoomIn size={16} />
                </button>

                <button 
                  type="button"
                  onClick={handleRotate}
                  title="Putar Foto 90° (R)"
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white/90 hover:text-white"
                >
                  <RotateCw size={16} />
                </button>

                <a 
                  href={currentItem.src || getSafeImage(currentItem.original)} 
                  target="_blank" 
                  rel="noreferrer" 
                  title="Buka Dokumen Asli di Tab Baru (Bebas Blokir Indihome)"
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white/90 hover:text-white ml-1 flex items-center gap-1.5"
                >
                  <ExternalLink size={16} />
                  <span className="text-[11px] font-bold hidden md:inline">Buka Tab Baru</span>
                </a>

                <button 
                  type="button"
                  onClick={handleCloseGallery}
                  title="Tutup Galeri (Esc)"
                  className="p-2 bg-white/10 hover:bg-rose-600 rounded-xl transition-colors ml-1.5 cursor-pointer text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* AREA UTAMA GAMBAR & TOMBOL NEXT / PREV */}
            <div 
              className="relative flex-1 flex items-center justify-center overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              {/* Tombol Previous */}
              {galleryModal.items.length > 1 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  title="Foto Sebelumnya (Panah Kiri / Left Arrow)"
                  className="absolute left-4 md:left-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md shadow-2xl"
                >
                  <ChevronLeft size={26} />
                </button>
              )}

              {/* Gambar Aktif dengan Transform Zoom, Rotate, & Drag Position */}
              <div className="relative flex items-center justify-center w-full h-full p-4 overflow-hidden pointer-events-none">
                <img 
                  key={`${galleryModal.currentIndex}`}
                  src={currentItem.src} 
                  alt={currentItem.label} 
                  onDoubleClick={handleDoubleClick}
                  draggable={false}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                    maxWidth: '85vw',
                    maxHeight: '72vh',
                    willChange: 'transform'
                  }}
                  className="object-contain rounded-xl shadow-2xl pointer-events-auto select-none"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('/api/image-cors') && currentItem.original.startsWith('http')) {
                      target.src = `/api/image-cors?url=${encodeURIComponent(currentItem.original)}`;
                      return;
                    }
                    target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                  }} 
                />
              </div>

              {/* Tombol Next */}
              {galleryModal.items.length > 1 && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  title="Foto Berikutnya (Panah Kanan / Right Arrow)"
                  className="absolute right-4 md:right-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md shadow-2xl"
                >
                  <ChevronRight size={26} />
                </button>
              )}
            </div>

            {/* BOTTOM BAR: THUMBNAILS STRIP */}
            {galleryModal.items.length > 1 && (
              <div 
                className="p-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto shrink-0 z-30"
                onClick={(e) => e.stopPropagation()}
              >
                {galleryModal.items.map((item, idx) => {
                  const isActive = idx === galleryModal.currentIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleJumpTo(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        isActive 
                          ? 'border-amber-400 ring-2 ring-amber-500/60 scale-105 shadow-lg' 
                          : 'border-white/20 opacity-50 hover:opacity-100'
                      }`}
                      title={`Buka ${item.label} (#${idx + 1})`}
                    >
                      <img src={item.src} alt={item.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-bold text-white text-center truncate px-0.5 leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        );
      })()}
      </AnimatePresence>
    </div>
  );
}
