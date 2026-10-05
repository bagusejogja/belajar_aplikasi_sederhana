"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileEdit, ArrowUpDown, Wallet, FileSpreadsheet, Plus, 
  Search, Download, RefreshCw, Trash2, Edit3, CheckCircle2, 
  AlertCircle, TrendingUp, TrendingDown, Layers, Building2, 
  FileText, Calendar, Copy, Check, ChevronRight, X, ArrowRight,
  ChevronDown, Minus, ArrowLeftRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';
import VersiAnggaranSelector from '@/components/rka/VersiAnggaranSelector';
import RkaHelpModal from '@/components/rka/RkaHelpModal';

export interface RkaPenyesuaianItem {
  id: number;
  modul: 'pengeluaran' | 'penerimaan';
  tahun_anggaran: number;
  versi_anggaran: string;
  unit_kerja: string;
  kode_akun?: string;
  nama_akun: string;
  uraian: string;
  pagu_semula: number;
  jenis_penyesuaian: 'tambah' | 'kurang' | 'pergeseran';
  nilai_penyesuaian: number;
  pagu_setelah: number;
  no_sk?: string;
  tanggal_sk?: string;
  keterangan?: string;
  target_laporan?: string;
  created_at?: string;
}

// Preset Fallback Units & Accounts jika API lambat / tabel kosong
const DEFAULT_UNITS = [
  '010101 Majelis Wali Amanat',
  '010201 Dewan Guru Besar',
  '010301 Senat Akademik',
  '010401 Kantor Audit Internal',
  '010703 Pusat Inovasi dan Agroteknologi',
  '020101 Rektor dan Wakil Rektor',
  '03000010 Fakultas Biologi',
  '04000010 Fakultas Ekonomika dan Bisnis',
  '05000010 Fakultas Farmasi',
  '06000010 Fakultas Geografi',
  '07000010 Fakultas Hukum',
  '08000010 Fakultas Ilmu Budaya',
  '09000010 Fakultas Ilmu Sosial dan Ilmu Politik',
  '10000010 Fakultas Kedokteran, Kesehatan Masyarakat, dan Keperawatan',
  '11000010 Fakultas Kedokteran Gigi',
  '12000010 Fakultas Kedokteran Hewan',
  '13000010 Fakultas Kehutanan',
  '14000010 Fakultas Matematika dan Ilmu Pengetahuan Alam',
  '15000010 Fakultas Pertanian',
  '16000010 Fakultas Peternakan',
  '17000010 Fakultas Psikologi',
  '18000010 Fakultas Teknik',
  '19000010 Fakultas Teknologi Pertanian',
  '20000010 Sekolah Pascasarjana',
  '21000010 Sekolah Vokasi'
];

const DEFAULT_AKUN_BELANJA = [
  '51101 Gaji Pokok - Pegawai UGM',
  '51103 Tunjangan - Jabatan Struktural',
  '51104 Tunjangan - Jabatan Fungsional',
  '51109.05 Tunjangan Uang Makan',
  '51201 Honorarium',
  '521211 Belanja Bahan Operasional',
  '521213 Belanja Honor Output Kegiatan',
  '521811 Belanja Barang Persediaan',
  '522111 Belanja Langganan Daya dan Jasa',
  '524111 Belanja Perjalanan Dinas Biasa',
  '52803 Pendaftaran Kepesertaan Kegiatan',
  '53105 Perbaikan dan Pemeliharaan Peralatan dan Mesin',
  '532111 Belanja Modal Peralatan dan Mesin',
  '533111 Belanja Modal Gedung dan Bangunan',
  '54101 Biaya Perjalanan Dalam Negeri',
  '54102 Biaya Perjalanan Luar Negeri'
];

const DEFAULT_AKUN_PENERIMAAN = [
  '40101 Surplus Anggaran Tahun Sebelumnya',
  '41101.04.01.01 Penerimaan UKT S1 | Tarif Uang Kuliah Tarif 1',
  '41101.04.01.02 Penerimaan UKT S1 | Tarif Uang Kuliah Tarif 2',
  '41101.04.01.03 Penerimaan UKT S1 | Tarif Uang Kuliah Tarif 3',
  '41101.04.01.04 Penerimaan UKT S1 | Tarif Uang Kuliah Tarif 4',
  '41101.04.01.05 Penerimaan UKT S1 | Tarif Uang Kuliah Tarif 5',
  '41102 Penerimaan Mahasiswa Pascasarjana',
  '42741.01 Penerimaan Hasil Usaha Pertanian',
  '42741.02 Penerimaan Hasil Usaha Perkebunan',
  '42741.03 Penerimaan Hasil Usaha Peternakan',
  '42801 Jasa Layanan Kerjasama Riset dan Pengabdian',
  '43101 Pendapatan Bunga dan Jasa Giro'
];

export interface AutocompleteItem {
  code?: string;
  name: string;
  full: string;
}

// --------------------------------------------------------------------------
// KOMPONEN AUTOCOMPLETE INPUT DENGAN NAVIGASI KEYBOARD (↑ ↓ + ENTER + ESC)
// --------------------------------------------------------------------------
interface KeyboardAutocompleteInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  badgeType?: 'unit' | 'akun';
  accentTheme?: 'indigo' | 'emerald' | 'rose' | 'blue';
  onSelectOption?: (item: AutocompleteItem) => void;
}

function KeyboardAutocompleteInput({
  label,
  required = false,
  value,
  onChange,
  options = [],
  placeholder = 'Ketik atau pilih...',
  badgeType = 'unit',
  accentTheme = 'indigo',
  onSelectOption
}: KeyboardAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse options menjadi format terstruktur { code, name, full }
  const parsedOptions: AutocompleteItem[] = useMemo(() => {
    return options.map((opt) => {
      const trimmed = opt.trim();
      // Match pattern seperti "521211 Belanja Bahan" atau "010101 Majelis Wali Amanat"
      const match = trimmed.match(/^([0-9\.]+)\s*[-|]?\s*(.*)$/);
      if (match) {
        return {
          code: match[1],
          name: match[2] || trimmed,
          full: trimmed
        };
      }
      return {
        code: '',
        name: trimmed,
        full: trimmed
      };
    });
  }, [options]);

  // Sinkronisasi query lokal jika props value berubah dari luar (misal saat buka modal edit)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Filter opsi berdasarkan input pencarian
  const filtered = useMemo(() => {
    if (!query.trim()) return parsedOptions;
    const q = query.toLowerCase();
    return parsedOptions.filter(
      (item) => item.full.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || (item.code && item.code.toLowerCase().includes(q))
    );
  }, [parsedOptions, query]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll item yang sedang di-highlight ke dalam viewport dropdown
  useEffect(() => {
    if (isOpen && listRef.current && filtered.length > 0) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, filtered.length]);

  // Handle navigasi keyboard ↑ ↓ + Enter + Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (item: AutocompleteItem) => {
    onChange(item.full);
    setQuery(item.full);
    setIsOpen(false);
    if (onSelectOption) {
      onSelectOption(item);
    }
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getThemeClass = () => {
    switch (accentTheme) {
      case 'rose':
        return {
          inputFocus: 'focus:ring-2 focus:ring-rose-600 focus:bg-white focus:border-rose-600',
          highlighted: 'bg-rose-600 text-white font-bold',
          selected: 'bg-rose-50 text-rose-800 font-bold',
          badge: 'bg-rose-100 text-rose-800',
          check: 'text-rose-600'
        };
      case 'emerald':
        return {
          inputFocus: 'focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:border-emerald-600',
          highlighted: 'bg-emerald-600 text-white font-bold',
          selected: 'bg-emerald-50 text-emerald-800 font-bold',
          badge: 'bg-emerald-100 text-emerald-800',
          check: 'text-emerald-600'
        };
      case 'blue':
        return {
          inputFocus: 'focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600',
          highlighted: 'bg-blue-600 text-white font-bold',
          selected: 'bg-blue-50 text-blue-800 font-bold',
          badge: 'bg-blue-100 text-blue-800',
          check: 'text-blue-600'
        };
      case 'indigo':
      default:
        return {
          inputFocus: 'focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-indigo-600',
          highlighted: 'bg-indigo-600 text-white font-bold',
          selected: 'bg-indigo-50 text-indigo-800 font-bold',
          badge: 'bg-indigo-100 text-indigo-800',
          check: 'text-indigo-600'
        };
    }
  };
  const theme = getThemeClass();

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="text-[11px] font-bold text-gray-700 block mb-1">
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full h-9 bg-gray-50 border border-gray-300 rounded-xl pl-3 pr-16 text-xs font-semibold text-gray-900 outline-none transition-all shadow-2xs ${theme.inputFocus}`}
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              title="Hapus teks"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            title="Tampilkan daftar opsi"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            <span>Pilihan Tersedia ({filtered.length})</span>
            <span className="font-mono text-gray-400">Gunakan ↑ ↓ lalu Enter</span>
          </div>

          <div ref={listRef} className="max-h-56 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-gray-400 italic text-xs">
                Tidak ada data yang cocok. Anda dapat tetap menggunakan teks yang diketik.
              </div>
            ) : (
              filtered.map((item, idx) => {
                const isHighlighted = highlightedIndex === idx;
                const isSelected = value === item.full;

                return (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isHighlighted
                        ? theme.highlighted
                        : isSelected
                        ? theme.selected
                        : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.code && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 font-bold ${
                          isHighlighted 
                            ? 'bg-white/20 text-white' 
                            : theme.badge
                        }`}>
                          {item.code}
                        </span>
                      )}
                      <span className="truncate">{item.name}</span>
                    </div>

                    {isSelected && (
                      <Check size={14} className={`shrink-0 ${isHighlighted ? 'text-white' : theme.check}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// AUTOCOMPLETE FILTER UNIT KERJA DENGAN KEYBOARD ARROW NAVIGATION
// --------------------------------------------------------------------------
function UnitAutocompleteFilter({ 
  units, 
  selectedUnit, 
  onSelect 
}: { 
  units: string[], 
  selectedUnit: string, 
  onSelect: (unit: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredUnits = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  const allOptions = useMemo(() => {
    return ['ALL', ...filteredUnits];
  }, [filteredUnits]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current && allOptions.length > 0) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, allOptions.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allOptions.length > 0 && allOptions[highlightedIndex]) {
        onSelect(allOptions[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className="w-full h-9 px-3 rounded-xl bg-white border border-gray-300 text-xs font-bold text-gray-800 shadow-2xs flex items-center justify-between gap-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 truncate cursor-pointer"
      >
        <span className="truncate">
          {selectedUnit === 'ALL' ? `🏢 Semua Unit Kerja (${units.length})` : selectedUnit}
        </span>
        <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-80 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari fakultas/unit (↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div ref={listRef} className="max-h-56 overflow-y-auto space-y-0.5">
            {allOptions.map((unit, idx) => {
              const isHighlighted = highlightedIndex === idx;
              const isSelected = selectedUnit === unit;

              return (
                <button
                  key={unit}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => {
                    onSelect(unit);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-indigo-600 text-white font-bold'
                      : isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="truncate">{unit === 'ALL' ? '🏢 Semua Fakultas / Unit' : unit}</span>
                  {isSelected && <Check size={13} className={`shrink-0 ${isHighlighted ? 'text-white' : 'text-indigo-600'}`} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// MAIN COMPONENT: RkaPenyesuaianView
// --------------------------------------------------------------------------
interface RkaPenyesuaianViewProps {
  initialModul?: 'all' | 'pengeluaran' | 'penerimaan';
}

export default function RkaPenyesuaianView({ initialModul = 'all' }: RkaPenyesuaianViewProps) {
  // Filter Modul di Tampilan Depan ('all' = Menampilkan Belanja & Pendapatan Sekaligus)
  const [activeModul, setActiveModul] = useState<'all' | 'pengeluaran' | 'penerimaan'>(initialModul);
  const [versiFilter, setVersiFilter] = useState<string>('v1');
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [jenisFilter, setJenisFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [dataList, setDataList] = useState<RkaPenyesuaianItem[]>([]);
  const [totals, setTotals] = useState({
    totalPaguSemula: 0,
    totalTambah: 0,
    totalKurang: 0,
    totalNetPenyesuaian: 0,
    totalPaguSetelah: 0,
    itemCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasTable, setHasTable] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Checklist Target Modul Anggaran di Popup Modal (Bisa pilih Belanja, Pendapatan, atau Keduanya Sekaligus)
  const [selectedModuls, setSelectedModuls] = useState<{
    pengeluaran: boolean;
    penerimaan: boolean;
  }>({
    pengeluaran: true,
    penerimaan: false
  });

  const toggleModul = (key: 'pengeluaran' | 'penerimaan') => {
    setSelectedModuls(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Pastikan minimal salah satu harus tetap terpilih
      if (!next.pengeluaran && !next.penerimaan) {
        return prev;
      }
      return next;
    });
  };

  // Form Fields
  const [formData, setFormData] = useState({
    unit_kerja: '',
    // Akun Belanja (Pengeluaran)
    kode_akun_belanja: '521211',
    nama_akun_belanja: '521211 Belanja Bahan Operasional',
    // Akun Pendapatan (Penerimaan)
    kode_akun_penerimaan: '41101.04',
    nama_akun_penerimaan: '41101.04 Penerimaan UKT S1',
    uraian: '',
    nilai_penyesuaian: '', // Bisa bertanda minus (-) e.g. "-5000000" atau plus e.g. "5000000"
    no_sk: '',
    tanggal_sk: new Date().toISOString().split('T')[0],
    keterangan: '',
    target_laporan: 'semua'
  });

  // Master Data Options untuk Autocomplete
  const [masterUnits, setMasterUnits] = useState<string[]>(DEFAULT_UNITS);
  const [masterAkunBelanja, setMasterAkunBelanja] = useState<string[]>(DEFAULT_AKUN_BELANJA);
  const [masterAkunPenerimaan, setMasterAkunPenerimaan] = useState<string[]>(DEFAULT_AKUN_PENERIMAAN);

  // Fetch Master Data untuk Autocomplete dari API
  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/rka/penyesuaian?type=options');
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.units) && json.units.length > 0) {
          setMasterUnits(json.units);
        }
        if (Array.isArray(json.akunBelanja) && json.akunBelanja.length > 0) {
          setMasterAkunBelanja(json.akunBelanja);
        }
        if (Array.isArray(json.akunPenerimaan) && json.akunPenerimaan.length > 0) {
          setMasterAkunPenerimaan(json.akunPenerimaan);
        }
      }
    } catch {}
  };

  // Fetch Data Penyesuaian
  const fetchData = async () => {
    setLoading(true);
    try {
      let url = `/api/rka/penyesuaian?modul=${activeModul}&tahun=${tahunFilter}&versi=${encodeURIComponent(versiFilter)}`;
      if (unitFilter !== 'ALL') url += `&unit=${encodeURIComponent(unitFilter)}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setDataList(json.data || []);
        if (json.totals) setTotals(json.totals);
        setHasTable(json.hasTable !== false);
      } else {
        toast.error('Gagal memuat penyesuaian: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeModul, tahunFilter, versiFilter, unitFilter]);

  // Helper kalkulasi tanda dan nominal
  const parsedNilai = parseFloat(formData.nilai_penyesuaian) || 0;
  const isKurang = formData.nilai_penyesuaian.trim().startsWith('-') || parsedNilai < 0;
  const absNominal = Math.abs(parsedNilai);

  // Buka Modal Tambah
  const handleOpenAddModal = (defaultModul?: 'pengeluaran' | 'penerimaan') => {
    setIsEditing(false);
    setEditingId(null);

    // Tentukan checklist awal berdasarkan filter aktif jika spesifik
    const isPenerimaan = defaultModul === 'penerimaan' || (activeModul === 'penerimaan');
    setSelectedModuls({
      pengeluaran: !isPenerimaan,
      penerimaan: isPenerimaan
    });

    setFormData({
      unit_kerja: masterUnits[0] || '010101 Majelis Wali Amanat',
      kode_akun_belanja: '521211',
      nama_akun_belanja: '521211 Belanja Bahan Operasional',
      kode_akun_penerimaan: '41101.04',
      nama_akun_penerimaan: '41101.04 Penerimaan UKT S1',
      uraian: '',
      nilai_penyesuaian: '',
      no_sk: '',
      tanggal_sk: new Date().toISOString().split('T')[0],
      keterangan: '',
      target_laporan: 'semua'
    });
    setModalOpen(true);
  };

  // Buka Modal Edit (Selalu untuk baris/item yang dipilih)
  const handleOpenEditModal = (item: RkaPenyesuaianItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    const isPenerimaan = item.modul === 'penerimaan';
    setSelectedModuls({
      pengeluaran: !isPenerimaan,
      penerimaan: isPenerimaan
    });

    // Otomatis pasang tanda minus (-) jika item sebelumnya adalah pengurangan / efisiensi
    const nominalStr = item.jenis_penyesuaian === 'kurang' 
      ? `-${Math.abs(item.nilai_penyesuaian)}` 
      : `${Math.abs(item.nilai_penyesuaian)}`;

    setFormData({
      unit_kerja: item.unit_kerja,
      kode_akun_belanja: !isPenerimaan ? (item.kode_akun || '') : '521211',
      nama_akun_belanja: !isPenerimaan ? item.nama_akun : '521211 Belanja Bahan Operasional',
      kode_akun_penerimaan: isPenerimaan ? (item.kode_akun || '') : '41101.04',
      nama_akun_penerimaan: isPenerimaan ? item.nama_akun : '41101.04 Penerimaan UKT S1',
      uraian: item.uraian,
      nilai_penyesuaian: nominalStr,
      no_sk: item.no_sk || '',
      tanggal_sk: item.tanggal_sk || new Date().toISOString().split('T')[0],
      keterangan: item.keterangan || '',
      target_laporan: item.target_laporan || 'semua'
    });
    setModalOpen(true);
  };

  // Submit Simpan Penyesuaian
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (absNominal <= 0) {
      return toast.error('Nominal penyesuaian harus lebih dari 0!');
    }

    if (!formData.unit_kerja || !formData.uraian) {
      return toast.error('Harap lengkapi Unit Kerja dan Uraian Penyesuaian!');
    }

    const isBoth = selectedModuls.pengeluaran && selectedModuls.penerimaan;

    // -------------------------------------------------------------------------
    // A. MODE EDIT: Mengupdate record yang sedang diedit (editingId)
    // -------------------------------------------------------------------------
    if (isEditing) {
      const targetModul = selectedModuls.pengeluaran ? 'pengeluaran' : 'penerimaan';
      const cleanAkun = (targetModul === 'pengeluaran' ? formData.nama_akun_belanja : formData.nama_akun_penerimaan).trim();
      const matchAkun = cleanAkun.match(/^([0-9\.]+)\s*[-|]?\s*(.*)$/);
      const kodeAkun = (targetModul === 'pengeluaran' ? formData.kode_akun_belanja : formData.kode_akun_penerimaan) || (matchAkun ? matchAkun[1] : '');
      const namaAkun = matchAkun ? (matchAkun[2] || cleanAkun) : cleanAkun;

      if (!namaAkun) {
        return toast.error('Harap pilih Nama Akun!');
      }

      setIsSaving(true);
      try {
        const payload = {
          id: editingId,
          modul: targetModul,
          tahun_anggaran: parseInt(tahunFilter) || 2027,
          versi_anggaran: versiFilter,
          unit_kerja: formData.unit_kerja,
          kode_akun: kodeAkun,
          nama_akun: namaAkun,
          uraian: formData.uraian,
          pagu_semula: 0,
          jenis_penyesuaian: isKurang ? 'kurang' : 'tambah',
          nilai_penyesuaian: absNominal,
          pagu_setelah: isKurang ? -absNominal : absNominal,
          no_sk: formData.no_sk || null,
          tanggal_sk: formData.tanggal_sk || null,
          keterangan: formData.keterangan || null,
          target_laporan: formData.target_laporan || 'semua'
        };

        const res = await fetch('/api/rka/penyesuaian', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
          toast.success('Penyesuaian berhasil diperbarui!');
          setModalOpen(false);
          fetchData();
        } else {
          toast.error('Gagal memperbarui: ' + json.error);
        }
      } catch (err: any) {
        toast.error('Error: ' + err.message);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // B. MODE TAMBAH BARU: KEDUA MODUL DIPILIH (Belanja & Pendapatan Sekaligus)
    // -------------------------------------------------------------------------
    if (isBoth) {
      const cleanBelanja = formData.nama_akun_belanja.trim();
      const matchBelanja = cleanBelanja.match(/^([0-9\.]+)\s*[-|]?\s*(.*)$/);
      const kodeBelanja = formData.kode_akun_belanja || (matchBelanja ? matchBelanja[1] : '');
      const namaBelanja = matchBelanja ? (matchBelanja[2] || cleanBelanja) : cleanBelanja;

      const cleanPendapatan = formData.nama_akun_penerimaan.trim();
      const matchPendapatan = cleanPendapatan.match(/^([0-9\.]+)\s*[-|]?\s*(.*)$/);
      const kodePendapatan = formData.kode_akun_penerimaan || (matchPendapatan ? matchPendapatan[1] : '');
      const namaPendapatan = matchPendapatan ? (matchPendapatan[2] || cleanPendapatan) : cleanPendapatan;

      if (!namaBelanja || !namaPendapatan) {
        return toast.error('Harap lengkapi Nama Akun Belanja dan Nama Akun Pendapatan!');
      }

      setIsSaving(true);
      try {
        const tahun = parseInt(tahunFilter) || 2027;
        const versi = versiFilter;

        const rowBelanja = {
          modul: 'pengeluaran',
          tahun_anggaran: tahun,
          versi_anggaran: versi,
          unit_kerja: formData.unit_kerja,
          kode_akun: kodeBelanja,
          nama_akun: namaBelanja,
          uraian: formData.uraian,
          pagu_semula: 0,
          jenis_penyesuaian: isKurang ? 'kurang' : 'tambah',
          nilai_penyesuaian: absNominal,
          pagu_setelah: isKurang ? -absNominal : absNominal,
          no_sk: formData.no_sk || null,
          tanggal_sk: formData.tanggal_sk || null,
          keterangan: formData.keterangan || null,
          target_laporan: formData.target_laporan || 'semua'
        };

        const rowPendapatan = {
          modul: 'penerimaan',
          tahun_anggaran: tahun,
          versi_anggaran: versi,
          unit_kerja: formData.unit_kerja,
          kode_akun: kodePendapatan,
          nama_akun: namaPendapatan,
          uraian: formData.uraian,
          pagu_semula: 0,
          jenis_penyesuaian: isKurang ? 'kurang' : 'tambah',
          nilai_penyesuaian: absNominal,
          pagu_setelah: isKurang ? -absNominal : absNominal,
          no_sk: formData.no_sk || null,
          tanggal_sk: formData.tanggal_sk || null,
          keterangan: formData.keterangan || null,
          target_laporan: formData.target_laporan || 'semua'
        };

        const res = await fetch('/api/rka/penyesuaian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bulk: true,
            rows: [rowBelanja, rowPendapatan]
          })
        });

        const json = await res.json();
        if (json.success) {
          toast.success('2 Penyesuaian (Belanja & Pendapatan) berhasil disimpan!');
          setModalOpen(false);
          fetchData();
        } else {
          toast.error('Gagal menyimpan: ' + json.error);
        }
      } catch (err: any) {
        toast.error('Error: ' + err.message);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // -------------------------------------------------------------------------
    // C. MODE TAMBAH BARU: HANYA SATU MODUL (Belanja Saja ATAU Pendapatan Saja)
    // -------------------------------------------------------------------------
    const targetModul = selectedModuls.pengeluaran ? 'pengeluaran' : 'penerimaan';
    const cleanAkun = (targetModul === 'pengeluaran' ? formData.nama_akun_belanja : formData.nama_akun_penerimaan).trim();
    const matchAkun = cleanAkun.match(/^([0-9\.]+)\s*[-|]?\s*(.*)$/);
    const kodeAkun = (targetModul === 'pengeluaran' ? formData.kode_akun_belanja : formData.kode_akun_penerimaan) || (matchAkun ? matchAkun[1] : '');
    const namaAkun = matchAkun ? (matchAkun[2] || cleanAkun) : cleanAkun;

    if (!namaAkun) {
      return toast.error('Harap pilih Nama Akun!');
    }

    setIsSaving(true);
    try {
      const payload = {
        modul: targetModul,
        tahun_anggaran: parseInt(tahunFilter) || 2027,
        versi_anggaran: versiFilter,
        unit_kerja: formData.unit_kerja,
        kode_akun: kodeAkun,
        nama_akun: namaAkun,
        uraian: formData.uraian,
        pagu_semula: 0,
        jenis_penyesuaian: isKurang ? 'kurang' : 'tambah',
        nilai_penyesuaian: absNominal,
        pagu_setelah: isKurang ? -absNominal : absNominal,
        no_sk: formData.no_sk || null,
        tanggal_sk: formData.tanggal_sk || null,
        keterangan: formData.keterangan || null,
        target_laporan: formData.target_laporan || 'semua'
      };

      const res = await fetch('/api/rka/penyesuaian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success) {
        toast.success(`Penyesuaian ${targetModul === 'pengeluaran' ? 'Belanja' : 'Pendapatan'} berhasil ditambahkan!`);
        setModalOpen(false);
        fetchData();
      } else {
        toast.error('Gagal menyimpan: ' + json.error);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Baris Penyesuaian
  const handleDelete = async (id: number) => {
    if (!confirm('Hapus baris penyesuaian ini?')) return;
    try {
      const res = await fetch(`/api/rka/penyesuaian?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Penyesuaian berhasil dihapus');
        fetchData();
      } else {
        toast.error('Gagal menghapus: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    }
  };

  // Filtered List di Tampilan Depan
  const filteredData = useMemo(() => {
    return dataList.filter(item => {
      if (jenisFilter !== 'ALL' && item.jenis_penyesuaian !== jenisFilter) return false;
      return true;
    });
  }, [dataList, jenisFilter]);

  // Paginated List
  const paginatedData = useMemo(() => {
    if (pageSize === 'ALL') return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(filteredData.length / (pageSize as number)) || 1;

  // Export Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) return toast.error('Tidak ada data penyesuaian untuk diekspor!');

    const mapped = filteredData.map((d, i) => ({
      'No': i + 1,
      'Modul Anggaran': d.modul === 'penerimaan' ? 'PENDAPATAN (PENERIMAAN)' : 'BELANJA (PENGELUARAN)',
      'Tahun': d.tahun_anggaran,
      'Versi': d.versi_anggaran.toUpperCase(),
      'Unit Kerja': d.unit_kerja,
      'Kode Akun': d.kode_akun || '-',
      'Nama Akun': d.nama_akun,
      'Uraian Penyesuaian': d.uraian,
      'Pagu Semula (Rp)': Number(d.pagu_semula) || 0,
      'Jenis Penyesuaian': d.jenis_penyesuaian.toUpperCase(),
      'Nilai Penyesuaian (Rp)': (d.jenis_penyesuaian === 'kurang' ? -1 : 1) * Number(d.nilai_penyesuaian || 0),
      'Pagu Setelah Penyesuaian (Rp)': Number(d.pagu_setelah) || 0,
      'Nomor SK': d.no_sk || '-',
      'Tanggal SK': d.tanggal_sk || '-',
      'Keterangan': d.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(mapped);
    ws['!cols'] = [
      { wch: 6 }, { wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 35 }, { wch: 15 },
      { wch: 35 }, { wch: 45 }, { wch: 20 }, { wch: 18 }, { wch: 22 },
      { wch: 22 }, { wch: 25 }, { wch: 15 }, { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Penyesuaian_${activeModul}`);
    XLSX.writeFile(wb, `Penyesuaian_RKA_${activeModul}_${tahunFilter}_${versiFilter}.xlsx`);
    toast.success('File Excel Penyesuaian berhasil diunduh!');
  };

  const formatRp = (num: number) => {
    return Math.round(num).toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`p-2.5 rounded-2xl ${
              activeModul === 'pengeluaran' 
                ? 'bg-indigo-50 text-indigo-700' 
                : activeModul === 'penerimaan'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              <ArrowUpDown size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  Penyesuaian Anggaran RKA
                </h1>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold uppercase">
                  TA {tahunFilter}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold uppercase font-mono">
                  {versiFilter.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Pencatatan Penambahan (+), Pemotongan / Efisiensi (-), &amp; Mutasi Pagu Belanja maupun Pendapatan dalam Satu Tampilan
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Bantuan '?' Saja Sesuai Permintaan */}
          <RkaHelpModal 
            currentPage="penyesuaian_pengeluaran" 
          />

          {/* Selector Versi Anggaran Multi-Version */}
          <VersiAnggaranSelector
            selectedVersi={versiFilter}
            onSelectVersi={setVersiFilter}
            tahun={tahunFilter}
            modul="pengeluaran"
          />

          {/* Tombol Tambah Penyesuaian (Membuka Popup dengan Pemilihan Modul di Dalam) */}
          <Button
            size="sm"
            onClick={() => handleOpenAddModal()}
            className="h-9 rounded-xl text-white text-xs font-bold gap-1.5 shadow-xs cursor-pointer bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus size={15} />
            <span>Tambah Penyesuaian</span>
          </Button>

          {/* Tombol Export Excel */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            title="Export Excel Penyesuaian"
          >
            <Download size={14} className="text-gray-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </Button>

          {/* Tombol Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 w-9 p-0 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50 shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* BANNER JIKA TABEL rkat_penyesuaian BELUM DIBUAT DI SUPABASE */}
      {!hasTable && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-bold text-xs text-amber-950">
                Tabel Database <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">rkat_penyesuaian</code> Belum Aktif di Supabase
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Fitur penyesuaian membutuhkan tabel <code className="font-mono">rkat_penyesuaian</code>. Klik tombol di kanan untuk menyalin script SQL migrasi dan jalankan di Supabase SQL Editor.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const sql = `-- Eksekusi di Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.rkat_penyesuaian (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  modul TEXT NOT NULL DEFAULT 'pengeluaran',
  tahun_anggaran INT NOT NULL DEFAULT 2027,
  versi_anggaran TEXT NOT NULL DEFAULT 'v1',
  unit_kerja TEXT NOT NULL,
  kode_akun TEXT,
  nama_akun TEXT NOT NULL,
  uraian TEXT NOT NULL,
  pagu_semula NUMERIC(18,2) DEFAULT 0,
  jenis_penyesuaian TEXT NOT NULL DEFAULT 'tambah',
  nilai_penyesuaian NUMERIC(18,2) NOT NULL DEFAULT 0,
  pagu_setelah NUMERIC(18,2) NOT NULL DEFAULT 0,
  no_sk TEXT,
  tanggal_sk DATE,
  keterangan TEXT,
  target_laporan TEXT NOT NULL DEFAULT 'semua',
  referensi_id BIGINT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.rkat_penyesuaian ADD COLUMN IF NOT EXISTS target_laporan TEXT DEFAULT 'semua';
ALTER TABLE public.rkat_penyesuaian ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to rkat_penyesuaian" ON public.rkat_penyesuaian;
CREATE POLICY "Allow all access to rkat_penyesuaian" ON public.rkat_penyesuaian FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_rkat_penyesuaian_modul_tahun_versi ON public.rkat_penyesuaian(modul, tahun_anggaran, versi_anggaran);
NOTIFY pgrst, 'reload schema';`;
              navigator.clipboard.writeText(sql);
              toast.success('Script SQL tabel rkat_penyesuaian berhasil disalin!');
            }}
            className="h-8.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <Copy size={13} />
            <span>Salin SQL Tabel Penyesuaian</span>
          </Button>
        </div>
      )}

      {/* KPI METRIC CARDS (FOKUS PENYESUAIAN: TAMBAH (+) VS KURANG (-) & NET MUTASI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Penambahan (+) */}
        <Card className="rounded-2xl shadow-xs border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-600" />
                <span>Total Tambah (+)</span>
              </span>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px] font-mono font-bold">
                KREDIT
              </Badge>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950">
              + Rp {formatRp(totals.totalTambah)}
            </div>
            <div className="text-xs font-semibold text-emerald-800 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
              <span>Tambahan Pagu Masuk</span>
              <span className="text-[10px] font-mono font-bold">Basis {versiFilter.toUpperCase()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Pemotongan / Efisiensi (-) */}
        <Card className="rounded-2xl shadow-xs border-rose-200 bg-rose-50/40">
          <CardContent className="p-5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-rose-600" />
                <span>Total Kurang (-)</span>
              </span>
              <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 text-[9px] font-mono font-bold">
                DEBET
              </Badge>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-950">
              - Rp {formatRp(totals.totalKurang)}
            </div>
            <div className="text-xs font-semibold text-rose-800 pt-1 border-t border-rose-200/60 flex items-center justify-between">
              <span>Pemotongan / Efisiensi</span>
              <span className="text-[10px] font-mono font-bold">Basis {versiFilter.toUpperCase()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Net Akumulasi Mutasi Penyesuaian (+ / -) */}
        <Card className="rounded-2xl shadow-xs border-indigo-200 bg-gradient-to-b from-white to-indigo-50/60">
          <CardContent className="p-5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ArrowUpDown size={14} className="text-indigo-600" />
                <span>Net Penyesuaian</span>
              </span>
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[9px] font-mono font-bold">
                HASIL AKHIR
              </Badge>
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              totals.totalNetPenyesuaian >= 0 ? 'text-emerald-950' : 'text-rose-950'
            }`}>
              {totals.totalNetPenyesuaian >= 0 ? '+' : ''}Rp {formatRp(totals.totalNetPenyesuaian)}
            </div>
            <div className="text-xs font-semibold text-indigo-800 pt-1 border-t border-indigo-200/60 flex items-center justify-between">
              <span>{totals.totalNetPenyesuaian >= 0 ? 'Surplus Penambahan' : 'Net Efisiensi Anggaran'}</span>
              <span className="text-[10px] font-mono font-bold">TA {tahunFilter}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Rekod Catatan Mutasi */}
        <Card className="rounded-2xl shadow-xs border-gray-200 bg-white">
          <CardContent className="p-5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-gray-400" />
                <span>Total Catatan Mutasi</span>
              </span>
              <Badge variant="outline" className="text-[9px] font-mono bg-gray-50">RECORD</Badge>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-gray-900">
              {totals.itemCount} Transaksi
            </div>
            <div className="text-xs font-semibold text-gray-500 pt-1 border-t border-gray-100 flex items-center justify-between">
              <span>Rekapitulasi Anggaran</span>
              <span className="text-[10px] font-mono font-bold uppercase">{activeModul}</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* FILTER & TAB MODUL SECTION */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          
          {/* Baris 1: Mode Switcher Tab (Semua vs Belanja vs Pendapatan) & Tab Arah (Semua vs Tab Masuk vs Tab Keluar) */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Grup Tab Modul Anggaran */}
              <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                {/* Tab 1: Semua Modul (Belanja & Pendapatan Sekaligus) */}
                <button
                  type="button"
                  onClick={() => setActiveModul('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModul === 'all'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Layers size={14} />
                  <span>Semua Modul</span>
                </button>

                {/* Tab 2: Hanya Belanja (Pengeluaran) */}
                <button
                  type="button"
                  onClick={() => setActiveModul('pengeluaran')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModul === 'pengeluaran'
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  <span>Belanja</span>
                </button>

                {/* Tab 3: Hanya Pendapatan (Penerimaan) */}
                <button
                  type="button"
                  onClick={() => setActiveModul('penerimaan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeModul === 'penerimaan'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Wallet size={14} />
                  <span>Pendapatan</span>
                </button>
              </div>

              {/* Grup Tab Arah Penyesuaian (Keluar & Masuk Sesuai Permintaan User) */}
              <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1.5 hidden sm:inline">
                  Distribusi Tab:
                </span>
                <button
                  type="button"
                  onClick={() => setJenisFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    jenisFilter === 'ALL'
                      ? 'bg-white text-gray-900 shadow-2xs font-black'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  Semua (+/-)
                </button>
                <button
                  type="button"
                  onClick={() => setJenisFilter('tambah')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    jenisFilter === 'tambah'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <TrendingUp size={13} />
                  <span>Tab Masuk (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJenisFilter('kurang')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    jenisFilter === 'kurang'
                      ? 'bg-rose-600 text-white shadow-xs font-black'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <TrendingDown size={13} />
                  <span>Tab Keluar (-)</span>
                </button>
              </div>

            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-800">
                <span className="text-[10px] text-purple-600 uppercase tracking-wider">Basis Data:</span>
                <span className="font-black font-mono">{versiFilter.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Baris 2: Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Filter Tahun */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Tahun Anggaran
              </label>
              <select
                value={tahunFilter}
                onChange={e => setTahunFilter(e.target.value)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="2027">TA 2027</option>
                <option value="2026">TA 2026</option>
                <option value="2025">TA 2025</option>
                <option value="ALL">Semua Tahun</option>
              </select>
            </div>

            {/* 2. Filter Unit Kerja dengan Navigasi Keyboard Autocomplete */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Fakultas / Unit Kerja
              </label>
              <UnitAutocompleteFilter
                units={masterUnits}
                selectedUnit={unitFilter}
                onSelect={setUnitFilter}
              />
            </div>

            {/* 3. Filter Jenis Penyesuaian */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Jenis Mutasi Penyesuaian
              </label>
              <select
                value={jenisFilter}
                onChange={e => setJenisFilter(e.target.value)}
                className="w-full h-9 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Semua Jenis (+/-)</option>
                <option value="tambah">🟢 Penambahan Pagu (+)</option>
                <option value="kurang">🔴 Pemotongan / Efisiensi (-)</option>
                <option value="pergeseran">🔵 Pergeseran Antar Akun</option>
              </select>
            </div>

            {/* 4. Link Navigasi Cepat ke Laporan */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Integrasi Laporan Resmi
              </label>
              <Link
                href="/rka/laporan"
                className="w-full h-9 bg-indigo-50/70 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl px-3 flex items-center justify-between text-xs font-bold transition-colors shadow-2xs"
              >
                <span>Lihat Dampak di Laporan</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Baris 3: Search Box & Pagination Sizer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-gray-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Cari uraian penyesuaian, nama akun, fakultas, atau nomor SK..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl py-2 pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-medium focus:bg-white transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium shrink-0">
              <span className="text-[11px] font-bold text-gray-500">Tampilkan:</span>
              <select
                value={pageSize}
                onChange={e => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setPageSize(val);
                  setCurrentPage(1);
                }}
                className="h-9 px-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value={25}>25 baris</option>
                <option value={50}>50 baris</option>
                <option value={100}>100 baris</option>
                <option value="ALL">Semua Data</option>
              </select>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* TABEL DATA PENYESUAIAN */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="animate-spin text-indigo-600" size={28} />
            <p className="text-xs text-gray-500 font-medium">Memuat data penyesuaian anggaran...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-3">
            <div className="p-3 bg-gray-100 text-gray-400 rounded-2xl">
              <FileEdit size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-gray-800">Belum Ada Catatan Penyesuaian</h3>
              <p className="text-xs text-gray-500 max-w-sm">
                Belum ada mutasi penyesuaian anggaran pada Tahun {tahunFilter} ({versiFilter.toUpperCase()}).
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenAddModal()}
              className="mt-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              <Plus size={14} className="mr-1" />
              <span>Input Penyesuaian Pertama</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Modul</th>
                  <th className="py-3 px-4 min-w-[180px]">Unit Kerja</th>
                  <th className="py-3 px-4 min-w-[200px]">Akun / Uraian Penyesuaian</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Arah</th>
                  <th className="py-3 px-3.5 text-right min-w-[140px]">Nominal Penyesuaian</th>
                  <th className="py-3 px-4 min-w-[150px]">Dasar SK &amp; Tanggal</th>
                  <th className="py-3 px-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((row, idx) => {
                  const no = pageSize === 'ALL' ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                  const isKurang = row.jenis_penyesuaian === 'kurang';
                  const isPenerimaan = row.modul === 'penerimaan';

                  return (
                    <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-[11px] text-gray-400">
                        {no}
                      </td>

                      {/* Kolom Modul (Belanja vs Pendapatan) */}
                      <td className="py-3 px-3 text-center">
                        {isPenerimaan ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[9px] font-bold gap-1 py-0.5">
                            <Wallet size={11} className="text-emerald-700" />
                            <span>Pendapatan</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-300 text-[9px] font-bold gap-1 py-0.5">
                            <FileSpreadsheet size={11} className="text-indigo-700" />
                            <span>Belanja</span>
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{row.unit_kerja}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          TA {row.tahun_anggaran} • {row.versi_anggaran.toUpperCase()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {row.kode_akun && (
                            <span className="font-mono text-[10px] bg-gray-100 text-gray-700 px-1 py-0.5 rounded font-bold">
                              {row.kode_akun}
                            </span>
                          )}
                          <span className="font-semibold text-gray-800">{row.nama_akun}</span>
                          {row.target_laporan && row.target_laporan !== 'semua' && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold py-0">
                              {row.target_laporan === 'proposal rkat' ? '📑 Proposal RKAT' : row.target_laporan === 'laporan_kementerian' ? '🏛️ Kementerian' : '🌐 Webometrics'}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5">{row.uraian}</div>
                        {row.keterangan && (
                          <div className="text-[10px] text-gray-400 italic mt-0.5">
                            Ket: {row.keterangan}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {row.jenis_penyesuaian === 'kurang' ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] font-bold">
                            - Kurang
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">
                            + Tambah
                          </Badge>
                        )}
                      </td>

                      <td className={`py-3 px-3.5 text-right font-mono font-black text-xs ${
                        isKurang ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isKurang ? '- ' : '+ '}Rp {formatRp(row.nilai_penyesuaian)}
                      </td>

                      <td className="py-3 px-4 text-gray-600 text-[11px]">
                        <div className="font-medium text-gray-900">{row.no_sk || 'SK Pimpinan'}</div>
                        <div className="text-[10px] text-gray-400">{row.tanggal_sk || '-'}</div>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Penyesuaian"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Penyesuaian"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredData.length > 0 && pageSize !== 'ALL' && (
          <div className="p-4 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Menampilkan {paginatedData.length} dari total {filteredData.length} catatan penyesuaian
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs rounded-xl"
              >
                Sebelumnya
              </Button>
              <span className="px-2 font-bold text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 text-xs rounded-xl"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* -------------------------------------------------------------------------- */}
      {/* MODAL DIALOG INPUT / EDIT PENYESUAIAN                                       */}
      {/* SESUAI REQUEST: MODUL BELANJA VS PENDAPATAN DIPISAH DI DALAM POPUP INPUT   */}
      {/* DILENGKAPI AUTOCOMPLETE DENGAN NAVIGASI ANAK PANAH ↑ ↓ UNTUK UNIT & AKUN  */}
      {/* -------------------------------------------------------------------------- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 bg-white border border-gray-200 shadow-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-2 rounded-xl ${
                selectedModuls.pengeluaran && selectedModuls.penerimaan
                  ? 'bg-blue-100 text-blue-800'
                  : selectedModuls.pengeluaran
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {selectedModuls.pengeluaran && selectedModuls.penerimaan ? (
                  <Layers size={18} />
                ) : selectedModuls.pengeluaran ? (
                  <FileSpreadsheet size={18} />
                ) : (
                  <Wallet size={18} />
                )}
              </div>
              <DialogTitle className="text-base font-black text-gray-900">
                {isEditing
                  ? `Edit Penyesuaian ${selectedModuls.pengeluaran ? 'Belanja (Pengeluaran)' : 'Pendapatan (Penerimaan)'}`
                  : selectedModuls.pengeluaran && selectedModuls.penerimaan
                  ? 'Tambah Penyesuaian Anggaran (Belanja & Pendapatan Sekaligus)'
                  : selectedModuls.pengeluaran
                  ? 'Tambah Penyesuaian Belanja (Pengeluaran)'
                  : 'Tambah Penyesuaian Pendapatan (Penerimaan)'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              Checklist modul anggaran yang ingin disesuaikan (bisa Belanja, Pendapatan, atau keduanya sekaligus). Gunakan tanda minus (-) pada nominal untuk pemotongan/efisiensi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            
            {/* 1. CHECKLIST TARGET MODUL ANGGARAN (BISA SALAH SATU ATAU DUA-DUANYA) */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>Target Modul Anggaran * (Pilih Salah Satu atau Keduanya)</span>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedModuls.pengeluaran && selectedModuls.penerimaan
                    ? '✓ Belanja & Pendapatan Dipilih Sekaligus'
                    : selectedModuls.pengeluaran
                    ? '✓ Belanja (Pengeluaran) Saja'
                    : '✓ Pendapatan (Penerimaan) Saja'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
                {/* Opsi Checklist 1: Belanja */}
                <button
                  type="button"
                  onClick={() => toggleModul('pengeluaran')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    selectedModuls.pengeluaran
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs font-black ring-2 ring-indigo-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 font-bold'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    selectedModuls.pengeluaran
                      ? 'bg-white text-indigo-600 border-white'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {selectedModuls.pengeluaran && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <FileSpreadsheet size={15} />
                    <span>Belanja (Pengeluaran)</span>
                  </div>
                </button>

                {/* Opsi Checklist 2: Pendapatan */}
                <button
                  type="button"
                  onClick={() => toggleModul('penerimaan')}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    selectedModuls.penerimaan
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black ring-2 ring-emerald-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 font-bold'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    selectedModuls.penerimaan
                      ? 'bg-white text-emerald-600 border-white'
                      : 'border-gray-400 bg-white'
                  }`}>
                    {selectedModuls.penerimaan && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Wallet size={15} />
                    <span>Pendapatan (Penerimaan)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. FAKULTAS / UNIT KERJA (SHARED 1 INPUT) */}
            <KeyboardAutocompleteInput
              label="Fakultas / Unit Kerja *"
              required
              value={formData.unit_kerja}
              onChange={(val) => setFormData({ ...formData, unit_kerja: val })}
              options={masterUnits}
              placeholder="Ketik nama fakultas atau pilih dengan anak panah ↑ ↓..."
              badgeType="unit"
              accentTheme={selectedModuls.pengeluaran && selectedModuls.penerimaan ? 'blue' : selectedModuls.pengeluaran ? 'indigo' : 'emerald'}
            />

            {/* 3. INPUT AKUN & KODE (JIKA PILIH SEMUA / DUA-DUANYA MAKA TAMPILKAN KEDUA AKUN) */}
            {selectedModuls.pengeluaran && selectedModuls.penerimaan ? (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                <div className="text-[11px] font-bold text-gray-500 flex items-center justify-between">
                  <span>Akun Anggaran (Belanja &amp; Pendapatan Dipilih Bersama):</span>
                  <span className="text-[10px] text-gray-400 italic">Cuma akun dan kode yang berbeda</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Kartu Akun Belanja */}
                  <div className="p-3.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/20 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-black text-xs text-indigo-900 pb-2 border-b border-indigo-100">
                      <FileSpreadsheet size={15} className="text-indigo-600" />
                      <span>1. Akun Belanja (Pengeluaran) *</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block mb-1">
                          Kode Akun Belanja
                        </label>
                        <input
                          type="text"
                          placeholder="521211"
                          value={formData.kode_akun_belanja}
                          onChange={e => setFormData({ ...formData, kode_akun_belanja: e.target.value })}
                          className="w-full h-8.5 bg-white border border-indigo-200 rounded-xl px-2.5 text-xs font-mono font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                        />
                      </div>
                      <KeyboardAutocompleteInput
                        label="Nama Akun Belanja *"
                        required
                        value={formData.nama_akun_belanja}
                        onChange={(val) => setFormData({ ...formData, nama_akun_belanja: val })}
                        options={masterAkunBelanja}
                        placeholder="Ketik atau pilih akun belanja..."
                        badgeType="akun"
                        accentTheme="indigo"
                        onSelectOption={(item) => {
                          setFormData(prev => ({
                            ...prev,
                            kode_akun_belanja: item.code || prev.kode_akun_belanja,
                            nama_akun_belanja: item.name || item.full
                          }));
                        }}
                      />
                    </div>
                  </div>

                  {/* Kartu Akun Pendapatan */}
                  <div className="p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 space-y-2.5">
                    <div className="flex items-center gap-1.5 font-black text-xs text-emerald-900 pb-2 border-b border-emerald-100">
                      <Wallet size={15} className="text-emerald-600" />
                      <span>2. Akun Pendapatan (Penerimaan) *</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block mb-1">
                          Kode Akun Pendapatan
                        </label>
                        <input
                          type="text"
                          placeholder="41101.04"
                          value={formData.kode_akun_penerimaan}
                          onChange={e => setFormData({ ...formData, kode_akun_penerimaan: e.target.value })}
                          className="w-full h-8.5 bg-white border border-emerald-200 rounded-xl px-2.5 text-xs font-mono font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                        />
                      </div>
                      <KeyboardAutocompleteInput
                        label="Nama Akun Pendapatan *"
                        required
                        value={formData.nama_akun_penerimaan}
                        onChange={(val) => setFormData({ ...formData, nama_akun_penerimaan: val })}
                        options={masterAkunPenerimaan}
                        placeholder="Ketik atau pilih akun pendapatan..."
                        badgeType="akun"
                        accentTheme="emerald"
                        onSelectOption={(item) => {
                          setFormData(prev => ({
                            ...prev,
                            kode_akun_penerimaan: item.code || prev.kode_akun_penerimaan,
                            nama_akun_penerimaan: item.name || item.full
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedModuls.pengeluaran ? (
              /* HANYA BELANJA (PENGELUARAN) DIPILIH */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Kode Akun Belanja
                  </label>
                  <input
                    type="text"
                    placeholder="521211"
                    value={formData.kode_akun_belanja}
                    onChange={e => setFormData({ ...formData, kode_akun_belanja: e.target.value })}
                    className="w-full h-9 bg-gray-50 border border-gray-300 rounded-xl px-3 text-xs font-mono text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <KeyboardAutocompleteInput
                    label="Nama Akun Belanja (Pengeluaran) *"
                    required
                    value={formData.nama_akun_belanja}
                    onChange={(val) => setFormData({ ...formData, nama_akun_belanja: val })}
                    options={masterAkunBelanja}
                    placeholder="Ketik nama akun belanja atau gunakan anak panah ↑ ↓..."
                    badgeType="akun"
                    accentTheme="indigo"
                    onSelectOption={(item) => {
                      setFormData(prev => ({
                        ...prev,
                        kode_akun_belanja: item.code || prev.kode_akun_belanja,
                        nama_akun_belanja: item.name || item.full
                      }));
                    }}
                  />
                </div>
              </div>
            ) : (
              /* HANYA PENDAPATAN (PENERIMAAN) DIPILIH */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Kode Akun Pendapatan
                  </label>
                  <input
                    type="text"
                    placeholder="41101.04"
                    value={formData.kode_akun_penerimaan}
                    onChange={e => setFormData({ ...formData, kode_akun_penerimaan: e.target.value })}
                    className="w-full h-9 bg-gray-50 border border-gray-300 rounded-xl px-3 text-xs font-mono text-gray-900 outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <KeyboardAutocompleteInput
                    label="Nama Akun Pendapatan (Penerimaan) *"
                    required
                    value={formData.nama_akun_penerimaan}
                    onChange={(val) => setFormData({ ...formData, nama_akun_penerimaan: val })}
                    options={masterAkunPenerimaan}
                    placeholder="Ketik nama akun pendapatan atau gunakan anak panah ↑ ↓..."
                    badgeType="akun"
                    accentTheme="emerald"
                    onSelectOption={(item) => {
                      setFormData(prev => ({
                        ...prev,
                        kode_akun_penerimaan: item.code || prev.kode_akun_penerimaan,
                        nama_akun_penerimaan: item.name || item.full
                      }));
                    }}
                  />
                </div>
              </div>
            )}

            {/* 4. URAIAN KEBUTUHAN PENYESUAIAN (SHARED 1 INPUT) */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Uraian Kebutuhan Penyesuaian *
              </label>
              <input
                type="text"
                required
                placeholder={
                  selectedModuls.pengeluaran && selectedModuls.penerimaan
                    ? "Contoh: Penyesuaian pagu operasional dan target penerimaan tahun berjalan"
                    : selectedModuls.pengeluaran
                    ? "Contoh: Efisiensi belanja perjalanan dinas & operasional triwulan III"
                    : "Contoh: Penyesuaian target penerimaan jasa kerjasama riset industri"
                }
                value={formData.uraian}
                onChange={e => setFormData({ ...formData, uraian: e.target.value })}
                className="w-full h-9 bg-gray-50 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            {/* 5. NOMINAL PENYESUAIAN (RP): DENGAN DETEKSI OTOMATIS MINUS (-) UNTUK PENGURANGAN / EFISIENSI */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isKurang ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <label className="text-[11px] font-black text-gray-800 uppercase tracking-wider block">
                    Nominal Penyesuaian (Rp) *
                  </label>
                  <p className="text-[10px] text-gray-500">
                    Ketik angka biasa untuk penambahan (+), atau awali tanda minus (-) untuk pengurangan/efisiensi.
                  </p>
                </div>

                {/* Quick Toggle (+) vs (-) Sesuai Permintaan */}
                <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-gray-200 shadow-2xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const clean = formData.nilai_penyesuaian.replace(/^[+-]/, '').trim();
                      setFormData({ ...formData, nilai_penyesuaian: clean });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                      !isKurang 
                        ? 'bg-emerald-600 text-white font-black shadow-xs' 
                        : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Plus size={12} />
                    <span>+ Tambah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const clean = formData.nilai_penyesuaian.replace(/^[+-]/, '').trim();
                      setFormData({ ...formData, nilai_penyesuaian: clean ? `-${clean}` : '-' });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                      isKurang 
                        ? 'bg-rose-600 text-white font-black shadow-xs' 
                        : 'text-gray-600 hover:text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <Minus size={12} />
                    <span>- Kurang</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black ${
                  isKurang ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  Rp
                </span>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 10000000 atau -5000000"
                  value={formData.nilai_penyesuaian}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^-?[0-9\.,]*$/.test(val)) {
                      setFormData({ ...formData, nilai_penyesuaian: val });
                    }
                  }}
                  className={`w-full h-10 bg-white border-2 rounded-xl pl-10 pr-4 text-xs font-mono font-black outline-none focus:ring-2 shadow-2xs ${
                    isKurang
                      ? 'border-rose-300 text-rose-950 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-emerald-300 text-emerald-950 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              {/* Status Badge Live Pengurangan / Penambahan */}
              {absNominal > 0 && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className={`font-bold flex items-center gap-1.5 ${isKurang ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {isKurang ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    <span>
                      {isKurang 
                        ? 'Otomatis Terdeteksi: Pengurangan / Efisiensi Anggaran (-)' 
                        : 'Otomatis Terdeteksi: Penambahan Pagu Anggaran (+)'}
                    </span>
                  </div>
                  <div className={`font-mono font-black text-sm ${isKurang ? 'text-rose-800' : 'text-emerald-800'}`}>
                    {isKurang ? '- ' : '+ '}Rp {formatRp(absNominal)}
                  </div>
                </div>
              )}
            </div>

            {/* 6. PERUNTUKAN / TARGET FORMAT LAPORAN (SHARED 1 INPUT) */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Peruntukan / Target Format Laporan *
              </label>
              <select
                value={formData.target_laporan}
                onChange={e => setFormData({ ...formData, target_laporan: e.target.value })}
                className="w-full h-9 bg-gray-50 border border-gray-300 rounded-xl px-3 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
              >
                <option value="semua">🌐 Semua Format Laporan (Global / Rekapitulasi Umum)</option>
                <option value="proposal rkat">📑 Proposal RKAT (Buku Proposal / Slide Presentasi)</option>
                <option value="laporan_kementerian">🏛️ RKA Kementerian (Format Kementerian)</option>
                <option value="laporan_webometrics">🌐 Laporan Webometrics</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                Pilih apakah penyesuaian ini berlaku global ke semua format laporan atau khusus kelompok laporan tertentu.
              </p>
            </div>

            {/* 7. NOMOR SK & TANGGAL SK (SHARED 1 INPUT) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Nomor SK / Dasar Penetapan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SK Rektor No. 120/UN1/2027"
                  value={formData.no_sk}
                  onChange={e => setFormData({ ...formData, no_sk: e.target.value })}
                  className="w-full h-9 bg-gray-50 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Tanggal SK / Berlaku
                </label>
                <input
                  type="date"
                  value={formData.tanggal_sk}
                  onChange={e => setFormData({ ...formData, tanggal_sk: e.target.value })}
                  className="w-full h-9 bg-gray-50 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
                />
              </div>
            </div>

            {/* 8. KETERANGAN TAMBAHAN (SHARED 1 INPUT) */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Catatan penyesuaian untuk lampiran telaah..."
                value={formData.keterangan}
                onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 shadow-2xs"
              />
            </div>

            {/* DIALOG FOOTER ACTIONS */}
            <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-9 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className={`h-9 rounded-xl text-white text-xs font-bold px-4 shadow-xs cursor-pointer ${
                  selectedModuls.pengeluaran && selectedModuls.penerimaan
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : selectedModuls.pengeluaran
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSaving 
                  ? 'Menyimpan...' 
                  : isEditing 
                  ? 'Simpan Perubahan Penyesuaian' 
                  : selectedModuls.pengeluaran && selectedModuls.penerimaan
                  ? 'Simpan Penyesuaian (Belanja & Pendapatan)'
                  : selectedModuls.pengeluaran
                  ? 'Tambahkan Penyesuaian Belanja'
                  : 'Tambahkan Penyesuaian Pendapatan'
                }
              </Button>
            </div>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
