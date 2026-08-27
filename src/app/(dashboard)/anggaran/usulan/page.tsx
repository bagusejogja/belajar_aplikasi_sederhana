'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, Download, RefreshCw, 
  Search, Eye, Filter, Loader2, Database,
  CheckCircle, Clock, UploadCloud, Calendar, BarChart3, ClipboardList
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function UsulanAnggaranPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [unitGroups, setUnitGroups] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [picFilter, setPicFilter] = useState('');
  const [selectedTP, setSelectedTP] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDownloadingMulti, setIsDownloadingMulti] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [formRes, unitsRes] = await Promise.all([
        supabase.from('form_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('gov_units').select('nama_unit, group_org')
      ]);

      if (formRes.error) throw formRes.error;
      setRawData(formRes.data || []);
      
      if (unitsRes.data) {
        const mapping: Record<string, string> = {};
        unitsRes.data.forEach(u => {
           if (u.nama_unit && u.group_org) {
             mapping[u.nama_unit] = u.group_org;
           }
        });
        setUnitGroups(mapping);
      }
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
    const filtered = rawData.filter(item => {
      const matchesSearch = Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
      const itemPic = item.pic || item.PIC;
      const matchesPic = picFilter ? itemPic === picFilter : true;
      const t = item.tahun || item.Tahun;
      const p = item.periode || item.Periode;
      const itemTP = (t && p) ? `${t} - ${p}` : '';
      const matchesTP = selectedTP ? itemTP === selectedTP : true;
      return matchesSearch && matchesPic && matchesTP;
    });
    // sort: yang belum selesai (bukan 'Sudah Diproses') ditaruh di atas, lalu urut tanggal terbaru
    filtered.sort((a, b) => {
      const isADone = (a.status ?? '') === 'Sudah Diproses';
      const isBDone = (b.status ?? '') === 'Sudah Diproses';
      
      if (!isADone && isBDone) return -1;
      if (isADone && !isBDone) return 1;
      
      // Jika statusnya sama, urutkan berdasarkan created_at (terbaru di atas)
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
    return filtered;
  }, [rawData, searchQuery, picFilter, selectedTP]);

  const dashboardData = useMemo(() => {
    const unitCounts: Record<string, number> = {};
    filteredData.forEach(item => {
      const unit = item.unit || item.Unit || item['Unit Kerja'] || item.unit_kerja || 'Unknown';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    
    const freqGroups: Record<number, string[]> = {};
    Object.entries(unitCounts).forEach(([unit, count]) => {
       if (!freqGroups[count]) freqGroups[count] = [];
       freqGroups[count].push(unit);
    });

    return Object.entries(freqGroups)
      .map(([Total, units]) => ({ name: units.join(', '), Total: Number(Total) }))
      .sort((a, b) => b.Total - a.Total); // Sort descending by frequency
  }, [filteredData]);

  const chartData = useMemo(() => {
    const unitCounts: Record<string, number> = {};
    filteredData.forEach(item => {
      const unit = item.unit || item.Unit || item['Unit Kerja'] || item.unit_kerja || 'Unknown';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    return Object.entries(unitCounts)
      .map(([unit, count]) => ({ name: unit, Total: count }))
      .sort((a, b) => b.Total - a.Total);
  }, [filteredData]);

  // Reset selection & page when search/filter changes
  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
  }, [searchQuery, picFilter, selectedTP, pageSize]);

  const paginatedData = useMemo(() => {
    if (pageSize === 'ALL') return filteredData;
    const size = Number(pageSize);
    const start = (currentPage - 1) * size;
    return filteredData.slice(start, start + size);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === 'ALL' || filteredData.length === 0) return 1;
    return Math.ceil(filteredData.length / Number(pageSize));
  }, [filteredData, pageSize]);

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

  const total = filteredData.length;
  const selesai = filteredData.filter(d => d.status === 'Sudah Diproses').length;
  const proses = filteredData.filter(d => d.status !== 'Sudah Diproses').length;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <ClipboardList size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Usulan Revisi Terjadwal
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {filteredData.length} Pengajuan ({selectedTP || 'Semua Periode'})
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Monitoring data revisi anggaran dari form submissions unit kerja.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={fetchData}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          
          {selectedIds.length > 0 && (
            <button 
              onClick={handleMultiDownload}
              disabled={isDownloadingMulti}
              className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {isDownloadingMulti ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Download {selectedIds.length} Data</span>
            </button>
          )}

          <button 
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Pengajuan */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-1">TOTAL PENGAJUAN</span>
              <div className="text-2xl font-black text-indigo-900 font-mono tracking-tight">{total}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ClipboardList size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-indigo-100/60 pt-2">
            <span>Periode {selectedTP || 'Semua'}</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">100%</span>
          </div>
        </div>

        {/* Proses Revisi */}
        <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">PROSES REVISI</span>
              <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">{proses}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>Menunggu Proses</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">Pending</span>
          </div>
        </div>

        {/* Selesai */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">SELESAI</span>
              <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">{selesai}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
            <span>Selesai Diproses</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Selesai</span>
          </div>
        </div>
      </div>

      {/* Dashboard Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
          <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-600" /> Gambaran Revisi Anggaran {selectedTP ? `(${selectedTP})` : ''}
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Tabel Frekuensi
            </button>
            <button 
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'chart' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Grafik Batang
            </button>
          </div>
        </div>

        {activeTab === 'table' ? (
          dashboardData.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Unit (Frekuensi Sama)</th>
                    <th className="px-4 py-3 text-center w-36">Frekuensi Revisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboardData.sort((a, b) => b.Total - a.Total).map((d, i) => {
                    const getGroupColor = (group?: string) => {
                      switch(group) {
                         case 'Fakultas': return 'bg-sky-50 text-sky-700 border border-sky-200';
                         case 'KPTU': return 'bg-amber-50 text-amber-700 border border-amber-200';
                         case 'Pusat Studi': return 'bg-violet-50 text-violet-700 border border-violet-200';
                         case 'Tempat Ibadah': return 'bg-rose-50 text-rose-700 border border-rose-200';
                         default: return 'bg-gray-50 text-gray-700 border border-gray-200';
                      }
                    };
                    const units = d.name.split(', ');
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {units.map((unit: string, ui: number) => {
                              const cleanUnit = unit.trim();
                              const groupOrg = unitGroups[cleanUnit];
                              return (
                                <span key={ui} className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${getGroupColor(groupOrg)}`} title={groupOrg ? `Grup: ${groupOrg}` : 'Belum ada grup'}>
                                  {cleanUnit}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-black text-xs font-mono">
                            {d.Total} kali
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={28} className="opacity-20 mb-2" />
              <p className="font-bold text-xs">Belum ada data revisi untuk ditampilkan</p>
            </div>
          )
        ) : (
          chartData.length > 0 ? (
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0}
                    height={80}
                    tickFormatter={(val) => val.length > 25 ? val.substring(0, 25) + '...' : val}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 'bold' }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Total" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#4f46e5" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 size={28} className="opacity-20 mb-2" />
              <p className="font-bold text-xs">Belum ada data revisi untuk ditampilkan</p>
            </div>
          )
        )}
      </div>

      {/* FILTER & TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        <div className="p-4 px-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari data apa saja..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="w-full md:w-56">
            <select 
              value={selectedTP}
              onChange={(e) => setSelectedTP(e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Semua Tahun-Periode</option>
              {availableTPs.map((tp, idx) => (
                <option key={idx} value={tp}>{tp}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-52">
            <select 
              value={picFilter}
              onChange={(e) => setPicFilter(e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Semua PIC</option>
              {availablePics.map((pic, idx) => (
                <option key={idx} value={String(pic)}>{pic}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-bold">Memuat Data...</p>
            </div>
          ) : filteredData.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                  <th className="px-5 py-3 w-10 text-center">
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
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-5 py-3 w-14 text-center">NO</th>
                  <th className="px-5 py-3 min-w-[200px]">Pengirim (Email & Unit)</th>
                  <th className="px-5 py-3 min-w-[150px]">PIC & Status</th>
                  
                  {Object.keys(filteredData[0] || {})
                    .filter(header => !['id', 'created_at', 'status', 'waktu_proses', 'email', 'Email', 'unit', 'Unit', 'pic', 'PIC', 'Unit Kerja', 'unit_kerja', 'tahun', 'Tahun', 'periode', 'Periode'].includes(header))
                    .map((header) => (
                    <th key={header} className="px-5 py-3">
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((row, idx) => {
                  const emailVal = row['email'] || row['Email'] || '-';
                  const unitVal = row['unit'] || row['Unit'] || row['Unit Kerja'] || row['unit_kerja'] || '-';
                  const picVal = row['pic'] || row['PIC'] || '-';
                  const tahunVal = row['tahun'] || row['Tahun'] || '-';
                  const periodeVal = row['periode'] || row['Periode'] || '-';
                  const rowNumber = (pageSize === 'ALL' ? 0 : (currentPage - 1) * Number(pageSize)) + idx + 1;

                  return (
                  <tr key={row.id || idx} className={`transition-colors group bg-white ${selectedIds.includes(row.id) ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/30'}`}>
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
                       <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-md font-black text-xs">{rowNumber}</span>
                    </td>

                    <td className="px-6 py-4 border-r border-gray-50">
                       <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-gray-900 whitespace-normal leading-snug">{emailVal}</span>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-normal leading-snug">{unitVal}</span>
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-1 inline-flex w-fit px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
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
        
        {/* PAGINATION FOOTER */}
        {filteredData.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
            {/* Left: Info */}
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-gray-900">{pageSize === 'ALL' ? 1 : (currentPage - 1) * Number(pageSize) + 1}</strong> - <strong className="text-gray-900">{pageSize === 'ALL' ? filteredData.length : Math.min(currentPage * Number(pageSize), filteredData.length)}</strong> dari <strong className="text-gray-900">{filteredData.length}</strong> data
              </span>
            </div>

            {/* Center: Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="ALL">Semua</option>
              </select>
            </div>

            {/* Right: Page Navigation */}
            {pageSize !== 'ALL' && totalPages > 1 && (
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
                
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
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
      </div>
    </div>
  );
}
