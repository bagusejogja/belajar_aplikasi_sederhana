'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, Loader2, Save, ChevronDown, ChevronRight, 
  Eye, PlusCircle, Edit3, Trash2, CheckCircle2, Search,
  X, Check, Sparkles, FolderTree, Layers, RefreshCw, Lock,
  Folder, FolderOpen, Minus, CornerDownRight
} from 'lucide-react';
import { menuList } from '@/lib/mock-db';
import toast from 'react-hot-toast';

export default function MenusPage() {
  const [roles, setRoles] = useState<string[]>(['ADMIN', 'STAFF', 'VIEWER', 'Pemroses Anggaran', 'MANAGER']);
  const [newRole, setNewRole] = useState('');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  
  // Mapping: { "/path": { can_view: true, can_create: false, ... } }
  const [rolePermissions, setRolePermissions] = useState<Record<string, any>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Kelompokkan menu berdasarkan grup
  const groupedMenus = useMemo(() => {
    return menuList.reduce((acc: any, item) => {
      const group = item.group || 'Lainnya';
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
  }, []);

  const allGroupNames = useMemo(() => Object.keys(groupedMenus), [groupedMenus]);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, [selectedRole]);

  // Expand all groups by default on first load
  useEffect(() => {
    if (allGroupNames.length > 0 && expandedGroups.length === 0) {
      setExpandedGroups(allGroupNames);
    }
  }, [allGroupNames]);

  // If searching, auto-expand groups that have matching items
  useEffect(() => {
    if (menuSearch.trim()) {
      const matched = allGroupNames.filter(g => {
        const items = groupedMenus[g] || [];
        return items.some((m: any) => 
          m.title.toLowerCase().includes(menuSearch.toLowerCase()) ||
          m.path.toLowerCase().includes(menuSearch.toLowerCase())
        );
      });
      setExpandedGroups(matched);
    }
  }, [menuSearch, allGroupNames, groupedMenus]);

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

      // Deduplikasi Case-Insensitive
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
      menuList.forEach(m => {
        perms[m.path] = { can_view: false, can_create: false, can_edit: false, can_delete: false };
      });

      data?.forEach(item => {
        perms[item.path] = {
          can_view: true,
          can_create: item.can_create || false,
          can_edit: item.can_edit || false,
          can_delete: item.can_delete || false,
        };
      });

      setRolePermissions(perms);
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memuat permission role: ' + err.message);
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
      
      if ((field === 'can_create' || field === 'can_edit' || field === 'can_delete') && newValue === true) {
        updated.can_view = true;
      }
      
      if (field === 'can_view' && newValue === false) {
        updated.can_create = false;
        updated.can_edit = false;
        updated.can_delete = false;
      }

      return { ...prev, [path]: updated };
    });
  };

  const handleToggleGroupActive = (group: string, currentStatus: 'all' | 'some' | 'none') => {
    const groupMenuList = groupedMenus[group] || [];
    const targetVal = currentStatus !== 'all';
    
    setRolePermissions(prev => {
      const updated = { ...prev };
      groupMenuList.forEach((m: any) => {
        updated[m.path] = {
          can_view: targetVal,
          can_create: targetVal ? (prev[m.path]?.can_create || false) : false,
          can_edit: targetVal ? (prev[m.path]?.can_edit || false) : false,
          can_delete: targetVal ? (prev[m.path]?.can_delete || false) : false,
        };
      });
      return updated;
    });
  };

  const handleToggleFullGroup = (group: string) => {
    const groupMenuList = groupedMenus[group] || [];
    const isAllFull = groupMenuList.every((m: any) => {
      const p = rolePermissions[m.path];
      return p?.can_view && p?.can_create && p?.can_edit && p?.can_delete;
    });

    const targetVal = !isAllFull;
    setRolePermissions(prev => {
      const updated = { ...prev };
      groupMenuList.forEach((m: any) => {
        updated[m.path] = {
          can_view: targetVal,
          can_create: targetVal,
          can_edit: targetVal,
          can_delete: targetVal,
        };
      });
      return updated;
    });

    toast.success(targetVal ? `Akses Full diaktifkan untuk semua menu di "${group}"` : `Akses dinonaktifkan untuk "${group}"`);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const expandAll = () => setExpandedGroups(allGroupNames);
  const collapseAll = () => setExpandedGroups([]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: errorDel } = await supabase.from('app_role_menus').delete().eq('role', selectedRole);
      if (errorDel) throw errorDel;

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

      toast.success(`Hak akses untuk role "${selectedRole}" berhasil disimpan!`);
      if (selectedRole.toUpperCase() === 'ADMIN') window.location.reload();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = () => {
    const clean = newRole.trim().toUpperCase();
    if (!clean) return;
    if (!roles.includes(clean)) {
      setRoles(prev => [...prev, clean]);
    }
    setSelectedRole(clean);
    setNewRole('');
    toast.success(`Role baru "${clean}" ditambahkan.`);
  };

  // Total stats
  const totalAccessibleMenus = Object.values(rolePermissions).filter((v: any) => v.can_view).length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        
        {/* Title & Role Info */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 rounded-xl text-white shadow-xs">
            <FolderTree size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Akses & Hirarki Menu</h2>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {totalAccessibleMenus} / {menuList.length} Menu Aktif
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Kelola hak akses menu role pengguna dengan struktur pohon (tree view) bertingkat.
            </p>
          </div>
        </div>

        {/* Action Controls: View Toggle, Role Select, Add Role, Save */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('tree')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'tree' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
              title="Tampilan Pohon Berjenjang (Hierarchical Tree)"
            >
              <FolderTree size={13} />
              <span>Pohon (Tree)</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
              title="Tampilan Kartu Matriks"
            >
              <Layers size={13} />
              <span>Matriks</span>
            </button>
          </div>

          {/* Select Role */}
          <div className="relative">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isFetching || saving}
              className="h-8.5 pl-3 pr-8 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl text-xs font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors appearance-none"
            >
              {roles.map(r => (
                <option key={r} value={r}>
                  {r === 'ADMIN' ? '👑 ADMIN' : `👤 ${r}`}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
            {isFetching && <Loader2 size={12} className="animate-spin text-indigo-600 absolute right-7 top-1/2 -translate-y-1/2" />}
          </div>

          {/* Add New Role Inline */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-0.5 h-8.5">
            <input 
              type="text" 
              placeholder="Role baru..." 
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
              className="bg-transparent pl-2.5 pr-1 text-xs font-bold text-gray-800 outline-none w-24 md:w-32 placeholder:text-gray-400"
            />
            <button 
              type="button"
              onClick={handleAddRole}
              disabled={!newRole.trim()}
              className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              + Role
            </button>
          </div>

          {/* Search Menu */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="h-8.5 pl-7 pr-6 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 w-32 md:w-40 transition-all"
            />
            {menuSearch && (
              <button onClick={() => setMenuSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            disabled={saving || isFetching}
            className="h-8.5 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Simpan Hak Akses"
          >
            {saving ? <Loader2 className="animate-spin text-emerald-400" size={14} /> : <Save size={14} className="text-emerald-400" />}
            <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      {/* QUICK CONTROLS BAR & LEGEND */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs">
        <div className="flex items-center gap-2">
          <button 
            onClick={expandAll}
            className="text-[11px] font-bold text-gray-500 hover:text-indigo-600 underline cursor-pointer"
          >
            Buka Semua Cabang
          </button>
          <span className="text-gray-300">•</span>
          <button 
            onClick={collapseAll}
            className="text-[11px] font-bold text-gray-500 hover:text-indigo-600 underline cursor-pointer"
          >
            Tutup Semua Cabang
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block"/> Lihat</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"/> Tambah</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"/> Ubah</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"/> Hapus</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block"/> Full</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col justify-center items-center gap-3 bg-white rounded-3xl p-12 border border-gray-200 shadow-xs">
          <Loader2 size={36} className="animate-spin text-indigo-600"/>
          <span className="text-xs font-bold text-gray-500">Memuat hirarki menu...</span>
        </div>
      ) : viewMode === 'tree' ? (
        /* ================= TRUE HIERARCHICAL TREE VIEW ================= */
        <div className={`space-y-4 transition-opacity duration-200 ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          
          {/* Tree Root Badge */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-3 px-5 rounded-2xl shadow-sm border border-indigo-950">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm">
              👑
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">Root Role: {selectedRole}</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                  {totalAccessibleMenus} Menu Diberikan Akses
                </span>
              </div>
              <p className="text-[10px] text-indigo-200/80">Centang kotak grup untuk mengizinkan atau mencabut seluruh sub-menu dalam 1 kali klik.</p>
            </div>
          </div>

          {/* Tree Branches (Groups & Leaves) */}
          <div className="relative pl-3 md:pl-6 border-l-2 border-indigo-200/80 ml-4 md:ml-6 space-y-4">
            {Object.keys(groupedMenus).map((group, gIdx) => {
              const isExpanded = expandedGroups.includes(group);
              const groupMenuList = groupedMenus[group] || [];
              
              const filteredGroupMenus = menuSearch 
                ? groupMenuList.filter((m: any) => 
                    m.title?.toLowerCase().includes(menuSearch.toLowerCase()) || 
                    m.path?.toLowerCase().includes(menuSearch.toLowerCase())
                  )
                : groupMenuList;

              if (menuSearch && filteredGroupMenus.length === 0) return null;

              const activeInGroup = groupMenuList.filter((m: any) => rolePermissions[m.path]?.can_view).length;
              const groupStatus: 'all' | 'some' | 'none' = 
                activeInGroup === groupMenuList.length ? 'all' : (activeInGroup > 0 ? 'some' : 'none');
              
              const isAllFullGroup = groupMenuList.every((m: any) => {
                const p = rolePermissions[m.path];
                return p?.can_view && p?.can_create && p?.can_edit && p?.can_delete;
              });

              return (
                <div key={group} className="relative group/branch">
                  
                  {/* Branch Horizontal Connector Line from vertical rail */}
                  <div className="absolute -left-3 md:-left-6 top-5 w-3 md:w-6 h-[2px] bg-indigo-200/80 pointer-events-none" />

                  {/* Group Node Card */}
                  <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden transition-all">
                    
                    {/* Node Header */}
                    <div 
                      className="flex items-center justify-between p-3 px-4 hover:bg-gray-50/70 transition-colors cursor-pointer border-b border-gray-100 select-none"
                      onClick={() => toggleGroup(group)}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Expand/Collapse Chevron */}
                        <div className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-lg">
                          {isExpanded ? <ChevronDown size={16} className="text-indigo-600" /> : <ChevronRight size={16} />}
                        </div>

                        {/* Tri-state Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleGroupActive(group, groupStatus);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                            groupStatus === 'all'
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : groupStatus === 'some'
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-white border-gray-300 hover:border-indigo-400'
                          }`}
                          title={groupStatus === 'all' ? 'Cabut semua akses di grup ini' : 'Beri akses semua menu di grup ini'}
                        >
                          {groupStatus === 'all' && <Check size={13} strokeWidth={3} />}
                          {groupStatus === 'some' && <Minus size={13} strokeWidth={3} />}
                        </button>

                        {/* Folder Icon */}
                        <div className="text-indigo-600">
                          {isExpanded ? <FolderOpen size={17} /> : <Folder size={17} />}
                        </div>

                        {/* Group Label */}
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-black text-gray-900 text-xs tracking-tight truncate">{group}</span>
                          <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.2 rounded-full font-bold border border-gray-200">
                            {groupMenuList.length} Menu
                          </span>
                          <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${activeInGroup > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                            {activeInGroup} Aktif
                          </span>
                        </div>
                      </div>

                      {/* Group Quick Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          type="button"
                          onClick={() => handleToggleFullGroup(group)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all border flex items-center gap-1 shadow-2xs cursor-pointer ${
                            isAllFullGroup
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white'
                          }`}
                          title="Nyalakan / Matikan Semua CRUD grup ini"
                        >
                          <Sparkles size={11} />
                          <span>{isAllFullGroup ? 'Matikan Full' : '⚡ Full CRUD'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Child Menu Tree Leaves */}
                    {isExpanded && (
                      <div className="p-3 px-4 bg-gray-50/30 space-y-1.5 border-t border-gray-50">
                        {filteredGroupMenus.map((menu: any, mIdx: number) => {
                          const perms = rolePermissions[menu.path] || { can_view: false, can_create: false, can_edit: false, can_delete: false };
                          const isFull = perms.can_view && perms.can_create && perms.can_edit && perms.can_delete;

                          return (
                            <div 
                              key={menu.path} 
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 px-3 rounded-xl transition-all border ${
                                perms.can_view 
                                  ? 'bg-white border-indigo-100 shadow-2xs hover:border-indigo-200' 
                                  : 'bg-white/60 border-gray-200/60 opacity-70 hover:opacity-100'
                              }`}
                            >
                              {/* Left: Branch elbow & Menu info */}
                              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                                <CornerDownRight size={14} className="text-indigo-400 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${perms.can_view ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                                    <p className="text-xs font-bold text-gray-900 truncate">{menu.title}</p>
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-mono truncate pl-3.5">{menu.path}</p>
                                </div>
                              </div>

                              {/* Right: Permission Toggles */}
                              <div className="flex items-center gap-1.5 justify-end mt-2 sm:mt-0 shrink-0">
                                <PermissionToggle 
                                  active={perms.can_view} 
                                  onClick={() => togglePermission(menu.path, 'can_view')} 
                                  icon={<Eye size={12}/>} 
                                  title="Lihat"
                                  color="indigo" 
                                />
                                <PermissionToggle 
                                  active={perms.can_create} 
                                  onClick={() => togglePermission(menu.path, 'can_create')} 
                                  icon={<PlusCircle size={12}/>} 
                                  title="Tambah"
                                  color="emerald" 
                                />
                                <PermissionToggle 
                                  active={perms.can_edit} 
                                  onClick={() => togglePermission(menu.path, 'can_edit')} 
                                  icon={<Edit3 size={12}/>} 
                                  title="Ubah"
                                  color="amber" 
                                />
                                <PermissionToggle 
                                  active={perms.can_delete} 
                                  onClick={() => togglePermission(menu.path, 'can_delete')} 
                                  icon={<Trash2 size={12}/>} 
                                  title="Hapus"
                                  color="rose" 
                                />
                                
                                <button 
                                  type="button"
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
                                  className={`h-7 px-2 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer active:scale-95 ${
                                    isFull 
                                      ? 'bg-purple-600 border-purple-600 text-white shadow-2xs' 
                                      : 'bg-white border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-300'
                                  }`}
                                  title="Toggle Full Akses untuk Menu Ini"
                                >
                                  <Check size={11} strokeWidth={3} />
                                  <span>Full</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ================= GRID / MATRIX VIEW ================= */
        <div className={`space-y-3 transition-opacity duration-200 ${isFetching ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {Object.keys(groupedMenus).map(group => {
            const isExpanded = expandedGroups.includes(group);
            const groupMenuList = groupedMenus[group] || [];
            
            // Filter by search query if any
            const filteredGroupMenus = menuSearch 
              ? groupMenuList.filter((m: any) => 
                  m.title?.toLowerCase().includes(menuSearch.toLowerCase()) || 
                  m.path?.toLowerCase().includes(menuSearch.toLowerCase())
                )
              : groupMenuList;

            if (menuSearch && filteredGroupMenus.length === 0) return null;

            const activeInGroup = groupMenuList.filter((m: any) => rolePermissions[m.path]?.can_view).length;
            const isAllFullGroup = groupMenuList.every((m: any) => {
              const p = rolePermissions[m.path];
              return p?.can_view && p?.can_create && p?.can_edit && p?.can_delete;
            });

            return (
              <div key={group} className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden transition-all">
                
                {/* Accordion Header */}
                <div 
                  className="w-full flex items-center justify-between p-3.5 px-5 hover:bg-gray-50/70 transition-colors cursor-pointer border-b border-gray-100"
                  onClick={() => toggleGroup(group)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-400 hover:text-indigo-600 transition-colors">
                      {isExpanded ? <ChevronDown size={18} className="text-indigo-600" /> : <ChevronRight size={18} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 text-xs tracking-tight">{group}</span>
                      <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.2 rounded-full font-bold border border-gray-200">
                        {groupMenuList.length} Menu
                      </span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold border ${activeInGroup > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                        {activeInGroup} Aktif
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button"
                      onClick={() => handleToggleFullGroup(group)}
                      className={`text-[10px] font-bold px-3 py-1 rounded-xl transition-all border flex items-center gap-1 shadow-2xs ${
                        isAllFullGroup
                          ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white'
                      }`}
                      title="Nyalakan / Matikan Semua CRUD grup ini"
                    >
                      <Sparkles size={11} />
                      <span>{isAllFullGroup ? 'Matikan Full' : '⚡ Full CRUD'}</span>
                    </button>
                  </div>
                </div>

                {/* Accordion Content Table */}
                {isExpanded && (
                  <div className="p-3 px-5 space-y-1">
                    {/* Header Columns */}
                    <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <div className="col-span-12 md:col-span-6">Menu & Path</div>
                      <div className="col-span-12 md:col-span-6 grid grid-cols-5 text-center items-center">
                        <div className="text-indigo-600">Lihat</div>
                        <div className="text-emerald-600">Tambah</div>
                        <div className="text-amber-600">Ubah</div>
                        <div className="text-rose-600">Hapus</div>
                        <div className="text-purple-600">Full</div>
                      </div>
                    </div>

                    {/* Menu Rows */}
                    {filteredGroupMenus.map((menu: any) => {
                      const perms = rolePermissions[menu.path] || { can_view: false, can_create: false, can_edit: false, can_delete: false };
                      const isFull = perms.can_view && perms.can_create && perms.can_edit && perms.can_delete;

                      return (
                        <div 
                          key={menu.path} 
                          className={`grid grid-cols-12 items-center p-2.5 px-3 rounded-xl transition-all group ${
                            perms.can_view ? 'hover:bg-indigo-50/40 bg-white' : 'hover:bg-gray-50 bg-gray-50/40 opacity-75'
                          }`}
                        >
                          {/* Menu Details */}
                          <div className="col-span-12 md:col-span-6 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${perms.can_view ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                              <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-600 truncate">{menu.title}</p>
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono truncate pl-3.5">{menu.path}</p>
                          </div>

                          {/* Permission Toggles */}
                          <div className="col-span-12 md:col-span-6 grid grid-cols-5 gap-1.5 items-center justify-items-center mt-2 md:mt-0">
                            <PermissionToggle 
                              active={perms.can_view} 
                              onClick={() => togglePermission(menu.path, 'can_view')} 
                              icon={<Eye size={13}/>} 
                              title="Hak Akses Lihat"
                              color="indigo" 
                            />
                            <PermissionToggle 
                              active={perms.can_create} 
                              onClick={() => togglePermission(menu.path, 'can_create')} 
                              icon={<PlusCircle size={13}/>} 
                              title="Hak Akses Tambah"
                              color="emerald" 
                            />
                            <PermissionToggle 
                              active={perms.can_edit} 
                              onClick={() => togglePermission(menu.path, 'can_edit')} 
                              icon={<Edit3 size={13}/>} 
                              title="Hak Akses Ubah"
                              color="amber" 
                            />
                            <PermissionToggle 
                              active={perms.can_delete} 
                              onClick={() => togglePermission(menu.path, 'can_delete')} 
                              icon={<Trash2 size={13}/>} 
                              title="Hak Akses Hapus"
                              color="rose" 
                            />
                            
                            {/* Toggle Full Row */}
                            <button 
                              type="button"
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
                              className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center border shadow-2xs active:scale-90 ${
                                isFull 
                                  ? 'bg-purple-600 border-purple-600 text-white shadow-purple-100' 
                                  : 'bg-white border-gray-200 text-gray-300 hover:border-purple-300 hover:text-purple-600'
                              }`}
                              title="Toggle Full Akses untuk Menu Ini"
                            >
                              <Check size={14} strokeWidth={3} />
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

function PermissionToggle({ active, onClick, icon, color, title }: any) {
  const colorClasses: any = {
    indigo: active ? 'bg-indigo-600 text-white shadow-indigo-100 border-indigo-600' : 'bg-gray-100/80 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 border-gray-200/80',
    emerald: active ? 'bg-emerald-600 text-white shadow-emerald-100 border-emerald-600' : 'bg-gray-100/80 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 border-gray-200/80',
    amber: active ? 'bg-amber-500 text-white shadow-amber-100 border-amber-500' : 'bg-gray-100/80 text-gray-400 hover:bg-amber-50 hover:text-amber-600 border-gray-200/80',
    rose: active ? 'bg-rose-600 text-white shadow-rose-100 border-rose-600' : 'bg-gray-100/80 text-gray-400 hover:bg-rose-50 hover:text-rose-600 border-gray-200/80',
  };

  return (
    <button 
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all flex items-center justify-center border shadow-2xs active:scale-90 cursor-pointer ${colorClasses[color]}`}
    >
      {active ? <Check size={13} strokeWidth={3} /> : icon}
    </button>
  );
}

