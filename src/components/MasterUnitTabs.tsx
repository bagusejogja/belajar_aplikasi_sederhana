'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Landmark, Link2, Building2 
} from 'lucide-react';

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

  const currentTab = activeTab || (
    pathname === '/gov-mapping' ? 'gov-mapping' :
    pathname === '/units' ? 'units' :
    pathname === '/gov-units' ? 'gov-units' : 'gov-units'
  );

  return (
    <div className="bg-white p-2.5 px-4 rounded-2xl border border-gray-200/80 shadow-xs mb-4">
      <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar py-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

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
    </div>
  );
}
