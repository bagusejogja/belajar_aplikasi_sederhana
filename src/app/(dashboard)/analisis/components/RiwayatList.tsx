'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { History, FileText, ChevronRight, Building2, Calendar, TrendingUp, Search, Paperclip, CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

export default function RiwayatList({ onLoadAnalisis, setActiveTab }: { onLoadAnalisis: (id_analisis: string) => void, setActiveTab: (tab: string) => void }) {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return str;
    let s = (str || '0').toString().trim();
    if (!s.includes(',') && s.includes('.')) {
       const parts = s.split('.');
       if (parts.length === 2 && parts[0].length > 3) {
          return parseFloat(s);
       }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };

  const formatRp = (val: any) => {
    const num = parseNum(val);
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
  };

  useEffect(() => {
    const fetchRiwayat = async () => {
      const { data } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, tanggal_surat, perihal, created_at, unit_pengirim, total_anggaran, total_realisasi, persen_serapan, link_lampiran, keputusan, nominal_disetujui, analisis_html')
        .order('created_at', { ascending: false });
      
      if (data) {
        const processed = data.map(r => {
           let keputusan = r.keputusan;
           let nominalDisetujui = r.nominal_disetujui;
           if (!keputusan && r.analisis_html) {
              try {
                 const parsed = JSON.parse(r.analisis_html);
                 if (parsed.keputusan) keputusan = parsed.keputusan;
                 if (parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
              } catch(e) {}
           }
           return {
              ...r,
              keputusan: keputusan || 'diajukan',
              nominal_disetujui: nominalDisetujui || '0'
           };
        });
        setRiwayat(processed);
        setFiltered(processed);
      }
      setLoading(false);
    };
    fetchRiwayat();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(riwayat);
    } else {
      const lower = search.toLowerCase();
      setFiltered(riwayat.filter(r => 
        (r.no_surat && r.no_surat.toLowerCase().includes(lower)) || 
        (r.perihal && r.perihal.toLowerCase().includes(lower)) ||
        (r.unit_pengirim && r.unit_pengirim.toLowerCase().includes(lower)) ||
        (r.keputusan && r.keputusan.toLowerCase().includes(lower))
      ));
    }
  }, [search, riwayat]);

  const getStatusBadge = (status: string) => {
     const st = (status || 'diajukan').toLowerCase();
     if (st === 'disetujui semua') {
        return (
           <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-200 shadow-sm">
              <CheckCircle2 size={12}/> Disetujui Semua
           </span>
        );
     }
     if (st === 'disetujui sebagian') {
        return (
           <span className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-200 shadow-sm">
              <AlertCircle size={12}/> Disetujui Sebagian
           </span>
        );
     }
     if (st === 'ditolak') {
        return (
           <span className="flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-black uppercase tracking-wider border border-rose-200 shadow-sm">
              <XCircle size={12}/> Ditolak
           </span>
        );
     }
     return (
        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200 shadow-sm">
           <Clock size={12}/> Diajukan
        </span>
     );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-20">
      
      {/* HEADER SECTION */}
      <div className="relative bg-slate-900 rounded-[3rem] p-8 lg:p-10 overflow-hidden shadow-xl border border-white/10 shrink-0">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 items-center">
          <div>
             <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight mb-2">
                <History className="text-indigo-400" size={32}/> Arsip Analisis Pagu
             </h2>
             <p className="text-slate-400 font-medium">Temukan dan kelola kembali dokumen analisis yang telah disimpan sebelumnya.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari no surat, perihal, unit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* LIST SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {loading ? (
           <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
              <FileText size={64} className="opacity-20 mb-4" />
              <h3 className="text-xl font-bold text-gray-700">Tidak ada data arsip.</h3>
              <p className="font-medium text-sm mt-2">Belum ada riwayat analisis yang tersimpan atau cocok dengan pencarian.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {filtered.map((r, i) => (
               <div 
                 key={i} 
                 className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group flex flex-col justify-between"
               >
                 <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                       <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                             <Calendar size={12} /> {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          {getStatusBadge(r.keputusan)}
                       </div>
                       <div className="flex gap-2">
                         {r.link_lampiran && (
                           <button 
                             onClick={() => window.open(r.link_lampiran, '_blank')}
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-indigo-100"
                             title="Lihat File Lampiran Asli"
                           >
                              <Paperclip size={14}/> File
                           </button>
                         )}
                         <button 
                           onClick={() => {
                              onLoadAnalisis(r.id_analisis);
                              setTimeout(() => setActiveTab('pdf'), 300);
                           }}
                           className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-emerald-100"
                         >
                            <FileText size={14}/> PDF
                         </button>
                       </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                       {r.perihal || 'Tanpa Perihal'}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mb-5 flex items-center gap-1.5">
                       <FileText size={12} /> {r.no_surat || 'Tanpa No Surat'}
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100/50 flex flex-col gap-2.5">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Building2 size={14} className="text-indigo-400 shrink-0" /> <span className="truncate">{r.unit_pengirim || '-'}</span>
                       </div>
                       <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 flex items-center gap-1.5">
                             <TrendingUp size={14} className="text-emerald-500" /> Usulan:
                          </span>
                          <span className="text-slate-900 font-mono font-black text-sm">
                             Rp {formatRp(r.total_anggaran)}
                          </span>
                       </div>
                       {(r.keputusan !== 'diajukan' || parseNum(r.nominal_disetujui) > 0) && (
                          <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200/60">
                             <span className="text-indigo-600 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-indigo-500" /> Disetujui:
                             </span>
                             <span className="text-emerald-600 font-mono font-black text-sm">
                                Rp {formatRp(r.nominal_disetujui)}
                             </span>
                          </div>
                       )}
                    </div>
                 </div>

                 <button 
                    onClick={() => onLoadAnalisis(r.id_analisis)}
                    className="w-full py-3 bg-white border-2 border-indigo-50 hover:bg-indigo-600 hover:border-indigo-600 text-indigo-600 hover:text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                 >
                    Buka Data Form <ChevronRight size={16} />
                 </button>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
