'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activityLogger';
import { 
  ShieldCheck, ShieldAlert, Loader2, Save, UserX, UserCheck, Search, 
  Mail, Calendar, Hash, KeyRound, Copy, Check, X, Lock, Send, 
  Users as UsersIcon, RefreshCw, Filter, Sparkles, AlertCircle, CheckCircle2,
  ChevronDown, LayoutGrid, List, Crown
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '@/components/shared/PageHeader';

interface AppUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  // State Modal Reset Password
  const [resetModalUser, setResetModalUser] = useState<AppUser | null>(null);
  const [resetMode, setResetMode] = useState<'default' | 'email'>('default');
  const [customPassword, setCustomPassword] = useState('UGM123456');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);

      // 2. Ambil SEMUA role unik dari tabel Menu dan User
      const { data: menuRoles } = await supabase.from('app_role_menus').select('role');
      
      const finalRoles: any[] = [
        { value: 'ADMIN', label: '👑 Administrator', color: 'indigo' }
      ];
      
      const uniqueMenuRoles = Array.from(new Set(menuRoles?.map(r => r.role) || []))
        .filter(r => r && r.toUpperCase() !== 'ADMIN' && r !== 'Pending');

      uniqueMenuRoles.forEach(role => {
        finalRoles.push({ 
          value: role, 
          label: `👤 ${role}`, 
          color: 'emerald' 
        });
      });

      // Tambahkan role unik lain yang mungkin ada di user
      const otherRoles = Array.from(new Set(data?.map(u => u.role) || []))
        .filter(r => r && r.toUpperCase() !== 'ADMIN' && r !== 'Pending' && !uniqueMenuRoles.includes(r));
      otherRoles.forEach(role => {
        finalRoles.push({ value: role, label: `👤 ${role}`, color: 'blue' });
      });

      // Tambahkan pilihan Blokir di paling bawah
      finalRoles.push({ value: 'Pending', label: '🚫 Kunci / Blokir Akun', color: 'red' });
      
      setAvailableRoles(finalRoles);
    } catch (err: any) {
      console.error("DEBUG - Sync Error:", err.message);
      toast.error('Gagal memuat daftar user: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    setSavingId(userId);
    try {
      const targetUser = users.find(u => u.id === userId);
      const { error } = await supabase
        .from('app_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      logActivity({
        action_type: 'SECURITY',
        action_title: `Mengubah hak akses user ${targetUser?.email || userId} menjadi [${newRole}]`,
        module: 'MASTER',
        path: '/users',
        details: { target_email: targetUser?.email, new_role: newRole, user_id: userId }
      });

      toast.success('Hak akses pengguna berhasil diperbarui!');
    } catch (err: any) {
      toast.error("Gagal merubah akses: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalUser) return;
    setIsResetting(true);
    setResetResult(null);

    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetModalUser.id,
          email: resetModalUser.email,
          newPassword: resetMode === 'default' ? customPassword : undefined,
          mode: resetMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal me-reset password.');

      logActivity({
        action_type: 'SECURITY',
        action_title: `Reset password untuk pengguna ${resetModalUser.email} (Mode: ${resetMode})`,
        module: 'MASTER',
        path: '/users',
        details: { target_email: resetModalUser.email, mode: resetMode }
      });

      setResetResult({
        success: true,
        message: data.message,
        password: data.newPassword,
      });
      toast.success('Password berhasil di-reset!');
    } catch (err: any) {
      setResetResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat mereset password.',
      });
      toast.error(err.message || 'Gagal reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyPassword = () => {
    if (resetResult?.password) {
      navigator.clipboard.writeText(resetResult.password);
      setCopied(true);
      toast.success('Password tersalin ke clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast.success('Email tersalin!');
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRoleFilter]);

  const activeUsersCount = users.filter(u => u.role?.toUpperCase() !== 'PENDING').length;
  const pendingUsersCount = users.filter(u => u.role?.toUpperCase() === 'PENDING').length;

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col justify-center items-center gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-600"/>
        <span className="text-xs font-bold text-gray-500">Memuat data pengguna...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-24">
      {/* STANDARD DESIGN SYSTEM PAGE HEADER */}
      <PageHeader
        layout="stacked"
        title="Manajemen User & Hak Akses"
        subtitle="Kelola penetapan peran (role), status kunci/aktif akun, serta perbaikan reset password pengguna"
        icon={ShieldCheck}
        breadcrumbs={[
          { label: 'Master Data' },
          { label: 'Manajemen User' }
        ]}
        badge={{ text: `${users.length} Total Akun`, variant: 'purple' }}
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
                }`}
                title="Tampilan Kartu Modern"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800 dark:text-slate-400'
                }`}
                title="Tampilan Tabel Baku"
              >
                <List size={13} />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>

            {/* Role Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="h-9 pl-3 pr-8 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors appearance-none"
              >
                <option value="ALL">Semua Role ({users.length})</option>
                <option value="ADMIN">👑 Administrator ({users.filter(u => u.role === 'ADMIN').length})</option>
                {availableRoles.filter(r => r.value !== 'ADMIN' && r.value !== 'Pending').map(r => (
                  <option key={r.value} value={r.value}>{r.label} ({users.filter(u => u.role === r.value).length})</option>
                ))}
                <option value="Pending">🚫 Terkunci / Pending ({pendingUsersCount})</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Cari email atau role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full pl-9 pr-7 bg-gray-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold text-xs text-gray-800 dark:text-slate-200"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={fetchUsers}
              className="h-9 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-600 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        }
      />

      {/* 3 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-50/40 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 shadow-2xs backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
              TOTAL USER TERDAFTAR
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
              {users.length} <span className="text-xs text-slate-500 font-sans font-bold">Akun</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
            <UsersIcon size={20} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 shadow-2xs backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              AKUN AKTIF (BERHAK AKSES)
            </span>
            <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100 font-mono tracking-tight">
              {activeUsersCount} <span className="text-xs text-emerald-600 font-sans font-bold">({users.length > 0 ? Math.round((activeUsersCount / users.length) * 100) : 0}%)</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 via-rose-50/40 to-white dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-900 border border-rose-200/80 dark:border-rose-800/60 rounded-2xl p-4 shadow-2xs backdrop-blur-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
              AKUN TERKUNCI / PENDING
            </span>
            <div className="text-2xl font-black text-rose-950 dark:text-rose-100 font-mono tracking-tight">
              {pendingUsersCount} <span className="text-xs text-rose-600 font-sans font-bold">({users.length > 0 ? Math.round((pendingUsersCount / users.length) * 100) : 0}%)</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-100/80 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 shadow-xs">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* QUICK CATEGORY FILTER PILLS & STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedRoleFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200/80 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            <span>Semua Akun</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedRoleFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedRoleFilter === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200/80 dark:border-slate-700 hover:border-purple-300'
            }`}
          >
            <span>👑 Administrator</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedRoleFilter === 'ADMIN' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
              {users.filter(u => u.role === 'ADMIN').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleFilter('STAFF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedRoleFilter === 'STAFF'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200/80 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <span>⚡ Staf & Pemroses</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedRoleFilter === 'STAFF' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
              {users.filter(u => ['STAFF', 'PEMROSES ANGGARAN', 'Pemroses Anggaran'].includes(u.role)).length}
            </span>
          </button>

          {pendingUsersCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('Pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedRoleFilter === 'Pending'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50'
              }`}
            >
              <span>🚫 Terkunci</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedRoleFilter === 'Pending' ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700'}`}>
                {pendingUsersCount}
              </span>
            </button>
          )}
        </div>

        {/* Counter Info */}
        <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
          Menampilkan <strong className="text-indigo-600 dark:text-indigo-400">{filteredUsers.length}</strong> dari <strong>{users.length}</strong> akun
        </span>
      </div>

      {/* USER LIST: CONDITIONAL GRID OR TABLE VIEW */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl text-center border border-dashed border-gray-200 dark:border-slate-800 space-y-2">
          <UserX size={36} className="mx-auto text-gray-300 dark:text-slate-600" />
          <p className="text-gray-700 dark:text-slate-300 font-black text-sm">Pengguna Tidak Ditemukan</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Coba ubah kata kunci pencarian atau bersihkan filter role yang sedang aktif.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= 1. KARTU MODERN (GRID VIEW) ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredUsers.map((u) => {
            const isPending = u.role?.toUpperCase() === 'PENDING';
            const isAdmin = u.role?.toUpperCase() === 'ADMIN';
            const initial = (u.email || 'U').charAt(0).toUpperCase();

            return (
              <div 
                key={u.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between overflow-hidden ${
                  isPending 
                    ? 'border-rose-200 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/30 to-white dark:from-rose-950/10 dark:to-slate-900' 
                    : isAdmin 
                    ? 'border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/30 to-white dark:from-indigo-950/10 dark:to-slate-900'
                    : 'border-gray-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Subtle Glow Line */}
                <div className={`h-1 w-full ${
                  isAdmin 
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500' 
                    : isPending 
                    ? 'bg-rose-500' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                }`} />

                <div className="p-4 space-y-3.5 flex-1">
                  {/* Card Header: Avatar, Name, Email, Copy, and Role Pill */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Avatar with Glow & Active Status Ring */}
                      <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                          isAdmin 
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-indigo-200 dark:shadow-none' 
                            : isPending 
                            ? 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800' 
                            : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-200 dark:shadow-none'
                        }`}>
                          {isAdmin ? <Crown size={20} className="text-amber-300" /> : isPending ? <ShieldAlert size={20} /> : initial}
                        </div>
                        {/* Status Ring Indicator */}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                          isPending ? 'bg-rose-500' : 'bg-emerald-500 ring-2 ring-emerald-400/40 animate-pulse'
                        }`} />
                      </div>

                      {/* User Email & ID */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs md:text-sm font-black text-slate-900 dark:text-slate-100 truncate tracking-tight" title={u.email}>
                            {u.email}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(u.email)}
                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                            title="Salin Email Pengguna"
                          >
                            {copiedEmail === u.email ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                            ID: {u.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 dark:text-slate-500 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-indigo-500" />
                      Bergabung: {new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${isPending ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      {isPending ? 'Perlu Verifikasi' : 'Terverifikasi Aktif'}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 bg-gray-50/70 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 justify-between">
                  {/* Reset Password Button (Hanya Ikon Kunci) */}
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(u);
                      setCustomPassword('UGM123456');
                      setResetResult(null);
                      setResetMode('default');
                    }}
                    className="w-8 h-8 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 rounded-xl transition-all flex items-center justify-center shrink-0 shadow-2xs active:scale-95 cursor-pointer"
                    title="Reset Password Pengguna"
                  >
                    <KeyRound size={14} className="text-amber-600 dark:text-amber-400" />
                  </button>

                  {/* Role Selector Dropdown */}
                  <div className="relative flex-1 min-w-[130px]">
                    <select 
                      value={u.role} 
                      disabled={savingId === u.id}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className={`h-8 w-full appearance-none font-bold pl-2.5 pr-7 rounded-xl border text-[11px] outline-none transition-all cursor-pointer shadow-2xs ${
                        isAdmin 
                          ? 'border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-50' 
                          : isPending 
                          ? 'border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-950/50 hover:bg-rose-50' 
                          : 'border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/50 hover:bg-emerald-50'
                      }`}
                    >
                      {availableRoles.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      {savingId === u.id ? <Loader2 size={12} className="animate-spin text-indigo-600" /> : <ChevronDown size={12} />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 2. TABEL BAKU PRO (TABLE VIEW) ================= */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-200/80 dark:border-slate-700/80 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  <th className="py-3 px-4">Pengguna & Email</th>
                  <th className="py-3 px-4">Role / Peran</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4">Tanggal Daftar</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isPending = u.role?.toUpperCase() === 'PENDING';
                  const isAdmin = u.role?.toUpperCase() === 'ADMIN';
                  const initial = (u.email || 'U').charAt(0).toUpperCase();

                  return (
                    <tr 
                      key={u.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isAdmin 
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white' 
                              : isPending 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' 
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {isAdmin ? '👑' : isPending ? '🚫' : initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{u.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyEmail(u.email)}
                                className="text-gray-400 hover:text-indigo-600 p-0.5 transition-colors cursor-pointer"
                                title="Salin Email"
                              >
                                {copiedEmail === u.email ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                              </button>
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">ID: {u.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            👑 Admin
                          </span>
                        ) : isPending ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            🚫 Terkunci
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            👤 {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPending 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                          {isPending ? 'Terkunci' : 'Aktif'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-500 dark:text-slate-400 text-[11px] font-medium">
                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(u);
                              setCustomPassword('UGM123456');
                              setResetResult(null);
                              setResetMode('default');
                            }}
                            className="w-7 h-7 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60 rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                            title="Reset Password Pengguna"
                          >
                            <KeyRound size={12} className="text-amber-600 dark:text-amber-400" />
                          </button>

                          <div className="relative w-36">
                            <select 
                              value={u.role} 
                              disabled={savingId === u.id}
                              onChange={(e) => updateRole(u.id, e.target.value)}
                              className="h-7 w-full appearance-none font-bold pl-2 pr-6 rounded-lg border border-gray-200 text-[10px] outline-none cursor-pointer bg-white dark:bg-slate-800"
                            >
                              {availableRoles.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                              {savingId === u.id ? <Loader2 size={10} className="animate-spin text-indigo-600" /> : <ChevronDown size={10} />}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative space-y-6">
            
            {/* Close Button */}
            <button 
              onClick={() => setResetModalUser(null)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Reset Password User</h3>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[260px]">{resetModalUser.email}</p>
              </div>
            </div>

            {/* Form Mode Selection */}
            {!resetResult && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResetMode('default')}
                    className={`p-3.5 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                      resetMode === 'default'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Lock size={18} />
                    <span>Password Default</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetMode('email')}
                    className={`p-3.5 rounded-2xl text-xs font-bold border transition-all flex flex-col items-center gap-2 ${
                      resetMode === 'email'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Send size={18} />
                    <span>Kirim Email Reset</span>
                  </button>
                </div>

                {resetMode === 'default' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">
                      Password Default Baru
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500/20 outline-none"
                        placeholder="UGM123456"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 italic">
                      Password ini akan langsung diterapkan ke akun user tanpa verifikasi email.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-indigo-900 text-xs leading-relaxed font-medium">
                    Sistem akan mengirimkan email berisikan link konfirmasi reset password langsung ke email <strong>{resetModalUser.email}</strong>.
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResetting || (resetMode === 'default' && !customPassword)}
                    className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isResetting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                    {isResetting ? 'Memproses...' : 'Terapkan Reset'}
                  </button>
                </div>
              </div>
            )}

            {/* Hasil Reset */}
            {resetResult && (
              <div className="space-y-5">
                <div className={`p-4 rounded-2xl border text-xs font-semibold space-y-2 ${
                  resetResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <p className="font-bold">{resetResult.message}</p>

                  {resetResult.password && (
                    <div className="pt-2">
                      <p className="text-[11px] text-emerald-700 font-medium mb-1">Berikan password default ini ke user:</p>
                      <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-emerald-300">
                        <span className="font-mono text-sm font-black text-gray-900 flex-1">{resetResult.password}</span>
                        <button
                          onClick={handleCopyPassword}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'Tersalin!' : 'Salin'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="w-full py-3.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xs transition-colors"
                >
                  Selesai
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

