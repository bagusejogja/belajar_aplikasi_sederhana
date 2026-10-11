"use client";

import React, { useState, useMemo } from 'react';
import { 
  Building2, FileSpreadsheet, Eye, EyeOff, Filter, Plus, Minus,
  ChevronDown, ChevronRight, Layers, AlertCircle, CheckCircle2,
  ArrowUpDown, ExternalLink, Expand, Minimize2, FolderTree
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/components/ui/table';
import { LampiranRkaResult, ComputedLampiranRkaRow } from '@/lib/rka/lampiranRkaTemplate';

interface LampiranRkaViewProps {
  data: LampiranRkaResult | null;
  tahunFilter: string;
  versiFilter: string;
  formatRp: (val: number) => string;
  onExportExcel: () => void;
  totalDataCount: number;
}

export default function LampiranRkaView({
  data,
  tahunFilter,
  versiFilter,
  formatRp,
  onExportExcel,
  totalDataCount
}: LampiranRkaViewProps) {
  // Hitung struktur silsilah pohon (Induk, Anak, Cucu, Cicit)
  const { childrenMap, ancestorMap, levelItemsMap } = useMemo(() => {
    const parentMap = new Map<string, string>();
    const childrenMap = new Map<string, string[]>();
    const ancestorMap = new Map<string, Set<string>>();
    const levelItemsMap = {
      level0: [] as string[],
      level1: [] as string[],
      level2: [] as string[],
      level3: [] as string[],
      level4: [] as string[]
    };

    if (!data?.items) return { parentMap, childrenMap, ancestorMap, levelItemsMap };

    const stack: { level: number; id: string }[] = [];

    data.items.forEach(item => {
      if (item.level === 0) levelItemsMap.level0.push(item.id);
      else if (item.level === 1) levelItemsMap.level1.push(item.id);
      else if (item.level === 2) levelItemsMap.level2.push(item.id);
      else if (item.level === 3) levelItemsMap.level3.push(item.id);
      else levelItemsMap.level4.push(item.id);

      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        parentMap.set(item.id, parent.id);

        const ch = childrenMap.get(parent.id) || [];
        ch.push(item.id);
        childrenMap.set(parent.id, ch);

        const ancestors = new Set(ancestorMap.get(parent.id) || []);
        ancestors.add(parent.id);
        ancestorMap.set(item.id, ancestors);
      } else {
        ancestorMap.set(item.id, new Set());
      }

      stack.push({ level: item.level, id: item.id });
    });

    return { parentMap, childrenMap, ancestorMap, levelItemsMap };
  }, [data?.items]);

  // State baris yang ditutup (collapsed)
  const [collapsedRowIds, setCollapsedRowIds] = useState<Set<string>>(new Set());
  // Active level preset: null jika kustom, 0-4 jika sedang di preset
  const [activeLevel, setActiveLevel] = useState<number | null>(null);

  // State expand rincian transaksi belanja per row template
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  // Toggle filter hanya tampilkan pos yang memiliki nilai
  const [onlyWithData, setOnlyWithData] = useState<boolean>(false);
  // State pencarian teks dalam tabel lampiran
  const [query, setQuery] = useState<string>('');

  // Toggle collapse sebuah baris secara spesifik
  const toggleCollapse = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveLevel(null);
    setCollapsedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Preset level collapse/expand (Persis pola design-system / TreeView)
  const handleSetLevel = (lvl: 0 | 1 | 2 | 3 | 4) => {
    setActiveLevel(lvl);
    if (lvl === 0) {
      // Level 0: Tutup semua Blok Level 0 sehingga hanya nama Blok yang terlihat
      setCollapsedRowIds(new Set(levelItemsMap.level0));
    } else if (lvl === 1) {
      // Level 1: Blok terbuka, tutup Level 1 (Romawi) sehingga terlihat sampai Romawi I, II, III...
      setCollapsedRowIds(new Set(levelItemsMap.level1));
    } else if (lvl === 2) {
      // Level 2: Buka sampai Level 2 (Sub-pos / Huruf A, B, C...)
      setCollapsedRowIds(new Set(levelItemsMap.level2));
    } else if (lvl === 3) {
      // Level 3: Buka sampai Level 3 (Kegiatan / Belanja)
      setCollapsedRowIds(new Set(levelItemsMap.level3));
    } else {
      // Level 4: Buka seluruhnya (+Rincian / Detil)
      setCollapsedRowIds(new Set());
    }
  };

  const handleExpandAll = () => {
    setActiveLevel(4);
    setCollapsedRowIds(new Set());
  };

  const handleCollapseAll = () => {
    setActiveLevel(0);
    setCollapsedRowIds(new Set(levelItemsMap.level0));
  };

  const toggleRowDetail = (rowId: string) => {
    setExpandedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  // Filter baris yang akan dirender berdasarkan status collapse pohon
  const visibleItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter(item => {
      // 1. Cek query pencarian: jika mencari, abaikan collapse agar hasil terlihat
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchDesc = item.uraian.toLowerCase().includes(q);
        const matchNo = item.no.toLowerCase().includes(q);
        const matchBlock = item.block.toLowerCase().includes(q);
        if (!matchDesc && !matchNo && !matchBlock) return false;
      } else {
        // Cek apakah ada ancestor dari item ini yang sedang di-collapse
        const ancestors = ancestorMap.get(item.id);
        if (ancestors) {
          for (const ancId of ancestors) {
            if (collapsedRowIds.has(ancId)) {
              return false;
            }
          }
        }
      }

      // 2. Cek filter hanya pos dengan data
      if (onlyWithData && item.totalPagu === 0 && item.directCount === 0) {
        return false;
      }

      return true;
    });
  }, [data, ancestorMap, collapsedRowIds, onlyWithData, query]);

  const filledCount = useMemo(() => {
    if (!data) return 0;
    return data.items.filter(it => it.directCount > 0).length;
  }, [data]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* 1. TOP CONTROL BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-indigo-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 text-lg shadow-2xs shrink-0">
            📑
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-gray-900 tracking-tight">
                10. Lampiran RKA (Format Kementerian)
              </span>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-300 text-[10px] font-black uppercase">
                TEMPLATE DIPA KEMENDIKTISAINTEK
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono font-bold">
                TA {tahunFilter} ({versiFilter.toUpperCase()})
              </Badge>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Format baku 6 kolom berdasarkan berkas template resmi kementerian (RM, BPPTNBH, Hibah K/L, Selain APBN)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* LEVEL STEP CONTROLLER (Pola Hierarki TreeView Design System) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 hidden sm:flex items-center gap-1">
              <FolderTree size={12} className="text-indigo-600" />
              <span>Level:</span>
            </span>
            <button
              type="button"
              onClick={() => handleSetLevel(0)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLevel === 0
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Tingkat 0: Hanya Blok Utama"
            >
              Blok
            </button>
            <button
              type="button"
              onClick={() => handleSetLevel(1)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLevel === 1
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Tingkat 1: Buka sampai Romawi (Induk)"
            >
              Induk
            </button>
            <button
              type="button"
              onClick={() => handleSetLevel(2)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLevel === 2
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Tingkat 2: Buka sampai Sub-pos (+Anak)"
            >
              +Anak
            </button>
            <button
              type="button"
              onClick={() => handleSetLevel(3)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeLevel === 3
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Tingkat 3: Buka sampai Rincian Belanja (+Cucu)"
            >
              +Cucu
            </button>

            <div className="h-4 w-px bg-slate-300 mx-0.5" />

            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Buka seluruh cabang pohon (+Detil Transaksi)"
            >
              <Expand size={11} />
              <span className="hidden md:inline">Buka Semua</span>
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Tutup seluruh cabang pohon"
            >
              <Minimize2 size={11} />
              <span className="hidden md:inline">Tutup Semua</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setOnlyWithData(!onlyWithData)}
            className={`h-8.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              onlyWithData
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            title="Saring hanya pos yang memiliki realisasi belanja"
          >
            <Filter size={13} />
            <span>{onlyWithData ? 'Semua Pos' : 'Pos Terisi'}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            className="h-8.5 px-3.5 rounded-xl border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
            title="Download file Excel persis sesuai template resmi lampiran RKA"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Alokasi Terpetakan
            </span>
            <div className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
              Rp {formatRp(data?.grandTotal || 0)}
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              Akumulasi anggaran riil dari data RKAT yang sesuai aturan
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Transaksi Terpetakan
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 font-mono flex items-center gap-1.5">
              <span>{(data?.grandCount || 0).toLocaleString('id-ID')}</span>
              <span className="text-xs font-semibold text-gray-500 font-sans">Baris Belanja</span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              Dari total {totalDataCount.toLocaleString('id-ID')} transaksi RKAT
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200/80 shadow-xs bg-white">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Keterisian Pos Format
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono flex items-center gap-1.5">
              <span>{filledCount}</span>
              <span className="text-xs font-semibold text-gray-500 font-sans">
                dari {data?.items.length || 131} Pos Baku
              </span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              {data?.unmappedRows.length 
                ? `${data.unmappedRows.length} transaksi di luar template` 
                : '100% aturan cocok dengan pos kementerian'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. TABEL UTAMA LAMPIRAN RKA */}
      <Card className="rounded-2xl border-slate-300 shadow-xs overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/90 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>🏛️</span>
              <span>Format Lampiran RKA Kementerian (6 Kolom Baku)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">
              No, Kegiatan/Sub Kegiatan/Belanja/Detil Belanja, Volume, Satuan, Harga Satuan, Jumlah Biaya
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari uraian atau pos..."
              className="h-8 px-3 text-xs bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48 sm:w-60"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="text-xs text-gray-400 hover:text-gray-600 px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-black uppercase text-[10px] tracking-wider">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center text-slate-900 text-xs uppercase font-black py-2.5">
                  No.
                </TableHead>
                <TableHead className="text-slate-900 text-xs uppercase font-black min-w-[360px]">
                  Kegiatan / Sub Kegiatan / Belanja / Detil Belanja
                </TableHead>
                <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-24">
                  Volume
                </TableHead>
                <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-24">
                  Satuan
                </TableHead>
                <TableHead className="text-right text-slate-900 text-xs uppercase font-black w-36">
                  Harga Satuan
                </TableHead>
                <TableHead className="text-right text-slate-900 text-xs uppercase font-black min-w-[200px] pr-4">
                  Jumlah Biaya (Rp)
                </TableHead>
                <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-20">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visibleItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 font-medium">
                    Tidak ada baris yang sesuai kriteria pencarian atau filter.
                  </TableCell>
                </TableRow>
              ) : (
                visibleItems.map((item) => {
                  const isRowCollapsed = collapsedRowIds.has(item.id);
                  const isRowOpen = expandedRowIds.has(item.id);
                  const hasChildren = (childrenMap.get(item.id)?.length || 0) > 0;

                  // Styling Level 0: Blok Utama
                  if (item.isBlock || item.level === 0) {
                    return (
                      <TableRow 
                        key={item.id}
                        onClick={() => toggleCollapse(item.id)}
                        className="bg-slate-800 hover:bg-slate-850 text-white font-black cursor-pointer transition-colors border-y border-slate-700 select-none"
                      >
                        <TableCell className="text-center font-mono text-xs py-2.5">
                          <button
                            type="button"
                            onClick={(e) => toggleCollapse(item.id, e)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold mx-auto transition-all cursor-pointer"
                            title={isRowCollapsed ? 'Buka blok' : 'Tutup blok'}
                          >
                            {isRowCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </TableCell>
                        <TableCell className="text-white text-xs uppercase font-black tracking-wide">
                          <div className="flex items-center gap-2">
                            <span>{item.uraian}</span>
                            <Badge className="bg-slate-700 text-slate-200 border-none text-[9px] font-mono">
                              {item.totalCount} baris
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-slate-300 text-xs">-</TableCell>
                        <TableCell className="text-center text-slate-300 text-xs">-</TableCell>
                        <TableCell className="text-right text-slate-300 text-xs">-</TableCell>
                        <TableCell className="text-right pr-4 font-mono font-black text-sm text-emerald-400">
                          {item.totalPagu > 0 ? `Rp ${formatRp(item.totalPagu)}` : 'Rp 0'}
                        </TableCell>
                        <TableCell className="text-center text-slate-400 text-xs">-</TableCell>
                      </TableRow>
                    );
                  }

                  // Styling Level 1: Romawi (I, II, III...) - Induk
                  if (item.level === 1) {
                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className="bg-slate-100/90 font-black border-y border-slate-200 hover:bg-slate-200/70 transition-colors">
                          <TableCell className="text-center font-bold font-mono text-slate-900 text-xs py-2">
                            <div className="flex items-center justify-center gap-1">
                              {hasChildren ? (
                                <button
                                  type="button"
                                  onClick={(e) => toggleCollapse(item.id, e)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer"
                                  title={isRowCollapsed ? 'Buka sub-pos' : 'Tutup sub-pos'}
                                >
                                  {isRowCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                </button>
                              ) : (
                                <span className="w-5" />
                              )}
                              <span>{item.no}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-950 text-xs font-black pl-3">
                            <div className="flex items-center gap-2">
                              <span>{item.uraian}</span>
                              {hasChildren && isRowCollapsed && (
                                <span className="text-[9px] font-normal font-mono text-slate-400 px-1 py-0.2 bg-slate-200/60 rounded">
                                  +{childrenMap.get(item.id)?.length} anak
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold font-mono text-slate-700">
                            {item.totalCount > 0 && item.volume !== null ? item.volume : '-'}
                          </TableCell>
                          <TableCell className="text-center text-xs font-medium text-slate-700">
                            {item.totalCount > 0 ? item.satuan || '-' : '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono text-slate-700">
                            {item.totalCount > 0 && item.tarif !== null ? `Rp ${formatRp(item.tarif)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right pr-4 font-mono font-black text-xs text-slate-950">
                            {item.totalPagu > 0 ? (
                              <span className="text-indigo-900 font-black">Rp {formatRp(item.totalPagu)}</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.directCount > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRowDetail(item.id)}
                                className={`h-7 px-2 rounded-lg text-[10px] font-bold gap-1 cursor-pointer transition-all ${
                                  isRowOpen 
                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                    : 'border-slate-300 text-slate-700 hover:bg-slate-200'
                                }`}
                                title="Lihat rincian transaksi belanja"
                              >
                                {isRowOpen ? <EyeOff size={11} /> : <Eye size={11} />}
                                <span>{item.directCount}</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isRowOpen && item.directRows.length > 0 && (
                          <TableRow className="bg-indigo-50/20 border-b border-indigo-100 p-0">
                            <TableCell colSpan={7} className="p-3">
                              <LampiranItemTransactionList rows={item.directRows} formatRp={formatRp} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  }

                  // Styling Level 2: Huruf (A, B, C...) - Anak
                  if (item.level === 2) {
                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className="bg-slate-50/70 font-bold border-b border-slate-100 hover:bg-slate-100/70 transition-colors">
                          <TableCell className="text-center font-bold font-mono text-slate-800 text-xs py-2">
                            <div className="flex items-center justify-center gap-1">
                              {hasChildren ? (
                                <button
                                  type="button"
                                  onClick={(e) => toggleCollapse(item.id, e)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer"
                                  title={isRowCollapsed ? 'Buka kegiatan' : 'Tutup kegiatan'}
                                >
                                  {isRowCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                </button>
                              ) : (
                                <span className="w-5" />
                              )}
                              <span>{item.no}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-900 text-xs font-bold pl-7">
                            <div className="flex items-center gap-2">
                              <span>{item.uraian}</span>
                              {hasChildren && isRowCollapsed && (
                                <span className="text-[9px] font-normal font-mono text-slate-400 px-1 py-0.2 bg-slate-200/60 rounded">
                                  +{childrenMap.get(item.id)?.length} cucu
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono text-slate-600">
                            {item.totalCount > 0 && item.volume !== null ? item.volume : '-'}
                          </TableCell>
                          <TableCell className="text-center text-xs font-medium text-slate-600">
                            {item.totalCount > 0 ? item.satuan || '-' : '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono text-slate-600">
                            {item.totalCount > 0 && item.tarif !== null ? `Rp ${formatRp(item.tarif)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right pr-4 font-mono font-bold text-xs text-slate-900">
                            {item.totalPagu > 0 ? (
                              <span className="text-indigo-900 font-bold">Rp {formatRp(item.totalPagu)}</span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.directCount > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRowDetail(item.id)}
                                className={`h-7 px-2 rounded-lg text-[10px] font-bold gap-1 cursor-pointer transition-all ${
                                  isRowOpen 
                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                    : 'border-slate-300 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {isRowOpen ? <EyeOff size={11} /> : <Eye size={11} />}
                                <span>{item.directCount}</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {isRowOpen && item.directRows.length > 0 && (
                          <TableRow className="bg-indigo-50/20 border-b border-indigo-100 p-0">
                            <TableCell colSpan={7} className="p-3">
                              <LampiranItemTransactionList rows={item.directRows} formatRp={formatRp} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  }

                  // Styling Level 3: Induk Sub-kegiatan / Belanja - Cucu
                  if (item.level === 3) {
                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className="bg-slate-50/80 font-bold border-b border-slate-200 hover:bg-slate-100/60 transition-colors">
                          <TableCell className="text-center font-mono text-slate-600 text-xs py-2">
                            <div className="flex items-center justify-center gap-1">
                              {hasChildren ? (
                                <button
                                  type="button"
                                  onClick={(e) => toggleCollapse(item.id, e)}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer"
                                  title={isRowCollapsed ? 'Buka rincian' : 'Tutup rincian'}
                                >
                                  {isRowCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                                </button>
                              ) : (
                                <span className="w-5" />
                              )}
                              <span>{item.no || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs pl-10 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{item.uraian}</span>
                              {item.totalCount > 0 && (
                                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-md text-[9px] font-bold font-mono">
                                  {item.totalCount} rincian
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono text-slate-400">-</TableCell>
                          <TableCell className="text-center text-xs font-mono text-slate-400">-</TableCell>
                          <TableCell className="text-right text-xs font-mono text-slate-400">-</TableCell>
                          <TableCell className="text-right pr-4 font-mono text-xs">
                            {item.totalPagu > 0 ? (
                              <span className="font-black text-indigo-950">Rp {formatRp(item.totalPagu)}</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-slate-300 text-xs">-</TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  }

                  // Styling Level 4: Rincian Belanja Anak (Transaksi Langsung / Leaf) - Cicit
                  const hasDirect = item.directCount > 0;
                  return (
                    <React.Fragment key={item.id}>
                      <TableRow className={`border-b border-slate-100 transition-colors ${hasDirect ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : 'hover:bg-slate-50'}`}>
                        <TableCell className="text-center font-mono text-slate-500 text-xs py-1.5">
                          <div className="flex items-center justify-center gap-1">
                            <span className="w-5 h-5 flex items-center justify-center text-slate-300 text-[10px]">•</span>
                            <span>{item.no || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`text-xs pl-14 ${hasDirect ? 'font-medium text-slate-800' : 'font-normal text-slate-600'}`}>
                          <div className="flex items-center gap-1.5">
                            <span>{item.uraian}</span>
                            {hasDirect && (
                              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-md text-[9px] font-bold font-mono">
                                {item.directCount} trx
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-xs font-mono text-slate-600">
                          {hasDirect && item.volume !== null ? item.volume : (item.volume !== null ? item.volume : '-')}
                        </TableCell>
                        <TableCell className="text-center text-xs text-slate-600">
                          {item.satuan || '-'}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-slate-600">
                          {item.directPagu > 0 ? `Rp ${formatRp(item.directPagu)}` : (item.tarif !== null ? `Rp ${formatRp(item.tarif)}` : '-')}
                        </TableCell>
                        <TableCell className="text-right pr-4 font-mono text-xs">
                          {item.directPagu > 0 ? (
                            <span className="font-bold text-indigo-900">Rp {formatRp(item.directPagu)}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasDirect && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRowDetail(item.id)}
                              className={`h-6 px-1.5 rounded-md text-[10px] font-bold gap-1 cursor-pointer transition-all ${
                                isRowOpen 
                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                              title="Buka rincian belanja"
                            >
                              {isRowOpen ? <EyeOff size={10} /> : <Eye size={10} />}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isRowOpen && item.directRows.length > 0 && (
                        <TableRow className="bg-indigo-50/20 border-b border-indigo-100 p-0">
                          <TableCell colSpan={7} className="p-3">
                            <LampiranItemTransactionList rows={item.directRows} formatRp={formatRp} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>

            {/* Total Footer */}
            <tfoot className="bg-slate-800 text-white font-bold border-t-2 border-slate-700">
              <tr>
                <td colSpan={2} className="p-4 text-xs font-black uppercase tracking-wider text-white">
                  TOTAL KESELURUHAN ALOKASI LAMPIRAN RKA KEMENTERIAN
                </td>
                <td className="p-4 text-center text-xs font-black font-mono text-slate-300">
                  -
                </td>
                <td className="p-4 text-center text-xs font-black font-mono text-slate-300">
                  -
                </td>
                <td className="p-4 text-right text-xs font-black font-mono text-slate-300">
                  -
                </td>
                <td className="p-4 text-right pr-4 text-sm font-black font-mono text-emerald-300">
                  Rp {formatRp(data?.grandTotal || 0)}
                </td>
                <td className="p-4 text-center text-slate-400 text-xs">
                  {(data?.grandCount || 0).toLocaleString('id-ID')} trx
                </td>
              </tr>
            </tfoot>
          </Table>
        </CardContent>
      </Card>

      {/* 4. DATA TERKLASIFIKASI DI LUAR TEMPLATE (JIKA ADA) */}
      {data && data.unmappedRows.length > 0 && (
        <Card className="rounded-2xl border-amber-300 bg-amber-50/50 shadow-xs">
          <CardHeader className="p-4 border-b border-amber-200">
            <CardTitle className="text-xs font-black text-amber-900 flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600" />
              <span>Data dengan Aturan RKA Kementrian yang Belum Terpetakan ke Pos Template ({data.unmappedRows.length} Baris)</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-amber-800 font-medium">
              Data berikut telah memiliki aturan klasifikasi RKA Kementrian, namun nilai klasifikasinya belum sesuai persis dengan nama uraian di template Lampiran RKA.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <LampiranItemTransactionList rows={data.unmappedRows} formatRp={formatRp} />
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// Sub-komponen Menampilkan Daftar Transaksi Belanja Riil
function LampiranItemTransactionList({ rows, formatRp }: { rows: any[]; formatRp: (val: number) => string }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(rows.length / pageSize);
  const currentRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white rounded-xl border border-indigo-200 p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-800">
          Daftar Rincian Transaksi Belanja ({rows.length.toLocaleString('id-ID')} transaksi)
        </span>
        <span className="font-mono font-bold text-indigo-700">
          Total: Rp {formatRp(rows.reduce((acc, r) => acc + (Number(r.anggaran) || 0), 0))}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-[11px] text-left">
          <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] border-b border-gray-200">
            <tr>
              <th className="py-2 px-3 w-10 text-center">No</th>
              <th className="py-2 px-3 min-w-[200px]">Uraian Belanja / Kegiatan</th>
              <th className="py-2 px-3 w-40">Kode &amp; Akun Detail</th>
              <th className="py-2 px-3 w-48">Unit Kerja</th>
              <th className="py-2 px-3 w-32 text-right">Pagu Anggaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentRows.map((r, idx) => (
              <tr key={r.id || idx} className="hover:bg-gray-50/80">
                <td className="py-1.5 px-3 text-center text-gray-400 font-mono">
                  {(page - 1) * pageSize + idx + 1}
                </td>
                <td className="py-1.5 px-3 font-medium text-gray-900">
                  <div>{r.uraian_belanja || r.kegiatan || '-'}</div>
                  {r.kegiatan && r.uraian_belanja && r.kegiatan !== r.uraian_belanja && (
                    <div className="text-[10px] text-gray-500 font-normal">{r.kegiatan}</div>
                  )}
                </td>
                <td className="py-1.5 px-3 font-mono text-gray-600 text-[10px]">
                  {r.akun_detail || '-'}
                </td>
                <td className="py-1.5 px-3 text-gray-600">
                  {r.unit || '-'}
                </td>
                <td className="py-1.5 px-3 text-right font-mono font-bold text-indigo-900">
                  Rp {formatRp(Number(r.anggaran) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-6 px-2 text-[10px] font-bold cursor-pointer"
            >
              ‹ Sebelumnya
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="h-6 px-2 text-[10px] font-bold cursor-pointer"
            >
              Berikutnya ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
