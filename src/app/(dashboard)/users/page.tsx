'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, Loader2, Save, UserX, UserCheck, Search, Mail, Calendar, Hash } from 'lucide-react';

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

  const roles = [
    { value: 'Admin', label: '👑 Administrator', color: 'indigo' },
    { value: 'Pemroses Anggaran', label: '📊 Pemroses Anggaran', color: 'emerald' },
    { value: 'Staff', label: '📝 Staff / Keuangan', color: 'blue' },
    { value: 'Viewer', label: '👁️ Pengamat (View Only)', color: 'gray' },
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
    } catch (err: any) {
      console.error("Gagal menarik data user:", err.message);
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
               <p className="text-gray-500 font-medium mt-1 text-sm italic">Atur jabatan dan hak akses untuk setiap pengguna aplikasi.</p>
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
          const currentRole = roles.find(r => r.value === u.role) || roles[3];
          const isPending = u.role === 'Pending';
          const isAdmin = u.role === 'Admin';

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

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-[280px]">
                  <select 
                    value={u.role} 
                    disabled={savingId === u.id}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className={`w-full appearance-none font-black p-4 pr-12 rounded-2xl border-2 outline-none transition-all cursor-pointer shadow-sm
                      ${isAdmin ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 
                        isPending ? 'border-red-500 text-red-700 bg-red-50' : 
                        'border-emerald-500 text-emerald-700 bg-emerald-50'}`}
                  >
                    {roles.map(r => (
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
    </div>
  );
}
