'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layout, PlusCircle, Scale, FileSpreadsheet, PieChart, 
  Coins
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
  const { role } = useUserRole();

  const currentTab = activeTab || (
    pathname === '/tambah-pagu/tambah' ? 'tambah' :
    pathname === '/tambah-pagu/komparasi' ? 'komparasi' :
    pathname === '/analisis' ? 'analisis' :
    pathname === '/potret-mutasi-pagu' ? 'potret' :
    pathname.startsWith('/tambah-pagu') ? 'daftar' : 'daftar'
  );

  return (
    <div className="bg-white/95 backdrop-blur-sm p-3 px-4 md:px-5 rounded-2xl border border-gray-200/90 shadow-xs mb-4">
      {/* Top Header Label & Role Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700">
            <Coins size={13} />
          </div>
          <span className="text-[11px] font-black text-gray-800 uppercase tracking-wider">
            Tambah Pagu & Mutasi Suite
          </span>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">• Usulan, Komparasi, & Analisis</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium shrink-0">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Hak Akses:</span>
          <span className="px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide border shadow-2xs bg-blue-50 text-blue-700 border-blue-200">
            {role || 'STAFF'}
          </span>
        </div>
      </div>

      {/* Navigation Grid: 4 Kolom Rata & Rapi, Efisien Tempat (Icon Kiri, Judul di Atas, Badge Tepat di Bawah Judul) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.path}
              title={tab.title}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-200 select-none cursor-pointer border min-h-[46px] ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 ring-1 ring-blue-500/40 scale-[1.01]'
                  : 'bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 border-slate-200/90 hover:border-blue-200 hover:shadow-2xs active:scale-[0.99]'
              }`}
            >
              {/* Icon di Sisi Kiri */}
              <div className={`p-1.5 rounded-lg shrink-0 ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors'
              }`}>
                <Icon size={16} />
              </div>

              {/* Konten Kanan: Judul Menu & Badge Tepat di Bawah Judul */}
              <div className="flex flex-col items-start min-w-0 pr-1 gap-0.5">
                <span className="line-clamp-1 font-bold tracking-tight text-[12px] leading-tight">
                  {tab.title}
                </span>
                <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider leading-none ${
                  isActive 
                    ? 'bg-white/25 text-white' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100/70 group-hover:text-blue-700'
                }`}>
                  {tab.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
