'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, ShieldAlert, Loader2, Save, UserX, UserCheck, Search, 
  Mail, Calendar, Hash, KeyRound, Copy, Check, X, Lock, Send, 
  Users as UsersIcon, RefreshCw, Filter, Sparkles, AlertCircle, CheckCircle2,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

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
      const { error } = await supabase
        .from('app_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
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
      {/* SLIM & COMPACT HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-xl text-white shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Manajemen User</h2>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                {users.length} Total Akun
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Kelola hak akses role, status akun, dan reset password pengguna.
            </p>
          </div>
        </div>

        {/* Search & Filters in Header */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="relative">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="h-9 pl-3 pr-8 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer transition-colors appearance-none"
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
          <div className="relative flex-1 md:w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari email atau role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full pl-9 pr-7 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all font-semibold text-xs text-gray-800"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={fetchUsers}
            className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* QUICK STATUS BAR */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-gray-500">
        <span>Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> pengguna terdaftar</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {activeUsersCount} Aktif
          </span>
          {pendingUsersCount > 0 && (
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> {pendingUsersCount} Terkunci
            </span>
          )}
        </div>
      </div>

      {/* USER LIST CARDS */}
      <div className="space-y-2.5">
        {filteredUsers.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-dashed border-gray-200 space-y-2">
            <UserX size={32} className="mx-auto text-gray-300" />
            <p className="text-gray-500 font-bold text-sm">Pengguna tidak ditemukan</p>
            <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau filter role.</p>
          </div>
        ) : filteredUsers.map((u, idx) => {
          const isPending = u.role?.toUpperCase() === 'PENDING';
          const isAdmin = u.role?.toUpperCase() === 'ADMIN';
          const initial = (u.email || 'U').charAt(0).toUpperCase();

          return (
            <div 
              key={u.id} 
              className={`bg-white p-3.5 px-4 md:px-5 rounded-2xl border transition-all duration-200 hover:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                isPending ? 'border-rose-200 bg-rose-50/20' : 'border-gray-200/80 hover:border-indigo-200'
              }`}
            >
              {/* Left Column: Avatar & User Details */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0 w-full">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                  isAdmin 
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-indigo-100' 
                    : isPending 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-100'
                }`}>
                  {isAdmin ? '👑' : isPending ? <ShieldAlert size={18} /> : initial}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs md:text-sm font-black text-gray-900 truncate">{u.email}</span>
                    <button
                      onClick={() => handleCopyEmail(u.email)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
                      title="Salin Email"
                    >
                      {copiedEmail === u.email ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                    {isAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Admin
                      </span>
                    )}
                    {isPending && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                        Terkunci
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-bold text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400" />
                      Daftar: {new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Hash size={11} className="text-gray-400" />
                      ID: {u.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions (Reset Password & Role Selector) */}
              <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                <button
                  onClick={() => {
                    setResetModalUser(u);
                    setCustomPassword('UGM123456');
                    setResetResult(null);
                    setResetMode('default');
                  }}
                  className="h-9 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs active:scale-95"
                  title="Reset Password Pengguna"
                >
                  <KeyRound size={13} className="text-amber-700" />
                  <span>Reset Password</span>
                </button>

                <div className="relative w-[180px] md:w-[210px]">
                  <select 
                    value={u.role} 
                    disabled={savingId === u.id}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className={`h-9 w-full appearance-none font-bold pl-3 pr-8 rounded-xl border text-xs outline-none transition-all cursor-pointer shadow-2xs ${
                      isAdmin 
                        ? 'border-indigo-300 text-indigo-800 bg-indigo-50/70 hover:bg-indigo-50' 
                        : isPending 
                        ? 'border-rose-300 text-rose-800 bg-rose-50/70 hover:bg-rose-50' 
                        : 'border-emerald-300 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-50'
                    }`}
                  >
                    {availableRoles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    {savingId === u.id ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : <ChevronDown size={14} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

