'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Archive, Folder, Calendar, FileText, Globe, FileSpreadsheet, 
  Image as ImageIcon, File, ExternalLink, Search, Filter, 
  Share2, Check, Copy, Table, LayoutGrid, Clock, ChevronDown, 
  ChevronUp, Sparkles, Download, Layers, ShieldCheck, Info,
  TrendingUp, CheckCircle2, AlertCircle, ArrowUpRight, Hash, X,
  FolderOpen, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ArsipPublicViewProps {
  initialCategories?: any[];
  initialArchives?: any[];
  isEmbedded?: boolean; // If used inside dashboard as preview
  onBackToDashboard?: () => void;
}

// =========================================================================
// AUTOCOMPLETE COMBOBOX KHUSUS FOLDER / KEGIATAN
// =========================================================================
function CategoryAutocomplete({
  categories,
  selectedId,
  onSelect,
  placeholder = "Ketik atau pilih kegiatan..."
}: {
  categories: any[];
  selectedId: number | 'ALL';
  onSelect: (id: number | 'ALL') => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCat = selectedId === 'ALL' ? null : categories.find(c => c.id === selectedId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return categories;
    const q = query.toLowerCase();
    return categories.filter(c => 
      (c.nama_kegiatan || '').toLowerCase().includes(q) ||
      (c.deskripsi || '').toLowerCase().includes(q)
    );
  }, [categories, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev + 1) % (filtered.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev - 1 + filtered.length + 1) % (filtered.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex === 0) {
        onSelect('ALL');
      } else {
        const item = filtered[highlightIndex - 1];
        if (item) onSelect(item.id);
      }
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-80 md:w-96">
      <div 
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`min-h-[42px] px-3.5 bg-white border rounded-2xl flex items-center justify-between gap-2 cursor-pointer shadow-xs transition-all ${
          isOpen ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-md' : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Folder size={15} />
          </div>
          <span className="text-xs font-bold text-slate-800 truncate">
            {selectedCat ? selectedCat.nama_kegiatan : `Semua Folder Kegiatan (${categories.length})`}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          {selectedId !== 'ALL' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect('ALL');
                setQuery('');
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Reset ke Semua Kegiatan"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full sm:w-[420px] max-w-[94vw] bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-950/15 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3 border-b border-slate-100 bg-slate-50/60">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full h-9 pl-9 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {/* Opsi: Semua Folder Kegiatan */}
            <div
              onClick={() => {
                onSelect('ALL');
                setIsOpen(false);
                setQuery('');
              }}
              className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between text-xs ${
                selectedId === 'ALL'
                  ? 'bg-indigo-600 text-white font-black shadow-sm shadow-indigo-600/20'
                  : highlightIndex === 0
                  ? 'bg-slate-100 font-bold text-slate-900'
                  : 'hover:bg-slate-50 text-slate-700 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Folder size={15} className={selectedId === 'ALL' ? 'text-white' : 'text-indigo-600'} />
                <span>Semua Folder Kegiatan</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                selectedId === 'ALL' ? 'bg-indigo-700/60 border-indigo-400 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {categories.length} Program
              </span>
            </div>

            {/* List Matching Categories */}
            {filtered.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">Kegiatan tidak ditemukan</p>
                <p className="text-[11px] text-slate-400">Coba kata kunci lain atau pilih dari daftar</p>
              </div>
            ) : (
              filtered.map((cat, idx) => {
                const isSelected = selectedId === cat.id;
                const isHighlighted = highlightIndex === idx + 1;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      onSelect(cat.id);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all space-y-1 text-xs border ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-200/90 text-indigo-950 font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 border-slate-200/60 text-slate-900'
                        : 'bg-white border-transparent hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs truncate">{cat.nama_kegiatan}</span>
                      {isSelected ? (
                        <Check size={14} className="text-indigo-600 shrink-0" />
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400 uppercase">Pilih</span>
                      )}
                    </div>
                    {cat.deskripsi && (
                      <p className="text-[11px] text-slate-500 font-normal line-clamp-1 leading-snug">
                        {cat.deskripsi}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// KOMPONEN UTAMA ARSIP PUBLIC VIEW
// =========================================================================
export default function ArsipPublicView({
  initialCategories,
  initialArchives,
  isEmbedded = false,
  onBackToDashboard
}: ArsipPublicViewProps) {
  const [categories, setCategories] = useState<any[]>(initialCategories || []);
  const [archives, setArchives] = useState<any[]>(initialArchives || []);
  const [loading, setLoading] = useState(!initialCategories || !initialArchives);

  // Layout View Mode: 'timeline' (Default 3D Staggered) | 'cards' | 'matrix'
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'matrix'>('timeline');
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCatId, setFilterCatId] = useState<number | 'ALL'>('ALL');
  const [filterYear, setFilterYear] = useState<number | 'ALL'>('ALL');

  // Expanded States for Cards (DEFAULT COLLAPSED SESUAI PERMINTAAN)
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [activeCardYear, setActiveCardYear] = useState<Record<number, number | 'ALL'>>({});

  // Share Dialog State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch data if not passed
  useEffect(() => {
    if (!initialCategories || !initialArchives) {
      fetchPublicData();
    }
  }, [initialCategories, initialArchives]);

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/arsip/public');
      const json = await res.json();
      if (json.success) {
        setCategories(json.categories || []);
        setArchives(json.archives || []);

        const defaultYears: Record<number, number | 'ALL'> = {};
        (json.categories || []).forEach((cat: any) => {
          defaultYears[cat.id] = 'ALL';
        });

        setActiveCardYear(defaultYears);
        // Default collapse: Tidak ada card yang dibuka secara otomatis
        setExpandedCards([]);
      } else {
        toast.error('Gagal memuat arsip publik: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error memuat data: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute Years Available across all archives
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(archives.map(a => a.tahun))).filter(Boolean);
    return years.sort((a, b) => b - a);
  }, [archives]);

  // Compute File Metadata & Styling Helper
  const getFileMeta = (file: { name: string; url: string; type?: string }) => {
    const url = (file.url || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const cleanUrl = url.split('?')[0];
    const ext = (cleanUrl.split('.').pop() || name.split('.').pop() || '').toLowerCase();

    if (file.type === 'link' || url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('sharepoint.com') || url.includes('onedrive')) {
      if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        return {
          type: 'gdrive',
          label: 'Google Drive',
          badgeText: 'GDRIVE',
          icon: <Globe size={16} className="text-amber-600 shrink-0" />,
          accentBg: 'bg-amber-500/10 text-amber-700 border-amber-200/80',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
        };
      }
      return {
        type: 'cloud',
        label: 'Cloud Link',
        badgeText: 'CLOUD',
        icon: <Globe size={16} className="text-sky-600 shrink-0" />,
        accentBg: 'bg-sky-500/10 text-sky-700 border-sky-200/80',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
      };
    }

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return {
        type: 'excel',
        label: 'Spreadsheet Excel',
        badgeText: 'EXCEL',
        icon: <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />,
        accentBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200/80',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    }

    if (['pdf'].includes(ext)) {
      return {
        type: 'pdf',
        label: 'Dokumen PDF',
        badgeText: 'PDF',
        icon: <FileText size={16} className="text-rose-600 shrink-0" />,
        accentBg: 'bg-rose-500/10 text-rose-700 border-rose-200/80',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
      };
    }

    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return {
        type: 'image',
        label: 'Gambar / Foto',
        badgeText: 'FOTO',
        icon: <ImageIcon size={16} className="text-purple-600 shrink-0" />,
        accentBg: 'bg-purple-500/10 text-purple-700 border-purple-200/80',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
      };
    }

    if (['doc', 'docx'].includes(ext)) {
      return {
        type: 'word',
        label: 'Dokumen Word',
        badgeText: 'WORD',
        icon: <FileText size={16} className="text-blue-600 shrink-0" />,
        accentBg: 'bg-blue-500/10 text-blue-700 border-blue-200/80',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
      };
    }

    return {
      type: 'other',
      label: ext.toUpperCase() || 'Berkas',
      badgeText: ext.toUpperCase() || 'FILE',
      icon: <File size={16} className="text-indigo-600 shrink-0" />,
      accentBg: 'bg-indigo-500/10 text-indigo-700 border-indigo-200/80',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    };
  };

  // Overall Statistics Computation
  const stats = useMemo(() => {
    let totalFiles = 0;
    let totalPhasesCount = 0;
    let filledPhasesCount = 0;

    archives.forEach(a => {
      const phases = typeof a.fase_dokumen === 'string' ? JSON.parse(a.fase_dokumen) : (a.fase_dokumen || []);
      phases.forEach((p: any) => {
        totalPhasesCount++;
        const count = (p.files || []).length;
        totalFiles += count;
        if (count > 0) filledPhasesCount++;
      });
    });

    const completionRate = totalPhasesCount > 0 ? Math.round((filledPhasesCount / totalPhasesCount) * 100) : 0;

    return {
      totalCategories: categories.length,
      totalYears: availableYears.length,
      totalFiles,
      completionRate
    };
  }, [categories, archives, availableYears]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    let list = categories;
    if (filterCatId !== 'ALL') {
      list = list.filter(c => c.id === filterCatId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const inTitle = (c.nama_kegiatan || '').toLowerCase().includes(q);
        const inDesc = (c.deskripsi || '').toLowerCase().includes(q);
        const catArcs = archives.filter(a => a.kategori_id === c.id);
        const inFiles = catArcs.some(a => {
          const phases = typeof a.fase_dokumen === 'string' ? JSON.parse(a.fase_dokumen) : (a.fase_dokumen || []);
          return phases.some((p: any) => {
            const pName = (p.nama_fase || '').toLowerCase().includes(q);
            const pNote = (p.catatan || '').toLowerCase().includes(q);
            const fMatch = (p.files || []).some((f: any) => (f.name || '').toLowerCase().includes(q));
            return pName || pNote || fMatch;
          });
        });
        return inTitle || inDesc || inFiles;
      });
    }
    return list;
  }, [categories, archives, filterCatId, searchQuery]);

  // Card Accordion Toggle
  const toggleCard = (catId: number) => {
    setExpandedCards(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const expandAll = () => {
    setExpandedCards(filteredCategories.map(c => c.id));
  };

  const collapseAll = () => {
    setExpandedCards([]);
  };

  // Copy Link Helper
  const handleCopyPublicLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/share/arsip-kegiatan` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast.success('Tautan portal arsip publik berhasil disalin!');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleCopyFileLink = (url: string, name: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(`Tautan berkas "${name}" berhasil disalin!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-32 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* 1. TOP HEADER BRANDING */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-600 text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50">
              <Archive size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  PORTAL RESMI ARSIP KEGIATAN
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Akses Terbuka &amp; Transparan
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                Dokumentasi &amp; Tahapan Kegiatan Tahunan
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isEmbedded && onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="h-9 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span>← Kembali ke Pengelola</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              <Share2 size={14} />
              <span>Bagikan Tautan</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO BANNER WITH REPLACED STATS CARDS */}
      <div className="bg-gradient-to-b from-white via-indigo-50/25 to-[#f8fafc] border-b border-slate-200/80 pt-8 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Alur Tahapan, Berkas Pendukung &amp; SPJ Kegiatan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Jelajahi alur terstruktur setiap kegiatan tahunan mulai dari perencanaan, pelaksanaan, pertanggungjawaban keuangan, laporan akhir, hingga dokumentasi lengkap.
            </p>
          </div>

          {/* Metric Stat Cards (Rentang Tahun & Kelengkapan Tahap diganti informasi Penyimpanan Cloud & Keamanan Validasi) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: Program Kegiatan */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                <Folder size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program Kegiatan</p>
                <p className="text-lg font-black text-slate-900">{stats.totalCategories} Program</p>
                <p className="text-[10px] text-slate-500 font-medium">Folder Terstruktur Rapi</p>
              </div>
            </div>

            {/* Card 2: Pengganti "Rentang Tahun" -> Penyimpanan Terpadu & Cloud */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penyimpanan Terpadu</p>
                <p className="text-lg font-black text-slate-900">Multi-Cloud &amp; GDrive</p>
                <p className="text-[10px] text-slate-500 font-medium">Tersinkronisasi &amp; Akses 24/7</p>
              </div>
            </div>

            {/* Card 3: Total Lampiran Dokumen */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Lampiran</p>
                <p className="text-lg font-black text-slate-900">{stats.totalFiles} Dokumen Digital</p>
                <p className="text-[10px] text-slate-500 font-medium">PDF, Excel, Word &amp; Foto</p>
              </div>
            </div>

            {/* Card 4: Pengganti "Kelengkapan Tahap" -> Validitas & Akses Publik */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keamanan &amp; Validitas</p>
                <p className="text-lg font-black text-slate-900">100% Terverifikasi</p>
                <p className="text-[10px] text-emerald-600 font-bold">Akses Resmi Bebas Login</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 3. TOOLBAR KONTROL & FILTER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-5 z-20 relative">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 space-y-4">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Live Global Search Box */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kata kunci kegiatan, nomor SK, nama berkas, atau catatan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-slate-50/80 border border-slate-200 rounded-2xl pl-10 pr-10 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Layout View Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'timeline' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={14} />
                <span>Garis Waktu 3D</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid size={14} />
                <span>Kartu Ringkas</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'matrix' 
                    ? 'bg-white text-indigo-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table size={14} />
                <span>Matriks Sanding</span>
              </button>
            </div>

          </div>

          {/* Baris Filter: Autocomplete Kegiatan, Filter Tahun & Toggle Buka/Tutup Semua */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 mr-1">
                <Filter size={11} /> Filter:
              </span>

              {/* 1. FILTER KEGIATAN DENGAN AUTOCOMPLETE */}
              <CategoryAutocomplete
                categories={categories}
                selectedId={filterCatId}
                onSelect={(id) => setFilterCatId(id)}
                placeholder="Ketik nama kegiatan..."
              />

              {/* 2. FILTER TAHUN ANGGARAN */}
              <div className="relative">
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value === 'ALL' ? 'ALL' : parseInt(e.target.value))}
                  className="h-[42px] px-3.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 cursor-pointer shadow-xs"
                >
                  <option value="ALL">Semua Tahun Anggaran ({availableYears.length})</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>Tahun {y}</option>
                  ))}
                </select>
              </div>

              {/* Toggle Buka Semua / Tutup Semua Folder */}
              <div className="flex items-center gap-1 pl-1">
                {expandedCards.length === filteredCategories.length && filteredCategories.length > 0 ? (
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="h-8 px-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <EyeOff size={12} />
                    <span>Tutup Semua</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={expandAll}
                    className="h-8 px-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Buka Semua</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tombol Reset Jika Sedang Terfilter */}
            {(searchQuery || filterCatId !== 'ALL' || filterYear !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCatId('ALL');
                  setFilterYear('ALL');
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer py-1"
              >
                <X size={12} />
                <span>Bersihkan Filter</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-xs text-slate-500">Memuat Repositori Arsip Publik...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Folder size={28} />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">Tidak ada arsip kegiatan yang sesuai filter</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.</p>
            </div>
          </div>
        ) : viewMode === 'timeline' ? (
          
          /* ========================================================================= */
          /* VIEW 1: GARIS WAKTU 3D INTERAKTIF (STAGGERED CENTER TIMELINE ZIG-ZAG)     */
          /* ========================================================================= */
          <div className="space-y-6">
            {filteredCategories.map(cat => {
              const isExpanded = expandedCards.includes(cat.id);
              const catArcs = archives.filter(a => a.kategori_id === cat.id);
              const availableCatYears = Array.from(new Set(catArcs.map(a => a.tahun))).sort((a, b) => b - a);
              const rawPhases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);
              
              // Total files across all years for this category
              const totalFilesInCat = catArcs.reduce((acc: number, a: any) => {
                const phases = typeof a.fase_dokumen === 'string' ? JSON.parse(a.fase_dokumen) : (a.fase_dokumen || []);
                return acc + phases.reduce((pAcc: number, p: any) => pAcc + (p.files?.length || 0), 0);
              }, 0);

              // Tentukan tahun yang akan ditampilkan ke bawah
              const activeSelectedYear = activeCardYear[cat.id] ?? 'ALL';
              let yearsToRender: number[] = [];

              if (filterYear !== 'ALL') {
                yearsToRender = availableCatYears.filter(y => y === filterYear);
              } else if (activeSelectedYear === 'ALL') {
                yearsToRender = availableCatYears.length > 0 ? availableCatYears : [new Date().getFullYear()];
              } else {
                yearsToRender = [activeSelectedYear as number];
              }

              return (
                <div 
                  key={cat.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Category Summary Card Header (Klik untuk Buka/Tutup Detail Alur) */}
                  <div 
                    onClick={() => toggleCard(cat.id)}
                    className="p-5 sm:p-6 cursor-pointer bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-600/20 shrink-0 mt-0.5">
                        <Folder size={24} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {cat.nama_kegiatan}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            {rawPhases.length} Tahapan Alur
                          </span>
                        </div>
                        {cat.deskripsi && (
                          <p className="text-xs text-slate-500 font-medium max-w-3xl leading-relaxed line-clamp-2">
                            {cat.deskripsi}
                          </p>
                        )}
                        {/* Quick Years Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Arsip:</span>
                          {availableCatYears.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Belum ada arsip tahunan</span>
                          ) : (
                            availableCatYears.map(y => (
                              <span key={y} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {y}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={e => e.stopPropagation()}>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dokumen Digital</p>
                        <p className="text-xs font-black text-slate-800">
                          {totalFilesInCat} Lampiran Tersedia
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCard(cat.id)}
                        className={`h-9 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                          isExpanded 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                        }`}
                      >
                        <span>{isExpanded ? 'Tutup Detail' : 'Buka Detail Alur'}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* KONTEN EXPANDED: DETAIL PER TAHUN DENGAN TIMELINE 3D SOFT STAGGERED */}
                  {isExpanded && (
                    <div className="p-5 sm:p-8 bg-slate-50/40 space-y-10 animate-in fade-in duration-200">
                      
                      {/* Year Selector Tabs Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Pilihan Tampilan Tahun:</span>
                          <button
                            type="button"
                            onClick={() => setActiveCardYear(prev => ({ ...prev, [cat.id]: 'ALL' }))}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              activeSelectedYear === 'ALL'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            Semua Tahun ↓
                          </button>

                          {availableCatYears.map(y => {
                            const isYearActive = activeSelectedYear === y;
                            return (
                              <button
                                key={y}
                                type="button"
                                onClick={() => setActiveCardYear(prev => ({ ...prev, [cat.id]: y }))}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                  isYearActive
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {y}
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-[11px] font-bold text-slate-600 shrink-0 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Alur Bertahap Zig-Zag Terintegrasi</span>
                        </div>
                      </div>

                      {/* DETAIL PER TAHUN DISUSUN KE BAWAH */}
                      <div className="space-y-16">
                        {yearsToRender.map(currentYear => {
                          const activeArc = catArcs.find(a => a.tahun === currentYear);
                          const arcPhases = activeArc ? (typeof activeArc.fase_dokumen === 'string' ? JSON.parse(activeArc.fase_dokumen) : (activeArc.fase_dokumen || [])) : [];

                          const combinedPhases: any[] = rawPhases.map((tpl: any, idx: number) => {
                            const phaseName = typeof tpl === 'string' ? tpl : tpl.nama_fase;
                            const globalNote = typeof tpl === 'string' ? '' : (tpl.catatan_global || '');
                            const arcData = arcPhases.find((f: any) => f.nama_fase?.trim() === phaseName?.trim()) || arcPhases[idx] || { files: [], catatan: '' };

                            return {
                              nama_fase: phaseName,
                              catatan_global: globalNote,
                              catatan_tahun: arcData.catatan || '',
                              files: arcData.files || [],
                              originalIndex: idx
                            };
                          });

                          const totalFilesThisYear = combinedPhases.reduce((acc: number, p: any) => acc + p.files.length, 0);
                          const completedPhasesThisYear = combinedPhases.filter((p: any) => p.files.length > 0).length;

                          // Bagi tahapan menjadi Ganjil (Kiri) dan Genap (Kanan) untuk staggered masonry
                          const oddPhases = combinedPhases.filter((_, i) => i % 2 === 0);  // Tahap 1, 3, 5...
                          const evenPhases = combinedPhases.filter((_, i) => i % 2 !== 0); // Tahap 2, 4, 6...

                          // Helper Render Card Tahapan
                          const renderPhaseCard = (phase: any, isOddColumn: boolean) => {
                            const pNum = phase.originalIndex + 1;
                            const hasFiles = phase.files.length > 0;

                            return (
                              <div key={phase.originalIndex} className="relative group">
                                
                                {/* KONEKTOR HORIZONTAL & NODE NOMOR DEAD-CENTER DI LINE GARIS LURUS (DESKTOP) */}
                                {isOddColumn ? (
                                  <>
                                    {/* Garis Horizontal Penghubung dari Kartu Kiri ke Garis Tengah */}
                                    <div className="hidden md:block absolute right-0 top-10 w-8 h-0.5 bg-gradient-to-r from-indigo-200 to-indigo-500 z-10" />
                                    {/* Node Angka Berada Tepat di Sumbu Garis Tengah (left: calc(100% + 2rem) -translate-x-1/2) */}
                                    <div 
                                      style={{ left: 'calc(100% + 2rem)' }}
                                      className="hidden md:flex absolute top-5 -translate-x-1/2 z-20 w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-600 text-white font-black text-sm items-center justify-center shadow-lg shadow-indigo-600/40 ring-4 ring-white ring-offset-2 ring-offset-slate-100 transition-transform duration-200 group-hover:scale-110"
                                    >
                                      <span>{pNum}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Garis Horizontal Penghubung dari Kartu Kanan ke Garis Tengah */}
                                    <div className="hidden md:block absolute left-0 top-10 w-8 h-0.5 bg-gradient-to-l from-indigo-200 to-indigo-500 z-10" />
                                    {/* Node Angka Berada Tepat di Sumbu Garis Tengah (left: calc(0% - 2rem) -translate-x-1/2) */}
                                    <div 
                                      style={{ left: 'calc(0% - 2rem)' }}
                                      className="hidden md:flex absolute top-5 -translate-x-1/2 z-20 w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-600 text-white font-black text-sm items-center justify-center shadow-lg shadow-indigo-600/40 ring-4 ring-white ring-offset-2 ring-offset-slate-100 transition-transform duration-200 group-hover:scale-110"
                                    >
                                      <span>{pNum}</span>
                                    </div>
                                  </>
                                )}

                                {/* KARTU 3D SOFT TAHAPAN */}
                                <div className="relative bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06),0_4px_10px_-4px_rgba(15,23,42,0.03)] hover:shadow-[0_20px_35px_-8px_rgba(79,70,229,0.14),0_8px_16px_-6px_rgba(15,23,42,0.05)] hover:-translate-y-1 transition-all duration-300 ring-1 ring-slate-900/[0.03] overflow-hidden">
                                  
                                  {/* Aksen Strip Atas 3D Lembut */}
                                  <div className={`absolute inset-x-6 top-0 h-1 rounded-b-full ${
                                    hasFiles 
                                      ? 'bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400' 
                                      : 'bg-slate-200'
                                  }`} />

                                  {/* Header Tahapan */}
                                  <div className="space-y-2 pt-1 pb-3 border-b border-slate-100">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                        Tahap 0{pNum}
                                      </span>

                                      {hasFiles ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                          <CheckCircle2 size={12} className="text-emerald-600" />
                                          <span>{phase.files.length} Berkas Lengkap</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                          <Clock size={11} className="text-slate-400" />
                                          <span>Menunggu Dokumen</span>
                                        </span>
                                      )}
                                    </div>

                                    <h5 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                                      {phase.nama_fase}
                                    </h5>
                                  </div>

                                  {/* Panduan Dokumen & Catatan Progres */}
                                  <div className="py-3 space-y-2">
                                    {phase.catatan_global && (
                                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed font-medium">
                                        <span className="font-bold text-indigo-700 uppercase block text-[8px] tracking-wider mb-0.5">Panduan Dokumen:</span>
                                        {phase.catatan_global}
                                      </div>
                                    )}

                                    {phase.catatan_tahun && (
                                      <div className="p-2.5 rounded-xl bg-amber-50/70 border-l-3 border-amber-400 text-[11px] text-amber-950 leading-relaxed font-medium">
                                        <span className="font-bold text-amber-800 uppercase block text-[8px] tracking-wider mb-0.5">Catatan Progres {currentYear}:</span>
                                        {phase.catatan_tahun}
                                      </div>
                                    )}
                                  </div>

                                  {/* DAFTAR LAMPIRAN BERKAS (KLIK PADA NAMA FILE LANGSUNG MEMBUKA DOKUMEN) */}
                                  <div className="space-y-2 pt-1">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                      <FileText size={11} />
                                      <span>Lampiran Dokumen:</span>
                                    </p>

                                    {phase.files.length === 0 ? (
                                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-1">
                                        <FolderOpen size={20} className="text-slate-300 mx-auto" />
                                        <p className="text-xs font-bold text-slate-500">
                                          Belum ada dokumen yang diarsipkan
                                        </p>
                                        <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                                          Arsip tahapan ini sedang dalam proses verifikasi atau kompilasi oleh unit penanggung jawab.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {phase.files.map((file: any, fIdx: number) => {
                                          const meta = getFileMeta(file);
                                          return (
                                            <div
                                              key={fIdx}
                                              className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:bg-indigo-50/20 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-2.5 group/file"
                                            >
                                              {/* Link Langsung pada Icon & Nama File */}
                                              <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                                                title={`Klik untuk membuka berkas: ${file.name}`}
                                              >
                                                <div className={`p-2 rounded-xl border shrink-0 transition-transform group-hover/file:scale-105 ${meta.accentBg}`}>
                                                  {meta.icon}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                  <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-bold text-slate-800 truncate leading-snug group-hover/file:text-indigo-600 group-hover/file:underline transition-colors">
                                                      {file.name}
                                                    </p>
                                                    <ArrowUpRight size={13} className="text-slate-400 group-hover/file:text-indigo-600 shrink-0 opacity-70 group-hover/file:opacity-100 transition-opacity" />
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border ${meta.badgeColor}`}>
                                                      {meta.badgeText}
                                                    </span>
                                                    {file.uploaded_at && (
                                                      <span className="text-[9px] text-slate-400 font-medium">
                                                        {new Date(file.uploaded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </a>

                                              {/* Tombol Salin Tautan Berkas */}
                                              <button
                                                type="button"
                                                onClick={() => handleCopyFileLink(file.url, file.name)}
                                                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer shrink-0"
                                                title="Salin Tautan Berkas"
                                              >
                                                <Copy size={13} />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          };

                          return (
                            <div key={currentYear} className="space-y-8">
                              
                              {/* Year Milestone Header Banner */}
                              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md shadow-slate-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                                    <Calendar size={20} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-base sm:text-lg font-black tracking-tight">
                                        Tahun Anggaran {currentYear}
                                      </h4>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        {completedPhasesThisYear}/{combinedPhases.length} Tahap Berkas
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                                      Tersedia {totalFilesThisYear} lampiran dokumen digital aktif
                                    </p>
                                  </div>
                                </div>

                                {activeArc && activeArc.catatan && (
                                  <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/20 px-3.5 py-2 rounded-2xl max-w-md">
                                    <span className="font-bold block text-[9px] uppercase tracking-wider text-amber-300">Catatan Tahun {currentYear}:</span>
                                    <span className="line-clamp-2">{activeArc.catatan}</span>
                                  </div>
                                )}
                              </div>

                              {/* ========================================================================= */}
                              {/* STAGGERED 3D CENTER TIMELINE (OVERLAPPING 2/3 HEIGHT ZIG-ZAG)            */}
                              {/* ========================================================================= */}
                              <div className="relative py-4">
                                
                                {/* 1. TAMPILAN DESKTOP: 2 KOLOM DENGAN OFFSET STAGGERED ~2/3 TINGGI KOTAK ATAS */}
                                <div className="hidden md:grid md:grid-cols-2 gap-x-16 relative">
                                  
                                  {/* Terminal Titik Awal Garis Lurus */}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 shadow-md flex items-center justify-center z-10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                  </div>

                                  {/* Garis Vertikal Tengah Menyala Lurus Sempurna */}
                                  <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-8 w-1.5 bg-gradient-to-b from-indigo-500 via-sky-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.35)] z-0" />

                                  {/* Terminal Titik Akhir Garis Lurus */}
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-7 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100 shadow-md flex items-center justify-center z-10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                  </div>

                                  {/* Kolom Kiri: Tahap Ganjil (Tahap 1, Tahap 3, Tahap 5) - Mulai dari atas (top 0) */}
                                  <div className="space-y-12">
                                    {oddPhases.map((phase) => renderPhaseCard(phase, true))}
                                  </div>

                                  {/* Kolom Kanan: Tahap Genap (Tahap 2, Tahap 4...) - Mulai 2/3 ke bawah kotak 1 */}
                                  <div className="space-y-12 pt-28 lg:pt-36">
                                    {evenPhases.map((phase) => renderPhaseCard(phase, false))}
                                  </div>

                                </div>

                                {/* 2. TAMPILAN MOBILE: ALUR VERTIKAL BERUNTUN RAPI DENGAN GARIS KIRI */}
                                <div className="md:hidden relative pl-12 space-y-8 before:absolute before:left-4 before:top-4 before:bottom-8 before:w-1 before:bg-gradient-to-b before:from-indigo-500 before:via-sky-400 before:to-indigo-600 before:rounded-full">
                                  {combinedPhases.map((phase, pIdx) => {
                                    const pNum = pIdx + 1;
                                    const hasFiles = phase.files.length > 0;

                                    return (
                                      <div key={pIdx} className="relative">
                                        {/* Mobile Badge */}
                                        <div className="absolute -left-12 top-5 z-20 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white font-black text-xs flex items-center justify-center shadow-md ring-2 ring-white">
                                          <span>{pNum}</span>
                                        </div>

                                        {/* Card Content Mobile */}
                                        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
                                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                            <span className="text-[10px] font-mono font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                              Tahap 0{pNum}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-500">
                                              {phase.files.length} Berkas
                                            </span>
                                          </div>

                                          <h5 className="font-bold text-sm text-slate-900 leading-snug">
                                            {phase.nama_fase}
                                          </h5>

                                          {/* Lampiran Dokumen Mobile */}
                                          <div className="space-y-2 pt-1">
                                            {phase.files.length === 0 ? (
                                              <p className="text-[10px] text-slate-400 italic py-1">Belum ada lampiran</p>
                                            ) : (
                                              phase.files.map((file: any, fIdx: number) => {
                                                const meta = getFileMeta(file);
                                                return (
                                                  <div key={fIdx} className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                                                    <a 
                                                      href={file.url} 
                                                      target="_blank" 
                                                      rel="noreferrer" 
                                                      className="flex items-center gap-2 min-w-0 flex-1"
                                                    >
                                                      <div className={`p-1.5 rounded-lg border shrink-0 ${meta.accentBg}`}>
                                                        {meta.icon}
                                                      </div>
                                                      <span className="text-xs font-bold text-slate-800 truncate underline">
                                                        {file.name}
                                                      </span>
                                                    </a>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleCopyFileLink(file.url, file.name)}
                                                      className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                                                    >
                                                      <Copy size={12} />
                                                    </button>
                                                  </div>
                                                );
                                              })
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>

        ) : viewMode === 'cards' ? (
          
          /* ========================================================================= */
          /* VIEW 2: KARTU KEGIATAN RINGKAS DENGAN ACCORDION TAHUN                     */
          /* ========================================================================= */
          <div className="space-y-6">
            {filteredCategories.map(cat => {
              const isExpanded = expandedCards.includes(cat.id);
              const catArcs = archives.filter(a => a.kategori_id === cat.id);
              const availableCatYears = Array.from(new Set(catArcs.map(a => a.tahun))).sort((a, b) => b - a);
              const selectedYear = activeCardYear[cat.id] === 'ALL' || !activeCardYear[cat.id] 
                ? (availableCatYears[0] || new Date().getFullYear()) 
                : activeCardYear[cat.id];
              const activeArc = catArcs.find(a => a.tahun === selectedYear);

              const rawPhases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);
              const arcPhases = activeArc ? (typeof activeArc.fase_dokumen === 'string' ? JSON.parse(activeArc.fase_dokumen) : (activeArc.fase_dokumen || [])) : [];

              const combinedPhases: any[] = rawPhases.map((tpl: any, idx: number) => {
                const phaseName = typeof tpl === 'string' ? tpl : tpl.nama_fase;
                const globalNote = typeof tpl === 'string' ? '' : (tpl.catatan_global || '');
                const arcData = arcPhases.find((f: any) => f.nama_fase?.trim() === phaseName?.trim()) || arcPhases[idx] || { files: [], catatan: '' };

                return {
                  nama_fase: phaseName,
                  catatan_global: globalNote,
                  catatan_tahun: arcData.catatan || '',
                  files: arcData.files || []
                };
              });

              const totalFilesInActiveYear = combinedPhases.reduce((acc: number, p: any) => acc + p.files.length, 0);
              const filledPhases = combinedPhases.filter((p: any) => p.files.length > 0).length;
              const progressPct = combinedPhases.length > 0 ? Math.round((filledPhases / combinedPhases.length) * 100) : 0;

              return (
                <div 
                  key={cat.id} 
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div 
                    onClick={() => toggleCard(cat.id)}
                    className="p-5 sm:p-6 cursor-pointer bg-gradient-to-r from-slate-50/60 via-white to-indigo-50/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5">
                        <Folder size={22} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            {cat.nama_kegiatan}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {combinedPhases.length} Tahap Berkas
                          </span>
                        </div>
                        {cat.deskripsi && (
                          <p className="text-xs text-slate-500 font-medium line-clamp-2 max-w-3xl">
                            {cat.deskripsi}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center" onClick={e => e.stopPropagation()}>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelengkapan Tahap</p>
                        <p className="text-xs font-black text-slate-800">
                          {filledPhases} / {combinedPhases.length} Tahap ({progressPct}%)
                        </p>
                      </div>

                      <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleCard(cat.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                        title={isExpanded ? "Tutup Rincian" : "Buka Rincian"}
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-slate-50/40 space-y-6 animate-in fade-in duration-200">
                      
                      {/* Year Selector Tabs Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 px-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0">Tahun Anggaran:</span>
                          {availableCatYears.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Belum ada arsip tahunan.</span>
                          ) : (
                            availableCatYears.map(y => {
                              const isYearActive = selectedYear === y;
                              const arcItem = catArcs.find(a => a.tahun === y);
                              const pCount = (arcItem ? (typeof arcItem.fase_dokumen === 'string' ? JSON.parse(arcItem.fase_dokumen) : arcItem.fase_dokumen) : []).reduce((acc: number, f: any) => acc + (f.files?.length || 0), 0);

                              return (
                                <button
                                  key={y}
                                  type="button"
                                  onClick={() => setActiveCardYear(prev => ({ ...prev, [cat.id]: y }))}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    isYearActive
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span>Tahun {y}</span>
                                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono ${
                                    isYearActive ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'
                                  }`}>
                                    {pCount}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>

                        <div className="text-[11px] font-bold text-slate-600 shrink-0 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          <span>Total {totalFilesInActiveYear} Berkas Siap Diunduh</span>
                        </div>
                      </div>

                      {/* Phase Stepper Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {combinedPhases.map((phase, pIdx) => (
                          <div 
                            key={pIdx}
                            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start gap-2.5 pb-2 border-b border-slate-100">
                                <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                  {pIdx + 1}
                                </span>
                                <div>
                                  <h4 className="font-bold text-xs text-slate-900 leading-snug">
                                    {phase.nama_fase}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {phase.files.length} Berkas Lampiran
                                  </span>
                                </div>
                              </div>

                              {phase.files.length === 0 ? (
                                <div className="py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Belum ada lampiran berkas
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {phase.files.map((file: any, fIdx: number) => {
                                    const meta = getFileMeta(file);
                                    return (
                                      <div
                                        key={fIdx}
                                        className="group/item p-2 px-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2"
                                      >
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                                        >
                                          <div className={`p-1.5 rounded-lg border shrink-0 ${meta.accentBg}`}>
                                            {meta.icon}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-800 truncate leading-tight group-hover/item:text-indigo-600 group-hover/item:underline transition-colors">
                                              {file.name}
                                            </p>
                                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border ${meta.badgeColor}`}>
                                              {meta.badgeText}
                                            </span>
                                          </div>
                                        </a>

                                        <button
                                          type="button"
                                          onClick={() => handleCopyFileLink(file.url, file.name)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                          title="Salin Tautan"
                                        >
                                          <Copy size={12} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>

        ) : (
          
          /* ========================================================================= */
          /* VIEW 3: MATRIKS SANDING TAHUNAN (MULTI-YEAR SIDE-BY-SIDE TABLE)           */
          /* ========================================================================= */
          <div className="space-y-6">
            {filteredCategories.map(cat => {
              const catArcs = archives.filter(a => a.kategori_id === cat.id);
              const targetYears = filterYear === 'ALL' ? availableYears : [filterYear];
              const rawPhases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);

              return (
                <div key={cat.id} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  
                  <div className="p-5 px-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Folder size={18} className="text-indigo-400" />
                        <h3 className="text-base font-black uppercase tracking-tight">{cat.nama_kegiatan}</h3>
                      </div>
                      {cat.deskripsi && <p className="text-xs text-slate-300 font-medium mt-0.5">{cat.deskripsi}</p>}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white font-bold text-xs border border-white/20">
                      Perbandingan Dokumen Sanding
                    </span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] font-black border-b border-slate-200">
                          <th className="p-3.5 px-5 border-r border-slate-200 min-w-[240px] sticky left-0 bg-slate-100 z-10 shadow-xs">
                            Tahapan / Fase Berkas
                          </th>
                          {targetYears.map(y => (
                            <th key={y} className="p-3.5 px-4 text-center border-r border-slate-200 min-w-[280px]">
                              <span className="text-xs font-black text-slate-900">Tahun {y}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {rawPhases.map((tpl: any, pIdx: number) => {
                          const phaseName = typeof tpl === 'string' ? tpl : tpl.nama_fase;
                          const globalNote = typeof tpl === 'string' ? '' : (tpl.catatan_global || '');

                          return (
                            <tr key={pIdx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3.5 px-5 sticky left-0 bg-white border-r border-slate-200 z-10 align-top shadow-2xs">
                                <div className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-indigo-200">
                                    {pIdx + 1}
                                  </span>
                                  <div>
                                    <h4 className="font-bold text-xs text-slate-900">{phaseName}</h4>
                                    {globalNote && (
                                      <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">
                                        {globalNote}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {targetYears.map(y => {
                                const arc = catArcs.find(a => a.tahun === y);
                                if (!arc) {
                                  return (
                                    <td key={y} className="p-3.5 px-4 border-r border-slate-100 text-center align-middle bg-slate-50/20 text-slate-400 italic text-[11px]">
                                      Belum ada arsip
                                    </td>
                                  );
                                }

                                const arcPhases = typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : (arc.fase_dokumen || []);
                                const pData = arcPhases.find((f: any) => f.nama_fase?.trim() === phaseName?.trim()) || arcPhases[pIdx];
                                const files = pData?.files || [];

                                return (
                                  <td key={y} className="p-3 px-4 border-r border-slate-100 align-top bg-white space-y-2">
                                    {files.length === 0 ? (
                                      <span className="text-[10px] text-slate-400 italic block py-2 text-center">
                                        Tidak ada berkas
                                      </span>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {files.map((file: any, fIdx: number) => {
                                          const meta = getFileMeta(file);
                                          return (
                                            <div
                                              key={fIdx}
                                              className="group p-1.5 px-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between gap-2 shadow-2xs"
                                            >
                                              <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                                                title={`Buka File: ${file.name}`}
                                              >
                                                {meta.icon}
                                                <span className="text-[10px] font-bold text-slate-800 group-hover:text-indigo-700 truncate underline">
                                                  {file.name}
                                                </span>
                                              </a>
                                              <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase shrink-0 border ${meta.badgeColor}`}>
                                                {meta.badgeText}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                </div>
              );
            })}
          </div>

        )}

      </main>

      {/* 5. MODAL BAGIKAN TAUTAN (SHARE DIALOG) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 border border-slate-100">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Share2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Bagikan Portal Arsip Publik</h3>
                  <p className="text-xs text-slate-500 font-medium">Tautan dapat dibuka siapa saja tanpa perlu login.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Tautan Akses Publik:
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/share/arsip-kegiatan` : ''} 
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
                >
                  {isCopied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                  <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Keamanan &amp; Aksesibilitas:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                <li>Akses bersifat <strong>Hanya Baca (Read-Only)</strong>. Pengunjung tidak dapat mengubah atau menghapus data.</li>
                <li>Mendukung tampilan interaktif di Komputer, Tablet, maupun Smartphone secara responsif.</li>
                <li>Langsung terhubung dengan berkas Google Drive, Spreadsheet, dan PDF yang telah diunggah.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="h-10 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
