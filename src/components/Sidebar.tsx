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
  X,
  FileEdit,
  PieChart,
  Database
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { menuList } from '../lib/mock-db';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  Database
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Viewer'); // Default pengamat untuk keamanan
  const [allowedPaths, setAllowedPaths] = useState<string[]>(['/']); // Default hanya home untuk keamanan

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
              } else if (roleData.role === 'Admin') {
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
        "fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
           <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-200">
                <ShieldCheck size={24} />
             </div>
             <div>
                <h1 className="font-bold text-gray-900 leading-tight">Verifikasi<br/><span className="text-indigo-600">Online</span></h1>
             </div>
           </div>
           {/* Tombol Close untuk Mobile */}
           <button 
             onClick={() => setIsOpen(false)} 
             className="p-2 lg:hidden text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
           >
              <X size={20} />
           </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuList.map((item) => {
            // HAK AKSES MENU DINAMIS DARI DATABASE (Tabel app_role_menus)
            if (userRole === 'Pending') return null; // Akun diblokir / belum disetujui tidak melihat menu apa-apa
            if (!allowedPaths.includes(item.path) && userRole !== 'Admin') return null; 

            const Icon = iconMap[item.icon] || LayoutDashboard;


            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)} /* Auto-close saat menu diklik di HP */
                className={cn(
                  "flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={cn(
                    "transition-colors", 
                    isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span>{item.title}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile / Bottom Action */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           <div className="bg-white p-4 rounded-xl flex items-start flex-col gap-2 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 uppercase">
                     {userEmail ? userEmail.charAt(0) : 'U'}
                   </div>
                   <div className="overflow-hidden">
                      <p className="text-xs font-bold text-gray-900 truncate" title={userEmail}>{userEmail || 'Memuat...'}</p>
                      <p className="text-[9px] text-gray-500 truncate uppercase tracking-wider font-semibold">Terkoneksi • {userRole}</p>
                   </div>

                 </div>
                 <button onClick={handleLogout} title="Logout" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <LogOut size={16} />
                 </button>
              </div>
           </div>
        </div>
      </aside>
    </>
  );
}
