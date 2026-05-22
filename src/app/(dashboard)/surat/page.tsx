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
  const [showStats, setShowStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<any[]>([]);
  const [unitOptions, setUnitOptions] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [perms, setPerms] = useState<any>({ can_view: true, can_create: false, can_edit: true, can_delete: false });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    return matchesSearch && matchesUnit && matchesYear;
  });

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

  const exportToExcel = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk di-export");

    // Header Kolom
    const headers = ["No", "No Surat", "Tanggal Surat", "Perihal", "Unit Kerja", "PIC", "Jenis Revisi", "Link Dokumen"];
    
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
    <div className="max-w-7xl mx-auto pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Clock size={14} /> Repository Dokumen
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Arsip Surat</h1>
          <p className="text-gray-500 font-medium mt-2">Database revisi anggaran {selectedYear !== 'Semua Tahun' ? selectedYear : ''}.</p>
          
          <button 
            onClick={() => setShowStats(!showStats)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            {showStats ? <ChevronUp size={16} /> : <BarChart3 size={16} />}
            {showStats ? "TUTUP STATISTIK" : "LIHAT STATISTIK & REKAP"}
          </button>
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
              href="/surat/tambah" 
              className="flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black shadow-2xl hover:bg-black transition-all active:scale-95 border-b-4 border-indigo-500"
            >
              <Plus size={20} strokeWidth={4} /> TAMBAH SURAT
            </Link>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 h-[450px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-gray-800 tracking-tight">Tren Surat Masuk Bulanan</h3>
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] bg-indigo-50 px-3 py-1 rounded-full">
                <TrendingUp size={12} /> {selectedYear !== 'Semua Tahun' ? selectedYear : '2026'}
              </div>
            </div>
            <div className="h-[300px] w-full pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: '900', fill: '#9ca3af' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#d1d5db' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={32}>
                    {statsData.map((entry: any, index) => (
                      <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#4f46e5' : '#f3f4f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 h-[450px] flex flex-col">
            <h3 className="text-lg font-black text-gray-800 tracking-tight mb-6 flex items-center gap-2">
              <LayoutGrid size={20} className="text-indigo-600" /> Rekap Unit Bulanan
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {statsData.filter((s: any) => s.total > 0).map((s: any, idx) => (
                <MonthAccordion key={idx} data={s} />
              ))}
              {statsData.filter((s: any) => s.total > 0).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10">
                   <LayoutGrid size={32} strokeWidth={1} />
                   <p className="text-xs mt-2">Belum ada data untuk direkap.</p>
                </div>
              )}
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
            placeholder="Cari No Surat atau Perihal..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-16 pr-8 py-5 bg-gray-50 border-none rounded-[1.5rem] outline-none focus:ring-4 ring-indigo-50 transition-all font-bold text-gray-700"
          />
        </div>
        
        <div className="w-full md:w-[180px]">
          <select 
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
            className="w-full px-6 py-5 bg-gray-50 border-none rounded-[1.5rem] outline-none focus:ring-4 ring-indigo-50 transition-all font-black text-gray-700 appearance-none text-sm cursor-pointer text-center"
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

      {/* Table Section */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Info & Perihal Dokumen</th>
                <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Unit & PIC</th>
                <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Klasifikasi</th>
                <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.length > 0 ? currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/10 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2 max-w-[350px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-md">{item.no_surat}</span>
                        {item.tanggal_selesai && <div className="w-2 h-2 bg-emerald-500 rounded-full" title="Selesai"></div>}
                      </div>
                      <span className="text-[15px] font-black text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{item.perihal_surat}</span>
                      <div className="flex items-center gap-2 mt-1 opacity-40">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold">
                          {item.tanggal_surat ? new Date(item.tanggal_surat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-emerald-700">
                         <Building2 size={14} strokeWidth={3} />
                         <span className="text-[11px] font-black uppercase tracking-tight">{item.gov_units?.nama_unit || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-1">
                        <User size={12} className="text-gray-400" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{item.pic || 'Anonim'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(item.jenis_json) && item.jenis_json.length > 0 ? (
                        item.jenis_json.map((j: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-tighter border border-amber-100 shadow-sm">
                            {j}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-300 italic text-[11px]">Umum</span>
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
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
                    currentPage === page ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'bg-white text-gray-400 border border-gray-100 hover:border-indigo-200'
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
