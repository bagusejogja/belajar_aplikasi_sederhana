'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, CheckCircle2, Clock, Loader2, Search, 
  Download, Mail, ExternalLink, RefreshCw, ClipboardList,
  Filter, Calendar, BarChart3, Database, Building2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function MonitoringMakPage() {
  const [data, setData] = useState<any[]>([]);
  const [unitGroups, setUnitGroups] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [filterUnit, setFilterUnit] = useState('');
  const [filterPIC, setFilterPIC] = useState('');
  
  // Paging
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Process State
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [emailModalId, setEmailModalId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dataRes, unitsRes] = await Promise.all([
        supabase.from('mak_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('gov_units').select('nama_unit, group_org')
      ]);
      if (!dataRes.error) setData(dataRes.data || []);
      
      if (unitsRes.data) {
        const mapping: Record<string, string> = {};
        unitsRes.data.forEach(u => {
           if (u.nama_unit && u.group_org) mapping[u.nama_unit] = u.group_org;
        });
        setUnitGroups(mapping);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleProses = async (id: number) => {
    setProcessingId(id);
    setSuccessMsg('');
    setErrorMsg('');
    const targetRow = data.find(r => r.id === id);
    const targetEmail = targetRow?.email || null;

    try {
      const res = await fetch('/api/mak/proses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, emailTarget: targetEmail }),
      });
      const json = await res.json();
      if (json.success) {
        if (targetEmail) {
          if (json.emailSent) {
            setSuccessMsg('Status berhasil diperbarui dan email terkirim ke ' + targetEmail);
          } else {
            setSuccessMsg('Status berhasil diperbarui.');
            setErrorMsg('Namun pengiriman email gagal: ' + (json.emailError || 'Unknown Error'));
          }
        } else {
          setSuccessMsg('Status berhasil diperbarui (tanpa email).');
        }
        setEmailModalId(null);
        fetchData();
        setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 8000);
      } else {
        setErrorMsg(json.error || 'Terjadi kesalahan saat memproses data.');
      }
    } catch (err: any) { 
      console.error(err); 
      setErrorMsg('Gagal terhubung ke server: ' + err.message);
    }
    setProcessingId(null);
  };

  const filtered = useMemo(() => {
    return data.filter(row => {
      const q = search.toLowerCase();
      const matchSearch = row.unit?.toLowerCase().includes(q) || row.pic?.toLowerCase().includes(q) || String(row.tahun).includes(q);
      const matchTahun = filterTahun === '' || String(row.tahun) === filterTahun;
      const matchUnit = filterUnit === '' || row.unit === filterUnit;
      const matchPIC = filterPIC === '' || row.pic === filterPIC;
      return matchSearch && matchTahun && matchUnit && matchPIC;
    });
  }, [data, search, filterTahun, filterUnit, filterPIC]);

  const dashboardData = useMemo(() => {
    const unitCounts: Record<string, number> = {};
    filtered.forEach(item => {
      const unit = item.unit || 'Unknown';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    
    const freqGroups: Record<number, string[]> = {};
    Object.entries(unitCounts).forEach(([unit, count]) => {
       if (!freqGroups[count]) freqGroups[count] = [];
       freqGroups[count].push(unit);
    });

    return Object.entries(freqGroups)
      .map(([Total, units]) => ({ name: units.join(', '), Total: Number(Total) }))
      .sort((a, b) => b.Total - a.Total);
  }, [filtered]);

  const chartData = useMemo(() => {
    const unitCounts: Record<string, number> = {};
    filtered.forEach(item => {
      const unit = item.unit || 'Unknown';
      unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    return Object.entries(unitCounts)
      .map(([unit, count]) => ({ name: unit, Total: count }))
      .sort((a, b) => b.Total - a.Total);
  }, [filtered]);

  // Options for filters
  const availableTahun = Array.from(new Set(data.map(d => String(d.tahun)).filter(Boolean))).sort().reverse();
  const availableUnits = Array.from(new Set(data.map(d => d.unit).filter(Boolean))).sort();
  const availablePICs = Array.from(new Set(data.map(d => d.pic).filter(Boolean))).sort();

  // Pagination Logic
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    if (itemsPerPage === -1) return filtered;
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterTahun, filterUnit, filterPIC, itemsPerPage]);

  const total = filtered.length;
  const selesai = filtered.filter(d => d.status === 'Selesai').length;
  const proses = filtered.filter(d => d.status !== 'Selesai').length;

  const extractFilesFromValue = (val: any) => {
    let files: {url: string, name: string}[] = [];
    const extractFiles = (items: any[]) => items.map(item => {
      if (typeof item === 'string') return { url: item, name: item.split('/').pop() || 'file' };
      if (typeof item === 'object' && item !== null && item.url) return { url: item.url, name: item.name || item.url.split('/').pop() || 'file' };
      return null;
    }).filter(f => f && f.url.includes('http')) as {url: string, name: string}[];

    if (Array.isArray(val)) {
      files = extractFiles(val);
    } else if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) files = extractFiles(parsed);
        else if (typeof parsed === 'object' && parsed !== null && parsed.url) files = [{ url: parsed.url, name: parsed.name || 'file' }];
        else files = [{ url: val, name: 'file' }];
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
      // 1. Cek jika URL adalah tautan SharePoint / Office365 / Google Drive (buka langsung di tab baru agar tidak korup)
      const lowerUrl = (url || '').toLowerCase();
      if (lowerUrl.includes('sharepoint.com') || lowerUrl.includes('onedrive') || lowerUrl.includes('drive.google.com') || lowerUrl.includes('forms.office.com')) {
        window.open(url, '_blank');
        return;
      }

      // 2. Deteksi ekstensi asli secara presisi dari URL terlebih dahulu, fallback ke originalName
      const cleanUrl = url.split('?')[0];
      const urlExt = cleanUrl.split('.').pop()?.toLowerCase();
      const validExts = ['xls', 'xlsx', 'csv', 'pdf', 'docx', 'doc', 'zip', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
      let ext = 'xlsx';
      if (urlExt && validExts.includes(urlExt)) {
        ext = urlExt;
      } else {
        const nameExt = originalName.split('.').pop()?.toLowerCase();
        if (nameExt && validExts.includes(nameExt)) {
          ext = nameExt;
        }
      }

      const now = uploadTime ? new Date(uploadTime) : new Date();
      const timeStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      
      const cleanUnit = (unitVal || 'Unit').replace(/[^a-zA-Z0-9]/g, '_');
      const newFileName = `${cleanUnit}_${timeStr}.${ext}`;
      
      let response: Response;
      try {
        response = await window.fetch(url);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch {
        // Fallback to proxy if CORS fails
        const proxyUrl = `/api/image-cors?url=${encodeURIComponent(url)}`;
        response = await window.fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy HTTP Error ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        window.open(url, '_blank');
        return;
      }

      const arrayBuf = await response.arrayBuffer();
      const mimeMap: Record<string, string> = {
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        csv: 'text/csv',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        zip: 'application/zip'
      };
      const mimeType = mimeMap[ext] || contentType || 'application/octet-stream';
      
      const blob = new Blob([arrayBuf], { type: mimeType });
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
      window.open(url, '_blank');
    }
  };

  const renderFileLinks = (val: any, unitVal: string, uploadTime: string) => {
    const files = extractFilesFromValue(val);
    if (files.length === 0) return <span className="text-gray-300 font-bold text-xs">-</span>;

    const getFileMeta = (file: { url: string; name: string }) => {
      const cleanUrl = (file.url || '').split('?')[0];
      const ext = (cleanUrl.split('.').pop() || file.name.split('.').pop() || '').toLowerCase();
      
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        return { 
          label: 'Matrik', 
          icon: '📊', 
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400' 
        };
      }
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
        return { 
          label: 'Lampiran', 
          icon: '🖼️', 
          color: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400' 
        };
      }
      if (['pdf'].includes(ext)) {
        return { 
          label: 'Lampiran', 
          icon: '📄', 
          color: 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 hover:border-rose-400' 
        };
      }
      if (['doc', 'docx'].includes(ext)) {
        return { 
          label: 'Lampiran', 
          icon: '📝', 
          color: 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 hover:border-sky-400' 
        };
      }
      return { 
        label: 'Lampiran', 
        icon: '📁', 
        color: 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400' 
      };
    };

    return (
      <div className="flex flex-col gap-1.5 items-start">
        {files.map((file, i) => {
          const meta = getFileMeta(file);
          return (
            <a
              key={i}
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold rounded-lg border shadow-xs transition-all hover:scale-105 active:scale-95 select-none ${meta.color}`}
              title={`Klik untuk buka: ${file.name || meta.label}`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <ExternalLink size={10} className="opacity-60 shrink-0 ml-0.5" />
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-600 to-indigo-700 p-2 rounded-xl text-white shadow-xs">
            <ClipboardList size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Revisi Tolakan dari Verifikator
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                {filtered.length} Pengajuan ({filterTahun || 'Semua Tahun'})
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Daftar perubahan tolakan verifikator, pemrosesan status, & notifikasi email pengaju.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={fetchData}
            className="h-9 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
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
            <span>Seluruh Usulan Tolakan</span>
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
            <span>Menunggu Verifikasi</span>
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
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
            <span>Telah Ditindaklanjuti</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Selesai</span>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3.5 px-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 size={16} className="shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 px-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-xs font-bold">
          <div className="shrink-0 font-black">!</div>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Dashboard Gambaran Revisi */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-3">
          <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-600" /> Gambaran Revisi Anggaran {filterTahun ? `(${filterTahun})` : ''}
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
                  {dashboardData.map((d, i) => {
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

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 px-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari kata kunci..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="w-full md:w-44">
            <select 
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {availableTahun.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="w-full md:w-56">
            <input 
              list="unit-options"
              placeholder="Pilih/Ketik Unit..."
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <datalist id="unit-options">
              {availableUnits.map((u, idx) => <option key={idx} value={u} />)}
            </datalist>
          </div>

          <div className="w-full md:w-44">
            <select 
              value={filterPIC}
              onChange={(e) => setFilterPIC(e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Semua PIC</option>
              {availablePICs.map((pic, idx) => <option key={idx} value={pic}>{pic}</option>)}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-bold">Memuat Data...</p>
            </div>
          ) : currentData.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-center w-12">NO</th>
                  <th className="px-5 py-3 min-w-[250px]">Unit Kerja & Email</th>
                  <th className="px-5 py-3">PIC & Status</th>
                  <th className="px-5 py-3">Lampiran</th>
                  <th className="px-5 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentData.map((row, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  const catatan = Array.isArray(row.lampiran_catatan)
                    ? row.lampiran_catatan
                    : typeof row.lampiran_catatan === 'string'
                      ? (() => { try { return JSON.parse(row.lampiran_catatan) } catch { return [] } })()
                      : [];

                  return (
                    <tr key={row.id} className="transition-colors group hover:bg-indigo-50/30">
                      <td className="px-6 py-4 border-r border-gray-50 text-center">
                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-md font-black text-xs mx-auto">{globalIdx}</span>
                      </td>
                      
                      <td className="px-6 py-4 border-r border-gray-50">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-black text-gray-900 whitespace-normal leading-snug">{row.unit || '-'}</span>
                            {row.tahun && (
                              <span className="shrink-0 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider mt-0.5">
                                {row.tahun}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1 mt-1">
                            <Mail size={10} /> {row.email || 'Tanpa Email'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap bg-gray-50/30 border-r border-gray-100">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="text-xs font-black text-indigo-700 uppercase tracking-wide">{row.pic || '-'}</span>
                          
                          <span className="text-[9px] text-gray-500 font-bold flex items-center gap-1" title="Tanggal Masuk">
                            <Clock size={10} className="text-indigo-400" />
                            {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'} WIB
                          </span>

                          {row.status === 'Selesai' ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md font-black text-[9px] uppercase tracking-wider border border-emerald-200">
                                <CheckCircle2 size={10} /> Selesai
                              </span>
                              {row.updated_at && (
                                <span className="text-[9px] text-gray-500 font-bold flex items-center gap-1">
                                  <Clock size={10} className="text-emerald-600" /> {new Date(row.updated_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-md font-black text-[9px] uppercase tracking-wider border border-amber-200">
                              <Clock size={10} /> {row.status}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 border-r border-gray-50">
                        {renderFileLinks(
                          [
                            ...(row.lampiran_excel ? [{ 
                              url: row.lampiran_excel, 
                              name: `Excel_Semula_Menjadi.${(row.lampiran_excel.split('?')[0].split('.').pop() || 'xlsx').toLowerCase()}` 
                            }] : []),
                            ...(Array.isArray(catatan) ? catatan : [])
                          ], 
                          row.unit, 
                          row.created_at
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {row.status !== 'Selesai' ? (
                          <button
                            onClick={() => setEmailModalId(row.id)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 mx-auto active:scale-95"
                          >
                            <CheckCircle2 size={12} /> Proses
                          </button>
                        ) : (
                          <span className="text-gray-300 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
            {/* Left: Info */}
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-gray-900">{itemsPerPage === -1 ? 1 : (currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-gray-900">{itemsPerPage === -1 ? filtered.length : Math.min(currentPage * itemsPerPage, filtered.length)}</strong> dari <strong className="text-gray-900">{filtered.length}</strong> data
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
                className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
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
                
                <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-black">
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

      {/* Email Modal */}
      {emailModalId !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                <Mail size={24} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Konfirmasi Diproses</h2>
                <p className="text-xs text-gray-500">Tandai selesai dan kirim notifikasi</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Pengaju
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium border-none text-gray-600">
                {data.find(r => r.id === emailModalId)?.email || 'Tidak ada email pengaju'}
              </div>
              <p className="text-xs text-gray-400 mt-2">Sistem akan otomatis mengirimkan notifikasi ke alamat ini.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEmailModalId(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleProses(emailModalId)}
                disabled={processingId === emailModalId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
              >
                {processingId === emailModalId
                  ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                  : <><CheckCircle2 size={16} /> Tandai Selesai</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
