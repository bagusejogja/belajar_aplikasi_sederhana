'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Loader2, LayoutDashboard, 
  Clock, AlertCircle, Eye, Sparkles, Building2, CreditCard, User,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, RotateCcw,
  X, ExternalLink, Maximize2
} from 'lucide-react';
import Select from 'react-select';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getLeafAccounts } from '@/lib/coaHelper';

interface GalleryItem {
  src: string;
  original: string;
  label: string;
  isFolder: boolean;
}

interface GalleryModalState {
  isOpen: boolean;
  items: GalleryItem[];
  currentIndex: number;
  trxUraian: string;
  trxNominal: number;
  trxTanggal: string;
  isPemasukan: boolean;
}

export default function VerificationPage() {
  const [pendingTrx, setPendingTrx] = useState<any[]>([]);
  const [listAkun, setListAkun] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [catatan, setCatatan] = useState<{ [id: number]: string }>({});
  const [selectedAkun, setSelectedAkun] = useState<{ [id: number]: string }>({});

  // Akun ujung / leaf (tidak memiliki turunan anak)
  const leafAkunList = React.useMemo(() => getLeafAccounts(listAkun), [listAkun]);

  // Gallery Modal Lightbox State
  const [galleryModal, setGalleryModal] = useState<GalleryModalState | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
     fetchPending();
  }, []);

  const fetchPending = async () => {
     setLoading(true);
     try {
        const [trxRes, akunRes, userRes] = await Promise.all([
           supabase.from('transactions')
              .select('*, ref_akun(nama_akun, nomor_akun), ref_personel(nama_orang)')
              .eq('disetujui', 'Menunggu')
              .order('tanggal', { ascending: false }),
           supabase.from('ref_akun').select('id, nomor_akun, nama_akun').order('nomor_akun'),
           supabase.from('app_users').select('id, email, role')
        ]);

        if (trxRes.error) throw trxRes.error;
        setPendingTrx(trxRes.data || []);
        setListAkun(akunRes.data || []);

        if (userRes.data) {
          const map: Record<string, string> = {};
          userRes.data.forEach((u: any) => {
            map[u.id] = u.email;
          });
          setUsersMap(map);
        }
     } catch (err) {
        console.error(err);
     } finally {
        setLoading(false);
     }
  };

  const verifikasiTransaksi = async (id: number, status: string) => {
     setProcessingId(id);
     try {
        const payload: any = { 
            disetujui: status, 
            tanggal_disetujui: new Date().toISOString().split('T')[0]
        };
        
        if (status === 'Revisi' || status === 'Ditolak') {
            if (!catatan[id] || catatan[id].trim() === '') {
                toast.error("Mohon isi Catatan Alasan untuk staf agar mereka tahu apa yang salah!");
                setProcessingId(null);
                return;
            }
            payload.catatan_verifikasi = catatan[id];
        } else {
            payload.catatan_verifikasi = null;
        }

        if (selectedAkun[id]) {
            payload.akun_id = selectedAkun[id];
        }

        const { error } = await supabase
           .from('transactions')
           .update(payload)
           .eq('id', id);

        if (error) throw error;
        setPendingTrx(prev => prev.filter(t => t.id !== id));
        setCatatan(prev => {
           const newC = { ...prev };
           delete newC[id];
           return newC;
        });
        toast.success(`Berhasil! Transaksi telah ${status}`);

     } catch (err: any) {
        toast.error("Gagal memverifikasi: " + err.message);
     } finally {
        setProcessingId(null);
     }
  };

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

    // Seluruh gambar remote (R2, Google Drive, Supabase, dll) WAJIB lewat proxy lokal /api/image-cors
    // Ini menggaransi 100% gambar tampil di Indihome, Telkomsel, dan seluruh provider internet tanpa blokir
    if (targetUrl.startsWith('http')) {
      return `/api/image-cors?url=${encodeURIComponent(targetUrl)}`;
    }

    return targetUrl;
  };

  // Helper mengambil semua lampiran dari sebuah transaksi
  const getTransactionAttachments = (trx: any): GalleryItem[] => {
    const items: GalleryItem[] = [];
    const addCategory = (label: string, fieldVal: string | null) => {
      if (!fieldVal) return;
      const links = fieldVal.split(',').map((s: string) => s.trim()).filter(Boolean);
      links.forEach((lnk: string) => {
        const isFolder = lnk.includes('/folders/');
        items.push({
          src: isFolder ? '' : getSafeImage(lnk),
          original: lnk,
          label,
          isFolder,
        });
      });
    };

    addCategory('Nota / Kuitansi', trx.foto_nota);
    addCategory('Bukti Transfer', trx.foto_bukti_transfer);
    addCategory('Foto Barang', trx.foto_barang);
    addCategory('Foto Kegiatan', trx.foto_kegiatan);

    return items;
  };

  // Buka Gallery Lightbox
  const openGallery = (trx: any, initialUrl?: string) => {
    const items = getTransactionAttachments(trx);
    if (items.length === 0) return;

    let targetIndex = 0;
    if (initialUrl) {
      const foundIdx = items.findIndex((i) => i.original === initialUrl);
      if (foundIdx >= 0) targetIndex = foundIdx;
    }

    setGalleryModal({
      isOpen: true,
      items,
      currentIndex: targetIndex,
      trxUraian: trx.uraian || 'Transaksi',
      trxNominal: Number(trx.uang_masuk) || Number(trx.uang_keluar) || 0,
      trxTanggal: trx.tanggal || '-',
      isPemasukan: Number(trx.uang_masuk) > 0,
    });
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Gallery Navigation Handlers
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

  // Keyboard navigation
  useEffect(() => {
    if (!galleryModal?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseGallery();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key.toLowerCase() === 'r') {
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

  const renderFoto = (label: string, teks: string | null, trx: any) => {
     if (!teks) return null;
     const links = teks.split(',').map(s => s.trim()).filter(Boolean);
     if (links.length === 0) return null;
     
     return (
        <div className="space-y-1">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{label}</span>
           <div className="flex flex-col gap-2">
              {links.map((lnk, idx) => {
                  const isFolder = lnk.includes('/folders/');
                  const imgSrc = isFolder ? '' : getSafeImage(lnk);

                  return (
                     <div 
                        key={idx} 
                        onClick={() => {
                           if (isFolder) {
                              window.open(lnk, '_blank');
                           } else {
                              openGallery(trx, lnk);
                           }
                        }} 
                        title={`Buka & zoom ${label} (${idx + 1})`}
                        className={`cursor-pointer overflow-hidden rounded-xl border ${isFolder ? 'border-blue-200 hover:border-blue-400 bg-blue-50' : 'border-gray-200/90 hover:border-indigo-400 bg-white'} shadow-2xs relative group w-14 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95`}
                     >
                        {isFolder ? (
                           <div className="flex flex-col items-center justify-center p-1 text-center">
                              <svg className="w-6 h-6 text-blue-500 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                              <span className="text-[8px] font-bold text-blue-700 leading-tight">GDrive</span>
                           </div>
                        ) : (
                           <>
                              <img 
                                 src={imgSrc} 
                                 alt={label} 
                                 className="w-full h-full object-cover" 
                                 onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.src.includes('/api/image-cors') && lnk.startsWith('http')) {
                                       target.src = `/api/image-cors?url=${encodeURIComponent(lnk)}`;
                                       return;
                                    }
                                    target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
                                 }} 
                              />
                              <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                 <ZoomIn size={14} className="text-white drop-shadow-sm" />
                              </div>
                           </>
                        )}
                     </div>
                  );
              })}
           </div>
        </div>
     );
  };

  const currentItem = galleryModal ? galleryModal.items[galleryModal.currentIndex] : null;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2 rounded-xl text-white shadow-xs">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Verifikasi Kas Masjid
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                {pendingTrx.length} Menunggu Verifikasi
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Pusat validasi dan persetujuan bukti transaksi kas masjid secara teliti & akuntabel.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-gray-400 font-bold text-[10px] uppercase">Total Tertunda:</span>
            <span className="font-mono font-black text-gray-900">
              Rp {pendingTrx.reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center h-40 items-center"><Loader2 size={40} className="animate-spin text-indigo-500"/></div>
      ) : pendingTrx.length === 0 ? (
         <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 shadow-xs">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-800">Tidak ada tanggungan!</h3>
            <p className="text-xs text-gray-500 mt-1">Semua transaksi masuk sudah selesai diperiksa dan terverifikasi.</p>
         </div>
      ) : (
         <div className="grid gap-4">
            {pendingTrx.map(trx => {
               const isPemasukan = Number(trx.uang_masuk) > 0;
               const nominal = isPemasukan ? trx.uang_masuk : trx.uang_keluar;
               const allAttachments = getTransactionAttachments(trx);
               const totalLampiran = allAttachments.length;
               
               return <div key={trx.id} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-300 transition-all duration-300 group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${isPemasukan ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                           <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isPemasukan ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                 {isPemasukan ? '↑ Pemasukan' : '↓ Pengeluaran'}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                                 <Clock size={12} /> {trx.tanggal}
                              </span>
                           </div>

                           <div>
                              <h3 className="text-base font-black text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">{trx.uraian}</h3>
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold text-gray-500">
                                 <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600">
                                    <Building2 size={13} className="text-gray-400" /> {trx.ref_personel?.nama_orang || 'Tanpa PIC'}
                                 </div>
                                 {trx.toko && (
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600">
                                       <CreditCard size={13} className="text-gray-400" /> {trx.toko}
                                    </div>
                                 )}
                                 {trx.created_by && (
                                    <div className="flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/80 text-indigo-700 font-medium">
                                       <User size={12} className="text-indigo-500" />
                                       <span>Dibuat: <strong className="font-bold">{usersMap[trx.created_by] || trx.created_by}</strong></span>
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/60 space-y-3">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Klasifikasi Akun Anggaran</label>
                                 <Select 
                                    options={leafAkunList.map(a => ({ value: a.id, label: `${a.nomor_akun} - ${a.nama_akun}` }))}
                                    placeholder="Pilih Akun Anggaran (Akun Ujung)..."
                                    value={
                                       selectedAkun[trx.id] 
                                       ? (() => {
                                            const item = leafAkunList.find(a => a.id === selectedAkun[trx.id]) || listAkun.find(a => a.id === selectedAkun[trx.id]);
                                            return item ? { value: item.id, label: `${item.nomor_akun} - ${item.nama_akun}` } : null;
                                         })()
                                       : (trx.akun_id ? { value: trx.akun_id, label: trx.ref_akun ? `${trx.ref_akun.nomor_akun} - ${trx.ref_akun.nama_akun}` : 'Pilih Akun' } : null)
                                    }
                                    onChange={(val: any) => setSelectedAkun({...selectedAkun, [trx.id]: val?.value})}
                                    className="text-xs"
                                    styles={{
                                       control: (b) => ({ ...b, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: 'white', fontSize: '0.75rem', fontWeight: '600' }),
                                       valueContainer: (b) => ({ ...b, padding: '0 8px' }),
                                    }}
                                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                 />
                              </div>

                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Catatan / Instruksi Verifikasi</label>
                                 <textarea 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 ring-indigo-500/20 focus:bg-white transition-all placeholder:text-gray-400 min-h-[70px]" 
                                    placeholder="Berikan instruksi revisi atau alasan jika ditolak..." 
                                    value={catatan[trx.id] || ''}
                                    onChange={(e) => setCatatan({...catatan, [trx.id]: e.target.value})}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="lg:w-[320px] space-y-3">
                           <div className={`p-4 rounded-xl ${isPemasukan ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'} border flex flex-col items-center justify-center text-center`}>
                              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isPemasukan ? 'text-emerald-600' : 'text-rose-600'}`}>Total Nominal</p>
                              <p className={`text-xl font-black font-mono ${isPemasukan ? 'text-emerald-700' : 'text-rose-700'}`}>
                                 Rp {Number(nominal).toLocaleString('id-ID')}
                              </p>
                           </div>

                           <div className="bg-gray-50/60 rounded-xl p-3.5 border border-gray-200/80">
                              <div className="flex items-center justify-between mb-3">
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Eye size={12} /> Galeri Lampiran
                                 </p>
                                 {totalLampiran > 0 && (
                                    <button
                                       type="button"
                                       onClick={() => openGallery(trx)}
                                       className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline cursor-pointer"
                                       title="Buka galeri penuh untuk melihat semua foto secara berurutan"
                                    >
                                       <span>Buka Semua ({totalLampiran})</span>
                                       <ChevronRight size={11} />
                                    </button>
                                 )}
                              </div>

                              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                  {renderFoto("Nota", trx.foto_nota, trx)}
                                  {renderFoto("Kegiatan", trx.foto_kegiatan, trx)}
                                  {renderFoto("Barang", trx.foto_barang, trx)}
                               </div>
                              {totalLampiran === 0 && (
                                 <div className="py-6 text-center bg-white rounded-lg border border-dashed border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Tanpa Lampiran
                                 </div>
                              )}
                           </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 pt-3.5 border-t border-gray-100 justify-end">
                         <button 
                            onClick={() => verifikasiTransaksi(trx.id, 'Ditolak')} 
                            disabled={processingId === trx.id}
                            className="h-9 px-4 flex items-center justify-center gap-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                         >
                            {processingId === trx.id ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={14} />} <span>Tolak</span>
                         </button>
                         <button 
                            onClick={() => verifikasiTransaksi(trx.id, 'Revisi')} 
                            disabled={processingId === trx.id}
                            className="h-9 px-4 flex items-center justify-center gap-1.5 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                         >
                            {processingId === trx.id ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={14} />} <span>Revisi</span>
                         </button>
                         <button 
                            onClick={() => verifikasiTransaksi(trx.id, 'Disetujui')} 
                            disabled={processingId === trx.id}
                            className="h-9 px-5 flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                         >
                            {processingId === trx.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={14} />} <span>Setujui Transaksi</span>
                         </button>
                      </div>
                   </div>;
            })}
         </div>
      )}

      {/* GALERI LIGHTBOX INTERAKTIF DENGAN NEXT/PREV & ZOOM IN/OUT */}
      <AnimatePresence>
      {galleryModal && currentItem && (
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col justify-between overflow-hidden select-none backdrop-blur-md"
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
                        {galleryModal.trxUraian}
                     </h4>
                     <p className="text-[10px] text-white/70 font-mono">
                        Rp {galleryModal.trxNominal.toLocaleString('id-ID')} • {galleryModal.trxTanggal}
                     </p>
                  </div>
               </div>

               {/* Tengah: Indikator Nomor Foto */}
               <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 text-xs font-bold shrink-0">
                  <span className="text-blue-300">Foto {galleryModal.currentIndex + 1}</span>
                  <span className="text-white/40">/</span>
                  <span className="text-white/80">{galleryModal.items.length}</span>
               </div>

               {/* Kanan: Toolbar Tombol Zoom, Rotate, Link, Close */}
               <div className="flex items-center gap-1 shrink-0">
                  <button 
                     onClick={handleZoomOut}
                     disabled={zoomLevel <= 0.5}
                     title="Perkecil Zoom (-)"
                     className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-30 cursor-pointer text-white/90 hover:text-white"
                  >
                     <ZoomOut size={16} />
                  </button>

                  <button 
                     onClick={handleResetZoom}
                     title="Reset Ukuran 100% (0)"
                     className="px-2.5 py-1 hover:bg-white/20 rounded-xl transition-colors text-xs font-mono font-bold cursor-pointer text-white/90 hover:text-white"
                  >
                     {Math.round(zoomLevel * 100)}%
                  </button>

                  <button 
                     onClick={handleZoomIn}
                     disabled={zoomLevel >= 4}
                     title="Perbesar Zoom (+)"
                     className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-30 cursor-pointer text-white/90 hover:text-white"
                  >
                     <ZoomIn size={16} />
                  </button>

                  <button 
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
                     <span className="text-[11px] font-bold hidden md:inline">Buka Dokumen Asli</span>
                  </a>

                  <button 
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
                     onClick={(e) => { e.stopPropagation(); handleNext(); }}
                     title="Foto Berikutnya (Panah Kanan / Right Arrow)"
                     className="absolute right-4 md:right-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md shadow-2xl"
                  >
                     <ChevronRight size={26} />
                  </button>
               )}
            </div>

            {/* BOTTOM BAR: THUMBNAILS STRIP DARI TRANSAKSI INI */}
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
                           onClick={() => handleJumpTo(idx)}
                           className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                              isActive 
                                 ? 'border-blue-400 ring-2 ring-blue-500/60 scale-105 shadow-lg' 
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
      )}
      </AnimatePresence>
    </div>
  );
}
