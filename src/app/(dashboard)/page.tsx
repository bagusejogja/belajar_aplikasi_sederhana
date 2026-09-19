'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, ShieldCheck, FileText, BarChart3, 
  ArrowRight, Clock, Users, ArrowUpRight,
  LayoutDashboard, TrendingUp, Search, Bell,
  Calendar, Landmark, Wallet, Mail, FolderTree,
  Building2, PieChart, Database, FileEdit, CheckCircle,
  Layers, Lock, ExternalLink, Activity,
  Star, X, Check, SlidersHorizontal, Settings2, Trash2,
  Menu as MenuIcon, ShieldAlert, FileSpreadsheet, MessageSquare, BookOpen, Settings, Wand2, Radio, ListTodo, BarChart4
} from 'lucide-react';
import { 
  getFavoriteUserKey, 
  loadUserFavorites, 
  saveUserFavorites, 
  toggleUserFavorite 
} from '@/lib/userFavorites';

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  Building2,
  Menu: MenuIcon,
  CheckCircle,
  ShieldCheck,
  FileEdit,
  PieChart,
  Database,
  ShieldAlert,
  FileText,
  FileSpreadsheet,
  Layers,
  MessageSquare,
  BookOpen,
  Settings,
  Wand2,
  Activity,
  Radio,
  Clock,
  ListTodo,
  Calendar,
  FolderTree,
  BarChart4
};
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

  // State untuk Menu Favorit Personal Pengguna
  const [userKey, setUserKey] = useState('guest_user');
  const [favoritePaths, setFavoritePaths] = useState<string[]>([]);
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);
  const [favModalSearch, setFavModalSearch] = useState('');
  const [tempFavs, setTempFavs] = useState<string[]>([]);
  const [isSavingFavs, setIsSavingFavs] = useState(false);
  const [favSuccessMsg, setFavSuccessMsg] = useState('');

  // Sinkronisasi event update favorit antar komponen
  useEffect(() => {
    const handleFavUpdate = (e: any) => {
      if (e.detail && (!userKey || e.detail.userKey === userKey)) {
        setFavoritePaths(e.detail.favorites || []);
      }
    };
    window.addEventListener('app_favorites_updated', handleFavUpdate);
    return () => window.removeEventListener('app_favorites_updated', handleFavUpdate);
  }, [userKey]);

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

      const key = getFavoriteUserKey(user);
      setUserKey(key);
      const userFavs = await loadUserFavorites(key);
      setFavoritePaths(userFavs);

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

  // Handler Buka Modal Pengaturan Favorit
  const openFavoriteModal = () => {
    setTempFavs([...favoritePaths]);
    setFavModalSearch('');
    setFavSuccessMsg('');
    setIsFavModalOpen(true);
  };

  // Toggle item di dalam Modal
  const toggleTempFav = (path: string) => {
    setTempFavs(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  // Pilih Semua / Kosongkan di Modal
  const selectAllFilteredTempFavs = (pathsToSelect: string[]) => {
    setTempFavs(prev => Array.from(new Set([...prev, ...pathsToSelect])));
  };

  const clearAllTempFavs = () => {
    setTempFavs([]);
  };

  // Simpan Favorit dari Modal
  const handleSaveFavorites = async () => {
    setIsSavingFavs(true);
    try {
      await saveUserFavorites(userKey, tempFavs);
      setFavoritePaths(tempFavs);
      setFavSuccessMsg('Menu favorit berhasil disimpan!');
      setTimeout(() => {
        setIsFavModalOpen(false);
        setFavSuccessMsg('');
      }, 700);
    } catch (err) {
      console.error('Gagal menyimpan menu favorit:', err);
    } finally {
      setIsSavingFavs(false);
    }
  };

  // Quick 1-click Toggle Langsung dari Kartu Favorit
  const handleQuickToggleFavorite = async (path: string) => {
    const res = await toggleUserFavorite(userKey, path);
    setFavoritePaths(res.newFavorites);
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


  // Filter menu favorit dari daftar menu yang bisa diakses user
  const favoriteMenuItems = useMemo(() => {
    return accessibleMenus.filter(m => favoritePaths.includes(m.path));
  }, [accessibleMenus, favoritePaths]);

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

      {/* ========================================================== */}
      {/* ⭐ EXECUTIVE FAVORITE MENU LAUNCHER (PERSONAL PER USER)     */}
      {/* ========================================================== */}
      <div className="relative bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/30 border border-amber-200/80 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
        {/* Header Favorit */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-amber-200/60 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
              <Star size={24} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Menu Favorit Saya</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300/80 text-[11px] font-black">
                  {favoriteMenuItems.length} Menu
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                Akses cepat personal ke menu-menu yang paling sering Anda butuhkan. Tersimpan otomatis untuk akun Anda.
              </p>
            </div>
          </div>

          <button
            onClick={openFavoriteModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-amber-500 hover:text-white text-gray-700 hover:border-amber-500 border border-amber-200 rounded-2xl text-xs font-black transition-all shadow-xs group cursor-pointer active:scale-95"
            title="Pilih dan kelola menu favorit Anda"
          >
            <SlidersHorizontal size={14} className="text-amber-500 group-hover:text-white transition-colors" />
            <span>Atur Menu Favorit</span>
          </button>
        </div>

        {/* Favorite Cards Grid */}
        {favoriteMenuItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favoriteMenuItems.map(favItem => {
              const FavIcon = iconMap[favItem.icon] || LayoutDashboard;
              const meta = groupMeta[favItem.group || 'Utama'] || {
                icon: Layers,
                gradient: 'from-amber-600 to-amber-700',
                text: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-200'
              };

              return (
                <div 
                  key={`card-fav-${favItem.path}`}
                  className="bg-white rounded-2xl border border-amber-200/70 p-4 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between group relative"
                >
                  {/* Top Row: Icon + Unpin Button */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                      <FavIcon size={19} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 truncate max-w-[110px]">
                        {favItem.group || 'Umum'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuickToggleFavorite(favItem.path);
                        }}
                        title="Hapus dari Menu Favorit"
                        className="p-1.5 text-amber-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Star size={15} className="fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Path */}
                  <div className="mb-4">
                    <h4 className="text-sm font-black text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                      {favItem.title}
                    </h4>
                    <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">
                      {favItem.path}
                    </p>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={favItem.path}
                    className="w-full py-2 px-3 bg-amber-50/70 hover:bg-amber-500 text-amber-800 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-between group/link border border-amber-200/60 hover:border-amber-500"
                  >
                    <span>Buka Menu</span>
                    <ArrowRight size={13} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State: Prompt to configure favorites */
          <div className="bg-white/80 rounded-2xl p-8 border border-dashed border-amber-300 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <Star size={28} />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-black text-gray-900">Belum Ada Menu Favorit</h4>
              <p className="text-xs text-gray-500">
                Pilih menu-menu yang paling sering Anda gunakan agar langsung tampil di barisan depan halaman utama ini.
              </p>
            </div>
            <button
              onClick={openFavoriteModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-200 transition-all cursor-pointer"
            >
              <Star size={14} className="fill-white" />
              <span>Pilih Menu Favorit Sekarang</span>
            </button>
          </div>
        )}
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

      {/* ========================================================== */}
      {/* ⚙️ MODAL PENGATURAN MENU FAVORIT PERSONAL                   */}
      {/* ========================================================== */}
      {isFavModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-amber-50/60 via-white to-orange-50/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
                  <Star size={22} className="fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Atur Menu Favorit Personal</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pilih menu yang ingin disematkan ke daftar favorit khusus untuk akun <strong className="text-gray-800">{userName || 'Anda'}</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFavModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search & Bulk Selection Controls */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/60 space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari menu untuk difavoritkan..."
                  value={favModalSearch}
                  onChange={e => setFavModalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[11px] font-black">
                    {tempFavs.length} Menu Dipilih
                  </span>
                  <span className="text-[11px] text-gray-400">
                    dari total {accessibleMenus.length} menu akses
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = accessibleMenus
                        .filter(m => 
                          !favModalSearch || 
                          m.title.toLowerCase().includes(favModalSearch.toLowerCase()) || 
                          (m.group && m.group.toLowerCase().includes(favModalSearch.toLowerCase()))
                        )
                        .map(m => m.path);
                      selectAllFilteredTempFavs(filtered);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:bg-amber-100/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Pilih Semua Sesuai Pencarian
                  </button>

                  <button
                    type="button"
                    onClick={clearAllTempFavs}
                    className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Kosongkan Semua
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable List of Menus Grouped by Category */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar max-h-[50vh]">
              {Object.entries(
                accessibleMenus
                  .filter(m => 
                    !favModalSearch || 
                    m.title.toLowerCase().includes(favModalSearch.toLowerCase()) || 
                    (m.group && m.group.toLowerCase().includes(favModalSearch.toLowerCase())) ||
                    m.path.toLowerCase().includes(favModalSearch.toLowerCase())
                  )
                  .reduce((acc, item) => {
                    const g = item.group || 'Lainnya';
                    if (!acc[g]) acc[g] = [];
                    acc[g].push(item);
                    return acc;
                  }, {} as Record<string, typeof menuList>)
              ).map(([groupName, items]) => (
                <div key={groupName} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">{groupName}</h4>
                    <span className="text-[10px] text-gray-400 font-bold">({items.length})</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map(item => {
                      const isSelected = tempFavs.includes(item.path);
                      const ItemIcon = iconMap[item.icon] || LayoutDashboard;

                      return (
                        <div
                          key={item.path}
                          onClick={() => toggleTempFav(item.path)}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                            isSelected 
                              ? 'bg-amber-50/70 border-amber-300 shadow-2xs' 
                              : 'bg-white hover:bg-gray-50/80 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <ItemIcon size={16} />
                            </div>
                            <div className="overflow-hidden">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-950 font-black' : 'text-gray-800'}`}>
                                {item.title}
                              </p>
                              <p className="text-[10px] font-mono text-gray-400 truncate">
                                {item.path}
                              </p>
                            </div>
                          </div>

                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected 
                              ? 'bg-amber-500 text-white shadow-xs' 
                              : 'border border-gray-300 text-transparent hover:border-gray-400'
                          }`}>
                            <Check size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
              <div>
                {favSuccessMsg && (
                  <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle size={14} />
                    <span>{favSuccessMsg}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFavModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveFavorites}
                  disabled={isSavingFavs}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSavingFavs ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Simpan Menu Favorit</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
