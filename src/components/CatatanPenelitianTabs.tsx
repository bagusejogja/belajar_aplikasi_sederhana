'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileSpreadsheet, 
  PlusCircle, 
  BarChart3, 
  Wallet,
  Receipt,
  BookOpen
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
    id: 'input',
    title: 'Form Input Transaksi',
    path: '/catatan-penelitian',
    icon: PlusCircle,
    badge: 'Kasbon & Pengeluaran',
  },
  {
    id: 'laporan',
    title: 'Laporan & Monitoring Kasbon',
    path: '/catatan-penelitian/laporan',
    icon: BarChart3,
    badge: 'Monitoring & SPJ',
  },
  {
    id: 'mutasi',
    title: 'Mutasi Kas & Rekap PIC',
    path: '/catatan-penelitian/mutasi',
    icon: Wallet,
    badge: 'Buku Kas & Rekap PIC',
  },
];

export default function CatatanPenelitianTabs({ activeTab }: { activeTab?: string }) {
  const pathname = usePathname();
  const { role } = useUserRole();

  const currentTab = activeTab || (
    pathname === '/catatan-penelitian' || pathname === '/catatan-penelitian/input' ? 'input' :
    pathname.startsWith('/catatan-penelitian/laporan') ? 'laporan' :
    pathname.startsWith('/catatan-penelitian/mutasi') ? 'mutasi' : 'input'
  );

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 px-4 md:px-5 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs mb-4">
      {/* Top Header Label & Role Indicator (Standar Design System Aplikasi) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400">
            <FileSpreadsheet size={13} />
          </div>
          <span className="text-[11px] font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider">
            Catatan Penelitian &amp; Kasbon Kegiatan Suite
          </span>
          <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium hidden sm:inline">
            • Form Input, Laporan &amp; Monitoring SPJ, serta Buku Mutasi Kas &amp; Rekap PIC
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium shrink-0">
          <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Hak Akses:</span>
          <span className="px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] tracking-wide border shadow-2xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800">
            {role || 'STAFF'}
          </span>
        </div>
      </div>

      {/* Navigation Grid: Standar Design System (3 Tombol per Baris) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.path}
              title={tab.title}
              className={`group flex items-center gap-3 p-2.5 px-3.5 rounded-xl font-bold text-xs transition-all duration-200 select-none cursor-pointer border min-h-[48px] ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-200/70 dark:shadow-none border-indigo-500 ring-1 ring-indigo-500/40 scale-[1.01]'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-gray-700 dark:text-slate-300 hover:text-gray-950 dark:hover:text-white border-gray-200/80 dark:border-slate-800 hover:border-indigo-200 shadow-2xs'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600'
                }`}
              >
                <Icon size={16} />
              </div>

              <div className="flex flex-col min-w-0 text-left">
                <span className="truncate leading-tight font-black">{tab.title}</span>
                <span
                  className={`text-[10px] font-medium leading-none mt-1 ${
                    isActive ? 'text-indigo-100' : 'text-gray-400 dark:text-slate-500 group-hover:text-indigo-500'
                  }`}
                >
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
