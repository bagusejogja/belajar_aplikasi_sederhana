'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, CheckCircle2, Clock, Loader2, Search, 
  Download, Mail, ExternalLink, RefreshCw, ClipboardList,
  Filter, Calendar, BarChart3, Database, Building2, Eye,
  Users, UserCheck, Award, Zap, TrendingUp, ArrowRight,
  RotateCcw, Sparkles, Check, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// Helper Format Durasi Waktu Bahasa Indonesia
const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '< 1 mnt';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} hr ${hours} jam`;
  }
  if (hours > 0) {
    return `${hours} jam ${minutes} mnt`;
  }
  if (minutes > 0) {
    return `${minutes} mnt`;
  }
  return '< 1 mnt';
};

// Helper Badge Durasi Selisih Masuk vs Selesai
const getDurationBadge = (created: string, updated?: string, status?: string) => {
  if (!created) return { label: '-', subtext: '-', className: 'text-gray-400 bg-gray-50 border-gray-200' };
  
  const createdDate = new Date(created).getTime();
  const isFinished = status === 'Selesai';
  const endDate = isFinished && updated ? new Date(updated).getTime() : Date.now();
  const diffMs = Math.max(0, endDate - createdDate);
  const formatted = formatDuration(diffMs);
  const hours = diffMs / (1000 * 60 * 60);

  if (isFinished) {
    if (hours < 6) {
      return {
        label: `⚡ ${formatted}`,
        subtext: 'Respon Kilat (< 6 jam)',
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-black'
      };
    } else if (hours <= 24) {
      return {
        label: `⏱️ ${formatted}`,
        subtext: 'Standar Cepat (≤ 24 jam)',
        className: 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold'
      };
    } else if (hours <= 72) {
      return {
        label: `📅 ${formatted}`,
        subtext: '1 - 3 Hari Kerja',
        className: 'bg-sky-50 text-sky-800 border-sky-200 font-bold'
      };
    } else {
      return {
        label: `⏳ ${formatted}`,
        subtext: '> 3 Hari Kerja',
        className: 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
      };
    }
  } else {
    // Belum Selesai (Dalam Proses)
    return {
      label: `⏳ Berjalan: ${formatted}`,
      subtext: 'Menunggu Verifikasi Selesai',
      className: 'bg-amber-50/90 text-amber-800 border-amber-300 font-black animate-pulse'
    };
  }
};

// Helper Avatar Inisial & Palet PIC
const getPicAvatarMeta = (picName: string) => {
  const p = (picName || 'Tanpa PIC').trim();
  const parts = p.split(' ').filter(Boolean);
  const initials = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : (p.slice(0, 2).toUpperCase() || 'PIC');
  
  const palette = [
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-sky-100 text-sky-700 border-sky-200',
    'bg-teal-100 text-teal-700 border-teal-200'
  ];
  
  let hash = 0;
  for (let i = 0; i < p.length; i++) {
    hash = p.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = palette[Math.abs(hash) % palette.length];
  
  return { initials, color };
};

export default function MonitoringMakPage() {
  const [data, setData] = useState<any[]>([]);
  const [unitGroups, setUnitGroups] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pic-report' | 'table' | 'chart'>('pic-report');
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [filterUnit, setFilterUnit] = useState('');
  const [filterPIC, setFilterPIC] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Paging
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Process State
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [emailModalId, setEmailModalId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
      const matchStatus = filterStatus === 'ALL' || (filterStatus === 'Selesai' ? row.status === 'Selesai' : row.status !== 'Selesai');
      return matchSearch && matchTahun && matchUnit && matchPIC && matchStatus;
    });
  }, [data, search, filterTahun, filterUnit, filterPIC, filterStatus]);

  // 🔴 REQUIREMENT 1: REPORT & REKAP KINERJA & SLA PENYELESAIAN PER PIC
  const picSummaryData = useMemo(() => {
    const map: Record<string, {
      pic: string;
      total: number;
      selesai: number;
      proses: number;
      durations: number[];
    }> = {};

    filtered.forEach(row => {
      const picName = (row.pic || 'Tanpa PIC').trim();
      if (!map[picName]) {
        map[picName] = { pic: picName, total: 0, selesai: 0, proses: 0, durations: [] };
      }
      map[picName].total += 1;
      if (row.status === 'Selesai') {
        map[picName].selesai += 1;
        if (row.created_at && row.updated_at) {
          const diff = new Date(row.updated_at).getTime() - new Date(row.created_at).getTime();
          if (diff >= 0) map[picName].durations.push(diff);
        }
      } else {
        map[picName].proses += 1;
      }
    });

    const list = Object.values(map).map(item => {
      const sumDurations = item.durations.reduce((a, b) => a + b, 0);
      const avgMs = item.durations.length > 0 ? sumDurations / item.durations.length : 0;
      const minMs = item.durations.length > 0 ? Math.min(...item.durations) : 0;
      const maxMs = item.durations.length > 0 ? Math.max(...item.durations) : 0;
      const completionRate = item.total > 0 ? Math.round((item.selesai / item.total) * 100) : 0;

      return {
        ...item,
        avgMs,
        minMs,
        maxMs,
        avgFormatted: avgMs > 0 ? formatDuration(avgMs) : '-',
        minFormatted: minMs > 0 ? formatDuration(minMs) : '-',
        maxFormatted: maxMs > 0 ? formatDuration(maxMs) : '-',
        completionRate
      };
    });

    return list.sort((a, b) => b.selesai - a.selesai || b.total - a.total);
  }, [filtered]);

  // Global SLA & Kinerja Summary
  const globalSlaSummary = useMemo(() => {
    let allDurations: number[] = [];
    let totalSelesai = 0;
    let totalProses = 0;

    picSummaryData.forEach(p => {
      allDurations = allDurations.concat(p.durations);
      totalSelesai += p.selesai;
      totalProses += p.proses;
    });

    const grandTotal = totalSelesai + totalProses;
    const avgGlobalMs = allDurations.length > 0 ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length : 0;
    const fastestMs = allDurations.length > 0 ? Math.min(...allDurations) : 0;
    const slowestMs = allDurations.length > 0 ? Math.max(...allDurations) : 0;
    const mostProductive = picSummaryData.length > 0 ? picSummaryData[0] : null;

    return {
      avgGlobalFormatted: avgGlobalMs > 0 ? formatDuration(avgGlobalMs) : '-',
      fastestFormatted: fastestMs > 0 ? formatDuration(fastestMs) : '-',
      slowestFormatted: slowestMs > 0 ? formatDuration(slowestMs) : '-',
      completionRate: grandTotal > 0 ? Math.round((totalSelesai / grandTotal) * 100) : 0,
      mostProductivePic: mostProductive ? mostProductive.pic : '-',
      mostProductiveCount: mostProductive ? mostProductive.selesai : 0
    };
  }, [picSummaryData]);

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
  useEffect(() => { setCurrentPage(1); }, [search, filterTahun, filterUnit, filterPIC, filterStatus, itemsPerPage]);

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

  const getSafeFileUrl = (url: string, filename?: string) => {
    if (!url) return '';
    const gdriveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1000`;
    }
    // Jika URL R2, bypass blokir ISP (Indihome/Telkomsel pada domain Cloudflare R2 *.r2.dev) lewat proxy backend
    if (url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com')) {
      const fn = filename ? `&filename=${encodeURIComponent(filename)}` : '';
      return `/api/image-cors?url=${encodeURIComponent(url)}${fn}`;
    }
    return url;
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
      
      // Ambil safe URL melewati proxy backend untuk bypass blokir ISP Indihome/Telkomsel
      const targetUrl = (url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com'))
        ? `/api/image-cors?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(newFileName)}`
        : url;

      let response: Response;
      try {
        response = await window.fetch(targetUrl);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      } catch {
        // Fallback to proxy if direct fetch fails
        const proxyUrl = `/api/image-cors?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(newFileName)}`;
        response = await window.fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy HTTP Error ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        window.open(targetUrl, '_blank');
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
      console.error("Gagal download blob, fallback buka tab proxy:", err);
      const fallbackUrl = getSafeFileUrl(url, originalName);
      window.open(fallbackUrl, '_blank');
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
          const cleanUrl = (file.url || '').split('?')[0];
          const ext = (cleanUrl.split('.').pop() || file.name.split('.').pop() || '').toLowerCase();
          const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext);
          const safeUrl = getSafeFileUrl(file.url, file.name || meta.label);

          if (isImg) {
            return (
              <div key={i} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewImage(safeUrl)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold rounded-lg border shadow-xs transition-all hover:scale-105 active:scale-95 select-none ${meta.color}`}
                  title={`Klik untuk lihat gambar: ${file.name || meta.label}`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <Eye size={10} className="opacity-60 shrink-0 ml-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadCustomName(file.url, file.name || meta.label, unitVal, uploadTime)}
                  className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-lg transition-colors shadow-2xs"
                  title="Unduh File"
                >
                  <Download size={11} />
                </button>
              </div>
            );
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDownloadCustomName(file.url, file.name || meta.label, unitVal, uploadTime)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold rounded-lg border shadow-xs transition-all hover:scale-105 active:scale-95 select-none ${meta.color}`}
              title={`Klik untuk unduh: ${file.name || meta.label}`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <Download size={10} className="opacity-60 shrink-0 ml-0.5" />
            </button>
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
          <div>
            <h2 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={15} className="text-indigo-600" /> Gambaran Revisi Anggaran {filterTahun ? `(${filterTahun})` : ''}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Monitoring kinerja verifikator, durasi rata-rata penyelesaian (SLA), dan sebaran revisi per unit.
            </p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('pic-report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'pic-report' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCheck size={13} />
              <span>Report per PIC & SLA ({picSummaryData.length})</span>
            </button>
            <button 
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'table' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 size={13} />
              <span>Frekuensi Unit</span>
            </button>
            <button 
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chart' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 size={13} />
              <span>Grafik Batang</span>
            </button>
          </div>
        </div>

        {/* TAB 1: 🔴 REQUIREMENT 1 - REPORT & REKAP KINERJA & SLA PENYELESAIAN PER PIC */}
        {activeTab === 'pic-report' && (
          <div className="space-y-4">
            {/* 4 KPI SUMMARY CARDS SESUAI STANDAR DESIGN SYSTEM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Rata-Rata SLA */}
              <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      RATA-RATA PENYELESAIAN (SLA)
                    </span>
                    <div className="text-xl font-black text-indigo-900 font-mono tracking-tight">
                      {globalSlaSummary.avgGlobalFormatted}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-100/70 text-indigo-700 border border-indigo-200">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="mt-2.5 text-[11px] font-medium text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <span>Dari berkas masuk s/d selesai</span>
                  <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-black">
                    SLA Global
                  </span>
                </div>
              </div>

              {/* Card 2: Tingkat Ketuntasan */}
              <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      TINGKAT KETUNTASAN
                    </span>
                    <div className="text-xl font-black text-emerald-800 font-mono tracking-tight">
                      {globalSlaSummary.completionRate}%
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="mt-2.5 text-[11px] font-medium text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <span>{selesai} selesai dari {total} berkas</span>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-black">
                    {proses} Pending
                  </span>
                </div>
              </div>

              {/* Card 3: Waktu Selesai Tercepat */}
              <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      RESPON TERCEPAT
                    </span>
                    <div className="text-xl font-black text-amber-900 font-mono tracking-tight flex items-center gap-1">
                      <Zap size={16} className="text-amber-500 fill-amber-500" />
                      <span>{globalSlaSummary.fastestFormatted}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-100/70 text-amber-700 border border-amber-200">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div className="mt-2.5 text-[11px] font-medium text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <span>Waktu penanganan minimum</span>
                  <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-black">
                    Kilat
                  </span>
                </div>
              </div>

              {/* Card 4: PIC Paling Produktif */}
              <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      PIC TERBANYAK TUNTAS
                    </span>
                    <div className="text-sm font-black text-slate-900 line-clamp-1" title={globalSlaSummary.mostProductivePic}>
                      {globalSlaSummary.mostProductivePic}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-100/70 text-purple-700 border border-purple-200">
                    <Award size={16} />
                  </div>
                </div>
                <div className="mt-2.5 text-[11px] font-medium text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
                  <span>Menyelesaikan pekerjaan</span>
                  <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-black">
                    {globalSlaSummary.mostProductiveCount} Berkas
                  </span>
                </div>
              </div>
            </div>

            {/* TABEL REKAP KINERJA & SLA PER PIC */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-center w-10">No</th>
                    <th className="px-4 py-3 min-w-[200px]">PIC</th>
                    <th className="px-3 py-3 text-center w-24">Total Tugas</th>
                    <th className="px-3 py-3 text-center w-28">Dalam Proses</th>
                    <th className="px-3 py-3 text-center w-24">Selesai</th>
                    <th className="px-4 py-3 min-w-[160px]">Tingkat Ketuntasan</th>
                    <th className="px-4 py-3 text-center min-w-[180px]">Rata-rata Waktu Selesai (SLA)</th>
                    <th className="px-4 py-3 text-center min-w-[180px]">Rentang Waktu (Min - Max)</th>
                    <th className="px-3 py-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {picSummaryData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-400 font-medium">
                        Tidak ada data PIC untuk filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    picSummaryData.map((p, idx) => {
                      const avatar = getPicAvatarMeta(p.pic);
                      return (
                        <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] border shrink-0 ${avatar.color}`}>
                                {avatar.initials}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-xs">{p.pic}</div>
                                <div className="text-[10px] text-gray-400">Verifikator Anggaran</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="font-mono font-black text-gray-900 text-xs">
                              {p.total}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {p.proses > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                                <Clock size={10} /> {p.proses} berkas
                              </span>
                            ) : (
                              <span className="text-gray-300 font-bold text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[10px]">
                              <CheckCircle2 size={10} /> {p.selesai}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-gray-500">{p.selesai}/{p.total} Tuntas</span>
                                <span className={p.completionRate === 100 ? 'text-emerald-700 font-black' : 'text-indigo-700'}>
                                  {p.completionRate}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    p.completionRate === 100 ? 'bg-emerald-500' : p.completionRate >= 80 ? 'bg-indigo-600' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${p.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.selesai > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-black text-xs font-mono">
                                  ⏱️ {p.avgFormatted}
                                </span>
                                <span className="text-[9px] text-gray-400 mt-0.5">
                                  Rata-rata data masuk s/d selesai
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">Belum ada berkas selesai</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.selesai > 0 ? (
                              <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                                <span className="text-emerald-700 font-bold" title="Tercepat">⚡ {p.minFormatted}</span>
                                <span className="text-gray-300">-</span>
                                <span className="text-slate-600 font-medium" title="Terlama">⏳ {p.maxFormatted}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterPIC(p.pic === 'Tanpa PIC' ? '' : p.pic);
                                const tableEl = document.getElementById('submissions-table-card');
                                if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 text-[10px] font-bold border border-gray-200 transition-colors flex items-center gap-1 mx-auto"
                              title={`Tampilkan hanya berkas ${p.pic}`}
                            >
                              <span>Filter</span>
                              <ArrowRight size={10} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TABEL FREKUENSI UNIT */}
        {activeTab === 'table' && (
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
        )}

        {/* TAB 3: GRAFIK BATANG UNIT */}
        {activeTab === 'chart' && (
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

      {/* 🔴 REQUIREMENT 2: MAIN TABLE SECTION DENGAN SELISIH BERKAS MASUK DAN SELESAI */}
      <div id="submissions-table-card" className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden scroll-mt-20">
        
        {/* Table Card Header & Quick Status Filter */}
        <div className="p-4 px-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-gray-900 tracking-tight">
                Daftar Usulan Revisi Tolakan & Audit SLA
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {filtered.length} Berkas
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Tabel audit real-time dengan selisih waktu akurat dari berkas diterima hingga verifikasi diselesaikan.
            </p>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 self-start md:self-auto bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua ({data.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('Proses Revisi')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'Proses Revisi'
                  ? 'bg-white text-amber-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-amber-700'
              }`}
            >
              <Clock size={11} className="text-amber-500" />
              <span>Proses ({proses})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('Selesai')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filterStatus === 'Selesai'
                  ? 'bg-white text-emerald-700 shadow-xs font-black'
                  : 'text-gray-600 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 size={11} className="text-emerald-500" />
              <span>Selesai ({selesai})</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-3.5 px-5 border-b border-gray-100 flex flex-col md:flex-row gap-2.5 items-center bg-white">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari unit kerja, nama PIC, email, atau tahun..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
          
          <div className="w-full md:w-36">
            <select 
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full h-9 px-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {availableTahun.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="w-full md:w-48">
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

          {(search || filterUnit || filterPIC || filterStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterUnit('');
                setFilterPIC('');
                setFilterStatus('ALL');
              }}
              className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-bold flex items-center gap-1 transition-all"
              title="Reset Semua Filter"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="animate-spin mb-4 text-indigo-600" size={32} />
              <p className="text-sm font-bold text-gray-700">Memuat Data Revisi & Menghitung SLA...</p>
            </div>
          ) : currentData.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-center w-10">No</th>
                  <th className="px-4 py-3.5 min-w-[220px]">Unit Kerja & Pengaju</th>
                  <th className="px-4 py-3.5 min-w-[150px]">PIC</th>
                  <th className="px-4 py-3.5 min-w-[190px]">Waktu Berkas (Masuk & Selesai)</th>
                  <th className="px-4 py-3.5 text-center min-w-[170px] bg-indigo-50/40 border-x border-indigo-100/60">
                    <div className="flex items-center justify-center gap-1 text-indigo-900">
                      <Clock size={12} className="text-indigo-600" />
                      <span>Selisih Waktu (SLA)</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 min-w-[130px]">Lampiran</th>
                  <th className="px-4 py-3.5 text-center min-w-[110px]">Status & Aksi</th>
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

                  const durationBadge = getDurationBadge(row.created_at, row.updated_at, row.status);
                  const avatar = getPicAvatarMeta(row.pic);
                  const cleanUnit = (row.unit || '').trim();
                  const groupOrg = unitGroups[cleanUnit];

                  return (
                    <tr key={row.id} className="transition-colors group hover:bg-indigo-50/20">
                      {/* NO */}
                      <td className="px-4 py-3.5 text-center align-top pt-4">
                        <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-md font-black text-xs mx-auto">
                          {globalIdx}
                        </span>
                      </td>
                      
                      {/* UNIT KERJA & EMAIL */}
                      <td className="px-4 py-3.5 align-top pt-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-gray-900 leading-snug">
                              {row.unit || '-'}
                            </span>
                            {row.tahun && (
                              <span className="shrink-0 px-1.5 py-0.2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-black uppercase">
                                {row.tahun}
                              </span>
                            )}
                          </div>
                          
                          {groupOrg && (
                            <span className="text-[10px] text-indigo-700 font-semibold inline-block">
                              Grup: <strong className="font-bold">{groupOrg}</strong>
                            </span>
                          )}

                          <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1 mt-0.5" title={row.email}>
                            <Mail size={10} className="text-gray-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{row.email || 'Tanpa Email'}</span>
                          </span>
                        </div>
                      </td>

                      {/* PIC */}
                      <td className="px-4 py-3.5 align-top pt-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] border shrink-0 ${avatar.color}`}>
                            {avatar.initials}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-800 block">
                              {row.pic || 'Tanpa PIC'}
                            </span>
                            <span className="text-[9px] text-gray-400">Petugas</span>
                          </div>
                        </div>
                      </td>

                      {/* WAKTU BERKAS (MASUK & SELESAI) - TANPA WIB */}
                      <td className="px-4 py-3.5 align-top pt-3.5 text-xs">
                        <div className="space-y-1.5">
                          {/* Tanggal Masuk */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                            <span className="w-4 h-4 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[9px] font-black shrink-0">
                              📥
                            </span>
                            <div className="leading-tight">
                              <span className="font-medium text-slate-600 block text-[10px]">Berkas Masuk:</span>
                              <span className="font-bold text-slate-900 font-mono text-[11px]">
                                {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Tanggal Selesai */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                            <span className="w-4 h-4 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] font-black shrink-0">
                              ✅
                            </span>
                            <div className="leading-tight">
                              <span className="font-medium text-slate-600 block text-[10px]">Waktu Selesai:</span>
                              {row.status === 'Selesai' && row.updated_at ? (
                                <span className="font-bold text-emerald-900 font-mono text-[11px]">
                                  {new Date(row.updated_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-bold italic text-[10px]">
                                  Sedang Diproses...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SELISIH WAKTU / DURASI SELESAI (SLA) */}
                      <td className="px-4 py-3.5 align-top pt-3.5 text-center bg-indigo-50/20 border-x border-indigo-100/40">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono shadow-2xs ${durationBadge.className}`}>
                            {durationBadge.label}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">
                            {durationBadge.subtext}
                          </span>
                        </div>
                      </td>

                      {/* LAMPIRAN DOKUMEN */}
                      <td className="px-4 py-3.5 align-top pt-3.5">
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

                      {/* STATUS & AKSI (DIGABUNG: JIKA SELESAI -> TUNTAS, JIKA PROSES -> TOMBOL PROSES) */}
                      <td className="px-4 py-3.5 align-top pt-3.5 whitespace-nowrap text-center">
                        {row.status === 'Selesai' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl font-black text-xs border border-emerald-200 shadow-2xs">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Tuntas</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEmailModalId(row.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-xs shadow-indigo-200 mx-auto active:scale-95"
                          >
                            <Zap size={11} className="text-amber-300 fill-amber-300" />
                            <span>Proses</span>
                          </button>
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
              <p className="text-sm font-bold text-gray-700">Data Tidak Ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci atau reset filter pencarian Anda.</p>
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

      {/* Modal Preview Gambar Layar Penuh (Bypass Indihome via Proxy) */}
      {previewImage && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-rose-500 p-3 rounded-full transition-colors font-bold group" onClick={() => setPreviewImage(null)}>
            ✕
          </button>
          <p className="absolute top-6 left-6 text-white font-bold bg-black/50 px-4 py-2 rounded-xl text-xs">
            Klik di mana saja untuk menutup
          </p>
          <div className="relative max-w-full max-h-[85vh] flex justify-center w-full">
            <img 
              src={previewImage} 
              alt="Preview Lampiran" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-4 ring-white/10" 
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
          <a 
            href={previewImage} 
            target="_blank" 
            rel="noreferrer" 
            className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg flex items-center gap-2 text-xs" 
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={14} />
            <span>Buka Resolusi Penuh</span>
          </a>
        </div>
      )}
    </div>
  );
}
