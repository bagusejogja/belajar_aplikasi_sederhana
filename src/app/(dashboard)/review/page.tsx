'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, Filter, Search, ChevronDown, ChevronRight, 
  ChevronUp, RotateCcw, Download, Sparkles, Edit3, CheckCircle2, 
  AlertCircle, Building2, Layers, BookOpen, FileText, ArrowRight,
  Plus, Minus, X, Save, RefreshCw, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

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

// --- GENERIC AUTOCOMPLETE COMPONENT (WITH ARROW UP/DOWN & ENTER) ---
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
  const [loading, setLoading] = useState(true);

  // --- FILTERS (REQUIREMENT 1) ---
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedIndikator, setSelectedIndikator] = useState('ALL');
  const [selectedKegiatan, setSelectedKegiatan] = useState('ALL');
  const [selectedLingkup, setSelectedLingkup] = useState('ALL');
  const [selectedMaksud, setSelectedMaksud] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Expand / Collapse State (Posisi default: SEMUA TERTUTUP)
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
      const res = await fetch('/api/budgets/list');
      const json = await res.json();
      if (json.success) {
        setBudgets(json.data || []);
      }
    } catch (e) {
      toast.error('Gagal memuat data anggaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  // Scoped budgets based on Unit Kerja and Year (if selected)
  const scopedBudgetsForFilters = useMemo(() => {
    return budgets.filter(b => {
      if (selectedUnit !== 'ALL' && b.unitkerja_nama !== selectedUnit) return false;
      if (selectedYear !== 'ALL' && String(b.tahun) !== String(selectedYear)) return false;
      return true;
    });
  }, [budgets, selectedUnit, selectedYear]);

  // Filter Options Extraction (Cascading & Focused)
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
    return Array.from(new Set(scopedBudgetsForFilters.map(b => b.kode_nama_indikator).filter(Boolean))).sort() as string[];
  }, [scopedBudgetsForFilters]);

  const kegiatanOptions = useMemo(() => {
    const list = selectedIndikator !== 'ALL'
      ? scopedBudgetsForFilters.filter(b => b.kode_nama_indikator === selectedIndikator)
      : scopedBudgetsForFilters;
    return Array.from(new Set(list.map(b => b.kode_nama_kegiatan).filter(Boolean))).sort() as string[];
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

  // Auto-reset child filters if their current value is no longer in scoped options
  useEffect(() => {
    if (selectedStatus !== 'ALL' && !statusOptions.includes(selectedStatus)) {
      setSelectedStatus('ALL');
    }
  }, [statusOptions, selectedStatus]);

  useEffect(() => {
    if (selectedIndikator !== 'ALL' && !indikatorOptions.includes(selectedIndikator)) {
      setSelectedIndikator('ALL');
    }
  }, [indikatorOptions, selectedIndikator]);

  useEffect(() => {
    if (selectedKegiatan !== 'ALL' && !kegiatanOptions.includes(selectedKegiatan)) {
      setSelectedKegiatan('ALL');
    }
  }, [kegiatanOptions, selectedKegiatan]);

  useEffect(() => {
    if (selectedLingkup !== 'ALL' && !lingkupOptions.includes(selectedLingkup)) {
      setSelectedLingkup('ALL');
    }
  }, [lingkupOptions, selectedLingkup]);

  useEffect(() => {
    if (selectedMaksud !== 'ALL' && !maksudOptions.includes(selectedMaksud)) {
      setSelectedMaksud('ALL');
    }
  }, [maksudOptions, selectedMaksud]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedUnit('ALL');
    setSelectedStatus('ALL');
    setSelectedIndikator('ALL');
    setSelectedKegiatan('ALL');
    setSelectedLingkup('ALL');
    setSelectedMaksud('ALL');
    setSelectedYear('ALL');
    setSearchTerm('');
  };

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

  // Calculate Groupings: LEVEL 1 (UNIT KERJA) -> LEVEL 2 (INDIKATOR / KEGIATAN KELOMPOK)
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

      // Check if item has approval formula (penyesuaian)
      let penyesuaianItem = 0;
      if (b.approval_pagu_indikatif_anggaran_rumus) {
        const parsedAppr = parsePhpFormula(b.approval_pagu_indikatif_anggaran_rumus);
        if (parsedAppr) {
          const qtyAppr = parseFloat(parsedAppr.totalQty) || 0;
          const tarif = Number(b.tarif) || 0;
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
      groups: Array.from(u.groupMap.values()),
      totalItems: u.totalItems,
      totalUsulan: u.totalUsulan,
      totalPenyesuaian: u.totalPenyesuaian,
      totalSetelahPenyesuaian: u.totalSetelahPenyesuaian
    }));
  }, [filteredBudgets]);

  const totalGroupsCount = useMemo(() => {
    return unitGroupedData.reduce((acc, u) => acc + u.groups.length, 0);
  }, [unitGroupedData]);

  // Overall KPI Cards (REQUIREMENT 2)
  const overallKPI = useMemo(() => {
    let totalDiajukan = 0;
    let totalPenyesuaian = 0;

    unitGroupedData.forEach(u => {
      totalDiajukan += u.totalUsulan;
      totalPenyesuaian += u.totalPenyesuaian;
    });

    const totalSetelahPenyesuaian = totalDiajukan + totalPenyesuaian;

    return {
      totalDiajukan,
      totalPenyesuaian,
      totalSetelahPenyesuaian
    };
  }, [unitGroupedData]);

  // Toggle unit and group
  const toggleUnit = (unitName: string) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitName]: !prev[unitName]
    }));
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandAll = (expanded: boolean) => {
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
  };

  const formatRp = (num: any) => {
    if (num === null || num === undefined || isNaN(Number(num))) return '0';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(num));
  };

  // Open Revision Modal for an item
  const handleOpenRevisi = (item: any) => {
    setRevisiDialogItem(item);
    
    // If item already has approval formula, parse it; otherwise copy from usulan formula
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

    setRevisiForm({
      calcs: initCalcs,
      units: initUnits,
      tarif: Number(item.tarif) || 0,
      keterangan: item.ai_reason || '',
      customStatus: item.custom_status || 'Direvisi'
    });
  };

  // Reset / Delete Revision
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

    return {
      totalQty,
      totalBiaya,
      penyesuaian,
      finalUnit
    };
  }, [revisiForm, revisiDialogItem]);

  // Save Revision to Database
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
        
        // Update local state
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

  // Export to Excel
  const handleExportExcel = () => {
    const rows: any[] = [
      ['LAPORAN REVIEW USULAN ANGGARAN'],
      [`Filter Unit Kerja: ${selectedUnit} | Status: ${selectedStatus} | Tahun: ${selectedYear}`],
      [],
      [
        'Indikator Program',
        'Kegiatan',
        'Lingkup Kegiatan',
        'Maksud dan Tujuan',
        'Akun / Komponen',
        'Deskripsi',
        'Tipe',
        'Kuantitas (Rumus)',
        'Hasil Kuantitas',
        'Harga Satuan',
        'Jumlah Biaya',
        'Penyesuaian',
        'Keterangan Review'
      ]
    ];

    unitGroupedData.forEach(u => {
      u.groups.forEach(grp => {
        grp.items.forEach(item => {
          const usulanParsed = parsePhpFormula(item.usulan_pagu_indikatif_anggaran_rumus);
          const apprParsed = parsePhpFormula(item.approval_pagu_indikatif_anggaran_rumus);

          // Usulan Row
          rows.push([
            grp.indikator,
            grp.kegiatan,
            grp.lingkup,
            grp.maksud,
            item.akun || item.komponen_nama,
            item.deskripsi,
            'Usulan',
            usulanParsed ? usulanParsed.lines.map(l => l.text).join(' x ') : `${item.vol} ${item.satuan}`,
            usulanParsed ? usulanParsed.finalHasil : item.vol,
            item.tarif,
            item.total,
            0,
            item.ai_reason || ''
          ]);

          // Direvisi Row if exists
          if (apprParsed) {
            const qtyAppr = parseFloat(apprParsed.totalQty) || 0;
            const totalAppr = qtyAppr * (Number(item.tarif) || 0);
            const penyesuaian = totalAppr - (Number(item.total) || 0);

            rows.push([
              grp.indikator,
              grp.kegiatan,
              grp.lingkup,
              grp.maksud,
              item.akun || item.komponen_nama,
              item.deskripsi,
              'Direvisi',
              apprParsed.lines.map(l => l.text).join(' x '),
              apprParsed.finalHasil,
              item.tarif,
              totalAppr,
              penyesuaian,
              item.ai_reason || ''
            ]);
          }
        });
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Review Anggaran');
    XLSX.writeFile(workbook, `Review_Anggaran_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Excel berhasil diunduh!');
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-900">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <CheckSquare size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Review Usulan Anggaran</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Evaluasi detail hierarkis Indikator, Kegiatan, Akun, dan Penyesuaian Anggaran
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            size="sm"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-9 font-bold shadow-sm"
          >
            <Download size={14} className="mr-1.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* FILTER BAR SECTION (REQUIREMENT 1) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <Filter size={16} className="text-indigo-600" />
            <span>Filter Data Cerdas (Keyboard Autocomplete ↑ ↓ + Enter)</span>
          </div>
          {(selectedUnit !== 'ALL' || selectedStatus !== 'ALL' || selectedIndikator !== 'ALL' || selectedKegiatan !== 'ALL' || selectedLingkup !== 'ALL' || selectedMaksud !== 'ALL' || selectedYear !== 'ALL' || searchTerm) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
            >
              <RotateCcw size={12} /> Reset Semua Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* 1. Unit Kerja */}
          <KeyboardAutocompleteFilter
            label="Unit Kerja"
            icon={<Building2 size={12} className="text-indigo-600" />}
            options={unitOptions}
            selectedValue={selectedUnit}
            onSelect={setSelectedUnit}
            placeholder="Cari unit kerja..."
          />

          {/* 2. Status Anggaran */}
          <KeyboardAutocompleteFilter
            label="Status Anggaran"
            icon={<CheckCircle2 size={12} className="text-emerald-600" />}
            options={statusOptions}
            selectedValue={selectedStatus}
            onSelect={setSelectedStatus}
            placeholder="Cari status (Wajib, N, Direvisi...)..."
          />

          {/* 3. Indikator Program */}
          <KeyboardAutocompleteFilter
            label="Indikator Program"
            icon={<Layers size={12} className="text-blue-600" />}
            options={indikatorOptions}
            selectedValue={selectedIndikator}
            onSelect={setSelectedIndikator}
            placeholder="Cari indikator program..."
          />

          {/* 4. Kegiatan */}
          <KeyboardAutocompleteFilter
            label="Kegiatan"
            icon={<BookOpen size={12} className="text-indigo-600" />}
            options={kegiatanOptions}
            selectedValue={selectedKegiatan}
            onSelect={setSelectedKegiatan}
            placeholder="Cari kode / nama kegiatan..."
          />

          {/* 5. Lingkup Kegiatan */}
          <KeyboardAutocompleteFilter
            label="Lingkup Kegiatan"
            icon={<FileText size={12} className="text-amber-600" />}
            options={lingkupOptions}
            selectedValue={selectedLingkup}
            onSelect={setSelectedLingkup}
            placeholder="Cari lingkup kegiatan..."
          />

          {/* 6. Maksud dan Tujuan */}
          <KeyboardAutocompleteFilter
            label="Maksud dan Tujuan"
            icon={<Sparkles size={12} className="text-purple-600" />}
            options={maksudOptions}
            selectedValue={selectedMaksud}
            onSelect={setSelectedMaksud}
            placeholder="Cari maksud dan tujuan..."
          />

          {/* 7. Tahun */}
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

          {/* 8. Pencarian Cepat */}
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

      {/* 3 KPI SUMMARY CARDS (REQUIREMENT 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Anggaran Diajukan */}
        <Card className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl shadow-md border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-blue-200 flex items-center justify-between">
              <span>Total Anggaran Diajukan</span>
              <span className="p-1 rounded-lg bg-white/10 text-white">📋</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-black tracking-tight font-mono">
              Rp {formatRp(overallKPI.totalDiajukan)}
            </div>
            <p className="text-[11px] text-blue-200/80 mt-1 font-medium">
              Akumulasi usulan awal dari {filteredBudgets.length} baris anggaran
            </p>
          </CardContent>
        </Card>

        {/* Card 2: TOTAL PENYESUAIAN */}
        <Card className="bg-gradient-to-br from-amber-500 to-rose-700 text-white rounded-2xl shadow-md border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-amber-100 flex items-center justify-between">
              <span>TOTAL PENYESUAIAN</span>
              <span className="p-1 rounded-lg bg-white/10 text-white">⚡</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-black tracking-tight font-mono">
              {overallKPI.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(overallKPI.totalPenyesuaian)}
            </div>
            <p className="text-[11px] text-amber-100/80 mt-1 font-medium">
              Selisih nominal penyesuaian hasil review
            </p>
          </CardContent>
        </Card>

        {/* Card 3: TOTAL SETELAH PENYESUAIAN */}
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-900 text-white rounded-2xl shadow-md border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-emerald-100 flex items-center justify-between">
              <span>TOTAL SETELAH PENYESUAIAN</span>
              <span className="p-1 rounded-lg bg-white/10 text-white">✅</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl lg:text-3xl font-black tracking-tight font-mono">
              Rp {formatRp(overallKPI.totalSetelahPenyesuaian)}
            </div>
            <p className="text-[11px] text-emerald-100/80 mt-1 font-medium">
              Total pagu akhir setelah penelaahan disetujui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ACTION TOOLBAR (AFTER CARDS) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80 gap-3">
        <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span>Menampilkan <strong>{unitGroupedData.length}</strong> Unit Kerja (<strong>{totalGroupsCount}</strong> Kelompok Usulan, <strong>{filteredBudgets.length}</strong> baris detail)</span>
        </div>

        <div className="flex items-center gap-2">
          {(() => {
            const isAllExpanded = unitGroupedData.length > 0 && unitGroupedData.every(u => expandedUnits[u.unitName]);
            return (
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
                    <Minus size={13} className="text-rose-600" /> Tutup Semua Unit & Detail
                  </>
                ) : (
                  <>
                    <Plus size={13} className="text-indigo-600" /> Buka Semua Unit & Detail
                  </>
                )}
              </Button>
            );
          })()}
        </div>
      </div>

      {/* DETAIL TABLE SECTION (MATCHING SCREENSHOT) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500 font-semibold flex flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600" />
            <span>Memuat data review usulan anggaran...</span>
          </div>
        ) : unitGroupedData.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-medium">
            <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-base font-bold text-gray-700">Tidak ada data usulan anggaran yang sesuai filter.</p>
            <p className="text-xs text-gray-400 mt-1">Silakan coba ubah atau reset filter di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              
              {/* PRIMARY TABLE HEADER */}
              <thead>
                <tr className="bg-[#1e4b75] text-white font-bold text-[13px] border-b border-[#163a5c]">
                  <th className="px-3 py-3 w-10 text-center text-white/75">
                    #
                  </th>
                  <th className="px-4 py-3 min-w-[380px]">
                    Unit Kerja / Indikator Program / Kegiatan / Lingkup / Maksud dan Tujuan
                  </th>
                  <th className="px-4 py-3 text-right w-40 whitespace-nowrap">Total Anggaran</th>
                  <th className="px-4 py-3 text-right w-36 whitespace-nowrap">Penyesuaian</th>
                  <th className="px-4 py-3 text-right w-44 whitespace-normal break-words leading-tight">
                    Jumlah Biaya Setelah Penyesuaian
                  </th>
                </tr>
              </thead>

              <tbody>
                {unitGroupedData.map((unit, uIdx) => {
                  const isUnitExpanded = expandedUnits[unit.unitName] === true;

                  return (
                    <React.Fragment key={unit.unitName + uIdx}>
                      
                      {/* LEVEL 1: UNIT KERJA GROUP HEADER ROW (DEFAULT CLOSED) */}
                      <tr 
                        onClick={() => toggleUnit(unit.unitName)}
                        className="bg-[#1e3a8a] text-white hover:bg-[#1e40af] border-b-2 border-indigo-950 cursor-pointer transition-colors select-none font-bold"
                      >
                        <td className="px-3 py-3.5 text-center align-middle">
                          <button 
                            type="button" 
                            className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors"
                          >
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

                          {/* MINI METRICS FOR UNIT KERJA */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 text-white font-bold border border-white/20">
                              Usulan: Rp {formatRp(unit.totalUsulan)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold border ${
                              unit.totalPenyesuaian > 0
                                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                                : unit.totalPenyesuaian < 0
                                ? 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                                : 'bg-white/10 text-gray-200 border-white/20'
                            }`}>
                              Penyesuaian: {unit.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(unit.totalPenyesuaian)}
                              {unit.totalUsulan > 0 && unit.totalPenyesuaian !== 0 && (
                                <span className="font-mono opacity-90 ml-0.5">
                                  ({((unit.totalPenyesuaian / unit.totalUsulan) * 100).toFixed(1)}%)
                                </span>
                              )}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-200 font-extrabold border border-amber-400/30">
                              Setelah Penyesuaian: Rp {formatRp(unit.totalSetelahPenyesuaian)}
                              {overallKPI.totalSetelahPenyesuaian > 0 && (
                                <span className="text-amber-300 font-black ml-1">
                                  ({((unit.totalSetelahPenyesuaian / overallKPI.totalSetelahPenyesuaian) * 100).toFixed(1)}% dari Total Seluruh Unit)
                                </span>
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

                      {/* LEVEL 2: INDIKATOR / KEGIATAN KELOMPOK (RENDERED WHEN UNIT IS EXPANDED) */}
                      {isUnitExpanded && unit.groups.map((group, gIdx) => {
                        const isGroupExpanded = expandedGroups[group.groupKey] === true;

                        return (
                          <React.Fragment key={group.groupKey + gIdx}>
                            
                            {/* GROUP HEADER ROW */}
                            <tr 
                              onClick={() => toggleGroup(group.groupKey)}
                              className="bg-[#f0f7fb] hover:bg-[#e2eff7] border-b border-gray-200 cursor-pointer transition-colors font-medium text-gray-900"
                            >
                              <td className="px-3 py-3 text-center align-top pt-3.5 pl-4">
                                <button 
                                  type="button" 
                                  className="w-5 h-5 rounded flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition-colors"
                                >
                                  {isGroupExpanded ? <Minus size={12} /> : <Plus size={12} />}
                                </button>
                              </td>
                              
                              {/* COMBINED 4-LINE INDIKATOR / KEGIATAN / LINGKUP / MAKSUD */}
                              <td className="px-4 py-3 space-y-1">
                                <div className="font-bold text-indigo-950 text-xs flex items-start gap-1.5 leading-snug">
                                  <span className="text-blue-600 shrink-0">📑</span>
                                  <span>{group.indikator}</span>
                                </div>
                                <div className="text-gray-800 text-[11px] font-semibold pl-2 border-l-2 border-indigo-400 mt-1 leading-snug">
                                  🎯 {group.kegiatan}
                                </div>
                                <div className="text-gray-600 text-[11px] italic pl-2 border-l-2 border-amber-400 mt-0.5 leading-snug">
                                  📌 Lingkup: {group.lingkup}
                                </div>
                                <div className="text-gray-500 text-[11px] pl-2 border-l-2 border-emerald-400 mt-0.5 leading-snug">
                                  💡 Maksud: {group.maksud}
                                </div>

                                {/* RINGKASAN ANGKA DAN % DI HEADER KELOMPOK */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-1 border-t border-blue-100/60 text-[10px]">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/80 border border-blue-200/80 font-bold text-blue-900">
                                    Usulan: Rp {formatRp(group.totalUsulan)}
                                  </span>
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${
                                    group.totalPenyesuaian > 0 
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                      : group.totalPenyesuaian < 0 
                                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                                      : 'bg-gray-50 border-gray-200 text-gray-600'
                                  }`}>
                                    Penyesuaian: {group.totalPenyesuaian > 0 ? '+' : ''}Rp {formatRp(group.totalPenyesuaian)}
                                    {group.totalUsulan > 0 && group.totalPenyesuaian !== 0 && (
                                      <span className="opacity-90 font-mono ml-0.5">
                                        ({((group.totalPenyesuaian / group.totalUsulan) * 100).toFixed(1)}%)
                                      </span>
                                    )}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 font-bold text-indigo-900">
                                    Setelah Penyesuaian: Rp {formatRp(group.totalSetelahPenyesuaian)}
                                    {unit.totalSetelahPenyesuaian > 0 && (
                                      <span className="text-indigo-600 font-extrabold ml-1">
                                        ({((group.totalSetelahPenyesuaian / unit.totalSetelahPenyesuaian) * 100).toFixed(1)}% dari Unit)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">
                                {formatRp(group.totalUsulan)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">
                                <div>{group.totalPenyesuaian > 0 ? '+' : ''}{formatRp(group.totalPenyesuaian)}</div>
                                {group.totalUsulan > 0 && group.totalPenyesuaian !== 0 && (
                                  <div className={`text-[10px] font-bold mt-0.5 ${group.totalPenyesuaian > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {((group.totalPenyesuaian / group.totalUsulan) * 100).toFixed(1)}%
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap align-top pt-3.5">
                                <div>Rp {formatRp(group.totalSetelahPenyesuaian)}</div>
                                {overallKPI.totalSetelahPenyesuaian > 0 && (
                                  <div className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded inline-block mt-0.5 border border-indigo-200">
                                    {((group.totalSetelahPenyesuaian / overallKPI.totalSetelahPenyesuaian) * 100).toFixed(1)}% dari Total
                                  </div>
                                )}
                              </td>
                            </tr>

                            {/* LEVEL 3: SUB-TABLE ITEMS (ACCORDION EXPANDED) */}
                            {isGroupExpanded && (
                              <tr>
                                <td colSpan={5} className="p-0 border-b border-gray-300">
                                  <div className="w-full">
                                    
                                    <table className="w-full text-xs text-left border-collapse">
                                      {/* SUB-TABLE HEADER (DARK BLUE IN SCREENSHOT) */}
                                      <thead>
                                        <tr className="bg-[#1f73a5] text-white font-bold text-[12px] border-y border-[#185c84]">
                                          <th className="px-5 py-2.5 text-left w-1/3">Akun/SBU/Deskripsi;</th>
                                          <th className="px-2 py-2.5 text-center w-12"></th>
                                          <th className="px-4 py-2.5 text-center w-36">Kuantitas</th>
                                          <th className="px-4 py-2.5 text-right w-36">Harga Satuan</th>
                                          <th className="px-4 py-2.5 text-right w-36">Jumlah Biaya</th>
                                          <th className="px-4 py-2.5 text-right w-32">Penyesuaian</th>
                                          <th className="px-4 py-2.5 text-left min-w-[200px]">Keterangan Review</th>
                                        </tr>
                                      </thead>

                                      <tbody className="divide-y divide-gray-200">
                                        {group.items.map((item, itemIdx) => {
                                          const usulanFormula = parsePhpFormula(item.usulan_pagu_indikatif_anggaran_rumus);
                                          const apprFormula = parsePhpFormula(item.approval_pagu_indikatif_anggaran_rumus);
                                          
                                          const hasRevisi = !!item.approval_pagu_indikatif_anggaran_rumus;

                                          let revisiQty = 0;
                                          let revisiTotal = 0;
                                          let revisiPenyesuaian = 0;

                                          if (apprFormula) {
                                            revisiQty = parseFloat(apprFormula.totalQty) || 0;
                                            revisiTotal = revisiQty * (Number(item.tarif) || 0);
                                            revisiPenyesuaian = revisiTotal - (Number(item.total) || 0);
                                          }

                                          const isWajib = (item.custom_status || '').toLowerCase().includes('wajib') || (item.kunci || '').toUpperCase() === 'Y';

                                          return (
                                            <React.Fragment key={item.id || itemIdx}>
                                              
                                              {/* 1. USULAN ROW (BLUE BADGE OR AMBER IF WAJIB ADA) */}
                                              <tr className={`transition-colors ${
                                                isWajib 
                                                  ? 'bg-amber-50/60 hover:bg-amber-100/60 border-l-4 border-l-amber-500' 
                                                  : 'hover:bg-gray-50/70 bg-white'
                                              }`}>
                                                {/* Akun / SBU / Deskripsi (3 Lines) */}
                                                <td className="px-5 py-3 align-top">
                                                  {isWajib && (
                                                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] tracking-wider mb-1.5 shadow-xs">
                                                      <ShieldCheck size={11} /> WAJIB ADA
                                                    </div>
                                                  )}
                                                  <div className="font-bold text-gray-900 text-xs">
                                                    {item.akun || item.komponen_nama}
                                                  </div>
                                                  <div className="text-[11px] text-gray-500 mt-0.5">
                                                    {item.tahun ? `${item.tahun}.${item.akun || item.komponen_nama}` : (item.akun || item.komponen_nama)}
                                                  </div>
                                                  <div className="italic text-[11px] text-gray-600 mt-1 leading-snug">
                                                    {item.deskripsi}
                                                  </div>
                                                </td>

                                                {/* Vertical Badge Usulan (Blue in screenshot) */}
                                                <td className="p-0 text-center align-middle bg-[#a8cdf0] border-r border-[#92bbe2] w-10">
                                                  <div className="font-bold text-[11px] text-indigo-950 tracking-widest py-3 [writing-mode:vertical-lr] rotate-180 select-none">
                                                    Usulan
                                                  </div>
                                                </td>

                                                {/* Kuantitas Multi-baris (Rumus Usulan) */}
                                                <td className="px-4 py-3 align-top font-mono text-gray-800">
                                                  {usulanFormula && usulanFormula.lines.length > 0 ? (
                                                    <div className="space-y-0.5">
                                                      {usulanFormula.lines.map((l, lIdx) => (
                                                        <div key={lIdx} className="flex justify-between items-center text-xs">
                                                          <span>{l.text}</span>
                                                          <span className="text-gray-400 pl-2">x</span>
                                                        </div>
                                                      ))}
                                                      <div className="pt-2 font-bold text-xs text-gray-900 border-t border-gray-100 mt-1">
                                                        {usulanFormula.finalHasil || `${item.vol} ${item.satuan || ''}`}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="font-bold text-xs">
                                                      {item.vol} {item.satuan || 'Paket'}
                                                    </div>
                                                  )}
                                                </td>

                                                {/* Harga Satuan */}
                                                <td className="px-4 py-3 align-top text-right font-mono text-gray-800 text-xs">
                                                  {formatRp(item.tarif)}
                                                </td>

                                                {/* Jumlah Biaya */}
                                                <td className="px-4 py-3 align-top text-right font-mono font-bold text-gray-900 text-xs">
                                                  {formatRp(item.total)}
                                                </td>

                                                {/* Penyesuaian (Blank / 0 for usulan) */}
                                                <td className="px-4 py-3 align-top text-right font-mono text-gray-400 text-xs">
                                                  -
                                                </td>

                                                {/* Keterangan Review & Action */}
                                                <td className="px-4 py-3 align-top text-gray-600 text-xs">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate max-w-[200px]" title={item.ai_reason || '-'}>
                                                      {item.ai_reason || '-'}
                                                    </span>
                                                    {!hasRevisi && (
                                                      <Button
                                                        type="button"
                                                        onClick={() => handleOpenRevisi(item)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2.5 text-[11px] rounded-lg border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold shadow-xs shrink-0"
                                                      >
                                                        <Edit3 size={11} className="mr-1 text-amber-700" /> Direvisi
                                                      </Button>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>

                                              {/* 2. DIREVISI ROW (YELLOW BACKGROUND IN SCREENSHOT) */}
                                              {hasRevisi && apprFormula && (
                                                <tr className="bg-[#fefde8] hover:bg-[#fef9c3] transition-colors border-t border-amber-200/80">
                                                  {/* Empty/Linked Account Column */}
                                                  <td className="px-5 py-3 align-top">
                                                    <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                                                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                                                      <span>Hasil Penyesuaian / Revisi Anggaran:</span>
                                                    </div>
                                                  </td>

                                                  {/* Vertical Badge Direvisi (Yellow) */}
                                                  <td className="p-0 text-center align-middle bg-[#fef08a] border-r border-amber-300 w-10">
                                                    <div className="font-bold text-[11px] text-amber-950 tracking-widest py-3 [writing-mode:vertical-lr] rotate-180 select-none">
                                                      Direvisi
                                                    </div>
                                                  </td>

                                                  {/* Kuantitas Direvisi (Rumus Approval) */}
                                                  <td className="px-4 py-3 align-top font-mono text-gray-800">
                                                    {apprFormula.lines.length > 0 ? (
                                                      <div className="space-y-0.5">
                                                        {apprFormula.lines.map((l, lIdx) => (
                                                          <div key={lIdx} className="flex justify-between items-center text-xs">
                                                            <span>{l.text}</span>
                                                            <span className="text-amber-500 pl-2">x</span>
                                                          </div>
                                                        ))}
                                                        <div className="pt-2 font-bold text-xs text-amber-950 border-t border-amber-200 mt-1">
                                                          {apprFormula.finalHasil || `${revisiQty} ${item.satuan || ''}`}
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div className="font-bold text-xs text-amber-950">
                                                        {revisiQty} {item.satuan || 'Paket'}
                                                      </div>
                                                    )}
                                                  </td>

                                                  {/* Harga Satuan Direvisi */}
                                                  <td className="px-4 py-3 align-top text-right font-mono text-gray-800 text-xs">
                                                    {formatRp(item.tarif)}
                                                  </td>

                                                  {/* Jumlah Biaya Direvisi */}
                                                  <td className="px-4 py-3 align-top text-right font-mono font-bold text-amber-950 text-xs">
                                                    {formatRp(revisiTotal)}
                                                  </td>

                                                  {/* Penyesuaian Nominal */}
                                                  <td className="px-4 py-3 align-top text-right font-mono font-bold text-xs">
                                                    <span className={revisiPenyesuaian > 0 ? 'text-emerald-700 font-bold' : revisiPenyesuaian < 0 ? 'text-rose-700 font-bold' : 'text-gray-500'}>
                                                      {revisiPenyesuaian > 0 ? '+' : ''}{formatRp(revisiPenyesuaian)}
                                                    </span>
                                                  </td>

                                                  {/* Action Buttons for Revisi */}
                                                  <td className="px-4 py-3 align-top text-gray-600 text-xs">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="truncate max-w-[200px] text-amber-900 font-medium" title={item.ai_reason || '-'}>
                                                        {item.ai_reason || 'Disetujui Penyesuaian'}
                                                      </span>
                                                      <div className="flex items-center gap-1 shrink-0">
                                                        <Button
                                                          type="button"
                                                          onClick={() => handleOpenRevisi(item)}
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-7 px-2 text-[11px] rounded-lg border-amber-300 text-amber-900 bg-amber-100 hover:bg-amber-200 font-bold shadow-xs"
                                                          title="Edit Penyesuaian"
                                                        >
                                                          <Edit3 size={11} className="mr-1 text-amber-800" /> Edit
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </td>
                                                </tr>
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
        )}
      </div>

      {/* MODAL / DIALOG FORM "DIREVISI" (EDIT FORMULA & MULTIPLIERS) */}
      <Dialog open={!!revisiDialogItem} onOpenChange={(open) => !open && setRevisiDialogItem(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-2xl p-0 max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
          <DialogHeader className="p-5 pb-3 border-b border-gray-100 shrink-0 bg-white">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit3 size={18} className="text-amber-600" />
              <span>Formulir Penyesuaian Anggaran (Direvisi)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Ubah rincian perkalian kuantitas rumus atau tarif usulan. Data akan otomatis diserialisasi ke dalam kolom <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-700 font-mono">approval_pagu_indikatif_anggaran_rumus</code>.
            </DialogDescription>
          </DialogHeader>

          {revisiDialogItem && (
            <div className="flex flex-col flex-1 overflow-hidden">
              
              {/* SCROLLABLE FORM BODY */}
              <div className="p-5 overflow-y-auto max-h-[calc(90vh-150px)] space-y-4 text-xs custom-scrollbar">
                
                {/* Header Info Banner */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-gray-900 text-sm">
                    {revisiDialogItem.akun || revisiDialogItem.komponen_nama}
                  </div>
                  <div className="text-gray-600 italic">
                    {revisiDialogItem.deskripsi}
                  </div>
                  <div className="flex flex-wrap gap-4 text-[11px] text-gray-500 pt-1 border-t border-slate-200">
                    <span>Unit: <strong>{revisiDialogItem.unitkerja_nama}</strong></span>
                    <span>Usulan Awal: <strong>Rp {formatRp(revisiDialogItem.total)}</strong></span>
                    <span>Tarif Satuan: <strong>Rp {formatRp(revisiDialogItem.tarif)}</strong></span>
                  </div>
                </div>

                {/* Multi-Row Formula Editor */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-800 text-xs">
                      Rincian Rumus Perkalian Kuantitas (Maksimal 5 Pengali):
                    </label>
                    <span className="text-[11px] text-indigo-600 font-semibold">
                      Format: [Kuantitas] x [Satuan]
                    </span>
                  </div>

                  <div className="space-y-2 bg-amber-50/50 p-3 rounded-xl border border-amber-200/80">
                    {[0, 1, 2, 3, 4].map(idx => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 text-center font-bold text-gray-400 text-xs">
                          #{idx + 1}
                        </span>
                        <div className="w-28">
                          <input
                            type="number"
                            placeholder="Contoh: 1"
                            value={revisiForm.calcs[idx] || ''}
                            onChange={(e) => {
                              const newCalcs = [...revisiForm.calcs];
                              newCalcs[idx] = e.target.value;
                              setRevisiForm(prev => ({ ...prev, calcs: newCalcs }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                          />
                        </div>
                        <span className="text-gray-400 font-bold">x</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Satuan (misal: Paket, Orang, Bulan, Kali...)"
                            value={revisiForm.units[idx] || ''}
                            onChange={(e) => {
                              const newUnits = [...revisiForm.units];
                              newUnits[idx] = e.target.value;
                              setRevisiForm(prev => ({ ...prev, units: newUnits }));
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tarif Satuan & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Harga Satuan / Tarif (Rp):</label>
                    <input
                      type="number"
                      value={revisiForm.tarif || ''}
                      onChange={(e) => setRevisiForm(prev => ({ ...prev, tarif: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">Status Penyesuaian:</label>
                    <select
                      value={revisiForm.customStatus}
                      onChange={(e) => setRevisiForm(prev => ({ ...prev, customStatus: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Direvisi">Direvisi (Penyesuaian)</option>
                      <option value="Disetujui">Disetujui Penuh</option>
                      <option value="Ditolak">Ditolak / 0</option>
                      <option value="Wajib">Wajib (Terkunci)</option>
                    </select>
                  </div>
                </div>

                {/* Keterangan Review */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Catatan / Keterangan Review:</label>
                  <textarea
                    rows={2}
                    placeholder="Masukkan alasan atau dasar penyesuaian anggaran..."
                    value={revisiForm.keterangan}
                    onChange={(e) => setRevisiForm(prev => ({ ...prev, keterangan: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Live Preview of Calculated Penyesuaian */}
                <div className="p-4 bg-amber-100/70 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                    <span>Hasil Perhitungan Kuantitas:</span>
                    <span className="font-mono text-sm">{revisiCalculations.totalQty} {revisiCalculations.finalUnit}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                    <span>Total Biaya Baru:</span>
                    <span className="font-mono text-sm">Rp {formatRp(revisiCalculations.totalBiaya)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black border-t border-amber-300/80 pt-2">
                    <span>Nominal Penyesuaian:</span>
                    <span className={`font-mono text-base ${revisiCalculations.penyesuaian < 0 ? 'text-rose-700' : revisiCalculations.penyesuaian > 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {revisiCalculations.penyesuaian > 0 ? '+' : ''}Rp {formatRp(revisiCalculations.penyesuaian)}
                    </span>
                  </div>
                </div>

              </div>

              {/* STICKY FOOTER (ALWAYS VISIBLE ON ANY SCREEN SIZE) */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
                <div>
                  {revisiDialogItem.approval_pagu_indikatif_anggaran_rumus && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResetRevisi}
                      disabled={isSavingRevisi}
                      className="rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold h-9"
                    >
                      Hapus Penyesuaian
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRevisiDialogItem(null)}
                    disabled={isSavingRevisi}
                    className="rounded-xl border-gray-300 text-xs font-semibold h-9"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveRevisi}
                    disabled={isSavingRevisi}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 text-xs h-9"
                  >
                    {isSavingRevisi ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Simpan Penyesuaian</span>
                  </Button>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
