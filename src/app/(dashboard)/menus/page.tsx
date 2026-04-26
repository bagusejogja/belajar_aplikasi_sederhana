'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Loader2, Save } from 'lucide-react';
import { menuList } from '@/lib/mock-db';

interface RoleMenu {
  id?: string;
  role: string;
  path: string;
}

export default function MenusPage() {
  const roles = ['Admin', 'Staff', 'Viewer', 'Pemroses Anggaran'];
  const [roleMenus, setRoleMenus] = useState<RoleMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Menyimpan perubahan lokal (dicentang / dicabut)
  const [selectedMapping, setSelectedMapping] = useState<{ [role: string]: string[] }>({});

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('app_role_menus').select('*');
      if (error) throw error;
      
      const mappingTable = data || [];
      setRoleMenus(mappingTable);
      
      // Mengubah format array Supabase menjadi key-value local (role -> path[])
      const mappedConfig: { [key: string]: string[] } = { 'Admin': [], 'Staff': [], 'Viewer': [], 'Pemroses Anggaran': [] };
      mappingTable.forEach((item) => {
         if (mappedConfig[item.role]) {
             mappedConfig[item.role].push(item.path);
         }
      });
      setSelectedMapping(mappedConfig);
    } catch (err: any) {
      console.error(err);
      // alert("Anda belum membuat Tabel 'app_role_menus' di Supabase SQL Editor.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role: string, path: string) => {
     setSelectedMapping(prev => {
        const currentPaths = prev[role] || [];
        const isChecked = currentPaths.includes(path);
        return {
           ...prev,
           [role]: isChecked 
              ? currentPaths.filter(p => p !== path) 
              : [...currentPaths, path]
        };
     });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
       // Hapus seluruh konfigurasi di Supabase, lalu Insert Ulang yang baru (Metode paling bersih)
       const { error: errorDel } = await supabase.from('app_role_menus').delete().neq('role', 'Pending');
       if (errorDel) throw errorDel;

       // Siapkan tumpukan insert baru
       const inserts: { role: string, path: string }[] = [];
       
       Object.keys(selectedMapping).forEach(role => {
          selectedMapping[role].forEach(path => {
             inserts.push({ role, path });
          });
       });

       const { error: errorIns } = await supabase.from('app_role_menus').insert(inserts);
       if (errorIns) throw errorIns;

       alert("Hak Menu Akses berhasil diperbarui secara Permanen! 🔐");
       
    } catch (err: any) {
       alert("Gagal menyimpan. Pastikan tabel SQL app_role_menus sudah dibuat.");
    } finally {
       setSaving(false);
    }
  };

  if (loading) {
     return <div className="h-64 flex justify-center items-center"><Loader2 size={40} className="animate-spin text-indigo-600"/></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
         <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
               <ShieldCheck size={28} />
            </div>
            <div>
               <h2 className="text-2xl font-black text-gray-900">Manajemen Akses Menu Pangkat</h2>
               <p className="text-sm font-medium text-gray-500 mt-1">Centang/Cabut Menu Pintu Masuk untuk masing-masing Jabatan (Role).</p>
            </div>
         </div>
         <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg disabled:opacity-50">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} SIMPAN PENGATURAN
         </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 text-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left font-medium border-collapse">
               <thead>
                  <tr>
                     <th className="p-4 bg-gray-50 border border-gray-100 text-gray-500 rounded-tl-2xl w-1/4">NAMA MENU SIDEBAR</th>
                     {roles.map(r => (
                        <th key={r} className="p-4 bg-gray-50 border border-gray-100 text-center uppercase tracking-widest text-indigo-800 font-black">{r}</th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {menuList.map((menu) => (
                     <tr key={menu.path} className="hover:bg-indigo-50/10 transition-colors">
                        <td className="p-4 border border-gray-100 font-black text-gray-700">{menu.title}</td>
                        {roles.map(role => {
                           const isChecked = selectedMapping[role]?.includes(menu.path);
                           return (
                              <td key={`${role}-${menu.path}`} className="p-4 border border-gray-100 text-center">
                                 <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => handleToggle(role, menu.path)}
                                    // Pengecualian: Admin minimal WAJIB punya menu ini, tidak bisa di-uncheck 
                                    disabled={role === 'Admin' && menu.path === '/menus'} 
                                    className="w-6 h-6 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                 />
                              </td>
                           );
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
