'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Utensils, GraduationCap, Award, Briefcase, CreditCard, 
  Landmark, ChevronRight, Layers, Sparkles, Loader2 
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AnggaranUangMakanTab = dynamic(() => import('@/components/dana-pemerintah/AnggaranUangMakanTab'), {
  loading: () => <TabLoading />
});
const TunjanganGuruBesarTab = dynamic(() => import('@/components/dana-pemerintah/TunjanganGuruBesarTab'), {
  loading: () => <TabLoading />
});
const TunjanganSerdosTab = dynamic(() => import('@/components/dana-pemerintah/TunjanganSerdosTab'), {
  loading: () => <TabLoading />
});
const TunjanganFungsionalTab = dynamic(() => import('@/components/dana-pemerintah/TunjanganFungsionalTab'), {
  loading: () => <TabLoading />
});
const GajiPnsTab = dynamic(() => import('@/components/dana-pemerintah/GajiPnsTab'), {
  loading: () => <TabLoading />
});

function TabLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-gray-200/90 shadow-2xs text-gray-400">
      <Loader2 size={32} className="animate-spin mb-2 text-indigo-600" />
      <p className="text-xs font-semibold">Memuat data modul...</p>
    </div>
  );
}

export type TabKey = 'uang-makan' | 'guru-besar' | 'serdos' | 'fungsional' | 'gaji-pns';

interface TabItem {
  id: TabKey;
  label: string;
  badge: string;
  icon: React.ElementType;
  activeColor: string;
  iconColor: string;
  desc: string;
}

const TABS: TabItem[] = [
  {
    id: 'uang-makan',
    label: 'Uang Makan',
    badge: '19 Hari Kerja',
    icon: Utensils,
    activeColor: 'bg-amber-500 text-white shadow-xs',
    iconColor: 'text-amber-500',
    desc: 'PNS & PPPK'
  },
  {
    id: 'guru-besar',
    label: 'Tunjangan Guru Besar',
    badge: 'Pensiun 70 Thn',
    icon: GraduationCap,
    activeColor: 'bg-purple-600 text-white shadow-xs',
    iconColor: 'text-purple-600',
    desc: 'Kehormatan GB'
  },
  {
    id: 'serdos',
    label: 'Tunjangan Serdos',
    badge: 'Sertifikasi Dosen',
    icon: Award,
    activeColor: 'bg-emerald-600 text-white shadow-xs',
    iconColor: 'text-emerald-600',
    desc: 'PNS & Non-PNS'
  },
  {
    id: 'fungsional',
    label: 'Tunjangan Fungsional',
    badge: 'Jabatan Dosen',
    icon: Briefcase,
    activeColor: 'bg-blue-600 text-white shadow-xs',
    iconColor: 'text-blue-600',
    desc: 'Dosen Aktif'
  },
  {
    id: 'gaji-pns',
    label: 'Gaji Pokok & Melekat',
    badge: '14 Bulan (THR+G13)',
    icon: CreditCard,
    activeColor: 'bg-indigo-600 text-white shadow-xs',
    iconColor: 'text-indigo-600',
    desc: 'PNS & PPPK'
  }
];

function DanaPemerintahContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabKey | null;
  const initialTab: TabKey = tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'uang-makan';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: TabKey) => {
    setActiveTab(tabId);
    router.replace(`/dana-pemerintah?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900">
      
      {/* UNIFIED TOP BANNER & TABS (DESIGN SYSTEM STANDARDS) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 via-sky-600 to-emerald-600 p-2.5 rounded-xl text-white shadow-2xs">
              <Landmark size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-none">
                  Kalkulasi Gaji & Tunjangan Pegawai
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Dana Pemerintah TA 2026
                </span>
              </div>
              <p className="text-gray-500 font-medium text-xs mt-1">
                Kalkulasi kebutuhan belanja pegawai (uang makan, tunjangan kehormatan GB, serdos, fungsional & gaji pokok).
              </p>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION: GAYA 4 MASTER SUITE 4-COLUMN NAVIGATION CARD (DESIGN SYSTEM) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs select-none border min-h-[48px] transition-all cursor-pointer text-left ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 text-white shadow-md shadow-blue-200/70 border-blue-500 ring-1 ring-blue-500/40 scale-[1.01]' 
                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Icon size={16} />
                </div>
                <div className="flex flex-col items-start min-w-0 pr-1 gap-0.5">
                  <span className="line-clamp-1 font-bold tracking-tight text-[12px] leading-tight">
                    {tab.label}
                  </span>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider leading-none ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div>
        {activeTab === 'uang-makan' && <AnggaranUangMakanTab />}
        {activeTab === 'guru-besar' && <TunjanganGuruBesarTab />}
        {activeTab === 'serdos' && <TunjanganSerdosTab />}
        {activeTab === 'fungsional' && <TunjanganFungsionalTab />}
        {activeTab === 'gaji-pns' && <GajiPnsTab />}
      </div>

    </div>
  );
}

export default function DanaPemerintahPage() {
  return (
    <Suspense fallback={<TabLoading />}>
      <DanaPemerintahContent />
    </Suspense>
  );
}
