'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Menu, 
  CheckCircle, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { menuList } from '../lib/mock-db';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  Building2,
  Menu,
  CheckCircle,
  ShieldCheck
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50">
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="p-6 border-b border-gray-100">
           <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-xl text-white">
                <ShieldCheck size={24} />
             </div>
             <div>
                <h1 className="font-bold text-gray-900 leading-tight">Verifikasi<br/><span className="text-indigo-600">Online</span></h1>
             </div>
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuList.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={cn(isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
                  <span className="font-medium">{item.title}</span>
                </div>
                <ChevronRight size={14} className={cn("transition-transform duration-200", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
              </Link>
            );
          })}
        </nav>

        {/* Profile / Bottom Action */}
        <div className="p-4 border-t border-gray-100">
           <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  A
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-semibold text-gray-900 truncate">Admin Masjid</p>
                   <p className="text-xs text-gray-500 truncate">admin@masjid.id</p>
                </div>
              </div>
              <button title="Logout" className="p-1 hover:text-red-500 transition-colors">
                 <LogOut size={18} />
              </button>
           </div>
        </div>
      </div>
    </aside>
  );
}
