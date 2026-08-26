'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, Filter, Search, ChevronDown, ChevronRight, 
  ChevronUp, RotateCcw, Download, Sparkles, Edit3, CheckCircle2, 
  AlertCircle, Building2, Layers, BookOpen, FileText, ArrowRight,
  Plus, Minus, X, Save, RefreshCw, ShieldCheck, PieChart, BarChart3,
  Hash, Tag, ChevronLeft, MessageSquare, TrendingUp, Landmark, Wallet,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { supabase } from '@/lib/supabase';

// --- PHP FORMULA PARSER & SERIALIZER ---
interface PhpFormulaData {
  calcs: string[];
  units: string[];
  lines: { val: string; unit: string; text: string }[];
  totalQty: string;
  totalUnit: string;
  finalHasil: string;
}

function parsePhpFormula(str: string | null | undefined): PhpFormulaData | null {
  if (!str || typeof str !== 'string') return null;
  try {
    const calcMatch = str.match(/"perhitungan";a:10:\{([^}]+)\}/);
    const resMatch = str.match(/"hasil";a:2:\{([^}]+)\}/);
    
    const calcs = ['', '', '', '', ''];
    const units = ['', '', '', '', ''];
    
    if (calcMatch) {
      const regex = /i:(\d+);s:\d+:"([^"]*)"/g;
      let m;
      while ((m = regex.exec(calcMatch[1])) !== null) {
        const idx = parseInt(m[1]);
        const val = m[2];
        if (idx < 5) calcs[idx] = val;
        else units[idx - 5] = val;
      }
    }
    
    let totalQty = '';
    let totalUnit = '';
    
    if (resMatch) {
      const regex = /i:(\d+);s:\d+:"([^"]*)"/g;
      let m;
      while ((m = regex.exec(resMatch[1])) !== null) {
        if (m[1] === '0') totalQty = m[2];
        if (m[1] === '1') totalUnit = m[2];
      }
    }
    
    const lines: { val: string; unit: string; text: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const c = (calcs[i] || '').trim();
      const u = (units[i] || '').trim();
      if (c || u) {
        lines.push({ val: c, unit: u, text: `${c ? c + ' ' : ''}${u}`.trim() });
      }
    }
    
    const finalHasil = `${totalQty} ${totalUnit}`.trim();
    
    return {
      calcs,
      units,
      lines,
      totalQty,
      totalUnit,
      finalHasil
    };
  } catch (e) {
    return null;
  }
}

function serializePhpFormula(calcs: string[], units: string[], totalQty: string | number, totalUnit: string): string {
  let perhStr = '';
  for (let i = 0; i < 5; i++) {
    const val = calcs[i] !== undefined && calcs[i] !== null ? String(calcs[i]).trim() : '';
    perhStr += `i:${i};s:${val.length}:"${val}";`;
  }
  for (let i = 0; i < 5; i++) {
    const val = units[i] !== undefined && units[i] !== null ? String(units[i]).trim() : '';
    perhStr += `i:${i+5};s:${val.length}:"${val}";`;
  }
  
  const qStr = totalQty !== undefined && totalQty !== null ? String(totalQty).trim() : '0';
  const uStr = totalUnit !== undefined && totalUnit !== null ? String(totalUnit).trim() : '';
  const hasilStr = `i:0;s:${qStr.length}:"${qStr}";i:1;s:${uStr.length}:"${uStr}";`;
  
  return `a:2:{s:11:"perhitungan";a:10:{${perhStr}}s:5:"hasil";a:2:{${hasilStr}}}`;
}

// Helper Akun Induk (2 Digit)
function getAkunInduk(akunStr: string): { code: string; label: string } {
  if (!akunStr) return { code: 'XX', label: 'Tanpa Akun Induk' };
  const clean = akunStr.trim();
  const match = clean.match(/\b(\d{2})/);
  const code = match ? match[1] : (clean.length >= 2 && !isNaN(Number(clean.slice(0, 2))) ? clean.slice(0, 2) : 'Lainnya');
  
  const knownNames: Record<string, string> = {
    '51': 'Belanja Pegawai',
    '52': 'Belanja Barang dan Jasa',
    '53': 'Biaya Perbaikan dan Pemeliharaan',
    '54': 'Belanja Perjalanan Dinas',
    '55': 'Belanja Modal',
    '56': 'Belanja Transfer Antar Unit',
    '57': 'Belanja Beasiswa & Bantuan',
    '58': 'Belanja Kerjasama / Lainnya'
  };

  const name = knownNames[code] ? `${code} - ${knownNames[code]}` : `Akun Induk ${code}`;
  return { code, label: name };
}

// Helper untuk menyaring catatan review yang bermakna
function getCleanReviewNote(reason: string | null | undefined): string | null {
  if (!reason || typeof reason !== 'string') return null;
  const trimmed = reason.trim();
  if (!trimmed || trimmed === '-') return null;
  
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('diidentifikasi sebagai kebutuhan') ||
    lower.startsWith('match exact rule') ||
    lower === 'disetujui penyesuaian' ||
    lower === 'normal'
  ) {
    return null;
  }
  
  return trimmed;
}

// --- GENERIC AUTOCOMPLETE COMPONENT ---
interface AutocompleteProps {
  label: string;
  icon?: React.ReactNode;
  options: string[];
  selectedValue: string;
  onSelect: (val: string) => void;
  placeholder?: string;
}

function KeyboardAutocompleteFilter({ label, icon, options, selectedValue, onSelect, placeholder = 'Cari...' }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => opt && opt.toLowerCase().includes(query.toLowerCase()));
  }, [options, query]);

  const allOptions = useMemo(() => {
    return ['ALL', ...filteredOptions];
  }, [filteredOptions]);

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
      if (allOptions.length > 0 && allOptions[highlightedIndex] !== undefined) {
        onSelect(allOptions[highlightedIndex]);
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (!selectedValue || selectedValue === 'ALL') {
      return `Semua (${options.length})`;
    }
    return selectedValue;
  };

  return (
    <div className="relative flex flex-col gap-1 w-full" onKeyDown={handleKeyDown}>
      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-10 px-3 rounded-xl border text-xs font-semibold shadow-sm flex items-center justify-between gap-2 transition-all text-left bg-white ${
          selectedValue !== 'ALL' && selectedValue !== '' 
            ? 'border-indigo-500 ring-2 ring-indigo-100 text-indigo-950 font-bold bg-indigo-50/20' 
            : 'border-gray-300 text-gray-800 hover:bg-gray-50'
        }`}
      >
        <span className="truncate flex-1" title={getDisplayText()}>
          {getDisplayText()}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] max-w-[420px] rounded-2xl bg-white border border-gray-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="relative mb-2">
              <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
              />
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-3 py-2 rounded-xl cursor-pointer font-bold transition-colors flex items-center justify-between ${
                  highlightedIndex === 0 
                    ? 'bg-indigo-600 text-white' 
                    : selectedValue === 'ALL' || !selectedValue
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                <span>🏢 Semua {label} ({options.length})</span>
                {(selectedValue === 'ALL' || !selectedValue) && (
                  <span className={highlightedIndex === 0 ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>
                )}
              </div>

              {filteredOptions.map((opt, idx) => {
                const itemIdx = idx + 1;
                const isHighlighted = highlightedIndex === itemIdx;
                const isSelected = selectedValue === opt;
                return (
                  <div
                    key={opt + idx}
                    onClick={() => {
                      onSelect(opt);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`px-3 py-2 rounded-xl cursor-pointer font-medium transition-colors flex items-center justify-between ${
                      isHighlighted 
                        ? 'bg-indigo-600 text-white font-bold' 
                        : isSelected 
                        ? 'bg-indigo-50 text-indigo-700 font-bold' 
                        : 'hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <span className="truncate pr-2" title={opt}>{opt}</span>
                    {isSelected && (
                      <span className={isHighlighted ? 'text-white font-bold' : 'text-indigo-600 font-bold'}>✓</span>
                    )}
                  </div>
                );
              })}

              {filteredOptions.length === 0 && (
                <div className="p-4 text-gray-400 text-center text-xs">
                  Tidak ada data yang cocok dengan &quot;{query}&quot;
                </div>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 px-1">
              <span>Navigasi: ↑ ↓ Enter</span>
              <span>Tutup: Esc</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [govUnits, setGovUnits] = useState<any[]>([]);
  const [pagu2026Rows, setPagu2026Rows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Tab State: 1 = unit, 2 = akun, 3 = komparasi
  const [activeTab, setActiveTab] = useState<'unit' | 'akun' | 'komparasi'>('unit');

  // --- FILTERS ---
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedIndikator, setSelectedIndikator] = useState('ALL');
  const [selectedKegiatan, setSelectedKegiatan] = useState('ALL');
  const [selectedLingkup, setSelectedLingkup] = useState('ALL');
  const [selectedMaksud, setSelectedMaksud] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Expand / Collapse State
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // State expand Tab Summary Akun
  const [expandedAkunInduk, setExpandedAkunInduk] = useState<Record<string, boolean>>({});
  const [expandedAkunDetail, setExpandedAkunDetail] = useState<Record<string, boolean>>({});
  const [expandedAkunUnit, setExpandedAkunUnit] = useState<Record<string, boolean>>({});

  // State expand Tab Komparasi 2027 vs 2026
  const [expandedKompGroups, setExpandedKompGroups] = useState<Record<string, boolean>>({});
  const [expandedKompUnits, setExpandedKompUnits] = useState<Record<string, boolean>>({});
  const [includeLuncuran2026, setIncludeLuncuran2026] = useState(false);

  // Dialog State for "Direvisi"
  const [revisiDialogItem, setRevisiDialogItem] = useState<any | null>(null);
  const [revisiForm, setRevisiForm] = useState<{
    calcs: string[];
    units: string[];
    tarif: number;
    keterangan: string;
    customStatus: string;
  }>({
    calcs: ['', '', '', '', ''],
    units: ['', '', '', '', ''],
    tarif: 0,
    keterangan: '',
    customStatus: 'Direvisi'
  });
  const [isSavingRevisi, setIsSavingRevisi] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const [resBudgets, resGovUnits, resPagu2026] = await Promise.all([
        fetch('/api/budgets/list'),
        supabase.from('gov_units').select('id, kode_unit, nama_unit, group_org, is_pagu').order('nama_unit'),
        supabase.from('gov_pagu_anggaran').select('*').eq('tahun_anggaran', '2026')
      ]);

      const json = await resBudgets.json();
      if (json.success) {
        setBudgets(json.data || []);
      }
      if (resGovUnits.data) {
        setGovUnits(resGovUnits.data);
      }
      if (resPagu2026.data) {
        setPagu2026Rows(resPagu2026.data);
      }
    } catch (e) {
      toast.error('Gagal memuat data review anggaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  // Scoped budgets based on Unit Kerja and Year
  const scopedBudgetsForFilters = useMemo(() => {
    return budgets.filter(b => {
      if (selectedUnit !== 'ALL' && b.unitkerja_nama !== selectedUnit) return false;
      if (selectedYear !== 'ALL' && String(b.tahun) !== String(selectedYear)) return false;
      return true;
    });
  }, [budgets, selectedUnit, selectedYear]);

  // Filter Options
  const unitOptions = useMemo(() => {
    const list = selectedYear !== 'ALL' 
      ? budgets.filter(b => String(b.tahun) === String(selectedYear))
      : budgets;
    return Array.from(new Set(list.map(b => b.unitkerja_nama).filter(Boolean))).sort() as string[];
  }, [budgets, selectedYear]);

  const statusOptions = useMemo(() => {
    const statuses = scopedBudgetsForFilters.map(b => b.custom_status || (b.kunci === 'Y' ? 'Wajib' : 'N')).filter(Boolean);
    return Array.from(new Set(statuses)).sort() as string[];
  }, [scopedBudgetsForFilters]);

  const indikatorOptions = useMemo(() => {
    const list = Array.from(new Set(scopedBudgetsForFilters.map(b => b.kode_nama_indikator).filter(Boolean))) as string[];
    return list.sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [scopedBudgetsForFilters]);

  const kegiatanOptions = useMemo(() => {
    const list = selectedIndikator !== 'ALL'
      ? scopedBudgetsForFilters.filter(b => b.kode_nama_indikator === selectedIndikator)
      : scopedBudgetsForFilters;
    return Array.from(new Set(list.map(b => b.kode_nama_kegiatan).filter(Boolean))).sort((a: any, b: any) => a.localeCompare(b, 'id', { numeric: true })) as string[];
  }, [scopedBudgetsForFilters, selectedIndikator]);

  const lingkupOptions = useMemo(() => {
    const list = selectedKegiatan !== 'ALL'
      ? scopedBudgetsForFilters.filter(b => b.kode_nama_kegiatan === selectedKegiatan)
      : scopedBudgetsForFilters;
    return Array.from(new Set(list.map(b => b.lingkup).filter(Boolean))).sort() as string[];
  }, [scopedBudgetsForFilters, selectedKegiatan]);

  const maksudOptions = useMemo(() => {
    return Array.from(new Set(scopedBudgetsForFilters.map(b => b.maksud_tujuan).filter(Boolean))).sort() as string[];
  }, [scopedBudgetsForFilters]);

  const yearOptions = useMemo(() => {
    const list = selectedUnit !== 'ALL'
      ? budgets.filter(b => b.unitkerja_nama === selectedUnit)
      : budgets;
    return Array.from(new Set(list.map(b => b.tahun).filter(Boolean))).sort() as string[];
  }, [budgets, selectedUnit]);

  // Filtered Budgets
  const filteredBudgets = useMemo(() => {
    return budgets.filter(item => {
      if (selectedUnit !== 'ALL' && item.unitkerja_nama !== selectedUnit) return false;
      
      const itemStatus = item.custom_status || (item.kunci === 'Y' ? 'Wajib' : 'N');
      if (selectedStatus !== 'ALL' && itemStatus !== selectedStatus) return false;

      if (selectedIndikator !== 'ALL' && item.kode_nama_indikator !== selectedIndikator) return false;
      if (selectedKegiatan !== 'ALL' && item.kode_nama_kegiatan !== selectedKegiatan) return false;
      if (selectedLingkup !== 'ALL' && item.lingkup !== selectedLingkup) return false;
      if (selectedMaksud !== 'ALL' && item.maksud_tujuan !== selectedMaksud) return false;
      if (selectedYear !== 'ALL' && String(item.tahun) !== String(selectedYear)) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const str = `${item.unitkerja_nama} ${item.akun} ${item.komponen_nama} ${item.deskripsi} ${item.lingkup} ${item.maksud_tujuan} ${item.kode_nama_indikator} ${item.kode_nama_kegiatan}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      return true;
    });
  }, [budgets, selectedUnit, selectedStatus, selectedIndikator, selectedKegiatan, selectedLingkup, selectedMaksud, selectedYear, searchTerm]);

  // 1. Grouping Hierarki: LEVEL 1 (UNIT KERJA) -> LEVEL 2 (INDIKATOR / KEGIATAN KELOMPOK SORTED A-Z)
  interface GroupedIndikatorData {
    groupKey: string;
    unitKerja: string;
    indikator: string;
    kegiatan: string;
    lingkup: string;
    maksud: string;
    items: any[];
    totalUsulan: number;
    totalPenyesuaian: number;
    totalSetelahPenyesuaian: number;
  }

  interface UnitGroupedData {
    unitName: string;
    groups: GroupedIndikatorData[];
    totalItems: number;
    totalUsulan: number;
    totalPenyesuaian: number;
    totalSetelahPenyesuaian: number;
  }

  const unitGroupedData = useMemo<UnitGroupedData[]>(() => {
    const unitMap = new Map<string, {
      unitName: string;
      groupMap: Map<string, GroupedIndikatorData>;
      totalItems: number;
      totalUsulan: number;
      totalPenyesuaian: number;
      totalSetelahPenyesuaian: number;
    }>();

    filteredBudgets.forEach(b => {
      const unit = b.unitkerja_nama || 'Tanpa Unit Kerja';
      const ind = b.kode_nama_indikator || 'Tanpa Indikator Program';
      const keg = b.kode_nama_kegiatan || 'Tanpa Kegiatan';
      const ling = b.lingkup || '-';
      const maks = b.maksud_tujuan || '-';

      const groupKey = `${unit}___${ind}___${keg}___${ling}___${maks}`;

      if (!unitMap.has(unit)) {
        unitMap.set(unit, {
          unitName: unit,
          groupMap: new Map(),
          totalItems: 0,
          totalUsulan: 0,
          totalPenyesuaian: 0,
          totalSetelahPenyesuaian: 0
        });
      }

      const unitEntry = unitMap.get(unit)!;
      unitEntry.totalItems += 1;

      const usulanNominal = Number(b.total) || 0;
      unitEntry.totalUsulan += usulanNominal;

      let penyesuaianItem = 0;
      if (b.approval_pagu_indikatif_anggaran_rumus) {
        const parsedAppr = parsePhpFormula(b.approval_pagu_indikatif_anggaran_rumus);
        if (parsedAppr) {
          const qtyAppr = parseFloat(parsedAppr.totalQty) || 0;
          const usulanFormula = parsePhpFormula(b.usulan_pagu_indikatif_anggaran_rumus);
          const usulanQty = usulanFormula ? parseFloat(usulanFormula.totalQty) || Number(b.vol) || 1 : Number(b.vol) || 1;
          const usulanTarif = (Number(b.total) > 0 && usulanQty > 0) ? (Number(b.total) / usulanQty) : (Number(b.tarif) || 0);
          const tarif = Number(b.tarif) || usulanTarif;
          const totalAppr = qtyAppr * tarif;
          penyesuaianItem = totalAppr - usulanNominal;
        }
      }

      unitEntry.totalPenyesuaian += penyesuaianItem;
      unitEntry.totalSetelahPenyesuaian += (usulanNominal + penyesuaianItem);

      if (!unitEntry.groupMap.has(groupKey)) {
        unitEntry.groupMap.set(groupKey, {
          groupKey,
          unitKerja: unit,
          indikator: ind,
          kegiatan: keg,
          lingkup: ling,
          maksud: maks,
          items: [],
          totalUsulan: 0,
          totalPenyesuaian: 0,
          totalSetelahPenyesuaian: 0
        });
      }

      const grp = unitEntry.groupMap.get(groupKey)!;
      grp.items.push(b);
      grp.totalUsulan += usulanNominal;
      grp.totalPenyesuaian += penyesuaianItem;
      grp.totalSetelahPenyesuaian += (usulanNominal + penyesuaianItem);
    });

    return Array.from(unitMap.values()).map(u => ({
      unitName: u.unitName,
      groups: Array.from(u.groupMap.values()).sort((a, b) => a.indikator.localeCompare(b.indikator, 'id', { numeric: true })),
      totalItems: u.totalItems,
      totalUsulan: u.totalUsulan,
      totalPenyesuaian: u.totalPenyesuaian,
      totalSetelahPenyesuaian: u.totalSetelahPenyesuaian
    }));
  }, [filteredBudgets]);

  const totalGroupsCount = useMemo(() => {
    return unitGroupedData.reduce((acc, u) => acc + u.groups.length, 0);
  }, [unitGroupedData]);

  // 2. Grouping Hierarki: LEVEL 1 (AKUN INDUK 2 DIGIT) -> LEVEL 2 (DETAIL AKUN) -> LEVEL 3 (UNIT KERJA)
  interface AkunUnitData {
    unitName: string;
    items: any[];
    totalUsulan: number;
    totalPenyesuaian: number;
    totalSetelahPenyesuaian: number;
  }

  interface AkunDetailData {
    akunCode: string;
    akunName: string;
    units: AkunUnitData[];
    totalItems: number;
    totalUsulan: number;
    totalPenyesuaian: number;
    totalSetelahPenyesuaian: number;
  }

  interface AkunIndukData {
    indukCode: string;
    indukLabel: string;
    akuns: AkunDetailData[];
    totalItems: number;
    totalUsulan: number;
    totalPenyesuaian: number;
    totalSetelahPenyesuaian: number;
  }

  const akunGroupedData = useMemo<AkunIndukData[]>(() => {
    const indukMap = new Map<string, {
      indukCode: string;
      indukLabel: string;
      detailMap: Map<string, {
        akunCode: string;
        akunName: string;
        unitMap: Map<string, {
          unitName: string;
          items: any[];
          totalUsulan: number;
          totalPenyesuaian: number;
          totalSetelahPenyesuaian: number;
        }>;
        totalItems: number;
        totalUsulan: number;
        totalPenyesuaian: number;
        totalSetelahPenyesuaian: number;
      }>;
      totalItems: number;
      totalUsulan: number;
      totalPenyesuaian: number;
      totalSetelahPenyesuaian: number;
    }>();

    filteredBudgets.forEach(b => {
      const rawAkun = (b.akun || b.komponen_nama || 'Tanpa Akun').trim();
      const { code: indukCode, label: indukLabel } = getAkunInduk(rawAkun);
      const unit = b.unitkerja_nama || 'Tanpa Unit Kerja';

      if (!indukMap.has(indukCode)) {
        indukMap.set(indukCode, {
          indukCode,
          indukLabel,
          detailMap: new Map(),
          totalItems: 0,
          totalUsulan: 0,
          totalPenyesuaian: 0,
          totalSetelahPenyesuaian: 0
        });
      }
      const indukEntry = indukMap.get(indukCode)!;
      indukEntry.totalItems += 1;

      const usulanNominal = Number(b.total) || 0;
      indukEntry.totalUsulan += usulanNominal;

      let penyesuaianItem = 0;
      if (b.approval_pagu_indikatif_anggaran_rumus) {
        const parsedAppr = parsePhpFormula(b.approval_pagu_indikatif_anggaran_rumus);
        if (parsedAppr) {
          const qtyAppr = parseFloat(parsedAppr.totalQty) || 0;
          const usulanFormula = parsePhpFormula(b.usulan_pagu_indikatif_anggaran_rumus);
          const usulanQty = usulanFormula ? parseFloat(usulanFormula.totalQty) || Number(b.vol) || 1 : Number(b.vol) || 1;
          const usulanTarif = (Number(b.total) > 0 && usulanQty > 0) ? (Number(b.total) / usulanQty) : (Number(b.tarif) || 0);
          const tarif = Number(b.tarif) || usulanTarif;
          const totalAppr = qtyAppr * tarif;
          penyesuaianItem = totalAppr - usulanNominal;
        }
      }

      indukEntry.totalPenyesuaian += penyesuaianItem;
      indukEntry.totalSetelahPenyesuaian += (usulanNominal + penyesuaianItem);

      if (!indukEntry.detailMap.has(rawAkun)) {
        indukEntry.detailMap.set(rawAkun, {
          akunCode: rawAkun,
          akunName: b.deskripsi || rawAkun,
          unitMap: new Map(),
          totalItems: 0,
          totalUsulan: 0,
          totalPenyesuaian: 0,
          totalSetelahPenyesuaian: 0
        });
      }
      const detailEntry = indukEntry.detailMap.get(rawAkun)!;
      detailEntry.totalItems += 1;
      detailEntry.totalUsulan += usulanNominal;
      detailEntry.totalPenyesuaian += penyesuaianItem;
      detailEntry.totalSetelahPenyesuaian += (usulanNominal + penyesuaianItem);

      if (!detailEntry.unitMap.has(unit)) {
        detailEntry.unitMap.set(unit, {
          unitName: unit,
          items: [],
          totalUsulan: 0,
          totalPenyesuaian: 0,
          totalSetelahPenyesuaian: 0
        });
      }
      const unitEntry = detailEntry.unitMap.get(unit)!;
      unitEntry.items.push(b);
      unitEntry.totalUsulan += usulanNominal;
      unitEntry.totalPenyesuaian += penyesuaianItem;
      unitEntry.totalSetelahPenyesuaian += (usulanNominal + penyesuaianItem);
    });

    return Array.from(indukMap.values())
      .sort((a, b) => a.indukCode.localeCompare(b.indukCode))
      .map(induk => ({
        indukCode: induk.indukCode,
        indukLabel: induk.indukLabel,
        totalItems: induk.totalItems,
        totalUsulan: induk.totalUsulan,
        totalPenyesuaian: induk.totalPenyesuaian,
        totalSetelahPenyesuaian: induk.totalSetelahPenyesuaian,
        akuns: Array.from(induk.detailMap.values())
          .sort((a, b) => a.akunCode.localeCompare(b.akunCode))
          .map(detail => ({
            akunCode: detail.akunCode,
            akunName: detail.akunName,
            totalItems: detail.totalItems,
            totalUsulan: detail.totalUsulan,
            totalPenyesuaian: detail.totalPenyesuaian,
            totalSetelahPenyesuaian: detail.totalSetelahPenyesuaian,
            units: Array.from(detail.unitMap.values())
              .sort((a, b) => a.unitName.localeCompare(b.unitName))
          }))
      }));
  }, [filteredBudgets]);

  const totalAkunDetailCount = useMemo(() => {
    return akunGroupedData.reduce((acc, ind) => acc + ind.akuns.length, 0);
  }, [akunGroupedData]);

  // 3. DATA KOMPARASI: PENGAJUAN ANGGARAN 2027 VS PAGU ANGGARAN 2026 (TERKELOMPOK GROUP_ORG)
  interface KomparasiUnitData {
    unitName: string;
    kodeUnit?: string;
    groupOrg: string;
    isPagu: boolean;
    hasUsulan: boolean;
    statusTag: 'NORMAL' | 'BELUM_USULAN' | 'NON_PAGU_USULAN';
    pagu2026Awal: number;
    pagu2026Inisiatif: number;
    pagu2026Penugasan: number;
    pagu2026Efisiensi: number;
    pagu2026Pengalihan: number;
    pagu2026Luncuran: number;
    pagu2026Total: number;
    totalUsulan2027: number;
    totalPenyesuaian2027: number;
    totalSetelahPenyesuaian2027: number;
    selisih: number;
    growth: number;
  }

  interface KomparasiGroupData {
    groupOrg: string;
    units: KomparasiUnitData[];
    pagu2026Total: number;
    totalUsulan2027: number;
    totalPenyesuaian2027: number;
    totalSetelahPenyesuaian2027: number;
    selisih: number;
    growth: number;
  }

  const komparasiGroupedData = useMemo<KomparasiGroupData[]>(() => {
    const groupMap = new Map<string, KomparasiUnitData[]>();

    // 1. Gather all candidates: is_pagu === 'Y' units + any unit present in unitGroupedData
    const candidateUnits: { name: string; govUnit?: any; budgetUnit?: typeof unitGroupedData[0] }[] = [];
    const seenNames = new Set<string>();

    // A. Add all units where is_pagu === 'Y'
    govUnits.filter(gu => (gu.is_pagu || '').toUpperCase() === 'Y').forEach(gu => {
      const uName = gu.nama_unit || '';
      const norm = uName.toLowerCase().trim();
      seenNames.add(norm);

      // Find matching budget unit if already filled proposals
      const bUnit = unitGroupedData.find(bu => {
        const buName = bu.unitName.toLowerCase().trim();
        return buName === norm || buName.replace(/[^a-z0-9]/g, '') === norm.replace(/[^a-z0-9]/g, '') || norm.includes(buName) || buName.includes(norm);
      });

      candidateUnits.push({ name: uName, govUnit: gu, budgetUnit: bUnit });
    });

    // B. Safety Catch: Add any unit from unitGroupedData (budgets table) that has is_pagu != 'Y' or not in govUnits
    unitGroupedData.forEach(bu => {
      const buName = bu.unitName || '';
      const norm = buName.toLowerCase().trim();

      const alreadyAdded = Array.from(seenNames).some(sn => 
        sn === norm || sn.replace(/[^a-z0-9]/g, '') === norm.replace(/[^a-z0-9]/g, '') || sn.includes(norm) || norm.includes(sn)
      );

      if (!alreadyAdded) {
        seenNames.add(norm);
        // Match gov_unit if existing
        const matchedGov = govUnits.find(gu => {
          const guName = (gu.nama_unit || '').toLowerCase().trim();
          return guName === norm || guName.replace(/[^a-z0-9]/g, '') === norm.replace(/[^a-z0-9]/g, '') || guName.includes(norm) || norm.includes(guName);
        });

        candidateUnits.push({ name: buName, govUnit: matchedGov, budgetUnit: bu });
      }
    });

    // 2. Filter by selectedUnit and searchTerm if applied
    let filteredCandidates = candidateUnits;
    if (selectedUnit !== 'ALL') {
      const selectedNorm = selectedUnit.toLowerCase().trim();
      filteredCandidates = filteredCandidates.filter(c => {
        const cNorm = c.name.toLowerCase().trim();
        return cNorm === selectedNorm || cNorm.includes(selectedNorm) || selectedNorm.includes(cNorm);
      });
    }

    if (searchTerm) {
      const sNorm = searchTerm.toLowerCase().trim();
      filteredCandidates = filteredCandidates.filter(c => {
        const cNorm = c.name.toLowerCase().trim();
        const gNorm = (c.govUnit?.group_org || '').toLowerCase().trim();
        return cNorm.includes(sNorm) || gNorm.includes(sNorm);
      });
    }

    // 3. Process each candidate unit
    filteredCandidates.forEach(item => {
      const gu = item.govUnit;
      const bu = item.budgetUnit;

      const unitName = gu?.nama_unit || bu?.unitName || item.name;
      const groupOrg = gu?.group_org || 'UNIT KERJA LAINNYA';
      const kodeUnit = gu?.kode_unit || '';
      const unitId = gu?.id;
      const isPagu = (gu?.is_pagu || '').toUpperCase() === 'Y';
      const hasUsulan = !!bu && (bu.totalUsulan > 0 || bu.totalItems > 0 || (bu.groups && bu.groups.length > 0));

      let statusTag: 'NORMAL' | 'BELUM_USULAN' | 'NON_PAGU_USULAN' = 'NORMAL';
      if (isPagu && !hasUsulan) statusTag = 'BELUM_USULAN';
      else if (!isPagu && hasUsulan) statusTag = 'NON_PAGU_USULAN';

      // Compute 2026 Pagu from gov_pagu_anggaran mutually exclusively
      let pAwal = 0, pInisiatif = 0, pPenugasan = 0, pEfisiensi = 0, pPengalihan = 0, pLuncuran = 0, pTotal = 0;
      if (unitId) {
        const uRows = pagu2026Rows.filter(r => r.unit_id === unitId || (r.unit_id && unitId && r.unit_id.toString() === unitId.toString()));
        
        uRows.forEach(r => {
          const j = (r.jenis_anggaran || '').toLowerCase().trim();
          const nom = Number(r.nominal || 0);

          if (j.includes('awal') || j.includes('dasar')) {
            pAwal += nom;
          } else if (j.includes('inisiatif')) {
            pInisiatif += nom;
          } else if (j.includes('penugasan')) {
            pPenugasan += nom;
          } else if (j.includes('efisiensi')) {
            pEfisiensi += nom;
          } else if (j.includes('talangan') || j.includes('luncuran') || j.includes('carry over')) {
            pLuncuran += nom;
          } else if (j.includes('pengalihan') || j.includes('pergeseran') || j.includes('tambah') || j.includes('kurang')) {
            pPengalihan += nom;
          }
        });

        pTotal = pAwal + pInisiatif + pPenugasan + pEfisiensi + pPengalihan + (includeLuncuran2026 ? pLuncuran : 0);
      }

      const totalUsulan = bu?.totalUsulan || 0;
      const totalPenyesuaian = bu?.totalPenyesuaian || 0;
      const totalSetelahPenyesuaian = bu?.totalSetelahPenyesuaian || 0;

      const selisih = totalSetelahPenyesuaian - pTotal;
      const growth = pTotal > 0 ? ((selisih / pTotal) * 100) : (totalSetelahPenyesuaian > 0 ? 100 : 0);

      const unitKomparasi: KomparasiUnitData = {
        unitName,
        kodeUnit,
        groupOrg,
        isPagu,
        hasUsulan,
        statusTag,
        pagu2026Awal: pAwal,
        pagu2026Inisiatif: pInisiatif,
        pagu2026Penugasan: pPenugasan,
        pagu2026Efisiensi: pEfisiensi,
        pagu2026Pengalihan: pPengalihan,
        pagu2026Luncuran: pLuncuran,
        pagu2026Total: pTotal,
        totalUsulan2027: totalUsulan,
        totalPenyesuaian2027: totalPenyesuaian,
        totalSetelahPenyesuaian2027: totalSetelahPenyesuaian,
        selisih,
        growth
      };

      if (!groupMap.has(groupOrg)) {
        groupMap.set(groupOrg, []);
      }
      groupMap.get(groupOrg)!.push(unitKomparasi);
    });

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupOrg, units]) => {
        const sortedUnits = units.sort((a, b) => a.unitName.localeCompare(b.unitName));
        const pagu2026Total = sortedUnits.reduce((sum, u) => sum + u.pagu2026Total, 0);
        const totalUsulan2027 = sortedUnits.reduce((sum, u) => sum + u.totalUsulan2027, 0);
        const totalPenyesuaian2027 = sortedUnits.reduce((sum, u) => sum + u.totalPenyesuaian2027, 0);
        const totalSetelahPenyesuaian2027 = sortedUnits.reduce((sum, u) => sum + u.totalSetelahPenyesuaian2027, 0);
        const selisih = totalSetelahPenyesuaian2027 - pagu2026Total;
        const growth = pagu2026Total > 0 ? ((selisih / pagu2026Total) * 100) : (totalSetelahPenyesuaian2027 > 0 ? 100 : 0);

        return {
          groupOrg,
          units: sortedUnits,
          pagu2026Total,
          totalUsulan2027,
          totalPenyesuaian2027,
          totalSetelahPenyesuaian2027,
          selisih,
          growth
        };
      });
  }, [unitGroupedData, govUnits, pagu2026Rows, includeLuncuran2026, selectedUnit, searchTerm]);

  const komparasiTotalUnitsCount = useMemo(() => {
    return komparasiGroupedData.reduce((acc, g) => acc + g.units.length, 0);
  }, [komparasiGroupedData]);

  const komparasiGrandTotals = useMemo(() => {
    const pagu2026 = komparasiGroupedData.reduce((acc, g) => acc + g.pagu2026Total, 0);
    const usulan2027 = komparasiGroupedData.reduce((acc, g) => acc + g.totalUsulan2027, 0);
    const penyesuaian2027 = komparasiGroupedData.reduce((acc, g) => acc + g.totalPenyesuaian2027, 0);
    const setelahPenyesuaian2027 = komparasiGroupedData.reduce((acc, g) => acc + g.totalSetelahPenyesuaian2027, 0);
    const selisih = setelahPenyesuaian2027 - pagu2026;
    const growth = pagu2026 > 0 ? ((selisih / pagu2026) * 100) : 0;

    return {
      pagu2026,
      usulan2027,
      penyesuaian2027,
      setelahPenyesuaian2027,
      selisih,
      growth
    };
  }, [komparasiGroupedData]);

  // Overall KPI Cards
  const overallKPI = useMemo(() => {
    let totalDiajukan = 0;
    let totalPenyesuaian = 0;

    unitGroupedData.forEach(u => {
      totalDiajukan += u.totalUsulan;
      totalPenyesuaian += u.totalPenyesuaian;
    });

    const totalSetelahPenyesuaian = totalDiajukan + totalPenyesuaian;
    const pctPenyesuaian = totalDiajukan > 0 ? (totalPenyesuaian / totalDiajukan) * 100 : 0;
    const pctSetelahPenyesuaian = totalDiajukan > 0 ? (totalSetelahPenyesuaian / totalDiajukan) * 100 : 0;

    // Growth vs 2026 Pagu
    const pagu2026 = komparasiGrandTotals.pagu2026;
    const selisihVs2026 = totalSetelahPenyesuaian - pagu2026;
    const growthVs2026 = pagu2026 > 0 ? ((selisihVs2026 / pagu2026) * 100) : 0;

    return {
      totalDiajukan,
      totalPenyesuaian,
      totalSetelahPenyesuaian,
      pctPenyesuaian,
      pctSetelahPenyesuaian,
      pagu2026,
      selisihVs2026,
      growthVs2026
    };
  }, [unitGroupedData, komparasiGrandTotals]);

  // Toggle Handlers
  const toggleUnit = (unitName: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitName]: !prev[unitName] }));
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAkunInduk = (code: string) => {
    setExpandedAkunInduk(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleAkunDetail = (code: string) => {
    setExpandedAkunDetail(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleAkunUnit = (key: string) => {
    setExpandedAkunUnit(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleKompGroup = (groupOrg: string) => {
    setExpandedKompGroups(prev => ({ ...prev, [groupOrg]: !prev[groupOrg] }));
  };

  const toggleKompUnit = (unitName: string) => {
    setExpandedKompUnits(prev => ({ ...prev, [unitName]: !prev[unitName] }));
  };

  const handleExpandAll = (expanded: boolean) => {
    if (activeTab === 'unit') {
      const updatedUnits: Record<string, boolean> = {};
      const updatedGroups: Record<string, boolean> = {};

      unitGroupedData.forEach(u => {
        updatedUnits[u.unitName] = expanded;
        u.groups.forEach(g => {
          updatedGroups[g.groupKey] = expanded;
        });
      });

      setExpandedUnits(updatedUnits);
      setExpandedGroups(updatedGroups);
    } else if (activeTab === 'akun') {
      const updatedInduk: Record<string, boolean> = {};
      const updatedDetail: Record<string, boolean> = {};
      const updatedUnit: Record<string, boolean> = {};

      akunGroupedData.forEach(induk => {
        updatedInduk[induk.indukCode] = expanded;
        induk.akuns.forEach(detail => {
          updatedDetail[detail.akunCode] = expanded;
          detail.units.forEach(u => {
            updatedUnit[`${detail.akunCode}___${u.unitName}`] = expanded;
          });
        });
      });

      setExpandedAkunInduk(updatedInduk);
      setExpandedAkunDetail(updatedDetail);
      setExpandedAkunUnit(updatedUnit);
    } else {
      const updatedKompGroup: Record<string, boolean> = {};
      const updatedKompUnit: Record<string, boolean> = {};

      komparasiGroupedData.forEach(g => {
        updatedKompGroup[g.groupOrg] = expanded;
        g.units.forEach(u => {
          updatedKompUnit[u.unitName] = expanded;
        });
      });

      setExpandedKompGroups(updatedKompGroup);
      setExpandedKompUnits(updatedKompUnit);
    }
  };

  const isAllExpanded = useMemo(() => {
    if (activeTab === 'unit') {
      if (unitGroupedData.length === 0) return false;
      return unitGroupedData.every(u => expandedUnits[u.unitName] === true);
    } else if (activeTab === 'akun') {
      if (akunGroupedData.length === 0) return false;
      return akunGroupedData.every(induk => expandedAkunInduk[induk.indukCode] === true);
    } else {
      if (komparasiGroupedData.length === 0) return false;
      return komparasiGroupedData.every(g => expandedKompGroups[g.groupOrg] === true);
    }
  }, [activeTab, unitGroupedData, expandedUnits, akunGroupedData, expandedAkunInduk, komparasiGroupedData, expandedKompGroups]);

  const formatRp = (num: any) => {
    if (num === null || num === undefined || isNaN(Number(num))) return '0';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(num));
  };

  // Open Revision Modal
  const handleOpenRevisi = (item: any) => {
    setRevisiDialogItem(item);
    
    const targetRumus = item.approval_pagu_indikatif_anggaran_rumus || item.usulan_pagu_indikatif_anggaran_rumus;
    const parsed = parsePhpFormula(targetRumus);

    let initCalcs = ['', '', '', '', ''];
    let initUnits = ['', '', '', '', ''];

    if (parsed) {
      initCalcs = [...parsed.calcs];
      initUnits = [...parsed.units];
    } else {
      initCalcs[0] = String(item.vol || 1);
      initUnits[0] = item.satuan || 'Paket';
    }

    const usulanFormula = parsePhpFormula(item.usulan_pagu_indikatif_anggaran_rumus);
    const usulanQty = usulanFormula ? parseFloat(usulanFormula.totalQty) || Number(item.vol) || 1 : Number(item.vol) || 1;
    const origUsulanTarif = (Number(item.total) > 0 && usulanQty > 0) ? (Number(item.total) / usulanQty) : (Number(item.tarif) || 0);

    setRevisiForm({
      calcs: initCalcs,
      units: initUnits,
      tarif: Number(item.tarif) || origUsulanTarif,
      keterangan: item.ai_reason || '',
      customStatus: item.custom_status || 'Direvisi'
    });
  };

  // Reset Revision
  const handleResetRevisi = async () => {
    if (!revisiDialogItem) return;
    setIsSavingRevisi(true);
    try {
      const payload = {
        id: revisiDialogItem.id,
        approval_pagu_indikatif_anggaran_rumus: null,
        custom_status: revisiDialogItem.custom_status === 'Direvisi' ? '' : revisiDialogItem.custom_status
      };
      const res = await fetch('/api/budgets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Penyesuaian berhasil direset!');
        setBudgets(prev => prev.map(b => {
          if (b.id === revisiDialogItem.id) {
            return {
              ...b,
              approval_pagu_indikatif_anggaran_rumus: null,
              custom_status: b.custom_status === 'Direvisi' ? '' : b.custom_status
            };
          }
          return b;
        }));
        setRevisiDialogItem(null);
      } else {
        toast.error('Gagal mereset: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (e: any) {
      toast.error('Gagal mereset: ' + e.message);
    } finally {
      setIsSavingRevisi(false);
    }
  };

  // Calculate live revision totals in modal
  const revisiCalculations = useMemo(() => {
    if (!revisiDialogItem) return { totalQty: 0, totalBiaya: 0, penyesuaian: 0, finalUnit: '' };

    let mult = 1;
    let hasVal = false;
    const unitList: string[] = [];

    revisiForm.calcs.forEach((c, idx) => {
      const num = parseFloat(c);
      if (!isNaN(num) && num > 0) {
        mult *= num;
        hasVal = true;
        if (revisiForm.units[idx]?.trim()) {
          unitList.push(revisiForm.units[idx].trim());
        }
      }
    });

    const totalQty = hasVal ? mult : 0;
    const totalBiaya = totalQty * revisiForm.tarif;
    const usulanTotal = Number(revisiDialogItem.total) || 0;
    const penyesuaian = totalBiaya - usulanTotal;
    const finalUnit = unitList.length > 0 ? unitList.join('/') : (revisiDialogItem.satuan || 'Paket');

    return { totalQty, totalBiaya, penyesuaian, finalUnit };
  }, [revisiForm, revisiDialogItem]);

  // Save Revision
  const handleSaveRevisi = async () => {
    if (!revisiDialogItem) return;

    setIsSavingRevisi(true);
    try {
      const serialized = serializePhpFormula(
        revisiForm.calcs,
        revisiForm.units,
        revisiCalculations.totalQty,
        revisiCalculations.finalUnit
      );

      const payload = {
        id: revisiDialogItem.id,
        approval_pagu_indikatif_anggaran_rumus: serialized,
        tarif: revisiForm.tarif,
        custom_status: revisiForm.customStatus || 'Direvisi',
        ai_reason: revisiForm.keterangan || null
      };

      const res = await fetch('/api/budgets/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Penyesuaian review berhasil disimpan!');
        setBudgets(prev => prev.map(b => {
          if (b.id === revisiDialogItem.id) {
            return {
              ...b,
              approval_pagu_indikatif_anggaran_rumus: serialized,
              tarif: revisiForm.tarif,
              custom_status: revisiForm.customStatus || 'Direvisi',
              ai_reason: revisiForm.keterangan
            };
          }
          return b;
        }));

        setRevisiDialogItem(null);
      } else {
        toast.error('Gagal menyimpan penyesuaian: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (e: any) {
      toast.error('Gagal menyimpan: ' + e.message);
    } finally {
      setIsSavingRevisi(false);
    }
  };

  // Export to Excel with 4 Worksheets
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();

      const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      const headerFont: Partial<ExcelJS.Font> = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri', size: 11 };
      const subHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      const totalFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

      const borderThin: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };

      // SHEET 1: DETAIL REVIEW USULAN
      const wsDetail = workbook.addWorksheet('Detail Review Usulan');
      wsDetail.mergeCells('A1:G1');
      wsDetail.getCell('A1').value = 'LAPORAN DETAIL REVIEW USULAN ANGGARAN';
      wsDetail.getCell('A1').font = { bold: true, size: 14, name: 'Calibri' };

      const detailHeaders = [
        'No', 'Unit Kerja', 'Indikator Program', 'Kegiatan', 'Lingkup Kegiatan',
        'Maksud dan Tujuan', 'Akun / Komponen', 'Deskripsi', 'Tipe',
        'Kuantitas (Rumus)', 'Hasil Kuantitas', 'Harga Satuan', 'Jumlah Biaya', 'Penyesuaian', 'Catatan Review'
      ];

      const row4 = wsDetail.getRow(4);
      row4.height = 25;
      detailHeaders.forEach((h, i) => {
        const cell = row4.getCell(i + 1);
        cell.value = h;
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderThin;
      });

      let dRowIndex = 5;
      let noSeq = 1;
      unitGroupedData.forEach(u => {
        u.groups.forEach(grp => {
          grp.items.forEach(item => {
            const usulanFormula = parsePhpFormula(item.usulan_pagu_indikatif_anggaran_rumus);
            const apprFormula = parsePhpFormula(item.approval_pagu_indikatif_anggaran_rumus);
            const usulanQty = usulanFormula ? parseFloat(usulanFormula.totalQty) || Number(item.vol) || 1 : Number(item.vol) || 1;
            const usulanTarif = (Number(item.total) > 0 && usulanQty > 0) ? (Number(item.total) / usulanQty) : (Number(item.tarif) || 0);
            const cleanNote = getCleanReviewNote(item.ai_reason);

            const rU = wsDetail.getRow(dRowIndex);
            rU.getCell(1).value = noSeq;
            rU.getCell(2).value = u.unitName;
            rU.getCell(3).value = grp.indikator;
            rU.getCell(4).value = grp.kegiatan;
            rU.getCell(5).value = grp.lingkup;
            rU.getCell(6).value = grp.maksud;
            rU.getCell(7).value = item.akun || item.komponen_nama;
            rU.getCell(8).value = item.deskripsi;
            rU.getCell(9).value = 'Usulan';
            rU.getCell(10).value = usulanFormula ? usulanFormula.lines.map(l => l.text).join(' x ') : `${item.vol} ${item.satuan}`;
            rU.getCell(11).value = usulanFormula ? usulanFormula.finalHasil : item.vol;
            rU.getCell(12).value = usulanTarif;
            rU.getCell(12).numFmt = '#,##0';
            rU.getCell(13).value = Number(item.total) || 0;
            rU.getCell(13).numFmt = '#,##0';
            rU.getCell(14).value = 0;
            rU.getCell(14).numFmt = '#,##0';
            rU.getCell(15).value = cleanNote || '';

            for (let c = 1; c <= 15; c++) rU.getCell(c).border = borderThin;
            dRowIndex++;

            if (apprFormula) {
              const qtyAppr = parseFloat(apprFormula.totalQty) || 0;
              const tarifAppr = Number(item.tarif) || usulanTarif;
              const totalAppr = qtyAppr * tarifAppr;
              const penyesuaian = totalAppr - (Number(item.total) || 0);

              const rD = wsDetail.getRow(dRowIndex);
              rD.getCell(1).value = '';
              rD.getCell(2).value = u.unitName;
              rD.getCell(3).value = grp.indikator;
              rD.getCell(4).value = grp.kegiatan;
              rD.getCell(5).value = grp.lingkup;
              rD.getCell(6).value = grp.maksud;
              rD.getCell(7).value = item.akun || item.komponen_nama;
              rD.getCell(8).value = item.deskripsi;
              rD.getCell(9).value = 'Direvisi';
              rD.getCell(9).font = { bold: true, color: { argb: 'FFB45309' } };
              rD.getCell(10).value = apprFormula.lines.map(l => l.text).join(' x ');
              rD.getCell(11).value = apprFormula.finalHasil;
              rD.getCell(12).value = tarifAppr;
              rD.getCell(12).numFmt = '#,##0';
              rD.getCell(13).value = totalAppr;
              rD.getCell(13).numFmt = '#,##0';
              rD.getCell(13).font = { bold: true, color: { argb: 'FFB45309' } };
              rD.getCell(14).value = penyesuaian;
              rD.getCell(14).numFmt = '#,##0';
              rD.getCell(14).font = { bold: true, color: { argb: penyesuaian >= 0 ? 'FF059669' : 'FFE11D48' } };
              rD.getCell(15).value = cleanNote || '';

              for (let c = 1; c <= 15; c++) {
                rD.getCell(c).border = borderThin;
                rD.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEFCE8' } };
              }
              dRowIndex++;
            }

            noSeq++;
          });
        });
      });

      // SHEET 2: REKAP PER UNIT KERJA
      const wsUnit = workbook.addWorksheet('Rekap Per Unit Kerja');
      wsUnit.mergeCells('A1:H1');
      wsUnit.getCell('A1').value = 'REKAPITULASI REVIEW ANGGARAN PER UNIT KERJA';
      wsUnit.getCell('A1').font = { bold: true, size: 14, name: 'Calibri' };

      const unitHeaders = [
        'No', 'Nama Unit Kerja', 'Jml Kelompok', 'Jml Usulan',
        'Total Anggaran Usulan', 'Total Penyesuaian', '% Penyesuaian',
        'Total Setelah Penyesuaian', '% Dari Total Pagu'
      ];

      const uRow3 = wsUnit.getRow(3);
      uRow3.height = 25;
      unitHeaders.forEach((h, i) => {
        const cell = uRow3.getCell(i + 1);
        cell.value = h;
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderThin;
      });

      let uRowIdx = 4;
      unitGroupedData.forEach((u, idx) => {
        const r = wsUnit.getRow(uRowIdx);
        r.getCell(1).value = idx + 1;
        r.getCell(1).alignment = { horizontal: 'center' };
        r.getCell(2).value = u.unitName;
        r.getCell(3).value = u.groups.length;
        r.getCell(3).alignment = { horizontal: 'center' };
        r.getCell(4).value = u.totalItems;
        r.getCell(4).alignment = { horizontal: 'center' };
        r.getCell(5).value = u.totalUsulan;
        r.getCell(5).numFmt = '#,##0';
        r.getCell(6).value = u.totalPenyesuaian;
        r.getCell(6).numFmt = '#,##0';
        r.getCell(6).font = { bold: true, color: { argb: u.totalPenyesuaian >= 0 ? 'FF059669' : 'FFE11D48' } };
        const pctAdj = u.totalUsulan > 0 ? (u.totalPenyesuaian / u.totalUsulan) : 0;
        r.getCell(7).value = pctAdj;
        r.getCell(7).numFmt = '0.00%';
        r.getCell(8).value = u.totalSetelahPenyesuaian;
        r.getCell(8).numFmt = '#,##0';
        r.getCell(8).font = { bold: true };
        const pctTotal = overallKPI.totalSetelahPenyesuaian > 0 ? (u.totalSetelahPenyesuaian / overallKPI.totalSetelahPenyesuaian) : 0;
        r.getCell(9).value = pctTotal;
        r.getCell(9).numFmt = '0.00%';

        for (let c = 1; c <= 9; c++) r.getCell(c).border = borderThin;
        uRowIdx++;
      });

      // SHEET 3: REKAP PER AKUN (2 DIGIT)
      const wsAkun = workbook.addWorksheet('Rekap Per Akun (2 Digit)');
      wsAkun.mergeCells('A1:G1');
      wsAkun.getCell('A1').value = 'REKAPITULASI REVIEW ANGGARAN PER AKUN INDUK (2 DIGIT)';
      wsAkun.getCell('A1').font = { bold: true, size: 14, name: 'Calibri' };

      const akunHeaders = [
        'Kode Induk', 'Akun Induk (2 Digit)', 'Kode / Nama Detail Akun',
        'Unit Kerja Pengusul', 'Total Usulan', 'Penyesuaian', 'Total Setelah Penyesuaian', '% Terhadap Total'
      ];

      const aRow3 = wsAkun.getRow(3);
      aRow3.height = 25;
      akunHeaders.forEach((h, i) => {
        const cell = aRow3.getCell(i + 1);
        cell.value = h;
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderThin;
      });

      let aRowIdx = 4;
      akunGroupedData.forEach(induk => {
        const rInduk = wsAkun.getRow(aRowIdx);
        rInduk.getCell(1).value = induk.indukCode;
        rInduk.getCell(2).value = induk.indukLabel;
        rInduk.getCell(3).value = `${induk.akuns.length} Sub-Akun`;
        rInduk.getCell(4).value = `${induk.totalItems} Usulan`;
        rInduk.getCell(5).value = induk.totalUsulan;
        rInduk.getCell(5).numFmt = '#,##0';
        rInduk.getCell(6).value = induk.totalPenyesuaian;
        rInduk.getCell(6).numFmt = '#,##0';
        rInduk.getCell(7).value = induk.totalSetelahPenyesuaian;
        rInduk.getCell(7).numFmt = '#,##0';
        const pctInduk = overallKPI.totalSetelahPenyesuaian > 0 ? (induk.totalSetelahPenyesuaian / overallKPI.totalSetelahPenyesuaian) : 0;
        rInduk.getCell(8).value = pctInduk;
        rInduk.getCell(8).numFmt = '0.00%';

        for (let c = 1; c <= 8; c++) {
          rInduk.getCell(c).border = borderThin;
          rInduk.getCell(c).fill = subHeaderFill;
          rInduk.getCell(c).font = { bold: true };
        }
        aRowIdx++;

        induk.akuns.forEach(detail => {
          detail.units.forEach(u => {
            const rDet = wsAkun.getRow(aRowIdx);
            rDet.getCell(1).value = '';
            rDet.getCell(2).value = induk.indukCode;
            rDet.getCell(3).value = detail.akunCode;
            rDet.getCell(4).value = u.unitName;
            rDet.getCell(5).value = u.totalUsulan;
            rDet.getCell(5).numFmt = '#,##0';
            rDet.getCell(6).value = u.totalPenyesuaian;
            rDet.getCell(6).numFmt = '#,##0';
            rDet.getCell(7).value = u.totalSetelahPenyesuaian;
            rDet.getCell(7).numFmt = '#,##0';
            const pctU = overallKPI.totalSetelahPenyesuaian > 0 ? (u.totalSetelahPenyesuaian / overallKPI.totalSetelahPenyesuaian) : 0;
            rDet.getCell(8).value = pctU;
            rDet.getCell(8).numFmt = '0.00%';

            for (let c = 1; c <= 8; c++) rDet.getCell(c).border = borderThin;
            aRowIdx++;
          });
        });
      });

      // SHEET 4: KOMPARASI ANGGARAN 2027 VS PAGU 2026
      const wsKomp = workbook.addWorksheet('Komparasi 2027 vs 2026');
      wsKomp.mergeCells('A1:I1');
      wsKomp.getCell('A1').value = 'KOMPARASI USULAN ANGGARAN 2027 VS PAGU ANGGARAN 2026';
      wsKomp.getCell('A1').font = { bold: true, size: 14, name: 'Calibri' };

      const kompHeaders = [
        'No', 'Group Organisasi', 'Nama Unit Kerja', 'Pagu Anggaran 2026',
        'Total Usulan 2027', 'Penyesuaian 2027', 'Setelah Penyesuaian 2027',
        'Selisih (Rp)', 'Pertumbuhan (%)'
      ];

      const kRow3 = wsKomp.getRow(3);
      kRow3.height = 25;
      kompHeaders.forEach((h, i) => {
        const cell = kRow3.getCell(i + 1);
        cell.value = h;
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = borderThin;
      });

      let kRowIdx = 4;
      let kSeq = 1;
      komparasiGroupedData.forEach(g => {
        // Group Header
        const rG = wsKomp.getRow(kRowIdx);
        rG.getCell(1).value = '';
        rG.getCell(2).value = g.groupOrg;
        rG.getCell(3).value = `${g.units.length} Unit Kerja`;
        rG.getCell(4).value = g.pagu2026Total;
        rG.getCell(4).numFmt = '#,##0';
        rG.getCell(5).value = g.totalUsulan2027;
        rG.getCell(5).numFmt = '#,##0';
        rG.getCell(6).value = g.totalPenyesuaian2027;
        rG.getCell(6).numFmt = '#,##0';
        rG.getCell(7).value = g.totalSetelahPenyesuaian2027;
        rG.getCell(7).numFmt = '#,##0';
        rG.getCell(8).value = g.selisih;
        rG.getCell(8).numFmt = '#,##0';
        rG.getCell(9).value = g.growth / 100;
        rG.getCell(9).numFmt = '0.00%';

        for (let c = 1; c <= 9; c++) {
          rG.getCell(c).border = borderThin;
          rG.getCell(c).fill = subHeaderFill;
          rG.getCell(c).font = { bold: true };
        }
        kRowIdx++;

        // Unit Rows
        g.units.forEach(u => {
          const rU = wsKomp.getRow(kRowIdx);
          rU.getCell(1).value = kSeq;
          rU.getCell(2).value = g.groupOrg;
          rU.getCell(3).value = u.unitName;
          rU.getCell(4).value = u.pagu2026Total;
          rU.getCell(4).numFmt = '#,##0';
          rU.getCell(5).value = u.totalUsulan2027;
          rU.getCell(5).numFmt = '#,##0';
          rU.getCell(6).value = u.totalPenyesuaian2027;
          rU.getCell(6).numFmt = '#,##0';
          rU.getCell(7).value = u.totalSetelahPenyesuaian2027;
          rU.getCell(7).numFmt = '#,##0';
          rU.getCell(8).value = u.selisih;
          rU.getCell(8).numFmt = '#,##0';
          rU.getCell(9).value = u.growth / 100;
          rU.getCell(9).numFmt = '0.00%';

          for (let c = 1; c <= 9; c++) rU.getCell(c).border = borderThin;
          kRowIdx++;
          kSeq++;
        });
      });

      // Total Row Sheet 4
      const kTotRow = wsKomp.getRow(kRowIdx);
      kTotRow.height = 25;
      wsKomp.mergeCells(kRowIdx, 1, kRowIdx, 3);
      kTotRow.getCell(1).value = 'TOTAL KESELURUHAN';
      kTotRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
      kTotRow.getCell(4).value = komparasiGrandTotals.pagu2026;
      kTotRow.getCell(4).numFmt = '#,##0';
      kTotRow.getCell(5).value = komparasiGrandTotals.usulan2027;
      kTotRow.getCell(5).numFmt = '#,##0';
      kTotRow.getCell(6).value = komparasiGrandTotals.penyesuaian2027;
      kTotRow.getCell(6).numFmt = '#,##0';
      kTotRow.getCell(7).value = komparasiGrandTotals.setelahPenyesuaian2027;
      kTotRow.getCell(7).numFmt = '#,##0';
      kTotRow.getCell(8).value = komparasiGrandTotals.selisih;
      kTotRow.getCell(8).numFmt = '#,##0';
      kTotRow.getCell(9).value = komparasiGrandTotals.growth / 100;
      kTotRow.getCell(9).numFmt = '0.00%';

      for (let c = 1; c <= 9; c++) {
        kTotRow.getCell(c).border = borderThin;
        kTotRow.getCell(c).fill = totalFill;
        kTotRow.getCell(c).font = { bold: true };
      }

      wsKomp.getColumn(1).width = 6;
      wsKomp.getColumn(2).width = 24;
      wsKomp.getColumn(3).width = 38;
      wsKomp.getColumn(4).width = 24;
      wsKomp.getColumn(5).width = 24;
      wsKomp.getColumn(6).width = 20;
      wsKomp.getColumn(7).width = 25;
      wsKomp.getColumn(8).width = 22;
      wsKomp.getColumn(9).width = 16;

      // Trigger Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan_Review_Anggaran_Lengkap_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('File Excel (4 Sheet Lengkap) berhasil diunduh!');
    } catch (e: any) {
      toast.error('Gagal mengekspor Excel: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full space-y-6 animate-in fade-in duration-300 min-h-screen pb-28">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 mb-2">
            <Sparkles size={13} /> Penelaahan Usulan Anggaran Cerdas
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
            Review Anggaran (Rule Engine + AI)
          </h1>
          <p className="text-xs lg:text-sm text-gray-500 mt-1 font-medium">
            Telaah usulan rencana belanja per unit kerja, rekapitulasi akun induk, dan komparasi pagu 2027 vs 2026.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={fetchBudgets}
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100 h-9 font-semibold"
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            onClick={handleExportExcel}
            disabled={exporting || loading}
            size="sm"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-9 font-bold shadow-sm"
          >
            {exporting ? <RefreshCw size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />} 
            Export Excel (4 Sheet Lengkap)
          </Button>
        </div>
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Filter size={16} className="text-indigo-600" />
            <span>Filter Data Cerdas (Keyboard Autocomplete ↑ ↓ + Enter)</span>
          </div>
          {(selectedUnit !== 'ALL' || selectedStatus !== 'ALL' || selectedIndikator !== 'ALL' || selectedKegiatan !== 'ALL' || selectedLingkup !== 'ALL' || selectedMaksud !== 'ALL' || selectedYear !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedUnit('ALL');
                setSelectedStatus('ALL');
                setSelectedIndikator('ALL');
                setSelectedKegiatan('ALL');
                setSelectedLingkup('ALL');
                setSelectedMaksud('ALL');
                setSelectedYear('ALL');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
            >
              <RotateCcw size={12} /> Reset Semua Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KeyboardAutocompleteFilter
            label="Unit Kerja"
            icon={<Building2 size={12} className="text-indigo-600" />}
            options={unitOptions}
            selectedValue={selectedUnit}
            onSelect={setSelectedUnit}
            placeholder="Cari unit kerja..."
          />

          <KeyboardAutocompleteFilter
            label="Status Anggaran"
            icon={<CheckCircle2 size={12} className="text-emerald-600" />}
            options={statusOptions}
            selectedValue={selectedStatus}
            onSelect={setSelectedStatus}
            placeholder="Cari status (Wajib, N, Direvisi...)..."
          />

          <KeyboardAutocompleteFilter
            label="Indikator Program"
            icon={<Layers size={12} className="text-blue-600" />}
            options={indikatorOptions}
            selectedValue={selectedIndikator}
            onSelect={setSelectedIndikator}
            placeholder="Cari indikator program..."
          />

          <KeyboardAutocompleteFilter
            label="Kegiatan"
            icon={<BookOpen size={12} className="text-indigo-600" />}
            options={kegiatanOptions}
            selectedValue={selectedKegiatan}
            onSelect={setSelectedKegiatan}
            placeholder="Cari kode / nama kegiatan..."
          />

          <KeyboardAutocompleteFilter
            label="Lingkup Kegiatan"
            icon={<FileText size={12} className="text-amber-600" />}
            options={lingkupOptions}
            selectedValue={selectedLingkup}
            onSelect={setSelectedLingkup}
            placeholder="Cari lingkup kegiatan..."
          />

          <KeyboardAutocompleteFilter
            label="Maksud dan Tujuan"
            icon={<Sparkles size={12} className="text-purple-600" />}
            options={maksudOptions}
            selectedValue={selectedMaksud}
            onSelect={setSelectedMaksud}
            placeholder="Cari maksud dan tujuan..."
          />

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Tahun Anggaran
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-300 text-xs font-semibold bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="ALL">Semua Tahun</option>
              {yearOptions.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Pencarian Teks Bebas
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari kata kunci deskripsi/akun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full pl-8 pr-3 rounded-xl border border-gray-300 text-xs font-semibold bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-3 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3 KPI SUMMARY CARDS WITH PERCENTAGE INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl shadow-md border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-blue-200 flex items-center justify-between">
              <span>Total Anggaran Diajukan (2027)</span>
              <span className="p-1 rounded-lg bg-white/10 text-white">📋</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-black tracking-tight font-mono">
              Rp {formatRp(overallKPI.totalDiajukan)}
            </div>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/15 text-[11px] text-blue-100">
              <span className="font-medium">Akumulasi {filteredBudgets.length} usulan</span>
              <span className="font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white text-[11px]">
                100% Usulan
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-rose-700 text-white rounded-2xl shadow-md border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-amber-100 flex items-center justify-between">
              <span>TOTAL PENYESUAIAN (2027)</span>
              <span className="p-1 rounded-lg bg-white/10 text-white">⚡</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-black tracking-tight font-mono">
              {overallKPI.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(overallKPI.totalPenyesuaian)}
            </div>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/15 text-[11px] text-amber-100">
              <span className="font-medium">Hasil Koreksi / Verif</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                overallKPI.totalPenyesuaian > 0 
                  ? 'bg-emerald-400/30 text-white border border-emerald-300/40' 
                  : overallKPI.totalPenyesuaian < 0 
                  ? 'bg-rose-400/30 text-white border border-rose-300/40' 
                  : 'bg-white/20 text-white'
              }`}>
                {overallKPI.pctPenyesuaian > 0 ? '+' : ''}{overallKPI.pctPenyesuaian.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-600 to-teal-900 text-white rounded-2xl shadow-md border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-emerald-100 flex items-center justify-between">
              <span>TOTAL SETELAH PENYESUAIAN (2027)</span>
              <span className="p-1 rounded-lg bg-white/10 text-white">✅</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-black tracking-tight font-mono">
              Rp {formatRp(overallKPI.totalSetelahPenyesuaian)}
            </div>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/15 text-[11px] text-emerald-100">
              <span className="font-medium">
                {overallKPI.pagu2026 > 0 ? (
                  <span>vs Pagu 2026: <strong className="text-white">{overallKPI.growthVs2026 > 0 ? '+' : ''}{overallKPI.growthVs2026.toFixed(1)}%</strong></span>
                ) : (
                  <span>Total Final Usulan</span>
                )}
              </span>
              <span className="font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white text-[11px]">
                {overallKPI.pctSetelahPenyesuaian.toFixed(1)}% Terakomodir
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VIEW TABS & TOOLBAR SECTION (3 TABS) */}
      {/* VIEW TABS & TOOLBAR SECTION (3 TABS) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 px-6 rounded-2xl shadow-xs border border-gray-200/80 gap-4">
        {/* Left Column: 3 Tab Buttons + Info Count Below */}
        <div className="flex flex-col gap-2.5">
          {/* 3 Tab Switcher Buttons */}
          <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab('unit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'unit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Building2 size={14} />
              <span>🏢 Review per Unit Kerja</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('akun')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'akun'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <PieChart size={14} />
              <span>📊 Summary Rekap per Akun (2 Digit)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('komparasi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'komparasi'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <BarChart3 size={14} />
              <span>⚖️ Komparasi Usulan 2027 vs Pagu 2026</span>
            </button>
          </div>

          {/* Info Count Placed Directly Below the 3 Buttons */}
          <div className="text-xs font-bold text-gray-700 flex items-center gap-2 pl-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
            {activeTab === 'unit' ? (
              <span>Menampilkan <strong>{unitGroupedData.length}</strong> Unit Kerja (<strong>{totalGroupsCount}</strong> Kelompok, <strong>{filteredBudgets.length}</strong> baris detail)</span>
            ) : activeTab === 'akun' ? (
              <span>Menampilkan <strong>{akunGroupedData.length}</strong> Akun Induk (<strong>{totalAkunDetailCount}</strong> Detail Akun, <strong>{filteredBudgets.length}</strong> baris detail)</span>
            ) : (
              <span>Menampilkan <strong>{komparasiGroupedData.length}</strong> Kelompok Organisasi (<strong>{komparasiTotalUnitsCount}</strong> Unit Kerja)</span>
            )}
          </div>
        </div>

        {/* Right Actions Column: Buka/Tutup Detail Button (Top) + Luncuran Switch (Below) */}
        <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto self-start lg:self-center">
          <Button
            onClick={() => handleExpandAll(!isAllExpanded)}
            variant="outline"
            size="sm"
            className={`rounded-xl h-8 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
              isAllExpanded 
                ? 'border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100' 
                : 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
            }`}
          >
            {isAllExpanded ? (
              <>
                <Minus size={13} className="text-rose-600" /> Tutup Semua Detail
              </>
            ) : (
              <>
                <Plus size={13} className="text-indigo-600" /> Buka Semua Detail
              </>
            )}
          </Button>

          {/* Luncuran Switch Option for Tab 3 (Placed directly below Buka/Tutup button) */}
          {activeTab === 'komparasi' && (
            <button 
              type="button"
              onClick={() => setIncludeLuncuran2026(!includeLuncuran2026)}
              className={`group flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                includeLuncuran2026 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`relative inline-flex h-3.5 w-6 shrink-0 rounded-full transition-colors duration-200 ${
                includeLuncuran2026 ? 'bg-indigo-400' : 'bg-gray-200'
              }`}>
                <span className={`inline-block h-2.5 w-2.5 m-0.5 transform rounded-full bg-white transition duration-200 shadow-xs ${
                  includeLuncuran2026 ? 'translate-x-2.5' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-[11px] tracking-tight">
                {includeLuncuran2026 ? '✓ Termasuk Luncuran/Talangan 2026' : 'Tanpa Luncuran/Talangan 2026'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* DETAIL TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500 font-semibold flex flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <span>Memuat data review usulan anggaran...</span>
          </div>
        ) : (activeTab === 'unit' ? unitGroupedData.length === 0 : activeTab === 'akun' ? akunGroupedData.length === 0 : komparasiGroupedData.length === 0) ? (
          <div className="p-16 text-center text-gray-500 font-medium">
            <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-base font-bold text-gray-700">Tidak ada data usulan anggaran yang sesuai filter.</p>
            <p className="text-xs text-gray-400 mt-1">Silakan coba ubah atau reset filter di atas.</p>
          </div>
        ) : activeTab === 'unit' ? (
          /* ======================================================== */
          /* TAB 1: REVIEW PER UNIT KERJA HIERARCHICAL TABLE           */
          /* ======================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1e4b75] text-white font-bold text-[13px] border-b border-[#163a5c]">
                  <th className="px-3 py-3 w-10 text-center text-white/75">#</th>
                  <th className="px-4 py-3 min-w-[380px]">Unit Kerja / Indikator Program (A-Z) / Kegiatan / Lingkup / Maksud dan Tujuan</th>
                  <th className="px-4 py-3 text-right w-40 whitespace-nowrap">Total Anggaran</th>
                  <th className="px-4 py-3 text-right w-36 whitespace-nowrap">Penyesuaian</th>
                  <th className="px-4 py-3 text-right w-44 whitespace-normal break-words leading-tight">Jumlah Biaya Setelah Penyesuaian</th>
                </tr>
              </thead>
              <tbody>
                {unitGroupedData.map((unit, uIdx) => {
                  const isUnitExpanded = expandedUnits[unit.unitName] === true;

                  return (
                    <React.Fragment key={unit.unitName + uIdx}>
                      <tr 
                        onClick={() => toggleUnit(unit.unitName)}
                        className="bg-[#1e3a8a] text-white hover:bg-[#1e40af] border-b-2 border-indigo-950 cursor-pointer transition-colors select-none font-bold"
                      >
                        <td className="px-3 py-3.5 text-center align-middle">
                          <button type="button" className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors">
                            {isUnitExpanded ? <Minus size={13} /> : <Plus size={13} />}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-sm lg:text-base font-black tracking-tight text-white">
                            <Building2 size={18} className="text-amber-400 shrink-0" />
                            <span>{unit.unitName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-indigo-100 border border-white/20">
                              {unit.groups.length} Kelompok ({unit.totalItems} baris)
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold border border-white/20">
                              Usulan: Rp {formatRp(unit.totalUsulan)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold border ${
                              unit.totalPenyesuaian > 0 ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' : unit.totalPenyesuaian < 0 ? 'bg-rose-500/20 text-rose-200 border-rose-400/30' : 'bg-white/10 text-gray-200 border-white/20'
                            }`}>
                              Penyesuaian: {unit.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(unit.totalPenyesuaian)}
                              {unit.totalUsulan > 0 && unit.totalPenyesuaian !== 0 && (
                                <span className="font-mono opacity-90 ml-0.5">({((unit.totalPenyesuaian / unit.totalUsulan) * 100).toFixed(1)}%)</span>
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-200 font-extrabold border border-amber-400/30">
                              Setelah Penyesuaian: Rp {formatRp(unit.totalSetelahPenyesuaian)}
                              {overallKPI.totalSetelahPenyesuaian > 0 && (
                                <span className="text-amber-300 font-black ml-1">({((unit.totalSetelahPenyesuaian / overallKPI.totalSetelahPenyesuaian) * 100).toFixed(1)}% dari Total)</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap align-middle text-sm">
                          Rp {formatRp(unit.totalUsulan)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap align-middle text-sm">
                          <div>{unit.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(unit.totalPenyesuaian)}</div>
                          {unit.totalUsulan > 0 && unit.totalPenyesuaian !== 0 && (
                            <div className={`text-[10px] font-bold mt-0.5 ${unit.totalPenyesuaian > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {((unit.totalPenyesuaian / unit.totalUsulan) * 100).toFixed(1)}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap align-middle text-sm">
                          <div>Rp {formatRp(unit.totalSetelahPenyesuaian)}</div>
                          {overallKPI.totalSetelahPenyesuaian > 0 && (
                            <div className="text-[11px] font-black text-amber-300 bg-black/25 px-2 py-0.5 rounded-md inline-block mt-1 border border-amber-300/30">
                              {((unit.totalSetelahPenyesuaian / overallKPI.totalSetelahPenyesuaian) * 100).toFixed(1)}% dari Total
                            </div>
                          )}
                        </td>
                      </tr>

                      {isUnitExpanded && unit.groups.map((group, gIdx) => {
                        const isGroupExpanded = expandedGroups[group.groupKey] === true;

                        return (
                          <React.Fragment key={group.groupKey + gIdx}>
                            <tr 
                              onClick={() => toggleGroup(group.groupKey)}
                              className="bg-[#f0f7fb] hover:bg-[#e2eff7] border-b border-gray-200 cursor-pointer transition-colors font-medium text-gray-900"
                            >
                              <td className="px-3 py-3 text-center align-top pt-3.5 pl-4">
                                <button type="button" className="w-5 h-5 rounded flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors">
                                  {isGroupExpanded ? <Minus size={12} /> : <Plus size={12} />}
                                </button>
                              </td>
                              <td className="px-4 py-3 space-y-1">
                                <div className="font-bold text-indigo-950 text-xs flex items-start gap-1.5 leading-snug">
                                  <span className="text-blue-600 shrink-0">📑</span>
                                  <span>{group.indikator}</span>
                                </div>
                                <div className="text-gray-800 text-[11px] font-semibold pl-2 border-l-2 border-indigo-400 mt-1 leading-snug">🎯 {group.kegiatan}</div>
                                <div className="text-gray-600 text-[11px] italic pl-2 border-l-2 border-amber-400 mt-0.5 leading-snug">📌 Lingkup: {group.lingkup}</div>
                                <div className="text-gray-500 text-[11px] pl-2 border-l-2 border-emerald-400 mt-0.5 leading-snug">💡 Maksud: {group.maksud}</div>
                                <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-1 border-t border-blue-100/60 text-[10px]">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/80 border border-blue-200/80 font-bold text-blue-900">
                                    Usulan: Rp {formatRp(group.totalUsulan)}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${
                                    group.totalPenyesuaian > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : group.totalPenyesuaian < 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-gray-50 border-gray-200 text-gray-600'
                                  }`}>
                                    Penyesuaian: {group.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(group.totalPenyesuaian)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 font-bold text-indigo-900">
                                    Setelah Penyesuaian: Rp {formatRp(group.totalSetelahPenyesuaian)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">{formatRp(group.totalUsulan)}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">
                                <div>{group.totalPenyesuaian > 0 ? '+' : ''}{formatRp(group.totalPenyesuaian)}</div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">
                                <div>Rp {formatRp(group.totalSetelahPenyesuaian)}</div>
                              </td>
                            </tr>

                            {isGroupExpanded && (
                              <tr>
                                <td colSpan={5} className="p-0 border-b border-gray-300">
                                  <div className="w-full">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="bg-[#1f73a5] text-white font-bold text-[12px] border-y border-[#185c84]">
                                          <th className="px-5 py-2.5 text-left w-2/5 min-w-[280px]">Akun/SBU/Deskripsi;</th>
                                          <th className="px-2 py-2.5 text-center w-10"></th>
                                          <th className="px-4 py-2.5 text-center w-36">Kuantitas</th>
                                          <th className="px-4 py-2.5 text-right w-36">Harga Satuan</th>
                                          <th className="px-4 py-2.5 text-right w-36">Jumlah Biaya</th>
                                          <th className="px-4 py-2.5 text-right w-32">Penyesuaian</th>
                                          <th className="px-4 py-2.5 text-center w-24">Aksi</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200">
                                        {group.items.map((item, itemIdx) => {
                                          const usulanFormula = parsePhpFormula(item.usulan_pagu_indikatif_anggaran_rumus);
                                          const apprFormula = parsePhpFormula(item.approval_pagu_indikatif_anggaran_rumus);
                                          const hasRevisi = !!item.approval_pagu_indikatif_anggaran_rumus;
                                          const cleanNote = getCleanReviewNote(item.ai_reason);
                                          const usulanQty = usulanFormula ? parseFloat(usulanFormula.totalQty) || Number(item.vol) || 1 : Number(item.vol) || 1;
                                          const usulanTarif = (Number(item.total) > 0 && usulanQty > 0) ? (Number(item.total) / usulanQty) : (Number(item.tarif) || 0);

                                          let revisiQty = 0, revisiTotal = 0, revisiPenyesuaian = 0;
                                          if (apprFormula) {
                                            revisiQty = parseFloat(apprFormula.totalQty) || 0;
                                            revisiTotal = revisiQty * (Number(item.tarif) || usulanTarif);
                                            revisiPenyesuaian = revisiTotal - (Number(item.total) || 0);
                                          }

                                          const isWajib = (item.custom_status || '').toLowerCase().includes('wajib') || (item.kunci || '').toUpperCase() === 'Y';

                                          return (
                                            <React.Fragment key={item.id || itemIdx}>
                                              <tr className={`transition-colors ${isWajib ? 'bg-[#fff1f2] hover:bg-[#ffe4e6] border-l-4 border-l-[#f43f5e]' : 'hover:bg-gray-50/70 bg-white'}`}>
                                                <td className="px-5 py-3 align-top">
                                                  {isWajib && (
                                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e11d48] text-white font-extrabold text-[10px] tracking-wider mb-1.5 shadow-xs">
                                                      <ShieldCheck size={11} className="text-rose-200" /> WAJIB ADA
                                                    </div>
                                                  )}
                                                  <div className="font-bold text-gray-900 text-xs">{item.akun || item.komponen_nama}</div>
                                                  <div className="text-[11px] text-gray-500 mt-0.5">{item.tahun ? `${item.tahun}.${item.akun || item.komponen_nama}` : (item.akun || item.komponen_nama)}</div>
                                                  <div className="italic text-[11px] text-gray-600 mt-1 leading-snug">{item.deskripsi}</div>
                                                </td>
                                                <td className={`p-0 text-center align-middle w-10 ${isWajib ? 'bg-[#fecdd3] border-r border-[#fda4af]' : 'bg-[#a8cdf0] border-r border-[#92bbe2]'}`}>
                                                  <div className={`font-bold text-[11px] tracking-widest py-3 [writing-mode:vertical-lr] rotate-180 select-none ${isWajib ? 'text-[#881337]' : 'text-indigo-950'}`}>Usulan</div>
                                                </td>
                                                <td className="px-4 py-3 align-top font-mono text-gray-800">
                                                  {usulanFormula && usulanFormula.lines.length > 0 ? (
                                                    <div className="space-y-0.5">
                                                      {usulanFormula.lines.map((l, lIdx) => (
                                                        <div key={lIdx} className="flex justify-between items-center text-xs">
                                                          <span>{l.text}</span>
                                                          <span className="text-gray-400 pl-2">x</span>
                                                        </div>
                                                      ))}
                                                      <div className="pt-2 font-bold text-xs text-gray-900 border-t border-gray-100 mt-1">{usulanFormula.finalHasil}</div>
                                                    </div>
                                                  ) : (
                                                    <div className="font-bold text-xs">{item.vol} {item.satuan || 'Paket'}</div>
                                                  )}
                                                </td>
                                                <td className="px-4 py-3 align-top text-right font-mono text-gray-800 text-xs font-medium">{formatRp(usulanTarif)}</td>
                                                <td className="px-4 py-3 align-top text-right font-mono font-bold text-gray-900 text-xs">{formatRp(item.total)}</td>
                                                <td className="px-4 py-3 align-top text-right font-mono text-gray-400 text-xs">-</td>
                                                <td className="px-3 py-3 align-top text-center">
                                                  {!hasRevisi ? (
                                                    <Button type="button" onClick={() => handleOpenRevisi(item)} size="sm" variant="outline" className="h-7 px-2.5 text-[11px] rounded-lg border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold shadow-xs">
                                                      <Edit3 size={11} className="mr-1 text-amber-700" /> Direvisi
                                                    </Button>
                                                  ) : <span className="text-gray-300 text-xs">-</span>}
                                                </td>
                                              </tr>

                                              {hasRevisi && apprFormula && (
                                                <>
                                                  <tr className="bg-[#fefce8] hover:bg-[#fef9c3] transition-colors border-l-4 border-l-amber-500 border-t border-amber-200/80">
                                                    <td className="px-5 py-3 align-top">
                                                      <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                                                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                                                        <span>Hasil Penyesuaian / Revisi Anggaran:</span>
                                                      </div>
                                                    </td>
                                                    <td className="p-0 text-center align-middle bg-[#fde047] border-r border-amber-300 w-10">
                                                      <div className="font-bold text-[11px] text-amber-950 tracking-widest py-3 [writing-mode:vertical-lr] rotate-180 select-none">Direvisi</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top font-mono text-gray-800">
                                                      {apprFormula.lines.length > 0 ? (
                                                        <div className="space-y-0.5">
                                                          {apprFormula.lines.map((l, lIdx) => (
                                                            <div key={lIdx} className="flex justify-between items-center text-xs">
                                                              <span>{l.text}</span>
                                                              <span className="text-amber-600 pl-2">x</span>
                                                            </div>
                                                          ))}
                                                          <div className="pt-2 font-bold text-xs text-amber-950 border-t border-amber-200 mt-1">{apprFormula.finalHasil}</div>
                                                        </div>
                                                      ) : (
                                                        <div className="font-bold text-xs text-amber-950">{revisiQty} {item.satuan || 'Paket'}</div>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 align-top text-right font-mono text-xs font-semibold text-amber-950">{formatRp(item.tarif || usulanTarif)}</td>
                                                    <td className="px-4 py-3 align-top text-right font-mono font-bold text-amber-950 text-xs">{formatRp(revisiTotal)}</td>
                                                    <td className="px-4 py-3 align-top text-right font-mono font-bold text-xs">
                                                      <span className={revisiPenyesuaian > 0 ? 'text-emerald-700 font-bold' : revisiPenyesuaian < 0 ? 'text-rose-700 font-bold' : 'text-gray-500'}>
                                                        {revisiPenyesuaian > 0 ? '+' : ''}{formatRp(revisiPenyesuaian)}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-3 align-top text-center">
                                                      <Button type="button" onClick={() => handleOpenRevisi(item)} size="sm" variant="outline" className="h-7 px-2 text-[11px] rounded-lg border-amber-300 text-amber-900 bg-amber-100 hover:bg-amber-200 font-bold shadow-xs">
                                                        <Edit3 size={11} className="mr-1 text-amber-800" /> Edit
                                                      </Button>
                                                    </td>
                                                  </tr>

                                                  {cleanNote && (
                                                    <tr className="bg-[#fef9c3]/70 border-b border-amber-200/80 text-xs">
                                                      <td className="px-5 py-2 text-[11px] text-amber-900 font-bold align-middle">
                                                        <span className="inline-flex items-center gap-1 text-amber-800">
                                                          <MessageSquare size={12} className="text-amber-700" /> Catatan Review:
                                                        </span>
                                                      </td>
                                                      <td className="p-0 bg-[#fde047]/40 border-r border-amber-300"></td>
                                                      <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-amber-950 italic">
                                                        &ldquo;{cleanNote}&rdquo;
                                                      </td>
                                                      <td className="px-3 py-2"></td>
                                                    </tr>
                                                  )}
                                                </>
                                              )}
                                            </React.Fragment>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
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
        ) : activeTab === 'akun' ? (
          /* ======================================================== */
          /* TAB 2: SUMMARY REKAP PER AKUN INDUK (2 DIGIT) TABLE      */
          /* ======================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1e4b75] text-white font-bold text-[13px] border-b border-[#163a5c]">
                  <th className="px-3 py-3 w-10 text-center text-white/75">#</th>
                  <th className="px-4 py-3 min-w-[380px]">Akun Induk (2 Digit) / Detail Akun Lengkap / Unit Kerja Pengusul</th>
                  <th className="px-4 py-3 text-right w-40 whitespace-nowrap">Total Anggaran</th>
                  <th className="px-4 py-3 text-right w-36 whitespace-nowrap">Penyesuaian</th>
                  <th className="px-4 py-3 text-right w-44 whitespace-normal break-words leading-tight">Jumlah Biaya Setelah Penyesuaian</th>
                </tr>
              </thead>
              <tbody>
                {akunGroupedData.map((induk, iIdx) => {
                  const isIndukExpanded = expandedAkunInduk[induk.indukCode] === true;

                  return (
                    <React.Fragment key={induk.indukCode + iIdx}>
                      <tr 
                        onClick={() => toggleAkunInduk(induk.indukCode)}
                        className="bg-[#1e3a8a] text-white hover:bg-[#1e40af] border-b-2 border-indigo-950 cursor-pointer transition-colors select-none font-bold"
                      >
                        <td className="px-3 py-3.5 text-center align-middle">
                          <button type="button" className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors">
                            {isIndukExpanded ? <Minus size={13} /> : <Plus size={13} />}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-sm lg:text-base font-black tracking-tight text-white">
                            <Tag size={18} className="text-amber-400 shrink-0" />
                            <span>{induk.indukLabel}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-indigo-100 border border-white/20">
                              {induk.akuns.length} Sub-Akun ({induk.totalItems} baris usulan)
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold border border-white/20">
                              Usulan: Rp {formatRp(induk.totalUsulan)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold border ${
                              induk.totalPenyesuaian > 0 ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' : induk.totalPenyesuaian < 0 ? 'bg-rose-500/20 text-rose-200 border-rose-400/30' : 'bg-white/10 text-gray-200 border-white/20'
                            }`}>
                              Penyesuaian: {induk.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(induk.totalPenyesuaian)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-200 font-extrabold border border-amber-400/30">
                              Setelah Penyesuaian: Rp {formatRp(induk.totalSetelahPenyesuaian)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap align-middle text-sm">{formatRp(induk.totalUsulan)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap align-middle text-sm">
                          <div>{induk.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(induk.totalPenyesuaian)}</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-white whitespace-nowrap align-middle text-sm">
                          <div>Rp {formatRp(induk.totalSetelahPenyesuaian)}</div>
                        </td>
                      </tr>

                      {isIndukExpanded && induk.akuns.map((detail, dIdx) => {
                        const isDetailExpanded = expandedAkunDetail[detail.akunCode] === true;

                        return (
                          <React.Fragment key={detail.akunCode + dIdx}>
                            <tr 
                              onClick={() => toggleAkunDetail(detail.akunCode)}
                              className="bg-[#f0f9ff] hover:bg-[#e0f2fe] border-b border-sky-200 cursor-pointer transition-colors font-bold text-sky-950"
                            >
                              <td className="px-3 py-3 text-center align-top pt-3.5 pl-4">
                                <button type="button" className="w-5 h-5 rounded flex items-center justify-center bg-sky-200 hover:bg-sky-300 text-sky-900 text-xs font-bold transition-colors">
                                  {isDetailExpanded ? <Minus size={12} /> : <Plus size={12} />}
                                </button>
                              </td>
                              <td className="px-4 py-3 space-y-1">
                                <div className="font-extrabold text-sky-950 text-xs flex items-center gap-1.5">
                                  <Hash size={14} className="text-sky-600 shrink-0" />
                                  <span>{detail.akunCode}</span>
                                  <span className="text-gray-700 font-semibold">- {detail.akunName}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/90 border border-blue-200 text-blue-900 font-bold">Usulan: Rp {formatRp(detail.totalUsulan)}</span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 font-bold text-indigo-900">Setelah Penyesuaian: Rp {formatRp(detail.totalSetelahPenyesuaian)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">{formatRp(detail.totalUsulan)}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">{detail.totalPenyesuaian > 0 ? '+' : ''}{formatRp(detail.totalPenyesuaian)}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">Rp {formatRp(detail.totalSetelahPenyesuaian)}</td>
                            </tr>

                            {isDetailExpanded && detail.units.map((u, uIdx) => {
                              const unitKey = `${detail.akunCode}___${u.unitName}`;
                              const isUnitOpen = expandedAkunUnit[unitKey] === true;

                              return (
                                <React.Fragment key={unitKey + uIdx}>
                                  <tr 
                                    onClick={() => toggleAkunUnit(unitKey)}
                                    className="bg-white hover:bg-slate-50 border-b border-gray-200 cursor-pointer transition-colors text-gray-800"
                                  >
                                    <td className="px-3 py-2.5 text-center align-middle pl-8">
                                      <button type="button" className="w-4 h-4 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold transition-colors">
                                        {isUnitOpen ? <Minus size={10} /> : <Plus size={10} />}
                                      </button>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                                        <Building2 size={13} className="text-indigo-600 shrink-0" />
                                        <span>{u.unitName}</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 border border-gray-200">{u.items.length} usulan</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-700">{formatRp(u.totalUsulan)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-gray-700">{u.totalPenyesuaian > 0 ? '+' : ''}{formatRp(u.totalPenyesuaian)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-gray-900">Rp {formatRp(u.totalSetelahPenyesuaian)}</td>
                                  </tr>
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* TAB 3: KOMPARASI PENGAJUAN ANGGARAN 2027 VS PAGU ANGGARAN 2026 (GROUPED)   */
          /* ========================================================================= */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1e4b75] text-white font-bold text-[12px] border-b border-[#163a5c]">
                  <th rowSpan={2} className="px-3 py-3 w-10 text-center text-white/75 border-r border-[#163a5c]">#</th>
                  <th rowSpan={2} className="px-4 py-3 min-w-[320px] border-r border-[#163a5c]">Kelompok Organisasi & Nama Unit Kerja</th>
                  <th className="px-4 py-2 text-center bg-[#153450] border-r border-[#163a5c]">Pagu Anggaran 2026</th>
                  <th colSpan={3} className="px-4 py-2 text-center bg-[#1e40af] border-r border-[#163a5c]">Pengajuan Anggaran Tahun 2027</th>
                  <th colSpan={2} className="px-4 py-2 text-center bg-[#065f46]">Perbandingan (2027 vs 2026)</th>
                </tr>
                <tr className="bg-[#163a5c] text-white font-semibold text-[11px] border-b border-[#0f273e]">
                  <th className="px-4 py-2 text-right w-36 border-r border-[#0f273e] bg-[#153450]">Total Pagu 2026</th>
                  <th className="px-3.5 py-2 text-right w-36 border-r border-[#0f273e] bg-[#1e40af]/80">Total Anggaran</th>
                  <th className="px-3.5 py-2 text-right w-32 border-r border-[#0f273e] bg-[#1e40af]/80">Penyesuaian</th>
                  <th className="px-4 py-2 text-right w-40 border-r border-[#0f273e] bg-[#1e40af]">Setelah Penyesuaian</th>
                  <th className="px-3.5 py-2 text-right w-36 border-r border-[#0f273e] bg-[#065f46]/90">Selisih Nominal</th>
                  <th className="px-3.5 py-2 text-center w-28 bg-[#065f46]">Pertumbuhan</th>
                </tr>
              </thead>
              <tbody>
                {komparasiGroupedData.map((grp, gIdx) => {
                  const isGroupExpanded = expandedKompGroups[grp.groupOrg] === true;

                  return (
                    <React.Fragment key={grp.groupOrg + gIdx}>
                      {/* LEVEL 1: GROUP_ORG HEADER ROW */}
                      <tr 
                        onClick={() => toggleKompGroup(grp.groupOrg)}
                        className="bg-[#1e3a8a] text-white hover:bg-[#1e40af] border-b-2 border-indigo-950 cursor-pointer transition-colors font-bold select-none"
                      >
                        <td className="px-3 py-3.5 text-center align-middle">
                          <button type="button" className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors">
                            {isGroupExpanded ? <Minus size={13} /> : <Plus size={13} />}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-sm font-black text-white">
                            <Layers size={16} className="text-amber-400 shrink-0" />
                            <span>{grp.groupOrg}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-indigo-100 border border-white/20">
                              {grp.units.length} Unit Kerja
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-sm text-slate-200">
                          Rp {formatRp(grp.pagu2026Total)}
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono text-sm text-indigo-100">
                          Rp {formatRp(grp.totalUsulan2027)}
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono text-sm font-bold">
                          <span className={grp.totalPenyesuaian2027 > 0 ? 'text-emerald-300' : grp.totalPenyesuaian2027 < 0 ? 'text-rose-300' : 'text-gray-300'}>
                            {grp.totalPenyesuaian2027 > 0 ? '+' : ''}{formatRp(grp.totalPenyesuaian2027)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-sm font-black text-amber-300">
                          Rp {formatRp(grp.totalSetelahPenyesuaian2027)}
                        </td>
                        <td className="px-3.5 py-3.5 text-right font-mono text-sm font-black">
                          <span className={grp.selisih > 0 ? 'text-emerald-300' : grp.selisih < 0 ? 'text-rose-300' : 'text-gray-300'}>
                            {grp.selisih > 0 ? '+' : ''}{formatRp(grp.selisih)}
                          </span>
                        </td>
                        <td className="px-3.5 py-3.5 text-center font-bold text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                            grp.growth > 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : grp.growth < 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {grp.growth > 0 ? '+' : ''}{grp.growth.toFixed(1)}%
                          </span>
                        </td>
                      </tr>

                      {/* LEVEL 2: UNIT ROWS UNDER GROUP_ORG */}
                      {isGroupExpanded && grp.units.map((u, uIdx) => {
                        const isUnitExpanded = expandedKompUnits[u.unitName] === true;

                        return (
                          <React.Fragment key={u.unitName + uIdx}>
                            <tr 
                              onClick={() => toggleKompUnit(u.unitName)}
                              className="bg-white hover:bg-indigo-50/40 border-b border-gray-200 cursor-pointer transition-colors text-gray-800"
                            >
                              <td className="px-3 py-3 text-center align-middle pl-6 text-gray-400">
                                <button type="button" className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors">
                                  {isUnitExpanded ? <Minus size={11} /> : <Plus size={11} />}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-gray-900 text-xs flex flex-wrap items-center gap-1.5">
                                  <Building2 size={13} className="text-indigo-600 shrink-0" />
                                  <span>{u.unitName}</span>
                                  {u.statusTag === 'BELUM_USULAN' && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                      ⚠️ Belum Ada Usulan 2027
                                    </span>
                                  )}
                                </div>
                                {u.kodeUnit && (
                                  <div className="text-[10px] text-gray-400 font-mono pl-4 mt-0.5">{u.kodeUnit}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs font-medium text-slate-700 bg-slate-50/50">
                                Rp {formatRp(u.pagu2026Total)}
                              </td>
                              <td className="px-3.5 py-3 text-right font-mono text-xs text-gray-700">
                                Rp {formatRp(u.totalUsulan2027)}
                              </td>
                              <td className="px-3.5 py-3 text-right font-mono text-xs font-semibold">
                                <span className={u.totalPenyesuaian2027 > 0 ? 'text-emerald-600' : u.totalPenyesuaian2027 < 0 ? 'text-rose-600' : 'text-gray-400'}>
                                  {u.totalPenyesuaian2027 > 0 ? '+' : ''}{formatRp(u.totalPenyesuaian2027)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-xs font-bold text-indigo-950 bg-indigo-50/30">
                                Rp {formatRp(u.totalSetelahPenyesuaian2027)}
                              </td>
                              <td className="px-3.5 py-3 text-right font-mono text-xs font-bold">
                                <span className={u.selisih > 0 ? 'text-emerald-600' : u.selisih < 0 ? 'text-rose-600' : 'text-gray-500'}>
                                  {u.selisih > 0 ? '+' : ''}{formatRp(u.selisih)}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 text-center">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                  u.growth > 0 ? 'bg-emerald-100 text-emerald-800' : u.growth < 0 ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {u.growth > 0 ? '+' : ''}{u.growth.toFixed(1)}%
                                </span>
                              </td>
                            </tr>

                            {/* Breakdown Sub-Row for 2026 Pagu Components */}
                            {isUnitExpanded && (
                              <tr>
                                <td colSpan={8} className="p-0 border-b border-gray-300">
                                  <div className="bg-slate-50 p-4 pl-12 space-y-3">
                                    <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                      <Landmark size={14} className="text-indigo-600" />
                                      <span>Rincian Komponen Pagu 2026 vs Usulan 2027 ({u.unitName})</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs">
                                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Pagu Awal 2026</div>
                                        <div className="font-mono font-bold text-slate-900 mt-0.5">Rp {formatRp(u.pagu2026Awal)}</div>
                                      </div>
                                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Inisiatif 2026</div>
                                        <div className="font-mono font-bold text-emerald-700 mt-0.5">+Rp {formatRp(u.pagu2026Inisiatif)}</div>
                                      </div>
                                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Penugasan 2026</div>
                                        <div className="font-mono font-bold text-emerald-700 mt-0.5">+Rp {formatRp(u.pagu2026Penugasan)}</div>
                                      </div>
                                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Efisiensi 2026</div>
                                        <div className="font-mono font-bold text-rose-600 mt-0.5">Rp {formatRp(u.pagu2026Efisiensi)}</div>
                                      </div>
                                      <div className="p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-200">
                                        <div className="text-[10px] text-cyan-800 font-bold uppercase">Luncuran/Talangan</div>
                                        <div className="font-mono font-bold text-cyan-950 mt-0.5">+Rp {formatRp(u.pagu2026Luncuran)}</div>
                                      </div>
                                      <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200">
                                        <div className="text-[10px] text-indigo-800 font-bold uppercase">Total Pagu 2026</div>
                                        <div className="font-mono font-bold text-indigo-950 mt-0.5">Rp {formatRp(u.pagu2026Total)}</div>
                                      </div>
                                      <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                                        <div className="text-[10px] text-emerald-800 font-bold uppercase">Setelah Review 2027</div>
                                        <div className="font-mono font-bold text-emerald-950 mt-0.5">Rp {formatRp(u.totalSetelahPenyesuaian2027)}</div>
                                      </div>
                                    </div>
                                  </div>
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
              <tfoot className="bg-gray-100 text-gray-900 font-bold border-t-2 border-gray-300">
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-right uppercase tracking-wider text-xs">
                    TOTAL KESELURUHAN
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm text-slate-900 bg-slate-200/50">
                    Rp {formatRp(komparasiGrandTotals.pagu2026)}
                  </td>
                  <td className="px-3.5 py-4 text-right font-mono text-sm text-gray-900">
                    Rp {formatRp(komparasiGrandTotals.usulan2027)}
                  </td>
                  <td className="px-3.5 py-4 text-right font-mono text-sm">
                    <span className={komparasiGrandTotals.penyesuaian2027 > 0 ? 'text-emerald-700' : komparasiGrandTotals.penyesuaian2027 < 0 ? 'text-rose-700' : ''}>
                      {komparasiGrandTotals.penyesuaian2027 > 0 ? '+' : ''}{formatRp(komparasiGrandTotals.penyesuaian2027)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-sm text-indigo-950 bg-indigo-100/50">
                    Rp {formatRp(komparasiGrandTotals.setelahPenyesuaian2027)}
                  </td>
                  <td className="px-3.5 py-4 text-right font-mono text-sm">
                    <span className={komparasiGrandTotals.selisih > 0 ? 'text-emerald-700' : komparasiGrandTotals.selisih < 0 ? 'text-rose-700' : ''}>
                      {komparasiGrandTotals.selisih > 0 ? '+' : ''}{formatRp(komparasiGrandTotals.selisih)}
                    </span>
                  </td>
                  <td className="px-3.5 py-4 text-center text-xs font-black">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                      komparasiGrandTotals.growth > 0 ? 'bg-emerald-100 text-emerald-800' : komparasiGrandTotals.growth < 0 ? 'bg-rose-100 text-rose-800' : ''
                    }`}>
                      {komparasiGrandTotals.growth > 0 ? '+' : ''}{komparasiGrandTotals.growth.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* DIALOG FORMULIR PENYESUAIAN ANGGARAN (DIREVISI) */}
      <Dialog open={!!revisiDialogItem} onOpenChange={(open) => !open && setRevisiDialogItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-0 shadow-2xl">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-200 uppercase tracking-widest mb-1">
              <Edit3 size={14} /> Formulir Penyesuaian Anggaran (Direvisi)
            </div>
            <DialogTitle className="text-xl font-bold text-white leading-snug">
              {revisiDialogItem?.akun || revisiDialogItem?.komponen_nama}
            </DialogTitle>
            <DialogDescription className="text-amber-100 text-xs line-clamp-2 mt-1">
              {revisiDialogItem?.deskripsi || 'Sesuaikan kuantitas rumus (perhitungan multi-baris), tarif, atau status anggaran.'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Unit Kerja</div>
                <div className="font-bold text-gray-900 truncate">{revisiDialogItem?.unitkerja_nama || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Tahun Anggaran</div>
                <div className="font-bold text-gray-900">{revisiDialogItem?.tahun || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Usulan Awal</div>
                <div className="font-bold text-gray-900 font-mono">Rp {formatRp(revisiDialogItem?.total)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Status Saat Ini</div>
                <Badge className="bg-amber-600 text-white text-[10px] mt-0.5">
                  {revisiDialogItem?.custom_status || (revisiDialogItem?.kunci === 'Y' ? 'Wajib' : 'Normal')}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Rumus Perhitungan Kuantitas (Series Multi-Baris)</span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">5 Baris Perkalian</span>
                </label>
                <div className="text-xs font-bold text-gray-600">
                  Total Qty: <span className="font-mono text-indigo-700 font-black">{revisiCalculations.totalQty} {revisiCalculations.finalUnit}</span>
                </div>
              </div>

              <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                {revisiForm.calcs.map((calc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-bold text-gray-400">#{idx + 1}</span>
                    <input
                      type="number"
                      step="any"
                      placeholder={`Nilai ${idx + 1}`}
                      value={calc}
                      onChange={(e) => {
                        const newCalcs = [...revisiForm.calcs];
                        newCalcs[idx] = e.target.value;
                        setRevisiForm({ ...revisiForm, calcs: newCalcs });
                      }}
                      className="w-28 h-9 px-3 rounded-xl border border-gray-300 text-xs font-mono font-bold bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder={`Satuan ${idx + 1} (cth: Orang, Bulan, Hari...)`}
                      value={revisiForm.units[idx] || ''}
                      onChange={(e) => {
                        const newUnits = [...revisiForm.units];
                        newUnits[idx] = e.target.value;
                        setRevisiForm({ ...revisiForm, units: newUnits });
                      }}
                      className="flex-1 h-9 px-3 rounded-xl border border-gray-300 text-xs font-medium bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    {idx < 4 && <span className="text-gray-400 font-bold text-sm">×</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Harga Satuan (Tarif Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">Rp</span>
                  <input
                    type="number"
                    value={revisiForm.tarif}
                    onChange={(e) => setRevisiForm({ ...revisiForm, tarif: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 pl-10 pr-3 rounded-xl border border-gray-300 text-xs font-mono font-bold bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ubah Status Custom</label>
                <select
                  value={revisiForm.customStatus}
                  onChange={(e) => setRevisiForm({ ...revisiForm, customStatus: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Direvisi">Direvisi</option>
                  <option value="Wajib">Wajib Ada</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Ditolak">Ditolak</option>
                  <option value="N">N (Normal / Tidak Wajib)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Catatan / Alasan Penyesuaian</label>
              <textarea
                rows={2}
                placeholder="Tuliskan catatan atau rekomendasi hasil review anggaran..."
                value={revisiForm.keterangan}
                onChange={(e) => setRevisiForm({ ...revisiForm, keterangan: e.target.value })}
                className="w-full p-3 rounded-xl border border-gray-300 text-xs bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-medium"
              />
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Total Biaya Baru</div>
                <div className="text-base font-black text-amber-950 font-mono mt-0.5">Rp {formatRp(revisiCalculations.totalBiaya)}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Selisih Penyesuaian</div>
                <div className={`text-base font-black font-mono mt-0.5 ${revisiCalculations.penyesuaian > 0 ? 'text-emerald-600' : revisiCalculations.penyesuaian < 0 ? 'text-rose-600' : 'text-gray-600'}`}>
                  {revisiCalculations.penyesuaian > 0 ? '+' : ''}Rp {formatRp(revisiCalculations.penyesuaian)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Satuan Akhir</div>
                <div className="text-sm font-bold text-gray-800 truncate mt-0.5">{revisiCalculations.finalUnit}</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
            {revisiDialogItem?.approval_pagu_indikatif_anggaran_rumus ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetRevisi}
                disabled={isSavingRevisi}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold rounded-xl"
              >
                Hapus Penyesuaian
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevisiDialogItem(null)}
                disabled={isSavingRevisi}
                className="rounded-xl text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveRevisi}
                disabled={isSavingRevisi}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm text-xs"
              >
                {isSavingRevisi ? (
                  <>
                    <RefreshCw size={12} className="mr-1.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={12} className="mr-1.5" /> Simpan Penyesuaian
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
