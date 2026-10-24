"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, ExternalLink, ArrowRight } from 'lucide-react';

interface AccountSourceMapping {
  kelompokInduk: string;
  posUsulan: string;
  polaAkun?: string;
  keterangan?: string;
  jenis: 'penerimaan' | 'pengeluaran' | 'summary';
}

const KOMPARASI_SOURCE_MAP: Record<number, AccountSourceMapping> = {
  // PENERIMAAN DANA PEMERINTAH
  1: { kelompokInduk: 'PENERIMAAN', posUsulan: 'Header Penerimaan', jenis: 'penerimaan' },
  2: { kelompokInduk: 'Jumlah Penerimaan Dana Pemerintah', posUsulan: 'Sub Total Kelompok Dana Pemerintah', polaAkun: '42101*, 42103*, Hibah', jenis: 'penerimaan' },
  3: { kelompokInduk: 'Jumlah Penerimaan Dana Pemerintah', posUsulan: 'Penerimaan Gaji dan Tunjangan PNS', polaAkun: '42101* (Gaji & Tunjangan)', keterangan: 'Penerimaan alokasi gaji dan tunjangan PNS pusat', jenis: 'penerimaan' },
  4: { kelompokInduk: 'Jumlah Penerimaan Dana Pemerintah', posUsulan: 'Bantuan Pendanaan PTN Badan Hukum', polaAkun: '42103* (BP PTN-BH)', keterangan: 'Bantuan pendanaan PTN-BH kementerian', jenis: 'penerimaan' },
  5: { kelompokInduk: 'Jumlah Penerimaan Dana Pemerintah', posUsulan: 'Penerimaan Pemerintah lainnya (Sub Total Pos)', polaAkun: 'Sub pos penelitian, beasiswa, STP, dsb', jenis: 'penerimaan' },
  6: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'Penelitian', polaAkun: 'Penelitian kementerian / BRIN', jenis: 'penerimaan' },
  7: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'Beasiswa dan Kontrak Kerjasama Pemerintah', polaAkun: 'Beasiswa / Kemenkeu / Mitra Pemda', jenis: 'penerimaan' },
  8: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'HIBAH GDG LOAN JICA', polaAkun: 'Loan JICA', jenis: 'penerimaan' },
  9: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'Penerimaan DAPT', polaAkun: 'DAPT', jenis: 'penerimaan' },
  10: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'Insentif Capaian IKU', polaAkun: 'Insentif IKU', jenis: 'penerimaan' },
  11: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'HIBAH SCIENCE TECHNO PARK -ADB', polaAkun: 'STP / ADB Prime Step', jenis: 'penerimaan' },
  12: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'HIBAH PUAPT', polaAkun: 'PUAPT', jenis: 'penerimaan' },
  13: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'EQUITY', polaAkun: 'Equity Project', jenis: 'penerimaan' },
  14: { kelompokInduk: 'Dana Pemerintah ➔ Penerimaan Pemerintah lainnya', posUsulan: 'Pendamping Program Revitalisasi PTN 2024', polaAkun: 'Revitalisasi PTN', jenis: 'penerimaan' },

  // PENERIMAAN DANA MASYARAKAT
  15: { kelompokInduk: 'Jumlah Penerimaan Dana Masyarakat', posUsulan: 'Sub Total Kelompok Dana Masyarakat', polaAkun: '41*, 42* (Pendidikan & Non Pendidikan)', jenis: 'penerimaan' },
  16: { kelompokInduk: 'Jumlah Penerimaan Dana Masyarakat', posUsulan: 'Penerimaan Pendidikan (Sub Total Pos)', polaAkun: '41* (Pendidikan Utama & Lainnya)', jenis: 'penerimaan' },
  17: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Pendidikan', posUsulan: 'Penerimaan Pendidikan Utama', polaAkun: '411* (UKT, S1, S2, S3, Vokasi, Profesi)', keterangan: 'Penerimaan SPP/UKT mahasiswa seluruh jenjang', jenis: 'penerimaan' },
  18: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Pendidikan', posUsulan: 'Penerimaan Pendidikan Lainnya', polaAkun: '412* (Seleksi, Registrasi, Admisi)', keterangan: 'Biaya ujian masuk, admisi, wisuda, sertifikasi', jenis: 'penerimaan' },
  19: { kelompokInduk: 'Jumlah Penerimaan Dana Masyarakat', posUsulan: 'Penerimaan Non Pendidikan (Sub Total Pos)', polaAkun: '42* (Hibah, Jasa, Aset, Kerjasama, UPU)', jenis: 'penerimaan' },
  20: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Non Pendidikan', posUsulan: 'Penerimaan Hibah dan Donasi', polaAkun: '421* (Hibah, Donasi, Sumbangan)', jenis: 'penerimaan' },
  21: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Non Pendidikan', posUsulan: 'Penerimaan Jasa Universitas', polaAkun: '423* (Jasa Layanan, Konsultasi, Uji Lab)', jenis: 'penerimaan' },
  22: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Non Pendidikan', posUsulan: 'Penerimaan Pemanfaatan Aset', polaAkun: '424* (Sewa Gedung, Lahan, Fasilitas)', jenis: 'penerimaan' },
  23: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Non Pendidikan', posUsulan: 'Penerimaan Kerjasama', polaAkun: '425* (Kerjasama Non-Pemerintah, BUMN, Swasta)', jenis: 'penerimaan' },
  24: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Non Pendidikan', posUsulan: 'Penerimaan dari UPU', polaAkun: '426* (Unit Pengelola Usaha / Holding)', jenis: 'penerimaan' },
  25: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'JUMLAH PENERIMAAN', keterangan: 'Total Dana Pemerintah + Total Dana Masyarakat', jenis: 'summary' },

  // PENGELUARAN / BELANJA
  26: { kelompokInduk: 'PENGELUARAN', posUsulan: 'Header Pengeluaran Belanja', jenis: 'pengeluaran' },
  27: { kelompokInduk: 'I. Belanja Operasional', posUsulan: 'Belanja Pegawai', polaAkun: '51* (Gaji, Honor, Remunerasi, Lembur)', keterangan: 'Belanja gaji dan kesejahteraan pegawai PTNBH & Non PNS', jenis: 'pengeluaran' },
  28: { kelompokInduk: 'I. Belanja Operasional', posUsulan: 'Belanja Barang & Jasa', polaAkun: '52* (Bahan Habis Pakai, Konsumsi, ATK, Daya & Jasa)', keterangan: 'Operasional kegiatan, perlengkapan, konsumsi, dan langganan jasa', jenis: 'pengeluaran' },
  29: { kelompokInduk: 'I. Belanja Operasional', posUsulan: 'Belanja Perbaikan dan Pemeliharaan', polaAkun: '53* (Gedung, Bangunan, Peralatan, Kendaraan)', keterangan: 'Perawatan rutin sarana prasarana unit kerja', jenis: 'pengeluaran' },
  30: { kelompokInduk: 'I. Belanja Operasional', posUsulan: 'Belanja Perjalanan', polaAkun: '54* (Perjalanan Dinas Dalam & Luar Negeri)', keterangan: 'Transportasi, uang harian, dan akomodasi dinas', jenis: 'pengeluaran' },
  31: { kelompokInduk: 'II. Belanja Modal / Investasi', posUsulan: 'Belanja Modal', polaAkun: '55* (Aset Tetap, Gedung, Mesin, Kendaraan)', keterangan: 'Pengadaan aset tetap berumur ekonomis lebih dari 1 tahun', jenis: 'pengeluaran' },
  32: { kelompokInduk: 'III. Program Strategis & Khusus', posUsulan: 'Belanja SCIENCE TECHNO PARK - ADB', polaAkun: 'STP / ADB / Prime Step', keterangan: 'Alokasi khusus pengembangan fasilitas riset & inovasi STP', jenis: 'pengeluaran' },
  33: { kelompokInduk: 'III. Program Strategis & Khusus', posUsulan: 'Belanja PUAPT', polaAkun: 'PUAPT', jenis: 'pengeluaran' },
  34: { kelompokInduk: 'III. Program Strategis & Khusus', posUsulan: 'Belanja Pendamping Program Revitalisasi PTN 2024', polaAkun: 'Revitalisasi PTN', jenis: 'pengeluaran' },
  35: { kelompokInduk: 'III. Program Strategis & Khusus', posUsulan: 'Belanja EQUITY', polaAkun: 'EQUITY', jenis: 'pengeluaran' },
  36: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'JUMLAH PENGELUARAN', keterangan: 'Total Belanja Operasional + Belanja Modal + Program Khusus', jenis: 'summary' },

  // POS PENERIMAAN LAINNYA / SILPA
  37: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', jenis: 'summary' },
  38: { kelompokInduk: 'Penerimaan Lainnya / Surplus TA Lalu', posUsulan: 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', polaAkun: 'Surplus Kas TA Lalu & Transfer Antar Unit', keterangan: 'Menampung sisa saldo lebih perhitungan tahun anggaran sebelumnya', jenis: 'penerimaan' },
  39: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'SURPLUS/(DEFISIT) ANGGARAN', keterangan: 'Selisih Penerimaan dikurangi Total Pengeluaran', jenis: 'summary' },

  // PROFIL 2027 POS
  42: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Non Pendidikan', posUsulan: 'Pinjaman Dalam Negeri', polaAkun: 'Pinjaman bank / dalam negeri', jenis: 'penerimaan' },
  43: { kelompokInduk: 'Dana Masyarakat ➔ Penerimaan Non Pendidikan', posUsulan: 'cadangana', polaAkun: 'Dana cadangan', jenis: 'penerimaan' },
  45: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'Surplus/(defisit) operasional', keterangan: 'Penerimaan dikurangi Belanja Operasional', jenis: 'summary' },
  46: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'Rencana penggunaan luncuran', keterangan: 'Alokasi penggunaan saldo luncuran anggaran', jenis: 'summary' },
  47: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'Surplus/(defisit) anggaran setalah luncuran', keterangan: 'Surplus operasional + luncuran - belanja modal', jenis: 'summary' },
  48: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'Sisa lebih perhitungan tahun sebelumnya', jenis: 'summary' },
  49: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'Akumulasi sisa lebih perhitungan dari tahun sebelumnya', jenis: 'summary' },
  50: { kelompokInduk: 'TOTAL RINGKASAN', posUsulan: 'Penambahan dana abadi', jenis: 'summary' }
};

interface KomparasiSourceTooltipProps {
  akunId: number;
  label: string;
  className?: string;
}

export default function KomparasiSourceTooltip({
  akunId,
  label,
  className = ''
}: KomparasiSourceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const info = KOMPARASI_SOURCE_MAP[akunId];

  // Jangan render jika pos dummy separator
  if (label.toLowerCase().includes('start profil') || akunId === 44) return null;

  const updateCoordinates = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 360; // px
    let left = rect.left;
    let top = rect.bottom + 6;

    if (left + tooltipWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - tooltipWidth - 16);
    }
    const estimatedHeight = 160;
    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - estimatedHeight - 6);
    }
    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    updateCoordinates();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const isPenerimaan = info?.jenis === 'penerimaan';
  const isPengeluaran = info?.jenis === 'pengeluaran';

  const badgeColor = isPenerimaan
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : isPengeluaran
    ? 'bg-blue-50 text-blue-800 border-blue-200'
    : 'bg-purple-50 text-purple-800 border-purple-200';

  const dotColor = isPenerimaan ? 'bg-emerald-500' : isPengeluaran ? 'bg-blue-500' : 'bg-purple-500';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => { e.stopPropagation(); updateCoordinates(); setIsOpen(prev => !prev); }}
        className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[10px] font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
          isOpen
            ? 'bg-indigo-600 text-white ring-2 ring-offset-1 ring-indigo-400'
            : 'bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-700'
        }`}
        title={`Sumber kelompok pos "${label}" di Proposal RKAT (/rka/laporan)`}
      >
        <Info size={10} strokeWidth={2.5} />
      </button>

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={() => {
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 999999
          }}
          className="w-[340px] sm:w-[380px] bg-white rounded-xl shadow-xl border border-slate-200 p-3 text-slate-800 animate-in fade-in zoom-in-95 duration-100 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Sumber Kelompok Proposal RKAT
              </span>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
              {isPenerimaan ? 'Penerimaan' : isPengeluaran ? 'Pengeluaran' : 'Ringkasan'}
            </span>
          </div>

          {/* Pos Name */}
          <div className="text-xs font-black text-slate-900 mb-2 truncate" title={label}>
            {label}
          </div>

          {/* Source Box */}
          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 space-y-1.5 text-[11px]">
            <div className="flex items-start gap-1.5">
              <span className="text-slate-400 font-medium shrink-0">Kelompok:</span>
              <span className="font-bold text-slate-900 leading-tight">
                {info?.kelompokInduk || 'Format Standar Laporan'}
              </span>
            </div>

            <div className="flex items-start gap-1.5">
              <span className="text-slate-400 font-medium shrink-0">Pos Usulan:</span>
              <span className="font-semibold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-indigo-200 inline-block shadow-2xs">
                {info?.posUsulan || label}
              </span>
            </div>

            {info?.polaAkun && (
              <div className="flex items-start gap-1.5 pt-0.5">
                <span className="text-slate-400 font-medium shrink-0">Pola MAK:</span>
                <span className="font-mono font-bold text-slate-800 text-[10px] bg-slate-200/70 px-1.5 py-0.2 rounded">
                  {info.polaAkun}
                </span>
              </div>
            )}

            {info?.keterangan && (
              <div className="text-[10px] text-slate-500 italic pt-0.5 border-t border-slate-200/50">
                {info.keterangan}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
