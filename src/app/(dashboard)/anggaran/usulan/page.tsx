'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, Download, RefreshCw, 
  Search, Eye, Filter, Loader2, Database,
  CheckCircle, Clock, UploadCloud, Calendar, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function UsulanAnggaranPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [picFilter, setPicFilter] = useState('');
  const [selectedTP, setSelectedTP] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDownloadingMulti, setIsDownloadingMulti] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRawData(data || []);
    } catch (err: any) {
      console.error("Gagal ambil data:", err);
      alert("Gagal mengambil data: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const availableTPs = useMemo(() => {
    const tps = new Set<string>();
    rawData.forEach(item => {
      const t = item.tahun || item.Tahun;
      const p = item.periode || item.Periode;
      if (t && p) {
        tps.add(`${t} - ${p}`);
      }
    });
    // Sort descending by Year, then Period
    return Array.from(tps).sort((a, b) => b.localeCompare(a));
  }, [rawData]);

  useEffect(() => {
    if (availableTPs.length > 0 && !selectedTP) {
      setSelectedTP(availableTPs[0]); // default to latest
    }
  }, [availableTPs, selectedTP]);

  const handleProcess = async (id: number) => {
    if (!confirm("Tandai revisi ini sebagai Sudah Diproses?")) return;
    
    setIsLoading(true);
    try {
      // Waktu Jakarta (WIB)
      const options: Intl.DateTimeFormatOptions = { 
        timeZone: 'Asia/Jakarta', 
        year: 'numeric', month: 'short', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      };
      const jakartaTime = new Intl.DateTimeFormat('id-ID', options).format(new Date()) + ' WIB';
      
      const { error } = await supabase
        .from('form_submissions')
        .update({ 
           status: 'Sudah Diproses', 
           waktu_proses: jakartaTime 
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message + " (Pastikan tabel form_submissions memiliki kolom 'status' dan 'waktu_proses')");
      }
      
      alert("Berhasil diperbarui!");
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert("Gagal memproses: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const availablePics = useMemo(() => {
    const pics = rawData.map(item => item.pic || item.PIC).filter(Boolean);
    return Array.from(new Set(pics));
  }, [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      // Pencarian umum
      const matchesSearch = Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Filter PIC
      const itemPic = item.pic || item.PIC;
      const matchesPic = picFilter ? itemPic === picFilter : true;

      // Filter TP
      const t = item.tahun || item.Tahun;
      const p = item.periode || item.Periode;
      const itemTP = (t && p) ? `${t} - ${p}` : '';
      const matchesTP = selectedTP ? itemTP === selectedTP : true;

      return matchesSearch && matchesPic && matchesTP;
    });
  }, [rawData, searchQuery, picFilter, selectedTP]);

  const dashboardData = useMemo(() => {
    const unitCounts: Record<string, number> = {};
    filteredData.forEach(item => {
      const unit = item.unit || item.Unit || item['Unit Kerja'] || item.unit_kerja || 'Unknown';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    
    return Object.entries(unitCounts)
      .map(([name, Total]) => ({ name, Total }))
      .sort((a, b) => b.Total - a.Total); // Sort descending
  }, [filteredData]);

  // Reset selection when search/filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, picFilter, selectedTP]);

  const exportToCSV = () => {
    if (filteredData.length === 0) return;
    
    // Ambil semua key dari object pertama
    const headers = Object.keys(filteredData[0]);
    
    const rows = filteredData.map(item => {
      return headers.map(header => {
        let val = item[header] ?? '';
        // Escape quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Revisi_Terjadwal_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFileLink = (val: any) => {
    if (!val) return false;
    if (typeof val === 'string' && val.includes('http')) {
      return true;
    }
    if (Array.isArray(val) && val.length > 0) {
    if (typeof val[0] === 'string' && val[0].startsWith('http')) return true;
      if (typeof val[0] === 'object' && val[0] !== null && val[0].url && val[0].url.includes('http')) return true;
    }
    return false;
  };

  const extractFilesFromValue = (val: any) => {
    let files: {url: string, name: string}[] = [];

    const extractFiles = (items: any[]) => {
      return items.map(item => {
        if (typeof item === 'string') return { url: item, name: item.split('/').pop() || 'file' };
        if (typeof item === 'object' && item !== null && item.url) return { url: item.url, name: item.name || item.url.split('/').pop() || 'file' };
        return null;
      }).filter(f => f && f.url.includes('http')) as {url: string, name: string}[];
    };

    if (Array.isArray(val)) {
      files = extractFiles(val);
    } else if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          files = extractFiles(parsed);
        } else if (typeof parsed === 'object' && parsed !== null && parsed.url) {
          files = [{ url: parsed.url, name: parsed.name || 'file' }];
        } else {
          files = [{ url: val, name: 'file' }];
        }
      } catch {
        files = val.split(',').map((s: string) => s.trim()).filter((s: string) => s.includes('http')).map((s: string) => ({ url: s, name: s.split('/').pop() || 'file' }));
        if(files.length === 0 && val.includes('http')) files = [{ url: val, name: 'file' }];
      }
    } else if (typeof val === 'object' && val !== null && val.url) {
      files = [{ url: val.url, name: val.name || 'file' }];
    }
    
    return files;
  };

  const handleDownloadCustomName = async (url: string, originalName: string, unitVal: string, uploadTime: string) => {
    try {
      const ext = originalName.split('.').pop() || 'file';
      const now = uploadTime ? new Date(uploadTime) : new Date();
      const timeStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      
      const cleanUnit = (unitVal || 'Unit').replace(/[^a-zA-Z0-9]/g, '_');
      const newFileName = `${cleanUnit}_${timeStr}.${ext}`;
      
      const response = await fetch(url);
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = newFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("Gagal download blob, fallback buka tab:", err);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMultiDownload = async () => {
    if (selectedIds.length === 0) return;
    setIsDownloadingMulti(true);
    
    const selectedRows = filteredData.filter(row => selectedIds.includes(row.id));
    let allFiles: { url: string, name: string, unitVal: string, uploadTime: string }[] = [];
    
    selectedRows.forEach(row => {
       const unitVal = row['unit'] || row['Unit'] || row['Unit Kerja'] || row['unit_kerja'] || '-';
       const uploadTime = row['created_at'];
       Object.keys(row).forEach(key => {
         if (isFileLink(row[key])) {
            const files = extractFilesFromValue(row[key]);
            files.forEach(f => {
               allFiles.push({ ...f, unitVal, uploadTime });
            });
         }
       });
    });

    if (allFiles.length === 0) {
      alert("Tidak ada lampiran yang ditemukan pada baris yang dipilih.");
      setIsDownloadingMulti(false);
      return;
    }

    const confirmDownload = confirm(`Ditemukan ${allFiles.length} file untuk didownload.\nCatatan: Browser mungkin meminta izin untuk mengunduh banyak file sekaligus (Allow multiple downloads). Mohon izinkan jika ditanya.\nLanjutkan?`);
    if (!confirmDownload) {
      setIsDownloadingMulti(false);
      return;
    }

    for (let i = 0; i < allFiles.length; i++) {
       const file = allFiles[i];
       await handleDownloadCustomName(file.url, file.name, file.unitVal, file.uploadTime);
       // Delay 800ms agar browser tidak ngeblok multiple download
       await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setIsDownloadingMulti(false);
  };

  const renderFileLinks = (val: any, unitVal: string, uploadTime: string) => {
    const files = extractFilesFromValue(val);

    if (files.length === 0) return <span>-</span>;

    if (files.length === 1) {
      return (
        <button 
          onClick={() => handleDownloadCustomName(files[0].url, files[0].name, unitVal, uploadTime)}
          className="group flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-emerald-500 text-indigo-600 hover:text-white border border-indigo-100 hover:border-emerald-600 rounded-lg transition-all active:scale-95 shadow-sm"
          title={`Download: ${files[0].name}`}
        >
          <Download size={14} strokeWidth={2.5} />
          <span className="text-[11px] font-black uppercase tracking-wider">Download</span>
        </button>
      );
    }

    return (
      <div className="relative inline-block">
        <select 
          onChange={(e) => {
            if(e.target.value !== "") {
              const file = files[parseInt(e.target.value)];
              handleDownloadCustomName(file.url, file.name, unitVal, uploadTime);
              e.target.value = ""; // Reset kembali ke pilihan awal
            }
          }}
          className="appearance-none pr-8 pl-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors w-36 shadow-sm truncate uppercase tracking-wider"
        >
          <option value="">{files.length} Lampiran</option>
          {files.map((file, i) => (
            <option key={i} value={i}>⬇ {file.name}</option>
          ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500">
          <Download size={14} strokeWidth={2.5} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Database size={150} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <FileText size={14} /> Anggaran
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-4">Revisi Terjadwal</h1>
          <p className="text-gray-500 font-medium max-w-md">Data revisi anggaran dari form submissions. Filter berdasarkan PIC, Tahun, Periode, dan ekspor ke Excel.</p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold text-xs hover:bg-gray-100 transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          {selectedIds.length > 0 && (
            <button 
              onClick={handleMultiDownload}
              disabled={isDownloadingMulti}
              className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              {isDownloadingMulti ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download {selectedIds.length} Data
            </button>
          )}
          <button 
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" /> Gambaran Revisi Anggaran {selectedTP ? `(${selectedTP})` : ''}
        </h2>
        {dashboardData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }} 
                  axisLine={false} 
                  tickLine={false} 
                  height={80}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }} 
                  axisLine={false} 
                  tickLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="Total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40}>
                  {dashboardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <BarChart3 size={48} className="opacity-20 mb-4" />
            <p className="font-bold">Belum ada data revisi untuk ditampilkan</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari data apa saja..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="w-full md:w-48">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={selectedTP}
                onChange={(e) => setSelectedTP(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
              >
                <option value="">Semua Tahun-Periode</option>
                {availableTPs.map((tp, idx) => (
                  <option key={idx} value={tp}>{tp}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={picFilter}
                onChange={(e) => setPicFilter(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
              >
                <option value="">Semua PIC</option>
                {availablePics.map((pic, idx) => (
                  <option key={idx} value={String(pic)}>{pic}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-bold">Memuat Data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-900 shadow-md">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(filteredData.map(r => r.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 w-16">NO</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Pengirim (Email & Unit)</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">PIC & Status</th>
                  
                  {Object.keys(filteredData[0] || {})
                    .filter(header => !['id', 'created_at', 'status', 'waktu_proses', 'email', 'Email', 'unit', 'Unit', 'pic', 'PIC', 'Unit Kerja', 'unit_kerja', 'tahun', 'Tahun', 'periode', 'Periode'].includes(header))
                    .map((header) => (
                    <th key={header} className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((row, idx) => {
                  const emailVal = row['email'] || row['Email'] || '-';
                  const unitVal = row['unit'] || row['Unit'] || row['Unit Kerja'] || row['unit_kerja'] || '-';
                  const picVal = row['pic'] || row['PIC'] || '-';
                  const tahunVal = row['tahun'] || row['Tahun'] || '-';
                  const periodeVal = row['periode'] || row['Periode'] || '-';

                  return (
                  <tr key={idx} className={`transition-colors group bg-white ${selectedIds.includes(row.id) ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/30'}`}>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-50 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, row.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== row.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-50">
                       <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-md font-black text-xs">{idx + 1}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap border-r border-gray-50">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-900">{emailVal}</span>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{unitVal}</span>
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                            TAHUN {tahunVal} • PERIODE {periodeVal}
                          </span>
                       </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap bg-gray-50/30 border-r border-gray-100">
                      <div className="flex flex-col gap-2 items-start">
                        <span className="text-xs font-black text-indigo-700 uppercase tracking-wide">{picVal}</span>
                        
                        <span className="text-[9px] text-gray-500 font-bold flex items-center gap-1" title="Waktu Upload">
                          <UploadCloud size={10} className="text-indigo-400" />
                          {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'} WIB
                        </span>
                        
                        {row.status === 'Sudah Diproses' ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md font-black text-[9px] uppercase tracking-wider border border-emerald-200">
                              <CheckCircle size={10} /> Selesai
                            </span>
                            {row.waktu_proses && (
                              <span className="text-[9px] text-gray-500 font-bold flex items-center gap-1">
                                <Clock size={10} className="text-emerald-600" /> {row.waktu_proses}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleProcess(row.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95"
                          >
                            <CheckCircle size={12} /> Proses Revisi
                          </button>
                        )}
                      </div>
                    </td>

                    {Object.keys(filteredData[0])
                      .filter(key => !['id', 'created_at', 'status', 'waktu_proses', 'email', 'Email', 'unit', 'Unit', 'pic', 'PIC', 'Unit Kerja', 'unit_kerja', 'tahun', 'Tahun', 'periode', 'Periode'].includes(key))
                      .map((key) => (
                      <td key={key} className="px-6 py-4 text-xs font-semibold text-gray-700 border-r border-gray-50">
                        {isFileLink(row[key]) ? (
                          renderFileLinks(row[key], unitVal, row.created_at)
                        ) : typeof row[key] === 'object' && row[key] !== null ? (
                          JSON.stringify(row[key])
                        ) : (
                          <div className="max-w-xs truncate" title={String(row[key] ?? '-')}>
                            {String(row[key] ?? '-')}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                )})}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Database className="mx-auto mb-4 opacity-20" size={48} />
              <p className="text-sm font-bold">Data Kosong atau Tidak Ditemukan</p>
            </div>
          )}
        </div>
        <div className="mt-4 text-[10px] font-bold text-gray-400 text-right uppercase tracking-widest">
          Menampilkan {filteredData.length} Data
        </div>
      </div>
    </div>
  );
}
