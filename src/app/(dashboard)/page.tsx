'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, ShieldCheck, FileText, BarChart3, 
  ArrowRight, Clock, Users, ArrowUpRight,
  LayoutDashboard, TrendingUp, Search, Bell,
  Calendar, Landmark, Wallet, Mail, FolderTree,
  Building2, PieChart, Database, FileEdit, CheckCircle,
  Layers, Lock, ExternalLink, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { menuList } from '@/lib/mock-db';

const groupMeta: Record<string, { icon: any; gradient: string; text: string; bg: string; border: string }> = {
  'Utama': { 
    icon: Sparkles, 
    gradient: 'from-blue-600 to-indigo-600', 
    text: 'text-indigo-600', 
    bg: 'bg-indigo-50/50', 
    border: 'border-indigo-200' 
  },
  'Manajemen Kegiatan': { 
    icon: Calendar, 
    gradient: 'from-violet-600 to-purple-700', 
    text: 'text-purple-600', 
    bg: 'bg-purple-50/50', 
    border: 'border-purple-200' 
  },
  'Dana Pemerintah': { 
    icon: Landmark, 
    gradient: 'from-emerald-600 to-teal-700', 
    text: 'text-emerald-600', 
    bg: 'bg-emerald-50/50', 
    border: 'border-emerald-200' 
  },
  'RKA': { 
    icon: FolderTree, 
    gradient: 'from-amber-500 to-orange-600', 
    text: 'text-amber-600', 
    bg: 'bg-amber-50/50', 
    border: 'border-amber-200' 
  },
  'Review Anggaran': { 
    icon: ShieldCheck, 
    gradient: 'from-sky-500 to-blue-600', 
    text: 'text-sky-600', 
    bg: 'bg-sky-50/50', 
    border: 'border-sky-200' 
  },
  'Anggaran': { 
    icon: PieChart, 
    gradient: 'from-rose-500 to-pink-600', 
    text: 'text-rose-600', 
    bg: 'bg-rose-50/50', 
    border: 'border-rose-200' 
  },
  'Penerimaan': { 
    icon: Wallet, 
    gradient: 'from-cyan-600 to-blue-700', 
    text: 'text-cyan-600', 
    bg: 'bg-cyan-50/50', 
    border: 'border-cyan-200' 
  },
  'Persuratan': { 
    icon: Mail, 
    gradient: 'from-indigo-500 to-indigo-700', 
    text: 'text-indigo-600', 
    bg: 'bg-indigo-50/50', 
    border: 'border-indigo-200' 
  },
  'Masjid': { 
    icon: Building2, 
    gradient: 'from-teal-600 to-emerald-700', 
    text: 'text-teal-600', 
    bg: 'bg-teal-50/50', 
    border: 'border-teal-200' 
  },
  'Master': { 
    icon: Database, 
    gradient: 'from-slate-700 to-gray-900', 
    text: 'text-slate-700', 
    bg: 'bg-slate-50/50', 
    border: 'border-slate-200' 
  },
  'Input Form': { 
    icon: FileEdit, 
    gradient: 'from-amber-600 to-yellow-600', 
    text: 'text-amber-600', 
    bg: 'bg-amber-50/50', 
    border: 'border-amber-200' 
  },
};

export default function PremiumDashboard() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('ADMIN');
  const [allowedPaths, setAllowedPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch User & Role Permissions
  useEffect(() => {
    fetchUserAndAccess();
  }, []);

  const fetchUserAndAccess = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let role = 'ADMIN';
      let name = '';

      if (user?.email) {
        name = user.email.split('@')[0];
        const { data: userData } = await supabase
          .from('app_users')
          .select('name, role')
          .eq('email', user.email)
          .single();

        if (userData) {
          if (userData.name) name = userData.name;
          if (userData.role) role = userData.role;
        }
      }

      setUserName(name);
      setUserRole(role);

      const isAdmin = role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator';

      if (isAdmin) {
        setAllowedPaths(menuList.map(m => m.path));
      } else {
        const { data: roleMenus } = await supabase
          .from('app_role_menus')
          .select('path')
          .eq('role', role);

        const paths = roleMenus?.map(rm => rm.path) || [];
        setAllowedPaths(paths.includes('/') ? paths : ['/', ...paths]);
      }
    } catch (err) {
      console.error('Error fetching dashboard user access:', err);
      // Fallback: show all menus
      setAllowedPaths(menuList.map(m => m.path));
    } finally {
      setLoading(false);
    }
  };

  // Greeting based on hours
  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 11) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Filter accessible menus
  const accessibleMenus = useMemo(() => {
    return menuList.filter(item => {
      const isAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrator';
      return isAdmin || allowedPaths.includes(item.path);
    });
  }, [userRole, allowedPaths]);

  // Group accessible menus by group
  const groupedAccessible = useMemo(() => {
    const groups: Record<string, typeof menuList> = {};
    accessibleMenus.forEach(item => {
      const g = item.group || 'Lainnya';
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });
    return groups;
  }, [accessibleMenus]);

  // Filtered by Search Query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedAccessible;
    const q = searchQuery.toLowerCase();

    const result: Record<string, typeof menuList> = {};
    Object.entries(groupedAccessible).forEach(([groupName, items]) => {
      const matchedItems = items.filter(it => 
        it.title.toLowerCase().includes(q) || 
        it.path.toLowerCase().includes(q) ||
        groupName.toLowerCase().includes(q)
      );
      if (matchedItems.length > 0) {
        result[groupName] = matchedItems;
      }
    });
    return result;
  }, [groupedAccessible, searchQuery]);

  const totalGroupsCount = Object.keys(groupedAccessible).length;
  const totalFeaturesCount = accessibleMenus.length;

  return (
    <div className="min-h-screen pb-24 space-y-8 max-w-7xl mx-auto">
      
      {/* TOP HEADER: SYSTEM TIME & REAL-TIME BADGE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 px-6 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 rounded-xl text-white shadow-xs">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Command Center Portal</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Sistem Pengendalian Administrasi & Informasi Terpadu</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu Sistem (WIB)</p>
            <p className="font-mono font-bold text-gray-800 text-sm">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-gray-200 hidden sm:block" />
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hari & Tanggal</p>
            <p className="font-bold text-gray-700 text-xs">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* HERO WELCOME BANNER */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl text-white border border-slate-800/80">
        {/* Decorative ambient lighting */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-3xl">
          
          {/* Badge Role */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-xl text-indigo-300 text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-xs">
              <Sparkles size={14} className="text-amber-400" />
              <span>{getGreeting()}, {userName || 'Pengguna'}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-200 text-xs font-bold">
              <ShieldCheck size={14} className="text-indigo-400" />
              <span>Role: <strong className="text-white uppercase">{userRole}</strong></span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Aplikasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Verifikasi & Pengendalian</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Selamat datang di portal kendali terpadu. Seluruh menu dan modul yang ditampilkan di bawah ini telah disesuaikan dengan hak akses resmi Anda.
            </p>
          </div>

          {/* KPI Access Counter Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-sm flex items-center gap-2.5 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-sm">
                {totalGroupsCount}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modul Grup</p>
                <p className="text-xs font-black text-white">Dapat Diakses</p>
              </div>
            </div>

            <div className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-sm flex items-center gap-2.5 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center text-emerald-300 font-black text-sm">
                {totalFeaturesCount}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fitur & Menu</p>
                <p className="text-xs font-black text-white">Siap Digunakan</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* QUICK SEARCH & SECTION HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            <span>Katalog Modul & Menu Akses Anda</span>
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Pilih modul atau klik langsung pada salah satu fitur untuk membuka halaman kerja.
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari fitur / modul cepat..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-8 bg-white hover:bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              ×
            </button>
          )}
        </div>
      </div>

      {/* DYNAMIC MODULE GROUP GRID (ACCORDING TO USER ACCESS) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3 bg-white rounded-3xl border border-gray-200 shadow-xs">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-gray-500">Memuat modul akses Anda...</span>
        </div>
      ) : Object.keys(filteredGroups).length === 0 ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-200/80 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-3xl flex items-center justify-center mx-auto">
            <Search size={32} />
          </div>
          <h4 className="text-base font-black text-gray-800">Tidak Ada Modul Ditemukan</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Tidak ditemukan menu atau modul yang sesuai dengan kata kunci "{searchQuery}". Hapus kata kunci untuk melihat semua menu yang Anda miliki.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(filteredGroups).map(([groupName, items]) => {
            const meta = groupMeta[groupName] || {
              icon: Layers,
              gradient: 'from-gray-700 to-slate-800',
              text: 'text-indigo-600',
              bg: 'bg-indigo-50/40',
              border: 'border-indigo-200'
            };
            const GroupIcon = meta.icon;
            const primaryLink = items[0]?.path || '#';

            return (
              <div
                key={groupName}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-indigo-300/80"
              >
                {/* Card Top / Header */}
                <div className="p-6 space-y-4">
                  
                  {/* Icon & Count Badge Row */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <GroupIcon size={24} />
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-200/80 flex items-center gap-1">
                      <CheckCircle size={11} className="text-emerald-500" />
                      <span>{items.length} Fitur</span>
                    </span>
                  </div>

                  {/* Group Title */}
                  <div>
                    <h4 className="text-base font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                      {groupName}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                      Grup administrasi dan pengelolaan data {groupName.toLowerCase()}.
                    </p>
                  </div>

                  {/* Interactive Sub-Menu Feature Chips */}
                  <div className="pt-2 space-y-1.5 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Fitur Tersedia:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map(subItem => (
                        <Link
                          key={subItem.path}
                          href={subItem.path}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-gray-200/70 px-2.5 py-1 rounded-xl transition-all shadow-2xs group/chip max-w-full"
                          title={subItem.title}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{subItem.title}</span>
                          <ArrowUpRight size={10} className="text-gray-400 group-hover/chip:text-indigo-600 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Footer: Quick Launch Button */}
                <div className="p-4 px-6 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400">Modul Utama</span>
                  <Link
                    href={primaryLink}
                    className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors group/btn"
                  >
                    <span>Buka Modul</span>
                    <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
