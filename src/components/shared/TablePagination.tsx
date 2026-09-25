'use client';

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  isLoading?: boolean;
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  isLoading = false,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);

  const canGoPrev = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < safeTotalPages && !isLoading;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-200/90 rounded-2xl shadow-2xs mt-3 select-none">
      {/* Kiri: Baris Per Halaman */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        {onItemsPerPageChange && (
          <>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Tampilkan:
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              disabled={isLoading}
              className="h-8 px-2.5 py-1 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} baris
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Tengah: Ringkasan Jumlah Data */}
      <div className="text-xs text-gray-500 font-medium">
        Menampilkan{' '}
        <span className="font-bold text-gray-800 font-mono">
          {startItem.toLocaleString('id-ID')}
        </span>{' '}
        -{' '}
        <span className="font-bold text-gray-800 font-mono">
          {endItem.toLocaleString('id-ID')}
        </span>{' '}
        dari{' '}
        <span className="font-bold text-blue-600 font-mono">
          {totalItems.toLocaleString('id-ID')}
        </span>{' '}
        data
      </div>

      {/* Kanan: Navigasi Tombol Pagination */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          title="Halaman Pertama"
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          title="Halaman Sebelumnya"
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Status Indikator Halaman */}
        <div className="px-3 py-1 text-xs font-bold text-gray-700 bg-slate-50 border border-gray-200 rounded-lg">
          Halaman <span className="text-blue-600 font-black">{currentPage}</span> / {safeTotalPages}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          title="Halaman Selanjutnya"
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={!canGoNext}
          title="Halaman Terakhir"
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
}
