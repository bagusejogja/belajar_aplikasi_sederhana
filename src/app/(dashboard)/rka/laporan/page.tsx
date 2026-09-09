"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Download, RefreshCw, Building2, Search, 
  ChevronDown, ChevronUp, FolderTree, BookOpen, Sparkles,
  PieChart, ArrowRight, Wand2, X, FileSpreadsheet, Check, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Component Autocomplete Unit Kerja dengan navigasi Keyboard (↑, ↓, Enter, Esc)
function UnitAutocompleteInput({ 
  units, 
  value, 
  onChange, 
  placeholder = "Pilih / Ketik Unit Kerja..." 
}: { 
  units: string[]; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filtered = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

  const allOptions = useMemo(() => {
    return ['ALL', ...filtered];
  }, [filtered]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
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
        onChange(allOptions[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
      } else if (query.trim()) {
        onChange(query.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" onKeyDown={handleKeyDown}>
      <div className="flex gap-1">
        <Input 
          value={value === 'ALL' ? 'Semua Fakultas/Unit Kerja' : value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? 'ALL' : v);
          }}
          placeholder={placeholder}
          className="bg-white border-gray-300 text-gray-900 text-xs font-semibold h-9 rounded-xl focus:ring-2 focus:ring-indigo-600"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2.5 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-300 text-xs font-bold text-gray-600 transition-colors cursor-pointer shrink-0"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150 max-w-md">
            <input
              type="text"
              placeholder="Cari nama unit..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-2.5 py-1.5 mb-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              <div
                onClick={() => {
                  onChange('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-bold transition-colors ${
                  highlightedIndex === 0 ? 'bg-indigo-600 text-white font-bold' : value === 'ALL' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                🏢 Semua Fakultas/Unit Kerja ({units.length})
              </div>
              {filtered.map((u, idx) => {
                const itemIdx = idx + 1;
                const isHighlighted = highlightedIndex === itemIdx;
                const isSelected = value === u;
                return (
                  <div
                    key={u}
                    onClick={() => {
                      onChange(u);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-colors ${
                      isHighlighted ? 'bg-indigo-600 text-white font-bold' : isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u}
                  </div>
                );
              })}
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
  const [loading, setLoading] = useState(true);
  const [isRunningEngine, setIsRunningEngine] = useState(false);

  // Filter States
  const [modeLaporan, setModeLaporan] = useState<string>('laporan_kementerian');
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rka/rules');
      const json = await res.json();
      if (json.success) {
        setRulesList(json.data || []);
      }
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Query cepat 50x: hanya mengambil baris yang terklasifikasi, bukan 25.000 data kosong
      let url = `/api/rka/pengeluaran?tahun=${tahunFilter}&only_classified=true`;
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
    fetchData();
    fetchRules();
  }, [tahunFilter, unitFilter]);

  // Helper membaca nilai klasifikasi laporan dari setiap baris belanja
  const getRowClassification = (row: any, targetKey: string) => {
    if (targetKey === 'laporan_kementerian') return row.laporan_kementerian;
    if (targetKey === 'laporan_webometrics') return row.laporan_webometrics;
    if (targetKey === 'identifikasi_lain') return row.identifikasi_lain;
    if (row.tags && typeof row.tags === 'object' && row.tags[targetKey]) {
      return row.tags[targetKey];
    }
    if (row[targetKey]) return row[targetKey];
    if (targetKey === 'laporan_iku' && row.identifikasi_lain) return row.identifikasi_lain;
    return null;
  };

  // Daftar Tab Format Laporan (Dinamis dari Preset, Master Rules, dan Data Belanja)
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
          label: `Laporan ${pretty}`,
          icon: '📊',
          count: 0
        });
      }
    });

    // Tambahkan preset standar jika belum ada
    if (!tabsMap.has('laporan_kementerian')) {
      tabsMap.set('laporan_kementerian', {
        id: 'laporan_kementerian',
        label: 'Laporan Kementerian',
        icon: '🏛️',
        count: 0
      });
    }
    if (!tabsMap.has('laporan_webometrics')) {
      tabsMap.set('laporan_webometrics', {
        id: 'laporan_webometrics',
        label: 'Laporan Webometrics',
        icon: '🌐',
        count: 0
      });
    }
    if (!tabsMap.has('laporan_iku')) {
      tabsMap.set('laporan_iku', {
        id: 'laporan_iku',
        label: 'Laporan IKU / Renstra',
        icon: '📈',
        count: 0
      });
    }
    if (!tabsMap.has('laporan_sdgs')) {
      tabsMap.set('laporan_sdgs', {
        id: 'laporan_sdgs',
        label: 'Laporan SDGs',
        icon: '🌱',
        count: 0
      });
    }

    // Tambahkan format unik dari data tags
    dataList.forEach(d => {
      if (d.tags && typeof d.tags === 'object') {
        Object.keys(d.tags).forEach(tagKey => {
          if (!tabsMap.has(tagKey)) {
            const pretty = tagKey
              .replace(/^(laporan_|target_)/, '')
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase());
            tabsMap.set(tagKey, {
              id: tagKey,
              label: `Laporan ${pretty}`,
              icon: '🔖',
              count: 0
            });
          }
        });
      }
    });

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
    return Array.from(new Set(dataList.map(d => d.unit).filter(Boolean)));
  }, [dataList]);

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

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const expandAll = () => {
    setExpandedGroups(groupedData.map(g => g.label));
  };

  const collapseAll = () => {
    setExpandedGroups([]);
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Grand Totals
  const grandTotal = useMemo(() => {
    const anggaran = groupedData.reduce((acc, g) => acc + g.totalAnggaran, 0);
    const realisasi = groupedData.reduce((acc, g) => acc + g.totalRealisasi, 0);
    const sisa = anggaran - realisasi;
    const pct = anggaran > 0 ? ((realisasi / anggaran) * 100).toFixed(1) : '0';
    const totalItems = groupedData.reduce((acc, g) => acc + g.rows.length, 0);
    return { anggaran, realisasi, sisa, pct, totalItems };
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
          'Pagu Anggaran (Rp)': Number(r.anggaran) || 0,
          'Realisasi (Rp)': Number(r.realisasi) || 0,
          'Sisa Anggaran (Rp)': (Number(r.anggaran) || 0) - (Number(r.realisasi) || 0)
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

      {/* KPI METRIC CARDS (SERAGAM DENGAN RKA PENGELUARAN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Kategori Terpetakan */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Format Laporan Terpetakan
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              {groupedData.length} <span className="text-xs font-semibold text-gray-500 font-sans">Kategori</span>
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>{grandTotal.totalItems.toLocaleString('id-ID')} Baris Belanja</span>
              <Badge variant="secondary" className="text-[10px] font-bold">TA {tahunFilter}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Pagu Teridentifikasi */}
        <Card className="rounded-2xl shadow-xs border-indigo-200 bg-gradient-to-b from-white to-indigo-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 text-indigo-700">
              <span>{activeTabObj?.icon || '📊'}</span>
              <span>Total Pagu Terpetakan</span>
            </span>
            <div className="text-2xl font-black font-mono text-indigo-950">
              Rp {formatRp(grandTotal.anggaran)}
            </div>
            <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-indigo-200/60 text-indigo-800">
              <span>Format: {activeTabObj?.label || 'Laporan'}</span>
              <span className="text-[10px] font-mono font-bold">100% Valid</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Realisasi Belanja */}
        <Card className="rounded-2xl border-emerald-100 shadow-xs bg-gradient-to-b from-white to-emerald-50/30">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Total Realisasi Belanja
            </span>
            <div className="text-2xl font-black font-mono text-emerald-700">
              Rp {formatRp(grandTotal.realisasi)}
            </div>
            <div className="text-xs text-emerald-700 font-semibold flex items-center justify-between pt-1 border-t border-emerald-100/60">
              <span>Serapan: {grandTotal.pct}%</span>
              <div className="w-16 bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${Math.min(100, parseFloat(grandTotal.pct))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Sisa Anggaran */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Sisa Anggaran Belanja
            </span>
            <div className="text-2xl font-black font-mono text-gray-900">
              Rp {formatRp(grandTotal.sisa)}
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span>Belum Terealisasi</span>
              <span className="text-[10px] font-mono text-gray-400">
                {(100 - parseFloat(grandTotal.pct)).toFixed(1)}% Sisa
              </span>
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

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="h-8 text-xs font-bold rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Buka Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="h-8 text-xs font-bold rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Tutup Semua
              </Button>
            </div>
          </div>

          {/* Baris 2: Filter Tahun, Fakultas Autocomplete, dan Search Bar */}
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

            {/* Filter Fakultas Autocomplete */}
            <div className="sm:col-span-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Fakultas / Unit Kerja
              </label>
              <UnitAutocompleteInput
                units={unitOptions}
                value={unitFilter}
                onChange={setUnitFilter}
                placeholder="Pilih atau cari unit..."
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
                  placeholder="Cari format laporan, uraian belanja, kegiatan, unit..."
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

      {/* DAFTAR KATEGORI LAPORAN & ACCORDION BREAKDOWN */}
      <div className="space-y-3.5">
        {loading ? (
          <Card className="rounded-2xl border-gray-200/80 shadow-xs">
            <CardContent className="p-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="animate-spin text-indigo-600" size={30} />
              <span className="text-xs font-bold text-gray-500">Menyusun rekapitulasi laporan...</span>
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
        ) : (
          groupedData.map((group, gIdx) => {
            const isExpanded = expandedGroups.includes(group.label);
            const pct = group.totalAnggaran > 0 ? Math.min(100, Math.round((group.totalRealisasi / group.totalAnggaran) * 100)) : 0;
            const sisaGroup = group.totalAnggaran - group.totalRealisasi;

            return (
              <Card 
                key={group.label || gIdx} 
                className={`rounded-2xl shadow-xs transition-all overflow-hidden border ${
                  isExpanded 
                    ? isKemen ? 'border-blue-300' : 'border-emerald-300'
                    : 'border-gray-200/80 hover:border-gray-300'
                }`}
              >
                {/* Header Group Accordion */}
                <div 
                  onClick={() => toggleGroup(group.label)}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isExpanded 
                      ? isKemen ? 'bg-blue-50/40' : 'bg-emerald-50/40'
                      : 'hover:bg-gray-50/80 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      isKemen ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isKemen ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        }`}>
                          <span>{isKemen ? '🏛️' : '🌐'}</span>
                          <span>{isKemen ? 'Format Kementerian' : 'Format Webometrics'}</span>
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {group.rows.length} Item Belanja
                        </Badge>
                      </div>
                      <h3 className="font-black text-gray-900 text-sm mt-1">
                        {group.label}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Total Pagu</span>
                      <span className="font-black font-mono text-gray-900 text-sm">
                        Rp {formatRp(group.totalAnggaran)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Realisasi</span>
                      <span className="font-bold font-mono text-emerald-700 text-sm">
                        Rp {formatRp(group.totalRealisasi)}
                      </span>
                    </div>

                    <div className="w-24 text-right">
                      <div className="flex items-center justify-between text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                        <span>Serapan</span>
                        <span className="font-mono text-gray-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                        Sisa: Rp {formatRp(sisaGroup)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body Details Accordion (3-Field Breakdown Table) */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 sm:p-5 space-y-2">
                    <div className="text-xs font-bold text-gray-700 flex items-center justify-between px-1">
                      <span>Rincian Baris Belanja ({group.rows.length} Data):</span>
                      <span className="text-[10px] text-gray-400 font-normal">Klik judul baris di atas untuk menutup</span>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                          <tr>
                            <th className="px-3 py-2.5 w-10 text-center">#</th>
                            <th className="px-4 py-2.5 min-w-[200px]">Fakultas / Unit Kerja</th>
                            <th className="px-4 py-2.5 min-w-[300px]">Uraian Belanja &amp; Kegiatan</th>
                            <th className="px-3 py-2.5 min-w-[130px]">Akun Detail</th>
                            <th className="px-4 py-2.5 text-right min-w-[120px]">Pagu</th>
                            <th className="px-4 py-2.5 text-right min-w-[120px]">Realisasi</th>
                            <th className="px-4 py-2.5 text-right min-w-[120px]">Sisa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                          {group.rows.map((row, rIdx) => {
                            const ang = Number(row.anggaran) || 0;
                            const rel = Number(row.realisasi) || 0;
                            const sisa = ang - rel;

                            return (
                              <tr key={row.id || rIdx} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-3 py-3 text-center text-gray-400 font-mono text-[11px] align-top">
                                  {rIdx + 1}
                                </td>
                                
                                <td className="px-4 py-3 align-top">
                                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                    <Building2 size={12} className="text-indigo-600 shrink-0" />
                                    <span>{row.unit}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                                    TA {row.tahun_anggaran} • Prioritas: {row.prioritas || '-'}
                                  </span>
                                </td>

                                <td className="px-4 py-3 align-top space-y-1">
                                  <div className="font-bold text-gray-950 leading-snug">
                                    {row.uraian_belanja || '-'}
                                  </div>
                                  {row.kegiatan && (
                                    <div className="text-[11px] text-gray-600 leading-tight">
                                      <span className="font-semibold text-gray-700">Kegiatan:</span> {row.kegiatan}
                                    </div>
                                  )}
                                  {row.lingkup_kegiatan && (
                                    <div className="text-[10px] text-indigo-700 font-medium">
                                      Lingkup: {row.lingkup_kegiatan}
                                    </div>
                                  )}
                                </td>

                                <td className="px-3 py-3 align-top font-mono text-xs">
                                  {row.akun_detail ? (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[10px] font-bold inline-block">
                                      {row.akun_detail}
                                    </span>
                                  ) : '-'}
                                </td>

                                <td className="px-4 py-3 align-top text-right font-mono font-bold text-gray-900">
                                  Rp {formatRp(ang)}
                                </td>

                                <td className="px-4 py-3 align-top text-right font-mono font-bold text-emerald-700">
                                  Rp {formatRp(rel)}
                                </td>

                                <td className="px-4 py-3 align-top text-right font-mono text-gray-600">
                                  Rp {formatRp(sisa)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
}
