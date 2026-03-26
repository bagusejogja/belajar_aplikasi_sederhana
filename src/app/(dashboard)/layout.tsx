'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Get Page Title based on pathname
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Verifikasi Transaksi';
      case '/users': return 'Manajemen User';
      case '/units': return 'Manajemen Unit';
      case '/menus': return 'Manajemen Menu';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* 
        Area Utama Content 
        - lg:ml-64 (Sidebar butuh 64 unit tempat di layar besar)
        - p-4 md:p-8 (Padding menyusut di layar HP)
      */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full h-full overflow-y-auto overflow-x-hidden transition-all duration-300">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 lg:px-10 lg:py-8 gap-4 bg-white/50 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 lg:border-none">
           
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
