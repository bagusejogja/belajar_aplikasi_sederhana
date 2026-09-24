'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, CheckSquare, FileEdit, Layers, Wand2, 
  Sparkles, Lock, ArrowRight, Compass
} from 'lucide-react';
import { useUserRole } from '@/lib/useUserRole';

interface TabConfig {
  id: string;
  title: string;
  path: string;
  icon: React.ElementType;
  badge: string;
  adminOnly?: boolean;
}

const TABS: TabConfig[] = [
  {
    id: 'landing',
    title: 'Smart Review Hub',
    path: '/review-anggaran',
    icon: ShieldCheck,
    badge: 'Overview',
  },
  {
    id: 'review',
    title: 'Review Detail Usulan',
    path: '/review-anggaran/review',
    icon: CheckSquare,
    badge: 'Penelaahan',
  },
  {
    id: 'unit-kerja',
    title: 'Portal Usulan Unit Kerja',
    path: '/review-anggaran/unit-kerja',
    icon: FileEdit,
    badge: 'Portal Unit',
  },
  {
    id: 'admin',
    title: 'Admin Review & Pivot Matrix',
    path: '/review-anggaran/admin',
    icon: Layers,
    badge: 'Admin Only',
    adminOnly: true,
  },
  {
    id: 'rules',
    title: 'Master Aturan (Rule Engine)',
    path: '/review-anggaran/rules',
    icon: Wand2,
    badge: 'Engine AI',
    adminOnly: true,
  },
];

export default function ReviewAnggaranTabs({ activeTab }: { activeTab?: string }) {
  const pathname = usePathname();
  const { isAdmin, isManager, role, loading } = useUserRole();
  const canAccessAdminTabs = isAdmin || isManager;

  const currentTab = activeTab || (
    pathname === '/review-anggaran' ? 'landing' :
    pathname.includes('/review-anggaran/review') || pathname === '/review' ? 'review' :
    pathname.includes('/review-anggaran/unit-kerja') || pathname === '/unit-kerja' ? 'unit-kerja' :
    pathname.includes('/review-anggaran/admin') || pathname === '/admin' ? 'admin' :
    pathname.includes('/review-anggaran/rules') || pathname === '/admin/rules' ? 'rules' : 'landing'
  );

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 px-4 md:px-5 rounded-2xl border border-gray-200/90 shadow-xs mb-4">
      {/* Top Header Label & Role Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700">
            <Compass size={13} />
          </div>
          <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
            Review Anggaran Suite
          </span>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">• Navigasi Terpadu</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium shrink-0">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Hak Akses:</span>
          <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide border shadow-2xs ${
            canAccessAdminTabs 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            {role || 'STAFF'}
          </span>
          {!canAccessAdminTabs && !loading && (
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md font-semibold hidden md:inline">
              Mode Unit Kerja
            </span>
          )}
        </div>
      </div>

      {/* Navigation Grid: 4 Kolom Rata & Rapi, Lanjut Baris Baru jika lebih dari 4 dengan ukuran seragam */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isRestricted = tab.adminOnly && !canAccessAdminTabs && !loading;

          if (isRestricted) {
            return null; // Otomatis disembunyikan jika role bukan admin/manager
          }

          return (
            <Link
              key={tab.id}
              href={tab.path}
              title={tab.title}
              className={`group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 select-none cursor-pointer border h-full min-h-[44px] ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200/70 border-indigo-500 ring-1 ring-indigo-500/40 scale-[1.01]'
                  : 'bg-slate-50/90 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 border-slate-200/90 hover:border-indigo-200 hover:shadow-2xs active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-1">
                <Icon size={15} className={`shrink-0 ${isActive ? 'text-white' : 'text-indigo-600 group-hover:scale-110 transition-transform'}`} />
                <span className="line-clamp-2 font-bold tracking-tight text-[12px] leading-snug">
                  {tab.title}
                </span>
              </div>
              <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : tab.adminOnly 
                    ? 'bg-amber-100/70 text-amber-800' 
                    : 'bg-slate-200/80 text-slate-600'
              }`}>
                {tab.badge}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
