import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Printer, 
  Maximize2, 
  FileText, 
  CheckCircle2, 
  FileSpreadsheet,
  RefreshCw,
  ExternalLink
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
  status = 'disetujui'
}: DocumentViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Viewer Modal Dialog */}
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold truncate text-slate-100">
                  {title}
                </h3>
                {status && <StatusBadge status={status} />}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                Ukuran: {fileSize} • Diunggah: {uploadedAt} oleh <span className="text-slate-300 font-semibold">{uploader}</span>
              </p>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => alert(`Mengunduh berkas: ${title}`)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Unduh Berkas"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Cetak Berkas"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors ml-1"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-slate-800 bg-slate-900/90 text-xs shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
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
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Putar 90° (Rotate)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[11px] font-semibold"
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block font-mono">
            Halaman 1 dari 4 (Tampilan Resolusi Tinggi)
          </div>
        </div>

        {/* Document Canvas Body */}
        <div className="flex-1 overflow-auto p-6 sm:p-10 flex items-center justify-center bg-slate-950/90">
          <div 
            className="transition-transform duration-200 ease-out origin-center"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)` 
            }}
          >
            {/* Visual Document Mockup (Representing SK / Nota Dinas UGM) */}
            <div className="w-[560px] min-h-[760px] bg-white text-slate-900 p-10 shadow-2xl rounded-sm border border-slate-300 font-serif leading-relaxed text-xs space-y-6">
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
                  LEMBAR PENETAPAN VERIFIKASI PAGU ANGGARAN
                </h5>
                <p className="text-[10px] font-mono text-slate-600">
                  Nomor: 0411/UN1.P.IV/DIR-KEU/KU/2026
                </p>
              </div>

              {/* Isi Surat */}
              <div className="space-y-3 font-sans text-[11px] text-slate-800">
                <p>
                  Berdasarkan hasil penelaahan dan verifikasi berkas usulan Rencana Kerja dan Anggaran (RKA) Tahun Anggaran 2026 yang diajukan oleh unit kerja:
                </p>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[10px] space-y-1">
                  <div><strong>Nama Unit:</strong> Fakultas Biologi UGM (Kode: 02000010)</div>
                  <div><strong>Mata Anggaran:</strong> 511111 - Belanja Gaji Pokok PNS</div>
                  <div><strong>Pagu Disetujui:</strong> Rp 1.250.000.000 (Satu Milyar Dua Ratus Lima Puluh Juta Rupiah)</div>
                  <div><strong>Sumber Pendanaan:</strong> Dana Masyarakat (PTNBH)</div>
                </div>

                <p>
                  Dinyatakan <strong>TELAH MEMENUHI KELAYAKAN ADMINISTRASI</strong> dan disahkan untuk dimasukkan ke dalam penetapan SK Rektor periode anggaran berjalan.
                </p>
              </div>

              {/* Tanda Tangan */}
              <div className="pt-10 flex justify-end font-sans">
                <div className="text-center space-y-8 w-56">
                  <p className="text-[10px] text-slate-600">
                    Yogyakarta, 25 September 2026<br />Direktur Keuangan UGM
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
          </div>
        </div>
      </div>
    </div>
  );
}
