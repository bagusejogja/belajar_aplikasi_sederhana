'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Printer, 
  FileText, 
  ExternalLink,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Paperclip,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Search,
  Copy,
  Check,
  Tag,
  Coins,
  Wallet,
  ArrowDownCircle,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'image' | 'excel';
  fileSize?: string;
  uploadedAt?: string;
  uploader?: string;
  status?: string;
  docNumber?: string;
  unitName?: string;
  perihal?: string;
  nominal?: string;
  nominalUsulan?: string;
  keterangan?: string;
  mode?: 'hasil_analisis' | 'lampiran' | 'template';
  htmlContent?: string;
  rekomendasi?: string;
  tanggalSurat?: string;
  notaData?: {
    mainData?: any;
    detailData?: any[];
    historisData?: any[];
    detailInisiatif?: any[];
    detailPenugasan?: any[];
  };
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  title = 'SK_Rektor_Penetapan_Pagu_2026.pdf',
  fileUrl,
  fileType = 'pdf',
  fileSize = '2.4 MB',
  uploadedAt = '25 Sep 2026, 14:15 WIB',
  uploader = 'Direktorat Keuangan UGM',
  status = 'disetujui',
  docNumber,
  unitName,
  perihal,
  nominal,
  nominalUsulan,
  keterangan,
  mode = 'template',
  htmlContent,
  rekomendasi,
  tanggalSurat,
  notaData,
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [filterKegiatan, setFilterKegiatan] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Helper untuk mengubah URL Google Drive ke URL preview embed yang valid tanpa blocking X-Frame-Options
  const getEmbeddableUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    const gdriveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1]) {
      return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
    }
    return trimmed;
  };

  const displayUrl = getEmbeddableUrl(fileUrl);

  // Reset zoom on open
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
      setFilterKegiatan('');
      setCopiedId(false);
    }
  }, [isOpen]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 60));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleDownload = () => {
    if (fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = title || 'Dokumen_Nota_Analisis.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.print();
    }
  };

  const isHasilAnalisis = mode === 'hasil_analisis' || (!fileUrl && Boolean(htmlContent));

  const handleCopyId = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Data helpers for rich Tahap 4 rendering
  const mData = notaData?.mainData || {};
  const dData = notaData?.detailData || [];
  const rawHData = notaData?.historisData || [];
  const dIni = (notaData?.detailInisiatif || []).filter((h: any) => h.tahun_anggaran === '2026' || h.tahun_anggaran === 2026);
  const dPen = (notaData?.detailPenugasan || []).filter((h: any) => h.tahun_anggaran === '2026' || h.tahun_anggaran === 2026);

  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    let s = (str || '0').toString().trim();
    if (!s.includes(',') && s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 2 && (parts[1].length !== 3 || parts[0].length > 3)) {
        return parseFloat(s) || 0;
      }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  // Parse h.tambah JSON string in historisData (sesuai Tahap 4)
  const hData = rawHData.map((h: any) => {
    let parsed: any = {};
    try {
      if (h.tambah && typeof h.tambah === 'string' && h.tambah.startsWith('{')) {
        parsed = JSON.parse(h.tambah);
      }
    } catch (e) {}
    const pagu = parseNum(h.total_pagu);
    const real = parseNum(h.realisasi_historis);
    return {
      ...h,
      pengalihan: parsed.pengalihan ?? (h.pengalihan || (h.tambah && !h.tambah.startsWith('{') ? h.tambah : '0')),
      tambah_pagu_penugasan: parsed.tambah_pagu_penugasan ?? (h.tambah_pagu_penugasan || '0'),
      tambah_pagu_inisiatif: parsed.tambah_pagu_inisiatif ?? (h.tambah_pagu_inisiatif || '0'),
      efisiensi: parsed.efisiensi ?? (h.efisiensi || '0'),
      talangan: parsed.talangan ?? (h.talangan || '0'),
      persen_serapan: h.persen_serapan || (pagu > 0 ? ((real / pagu) * 100).toFixed(2) + '%' : '-')
    };
  });

  const filteredDetailData = filterKegiatan.trim()
    ? dData.filter((d: any) => 
        (d.uraian_kegiatan || '').toLowerCase().includes(filterKegiatan.toLowerCase())
      )
    : dData;

  const targetYear = '2026';
  const historisYearRow = hData.find((d: any) => d.tahun === targetYear) || hData[hData.length - 1] || {};
  const totalRealisasiDetail = dData.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;

  let pBerjalan = mData?.pagu_berjalan;
  if (!pBerjalan || Object.keys(pBerjalan).length === 0) {
    const raw = mData?.raw_analisis_html || mData?.analisis_html || htmlContent;
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed?.pagu_berjalan) pBerjalan = parsed.pagu_berjalan;
      } catch (e) {}
    }
  }
  pBerjalan = pBerjalan || {};

  const cPaguAwal = parseNum(pBerjalan.pagu_awal) || parseNum(historisYearRow.pagu_awal) || 0;
  const cPengalihan = parseNum(pBerjalan.pengalihan) || parseNum(historisYearRow.pengalihan) || 0;
  const cInisiatif = parseNum(pBerjalan.tambah_inisiatif) || parseNum(historisYearRow.tambah_pagu_inisiatif) || 0;
  const cEfisiensi = parseNum(pBerjalan.efisiensi) || parseNum(historisYearRow.efisiensi) || 0;
  const cPenugasan = parseNum(pBerjalan.tambah_penugasan) || parseNum(historisYearRow.tambah_pagu_penugasan) || 0;
  const cLuncuran = parseNum(pBerjalan.luncuran) || parseNum(pBerjalan.talangan_pindah) || parseNum(pBerjalan.talangan) || parseNum(historisYearRow.talangan) || 0;
  const cRencana = parseNum(pBerjalan.rencana_penerimaan) || 0;
  const cRealisasi = parseNum(pBerjalan.realisasi_penerimaan) || 0;
  
  // Persis seperti PdfPreview.tsx (Tahap 4)
  const cTotal = (cPaguAwal + cPengalihan + cInisiatif + cEfisiensi + cPenugasan + cLuncuran) || parseNum(pBerjalan.total_pagu) || 0;
  const cPengeluaran = parseNum(pBerjalan.realisasi_keseluruhan) || parseNum(mData?.total_realisasi) || totalRealisasiDetail || 0;

  const persentaseTotal = cPaguAwal > 0 ? ((cTotal / cPaguAwal) * 100).toFixed(1) + '%' : '0%';
  const persentaseRealisasi = cRencana > 0 ? ((cRealisasi / cRencana) * 100).toFixed(1) + '%' : (cTotal > 0 ? ((cPengeluaran / cTotal) * 100).toFixed(1) + '%' : '0%');
  const pctPengeluaran = cRealisasi > 0 ? ((cPengeluaran / cRealisasi) * 100).toFixed(1) + '%' : (cTotal > 0 ? ((cPengeluaran / cTotal) * 100).toFixed(1) + '%' : '0%');

  const cTotalPaguHistoris = parseNum(historisYearRow.total_pagu || '0');
  const sisaKapasitasHitung = (cTotalPaguHistoris > 0 ? cTotalPaguHistoris : cTotal) - totalRealisasiDetail;
  const nominalUsulanVal = parseNum(mData?.total_anggaran || nominalUsulan || nominal || '0');

  let tanggalInput = '';
  let bulanSebelum = '';
  if (mData?.id_analisis && mData.id_analisis.startsWith('ANL-')) {
    const ts = parseInt(mData.id_analisis.split('-')[1]);
    if (!isNaN(ts)) {
      const d = new Date(ts);
      tanggalInput = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const d2 = new Date(ts);
      d2.setMonth(d2.getMonth() - 1);
      bulanSebelum = d2.toLocaleDateString('id-ID', { month: 'long' });
    }
  }
  if (!tanggalInput && (mData?.created_at || uploadedAt)) {
    const rawDate = mData?.created_at || (uploadedAt ? uploadedAt.split(',')[0] : null);
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        tanggalInput = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const d2 = new Date(d);
        d2.setMonth(d2.getMonth() - 1);
        bulanSebelum = d2.toLocaleDateString('id-ID', { month: 'long' });
      }
    }
  }

  const rowsPosisiPagu = [
    { label: 'Pagu Awal', value: `Rp ${formatRp(cPaguAwal)}`, hl: '' },
    { label: 'Pengalihan (+/-)', value: `Rp ${formatRp(cPengalihan)}`, hl: '' },
    ...(cInisiatif !== 0 ? [{ label: 'Tambah Pagu Inisiatif (+)', value: `+ Rp ${formatRp(Math.abs(cInisiatif))}`, hl: '' }] : []),
    ...(cPenugasan !== 0 ? [{ label: 'Tambah Pagu Penugasan (+)', value: `+ Rp ${formatRp(Math.abs(cPenugasan))}`, hl: '' }] : []),
    ...(cEfisiensi !== 0 ? [{ label: 'Efisiensi (-)', value: `- Rp ${formatRp(Math.abs(cEfisiensi))}`, hl: '' }] : []),
    ...(cLuncuran !== 0 ? [{ label: 'Talangan / Luncuran (+)', value: `+ Rp ${formatRp(cLuncuran)}`, hl: '' }] : []),
    { label: 'Pagu Sampai Saat Ini', value: `Rp ${formatRp(cTotalPaguHistoris || cTotal)}`, hl: 'indigo' },
    { label: 'Realisasi S.d. Saat Ini', value: `Rp ${formatRp(totalRealisasiDetail)}`, hl: '' },
    { label: 'Sisa Kapasitas Pagu', value: `Rp ${formatRp(sisaKapasitasHitung)}`, hl: 'emerald' },
    { label: 'Nominal Usulan Tambahan Pagu (Diajukan)', value: `Rp ${formatRp(nominalUsulanVal)}`, hl: 'amber' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Viewer Modal Dialog: Lebar Luas & Presisi (edge-to-edge untuk lampiran file) */}
      <div className="relative w-[96vw] max-w-6xl h-[92vh] bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 border ${
              isHasilAnalisis 
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            }`}>
              {isHasilAnalisis ? <Sparkles className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold truncate text-slate-100">
                  {title}
                </h3>
                {status && <StatusBadge status={status} />}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                {isHasilAnalisis ? (
                  <>Nota Telaah Verifikasi Keuangan • Tanggal: {uploadedAt} • Pengesahan: <span className="text-slate-300 font-semibold">{uploader}</span></>
                ) : (
                  <>Ukuran: {fileSize} • Diunggah: {uploadedAt} oleh <span className="text-slate-300 font-semibold">{uploader}</span></>
                )}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Buka Berkas di Tab Baru"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={fileUrl ? "Unduh Berkas Lampiran" : "Cetak / Simpan PDF"}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Cetak Dokumen"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors ml-1 cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-slate-800 bg-slate-900 text-xs shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Perkecil (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-300 min-w-[50px] text-center">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Putar 90° (Rotate)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[11px] font-semibold cursor-pointer"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block font-mono">
            {displayUrl 
              ? 'Pratinjau Dokumen Lampiran Pengajuan Unit (Tampilan Penuh)' 
              : isHasilAnalisis 
                ? 'Nota Hasil Analisis Usulan Pagu Anggaran (Format Resmi UGM)' 
                : 'Pratinjau Dokumen Penetapan Pagu Anggaran UGM'}
          </div>
        </div>

        {/* Document Canvas Body:
            Jika mode === 'hasil_analisis', SELALU render lembar kertas template visual (tanpa toolbar browser / guid)
            dengan sudut melengkung halus (rounded-3xl shadow-2xl), persis seperti template!
        */}
        {displayUrl && mode !== 'hasil_analisis' ? (
          <div className={`flex-1 min-h-0 ${zoom > 100 ? 'overflow-auto' : 'overflow-hidden'} p-2 sm:p-3 flex items-center justify-center bg-slate-950/90`}>
            <div 
              className="w-full h-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
            >
              <iframe
                src={`${displayUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0 bg-white block"
                title={title}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/90">
            <div 
              className="transition-transform duration-200 ease-out origin-top w-full max-w-4xl"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)` 
              }}
            >
              {/* JIKA MODE: HASIL ANALISIS (Tombol Printer - Format Lengkap Tahap 4) */}
              {isHasilAnalisis ? (
                <div className="w-full min-h-[920px] bg-white text-slate-900 p-6 sm:p-10 md:p-12 shadow-2xl rounded-3xl border border-slate-200/90 font-sans leading-relaxed text-xs space-y-6 my-auto">
                  
                  {/* Blue Top Accent Bar */}
                  <div className="h-1.5 w-full bg-blue-600 rounded-full mb-3" />

                  {/* Top Bar with ID Berkas (Dinaikkan) & Status/Tanggal */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-mono text-[11px] font-bold shadow-2xs transition-colors group">
                        <Tag size={13} className="text-blue-600 shrink-0" />
                        <span className="text-slate-500 font-sans font-medium">ID Berkas:</span>
                        <span className="text-blue-900 select-all font-mono font-bold tracking-tight">
                          {mData?.id_analisis || docNumber || 'ANALISIS-PAGU-UGM-2026'}
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCopyId(mData?.id_analisis || docNumber || 'ANALISIS-PAGU-UGM-2026')}
                          className="ml-1 p-0.5 text-slate-400 hover:text-blue-700 transition-colors cursor-pointer"
                          title="Salin ID Berkas"
                        >
                          {copiedId ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{tanggalSurat || (notaData?.mainData?.tanggal_surat) || (uploadedAt ? uploadedAt.split(',')[0] : '25 September 2026')}</span>
                      </div>
                      {status && <StatusBadge status={status} />}
                    </div>
                  </div>

                  {/* Judul Dokumen Hasil Analisis (Tanpa Kop Surat) */}
                  <div className="text-center space-y-1.5 py-2 border-b border-slate-100 pb-4">
                    <h5 className="font-black text-xl sm:text-2xl uppercase tracking-wider text-slate-900 font-sans">
                      NOTA ANALISIS USULAN PAGU ANGGARAN
                    </h5>
                    <p className="text-xs sm:text-sm font-mono font-semibold text-slate-600">
                      Nomor Surat Usulan: <span className="text-slate-900 font-bold">{docNumber || (notaData?.mainData?.no_surat) || '-'}</span>
                    </p>
                  </div>

                  {/* 1. DETAIL PAGU KESELURUHAN TAHUN BERJALAN (KARTU GRID INTERAKTIF) */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                        1. DETAIL PAGU KESELURUHAN TAHUN BERJALAN{tanggalInput ? ` (per ${tanggalInput})` : ''}:
                      </h6>
                      <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">
                        Format Visual Interaktif
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Row 1 */}
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default group">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white/20 text-white">
                            <Coins className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-100 tracking-wider block">Pagu Awal</span>
                            <span className="text-xs font-medium text-amber-50">DIPA Awal Unit</span>
                          </div>
                        </div>
                        <span className="text-base sm:text-lg font-black font-mono tracking-tight">Rp {formatRp(cPaguAwal)}</span>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default group">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white/20 text-white">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider block">Total Pagu</span>
                            <span className="text-xs font-medium text-emerald-50">Kapasitas Tahun Berjalan</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base sm:text-lg font-black font-mono tracking-tight block">Rp {formatRp(cTotal)}</span>
                          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block mt-0.5">{persentaseTotal}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {/* Row 2 */}
                      <div className="bg-emerald-50/90 border border-emerald-200/90 p-3 rounded-2xl hover:border-emerald-400 hover:shadow-xs hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Tambah - Inisiatif</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">(+)</span>
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-950 mt-1.5 block">Rp {formatRp(cInisiatif)}</span>
                      </div>

                      <div className="bg-emerald-50/90 border border-emerald-200/90 p-3 rounded-2xl hover:border-emerald-400 hover:shadow-xs hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Tambah - Penugasan</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">(+)</span>
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-950 mt-1.5 block">Rp {formatRp(cPenugasan)}</span>
                      </div>

                      <div className="bg-indigo-50/90 border border-indigo-200/90 p-3 rounded-2xl hover:border-indigo-400 hover:shadow-xs hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wide">Luncuran / Talangan</span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-md">(+)</span>
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono text-indigo-950 mt-1.5 block">Rp {formatRp(cLuncuran)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {/* Row 3 */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl hover:border-slate-300 hover:shadow-xs hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Pengalihan (+/-)</span>
                          <Layers size={13} className="text-slate-400" />
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono text-slate-900 mt-1.5 block">Rp {formatRp(cPengalihan)}</span>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl hover:border-rose-300 hover:shadow-xs hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wide">Efisiensi (-)</span>
                          <TrendingDown size={13} className="text-rose-500" />
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono text-rose-900 mt-1.5 block">Rp {formatRp(cEfisiensi)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      {/* Row 4 */}
                      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-3 rounded-2xl shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-wider block">RENCANA PENERIMAAN</span>
                          <ArrowDownCircle size={13} className="text-indigo-200" />
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono mt-1.5 block">Rp {formatRp(cRencana)}</span>
                      </div>

                      <div className="bg-gradient-to-br from-sky-600 to-sky-700 text-white p-3 rounded-2xl shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-sky-100 uppercase tracking-wider block">
                            REALISASI PENERIMAAN{bulanSebelum ? ` (${bulanSebelum})` : ''}
                          </span>
                          <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">{persentaseRealisasi}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono mt-1.5 block">Rp {formatRp(cRealisasi)}</span>
                      </div>

                      <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white p-3 rounded-2xl shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-default">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-teal-100 uppercase tracking-wider block">TOTAL PENGELUARAN</span>
                          <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">{pctPengeluaran}</span>
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono mt-1.5 block">Rp {formatRp(cPengeluaran)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. IDENTITAS SURAT & INFORMASI UNIT */}
                  <div className="space-y-2 pt-3">
                    <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 pb-1 flex items-center gap-1.5 border-b border-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      2. IDENTITAS SURAT &amp; INFORMASI UNIT:
                    </h6>
                    <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/90 text-[11px] shadow-2xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-500 uppercase text-[10px] flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400" /> Unit Pengusul
                          </span>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {unitName || (notaData?.mainData?.unit_pengirim) || '-'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="font-bold text-slate-500 uppercase text-[10px] flex items-center gap-1">
                            <DollarSign size={12} className="text-amber-500" /> Nominal Usulan Tambahan
                          </span>
                          <p className="font-black font-mono text-blue-700 text-sm sm:text-base">
                            Rp {formatRp(nominalUsulanVal)}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="font-bold text-slate-500 uppercase text-[10px] flex items-center gap-1">
                            <FileText size={12} className="text-slate-400" /> Nomor &amp; Tanggal Surat
                          </span>
                          <p className="font-mono text-slate-800 font-semibold">
                            {docNumber || (notaData?.mainData?.no_surat) || '-'} 
                            <span className="text-slate-400 font-normal mx-1">•</span> 
                            {tanggalSurat || (notaData?.mainData?.tanggal_surat) || '-'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="font-bold text-slate-500 uppercase text-[10px]">Perihal</span>
                          <p className="text-slate-800 font-medium">
                            {perihal || (notaData?.mainData?.perihal) || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. RINGKASAN SUBSTANSI (WYSIWYG) */}
                  {(htmlContent || (notaData?.mainData?.analisis_html) || (notaData?.mainData?.ringkasan_ai)) && (
                    <div className="space-y-2 pt-3">
                      <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 pb-1 flex items-center gap-1.5 border-b border-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        3. RINGKASAN SUBSTANSI USULAN:
                      </h6>
                      <div 
                        className="prose prose-xs sm:prose-sm text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs break-words overflow-hidden [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2.5 [&_h3]:font-bold [&_h3]:text-sm [&_h4]:font-bold [&_strong]:font-bold"
                        dangerouslySetInnerHTML={{ __html: htmlContent || (notaData?.mainData?.analisis_html) || (notaData?.mainData?.ringkasan_ai) || '' }}
                      />
                    </div>
                  )}

                  {/* 4. POSISI PAGU TAHUN 2026 */}
                  <div className="space-y-2 pt-3">
                    <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 pb-1 flex items-center gap-1.5 border-b border-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      4. POSISI PAGU TAHUN 2026:
                    </h6>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <th className="p-3 font-bold">Komponen Posisi Pagu</th>
                            <th className="p-3 font-bold text-right">Nominal (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rowsPosisiPagu.map((row, idx) => (
                            <tr 
                              key={idx}
                              className={
                                row.hl === 'indigo' 
                                  ? 'bg-indigo-50/80 font-bold text-indigo-950'
                                  : row.hl === 'emerald'
                                    ? 'bg-emerald-50/80 font-bold text-emerald-950'
                                    : row.hl === 'amber'
                                      ? 'bg-amber-50/80 font-bold text-amber-950'
                                      : 'hover:bg-slate-50 transition-colors'
                              }
                            >
                              <td className="p-2.5 font-medium">{row.label}</td>
                              <td className="p-2.5 text-right font-mono font-bold">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 5. HISTORI USULAN TAMBAH PAGU UNIT KERJA */}
                  {(dIni.length > 0 || dPen.length > 0) && (
                    <div className="space-y-2 pt-3">
                      <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 pb-1 flex items-center gap-1.5 border-b border-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        5. HISTORI USULAN TAMBAH PAGU UNIT KERJA:
                      </h6>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                              <th className="p-2.5 font-bold w-10 text-center">No</th>
                              <th className="p-2.5 font-bold">Uraian / Keterangan Tambah Pagu</th>
                              <th className="p-2.5 font-bold text-right">Nominal (Rp)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {dIni.length > 0 && (
                              <>
                                <tr className="bg-indigo-50/70 font-bold text-indigo-900">
                                  <td colSpan={3} className="p-2.5">A. Tambah Pagu Inisiatif</td>
                                </tr>
                                {dIni.map((h: any, idx: number) => (
                                  <tr key={`ini-${idx}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                                    <td className="p-2.5">
                                      <div className="font-medium text-slate-900">{h.keterangan || '-'}</div>
                                      <div className="text-[10px] text-slate-500 font-mono">Tahun: {h.tahun_anggaran || '-'} | Status: {h.status_pagu || 'Disetujui'}</div>
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">Rp {formatRp(parseNum(h.nominal || '0'))}</td>
                                  </tr>
                                ))}
                                <tr className="bg-indigo-100/60 font-bold text-slate-900 border-t border-indigo-200">
                                  <td colSpan={2} className="p-2.5 text-right font-bold">Total Tambah Pagu Inisiatif:</td>
                                  <td className="p-2.5 text-right font-mono font-bold text-indigo-950">
                                    Rp {formatRp(dIni.reduce((acc: number, curr: any) => acc + parseNum(curr.nominal), 0))}
                                  </td>
                                </tr>
                              </>
                            )}
                            {dPen.length > 0 && (
                              <>
                                <tr className="bg-indigo-50/70 font-bold text-indigo-900">
                                  <td colSpan={3} className="p-2.5">B. Tambah Pagu Penugasan</td>
                                </tr>
                                {dPen.map((h: any, idx: number) => (
                                  <tr key={`pen-${idx}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                                    <td className="p-2.5">
                                      <div className="font-medium text-slate-900">{h.keterangan || '-'}</div>
                                      <div className="text-[10px] text-slate-500 font-mono">Tahun: {h.tahun_anggaran || '-'} | Status: {h.status_pagu || 'Disetujui'}</div>
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-bold text-slate-800">Rp {formatRp(parseNum(h.nominal || '0'))}</td>
                                  </tr>
                                ))}
                                <tr className="bg-indigo-100/60 font-bold text-slate-900 border-t border-indigo-200">
                                  <td colSpan={2} className="p-2.5 text-right font-bold">Total Tambah Pagu Penugasan:</td>
                                  <td className="p-2.5 text-right font-mono font-bold text-indigo-950">
                                    Rp {formatRp(dPen.reduce((acc: number, curr: any) => acc + parseNum(curr.nominal), 0))}
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 6. DATA HISTORIS PAGU MULTI-TAHUN */}
                  {hData && hData.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 pb-1 flex items-center gap-1.5 border-b border-slate-200">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        6. DATA HISTORIS PAGU MULTI-TAHUN:
                      </h6>
                      <div className="rounded-2xl overflow-x-auto border border-slate-200 shadow-2xs">
                        <table className="w-full text-left border-collapse text-[10px] min-w-[600px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                              <th className="p-2.5 font-bold">Tahun</th>
                              <th className="p-2.5 font-bold text-right">Pagu Awal</th>
                              <th className="p-2.5 font-bold text-right">Pengalihan</th>
                              <th className="p-2.5 font-bold text-right">+ Penugasan</th>
                              <th className="p-2.5 font-bold text-right">+ Inisiatif</th>
                              <th className="p-2.5 font-bold text-right">- Efisiensi</th>
                              {hData.some((d: any) => parseNum(d.talangan) > 0) && (
                                <th className="p-2.5 font-bold text-right">+ Talangan</th>
                              )}
                              <th className="p-2.5 font-bold text-right">Total Pagu</th>
                              <th className="p-2.5 font-bold text-right">Realisasi</th>
                              <th className="p-2.5 font-bold text-center">% Serapan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {hData.map((d: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2.5 font-bold text-slate-800 font-mono">{d.tahun}</td>
                                <td className="p-2.5 text-right font-mono">{formatRp(parseNum(d.pagu_awal))}</td>
                                <td className="p-2.5 text-right font-mono">{formatRp(parseNum(d.pengalihan))}</td>
                                <td className="p-2.5 text-right font-mono text-emerald-700">{formatRp(parseNum(d.tambah_pagu_penugasan))}</td>
                                <td className="p-2.5 text-right font-mono text-emerald-700">{formatRp(parseNum(d.tambah_pagu_inisiatif))}</td>
                                <td className="p-2.5 text-right font-mono text-rose-700">{formatRp(parseNum(d.efisiensi))}</td>
                                {hData.some((d: any) => parseNum(d.talangan) > 0) && (
                                  <td className="p-2.5 text-right font-mono text-amber-700">{formatRp(parseNum(d.talangan))}</td>
                                )}
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatRp(parseNum(d.total_pagu))}</td>
                                <td className="p-2.5 text-right font-mono text-slate-800">{formatRp(parseNum(d.realisasi_historis))}</td>
                                <td className="p-2.5 text-center font-bold text-blue-700">{d.persen_serapan || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 7. DETAIL SERAPAN REALISASI BELANJA TAHUN INI (DENGAN PENCARIAN INTERAKTIF) */}
                  {dData && dData.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200">
                        <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          7. DETAIL SERAPAN REALISASI BELANJA TAHUN INI:
                        </h6>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              value={filterKegiatan}
                              onChange={(e) => setFilterKegiatan(e.target.value)}
                              placeholder="Cari uraian kegiatan..."
                              className="pl-8 pr-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56 transition-all"
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {filteredDetailData.length} Kegiatan
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl overflow-x-auto border border-slate-200 shadow-2xs">
                        <table className="w-full text-left border-collapse text-[10px] min-w-[500px]">
                          <thead>
                            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                              <th className="p-2.5 font-bold w-8 text-center">No</th>
                              <th className="p-2.5 font-bold">Uraian Kegiatan / Akun</th>
                              <th className="p-2.5 font-bold text-right">Anggaran (Rp)</th>
                              <th className="p-2.5 font-bold text-right">Realisasi (Rp)</th>
                              <th className="p-2.5 font-bold text-right">Sisa Pagu (Rp)</th>
                              <th className="p-2.5 font-bold text-center">% Serapan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredDetailData.length > 0 ? (
                              filteredDetailData.map((d: any, idx: number) => {
                                const sisa = parseNum(d.anggaran) - parseNum(d.realisasi);
                                const pctVal = parseNum(d.persen_serapan || 0);
                                return (
                                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-2.5 text-center text-slate-500 font-mono">{d.no_urut || idx + 1}</td>
                                    <td className="p-2.5 font-medium text-slate-900">{d.uraian_kegiatan || '-'}</td>
                                    <td className="p-2.5 text-right font-mono text-slate-800">{formatRp(parseNum(d.anggaran))}</td>
                                    <td className="p-2.5 text-right font-mono text-emerald-800 font-bold">{formatRp(parseNum(d.realisasi))}</td>
                                    <td className="p-2.5 text-right font-mono text-slate-700">{formatRp(sisa)}</td>
                                    <td className="p-2.5 text-center">
                                      <span className={`inline-block px-1.5 py-0.5 rounded-md font-bold font-mono text-[9px] ${
                                        pctVal >= 75 ? 'bg-emerald-100 text-emerald-800' :
                                        pctVal >= 50 ? 'bg-amber-100 text-amber-800' :
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {d.persen_serapan || '-'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                                  Tidak ada uraian kegiatan yang sesuai dengan pencarian &quot;{filterKegiatan}&quot;
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 8. REKOMENDASI & CATATAN KEPUTUSAN */}
                  {(rekomendasi || (notaData?.mainData?.rekomendasi_ai) || keterangan || (notaData?.mainData?.keterangan_keputusan)) && (
                    <div className="space-y-3 pt-3">
                      {(rekomendasi || (notaData?.mainData?.rekomendasi_ai)) && (
                        <div className="space-y-1.5">
                          <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 pb-1 flex items-center gap-1.5 border-b border-slate-200">
                            <FileCheck2 size={14} className="text-emerald-600" />
                            8. Rekomendasi Tim Verifikator Keuangan
                          </h6>
                          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium shadow-2xs">
                            {rekomendasi || (notaData?.mainData?.rekomendasi_ai)}
                          </div>
                        </div>
                      )}

                      {(keterangan || (notaData?.mainData?.keterangan_keputusan)) && (
                        <div className="space-y-1.5">
                          <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 pb-1 flex items-center gap-1.5 border-b border-slate-200">
                            <AlertCircle size={14} className="text-amber-600" />
                            Catatan Keputusan Pimpinan
                          </h6>
                          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs text-amber-950 leading-relaxed font-medium shadow-2xs">
                            {keterangan || (notaData?.mainData?.keterangan_keputusan)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dokumen Footer (ID Berkas & Timestamp Bersih, Tanpa Tanda Tangan) */}
                  <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-slate-400" />
                      <span>Sistem Informasi Verifikasi Pagu Anggaran UGM</span>
                    </div>
                    <div>
                      <span>Dicetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                </div>
              ) : mode === 'lampiran' ? (
                /* KONDISI LAMPIRAN TAPI FILE TIDAK ADA */
                <div className="w-full min-h-[500px] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-200 font-sans leading-relaxed text-xs space-y-6 my-auto">
                  <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-900 text-amber-300 flex items-center justify-center font-bold text-lg font-sans shadow-sm">
                      UGM
                    </div>
                    <h4 className="font-extrabold text-sm sm:text-base tracking-wide font-sans text-slate-950 uppercase pt-1">
                      UNIVERSITAS GADJAH MADA
                    </h4>
                    <p className="text-[11px] font-sans font-bold text-slate-700">
                      DIREKTORAT KEUANGAN • KANTOR PUSAT TATA USAHA (KPTU)
                    </p>
                  </div>

                  <div className="py-6 text-center space-y-3">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center mx-auto">
                      <Paperclip className="w-7 h-7" />
                    </div>
                    <h5 className="font-bold text-sm text-slate-900 uppercase">
                      Berkas Lampiran Tidak Tersedia / Belum Diunggah
                    </h5>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Surat usulan dengan Nomor <strong>{docNumber || '-'}</strong> dari <strong>{unitName || 'Unit Pengusul'}</strong> belum melampirkan tautan atau berkas digital (PDF) pendukung.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5 font-mono max-w-md mx-auto">
                    <div><strong>Nomor Surat:</strong> {docNumber || '-'}</div>
                    <div><strong>Unit Pengusul:</strong> {unitName || '-'}</div>
                    <div><strong>Perihal:</strong> {perihal || '-'}</div>
                    <div><strong>Nominal Usulan:</strong> {nominalUsulan || nominal || '-'}</div>
                  </div>
                </div>
              ) : (
                /* VISUAL DOCUMENT DEFAULT (Template SK Rektor untuk Design System) */
                <div className="w-full min-h-[760px] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-300 font-sans leading-relaxed text-xs space-y-6 my-auto">
                  {/* Kop Surat UGM */}
                  <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-900 text-amber-300 flex items-center justify-center font-bold text-lg font-sans shadow-sm">
                      UGM
                    </div>
                    <h4 className="font-bold text-sm tracking-wide font-sans text-slate-950 uppercase pt-1">
                      UNIVERSITAS GADJAH MADA
                    </h4>
                    <p className="text-[10px] font-sans text-slate-600">
                      DIREKTORAT KEUANGAN • KANTOR PUSAT TATA USAHA (KPTU)
                    </p>
                    <p className="text-[9px] font-sans text-slate-400">
                      Bulaksumur, Yogyakarta 55281 • Telp: (0274) 588688 • Email: keu@ugm.ac.id
                    </p>
                  </div>

                  {/* Judul Dokumen */}
                  <div className="text-center space-y-1 py-1">
                    <h5 className="font-bold text-xs uppercase tracking-wider underline font-sans">
                      {title.toLowerCase().includes('sk') ? 'SURAT KEPUTUSAN PENETAPAN PAGU ANGGARAN' : 'LEMBAR PENETAPAN VERIFIKASI PAGU ANGGARAN'}
                    </h5>
                    <p className="text-[10px] font-mono text-slate-600">
                      Nomor: {docNumber || '0411/UN1.P.IV/DIR-KEU/KU/2026'}
                    </p>
                  </div>

                  {/* Isi Surat */}
                  <div className="space-y-3 font-sans text-[11px] text-slate-800">
                    <p>
                      Berdasarkan hasil penelaahan dan verifikasi berkas usulan Rencana Kerja dan Anggaran (RKA) Tahun Anggaran 2026 yang diajukan oleh unit kerja:
                    </p>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[10px] space-y-1">
                      <div><strong>Nama Unit:</strong> {unitName || 'Fakultas Biologi UGM (Kode: 02000010)'}</div>
                      <div><strong>Perihal Usulan:</strong> {perihal || 'Penetapan Pagu Anggaran Operasional & Riset'}</div>
                      <div><strong>Pagu Disetujui:</strong> {nominal || 'Rp 1.250.000.000 (Satu Milyar Dua Ratus Lima Puluh Juta Rupiah)'}</div>
                      <div><strong>Sumber Pendanaan:</strong> Dana Masyarakat (PTNBH)</div>
                    </div>

                    <p>
                      Dinyatakan <strong>{keterangan || 'TELAH MEMENUHI KELAYAKAN ADMINISTRASI'}</strong> dan disahkan untuk dimasukkan ke dalam penetapan SK Rektor periode anggaran berjalan.
                    </p>
                  </div>

                  {/* Tanda Tangan */}
                  <div className="pt-10 flex justify-end font-sans">
                    <div className="text-center space-y-8 w-56">
                      <p className="text-[10px] text-slate-600">
                        Yogyakarta, {uploadedAt ? uploadedAt.split(',')[0] : '25 September 2026'}<br />Direktur Keuangan UGM
                      </p>
                      <div className="w-20 h-10 border border-emerald-500/40 bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold flex items-center justify-center mx-auto rounded">
                        TTE Valid
                      </div>
                      <div>
                        <p className="font-bold text-[11px] underline">Prof. Dr. Ir. Keuangan, M.Sc.</p>
                        <p className="text-[9px] text-slate-500 font-mono">NIP. 19750812 200003 1 002</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
