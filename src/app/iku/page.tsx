'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Target, Filter, Search, ChevronDown, ChevronUp, Download,
  Layers, CheckCircle2, Award, BookOpen, ExternalLink,
  RefreshCw, FileSpreadsheet, ArrowLeft, Building2, HelpCircle
} from 'lucide-react';
import ExcelJS from 'exceljs';

interface IkuItem {
  id: number;
  tujuan_id: string;
  tujuan_kode: string;
  tujuan_nama: string;
  indikator_tujuan_id: string;
  indikator_tujuan_kode: string;
  indikator_tujuan_nama: string;
  sasaran_id: string;
  sasaran_kode: string;
  sasaran_nama: string;
  indikator_sasaran_id: string;
  indikator_sasaran_kode: string;
  indikator_sasaran_nama: string;
  program_id: string;
  program_kode: string;
  program_nama: string;
  indikator_program_id: string;
  indikator_program_kode: string;
  indikator_program_nama: string;
  kegiatan_id: string;
  kegiatan_kode: string;
  kegiatan_nama: string;
  ref_iku: string;
  ref_tahun_iku: number;
}

interface IkuGroup {
  ref_iku: string;
  ref_tahun_iku: number;
  count: number;
  items: IkuItem[];
}

export default function PemetaanIkuPublicPage() {
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRef, setSelectedRef] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  const [loading, setLoading] = useState<boolean>(true);
  const [groups, setGroups] = useState<IkuGroup[]>([]);
  const [masters, setMasters] = useState<Array<{ id: number; ref_tahun_iku: number; nama_ref_iku: string }>>([]);
  const [totalMatched, setTotalMatched] = useState<number>(0);

  // Accordion open/close state: Map of ref_iku -> boolean
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Paging for Table View
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const fetchIkuData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tahun: selectedTahun,
        q: searchQuery,
        ref: selectedRef === 'ALL' ? '' : selectedRef,
        mode: 'grouped',
      });
      const res = await fetch(`/api/iku?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setGroups(json.groups || []);
        setMasters(json.masters || []);
        setTotalMatched(json.totalMatchedRows || 0);

        // Secara default expand 3 grup pertama yang memiliki data
        const initialExpanded: Record<string, boolean> = {};
        let openCount = 0;
        (json.groups || []).forEach((g: IkuGroup) => {
          if (g.count > 0 && openCount < 2) {
            initialExpanded[`${g.ref_tahun_iku}_${g.ref_iku}`] = true;
            openCount++;
          }
        });
        setExpandedGroups(initialExpanded);
      }
    } catch (err) {
      console.error('Error fetching IKU data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIkuData();
  }, [selectedTahun, selectedRef]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIkuData();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    groups.forEach(g => {
      allOpen[`${g.ref_tahun_iku}_${g.ref_iku}`] = true;
    });
    setExpandedGroups(allOpen);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

  // Flattened items for Table View
  const allFlattenedItems = useMemo(() => {
    const list: IkuItem[] = [];
    groups.forEach(g => {
      list.push(...g.items);
    });
    return list;
  }, [groups]);

  const paginatedTableItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allFlattenedItems.slice(start, start + pageSize);
  }, [allFlattenedItems, page, pageSize]);

  // Ekspor Excel
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Pemetaan IKU ${selectedTahun}`);

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tahun IKU', key: 'ref_tahun_iku', width: 12 },
      { header: 'Referensi IKU', key: 'ref_iku', width: 45 },
      { header: 'Kode Kegiatan', key: 'kegiatan_kode', width: 18 },
      { header: 'Nama Kegiatan', key: 'kegiatan_nama', width: 40 },
      { header: 'Kode Program', key: 'program_kode', width: 16 },
      { header: 'Nama Program', key: 'program_nama', width: 35 },
      { header: 'Indikator Program', key: 'indikator_program_nama', width: 35 },
      { header: 'Kode Sasaran', key: 'sasaran_kode', width: 14 },
      { header: 'Nama Sasaran', key: 'sasaran_nama', width: 35 },
      { header: 'Kode Tujuan', key: 'tujuan_kode', width: 12 },
      { header: 'Nama Tujuan', key: 'tujuan_nama', width: 35 },
    ];

    // Style Header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Indigo 900
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let counter = 1;
    allFlattenedItems.forEach(item => {
      sheet.addRow({
        no: counter++,
        ref_tahun_iku: item.ref_tahun_iku,
        ref_iku: item.ref_iku,
        kegiatan_kode: item.kegiatan_kode,
        kegiatan_nama: item.kegiatan_nama,
        program_kode: item.program_kode,
        program_nama: item.program_nama,
        indikator_program_nama: item.indikator_program_nama,
        sasaran_kode: item.sasaran_kode,
        sasaran_nama: item.sasaran_nama,
        tujuan_kode: item.tujuan_kode,
        tujuan_nama: item.tujuan_nama,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pemetaan_IKU_${selectedTahun}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/40 text-slate-800 antialiased font-sans">
      
      {/* PUBLIC NAVBAR (TANPA SIDE MENU) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 hover:scale-105 transition-all"
              title="Kembali ke Beranda"
            >
              <Target size={22} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  PORTAL PUBLIK
                </span>
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">•</span>
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Katalog Hirarki Kegiatan</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                Pemetaan Indikator Kinerja Utama (IKU)
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/input-rkat"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"
            >
              <FileSpreadsheet size={13} className="text-emerald-600" />
              <span>Form RKAT</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs"
            >
              <ArrowLeft size={13} />
              <span>Portal Keuangan</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* HERO / EXECUTIVE BANNER */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Decorative background glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-bold">
                <Award size={14} className="text-amber-300" />
                <span>Referensi &amp; Penyelarasan RKA Terpadu</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                Kamus Pemetaan IKU &amp; Hirarki Kegiatan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Pencarian dan penelusuran hubungan antara Tujuan, Sasaran, Program, dan Kegiatan RKAT terhadap Referensi IKU Kemendikbudristek / PTN-BH untuk Tahun Anggaran {selectedTahun === 'all' ? '2025 - 2026' : selectedTahun}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={loading || allFlattenedItems.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
                title="Unduh seluruh hasil pemetaan ke file Excel"
              >
                <Download size={14} />
                <span>Unduh Excel ({allFlattenedItems.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                TAHUN AKTIF
              </span>
              <div className="text-xl font-black text-slate-900 font-mono">
                {selectedTahun === 'all' ? 'Semua Tahun' : `Tahun ${selectedTahun}`}
              </div>
              <span className="text-[11px] font-bold text-blue-600">
                {selectedTahun === '2026' ? '17 Master IKU Baru' : selectedTahun === '2025' ? '11 Master IKU' : '28 Total Master'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Target size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                MASTER REFERENSI
              </span>
              <div className="text-xl font-black text-indigo-900 font-mono">
                {masters.length} <span className="text-xs font-bold text-slate-400 font-sans">IKU</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600">
                {groups.length} Grup Terdeteksi
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Layers size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                TOTAL KEGIATAN TERPETAKAN
              </span>
              <div className="text-xl font-black text-emerald-900 font-mono">
                {totalMatched.toLocaleString('id-ID')} <span className="text-xs font-bold text-slate-400 font-sans">Baris</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">
                Sesuai kriteria filter
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">
                SUMBER DATA
              </span>
              <div className="text-sm font-black text-slate-900 truncate max-w-[150px]">
                iku.xlsx (Local)
              </div>
              <span className="text-[11px] font-bold text-amber-600">
                Sinkron Database &amp; File
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <BookOpen size={20} />
            </div>
          </div>
        </div>

        {/* TOOLBAR FILTER & SEARCH SECTION */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Filter Tahun Pill */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 shrink-0">
                Tahun IKU:
              </span>
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
                {[
                  { id: '2026', label: 'Tahun 2026' },
                  { id: '2025', label: 'Tahun 2025' },
                  { id: 'all', label: 'Semua Tahun' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTahun(t.id);
                      setSelectedRef('ALL');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      selectedTahun === t.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle & Expand/Collapse */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'grouped' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers size={13} />
                  <span>Grup per IKU</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet size={13} />
                  <span>Tabel Flat</span>
                </button>
              </div>

              {viewMode === 'grouped' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Buka Semua
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Tutup Semua
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar & Dropdown Referensi */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
            {/* Search Input */}
            <div className="md:col-span-7 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari kode/nama kegiatan, program, sasaran, tujuan, atau kata kunci IKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Dropdown Filter Spesifik IKU */}
            <div className="md:col-span-5 relative">
              <select
                value={selectedRef}
                onChange={e => setSelectedRef(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer truncate"
              >
                <option value="ALL">-- Tampilkan Seluruh Referensi IKU ({masters.length}) --</option>
                {masters.map(m => (
                  <option key={`${m.ref_tahun_iku}_${m.id}`} value={m.nama_ref_iku}>
                    [{m.ref_tahun_iku}] {m.nama_ref_iku}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={32} className="animate-spin text-blue-600" />
            <p className="text-xs font-bold text-slate-500">Memuat data pemetaan IKU &amp; hirarki kegiatan...</p>
          </div>
        )}

        {/* CONTENT VIEW: GROUPED ACCORDION (DEFAULT) */}
        {!loading && viewMode === 'grouped' && (
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
                <Target size={36} className="mx-auto text-slate-300" />
                <h3 className="text-sm font-black text-slate-700">Tidak ada data pemetaan yang cocok</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Coba ubah kata kunci pencarian atau ganti filter tahun untuk melihat data lainnya.
                </p>
              </div>
            ) : (
              groups.map((group, groupIdx) => {
                const groupKey = `${group.ref_tahun_iku}_${group.ref_iku}`;
                const isExpanded = !!expandedGroups[groupKey];

                return (
                  <div
                    key={groupKey}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200 hover:border-blue-300/80"
                  >
                    {/* Header Group (Clickable Accordion) */}
                    <div
                      onClick={() => toggleGroup(groupKey)}
                      className={`p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                        isExpanded ? 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border font-black text-xs ${
                          group.count > 0 
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs shadow-blue-200' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {groupIdx + 1}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                              TAHUN {group.ref_tahun_iku}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              group.count > 0 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              {group.count} Kegiatan Terpetakan
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-1 leading-snug">
                            {group.ref_iku}
                          </h3>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform ${
                          isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Body Table of Mapped Activities */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
                        {group.count === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            Belum ada rincian kegiatan yang terpetakan ke referensi IKU ini pada kata kunci pencarian.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-wider">
                                  <th className="py-3 px-3 text-center w-12">No</th>
                                  <th className="py-3 px-4 min-w-[260px]">Kegiatan (RKAT)</th>
                                  <th className="py-3 px-4 min-w-[240px]">Program &amp; Indikator</th>
                                  <th className="py-3 px-4 min-w-[220px]">Sasaran Strategis</th>
                                  <th className="py-3 px-4 min-w-[220px]">Tujuan Pendidikan</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {group.items.map((it, itemIdx) => (
                                  <tr 
                                    key={`${it.id}_${itemIdx}`} 
                                    className="hover:bg-blue-50/40 transition-colors"
                                  >
                                    <td className="py-3 px-3 text-center text-slate-400 font-bold text-[11px]">
                                      {itemIdx + 1}
                                    </td>
                                    
                                    {/* Kegiatan */}
                                    <td className="py-3 px-4 align-top">
                                      <div className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block mb-1">
                                        {it.kegiatan_kode || '-'}
                                      </div>
                                      <p className="font-bold text-slate-900 text-xs leading-snug">
                                        {it.kegiatan_nama || '-'}
                                      </p>
                                    </td>

                                    {/* Program */}
                                    <td className="py-3 px-4 align-top space-y-1">
                                      <div className="text-[11px] font-bold text-slate-800">
                                        <span className="font-mono text-slate-500 font-semibold">{it.program_kode}</span> {it.program_nama}
                                      </div>
                                      {it.indikator_program_nama && (
                                        <p className="text-[11px] text-slate-500 leading-tight">
                                          <span className="font-bold text-slate-600">Indikator:</span> {it.indikator_program_nama}
                                        </p>
                                      )}
                                    </td>

                                    {/* Sasaran */}
                                    <td className="py-3 px-4 align-top space-y-1">
                                      <div className="text-[11px] font-bold text-slate-800">
                                        <span className="font-mono text-slate-500 font-semibold">{it.sasaran_kode}</span> {it.sasaran_nama}
                                      </div>
                                      {it.indikator_sasaran_nama && (
                                        <p className="text-[11px] text-slate-500 leading-tight">
                                          <span className="font-bold text-slate-600">Indikator:</span> {it.indikator_sasaran_nama}
                                        </p>
                                      )}
                                    </td>

                                    {/* Tujuan */}
                                    <td className="py-3 px-4 align-top space-y-1">
                                      <div className="text-[11px] font-bold text-slate-800">
                                        <span className="font-mono text-slate-500 font-semibold">{it.tujuan_kode}</span> {it.tujuan_nama}
                                      </div>
                                      {it.indikator_tujuan_nama && (
                                        <p className="text-[11px] text-slate-500 leading-tight">
                                          <span className="font-bold text-slate-600">Indikator:</span> {it.indikator_tujuan_nama}
                                        </p>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CONTENT VIEW: TABLE FLAT (TABULAR) */}
        {!loading && viewMode === 'table' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Daftar Seluruh Pemetaan Kegiatan ({allFlattenedItems.length} Baris)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tampilan matriks tabel data per baris pemetaan hirarki RKAT ke referensi IKU.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>Per Halaman:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3 text-center w-20">Tahun</th>
                    <th className="py-3 px-4 min-w-[240px]">Referensi IKU</th>
                    <th className="py-3 px-4 min-w-[260px]">Kegiatan (RKAT)</th>
                    <th className="py-3 px-4 min-w-[220px]">Program</th>
                    <th className="py-3 px-4 min-w-[200px]">Sasaran</th>
                    <th className="py-3 px-4 min-w-[200px]">Tujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedTableItems.map((it, idx) => {
                    const rowNum = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr key={`${it.id}_table_${idx}`} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-400 font-bold text-[11px]">
                          {rowNum}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                            {it.ref_tahun_iku}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-top font-bold text-slate-800 text-xs">
                          {it.ref_iku}
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block mb-1">
                            {it.kegiatan_kode || '-'}
                          </div>
                          <p className="font-bold text-slate-900 leading-snug">
                            {it.kegiatan_nama}
                          </p>
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-[11px]">
                          <span className="font-mono font-semibold">{it.program_kode}</span> {it.program_nama}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-[11px]">
                          <span className="font-mono font-semibold">{it.sasaran_kode}</span> {it.sasaran_nama}
                        </td>
                        <td className="py-3 px-4 align-top text-slate-700 text-[11px]">
                          <span className="font-mono font-semibold">{it.tujuan_kode}</span> {it.tujuan_nama}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, allFlattenedItems.length)} dari {allFlattenedItems.length} baris
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700">
                  Halaman {page} dari {Math.ceil(allFlattenedItems.length / pageSize) || 1}
                </span>
                <button
                  type="button"
                  disabled={page >= Math.ceil(allFlattenedItems.length / pageSize)}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200 mt-12 text-center text-xs text-slate-400 font-medium">
        <p>© {new Date().getFullYear()} Portal Keuangan — Kamus &amp; Pemetaan Referensi Indikator Kinerja Utama (IKU)</p>
      </footer>
    </div>
  );
}
