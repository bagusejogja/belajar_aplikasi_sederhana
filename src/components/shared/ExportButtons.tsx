'use client';

import React from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  Loader2 
} from 'lucide-react';

export interface ExportButtonsProps {
  onExportExcel?: () => void | Promise<void>;
  onExportWord?: () => void | Promise<void>;
  onExportPdf?: () => void | Promise<void>;
  isExportingExcel?: boolean;
  isExportingWord?: boolean;
  isExportingPdf?: boolean;
  excelLabel?: string;
  wordLabel?: string;
  pdfLabel?: string;
  size?: 'sm' | 'md';
}

export default function ExportButtons({
  onExportExcel,
  onExportWord,
  onExportPdf,
  isExportingExcel = false,
  isExportingWord = false,
  isExportingPdf = false,
  excelLabel = 'Export Excel',
  wordLabel = 'Export Word',
  pdfLabel = 'Cetak / PDF',
  size = 'sm',
}: ExportButtonsProps) {
  const sizeClasses = size === 'sm' 
    ? 'h-8 px-3 text-xs' 
    : 'h-9 px-3.5 text-xs';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Tombol Export Excel (Standar Emerald) */}
      {onExportExcel && (
        <button
          type="button"
          onClick={onExportExcel}
          disabled={isExportingExcel}
          className={`flex items-center gap-1.5 font-bold rounded-xl border border-emerald-300 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 active:scale-95 transition-all shadow-2xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClasses}`}
          title="Unduh data dalam format Excel (.xlsx)"
        >
          {isExportingExcel ? (
            <Loader2 size={14} className="animate-spin text-emerald-700" />
          ) : (
            <FileSpreadsheet size={14} className="text-emerald-700" />
          )}
          <span>{isExportingExcel ? 'Mengekspor...' : excelLabel}</span>
        </button>
      )}

      {/* Tombol Export Word (Standar Blue) */}
      {onExportWord && (
        <button
          type="button"
          onClick={onExportWord}
          disabled={isExportingWord}
          className={`flex items-center gap-1.5 font-bold rounded-xl border border-blue-300 bg-blue-50/90 text-blue-800 hover:bg-blue-100 hover:border-blue-400 active:scale-95 transition-all shadow-2xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClasses}`}
          title="Unduh laporan dalam format Word (.docx)"
        >
          {isExportingWord ? (
            <Loader2 size={14} className="animate-spin text-blue-700" />
          ) : (
            <FileText size={14} className="text-blue-700" />
          )}
          <span>{isExportingWord ? 'Menyiapkan...' : wordLabel}</span>
        </button>
      )}

      {/* Tombol Cetak / PDF (Standar Rose) */}
      {onExportPdf && (
        <button
          type="button"
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className={`flex items-center gap-1.5 font-bold rounded-xl border border-rose-300 bg-rose-50/90 text-rose-800 hover:bg-rose-100 hover:border-rose-400 active:scale-95 transition-all shadow-2xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${sizeClasses}`}
          title="Cetak atau unduh dokumen PDF"
        >
          {isExportingPdf ? (
            <Loader2 size={14} className="animate-spin text-rose-700" />
          ) : (
            <Printer size={14} className="text-rose-700" />
          )}
          <span>{isExportingPdf ? 'Mencetak...' : pdfLabel}</span>
        </button>
      )}
    </div>
  );
}
