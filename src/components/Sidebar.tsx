'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Menu as MenuIcon, 
  CheckCircle, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  X,
  FileEdit,
  FileText,
  FileSpreadsheet,
  PieChart,
  Database,
  Layers,
  MessageSquare,
  BookOpen,
  Settings,
  Search,
  ChevronDown,
  ChevronUp,
  Wand2,
  Sparkles,
  Landmark,
  Wallet,
  Mail,
  Calendar,
  FolderTree,
  Box
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { menuList } from '../lib/mock-db';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  Wand2
};

const groupIconMap: Record<string, any> = {
  'Utama': Sparkles,
  'Masjid': Building2,
  'Dana Pemerintah': Landmark,
  'Penerimaan': Wallet,
  'Persuratan': Mail,
  'Master': Database,
  'Anggaran': PieChart,
  'Review Anggaran': ShieldCheck,
  'Input Form': FileEdit,
  'Manajemen Kegiatan': Calendar,
  'Mockup': Wand2,
  'Lainnya': Layers
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export default function Sidebar({ isOpen, setIsOpen, isCollapsed = false, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Viewer'); // Default pengamat untuk keamanan
  const [allowedPaths, setAllowedPaths] = useState<string[]>(['/']); // Default hanya home untuk keamanan
  const [menuSearch, setMenuSearch] = useState('');
  
  // State untuk accordion grup
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isGroupsInitialized, setIsGroupsInitialized] = useState(false);

  const allGroupsList = useMemo(() => Array.from(new Set(menuList.map(m => m.group || 'Lainnya'))), []);

  useEffect(() => {
    // Inisialisasi accordion sesuai preferensi tersimpan atau buka semua
    if (!isGroupsInitialized) {
      const savedGroups = localStorage.getItem('sidebar_expanded_groups');
      if (savedGroups) {
        try {
          setExpandedGroups(JSON.parse(savedGroups));
        } catch {
          setExpandedGroups(allGroupsList);
        }
      } else {
        setExpandedGroups(allGroupsList);
      }
      setIsGroupsInitialized(true);
    }
  }, [isGroupsInitialized, allGroupsList]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group];
      localStorage.setItem('sidebar_expanded_groups', JSON.stringify(next));
      return next;
    });
  };

  const toggleAllGroups = () => {
    if (expandedGroups.length === 0) {
      setExpandedGroups(allGroupsList);
      localStorage.setItem('sidebar_expanded_groups', JSON.stringify(allGroupsList));
    } else {
      setExpandedGroups([]);
      localStorage.setItem('sidebar_expanded_groups', JSON.stringify([]));
    }
  };

  useEffect(() => {
     const getUserProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           setUserEmail(user.email || '');
           
           // Ambil hak akses/role dari tabel app_users
           const { data: roleData } = await supabase.from('app_users').select('role').eq('id', user.id).single();
              
           if (roleData) {
              setUserRole(roleData.role);
              
              // Tarik Menu Path yang diizinkan untuk Role tersebut dari app_role_menus
              const { data: menuData } = await supabase.from('app_role_menus').select('path').eq('role', roleData.role);
              if (menuData && menuData.length > 0) {
                 setAllowedPaths(menuData.map(m => m.path));
              } else if (roleData.role.toLowerCase() === 'admin' || roleData.role.toLowerCase() === 'administrator') {
                 // Fallback jika belum di-set, Admin punya akses semua
                 setAllowedPaths(menuList.map(m => m.path));
              }
           }
        }
     };
     getUserProfile();
  }, []);

  const handleLogout = async () => {
     if (confirm("Ingin keluar dari sistem?")) {
        await supabase.auth.signOut();
        router.push('/login');
     }
  };

  const allGroupsExpanded = expandedGroups.length > 0;

  return (
    <>
      {/* Overlay Background Gelap untuk Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200/80 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-20 w-64" : "w-64"
      )}>
        {/* Brand Header */}
        <div className={cn(
          "p-5 border-b border-gray-100 flex items-center justify-between", 
          isCollapsed && "lg:p-3 lg:py-4 lg:flex-col lg:gap-2.5 lg:justify-center"
        )}>
           <div className="flex items-center gap-3 overflow-hidden">
             <div 
               onClick={() => isCollapsed && setIsCollapsed && setIsCollapsed(false)}
               className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200 shrink-0 hover:scale-105 transition-transform cursor-pointer"
               title={isCollapsed ? "Buka Sidebar" : "Apps Bersama"}
             >
                <ShieldCheck size={22} />
             </div>
             {!isCollapsed && (
               <div className="animate-in fade-in duration-200">
                  <h1 className="font-extrabold text-gray-900 leading-tight tracking-tight text-base">Apps<br/><span className="text-indigo-600 font-black">Bersama</span></h1>
               </div>
             )}
           </div>

           {/* Desktop Collapse Toggle Button */}
           <button 
             onClick={() => setIsCollapsed && setIsCollapsed((prev: boolean) => !prev)}
             className="hidden lg:flex p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
             title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
           >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} className="-rotate-90" />}
           </button>

           {/* Mobile Close Button */}
           <button 
             onClick={() => setIsOpen(false)} 
             className="p-2 lg:hidden text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
           >
              <X size={20} />
           </button>
        </div>

        {/* Action Bar for Accordion & Search (Visible when expanded) */}
        {!isCollapsed && (
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigasi Menu</span>
            <button 
              onClick={toggleAllGroups}
              className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-0.5 rounded-lg transition-all"
              title={allGroupsExpanded ? "Tutup Semua Menu Group" : "Buka Semua Menu Group"}
            >
              {allGroupsExpanded ? "Tutup Semua" : "Buka Semua"}
            </button>
          </div>
        )}

        {/* Navigation - Grouped */}
        <nav className="flex-1 p-3 space-y-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {!isCollapsed && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Cari menu..."
                value={menuSearch}
                onChange={e => setMenuSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
            </div>
          )}

          {Object.entries(
            menuList.reduce((acc, item) => {
              const group = item.group || 'Lainnya';
              if (!acc[group]) acc[group] = [];
              acc[group].push(item);
              return acc;
            }, {} as Record<string, typeof menuList>)
          ).map(([group, items]) => {
            // Filter items by role/access AND search query
            const visibleItems = items.filter(item => {
              if (userRole === 'Pending') return false;
              const isAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrator';
              const hasAccess = allowedPaths.includes(item.path) || isAdmin;
              const matchesSearch = item.title.toLowerCase().includes(menuSearch.toLowerCase());
              return hasAccess && matchesSearch;
            });

            if (visibleItems.length === 0) return null;

            const isExpanded = expandedGroups.includes(group) || menuSearch !== '';
            const GroupIcon = groupIconMap[group] || Layers;

            return (
              <div key={group} className="space-y-1">
                {/* Sleek Group Header for Collapsed Mode */}
                {isCollapsed && (
                  isExpanded ? (
                    /* Active Group Header Icon when expanded - Simple tooltip */
                    <div className="w-full flex items-center justify-center pt-2 pb-1 group/grp relative">
                      <button 
                        onClick={() => toggleGroup(group)}
                        className="p-1.5 rounded-xl text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 transition-all flex items-center justify-center border border-indigo-100/80 shadow-xs"
                        title={`Grup ${group} (Klik untuk ciutkan)`}
                      >
                        <GroupIcon size={14} className="shrink-0" />
                      </button>
                      
                      {/* Tooltip for Group Header when expanded */}
                      <div className="fixed left-20 opacity-0 invisible group-hover/grp:opacity-100 group-hover/grp:visible transition-all duration-200 z-[100] pointer-events-none ml-2">
                        <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-xl py-1.5 px-3 shadow-xl border border-slate-700 whitespace-nowrap text-xs font-bold flex items-center gap-2">
                          <div className="absolute -left-1 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700 top-1/2 -translate-y-1/2" />
                          <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">Grup:</span>
                          <span>{group}</span>
                          <span className="text-[9px] text-slate-400 font-normal">(Klik untuk ciutkan)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Collapsed Group Folder Icon Button when closed - Rich Submenu Popover */
                    <div className="w-full flex items-center justify-center py-1 group/grp relative">
                      <button 
                        onClick={() => toggleGroup(group)}
                        className="w-[46px] h-[46px] rounded-2xl bg-indigo-500 text-white shadow-md hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex flex-col items-center justify-center gap-0.5 relative group-hover/grp:scale-105 active:scale-95"
                        title={`Buka Grup ${group}`}
                      >
                        <GroupIcon size={18} />
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 mt-0.5 group-hover/grp:bg-white transition-colors" />
                      </button>
                      
                      {/* Submenu Detail Flyout Popover for Collapsed Group */}
                      <div className="fixed left-20 opacity-0 invisible group-hover/grp:opacity-100 group-hover/grp:visible transition-all duration-200 z-[100] pointer-events-none group-hover/grp:pointer-events-auto">
                        {/* Invisible bridge to prevent mouseleave when moving from button to tooltip */}
                        <div className="absolute inset-y-0 -left-6 w-6 bg-transparent" />
                        
                        <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 min-w-[210px] max-w-xs relative space-y-2 ml-2">
                          <div className="absolute -left-1.5 top-5 w-3 h-3 bg-slate-900 rotate-45 border-l border-b border-slate-700" />
                          
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <GroupIcon size={14} className="text-indigo-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{group}</span>
                            </div>
                            <button 
                              onClick={() => toggleGroup(group)} 
                              className="text-[9px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-600 px-2 py-0.5 rounded-md transition-colors border border-indigo-700/50"
                            >
                              Buka di Sidebar
                            </button>
                          </div>

                          <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar pt-1">
                            {visibleItems.map(subItem => {
                              const SubIcon = iconMap[subItem.icon] || LayoutDashboard;
                              const isSubActive = pathname === subItem.path;
                              return (
                                <Link 
                                  key={subItem.path} 
                                  href={subItem.path}
                                  onClick={() => setIsOpen(false)}
                                  className={cn(
                                    "flex items-center gap-2.5 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all truncate group/sub",
                                    isSubActive 
                                      ? "bg-indigo-600 text-white shadow-sm" 
                                      : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                                  )}
                                >
                                  <SubIcon size={14} className={isSubActive ? "text-white" : "text-slate-400 group-hover/sub:text-indigo-400"} />
                                  <span className="truncate">{subItem.title}</span>
                                  {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-auto" />}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* Group Header for Expanded Mode */}
                {!isCollapsed && (
                  <button 
                    onClick={() => toggleGroup(group)}
                    className="w-full px-3 py-1 flex items-center justify-between text-left group/btn hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <h3 className="text-[10px] font-bold text-gray-400 group-hover/btn:text-indigo-600 transition-colors uppercase tracking-[0.15em]">{group}</h3>
                    {isExpanded ? <ChevronDown size={13} className="text-gray-400 group-hover/btn:text-indigo-600" /> : <ChevronRight size={13} className="text-gray-400 group-hover/btn:text-indigo-600" />}
                  </button>
                )}
                
                {/* Group Item List */}
                {isExpanded && (
                  <div className="space-y-1.5">
                  {visibleItems.map((item) => {
                    const Icon = iconMap[item.icon] || LayoutDashboard;
                    const isActive = pathname === item.path;

                    return (
                      <div key={item.path} className="relative group/item flex justify-center items-center">
                        <Link
                          href={item.path}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center group rounded-2xl transition-all duration-200 font-medium relative",
                            isCollapsed ? "justify-center w-11 h-11" : "justify-between px-3 py-2.5 w-full",
                            isActive 
                              ? "bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200 border border-indigo-500 scale-105" 
                              : "text-gray-400 hover:bg-indigo-50/80 hover:text-indigo-600 border border-transparent active:scale-95"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={19} className={cn(
                              "transition-colors shrink-0", 
                              isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-600"
                            )} />
                            {!isCollapsed && <span className={cn("text-sm truncate font-bold", isActive ? "text-white" : "text-gray-700")}>{item.title}</span>}
                          </div>
                          {!isCollapsed && isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                          )}
                        </Link>

                        {/* Floating Tooltip on Collapsed Mode */}
                        {isCollapsed && (
                          <div className="fixed left-20 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-[100] pointer-events-none ml-2">
                            <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-xl py-2 px-3.5 shadow-2xl shadow-slate-900/50 border border-slate-700/80 whitespace-nowrap text-xs font-black relative flex items-center gap-2">
                              <div className="absolute -left-1 w-2 h-2 bg-slate-900 rotate-45 border-l border-b border-slate-700 top-1/2 -translate-y-1/2" />
                              <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">{group} •</span>
                              <span>{item.title}</span>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Profile / Bottom Action */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
           <div className={cn("bg-white p-3 rounded-2xl flex border border-gray-100 shadow-sm relative group/profile", isCollapsed ? "flex-col items-center justify-center" : "flex-col gap-2")}>
              <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-2.5 overflow-hidden">
                   <div className="relative">
                     <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black shrink-0 uppercase text-sm shadow-md shadow-indigo-200 cursor-pointer">
                       {userEmail ? userEmail.charAt(0) : 'U'}
                     </div>
                     <div className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5 shadow-sm" title="Online" />
                   </div>
                   {!isCollapsed && (
                     <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-900 truncate" title={userEmail}>{userEmail || 'Memuat...'}</p>
                        <p className="text-[9px] text-gray-500 truncate uppercase tracking-wider font-semibold">Terkoneksi • {userRole}</p>
                     </div>
                   )}
                 </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-1 shrink-0">
                     <Link 
                       href="/backup" 
                       title="Dashboard Backup & Restore Database (Cloudflare R2 & SQL)" 
                       className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-xl transition-all shadow-2xs flex items-center justify-center"
                     >
                        <Database size={15} />
                     </Link>
                     <button 
                       onClick={handleLogout} 
                       title="Keluar / Logout Aplikasi" 
                       className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-gray-100 hover:border-rose-100 rounded-xl transition-all shadow-2xs flex items-center justify-center cursor-pointer"
                     >
                        <LogOut size={15} />
                     </button>
                  </div>
                )}
              </div>

              {/* Flyout for User Profile in Collapsed Mode */}
              {isCollapsed && (
                <div className="fixed left-20 bottom-3 pl-2 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 z-[100] pointer-events-none group-hover/profile:pointer-events-auto">
                  <div className="bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-4 shadow-2xl shadow-slate-900/50 border border-slate-700/80 min-w-[220px] relative space-y-3">
                    <div className="absolute -left-1.5 bottom-4 w-3 h-3 bg-slate-900 rotate-45 border-l border-b border-slate-700" />
                    
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-3 relative z-10">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm uppercase">
                        {userEmail ? userEmail.charAt(0) : 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-white truncate" title={userEmail}>{userEmail || 'User'}</p>
                        <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-emerald-500/30 mt-0.5">
                          ● {userRole}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 relative z-10">
                      <Link 
                        href="/backup" 
                        className="flex items-center gap-2.5 px-3 py-2 bg-slate-800 hover:bg-indigo-600 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all active:scale-95"
                      >
                        <Database size={15} /> Backup & Restore
                      </Link>
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-2.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition-all w-full text-left active:scale-95 border border-rose-500/20 hover:border-transparent"
                      >
                        <LogOut size={15} /> Logout Aplikasi
                      </button>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>
      </aside>
    </>
  );
}
