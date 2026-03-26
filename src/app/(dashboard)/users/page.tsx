'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ShieldAlert, Loader2, Save, UserX, UserCheck } from 'lucide-react';

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

      // Update state lokaly
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert("Gagal merubah akses: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
         <div className="flex items-center gap-4">
            <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-amber-100">
               <ShieldCheck size={28} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-gray-900">Manajemen Akses User</h2>
               <p className="text-sm font-medium text-gray-500 mt-1">Atur jabatan dan kunci masuk pengguna terdaftar.</p>
            </div>
         </div>
         <button onClick={fetchUsers} className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold text-sm transition-colors">
            🔄 Refresh Data
         </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-amber-500">
           <Loader2 size={40} className="animate-spin mb-4" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                 <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                    <tr>
                       <th className="p-4 w-10">Status</th>
                       <th className="p-4 w-1/3">Alamat Email</th>
                       <th className="p-4">Tanggal Daftar</th>
                       <th className="p-4 text-center border-l border-gray-100 bg-amber-50/30">Jabatan & Akses</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                       <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">Belum ada user yang daftar di aplikasi ini.</td></tr>
                    ) : users.map((u) => {
                       const isPending = u.role === 'Pending';
                       const isAdmin = u.role === 'Admin';
                       
                       return (
                          <tr key={u.id} className={`transition-colors group hover:bg-gray-50 ${isPending ? 'bg-red-50/50' : ''}`}>
                             <td className="p-4 text-center">
                                {isPending ? <ShieldAlert size={20} className="text-red-500 mx-auto animate-pulse"/> : <UserCheck size={20} className="text-emerald-500 mx-auto"/>}
                             </td>
                             <td className="p-4">
                                <p className="font-bold text-gray-900 text-base">{u.email}</p>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[150px]">{u.id}</p>
                             </td>
                             <td className="p-4 font-medium text-gray-600">
                                {new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                             </td>
                             <td className="p-4 text-center border-l border-gray-100 bg-amber-50/10">
                                <div className="flex items-center justify-center gap-2">
                                   <select 
                                      value={u.role} 
                                      disabled={savingId === u.id}
                                      onChange={(e) => updateRole(u.id, e.target.value)}
                                      className={`font-bold p-3 rounded-xl border-2 outline-none transition-all cursor-pointer whitespace-nowrap min-w-[200px] text-center shadow-sm disabled:opacity-50
                                         ${isAdmin ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 
                                           isPending ? 'border-red-500 text-red-700 bg-red-50' : 
                                           'border-emerald-500 text-emerald-700 bg-emerald-50'}`}
                                   >
                                      <option value="Admin">👑 Administrator (Akses Penuh)</option>
                                      <option value="Staff">📝 Staff / Keuangan (Input & Laporan)</option>
                                      <option value="Viewer">👁️ Pengamat (Hanya Laporan)</option>
                                      <option value="Pending">🚫 Kunci / Blokir Akun</option>
                                   </select>
                                   
                                   {savingId === u.id && <Loader2 size={18} className="animate-spin text-amber-500" />}
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
    </div>
  );
}
