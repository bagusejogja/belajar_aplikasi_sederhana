'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, Users, ShieldCheck, Clock, RefreshCw, Search, Filter, 
  Download, Eye, Smartphone, Monitor, Globe, ChevronRight, CheckCircle2, 
  AlertCircle, ArrowUpRight, LogIn, LogOut, FileText, Settings, 
  Layers, Database, Calendar, Sparkles, Trash2, X, ChevronDown, Check,
  Radio, BarChart3, PieChart, ShieldAlert, Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { ActivityLogItem } from '@/app/api/activity-logs/route';

export default function MonitoringUserPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [userSummaries, setUserSummaries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalLogsCount: 0,
    todayLogsCount: 0,
    activeUsersCount: 0,
    totalTrackedUsers: 0,
    moduleCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'users' | 'insights'>('feed');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('ALL');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'today' | '3days' | '7days' | 'all'>('all');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  // Clear modal confirmation
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Fetch Activity Data from API
  const fetchActivityData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setIsRefreshing(true);

    try {
      let url = `/api/activity-logs?limit=500`;
      if (selectedUserFilter !== 'ALL') url += `&userEmail=${encodeURIComponent(selectedUserFilter)}`;
      if (selectedModuleFilter !== 'ALL') url += `&module=${encodeURIComponent(selectedModuleFilter)}`;
      if (selectedActionFilter !== 'ALL') url += `&actionType=${encodeURIComponent(selectedActionFilter)}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      if (selectedTimeFilter === 'today') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        url += `&startDate=${d.toISOString()}`;
      } else if (selectedTimeFilter === '3days') {
        const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        url += `&startDate=${d.toISOString()}`;
      } else if (selectedTimeFilter === '7days') {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        url += `&startDate=${d.toISOString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        setUserSummaries(data.userSummaries || []);
        setStats(data.stats || {
          totalLogsCount: 0,
          todayLogsCount: 0,
          activeUsersCount: 0,
          totalTrackedUsers: 0,
          moduleCounts: {}
        });
      } else {
        throw new Error(data.error || 'Gagal memuat log');
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      if (!isSilent) toast.error('Gagal mengambil data monitoring: ' + err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedUserFilter, selectedModuleFilter, selectedActionFilter, selectedTimeFilter, searchQuery]);

  // Initial Load
  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  // Auto-Refresh Polling every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchActivityData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchActivityData]);

  // Extract all unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    userSummaries.forEach(u => set.add(u.email));
    logs.forEach(l => set.add(l.user_email));
    return Array.from(set).filter(Boolean).sort();
  }, [userSummaries, logs]);

  // Helper formatting timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date) + ' WIB';
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 45) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} menit yang lalu`;
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      if (diffDays === 1) return 'Kemarin';
      return `${diffDays} hari yang lalu`;
    } catch {
      return '';
    }
  };

  // Helper Badge Color for Action Types
  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'LOGIN':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: LogIn,
          label: 'Login'
        };
      case 'LOGOUT':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: LogOut,
          label: 'Logout'
        };
      case 'PAGE_VIEW':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Eye,
          label: 'Buka Menu'
        };
      case 'CREATE':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: Sparkles,
          label: 'Tambah Data'
        };
      case 'UPDATE':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Settings,
          label: 'Ubah Data'
        };
      case 'DELETE':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: Trash2,
          label: 'Hapus'
        };
      case 'EXPORT':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: Download,
          label: 'Unduh / Ekspor'
        };
      case 'SECURITY':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: ShieldCheck,
          label: 'Keamanan'
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: Activity,
          label: actionType
        };
    }
  };

  // Helper Badge Color for Module
  const getModuleBadge = (moduleName: string) => {
    const m = (moduleName || '').toUpperCase();
    if (m === 'PERSURATAN') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (m === 'ANGGARAN' || m === 'DANA PEMERINTAH') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (m === 'REVIEW ANGGARAN') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (m === 'PENERIMAAN') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (m === 'MASJID') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (m === 'MASTER') return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    if (m === 'AUTH') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // Export Logs to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('Tidak ada data log untuk diekspor');
      return;
    }

    const headers = ['Waktu', 'Email User', 'Role', 'Jenis Aksi', 'Aktivitas', 'Modul', 'Path Menu', 'IP Address', 'Device/User Agent'];
    const csvRows = [headers.join(',')];

    logs.forEach(l => {
      const row = [
        `"${formatTime(l.created_at)}"`,
        `"${l.user_email}"`,
        `"${l.user_role || '-'}"`,
        `"${l.action_type}"`,
        `"${(l.action_title || '').replace(/"/g, '""')}"`,
        `"${l.module || '-'}"`,
        `"${l.path || '-'}"`,
        `"${l.ip_address || '-'}"`,
        `"${(l.user_agent || '-').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_user_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Berhasil mengekspor ${logs.length} data log ke CSV!`);
  };

  // Clear Logs
  const handleClearLogs = async (keepDays?: number) => {
    setClearing(true);
    try {
      let url = '/api/activity-logs';
      if (keepDays) url += `?keepDays=${keepDays}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Log berhasil dibersihkan!');
        setIsClearModalOpen(false);
        fetchActivityData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error('Gagal membersihkan log: ' + err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6 animate-in fade-in duration-300">
      {/* 1. HEADER UTAMA & KONTROL LIVE MONITORING */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 px-6 rounded-3xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-2xl shadow-md shadow-indigo-200">
            <Activity size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Monitoring Aktivitas Pengguna & Audit Trail
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Monitoring
              </span>
            </div>
            <p className="text-gray-500 font-medium text-xs mt-0.5">
              Pantau siapa yang login, jam berapa, menu apa yang dibuka, serta riwayat perubahan data secara real-time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Toggle Auto Refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
              autoRefresh 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
            title={autoRefresh ? 'Auto-refresh tiap 15 detik aktif' : 'Auto-refresh non-aktif'}
          >
            <Radio size={13} className={autoRefresh ? 'text-emerald-600 animate-spin' : 'text-gray-400'} />
            <span>Auto (15s): {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>

          {/* Refresh Manual */}
          <button
            onClick={() => fetchActivityData()}
            disabled={isRefreshing}
            className="h-9 px-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
            <span>Refresh</span>
          </button>

          {/* Ekspor CSV */}
          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Download size={13} />
            <span>Ekspor CSV</span>
          </button>

          {/* Bersihkan Log */}
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="h-9 px-3 bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="Kelola & Bersihkan Riwayat Log"
          >
            <Trash2 size={13} />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>

      {/* 2. KARTU STATISTIK RINGKAS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: User Sedang Online */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white p-4 px-5 rounded-3xl border border-emerald-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">User Sedang Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {stats.activeUsersCount || 0}
            </span>
            <span className="text-xs font-semibold text-emerald-700">Pengguna</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Aktif dalam 15 menit terakhir
          </p>
        </div>

        {/* Card 2: Aktivitas Hari Ini */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-50/50 to-white p-4 px-5 rounded-3xl border border-indigo-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Aktivitas Hari Ini</span>
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {stats.todayLogsCount || 0}
            </span>
            <span className="text-xs font-semibold text-indigo-700">Tindakan</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            Total seluruh tindakan tercatat hari ini
          </p>
        </div>

        {/* Card 3: Total Pengguna Terlacak */}
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white p-4 px-5 rounded-3xl border border-purple-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Total User Terlacak</span>
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {stats.totalTrackedUsers || userSummaries.length || 0}
            </span>
            <span className="text-xs font-semibold text-purple-700">Akun</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            Memiliki riwayat akses ke sistem
          </p>
        </div>

        {/* Card 4: Total Log Tersimpan */}
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-50/50 to-white p-4 px-5 rounded-3xl border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Total Audit Log</span>
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Database size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {stats.totalLogsCount || logs.length || 0}
            </span>
            <span className="text-xs font-semibold text-blue-700">Entri</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            Tersimpan aman untuk kebutuhan audit
          </p>
        </div>
      </div>

      {/* 3. TAB NAVIGASI */}
      <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60 w-fit">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'feed' 
              ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <Activity size={14} />
          <span>Live Audit Feed ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users' 
              ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <Users size={14} />
          <span>Status & Profil User ({userSummaries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'insights' 
              ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          <BarChart3 size={14} />
          <span>Statistik & Modul Terpopuler</span>
        </button>
      </div>

      {/* 4. TAB CONTENT 1: LIVE AUDIT FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 px-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari email, tindakan, halaman, IP address..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter User */}
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="h-9 px-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">👤 Semua Pengguna</option>
                {uniqueUsers.map((email) => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>

              {/* Filter Modul */}
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="h-9 px-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">📦 Semua Modul</option>
                <option value="AUTH">AUTH (Login/Logout)</option>
                <option value="PERSURATAN">PERSURATAN</option>
                <option value="ANGGARAN">ANGGARAN / PAGU</option>
                <option value="REVIEW ANGGARAN">REVIEW ANGGARAN</option>
                <option value="PENERIMAAN">PENERIMAAN</option>
                <option value="MASJID">MASJID / KAS</option>
                <option value="MASTER">MASTER & USER</option>
                <option value="KEGIATAN">KEGIATAN</option>
                <option value="DASHBOARD">DASHBOARD</option>
              </select>

              {/* Filter Jenis Aksi */}
              <select
                value={selectedActionFilter}
                onChange={(e) => setSelectedActionFilter(e.target.value)}
                className="h-9 px-3 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ALL">⚡ Semua Jenis Aksi</option>
                <option value="LOGIN">🟢 Login</option>
                <option value="LOGOUT">⚪ Logout</option>
                <option value="PAGE_VIEW">🔵 Buka Menu / Halaman</option>
                <option value="CREATE">🟣 Tambah / Input Data</option>
                <option value="UPDATE">🟠 Ubah / Update Data</option>
                <option value="DELETE">🔴 Hapus Data</option>
                <option value="EXPORT">🟢 Ekspor / Unduh</option>
                <option value="SECURITY">🛡️ Keamanan & Akses</option>
              </select>

              {/* Filter Rentang Waktu */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs font-bold">
                <button
                  onClick={() => setSelectedTimeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTimeFilter === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setSelectedTimeFilter('today')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTimeFilter === 'today' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setSelectedTimeFilter('7days')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTimeFilter === '7days' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  7 Hari
                </button>
              </div>
            </div>

            {/* Total Filtered Badge */}
            <div className="text-[11px] font-bold text-gray-500">
              Menampilkan <span className="text-gray-900">{logs.length}</span> entri log
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <RefreshCw size={32} className="animate-spin text-indigo-600 mb-3" />
                <p className="text-xs font-bold text-gray-500">Memuat riwayat aktivitas sistem...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Activity size={24} />
                </div>
                <h3 className="text-sm font-black text-gray-900 mb-1">Belum Ada Aktivitas yang Sesuai</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Coba ubah kata kunci pencarian atau sesuaikan pilihan filter pengguna / modul di atas.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedUserFilter('ALL');
                    setSelectedModuleFilter('ALL');
                    setSelectedActionFilter('ALL');
                    setSelectedTimeFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Waktu</th>
                      <th className="py-3.5 px-4">Pengguna</th>
                      <th className="py-3.5 px-4">Jenis Aksi</th>
                      <th className="py-3.5 px-4">Deskripsi Aktivitas</th>
                      <th className="py-3.5 px-4">Modul & Halaman</th>
                      <th className="py-3.5 px-4">Perangkat & IP</th>
                      <th className="py-3.5 px-4 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {logs.map((log) => {
                      const badge = getActionBadge(log.action_type);
                      const BadgeIcon = badge.icon;
                      const moduleColor = getModuleBadge(log.module);

                      return (
                        <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                          {/* Waktu */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">{getRelativeTime(log.created_at)}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{formatTime(log.created_at)}</div>
                          </td>

                          {/* Pengguna */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                                {log.user_email?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-gray-900 truncate max-w-[180px]" title={log.user_email}>
                                  {log.user_email}
                                </div>
                                <div className="text-[10px] text-indigo-600 font-medium">
                                  {log.user_role || 'Viewer'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Jenis Aksi */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${badge.bg}`}>
                              <BadgeIcon size={12} />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          {/* Deskripsi Aktivitas */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900 leading-snug">
                              {log.action_title}
                            </div>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[280px]" title={JSON.stringify(log.details)}>
                                {typeof log.details.page_title === 'string' ? `Menu: ${log.details.page_title}` : JSON.stringify(log.details).slice(0, 50) + '...'}
                              </div>
                            )}
                          </td>

                          {/* Modul & Halaman */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider mb-1 ${moduleColor}`}>
                              {log.module || 'UMUM'}
                            </span>
                            {log.path && (
                              <div className="text-[10px] text-gray-400 font-mono">
                                {log.path}
                              </div>
                            )}
                          </td>

                          {/* Perangkat & IP */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="text-gray-600 font-medium text-[11px]">
                              {log.user_agent?.includes('Windows') ? '🖥️ Windows' : log.user_agent?.includes('Mac') ? '🍎 MacOS' : log.user_agent?.includes('Android') || log.user_agent?.includes('iPhone') ? '📱 Mobile' : '🌐 Browser'}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              IP: {log.ip_address || '127.0.0.1'}
                            </div>
                          </td>

                          {/* Aksi Detail */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-700 transition-colors cursor-pointer"
                              title="Lihat Detail Payload Log"
                            >
                              <Eye size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: STATUS & PROFIL USER */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSummaries.map((user) => (
              <div 
                key={user.email}
                className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all group"
              >
                <div>
                  {/* Top Bar Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 truncate max-w-[170px]" title={user.email}>
                          {user.email}
                        </h4>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold mt-0.5">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Status Online Indicator */}
                    {user.isOnline ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold shrink-0">
                        Offline
                      </span>
                    )}
                  </div>

                  {/* Informasi Aktivitas */}
                  <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
                    <div className="flex justify-between items-center text-gray-500">
                      <span>Terakhir Aktif:</span>
                      <span className="font-bold text-gray-900">{getRelativeTime(user.lastActive)}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-500">
                      <span>Login Terakhir:</span>
                      <span className="font-bold text-gray-700">
                        {user.lastLogin ? formatTime(user.lastLogin) : 'Sesi Aktif'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-gray-500">
                      <span>Total Tindakan:</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-black text-[11px]">
                        {user.totalActions} kali
                      </span>
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        Tindakan Terakhir:
                      </span>
                      <p className="text-[11px] font-bold text-gray-800 line-clamp-2">
                        {user.lastAction}
                      </p>
                      {user.lastPath && (
                        <span className="text-[10px] text-indigo-600 font-mono mt-1 block">
                          Path: {user.lastPath}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Button: Filter Log to this user */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedUserFilter(user.email);
                      setActiveTab('feed');
                    }}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Riwayat Lengkap User</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: INSIGHTS & STATISTIK POPULER */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Distribusi Modul yang Sering Diakses */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <PieChart size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Distribusi Penggunaan Modul</h3>
                <p className="text-[11px] text-gray-500">Persentase aktivitas berdasarkan modul aplikasi</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {Object.entries(stats.moduleCounts || {}).length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Belum ada data modul tercatat</p>
              ) : (
                Object.entries(stats.moduleCounts || {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([moduleName, count]) => {
                    const total = stats.totalLogsCount || 1;
                    const percentage = Math.round(((count as number) / total) * 100);
                    const color = getModuleBadge(moduleName);

                    return (
                      <div key={moduleName} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-gray-800">{moduleName}</span>
                          <span className="text-gray-500 font-medium">
                            {count as number} tindakan ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Card 2: Panduan Keamanan & Audit Sistem */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/10 text-emerald-400 border border-white/10">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Sistem Keamanan & Kepatuhan Audit</h3>
                <p className="text-[11px] text-indigo-200">Informasi standar pelacakan aktivitas aplikasi</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-indigo-100/90 leading-relaxed pt-2">
              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Pelacakan Otomatis Setiap Halaman:</strong>
                  Sistem otomatis mencatat navigasi menu, waktu akses, alamat IP, dan user-agent perangkat tanpa memberatkan performa antarmuka.
                </div>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Perlindungan Integritas Data:</strong>
                  Seluruh perubahan hak akses (*role management*), pengubahan password, serta input/edit data persuratan dan anggaran memiliki *audit trail* yang dapat ditelusuri.
                </div>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Penyimpanan Tahan Gangguan:</strong>
                  Data log disimpan secara ganda (*dual-persistence*) di cloud & file store lokal berotasi hingga 10.000 entri untuk keandalan maksimal.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL DETAIL AUDIT LOG */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Rincian Audit Log</h3>
                  <p className="text-[10px] text-gray-500 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pengguna:</span>
                  <span className="font-bold text-gray-900 break-all">{selectedLog.user_email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Hak Akses:</span>
                  <span className="font-bold text-indigo-700">{selectedLog.user_role || 'Viewer'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Waktu Tercatat:</span>
                  <span className="font-bold text-gray-800">{formatTime(selectedLog.created_at)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Jenis Tindakan:</span>
                  <span className="font-bold text-emerald-700">{selectedLog.action_type}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Aktivitas:</span>
                <p className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 font-bold text-gray-900">
                  {selectedLog.action_title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Modul & Path:</span>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 font-mono text-[11px] text-gray-700">
                    <div>Modul: {selectedLog.module}</div>
                    <div>Path: {selectedLog.path || '-'}</div>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Jaringan / IP:</span>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 font-mono text-[11px] text-gray-700">
                    <div>IP: {selectedLog.ip_address || '127.0.0.1'}</div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Payload & Detail Metadata (JSON):</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] max-h-44 overflow-y-auto leading-relaxed selection:bg-indigo-600 selection:text-white">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL BERSIHKAN LOG */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="p-5 px-6 border-b border-gray-100 flex justify-between items-center bg-rose-50/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Kelola & Bersihkan Log</h3>
                  <p className="text-[11px] text-gray-500">Pilih opsi pembersihan riwayat audit</p>
                </div>
              </div>
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <p className="text-gray-600 leading-relaxed mb-4">
                Pilih rentang waktu data log yang ingin dibersihkan dari penyimpanan:
              </p>

              <button
                onClick={() => handleClearLogs(30)}
                disabled={clearing}
                className="w-full p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-700 flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Hapus Log yang Lebih Lama dari 30 Hari</span>
                <ChevronRight size={15} />
              </button>

              <button
                onClick={() => handleClearLogs(7)}
                disabled={clearing}
                className="w-full p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-700 flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Hapus Log yang Lebih Lama dari 7 Hari</span>
                <ChevronRight size={15} />
              </button>

              <button
                onClick={() => {
                  if (confirm('PERINGATAN: Anda yakin ingin mengosongkan SEMUA riwayat aktivitas log pengguna?')) {
                    handleClearLogs();
                  }
                }}
                disabled={clearing}
                className="w-full p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl font-bold text-rose-700 flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>Kosongkan Seluruh Riwayat Log</span>
                <Trash2 size={15} />
              </button>
            </div>

            <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
