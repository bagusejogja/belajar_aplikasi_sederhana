"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Download, RefreshCw, Building2, Search, 
  ChevronDown, ChevronUp, FolderTree, BookOpen, Sparkles,
  PieChart, ArrowRight, Wand2, X, FileSpreadsheet, Check, RotateCcw,
  ChevronLeft, ChevronRight, Eye, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/components/ui/table';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Autocomplete Filter Unit Kerja Component (Persis seperti di tambah-pagu dengan Navigasi Keyboard ↑ ↓ + Enter)
function UnitAutocompleteFilter({ 
  units, 
  selectedUnit, 
  onSelect 
}: { 
  units: string[]; 
  selectedUnit: string; 
  onSelect: (unit: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredUnits = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  const isAll = selectedUnit === 'ALL' || selectedUnit === '*' || !selectedUnit;

  const allOptions = useMemo(() => {
    return ['ALL', ...filteredUnits];
  }, [filteredUnits]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < allOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : allOptions.length - 1));
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
    <div className="relative inline-block text-left w-full" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3.5 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
      >
        <span className="truncate font-bold">
          {isAll ? `🏢 Semua Unit Kerja (${units.length})` : `🏢 ${selectedUnit}`}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-full min-w-[280px] rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari unit (Navigasi ↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-3 py-2 rounded-xl cursor-pointer font-bold transition-colors flex items-center justify-between ${
                  highlightedIndex === 0 ? 'bg-indigo-600 text-white font-bold' : isAll ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <span>🏢 Semua Unit Kerja ({units.length})</span>
                {isAll && <span className={highlightedIndex === 0 ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>}
              </div>
              {filteredUnits.map((u, idx) => {
                const itemIdx = idx + 1;
                const isHighlighted = highlightedIndex === itemIdx;
                const isSelected = selectedUnit === u;
                return (
                  <div
                    key={u}
                    onClick={() => {
                      onSelect(u);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`px-3 py-2 rounded-xl cursor-pointer font-medium transition-colors flex items-center justify-between ${
                      isHighlighted ? 'bg-indigo-600 text-white font-bold' : isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="truncate">{u}</span>
                    {isSelected && <span className={isHighlighted ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>}
                  </div>
                );
              })}
              {filteredUnits.length === 0 && (
                <div className="p-3 text-slate-400 text-center italic">Unit kerja tidak ditemukan</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function RkaLaporanPage() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunningEngine, setIsRunningEngine] = useState(false);

  // Filter States
  const [modeLaporan, setModeLaporan] = useState<string>('proposal rkat');
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Tampilan Tabel Seragam (Summary vs Detail)
  const [activeViewTab, setActiveViewTab] = useState<'summary' | 'detail'>('summary');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(50);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rka/rules');
      const json = await res.json();
      if (json.success) {
        setRulesList(json.data || []);
      }
    } catch (e) {}
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/rka/rules?units=1');
      const json = await res.json();
      if (json.success && json.units) {
        setUnitsList(json.units);
      }
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Query cepat: kirimkan target format agar server bisa filter langsung di DB
      let url = `/api/rka/pengeluaran?tahun=${tahunFilter}&only_classified=true&format=${encodeURIComponent(modeLaporan)}`;
      if (unitFilter !== 'ALL') url += `&unit=${encodeURIComponent(unitFilter)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setDataList(json.data || []);
      } else {
        toast.error('Gagal memuat data: ' + json.error);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchData();
  }, [tahunFilter, unitFilter, modeLaporan]);

  // Helper membaca nilai klasifikasi laporan dari setiap baris belanja
  const getRowClassification = (row: any, targetKey: string) => {
    if (!row) return null;
    if (targetKey === 'proposal rkat') {
      return (row.tags && row.tags['proposal rkat']) || row.identifikasi_lain || row.kategori_belanja || null;
    }
    if (targetKey === 'kategori_belanja') return row.kategori_belanja;
    if (targetKey === 'laporan_kementerian') return row.laporan_kementerian;
    if (targetKey === 'laporan_webometrics') return row.laporan_webometrics;
    if (targetKey === 'identifikasi_lain') return row.identifikasi_lain;
    if (row.tags && typeof row.tags === 'object' && row.tags[targetKey]) {
      return row.tags[targetKey];
    }
    if (row.identifikasi_lain) return row.identifikasi_lain;
    if (row[targetKey]) return row[targetKey];
    return null;
  };

  // Daftar Tab Format Laporan (Hanya Proposal RKAT dan format dari rules aktif)
  const availableTabs = useMemo(() => {
    const tabsMap = new Map<string, { id: string; label: string; icon: string; count: number }>();

    // Tambahkan format unik dari rules aktif terlebih dahulu
    rulesList.forEach(r => {
      const tf = r.target_field;
      if (tf && !tabsMap.has(tf)) {
        const pretty = tf
          .replace(/^(laporan_|target_)/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        tabsMap.set(tf, {
          id: tf,
          label: pretty,
          icon: '📊',
          count: 0
        });
      }
    });

    // Preset standar utama: Proposal RKAT jika belum ada
    if (!tabsMap.has('proposal rkat')) {
      tabsMap.set('proposal rkat', {
        id: 'proposal rkat',
        label: 'Proposal RKAT',
        icon: '📊',
        count: 0
      });
    }

    // Hitung jumlah baris data yang terpetakan untuk setiap format
    const tabsArray = Array.from(tabsMap.values());
    tabsArray.forEach(tab => {
      const matchCount = dataList.filter(row => {
        const val = getRowClassification(row, tab.id);
        return Boolean(val && val.trim());
      }).length;
      tab.count = matchCount;
    });

    return tabsArray;
  }, [rulesList, dataList]);

  // Otomatis pindah ke tab format yang memiliki data atau memiliki aturan aktif
  useEffect(() => {
    if (availableTabs.length > 0) {
      const currentTab = availableTabs.find(t => t.id === modeLaporan);
      if (!currentTab || currentTab.count === 0) {
        const firstTabWithData = availableTabs.find(t => t.count > 0);
        if (firstTabWithData) {
          setModeLaporan(firstTabWithData.id);
        } else if (rulesList.length > 0) {
          const firstRuleTarget = rulesList[0]?.target_field;
          if (firstRuleTarget && firstRuleTarget !== modeLaporan) {
            setModeLaporan(firstRuleTarget);
          }
        }
      }
    }
  }, [availableTabs, rulesList]);

  // Handle Jalankan Rule Engine Langsung dari Halaman Laporan (Clean Sync)
  const handleRunRuleEngine = async () => {
    setIsRunningEngine(true);
    const toastId = toast.loading('Membersihkan data lama & menjalankan Rule Engine...');
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetYear: tahunFilter, cleanSync: true })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: toastId, duration: 6000 });
        await fetchData();
        await fetchRules();
      } else {
        toast.error('Gagal menjalankan Rule Engine: ' + json.error, { id: toastId });
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message, { id: toastId });
    } finally {
      setIsRunningEngine(false);
    }
  };

  // Handle Bersihkan Seluruh Riwayat Klasifikasi Belanja
  const handleCleanOldClassifications = async () => {
    if (!confirm('Bersihkan seluruh riwayat penandaan lama pada data belanja RKAT?\n\nSetelah dibersihkan, seluruh data belanja akan kembali kosong dari klasifikasi, lalu Anda dapat menjalankan Rule Engine kembali agar hanya aturan aktif yang tampil.')) return;
    const toastId = toast.loading('Membersihkan data belanja...');
    try {
      const res = await fetch('/api/rka/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_classification', targetFormat: 'ALL', targetYear: tahunFilter })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message, { id: toastId });
        await fetchData();
        await fetchRules();
      } else {
        toast.error('Gagal membersihkan: ' + json.error, { id: toastId });
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message, { id: toastId });
    }
  };

  const unitOptions = useMemo(() => {
    if (unitsList.length > 0) return unitsList;
    return Array.from(new Set(dataList.map(d => d.unit).filter(Boolean)));
  }, [unitsList, dataList]);

  // Kelompokkan data per Kategori Laporan yang dipilih
  const groupedData = useMemo(() => {
    // Hanya ambil data yang field laporannya terisi
    const validRows = dataList.filter(d => {
      const val = getRowClassification(d, modeLaporan);
      if (!val || val.trim() === '') return false;
      if (search) {
        const lower = search.toLowerCase();
        return (
          val.toLowerCase().includes(lower) ||
          (d.uraian_belanja && d.uraian_belanja.toLowerCase().includes(lower)) ||
          (d.kegiatan && d.kegiatan.toLowerCase().includes(lower)) ||
          (d.lingkup_kegiatan && d.lingkup_kegiatan.toLowerCase().includes(lower)) ||
          (d.akun_detail && d.akun_detail.toLowerCase().includes(lower)) ||
          (d.unit && d.unit.toLowerCase().includes(lower))
        );
      }
      return true;
    });

    const groups: Record<string, { label: string; rows: any[]; totalAnggaran: number; totalRealisasi: number }> = {};

    validRows.forEach(row => {
      const label = getRowClassification(row, modeLaporan) || 'Lainnya';
      if (!groups[label]) {
        groups[label] = {
          label,
          rows: [],
          totalAnggaran: 0,
          totalRealisasi: 0
        };
      }
      groups[label].rows.push(row);
      groups[label].totalAnggaran += Number(row.anggaran) || 0;
      groups[label].totalRealisasi += Number(row.realisasi) || 0;
    });

    return Object.values(groups).sort((a, b) => b.totalAnggaran - a.totalAnggaran);
  }, [dataList, modeLaporan, search]);

  // Daftar opsi kategori untuk filter dropdown
  const categoryOptions = useMemo(() => {
    return Array.from(new Set(groupedData.map(g => g.label))).sort();
  }, [groupedData]);

  // Semua baris belanja valid yang terklasifikasi sesuai filter
  const allDetailRows = useMemo(() => {
    return dataList.filter(d => {
      const val = getRowClassification(d, modeLaporan);
      if (!val || val.trim() === '') return false;
      if (kategoriFilter !== 'ALL' && val !== kategoriFilter) return false;
      if (search) {
        const lower = search.toLowerCase();
        return (
          val.toLowerCase().includes(lower) ||
          (d.uraian_belanja && d.uraian_belanja.toLowerCase().includes(lower)) ||
          (d.kegiatan && d.kegiatan.toLowerCase().includes(lower)) ||
          (d.lingkup_kegiatan && d.lingkup_kegiatan.toLowerCase().includes(lower)) ||
          (d.akun_detail && d.akun_detail.toLowerCase().includes(lower)) ||
          (d.unit && d.unit.toLowerCase().includes(lower))
        );
      }
      return true;
    });
  }, [dataList, modeLaporan, kategoriFilter, search]);

  // Paginated Rows untuk Tab Detail
  const paginatedRows = useMemo(() => {
    if (pageSize === 'ALL') return allDetailRows;
    const start = (currentPage - 1) * pageSize;
    return allDetailRows.slice(start, start + pageSize);
  }, [allDetailRows, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'ALL') return 1;
    return Math.ceil(allDetailRows.length / pageSize) || 1;
  }, [allDetailRows.length, pageSize]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [modeLaporan, tahunFilter, unitFilter, kategoriFilter, search, pageSize]);

  // Aksi Klik Kategori dari Ringkasan untuk membuka Rincian
  const handleViewCategoryDetail = (catLabel: string) => {
    setKategoriFilter(catLabel);
    setActiveViewTab('detail');
    setCurrentPage(1);
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Grand Totals
  const grandTotal = useMemo(() => {
    const anggaran = groupedData.reduce((acc, g) => acc + g.totalAnggaran, 0);
    const totalItems = groupedData.reduce((acc, g) => acc + g.rows.length, 0);
    return { anggaran, totalItems };
  }, [groupedData]);

  // Export Excel
  const handleExportExcel = () => {
    if (groupedData.length === 0) return toast.error('Tidak ada data untuk di-export');

    const flatRows: any[] = [];
    groupedData.forEach(g => {
      g.rows.forEach(r => {
        flatRows.push({
          'Kategori Format Laporan': g.label,
          'Unit Kerja': r.unit,
          'Tahun': r.tahun_anggaran,
          'Program': r.program,
          'Kegiatan': r.kegiatan,
          'Lingkup Kegiatan': r.lingkup_kegiatan,
          'Uraian Belanja': r.uraian_belanja,
          'Akun Detail': r.akun_detail,
          'Pagu Anggaran (Rp)': Number(r.anggaran) || 0
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(flatRows);
    const wb = XLSX.utils.book_new();
    const curTab = availableTabs.find(t => t.id === modeLaporan);
    const sheetName = (curTab?.label || 'Rekap').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Rekap_RKA_${sheetName}_${tahunFilter}.xlsx`);
    toast.success('File Excel rekapitulasi berhasil diexport!');
  };

  const activeTabObj = availableTabs.find(t => t.id === modeLaporan) || availableTabs[0];
  const isKemen = modeLaporan === 'laporan_kementerian';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* HEADER UTAMA (SERAGAM DENGAN RKA PENGELUARAN & RULES) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Rekapitulasi {activeTabObj?.label || 'Format Laporan'}
              </h1>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold uppercase">
                REKAP RKA
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Akumulasi Pagu Anggaran &amp; Realisasi Belanja RKAT Berdasarkan Format Pelaporan Resmi
            </p>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Tombol Jalankan Rule Engine */}
          <Button
            size="sm"
            onClick={handleRunRuleEngine}
            disabled={isRunningEngine || loading}
            className="h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black gap-1.5 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isRunningEngine ? <RefreshCw className="animate-spin" size={14} /> : <Wand2 size={14} />}
            <span>{isRunningEngine ? 'Memetakan Data...' : 'Jalankan Rule Engine'}</span>
          </Button>

          {/* Tombol Bersihkan Riwayat Klasifikasi */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanOldClassifications}
            disabled={loading || isRunningEngine}
            className="h-9 rounded-xl border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            title="Bersihkan penandaan lama yang aturannya sudah dihapus"
          >
            <RotateCcw size={14} className="text-amber-600" />
            <span>Bersihkan Riwayat</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="h-9 rounded-xl border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs"
          >
            <Download size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Link href="/rka/rules">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Sparkles size={14} className="text-indigo-600" />
              <span>Rule Engine</span>
            </Button>
          </Link>

          <Link href="/rka/pengeluaran">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <FolderTree size={14} className="text-gray-600" />
              <span>Data Belanja</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 w-9 p-0 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50 shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* KPI METRIC CARDS (FOKUS TOTAL PAGU ANGGARAN) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Format Laporan Terpilih */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Format Laporan Terpilih
            </span>
            <div className="text-xl font-black text-gray-900 flex items-center gap-2 truncate">
              <span>{activeTabObj?.icon || '📊'}</span>
              <span className="truncate">{activeTabObj?.label || 'Semua Format'}</span>
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>Tahun Anggaran {tahunFilter}</span>
              <Badge variant="outline" className="text-[10px] font-bold font-mono uppercase bg-gray-50">
                {modeLaporan}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Kategori Terpetakan */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Kategori Terpetakan
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              {groupedData.length} <span className="text-xs font-semibold text-gray-500 font-sans">Kelompok Akun</span>
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>{grandTotal.totalItems.toLocaleString('id-ID')} Baris Belanja</span>
              <span className="text-indigo-600 font-medium">Siap Dilaporkan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Pagu Teridentifikasi */}
        <Card className="rounded-2xl shadow-xs border-indigo-200 bg-gradient-to-b from-white to-indigo-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 text-indigo-700">
              <FileSpreadsheet size={13} />
              <span>Total Pagu Anggaran</span>
            </span>
            <div className="text-2xl font-black font-mono text-indigo-950">
              Rp {formatRp(grandTotal.anggaran)}
            </div>
            <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-indigo-200/60 text-indigo-800">
              <span>Rekapitulasi Belanja</span>
              <span className="text-[10px] font-mono font-bold">100% Pagu</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* FILTER CONTROL SECTION (SERAGAM DENGAN MODUL LAIN) */}
      <Card className="rounded-2xl border-gray-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          
          {/* Baris 1: Mode Switcher Tab Laporan Dinamis */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200 overflow-x-auto max-w-full">
              {availableTabs.map((tab) => {
                const isActive = modeLaporan === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setModeLaporan(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs font-black'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-white/20 text-white font-black' : 'bg-gray-200 text-gray-700 font-bold'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Baris 2: Pilihan Tampilan Tabel (Seragam dengan Menu Lain) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-max border border-gray-200">
              <button
                type="button"
                onClick={() => setActiveViewTab('summary')}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'summary'
                    ? 'bg-white text-gray-900 shadow-xs font-black'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <FileSpreadsheet size={14} className="text-indigo-600" />
                <span>🏢 Ringkasan Kelompok Belanja ({groupedData.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('detail')}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'detail'
                    ? 'bg-white text-gray-900 shadow-xs font-black'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <BookOpen size={14} className="text-indigo-600" />
                <span>📋 Tabel Rincian Belanja ({allDetailRows.length.toLocaleString('id-ID')})</span>
              </button>
            </div>

            {/* Filter Group Belanja Khusus Tab Detail */}
            {activeViewTab === 'detail' && (
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Group Belanja:</span>
                <select
                  value={kategoriFilter}
                  onChange={e => setKategoriFilter(e.target.value)}
                  className="h-8 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-lg px-2.5 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs max-w-[240px]"
                >
                  <option value="ALL">Semua Group Belanja ({categoryOptions.length})</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {kategoriFilter !== 'ALL' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setKategoriFilter('ALL')}
                    className="h-8 px-2 text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:bg-rose-50"
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Baris 3: Filter Tahun, Fakultas Autocomplete, dan Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Filter Tahun */}
            <div className="sm:col-span-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
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

            {/* Filter Fakultas Autocomplete (Seragam dengan tambah-pagu) */}
            <div className="sm:col-span-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Fakultas / Unit Kerja
              </label>
              <UnitAutocompleteFilter
                units={unitOptions}
                selectedUnit={unitFilter}
                onSelect={setUnitFilter}
              />
            </div>

            {/* Search Box */}
            <div className="sm:col-span-5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Pencarian Data
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Cari uraian belanja, kegiatan, lingkup, akun, unit..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl pl-8 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs font-medium focus:bg-white transition-all shadow-2xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* TABEL REKAPITULASI & TABEL DETAIL DATA (SERAGAM DENGAN MODUL LAIN) */}
      <div className="space-y-4">
        {loading ? (
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardContent className="p-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="animate-spin text-indigo-600" size={30} />
              <span className="text-xs font-bold text-gray-500">Menyusun tabel laporan belanja...</span>
            </CardContent>
          </Card>
        ) : groupedData.length === 0 ? (
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardContent className="p-16 text-center space-y-3">
              <Layers size={42} className="mx-auto text-gray-300" />
              <h3 className="text-sm font-bold text-gray-700">Belum ada data belanja yang terpetakan untuk format {activeTabObj?.label || ''}</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Aturan klasifikasi mungkin belum dijalankan pada data belanja, atau belum ada kata kunci belanja yang sesuai dengan kriteria aturan.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  onClick={handleRunRuleEngine}
                  disabled={isRunningEngine}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} className={isRunningEngine ? 'animate-spin' : ''} />
                  <span>{isRunningEngine ? 'Memetakan Data...' : '⚡ Jalankan Rule Engine Sekarang'}</span>
                </Button>
                <Link href="/rka/rules">
                  <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl gap-1.5">
                    <span>Atur Rule Engine</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : activeViewTab === 'summary' ? (
          /* ======================================================== */
          /* TAB VIEW 1: TABEL RINGKASAN PER KELOMPOK BELANJA (SUMMARY) */
          /* ======================================================== */
          <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/60 p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
                  <span>{activeTabObj?.icon || '📊'}</span>
                  <span>Tabel Rekapitulasi {activeTabObj?.label || 'Format Laporan'}</span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 font-medium mt-0.5">
                  Rekapitulasi total alokasi pagu belanja dan akumulasi item belanja per kelompok akun pelaporan
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold font-mono bg-white">
                  {groupedData.length} Group Belanja
                </Badge>
                <Badge variant="secondary" className="text-xs font-bold font-mono">
                  {grandTotal.totalItems.toLocaleString('id-ID')} Total Baris
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center text-gray-500 text-xs uppercase font-bold">#</TableHead>
                    <TableHead className="text-gray-500 text-xs uppercase font-bold min-w-[280px]">Group Belanja</TableHead>
                    <TableHead className="text-center text-gray-500 text-xs uppercase font-bold w-36">Jumlah Baris</TableHead>
                    <TableHead className="text-right text-gray-500 text-xs uppercase font-bold min-w-[180px]">Total Pagu Anggaran</TableHead>
                    <TableHead className="text-center text-gray-500 text-xs uppercase font-bold w-36">% Proporsi Pagu</TableHead>
                    <TableHead className="text-center text-gray-500 text-xs uppercase font-bold w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map((group, gIdx) => {
                    const proporsiPct = grandTotal.anggaran > 0 
                      ? ((group.totalAnggaran / grandTotal.anggaran) * 100).toFixed(1)
                      : '0';

                    return (
                      <TableRow 
                        key={group.label || gIdx} 
                        className="border-b border-gray-100 hover:bg-indigo-50/40 transition-colors"
                      >
                        <TableCell className="text-center font-mono font-bold text-gray-400 text-xs">
                          {gIdx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                            <span>🏷️</span>
                            <span>{group.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold font-mono">
                            {group.rows.length.toLocaleString('id-ID')} Baris
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-black font-mono text-gray-950 text-sm">
                            Rp {formatRp(group.totalAnggaran)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1 max-w-[110px] mx-auto">
                            <div className="text-[11px] font-bold font-mono text-gray-700 text-right">
                              {proporsiPct}%
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-600 rounded-full"
                                style={{ width: `${Math.min(100, parseFloat(proporsiPct))}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCategoryDetail(group.label)}
                            className="h-8 w-8 p-0 rounded-xl border-indigo-200 bg-indigo-50/60 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto"
                            title={`Buka rincian belanja ${group.label}`}
                          >
                            <Eye size={15} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                {/* Footer Total Keseluruhan */}
                <tfoot className="bg-gray-100/90 font-bold border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="p-4 text-xs font-black uppercase tracking-wider text-gray-800">
                      TOTAL KESELURUHAN ({groupedData.length} GROUP BELANJA)
                    </td>
                    <td className="p-4 text-center text-xs font-black font-mono text-gray-900">
                      {grandTotal.totalItems.toLocaleString('id-ID')} Baris
                    </td>
                    <td className="p-4 text-right text-sm font-black font-mono text-indigo-950">
                      Rp {formatRp(grandTotal.anggaran)}
                    </td>
                    <td className="p-4 text-center text-xs font-black font-mono text-gray-700">
                      100%
                    </td>
                    <td className="p-4 text-center text-gray-400 text-xs font-bold">
                      -
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* ======================================================== */
          /* TAB VIEW 2: TABEL RINCIAN BARIS BELANJA DETAIL (DETAIL)   */
          /* ======================================================== */
          <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/60 p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" />
                  <span>Tabel Rincian Baris Belanja ({allDetailRows.length.toLocaleString('id-ID')} Data)</span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 font-medium mt-0.5">
                  Daftar seluruh item belanja usulan RKA/RKAT yang terklasifikasi ke dalam format {activeTabObj?.label}
                  {kategoriFilter !== 'ALL' && <span className="font-bold text-indigo-600"> • Filter Kategori: {kategoriFilter}</span>}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per hal:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shadow-2xs"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value="ALL">Semua</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center text-gray-500 text-xs uppercase font-bold">#</TableHead>
                    <TableHead className="text-gray-500 text-xs uppercase font-bold min-w-[420px]">
                      Fakultas / Unit Kerja &amp; Rincian Kegiatan
                    </TableHead>
                    <TableHead className="text-gray-500 text-xs uppercase font-bold min-w-[220px]">
                      Group Belanja
                    </TableHead>
                    <TableHead className="text-right text-gray-500 text-xs uppercase font-bold min-w-[150px]">
                      Pagu Anggaran
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-gray-400 font-medium">
                        Tidak ada baris data belanja yang sesuai kriteria filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row, rIdx) => {
                      const rowNum = pageSize === 'ALL' ? rIdx + 1 : (currentPage - 1) * pageSize + rIdx + 1;
                      const ang = Number(row.anggaran) || 0;
                      const catLabel = getRowClassification(row, modeLaporan) || 'Lainnya';

                      return (
                        <TableRow key={row.id || rIdx} className="hover:bg-gray-50/80 transition-colors border-b border-gray-100">
                          {/* No */}
                          <TableCell className="text-center text-gray-400 font-mono text-xs align-top pt-3.5">
                            {rowNum}
                          </TableCell>

                          {/* Field 1: Unit & Uraian Belanja Kegiatan */}
                          <TableCell className="align-top pt-3 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                <Building2 size={13} className="text-indigo-600 shrink-0" />
                                <span>{row.unit}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">
                                TA {row.tahun_anggaran} • Prioritas: <strong>{row.prioritas || '-'}</strong>
                              </span>
                            </div>

                            {/* Kegiatan & Lingkup Kegiatan */}
                            {(row.kegiatan || row.lingkup_kegiatan) && (
                              <div className="bg-gray-50/90 p-2 rounded-xl border border-gray-100 space-y-0.5">
                                {row.kegiatan && (
                                  <div className="text-[11px] text-gray-800 leading-relaxed font-medium">
                                    <span className="font-bold text-gray-900">Kegiatan:</span> {row.kegiatan}
                                  </div>
                                )}
                                {row.lingkup_kegiatan && (
                                  <div className="text-[10px] text-indigo-800 font-medium">
                                    <span className="font-bold text-indigo-950">Lingkup:</span> {row.lingkup_kegiatan}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Akun Detail & Uraian Belanja */}
                            <div className="space-y-1">
                              {row.akun_detail && (
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-mono text-[10px] font-bold">
                                  {row.akun_detail}
                                </span>
                              )}
                              <div className="font-bold text-gray-950 text-xs leading-snug">
                                {row.uraian_belanja || '-'}
                              </div>
                            </div>
                          </TableCell>

                          {/* Field 2: Group Belanja */}
                          <TableCell className="align-top pt-3 space-y-1.5">
                            <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-1.5 font-bold text-xs leading-snug">
                                <span>🏷️</span>
                                <span>{catLabel}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Field 3: Pagu Anggaran */}
                          <TableCell className="align-top pt-3 text-right">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                              Pagu Anggaran
                            </span>
                            <span className="font-black font-mono text-gray-950 text-sm">
                              Rp {formatRp(ang)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination Controls Footer (Seragam dengan /rka/pengeluaran) */}
            <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
              <div>
                Menampilkan <strong>{pageSize === 'ALL' ? allDetailRows.length : Math.min((currentPage - 1) * (pageSize as number) + 1, allDetailRows.length)}</strong> sampai <strong>{pageSize === 'ALL' ? allDetailRows.length : Math.min(currentPage * (pageSize as number), allDetailRows.length)}</strong> dari <strong>{allDetailRows.length.toLocaleString('id-ID')}</strong> total baris belanja
              </div>

              {pageSize !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    <ChevronLeft size={14} />
                    <span>Sebelumnya</span>
                  </Button>

                  <div className="px-3 py-1 font-bold text-gray-700 bg-white border border-gray-200 rounded-lg text-xs">
                    Halaman {currentPage} dari {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 rounded-lg text-xs"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

    </div>
  );
}
