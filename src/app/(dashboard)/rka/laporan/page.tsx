"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Download, RefreshCw, Building2, Search, 
  ChevronDown, ChevronUp, FolderTree, BookOpen, Sparkles,
  PieChart, ArrowRight, Wand2, X, FileSpreadsheet, Check, RotateCcw,
  ChevronLeft, ChevronRight, Eye, Filter, Wallet, TrendingUp, TrendingDown
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
  const [penerimaanList, setPenerimaanList] = useState<any[]>([]);
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<string[]>([]);
  const [govUnitsList, setGovUnitsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunningEngine, setIsRunningEngine] = useState(false);

  // Filter States
  const [modeLaporan, setModeLaporan] = useState<string>('proposal rkat');
  const [tahunFilter, setTahunFilter] = useState<string>('2027');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [kategoriFilter, setKategoriFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Tampilan Tabel Seragam (Summary vs Rekap Unit vs Detail)
  const [activeViewTab, setActiveViewTab] = useState<'summary' | 'rekap_unit' | 'detail'>('summary');
  const [activeDetailSubtab, setActiveDetailSubtab] = useState<'belanja' | 'penerimaan'>('belanja');
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
      if (json.success) {
        if (json.units) {
          const sorted = [...json.units].sort((a: string, b: string) => a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' }));
          setUnitsList(sorted);
        }
        if (json.govUnits) setGovUnitsList(json.govUnits);
      }
    } catch (e) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Query Pengeluaran / Belanja
      let urlPengeluaran = `/api/rka/pengeluaran?tahun=${tahunFilter}&only_classified=true&format=${encodeURIComponent(modeLaporan)}`;
      if (unitFilter !== 'ALL') urlPengeluaran += `&unit=${encodeURIComponent(unitFilter)}`;

      // 2. Query Penerimaan / Pendapatan
      let urlPenerimaan = `/api/rka/penerimaan?tahun=${tahunFilter}`;
      if (unitFilter !== 'ALL') urlPenerimaan += `&unit=${encodeURIComponent(unitFilter)}`;

      const [resPeng, resPen] = await Promise.all([
        fetch(urlPengeluaran),
        fetch(urlPenerimaan)
      ]);
      const [jsonPeng, jsonPen] = await Promise.all([
        resPeng.json(),
        resPen.json()
      ]);

      if (jsonPeng.success) {
        setDataList(jsonPeng.data || []);
      } else {
        toast.error('Gagal memuat data pengeluaran: ' + jsonPeng.error);
      }

      if (jsonPen.success) {
        setPenerimaanList(jsonPen.data || []);
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
    const combined = new Set<string>([
      ...dataList.map(d => d.unit).filter(Boolean),
      ...penerimaanList.map(p => p.unit_kerja).filter(Boolean)
    ]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b, 'id', { numeric: true, sensitivity: 'base' }));
  }, [unitsList, dataList, penerimaanList]);

  // Kelompokkan data Penerimaan per Format Proposal / Kelompok Penerimaan (Bagian Atas)
  const groupedPenerimaan = useMemo(() => {
    const validRows = penerimaanList.filter(d => {
      if (search) {
        const lower = search.toLowerCase();
        return (
          (d.unit_kerja && d.unit_kerja.toLowerCase().includes(lower)) ||
          (d.nama_akun_penerimaan && d.nama_akun_penerimaan.toLowerCase().includes(lower)) ||
          (d.keterangan && d.keterangan.toLowerCase().includes(lower)) ||
          (d.sumber_dana && d.sumber_dana.toLowerCase().includes(lower)) ||
          (d.format_proposal && d.format_proposal.toLowerCase().includes(lower)) ||
          (d.kelompok_penerimaan && d.kelompok_penerimaan.toLowerCase().includes(lower))
        );
      }
      return true;
    });

    const groups: Record<string, { label: string; rows: any[]; totalPagu: number; totalVolume: number }> = {};

    validRows.forEach(row => {
      const label = (row.format_proposal || row.kelompok_penerimaan || 'Penerimaan Lainnya').trim();
      if (!groups[label]) {
        groups[label] = {
          label,
          rows: [],
          totalPagu: 0,
          totalVolume: 0
        };
      }
      groups[label].rows.push(row);
      groups[label].totalPagu += Number(row.renterima_pagu) || 0;
      groups[label].totalVolume += Number(row.renterima_volume) || 0;
    });

    return Object.values(groups).sort((a, b) => b.totalPagu - a.totalPagu);
  }, [penerimaanList, search]);

  const grandTotalPenerimaan = useMemo(() => {
    const totalPagu = groupedPenerimaan.reduce((acc, g) => acc + g.totalPagu, 0);
    const totalItems = groupedPenerimaan.reduce((acc, g) => acc + g.rows.length, 0);
    return { totalPagu, totalItems };
  }, [groupedPenerimaan]);

  // Kelompokkan data Belanja per Kategori Laporan yang dipilih (Bagian Bawah)
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

  // Semua baris penerimaan valid sesuai filter
  const allDetailPenerimaanRows = useMemo(() => {
    return penerimaanList.filter(d => {
      if (search) {
        const lower = search.toLowerCase();
        return (
          (d.unit_kerja && d.unit_kerja.toLowerCase().includes(lower)) ||
          (d.nama_akun_penerimaan && d.nama_akun_penerimaan.toLowerCase().includes(lower)) ||
          (d.keterangan && d.keterangan.toLowerCase().includes(lower)) ||
          (d.sumber_dana && d.sumber_dana.toLowerCase().includes(lower)) ||
          (d.format_proposal && d.format_proposal.toLowerCase().includes(lower)) ||
          (d.kelompok_penerimaan && d.kelompok_penerimaan.toLowerCase().includes(lower))
        );
      }
      return true;
    });
  }, [penerimaanList, search]);

  // Paginated Rows untuk Tab Detail
  const paginatedRows = useMemo(() => {
    if (pageSize === 'ALL') return allDetailRows;
    const start = (currentPage - 1) * pageSize;
    return allDetailRows.slice(start, start + pageSize);
  }, [allDetailRows, currentPage, pageSize]);

  const paginatedPenerimaanRows = useMemo(() => {
    if (pageSize === 'ALL') return allDetailPenerimaanRows;
    const start = (currentPage - 1) * pageSize;
    return allDetailPenerimaanRows.slice(start, start + pageSize);
  }, [allDetailPenerimaanRows, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    const list = activeDetailSubtab === 'penerimaan' ? allDetailPenerimaanRows : allDetailRows;
    if (pageSize === 'ALL') return 1;
    return Math.ceil(list.length / pageSize) || 1;
  }, [activeDetailSubtab, allDetailPenerimaanRows.length, allDetailRows.length, pageSize]);

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

  // Aksi Klik Unit Kerja dari Rekap untuk membuka Rincian
  const handleViewUnitDetail = (unitName: string) => {
    setUnitFilter(unitName);
    setActiveViewTab('detail');
    setCurrentPage(1);
  };

  // Helper mendapatkan Group Organisasi dari master gov_units
  const getUnitGroupOrg = (unitStr: string): string => {
    if (!unitStr) return 'Lainnya';
    const uTrim = unitStr.trim();
    
    // 1. Cocokkan kode unit dari gov_units
    const matchByCode = govUnitsList.find(g => g.kode_unit && uTrim.startsWith(g.kode_unit));
    if (matchByCode?.group_org) return matchByCode.group_org;

    // 2. Cocokkan nama unit
    const matchByName = govUnitsList.find(g => g.nama_unit && (
      uTrim.toLowerCase().includes(g.nama_unit.toLowerCase()) || 
      g.nama_unit.toLowerCase().includes(uTrim.toLowerCase())
    ));
    if (matchByName?.group_org) return matchByName.group_org;

    // 3. Heuristik berdasarkan kata kunci nama unit
    const uLower = uTrim.toLowerCase();
    if (uLower.includes('fakultas')) return 'Fakultas';
    if (uLower.includes('sekolah')) return 'Sekolah';
    if (uLower.includes('direktorat') || uLower.includes('biro') || uLower.includes('kptu') || uLower.includes('kantor') || uLower.includes('sekretaris') || uLower.includes('satuan') || uLower.includes('badan')) return 'KPTU';
    if (uLower.includes('pusat') || uLower.includes('laboratorium') || uLower.includes('perpustakaan') || uLower.includes('arsip') || uLower.includes('rumah sakit')) return 'Unit Penunjang';
    return 'Lainnya';
  };

  // Rekapitulasi per Unit Kerja: Usulan Penerimaan, Pengeluaran Operasional, Belanja Modal, Surplus/Defisit
  const unitRekapData = useMemo(() => {
    const unitMap: Record<string, {
      unit: string;
      groupOrg: string;
      penerimaan: number;
      operasional: number;
      modal: number;
      totalPengeluaran: number;
      surplusDefisit: number;
      count: number;
      penerimaanCount: number;
      breakdown: {
        pegawai: number;
        barangJasa: number;
        pemeliharaan: number;
        perjalanan: number;
        lainnya: number;
      };
    }> = {};

    const getOrCreateUnit = (u: string) => {
      const uTrim = (u || 'Lainnya').trim();
      if (!unitMap[uTrim]) {
        unitMap[uTrim] = {
          unit: uTrim,
          groupOrg: getUnitGroupOrg(uTrim),
          penerimaan: 0,
          operasional: 0,
          modal: 0,
          totalPengeluaran: 0,
          surplusDefisit: 0,
          count: 0,
          penerimaanCount: 0,
          breakdown: {
            pegawai: 0,
            barangJasa: 0,
            pemeliharaan: 0,
            perjalanan: 0,
            lainnya: 0
          }
        };
      }
      return unitMap[uTrim];
    };

    // 1. Akumulasi Usulan Penerimaan / Pendapatan
    penerimaanList.forEach(row => {
      const u = (row.unit_kerja || 'Lainnya').trim();
      if (unitFilter !== 'ALL' && u !== unitFilter) return;
      if (search) {
        const lower = search.toLowerCase();
        const match = u.toLowerCase().includes(lower) ||
          (row.nama_akun_penerimaan && row.nama_akun_penerimaan.toLowerCase().includes(lower)) ||
          (row.keterangan && row.keterangan.toLowerCase().includes(lower)) ||
          (row.sumber_dana && row.sumber_dana.toLowerCase().includes(lower));
        if (!match) return;
      }
      const item = getOrCreateUnit(u);
      const pagu = Number(row.renterima_pagu) || 0;
      item.penerimaan += pagu;
      item.penerimaanCount += 1;
    });

    // 2. Akumulasi Usulan Pengeluaran / Belanja
    const validBelanjaRows = dataList.filter(d => {
      const val = getRowClassification(d, modeLaporan);
      if (!val || val.trim() === '') return false;
      if (unitFilter !== 'ALL' && d.unit !== unitFilter) return false;
      if (kategoriFilter !== 'ALL' && val !== kategoriFilter) return false;
      if (search) {
        const lower = search.toLowerCase();
        return (
          (d.unit && d.unit.toLowerCase().includes(lower)) ||
          (d.uraian_belanja && d.uraian_belanja.toLowerCase().includes(lower)) ||
          (d.kegiatan && d.kegiatan.toLowerCase().includes(lower)) ||
          (d.lingkup_kegiatan && d.lingkup_kegiatan.toLowerCase().includes(lower)) ||
          (d.akun_detail && d.akun_detail.toLowerCase().includes(lower)) ||
          val.toLowerCase().includes(lower)
        );
      }
      return true;
    });

    validBelanjaRows.forEach(row => {
      const u = (row.unit || 'Lainnya').trim();
      const item = getOrCreateUnit(u);

      const ang = Number(row.anggaran) || 0;
      const akun = (row.akun_detail || '').trim();
      const val = (getRowClassification(row, modeLaporan) || '').toLowerCase();

      // Identifikasi Belanja Modal: Akun 55* atau label mengandung 'modal'
      const isModal = akun.startsWith('55') || val.includes('modal');

      item.count += 1;
      if (isModal) {
        item.modal += ang;
      } else {
        item.operasional += ang;
        if (akun.startsWith('51') || val.includes('pegawai')) {
          item.breakdown.pegawai += ang;
        } else if (akun.startsWith('52') || val.includes('barang') || val.includes('jasa')) {
          item.breakdown.barangJasa += ang;
        } else if (akun.startsWith('53') || val.includes('pemeliharaan') || val.includes('perbaikan')) {
          item.breakdown.pemeliharaan += ang;
        } else if (akun.startsWith('54') || val.includes('perjalanan')) {
          item.breakdown.perjalanan += ang;
        } else {
          item.breakdown.lainnya += ang;
        }
      }

      item.totalPengeluaran += ang;
    });

    // 3. Kalkulasi Posisi Surplus / (Defisit) Riil
    Object.values(unitMap).forEach(u => {
      u.surplusDefisit = u.penerimaan - u.totalPengeluaran;
    });

    // Diurutkan A-Z berdasarkan KODE & NAMA UNIT KERJA sesuai permintaan pengguna
    return Object.values(unitMap).sort((a, b) => a.unit.localeCompare(b.unit, 'id', { numeric: true, sensitivity: 'base' }));
  }, [penerimaanList, dataList, modeLaporan, unitFilter, kategoriFilter, search, govUnitsList]);

  // Data Rekapitulasi Dikelompokkan per Group Org dari master gov_units
  const groupedByOrg = useMemo(() => {
    const groups: Record<string, {
      groupOrg: string;
      units: typeof unitRekapData;
      totalPenerimaan: number;
      totalOperasional: number;
      totalModal: number;
      totalPengeluaran: number;
      totalSurplusDefisit: number;
      totalCount: number;
    }> = {};

    unitRekapData.forEach(item => {
      const g = item.groupOrg || 'Lainnya';
      if (!groups[g]) {
        groups[g] = {
          groupOrg: g,
          units: [],
          totalPenerimaan: 0,
          totalOperasional: 0,
          totalModal: 0,
          totalPengeluaran: 0,
          totalSurplusDefisit: 0,
          totalCount: 0
        };
      }
      groups[g].units.push(item);
      groups[g].totalPenerimaan += item.penerimaan;
      groups[g].totalOperasional += item.operasional;
      groups[g].totalModal += item.modal;
      groups[g].totalPengeluaran += item.totalPengeluaran;
      groups[g].totalSurplusDefisit += item.surplusDefisit;
      groups[g].totalCount += item.count;
    });

    const groupOrder = ['Fakultas', 'Sekolah', 'KPTU', 'Unit Penunjang', 'Lainnya'];
    return Object.values(groups).sort((a, b) => {
      const idxA = groupOrder.indexOf(a.groupOrg);
      const idxB = groupOrder.indexOf(b.groupOrg);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.groupOrg.localeCompare(b.groupOrg);
    });
  }, [unitRekapData]);

  const unitRekapTotals = useMemo(() => {
    let grandTotalPenerimaan = 0;
    let totalOperasional = 0;
    let totalModal = 0;
    let grandTotalPengeluaran = 0;
    let grandTotalSurplusDefisit = 0;
    let totalItems = 0;
    unitRekapData.forEach(item => {
      grandTotalPenerimaan += item.penerimaan;
      totalOperasional += item.operasional;
      totalModal += item.modal;
      grandTotalPengeluaran += item.totalPengeluaran;
      grandTotalSurplusDefisit += item.surplusDefisit;
      totalItems += item.count;
    });
    return { grandTotalPenerimaan, totalOperasional, totalModal, grandTotalPengeluaran, grandTotalSurplusDefisit, totalItems };
  }, [unitRekapData]);

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Grand Totals
  const grandTotal = useMemo(() => {
    const anggaran = groupedData.reduce((acc, g) => acc + g.totalAnggaran, 0);
    const totalItems = groupedData.reduce((acc, g) => acc + g.rows.length, 0);
    return { anggaran, totalItems };
  }, [groupedData]);

  // Export Excel Rekap Unit Kerja (Format Rapi & Elegan Siap Tayang / Print)
  const handleExportExcelUnitRekap = () => {
    if (unitRekapData.length === 0) return toast.error('Tidak ada data untuk diexport');

    const aoa: any[][] = [];

    // 1. Header Judul Laporan yang Rapi & Formal
    aoa.push(['UNIVERSITAS GADJAH MADA']);
    aoa.push([`REKAPITULASI USULAN PROPOSAL RKAT PER UNIT KERJA TAHUN ANGGARAN ${tahunFilter}`]);
    aoa.push([`Format Laporan: Proposal RKAT  |  Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`]);
    aoa.push([]); // Baris kosong

    // 2. Header Kolom Tabel
    aoa.push([
      'NO',
      'GROUP ORGANISASI',
      'KODE & NAMA UNIT KERJA',
      'PENERIMAAN / PENDAPATAN (RP)',
      'PENGELUARAN OPERASIONAL (RP)',
      'BELANJA MODAL (RP)',
      'TOTAL PENGELUARAN (RP)',
      'SURPLUS / (DEFISIT) ANGGARAN (RP)'
    ]);

    let rowNumber = 1;

    // 3. Baris Data per Group Org
    groupedByOrg.forEach(group => {
      // Header Group
      aoa.push([
        '',
        group.groupOrg.toUpperCase(),
        `--- ${group.groupOrg.toUpperCase()} (${group.units.length} UNIT KERJA) ---`,
        '',
        '',
        '',
        '',
        ''
      ]);

      // Baris per Unit Kerja dalam grup
      group.units.forEach(u => {
        aoa.push([
          rowNumber++,
          group.groupOrg,
          u.unit,
          u.penerimaan,
          u.operasional,
          u.modal,
          u.totalPengeluaran,
          u.surplusDefisit
        ]);
      });

      // Subtotal per Group Org
      aoa.push([
        '',
        `SUBTOTAL ${group.groupOrg}`,
        `TOTAL ${group.groupOrg.toUpperCase()} (${group.units.length} Unit)`,
        group.totalPenerimaan,
        group.totalOperasional,
        group.totalModal,
        group.totalPengeluaran,
        group.totalSurplusDefisit
      ]);

      aoa.push([]); // Spacer baris kosong antar group
    });

    // 4. Baris TOTAL KESELURUHAN
    aoa.push([
      '',
      'TOTAL KESELURUHAN',
      `TOTAL SELURUH UNIT KERJA (${unitRekapData.length} UNIT KERJA)`,
      unitRekapTotals.grandTotalPenerimaan,
      unitRekapTotals.totalOperasional,
      unitRekapTotals.totalModal,
      unitRekapTotals.grandTotalPengeluaran,
      unitRekapTotals.grandTotalSurplusDefisit
    ]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // 5. Atur Lebar Kolom agar tidak ada teks terpotong / tanda ###
    ws['!cols'] = [
      { wch: 6 },  // NO
      { wch: 22 }, // GROUP ORGANISASI
      { wch: 55 }, // KODE & NAMA UNIT KERJA
      { wch: 30 }, // PENERIMAAN / PENDAPATAN (RP)
      { wch: 30 }, // PENGELUARAN OPERASIONAL (RP)
      { wch: 26 }, // BELANJA MODAL (RP)
      { wch: 28 }, // TOTAL PENGELUARAN (RP)
      { wch: 30 }  // SURPLUS / (DEFISIT) ANGGARAN (RP)
    ];

    // Format seluruh sel nominal angka dengan format desimal mata uang standar Excel
    for (let r = 4; r < aoa.length; r++) {
      for (let c = 3; c <= 7; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
          ws[cellRef].z = '#,##0'; // format number with thousands separator
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Unit_Kerja');
    XLSX.writeFile(wb, `Rekap_Proposal_RKAT_Unit_Kerja_${tahunFilter}.xlsx`);
    toast.success('File Excel Rekapitulasi Unit Kerja berhasil diexport!');
  };

  // Export Excel (Switchable based on active view)
  const handleExportExcel = () => {
    if (activeViewTab === 'rekap_unit') {
      return handleExportExcelUnitRekap();
    }
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

          <Link href="/rka/penerimaan">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Wallet size={14} className="text-emerald-600" />
              <span>RKA Penerimaan</span>
            </Button>
          </Link>

          <Link href="/rka/pengeluaran">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold gap-1.5 shadow-2xs"
            >
              <FolderTree size={14} className="text-gray-600" />
              <span>RKA Pengeluaran</span>
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

      {/* KPI METRIC CARDS (FOKUS TOTAL PENERIMAAN, PENGELUARAN & SURPLUS/DEFISIT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Usulan Penerimaan */}
        <Card className="rounded-2xl shadow-xs border-emerald-200 bg-gradient-to-b from-white to-emerald-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center justify-between text-emerald-700">
              <span className="flex items-center gap-1">
                <Wallet size={13} />
                <span>Usulan Penerimaan</span>
              </span>
              <Badge variant="outline" className="bg-emerald-100/60 text-emerald-800 border-emerald-300 text-[9px] font-mono font-bold">
                PENDAPATAN
              </Badge>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-950">
              Rp {formatRp(unitRekapTotals.grandTotalPenerimaan)}
            </div>
            <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-emerald-200/60 text-emerald-800">
              <span>{grandTotalPenerimaan.totalItems.toLocaleString('id-ID')} Rincian Akun</span>
              <span className="text-[10px] font-mono font-bold">Pagu Penerimaan</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Usulan Belanja */}
        <Card className="rounded-2xl shadow-xs border-indigo-200 bg-gradient-to-b from-white to-indigo-50/40">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center justify-between text-indigo-700">
              <span className="flex items-center gap-1">
                <FileSpreadsheet size={13} />
                <span>Usulan Belanja</span>
              </span>
              <Badge variant="outline" className="bg-indigo-100/60 text-indigo-800 border-indigo-300 text-[9px] font-mono font-bold">
                PENGELUARAN
              </Badge>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-indigo-950">
              Rp {formatRp(unitRekapTotals.grandTotalPengeluaran)}
            </div>
            <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-indigo-200/60 text-indigo-800">
              <span>{grandTotal.totalItems.toLocaleString('id-ID')} Rincian Belanja</span>
              <span className="text-[10px] font-mono font-bold">Pagu Belanja</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Posisi Surplus / Defisit Anggaran Riil */}
        <Card className={`rounded-2xl shadow-xs border ${
          unitRekapTotals.grandTotalSurplusDefisit >= 0 
            ? 'border-teal-200 bg-gradient-to-b from-white to-teal-50/40' 
            : 'border-rose-200 bg-gradient-to-b from-white to-rose-50/40'
        }`}>
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider block flex items-center justify-between">
              <span className={`flex items-center gap-1 ${
                unitRekapTotals.grandTotalSurplusDefisit >= 0 ? 'text-teal-700' : 'text-rose-700'
              }`}>
                {unitRekapTotals.grandTotalSurplusDefisit >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                <span>Surplus / (Defisit)</span>
              </span>
              <Badge 
                variant="outline" 
                className={`text-[9px] font-mono font-bold ${
                  unitRekapTotals.grandTotalSurplusDefisit >= 0 
                    ? 'bg-teal-100 text-teal-800 border-teal-300' 
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {unitRekapTotals.grandTotalSurplusDefisit >= 0 ? 'SURPLUS' : 'DEFISIT'}
              </Badge>
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              unitRekapTotals.grandTotalSurplusDefisit >= 0 ? 'text-teal-950' : 'text-rose-950'
            }`}>
              {unitRekapTotals.grandTotalSurplusDefisit < 0 && '- '}Rp {formatRp(Math.abs(unitRekapTotals.grandTotalSurplusDefisit))}
            </div>
            <div className={`text-xs font-semibold flex items-center justify-between pt-1 border-t ${
              unitRekapTotals.grandTotalSurplusDefisit >= 0 ? 'border-teal-200/60 text-teal-800' : 'border-rose-200/60 text-rose-800'
            }`}>
              <span>Penerimaan vs Pengeluaran</span>
              <span className="text-[10px] font-mono font-bold">Posisi Kas</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Format Laporan & Unit Terdaftar */}
        <Card className="rounded-2xl border-gray-200/80 shadow-xs">
          <CardContent className="p-5 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Unit Kerja &amp; Format</span>
              <Badge variant="outline" className="text-[9px] font-mono font-bold bg-gray-50">
                TA {tahunFilter}
              </Badge>
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 font-mono flex items-center gap-1.5">
              <span>{unitRekapData.length}</span>
              <span className="text-xs font-semibold text-gray-500 font-sans">Unit Kerja</span>
            </div>
            <div className="text-xs text-gray-500 font-semibold flex items-center justify-between pt-1 border-t border-gray-100">
              <span className="truncate max-w-[140px]">{activeTabObj?.label || 'Proposal RKAT'}</span>
              <span className="text-indigo-600 font-medium">Siap Dilaporkan</span>
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
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-max border border-gray-200">
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
                <span>📊 Ringkasan Usulan (Atas: Penerimaan, Bawah: Belanja)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab('rekap_unit')}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeViewTab === 'rekap_unit'
                    ? 'bg-white text-gray-900 shadow-xs font-black'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <Building2 size={14} className="text-indigo-600" />
                <span>🏛️ Rekap Unit Kerja (Penerimaan, Belanja &amp; Surplus/Defisit) ({unitRekapData.length})</span>
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
                <span>📋 Tabel Rincian Data ({allDetailRows.length.toLocaleString('id-ID')})</span>
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
          /* TAB VIEW 1: ATAS BAWAH (ATAS: PENERIMAAN, BAWAH: BELANJA) */
          /* ======================================================== */
          <div className="space-y-6">
            
            {/* BAGIAN ATAS: RINGKASAN USULAN PENERIMAAN / PENDAPATAN */}
            <Card className="rounded-2xl border-emerald-200/90 shadow-xs overflow-hidden">
              <CardHeader className="bg-emerald-50/70 p-4 sm:p-5 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm sm:text-base font-black text-emerald-950 flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-600" />
                    <span>1. Ringkasan Alokasi Usulan Penerimaan / Pendapatan</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-emerald-800 font-medium mt-0.5">
                    Akumulasi alokasi usulan pagu penerimaan per format / kelompok pendapatan
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold font-mono bg-white text-emerald-800 border-emerald-200">
                    {groupedPenerimaan.length} Kelompok Penerimaan
                  </Badge>
                  <Badge className="bg-emerald-600 text-white text-xs font-bold font-mono">
                    {grandTotalPenerimaan.totalItems.toLocaleString('id-ID')} Total Baris
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-emerald-50/40 border-b border-emerald-100 text-emerald-800 font-black uppercase text-[10px] tracking-wider">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center text-emerald-800 text-xs uppercase font-bold">#</TableHead>
                      <TableHead className="text-emerald-800 text-xs uppercase font-bold min-w-[280px]">Format / Kelompok Penerimaan</TableHead>
                      <TableHead className="text-center text-emerald-800 text-xs uppercase font-bold w-36">Jumlah Baris</TableHead>
                      <TableHead className="text-right text-emerald-800 text-xs uppercase font-bold min-w-[180px]">Total Pagu Penerimaan</TableHead>
                      <TableHead className="text-center text-emerald-800 text-xs uppercase font-bold w-36">% Proporsi Penerimaan</TableHead>
                      <TableHead className="text-center text-emerald-800 text-xs uppercase font-bold w-24">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPenerimaan.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium">
                          Tidak ada data penerimaan yang sesuai kriteria filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedPenerimaan.map((group, gIdx) => {
                        const proporsiPct = grandTotalPenerimaan.totalPagu > 0 
                          ? ((group.totalPagu / grandTotalPenerimaan.totalPagu) * 100).toFixed(1)
                          : '0';

                        return (
                          <TableRow 
                            key={group.label || gIdx} 
                            className="border-b border-gray-100 hover:bg-emerald-50/40 transition-colors"
                          >
                            <TableCell className="text-center font-mono font-bold text-gray-400 text-xs">
                              {gIdx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                                <span>💰</span>
                                <span>{group.label}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold font-mono border border-emerald-100">
                                {group.rows.length.toLocaleString('id-ID')} Baris
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-black font-mono text-emerald-950 text-sm">
                                Rp {formatRp(group.totalPagu)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-1 max-w-[110px] mx-auto">
                                <div className="text-[11px] font-bold font-mono text-emerald-800 text-right">
                                  {proporsiPct}%
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-600 rounded-full"
                                    style={{ width: `${Math.min(100, parseFloat(proporsiPct))}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setActiveDetailSubtab('penerimaan');
                                  setActiveViewTab('detail');
                                  setSearch(group.label);
                                }}
                                className="h-8 w-8 p-0 rounded-xl border-emerald-200 bg-emerald-50/60 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto"
                                title={`Buka rincian penerimaan ${group.label}`}
                              >
                                <Eye size={15} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                  <tfoot className="bg-emerald-50/80 font-bold border-t-2 border-emerald-200">
                    <tr>
                      <td colSpan={2} className="p-4 text-xs font-black uppercase tracking-wider text-emerald-950">
                        TOTAL KESELURUHAN PENERIMAAN ({groupedPenerimaan.length} KELOMPOK)
                      </td>
                      <td className="p-4 text-center text-xs font-black font-mono text-emerald-900">
                        {grandTotalPenerimaan.totalItems.toLocaleString('id-ID')} Baris
                      </td>
                      <td className="p-4 text-right text-sm font-black font-mono text-emerald-950">
                        Rp {formatRp(grandTotalPenerimaan.totalPagu)}
                      </td>
                      <td className="p-4 text-center text-xs font-black font-mono text-emerald-800">
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

            {/* BAGIAN BAWAH: RINGKASAN USULAN PENGELUARAN / BELANJA */}
            <Card className="rounded-2xl border-indigo-200/90 shadow-xs overflow-hidden">
              <CardHeader className="bg-indigo-50/70 p-4 sm:p-5 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm sm:text-base font-black text-indigo-950 flex items-center gap-2">
                    <span>{activeTabObj?.icon || '📊'}</span>
                    <span>2. Ringkasan Alokasi Usulan Pengeluaran / Belanja ({activeTabObj?.label || 'Format Laporan'})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-indigo-800 font-medium mt-0.5">
                    Rekapitulasi total alokasi pagu belanja dan akumulasi item belanja per kelompok akun pelaporan
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold font-mono bg-white text-indigo-800 border-indigo-200">
                    {groupedData.length} Group Belanja
                  </Badge>
                  <Badge className="bg-indigo-600 text-white text-xs font-bold font-mono">
                    {grandTotal.totalItems.toLocaleString('id-ID')} Total Baris
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-indigo-50/40 border-b border-indigo-100 text-indigo-800 font-black uppercase text-[10px] tracking-wider">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center text-indigo-800 text-xs uppercase font-bold">#</TableHead>
                      <TableHead className="text-indigo-800 text-xs uppercase font-bold min-w-[280px]">Group Belanja</TableHead>
                      <TableHead className="text-center text-indigo-800 text-xs uppercase font-bold w-36">Jumlah Baris</TableHead>
                      <TableHead className="text-right text-indigo-800 text-xs uppercase font-bold min-w-[180px]">Total Pagu Anggaran</TableHead>
                      <TableHead className="text-center text-indigo-800 text-xs uppercase font-bold w-36">% Proporsi Pagu</TableHead>
                      <TableHead className="text-center text-indigo-800 text-xs uppercase font-bold w-24">Aksi</TableHead>
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
                            <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold font-mono border border-indigo-100">
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
                              onClick={() => {
                                setActiveDetailSubtab('belanja');
                                handleViewCategoryDetail(group.label);
                              }}
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
                  <tfoot className="bg-indigo-50/80 font-bold border-t-2 border-indigo-200">
                    <tr>
                      <td colSpan={2} className="p-4 text-xs font-black uppercase tracking-wider text-indigo-950">
                        TOTAL KESELURUHAN PENGELUARAN ({groupedData.length} GROUP BELANJA)
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

          </div>
        ) : activeViewTab === 'rekap_unit' ? (
          /* ======================================================== */
          /* TAB VIEW 2: TABEL REKAPITULASI UNIT KERJA (PENERIMAAN, OPERASIONAL & MODAL) */
          /* ======================================================== */
          <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/60 p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  <span>Rekapitulasi Usulan RKAT per Unit Kerja</span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 font-medium mt-0.5">
                  Format Usulan Proposal RKAT memuat Nama Unit Kerja, Usulan Penerimaan, Pengeluaran Operasional, Belanja Modal, dan Surplus/Defisit
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcelUnitRekap}
                  className="h-8 rounded-xl border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs"
                >
                  <Download size={13} className="text-emerald-600" />
                  <span>Export Rekap Unit</span>
                </Button>
                <Badge variant="outline" className="text-xs font-bold font-mono bg-white">
                  {unitRekapData.length} Unit Kerja
                </Badge>
                <Badge variant="secondary" className="text-xs font-bold font-mono">
                  {unitRekapTotals.totalItems.toLocaleString('id-ID')} Total Baris
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12 text-center text-gray-500 text-xs uppercase font-bold">#</TableHead>
                    <TableHead className="text-gray-500 text-xs uppercase font-bold min-w-[240px]">Unit Kerja / Fakultas</TableHead>
                    <TableHead className="text-right text-emerald-800 text-xs uppercase font-bold min-w-[160px]">
                      Usulan Penerimaan
                    </TableHead>
                    <TableHead className="text-right text-gray-500 text-xs uppercase font-bold min-w-[150px]">
                      Pengeluaran Operasional
                    </TableHead>
                    <TableHead className="text-right text-gray-500 text-xs uppercase font-bold min-w-[140px]">
                      Belanja Modal
                    </TableHead>
                    <TableHead className="text-right text-gray-500 text-xs uppercase font-bold min-w-[160px]">
                      Total Pengeluaran
                    </TableHead>
                    <TableHead className="text-center text-gray-500 text-xs uppercase font-bold min-w-[160px]">
                      Surplus / (Defisit)
                    </TableHead>
                    <TableHead className="text-center text-gray-500 text-xs uppercase font-bold w-20">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedByOrg.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-400 font-medium">
                        Tidak ada data unit kerja yang sesuai kriteria filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    groupedByOrg.map((group) => {
                      return (
                        <React.Fragment key={group.groupOrg}>
                          {/* Header Group Organisasi dari Master gov_units */}
                          <TableRow className="bg-indigo-50/80 border-t-2 border-b border-indigo-200 hover:bg-indigo-50/90">
                            <TableCell colSpan={8} className="px-4 py-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-black text-xs text-indigo-950 uppercase tracking-wide">
                                  <Building2 size={15} className="text-indigo-600" />
                                  <span>GROUP ORGANISASI: {group.groupOrg}</span>
                                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                    {group.units.length} Unit Kerja
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold font-mono text-indigo-900 flex items-center gap-3">
                                  <span className="text-emerald-800 font-black">Penerimaan: Rp {formatRp(group.totalPenerimaan)}</span>
                                  <span>•</span>
                                  <span>Operasional: Rp {formatRp(group.totalOperasional)}</span>
                                  <span>•</span>
                                  <span>Modal: Rp {formatRp(group.totalModal)}</span>
                                  <span>•</span>
                                  <span className="text-indigo-950 font-black">Pengeluaran: Rp {formatRp(group.totalPengeluaran)}</span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Baris per Unit Kerja dalam Group */}
                          {group.units.map((item, uIdx) => {
                            const pctOperasional = item.totalPengeluaran > 0 
                              ? ((item.operasional / item.totalPengeluaran) * 100).toFixed(1)
                              : '0';
                            const pctModal = item.totalPengeluaran > 0 
                              ? ((item.modal / item.totalPengeluaran) * 100).toFixed(1)
                              : '0';

                            return (
                              <TableRow 
                                key={item.unit || uIdx}
                                className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors"
                              >
                                <TableCell className="text-center font-mono font-bold text-gray-400 text-xs align-top pt-3.5">
                                  {uIdx + 1}
                                </TableCell>

                                {/* Unit Kerja */}
                                <TableCell className="align-top pt-3">
                                  <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-start gap-2">
                                    <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                                    <div>
                                      <span>{item.unit}</span>
                                      <div className="text-[10px] text-gray-400 font-mono font-medium mt-0.5 flex items-center gap-2">
                                        <span>{item.count.toLocaleString('id-ID')} usulan belanja</span>
                                        <span>•</span>
                                        <span className="text-emerald-700 font-semibold">{item.penerimaanCount.toLocaleString('id-ID')} akun penerimaan</span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Usulan Penerimaan / Pendapatan */}
                                <TableCell className="text-right align-top pt-3 space-y-1">
                                  <span className="font-black font-mono text-emerald-950 text-xs sm:text-sm block">
                                    Rp {formatRp(item.penerimaan)}
                                  </span>
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700">
                                    {unitRekapTotals.grandTotalPenerimaan > 0
                                      ? ((item.penerimaan / unitRekapTotals.grandTotalPenerimaan) * 100).toFixed(1) + '% Pagu'
                                      : '0%'}
                                  </span>
                                </TableCell>

                                {/* Pengeluaran Operasional */}
                                <TableCell className="text-right align-top pt-3 space-y-1">
                                  <span className="font-black font-mono text-gray-950 text-xs sm:text-sm block">
                                    Rp {formatRp(item.operasional)}
                                  </span>
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700">
                                    {pctOperasional}% Operasional
                                  </span>
                                  {/* Mini Breakdown Pegawai */}
                                  {item.breakdown.pegawai > 0 && (
                                    <div className="text-[9px] text-gray-400 font-mono hidden sm:block">
                                      Pegawai: {formatRp(item.breakdown.pegawai)}
                                    </div>
                                  )}
                                </TableCell>

                                {/* Belanja Modal */}
                                <TableCell className="text-right align-top pt-3 space-y-1">
                                  <span className="font-black font-mono text-gray-950 text-xs sm:text-sm block">
                                    Rp {formatRp(item.modal)}
                                  </span>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    item.modal > 0 ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {pctModal}% Modal
                                  </span>
                                </TableCell>

                                {/* Total Pengeluaran */}
                                <TableCell className="text-right align-top pt-3">
                                  <span className="font-black font-mono text-indigo-950 text-sm block">
                                    Rp {formatRp(item.totalPengeluaran)}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {unitRekapTotals.grandTotalPengeluaran > 0 
                                      ? ((item.totalPengeluaran / unitRekapTotals.grandTotalPengeluaran) * 100).toFixed(1) + '% dari Total'
                                      : '0%'}
                                  </span>
                                </TableCell>

                                {/* Surplus / Defisit Anggaran */}
                                <TableCell className="text-center align-top pt-3">
                                  {item.surplusDefisit >= 0 ? (
                                    <div className="space-y-0.5">
                                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold font-mono">
                                        + Rp {formatRp(item.surplusDefisit)}
                                      </Badge>
                                      <div className="text-[9px] text-emerald-700 font-bold">
                                        Surplus Anggaran
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5">
                                      <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold font-mono">
                                        - Rp {formatRp(Math.abs(item.surplusDefisit))}
                                      </Badge>
                                      <div className="text-[9px] text-rose-700 font-bold">
                                        Defisit Anggaran
                                      </div>
                                    </div>
                                  )}
                                </TableCell>

                                {/* Aksi */}
                                <TableCell className="text-center align-top pt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewUnitDetail(item.unit)}
                                    className="h-8 w-8 p-0 rounded-xl border-indigo-200 bg-indigo-50/60 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto"
                                    title={`Buka rincian belanja ${item.unit}`}
                                  >
                                    <Eye size={15} />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Subtotal Baris per Group Org */}
                          <TableRow className="bg-slate-100/80 font-bold border-b-2 border-slate-200 text-slate-800">
                            <TableCell colSpan={2} className="px-4 py-2.5 text-[11px] font-black uppercase text-right tracking-wider">
                              SUBTOTAL {group.groupOrg.toUpperCase()} ({group.units.length} Unit)
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-right font-black font-mono text-xs text-emerald-800">
                              Rp {formatRp(group.totalPenerimaan)}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-right font-black font-mono text-xs text-slate-900">
                              Rp {formatRp(group.totalOperasional)}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-right font-black font-mono text-xs text-amber-900">
                              Rp {formatRp(group.totalModal)}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-right font-black font-mono text-xs text-indigo-950">
                              Rp {formatRp(group.totalPengeluaran)}
                            </TableCell>
                            <TableCell className={`px-4 py-2.5 text-center text-xs font-mono font-bold ${
                              group.totalSurplusDefisit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {group.totalSurplusDefisit < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisit))}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-center text-gray-300">-</TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>

                {/* Footer Total Keseluruhan */}
                <tfoot className="bg-gray-100/90 font-bold border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={2} className="p-4 text-xs font-black uppercase tracking-wider text-gray-800">
                      TOTAL KESELURUHAN ({unitRekapData.length} UNIT KERJA)
                    </td>
                    <td className="p-4 text-right text-xs sm:text-sm font-black font-mono text-emerald-800">
                      Rp {formatRp(unitRekapTotals.grandTotalPenerimaan)}
                    </td>
                    <td className="p-4 text-right text-xs sm:text-sm font-black font-mono text-gray-900">
                      Rp {formatRp(unitRekapTotals.totalOperasional)}
                    </td>
                    <td className="p-4 text-right text-xs sm:text-sm font-black font-mono text-amber-900">
                      Rp {formatRp(unitRekapTotals.totalModal)}
                    </td>
                    <td className="p-4 text-right text-sm font-black font-mono text-indigo-950">
                      Rp {formatRp(unitRekapTotals.grandTotalPengeluaran)}
                    </td>
                    <td className={`p-4 text-center text-xs font-black font-mono ${
                      unitRekapTotals.grandTotalSurplusDefisit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {unitRekapTotals.grandTotalSurplusDefisit < 0 && '- '}Rp {formatRp(Math.abs(unitRekapTotals.grandTotalSurplusDefisit))}
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
          /* TAB VIEW 3: TABEL RINCIAN DETAIL (BELANJA & PENERIMAAN)   */
          /* ======================================================== */
          <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/60 p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" />
                  <span>
                    {activeDetailSubtab === 'penerimaan'
                      ? `Tabel Rincian Penerimaan (${allDetailPenerimaanRows.length.toLocaleString('id-ID')} Data)`
                      : `Tabel Rincian Belanja (${allDetailRows.length.toLocaleString('id-ID')} Data)`}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 font-medium mt-0.5">
                  {activeDetailSubtab === 'penerimaan'
                    ? 'Daftar rincian usulan akun penerimaan / pendapatan RKAT'
                    : `Daftar seluruh item belanja usulan RKA/RKAT yang terklasifikasi ke dalam format ${activeTabObj?.label}`}
                  {kategoriFilter !== 'ALL' && activeDetailSubtab === 'belanja' && (
                    <span className="font-bold text-indigo-600"> • Filter Kategori: {kategoriFilter}</span>
                  )}
                </CardDescription>
              </div>

              {/* Subtab Toggle: Belanja vs Penerimaan */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-xl border border-gray-300/60">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailSubtab('belanja');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDetailSubtab === 'belanja'
                        ? 'bg-white text-indigo-950 shadow-xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📋 Rincian Belanja ({allDetailRows.length.toLocaleString('id-ID')})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailSubtab('penerimaan');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDetailSubtab === 'penerimaan'
                        ? 'bg-white text-emerald-950 shadow-xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    💰 Rincian Penerimaan ({allDetailPenerimaanRows.length.toLocaleString('id-ID')})
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-bold uppercase">Baris:</span>
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
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {activeDetailSubtab === 'penerimaan' ? (
                /* TABEL RINCIAN PENERIMAAN */
                <Table>
                  <TableHeader className="bg-emerald-50/50 border-b border-emerald-100 text-emerald-900 font-black uppercase text-[10px] tracking-wider">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center text-emerald-900 text-xs uppercase font-bold">#</TableHead>
                      <TableHead className="text-emerald-900 text-xs uppercase font-bold min-w-[380px]">
                        Fakultas / Unit Kerja &amp; Akun Penerimaan
                      </TableHead>
                      <TableHead className="text-center text-emerald-900 text-xs uppercase font-bold w-36">
                        Volume &amp; Tarif
                      </TableHead>
                      <TableHead className="text-right text-emerald-900 text-xs uppercase font-bold min-w-[170px]">
                        Pagu Penerimaan
                      </TableHead>
                      <TableHead className="text-center text-emerald-900 text-xs uppercase font-bold min-w-[170px]">
                        Status &amp; Sumber Dana
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPenerimaanRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-400 font-medium">
                          Tidak ada baris data penerimaan yang sesuai kriteria filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPenerimaanRows.map((row, rIdx) => {
                        const rowNum = pageSize === 'ALL' ? rIdx + 1 : (currentPage - 1) * pageSize + rIdx + 1;
                        const pagu = Number(row.renterima_pagu) || 0;
                        const tarif = Number(row.renterima_tarif) || 0;
                        const vol = Number(row.renterima_volume) || 0;

                        return (
                          <TableRow key={row.renterima_id || rIdx} className="hover:bg-emerald-50/30 transition-colors border-b border-gray-100">
                            <TableCell className="text-center text-gray-400 font-mono text-xs align-top pt-3.5">
                              {rowNum}
                            </TableCell>

                            {/* Unit Kerja & Akun Penerimaan */}
                            <TableCell className="align-top pt-3 space-y-1.5">
                              <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                <Building2 size={13} className="text-emerald-600 shrink-0" />
                                <span>{row.unit_kerja}</span>
                                <span className="text-[10px] text-gray-400 font-mono font-medium ml-1">
                                  TA {row.tahun}
                                </span>
                              </div>
                              <div className="font-mono text-xs font-bold text-emerald-900">
                                {row.nama_akun_penerimaan}
                              </div>
                              {row.keterangan && (
                                <div className="text-[11px] text-gray-600 italic bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                  {row.keterangan}
                                </div>
                              )}
                            </TableCell>

                            {/* Volume & Tarif */}
                            <TableCell className="align-top pt-3 text-center space-y-1">
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-mono text-xs font-bold">
                                {vol.toLocaleString('id-ID')} Vol
                              </span>
                              <div className="text-[11px] text-gray-500 font-mono">
                                @ Rp {formatRp(tarif)}
                              </div>
                            </TableCell>

                            {/* Pagu Penerimaan */}
                            <TableCell className="align-top pt-3 text-right">
                              <span className="text-[9px] uppercase font-bold text-emerald-700 block tracking-wider mb-1">
                                Pagu Penerimaan
                              </span>
                              <span className="font-black font-mono text-emerald-950 text-sm">
                                Rp {formatRp(pagu)}
                              </span>
                            </TableCell>

                            {/* Status & Sumber Dana */}
                            <TableCell className="align-top pt-3 text-center space-y-1">
                              <div>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                                  {row.status || 'Aktif'}
                                </Badge>
                              </div>
                              <div className="text-[10px] text-gray-500 font-medium">
                                {row.sumber_dana || 'Dana Masyarakat'}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              ) : (
                /* TABEL RINCIAN BELANJA */
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
              )}
            </CardContent>

            {/* Pagination Controls Footer (Seragam dengan /rka/pengeluaran) */}
            <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-medium">
              <div>
                {activeDetailSubtab === 'penerimaan' ? (
                  <span>
                    Menampilkan <strong>{pageSize === 'ALL' ? allDetailPenerimaanRows.length : Math.min((currentPage - 1) * (pageSize as number) + 1, allDetailPenerimaanRows.length)}</strong> sampai <strong>{pageSize === 'ALL' ? allDetailPenerimaanRows.length : Math.min(currentPage * (pageSize as number), allDetailPenerimaanRows.length)}</strong> dari <strong>{allDetailPenerimaanRows.length.toLocaleString('id-ID')}</strong> total baris penerimaan
                  </span>
                ) : (
                  <span>
                    Menampilkan <strong>{pageSize === 'ALL' ? allDetailRows.length : Math.min((currentPage - 1) * (pageSize as number) + 1, allDetailRows.length)}</strong> sampai <strong>{pageSize === 'ALL' ? allDetailRows.length : Math.min(currentPage * (pageSize as number), allDetailRows.length)}</strong> dari <strong>{allDetailRows.length.toLocaleString('id-ID')}</strong> total baris belanja
                  </span>
                )}
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

