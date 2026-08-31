'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search, Bell, HelpCircle, Menu, Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activityLogger';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const lastLoggedPath = useRef<string>('');

  const [isUnauthorized, setIsUnauthorized] = useState(false);

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

  useEffect(() => {
     const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
           router.push('/login');
           return;
        }

        // --- AUTHORIZATION CHECK (Mencegah Akses URL Manual) ---
        // Fetch role data
        const { data: roleData } = await supabase.from('app_users').select('role').eq('id', session.user.id).single();
        const currentRole = roleData?.role || 'Viewer';
        
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

        // Jika sedang di root '/' atau '/dashboard', biarkan lewat
        if (pathname === '/' || pathname === '/dashboard') {
           setIsAuthChecking(false);
           return;
        }

        if (roleData) {
           if (roleData.role.toLowerCase() === 'admin') {
              setIsAuthChecking(false); // Admin selalu lolos
              return;
           }

           const { data: menuData } = await supabase.from('app_role_menus').select('path').eq('role', roleData.role);
           if (menuData) {
              const allowedPaths = menuData.map((m: any) => m.path);
              // Cek apakah pathname saat ini ada di daftar yang diizinkan
              const isAllowed = allowedPaths.some((p: string) => pathname.startsWith(p));
              
              if (!isAllowed) {
                 setIsUnauthorized(true);
              }
           } else {
              setIsUnauthorized(true); // Jika tidak ada menu di-mapping, blokir
           }
        } else {
           setIsUnauthorized(true); // User tidak punya role
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
      default: return path.replace('/', '').replace(/-/g, ' ').toUpperCase() || 'Dashboard';
    }
  };

  if (isAuthChecking) {
     return <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50"><Loader2 size={48} className="animate-spin text-indigo-600 mb-4" /><p className="font-bold text-gray-500">Mengecek Kredensial Keamanan...</p></div>;
  }

  if (isUnauthorized) {
     return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
           <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-red-100 max-w-md">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <ShieldAlert size={40} className="text-red-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Akses Ditolak!</h2>
              <p className="text-gray-500 font-medium mb-8">Maaf, peran Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi Administrator jika ini adalah sebuah kesalahan.</p>
              <button onClick={() => router.push('/')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200">
                 KEMBALI KE DASHBOARD
              </button>
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
              <button className="p-1.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-2xs" title="Notifikasi">
                 <Bell size={16} />
              </button>
           </div>
        </header>

        <main className="flex-1 p-3 md:p-5 lg:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
