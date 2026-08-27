'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getSuratRevisi, getMyPermissions } from '@/app/actions/surat';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Search, Plus, FileText, ExternalLink, Calendar, 
  User, Tag, Clock, Filter, X, ChevronDown, 
  Edit2, Eye, LayoutGrid, List as ListIcon, Building2,
  ChevronLeft, ChevronRight, MoreHorizontal, BarChart3,
  TrendingUp, ArrowUpRight, ChevronUp, FileSpreadsheet, Download as DownloadIcon
} from 'lucide-react';
import Select from 'react-select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function DaftarSuratPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<any[]>([]);
  const [unitOptions, setUnitOptions] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [selectedKlasifikasi, setSelectedKlasifikasi] = useState<any[]>([]);
  const [klasifikasiOptions, setKlasifikasiOptions] = useState<any[]>([]);
  const [perms, setPerms] = useState<any>({ can_view: true, can_create: false, can_edit: true, can_delete: false });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const [result, myPerms] = await Promise.all([
        getSuratRevisi(),
        getMyPermissions('/surat', session?.access_token, session?.user?.id, session?.user?.email)
      ]);
      
      const rawData = result || [];
      setData(rawData);
      setPerms(myPerms || { can_view: true, can_create: false, can_edit: true, can_delete: false });
      
      const units = rawData.reduce((acc: any[], item: any) => {
        const unitName = item.gov_units?.nama_unit || 'Unknown';
        if (!acc.find(u => u.label === unitName)) {
          acc.push({ value: unitName, label: unitName });
        }
        return acc;
      }, []) || [];
      setUnitOptions(units);

      const years = Array.from(new Set(rawData.map((item: any) => item.tahun_anggaran?.toString()).filter(Boolean))).sort().reverse() as string[];
      setYearOptions(years.length > 0 ? years : ['2026', '2025']);

      const jenisSet = new Set<string>();
      rawData.forEach(item => {
        if (Array.isArray(item.jenis_json)) {
          item.jenis_json.forEach((j: string) => jenisSet.add(j));
        }
      });
      setKlasifikasiOptions(Array.from(jenisSet).sort().map((j: string) => ({ value: j, label: j })));
      
    } catch (error) {
      console.error("Gagal mengambil data surat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Kalkulasi Statistik (Point: Monthly Stats with Unit Counts)
  const statsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyCounts: any = {};
    
    monthNames.forEach(m => monthlyCounts[m] = { name: m, total: 0, unitMap: {} });

    data.filter(d => d.tahun_anggaran?.toString() === (selectedYear === 'Semua Tahun' ? '2026' : selectedYear)).forEach(item => {
      if (item.tanggal_surat) {
        const date = new Date(item.tanggal_surat);
        const monthLabel = monthNames[date.getMonth()];
        if (monthlyCounts[monthLabel]) {
          monthlyCounts[monthLabel].total += 1;
          const uName = item.gov_units?.nama_unit || 'Unknown';
          monthlyCounts[monthLabel].unitMap[uName] = (monthlyCounts[monthLabel].unitMap[uName] || 0) + 1;
        }
      }
    });

    return Object.values(monthlyCounts).map((m: any) => ({
      ...m,
      unitList: Object.entries(m.unitMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a: any, b: any) => b.count - a.count)
    }));
  }, [data, selectedYear]);

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.no_surat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.perihal_surat?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnit = 
      selectedUnits.length === 0 || 
      selectedUnits.some(u => u.value === item.gov_units?.nama_unit);

    const matchesYear = 
      selectedYear === 'Semua Tahun' || 
      item.tahun_anggaran?.toString() === selectedYear;

    const matchesKlasifikasi = 
      selectedKlasifikasi.length === 0 || 
      selectedKlasifikasi.some(k => Array.isArray(item.jenis_json) && item.jenis_json.includes(k.value));

    return matchesSearch && matchesUnit && matchesYear && matchesKlasifikasi;
  });

  const unitStatsData = useMemo(() => {
    const unitCounts: any = {};
    filteredData.forEach(item => {
      const uName = item.gov_units?.nama_unit || 'Unknown';
      unitCounts[uName] = (unitCounts[uName] || 0) + 1;
    });

    return Object.entries(unitCounts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredData.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    if (itemsPerPage === -1) return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk di-export");

    // Header Kolom
    const headers = ["No", "No Surat", "Tanggal Surat", "Perihal", "Unit Kerja", "PIC", "Jenis Revisi", "Nominal Semula", "Nominal Menjadi", "Link Dokumen"];
    
    // Data Baris
    const csvContent = [
      headers.join(","), // Baris header
      ...filteredData.map((item, index) => {
        const row = [
          index + 1,
          `"${item.no_surat?.replace(/"/g, '""') || ''}"`,
          item.tanggal_surat || '',
          `"${item.perihal_surat?.replace(/"/g, '""') || ''}"`,
          `"${item.gov_units?.nama_unit || ''}"`,
          `"${item.pic || ''}"`,
          `"${Array.isArray(item.jenis_json) ? item.jenis_json.join('; ') : ''}"`,
          item.nominal_semula || 0,
          item.nominal_menjadi || 0,
          item.file_upload || item.link_google_drive || ''
        ];
        return row.join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `arsip_surat_${selectedYear}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col justify-center items-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">Memuat Arsip...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-4">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-xl text-white shadow-xs">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Arsip Surat & Laporan</h2>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {filteredData.length} Surat ({selectedYear !== 'Semua Tahun' ? selectedYear : 'Semua Tahun'})
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Database surat revisi anggaran, perihal, klasifikasi, & rekapitulasi unit kerja.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
          >
            {showStats ? <ChevronUp size={14} /> : <BarChart3 size={14} />}
            <span>{showStats ? "Tutup Statistik" : "Lihat Statistik"}</span>
          </button>

          <button 
            onClick={exportToExcel}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-xs border border-gray-200/80 h-[380px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Tren Surat Masuk Bulanan</h3>
              <div className="flex items-center gap-1 text-indigo-700 font-black text-[10px] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                <TrendingUp size={11} /> {selectedYear !== 'Semua Tahun' ? selectedYear : '2026'}
              </div>
            </div>
            <div className="h-[280px] w-full pr-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6b7280' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    content={({ active, payload, label }: any) => {
                      if (active && payload && payload.length) {
                        const mData = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 min-w-[180px] text-xs">
                            <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">{label} : {mData.total} Surat</p>
                            <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                              {mData.unitList.map((u: any, i: number) => (
                                <div key={i} className="flex justify-between items-center gap-2 text-[10px]">
                                   <span className="text-gray-600 truncate max-w-[130px]">{u.name}</span>
                                   <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">{u.count}</span>
                                </div>
                              ))}
                              {mData.unitList.length === 0 && <span className="text-[10px] text-gray-400">Belum ada surat</span>}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={24}>
                    {statsData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#4f46e5' : '#f3f4f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200/80 h-[380px] flex flex-col">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-indigo-600" /> Rekap Unit Bulanan
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {statsData.filter((s: any) => s.total > 0).map((s: any, idx) => (
                <MonthAccordion key={idx} data={s} />
              ))}
              {statsData.filter((s: any) => s.total > 0).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10">
                   <LayoutGrid size={24} strokeWidth={1} />
                   <p className="text-xs mt-2">Belum ada data untuk direkap.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* FILTER AREA */}
      <div className="bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Cari No Surat atau Perihal..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full h-9 pl-8 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold text-gray-700"
          />
        </div>
        
        <div className="w-full md:w-[140px]">
          <select 
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-gray-700 cursor-pointer"
          >
            <option value="Semua Tahun">Semua Tahun</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="w-full md:w-[220px]">
          <Select
            isMulti
            options={unitOptions}
            value={selectedUnits}
            onChange={(val: any) => { setSelectedUnits(val || []); setCurrentPage(1); }}
            placeholder="Filter Unit Kerja..."
            className="text-xs font-bold"
            styles={{
              control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
              valueContainer: (base) => ({ ...base, padding: '0 6px' })
            }}
          />
        </div>

        <div className="w-full md:w-[220px]">
          <Select
            isMulti
            options={klasifikasiOptions}
            value={selectedKlasifikasi}
            onChange={(val: any) => { setSelectedKlasifikasi(val || []); setCurrentPage(1); }}
            placeholder="Filter Klasifikasi..."
            className="text-xs font-bold"
            styles={{
              control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
              valueContainer: (base) => ({ ...base, padding: '0 6px' })
            }}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                <th className="px-5 py-3">Info & Perihal Dokumen</th>
                <th className="px-5 py-3">Unit & PIC</th>
                <th className="px-5 py-3">Klasifikasi</th>
                <th className="px-5 py-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentItems.length > 0 ? currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1 max-w-[380px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-mono font-bold rounded-md">{item.no_surat}</span>
                        {item.tanggal_selesai && <span className="w-2 h-2 bg-emerald-500 rounded-full" title="Selesai"></span>}
                      </div>
                      <span className="text-xs md:text-sm font-black text-gray-900 leading-snug group-hover:text-indigo-700 transition-colors">{item.perihal_surat}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Calendar size={11} />
                        <span>
                          {item.tanggal_surat ? new Date(item.tanggal_surat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                         <Building2 size={12} strokeWidth={2.5} />
                         <span className="text-xs font-bold tracking-tight">{item.gov_units?.nama_unit || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                        <User size={11} className="text-gray-400" />
                        <span>{item.pic || 'Anonim'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(item.jenis_json) && item.jenis_json.length > 0 ? (
                        item.jenis_json.map((j: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md border border-amber-200">
                            {j}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-300 italic text-[10px]">Umum</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex gap-2 justify-center">
                      {item.file_upload ? (
                        <a href={item.file_upload} target="_blank" className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100" title="Buka File">
                          <FileText size={20} />
                        </a>
                      ) : item.link_google_drive ? (
                        <a href={item.link_google_drive} target="_blank" className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100" title="Buka Link">
                          <ExternalLink size={20} />
                        </a>
                      ) : null}
                      {perms.can_edit && (
                        <Link href={`/surat/edit/${item.id}`} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-900 hover:text-white transition-all shadow-sm border border-gray-100" title="Edit Data">
                          <Edit2 size={20} />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center text-gray-400 font-bold italic bg-gray-50/30">
                    Belum ada dokumen yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
            {/* Left: Info */}
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-gray-900">{itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-gray-900">{itemsPerPage === -1 ? filteredData.length : Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> dari <strong className="text-gray-900">{filteredData.length}</strong> surat
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
                className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
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
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                  title="Sebelumnya"
                >
                  ‹ Prev
                </button>
                
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
                  Hal {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
      </div>
    </div>
  );
}

// Komponen Accordion untuk Rekap Bulanan
function MonthAccordion({ data }: { data: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-3xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center p-4 transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isOpen ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
            {data.name}
          </span>
          <span className="text-sm font-black italic">{data.total} Surat</span>
        </div>
        <ChevronDown size={18} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white space-y-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap gap-2">
            {data.unitList.map((u: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
                <span className="text-[10px] font-black text-gray-600">{u.name}</span>
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-100">
                  {u.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
