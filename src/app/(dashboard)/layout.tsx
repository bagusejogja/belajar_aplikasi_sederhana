'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, Bell, HelpCircle, Menu, Loader2, ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activityLogger';
import { menuList } from '@/lib/mock-db';
import CommandPalette from '@/components/shared/CommandPalette';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const lastLoggedPath = useRef<string>('');

  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
     const savedCollapsed = localStorage.getItem('sidebar_collapsed');
     if (savedCollapsed === 'true') {
        setIsSidebarCollapsed(true);
     }
  }, []);

  const handleToggleCollapsed = (val?: boolean | ((prev: boolean) => boolean)) => {
     setIsSidebarCollapsed(prev => {
        const next = typeof val === 'function' ? val(prev) : typeof val === 'boolean' ? val : !prev;
        localStorage.setItem('sidebar_collapsed', String(next));
        return next;
     });
  };

  // Global Ctrl + K listener for Command Palette
  useEffect(() => {
     const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
           e.preventDefault();
           setIsCommandPaletteOpen((prev) => !prev);
        }
     };
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
     const checkAuth = async () => {
        setIsUnauthorized(false);
        setIsAuthChecking(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
           router.push('/login');
           return;
        }

        // --- AUTHORIZATION CHECK (Mencegah Akses URL Manual) ---
        // Fetch role data
        const { data: roleData } = await supabase.from('app_users').select('role').eq('id', session.user.id).single();
        const currentRole = roleData?.role || 'Viewer';
        setUserRole(currentRole);
        
        if (typeof window !== 'undefined') {
           sessionStorage.setItem('user_role', currentRole);
        }

        // Track page view if path changed
        if (lastLoggedPath.current !== pathname) {
           lastLoggedPath.current = pathname;
           logActivity({
              action_type: 'PAGE_VIEW',
              action_title: `Membuka menu ${getPageTitle(pathname)}`,
              path: pathname,
              user_email: session.user.email || '',
              user_role: currentRole,
              details: { page_title: getPageTitle(pathname) }
           });
        }

        // 1. Jika sedang di root '/' atau '/dashboard', selalu biarkan lewat
        if (pathname === '/' || pathname === '/dashboard') {
           setIsUnauthorized(false);
           setIsAuthChecking(false);
           return;
        }

        // 2. Admin & Administrator selalu lolos ke semua halaman
        const roleLower = currentRole.toLowerCase();
        if (roleLower === 'admin' || roleLower === 'administrator') {
           setIsUnauthorized(false);
           setIsAuthChecking(false);
           return;
        }

        // 3. Cek allowed paths dari database app_role_menus
        const { data: menuData } = await supabase.from('app_role_menus').select('path').eq('role', currentRole);
        const dbAllowedPaths = (menuData || []).map((m: any) => m.path);

        // 4. Fallback ke menuList (di mock-db.ts) agar tidak salah blokir menu baru
        const fallbackAllowedPaths = menuList
           .filter(item => {
              const itemRoles = (item.roles || []).map(r => r.toLowerCase());
              return itemRoles.includes(roleLower) || itemRoles.includes('all');
           })
           .map(item => item.path);

        const combinedAllowedPaths = Array.from(new Set([...dbAllowedPaths, ...fallbackAllowedPaths]));

        // Cek apakah pathname saat ini diizinkan
        const isAllowed = combinedAllowedPaths.some((p: string) => {
           if (!p) return false;
           return pathname === p || pathname.startsWith(p + '/');
        });

        if (!isAllowed) {
           setIsUnauthorized(true);
        } else {
           setIsUnauthorized(false);
        }
        
        setIsAuthChecking(false);
     };

     checkAuth();

     // Listener untuk perubahan login/logout
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
           router.push('/login');
        }
     });

     return () => subscription.unsubscribe();
  }, [router, pathname]);

  // Get Page Title based on pathname
  const getPageTitle = (path: string) => {
    if (path.startsWith('/input-transfer/edit')) return 'Perbaiki & Ajukan Ulang Transfer';
    if (path.startsWith('/input-transfer')) return 'Input Pengajuan Transfer';
    if (path.startsWith('/approval-transfer')) return 'Approval Transfer Kas';
    if (path.startsWith('/rekap-transfer')) return 'Rekap & Riwayat Transfer';
    if (path.startsWith('/tambah-pagu/view')) return 'Detail Tambah Pagu';
    if (path.startsWith('/tambah-pagu/edit')) return 'Edit Tambah Pagu';

    switch (path) {
      case '/': return 'Apps Bersama Dashboard';
      case '/dashboard': return 'Dashboard Masjid';
      case '/monitoring-user': return 'Monitoring Aktivitas User';
      case '/input': return 'Input Transaksi Baru';
      case '/reports': return 'Laporan Keuangan';
      case '/references': return 'Data Referensi';
      case '/users': return 'Manajemen User';
      case '/units': return 'Manajemen Unit';
      case '/menus': return 'Manajemen Menu';
      case '/verifikasi': return 'Verifikasi Kas Masjid';
      case '/revisi': return 'Revisi Transaksi';
      case '/surat/editor-html': return 'Editor HTML Surat';
      case '/gov-narrative': return 'Narrative Generator';
      case '/surat/convert-ai': return 'AI Convert Surat';
      case '/potret-mutasi-pagu': return 'Potret Mutasi Pagu Keseluruhan';
      case '/tambah-pagu/komparasi': return 'Komparasi Audit Tambah Pagu';
      case '/tambah-pagu/tambah': return 'Input Tambah Pagu';
      case '/tambah-pagu': return 'Daftar Tambah Pagu';
      case '/backup': return 'Backup & Restore Database';
      case '/design-system': return 'Standar UI / UX (Design System)';
      default: return path.replace('/', '').replace(/-/g, ' ').toUpperCase() || 'Dashboard';
    }
  };

  if (isAuthChecking) {
     return <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50"><Loader2 size={48} className="animate-spin text-indigo-600 mb-4" /><p className="font-bold text-gray-500">Mengecek Kredensial Keamanan...</p></div>;
  }

  if (isUnauthorized) {
     return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50/80 p-6 text-center">
           <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-red-100 max-w-lg space-y-4">
              <div className="bg-red-50 text-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                 <ShieldAlert size={36} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Akses Ditolak!</h2>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Peran Akun: {userRole || 'Staff/Unit'}
                  </span>
                </div>
              </div>
              <p className="text-gray-500 text-xs md:text-sm font-medium leading-relaxed">
                Maaf, peran Anda tidak memiliki izin untuk mengakses halaman <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded font-mono font-bold text-xs">{pathname}</code>. Silakan hubungi Administrator jika ini adalah sebuah kesalahan.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
                 <button 
                   onClick={() => {
                     setIsUnauthorized(false);
                     router.back();
                   }} 
                   className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                 >
                    <ArrowLeft size={14} />
                    <span>Halaman Sebelumnya</span>
                 </button>
                 <button 
                   onClick={() => {
                     setIsUnauthorized(false);
                     router.push('/');
                   }} 
                   className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                 >
                    <Home size={14} />
                    <span>Dashboard Utama</span>
                 </button>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans print:overflow-visible print:bg-white">
      <div className="print:hidden">
         <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isCollapsed={isSidebarCollapsed} setIsCollapsed={handleToggleCollapsed} />
      </div>
      
      <div className={`flex-1 flex flex-col ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} w-full h-full overflow-y-auto overflow-x-hidden transition-all duration-300 print:ml-0 print:overflow-visible print:h-auto print:block`}>
        <header className="flex items-center justify-between px-4 py-2.5 md:px-6 lg:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-200/80 shadow-2xs print:hidden">
           
           <div className="flex items-center gap-3">
              {/* Tombol Hamburger Untuk Mobile Saja */}
              <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >
                 <Menu size={20} />
              </button>
              
              <div className="flex flex-wrap items-center gap-2">
                 <h1 className="text-sm md:text-base font-black text-gray-900 tracking-tight leading-none">{getPageTitle(pathname)}</h1>
                 <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-gray-300" />
                 <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">Selamat datang</span>
                 <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold border border-indigo-100 shadow-2xs">
                   SYNC_v4.5.18.5
                 </span>
              </div>
           </div>
           
           {/* Kanan / Action */}
           <div className="flex items-center gap-2">
              {/* Command Palette Trigger Button (Ctrl + K) */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-medium border border-slate-200/80 transition-all cursor-pointer shadow-2xs group"
                title="Pencarian Cepat Menu & Data (Ctrl+K)"
              >
                <Search size={13} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="hidden md:inline font-semibold">Cari menu & data...</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white text-slate-500 rounded border border-slate-200 shadow-2xs">
                  Ctrl+K
                </kbd>
              </button>

              {/* Theme Toggle (Dark / Light Mode) */}
              <ThemeToggle />

              <button className="p-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-750 text-gray-500 dark:text-gray-300 transition-all shadow-2xs cursor-pointer" title="Notifikasi">
                 <Bell size={16} />
              </button>
           </div>
        </header>

        {/* Global Command Palette Dialog */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />

        <main className="flex-1 p-3 md:p-5 lg:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
