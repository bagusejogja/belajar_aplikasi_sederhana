'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, Loader2, Save, UserX, UserCheck, Search, Mail, Calendar, Hash, KeyRound, Copy, Check, X, Lock, Send } from 'lucide-react';

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
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  // State Modal Reset Password
  const [resetModalUser, setResetModalUser] = useState<AppUser | null>(null);
  const [resetMode, setResetMode] = useState<'default' | 'email'>('default');
  const [customPassword, setCustomPassword] = useState('UGM123456');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const defaultRoles = [
    { value: 'ADMIN', label: '👑 Administrator', color: 'indigo' },
    { value: 'Pemroses Anggaran', label: '📊 Pemroses Anggaran', color: 'emerald' },
    { value: 'STAFF', label: '📝 Staff / Keuangan', color: 'blue' },
    { value: 'MANAGER', label: '💼 Manager', color: 'amber' },
    { value: 'VIEWER', label: '👁️ Pengamat (View Only)', color: 'gray' },
    { value: 'GUEST', label: '👤 Tamu', color: 'slate' },
    { value: 'Pending', label: '🚫 Kunci / Blokir Akun', color: 'red' },
  ];

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

      // 2. Ambil SEMUA role unik dari tabel Menu dan User (Tanpa kecuali)
      const { data: menuRoles } = await supabase.from('app_role_menus').select('role');
      
      const rawDbRoles = [
        ...(data?.map(u => u.role) || []),
        ...(menuRoles?.map(r => r.role) || [])
      ].filter(r => r && r !== 'Pending');

      // 3. Gabungkan dan bersihkan (Hanya tampilkan yang ada di Menu Akses)
      const finalRoles: any[] = [
        { value: 'ADMIN', label: '👑 Administrator', color: 'indigo' }
      ];
      
      // Ambil unik role dari DB (Menu Akses)
      const uniqueMenuRoles = Array.from(new Set(menuRoles?.map(r => r.role) || []))
        .filter(r => r && r.toUpperCase() !== 'ADMIN' && r !== 'Pending');

      uniqueMenuRoles.forEach(role => {
          finalRoles.push({ 
            value: role, 
            label: `👤 ${role}`, 
            color: 'emerald' 
          });
      });

      // Tambahkan pilihan Blokir di paling bawah
      finalRoles.push({ value: 'Pending', label: '🚫 Kunci / Blokir Akun', color: 'red' });
      
      setAvailableRoles(finalRoles);
    } catch (err: any) {
      console.error("DEBUG - Sync Error:", err.message);
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
    } catch (err: any) {
      alert("Gagal merubah akses: " + err.message);
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
    } catch (err: any) {
      setResetResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat mereset password.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyPassword = () => {
    if (resetResult?.password) {
      navigator.clipboard.writeText(resetResult.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-screen flex justify-center items-center"><Loader2 size={40} className="animate-spin text-amber-500"/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
         <div className="flex items-center gap-5">
            <div className="bg-amber-500 p-4 rounded-3xl text-white shadow-xl shadow-amber-100">
               <ShieldCheck size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen User</h2>
               <p className="text-gray-500 font-medium mt-1 text-sm italic">Atur jabatan, hak akses, dan reset password pengguna aplikasi.</p>
            </div>
         </div>
         <div className="relative w-full md:w-[350px]">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Cari email atau role..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-amber-100 transition-all font-medium text-sm"
           />
         </div>
      </div>

      {/* Grid Users */}
      <div className="grid grid-cols-1 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="bg-white p-20 rounded-[2.5rem] text-center border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold italic">User tidak ditemukan...</p>
          </div>
        ) : filteredUsers.map((u) => {
          const isPending = u.role?.toUpperCase() === 'PENDING';
          const isAdmin = u.role?.toUpperCase() === 'ADMIN';

          return (
            <div key={u.id} className={`bg-white p-6 rounded-[2rem] border transition-all hover:shadow-md flex flex-col md:flex-row items-center justify-between gap-6 ${isPending ? 'border-red-100 bg-red-50/10' : 'border-gray-50'}`}>
              
              <div className="flex items-center gap-6 flex-1 w-full">
                <div className={`p-5 rounded-2xl shrink-0 ${isPending ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                  {isPending ? <ShieldAlert size={28}/> : <UserCheck size={28} className={isAdmin ? "text-indigo-600" : "text-emerald-500"}/>}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={12} className="text-gray-400" />
                    <h3 className="text-lg font-black text-gray-900 truncate">{u.email}</h3>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      Daftar: {new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Hash size={12} />
                      ID: {u.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => {
                    setResetModalUser(u);
                    setCustomPassword('UGM123456');
                    setResetResult(null);
                    setResetMode('default');
                  }}
                  className="px-4 py-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold rounded-2xl text-xs transition-colors flex items-center gap-2 shrink-0 shadow-sm"
                  title="Reset Password Pengguna"
                >
                  <KeyRound size={16} />
                  <span>Reset Password</span>
                </button>

                <div className="relative w-full md:w-[240px]">
                  <select 
                    value={u.role} 
                    disabled={savingId === u.id}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className={`w-full appearance-none font-black p-4 pr-12 rounded-2xl border-2 outline-none transition-all cursor-pointer shadow-sm text-xs
                      ${isAdmin ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 
                        isPending ? 'border-red-500 text-red-700 bg-red-50' : 
                        'border-emerald-500 text-emerald-700 bg-emerald-50'}`}
                  >
                    {availableRoles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    {savingId === u.id ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
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

