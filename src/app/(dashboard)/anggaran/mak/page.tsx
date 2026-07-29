'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, CheckCircle2, Clock, Loader2, Search, 
  Download, Mail, ExternalLink, RefreshCw, ClipboardList,
  Filter, Calendar, BarChart3, Database, Building2
} from 'lucide-react';

export default function MonitoringMakPage() {
  const [data, setData] = useState<any[]>([]);
  const [unitGroups, setUnitGroups] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [filterUnit, setFilterUnit] = useState('');
  const [filterPIC, setFilterPIC] = useState('');
  
  // Paging
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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

  // Options for filters
  const availableTahun = Array.from(new Set(data.map(d => String(d.tahun)).filter(Boolean))).sort().reverse();
  const availableUnits = Array.from(new Set(data.map(d => d.unit).filter(Boolean))).sort();
  const availablePICs = Array.from(new Set(data.map(d => d.pic).filter(Boolean))).sort();

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, filterTahun, filterUnit, filterPIC]);

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
      let ext = 'xlsx';
      if (urlExt && ['xls', 'xlsx', 'csv', 'pdf', 'docx', 'doc', 'zip'].includes(urlExt)) {
        ext = urlExt;
      } else {
        const nameExt = originalName.split('.').pop()?.toLowerCase();
        if (nameExt && ['xls', 'xlsx', 'csv', 'pdf', 'docx', 'doc', 'zip'].includes(nameExt)) {
          ext = nameExt;
        }
      }

      const now = uploadTime ? new Date(uploadTime) : new Date();
      const timeStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
      
      const cleanUnit = (unitVal || 'Unit').replace(/[^a-zA-Z0-9]/g, '_');
      const newFileName = `${cleanUnit}_${timeStr}.${ext}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      
      const contentType = response.headers.get('content-type') || '';
      // Jika yang di-return adalah HTML error page, jangan simpan sebagai binary xls/xlsx
      if (contentType.includes('text/html')) {
        window.open(url, '_blank');
        return;
      }

      const arrayBuf = await response.arrayBuffer();
      const mimeType = ext === 'xls' ? 'application/vnd.ms-excel' 
                     : ext === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                     : (contentType || 'application/octet-stream');
      
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
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderFileLinks = (val: any, unitVal: string, uploadTime: string) => {
    const files = extractFilesFromValue(val);
    if (files.length === 0) return <span>-</span>;
    if (files.length === 1) {
      return (
        <div className="flex items-center gap-1.5 justify-center">
          <button 
            onClick={() => handleDownloadCustomName(files[0].url, files[0].name, unitVal, uploadTime)}
            className="group flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-emerald-500 text-indigo-600 hover:text-white border border-indigo-100 hover:border-emerald-600 rounded-lg transition-all active:scale-95 shadow-sm"
            title={`Download: ${files[0].name}`}
          >
            <Download size={14} strokeWidth={2.5} />
            <span className="text-[11px] font-black uppercase tracking-wider">Download</span>
          </button>
          <a
            href={files[0].url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors"
            title="Buka File Asli Direct"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      );
    }
    return (
      <div className="relative inline-block">
        <select 
          onChange={(e) => {
            if(e.target.value !== "") {
              const file = files[parseInt(e.target.value)];
              handleDownloadCustomName(file.url, file.name, unitVal, uploadTime);
              e.target.value = "";
            }
          }}
          className="appearance-none pr-8 pl-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors w-36 shadow-sm truncate uppercase tracking-wider"
        >
          <option value="">{files.length} Lampiran</option>
          {files.map((file, i) => (
            <option key={i} value={String(i)}>⬇ {file.name}</option>
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
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-800 to-sky-700 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 opacity-[0.07]"><ClipboardList size={200} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-200 font-bold text-[10px] uppercase tracking-widest mb-3">
            <FileText size={14} /> Anggaran • Tolakan Verif
          </div>
          <h1 className="text-4xl font-black tracking-tight leading-none mb-3">Revisi Anggaran Tolakan dari Verifikator</h1>
          <p className="text-indigo-100 font-medium text-sm max-w-md">
            Daftar pengajuan perubahan Tolakan Verifikator. Tandai sebagai selesai dan kirimkan notifikasi email ke pengaju.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pengajuan', value: total, color: 'from-indigo-500 to-indigo-600', icon: <ClipboardList size={24} /> },
          { label: 'Proses Revisi',   value: proses,  color: 'from-amber-400 to-amber-500',   icon: <Clock size={24} /> },
          { label: 'Selesai',         value: selesai, color: 'from-emerald-500 to-emerald-600', icon: <CheckCircle2 size={24} /> },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.color} text-white rounded-3xl p-6 shadow-sm`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">{s.label}</p>
                <p className="text-4xl font-black">{s.value}</p>
              </div>
              <div className="opacity-30">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
          <div className="shrink-0 font-bold text-lg">!</div>
          <p className="font-bold text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Dashboard Gambaran Revisi (Like Usulan) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" /> Gambaran Revisi Anggaran {filterTahun ? `(${filterTahun})` : ''}
        </h2>
        {dashboardData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 border-b text-xs uppercase tracking-widest text-gray-500 font-bold">Unit (Frekuensi Sama)</th>
                  <th className="p-4 border-b text-center text-xs uppercase tracking-widest text-gray-500 font-bold">Frekuensi Revisi</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.map((d, i) => {
                  const getGroupColor = (group?: string) => {
                    switch(group) {
                       case 'Fakultas': return 'bg-sky-100 text-sky-700 border border-sky-200';
                       case 'KPTU': return 'bg-amber-100 text-amber-700 border border-amber-200';
                       case 'Pusat Studi': return 'bg-violet-100 text-violet-700 border border-violet-200';
                       case 'Tempat Ibadah': return 'bg-rose-100 text-rose-700 border border-rose-200';
                       default: return 'bg-gray-100 text-gray-700 border border-gray-200';
                    }
                  };
                  const units = d.name.split(', ');
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {units.map((unit: string, ui: number) => {
                            const cleanUnit = unit.trim();
                            const groupOrg = unitGroups[cleanUnit];
                            return (
                              <span key={ui} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getGroupColor(groupOrg)} shadow-sm`} title={groupOrg ? `Grup: ${groupOrg}` : 'Belum ada grup'}>
                                {cleanUnit}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-lg shadow-sm shadow-indigo-200">
                          {d.Total}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-gray-400">
            <BarChart3 size={32} className="opacity-20 mb-3" />
            <p className="font-bold text-sm">Belum ada data revisi untuk ditampilkan</p>
          </div>
        )}
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari kata kunci..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="w-full md:w-48 relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {availableTahun.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="w-full md:w-48 relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              list="unit-options"
              placeholder="Pilih/Ketik Unit..."
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <datalist id="unit-options">
              {availableUnits.map((u, idx) => <option key={idx} value={u} />)}
            </datalist>
          </div>

          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={filterPIC}
              onChange={(e) => setFilterPIC(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
            >
              <option value="">Semua PIC</option>
              {availablePICs.map((pic, idx) => <option key={idx} value={pic}>{pic}</option>)}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-bold">Memuat Data...</p>
            </div>
          ) : currentData.length > 0 ? (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-900 shadow-md">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 w-16 text-center">NO</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Unit Kerja & Email</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">PIC & Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-center">Tahun</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800">Lampiran</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-800 text-center">Aksi</th>
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
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-50 text-center">
                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-md font-black text-xs mx-auto">{globalIdx}</span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-50">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-gray-900">{row.unit || '-'}</span>
                          <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
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

                      <td className="px-6 py-4 whitespace-nowrap border-r border-gray-50 text-center">
                        <span className="font-black text-gray-700">{row.tahun || '-'}</span>
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
                          <span className="text-[10px] text-emerald-500 font-black uppercase tracking-wider flex items-center justify-center gap-1">
                            <CheckCircle2 size={12} /> Selesai
                          </span>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} Data
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black">
                Hal {currentPage} dari {totalPages}
              </span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
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
