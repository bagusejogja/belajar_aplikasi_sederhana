'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, Loader2, CheckCircle, CheckCircle2, XCircle, Search, FileText, 
  Eye, AlertCircle, Copy, Check, UploadCloud, ShieldCheck, 
  ArrowRight, Calendar, Landmark, User, FileImage, ExternalLink,
  ChevronDown, ChevronUp, Paperclip, ImageIcon, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ApprovalTransferPage() {
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
        hour12: false
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
            ref_jenis_belanja(nama_belanja)
          `)
          .eq('status', statusFilter)
          .order('created_at', { ascending: false }),
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
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="color: ${status_update === 'Disetujui' ? '#059669' : '#dc2626'}; margin-top: 0;">
                  Pengajuan Transfer ${status_update.toUpperCase()}
                </h2>
                <p>Halo,</p>
                <p>Pengajuan transfer kas yang Anda ajukan telah <strong>${status_update}</strong> oleh bagian keuangan.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                  <tr><td style="padding: 6px 0; color: #6b7280;">Kegiatan:</td><td style="padding: 6px 0; font-weight: bold;">${selectedData.kegiatan}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Nominal:</td><td style="padding: 6px 0; font-weight: bold; color: #4338ca;">Rp ${formatRp(selectedData.nominal)}</td></tr>
                  <tr><td style="padding: 6px 0; color: #6b7280;">Rekening Tujuan:</td><td style="padding: 6px 0; font-weight: bold;">${selectedData.master_rekening?.nama_rekening} (${selectedData.master_rekening?.ref_bank?.nama_bank} - ${selectedData.master_rekening?.no_rekening})</td></tr>
                  ${status_update === 'Ditolak' ? `<tr><td style="padding: 6px 0; color: #dc2626; font-weight: bold;">Alasan Penolakan:</td><td style="padding: 6px 0; color: #dc2626; font-weight: bold;">${catatanReviewer.trim()}</td></tr>` : ''}
                </table>

                ${status_update === 'Ditolak' ? `
                  <div style="background-color: #fff1f2; padding: 12px; border-radius: 8px; border-left: 4px solid #f43f5e; margin: 16px 0;">
                    <p style="margin: 0; color: #9f1239; font-size: 13px;">
                      <strong>Perhatian:</strong> Silakan buka menu <em>Rekap Transfer</em> di aplikasi, lalu klik tombol <strong>"Edit & Ajukan Ulang"</strong> untuk memperbaiki dan mengirimkan kembali pengajuan Anda.
                    </p>
                  </div>
                ` : ''}
                
                <p style="color: #6b7280; font-size: 12px; margin-top: 20px; border-top: 1px solid #f3f4f6; pt: 10px;">
                  Pemberitahuan Otomatis Sistem Apps Bersama
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

  const filteredData = listData.filter(item => 
    item.kegiatan?.toLowerCase().includes(search.toLowerCase()) || 
    item.barang?.toLowerCase().includes(search.toLowerCase()) ||
    item.master_rekening?.nama_rekening?.toLowerCase().includes(search.toLowerCase()) ||
    item.master_rekening?.no_rekening?.includes(search)
  );

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
    const list = [
      { label: 'Nota / Kwitansi', val: item.nota_url },
      { label: 'Foto Kegiatan', val: item.foto_kegiatan },
      { label: 'Foto Barang', val: item.foto_barang },
      { label: 'Bukti Transfer', val: item.foto_bukti_transfer },
    ];

    const hasAny = list.some(l => !!l.val);
    if (!hasAny) {
      return (
        <div className="py-3 px-4 bg-gray-50/80 rounded-xl border border-dashed border-gray-200 text-center">
          <p className="text-[11px] text-gray-400 font-medium italic">Tidak ada lampiran foto/berkas.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {list.map((cat, cIdx) => {
          if (!cat.val) return null;
          const links = cat.val.split(',').map((s: string) => s.trim()).filter(Boolean);
          
          return links.map((lnk: string, lIdx: number) => {
            const gdriveMatch = lnk.match(/\/d\/([a-zA-Z0-9_-]+)/) || lnk.match(/id=([a-zA-Z0-9_-]+)/);
            let imgSrc = lnk;
            if (gdriveMatch && gdriveMatch[1]) {
              imgSrc = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w200`;
            } else if (lnk.includes('.r2.dev') || lnk.includes('r2.cloudflarestorage.com')) {
              imgSrc = `/api/image-cors?url=${encodeURIComponent(lnk)}`;
            }
            const isImage = lnk.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif)$/) != null || !!gdriveMatch;

            return (
              <div 
                key={`${cIdx}-${lIdx}`} 
                onClick={() => setPreviewImage(imgSrc)}
                className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col"
              >
                <div className="h-20 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img 
                      src={imgSrc} 
                      alt={cat.label} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/api/image-cors') && lnk.startsWith('http')) {
                          target.src = `/api/image-cors?url=${encodeURIComponent(lnk)}`;
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  ) : (
                    <FileImage size={24} className="text-gray-400" />
                  )}
                </div>
                <div className="p-1.5 bg-white border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-700 truncate">{cat.label}</span>
                  <ExternalLink size={10} className="text-gray-400 shrink-0 group-hover:text-indigo-600" />
                </div>
              </div>
            );
          });
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
                  <th className="py-3 px-4">Tgl & Kategori</th>
                  <th className="py-3 px-4">Rekening Tujuan</th>
                  <th className="py-3 px-4">Uraian / Kegiatan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/20 transition-colors font-medium">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{item.tanggal_pengajuan}</p>
                      <p className="text-[11px] text-gray-500 font-medium">{item.ref_jenis_belanja?.nama_belanja || 'Umum'}</p>
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
                    </td>
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <p className="font-bold text-gray-800 line-clamp-1">{item.kegiatan || '-'}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">Pengaju: {item.barang || '-'}</p>
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
              
              {/* TOP BANNER: Nominal & Target Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nominal Card */}
                <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Nominal Transfer</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      {selectedData.ref_jenis_belanja?.nama_belanja || 'Kas'}
                    </span>
                  </div>
                  <div className="font-black text-2xl text-emerald-700 font-mono tracking-tight mt-1">
                    Rp {formatRp(selectedData.nominal)}
                  </div>
                </div>

                {/* Rekening Card with 1-Click Copy */}
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                      <Landmark size={12} /> Rekening Tujuan
                    </span>
                    <span className="font-bold text-xs text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200">
                      {selectedData.master_rekening?.ref_bank?.nama_bank || 'Bank'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate">
                        {selectedData.master_rekening?.nama_rekening || '-'}
                      </p>
                      <p className="font-mono font-bold text-sm text-indigo-900">
                        {selectedData.master_rekening?.no_rekening || '-'}
                      </p>
                    </div>
                    {selectedData.master_rekening?.no_rekening && (
                      <button 
                        type="button" 
                        onClick={() => handleCopyText(selectedData.master_rekening.no_rekening, 'modal-rek')} 
                        className="h-8 px-2.5 bg-white hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 transition-all text-xs inline-flex items-center gap-1 shrink-0 shadow-2xs"
                        title="Salin Nomor Rekening"
                      >
                        {copiedRekId === 'modal-rek' ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span className="text-emerald-600">Disalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* INFO SIKLUS PENGAJUAN & WAKTU LENGKAP */}
              <div className="bg-gray-50/90 p-3.5 rounded-xl border border-gray-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={11} className="text-gray-400" /> Waktu Diajukan (Detik):
                  </span>
                  <p className="font-bold text-gray-800 font-mono text-[11px] mt-0.5">
                    {formatFullDateTime(selectedData.created_at, selectedData.tanggal_pengajuan)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <User size={11} className="text-gray-400" /> Diajukan Oleh (Email):
                  </span>
                  <p className="font-bold text-indigo-700 text-xs mt-0.5 truncate" title={selectedData.barang || usersMap[selectedData.created_by] || '-'}>
                    {selectedData.barang || usersMap[selectedData.created_by] || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-emerald-600" /> Waktu Transfer:
                  </span>
                  <p className="font-bold text-emerald-700 font-mono text-[11px] mt-0.5">
                    {selectedData.status === 'Disetujui' && selectedData.tanggal_transfer
                      ? formatFullDateTime(selectedData.tanggal_transfer, selectedData.tanggal_transfer)
                      : selectedData.status === 'Ditolak'
                      ? 'Ditolak'
                      : 'Menunggu Persetujuan'}
                  </p>
                </div>
              </div>

              {/* Rincian Kegiatan & Catatan */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Uraian / Rincian Kegiatan:</span>
                  <p className="font-semibold text-gray-800 leading-relaxed">{selectedData.kegiatan || '-'}</p>
                </div>
                {selectedData.catatan && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-0.5">Catatan Tambahan:</span>
                    <p className="font-medium text-amber-900 italic">{selectedData.catatan}</p>
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

      {/* FULLSCREEN IMAGE PREVIEW */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in duration-150" 
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex justify-center w-full" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImage} 
              alt="Preview Berkas" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-white/5" 
            />
          </div>
          <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <a 
              href={previewImage} 
              target="_blank" 
              rel="noreferrer" 
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ExternalLink size={13} /> Buka Tab Baru
            </a>
            <button 
              type="button"
              onClick={() => setPreviewImage(null)} 
              className="h-9 px-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
