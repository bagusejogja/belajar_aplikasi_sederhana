import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ArrowRight, 
  CornerDownLeft, 
  FileSpreadsheet, 
  FileText, 
  Layers, 
  Palette, 
  Building2, 
  Wallet, 
  ShieldCheck, 
  SlidersHorizontal,
  FolderTree,
  ExternalLink,
  X,
  History,
  Sparkles
} from 'lucide-react';
import { menuList } from '@/lib/mock-db';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Menu Navigasi' | 'Aksi Cepat' | 'Unit Kerja';
  subtitle?: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  badge?: string;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build command items from menuList & quick actions
  const defaultItems: CommandItem[] = [
    // Menu List from mock-db
    ...menuList.map((m) => ({
      id: `menu-${m.path}`,
      title: m.title,
      category: 'Menu Navigasi' as const,
      subtitle: `Modul: ${m.group || 'Utama'} • Akses: ${m.roles.join(', ')}`,
      icon: <FolderTree className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      path: m.path,
      badge: m.group
    })),
    // Extra Sub-Menus
    {
      id: 'sub-review-masjid',
      title: 'Review Anggaran - Masjid Kampus',
      category: 'Menu Navigasi',
      subtitle: 'Verifikasi usulan dan pagu sub-unit Masjid Kampus',
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
      path: '/review-anggaran/masjid',
      badge: 'Review'
    },
    {
      id: 'sub-review-pemerintah',
      title: 'Review Anggaran - Dana Pemerintah (BOPTN)',
      category: 'Menu Navigasi',
      subtitle: 'Verifikasi usulan belanja sumber dana APBN/Pemerintah',
      icon: <Building2 className="w-4 h-4 text-indigo-600" />,
      path: '/review-anggaran/pemerintah',
      badge: 'Review'
    },
    {
      id: 'sub-design-system',
      title: 'Standar UI / UX & Desain Baku',
      category: 'Menu Navigasi',
      subtitle: 'Katalog baku komponen antarmuka terpadu (Design System v2.3)',
      icon: <Palette className="w-4 h-4 text-purple-600" />,
      path: '/design-system',
      badge: 'Design System'
    },
    // Quick Actions
    {
      id: 'action-export-excel',
      title: 'Download Format Excel Baku',
      category: 'Aksi Cepat',
      subtitle: 'Unduh file template impor RKA & usulan pagu sesuai format Simaster',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
      action: () => alert('Mengunduh Format Excel Standar Simaster...'),
      badge: 'Excel'
    },
    {
      id: 'action-audit-log',
      title: 'Buka Log Aktivitas & Jejak Rekam',
      category: 'Aksi Cepat',
      subtitle: 'Lihat riwayat perubahan data, waktu login, dan audit trail pengguna',
      icon: <History className="w-4 h-4 text-amber-600" />,
      path: '/activity-logs',
      badge: 'Audit'
    },
    // Populer Unit Kerja
    {
      id: 'unit-biologi',
      title: 'Fakultas Biologi',
      category: 'Unit Kerja',
      subtitle: 'Kode Unit: 02000010 • Pagu Indikatif: Rp 1.250.000.000',
      icon: <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
      path: '/review-anggaran/unit-kerja?unit=5',
      badge: 'Unit'
    },
    {
      id: 'unit-teknik',
      title: 'Fakultas Teknik',
      category: 'Unit Kerja',
      subtitle: 'Kode Unit: 04000010 • Pagu Indikatif: Rp 4.850.000.000',
      icon: <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
      path: '/review-anggaran/unit-kerja?unit=7',
      badge: 'Unit'
    },
    {
      id: 'unit-dir-keuangan',
      title: 'Direktorat Keuangan',
      category: 'Unit Kerja',
      subtitle: 'Kode Unit: 010802 • KPTU Sayap Selatan',
      icon: <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />,
      path: '/review-anggaran/admin',
      badge: 'KPTU'
    }
  ];

  // Filter items by search query
  const filteredItems = defaultItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Group filtered items
  const categories: Array<'Menu Navigasi' | 'Aksi Cepat' | 'Unit Kerja'> = [
    'Menu Navigasi',
    'Aksi Cepat',
    'Unit Kerja'
  ];

  const handleSelectItem = (item: CommandItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Palette Dialog Shell */}
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ketik untuk mencari menu, unit kerja, atau aksi cepat..."
            className="flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada hasil untuk &quot;{query}&quot;
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Coba cari dengan kata kunci lain seperti: pagu, review, masjid, atau rka.
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryItems = filteredItems.filter((i) => i.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {category}
                  </div>

                  {categoryItems.map((item) => {
                    const currentIndex = filteredItems.indexOf(item);
                    const isSelected = selectedIndex === currentIndex;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold truncate">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  isSelected 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className={`text-[10px] truncate mt-0.5 font-normal ${
                                isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-white shrink-0 ml-2">
                            <span>Buka</span>
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Helper Keyboard Tips */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] font-bold bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] font-bold bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                ↓
              </kbd>
              <span className="hidden sm:inline">Navigasi</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono text-[9px] font-bold bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                ↵
              </kbd>
              <span className="hidden sm:inline">Pilih</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Pencarian Cepat Menu & Data Terpadu</span>
          </div>
        </div>
      </div>
    </div>
  );
}
