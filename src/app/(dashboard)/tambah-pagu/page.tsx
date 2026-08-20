'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getTambahPagu } from '@/app/actions/tambah-pagu';
import { getMyPermissions } from '@/app/actions/surat';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, FileText, Calendar, Building2, 
  Tag, AlertCircle, CheckCircle2, Clock, Filter, 
  ChevronRight, MoreHorizontal, Download, Edit,
  ChevronUp, BarChart3, TrendingUp, LayoutGrid, ChevronDown,
  Wallet, CheckCircle, BarChart as ChartIcon, Eye,
  ChevronLeft, Sparkles, TrendingDown, FileSpreadsheet,
  ExternalLink, X, RefreshCw, Maximize2, Zap, Landmark, Scale, Edit3
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
        className="w-full h-[42px] px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-sm flex items-center justify-between gap-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Toggle Accordion Collapse for Summary Unit
  const toggleUnitAccordion = (unitName: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitName]: !prev[unitName] }));
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

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
    <div className="max-w-7xl mx-auto pb-32 px-4 pt-6 space-y-6">
      {/* ROW 1: HEADER PAGE TITLE & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1.5">
            <Sparkles size={16} className="text-amber-500" /> Portal Pengusulan Pagu Anggaran
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Tambah Pagu Anggaran
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">
            Pantau status permohonan penambahan pagu anggaran unit kerja UGM ({selectedYear}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Button 
            variant="outline" 
            onClick={() => router.push('/tambah-pagu/komparasi')}
            className="rounded-2xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-sm h-11"
          >
            <Scale size={16} className="mr-2 text-indigo-600" /> Komparasi DB Pagu
          </Button>

          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs shadow-sm h-11"
          >
            <FileSpreadsheet size={16} className="mr-2 text-emerald-600" /> Export Excel (.xlsx)
          </Button>

          {perms.can_create && (
            <Button
              onClick={() => router.push('/tambah-pagu/tambah')}
              className="bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl shadow-lg h-11 px-5 border-b-4 border-emerald-500 shrink-0"
            >
              <Plus size={16} className="mr-2" /> Tambah Usulan
            </Button>
          )}
        </div>
      </div>

      {/* ROW 2: 4 SUMMARY KPI CARDS (EXACT MATCHING SCREENSHOT REVIEW-ANGGARAN/UNIT-KERJA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL USULAN ANGGARAN */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">TOTAL USULAN ANGGARAN</span>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.totalAnggaranUsulan)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>{kpiMetrics.totalCount} Usulan Item</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">100%</span>
          </div>
        </div>

        {/* CARD 2: DISETUJUI SEMUA (100%) */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">DISETUJUI SEMUA (100%)</span>
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.approvedSemuaAnggaran)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-emerald-700 flex items-center justify-between">
            <span>{kpiMetrics.approvedSemuaCount} Item</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
              {kpiMetrics.approvedPct}%
            </span>
          </div>
        </div>

        {/* CARD 3: DISETUJUI SEBAGIAN */}
        <div className="bg-white rounded-3xl p-6 border border-indigo-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">DISETUJUI SEBAGIAN</span>
            <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.approvedSebagianAnggaran)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-indigo-700 flex items-center justify-between">
            <span>{kpiMetrics.approvedSebagianCount} Item</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Sebagian</span>
          </div>
        </div>

        {/* CARD 4: DITOLAK / DIAJUKAN */}
        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block mb-1">DITOLAK / DIAJUKAN</span>
            <div className="text-2xl font-black text-rose-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.rejectedAnggaran)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-rose-700 flex items-center justify-between">
            <span>{kpiMetrics.rejectedCount} Item</span>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">Proses/Tolak</span>
          </div>
        </div>
      </div>

      {/* ROW 3: SEPARATE FILTER TOOLBAR WITH SEARCHABLE AUTOCOMPLETE UNIT FILTER */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider shrink-0">
          <Zap size={16} className="text-amber-500" /> FILTER DATA:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
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
              className="w-full h-[42px] bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 outline-none cursor-pointer"
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
              className="w-full h-[42px] bg-slate-50 border border-slate-200 text-indigo-700 font-bold text-xs rounded-xl px-3 outline-none cursor-pointer font-bold"
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
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No Surat, Hal, Unit..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-[42px] bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* ROW 4: TAB NAVIGATION BAR (FULL WIDTH PAGE PILL NAVIGATION) */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'data' 
              ? 'bg-white text-slate-900 shadow-sm font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText size={16} />
          <span>📋 Tabel Data Detail ({filteredData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'summary' 
              ? 'bg-white text-slate-900 shadow-sm font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 size={16} />
          <span>🏢 Summary Per Unit Kerja ({unitSummaryData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`flex-1 py-3 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'chart' 
              ? 'bg-white text-slate-900 shadow-sm font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={16} />
          <span>📊 Visualisasi Tren & Grafis</span>
        </button>
      </div>

      {/* ROW 5: TAB CONTENT AREA */}

      {/* TAB 1: TABEL DATA DETAIL (NO GROUP ORG BADGE - UNIT KERJA & DETAIL SURAT PENGAJUAN COMBINED) */}
      {activeTab === 'data' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black text-slate-900">
                  Rincian Usulan Tambah Pagu ({filteredData.length} Records)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Kolom Unit Kerja & Detail Surat Pengajuan digabung tanpa badge group unit untuk tampilan ultra-ramping
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Baris per halaman:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <TableRow>
                    <TableHead className="w-10 text-center">No</TableHead>
                    <TableHead>Unit Kerja & Detail Surat Pengajuan (No, Tanggal, & Hal)</TableHead>
                    <TableHead className="w-56 text-right">Nominal Usulan & Disetujui</TableHead>
                    <TableHead className="w-44 text-center">Jenis & Status</TableHead>
                    <TableHead className="w-28 text-center">Aksi</TableHead>
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
                      const rowNum = indexOfFirstItem + idx + 1;

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
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewDetailData(item)}
                                title="Lihat Pop-up Detail"
                                className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => router.push(`/tambah-pagu/view/${item.id}`)}
                                title="Buka Halaman Penuh"
                                className="p-2 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white rounded-xl transition-all shadow-sm"
                              >
                                <ExternalLink size={14} />
                              </button>
                              {perms.can_create && (
                                <button
                                  onClick={() => router.push(`/tambah-pagu/edit/${item.id}`)}
                                  title="Edit Data"
                                  className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                                >
                                  <Edit size={14} />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
              <span className="text-slate-500 font-medium">
                Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredData.length)} dari {filteredData.length} records
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="h-8 text-xs font-bold"
                >
                  <ChevronLeft size={14} /> Prev
                </Button>
                <span className="font-bold text-slate-700 px-2">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-8 text-xs font-bold"
                >
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUMMARY PER UNIT KERJA (COLLAPSIBLE ACCORDION PER UNIT) */}
      {activeTab === 'summary' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
              <CardTitle className="text-base font-black text-slate-900">
                Ringkasan Usulan Anggaran Per Unit Kerja (Collapsible Accordion)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">
                Klik pada baris unit kerja untuk memperluas (expand) rincian surat usulan di dalamnya
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80 text-slate-500 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <TableRow>
                    <TableHead className="w-10 text-center"></TableHead>
                    <TableHead>Nama Unit Kerja</TableHead>
                    <TableHead className="text-center">Total Usulan Surat</TableHead>
                    <TableHead className="text-right">Total Nominal Diajukan (Rp)</TableHead>
                    <TableHead className="text-right text-emerald-700">Total Nominal Disetujui (Rp)</TableHead>
                    <TableHead className="text-center">% Disetujui</TableHead>
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
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setViewDetailData(subItem);
                                                }}
                                                className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-all"
                                                title="Lihat Pop-up Detail"
                                              >
                                                <Eye size={14} />
                                              </button>
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

      {/* TAB 3: VISUALISASI TREN & GRAFIS */}
      {activeTab === 'chart' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden bg-white p-6">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-base font-black text-slate-900">
                Grafik Volume & Nominal Usulan Tambah Pagu ({selectedYear})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">
                Perbandingan nominal usulan diajukan vs disetujui per bulan
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={statsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#475569' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(val) => `Rp ${(val/1e6).toFixed(0)}M`} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#f59e0b' }} />
                    <Tooltip formatter={(value: any, name: any) => [`Rp ${formatRp(value)}`, name === 'proposed' ? 'Nominal Diajukan' : 'Nominal Disetujui']} />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                    <Bar yAxisId="left" dataKey="proposed" name="Nominal Diajukan" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                    <Bar yAxisId="left" dataKey="approved" name="Nominal Disetujui" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                    <Line yAxisId="right" type="monotone" dataKey="count" name="Jumlah Surat" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
