'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, X, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { getSafeFileUrl } from '@/lib/fileHelper';

export interface GalleryItem {
  src: string;
  original: string;
  label: string;
  isFolder?: boolean;
}

export interface GalleryLightboxProps {
  isOpen: boolean;
  items: GalleryItem[];
  currentIndex?: number;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export const getSafeImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com')) {
    return `/api/image-cors?url=${encodeURIComponent(trimmed)}`;
  }
  return getSafeFileUrl(trimmed) || trimmed;
};

export default function GalleryLightbox({
  isOpen,
  items = [],
  currentIndex: controlledIndex = 0,
  title = 'Pratinjau Dokumen Lampiran',
  subtitle,
  onClose,
  onIndexChange,
}: GalleryLightboxProps) {
  const [internalIndex, setInternalIndex] = useState(controlledIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  useEffect(() => {
    setInternalIndex(controlledIndex);
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [controlledIndex, isOpen]);

  const changeIndex = useCallback((nextIdx: number) => {
    setInternalIndex(nextIdx);
    if (onIndexChange) onIndexChange(nextIdx);
    setZoomLevel(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, [onIndexChange]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    const nextIdx = (activeIndex + 1) % items.length;
    changeIndex(nextIdx);
  }, [activeIndex, items.length, changeIndex]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    const prevIdx = (activeIndex - 1 + items.length) % items.length;
    changeIndex(prevIdx);
  }, [activeIndex, items.length, changeIndex]);

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

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Drag & Pan handlers
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

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[activeIndex] || items[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-slate-950/92 flex flex-col justify-between overflow-hidden select-none backdrop-blur-md"
        onClick={onClose}
      >
        {/* TOP TOOLBAR */}
        <div
          className="p-3 px-5 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white shrink-0 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Kiri: Kategori & Info Judul */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/15 border border-white/20 text-white shrink-0">
              {currentItem.label}
            </span>
            <div className="hidden sm:block truncate">
              <h4 className="text-xs font-bold truncate max-w-sm lg:max-w-md text-white">
                {title}
              </h4>
              {subtitle && (
                <p className="text-[10px] text-white/70 font-mono mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Tengah: Indikator Nomor Foto */}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15 text-xs font-bold shrink-0">
            <span className="text-amber-300 font-mono">Foto {activeIndex + 1}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/80 font-mono">{items.length}</span>
          </div>

          {/* Kanan: Tombol Kontrol */}
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
              href={currentItem.src || getSafeImageUrl(currentItem.original)}
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
              onClick={onClose}
              title="Tutup Galeri (Esc)"
              className="p-2 bg-white/10 hover:bg-rose-600 rounded-xl transition-colors ml-1.5 cursor-pointer text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MAIN IMAGE AREA */}
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
          {items.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              title="Foto Sebelumnya (Panah Kiri)"
              className="absolute left-4 md:left-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md shadow-2xl"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* Gambar dengan Transform Zoom, Rotate, & Drag */}
          <div className="relative flex items-center justify-center w-full h-full p-4 overflow-hidden pointer-events-none">
            <img
              key={`${activeIndex}`}
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
                willChange: 'transform',
              }}
              className="object-contain rounded-xl shadow-2xl pointer-events-auto select-none"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('/api/image-cors') && currentItem.original.startsWith('http')) {
                  target.src = `/api/image-cors?url=${encodeURIComponent(currentItem.original)}`;
                  return;
                }
                target.src =
                  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png';
              }}
            />
          </div>

          {/* Tombol Next */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              title="Foto Berikutnya (Panah Kanan)"
              className="absolute right-4 md:right-6 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md shadow-2xl"
            >
              <ChevronRight size={26} />
            </button>
          )}
        </div>

        {/* BOTTOM THUMBNAIL STRIP */}
        {items.length > 1 && (
          <div
            className="p-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto shrink-0 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => changeIndex(idx)}
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
    </AnimatePresence>
  );
}
