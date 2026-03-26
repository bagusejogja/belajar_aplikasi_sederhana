'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, MoreHorizontal, Mail, Shield, Building2, 
  CheckCircle2, Pencil, Trash2, Filter, Save, X, Loader2, AlertTriangle
} from 'lucide-react';
import { mockUsers, mockUnits } from '@/lib/mock-db';
import { User, Role, Unit } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const roleColor: Record<Role, string> = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  MANAGER: 'bg-blue-100 text-blue-700 border-blue-200',
  STAFF: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  GUEST: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(!isSupabaseConfigured);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '', email: '', role: 'STAFF', unitId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      // Jika Supabase belum dikonfigurasi, pakai data bohong
      setUsers(mockUsers);
      setUnits(mockUnits);
      setIsUsingMock(true);
      setLoading(false);
      return;
    }

    try {
      // Ambil Users
      const { data: usersData, error: usersError } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (usersError) throw usersError;
      
      // Ambil Units
      const { data: unitsData, error: unitsError } = await supabase.from('units').select('*');
      if (unitsError) throw unitsError;

      if (usersData) setUsers(usersData);
      if (unitsData) setUnits(unitsData);
      setIsUsingMock(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback ke mock jika error (misal tabel belum dibuat)
      setUsers(mockUsers);
      setUnits(mockUnits);
      setIsUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email || !formData.role || !formData.unitId) {
       alert("Harap lengkapi semua field!");
       return;
    }

    setIsSaving(true);
    try {
      if (!isUsingMock) {
         // Simpan ke Supabase asli
         const { error } = await supabase.from('users').insert([
           { 
             name: formData.name, 
             email: formData.email, 
             role: formData.role, 
             unit_id: formData.unitId 
           }
         ]);
         
         if (error) throw error;
         alert('Berhasil menyimpan user ke sistem online!');
         fetchData(); // Refresh data
      } else {
         // Simulasi simpan lokal jika belum pakai DB asli
         const newUser: User = {
           id: 'u' + Math.random().toString(36).substr(2, 9),
           name: formData.name,
           email: formData.email,
           role: formData.role as Role,
           unitId: formData.unitId
         };
         setUsers(prev => [newUser, ...prev]);
         alert('Tersimpan secara lokal (Mode Mock). Supabase belum aktif.');
      }
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'STAFF', unitId: '' }); // Reset form
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getUnitName = (id: string) => {
    const unit = units.find(u => u.id === id || (u as any).unit_id === id); // Handle ID UUID length
    return unit ? unit.name : 'N/A';
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="space-y-6">
      {/* Alert Mode Bohongan */}
      {isUsingMock && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
            <div>
               <h3 className="font-bold text-sm">Mode Data Simulasi Aktif (Belum Online)</h3>
               <p className="text-xs mt-1 text-amber-700/80">Anda saat ini melihat data bohong. Buka file <b>.env</b> dan isikan <b>NEXT_PUBLIC_SUPABASE_URL</b> & <b>ANON_KEY</b> lalu jalankan SQL untuk beralih ke Database Supabase.</p>
            </div>
         </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-gray-900">Total User: {users.length}</h2>
              <p className="text-gray-500 text-sm">Kelola akses, jabatan, dan unit kerja</p>
           </div>
        </div>
        
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 border border-gray-200 transition-all font-medium">
              <Filter size={18} />
              Filter
           </button>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold">
              <UserPlus size={18} />
              Tambah User
           </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Informasi User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan (Role)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Kerja</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {users.map((user) => (
                 <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 shrink-0 border border-indigo-100">
                             {user.name.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                             <p className="font-bold text-gray-900 truncate tracking-tight">{user.name}</p>
                             <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                                <Mail size={12} />
                                <span className="truncate">{user.email}</span>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${roleColor[user.role as Role] || roleColor.GUEST}`}>
                          <Shield size={12} />
                          {user.role}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                          <Building2 size={16} className="text-gray-400" />
                          {getUnitName(user.unitId || (user as any).unit_id)}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm">
                          <CheckCircle2 size={16} />
                          Aktif
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User">
                             <Pencil size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                             <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                             <MoreHorizontal size={18} />
                          </button>
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="text-center py-10 text-gray-500">Belum ada data user.</div>}
        </div>
      </div>

      {/* Modal Tambah User */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <UserPlus size={20} className="text-indigo-600" />
                     {isUsingMock ? 'Tambah User (Mock)' : 'Tambah User ke Database'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all">
                     <X size={20} />
                  </button>
               </div>

               <div className="p-6 space-y-5">
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                     <input type="text" name="name" value={formData.name} onChange={handleInputChange} autoFocus className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="Cth: Budi Santoso" />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                     <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-medium" placeholder="Cth: budi@masjid.id" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jabatan (Role)</label>
                        <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white text-sm font-medium cursor-pointer">
                           <option value="STAFF">STAFF (Viewer/Submit)</option>
                           <option value="MANAGER">MANAGER (Reviewer)</option>
                           <option value="ADMIN">ADMIN (Full Access)</option>
                           <option value="GUEST">GUEST (Read Only)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unit Kerja</label>
                        <select name="unitId" value={formData.unitId} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white text-sm font-medium cursor-pointer">
                           <option value="">-- Pilih Unit --</option>
                           {units.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                           ))}
                        </select>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all">Batal</button>
                  <button onClick={handleSaveUser} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-70 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                     {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                     Simpan Data
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
