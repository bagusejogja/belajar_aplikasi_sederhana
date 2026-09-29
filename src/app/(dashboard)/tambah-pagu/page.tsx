'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getTambahPagu } from '@/app/actions/tambah-pagu';
import { getMyPermissions } from '@/app/actions/surat';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import TambahPaguTabs from '@/components/TambahPaguTabs';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, FileText, Calendar, Building2, 
  Tag, AlertCircle, CheckCircle2, Clock, Filter, 
  ChevronRight, MoreHorizontal, Download, Edit,
  ChevronUp, BarChart3, TrendingUp, LayoutGrid, ChevronDown,
  Wallet, CheckCircle, BarChart as ChartIcon, Eye,
  ChevronLeft, Sparkles, TrendingDown, FileSpreadsheet,
  ExternalLink, X, XCircle, RefreshCw, Maximize2, Zap, Landmark, Scale, Edit3,
  RotateCcw, PieChart as PieIcon, Activity
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend,
  PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSafeFileUrl } from '@/lib/fileHelper';
import { TableActionButton, TableActionGroup } from '@/components/shared/ActionButtons';

// Autocomplete Filter Unit Kerja Component (with Keyboard Navigation ↑ ↓ + Enter)
function UnitAutocompleteFilter({ units, selectedUnit, onSelect }: { units: string[], selectedUnit: string, onSelect: (unit: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredUnits = useMemo(() => {
    return units.filter(u => u.toLowerCase().includes(query.toLowerCase()));
  }, [units, query]);

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
        className="w-full h-9 px-3.5 rounded-xl bg-gray-50 hover:bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
      >
        <span className="truncate font-bold">
          {selectedUnit === 'ALL' ? `🏢 Semua Unit Kerja (${units.length})` : `🏢 ${selectedUnit}`}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-full min-w-[260px] rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150">
            <input
              type="text"
              placeholder="Cari unit (Navigasi ↑ ↓ + Enter)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 mb-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
              <div
                onClick={() => {
                  onSelect('ALL');
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`px-3 py-2 rounded-xl cursor-pointer font-bold transition-colors flex items-center justify-between ${
                  highlightedIndex === 0 ? 'bg-emerald-600 text-white font-bold' : selectedUnit === 'ALL' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <span>🏢 Semua Unit Kerja ({units.length})</span>
                {selectedUnit === 'ALL' && <span className={highlightedIndex === 0 ? 'text-white font-bold' : 'text-emerald-600 font-bold'}>✓</span>}
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
                      isHighlighted ? 'bg-emerald-600 text-white font-bold' : isSelected ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="truncate">{u}</span>
                    {isSelected && <span className={isHighlighted ? 'text-white font-bold' : 'text-emerald-600 font-bold'}>✓</span>}
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

export default function TambahPaguPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'data' | 'summary' | 'chart'>('data');
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSingleUnit, setSelectedSingleUnit] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [perms, setPerms] = useState<any>({ can_view: true, can_create: false });

  // Pop Up Detail Dialog State
  const [viewDetailData, setViewDetailData] = useState<any | null>(null);

  // Set of no_surat from app_analisis_utama for 100% accurate AI Import detection
  const [analisisNoSuratSet, setAnalisisNoSuratSet] = useState<Set<string>>(new Set());

  // Accordion Expand State for Summary Per Unit
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Tab 3 Interactive Visual Analytics States
  const [chartSeriesFilter, setChartSeriesFilter] = useState<'all' | 'proposed' | 'approved'>('all');
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);
  const [hoveredUnitIdx, setHoveredUnitIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const [myPerms, { data: rawData }, { data: analisisList }] = await Promise.all([
        getMyPermissions('/tambah-pagu', session?.access_token, session?.user?.id, session?.user?.email),
        supabase.from('tambah_pagu').select('*, gov_units(nama_unit)').order('id', { ascending: false }),
        supabase.from('app_analisis_utama').select('no_surat, analisis_html')
      ]);
      
      setPerms(myPerms);
      setData(rawData || []);

      const setAnalisisAI = new Set<string>();
      const setAnalisisManual = new Set<string>();
      
      if (analisisList) {
        analisisList.forEach((a: any) => {
          if (a.no_surat) {
             const key = a.no_surat.trim().toLowerCase();
             let isManual = false;
             if (a.analisis_html) {
                 try {
                    const parsed = JSON.parse(a.analisis_html);
                    if (parsed.is_manual) isManual = true;
                 } catch(e) {}
             }
             if (isManual) {
                setAnalisisManual.add(key);
             } else {
                setAnalisisAI.add(key);
             }
          }
        });
      }
      setAnalisisNoSuratSet(setAnalisisAI);

      const years = Array.from(new Set(rawData?.map((item: any) => item.tahun_anggaran?.toString()).filter(Boolean))).sort().reverse() as string[];
      setYearOptions(years.length > 0 ? years : ['2026', '2025']);
      
    } catch (error: any) {
      console.error("Gagal mengambil data tambah pagu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRp = (num: any) => {
    if (!num) return '0';
    const clean = num.toString().replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID').format(Number(clean) || 0);
  };

  // Extract all unique unit names for autocomplete filter dropdown
  const allUnitNames = useMemo(() => {
    const set = new Set<string>();
    data.forEach(item => {
      const uName = item.gov_units?.nama_unit || item.unit_kerja_nama || item.unit_pengusul;
      if (uName) set.add(uName);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered Data Calculations
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const q = searchTerm.toLowerCase();
      const uName = item.gov_units?.nama_unit || item.unit_kerja_nama || item.unit_pengusul || '';

      const matchesSearch = 
        !searchTerm ||
        item.no_surat_pengajuan?.toLowerCase().includes(q) ||
        item.hal_surat_pengajuan?.toLowerCase().includes(q) ||
        uName.toLowerCase().includes(q);
      
      const matchesUnit = 
        selectedSingleUnit === 'ALL' || 
        uName.toLowerCase() === selectedSingleUnit.toLowerCase();

      const matchesYear = 
        selectedYear === 'Semua Tahun' || 
        item.tahun_anggaran?.toString() === selectedYear;

      const matchesStatus = 
        selectedStatusFilter === 'ALL' ||
        (item.status_pengajuan || '').toLowerCase() === selectedStatusFilter.toLowerCase();

      return matchesSearch && matchesUnit && matchesYear && matchesStatus;
    });
  }, [data, searchTerm, selectedSingleUnit, selectedYear, selectedStatusFilter]);

  // Top 4 KPI Cards Metrics (Calculated from filteredData)
  const kpiMetrics = useMemo(() => {
    const totalCount = filteredData.length;
    const totalAnggaranUsulan = filteredData.reduce((acc, curr) => acc + Number(curr.nominal_diajukan || 0), 0);

    const approvedSemuaItems = filteredData.filter(d => (d.status_pengajuan || '').toLowerCase().includes('semua') || (d.status_pengajuan || '').toLowerCase().includes('100'));
    const approvedSemuaCount = approvedSemuaItems.length;
    const approvedSemuaAnggaran = approvedSemuaItems.reduce((acc, curr) => acc + Number(curr.nominal_tanggapan || curr.nominal_disetujui || curr.nominal_diajukan || 0), 0);

    const approvedSebagianItems = filteredData.filter(d => (d.status_pengajuan || '').toLowerCase().includes('sebagian'));
    const approvedSebagianCount = approvedSebagianItems.length;
    const approvedSebagianAnggaran = approvedSebagianItems.reduce((acc, curr) => acc + Number(curr.nominal_tanggapan || curr.nominal_disetujui || 0), 0);

    const rejectedItems = filteredData.filter(d => (d.status_pengajuan || '').toLowerCase().includes('tolak') || (d.status_pengajuan || '').toLowerCase() === 'diajukan');
    const rejectedCount = rejectedItems.length;
    const rejectedAnggaran = rejectedItems.reduce((acc, curr) => acc + Number(curr.nominal_diajukan || 0), 0);

    const approvedPct = totalCount > 0 ? Math.round((approvedSemuaCount / totalCount) * 100) : 0;

    return {
      totalCount,
      totalAnggaranUsulan,
      approvedSemuaCount,
      approvedSemuaAnggaran,
      approvedSebagianCount,
      approvedSebagianAnggaran,
      rejectedCount,
      rejectedAnggaran,
      approvedPct
    };
  }, [filteredData]);

  // Unit Summary Aggregation Table Data with Items per Unit for Collapse/Accordion
  const unitSummaryData = useMemo(() => {
    const map: Record<string, { unit: string; groupOrg: string; totalUsulan: number; totalNominalDiajukan: number; totalNominalDisetujui: number; approvedCount: number; items: any[] }> = {};

    filteredData.forEach(item => {
      const uName = item.gov_units?.nama_unit || item.unit_kerja_nama || item.unit_pengusul || 'Lainnya';
      const gOrg = item.gov_units?.group_org || '-';

      if (!map[uName]) {
        map[uName] = { unit: uName, groupOrg: gOrg, totalUsulan: 0, totalNominalDiajukan: 0, totalNominalDisetujui: 0, approvedCount: 0, items: [] };
      }
      map[uName].totalUsulan += 1;
      map[uName].totalNominalDiajukan += Number(item.nominal_diajukan || 0);
      map[uName].totalNominalDisetujui += Number(item.nominal_tanggapan || item.nominal_disetujui || 0);
      map[uName].items.push(item);
      if ((item.status_pengajuan || '').toLowerCase().includes('disetujui')) {
        map[uName].approvedCount += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.totalNominalDiajukan - a.totalNominalDiajukan);
  }, [filteredData]);

  // Recharts Monthly Stats Data
  const statsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyCounts: any = {};
    monthNames.forEach(m => monthlyCounts[m] = { name: m, count: 0, proposed: 0, approved: 0 });

    filteredData.forEach(item => {
      if (item.tanggal_surat_pengajuan) {
        const date = new Date(item.tanggal_surat_pengajuan);
        const monthLabel = monthNames[date.getMonth()];
        if (monthlyCounts[monthLabel]) {
          monthlyCounts[monthLabel].count += 1;
          monthlyCounts[monthLabel].proposed += Number(item.nominal_diajukan || 0);
          monthlyCounts[monthLabel].approved += Number(item.nominal_tanggapan || 0);
        }
      }
    });

    return Object.values(monthlyCounts);
  }, [filteredData]);

  // Tab 3 Memo: Distribution of Status for Interactive Donut Chart
  const statusDistributionData = useMemo(() => {
    return [
      { name: 'Disetujui Semua', value: kpiMetrics.approvedSemuaCount, amount: kpiMetrics.approvedSemuaAnggaran, color: '#10b981' },
      { name: 'Disetujui Sebagian', value: kpiMetrics.approvedSebagianCount, amount: kpiMetrics.approvedSebagianAnggaran, color: '#6366f1' },
      { name: 'Ditolak / Dipending', value: kpiMetrics.rejectedCount, amount: kpiMetrics.rejectedAnggaran, color: '#f43f5e' },
      { 
        name: 'Dalam Proses / Lainnya', 
        value: Math.max(0, kpiMetrics.totalCount - (kpiMetrics.approvedSemuaCount + kpiMetrics.approvedSebagianCount + kpiMetrics.rejectedCount)),
        amount: Math.max(0, kpiMetrics.totalAnggaranUsulan - (kpiMetrics.approvedSemuaAnggaran + kpiMetrics.approvedSebagianAnggaran + kpiMetrics.rejectedAnggaran)),
        color: '#f59e0b'
      },
    ].filter(item => item.value > 0);
  }, [kpiMetrics]);

  // Tab 3 Memo: Top 5 Units by Total Nominal Proposed
  const top5Units = useMemo(() => {
    return unitSummaryData.slice(0, 5);
  }, [unitSummaryData]);

  // Tab 3 Memo: Cumulative Growth Data (Jan - Des) for Spline Area Chart
  const cumulativeGrowthData = useMemo(() => {
    let cumProposed = 0;
    let cumApproved = 0;
    let cumCount = 0;
    return (statsData as any[]).map(item => {
      cumProposed += item.proposed;
      cumApproved += item.approved;
      cumCount += item.count;
      return {
        ...item,
        cumProposed,
        cumApproved,
        cumCount
      };
    });
  }, [statsData]);

  // Reset Filters Function
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSingleUnit('ALL');
    setSelectedYear('Semua Tahun');
    setSelectedStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Toggle Accordion Collapse for Summary Unit
  const toggleUnitAccordion = (unitName: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitName]: !prev[unitName] }));
  };

  // Pagination Logic
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // REAL NATIVE EXCEL (.XLSX) DOWNLOAD WITH DYNAMIC TAB AWARENESS
  const exportToExcel = () => {
    if (activeTab === 'summary') {
      if (unitSummaryData.length === 0) return alert("Tidak ada data summary untuk di-export");

      // 1. Mapped Summary Per Unit Kerja Data
      const summaryRows = unitSummaryData.map((u, index) => {
        const pct = u.totalNominalDiajukan > 0 
          ? ((u.totalNominalDisetujui / u.totalNominalDiajukan) * 100).toFixed(1) + '%'
          : '0.0%';
        return {
          'No': index + 1,
          'Nama Unit Kerja': u.unit,
          'Group Org': u.groupOrg,
          'Total Usulan (Surat)': u.totalUsulan,
          'Total Nominal Diajukan (Rp)': u.totalNominalDiajukan,
          'Total Nominal Disetujui (Rp)': u.totalNominalDisetujui,
          'Persentase Disetujui (%)': pct
        };
      });

      const worksheetSummary = XLSX.utils.json_to_sheet(summaryRows);
      worksheetSummary['!cols'] = [
        { wch: 6 },  // No
        { wch: 40 }, // Nama Unit
        { wch: 18 }, // Group Org
        { wch: 20 }, // Total Usulan
        { wch: 26 }, // Total Diajukan
        { wch: 26 }, // Total Disetujui
        { wch: 22 }, // % Disetujui
      ];

      // 2. Mapped Detailed Usulan per Unit as 2nd Sheet
      const detailedRows = filteredData.map((item, index) => ({
        'No': index + 1,
        'Tahun Anggaran': item.tahun_anggaran || '2026',
        'Unit Kerja': item.gov_units?.nama_unit || item.unit_kerja_nama || item.unit_pengusul || '-',
        'Group Org': item.gov_units?.group_org || '-',
        'No Surat Pengajuan': item.no_surat_pengajuan || '-',
        'Tanggal Pengajuan': item.tanggal_surat_pengajuan || '-',
        'Hal / Perihal Surat': item.hal_surat_pengajuan || '-',
        'Nominal Diajukan (Rp)': Number(item.nominal_diajukan || 0),
        'Nominal Disetujui (Rp)': Number(item.nominal_tanggapan || item.nominal_disetujui || 0),
        'Jenis Tambah Pagu': item.jenis_tambah_pagu || 'Penugasan',
        'Status Keputusan': item.status_pengajuan || 'Diajukan',
      }));

      const worksheetDetail = XLSX.utils.json_to_sheet(detailedRows);
      worksheetDetail['!cols'] = [
        { wch: 6 },  { wch: 14 }, { wch: 35 }, { wch: 16 }, { wch: 30 },
        { wch: 16 }, { wch: 45 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 20 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheetSummary, "Summary Per Unit Kerja");
      XLSX.utils.book_append_sheet(workbook, worksheetDetail, "Rincian Surat Per Unit");

      const fileName = `Summary_Pagu_Per_Unit_${selectedYear}_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } else {
      // DEFAULT: TAB DATA DETAIL (OR TAB CHART)
      if (filteredData.length === 0) return alert("Tidak ada data untuk di-export");

      const mappedExcelData = filteredData.map((item, index) => ({
        'No': index + 1,
        'Tahun Anggaran': item.tahun_anggaran || '2026',
        'No Surat Pengajuan': item.no_surat_pengajuan || '-',
        'Tanggal Pengajuan': item.tanggal_surat_pengajuan || '-',
        'Unit Kerja': item.gov_units?.nama_unit || item.unit_kerja_nama || item.unit_pengusul || '-',
        'Group Org': item.gov_units?.group_org || '-',
        'Jenis Tambah Pagu': item.jenis_tambah_pagu || 'Penugasan',
        'Hal / Perihal Surat': item.hal_surat_pengajuan || '-',
        'Subyek Simaster': item.subyek_pengajuan_di_simaster_persuratan || '-',
        'Nominal Diajukan (Rp)': Number(item.nominal_diajukan || 0),
        'No Surat Tanggapan': item.no_surat_tanggapan || '-',
        'Tanggal Tanggapan': item.tanggal_surat_tanggapan || '-',
        'Nominal Disetujui (Rp)': Number(item.nominal_tanggapan || item.nominal_disetujui || 0),
        'Status Keputusan': item.status_pengajuan || 'Diajukan',
        'Ringkasan AI': (item.ringkasan_substansi || '').replace(/<[^>]*>?/gm, '')
      }));

      const worksheet = XLSX.utils.json_to_sheet(mappedExcelData);
      
      // Auto Column Widths for professional formatting
      worksheet['!cols'] = [
        { wch: 6 },  // No
        { wch: 14 }, // Tahun
        { wch: 30 }, // No Surat
        { wch: 16 }, // Tgl Surat
        { wch: 35 }, // Unit Kerja
        { wch: 16 }, // Group Org
        { wch: 18 }, // Jenis Pagu
        { wch: 45 }, // Hal / Perihal
        { wch: 30 }, // Subyek Simaster
        { wch: 22 }, // Nominal Diajukan
        { wch: 30 }, // No Surat Tanggapan
        { wch: 16 }, // Tgl Tanggapan
        { wch: 22 }, // Nominal Disetujui
        { wch: 20 }, // Status Keputusan
        { wch: 50 }, // Ringkasan AI
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rincian Tambah Pagu");

      const fileName = `Tambah_Pagu_Detail_${selectedYear}_${new Date().getTime()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('semua') || s.includes('100')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('sebagian')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (s.includes('tolak')) return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col justify-center items-center gap-4 bg-slate-50">
      <RefreshCw className="animate-spin text-emerald-600 w-10 h-10" />
      <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Memuat Dashboard Usulan Tambah Pagu...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* COHESIVE TAMBAH PAGU TABS */}
      <TambahPaguTabs activeTab="daftar" />

      {/* ROW 1: SLIM & UNIFIED TOP TOOLBAR & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-2 rounded-xl text-white shadow-xs">
            <Wallet size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Tambah Pagu Anggaran
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                TA {selectedYear} • {kpiMetrics.totalCount} Usulan
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Pantau status permohonan & surat penambahan pagu anggaran unit kerja UGM.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={() => router.push('/tambah-pagu/komparasi')}
            className="h-9 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Scale size={14} />
            <span>Komparasi DB</span>
          </button>

          <button 
            onClick={exportToExcel}
            className="h-9 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>

          {perms.can_create && (
            <button
              onClick={() => router.push('/tambah-pagu/tambah')}
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <Plus size={15} />
              <span>Tambah Usulan</span>
            </button>
          )}
        </div>
      </div>

      {/* ROW 2: 4 SUMMARY KPI CARDS (DESIGN SYSTEM HARMONIZED) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL USULAN ANGGARAN */}
        <div className="group bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">TOTAL USULAN ANGGARAN</span>
              <div className="text-xl font-black text-gray-900 font-mono tracking-tight">
                Rp {formatRp(kpiMetrics.totalAnggaranUsulan)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 group-hover:scale-105 transition-transform">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>{kpiMetrics.totalCount} Usulan Item</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold">100% Usulan</span>
          </div>
        </div>

        {/* CARD 2: DISETUJUI SEMUA (100%) */}
        <div className="group bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">DISETUJUI SEMUA (100%)</span>
              <div className="text-xl font-black text-emerald-700 font-mono tracking-tight">
                Rp {formatRp(kpiMetrics.approvedSemuaAnggaran)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
            <span>{kpiMetrics.approvedSemuaCount} Item</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">
              {kpiMetrics.approvedPct}% Lolos Penuh
            </span>
          </div>
        </div>

        {/* CARD 3: DISETUJUI SEBAGIAN */}
        <div className="group bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">DISETUJUI SEBAGIAN</span>
              <div className="text-xl font-black text-indigo-700 font-mono tracking-tight">
                Rp {formatRp(kpiMetrics.approvedSebagianAnggaran)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-indigo-700 flex items-center justify-between border-t border-indigo-100/60 pt-2">
            <span>{kpiMetrics.approvedSebagianCount} Item</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Persetujuan Parsial</span>
          </div>
        </div>

        {/* CARD 4: DITOLAK / DIAJUKAN */}
        <div className="group bg-white rounded-2xl p-4 border border-rose-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 block mb-1">DITOLAK / DIPENDING</span>
              <div className="text-xl font-black text-rose-700 font-mono tracking-tight">
                Rp {formatRp(kpiMetrics.rejectedAnggaran)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-105 transition-transform">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-rose-700 flex items-center justify-between border-t border-rose-100/60 pt-2">
            <span>{kpiMetrics.rejectedCount} Item</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold">Proses / Penolakan</span>
          </div>
        </div>
      </div>

      {/* ROW 3: SEPARATE FILTER TOOLBAR WITH SEARCHABLE AUTOCOMPLETE UNIT FILTER & RESET BUTTON */}
      <div className="bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-black text-gray-700 uppercase tracking-wider shrink-0">
          <Zap size={15} className="text-amber-500" />
          <span>Filter Data:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
          {/* Autocomplete Searchable Filter Unit Kerja */}
          <div>
            <UnitAutocompleteFilter 
              units={allUnitNames}
              selectedUnit={selectedSingleUnit}
              onSelect={(u) => { setSelectedSingleUnit(u); setCurrentPage(1); }}
            />
          </div>

          {/* Filter Tahun Dropdown */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
              className="w-full h-9 bg-gray-50 hover:bg-white border border-gray-200 text-gray-800 font-bold text-xs rounded-xl px-3 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="Semua Tahun">📅 Semua Tahun</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Filter Status Dropdown */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => { setSelectedStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full h-9 bg-gray-50 hover:bg-white border border-gray-200 text-indigo-700 font-bold text-xs rounded-xl px-3 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="ALL">✨ Semua Status</option>
              <option value="Disetujui Semua">Disetujui Semua</option>
              <option value="Disetujui Sebagian">Disetujui Sebagian</option>
              <option value="Ditolak">Ditolak</option>
              <option value="Diajukan">Diajukan</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari No Surat, Hal, Unit..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-9 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
            />
          </div>
        </div>

        {/* Reset Filter Button if any filter is active */}
        {(searchTerm || selectedSingleUnit !== 'ALL' || selectedYear !== 'Semua Tahun' || selectedStatusFilter !== 'ALL') && (
          <button
            onClick={resetFilters}
            title="Reset Semua Filter"
            className="h-9 px-3 shrink-0 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* ROW 4: GLOW PILL TABS (DESIGN SYSTEM GAYA 1) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner max-w-full backdrop-blur-sm">
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
            activeTab === 'data' 
              ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/60 scale-[1.01]' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <FileText size={15} />
          <span>Tabel Data Detail</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
            activeTab === 'data' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
          }`}>
            {filteredData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
            activeTab === 'summary' 
              ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/60 scale-[1.01]' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Building2 size={15} />
          <span>Summary Per Unit Kerja</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
            activeTab === 'summary' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
          }`}>
            {unitSummaryData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
            activeTab === 'chart' 
              ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/60 scale-[1.01]' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <BarChart3 size={15} />
          <span>Visualisasi Tren & Grafis</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
            activeTab === 'chart' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
          }`}>
            Analytics Suite
          </span>
        </button>
      </div>

      {/* ROW 5: TAB CONTENT AREA */}

      {/* TAB 1: TABEL DATA DETAIL (NO GROUP ORG BADGE - UNIT KERJA & DETAIL SURAT PENGAJUAN COMBINED) */}
      {activeTab === 'data' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-4 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-gray-900">
                  Rincian Usulan Tambah Pagu ({filteredData.length} Records)
                </CardTitle>
                <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Kolom Unit Kerja & Detail Surat Pengajuan digabung tanpa badge group unit untuk tampilan ultra-ramping
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center text-gray-500 text-xs uppercase font-bold">No</TableHead>
                    <TableHead className="text-gray-500 text-xs uppercase font-bold">Unit Kerja & Detail Surat Pengajuan (No, Tanggal, & Hal)</TableHead>
                    <TableHead className="w-56 text-right text-gray-500 text-xs uppercase font-bold">Nominal Usulan & Disetujui</TableHead>
                    <TableHead className="w-44 text-center text-gray-500 text-xs uppercase font-bold">Jenis & Status</TableHead>
                    <TableHead className="w-28 text-center text-gray-500 text-xs uppercase font-bold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                        Belum ada data usulan tambah pagu yang sesuai filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((item, idx) => {
                      const uName = item.gov_units?.nama_unit || item.unit_kerja_nama || item.unit_pengusul || '-';
                      const rowNum = (itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage) + idx + 1;

                      return (
                        <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                          {/* 1. NO */}
                          <TableCell className="text-center font-bold text-slate-400 text-xs align-top pt-3.5">{rowNum}</TableCell>

                          {/* 2. COMBINED COLUMN: UNIT KERJA + DETAIL SURAT PENGAJUAN (TANPA GROUP ORG BADGE) */}
                          <TableCell className="text-xs align-top pt-3 space-y-1">
                            <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                              <Building2 size={16} className="text-indigo-600 shrink-0" />
                              <span>{uName}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="font-bold text-slate-800 font-mono text-xs">📄 {item.no_surat_pengajuan || '-'}</span>
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                📅 {item.tanggal_surat_pengajuan || '-'}
                              </span>
                            </div>

                            <div className="text-slate-700 font-medium leading-snug line-clamp-2 max-w-2xl text-xs">
                              {item.hal_surat_pengajuan || '-'}
                            </div>
                          </TableCell>

                          {/* 3. NOMINAL DIAJUKAN & DISETUJUI DIJADIKAN SATU KOLOM */}
                          <TableCell className="text-right align-top pt-3 space-y-1.5">
                            <div className="px-2.5 py-1 bg-amber-50/80 border border-amber-200/60 rounded-xl">
                              <span className="text-[9px] font-bold text-amber-700 uppercase block text-right">Nominal Diajukan</span>
                              <span className="font-mono font-bold text-amber-900 text-xs">Rp {formatRp(item.nominal_diajukan)}</span>
                            </div>
                            <div className="px-2.5 py-1 bg-emerald-50/80 border border-emerald-200/60 rounded-xl">
                              <span className="text-[9px] font-bold text-emerald-700 uppercase block text-right">Nominal Disetujui</span>
                              <span className="font-mono font-black text-emerald-800 text-xs">Rp {formatRp(item.nominal_tanggapan || item.nominal_disetujui || 0)}</span>
                            </div>
                          </TableCell>

                          {/* 4. JENIS & STATUS & SUMBER DATA */}
                          <TableCell className="text-center align-top pt-3 space-y-1.5">
                            <div>
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] font-bold">
                                {item.jenis_tambah_pagu || 'Penugasan'}
                              </Badge>
                            </div>
                            <div>
                              <Badge className={`px-2.5 py-0.5 text-[10px] font-black uppercase ${getStatusBadgeStyle(item.status_pengajuan)}`}>
                                {item.status_pengajuan || 'Diajukan'}
                              </Badge>
                            </div>
                            <div>
                              {(item.id_analisis || (item.no_surat_pengajuan && analisisNoSuratSet.has(item.no_surat_pengajuan.trim().toLowerCase()))) ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full shadow-2xs" title="Bersumber dari halaman Analisis Pagu">
                                  <Sparkles size={10} className="text-indigo-600" /> Impor Analisis AI
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full" title="Data diinput manual">
                                  <Edit3 size={10} className="text-slate-500" /> Input Manual
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* 5. AKSI */}
                          <TableCell className="text-center align-top pt-3">
                            <TableActionGroup>
                              <TableActionButton
                                icon={Eye}
                                variant="indigo"
                                title="Lihat Pop-up Detail"
                                size="sm"
                                onClick={() => setViewDetailData(item)}
                              />
                              <TableActionButton
                                icon={ExternalLink}
                                variant="default"
                                title="Buka Halaman Penuh"
                                size="sm"
                                onClick={() => router.push(`/tambah-pagu/view/${item.id}`)}
                              />
                              {perms.can_create && (
                                <TableActionButton
                                  icon={Edit}
                                  variant="warning"
                                  title="Edit Data Usulan"
                                  size="sm"
                                  onClick={() => router.push(`/tambah-pagu/edit/${item.id}`)}
                                />
                              )}
                            </TableActionGroup>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* PAGINATION FOOTER */}
            {filteredData.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
                {/* Left: Info */}
                <div className="flex items-center gap-2">
                  <span>
                    Menampilkan <strong className="text-gray-900">{itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-gray-900">{itemsPerPage === -1 ? filteredData.length : Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> dari <strong className="text-gray-900">{filteredData.length}</strong> usulan
                  </span>
                </div>

                {/* Center: Rows per page */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>Semua</option>
                  </select>
                </div>

                {/* Right: Page Navigation */}
                {itemsPerPage !== -1 && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                      title="Halaman Pertama"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                      title="Sebelumnya"
                    >
                      ‹ Prev
                    </button>
                    
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-black">
                      Hal {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                      title="Selanjutnya"
                    >
                      Next ›
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                      title="Halaman Terakhir"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: SUMMARY PER UNIT KERJA (COLLAPSIBLE ACCORDION PER UNIT) */}
      {activeTab === 'summary' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/50 p-4 px-5 border-b border-gray-100">
              <CardTitle className="text-sm font-black text-gray-900">
                Ringkasan Usulan Anggaran Per Unit Kerja (Collapsible Accordion)
              </CardTitle>
              <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                Klik pada baris unit kerja untuk memperluas (expand) rincian surat usulan di dalamnya
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 text-center text-gray-500 text-xs uppercase font-bold"></TableHead>
                    <TableHead className="text-gray-500 text-xs uppercase font-bold">Nama Unit Kerja</TableHead>
                    <TableHead className="text-center text-gray-500 text-xs uppercase font-bold">Total Usulan Surat</TableHead>
                    <TableHead className="text-right text-gray-500 text-xs uppercase font-bold">Total Nominal Diajukan (Rp)</TableHead>
                    <TableHead className="text-right text-emerald-700 text-xs uppercase font-bold">Total Nominal Disetujui (Rp)</TableHead>
                    <TableHead className="text-center text-gray-500 text-xs uppercase font-bold">% Disetujui</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitSummaryData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-slate-400">Belum ada data usulan.</TableCell>
                    </TableRow>
                  ) : (
                    unitSummaryData.map((u, idx) => {
                      const isExpanded = !!expandedUnits[u.unit];
                      const pct = u.totalNominalDiajukan > 0 
                        ? ((u.totalNominalDisetujui / u.totalNominalDiajukan) * 100).toFixed(1) 
                        : '0.0';

                      return (
                        <React.Fragment key={idx}>
                          {/* PARENT ROW: UNIT SUMMARY */}
                          <TableRow 
                            onClick={() => toggleUnitAccordion(u.unit)}
                            className={`cursor-pointer transition-colors border-b border-slate-100 text-xs ${
                              isExpanded ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <TableCell className="text-center">
                              <button className="p-1 rounded-md text-slate-400 hover:text-slate-800">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </TableCell>
                            <TableCell className="font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Building2 size={14} className="text-indigo-600" />
                                <span>{u.unit}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold">{u.totalUsulan} Surat</TableCell>
                            <TableCell className="text-right font-mono font-bold text-amber-900">Rp {formatRp(u.totalNominalDiajukan)}</TableCell>
                            <TableCell className="text-right font-mono font-black text-emerald-700">Rp {formatRp(u.totalNominalDisetujui)}</TableCell>
                            <TableCell className="text-center font-bold">
                              <Badge className="bg-emerald-100 text-emerald-800 font-mono text-[10px]">
                                {pct}%
                              </Badge>
                            </TableCell>
                          </TableRow>

                          {/* ACCORDION CHILD ROW: DETAILED LETTERS FOR THIS UNIT */}
                          {isExpanded && (
                            <TableRow className="bg-slate-50/90 border-b border-slate-200">
                              <TableCell colSpan={6} className="p-4 md:p-6">
                                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                      <FileText size={14} className="text-emerald-600" />
                                      Rincian Surat Usulan: {u.unit} ({u.items.length} Surat)
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-bold">Detail Pengajuan & Status</span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                        <TableRow>
                                          <TableHead className="w-10">No</TableHead>
                                          <TableHead>Surat Pengajuan (No, Tanggal, Hal)</TableHead>
                                          <TableHead className="text-right">Nominal Diajukan (Rp)</TableHead>
                                          <TableHead className="text-right text-emerald-700">Nominal Disetujui (Rp)</TableHead>
                                          <TableHead className="text-center">Jenis & Status</TableHead>
                                          <TableHead className="text-center w-20">Aksi</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {u.items.map((subItem: any, subIdx: number) => (
                                          <TableRow key={subItem.id || subIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                                            <TableCell className="font-bold text-slate-400 text-center text-[11px]">{subIdx + 1}</TableCell>
                                            <TableCell className="space-y-0.5">
                                               <div className="flex items-center gap-2">
                                                 <span className="font-bold text-slate-900 font-mono text-[11px]">{subItem.no_surat_pengajuan || '-'}</span>
                                               </div>
                                              <div className="text-[10px] text-slate-400">📅 {subItem.tanggal_surat_pengajuan || '-'}</div>
                                              <div className="text-slate-600 text-[11px] truncate max-w-sm">{subItem.hal_surat_pengajuan || '-'}</div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-bold text-amber-900 text-xs">
                                              Rp {formatRp(subItem.nominal_diajukan)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-black text-emerald-700 text-xs">
                                              Rp {formatRp(subItem.nominal_tanggapan || subItem.nominal_disetujui || 0)}
                                            </TableCell>
                                            <TableCell className="text-center space-y-1">
                                              <div>
                                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[9px]">
                                                  {subItem.jenis_tambah_pagu || 'Penugasan'}
                                                </Badge>
                                              </div>
                                              <div>
                                                <Badge className={`px-2 py-0.5 text-[9px] uppercase ${getStatusBadgeStyle(subItem.status_pengajuan)}`}>
                                                  {subItem.status_pengajuan || 'Diajukan'}
                                                </Badge>
                                              </div>
                                              <div>
                                                {subItem.id_analisis ? (
                                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-full">
                                                    <Sparkles size={9} className="text-indigo-600" /> AI
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded-full">
                                                    <Edit3 size={9} className="text-slate-500" /> Manual
                                                  </span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <TableActionGroup>
                                                <TableActionButton
                                                  icon={Eye}
                                                  variant="indigo"
                                                  title="Lihat Pop-up Detail"
                                                  size="xs"
                                                  onClick={(e) => {
                                                    e?.stopPropagation();
                                                    setViewDetailData(subItem);
                                                  }}
                                                />
                                                <TableActionButton
                                                  icon={ExternalLink}
                                                  variant="default"
                                                  title="Buka Halaman Penuh"
                                                  size="xs"
                                                  onClick={(e) => {
                                                    e?.stopPropagation();
                                                    router.push(`/tambah-pagu/view/${subItem.id}`);
                                                  }}
                                                />
                                                {perms.can_create && (
                                                  <TableActionButton
                                                    icon={Edit}
                                                    variant="warning"
                                                    title="Edit Data Usulan"
                                                    size="xs"
                                                    onClick={(e) => {
                                                      e?.stopPropagation();
                                                      router.push(`/tambah-pagu/edit/${subItem.id}`);
                                                    }}
                                                  />
                                                )}
                                              </TableActionGroup>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: VISUALISASI TREN & ANALISIS GRAFIS (ENHANCED INTERACTIVE SUITE) */}
      {activeTab === 'chart' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* TOP CONTROLS & KPI BANNER */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-blue-300 shadow-inner">
                <BarChart3 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white">
                    Visual Analytics Suite • Usulan Tambah Pagu
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider">
                    Tahun {selectedYear}
                  </span>
                </div>
                <p className="text-slate-300 text-xs font-medium mt-0.5">
                  Visualisasi komprehensif tren bulanan, proporsi persetujuan, peringkat unit kerja, dan laju pertumbuhan pagu.
                </p>
              </div>
            </div>

            {/* Interactive Series Toggle Buttons */}
            <div className="flex items-center gap-1.5 bg-black/30 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm self-stretch md:self-auto justify-center">
              <button
                onClick={() => setChartSeriesFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartSeriesFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Semua Seri
              </button>
              <button
                onClick={() => setChartSeriesFilter('proposed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartSeriesFilter === 'proposed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Hanya Usulan
              </button>
              <button
                onClick={() => setChartSeriesFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartSeriesFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                Hanya Disetujui
              </button>
            </div>
          </div>

          {/* GRID ROW 1: COMPOSED MONTHLY BAR & LINE + INTERACTIVE STATUS DONUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* PANEL 1: COMPOSED MONTHLY BAR & LINE (7 COLS) */}
            <Card className="lg:col-span-7 bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-gray-50/60 p-4 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <CardTitle className="text-sm font-black text-gray-900">
                      Tren Bulanan: Usulan vs Realisasi Disetujui
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Komparasi nominal diajukan, nominal disetujui, dan jumlah surat usulan per bulan
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-100">
                    TA {selectedYear}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={statsData} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorProposedBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="colorApprovedBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                      />
                      <YAxis 
                        yAxisId="nominalAxis" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                        tickFormatter={(val) => val === 0 ? '0' : `Rp ${(val/1e6).toFixed(0)}jt`} 
                      />
                      <YAxis 
                        yAxisId="countAxis" 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#f59e0b' }} 
                        tickFormatter={(val) => `${val} srt`} 
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const pItem = payload.find((p: any) => p.dataKey === 'proposed');
                            const aItem = payload.find((p: any) => p.dataKey === 'approved');
                            const cItem = payload.find((p: any) => p.dataKey === 'count');
                            const proposedVal = pItem ? Number(pItem.value || 0) : 0;
                            const approvedVal = aItem ? Number(aItem.value || 0) : 0;
                            const countVal = cItem ? Number(cItem.value || 0) : 0;
                            const pct = proposedVal > 0 ? Math.round((approvedVal / proposedVal) * 100) : 0;

                            return (
                              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 text-xs min-w-[210px] space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                                  <span className="font-black text-slate-100">Bulan {label} {selectedYear}</span>
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {countVal} Surat
                                  </span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Diajukan:
                                    </span>
                                    <span className="font-mono font-bold text-white">Rp {formatRp(proposedVal)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Disetujui:
                                    </span>
                                    <span className="font-mono font-bold text-emerald-400">Rp {formatRp(approvedVal)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-400 border-t border-slate-800 pt-1.5 text-[11px]">
                                    <span>Tingkat Persetujuan:</span>
                                    <span className={`font-bold ${pct >= 70 ? 'text-emerald-400' : pct >= 30 ? 'text-amber-400' : 'text-slate-400'}`}>
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        wrapperStyle={{ paddingBottom: '12px', fontWeight: 700, fontSize: '11px' }} 
                      />
                      {(chartSeriesFilter === 'all' || chartSeriesFilter === 'proposed') && (
                        <Bar 
                          yAxisId="nominalAxis" 
                          dataKey="proposed" 
                          name="Nominal Diajukan" 
                          fill="url(#colorProposedBar)" 
                          radius={[5, 5, 0, 0]} 
                          barSize={18} 
                        />
                      )}
                      {(chartSeriesFilter === 'all' || chartSeriesFilter === 'approved') && (
                        <Bar 
                          yAxisId="nominalAxis" 
                          dataKey="approved" 
                          name="Nominal Disetujui" 
                          fill="url(#colorApprovedBar)" 
                          radius={[5, 5, 0, 0]} 
                          barSize={18} 
                        />
                      )}
                      <Line 
                        yAxisId="countAxis" 
                        type="monotone" 
                        dataKey="count" 
                        name="Jumlah Surat" 
                        stroke="#f59e0b" 
                        strokeWidth={2.5} 
                        dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} 
                        activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* PANEL 2: INTERACTIVE STATUS DONUT CHART (5 COLS) */}
            <Card className="lg:col-span-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-gray-50/60 p-4 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <PieIcon size={16} className="text-indigo-600" />
                    <CardTitle className="text-sm font-black text-gray-900">
                      Proporsi Status Keputusan
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Distribusi hasil verifikasi surat usulan tambah pagu
                  </CardDescription>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                  {kpiMetrics.totalCount} Usulan
                </span>
              </CardHeader>
              <CardContent className="p-5 pt-3 flex flex-col justify-between flex-1">
                {/* Donut Chart Visual with Center Text */}
                <div className="h-[210px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={84}
                        paddingAngle={4}
                        dataKey="value"
                        onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                        onMouseLeave={() => setHoveredPieIndex(null)}
                      >
                        {statusDistributionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            stroke={hoveredPieIndex === index ? '#1e293b' : '#fff'}
                            strokeWidth={hoveredPieIndex === index ? 2 : 1.5}
                            className="cursor-pointer transition-all duration-200"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            const pct = kpiMetrics.totalCount > 0 ? Math.round((d.value / kpiMetrics.totalCount) * 100) : 0;
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700/60 text-xs min-w-[170px]">
                                <div className="font-bold flex items-center gap-1.5 mb-1" style={{ color: d.color }}>
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                  <span>{d.name}</span>
                                </div>
                                <div className="text-slate-300 flex justify-between font-medium">
                                  <span>Jumlah Item:</span>
                                  <span className="font-bold text-white">{d.value} ({pct}%)</span>
                                </div>
                                <div className="text-slate-300 flex justify-between font-medium mt-1">
                                  <span>Total Nilai:</span>
                                  <span className="font-mono font-bold text-amber-300">Rp {formatRp(d.amount)}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Dynamic Donut Center Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    {hoveredPieIndex !== null && statusDistributionData[hoveredPieIndex] ? (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 max-w-[90px] truncate">
                          {statusDistributionData[hoveredPieIndex].name}
                        </span>
                        <span className="text-xl font-black text-slate-900 leading-tight">
                          {statusDistributionData[hoveredPieIndex].value}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          {Math.round((statusDistributionData[hoveredPieIndex].value / (kpiMetrics.totalCount || 1)) * 100)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          TOTAL
                        </span>
                        <span className="text-2xl font-black text-slate-900 leading-none">
                          {kpiMetrics.totalCount}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                          Usulan
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Interactive Legend List with Percentages and Totals */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  {statusDistributionData.map((item, idx) => {
                    const pct = kpiMetrics.totalCount > 0 ? Math.round((item.value / kpiMetrics.totalCount) * 100) : 0;
                    const isHovered = hoveredPieIndex === idx;

                    return (
                      <div 
                        key={item.name}
                        onMouseEnter={() => setHoveredPieIndex(idx)}
                        onMouseLeave={() => setHoveredPieIndex(null)}
                        className={`flex items-center justify-between p-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
                          isHovered ? 'bg-slate-100 scale-[1.02]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                            style={{ backgroundColor: item.color }} 
                          />
                          <span className={`text-xs ${isHovered ? 'font-black text-slate-900' : 'font-medium text-slate-700'}`}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {item.value} <span className="text-[10px] font-medium text-slate-500">({pct}%)</span>
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-600 hidden sm:inline-block">
                            Rp {formatRp(item.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GRID ROW 2: TOP 5 UNIT KERJA RANKING + SPLINE AREA GROWTH CURVE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* PANEL 3: TOP 5 UNIT KERJA BY USULAN (6 COLS) */}
            <Card className="lg:col-span-6 bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-gray-50/60 p-4 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-emerald-600" />
                    <CardTitle className="text-sm font-black text-gray-900">
                      Top 5 Unit Kerja Usulan Terbesar
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Peringkat unit kerja dengan akumulasi usulan penambahan pagu tertinggi
                  </CardDescription>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                  Ranking
                </span>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5 flex-1">
                {top5Units.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    Tidak ada data unit kerja yang ditemukan.
                  </div>
                ) : (
                  top5Units.map((u, index) => {
                    const maxNominal = top5Units[0]?.totalNominalDiajukan || 1;
                    const proposedPct = Math.round((u.totalNominalDiajukan / maxNominal) * 100);
                    const approvedPct = u.totalNominalDiajukan > 0 ? Math.round((u.totalNominalDisetujui / u.totalNominalDiajukan) * 100) : 0;
                    const isHovered = hoveredUnitIdx === index;

                    const rankBadges = [
                      'bg-amber-100 text-amber-800 border-amber-300 font-black',
                      'bg-slate-200 text-slate-800 border-slate-300 font-black',
                      'bg-orange-100 text-orange-800 border-orange-300 font-black',
                      'bg-slate-100 text-slate-600 border-slate-200 font-bold',
                      'bg-slate-100 text-slate-600 border-slate-200 font-bold',
                    ];

                    return (
                      <div 
                        key={u.unit}
                        onMouseEnter={() => setHoveredUnitIdx(index)}
                        onMouseLeave={() => setHoveredUnitIdx(null)}
                        className={`p-3 rounded-2xl border transition-all duration-200 ${
                          isHovered 
                            ? 'bg-blue-50/50 border-blue-200 shadow-sm -translate-y-0.5' 
                            : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-5 h-5 rounded-lg border text-[10px] flex items-center justify-center shrink-0 ${rankBadges[index] || rankBadges[3]}`}>
                              #{index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {u.unit}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-black text-slate-900">
                              Rp {formatRp(u.totalNominalDiajukan)}
                            </span>
                          </div>
                        </div>

                        {/* Dual Progress Bar: Usulan vs Realisasi */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${proposedPct}%` }}
                              title={`Volume Usulan Relatif: ${proposedPct}%`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1 font-bold text-emerald-700">
                              <CheckCircle2 size={11} /> Realisasi: Rp {formatRp(u.totalNominalDisetujui)}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                              {approvedPct}% Disetujui
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* PANEL 4: SPLINE AREA CUMULATIVE GROWTH CURVE (6 COLS) */}
            <Card className="lg:col-span-6 bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
              <CardHeader className="bg-gray-50/60 p-4 px-5 border-b border-gray-100 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-indigo-600" />
                    <CardTitle className="text-sm font-black text-gray-900">
                      Laju Pertumbuhan Akumulatif (Jan - Des)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Progresi kurva akumulasi anggaran usulan dan realisasi sepanjang tahun
                  </CardDescription>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-100">
                  Kumulatif
                </span>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="h-[285px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeGrowthData} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="areaProposedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="areaApprovedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                        tickFormatter={(val) => val === 0 ? '0' : `Rp ${(val/1e6).toFixed(0)}jt`} 
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const pItem = payload.find((p: any) => p.dataKey === 'cumProposed');
                            const aItem = payload.find((p: any) => p.dataKey === 'cumApproved');
                            const cItem = payload.find((p: any) => p.dataKey === 'cumCount');
                            const pVal = pItem ? Number(pItem.value || 0) : 0;
                            const aVal = aItem ? Number(aItem.value || 0) : 0;
                            const cVal = cItem ? Number(cItem.value || 0) : 0;

                            return (
                              <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 text-xs min-w-[210px] space-y-2">
                                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                                  <span className="font-black text-slate-100">s/d Bulan {label}</span>
                                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {cVal} Surat Kumulatif
                                  </span>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Akumulasi Usulan:
                                    </span>
                                    <span className="font-mono font-bold text-white">Rp {formatRp(pVal)}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1.5 font-medium">
                                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Akumulasi Disetujui:
                                    </span>
                                    <span className="font-mono font-bold text-emerald-400">Rp {formatRp(aVal)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        wrapperStyle={{ paddingBottom: '12px', fontWeight: 700, fontSize: '11px' }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumProposed" 
                        name="Akumulasi Usulan" 
                        stroke="#3b82f6" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#areaProposedGrad)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cumApproved" 
                        name="Akumulasi Disetujui" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#areaApprovedGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* POP-UP DETAIL DIALOG (WHEN EYE ICON CLICKED) */}
      <Dialog open={!!viewDetailData} onOpenChange={(open) => !open && setViewDetailData(null)}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 sm:max-w-[750px] w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex justify-between items-center gap-2">
              <div>
                <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="text-emerald-600" size={20} />
                  Detail Usulan Tambah Pagu #{viewDetailData?.id}
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-xs mt-0.5">
                  {viewDetailData?.gov_units?.nama_unit || viewDetailData?.unit_kerja_nama || viewDetailData?.unit_pengusul} — Tahun {viewDetailData?.tahun_anggaran}
                </DialogDescription>
              </div>

              <Badge className={`px-3 py-1 text-xs font-black uppercase ${getStatusBadgeStyle(viewDetailData?.status_pengajuan)}`}>
                {viewDetailData?.status_pengajuan || 'Diajukan'}
              </Badge>
            </div>
          </DialogHeader>

          {viewDetailData && (
            <div className="space-y-6 text-xs mt-4">
              {/* TABEL PENGAJUAN */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 font-black text-slate-800 text-xs border-b border-slate-200 flex items-center gap-2">
                  <FileText size={14} className="text-indigo-600" /> I. Data Pengajuan Surat Masuk
                </div>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="w-36 bg-slate-50/50 font-bold text-slate-500">No Surat Pengajuan</TableCell>
                      <TableCell className="font-mono font-bold text-slate-900">{viewDetailData.no_surat_pengajuan || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="bg-slate-50/50 font-bold text-slate-500">Tanggal Pengajuan</TableCell>
                      <TableCell className="font-bold text-slate-700">{viewDetailData.tanggal_surat_pengajuan || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="bg-slate-50/50 font-bold text-slate-500">Hal / Perihal</TableCell>
                      <TableCell className="font-medium text-slate-800">{viewDetailData.hal_surat_pengajuan || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="bg-slate-50/50 font-bold text-slate-500">Sumber Entry Data</TableCell>
                      <TableCell>
                        {analisisNoSuratSet.has((viewDetailData.no_surat_pengajuan || '').trim().toLowerCase()) ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl">
                            <Sparkles size={13} className="text-indigo-600" /> Impor Analisis AI (/analisis)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl">
                            <Edit3 size={13} className="text-slate-500" /> Input Manual
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-amber-50/40">
                      <TableCell className="bg-amber-100/50 font-bold text-amber-900">Nominal Diajukan</TableCell>
                      <TableCell className="font-mono font-black text-amber-900 text-sm">
                        Rp {formatRp(viewDetailData.nominal_diajukan)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="bg-slate-50/50 font-bold text-slate-500">Berkas / Lampiran</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {viewDetailData.link_surat_pengajuan && (
                            <a href={getSafeFileUrl(viewDetailData.link_surat_pengajuan)} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                              <ExternalLink size={13} /> GDrive Link
                            </a>
                          )}
                          {viewDetailData.file_surat_pengajuan && (
                            <a href={getSafeFileUrl(viewDetailData.file_surat_pengajuan)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline flex items-center gap-1 ml-2">
                              <FileText size={13} /> File PDF
                            </a>
                          )}
                          {!viewDetailData.link_surat_pengajuan && !viewDetailData.file_surat_pengajuan && <span className="text-slate-400 font-medium">-</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* TABEL TANGGAPAN */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 font-black text-slate-800 text-xs border-b border-slate-200 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" /> II. Data Tanggapan Pimpinan
                </div>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="w-36 bg-slate-50/50 font-bold text-slate-500">No Surat Tanggapan</TableCell>
                      <TableCell className="font-mono font-bold text-slate-900">{viewDetailData.no_surat_tanggapan || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="bg-slate-50/50 font-bold text-slate-500">Tanggal Tanggapan</TableCell>
                      <TableCell className="font-bold text-slate-700">{viewDetailData.tanggal_surat_tanggapan || '-'}</TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50/40">
                      <TableCell className="bg-emerald-100/50 font-bold text-emerald-900">Nominal Disetujui</TableCell>
                      <TableCell className="font-mono font-black text-emerald-800 text-sm">
                        Rp {formatRp(viewDetailData.nominal_tanggapan || viewDetailData.nominal_disetujui || 0)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="bg-slate-50/50 font-bold text-slate-500">Berkas Tanggapan</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {viewDetailData.link_surat_tanggapan && (
                            <a href={getSafeFileUrl(viewDetailData.link_surat_tanggapan)} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                              <ExternalLink size={13} /> GDrive Link
                            </a>
                          )}
                          {viewDetailData.file_surat_tanggapan && (
                            <a href={getSafeFileUrl(viewDetailData.file_surat_tanggapan)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline flex items-center gap-1 ml-2">
                              <FileText size={13} /> File PDF
                            </a>
                          )}
                          {!viewDetailData.link_surat_tanggapan && !viewDetailData.file_surat_tanggapan && <span className="text-slate-400 font-medium">-</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* RINGKASAN AI */}
              {viewDetailData.ringkasan_substansi && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <span className="font-black text-amber-900 uppercase text-[10px] flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-600" /> Ringkasan Substansi AI
                  </span>
                  <div 
                    className="text-slate-800 font-medium leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: viewDetailData.ringkasan_substansi }}
                  />
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button 
                  variant="outline" 
                  onClick={() => setViewDetailData(null)}
                  className="rounded-xl font-bold text-xs"
                >
                  Tutup
                </Button>
                <Button 
                  onClick={() => {
                    const targetId = viewDetailData.id;
                    setViewDetailData(null);
                    router.push(`/tambah-pagu/view/${targetId}`);
                  }}
                  className="bg-slate-900 text-white rounded-xl font-bold text-xs"
                >
                  <ExternalLink size={14} className="mr-1.5" /> Buka Halaman Penuh
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
