'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  History, FileText, ChevronRight, Building2, Calendar, TrendingUp, 
  Search, Paperclip, CheckCircle2, AlertCircle, XCircle, Clock, 
  Trash2, Filter, Sparkles, Layers, Tag
} from 'lucide-react';

export default function RiwayatList({ onLoadAnalisis, setActiveTab }: { onLoadAnalisis: (id_analisis: string) => void, setActiveTab: (tab: string) => void }) {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [sortBy, setSortBy] = useState('terbaru');

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

  const fetchRiwayat = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('app_analisis_utama')
      .select('id_analisis, no_surat, tanggal_surat, perihal, created_at, unit_pengirim, total_anggaran, total_realisasi, persen_serapan, link_lampiran, keputusan, nominal_disetujui, analisis_html')
      .order('created_at', { ascending: false });
    
    if (data) {
      const processed = data.map(r => {
         let keputusan = r.keputusan;
         let nominalDisetujui = r.nominal_disetujui;
         let subyekSimaster = '';
         if (r.analisis_html) {
            try {
               const parsed = JSON.parse(r.analisis_html);
               if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
               if (!nominalDisetujui && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
               if (parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
            } catch(e) {}
         }
         return {
            ...r,
            subyek_persuratan_simaster: (r as any).subyek_persuratan_simaster || subyekSimaster || '',
            keputusan: keputusan || 'diajukan',
            nominal_disetujui: nominalDisetujui || '0'
         };
      });
      setRiwayat(processed);
      setFiltered(processed);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  useEffect(() => {
    let result = [...riwayat];

    // Search filter
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(r => 
        (r.no_surat && r.no_surat.toLowerCase().includes(lower)) || 
        (r.perihal && r.perihal.toLowerCase().includes(lower)) ||
        (r.unit_pengirim && r.unit_pengirim.toLowerCase().includes(lower)) ||
        (r.subyek_persuratan_simaster && r.subyek_persuratan_simaster.toLowerCase().includes(lower)) ||
        (r.keputusan && r.keputusan.toLowerCase().includes(lower))
      );
    }

    // Status filter
    if (statusFilter !== 'semua') {
      result = result.filter(r => (r.keputusan || 'diajukan').toLowerCase() === statusFilter.toLowerCase());
    }

    // Sorting
    if (sortBy === 'terlama') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'nominal_tertinggi') {
      result.sort((a, b) => parseNum(b.total_anggaran) - parseNum(a.total_anggaran));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFiltered(result);
  }, [search, statusFilter, sortBy, riwayat]);

  const handleDelete = async (id_analisis: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus arsip analisis ini (${id_analisis})?\nData realisasi dan pagu historis terkait juga akan dihapus.`)) return;

    try {
      await supabase.from('app_detail_realisasi').delete().eq('id_analisis', id_analisis);
      await supabase.from('app_pagu_historis').delete().eq('id_analisis', id_analisis);
      const { error } = await supabase.from('app_analisis_utama').delete().eq('id_analisis', id_analisis);

      if (error) throw error;
      setRiwayat(prev => prev.filter(r => r.id_analisis !== id_analisis));
      alert("Arsip analisis berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Metrics summary
  const totalUsulanRp = riwayat.reduce((acc, r) => acc + parseNum(r.total_anggaran), 0);
  const totalDisetujuiRp = riwayat.reduce((acc, r) => acc + parseNum(r.nominal_disetujui), 0);
  const totalDisetujuiCount = riwayat.filter(r => (r.keputusan || '').includes('disetujui')).length;

  const getStatusBadge = (status: string) => {
     const st = (status || 'diajukan').toLowerCase();
     if (st === 'disetujui semua') {
        return (
           <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-black uppercase tracking-wider border border-emerald-200 shadow-sm">
              <CheckCircle2 size={13}/> Disetujui Semua
           </span>
        );
     }
     if (st === 'disetujui sebagian') {
        return (
           <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[11px] font-black uppercase tracking-wider border border-indigo-200 shadow-sm">
              <AlertCircle size={13}/> Disetujui Sebagian
           </span>
        );
     }
     if (st === 'ditolak') {
        return (
           <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-[11px] font-black uppercase tracking-wider border border-rose-200 shadow-sm">
              <XCircle size={13}/> Ditolak
           </span>
        );
     }
     return (
        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-black uppercase tracking-wider border border-amber-200 shadow-sm">
           <Clock size={13}/> Diajukan
        </span>
     );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-20">
      
      {/* HERO HEADER SECTION */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-[3rem] p-8 lg:p-10 overflow-hidden shadow-2xl border border-white/10 shrink-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/15 rounded-full blur-[90px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center border-b border-white/10 pb-8">
            <div>
               <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold w-fit mb-3 border border-indigo-400/30">
                  <Sparkles size={14} className="text-amber-400" /> Database Arsip Analisis Resmi UGM
               </div>
               <h2 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 tracking-tight">
                  <History className="text-indigo-400" size={36}/> Arsip & Riwayat Analisis Pagu
               </h2>
               <p className="text-slate-300 font-medium text-sm mt-1">Kelola, tinjau, dan ekspor kembali dokumen nota analisis usulan tambah pagu yang telah tersimpan.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchRiwayat} 
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition-all border border-white/20 backdrop-blur-md flex items-center gap-2"
                title="Refresh Data"
              >
                <History size={16} /> Refresh
              </button>
            </div>
          </div>

          {/* METRICS STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                   <Layers size={14} className="text-indigo-400" /> Total Arsip
                </div>
                <div className="text-2xl lg:text-3xl font-black text-white font-mono">{riwayat.length} <span className="text-xs font-normal text-slate-400 font-sans">Dokumen</span></div>
             </div>
             
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                   <TrendingUp size={14} className="text-emerald-400" /> Total Usulan Pagu
                </div>
                <div className="text-lg lg:text-xl font-black text-emerald-400 font-mono">Rp {formatRp(totalUsulanRp)}</div>
             </div>

             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                   <CheckCircle2 size={14} className="text-amber-400" /> Total Disetujui
                </div>
                <div className="text-lg lg:text-xl font-black text-amber-300 font-mono">Rp {formatRp(totalDisetujuiRp)}</div>
             </div>

             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                   <CheckCircle2 size={14} className="text-blue-400" /> Tingkat Persetujuan
                </div>
                <div className="text-2xl lg:text-3xl font-black text-blue-300 font-mono">
                   {riwayat.length > 0 ? Math.round((totalDisetujuiCount / riwayat.length) * 100) : 0}%
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Cari perihal, no surat, subyek simaster, unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
          />
          {search && (
             <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600">Clear</button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {/* Status Quick Filters */}
           <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl border border-gray-200">
              {[
                { id: 'semua', label: 'Semua' },
                { id: 'disetujui semua', label: 'Disetujui 100%' },
                { id: 'disetujui sebagian', label: 'Sebagian' },
                { id: 'ditolak', label: 'Ditolak' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === tab.id
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
           </div>

           {/* Sorting Dropdown */}
           <select 
             value={sortBy}
             onChange={e => setSortBy(e.target.value)}
             className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
           >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="nominal_tertinggi">Nominal Usulan Tertinggi</option>
           </select>
        </div>
      </div>

      {/* LIST GRID SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
         {loading ? (
           <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
              <FileText size={64} className="opacity-20 mb-4" />
              <h3 className="text-xl font-bold text-gray-700">Tidak ada data arsip yang cocok.</h3>
              <p className="font-medium text-sm mt-2">Coba ubah filter status atau kata kunci pencarian Anda.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {filtered.map((r, i) => (
               <div 
                 key={r.id_analisis || i} 
                 className="bg-white rounded-[2.5rem] border border-gray-200/80 p-6 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
               >
                 {/* Top Accent Gradient */}
                 <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                 <div>
                    {/* Header Row */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                       <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold">
                             <Calendar size={12} className="text-indigo-500" /> {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          {getStatusBadge(r.keputusan)}
                       </div>

                       <div className="flex items-center gap-1">
                          {r.link_lampiran && (
                            <button 
                              onClick={() => window.open(r.link_lampiran, '_blank')}
                              className="p-2 bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-xl transition-all border border-gray-200"
                              title="Lihat File PDF Lampiran Asli"
                            >
                               <Paperclip size={15}/>
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleDelete(r.id_analisis, e)}
                            className="p-2 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-xl transition-all border border-gray-200"
                            title="Hapus Arsip Analisis"
                          >
                             <Trash2 size={15}/>
                          </button>
                       </div>
                    </div>

                    {/* Subyek Simaster Tag (If available) */}
                    {r.subyek_persuratan_simaster && (
                       <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-xl w-fit mb-3 border border-amber-200/60">
                          <Tag size={12} className="text-amber-600 shrink-0" /> <span className="truncate">Simaster: {r.subyek_persuratan_simaster}</span>
                       </div>
                    )}

                    {/* Title & No Surat */}
                    <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                       {r.perihal || 'Tanpa Perihal'}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 mb-5 flex items-center gap-1.5 font-mono">
                       <FileText size={13} className="text-gray-400" /> {r.no_surat || 'Tanpa No Surat'}
                    </p>

                    {/* Unit & Financial Box */}
                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 flex flex-col gap-3">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Building2 size={15} className="text-indigo-500 shrink-0" /> <span className="truncate">{r.unit_pengirim || '-'}</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                          <div>
                             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">Nominal Usulan:</span>
                             <span className="text-slate-900 font-mono font-black text-sm block">
                                Rp {formatRp(r.total_anggaran)}
                             </span>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 block mb-0.5">Disetujui Pimpinan:</span>
                             <span className="text-emerald-600 font-mono font-black text-sm block">
                                Rp {formatRp(r.nominal_disetujui)}
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                       onClick={() => {
                          onLoadAnalisis(r.id_analisis);
                          setTimeout(() => setActiveTab('form'), 200);
                       }}
                       className="py-3 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                       Buka Form <ChevronRight size={14} />
                    </button>
                    <button 
                       onClick={() => {
                          onLoadAnalisis(r.id_analisis);
                          setTimeout(() => setActiveTab('pdf'), 200);
                       }}
                       className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                       <FileText size={14} /> Preview PDF
                    </button>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
