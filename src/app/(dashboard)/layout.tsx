'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
           <div>
              <h1 className="text-2xl font-bold text-gray-900">{getPageTitle(pathname)}</h1>
              <p className="text-gray-500 text-sm">Selamat datang, Admin. Pantau verifikasi hari ini.</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" size={18} />
                 <input 
                    type="text" 
                    placeholder="Cari sesuatu..." 
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-64 shadow-sm"
                 />
              </div>
              <button className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
                 <Bell size={20} />
              </button>
              <button className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
                 <HelpCircle size={20} />
              </button>
           </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
