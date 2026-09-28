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
  ShieldCheck
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
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

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

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 60));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      window.print();
    }
  };

  const isHasilAnalisis = mode === 'hasil_analisis' || (!fileUrl && Boolean(htmlContent));

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
            Jika ada fileUrl: TIDAK BOLEH overflow-auto di parent container agar TIDAK terjadi scrollbar ganda!
            Iframe mengisi 100% penuh tinggi dan lebar dengan mulus.
        */}
        {displayUrl ? (
          <div className="flex-1 w-full h-full min-h-0 overflow-hidden p-0 m-0 bg-slate-950 flex flex-col">
            <iframe
              src={displayUrl}
              className="w-full h-full flex-1 border-0 bg-white"
              title={title}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/90">
            <div 
              className="transition-transform duration-200 ease-out origin-top w-full max-w-4xl"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)` 
              }}
            >
              {/* JIKA MODE: HASIL ANALISIS (Tombol Printer) */}
              {isHasilAnalisis ? (
                <div className="w-full min-h-[820px] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-200 font-sans leading-relaxed text-xs space-y-6 my-auto">
                  
                  {/* Kop Surat Resmi UGM */}
                  <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-900 text-amber-300 flex items-center justify-center font-bold text-lg font-sans shadow-sm ring-2 ring-amber-400/40">
                      UGM
                    </div>
                    <h4 className="font-extrabold text-sm sm:text-base tracking-wide font-sans text-slate-950 uppercase pt-1">
                      UNIVERSITAS GADJAH MADA
                    </h4>
                    <p className="text-[11px] font-sans font-bold text-slate-700 tracking-wider">
                      DIREKTORAT KEUANGAN • KANTOR PUSAT TATA USAHA (KPTU)
                    </p>
                    <p className="text-[10px] font-sans text-slate-500">
                      Gedung Pusat UGM Lantai 3 Sayap Selatan, Bulaksumur, Yogyakarta 55281 • Telp: (0274) 588688 • Email: keu@ugm.ac.id
                    </p>
                  </div>

                  {/* Judul Dokumen Hasil Analisis */}
                  <div className="text-center space-y-1 py-1">
                    <h5 className="font-black text-sm uppercase tracking-wider text-slate-950 underline font-sans">
                      NOTA HASIL ANALISIS USULAN PAGU ANGGARAN
                    </h5>
                    <p className="text-[11px] font-mono font-semibold text-slate-600">
                      Nomor Surat Usulan: {docNumber || '-'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Tanggal: {tanggalSurat || uploadedAt ? uploadedAt.split(',')[0] : '25 September 2026'}
                    </p>
                  </div>

                  {/* Identitas Ringkasan Usulan */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-[11px] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Unit Kerja Pengusul</span>
                        <strong className="text-slate-900 text-xs">{unitName || 'Fakultas / Unit Pengusul UGM'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Status Keputusan</span>
                        <div className="mt-0.5 inline-block">
                          <StatusBadge status={status} />
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Perihal Usulan</span>
                        <span className="text-slate-800 font-medium">{perihal || 'Usulan Penambahan Pagu Anggaran Operasional / Kegiatan'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Total Usulan vs Disetujui</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 line-through text-[10px]">{nominalUsulan ? nominalUsulan : ''}</span>
                          <strong className="text-indigo-700 text-xs font-mono">{nominal || 'Rp 0'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Substansi Hasil Analisis AI / Tim Verifikasi */}
                  <div className="space-y-2.5 pt-2">
                    <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      I. Ringkasan &amp; Analisis Kelayakan Substansi
                    </h6>
                    {htmlContent ? (
                      <div 
                        className="prose prose-xs sm:prose-sm text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs break-words overflow-hidden [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2.5 [&_h3]:font-bold [&_h3]:text-sm [&_h4]:font-bold [&_strong]:font-bold"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
                        {perihal ? `Usulan diajukan oleh ${unitName || 'unit pengusul'} dengan perihal: ${perihal}.` : 'Data hasil analisis usulan pagu belum diinputkan.'}
                      </div>
                    )}
                  </div>

                  {/* Rekomendasi Tim Verifikator (Jika ada) */}
                  {rekomendasi && (
                    <div className="space-y-2 pt-2">
                      <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                        <FileCheck2 size={14} className="text-emerald-600" />
                        II. Rekomendasi Tim Verifikator Keuangan
                      </h6>
                      <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium">
                        {rekomendasi}
                      </div>
                    </div>
                  )}

                  {/* Catatan Keputusan Pimpinan (Jika ada) */}
                  {keterangan && (
                    <div className="space-y-2 pt-2">
                      <h6 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-amber-600" />
                        III. Catatan Keputusan Pimpinan
                      </h6>
                      <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed font-medium">
                        {keterangan}
                      </div>
                    </div>
                  )}

                  {/* Pengesahan & Tanda Tangan */}
                  <div className="pt-8 flex justify-between items-end font-sans border-t border-slate-200 mt-6">
                    <div className="text-[10px] text-slate-400 space-y-1">
                      <p className="flex items-center gap-1 font-mono text-slate-500">
                        <ShieldCheck size={13} className="text-emerald-600" /> Dokumen Resmi Hasil Analisis Sistem Terintegrasi UGM
                      </p>
                      <p>ID Berkas: {docNumber ? encodeURIComponent(docNumber) : 'ANALISIS-PAGU-UGM-2026'}</p>
                    </div>

                    <div className="text-center space-y-4 w-60">
                      <p className="text-[10px] text-slate-600">
                        Yogyakarta, {tanggalSurat || (uploadedAt ? uploadedAt.split(',')[0] : '25 September 2026')}<br />
                        <span className="font-bold">Tim Verifikator Pagu Anggaran UGM</span>
                      </p>
                      <div className="w-24 h-11 border border-emerald-500/40 bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold flex flex-col items-center justify-center mx-auto rounded shadow-2xs">
                        <span>TTE VALID</span>
                        <span className="text-[8px] text-emerald-600 font-normal">Kemenkominfo/UGM</span>
                      </div>
                      <div>
                        <p className="font-bold text-[11px] text-slate-900 underline">Direktorat Keuangan UGM</p>
                        <p className="text-[9px] text-slate-500 font-mono">Kantor Pusat UGM Gedung KPTU</p>
                      </div>
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
