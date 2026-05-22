'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, ShieldCheck, FileText, BarChart3, 
  ArrowRight, Clock, Users, ArrowUpRight,
  LayoutDashboard, TrendingUp, Search, Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PremiumDashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    totalNominal: 0,
    totalSurat: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const [pendingRes, suratRes, userRes] = await Promise.all([
        supabase.from('transactions').select('uang_masuk, uang_keluar').eq('disetujui', 'Menunggu'),
        supabase.from('surat_revisi').select('id', { count: 'exact' }),
        supabase.from('app_users').select('id', { count: 'exact' })
      ]);

      const pendingData = pendingRes.data || [];
      const totalNominal = pendingData.reduce((acc, curr) => acc + (Number(curr.uang_masuk) || Number(curr.uang_keluar) || 0), 0);

      setStats({
        pending: pendingData.length,
        totalNominal: totalNominal,
        totalSurat: suratRes.count || 0,
        totalUsers: userRes.count || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const menuCards = [
    {
      title: "Verifikasi Transaksi",
      desc: "Periksa bukti fisik dan setujui usulan pengeluaran.",
      icon: <ShieldCheck size={28} />,
      link: "/verifikasi",
      color: "bg-indigo-600",
      stats: `${stats.pending} Pending`,
      badge: "Priority"
    },
    {
      title: "Arsip & Surat",
      desc: "Manajemen dokumen revisi dan korespondensi.",
      icon: <FileText size={28} />,
      link: "/surat",
      color: "bg-emerald-600",
      stats: `${stats.totalSurat} Dokumen`,
      badge: "Audit Ready"
    },
    {
      title: "Laporan Visual",
      desc: "Lihat ringkasan penggunaan kas dengan foto bukti.",
      icon: <BarChart3 size={28} />,
      link: "/report-photo",
      color: "bg-amber-600",
      stats: "Visualized",
      badge: "Real-time"
    },
    {
      title: "Manajemen User",
      desc: "Kelola hak akses dan aktor sistem.",
      icon: <Users size={28} />,
      link: "/users",
      color: "bg-rose-600",
      stats: `${stats.totalUsers} Aktif`,
      badge: "Secure"
    }
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Top Banner / Time */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <LayoutDashboard size={20} className="text-indigo-600" />
          </div>
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Command Center</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current System Time</p>
            <p className="text-sm font-bold text-gray-700">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-indigo-600 transition-colors">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Hero Welcome */}
      <div className="relative bg-slate-900 rounded-[4rem] p-12 lg:p-20 overflow-hidden shadow-2xl mb-12 group">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 border border-white/20 rounded-full text-indigo-300 text-[11px] font-black uppercase tracking-[0.3em] mb-8 backdrop-blur-md"
            >
              <Sparkles size={14} className="text-amber-400" /> Executive Portal v2.0
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none mb-8"
            >
              Apps<span className="text-indigo-500"> Bersama</span> <br />
              <span className="text-3xl lg:text-4xl font-light text-slate-400 italic">Financial Control Center</span>
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg font-medium max-w-md leading-relaxed mb-10"
            >
              Pusat kendali keuangan terpadu. Selamat bekerja dan pantau setiap transaksi dengan presisi tinggi melalui menu navigasi di samping.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] group/card transition-all"
            >
              <TrendingUp className="text-emerald-400 mb-4" size={32} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pending Volume</p>
              <h3 className="text-3xl font-black text-white">Rp {stats.totalNominal.toLocaleString('id-ID')}</h3>
              <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                <ArrowUpRight size={12} /> {stats.pending} Transaksi
              </p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] mt-8 transition-all"
            >
              <Clock className="text-amber-400 mb-4" size={32} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">SLA Performance</p>
              <h3 className="text-3xl font-black text-white">98.4%</h3>
              <p className="text-[10px] text-amber-500 font-bold mt-2 uppercase tracking-widest">On Schedule</p>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}
