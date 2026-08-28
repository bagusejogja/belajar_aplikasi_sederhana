'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, Cloud, Download, Trash2, RefreshCw, 
  CheckCircle2, AlertCircle, FileCode, FileSpreadsheet, 
  ShieldCheck, HardDrive, Clock, ArrowDownToLine,
  ExternalLink, Sparkles, HelpCircle, Lock, Server,
  UploadCloud, Play, FolderArchive, FileText, Image as ImageIcon,
  Terminal, Check, Copy, Folder, Layers, Calendar, Filter,
  Zap, ArrowRight, CheckCircle, ChevronRight, FolderCheck,
  Laptop
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BackupFile {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
  url: string;
  format: 'sql' | 'json';
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [totalTables, setTotalTables] = useState(43);
  const [r2Bucket, setR2Bucket] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  // Attachment stats state
  const [attachmentsCount, setAttachmentsCount] = useState<number>(0);
  const [attachmentsSize, setAttachmentsSize] = useState<number>(0);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [folderStats, setFolderStats] = useState<Record<string, { count: number; size: number }>>({});
  
  // Filtering states for downloads
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | '7d' | '30d' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [downloadingFolder, setDownloadingFolder] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [copiedSyncCmd, setCopiedSyncCmd] = useState(false);
  const [copiedBatPath, setCopiedBatPath] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const [dbRes, attachRes] = await Promise.all([
        fetch('/api/backup?action=list'),
        fetch('/api/backup/attachments?action=list')
      ]);

      const dbData = await dbRes.json();
      const attachData = await attachRes.json();

      if (dbData.success) {
        setBackups(dbData.files || []);
        if (dbData.totalTablesAvailable) setTotalTables(dbData.totalTablesAvailable);
        if (dbData.bucket) setR2Bucket(dbData.bucket);
      } else {
        toast.error(dbData.error || 'Gagal memuat riwayat backup dari Cloudflare R2');
      }

      if (attachData.success) {
        setAttachmentsCount(attachData.totalFiles || 0);
        setAttachmentsSize(attachData.totalSize || 0);
        setAvailableYears(attachData.availableYears || []);
        setFolderStats(attachData.folders || {});
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan saat memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateCloudBackup = async (format: 'sql' | 'json' = 'sql') => {
    setIsBackingUp(true);
    const toastId = toast.loading(`Mendeteksi otomatis tabel database & mengunggah ke Cloudflare R2 (${format.toUpperCase()})...`);

    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Backup ${format.toUpperCase()} (${data.file?.tablesCount || totalTables} tabel) berhasil di Cloudflare R2!`, { id: toastId });
        fetchBackups();
      } else {
        throw new Error(data.error || 'Gagal mencadangkan database.');
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsBackingUp(false);
    }
  };

  const getStartDateByPreset = () => {
    const now = new Date();
    if (dateFilterPreset === '7d') {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      return d.toISOString().split('T')[0];
    }
    if (dateFilterPreset === '30d') {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      return d.toISOString().split('T')[0];
    }
    if (dateFilterPreset === 'this_month') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
    if (dateFilterPreset === 'custom' && customStartDate) {
      return customStartDate;
    }
    return '';
  };

  const handleDownloadAttachmentZip = async (targetFolder?: string) => {
    const folderToDownload = targetFolder !== undefined ? targetFolder : selectedFolder;
    setIsDownloadingZip(true);
    setDownloadingFolder(folderToDownload || 'all');

    const startDate = getStartDateByPreset();
    const folderLabel = folderToDownload ? `Folder "${folderToDownload}"` : 'Semua Folder';
    const dateLabel = startDate ? ` (Sejak ${startDate})` : '';
    const toastId = toast.loading(`Menyiapkan paket ZIP ${folderLabel}${dateLabel}...`);

    try {
      let url = `/api/backup/attachments?action=zip&limit=1000`;
      if (folderToDownload) url += `&folder=${encodeURIComponent(folderToDownload)}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;

      const res = await fetch(url);
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal membuat file ZIP lampiran.');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeFolder = folderToDownload ? `${folderToDownload}_` : 'semua_';
      const safeDate = startDate ? `update_sejak_${startDate}_` : '';
      a.download = `lampiran_${safeFolder}${safeDate}${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Download ZIP lampiran ${folderLabel} selesai!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsDownloadingZip(false);
      setDownloadingFolder(null);
    }
  };

  const handleDeleteBackup = async (key: string, filename: string) => {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus file backup "${filename}" dari Cloudflare R2?`);
    if (!confirmDelete) return;

    setDeletingKey(key);
    try {
      const res = await fetch('/api/backup', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`File backup berhasil dihapus.`);
        setBackups(prev => prev.filter(b => b.key !== key));
      } else {
        throw new Error(data.error || 'Gagal menghapus file.');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingKey(null);
    }
  };

  const copySyncCommand = () => {
    navigator.clipboard.writeText('npm run sync-lampiran');
    setCopiedSyncCmd(true);
    toast.success('Perintah disalin ke clipboard!');
    setTimeout(() => setCopiedSyncCmd(false), 2000);
  };

  const copyBatFileName = () => {
    navigator.clipboard.writeText('SYNC_PORTABLE_SEMUA_PC.bat');
    setCopiedBatPath(true);
    toast.success('Nama file disalin ke clipboard!');
    setTimeout(() => setCopiedBatPath(false), 2000);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const totalStorageSize = backups.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const latestBackupDate = backups.length > 0 ? backups[0].lastModified : null;

  const filteredBackups = backups.filter(b => 
    b.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.format.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* 1. SLIM & UNIFIED TOP TOOLBAR WITH ACTIVE STATUS GLOW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-600 p-2.5 rounded-xl text-white shadow-xs">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Pusat Cadangan & Sinkronisasi Data
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                R2 Cloud Connected
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Auto-Discovery {totalTables} Tabel Database & Sinkronisasi Pintar {attachmentsCount.toLocaleString()} File Lampiran.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end relative z-10">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="h-9 px-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="Refresh Riwayat Cloudflare"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
            <span>Segarkan Status</span>
          </button>

          <button
            onClick={() => handleCreateCloudBackup('sql')}
            disabled={isBackingUp}
            className="h-9 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isBackingUp ? <RefreshCw size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            <span>Backup SQL ke Cloudflare R2</span>
          </button>
        </div>
      </div>

      {/* 2. 4 MODERN KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL TABEL TERLINDUNGI */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">TABEL TERDETEKSI</span>
              <div className="text-xl font-black text-gray-900 font-mono tracking-tight flex items-baseline gap-1">
                {totalTables} <span className="text-xs font-semibold text-gray-500">Tabel</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Tabel Baru Supabase</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Auto-Protected</span>
          </div>
        </div>

        {/* CARD 2: TOTAL FILE DUMP DI CLOUDFLARE */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">ARSIP DATABASE DI R2</span>
              <div className="text-xl font-black text-emerald-700 font-mono tracking-tight flex items-baseline gap-1">
                {backups.length} <span className="text-xs font-semibold text-emerald-600">File Dump</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <Cloud size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
            <span>Bucket: {r2Bucket || 'lampiran-aplikasi'}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Tersinkron</span>
          </div>
        </div>

        {/* CARD 3: TOTAL LAMPIRAN FISIK */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-amber-200 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">LAMPIRAN DI R2</span>
              <div className="text-xl font-black text-amber-700 font-mono tracking-tight flex items-baseline gap-1">
                {attachmentsCount.toLocaleString()} <span className="text-xs font-semibold text-amber-600">Objek</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80">
              <FolderArchive size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>{Object.keys(folderStats).length} Kategori Folder</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">{formatBytes(attachmentsSize)}</span>
          </div>
        </div>

        {/* CARD 4: WAKTU BACKUP TERAKHIR */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">BACKUP TERAKHIR</span>
              <div className="text-xs font-black text-gray-900 truncate max-w-[170px] mt-1">
                {latestBackupDate ? new Date(latestBackupDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Belum Pernah'}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Status Sinkronisasi</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Siap Pakai</span>
          </div>
        </div>
      </div>

      {/* 3. MODUL KHUSUS: PENCADANGAN LAMPIRAN FISIK (PDF & GAMBAR) */}
      <div className="bg-white rounded-2xl border border-indigo-200/80 shadow-xs p-5 md:p-6 space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-indigo-100/80 text-indigo-700 rounded-xl border border-indigo-200/70">
              <FolderArchive size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-gray-900 tracking-tight">
                  Pencadangan Lampiran Fisik (Total: {attachmentsCount.toLocaleString()} File di Cloudflare R2)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Update-Only Mode
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Unduh file lampiran per kategori folder atau filter berdasarkan tanggal terakhir backup.
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS: PILIH FOLDER & RENTANG TANGGAL UPDATE */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/70 via-sky-50/40 to-indigo-50/70 rounded-2xl border border-indigo-100 space-y-3">
          <div className="text-xs font-black text-indigo-950 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-indigo-600" />
              <span>Panel Pemilihan Folder & Filter Update File Baru:</span>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700">
              {selectedFolder ? `Target: Folder "${selectedFolder}"` : 'Target: Semua 12 Folder'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. DROP DOWN PILIH FOLDER */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                1. Posisi Folder:
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer"
              >
                <option value="">📁 Semua Folder ({attachmentsCount.toLocaleString()} File)</option>
                {Object.entries(folderStats).map(([folderName, stats]) => (
                  <option key={folderName} value={folderName}>
                    📁 {folderName} ({stats.count.toLocaleString()} file - {formatBytes(stats.size)})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. PILIHAN RENTANG WAKTU (UPDATE ONLY) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                2. Filter Waktu (Mode Update):
              </label>
              <select
                value={dateFilterPreset}
                onChange={(e) => setDateFilterPreset(e.target.value as any)}
                className="w-full h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer"
              >
                <option value="all">⚡ Semua Waktu (Full Backup)</option>
                <option value="7d">🕒 7 Hari Terakhir Saja (Update Cepat)</option>
                <option value="30d">📅 30 Hari Terakhir Saja</option>
                <option value="this_month">🗓️ Bulan Ini Saja</option>
                <option value="custom">📆 Pilih Tanggal Mulai (Custom)</option>
              </select>
            </div>

            {/* 3. TOMBOL DOWNLOAD SESUAI PILIHAN */}
            <div className="space-y-1 flex flex-col justify-end">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                3. Aksi Unduh:
              </label>
              <button
                onClick={() => handleDownloadAttachmentZip()}
                disabled={isDownloadingZip || attachmentsCount === 0}
                className="w-full h-9 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isDownloadingZip ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                <span>
                  {dateFilterPreset !== 'all' ? 'Unduh Update ZIP Saja' : 'Unduh Paket ZIP Sesuai Filter'}
                </span>
              </button>
            </div>
          </div>

          {/* INPUT TANGGAL CUSTOM JIKA MEMILIH CUSTOM DATE */}
          {dateFilterPreset === 'custom' && (
            <div className="p-3 bg-white rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-xs font-bold text-gray-700">Unduh file yang diupload sejak tanggal:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="text-[11px] text-gray-500">
                (Hanya file baru yang dibuat setelah tanggal ini yang akan dimasukkan ke dalam ZIP)
              </span>
            </div>
          )}
        </div>

        {/* DAFTAR 12 FOLDER R2 DENGAN TOMBOL DOWNLOAD CEPAT */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-black text-gray-800 uppercase tracking-wider block">
            Daftar 12 Folder di Cloudflare R2 (Klik "Unduh ZIP" pada folder yang diinginkan):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {Object.entries(folderStats).map(([folderName, stats]) => (
              <div 
                key={folderName}
                className={`bg-white p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  selectedFolder === folderName 
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm bg-indigo-50/20' 
                    : 'border-gray-200/90 shadow-2xs hover:border-indigo-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Folder size={16} className="text-amber-500 shrink-0" />
                    <span className="font-bold text-xs text-gray-900 truncate" title={folderName}>
                      {folderName}
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                    {stats.count.toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono">{formatBytes(stats.size)}</span>
                  <button
                    onClick={() => handleDownloadAttachmentZip(folderName)}
                    disabled={isDownloadingZip}
                    className="h-6 px-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md text-[10px] font-bold transition-all flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
                    title={`Download ZIP folder "${folderName}" (${stats.count} file)`}
                  >
                    {downloadingFolder === folderName ? (
                      <RefreshCw size={10} className="animate-spin" />
                    ) : (
                      <Download size={10} />
                    )}
                    <span>Unduh ZIP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DUA OPSI SINKRONISASI PINTAR (LOCAL DEV VS PORTABLE SEMUA PC) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* OPSI 1: PORTABLE UNTUK SEMUA PC WINDOWS */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Laptop size={15} />
                  <span>Skrip Portabel (Untuk Semua Komputer/Laptop)</span>
                </h4>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Bebas Node.js
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Cukup jalankan file <code className="font-mono text-emerald-300 bg-slate-800 px-1.5 py-0.5 rounded">SYNC_PORTABLE_SEMUA_PC.bat</code> di komputer mana pun untuk menyinkronkan 5.062 file ke Drive D.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">SYNC_PORTABLE_SEMUA_PC.bat</span>
              <button
                onClick={copyBatFileName}
                className="h-7 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedBatPath ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedBatPath ? 'Tersalin' : 'Salin Nama File'}</span>
              </button>
            </div>
          </div>

          {/* OPSI 2: TERMINAL CLI DEVELOPER */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-sky-400 flex items-center gap-1.5">
                  <Terminal size={15} />
                  <span>Opsi Terminal CLI (Komputer Lokal Ini)</span>
                </h4>
                <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-full font-bold">
                  Node.js CLI
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Menjalankan skrip sinkronisasi incremental cepat langsung di terminal VS Code atau PowerShell.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono text-sky-300">npm run sync-lampiran</span>
              <button
                onClick={copySyncCommand}
                className="h-7 px-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedSyncCmd ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedSyncCmd ? 'Tersalin' : 'Salin Perintah'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DUA PILIHAN METODE PENCADANGAN DATABASE (CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OPSI 1: CLOUD BACKUP CLOUDFLARE R2 */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 rounded-2xl p-6 text-white border border-indigo-500/20 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <Cloud size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">Pencadangan Database ke Cloudflare R2</h3>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">Mendeteksi seluruh tabel secara otomatis & menyimpan salinan database di cloud.</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Sistem Next.js di server akan mengekspor seluruh {totalTables} tabel (termasuk tabel baru) dan mengunggahnya langsung ke Cloudflare R2 tanpa terminal.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={() => handleCreateCloudBackup('sql')}
              disabled={isBackingUp}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isBackingUp ? <RefreshCw size={13} className="animate-spin" /> : <UploadCloud size={13} />}
              <span>Backup SQL ke R2</span>
            </button>

            <button
              onClick={() => handleCreateCloudBackup('json')}
              disabled={isBackingUp}
              className="h-9 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <FileCode size={13} />
              <span>Backup JSON ke R2</span>
            </button>
          </div>
        </div>

        {/* OPSI 2: DOWNLOAD LANGSUNG KE LAPTOP */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <HardDrive size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 tracking-tight">Unduh Database Langsung ke Laptop</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Download file .sql atau .json langsung ke folder Downloads komputer Anda.</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            Menghasilkan file dump database secara <em>on-the-fly</em> dan langsung mengunduhnya melalui browser tanpa menyimpan ke cloud storage.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <a
              href="/api/backup?format=sql"
              download
              className="h-9 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Download size={13} />
              <span>Unduh File SQL (.sql)</span>
            </a>

            <a
              href="/api/backup?format=json"
              download
              className="h-9 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <FileCode size={13} />
              <span>Unduh File JSON (.json)</span>
            </a>
          </div>
        </div>
      </div>

      {/* 5. TABEL RIWAYAT FILE BACKUP DI CLOUDFLARE R2 */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 px-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">
              Daftar Arsip Database di Cloudflare R2 ({filteredBackups.length} File)
            </h3>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              File tersimpan aman di Cloudflare R2. Anda bisa mengunduh atau menghapus arsip kapan saja.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari file backup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama File Backup</th>
                <th className="py-3 px-4 w-28 text-center">Format</th>
                <th className="py-3 px-4 w-32 text-right">Ukuran File</th>
                <th className="py-3 px-4 w-44">Waktu Pembuatan</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs font-medium">
                    <RefreshCw size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Memuat daftar arsip Cloudflare R2...
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-xs font-medium space-y-2">
                    <Cloud size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-600">Belum ada file backup database di Cloudflare R2.</p>
                    <p className="text-[11px] text-gray-400">Klik tombol "Backup SQL ke Cloudflare R2" di atas untuk membuat arsip cloud pertama Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredBackups.map((file, idx) => (
                  <tr key={file.key} className="even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 whitespace-nowrap transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-gray-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {file.format === 'sql' ? (
                          <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <FileCode size={16} className="text-indigo-600 shrink-0" />
                        )}
                        <span className="font-mono font-bold text-xs text-gray-900">{file.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono border ${
                        file.format === 'sql' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        .{file.format}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-xs text-gray-700">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 font-medium">
                      {new Date(file.lastModified).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          download={file.filename}
                          className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                          title="Unduh File dari Cloudflare R2"
                        >
                          <Download size={12} />
                          <span>Unduh</span>
                        </a>

                        <button
                          onClick={() => handleDeleteBackup(file.key, file.filename)}
                          disabled={deletingKey === file.key}
                          className="h-7 px-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
                          title="Hapus dari Cloudflare R2"
                        >
                          {deletingKey === file.key ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. PANDUAN PEMULIHAN / RESTORE DATA */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <HelpCircle size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">Panduan Pemulihan Data (Disaster Recovery)</h3>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Langkah praktis untuk merestore database jika diperlukan pemulihan sistem.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center mb-2">1</span>
            <h4 className="font-bold text-gray-900">Unduh File SQL</h4>
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Unduh file backup <code className="font-mono text-indigo-600">.sql</code> terbaru dari tabel riwayat di atas.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center mb-2">2</span>
            <h4 className="font-bold text-gray-900">Buka SQL Editor Supabase</h4>
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Buka dashboard Supabase / PostgreSQL Anda, masuk ke menu <strong>SQL Editor</strong>.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center mb-2">3</span>
            <h4 className="font-bold text-gray-900">Jalankan Query (Run)</h4>
            <p className="text-gray-500 text-[11px] leading-relaxed">
              Paste isi file SQL lalu klik <strong>Run</strong>. Semua struktur dan data tabel akan otomatis pulih.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
