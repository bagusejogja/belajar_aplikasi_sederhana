'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, Loader2, Save, ChevronDown, ChevronRight, 
  Eye, PlusCircle, Edit3, Trash2, CheckCircle2, Circle
} from 'lucide-react';
import { menuList } from '@/lib/mock-db';
import toast from 'react-hot-toast';

export default function MenusPage() {
  const [roles, setRoles] = useState<string[]>(['ADMIN', 'STAFF', 'VIEWER', 'Pemroses Anggaran', 'MANAGER']);
  const [newRole, setNewRole] = useState('');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [loading, setLoading] = useState(true); // Untuk first load
  const [isFetching, setIsFetching] = useState(false); // Untuk perpindahan antar role
  const [saving, setSaving] = useState(false);
  
  // Mapping: { "/path": { can_view: true, can_create: false, ... } }
  const [rolePermissions, setRolePermissions] = useState<Record<string, any>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Kelompokkan menu berdasarkan grup
  const groupedMenus = menuList.reduce((acc: any, item) => {
    const group = item.group || 'Lainnya';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [selectedRole]);

  const fetchRolesAndPermissions = async () => {
    if (Object.keys(rolePermissions).length === 0) setLoading(true);
    else setIsFetching(true);
    
    try {
      // 1. Ambil semua role unik dari tabel app_users dan app_role_menus
      const { data: userRoles } = await supabase.from('app_users').select('role');
      const { data: menuRoles } = await supabase.from('app_role_menus').select('role');
      
      const rawRoles = [
        'ADMIN', 'STAFF', 'VIEWER', 'Pemroses Anggaran', 'MANAGER',
        selectedRole,
        ...(userRoles?.map(r => r.role) || []),
        ...(menuRoles?.map(r => r.role) || [])
      ].filter(r => r && r !== 'Pending');

      // Deduplikasi Case-Insensitive (Ambil yang Huruf Besar jika ada bentrok)
      const roleMap = new Map();
      rawRoles.forEach(r => {
        const upper = r.toUpperCase();
        if (!roleMap.has(upper) || r === upper) {
          roleMap.set(upper, r);
        }
      });

      setRoles(Array.from(roleMap.values()));
      
      // 2. Ambil permission untuk role yang sedang dipilih
      const { data, error } = await supabase
        .from('app_role_menus')
        .select('*')
        .eq('role', selectedRole);
      
      if (error) throw error;
      
      const perms: Record<string, any> = {};
      // Inisialisasi semua menu dengan false
      menuList.forEach(m => {
        perms[m.path] = { can_view: false, can_create: false, can_edit: false, can_delete: false };
      });

      // Isi dengan data dari DB
      data?.forEach(item => {
        perms[item.path] = {
          can_view: true, // Jika ada di tabel, berarti can_view true
          can_create: item.can_create || false,
          can_edit: item.can_edit || false,
          can_delete: item.can_delete || false,
        };
      });

      setRolePermissions(perms);
      setRolePermissions(perms);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const togglePermission = (path: string, field: string) => {
    setRolePermissions(prev => {
      const current = prev[path] || { can_view: false, can_create: false, can_edit: false, can_delete: false };
      const newValue = !current[field];
      
      let updated = { ...current, [field]: newValue };
      
      // Logika otomatis: Jika C/U/D dicentang, maka View HARUS otomatis centang
      if ((field === 'can_create' || field === 'can_edit' || field === 'can_delete') && newValue === true) {
        updated.can_view = true;
      }
      
      // Jika View di-uncheck, maka C/U/D HARUS ikut mati
      if (field === 'can_view' && newValue === false) {
        updated.can_create = false;
        updated.can_edit = false;
        updated.can_delete = false;
      }

      return { ...prev, [path]: updated };
    });
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleToggleFullGroup = (groupName: string) => {
    const groupMenus = groupedMenus[groupName];
    const paths = groupMenus.map((m: any) => m.path);
    
    // Cek apakah semua sudah full CRUD
    const allFull = paths.every((p: string) => 
      rolePermissions[p]?.can_view && 
      rolePermissions[p]?.can_create && 
      rolePermissions[p]?.can_edit && 
      rolePermissions[p]?.can_delete
    );

    setRolePermissions(prev => {
      const next = { ...prev };
      paths.forEach((p: string) => {
        next[p] = {
          can_view: !allFull,
          can_create: !allFull,
          can_edit: !allFull,
          can_delete: !allFull,
        };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Hapus semua data untuk role ini
      const { error: errorDel } = await supabase.from('app_role_menus').delete().eq('role', selectedRole);
      if (errorDel) throw errorDel;

      // 2. Siapkan data baru (hanya yang can_view = true)
      const inserts = Object.entries(rolePermissions)
        .filter(([_, val]: any) => val.can_view)
        .map(([path, val]: any) => ({
          role: selectedRole,
          path,
          can_create: val.can_create,
          can_edit: val.can_edit,
          can_delete: val.can_delete
        }));

      if (inserts.length > 0) {
        const { error: errorIns } = await supabase.from('app_role_menus').insert(inserts);
        if (errorIns) throw errorIns;
      }

      toast.success(`Akses untuk ${selectedRole} berhasil diperbarui!`);
      if (selectedRole === 'Admin') window.location.reload();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4">
      {/* Header Baru: Elegan, Rapi, & Seimbang */}
      <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-indigo-100/30 border border-gray-100 flex flex-col xl:flex-row items-center gap-4">
        {/* Ikon & Judul Ringkas */}
        <div className="flex items-center gap-4 px-4 shrink-0">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tighter whitespace-nowrap">Akses</h2>
        </div>

        {/* Action Bar Utama (Satu Baris Panjang) */}
        <div className="flex-1 flex items-center bg-gray-50/80 rounded-2xl border border-gray-100 h-14 w-full overflow-hidden">
          {/* Pilih Jabatan */}
          <div className="px-6 flex items-center gap-3 border-r border-gray-200 shrink-0 h-full relative">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Aktor</span>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isFetching || saving}
              className="bg-transparent text-sm font-black text-indigo-900 outline-none cursor-pointer min-w-[120px] disabled:opacity-50"
            >
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {isFetching && <Loader2 size={14} className="animate-spin text-indigo-500 absolute right-2" />}
          </div>

          {/* Input Jabatan Baru (LEBAR) */}
          <div className="flex-1 h-full flex items-center group">
            <input 
              type="text" 
              placeholder="Ketik jabatan baru di sini..." 
              defaultValue={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="bg-transparent px-6 py-2 text-sm font-bold text-gray-900 outline-none w-full placeholder:text-gray-300"
              autoComplete="off"
            />
          </div>

          {/* Tombol Tambah (RINGKAS) */}
          <button 
            type="button"
            onClick={() => {
              if (!newRole) return;
              if (!roles.includes(newRole)) setRoles([...roles, newRole]);
              setSelectedRole(newRole);
              setNewRole('');
              const el = document.querySelector('input[placeholder*="Ketik jabatan baru"]') as HTMLInputElement;
              if (el) el.value = '';
            }}
            className="h-full px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border-l border-indigo-500 shadow-inner"
          >
            + TAMBAH
          </button>
        </div>

        {/* Tombol Simpan (Hanya Ikon - Ringkas) */}
        <button 
          onClick={handleSave}
          disabled={saving}
          title="Simpan Hak Akses"
          className="shrink-0 w-14 h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 border-4 border-white"
        >
          {saving ? <Loader2 className="animate-spin text-emerald-400" size={24} /> : <Save size={24} className="text-emerald-400" />}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex justify-center items-center"><Loader2 size={40} className="animate-spin text-indigo-600"/></div>
      ) : (
        <div className={`space-y-4 transition-all duration-300 ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {Object.keys(groupedMenus).map(group => {
            const isExpanded = expandedGroups.includes(group);
            return (
              <div key={group} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                {/* Accordion Header */}
                <div className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 transition-all">
                  <div className="flex items-center gap-3" onClick={() => toggleGroup(group)}>
                    {isExpanded ? <ChevronDown className="text-indigo-600" /> : <ChevronRight className="text-gray-400" />}
                    <span className="font-black text-gray-800 uppercase tracking-widest text-xs">{group}</span>
                    <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{groupedMenus[group].length} Menu</span>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFullGroup(group);
                    }}
                    className="text-[9px] font-black px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 uppercase tracking-tighter"
                  >
                    ⚡ Aktifkan Semua CRUD
                  </button>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 space-y-2">
                    <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 bg-gray-50/50">
                      <div className="col-span-5">Nama Menu</div>
                      <div className="col-span-7 grid grid-cols-5 text-center items-center">
                        <div>Lihat</div>
                        <div>Tambah</div>
                        <div>Ubah</div>
                        <div>Hapus</div>
                        <div className="text-indigo-600">Full</div>
                      </div>
                    </div>
                    {groupedMenus[group].map((menu: any) => {
                      const perms = rolePermissions[menu.path] || { can_view: false, can_create: false, can_edit: false, can_delete: false };
                      const isFull = perms.can_view && perms.can_create && perms.can_edit && perms.can_delete;

                      return (
                        <div key={menu.path} className="grid grid-cols-12 items-center p-3 hover:bg-indigo-50/20 rounded-2xl transition-all group">
                          <div className="col-span-5">
                            <p className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 truncate">{menu.title}</p>
                            <p className="text-[9px] text-gray-400 font-mono italic truncate">{menu.path}</p>
                          </div>
                          <div className="col-span-7 grid grid-cols-5 gap-2 items-center">
                            <PermissionToggle active={perms.can_view} onClick={() => togglePermission(menu.path, 'can_view')} icon={<Eye size={14}/>} color="indigo" />
                            <PermissionToggle active={perms.can_create} onClick={() => togglePermission(menu.path, 'can_create')} icon={<PlusCircle size={14}/>} color="emerald" />
                            <PermissionToggle active={perms.can_edit} onClick={() => togglePermission(menu.path, 'can_edit')} icon={<Edit3 size={14}/>} color="amber" />
                            <PermissionToggle active={perms.can_delete} onClick={() => togglePermission(menu.path, 'can_delete')} icon={<Trash2 size={14}/>} color="red" />
                            
                            {/* Toggle Full per Baris */}
                            <button 
                              onClick={() => {
                                setRolePermissions(prev => ({
                                  ...prev,
                                  [menu.path]: {
                                    can_view: !isFull,
                                    can_create: !isFull,
                                    can_edit: !isFull,
                                    can_delete: !isFull
                                  }
                                }));
                              }}
                              className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2 ${isFull ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-300 hover:border-indigo-200'}`}
                              title="Toggle Full Akses Baris Ini"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PermissionToggle({ active, onClick, icon, color }: any) {
  const colorClasses: any = {
    indigo: active ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-50 text-gray-300 hover:bg-indigo-50',
    emerald: active ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-gray-50 text-gray-300 hover:bg-emerald-50',
    amber: active ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-gray-50 text-gray-300 hover:bg-amber-50',
    red: active ? 'bg-red-500 text-white shadow-red-100' : 'bg-gray-50 text-gray-300 hover:bg-red-50',
  };

  return (
    <button 
      onClick={onClick}
      className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-75 ${colorClasses[color]}`}
    >
      {active ? <CheckCircle2 size={18} /> : icon}
    </button>
  );
}
