'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, CheckSquare, FileEdit, Layers, Wand2, 
  Sparkles, Lock 
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
    title: 'Review Detail',
    path: '/review-anggaran/review',
    icon: CheckSquare,
    badge: 'Penelaahan',
  },
  {
    id: 'unit-kerja',
    title: 'Usulan Unit Kerja',
    path: '/review-anggaran/unit-kerja',
    icon: FileEdit,
    badge: 'Portal Unit',
  },
  {
    id: 'admin',
    title: 'Admin & Pivot',
    path: '/review-anggaran/admin',
    icon: Layers,
    badge: 'Admin',
    adminOnly: true,
  },
  {
    id: 'rules',
    title: 'Rule Engine',
    path: '/review-anggaran/rules',
    icon: Wand2,
    badge: 'Admin',
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
    <div className="bg-white p-2.5 px-4 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            const isRestricted = tab.adminOnly && !canAccessAdminTabs && !loading;

            if (isRestricted) {
              return null; // Sembunyikan tab admin jika hak akses adalah Unit Kerja / Staff
            }

            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-indigo-600'} />
                <span>{tab.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.badge}
                </span>
              </Link>
            );
          })}
        </div>

        {/* User Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0 pl-2 text-[11px] text-gray-500 font-medium">
          <span>Akses:</span>
          <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
            canAccessAdminTabs ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {role || 'STAFF'}
          </span>
        </div>
      </div>
    </div>
  );
}
