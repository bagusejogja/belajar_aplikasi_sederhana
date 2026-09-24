'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Landmark, Link2, Building2 
} from 'lucide-react';
import { useUserRole } from '@/lib/useUserRole';

interface TabConfig {
  id: string;
  title: string;
  path: string;
  icon: React.ElementType;
  badge: string;
}

const TABS: TabConfig[] = [
  {
    id: 'gov-units',
    title: 'Master Unit Kerja & PIC',
    path: '/gov-units',
    icon: Landmark,
    badge: 'Organisasi & PIC',
  },
  {
    id: 'gov-mapping',
    title: 'Pemetaan PIC -> Unit',
    path: '/gov-mapping',
    icon: Link2,
    badge: 'Mapping',
  },
  {
    id: 'units',
    title: 'Tabel Unit Dasar (DB)',
    path: '/units',
    icon: Building2,
    badge: 'Ref DB',
  },
];

export default function MasterUnitTabs({ activeTab }: { activeTab?: string }) {
  const pathname = usePathname();
  const { role } = useUserRole();

  const currentTab = activeTab || (
    pathname === '/gov-mapping' ? 'gov-mapping' :
    pathname === '/units' ? 'units' :
    pathname === '/gov-units' ? 'gov-units' : 'gov-units'
  );

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 px-4 md:px-5 rounded-2xl border border-gray-200/90 shadow-xs mb-4">
      {/* Top Header Label & Role Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700">
            <Building2 size={13} />
          </div>
          <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
            Master Data Unit Kerja Suite
          </span>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">• Struktur Unit, PIC, & Mapping Referensi</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium shrink-0">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Hak Akses:</span>
          <span className="px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide border shadow-2xs bg-indigo-50 text-indigo-700 border-indigo-200">
            {role || 'STAFF'}
          </span>
        </div>
      </div>

      {/* Navigation Pills: Responsive Wrap Layout (No horizontal scrolling!) */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all duration-200 select-none cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-700 text-white shadow-md shadow-indigo-200/70 ring-1 ring-indigo-500/40 scale-[1.02]'
                  : 'bg-slate-50/90 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 hover:shadow-2xs active:scale-95'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-indigo-600'} />
              <span className="tracking-tight">{tab.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                isActive 
                  ? 'bg-white/20 text-white' 
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
