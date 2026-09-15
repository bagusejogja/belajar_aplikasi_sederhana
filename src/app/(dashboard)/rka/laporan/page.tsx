"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Download, RefreshCw, Building2, Search, 
  ChevronDown, ChevronUp, FolderTree, BookOpen, Sparkles,
  PieChart, ArrowRight, Wand2, X, FileSpreadsheet, FileText, Check, RotateCcw,
  ChevronLeft, ChevronRight, Eye, EyeOff, Filter, Wallet, TrendingUp, TrendingDown,
  Settings2, Plus, Minus, Trash2, ArrowUp, ArrowDown, Tag, Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell 
} from '@/components/ui/table';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  Document, Packer, Paragraph, Table as DocxTable, TableCell as DocxTableCell, 
  TableRow as DocxTableRow, WidthType, BorderStyle, TextRun, AlignmentType, 
  PageOrientation, ShadingType, VerticalAlign
} from 'docx';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Definisi Struktur Template Slide / PPT Proposal RKAT
export interface PptTemplateItem {
  id: string;
  label: string;
  matchKeys: string[];
}

export interface PptTemplateSection {
  id: string;
  title: string;
  items: PptTemplateItem[];
}

export interface PptTemplateConfig {
  penerimaanTitle: string;
  penerimaanSections: PptTemplateSection[];
  penerimaanLainnyaLabel: string;
  pengeluaranTitle: string;
  pengeluaranItems: PptTemplateItem[];
  pengeluaranLainnyaLabel: string;
}

// Helper pencocokan kata kunci template PPT yang akurat:
// Mencegah kata 'jasa' mencocokkan 'kerjasama' (karena substring 'jasa' terdapat di dalam kata 'kerJASAma')
function isPptKeyMatch(label: string, matchKeys: string[]): boolean {
  if (!label || !matchKeys || matchKeys.length === 0) return false;
  const kLower = label.toLowerCase().trim();
  return matchKeys.some(rawMk => {
    const mk = rawMk.toLowerCase().trim();
    if (!mk) return false;
    // Khusus kata kunci 'jasa': jangan pernah mencocokkan kata 'kerjasama'
    if (mk === 'jasa') {
      const regex = /(?:^|[^a-zA-Z0-9])jasa(?:[^a-zA-Z0-9]|$)/i;
      return regex.test(kLower);
    }
    // Untuk kata tunggal tanpa spasi, gunakan pembatas kata agar tidak mencaplok kata lain
    if (!mk.includes(' ')) {
      const escaped = mk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:[^a-zA-Z0-9]|$)`, 'i');
      return regex.test(kLower);
    }
    return kLower.includes(mk);
  });
}

const DEFAULT_PPT_TEMPLATE: PptTemplateConfig = {
  penerimaanTitle: 'Jumlah Penerimaan Dana Masyarakat',
  penerimaanSections: [
    {
      id: 'pendidikan',
      title: 'Penerimaan Pendidikan',
      items: [
        { id: 'pend_utama', label: 'Penerimaan Pendidikan Utama', matchKeys: ['pendidikan utama'] },
        { id: 'pend_lainnya', label: 'Penerimaan Pendidikan Lainnya', matchKeys: ['pendidikan lainnya'] },
      ]
    },
    {
      id: 'non_pendidikan',
      title: 'Penerimaan Non Pendidikan',
      items: [
        { id: 'hibah', label: 'Penerimaan Hibah dan Donasi', matchKeys: ['hibah'] },
        { id: 'jasa', label: 'Penerimaan Jasa Universitas', matchKeys: ['jasa universitas', 'jasa'] },
        { id: 'aset', label: 'Penerimaan Pemanfaatan Aset', matchKeys: ['aset'] },
        { id: 'beasiswa_pemerintah', label: 'Beasiswa dan Kontrak Kerjasama Pemerintah', matchKeys: ['beasiswa'] },
        { id: 'kerjasama', label: 'Penerimaan Kerjasama', matchKeys: ['kerjasama'] },
        { id: 'upu', label: 'Penerimaan dari UPU', matchKeys: ['upu'] },
      ]
    }
  ],
  penerimaanLainnyaLabel: 'Penerimaan Lainnya / Surplus TA Lalu',
  pengeluaranTitle: 'PENGELUARAN',
  pengeluaranItems: [
    { id: 'pegawai', label: 'Belanja Pegawai', matchKeys: ['pegawai'] },
    { id: 'barang_jasa', label: 'Belanja Barang & Jasa', matchKeys: ['barang'] },
    { id: 'pemeliharaan', label: 'Belanja Perbaikan dan Pemeliharaan', matchKeys: ['pemeliharaan', 'perbaikan'] },
    { id: 'perjalanan', label: 'Belanja Perjalanan', matchKeys: ['perjalanan'] },
    { id: 'modal', label: 'Belanja Modal', matchKeys: ['modal'] },
    { id: 'antar_unit', label: 'Belanja Transfer Antar Unit', matchKeys: ['antar unit', 'transfer'] },
    { id: 'techno_park', label: 'Belanja SCIENCE TECHNO PARK -ADB', matchKeys: ['techno', 'adb'] },
    { id: 'puapt', label: 'Belanja PUAPT', matchKeys: ['puapt'] },
    { id: 'equity', label: 'EQUITY', matchKeys: ['equity'] },
  ],
  pengeluaranLainnyaLabel: 'Belanja Lainnya / Penunjang'
};

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
    if (!isOpen) {
      setQuery('');
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % allOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + allOptions.length) % allOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allOptions[highlightedIndex]) {
        onSelect(allOptions[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full sm:w-64">
      <div 
        onClick={() => setIsOpen(true)}
        className="w-full h-8 px-2.5 py-1 text-xs rounded-xl border border-gray-200 bg-white hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 cursor-pointer flex items-center justify-between transition-all"
      >
        <span className="truncate font-semibold text-gray-700">
          {isAll ? 'Semua Unit Kerja' : selectedUnit}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-72 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-1.5">
              <Search size={14} className="text-gray-400 ml-1" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ketik cari nama unit..."
                className="w-full bg-transparent border-none text-xs font-semibold focus:outline-hidden text-gray-800 placeholder:text-gray-400"
              />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="overflow-y-auto divide-y divide-gray-50 max-h-60 text-xs">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={`p-2.5 font-bold cursor-pointer transition-colors flex items-center justify-between ${
                  isAll ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                } ${highlightedIndex === 0 ? 'bg-blue-50/70 text-blue-800' : ''}`}
              >
                <span>🏢 Semua Unit Kerja</span>
                {isAll && <Check size={14} className="text-blue-600" />}
              </div>

              {filteredUnits.map((unit, idx) => {
                const optIndex = idx + 1;
                const isSelected = selectedUnit === unit;
                const isHighlighted = highlightedIndex === optIndex;
                return (
                  <div
                    key={unit}
                    onClick={() => {
                      onSelect(unit);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(optIndex)}
                    className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'
                    } ${isHighlighted ? 'bg-blue-50/70 text-blue-800' : ''}`}
                  >
                    <span className="truncate">{unit}</span>
                    {isSelected && <Check size={14} className="text-blue-600 shrink-0 ml-1" />}
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

// Definisi Tipe dan Komponen Struktur 3-Level Hierarkis Murni (Tabel Tanpa Kotak-Kotak Sesuai /review)
export interface DetailGroupUnit {
  unit: string;
  totalPagu: number;
  count: number;
  rows: any[];
}

export interface DetailGroupAkun {
  namaAkun: string;
  totalPagu: number;
  totalUnits: number;
  totalRows: number;
  units: DetailGroupUnit[];
}

// Komponen Level 3: Rincian Transaksi dengan Paging Mandiri per Unit Kerja
function InlineUnitDetailRows({
  unitGroup,
  subtab,
  formatRp
}: {
  unitGroup: DetailGroupUnit;
  subtab: 'belanja' | 'penerimaan';
  formatRp: (val: number) => string;
}) {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const totalRows = unitGroup.rows.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    return unitGroup.rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [unitGroup.rows, page]);

  return (
    <div className="w-full bg-slate-50/70 p-2 sm:p-3 border-y border-slate-200">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          {subtab === 'penerimaan' ? (
            <>
              <thead className="bg-[#1f73a5] text-white font-bold text-[11px] border-b border-[#185c84] uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-3 text-center w-10">#</th>
                  <th className="py-2 px-3 min-w-[280px]">Keterangan &amp; Rincian Penerimaan</th>
                  <th className="py-2 px-3 w-40 text-center">Volume &amp; Tarif</th>
                  <th className="py-2 px-3 w-36 text-center">Sumber Dana</th>
                  <th className="py-2 px-3 min-w-[160px] text-right pr-4">Pagu Penerimaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedRows.map((row, idx) => {
                  const num = (page - 1) * rowsPerPage + idx + 1;
                  const pagu = Number(row.renterima_pagu) || 0;
                  const tarif = Number(row.renterima_tarif) || 0;
                  const vol = Number(row.renterima_volume) || 0;
                  return (
                    <tr key={row.renterima_id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] align-top">{num}</td>
                      <td className="py-2.5 px-3 align-top space-y-1">
                        <div className="font-bold text-slate-900 text-xs leading-snug">{row.keterangan || row.nama_akun_penerimaan || '-'}</div>
                        <span className="text-[10px] text-slate-400 font-mono">TA {row.tahun || '-'}</span>
                      </td>
                      <td className="py-2.5 px-3 align-top text-center space-y-0.5">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-mono text-xs font-bold border border-emerald-100">
                          {vol.toLocaleString('id-ID')} Vol
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">@ Rp {formatRp(tarif)}</div>
                      </td>
                      <td className="py-2.5 px-3 align-top text-center space-y-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          {row.status || 'Aktif'}
                        </Badge>
                        <div className="text-[10px] text-slate-500 font-medium">{row.sumber_dana || 'Dana Masyarakat'}</div>
                      </td>
                      <td className="py-2.5 px-3 align-top text-right pr-4">
                        <span className="font-black font-mono text-emerald-950 text-xs">Rp {formatRp(pagu)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          ) : (
            <>
              <thead className="bg-[#1f73a5] text-white font-bold text-[11px] border-b border-[#185c84] uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-3 text-center w-10">#</th>
                  <th className="py-2 px-3 min-w-[260px]">Kegiatan &amp; Lingkup</th>
                  <th className="py-2 px-3 min-w-[280px]">Uraian Belanja</th>
                  <th className="py-2 px-3 w-36 text-center">Prioritas &amp; TA</th>
                  <th className="py-2 px-3 min-w-[160px] text-right pr-4">Pagu Anggaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedRows.map((row, idx) => {
                  const num = (page - 1) * rowsPerPage + idx + 1;
                  const ang = Number(row.anggaran) || 0;
                  return (
                    <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px] align-top">{num}</td>
                      <td className="py-2.5 px-3 align-top space-y-1">
                        <div className="font-bold text-slate-900 text-xs leading-snug">{row.kegiatan || '-'}</div>
                        {row.lingkup_kegiatan && (
                          <div className="text-[10px] text-indigo-700 font-medium">
                            <span className="font-bold text-indigo-900">Lingkup:</span> {row.lingkup_kegiatan}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-medium text-slate-800 text-xs leading-relaxed">{row.uraian_belanja || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3 align-top text-center space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold font-mono">
                          TA {row.tahun_anggaran || '-'}
                        </span>
                        {row.prioritas && (
                          <div className="text-[10px] text-slate-500 font-medium">Prioritas: {row.prioritas}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 align-top text-right pr-4">
                        <span className="font-black font-mono text-slate-950 text-xs">Rp {formatRp(ang)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}
        </table>
      </div>

      {/* Pagination Controls Level 3 */}
      {totalRows > rowsPerPage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 pt-2 text-[11px] text-slate-600 font-medium">
          <span>
            Menampilkan rincian <strong>{(page - 1) * rowsPerPage + 1}</strong> s.d. <strong>{Math.min(page * rowsPerPage, totalRows)}</strong> dari <strong>{totalRows}</strong> total transaksi
          </span>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-6 px-2 text-[11px] font-bold rounded-md bg-white hover:bg-slate-100 border-slate-300 cursor-pointer"
            >
              ‹ Sebelumnya
            </Button>
            <span className="px-2 py-0.5 font-bold font-mono text-slate-700 bg-white rounded border border-slate-200">
              Hal {page} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="h-6 px-2 text-[11px] font-bold rounded-md bg-white hover:bg-slate-100 border-slate-300 cursor-pointer"
            >
              Berikutnya ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Komponen Tabel Hierarki Terpadu (Akun -> Unit -> Detail dengan Paging)
function HierarchicalInlineTable({
  rows,
  type,
  formatRp
}: {
  rows: any[];
  type: 'belanja' | 'penerimaan';
  formatRp: (val: number) => string;
}) {
  const [openAkunSet, setOpenAkunSet] = useState<Set<string>>(new Set());
  const [openUnitSet, setOpenUnitSet] = useState<Set<string>>(new Set());

  // Kelompokkan data secara hierarkis: Akun -> Unit -> Rows
  const groupedAkunList: DetailGroupAkun[] = useMemo(() => {
    const akunMap: Record<string, {
      namaAkun: string;
      totalPagu: number;
      totalRows: number;
      unitMap: Record<string, { unit: string; totalPagu: number; count: number; rows: any[] }>;
    }> = {};

    rows.forEach(r => {
      const namaAkun = (type === 'penerimaan' 
        ? (r.nama_akun_penerimaan || r.akun || 'Akun Penerimaan Tidak Terdefinisi')
        : (r.akun_detail || r.nama_akun || r.akun || 'Akun Belanja Tidak Terdefinisi')).trim();
      const unit = (type === 'penerimaan'
        ? (r.unit_kerja || 'Unit Kerja Tidak Terdefinisi')
        : (r.unit || 'Unit Kerja Tidak Terdefinisi')).trim();
      const pagu = type === 'penerimaan' ? (Number(r.renterima_pagu) || 0) : (Number(r.anggaran) || 0);

      if (!akunMap[namaAkun]) {
        akunMap[namaAkun] = { namaAkun, totalPagu: 0, totalRows: 0, unitMap: {} };
      }
      akunMap[namaAkun].totalPagu += pagu;
      akunMap[namaAkun].totalRows += 1;

      if (!akunMap[namaAkun].unitMap[unit]) {
        akunMap[namaAkun].unitMap[unit] = { unit, totalPagu: 0, count: 0, rows: [] };
      }
      akunMap[namaAkun].unitMap[unit].totalPagu += pagu;
      akunMap[namaAkun].unitMap[unit].count += 1;
      akunMap[namaAkun].unitMap[unit].rows.push(r);
    });

    const result = Object.values(akunMap).map(a => {
      const units = Object.values(a.unitMap).sort((u1, u2) =>
        u1.unit.localeCompare(u2.unit, 'id', { numeric: true, sensitivity: 'base' })
      );
      return {
        namaAkun: a.namaAkun,
        totalPagu: a.totalPagu,
        totalUnits: units.length,
        totalRows: a.totalRows,
        units
      };
    });

    return result.sort((a, b) => a.namaAkun.localeCompare(b.namaAkun, 'id', { numeric: true, sensitivity: 'base' }));
  }, [rows, type]);

  const toggleAkun = (namaAkun: string) => {
    setOpenAkunSet(prev => {
      const next = new Set(prev);
      if (next.has(namaAkun)) next.delete(namaAkun);
      else next.add(namaAkun);
      return next;
    });
  };

  const toggleUnit = (key: string) => {
    setOpenUnitSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (groupedAkunList.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400 italic bg-white rounded-lg border border-slate-200">
        Tidak ada data rincian untuk pos ini.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-xs">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="bg-slate-200/90 text-slate-800 font-bold border-b border-slate-300 text-[11px] uppercase tracking-wide">
            <th className="w-12 px-3 py-2.5 text-center">#</th>
            <th className="px-4 py-2.5">Akun (Anak 1) / Unit Kerja (Anak 2) / Detail Transaksi (Anak 3)</th>
            <th className="px-4 py-2.5 text-center w-36">Jumlah Data</th>
            <th className="px-4 py-2.5 text-right w-44 pr-4">Pagu Anggaran</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {groupedAkunList.map((akun, aIdx) => {
            const isAkunOpen = openAkunSet.has(akun.namaAkun);

            return (
              <React.Fragment key={akun.namaAkun + aIdx}>
                {/* LEVEL 1: NAMA_AKUN */}
                <tr 
                  onClick={() => toggleAkun(akun.namaAkun)}
                  className="bg-[#eef5fa] hover:bg-[#e2edf5] border-b border-slate-200 cursor-pointer transition-colors font-bold text-slate-900 select-none"
                >
                  <td className="px-3 py-2.5 text-center align-middle">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); toggleAkun(akun.namaAkun); }}
                      className="w-5 h-5 rounded flex items-center justify-center bg-blue-200 hover:bg-blue-300 text-blue-900 text-xs font-bold transition-colors shadow-2xs mx-auto cursor-pointer"
                    >
                      {isAkunOpen ? <Minus size={11} /> : <Plus size={11} />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                      <Tag size={13} className="text-blue-600 shrink-0" />
                      <span>{akun.namaAkun}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-900 border border-blue-200 font-mono">
                        {akun.units.length} Unit Kerja
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono text-slate-600 text-xs font-semibold">
                    {akun.totalRows.toLocaleString('id-ID')} Rincian
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-black text-slate-900 text-xs pr-4">
                    Rp {formatRp(akun.totalPagu)}
                  </td>
                </tr>

                {/* LEVEL 2: UNIT (BILA AKUN DIBUKA) */}
                {isAkunOpen && akun.units.map((unitGroup, uIdx) => {
                  const unitKey = `${akun.namaAkun}___${unitGroup.unit}`;
                  const isUnitOpen = openUnitSet.has(unitKey);

                  return (
                    <React.Fragment key={unitKey + uIdx}>
                      <tr 
                        onClick={() => toggleUnit(unitKey)}
                        className="bg-white hover:bg-slate-50/80 border-b border-slate-100 cursor-pointer transition-colors text-slate-800 select-none"
                      >
                        <td className="px-3 py-2 text-center align-middle pl-6">
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); toggleUnit(unitKey); }}
                            className="w-4 h-4 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors shadow-2xs mx-auto cursor-pointer"
                          >
                            {isUnitOpen ? <Minus size={9} /> : <Plus size={9} />}
                          </button>
                        </td>
                        <td className="px-4 py-2 pl-8">
                          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                            <Building2 size={13} className="text-slate-500 shrink-0" />
                            <span>{unitGroup.unit}</span>
                            <span className="text-[10px] font-normal px-2 py-0.2 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                              {unitGroup.rows.length} Transaksi
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center font-mono text-slate-500 text-xs">
                          {unitGroup.rows.length} Transaksi
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-slate-800 text-xs pr-4">
                          Rp {formatRp(unitGroup.totalPagu)}
                        </td>
                      </tr>

                      {/* LEVEL 3: DETAIL TABLE DENGAN PAGINATION (BILA UNIT DIBUKA) */}
                      {isUnitOpen && (
                        <tr>
                          <td colSpan={4} className="p-0 border-b-2 border-slate-200">
                            <InlineUnitDetailRows
                              unitGroup={unitGroup}
                              subtab={type}
                              formatRp={formatRp}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
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
  const [summaryStyle, setSummaryStyle] = useState<'ppt' | 'standard'>('ppt');
  const [rekapGroupFilter, setRekapGroupFilter] = useState<string>('ALL');
  const [rekapFormat, setRekapFormat] = useState<'fakultas' | 'pusdi' | 'upu'>('fakultas');

  // Konfigurasi Template Susunan Slide PPT RKAT (Bisa disesuaikan lewat UI Modal)
  const [pptTemplate, setPptTemplate] = useState<PptTemplateConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rka_ppt_template_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.penerimaanSections && parsed.pengeluaranItems) {
            if (!parsed.pengeluaranItems.some((i: any) => i.id === 'antar_unit')) {
              parsed.pengeluaranItems.splice(5, 0, { id: 'antar_unit', label: 'Belanja Transfer Antar Unit', matchKeys: ['antar unit', 'transfer'] });
            }
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_PPT_TEMPLATE;
  });

  // Modal Atur Susunan Template Slide State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [tempTemplate, setTempTemplate] = useState<PptTemplateConfig>(DEFAULT_PPT_TEMPLATE);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'penerimaan' | 'pengeluaran'>('penerimaan');

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

  // Struktur Hirarkis Khusus Format Proposal RKAT (Dinamis Berdasarkan Pengaturan Template Slide PPT)
  const pptProposalData = useMemo(() => {
    // 1. Data Penerimaan
    const pMap: Record<string, { totalPagu: number; count: number; rows: any[] }> = {};
    penerimaanList.forEach(r => {
      if (unitFilter !== 'ALL' && r.unit_kerja !== unitFilter) return;
      if (search) {
        const lower = search.toLowerCase();
        const match = (r.unit_kerja && r.unit_kerja.toLowerCase().includes(lower)) ||
          (r.nama_akun_penerimaan && r.nama_akun_penerimaan.toLowerCase().includes(lower)) ||
          (r.keterangan && r.keterangan.toLowerCase().includes(lower)) ||
          (r.format_proposal && r.format_proposal.toLowerCase().includes(lower));
        if (!match) return;
      }
      const label = (r.format_proposal || r.kelompok_penerimaan || 'Penerimaan Lainnya').trim();
      if (!pMap[label]) pMap[label] = { totalPagu: 0, count: 0, rows: [] };
      pMap[label].totalPagu += Number(r.renterima_pagu) || 0;
      pMap[label].count += 1;
      pMap[label].rows.push(r);
    });

    const usedPKeys = new Set<string>();

    const computedSections = (pptTemplate.penerimaanSections || []).map(sec => {
      let secSubtotal = 0;
      let secCount = 0;
      const secItems = (sec.items || []).map(item => {
        let itemTotal = 0;
        let itemCount = 0;
        let itemRows: any[] = [];
        
        Object.keys(pMap).forEach(k => {
          if (usedPKeys.has(k)) return;
          const isMatch = isPptKeyMatch(k, item.matchKeys || []);
          if (isMatch) {
            itemTotal += pMap[k].totalPagu;
            itemCount += pMap[k].count;
            itemRows.push(...pMap[k].rows);
            usedPKeys.add(k);
          }
        });
        
        secSubtotal += itemTotal;
        secCount += itemCount;
        return {
          id: item.id,
          label: item.label,
          matchKeys: item.matchKeys,
          totalPagu: itemTotal,
          count: itemCount,
          rows: itemRows
        };
      });

      return {
        id: sec.id,
        title: sec.title,
        subtotal: secSubtotal,
        count: secCount,
        items: secItems
      };
    });

    // Penerimaan yang belum terpetakan ke kelompok manapun
    let pLainnyaTotal = 0;
    let pLainnyaCount = 0;
    let pLainnyaRows: any[] = [];
    Object.keys(pMap).forEach(k => {
      if (!usedPKeys.has(k)) {
        pLainnyaTotal += pMap[k].totalPagu;
        pLainnyaCount += pMap[k].count;
        pLainnyaRows.push(...pMap[k].rows);
      }
    });

    const totalPenerimaan = computedSections.reduce((acc, s) => acc + s.subtotal, 0) + pLainnyaTotal;

    // 2. Data Pengeluaran / Belanja
    const bMap: Record<string, { totalAnggaran: number; count: number; rows: any[] }> = {};
    dataList.forEach(r => {
      if (unitFilter !== 'ALL' && r.unit !== unitFilter) return;
      const label = (getRowClassification(r, 'proposal rkat') || 'Lainnya').trim();
      if (!label || label === '') return;
      if (kategoriFilter !== 'ALL' && label !== kategoriFilter) return;
      if (search) {
        const lower = search.toLowerCase();
        const match = (r.unit && r.unit.toLowerCase().includes(lower)) ||
          (r.uraian_belanja && r.uraian_belanja.toLowerCase().includes(lower)) ||
          (r.kegiatan && r.kegiatan.toLowerCase().includes(lower)) ||
          (r.akun_detail && r.akun_detail.toLowerCase().includes(lower)) ||
          label.toLowerCase().includes(lower);
        if (!match) return;
      }
      if (!bMap[label]) bMap[label] = { totalAnggaran: 0, count: 0, rows: [] };
      bMap[label].totalAnggaran += Number(r.anggaran) || 0;
      bMap[label].count += 1;
      bMap[label].rows.push(r);
    });

    const usedBKeys = new Set<string>();
    const computedPengeluaranItems = (pptTemplate.pengeluaranItems || []).map(item => {
      let itemTotal = 0;
      let itemCount = 0;
      let itemRows: any[] = [];
      Object.keys(bMap).forEach(k => {
        if (usedBKeys.has(k)) return;
        const isMatch = isPptKeyMatch(k, item.matchKeys || []);
        if (isMatch) {
          itemTotal += bMap[k].totalAnggaran;
          itemCount += bMap[k].count;
          itemRows.push(...bMap[k].rows);
          usedBKeys.add(k);
        }
      });
      return {
        id: item.id,
        label: item.label,
        matchKeys: item.matchKeys,
        totalAnggaran: itemTotal,
        count: itemCount,
        rows: itemRows
      };
    });

    // Belanja yang belum terpetakan ke pos manapun
    let bLainnyaTotal = 0;
    let bLainnyaCount = 0;
    let bLainnyaRows: any[] = [];
    Object.keys(bMap).forEach(k => {
      if (!usedBKeys.has(k)) {
        bLainnyaTotal += bMap[k].totalAnggaran;
        bLainnyaCount += bMap[k].count;
        bLainnyaRows.push(...bMap[k].rows);
      }
    });

    const totalPengeluaran = computedPengeluaranItems.reduce((acc, it) => acc + it.totalAnggaran, 0) + bLainnyaTotal;
    const surplusDefisit = totalPenerimaan - totalPengeluaran;

    return {
      penerimaan: {
        title: pptTemplate.penerimaanTitle || 'Jumlah Penerimaan Dana Masyarakat',
        sections: computedSections,
        lainnya: {
          label: pptTemplate.penerimaanLainnyaLabel || 'Penerimaan Lainnya / Surplus TA Lalu',
          totalPagu: pLainnyaTotal,
          count: pLainnyaCount,
          rows: pLainnyaRows
        },
        totalPenerimaan
      },
      pengeluaran: {
        title: pptTemplate.pengeluaranTitle || 'PENGELUARAN',
        items: computedPengeluaranItems,
        lainnya: {
          label: pptTemplate.pengeluaranLainnyaLabel || 'Belanja Lainnya / Penunjang',
          totalAnggaran: bLainnyaTotal,
          count: bLainnyaCount,
          rows: bLainnyaRows
        },
        totalPengeluaran
      },
      surplusDefisit
    };
  }, [penerimaanList, dataList, unitFilter, kategoriFilter, search, pptTemplate]);

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

  // Kelompokkan Detail Belanja Secara Hirarkis: Akun (Anak 1) -> Unit (Anak 2) -> Detail Rows (Anak 3)
  const groupedDetailBelanja = useMemo(() => {
    const akunMap: Record<string, {
      namaAkun: string;
      totalPagu: number;
      totalRows: number;
      unitMap: Record<string, { unit: string; totalPagu: number; count: number; rows: any[] }>;
    }> = {};

    allDetailRows.forEach(row => {
      const namaAkun = (row.akun_detail || row.nama_akun || 'Akun Belanja Tidak Terdefinisi').trim();
      const unit = (row.unit || 'Unit Kerja Tidak Terdefinisi').trim();
      const pagu = Number(row.anggaran) || 0;

      if (!akunMap[namaAkun]) {
        akunMap[namaAkun] = {
          namaAkun,
          totalPagu: 0,
          totalRows: 0,
          unitMap: {}
        };
      }

      akunMap[namaAkun].totalPagu += pagu;
      akunMap[namaAkun].totalRows += 1;

      if (!akunMap[namaAkun].unitMap[unit]) {
        akunMap[namaAkun].unitMap[unit] = {
          unit,
          totalPagu: 0,
          count: 0,
          rows: []
        };
      }

      akunMap[namaAkun].unitMap[unit].totalPagu += pagu;
      akunMap[namaAkun].unitMap[unit].count += 1;
      akunMap[namaAkun].unitMap[unit].rows.push(row);
    });

    const result: DetailGroupAkun[] = Object.values(akunMap).map(a => {
      const units: DetailGroupUnit[] = Object.values(a.unitMap).sort((u1, u2) => 
        u1.unit.localeCompare(u2.unit, 'id', { numeric: true, sensitivity: 'base' })
      );
      return {
        namaAkun: a.namaAkun,
        totalPagu: a.totalPagu,
        totalUnits: units.length,
        totalRows: a.totalRows,
        units
      };
    });

    // Urutkan Akun secara alfabet A-Z
    return result.sort((a, b) => a.namaAkun.localeCompare(b.namaAkun, 'id', { numeric: true, sensitivity: 'base' }));
  }, [allDetailRows]);

  // Kelompokkan Detail Penerimaan Secara Hirarkis: Akun (Anak 1) -> Unit (Anak 2) -> Detail Rows (Anak 3)
  const groupedDetailPenerimaan = useMemo(() => {
    const akunMap: Record<string, {
      namaAkun: string;
      totalPagu: number;
      totalRows: number;
      unitMap: Record<string, { unit: string; totalPagu: number; count: number; rows: any[] }>;
    }> = {};

    allDetailPenerimaanRows.forEach(row => {
      const namaAkun = (row.nama_akun_penerimaan || 'Akun Penerimaan Tidak Terdefinisi').trim();
      const unit = (row.unit_kerja || 'Unit Kerja Tidak Terdefinisi').trim();
      const pagu = Number(row.renterima_pagu) || 0;

      if (!akunMap[namaAkun]) {
        akunMap[namaAkun] = {
          namaAkun,
          totalPagu: 0,
          totalRows: 0,
          unitMap: {}
        };
      }

      akunMap[namaAkun].totalPagu += pagu;
      akunMap[namaAkun].totalRows += 1;

      if (!akunMap[namaAkun].unitMap[unit]) {
        akunMap[namaAkun].unitMap[unit] = {
          unit,
          totalPagu: 0,
          count: 0,
          rows: []
        };
      }

      akunMap[namaAkun].unitMap[unit].totalPagu += pagu;
      akunMap[namaAkun].unitMap[unit].count += 1;
      akunMap[namaAkun].unitMap[unit].rows.push(row);
    });

    const result: DetailGroupAkun[] = Object.values(akunMap).map(a => {
      const units: DetailGroupUnit[] = Object.values(a.unitMap).sort((u1, u2) => 
        u1.unit.localeCompare(u2.unit, 'id', { numeric: true, sensitivity: 'base' })
      );
      return {
        namaAkun: a.namaAkun,
        totalPagu: a.totalPagu,
        totalUnits: units.length,
        totalRows: a.totalRows,
        units
      };
    });

    // Urutkan Akun secara alfabet A-Z
    return result.sort((a, b) => a.namaAkun.localeCompare(b.namaAkun, 'id', { numeric: true, sensitivity: 'base' }));
  }, [allDetailPenerimaanRows]);

  // State Collapse untuk Hirarki Detail (Default Tertutup / Collapsed Kosong)
  const [openAkunSet, setOpenAkunSet] = useState<Set<string>>(new Set());
  const [openUnitSet, setOpenUnitSet] = useState<Set<string>>(new Set());

  // State collapse untuk baris Format Slide / PPT RKAT
  const [expandedPptPenerimaanSet, setExpandedPptPenerimaanSet] = useState<Set<string>>(new Set());
  const [expandedPptPengeluaranSet, setExpandedPptPengeluaranSet] = useState<Set<string>>(new Set());

  // State collapse untuk baris Format Tabel Standar (Atas-Bawah)
  const [expandedStdPenerimaanSet, setExpandedStdPenerimaanSet] = useState<Set<string>>(new Set());
  const [expandedStdBelanjaSet, setExpandedStdBelanjaSet] = useState<Set<string>>(new Set());

  const togglePptPenerimaan = (key: string) => {
    setExpandedPptPenerimaanSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePptPengeluaran = (key: string) => {
    setExpandedPptPengeluaranSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleStdPenerimaan = (key: string) => {
    setExpandedStdPenerimaanSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleStdBelanja = (key: string) => {
    setExpandedStdBelanjaSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Pagination untuk Level 1: Akun
  const [akunPageSize, setAkunPageSize] = useState<number | 'ALL'>(15);
  const [currentAkunPage, setCurrentAkunPage] = useState(1);

  const activeAkunList = activeDetailSubtab === 'penerimaan' ? groupedDetailPenerimaan : groupedDetailBelanja;
  const totalAkunPages = akunPageSize === 'ALL' ? 1 : Math.ceil(activeAkunList.length / (akunPageSize as number)) || 1;

  const paginatedAkunList = useMemo(() => {
    if (akunPageSize === 'ALL') return activeAkunList;
    const start = (currentAkunPage - 1) * (akunPageSize as number);
    return activeAkunList.slice(start, start + (akunPageSize as number));
  }, [activeAkunList, currentAkunPage, akunPageSize]);

  // Helper fungsi toggle expand/collapse
  const toggleAkun = (namaAkun: string) => {
    setOpenAkunSet(prev => {
      const next = new Set(prev);
      if (next.has(namaAkun)) next.delete(namaAkun);
      else next.add(namaAkun);
      return next;
    });
  };

  const toggleUnit = (key: string) => {
    setOpenUnitSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAllAkun = () => {
    const all = new Set(activeAkunList.map(a => a.namaAkun));
    setOpenAkunSet(all);
  };

  const collapseAll = () => {
    setOpenAkunSet(new Set());
    setOpenUnitSet(new Set());
  };

  // Reset pagination & collapse saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
    setCurrentAkunPage(1);
    setOpenAkunSet(new Set());
    setOpenUnitSet(new Set());
    setExpandedPptPenerimaanSet(new Set());
    setExpandedPptPengeluaranSet(new Set());
    setExpandedStdPenerimaanSet(new Set());
    setExpandedStdBelanjaSet(new Set());
  }, [modeLaporan, tahunFilter, unitFilter, kategoriFilter, search, pageSize, akunPageSize, activeDetailSubtab, summaryStyle]);

  // Aksi Klik Kategori dari Ringkasan untuk membuka Rincian
  const handleViewCategoryDetail = (catLabel: string) => {
    setKategoriFilter(catLabel);
    setActiveViewTab('detail');
    setCurrentPage(1);
    setCurrentAkunPage(1);
    setOpenAkunSet(new Set());
    setOpenUnitSet(new Set());
  };

  // Aksi Klik Unit Kerja dari Rekap untuk membuka Rincian
  const handleViewUnitDetail = (unitName: string) => {
    setUnitFilter(unitName);
    setActiveViewTab('detail');
    setCurrentPage(1);
    setCurrentAkunPage(1);
    setOpenAkunSet(new Set());
    setOpenUnitSet(new Set());
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
    if (uLower.includes('pusat studi') || uLower.includes('pusdi') || uLower.includes('(ps)') || uLower.startsWith('ps ') || uLower.startsWith('400')) return 'Pusat Studi';
    if (uLower.includes('direktorat') || uLower.includes('biro') || uLower.includes('kptu') || uLower.includes('kantor') || uLower.includes('sekretaris') || uLower.includes('satuan') || uLower.includes('badan')) return 'KPTU';
    if (uLower.includes('upu') || uLower.includes('penunjang') || uLower.includes('pusat') || uLower.includes('laboratorium') || uLower.includes('perpustakaan') || uLower.includes('arsip') || uLower.includes('rumah sakit')) return 'Unit Penunjang Universitas - UPU';
    return 'Lainnya';
  };

  // Rekapitulasi per Unit Kerja: Usulan Penerimaan, Pengeluaran Operasional, Belanja Modal, Surplus/Defisit
  const unitRekapData = useMemo(() => {
    const unitMap: Record<string, {
      unit: string;
      groupOrg: string;
      // 11 Kolom Standar RKAT:
      pendidikan: number;              // (1) Penerimaan Pendidikan (Akun 41*)
      nonPendidikan: number;           // (2) Penerimaan Non Pendidikan (Akun 42*)
      jumlahPenerimaan: number;        // (3) = (1) + (2)
      luncuran: number;                // (4) Surplus Anggaran Tahun Sebelumnya (Akun 40101*)
      sumberPembiayaan: number;        // (5) = (3) + (4)
      operasional: number;             // (6) Pengeluaran Operasional (Belanja operasional non-modal)
      modal: number;                   // (7) Investasi (Belanja Modal) (Akun 55* / Modal)
      totalPengeluaran: number;        // (8) = (6) + (7)
      surplusDefisitOperasional: number; // (9) = (3) - (6)
      surplusDefisitAnggaran: number;    // (10) = (5) - (8) = (3) + (4) - (8)
      
      // Backward compatibility fields
      penerimaan: number;
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
          pendidikan: 0,
          nonPendidikan: 0,
          jumlahPenerimaan: 0,
          luncuran: 0,
          sumberPembiayaan: 0,
          operasional: 0,
          modal: 0,
          totalPengeluaran: 0,
          surplusDefisitOperasional: 0,
          surplusDefisitAnggaran: 0,
          penerimaan: 0,
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
          (row.sumber_dana && row.sumber_dana.toLowerCase().includes(lower)) ||
          (row.format_proposal && row.format_proposal.toLowerCase().includes(lower));
        if (!match) return;
      }
      const item = getOrCreateUnit(u);
      const pagu = Number(row.renterima_pagu) || 0;
      const akun = (row.nama_akun_penerimaan || '').trim();
      const fp = (row.format_proposal || '').toLowerCase();
      const ket = (row.keterangan || '').toLowerCase();

      // (4) Luncuran: Akun 40101* atau label mengandung 'surplus' atau 'luncuran'
      const isLuncuran = akun.startsWith('40101') || fp.includes('surplus') || fp.includes('luncuran') || ket.includes('surplus anggaran tahun sebelumnya');

      // (1) Penerimaan Pendidikan: Akun 41* atau label mengandung 'pendidikan'
      const isPendidikan = !isLuncuran && (akun.startsWith('41') || fp.includes('pendidikan') || ket.includes('pendidikan'));

      if (isLuncuran) {
        item.luncuran += pagu;
      } else if (isPendidikan) {
        item.pendidikan += pagu;
      } else {
        // (2) Penerimaan Non Pendidikan: Akun 42* dan lainnya
        item.nonPendidikan += pagu;
      }

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

      // (7) Investasi (Belanja Modal): Akun 55* atau label mengandung 'modal'
      const isModal = akun.startsWith('55') || val.includes('modal');

      item.count += 1;
      if (isModal) {
        item.modal += ang;
      } else {
        // (6) Pengeluaran Operasional
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
    });

    // 3. Kalkulasi Posisi Aritmetika Standar Fakultas
    Object.values(unitMap).forEach(u => {
      u.jumlahPenerimaan = u.pendidikan + u.nonPendidikan;              // (3) = (1) + (2)
      u.sumberPembiayaan = u.jumlahPenerimaan + u.luncuran;              // (5) = (3) + (4)
      u.totalPengeluaran = u.operasional + u.modal;                      // (8) = (6) + (7)
      u.surplusDefisitOperasional = u.jumlahPenerimaan - u.operasional;  // (9) = (3) - (6)
      u.surplusDefisitAnggaran = u.sumberPembiayaan - u.totalPengeluaran; // (10) = (5) - (8) = (3) + (4) - (8)
      
      // Backward compatibility fields
      u.penerimaan = u.sumberPembiayaan;
      u.surplusDefisit = u.surplusDefisitAnggaran;
    });

    // Diurutkan A-Z berdasarkan KODE & NAMA UNIT KERJA
    return Object.values(unitMap).sort((a, b) => a.unit.localeCompare(b.unit, 'id', { numeric: true, sensitivity: 'base' }));
  }, [penerimaanList, dataList, modeLaporan, unitFilter, kategoriFilter, search, govUnitsList]);

  // Data Rekapitulasi Dikelompokkan per Group Org dari master gov_units
  const groupedByOrg = useMemo(() => {
    const groups: Record<string, {
      groupOrg: string;
      units: typeof unitRekapData;
      totalPendidikan: number;
      totalNonPendidikan: number;
      totalJumlahPenerimaan: number;
      totalLuncuran: number;
      totalSumberPembiayaan: number;
      totalOperasional: number;
      totalModal: number;
      totalPengeluaran: number;
      totalSurplusDefisitOperasional: number;
      totalSurplusDefisitAnggaran: number;
      totalPenerimaan: number;
      totalSurplusDefisit: number;
      totalCount: number;
    }> = {};

    unitRekapData.forEach(item => {
      const g = item.groupOrg || 'Lainnya';
      if (!groups[g]) {
        groups[g] = {
          groupOrg: g,
          units: [],
          totalPendidikan: 0,
          totalNonPendidikan: 0,
          totalJumlahPenerimaan: 0,
          totalLuncuran: 0,
          totalSumberPembiayaan: 0,
          totalOperasional: 0,
          totalModal: 0,
          totalPengeluaran: 0,
          totalSurplusDefisitOperasional: 0,
          totalSurplusDefisitAnggaran: 0,
          totalPenerimaan: 0,
          totalSurplusDefisit: 0,
          totalCount: 0
        };
      }
      groups[g].units.push(item);
      groups[g].totalPendidikan += item.pendidikan;
      groups[g].totalNonPendidikan += item.nonPendidikan;
      groups[g].totalJumlahPenerimaan += item.jumlahPenerimaan;
      groups[g].totalLuncuran += item.luncuran;
      groups[g].totalSumberPembiayaan += item.sumberPembiayaan;
      groups[g].totalOperasional += item.operasional;
      groups[g].totalModal += item.modal;
      groups[g].totalPengeluaran += item.totalPengeluaran;
      groups[g].totalSurplusDefisitOperasional += item.surplusDefisitOperasional;
      groups[g].totalSurplusDefisitAnggaran += item.surplusDefisitAnggaran;
      groups[g].totalPenerimaan += item.sumberPembiayaan;
      groups[g].totalSurplusDefisit += item.surplusDefisitAnggaran;
      groups[g].totalCount += item.count;
    });

    const groupOrder = ['Fakultas', 'Sekolah', 'Pusat Studi', 'Unit Penunjang Universitas - UPU', 'Unit Penunjang', 'KPTU', 'Tempat Ibadah', 'Lainnya'];
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
    let grandTotalPendidikan = 0;
    let grandTotalNonPendidikan = 0;
    let grandTotalJumlahPenerimaan = 0;
    let grandTotalLuncuran = 0;
    let grandTotalSumberPembiayaan = 0;
    let totalOperasional = 0;
    let totalModal = 0;
    let grandTotalPengeluaran = 0;
    let grandTotalSurplusDefisitOperasional = 0;
    let grandTotalSurplusDefisitAnggaran = 0;
    let totalItems = 0;

    unitRekapData.forEach(item => {
      grandTotalPendidikan += item.pendidikan;
      grandTotalNonPendidikan += item.nonPendidikan;
      grandTotalJumlahPenerimaan += item.jumlahPenerimaan;
      grandTotalLuncuran += item.luncuran;
      grandTotalSumberPembiayaan += item.sumberPembiayaan;
      totalOperasional += item.operasional;
      totalModal += item.modal;
      grandTotalPengeluaran += item.totalPengeluaran;
      grandTotalSurplusDefisitOperasional += item.surplusDefisitOperasional;
      grandTotalSurplusDefisitAnggaran += item.surplusDefisitAnggaran;
      totalItems += item.count;
    });

    return { 
      grandTotalPendidikan,
      grandTotalNonPendidikan,
      grandTotalJumlahPenerimaan,
      grandTotalLuncuran,
      grandTotalSumberPembiayaan,
      totalOperasional,
      totalModal,
      grandTotalPengeluaran,
      grandTotalSurplusDefisitOperasional,
      grandTotalSurplusDefisitAnggaran,
      // Backward compatibility fields
      grandTotalPenerimaan: grandTotalSumberPembiayaan,
      grandTotalSurplusDefisit: grandTotalSurplusDefisitAnggaran,
      totalItems 
    };
  }, [unitRekapData]);

  // Filtered Groups & Totals untuk Tab Rekap Unit Kerja
  const displayedRekapGroups = useMemo(() => {
    if (rekapGroupFilter === 'ALL') return groupedByOrg;
    return groupedByOrg.filter(g => g.groupOrg.toLowerCase() === rekapGroupFilter.toLowerCase());
  }, [groupedByOrg, rekapGroupFilter]);

  const displayedRekapTotals = useMemo(() => {
    const acc = {
      pendidikan: 0,
      nonPendidikan: 0,
      jumlahPenerimaan: 0,
      luncuran: 0,
      sumberPembiayaan: 0,
      operasional: 0,
      modal: 0,
      totalPengeluaran: 0,
      surplusDefisitOperasional: 0,
      surplusDefisitAnggaran: 0,
      totalUnits: 0,
      totalItems: 0
    };
    displayedRekapGroups.forEach(g => {
      acc.pendidikan += g.totalPendidikan;
      acc.nonPendidikan += g.totalNonPendidikan;
      acc.jumlahPenerimaan += g.totalJumlahPenerimaan;
      acc.luncuran += g.totalLuncuran;
      acc.sumberPembiayaan += g.totalSumberPembiayaan;
      acc.operasional += g.totalOperasional;
      acc.modal += g.totalModal;
      acc.totalPengeluaran += g.totalPengeluaran;
      acc.surplusDefisitOperasional += g.totalSurplusDefisitOperasional;
      acc.surplusDefisitAnggaran += g.totalSurplusDefisitAnggaran;
      acc.totalUnits += g.units.length;
      acc.totalItems += g.totalCount;
    });
    return acc;
  }, [displayedRekapGroups]);

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(Math.round(num));
  };

  // Grand Totals
  const grandTotal = useMemo(() => {
    const anggaran = groupedData.reduce((acc, g) => acc + g.totalAnggaran, 0);
    const totalItems = groupedData.reduce((acc, g) => acc + g.rows.length, 0);
    return { anggaran, totalItems };
  }, [groupedData]);

  // Export Excel Rekap Unit Kerja (Menggunakan ExcelJS: Format Rapi, Berwarna, Border, Currency Format, Siap Tayang / Print)
  const handleExportExcelUnitRekap = async () => {
    if (unitRekapData.length === 0) return toast.error('Tidak ada data untuk diexport');

    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Universitas Gadjah Mada';
      wb.lastModifiedBy = 'RKAT Online';
      wb.created = new Date();

      const isPusdi = rekapFormat === 'pusdi';
      const isUpu = rekapFormat === 'upu';
      const sheetName = isUpu ? 'Rekap_UPU' : isPusdi ? 'Rekap_PUSDI' : 'Rekap_Fakultas';
      const ws = wb.addWorksheet(sheetName, {
        views: [{ showGridLines: true }]
      });

      // 1. Title Banner
      const titleRow = ws.addRow(['UNIVERSITAS GADJAH MADA']);
      titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
      
      const subTitleText = isUpu
        ? `REKAPITULASI USULAN PROPOSAL RKAT - FORMAT UNIT PENUNJANG UNIVERSITAS (UPU) (10 KOLOM) TA ${tahunFilter}`
        : isPusdi
        ? `REKAPITULASI USULAN PROPOSAL RKAT - FORMAT PUSAT STUDI / PUSDI (9 KOLOM) TA ${tahunFilter}`
        : `REKAPITULASI USULAN PROPOSAL RKAT - FORMAT FAKULTAS (11 KOLOM) TA ${tahunFilter}`;
      const subTitleRow = ws.addRow([subTitleText]);
      subTitleRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF334155' } };

      const infoRow = ws.addRow([
        `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}  |  Filter: ${rekapGroupFilter === 'ALL' ? 'Semua Group Unit Kerja' : rekapGroupFilter}`
      ]);
      infoRow.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };

      ws.addRow([]); // Blank spacer

      // 2. Table Headers
      const headers = isUpu
        ? [
            'NO',
            'GROUP',
            '0. UNIT KERJA',
            '1. SUBSIDI (RP)',
            '2. PENERIMAAN (RP)',
            '3. LUNCURAN (RP)',
            '4. JML SUMBER PEMBIAYAAN (1+2+3) (RP)',
            '5. PENGELUARAN OPERASIONAL (RP)',
            '6. INVESTASI (BELANJA MODAL) (RP)',
            '7. TOTAL PENGELUARAN (5+6) (RP)',
            '8. SURPLUS / (DEFISIT) OPS (1+2-5) (RP)',
            '9. SURPLUS / (DEFISIT) ANGGARAN (RP)'
          ]
        : isPusdi
        ? [
            'NO',
            'GROUP',
            '0. UNIT KERJA',
            '1. PENERIMAAN (RP)',
            '2. LUNCURAN (RP)',
            '3. JML SUMBER PEMBIAYAAN (1+2) (RP)',
            '4. PENGELUARAN OPERASIONAL (RP)',
            '5. INVESTASI (BELANJA MODAL) (RP)',
            '6. TOTAL PENGELUARAN (4+5) (RP)',
            '7. SURPLUS / (DEFISIT) OPS (1-4) (RP)',
            '8. SURPLUS / (DEFISIT) ANGGARAN (3-6) (RP)'
          ]
        : [
            'NO',
            'GROUP',
            '0. UNIT KERJA',
            '1. PENERIMAAN PENDIDIKAN (RP)',
            '2. PENERIMAAN NON PENDIDIKAN (RP)',
            '3. JUMLAH PENERIMAAN (1+2) (RP)',
            '4. LUNCURAN / SURPLUS TA LALU (RP)',
            '5. JML SUMBER PEMBIAYAAN (3+4) (RP)',
            '6. PENGELUARAN OPERASIONAL (RP)',
            '7. INVESTASI (BELANJA MODAL) (RP)',
            '8. TOTAL PENGELUARAN (6+7) (RP)',
            '9. SURPLUS / (DEFISIT) OPS (3-6) (RP)',
            '10. SURPLUS / (DEFISIT) ANGGARAN (3+4-8) (RP)'
          ];

      const headerRow = ws.addRow(headers);
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F172A' } // Dark Slate Navy
        };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
          right: { style: 'thin', color: { argb: 'FF94A3B8' } }
        };
      });

      // Column number indicators row
      const colIndicators = isUpu
        ? ['#', '', '(0)', '(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)']
        : isPusdi
        ? ['#', '', '(0)', '(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)']
        : ['#', '', '(0)', '(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)'];

      const indicatorRow = ws.addRow(colIndicators);
      indicatorRow.height = 18;
      indicatorRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF334155' }
        };
        cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFE2E8F0' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF94A3B8' } },
          left: { style: 'thin', color: { argb: 'FF94A3B8' } },
          bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
          right: { style: 'thin', color: { argb: 'FF94A3B8' } }
        };
      });

      // Filter group jika rekapGroupFilter aktif
      const displayGroups = rekapGroupFilter === 'ALL' 
        ? groupedByOrg 
        : groupedByOrg.filter(g => g.groupOrg.toLowerCase() === rekapGroupFilter.toLowerCase());

      const numCols = headers.length;
      let rowNum = 1;

      displayGroups.forEach(group => {
        // Group Header Banner
        const groupTitle = `GROUP ORGANISASI: ${group.groupOrg.toUpperCase()} (${group.units.length} UNIT KERJA)`;
        const grpRow = ws.addRow(['', group.groupOrg.toUpperCase(), groupTitle, ...Array(numCols - 3).fill('')]);
        grpRow.height = 24;
        grpRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEEF2FF' } // Indigo 50
          };
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF312E81' } };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF818CF8' } },
            bottom: { style: 'thin', color: { argb: 'FFC7D2FE' } }
          };
        });

        // Unit rows
        group.units.forEach(u => {
          const rowValues = isUpu
            ? [
                rowNum++,
                group.groupOrg,
                u.unit,
                0, // 1. Subsidi dikosongi dahulu
                u.jumlahPenerimaan,
                u.luncuran,
                u.sumberPembiayaan,
                u.operasional,
                u.modal,
                u.totalPengeluaran,
                u.surplusDefisitOperasional,
                u.surplusDefisitAnggaran
              ]
            : isPusdi
            ? [
                rowNum++,
                group.groupOrg,
                u.unit,
                u.jumlahPenerimaan,
                u.luncuran,
                u.sumberPembiayaan,
                u.operasional,
                u.modal,
                u.totalPengeluaran,
                u.surplusDefisitOperasional,
                u.surplusDefisitAnggaran
              ]
            : [
                rowNum++,
                group.groupOrg,
                u.unit,
                u.pendidikan,
                u.nonPendidikan,
                u.jumlahPenerimaan,
                u.luncuran,
                u.sumberPembiayaan,
                u.operasional,
                u.modal,
                u.totalPengeluaran,
                u.surplusDefisitOperasional,
                u.surplusDefisitAnggaran
              ];

          const dataRow = ws.addRow(rowValues);
          dataRow.height = 20;
          dataRow.eachCell((cell, colIndex) => {
            cell.font = { name: 'Calibri', size: 9.5 };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };

            if (colIndex === 1) {
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            } else if (colIndex === 2) {
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
            } else if (colIndex === 3) {
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
              cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
            } else {
              // Numerical columns
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
              cell.numFmt = '#,##0';
              if (isUpu) {
                if (colIndex === 5 || colIndex === 7) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // Soft green
                } else if (colIndex === 10) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF5FF' } }; // Soft purple
                }
              } else if (isPusdi) {
                if (colIndex === 4 || colIndex === 6) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // Soft green
                } else if (colIndex === 9) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF5FF' } }; // Soft purple
                }
              } else {
                if (colIndex === 6 || colIndex === 8) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // Soft green
                } else if (colIndex === 11) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF5FF' } }; // Soft purple
                }
              }
            }
          });
        });

        // Group Subtotal row
        const subtotalValues = isUpu
          ? [
              '',
              `SUBTOTAL ${group.groupOrg}`,
              `TOTAL ${group.groupOrg.toUpperCase()} (${group.units.length} Unit)`,
              0,
              group.totalJumlahPenerimaan,
              group.totalLuncuran,
              group.totalSumberPembiayaan,
              group.totalOperasional,
              group.totalModal,
              group.totalPengeluaran,
              group.totalSurplusDefisitOperasional,
              group.totalSurplusDefisitAnggaran
            ]
          : isPusdi
          ? [
              '',
              `SUBTOTAL ${group.groupOrg}`,
              `TOTAL ${group.groupOrg.toUpperCase()} (${group.units.length} Unit)`,
              group.totalJumlahPenerimaan,
              group.totalLuncuran,
              group.totalSumberPembiayaan,
              group.totalOperasional,
              group.totalModal,
              group.totalPengeluaran,
              group.totalSurplusDefisitOperasional,
              group.totalSurplusDefisitAnggaran
            ]
          : [
              '',
              `SUBTOTAL ${group.groupOrg}`,
              `TOTAL ${group.groupOrg.toUpperCase()} (${group.units.length} Unit)`,
              group.totalPendidikan,
              group.totalNonPendidikan,
              group.totalJumlahPenerimaan,
              group.totalLuncuran,
              group.totalSumberPembiayaan,
              group.totalOperasional,
              group.totalModal,
              group.totalPengeluaran,
              group.totalSurplusDefisitOperasional,
              group.totalSurplusDefisitAnggaran
            ];

        const subRow = ws.addRow(subtotalValues);
        subRow.height = 22;
        subRow.eachCell((cell, colIndex) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF1F5F9' } // Slate 100
          };
          cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF94A3B8' } },
            bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
          if (colIndex <= 3) {
            cell.alignment = { horizontal: colIndex === 3 ? 'right' : 'left', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          }
        });

        ws.addRow([]); // Blank spacer between groups
      });

      // Grand Total Row
      const grandTotalValues = isUpu
        ? [
            '',
            'TOTAL KESELURUHAN',
            `TOTAL (${displayedRekapTotals.totalUnits} UNIT KERJA)`,
            0,
            displayedRekapTotals.jumlahPenerimaan,
            displayedRekapTotals.luncuran,
            displayedRekapTotals.sumberPembiayaan,
            displayedRekapTotals.operasional,
            displayedRekapTotals.modal,
            displayedRekapTotals.totalPengeluaran,
            displayedRekapTotals.surplusDefisitOperasional,
            displayedRekapTotals.surplusDefisitAnggaran
          ]
        : isPusdi
        ? [
            '',
            'TOTAL KESELURUHAN',
            `TOTAL (${displayedRekapTotals.totalUnits} UNIT KERJA)`,
            displayedRekapTotals.jumlahPenerimaan,
            displayedRekapTotals.luncuran,
            displayedRekapTotals.sumberPembiayaan,
            displayedRekapTotals.operasional,
            displayedRekapTotals.modal,
            displayedRekapTotals.totalPengeluaran,
            displayedRekapTotals.surplusDefisitOperasional,
            displayedRekapTotals.surplusDefisitAnggaran
          ]
        : [
            '',
            'TOTAL KESELURUHAN',
            `TOTAL (${displayedRekapTotals.totalUnits} UNIT KERJA)`,
            displayedRekapTotals.pendidikan,
            displayedRekapTotals.nonPendidikan,
            displayedRekapTotals.jumlahPenerimaan,
            displayedRekapTotals.luncuran,
            displayedRekapTotals.sumberPembiayaan,
            displayedRekapTotals.operasional,
            displayedRekapTotals.modal,
            displayedRekapTotals.totalPengeluaran,
            displayedRekapTotals.surplusDefisitOperasional,
            displayedRekapTotals.surplusDefisitAnggaran
          ];

      const grandRow = ws.addRow(grandTotalValues);
      grandRow.height = 26;
      grandRow.eachCell((cell, colIndex) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' } // Slate 200
        };
        cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF64748B' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        if (colIndex <= 3) {
          cell.alignment = { horizontal: colIndex === 3 ? 'right' : 'left', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        }
      });

      // Column widths
      if (isUpu) {
        ws.columns = [
          { width: 6 },  // NO
          { width: 18 }, // GROUP
          { width: 45 }, // 0. UNIT KERJA
          { width: 16 }, // 1. SUBSIDI
          { width: 25 }, // 2. PENERIMAAN
          { width: 23 }, // 3. LUNCURAN
          { width: 27 }, // 4. JML SUMBER PEMBIAYAAN
          { width: 25 }, // 5. PENGELUARAN OPERASIONAL
          { width: 24 }, // 6. INVESTASI (MODAL)
          { width: 27 }, // 7. TOTAL PENGELUARAN
          { width: 28 }, // 8. SURPLUS/DEFISIT OPS
          { width: 28 }  // 9. SURPLUS/DEFISIT ANGGARAN
        ];
      } else if (isPusdi) {
        ws.columns = [
          { width: 6 },  // NO
          { width: 18 }, // GROUP
          { width: 45 }, // 0. UNIT KERJA
          { width: 25 }, // 1. PENERIMAAN
          { width: 23 }, // 2. LUNCURAN
          { width: 27 }, // 3. JML SUMBER PEMBIAYAAN
          { width: 25 }, // 4. PENGELUARAN OPERASIONAL
          { width: 24 }, // 5. INVESTASI (MODAL)
          { width: 27 }, // 6. TOTAL PENGELUARAN
          { width: 28 }, // 7. SURPLUS/DEFISIT OPS
          { width: 28 }  // 8. SURPLUS/DEFISIT ANGGARAN
        ];
      } else {
        ws.columns = [
          { width: 6 },  // NO
          { width: 18 }, // GROUP
          { width: 45 }, // 0. UNIT KERJA
          { width: 25 }, // 1. PENERIMAAN PENDIDIKAN
          { width: 25 }, // 2. PENERIMAAN NON PENDIDIKAN
          { width: 27 }, // 3. JUMLAH PENERIMAAN
          { width: 24 }, // 4. LUNCURAN
          { width: 27 }, // 5. JML SUMBER PEMBIAYAAN
          { width: 25 }, // 6. PENGELUARAN OPERASIONAL
          { width: 24 }, // 7. INVESTASI (MODAL)
          { width: 27 }, // 8. TOTAL PENGELUARAN
          { width: 28 }, // 9. SURPLUS/DEFISIT OPS
          { width: 28 }  // 10. SURPLUS/DEFISIT ANGGARAN
        ];
      }

      // Trigger download
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = isUpu
        ? `Rekap_Proposal_RKAT_UPU_${tahunFilter}.xlsx`
        : isPusdi
        ? `Rekap_Proposal_RKAT_PUSDI_${tahunFilter}.xlsx`
        : `Rekap_Proposal_RKAT_Fakultas_${tahunFilter}.xlsx`;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      const formatTag = isUpu ? 'Format UPU 10 Kolom' : isPusdi ? 'Format PUSDI 9 Kolom' : 'Format Fakultas 11 Kolom';
      toast.success(`File Excel (${formatTag}) berhasil diexport!`);
    } catch (err: any) {
      console.error('Export Excel error:', err);
      toast.error('Gagal export Excel: ' + err.message);
    }
  };

  // Export Word Landscape Rekap Unit Kerja (Menggunakan docx: Orientasi Landscape, Pas 1 Halaman Lebar, kebawah multi halaman)
  const handleExportWordUnitRekap = async () => {
    if (unitRekapData.length === 0) return toast.error('Tidak ada data untuk diexport');

    try {
      const isUpu = rekapFormat === 'upu';
      const isPusdi = rekapFormat === 'pusdi';

      const formatLabel = isUpu ? 'UPU' : isPusdi ? 'PUSDI' : 'Fakultas';
      const formatSubtitle = isUpu
        ? `REKAPITULASI USULAN PROPOSAL RKAT - FORMAT UNIT PENUNJANG UNIVERSITAS (UPU) (10 KOLOM) TA ${tahunFilter}`
        : isPusdi
        ? `REKAPITULASI USULAN PROPOSAL RKAT - FORMAT PUSAT STUDI / PUSDI (9 KOLOM) TA ${tahunFilter}`
        : `REKAPITULASI USULAN PROPOSAL RKAT - FORMAT FAKULTAS (11 KOLOM) TA ${tahunFilter}`;

      // Kolom Word (Kolom Group dihilangkan sesuai permintaan user agar muat rapi 1 halaman lebar)
      const headers = isUpu
        ? [
            'NO',
            '0. UNIT KERJA',
            '1. SUBSIDI',
            '2. PENERIMAAN',
            '3. LUNCURAN',
            '4. JML PEMBIAYAAN (1+2+3)',
            '5. PENGELUARAN OPS',
            '6. INVESTASI (MODAL)',
            '7. TOTAL PENGELUARAN (5+6)',
            '8. SURPLUS/(DEFISIT) OPS (1+2-5)',
            '9. S/D ANGGARAN'
          ]
        : isPusdi
        ? [
            'NO',
            '0. UNIT KERJA',
            '1. PENERIMAAN',
            '2. LUNCURAN',
            '3. JML PEMBIAYAAN (1+2)',
            '4. PENGELUARAN OPS',
            '5. INVESTASI (MODAL)',
            '6. TOTAL PENGELUARAN (4+5)',
            '7. SURPLUS/(DEFISIT) OPS (1-4)',
            '8. S/D ANGGARAN (3-6)'
          ]
        : [
            'NO',
            '0. UNIT KERJA',
            '1. PEN. PENDIDIKAN',
            '2. PEN. NON PENDIDIKAN',
            '3. JML PENERIMAAN (1+2)',
            '4. LUNCURAN',
            '5. JML PEMBIAYAAN (3+4)',
            '6. PENGELUARAN OPS',
            '7. INVESTASI (MODAL)',
            '8. TOTAL PENGELUARAN (6+7)',
            '9. SURPLUS/(DEFISIT) OPS (3-6)',
            '10. S/D ANGGARAN'
          ];

      const numCols = isUpu ? 11 : isPusdi ? 10 : 12;

      // Header Fill Color and Cell Borders (sesuai gambar: Light Blue #9DC3E6 dengan border hitam solid)
      const headerFill = '9DC3E6';
      const borderSingle = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
      const cellBorders = { top: borderSingle, bottom: borderSingle, left: borderSingle, right: borderSingle };

      const makeHeaderCell = ({
        text,
        rowSpan,
        columnSpan,
        align = AlignmentType.CENTER,
        bold = true,
        size = 15
      }: {
        text: string;
        rowSpan?: number;
        columnSpan?: number;
        align?: any;
        bold?: boolean;
        size?: number;
      }) => {
        return new DocxTableCell({
          rowSpan,
          columnSpan,
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold, size, color: '000000' })],
              alignment: align,
            })
          ],
          shading: { fill: headerFill, type: ShadingType.CLEAR },
          verticalAlign: VerticalAlign.CENTER,
          borders: cellBorders,
        });
      };

      // Table Header Rows
      let headerRowsList: DocxTableRow[] = [];

      if (!isUpu && !isPusdi) {
        // === FORMAT FAKULTAS (Persis seperti gambar lampiran user) ===
        // Baris 1: Header Utama (No & Unit Kerja rowSpan 2, Penerimaan colSpan 3, Kolom lain rowSpan 2)
        const fHeaderRow1 = new DocxTableRow({
          tableHeader: true,
          children: [
            makeHeaderCell({ text: 'No', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Unit Kerja', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Penerimaan', columnSpan: 3, size: 15 }),
            makeHeaderCell({ text: 'Luncuran', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Jumlah Sumber Pembiayaan', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Pengeluaran Operasional', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Investasi (Belanja Modal)', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Total Pengeluaran', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Surplus / Defisit Operasional', rowSpan: 2, size: 15 }),
            makeHeaderCell({ text: 'Surplus / Defisit Anggaran', rowSpan: 2, size: 15 }),
          ]
        });

        // Baris 2: Sub-kolom Penerimaan (Pendidikan, Non Pendidikan, Jumlah)
        const fHeaderRow2 = new DocxTableRow({
          tableHeader: true,
          children: [
            makeHeaderCell({ text: 'Pendidikan', size: 14 }),
            makeHeaderCell({ text: 'Non Pendidikan', size: 14 }),
            makeHeaderCell({ text: 'Jumlah', size: 14 }),
          ]
        });

        // Baris 3: Nomor Kolom & Formula (1, 2, 3 (1+2), 4, 5 (3+4), 6, 7, 8 (6+7), 9 (3-6), 10 (3+4-8))
        const fHeaderRow3 = new DocxTableRow({
          tableHeader: true,
          children: [
            makeHeaderCell({ text: '', size: 13 }),
            makeHeaderCell({ text: '', size: 13 }),
            makeHeaderCell({ text: '1', size: 13 }),
            makeHeaderCell({ text: '2', size: 13 }),
            makeHeaderCell({ text: '3 (1+2)', size: 13 }),
            makeHeaderCell({ text: '4', size: 13 }),
            makeHeaderCell({ text: '5 (3+4)', size: 13 }),
            makeHeaderCell({ text: '6', size: 13 }),
            makeHeaderCell({ text: '7', size: 13 }),
            makeHeaderCell({ text: '8 (6+7)', size: 13 }),
            makeHeaderCell({ text: '9 (3-6)', size: 13 }),
            makeHeaderCell({ text: '10 (3+4-8)', size: 13 }),
          ]
        });

        headerRowsList = [fHeaderRow1, fHeaderRow2, fHeaderRow3];
      } else if (isPusdi) {
        // === FORMAT PUSDI (9 Kolom Data, Mengikuti Desain Dasar) ===
        const pHeaderRow1 = new DocxTableRow({
          tableHeader: true,
          children: [
            makeHeaderCell({ text: 'No', size: 15 }),
            makeHeaderCell({ text: 'Unit Kerja', size: 15 }),
            makeHeaderCell({ text: 'Penerimaan', size: 15 }),
            makeHeaderCell({ text: 'Luncuran', size: 15 }),
            makeHeaderCell({ text: 'Jumlah Sumber Pembiayaan', size: 15 }),
            makeHeaderCell({ text: 'Pengeluaran Operasional', size: 15 }),
            makeHeaderCell({ text: 'Investasi (Belanja Modal)', size: 15 }),
            makeHeaderCell({ text: 'Total Pengeluaran', size: 15 }),
            makeHeaderCell({ text: 'Surplus / Defisit Operasional', size: 15 }),
            makeHeaderCell({ text: 'Surplus / Defisit Anggaran', size: 15 }),
          ]
        });

        const pHeaderRow2 = new DocxTableRow({
          tableHeader: true,
          children: [
            makeHeaderCell({ text: '', size: 13 }),
            makeHeaderCell({ text: '', size: 13 }),
            makeHeaderCell({ text: '1', size: 13 }),
            makeHeaderCell({ text: '2', size: 13 }),
            makeHeaderCell({ text: '3 (1+2)', size: 13 }),
            makeHeaderCell({ text: '4', size: 13 }),
            makeHeaderCell({ text: '5', size: 13 }),
            makeHeaderCell({ text: '6 (4+5)', size: 13 }),
            makeHeaderCell({ text: '7 (1-4)', size: 13 }),
            makeHeaderCell({ text: '8 (3-6)', size: 13 }),
          ]
        });

        headerRowsList = [pHeaderRow1, pHeaderRow2];
      } else {
        // === FORMAT UPU (10 Kolom Data, Mengikuti Desain Dasar) ===
        const uHeaderRow1 = new DocxTableRow({
          tableHeader: true,
          children: [
            makeHeaderCell({ text: 'No', size: 15 }),
            makeHeaderCell({ text: 'Unit Kerja', size: 15 }),
            makeHeaderCell({ text: 'Subsidi', size: 15 }),
            makeHeaderCell({ text: 'Penerimaan', size: 15 }),
            makeHeaderCell({ text: 'Luncuran', size: 15 }),
            makeHeaderCell({ text: 'Jumlah Sumber Pembiayaan', size: 15 }),
            makeHeaderCell({ text: 'Pengeluaran Operasional', size: 15 }),
            makeHeaderCell({ text: 'Investasi (Belanja Modal)', size: 15 }),
            makeHeaderCell({ text: 'Total Pengeluaran', size: 15 }),
            makeHeaderCell({ text: 'Surplus / Defisit Operasional', size: 15 }),
            makeHeaderCell({ text: 'Surplus / Defisit Anggaran', size: 15 }),
          ]
        });

        const uHeaderRow2 = new DocxTableRow({
          tableHeader: true,
          children: [
            makeHeaderCell({ text: '', size: 13 }),
            makeHeaderCell({ text: '', size: 13 }),
            makeHeaderCell({ text: '1', size: 13 }),
            makeHeaderCell({ text: '2', size: 13 }),
            makeHeaderCell({ text: '3', size: 13 }),
            makeHeaderCell({ text: '4 (1+2+3)', size: 13 }),
            makeHeaderCell({ text: '5', size: 13 }),
            makeHeaderCell({ text: '6', size: 13 }),
            makeHeaderCell({ text: '7 (5+6)', size: 13 }),
            makeHeaderCell({ text: '8 (1+2-5)', size: 13 }),
            makeHeaderCell({ text: '9 (3-6)', size: 13 }),
          ]
        });

        headerRowsList = [uHeaderRow1, uHeaderRow2];
      }

      const displayGroups = rekapGroupFilter === 'ALL' 
        ? groupedByOrg 
        : groupedByOrg.filter(g => g.groupOrg.toLowerCase() === rekapGroupFilter.toLowerCase());

      const tableRows: DocxTableRow[] = [...headerRowsList];
      let rowNum = 1;

      displayGroups.forEach(group => {
        // Group Header Banner
        const grpRow = new DocxTableRow({
          children: [
            new DocxTableCell({
              columnSpan: numCols,
              children: [new Paragraph({
                children: [
                  new TextRun({ 
                    text: `GROUP: ${group.groupOrg.toUpperCase()} (${group.units.length} UNIT KERJA)`, 
                    bold: true, 
                    color: '1E3A8A', 
                    size: 15 
                  })
                ],
                alignment: AlignmentType.LEFT,
              })],
              shading: { fill: 'D9E1F2', type: ShadingType.CLEAR },
              verticalAlign: VerticalAlign.CENTER,
              borders: cellBorders,
            })
          ]
        });
        tableRows.push(grpRow);

        // Unit data rows
        group.units.forEach(u => {
          const cellsData = isUpu
            ? [
                { text: String(rowNum++), align: AlignmentType.CENTER, bold: false },
                { text: u.unit, align: AlignmentType.LEFT, bold: true },
                { text: 'Rp 0', align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.jumlahPenerimaan)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.luncuran)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.sumberPembiayaan)}`, align: AlignmentType.RIGHT, bold: true },
                { text: `Rp ${formatRp(u.operasional)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.modal)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.totalPengeluaran)}`, align: AlignmentType.RIGHT, bold: true },
                { text: `${u.surplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(u.surplusDefisitOperasional))}`, align: AlignmentType.RIGHT, bold: false },
                { text: `${u.surplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(u.surplusDefisitAnggaran))}`, align: AlignmentType.RIGHT, bold: true }
              ]
            : isPusdi
            ? [
                { text: String(rowNum++), align: AlignmentType.CENTER, bold: false },
                { text: u.unit, align: AlignmentType.LEFT, bold: true },
                { text: `Rp ${formatRp(u.jumlahPenerimaan)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.luncuran)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.sumberPembiayaan)}`, align: AlignmentType.RIGHT, bold: true },
                { text: `Rp ${formatRp(u.operasional)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.modal)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.totalPengeluaran)}`, align: AlignmentType.RIGHT, bold: true },
                { text: `${u.surplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(u.surplusDefisitOperasional))}`, align: AlignmentType.RIGHT, bold: false },
                { text: `${u.surplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(u.surplusDefisitAnggaran))}`, align: AlignmentType.RIGHT, bold: true }
              ]
            : [
                { text: String(rowNum++), align: AlignmentType.CENTER, bold: false },
                { text: u.unit, align: AlignmentType.LEFT, bold: true },
                { text: `Rp ${formatRp(u.pendidikan)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.nonPendidikan)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.jumlahPenerimaan)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.luncuran)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.sumberPembiayaan)}`, align: AlignmentType.RIGHT, bold: true },
                { text: `Rp ${formatRp(u.operasional)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.modal)}`, align: AlignmentType.RIGHT, bold: false },
                { text: `Rp ${formatRp(u.totalPengeluaran)}`, align: AlignmentType.RIGHT, bold: true },
                { text: `${u.surplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(u.surplusDefisitOperasional))}`, align: AlignmentType.RIGHT, bold: false },
                { text: `${u.surplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(u.surplusDefisitAnggaran))}`, align: AlignmentType.RIGHT, bold: true }
              ];

          const dRow = new DocxTableRow({
            children: cellsData.map(c => new DocxTableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: c.text, bold: c.bold, size: 14 })],
                alignment: c.align,
              })],
              verticalAlign: VerticalAlign.CENTER,
              borders: cellBorders,
            }))
          });
          tableRows.push(dRow);
        });

        // Group Subtotal row
        const subtotalCells = isUpu
          ? [
              `Rp 0`,
              `Rp ${formatRp(group.totalJumlahPenerimaan)}`,
              `Rp ${formatRp(group.totalLuncuran)}`,
              `Rp ${formatRp(group.totalSumberPembiayaan)}`,
              `Rp ${formatRp(group.totalOperasional)}`,
              `Rp ${formatRp(group.totalModal)}`,
              `Rp ${formatRp(group.totalPengeluaran)}`,
              `${group.totalSurplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(group.totalSurplusDefisitOperasional))}`,
              `${group.totalSurplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(group.totalSurplusDefisitAnggaran))}`
            ]
          : isPusdi
          ? [
              `Rp ${formatRp(group.totalJumlahPenerimaan)}`,
              `Rp ${formatRp(group.totalLuncuran)}`,
              `Rp ${formatRp(group.totalSumberPembiayaan)}`,
              `Rp ${formatRp(group.totalOperasional)}`,
              `Rp ${formatRp(group.totalModal)}`,
              `Rp ${formatRp(group.totalPengeluaran)}`,
              `${group.totalSurplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(group.totalSurplusDefisitOperasional))}`,
              `${group.totalSurplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(group.totalSurplusDefisitAnggaran))}`
            ]
          : [
              `Rp ${formatRp(group.totalPendidikan)}`,
              `Rp ${formatRp(group.totalNonPendidikan)}`,
              `Rp ${formatRp(group.totalJumlahPenerimaan)}`,
              `Rp ${formatRp(group.totalLuncuran)}`,
              `Rp ${formatRp(group.totalSumberPembiayaan)}`,
              `Rp ${formatRp(group.totalOperasional)}`,
              `Rp ${formatRp(group.totalModal)}`,
              `Rp ${formatRp(group.totalPengeluaran)}`,
              `${group.totalSurplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(group.totalSurplusDefisitOperasional))}`,
              `${group.totalSurplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(group.totalSurplusDefisitAnggaran))}`
            ];

        const subRow = new DocxTableRow({
          children: [
            new DocxTableCell({
              columnSpan: 2,
              children: [new Paragraph({
                children: [new TextRun({ text: `SUBTOTAL ${group.groupOrg.toUpperCase()}`, bold: true, size: 14 })],
                alignment: AlignmentType.RIGHT,
              })],
              shading: { fill: 'F2F2F2', type: ShadingType.CLEAR },
              verticalAlign: VerticalAlign.CENTER,
              borders: cellBorders,
            }),
            ...subtotalCells.map(val => new DocxTableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: val, bold: true, size: 14 })],
                alignment: AlignmentType.RIGHT,
              })],
              shading: { fill: 'F2F2F2', type: ShadingType.CLEAR },
              verticalAlign: VerticalAlign.CENTER,
              borders: cellBorders,
            }))
          ]
        });
        tableRows.push(subRow);
      });

      // Grand Total row
      const grandTotalCells = isUpu
        ? [
            `Rp 0`,
            `Rp ${formatRp(displayedRekapTotals.jumlahPenerimaan)}`,
            `Rp ${formatRp(displayedRekapTotals.luncuran)}`,
            `Rp ${formatRp(displayedRekapTotals.sumberPembiayaan)}`,
            `Rp ${formatRp(displayedRekapTotals.operasional)}`,
            `Rp ${formatRp(displayedRekapTotals.modal)}`,
            `Rp ${formatRp(displayedRekapTotals.totalPengeluaran)}`,
            `${displayedRekapTotals.surplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(displayedRekapTotals.surplusDefisitOperasional))}`,
            `${displayedRekapTotals.surplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(displayedRekapTotals.surplusDefisitAnggaran))}`
          ]
        : isPusdi
        ? [
            `Rp ${formatRp(displayedRekapTotals.jumlahPenerimaan)}`,
            `Rp ${formatRp(displayedRekapTotals.luncuran)}`,
            `Rp ${formatRp(displayedRekapTotals.sumberPembiayaan)}`,
            `Rp ${formatRp(displayedRekapTotals.operasional)}`,
            `Rp ${formatRp(displayedRekapTotals.modal)}`,
            `Rp ${formatRp(displayedRekapTotals.totalPengeluaran)}`,
            `${displayedRekapTotals.surplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(displayedRekapTotals.surplusDefisitOperasional))}`,
            `${displayedRekapTotals.surplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(displayedRekapTotals.surplusDefisitAnggaran))}`
          ]
        : [
            `Rp ${formatRp(displayedRekapTotals.pendidikan)}`,
            `Rp ${formatRp(displayedRekapTotals.nonPendidikan)}`,
            `Rp ${formatRp(displayedRekapTotals.jumlahPenerimaan)}`,
            `Rp ${formatRp(displayedRekapTotals.luncuran)}`,
            `Rp ${formatRp(displayedRekapTotals.sumberPembiayaan)}`,
            `Rp ${formatRp(displayedRekapTotals.operasional)}`,
            `Rp ${formatRp(displayedRekapTotals.modal)}`,
            `Rp ${formatRp(displayedRekapTotals.totalPengeluaran)}`,
            `${displayedRekapTotals.surplusDefisitOperasional < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(displayedRekapTotals.surplusDefisitOperasional))}`,
            `${displayedRekapTotals.surplusDefisitAnggaran < 0 ? '- ' : ''}Rp ${formatRp(Math.abs(displayedRekapTotals.surplusDefisitAnggaran))}`
          ];

      const grandRow = new DocxTableRow({
        children: [
          new DocxTableCell({
            columnSpan: 2,
            children: [new Paragraph({
              children: [new TextRun({ text: `TOTAL KESELURUHAN (${displayedRekapTotals.totalUnits} UNIT)`, bold: true, size: 14 })],
              alignment: AlignmentType.RIGHT,
            })],
            shading: { fill: 'BDD7EE', type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            borders: cellBorders,
          }),
          ...grandTotalCells.map(val => new DocxTableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: val, bold: true, size: 14 })],
              alignment: AlignmentType.RIGHT,
            })],
            shading: { fill: 'BDD7EE', type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            borders: cellBorders,
          }))
        ]
      });
      tableRows.push(grandRow);

      const docTable = new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
        borders: {
          top: borderSingle,
          bottom: borderSingle,
          left: borderSingle,
          right: borderSingle,
          insideHorizontal: borderSingle,
          insideVertical: borderSingle,
        }
      });

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'UNIVERSITAS GADJAH MADA', bold: true, size: 26, color: '0F172A' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [new TextRun({ text: formatSubtitle, bold: true, size: 20, color: '334155' })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 80 },
            }),
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}  |  Filter: ${rekapGroupFilter === 'ALL' ? 'Semua Group Unit Kerja' : rekapGroupFilter}`, 
                  italics: true, 
                  size: 16, 
                  color: '64748B' 
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            }),
            docTable
          ],
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `Rekap_Proposal_RKAT_${formatLabel}_${tahunFilter}.docx`;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`File Word Landscape (${formatLabel}) berhasil diexport!`);
    } catch (err: any) {
      console.error('Export Word error:', err);
      toast.error('Gagal export Word: ' + err.message);
    }
  };

  // Export Excel Khusus Struktur Format PPT Proposal RKAT
  const handleExportExcelPptFormat = () => {
    const aoa: any[][] = [];
    aoa.push(['UNIVERSITAS GADJAH MADA']);
    aoa.push([`FORMAT USULAN PROPOSAL RKAT TAHUN ANGGARAN ${tahunFilter}`]);
    aoa.push([`Standar Presentasi Eksekutif / Slide PPT  |  Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`]);
    aoa.push([]);

    aoa.push(['URAIAN PROPOSAL RKAT', 'JUMLAH BARIS', 'PAGU USULAN (RP)', '% PROPORSI']);

    // PENERIMAAN
    aoa.push([pptProposalData.penerimaan.title || 'JUMLAH PENERIMAAN DANA MASYARAKAT', '', '', '']);
    
    pptProposalData.penerimaan.sections.forEach(sec => {
      const secPct = pptProposalData.penerimaan.totalPenerimaan > 0 ? ((sec.subtotal / pptProposalData.penerimaan.totalPenerimaan) * 100).toFixed(1) + '%' : '0%';
      aoa.push([`  ${sec.title}`, sec.count, sec.subtotal, secPct]);
      sec.items.forEach(it => {
        const pct = pptProposalData.penerimaan.totalPenerimaan > 0 ? ((it.totalPagu / pptProposalData.penerimaan.totalPenerimaan) * 100).toFixed(1) + '%' : '0%';
        aoa.push([`    ${it.label}`, it.count, it.totalPagu, pct]);
      });
    });

    if (pptProposalData.penerimaan.lainnya.totalPagu > 0) {
      const pct = pptProposalData.penerimaan.totalPenerimaan > 0 ? ((pptProposalData.penerimaan.lainnya.totalPagu / pptProposalData.penerimaan.totalPenerimaan) * 100).toFixed(1) + '%' : '0%';
      aoa.push([`  ${pptProposalData.penerimaan.lainnya.label}`, pptProposalData.penerimaan.lainnya.count, pptProposalData.penerimaan.lainnya.totalPagu, pct]);
    }

    aoa.push(['JUMLAH PENERIMAAN', '', pptProposalData.penerimaan.totalPenerimaan, '100%']);
    aoa.push([]);

    // PENGELUARAN
    aoa.push([pptProposalData.pengeluaran.title || 'PENGELUARAN', '', '', '']);
    pptProposalData.pengeluaran.items.forEach(it => {
      const pct = pptProposalData.pengeluaran.totalPengeluaran > 0 ? ((it.totalAnggaran / pptProposalData.pengeluaran.totalPengeluaran) * 100).toFixed(1) + '%' : '0%';
      aoa.push([`  ${it.label}`, it.count, it.totalAnggaran, pct]);
    });
    if (pptProposalData.pengeluaran.lainnya.totalAnggaran > 0) {
      const pct = pptProposalData.pengeluaran.totalPengeluaran > 0 ? ((pptProposalData.pengeluaran.lainnya.totalAnggaran / pptProposalData.pengeluaran.totalPengeluaran) * 100).toFixed(1) + '%' : '0%';
      aoa.push([`  ${pptProposalData.pengeluaran.lainnya.label}`, pptProposalData.pengeluaran.lainnya.count, pptProposalData.pengeluaran.lainnya.totalAnggaran, pct]);
    }
    aoa.push(['JUMLAH PENGELUARAN', '', pptProposalData.pengeluaran.totalPengeluaran, '100%']);
    aoa.push([]);

    aoa.push([
      `SURPLUS / (DEFISIT) ANGGARAN: ${pptProposalData.surplusDefisit >= 0 ? 'SURPLUS' : 'DEFISIT'}`,
      '',
      pptProposalData.surplusDefisit,
      ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 50 },
      { wch: 16 },
      { wch: 28 },
      { wch: 16 }
    ];

    // Format number
    for (let r = 4; r < aoa.length; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: 2 });
      if (ws[cellRef] && typeof ws[cellRef].v === 'number') {
        ws[cellRef].z = '#,##0';
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format_PPT_Proposal_RKAT');
    XLSX.writeFile(wb, `Format_PPT_Proposal_RKAT_${tahunFilter}.xlsx`);
    toast.success('File Excel Format Slide PPT Proposal RKAT berhasil diexport!');
  };

  // Export Excel (Switchable based on active view)
  const handleExportExcel = () => {
    if (activeViewTab === 'rekap_unit') {
      return handleExportExcelUnitRekap();
    }
    if (modeLaporan === 'proposal rkat' && summaryStyle === 'ppt') {
      return handleExportExcelPptFormat();
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
          /* TAB VIEW 1: RINGKASAN FORMAT LAPORAN (PPT VS STANDAR)   */
          /* ======================================================== */
          <div className="space-y-6">
            
            {/* SWITCHER TAMPILAN KHUSUS PROPOSAL RKAT */}
            {modeLaporan === 'proposal rkat' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-blue-200 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-xs font-bold font-mono">
                    PROPOSAL RKAT
                  </Badge>
                  <span className="text-xs font-bold text-gray-800">
                    Pilihan Gaya Tampilan Proposal:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSummaryStyle('ppt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      summaryStyle === 'ppt'
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>🖥️</span>
                    <span>Format Slide / PPT RKAT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryStyle('standard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      summaryStyle === 'standard'
                        ? 'bg-white text-gray-900 shadow-xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>📊</span>
                    <span>Format Tabel Standar (Atas-Bawah)</span>
                  </button>
                </div>
              </div>
            )}

            {modeLaporan === 'proposal rkat' && summaryStyle === 'ppt' ? (
              /* ========================================================================= */
              /* TAMPILAN KHUSUS: FORMAT PRESENTASI SLIDE / PPT PROPOSAL RKAT (SESUAI GAMBAR) */
              /* ========================================================================= */
              <Card className="rounded-2xl border-slate-300 shadow-xs overflow-hidden">
                <CardHeader className="bg-slate-50 p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <span>🏛️</span>
                      <span>Format Usulan Proposal RKAT (Standar Slide Presentasi / PPT)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                      Struktur hierarkis Penerimaan Dana Masyarakat &amp; Pengeluaran Belanja Usulan RKAT Universitas
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-bold font-mono bg-white text-blue-700 border-blue-300">
                      TA {tahunFilter}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempTemplate(JSON.parse(JSON.stringify(pptTemplate)));
                        setIsTemplateModalOpen(true);
                      }}
                      className="h-8 rounded-xl border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Settings2 size={13} className="text-indigo-600" />
                      <span>Atur Susunan Slide</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportExcelPptFormat}
                      className="h-8 rounded-xl border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Download size={13} className="text-blue-600" />
                      <span>Export Format PPT</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 font-black uppercase text-[10px] tracking-wider">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-900 text-xs uppercase font-black min-w-[340px] pl-4">
                          Uraian / Format Proposal RKAT
                        </TableHead>
                        <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-32">
                          Jumlah Data
                        </TableHead>
                        <TableHead className="text-right text-slate-900 text-xs uppercase font-black min-w-[190px] pr-4">
                          Pagu Usulan (Rp)
                        </TableHead>
                        <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-28">
                          % Proporsi
                        </TableHead>
                        <TableHead className="text-center text-slate-900 text-xs uppercase font-black w-20">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* 1. SECTION PENERIMAAN */}
                      {/* Header Utama: Judul Penerimaan */}
                      <TableRow className="bg-slate-100/90 font-black border-b border-slate-200">
                        <TableCell colSpan={5} className="py-2.5 px-4 text-xs font-black text-slate-950 uppercase tracking-wide">
                          {pptProposalData.penerimaan.title}
                        </TableCell>
                      </TableRow>

                      {/* Kelompok-Kelompok Penerimaan Dinamis */}
                      {pptProposalData.penerimaan.sections.map((sec) => (
                        <React.Fragment key={sec.id}>
                          {/* Sub-Header Kelompok */}
                          <TableRow className="bg-slate-50/80 font-bold border-b border-slate-100">
                            <TableCell className="py-2 pl-8 font-bold text-xs text-slate-900">
                              {sec.title}
                            </TableCell>
                            <TableCell className="py-2 text-center text-xs font-mono font-bold text-slate-700">
                              {sec.count.toLocaleString('id-ID')} Akun
                            </TableCell>
                            <TableCell className="py-2 text-right font-black font-mono text-xs text-slate-900 pr-4">
                              Rp {formatRp(sec.subtotal)}
                            </TableCell>
                            <TableCell className="py-2 text-center text-xs font-mono font-bold text-slate-600">
                              {pptProposalData.penerimaan.totalPenerimaan > 0 
                                ? ((sec.subtotal / pptProposalData.penerimaan.totalPenerimaan) * 100).toFixed(1) + '%' 
                                : '0%'}
                            </TableCell>
                            <TableCell className="py-2 text-center text-gray-300">-</TableCell>
                          </TableRow>

                          {/* Rincian Pos-Pos dalam Kelompok (Bisa di-Expand Langsung) */}
                          {sec.items.map((item, idx) => {
                            const itemKey = item.id || item.label || `sec_item_${idx}`;
                            const isExpanded = expandedPptPenerimaanSet.has(itemKey);
                            const pct = pptProposalData.penerimaan.totalPenerimaan > 0
                              ? ((item.totalPagu / pptProposalData.penerimaan.totalPenerimaan) * 100).toFixed(1)
                              : '0';
                            return (
                              <React.Fragment key={itemKey}>
                                <TableRow 
                                  onClick={() => togglePptPenerimaan(itemKey)}
                                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer select-none ${isExpanded ? 'bg-blue-50/50' : ''}`}
                                >
                                  <TableCell className="py-2 pl-14 text-xs font-medium text-slate-700 flex items-center gap-2">
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); togglePptPenerimaan(itemKey); }}
                                      className="w-4 h-4 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                                    >
                                      {isExpanded ? <Minus size={10} /> : <Plus size={10} />}
                                    </button>
                                    <span className="font-semibold text-slate-900">{item.label}</span>
                                  </TableCell>
                                  <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                    {item.count.toLocaleString('id-ID')} Akun
                                  </TableCell>
                                  <TableCell className="py-2 text-right font-mono font-bold text-xs text-slate-900 pr-4">
                                    Rp {formatRp(item.totalPagu)}
                                  </TableCell>
                                  <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                    {pct}%
                                  </TableCell>
                                  <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => togglePptPenerimaan(itemKey)}
                                      className={`h-7 px-2 rounded-lg border text-xs font-bold gap-1 transition-all shadow-2xs cursor-pointer ${
                                        isExpanded 
                                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                                          : 'border-slate-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
                                      }`}
                                      title={isExpanded ? `Tutup rincian ${item.label}` : `Buka rincian ${item.label}`}
                                    >
                                      {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                                      <span className="text-[10px] hidden sm:inline">{isExpanded ? 'Tutup' : 'Rincian'}</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>

                                {/* INLINE HIERARCHICAL TABLE COLLAPSE */}
                                {isExpanded && (
                                  <TableRow className="bg-slate-50/70 border-b border-slate-200 p-0">
                                    <TableCell colSpan={5} className="p-2 sm:p-4">
                                      <HierarchicalInlineTable
                                        rows={item.rows}
                                        type="penerimaan"
                                        formatRp={formatRp}
                                      />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      ))}

                      {/* Penerimaan Lainnya / Surplus TA Lalu jika ada */}
                      {pptProposalData.penerimaan.lainnya.totalPagu > 0 && (() => {
                        const isLainnyaOpen = expandedPptPenerimaanSet.has('p_lainnya');
                        return (
                          <React.Fragment>
                            <TableRow 
                              onClick={() => togglePptPenerimaan('p_lainnya')}
                              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer select-none ${isLainnyaOpen ? 'bg-blue-50/50' : ''}`}
                            >
                              <TableCell className="py-2 pl-8 text-xs font-bold text-slate-800 flex items-center gap-2">
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); togglePptPenerimaan('p_lainnya'); }}
                                  className="w-4 h-4 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                                >
                                  {isLainnyaOpen ? <Minus size={10} /> : <Plus size={10} />}
                                </button>
                                <span>{pptProposalData.penerimaan.lainnya.label}</span>
                              </TableCell>
                              <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                {pptProposalData.penerimaan.lainnya.count.toLocaleString('id-ID')} Akun
                              </TableCell>
                              <TableCell className="py-2 text-right font-mono font-bold text-xs text-slate-900 pr-4">
                                Rp {formatRp(pptProposalData.penerimaan.lainnya.totalPagu)}
                              </TableCell>
                              <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                {pptProposalData.penerimaan.totalPenerimaan > 0
                                  ? ((pptProposalData.penerimaan.lainnya.totalPagu / pptProposalData.penerimaan.totalPenerimaan) * 100).toFixed(1) + '%'
                                  : '0%'}
                              </TableCell>
                              <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePptPenerimaan('p_lainnya')}
                                  className={`h-7 px-2 rounded-lg border text-xs font-bold gap-1 transition-all shadow-2xs cursor-pointer ${
                                    isLainnyaOpen 
                                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
                                      : 'border-slate-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700'
                                  }`}
                                  title={isLainnyaOpen ? 'Tutup rincian' : 'Buka rincian'}
                                >
                                  {isLainnyaOpen ? <EyeOff size={13} /> : <Eye size={13} />}
                                  <span className="text-[10px] hidden sm:inline">{isLainnyaOpen ? 'Tutup' : 'Rincian'}</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                            {isLainnyaOpen && (
                              <TableRow className="bg-slate-50/70 border-b border-slate-200 p-0">
                                <TableCell colSpan={5} className="p-2 sm:p-4">
                                  <HierarchicalInlineTable
                                    rows={pptProposalData.penerimaan.lainnya.rows}
                                    type="penerimaan"
                                    formatRp={formatRp}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })()}

                      {/* BANNER BIRU JUMLAH PENERIMAAN (PERSIS SEPERTI GAMBAR) */}
                      <TableRow className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors border-y-2 border-blue-700">
                        <TableCell className="py-3 px-4 text-xs font-black uppercase tracking-wider text-white">
                          JUMLAH PENERIMAAN
                        </TableCell>
                        <TableCell className="py-3 text-center text-xs font-mono font-bold text-blue-100">
                          {grandTotalPenerimaan.totalItems.toLocaleString('id-ID')} Akun
                        </TableCell>
                        <TableCell className="py-3 text-right font-black font-mono text-sm text-white pr-4">
                          Rp {formatRp(pptProposalData.penerimaan.totalPenerimaan)}
                        </TableCell>
                        <TableCell className="py-3 text-center text-xs font-mono font-bold text-blue-100">
                          100%
                        </TableCell>
                        <TableCell className="py-3 text-center text-blue-200">-</TableCell>
                      </TableRow>

                      {/* SPACER ROW KOSONG SESUAI GAMBAR */}
                      <TableRow className="bg-white hover:bg-white border-b border-slate-200">
                        <TableCell colSpan={5} className="py-2"></TableCell>
                      </TableRow>

                      {/* 2. SECTION PENGELUARAN */}
                      <TableRow className="bg-slate-100/90 font-black border-b border-slate-200">
                        <TableCell colSpan={5} className="py-2.5 px-4 text-xs font-black text-slate-950 uppercase tracking-wide">
                          {pptProposalData.pengeluaran.title}
                        </TableCell>
                      </TableRow>

                      {/* Baris Rincian Belanja Sesuai Konfigurasi Template (Bisa di-Expand Langsung) */}
                      {pptProposalData.pengeluaran.items.map((item, idx) => {
                        const itemKey = item.id || item.label || `b_item_${idx}`;
                        const isExpanded = expandedPptPengeluaranSet.has(itemKey);
                        const pct = pptProposalData.pengeluaran.totalPengeluaran > 0
                          ? ((item.totalAnggaran / pptProposalData.pengeluaran.totalPengeluaran) * 100).toFixed(1)
                          : '0';
                        return (
                          <React.Fragment key={itemKey}>
                            <TableRow 
                              onClick={() => togglePptPengeluaran(itemKey)}
                              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer select-none ${isExpanded ? 'bg-indigo-50/50' : ''}`}
                            >
                              <TableCell className="py-2 pl-8 text-xs font-bold text-slate-800 flex items-center gap-2">
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); togglePptPengeluaran(itemKey); }}
                                  className="w-4 h-4 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                                >
                                  {isExpanded ? <Minus size={10} /> : <Plus size={10} />}
                                </button>
                                <span>{item.label}</span>
                              </TableCell>
                              <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                {item.count.toLocaleString('id-ID')} Baris
                              </TableCell>
                              <TableCell className="py-2 text-right font-mono font-black text-xs text-slate-950 pr-4">
                                Rp {formatRp(item.totalAnggaran)}
                              </TableCell>
                              <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                {pct}%
                              </TableCell>
                              <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePptPengeluaran(itemKey)}
                                  className={`h-7 px-2 text-xs font-bold rounded-lg border gap-1 transition-all shadow-2xs cursor-pointer ${
                                    isExpanded 
                                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                                      : 'border-slate-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700'
                                  }`}
                                  title={isExpanded ? `Tutup rincian ${item.label}` : `Buka rincian ${item.label}`}
                                >
                                  {isExpanded ? <EyeOff size={13} /> : <Eye size={13} />}
                                  <span className="text-[10px] hidden sm:inline">{isExpanded ? 'Tutup' : 'Rincian'}</span>
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* INLINE HIERARCHICAL TABLE COLLAPSE */}
                            {isExpanded && (
                              <TableRow className="bg-slate-50/70 border-b border-slate-200 p-0">
                                <TableCell colSpan={5} className="p-2 sm:p-4">
                                  <HierarchicalInlineTable
                                    rows={item.rows}
                                    type="belanja"
                                    formatRp={formatRp}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* Belanja Lainnya jika ada */}
                      {pptProposalData.pengeluaran.lainnya.totalAnggaran > 0 && (() => {
                        const isBLainnyaOpen = expandedPptPengeluaranSet.has('b_lainnya');
                        return (
                          <React.Fragment>
                            <TableRow 
                              onClick={() => togglePptPengeluaran('b_lainnya')}
                              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer select-none ${isBLainnyaOpen ? 'bg-indigo-50/50' : ''}`}
                            >
                              <TableCell className="py-2 pl-8 text-xs font-bold text-slate-800 flex items-center gap-2">
                                <button 
                                  type="button" 
                                  onClick={(e) => { e.stopPropagation(); togglePptPengeluaran('b_lainnya'); }}
                                  className="w-4 h-4 rounded flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                                >
                                  {isBLainnyaOpen ? <Minus size={10} /> : <Plus size={10} />}
                                </button>
                                <span>{pptProposalData.pengeluaran.lainnya.label}</span>
                              </TableCell>
                              <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                {pptProposalData.pengeluaran.lainnya.count.toLocaleString('id-ID')} Baris
                              </TableCell>
                              <TableCell className="py-2 text-right font-mono font-black text-xs text-slate-950 pr-4">
                                Rp {formatRp(pptProposalData.pengeluaran.lainnya.totalAnggaran)}
                              </TableCell>
                              <TableCell className="py-2 text-center text-xs font-mono text-slate-500">
                                {pptProposalData.pengeluaran.totalPengeluaran > 0 
                                  ? ((pptProposalData.pengeluaran.lainnya.totalAnggaran / pptProposalData.pengeluaran.totalPengeluaran) * 100).toFixed(1) + '%'
                                  : '0%'}
                              </TableCell>
                              <TableCell className="py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePptPengeluaran('b_lainnya')}
                                  className={`h-7 px-2 text-xs font-bold rounded-lg border gap-1 transition-all shadow-2xs cursor-pointer ${
                                    isBLainnyaOpen 
                                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                                      : 'border-slate-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700'
                                  }`}
                                  title={isBLainnyaOpen ? 'Tutup rincian' : 'Buka rincian'}
                                >
                                  {isBLainnyaOpen ? <EyeOff size={13} /> : <Eye size={13} />}
                                  <span className="text-[10px] hidden sm:inline">{isBLainnyaOpen ? 'Tutup' : 'Rincian'}</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                            {isBLainnyaOpen && (
                              <TableRow className="bg-slate-50/70 border-b border-slate-200 p-0">
                                <TableCell colSpan={5} className="p-2 sm:p-4">
                                  <HierarchicalInlineTable
                                    rows={pptProposalData.pengeluaran.lainnya.rows}
                                    type="belanja"
                                    formatRp={formatRp}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })()}

                      {/* BANNER BIRU JUMLAH PENGELUARAN (PERSIS SEPERTI GAMBAR) */}
                      <TableRow className="bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors border-y-2 border-blue-700">
                        <TableCell className="py-3 px-4 text-xs font-black uppercase tracking-wider text-white">
                          JUMLAH PENGELUARAN
                        </TableCell>
                        <TableCell className="py-3 text-center text-xs font-mono font-bold text-blue-100">
                          {grandTotal.totalItems.toLocaleString('id-ID')} Baris
                        </TableCell>
                        <TableCell className="py-3 text-right font-black font-mono text-sm text-white pr-4">
                          Rp {formatRp(pptProposalData.pengeluaran.totalPengeluaran)}
                        </TableCell>
                        <TableCell className="py-3 text-center text-xs font-mono font-bold text-blue-100">
                          100%
                        </TableCell>
                        <TableCell className="py-3 text-center text-blue-200">-</TableCell>
                      </TableRow>

                      {/* SURPLUS / (DEFISIT) ANGGARAN (BARIS POSISI KEUANGAN AKHIR) */}
                      <TableRow className={`${
                        pptProposalData.surplusDefisit >= 0 
                          ? 'bg-emerald-700 hover:bg-emerald-800' 
                          : 'bg-rose-700 hover:bg-rose-800'
                      } text-white transition-colors border-t-2 border-white`}>
                        <TableCell className="py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white">
                          POSISI SURPLUS / (DEFISIT) ANGGARAN
                        </TableCell>
                        <TableCell className="py-3.5 text-center text-xs font-mono font-bold text-white/90">
                          {pptProposalData.surplusDefisit >= 0 ? 'SURPLUS' : 'DEFISIT'}
                        </TableCell>
                        <TableCell className="py-3.5 text-right font-black font-mono text-sm text-white pr-4">
                          {pptProposalData.surplusDefisit < 0 && '- '}Rp {formatRp(Math.abs(pptProposalData.surplusDefisit))}
                        </TableCell>
                        <TableCell className="py-3.5 text-center text-xs font-mono font-bold text-white/90">
                          {pptProposalData.penerimaan.totalPenerimaan > 0 
                            ? ((pptProposalData.surplusDefisit / pptProposalData.penerimaan.totalPenerimaan) * 100).toFixed(1) + '%' 
                            : '0%'}
                        </TableCell>
                        <TableCell className="py-3.5 text-center text-white/70">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              /* ========================================================================= */
              /* TAMPILAN STANDAR ATAS-BAWAH (UNTUK FORMAT LAPORAN STANDAR / LAINNYA)     */
              /* ========================================================================= */
              <>
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
                            const isGroupOpen = expandedStdPenerimaanSet.has(group.label);
                            const proporsiPct = grandTotalPenerimaan.totalPagu > 0 
                              ? ((group.totalPagu / grandTotalPenerimaan.totalPagu) * 100).toFixed(1)
                              : '0';

                            return (
                              <React.Fragment key={group.label || gIdx}>
                                <TableRow 
                                  onClick={() => toggleStdPenerimaan(group.label)}
                                  className={`border-b border-gray-100 hover:bg-emerald-50/40 transition-colors cursor-pointer select-none ${isGroupOpen ? 'bg-emerald-50/50' : ''}`}
                                >
                                  <TableCell className="text-center font-mono font-bold text-gray-400 text-xs">
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); toggleStdPenerimaan(group.label); }}
                                      className="w-5 h-5 rounded flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold mx-auto shadow-2xs cursor-pointer"
                                    >
                                      {isGroupOpen ? <Minus size={10} /> : <Plus size={10} />}
                                    </button>
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
                                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleStdPenerimaan(group.label)}
                                      className={`h-8 px-2.5 rounded-xl border text-xs font-bold gap-1 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto ${
                                        isGroupOpen
                                          ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                                          : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-600 text-emerald-700 hover:text-white'
                                      }`}
                                      title={isGroupOpen ? `Tutup rincian penerimaan ${group.label}` : `Buka rincian penerimaan ${group.label}`}
                                    >
                                      {isGroupOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                                      <span className="text-[10px] hidden sm:inline">{isGroupOpen ? 'Tutup' : 'Rincian'}</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>

                                {/* INLINE HIERARCHICAL TABLE COLLAPSE */}
                                {isGroupOpen && (
                                  <TableRow className="bg-emerald-50/20 border-b border-emerald-100 p-0">
                                    <TableCell colSpan={6} className="p-2 sm:p-4">
                                      <HierarchicalInlineTable
                                        rows={group.rows}
                                        type="penerimaan"
                                        formatRp={formatRp}
                                      />
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
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
                          const isGroupOpen = expandedStdBelanjaSet.has(group.label);
                          const proporsiPct = grandTotal.anggaran > 0 
                            ? ((group.totalAnggaran / grandTotal.anggaran) * 100).toFixed(1)
                            : '0';

                          return (
                            <React.Fragment key={group.label || gIdx}>
                              <TableRow 
                                onClick={() => toggleStdBelanja(group.label)}
                                className={`border-b border-gray-100 hover:bg-indigo-50/40 transition-colors cursor-pointer select-none ${isGroupOpen ? 'bg-indigo-50/50' : ''}`}
                              >
                                <TableCell className="text-center font-mono font-bold text-gray-400 text-xs">
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); toggleStdBelanja(group.label); }}
                                    className="w-5 h-5 rounded flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold mx-auto shadow-2xs cursor-pointer"
                                  >
                                    {isGroupOpen ? <Minus size={10} /> : <Plus size={10} />}
                                  </button>
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
                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleStdBelanja(group.label)}
                                    className={`h-8 px-2.5 rounded-xl border text-xs font-bold gap-1 transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto ${
                                      isGroupOpen
                                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                                        : 'border-indigo-200 bg-indigo-50/60 hover:bg-indigo-600 text-indigo-700 hover:text-white'
                                    }`}
                                    title={isGroupOpen ? `Tutup rincian belanja ${group.label}` : `Buka rincian belanja ${group.label}`}
                                  >
                                    {isGroupOpen ? <EyeOff size={14} /> : <Eye size={14} />}
                                    <span className="text-[10px] hidden sm:inline">{isGroupOpen ? 'Tutup' : 'Rincian'}</span>
                                  </Button>
                                </TableCell>
                              </TableRow>

                              {/* INLINE HIERARCHICAL TABLE COLLAPSE */}
                              {isGroupOpen && (
                                <TableRow className="bg-indigo-50/20 border-b border-indigo-100 p-0">
                                  <TableCell colSpan={6} className="p-2 sm:p-4">
                                    <HierarchicalInlineTable
                                      rows={group.rows}
                                      type="belanja"
                                      formatRp={formatRp}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
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
              </>
            )}

          </div>
        ) : activeViewTab === 'rekap_unit' ? (
          /* ======================================================== */
          /* TAB VIEW 2: TABEL REKAPITULASI UNIT KERJA (FORMAT FAKULTAS) */
          /* ======================================================== */
          <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/60 p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  <span>
                    {rekapFormat === 'upu'
                      ? 'Rekapitulasi Usulan RKAT per Unit Kerja (Format UPU)'
                      : rekapFormat === 'pusdi'
                      ? 'Rekapitulasi Usulan RKAT per Unit Kerja (Format PUSDI)'
                      : 'Rekapitulasi Usulan RKAT per Unit Kerja (Format Fakultas)'}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 font-medium mt-0.5">
                  {rekapFormat === 'upu'
                    ? '10 Kolom Standar UPU: 0. Unit Kerja, 1. Subsidi, 2. Penerimaan, 3. Luncuran, 4. Jml Sumber Pembiayaan (1+2+3), 5. Pengeluaran Operasional, 6. Investasi (Belanja Modal), 7. Total Pengeluaran (5+6), 8. Surplus/Defisit Operasional (1+2-5), 9. Surplus/Defisit Anggaran'
                    : rekapFormat === 'pusdi'
                    ? '9 Kolom Standar PUSDI: 0. Unit Kerja, 1. Penerimaan, 2. Luncuran, 3. Jml Sumber Pembiayaan (1+2), 4. Pengeluaran Operasional, 5. Investasi (Belanja Modal), 6. Total Pengeluaran (4+5), 7. Surplus/Defisit Operasional (1-4), 8. Surplus/Defisit Anggaran (3-6)'
                    : '11 Kolom Standar Fakultas: 0. Unit Kerja, 1. Pen. Pendidikan, 2. Pen. Non Pendidikan, 3. Jml Penerimaan (1+2), 4. Luncuran, 5. Jml Pembiayaan (3+4), 6. Pengeluaran Ops, 7. Investasi (Modal), 8. Total Pengeluaran, 9. Surplus/Defisit Ops, 10. Surplus/Defisit Anggaran'}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Format Toggle Pill: Fakultas (11 Kolom) vs PUSDI (9 Kolom) vs UPU (10 Kolom) */}
                <div className="flex items-center gap-1 bg-indigo-50/80 p-1 rounded-xl border border-indigo-200/80 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRekapFormat('fakultas')}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      rekapFormat === 'fakultas'
                        ? 'bg-white text-indigo-700 shadow-2xs font-black'
                        : 'text-indigo-900/70 hover:text-indigo-950'
                    }`}
                  >
                    <span>🏛️</span>
                    <span>Format Fakultas (11 Kolom)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRekapFormat('pusdi');
                      if (rekapGroupFilter !== 'Pusat Studi') {
                        setRekapGroupFilter('Pusat Studi');
                      }
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      rekapFormat === 'pusdi'
                        ? 'bg-white text-indigo-700 shadow-2xs font-black'
                        : 'text-indigo-900/70 hover:text-indigo-950'
                    }`}
                  >
                    <span>🔬</span>
                    <span>Format PUSDI (9 Kolom)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRekapFormat('upu');
                      if (rekapGroupFilter !== 'Unit Penunjang Universitas - UPU') {
                        setRekapGroupFilter('Unit Penunjang Universitas - UPU');
                      }
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      rekapFormat === 'upu'
                        ? 'bg-white text-indigo-700 shadow-2xs font-black'
                        : 'text-indigo-900/70 hover:text-indigo-950'
                    }`}
                  >
                    <span>🏢</span>
                    <span>Format UPU (10 Kolom)</span>
                  </button>
                </div>

                {/* Filter Group Organisasi */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRekapGroupFilter('ALL')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      rekapGroupFilter === 'ALL'
                        ? 'bg-white text-indigo-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Group
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRekapGroupFilter('Fakultas');
                      setRekapFormat('fakultas');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      rekapGroupFilter.toLowerCase() === 'fakultas'
                        ? 'bg-white text-indigo-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    <span>🏛️</span>
                    <span>Khusus Fakultas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRekapGroupFilter('Pusat Studi');
                      setRekapFormat('pusdi');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      rekapGroupFilter.toLowerCase() === 'pusat studi'
                        ? 'bg-white text-indigo-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    <span>🔬</span>
                    <span>Khusus PUSDI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRekapGroupFilter('Unit Penunjang Universitas - UPU');
                      setRekapFormat('upu');
                    }}
                    className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      rekapGroupFilter.toLowerCase().includes('penunjang') || rekapGroupFilter.toLowerCase().includes('upu')
                        ? 'bg-white text-indigo-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    <span>🏢</span>
                    <span>Khusus UPU</span>
                  </button>
                  {groupedByOrg.filter(g => 
                    g.groupOrg.toLowerCase() !== 'fakultas' && 
                    g.groupOrg.toLowerCase() !== 'pusat studi' &&
                    !g.groupOrg.toLowerCase().includes('penunjang') &&
                    !g.groupOrg.toLowerCase().includes('upu')
                  ).map((g) => (
                    <button
                      key={g.groupOrg}
                      type="button"
                      onClick={() => setRekapGroupFilter(g.groupOrg)}
                      className={`px-2.5 py-1 rounded-lg transition-all hidden md:inline-block cursor-pointer ${
                        rekapGroupFilter.toLowerCase() === g.groupOrg.toLowerCase()
                          ? 'bg-white text-indigo-700 shadow-2xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {g.groupOrg}
                    </button>
                  ))}
                </div>

                {/* Export Buttons: Excel & Word Landscape */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcelUnitRekap}
                  className="h-8 rounded-xl border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Download size={13} className="text-emerald-600" />
                  <span>Export Excel ({rekapFormat === 'upu' ? '10 Kolom UPU' : rekapFormat === 'pusdi' ? '9 Kolom PUSDI' : '11 Kolom Fakultas'})</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportWordUnitRekap}
                  className="h-8 rounded-xl border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100 text-xs font-bold gap-1.5 shadow-2xs cursor-pointer"
                  title="Unduh format dokumen Word landscape rapi 1 halaman lebar"
                >
                  <FileText size={13} className="text-blue-600" />
                  <span>Export Word (Landscape)</span>
                </Button>

                <Badge variant="outline" className="text-xs font-bold font-mono bg-white">
                  {displayedRekapTotals.totalUnits} Unit
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className={rekapFormat === 'pusdi' ? 'min-w-[1350px]' : rekapFormat === 'upu' ? 'min-w-[1450px]' : 'min-w-[1550px]'}>
                <TableHeader className="bg-gray-100/90 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                  {rekapFormat === 'upu' ? (
                    /* Header Format UPU (10 Kolom Utama: 0 Unit Kerja, 1 Subsidi, 2 Penerimaan, 3 Luncuran, 4 Jml Sumber Pembiayaan, 5 Pengeluaran Ops, 6 Investasi Modal, 7 Total Pengeluaran, 8 Surplus/Defisit Ops, 9 Surplus/Defisit Anggaran) */
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-center text-gray-500 text-xs uppercase font-bold">#</TableHead>
                      <TableHead className="text-gray-700 text-xs uppercase font-bold min-w-[240px]">
                        0. Unit Kerja
                      </TableHead>
                      <TableHead className="text-right text-gray-500 text-xs uppercase font-bold min-w-[120px]">
                        1. Subsidi
                      </TableHead>
                      <TableHead className="text-right text-emerald-950 text-xs uppercase font-black min-w-[150px] bg-emerald-50/60">
                        2. Penerimaan
                      </TableHead>
                      <TableHead className="text-right text-teal-800 text-xs uppercase font-bold min-w-[140px]">
                        3. Luncuran
                      </TableHead>
                      <TableHead className="text-right text-teal-950 text-xs uppercase font-black min-w-[160px] bg-teal-50/60">
                        4. Jml Pembiayaan (1+2+3)
                      </TableHead>
                      <TableHead className="text-right text-slate-800 text-xs uppercase font-bold min-w-[150px]">
                        5. Pengeluaran Ops
                      </TableHead>
                      <TableHead className="text-right text-amber-800 text-xs uppercase font-bold min-w-[140px]">
                        6. Investasi (Modal)
                      </TableHead>
                      <TableHead className="text-right text-indigo-950 text-xs uppercase font-black min-w-[150px] bg-indigo-50/60">
                        7. Total Pengeluaran (5+6)
                      </TableHead>
                      <TableHead className="text-right text-slate-900 text-xs uppercase font-bold min-w-[160px]">
                        8. Surplus/(Defisit) Ops (1+2-5)
                      </TableHead>
                      <TableHead className="text-right text-indigo-950 text-xs uppercase font-black min-w-[170px] bg-slate-50">
                        9. Surplus/(Defisit) Anggaran
                      </TableHead>
                      <TableHead className="text-center text-gray-500 text-xs uppercase font-bold w-14">Aksi</TableHead>
                    </TableRow>
                  ) : rekapFormat === 'pusdi' ? (
                    /* Header Format PUSDI (9 Kolom Utama: 0 Unit Kerja, 1 Penerimaan, 2 Luncuran, 3 Jml Sumber Pembiayaan, 4 Pengeluaran Ops, 5 Investasi Modal, 6 Total Pengeluaran, 7 Surplus/Defisit Ops, 8 Surplus/Defisit Anggaran) */
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-center text-gray-500 text-xs uppercase font-bold">#</TableHead>
                      <TableHead className="text-gray-700 text-xs uppercase font-bold min-w-[240px]">
                        0. Unit Kerja
                      </TableHead>
                      <TableHead className="text-right text-emerald-950 text-xs uppercase font-black min-w-[150px] bg-emerald-50/60">
                        1. Penerimaan
                      </TableHead>
                      <TableHead className="text-right text-teal-800 text-xs uppercase font-bold min-w-[140px]">
                        2. Luncuran
                      </TableHead>
                      <TableHead className="text-right text-teal-950 text-xs uppercase font-black min-w-[160px] bg-teal-50/60">
                        3. Jml Sumber Pembiayaan (1+2)
                      </TableHead>
                      <TableHead className="text-right text-slate-800 text-xs uppercase font-bold min-w-[150px]">
                        4. Pengeluaran Operasional
                      </TableHead>
                      <TableHead className="text-right text-amber-800 text-xs uppercase font-bold min-w-[140px]">
                        5. Investasi (Belanja Modal)
                      </TableHead>
                      <TableHead className="text-right text-indigo-950 text-xs uppercase font-black min-w-[150px] bg-indigo-50/60">
                        6. Total Pengeluaran (4+5)
                      </TableHead>
                      <TableHead className="text-right text-slate-900 text-xs uppercase font-bold min-w-[160px]">
                        7. Surplus/(Defisit) Ops (1-4)
                      </TableHead>
                      <TableHead className="text-right text-indigo-950 text-xs uppercase font-black min-w-[170px] bg-slate-50">
                        8. Surplus/(Defisit) Anggaran (3-6)
                      </TableHead>
                      <TableHead className="text-center text-gray-500 text-xs uppercase font-bold w-14">Aksi</TableHead>
                    </TableRow>
                  ) : (
                    /* Header Format Fakultas (11 Kolom Standar: 0 Unit, 1 Pendidikan, 2 Non Pendidikan, 3 Jml Penerimaan, 4 Luncuran, 5 Jml Pembiayaan, 6 Ops, 7 Modal, 8 Total Pengeluaran, 9 S/D Ops, 10 S/D Anggaran) */
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-center text-gray-500 text-xs uppercase font-bold">#</TableHead>
                      <TableHead className="text-gray-700 text-xs uppercase font-bold min-w-[230px]">
                        0. Unit Kerja
                      </TableHead>
                      <TableHead className="text-right text-emerald-800 text-xs uppercase font-bold min-w-[140px]">
                        1. Pen. Pendidikan
                      </TableHead>
                      <TableHead className="text-right text-emerald-700 text-xs uppercase font-bold min-w-[140px]">
                        2. Pen. Non Pendidikan
                      </TableHead>
                      <TableHead className="text-right text-emerald-950 text-xs uppercase font-black min-w-[150px] bg-emerald-50/60">
                        3. Jml Penerimaan (1+2)
                      </TableHead>
                      <TableHead className="text-right text-teal-800 text-xs uppercase font-bold min-w-[140px]">
                        4. Luncuran
                      </TableHead>
                      <TableHead className="text-right text-teal-950 text-xs uppercase font-black min-w-[160px] bg-teal-50/60">
                        5. Jml Pembiayaan (3+4)
                      </TableHead>
                      <TableHead className="text-right text-slate-800 text-xs uppercase font-bold min-w-[150px]">
                        6. Pengeluaran Ops
                      </TableHead>
                      <TableHead className="text-right text-amber-800 text-xs uppercase font-bold min-w-[140px]">
                        7. Investasi (Modal)
                      </TableHead>
                      <TableHead className="text-right text-indigo-950 text-xs uppercase font-black min-w-[150px] bg-indigo-50/60">
                        8. Total Pengeluaran (6+7)
                      </TableHead>
                      <TableHead className="text-right text-slate-900 text-xs uppercase font-bold min-w-[160px]">
                        9. Surplus/(Defisit) Ops (3-6)
                      </TableHead>
                      <TableHead className="text-right text-indigo-950 text-xs uppercase font-black min-w-[170px] bg-slate-50">
                        10. Surplus/(Defisit) Anggaran (5-8)
                      </TableHead>
                      <TableHead className="text-center text-gray-500 text-xs uppercase font-bold w-14">Aksi</TableHead>
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {displayedRekapGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={rekapFormat === 'upu' ? 12 : rekapFormat === 'pusdi' ? 11 : 13} className="text-center py-12 text-gray-400 font-medium">
                        Tidak ada data unit kerja yang sesuai kriteria filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedRekapGroups.map((group) => {
                      return (
                        <React.Fragment key={group.groupOrg}>
                          {/* Header Group Organisasi dari Master gov_units */}
                          <TableRow className="bg-indigo-50/80 border-t-2 border-b border-indigo-200 hover:bg-indigo-50/90">
                            <TableCell colSpan={rekapFormat === 'upu' ? 12 : rekapFormat === 'pusdi' ? 11 : 13} className="px-4 py-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-black text-xs text-indigo-950 uppercase tracking-wide">
                                  <Building2 size={15} className="text-indigo-600" />
                                  <span>GROUP: {group.groupOrg}</span>
                                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                    {group.units.length} Unit Kerja
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold font-mono text-indigo-900 flex flex-wrap items-center gap-3">
                                  <span className="text-teal-800 font-black">Pembiayaan: Rp {formatRp(group.totalSumberPembiayaan)}</span>
                                  <span>•</span>
                                  <span className="text-indigo-950 font-black">Pengeluaran: Rp {formatRp(group.totalPengeluaran)}</span>
                                  <span>•</span>
                                  <span className={group.totalSurplusDefisitAnggaran >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                                    S/D Anggaran: {group.totalSurplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisitAnggaran))}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Baris per Unit Kerja dalam Group */}
                          {group.units.map((item, uIdx) => {
                            if (rekapFormat === 'upu') {
                              return (
                                <TableRow 
                                  key={item.unit || uIdx}
                                  className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors text-xs"
                                >
                                  <TableCell className="text-center font-mono font-bold text-gray-400 align-middle">
                                    {uIdx + 1}
                                  </TableCell>

                                  {/* 0. Unit Kerja */}
                                  <TableCell className="align-middle py-2.5">
                                    <div className="font-bold text-gray-900 text-xs flex items-start gap-1.5">
                                      <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                                      <div>
                                        <span>{item.unit}</span>
                                        <div className="text-[10px] text-gray-400 font-mono font-medium flex items-center gap-1.5">
                                          <span>{item.count.toLocaleString('id-ID')} usulan</span>
                                          <span>•</span>
                                          <span className="text-emerald-700 font-semibold">{item.penerimaanCount.toLocaleString('id-ID')} penerimaan</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>

                                  {/* 1. Subsidi (Dikosongi dahulu: Rp 0) */}
                                  <TableCell className="text-right align-middle font-mono text-gray-400 py-2.5">
                                    Rp 0
                                  </TableCell>

                                  {/* 2. Penerimaan */}
                                  <TableCell className="text-right align-middle font-mono font-bold text-emerald-900 bg-emerald-50/30 py-2.5">
                                    Rp {formatRp(item.jumlahPenerimaan)}
                                  </TableCell>

                                  {/* 3. Luncuran */}
                                  <TableCell className="text-right align-middle font-mono text-teal-800 py-2.5">
                                    Rp {formatRp(item.luncuran)}
                                  </TableCell>

                                  {/* 4. Jml Sumber Pembiayaan (1+2+3) */}
                                  <TableCell className="text-right align-middle font-mono font-black text-teal-950 bg-teal-50/40 py-2.5">
                                    Rp {formatRp(item.sumberPembiayaan)}
                                  </TableCell>

                                  {/* 5. Pengeluaran Operasional */}
                                  <TableCell className="text-right align-middle font-mono text-slate-800 py-2.5">
                                    Rp {formatRp(item.operasional)}
                                  </TableCell>

                                  {/* 6. Investasi (Belanja Modal) */}
                                  <TableCell className="text-right align-middle font-mono text-amber-900 py-2.5">
                                    Rp {formatRp(item.modal)}
                                  </TableCell>

                                  {/* 7. Total Pengeluaran (5+6) */}
                                  <TableCell className="text-right align-middle font-mono font-black text-indigo-950 bg-indigo-50/30 py-2.5">
                                    Rp {formatRp(item.totalPengeluaran)}
                                  </TableCell>

                                  {/* 8. Surplus / (Defisit) Operasional (1+2-5) */}
                                  <TableCell className="text-right align-middle font-mono font-bold py-2.5">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                                      item.surplusDefisitOperasional >= 0 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {item.surplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(item.surplusDefisitOperasional))}
                                    </span>
                                  </TableCell>

                                  {/* 9. Surplus / (Defisit) Anggaran (3-6) */}
                                  <TableCell className="text-right align-middle font-mono font-black bg-slate-50/80 py-2.5">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                                      item.surplusDefisitAnggaran >= 0 
                                        ? 'bg-emerald-100/80 text-emerald-800 font-black' 
                                        : 'bg-rose-100/80 text-rose-800 font-black'
                                    }`}>
                                      {item.surplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(item.surplusDefisitAnggaran))}
                                    </span>
                                  </TableCell>

                                  {/* Aksi */}
                                  <TableCell className="text-center align-middle py-2.5">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewUnitDetail(item.unit)}
                                      className="h-7 w-7 p-0 rounded-lg border-indigo-200 bg-indigo-50/60 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto"
                                      title={`Buka rincian belanja ${item.unit}`}
                                    >
                                      <Eye size={13} />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            if (rekapFormat === 'pusdi') {
                              return (
                                <TableRow 
                                  key={item.unit || uIdx}
                                  className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors text-xs"
                                >
                                  <TableCell className="text-center font-mono font-bold text-gray-400 align-middle">
                                    {uIdx + 1}
                                  </TableCell>

                                  {/* 0. Unit Kerja */}
                                  <TableCell className="align-middle py-2.5">
                                    <div className="font-bold text-gray-900 text-xs flex items-start gap-1.5">
                                      <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                                      <div>
                                        <span>{item.unit}</span>
                                        <div className="text-[10px] text-gray-400 font-mono font-medium flex items-center gap-1.5">
                                          <span>{item.count.toLocaleString('id-ID')} usulan</span>
                                          <span>•</span>
                                          <span className="text-emerald-700 font-semibold">{item.penerimaanCount.toLocaleString('id-ID')} penerimaan</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>

                                  {/* 1. Penerimaan */}
                                  <TableCell className="text-right align-middle font-mono font-bold text-emerald-900 bg-emerald-50/30 py-2.5">
                                    Rp {formatRp(item.jumlahPenerimaan)}
                                  </TableCell>

                                  {/* 2. Luncuran */}
                                  <TableCell className="text-right align-middle font-mono text-teal-800 py-2.5">
                                    Rp {formatRp(item.luncuran)}
                                  </TableCell>

                                  {/* 3. Jml Sumber Pembiayaan (1+2) */}
                                  <TableCell className="text-right align-middle font-mono font-black text-teal-950 bg-teal-50/40 py-2.5">
                                    Rp {formatRp(item.sumberPembiayaan)}
                                  </TableCell>

                                  {/* 4. Pengeluaran Operasional */}
                                  <TableCell className="text-right align-middle font-mono text-slate-800 py-2.5">
                                    Rp {formatRp(item.operasional)}
                                  </TableCell>

                                  {/* 5. Investasi (Belanja Modal) */}
                                  <TableCell className="text-right align-middle font-mono text-amber-900 py-2.5">
                                    Rp {formatRp(item.modal)}
                                  </TableCell>

                                  {/* 6. Total Pengeluaran (4+5) */}
                                  <TableCell className="text-right align-middle font-mono font-black text-indigo-950 bg-indigo-50/30 py-2.5">
                                    Rp {formatRp(item.totalPengeluaran)}
                                  </TableCell>

                                  {/* 7. Surplus / (Defisit) Operasional (1-4) */}
                                  <TableCell className="text-right align-middle font-mono font-bold py-2.5">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                                      item.surplusDefisitOperasional >= 0 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {item.surplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(item.surplusDefisitOperasional))}
                                    </span>
                                  </TableCell>

                                  {/* 8. Surplus / (Defisit) Anggaran (3-6) */}
                                  <TableCell className="text-right align-middle font-mono font-black bg-slate-50/80 py-2.5">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                                      item.surplusDefisitAnggaran >= 0 
                                        ? 'bg-emerald-100/80 text-emerald-800 font-black' 
                                        : 'bg-rose-100/80 text-rose-800 font-black'
                                    }`}>
                                      {item.surplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(item.surplusDefisitAnggaran))}
                                    </span>
                                  </TableCell>

                                  {/* Aksi */}
                                  <TableCell className="text-center align-middle py-2.5">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewUnitDetail(item.unit)}
                                      className="h-7 w-7 p-0 rounded-lg border-indigo-200 bg-indigo-50/60 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto"
                                      title={`Buka rincian belanja ${item.unit}`}
                                    >
                                      <Eye size={13} />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            // Format Fakultas (Original 11 Kolom)
                            return (
                              <TableRow 
                                key={item.unit || uIdx}
                                className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors text-xs"
                              >
                                <TableCell className="text-center font-mono font-bold text-gray-400 align-middle">
                                  {uIdx + 1}
                                </TableCell>

                                {/* 0. Unit Kerja */}
                                <TableCell className="align-middle py-2.5">
                                  <div className="font-bold text-gray-900 text-xs flex items-start gap-1.5">
                                    <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                                    <div>
                                      <span>{item.unit}</span>
                                      <div className="text-[10px] text-gray-400 font-mono font-medium flex items-center gap-1.5">
                                        <span>{item.count.toLocaleString('id-ID')} usulan</span>
                                        <span>•</span>
                                        <span className="text-emerald-700 font-semibold">{item.penerimaanCount.toLocaleString('id-ID')} penerimaan</span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* 1. Penerimaan Pendidikan */}
                                <TableCell className="text-right align-middle font-mono text-gray-800 py-2.5">
                                  Rp {formatRp(item.pendidikan)}
                                </TableCell>

                                {/* 2. Penerimaan Non Pendidikan */}
                                <TableCell className="text-right align-middle font-mono text-gray-800 py-2.5">
                                  Rp {formatRp(item.nonPendidikan)}
                                </TableCell>

                                {/* 3. Jumlah Penerimaan (1+2) */}
                                <TableCell className="text-right align-middle font-mono font-bold text-emerald-900 bg-emerald-50/30 py-2.5">
                                  Rp {formatRp(item.jumlahPenerimaan)}
                                </TableCell>

                                {/* 4. Luncuran */}
                                <TableCell className="text-right align-middle font-mono text-teal-800 py-2.5">
                                  Rp {formatRp(item.luncuran)}
                                </TableCell>

                                {/* 5. Jml Sumber Pembiayaan (3+4) */}
                                <TableCell className="text-right align-middle font-mono font-black text-teal-950 bg-teal-50/40 py-2.5">
                                  Rp {formatRp(item.sumberPembiayaan)}
                                </TableCell>

                                {/* 6. Pengeluaran Operasional */}
                                <TableCell className="text-right align-middle font-mono text-slate-800 py-2.5">
                                  Rp {formatRp(item.operasional)}
                                </TableCell>

                                {/* 7. Investasi (Belanja Modal) */}
                                <TableCell className="text-right align-middle font-mono text-amber-900 py-2.5">
                                  Rp {formatRp(item.modal)}
                                </TableCell>

                                {/* 8. Total Pengeluaran (6+7) */}
                                <TableCell className="text-right align-middle font-mono font-black text-indigo-950 bg-indigo-50/30 py-2.5">
                                  Rp {formatRp(item.totalPengeluaran)}
                                </TableCell>

                                {/* 9. Surplus / (Defisit) Operasional (3-6) */}
                                <TableCell className="text-right align-middle font-mono font-bold py-2.5">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                                    item.surplusDefisitOperasional >= 0 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {item.surplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(item.surplusDefisitOperasional))}
                                  </span>
                                </TableCell>

                                {/* 10. Surplus / (Defisit) Anggaran (5-8) */}
                                <TableCell className="text-right align-middle font-mono font-black bg-slate-50/80 py-2.5">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                                    item.surplusDefisitAnggaran >= 0 
                                      ? 'bg-emerald-100/80 text-emerald-800 font-black' 
                                      : 'bg-rose-100/80 text-rose-800 font-black'
                                  }`}>
                                    {item.surplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(item.surplusDefisitAnggaran))}
                                  </span>
                                </TableCell>

                                {/* Aksi */}
                                <TableCell className="text-center align-middle py-2.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewUnitDetail(item.unit)}
                                    className="h-7 w-7 p-0 rounded-lg border-indigo-200 bg-indigo-50/60 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-all shadow-2xs cursor-pointer inline-flex items-center justify-center mx-auto"
                                    title={`Buka rincian belanja ${item.unit}`}
                                  >
                                    <Eye size={13} />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Subtotal Baris per Group Org */}
                          {rekapFormat === 'upu' ? (
                            <TableRow className="bg-slate-100/90 font-bold border-b-2 border-slate-300 text-slate-900 text-xs">
                              <TableCell colSpan={2} className="px-3 py-2 text-[11px] font-black uppercase text-right tracking-wider">
                                SUBTOTAL {group.groupOrg.toUpperCase()} ({group.units.length} UNIT)
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-mono text-gray-400">
                                Rp 0
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-emerald-950 bg-emerald-100/50">
                                Rp {formatRp(group.totalJumlahPenerimaan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-teal-800">
                                Rp {formatRp(group.totalLuncuran)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-teal-950 bg-teal-100/50">
                                Rp {formatRp(group.totalSumberPembiayaan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-slate-900">
                                Rp {formatRp(group.totalOperasional)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-amber-900">
                                Rp {formatRp(group.totalModal)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-indigo-950 bg-indigo-100/50">
                                Rp {formatRp(group.totalPengeluaran)}
                              </TableCell>
                              <TableCell className={`px-3 py-2 text-right font-bold font-mono ${
                                group.totalSurplusDefisitOperasional >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {group.totalSurplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisitOperasional))}
                              </TableCell>
                              <TableCell className={`px-3 py-2 text-right font-black font-mono bg-slate-200/60 ${
                                group.totalSurplusDefisitAnggaran >= 0 ? 'text-emerald-800' : 'text-rose-800'
                              }`}>
                                {group.totalSurplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisitAnggaran))}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-center text-gray-300">-</TableCell>
                            </TableRow>
                          ) : rekapFormat === 'pusdi' ? (
                            <TableRow className="bg-slate-100/90 font-bold border-b-2 border-slate-300 text-slate-900 text-xs">
                              <TableCell colSpan={2} className="px-3 py-2 text-[11px] font-black uppercase text-right tracking-wider">
                                SUBTOTAL {group.groupOrg.toUpperCase()} ({group.units.length} UNIT)
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-emerald-950 bg-emerald-100/50">
                                Rp {formatRp(group.totalJumlahPenerimaan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-teal-800">
                                Rp {formatRp(group.totalLuncuran)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-teal-950 bg-teal-100/50">
                                Rp {formatRp(group.totalSumberPembiayaan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-slate-900">
                                Rp {formatRp(group.totalOperasional)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-amber-900">
                                Rp {formatRp(group.totalModal)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-indigo-950 bg-indigo-100/50">
                                Rp {formatRp(group.totalPengeluaran)}
                              </TableCell>
                              <TableCell className={`px-3 py-2 text-right font-bold font-mono ${
                                group.totalSurplusDefisitOperasional >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {group.totalSurplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisitOperasional))}
                              </TableCell>
                              <TableCell className={`px-3 py-2 text-right font-black font-mono bg-slate-200/60 ${
                                group.totalSurplusDefisitAnggaran >= 0 ? 'text-emerald-800' : 'text-rose-800'
                              }`}>
                                {group.totalSurplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisitAnggaran))}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-center text-gray-300">-</TableCell>
                            </TableRow>
                          ) : (
                            <TableRow className="bg-slate-100/90 font-bold border-b-2 border-slate-300 text-slate-900 text-xs">
                              <TableCell colSpan={2} className="px-3 py-2 text-[11px] font-black uppercase text-right tracking-wider">
                                SUBTOTAL {group.groupOrg.toUpperCase()} ({group.units.length} UNIT)
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-emerald-900">
                                Rp {formatRp(group.totalPendidikan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-emerald-800">
                                Rp {formatRp(group.totalNonPendidikan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-emerald-950 bg-emerald-100/50">
                                Rp {formatRp(group.totalJumlahPenerimaan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-teal-800">
                                Rp {formatRp(group.totalLuncuran)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-teal-950 bg-teal-100/50">
                                Rp {formatRp(group.totalSumberPembiayaan)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-slate-900">
                                Rp {formatRp(group.totalOperasional)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-bold font-mono text-amber-900">
                                Rp {formatRp(group.totalModal)}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-right font-black font-mono text-indigo-950 bg-indigo-100/50">
                                Rp {formatRp(group.totalPengeluaran)}
                              </TableCell>
                              <TableCell className={`px-3 py-2 text-right font-bold font-mono ${
                                group.totalSurplusDefisitOperasional >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {group.totalSurplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisitOperasional))}
                              </TableCell>
                              <TableCell className={`px-3 py-2 text-right font-black font-mono bg-slate-200/60 ${
                                group.totalSurplusDefisitAnggaran >= 0 ? 'text-emerald-800' : 'text-rose-800'
                              }`}>
                                {group.totalSurplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(group.totalSurplusDefisitAnggaran))}
                              </TableCell>
                              <TableCell className="px-3 py-2 text-center text-gray-300">-</TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>

                {/* Footer Total Keseluruhan */}
                {rekapFormat === 'upu' ? (
                  <tfoot className="bg-slate-200/90 font-bold border-t-2 border-slate-400 text-slate-900 text-xs">
                    <tr>
                      <td colSpan={2} className="p-3 text-xs font-black uppercase tracking-wider text-slate-900">
                        TOTAL {rekapGroupFilter === 'ALL' ? 'KESELURUHAN' : rekapGroupFilter.toUpperCase()} ({displayedRekapTotals.totalUnits} UNIT KERJA)
                      </td>
                      <td className="p-3 text-right font-mono text-gray-400">
                        Rp 0
                      </td>
                      <td className="p-3 text-right font-black font-mono text-emerald-950 bg-emerald-100/70">
                        Rp {formatRp(displayedRekapTotals.jumlahPenerimaan)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-teal-800">
                        Rp {formatRp(displayedRekapTotals.luncuran)}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-teal-950 bg-teal-100/70">
                        Rp {formatRp(displayedRekapTotals.sumberPembiayaan)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">
                        Rp {formatRp(displayedRekapTotals.operasional)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-amber-900">
                        Rp {formatRp(displayedRekapTotals.modal)}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-indigo-950 bg-indigo-100/70">
                        Rp {formatRp(displayedRekapTotals.totalPengeluaran)}
                      </td>
                      <td className={`p-3 text-right font-bold font-mono ${
                        displayedRekapTotals.surplusDefisitOperasional >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {displayedRekapTotals.surplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(displayedRekapTotals.surplusDefisitOperasional))}
                      </td>
                      <td className={`p-3 text-right font-black font-mono bg-slate-300/80 ${
                        displayedRekapTotals.surplusDefisitAnggaran >= 0 ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        {displayedRekapTotals.surplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(displayedRekapTotals.surplusDefisitAnggaran))}
                      </td>
                      <td className="p-3 text-center text-gray-400 font-bold">
                        -
                      </td>
                    </tr>
                  </tfoot>
                ) : rekapFormat === 'pusdi' ? (
                  <tfoot className="bg-slate-200/90 font-bold border-t-2 border-slate-400 text-slate-900 text-xs">
                    <tr>
                      <td colSpan={2} className="p-3 text-xs font-black uppercase tracking-wider text-slate-900">
                        TOTAL {rekapGroupFilter === 'ALL' ? 'KESELURUHAN' : rekapGroupFilter.toUpperCase()} ({displayedRekapTotals.totalUnits} UNIT KERJA)
                      </td>
                      <td className="p-3 text-right font-black font-mono text-emerald-950 bg-emerald-100/70">
                        Rp {formatRp(displayedRekapTotals.jumlahPenerimaan)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-teal-800">
                        Rp {formatRp(displayedRekapTotals.luncuran)}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-teal-950 bg-teal-100/70">
                        Rp {formatRp(displayedRekapTotals.sumberPembiayaan)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">
                        Rp {formatRp(displayedRekapTotals.operasional)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-amber-900">
                        Rp {formatRp(displayedRekapTotals.modal)}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-indigo-950 bg-indigo-100/70">
                        Rp {formatRp(displayedRekapTotals.totalPengeluaran)}
                      </td>
                      <td className={`p-3 text-right font-bold font-mono ${
                        displayedRekapTotals.surplusDefisitOperasional >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {displayedRekapTotals.surplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(displayedRekapTotals.surplusDefisitOperasional))}
                      </td>
                      <td className={`p-3 text-right font-black font-mono bg-slate-300/80 ${
                        displayedRekapTotals.surplusDefisitAnggaran >= 0 ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        {displayedRekapTotals.surplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(displayedRekapTotals.surplusDefisitAnggaran))}
                      </td>
                      <td className="p-3 text-center text-gray-400 font-bold">
                        -
                      </td>
                    </tr>
                  </tfoot>
                ) : (
                  <tfoot className="bg-slate-200/90 font-bold border-t-2 border-slate-400 text-slate-900 text-xs">
                    <tr>
                      <td colSpan={2} className="p-3 text-xs font-black uppercase tracking-wider text-slate-900">
                        TOTAL {rekapGroupFilter === 'ALL' ? 'KESELURUHAN' : rekapGroupFilter.toUpperCase()} ({displayedRekapTotals.totalUnits} UNIT KERJA)
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-emerald-900">
                        Rp {formatRp(displayedRekapTotals.pendidikan)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-emerald-800">
                        Rp {formatRp(displayedRekapTotals.nonPendidikan)}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-emerald-950 bg-emerald-100/70">
                        Rp {formatRp(displayedRekapTotals.jumlahPenerimaan)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-teal-800">
                        Rp {formatRp(displayedRekapTotals.luncuran)}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-teal-950 bg-teal-100/70">
                        Rp {formatRp(displayedRekapTotals.sumberPembiayaan)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">
                        Rp {formatRp(displayedRekapTotals.operasional)}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-amber-900">
                        Rp {formatRp(displayedRekapTotals.modal)}
                      </td>
                      <td className="p-3 text-right font-black font-mono text-indigo-950 bg-indigo-100/70">
                        Rp {formatRp(displayedRekapTotals.totalPengeluaran)}
                      </td>
                      <td className={`p-3 text-right font-bold font-mono ${
                        displayedRekapTotals.surplusDefisitOperasional >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {displayedRekapTotals.surplusDefisitOperasional < 0 && '- '}Rp {formatRp(Math.abs(displayedRekapTotals.surplusDefisitOperasional))}
                      </td>
                      <td className={`p-3 text-right font-black font-mono bg-slate-300/80 ${
                        displayedRekapTotals.surplusDefisitAnggaran >= 0 ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        {displayedRekapTotals.surplusDefisitAnggaran < 0 && '- '}Rp {formatRp(Math.abs(displayedRekapTotals.surplusDefisitAnggaran))}
                      </td>
                      <td className="p-3 text-center text-gray-400 font-bold">
                        -
                      </td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* ======================================================== */
          /* TAB VIEW 3: HIRARKI 3-LEVEL COLLAPSIBLE (AKUN > UNIT > DETAIL) */
          /* ======================================================== */
          <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <FolderTree size={18} className="text-indigo-600" />
                  <span>
                    {activeDetailSubtab === 'penerimaan'
                      ? `Struktur Usulan Penerimaan (${allDetailPenerimaanRows.length.toLocaleString('id-ID')} Rincian Data)`
                      : `Struktur Usulan Belanja (${allDetailRows.length.toLocaleString('id-ID')} Rincian Data)`}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 font-medium mt-1">
                  Format Hierarkis: <strong>Akun (Anak 1)</strong> ➔ <strong>Unit Kerja (Anak 2)</strong> ➔ <strong>Rincian Detail Transaksi (Anak 3)</strong>
                  {kategoriFilter !== 'ALL' && activeDetailSubtab === 'belanja' && (
                    <span className="font-bold text-indigo-700"> • Filter Kategori: {kategoriFilter}</span>
                  )}
                  {unitFilter !== 'ALL' && (
                    <span className="font-bold text-blue-700"> • Filter Unit: {unitFilter}</span>
                  )}
                </CardDescription>
              </div>

              {/* Subtab Toggle & Control Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Subtab Toggle */}
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailSubtab('belanja');
                      setCurrentAkunPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDetailSubtab === 'belanja'
                        ? 'bg-white text-indigo-950 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📋 Rincian Belanja ({allDetailRows.length.toLocaleString('id-ID')})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailSubtab('penerimaan');
                      setCurrentAkunPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDetailSubtab === 'penerimaan'
                        ? 'bg-white text-emerald-950 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💰 Rincian Penerimaan ({allDetailPenerimaanRows.length.toLocaleString('id-ID')})
                  </button>
                </div>

              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 bg-slate-50/50">
              <HierarchicalInlineTable
                rows={activeDetailSubtab === 'penerimaan' ? allDetailPenerimaanRows : allDetailRows}
                type={activeDetailSubtab}
                formatRp={formatRp}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL PENGATURAN SUSUNAN TEMPLATE SLIDE / PPT PROPOSAL RKAT               */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Settings2 size={20} className="text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                    <span>Pengaturan Susunan Template Slide PPT RKAT</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Atur tata urutan pos, label tampilan, atau kata kunci pemetaan usulan RKAT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab Navigation in Modal */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveTemplateTab('penerimaan')}
                className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTemplateTab === 'penerimaan'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>📥 Bagian Penerimaan</span>
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200">
                  {tempTemplate.penerimaanSections?.reduce((acc, s) => acc + (s.items?.length || 0), 0) || 0} Pos
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('pengeluaran')}
                className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTemplateTab === 'pengeluaran'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>📤 Bagian Pengeluaran / Belanja</span>
                <Badge variant="outline" className="text-[10px] bg-white border-slate-200">
                  {tempTemplate.pengeluaranItems?.length || 0} Pos
                </Badge>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {activeTemplateTab === 'penerimaan' ? (
                /* TAB 1: PENERIMAAN */
                <div className="space-y-5">
                  {/* Judul Utama Penerimaan */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Judul Header Penerimaan:
                    </label>
                    <Input
                      type="text"
                      value={tempTemplate.penerimaanTitle}
                      onChange={(e) => setTempTemplate({ ...tempTemplate, penerimaanTitle: e.target.value })}
                      className="h-9 text-xs font-bold bg-white"
                      placeholder="Contoh: Jumlah Penerimaan Dana Masyarakat"
                    />
                  </div>

                  {/* Kelompok-Kelompok Penerimaan */}
                  <div className="space-y-4">
                    {tempTemplate.penerimaanSections.map((sec, secIdx) => (
                      <div key={sec.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                          <div className="flex-1">
                            <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider block">
                              Kelompok {secIdx + 1}
                            </span>
                            <Input
                              type="text"
                              value={sec.title}
                              onChange={(e) => {
                                const copy = { ...tempTemplate };
                                copy.penerimaanSections[secIdx].title = e.target.value;
                                setTempTemplate(copy);
                              }}
                              className="h-8 text-xs font-black bg-white mt-1"
                              placeholder="Nama Kelompok (contoh: Penerimaan Pendidikan)"
                            />
                          </div>
                          <div className="flex items-center gap-1 self-end mb-0.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={secIdx === 0}
                              onClick={() => {
                                const copy = { ...tempTemplate };
                                const temp = copy.penerimaanSections[secIdx - 1];
                                copy.penerimaanSections[secIdx - 1] = copy.penerimaanSections[secIdx];
                                copy.penerimaanSections[secIdx] = temp;
                                setTempTemplate(copy);
                              }}
                              className="h-7 w-7 p-0 rounded-lg"
                              title="Pindahkan Kelompok ke Atas"
                            >
                              <ArrowUp size={12} />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={secIdx === tempTemplate.penerimaanSections.length - 1}
                              onClick={() => {
                                const copy = { ...tempTemplate };
                                const temp = copy.penerimaanSections[secIdx + 1];
                                copy.penerimaanSections[secIdx + 1] = copy.penerimaanSections[secIdx];
                                copy.penerimaanSections[secIdx] = temp;
                                setTempTemplate(copy);
                              }}
                              className="h-7 w-7 p-0 rounded-lg"
                              title="Pindahkan Kelompok ke Bawah"
                            >
                              <ArrowDown size={12} />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const copy = { ...tempTemplate };
                                copy.penerimaanSections.splice(secIdx, 1);
                                setTempTemplate(copy);
                              }}
                              className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="Hapus Kelompok"
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>

                        {/* List of Items inside Section */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Daftar Baris Pos Penerimaan:
                          </span>
                          {sec.items.map((item, itemIdx) => (
                            <div key={item.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                    Label Tampilan di Slide:
                                  </label>
                                  <Input
                                    type="text"
                                    value={item.label}
                                    onChange={(e) => {
                                      const copy = { ...tempTemplate };
                                      copy.penerimaanSections[secIdx].items[itemIdx].label = e.target.value;
                                      setTempTemplate(copy);
                                    }}
                                    className="h-7 text-xs font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                    Kata Kunci Klasifikasi:
                                  </label>
                                  <Input
                                    type="text"
                                    value={item.matchKeys.join(', ')}
                                    onChange={(e) => {
                                      const copy = { ...tempTemplate };
                                      copy.penerimaanSections[secIdx].items[itemIdx].matchKeys = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                      setTempTemplate(copy);
                                    }}
                                    placeholder="pisah dengan koma, misal: pendidikan utama"
                                    className="h-7 text-xs font-mono"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-1 self-end sm:self-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={itemIdx === 0}
                                  onClick={() => {
                                    const copy = { ...tempTemplate };
                                    const items = copy.penerimaanSections[secIdx].items;
                                    const temp = items[itemIdx - 1];
                                    items[itemIdx - 1] = items[itemIdx];
                                    items[itemIdx] = temp;
                                    setTempTemplate(copy);
                                  }}
                                  className="h-6 w-6 p-0 rounded-md"
                                >
                                  <ArrowUp size={11} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={itemIdx === sec.items.length - 1}
                                  onClick={() => {
                                    const copy = { ...tempTemplate };
                                    const items = copy.penerimaanSections[secIdx].items;
                                    const temp = items[itemIdx + 1];
                                    items[itemIdx + 1] = items[itemIdx];
                                    items[itemIdx] = temp;
                                    setTempTemplate(copy);
                                  }}
                                  className="h-6 w-6 p-0 rounded-md"
                                >
                                  <ArrowDown size={11} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const copy = { ...tempTemplate };
                                    copy.penerimaanSections[secIdx].items.splice(itemIdx, 1);
                                    setTempTemplate(copy);
                                  }}
                                  className="h-6 w-6 p-0 rounded-md text-rose-500 hover:text-rose-700"
                                >
                                  <Trash2 size={11} />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const copy = { ...tempTemplate };
                              copy.penerimaanSections[secIdx].items.push({
                                id: 'item_' + Date.now(),
                                label: 'Pos Penerimaan Baru',
                                matchKeys: ['kata kunci']
                              });
                              setTempTemplate(copy);
                            }}
                            className="h-7 text-xs font-bold text-indigo-700 border-dashed border-indigo-300 hover:bg-indigo-50 w-full gap-1"
                          >
                            <Plus size={12} />
                            <span>Tambah Pos di {sec.title || 'Kelompok Ini'}</span>
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const copy = { ...tempTemplate };
                        copy.penerimaanSections.push({
                          id: 'sec_' + Date.now(),
                          title: 'Kelompok Penerimaan Baru',
                          items: [
                            {
                              id: 'item_' + Date.now(),
                              label: 'Pos Baru',
                              matchKeys: ['kata kunci']
                            }
                          ]
                        });
                        setTempTemplate(copy);
                      }}
                      className="h-8 text-xs font-bold text-indigo-800 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 w-full gap-1.5"
                    >
                      <Plus size={13} />
                      <span>Tambah Kelompok Penerimaan Baru</span>
                    </Button>
                  </div>
                </div>
              ) : (
                /* TAB 2: PENGELUARAN / BELANJA */
                <div className="space-y-5">
                  {/* Judul Utama Pengeluaran */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Judul Header Pengeluaran:
                    </label>
                    <Input
                      type="text"
                      value={tempTemplate.pengeluaranTitle}
                      onChange={(e) => setTempTemplate({ ...tempTemplate, pengeluaranTitle: e.target.value })}
                      className="h-9 text-xs font-bold bg-white"
                      placeholder="Contoh: PENGELUARAN"
                    />
                  </div>

                  {/* List of Pengeluaran Items */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Urutan Pos Belanja Pengeluaran:
                    </span>
                    {tempTemplate.pengeluaranItems.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                Label Tampilan di Slide:
                              </label>
                              <Input
                                type="text"
                                value={item.label}
                                onChange={(e) => {
                                  const copy = { ...tempTemplate };
                                  copy.pengeluaranItems[idx].label = e.target.value;
                                  setTempTemplate(copy);
                                }}
                                className="h-7 text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                Kata Kunci Klasifikasi:
                              </label>
                              <Input
                                type="text"
                                value={item.matchKeys.join(', ')}
                                onChange={(e) => {
                                  const copy = { ...tempTemplate };
                                  copy.pengeluaranItems[idx].matchKeys = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                  setTempTemplate(copy);
                                }}
                                placeholder="misal: pegawai, atau: techno, adb"
                                className="h-7 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => {
                              const copy = { ...tempTemplate };
                              const temp = copy.pengeluaranItems[idx - 1];
                              copy.pengeluaranItems[idx - 1] = copy.pengeluaranItems[idx];
                              copy.pengeluaranItems[idx] = temp;
                              setTempTemplate(copy);
                            }}
                            className="h-7 w-7 p-0 rounded-lg"
                            title="Naikkan Urutan"
                          >
                            <ArrowUp size={12} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === tempTemplate.pengeluaranItems.length - 1}
                            onClick={() => {
                              const copy = { ...tempTemplate };
                              const temp = copy.pengeluaranItems[idx + 1];
                              copy.pengeluaranItems[idx + 1] = copy.pengeluaranItems[idx];
                              copy.pengeluaranItems[idx] = temp;
                              setTempTemplate(copy);
                            }}
                            className="h-7 w-7 p-0 rounded-lg"
                            title="Turunkan Urutan"
                          >
                            <ArrowDown size={12} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const copy = { ...tempTemplate };
                              copy.pengeluaranItems.splice(idx, 1);
                              setTempTemplate(copy);
                            }}
                            className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Hapus Pos"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const copy = { ...tempTemplate };
                        copy.pengeluaranItems.push({
                          id: 'b_' + Date.now(),
                          label: 'Pos Belanja Baru',
                          matchKeys: ['kata kunci']
                        });
                        setTempTemplate(copy);
                      }}
                      className="h-8 text-xs font-bold text-indigo-700 border-dashed border-indigo-300 hover:bg-indigo-50 w-full gap-1.5"
                    >
                      <Plus size={13} />
                      <span>Tambah Pos Belanja Pengeluaran Baru</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempTemplate(JSON.parse(JSON.stringify(DEFAULT_PPT_TEMPLATE)));
                  toast.success('Susunan dikembalikan ke Format Default Asli');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 border-slate-300 w-full sm:w-auto"
              >
                <RotateCcw size={13} className="mr-1.5" />
                <span>Reset ke Template Default</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="text-xs font-bold border-slate-300 flex-1 sm:flex-initial"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setPptTemplate(tempTemplate);
                    try {
                      localStorage.setItem('rka_ppt_template_config', JSON.stringify(tempTemplate));
                    } catch (e) {}
                    setIsTemplateModalOpen(false);
                    toast.success('Susunan template slide berhasil disimpan dan diterapkan!');
                  }}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex-1 sm:flex-initial"
                >
                  <Check size={13} className="mr-1.5" />
                  <span>Simpan &amp; Terapkan Susunan</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

