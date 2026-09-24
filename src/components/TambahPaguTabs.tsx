'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layout, PlusCircle, Scale, FileSpreadsheet, PieChart, 
  Sparkles 
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
    id: 'daftar',
    title: 'Daftar Usulan Tambah Pagu',
    path: '/tambah-pagu',
    icon: Layout,
    badge: 'Monitoring',
  },
  {
    id: 'tambah',
    title: 'Input Usulan Baru',
    path: '/tambah-pagu/tambah',
    icon: PlusCircle,
    badge: 'Form',
  },
  {
    id: 'komparasi',
    title: 'Komparasi Usulan',
    path: '/tambah-pagu/komparasi',
    icon: Scale,
    badge: 'Versi',
  },
  {
    id: 'analisis',
    title: 'Analisis Tambah Pagu',
    path: '/analisis',
    icon: FileSpreadsheet,
    badge: 'Global Pagu',
  },
  {
    id: 'potret',
    title: 'Potret Mutasi Pagu',
    path: '/potret-mutasi-pagu',
    icon: PieChart,
    badge: 'Mutasi',
  },
];

export default function TambahPaguTabs({ activeTab }: { activeTab?: string }) {
  const pathname = usePathname();

  const currentTab = activeTab || (
    pathname === '/tambah-pagu/tambah' ? 'tambah' :
    pathname === '/tambah-pagu/komparasi' ? 'komparasi' :
    pathname === '/analisis' ? 'analisis' :
    pathname === '/potret-mutasi-pagu' ? 'potret' :
    pathname.startsWith('/tambah-pagu') ? 'daftar' : 'daftar'
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
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : 'text-emerald-600'} />
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
