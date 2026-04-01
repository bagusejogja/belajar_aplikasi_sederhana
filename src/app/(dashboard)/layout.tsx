'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Bell, HelpCircle, Menu, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
     const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
           router.push('/login');
        } else {
           setIsAuthChecking(false);
        }
     };

     checkAuth();

     // Listener untuk perubahan login/logout
     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
           router.push('/login');
        }
     });

     return () => subscription.unsubscribe();
  }, [router]);

  // Get Page Title based on pathname
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Verifikasi Transaksi';
      case '/input': return 'Input Transaksi Baru';
      case '/reports': return 'Laporan Keuangan';
      case '/references': return 'Data Referensi';
      case '/users': return 'Manajemen User';
      case '/units': return 'Manajemen Unit';
      case '/menus': return 'Manajemen Menu';
      case '/gov-narrative': return 'Narrative Generator';
      default: return 'Dashboard';
    }
  };

  if (isAuthChecking) {
     return <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50"><Loader2 size={48} className="animate-spin text-indigo-600 mb-4" /><p className="font-bold text-gray-500">Mengecek Kredensial Keamanan...</p></div>;
  }

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans print:overflow-visible print:bg-white">
      <div className="print:hidden">
         <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      </div>
      
      {/* 
        Area Utama Content 
        - lg:ml-64 (Sidebar butuh 64 unit tempat di layar besar)
        - p-4 md:p-8 (Padding menyusut di layar HP)
        - Saat mode Print (Cetak), lebar jadi 100% dan margin kiri hilang!
      */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full h-full overflow-y-auto overflow-x-hidden transition-all duration-300 print:ml-0 print:overflow-visible print:h-auto print:block">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 lg:px-10 lg:py-8 gap-4 bg-white/50 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 lg:border-none print:hidden">
           
           <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Tombol Hamburger Untuk Mobile Saja */}
              <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              >

                 <Menu size={24} />
              </button>
              
              <div>
                 <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">{getPageTitle(pathname)}</h1>
                 <p className="text-gray-500 text-xs md:text-sm font-medium mt-1">Selamat datang, pastikan semua data valid.</p>
              </div>
           </div>
           
           {/* Kanan / Kotak Cari */}
           <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <div className="relative group flex-1 md:flex-none">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" size={18} />
                 <input 
                    type="text" 
                    placeholder="Cari data..." 
                    className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm shadow-sm transition-all"
                 />
              </div>
              <div className="flex gap-2">
                 <button className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 text-gray-500 transition-all shadow-sm">
                    <Bell size={20} />
                 </button>
                 <button className="hidden md:block p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 text-gray-500 transition-all shadow-sm">
                    <HelpCircle size={20} />
                 </button>
              </div>
           </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-10 lg:pt-0 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
