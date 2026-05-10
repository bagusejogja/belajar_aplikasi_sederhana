'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getTambahPagu } from '@/app/actions/tambah-pagu';
import { getMyPermissions } from '@/app/actions/surat';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Plus, Search, FileText, Calendar, Building2, 
  Tag, AlertCircle, CheckCircle2, Clock, Filter, 
  ChevronRight, MoreHorizontal, Download, Edit,
  ChevronUp, BarChart3, TrendingUp, LayoutGrid, ChevronDown,
  Wallet, CheckCircle, BarChart as ChartIcon, Eye,
  ChevronLeft, Sparkles, TrendingDown, FileSpreadsheet
} from 'lucide-react';
import Select from 'react-select';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

export default function TambahPaguPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<any[]>([]);
  const [unitOptions, setUnitOptions] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [perms, setPerms] = useState<any>({ can_view: true, can_create: false });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const [myPerms, result] = await Promise.all([
        getMyPermissions('/tambah-pagu', session?.access_token, session?.user?.id, session?.user?.email),
        getTambahPagu()
      ]);
      
      setPerms(myPerms);
      const rawData = result || [];
      setData(rawData);
      
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
      
    } catch (error: any) {
      console.error("Gagal mengambil data tambah pagu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // LOGIKA TREN (YoY Apple-to-Apple)
  const trends = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Data Tahun Ini (Jan s/d Bulan Berjalan)
    const thisYearRange = data.filter(d => {
      const date = new Date(d.tanggal_surat_pengajuan);
      return date.getFullYear() === currentYear && date.getMonth() <= currentMonth;
    });
    const totalThisYear = thisYearRange.reduce((acc, curr) => acc + (curr.nominal_diajukan || 0), 0);

    // Data Tahun Lalu (Jan s/d Bulan Berjalan yang Sama)
    const lastYearRange = data.filter(d => {
      const date = new Date(d.tanggal_surat_pengajuan);
      return date.getFullYear() === currentYear - 1 && date.getMonth() <= currentMonth;
    });
    const totalLastYear = lastYearRange.reduce((acc, curr) => acc + (curr.nominal_diajukan || 0), 0);
    
    const diff = totalThisYear - totalLastYear;
    const percent = totalLastYear > 0 ? (diff / totalLastYear) * 100 : 0;

    return { diff, percent: Math.abs(percent).toFixed(1), isUp: diff >= 0 };
  }, [data]);

  const statsData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyCounts: any = {};
    monthNames.forEach(m => monthlyCounts[m] = { name: m, count: 0, proposed: 0, approved: 0, unitMap: {} });

    data.filter(d => d.tahun_anggaran?.toString() === (selectedYear === 'Semua Tahun' ? '2026' : selectedYear)).forEach(item => {
      if (item.tanggal_surat_pengajuan) {
        const date = new Date(item.tanggal_surat_pengajuan);
        const monthLabel = monthNames[date.getMonth()];
        if (monthlyCounts[monthLabel]) {
          monthlyCounts[monthLabel].count += 1;
          monthlyCounts[monthLabel].proposed += (item.nominal_diajukan || 0);
          monthlyCounts[monthLabel].approved += (item.nominal_tanggapan || 0);
          const uName = item.gov_units?.nama_unit || 'Unknown';
          if (!monthlyCounts[monthLabel].unitMap[uName]) {
            monthlyCounts[monthLabel].unitMap[uName] = { count: 0, nominal: 0, approved: 0 };
          }
          monthlyCounts[monthLabel].unitMap[uName].count += 1;
          monthlyCounts[monthLabel].unitMap[uName].nominal += (item.nominal_diajukan || 0);
          monthlyCounts[monthLabel].unitMap[uName].approved += (item.nominal_tanggapan || 0);
        }
      }
    });

    return Object.values(monthlyCounts).map((m: any) => ({
      ...m,
      unitList: Object.entries(m.unitMap)
        .map(([name, val]: any) => ({ name, ...val }))
        .sort((a: any, b: any) => b.nominal - a.nominal)
    }));
  }, [data, selectedYear]);

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.no_surat_pengajuan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hal_surat_pengajuan?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnit = 
      selectedUnits.length === 0 || 
      selectedUnits.some(u => u.value === item.gov_units?.nama_unit);

    const matchesYear = 
      selectedYear === 'Semua Tahun' || 
      item.tahun_anggaran?.toString() === selectedYear;

    return matchesSearch && matchesUnit && matchesYear;
  });

  // Logika Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

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

  const formatIDR = (val: number) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' M';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' jt';
    return val.toLocaleString('id-ID');
  };

  const exportToExcel = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk di-export");

    // Header Kolom
    const headers = ["No", "No Surat Pengajuan", "Tanggal Pengajuan", "Unit Kerja", "Jenis Pagu", "Hal Pengajuan", "Nominal Usulan", "Nominal Disetujui", "Status", "Ringkasan Substansi"];
    
    // Data Baris
    const csvContent = [
      headers.join(","), // Baris header
      ...filteredData.map((item, index) => {
        const row = [
          index + 1,
          `"${item.no_surat_pengajuan?.replace(/"/g, '""') || ''}"`,
          item.tanggal_surat_pengajuan || '',
          `"${item.gov_units?.nama_unit || ''}"`,
          `"${item.jenis_tambah_pagu || ''}"`,
          `"${item.hal_surat_pengajuan?.replace(/"/g, '""') || ''}"`,
          item.nominal_diajukan || 0,
          item.nominal_tanggapan || 0,
          `"${item.status_pengajuan || ''}"`,
          `"${item.ringkasan_substansi?.replace(/"/g, '""') || ''}"`
        ];
        return row.join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tambah_pagu_${selectedYear}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col justify-center items-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Memuat Dashboard Pagu...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-8">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Clock size={14} /> Anggaran & Pagu v2
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Tambah Pagu</h1>
          <p className="text-gray-500 font-medium mt-2">Monitoring usulan penambahan anggaran {selectedYear !== 'Semua Tahun' ? selectedYear : ''}.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-3 px-8 py-5 bg-emerald-50 text-emerald-700 rounded-[2rem] font-black shadow-sm hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100"
          >
            <FileSpreadsheet size={20} /> EXPORT EXCEL
          </button>
          {perms.can_create && (
            <Link 
              href="/tambah-pagu/tambah" 
              className="flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-2xl hover:bg-black transition-all active:scale-95 border-b-4 border-emerald-500"
            >
              <Plus size={20} strokeWidth={4} /> TAMBAH USULAN
            </Link>
          )}
        </div>
      </div>

      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <SummaryCard 
          label="Total Nominal Usulan" 
          value={`Rp ${statsData.reduce((acc: any, curr: any) => acc + curr.proposed, 0).toLocaleString('id-ID')}`} 
          icon={<Wallet className="text-blue-600" />} 
          bg="bg-blue-50/50" 
          trend={`${trends.isUp ? '↑' : '↓'} ${trends.percent}% vs thn lalu (Jan-${new Date().toLocaleDateString('id-ID', { month: 'short' })})`}
          isPositive={trends.isUp}
        />
        <SummaryCard 
          label="Total Disetujui" 
          value={`Rp ${statsData.reduce((acc: any, curr: any) => acc + curr.approved, 0).toLocaleString('id-ID')}`} 
          icon={<CheckCircle className="text-emerald-600" />} 
          bg="bg-emerald-50/50" 
          trend={trends.diff >= 0 ? `↑ ${trends.percent}% bulan ini` : `↓ ${trends.percent}% bulan ini`}
          isPositive={trends.diff >= 0}
        />
        <SummaryCard 
          label="Volume Usulan" 
          value={`${statsData.reduce((acc: any, curr: any) => acc + curr.count, 0)} Surat`} 
          icon={<FileText className="text-amber-600" />} 
          bg="bg-amber-50/50" 
        />
      </div>

      {/* Action Toggle */}
      <div className="mb-8">
        <button 
          onClick={() => setShowStats(!showStats)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 rounded-2xl text-xs font-black hover:bg-emerald-50 transition-all border border-emerald-100 shadow-sm"
        >
          {showStats ? <ChevronUp size={16} /> : <ChartIcon size={16} />}
          {showStats ? "TUTUP GRAFIK ANALISIS" : "BUKA GRAFIK ANALISIS & TREND"}
        </button>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className="flex flex-col gap-8 mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tren Anggaran & Volume Usulan</h3>
                <p className="text-gray-400 font-medium text-sm">Nominal anggaran (Bar - Kiri) dan jumlah surat (Garis - Kanan).</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] bg-emerald-50 px-4 py-2 rounded-full">
                <TrendingUp size={14} /> TAHUN {selectedYear !== 'Semua Tahun' ? selectedYear : '2026'}
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={statsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '900', fill: '#9ca3af' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#d1d5db' }} tickFormatter={(val) => formatIDR(val)} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#fbbf24' }} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1.5rem' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'proposed' || name === 'approved') return ['Rp ' + value.toLocaleString('id-ID'), name === 'proposed' ? 'Usulan' : 'Disetujui'];
                      return [value + ' Surat', 'Jumlah Usulan'];
                    }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontWeight: 'bold', fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="proposed" name="proposed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar yAxisId="left" dataKey="approved" name="approved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                  <Line yAxisId="right" type="monotone" dataKey="count" name="count" stroke="#fbbf24" strokeWidth={4} dot={{ r: 6, fill: '#fbbf24', strokeWidth: 3, stroke: '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-8 flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                <LayoutGrid size={24} />
              </div>
              Rekap Unit Bulanan
            </h3>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
              {statsData.filter((s: any) => s.count > 0).map((s: any, idx) => (
                <MonthAccordion key={idx} data={s} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Area */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          <input 
            type="text" 
            placeholder="Cari No Surat atau Hal Pengajuan..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[1.5rem] outline-none focus:ring-4 ring-emerald-50 transition-all font-bold text-gray-700"
          />
        </div>
        
        <div className="w-full md:w-[180px]">
          <select 
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            className="w-full px-6 py-5 bg-gray-50 border-none rounded-[1.5rem] outline-none focus:ring-4 ring-emerald-50 transition-all font-black text-gray-700 appearance-none text-sm cursor-pointer text-center"
          >
            <option value="Semua Tahun">📅 Semua</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="w-full md:w-[320px]">
          <Select
            isMulti
            options={unitOptions}
            value={selectedUnits}
            onChange={(val: any) => { setSelectedUnits(val || []); setCurrentPage(1); }}
            placeholder="Filter Unit Kerja..."
            styles={{
              control: (base) => ({ ...base, borderRadius: '1.5rem', padding: '0.6rem', border: 'none', backgroundColor: '#f9fafb', fontWeight: 'bold' }),
            }}
          />
        </div>
      </div>

      {/* List Section */}
      <div className="grid grid-cols-1 gap-8">
        {currentItems.length > 0 ? currentItems.map((item) => (
          <div key={item.id} className="bg-white/80 backdrop-blur-md p-8 rounded-[3.5rem] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/10 group-hover:bg-emerald-500 transition-all duration-500"></div>
            <div className="flex flex-col md:flex-row justify-between gap-10">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl uppercase tracking-[0.15em] border border-emerald-100/50">
                    {item.jenis_tambah_pagu}
                  </span>
                  <span className={`px-4 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-[0.15em] border ${
                    item.status_pengajuan === 'Disetujui Semua' ? 'bg-green-50 text-green-700 border-green-100/50' :
                    item.status_pengajuan === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-100/50' :
                    'bg-amber-50 text-amber-700 border-amber-100/50'
                  }`}>
                    {item.status_pengajuan}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors duration-300">{item.hal_surat_pengajuan}</h3>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="h-px w-8 bg-emerald-100"></div>
                    <p className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase">{item.no_surat_pengajuan}</p>
                  </div>
                </div>

                {/* AI Insight Box (No 5) */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100/50 relative overflow-hidden group/insight">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-amber-100 text-amber-600 rounded-lg">
                      <Sparkles size={12} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Ringkasan Cerdas</p>
                      <p className="text-[11px] text-gray-500 leading-relaxed italic line-clamp-2">
                        {item.ringkasan_substansi || "Analisis substansi sedang diproses oleh sistem untuk memberikan ringkasan usulan yang lebih akurat."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100">
                      <Building2 size={16} />
                    </div>
                    <span className="text-xs font-black text-gray-600 uppercase tracking-tight">{item.gov_units?.nama_unit}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100">
                      <Calendar size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase">{item.tanggal_surat_pengajuan}</span>
                  </div>
                </div>
              </div>

              <div className="md:w-[320px] flex flex-col justify-between items-end bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100/50 gap-8">
                <div className="text-right space-y-5 w-full">
                  <div className="relative">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1">Proposed</p>
                    <p className="text-xl font-black text-gray-900 font-mono tracking-tighter">
                      Rp {item.nominal_diajukan?.toLocaleString('id-ID')}
                    </p>
                  </div>
                  {item.nominal_tanggapan > 0 && (
                    <div className="relative pt-4 border-t border-dashed border-gray-200">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-1">Approved</p>
                      <p className="text-xl font-black text-emerald-600 font-mono tracking-tighter">
                        Rp {item.nominal_tanggapan?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col lg:flex-row items-center gap-2 justify-end w-full">
                  <div className="flex gap-2">
                    {item.file_surat_pengajuan && (
                      <a 
                        href={item.file_surat_pengajuan} 
                        target="_blank" 
                        className="w-12 h-12 bg-white border border-gray-100 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center group/file"
                        title="Surat Pengajuan"
                      >
                        <FileText size={18} className="group-hover/file:scale-110 transition-transform" />
                      </a>
                    )}
                    {item.file_surat_tanggapan && (
                      <a 
                        href={item.file_surat_tanggapan} 
                        target="_blank" 
                        className="w-12 h-12 bg-white border border-gray-100 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center group/check"
                        title="Surat Tanggapan"
                      >
                        <CheckCircle2 size={18} className="group-hover/check:scale-110 transition-transform" />
                      </a>
                    )}
                  </div>
                  
                  <div className="flex gap-2 border-l border-gray-200 pl-2">
                    <Link 
                      href={`/tambah-pagu/view/${item.id}`}
                      className="w-12 h-12 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center hover:-translate-y-1"
                      title="View Detail & PDF"
                    >
                      <Eye size={18} />
                    </Link>
                    
                    {perms.can_edit && (
                      <Link 
                        href={`/tambah-pagu/edit/${item.id}`}
                        className="w-12 h-12 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 flex items-center justify-center hover:-translate-y-1"
                        title="Edit Usulan"
                      >
                        <Edit size={18} className="text-emerald-400" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-gray-400 font-bold italic">
            Belum ada usulan tambah pagu yang ditemukan.
          </div>
        )}
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-16">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 disabled:opacity-20 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <div key={`dots-${idx}`} className="w-10 flex justify-center text-gray-300">
                  <MoreHorizontal size={20} />
                </div>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => paginate(page as number)}
                  className={`w-12 h-12 rounded-2xl font-black transition-all ${
                    currentPage === page ? 'bg-emerald-600 text-white shadow-xl scale-110' : 'bg-white text-gray-400 border border-gray-100 hover:border-emerald-200'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 disabled:opacity-20 hover:bg-gray-50 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

// Komponen Kartu Ringkasan
function SummaryCard({ label, value, icon, bg, trend, isPositive }: { label: string, value: string, icon: React.ReactNode, bg: string, trend?: string, isPositive?: boolean }) {
  return (
    <div className={`p-8 rounded-[3rem] ${bg} border border-white shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-500 relative overflow-hidden`}>
      <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-gray-900 tracking-tight">{value}</p>
        {trend && (
          <div className={`mt-2 flex items-center gap-1 text-[10px] font-black ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// Komponen Accordion untuk Rekap Bulanan
function MonthAccordion({ data }: { data: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatIDR = (val: number) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' M';
    if (val >= 1000000) return (val / 1000000).toFixed(1) + ' jt';
    return val.toLocaleString('id-ID');
  };

  return (
    <div className="border border-gray-100 rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-sm bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center px-8 py-6 transition-colors ${isOpen ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}
      >
        <div className="flex items-center gap-6">
          <span className={`text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${isOpen ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'}`}>
            {data.name}
          </span>
          <div className="flex flex-col items-start">
             <span className="text-sm font-black tracking-tight">{data.count} Usulan Surat</span>
             <div className="flex gap-4 mt-1 opacity-70">
                <span className="text-[10px] font-bold italic">Usul: Rp {formatIDR(data.proposed)}</span>
                <span className="text-[10px] font-bold italic">Setuju: Rp {formatIDR(data.approved)}</span>
             </div>
          </div>
        </div>
        <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-300 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Unit Kerja</th>
                  <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Jumlah</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Nominal Usul</th>
                  <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Disetujui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.unitList.map((u: any, idx: number) => (
                  <tr key={idx} className="hover:bg-emerald-50/20 transition-colors group">
                    <td className="px-8 py-4">
                      <span className="text-[11px] font-black text-gray-700 uppercase tracking-tight group-hover:text-emerald-600">{u.name}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-black rounded-md">{u.count}x</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-bold text-gray-600">Rp {formatIDR(u.nominal)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[11px] font-black text-emerald-600">Rp {formatIDR(u.approved)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
