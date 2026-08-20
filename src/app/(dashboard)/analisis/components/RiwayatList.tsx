'use client';
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import { 
  History, FileText, ChevronDown, ChevronUp, Building2, Calendar, TrendingUp, 
  Search, CheckCircle2, AlertCircle, XCircle, Clock, 
  Trash2, Sparkles, Layers, Tag, Eye, Edit3, X, FileSpreadsheet, Paperclip, ExternalLink,
  Printer, FileCheck, Landmark, BarChart3, Check, DollarSign, ListFilter, ArrowRight, PieChart
} from 'lucide-react';

export default function RiwayatList({ onLoadAnalisis, setActiveTab }: { onLoadAnalisis: (id_analisis: string) => void, setActiveTab: (tab: string) => void }) {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [sortBy, setSortBy] = useState('terbaru');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Lazy loaded details, historis, and unit history per row
  const [expandedDetails, setExpandedDetails] = useState<Record<string, { details: any[]; historis: any[] }>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [activeTabMap, setActiveTabMap] = useState<Record<string, string>>({});
  const [unitHistoryMap, setUnitHistoryMap] = useState<Record<string, any[]>>({});

  // Pop Up View Detail Modal State (Triggered by Eye Icon 👁️)
  const [viewModalData, setViewModalData] = useState<any | null>(null);

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
    try {
      const [ { data: listAnalisis }, { data: listTambahPagu } ] = await Promise.all([
        supabase.from('app_analisis_utama').select('*').order('created_at', { ascending: false }),
        supabase.from('tambah_pagu').select('id_analisis, no_surat_pengajuan, no_surat_tanggapan')
      ]);

      const importedIds = new Set<string>();
      const usedNoSuratSet = new Set<string>();
      if (listTambahPagu) {
        listTambahPagu.forEach(tp => {
          if (tp.id_analisis) importedIds.add(tp.id_analisis);
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
        });
      }

      if (listAnalisis) {
        const processed = listAnalisis.map(r => {
           let keputusan = r.keputusan;
           let nominalDisetujui = r.nominal_disetujui;
           let subyekSimaster = '';
           let ringkasanAi = '';
           let ketKeputusan = '';
           let rekomendasiAi = '';
           let suratBalasanHtml = '';
           if (r.analisis_html) {
              try {
                 const parsed = JSON.parse(r.analisis_html);
                 if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
                 if (!nominalDisetujui && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
                 if (parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
                 if (parsed.analisis) ringkasanAi = parsed.analisis;
                 if (parsed.keterangan_keputusan) ketKeputusan = parsed.keterangan_keputusan;
                 if (parsed.rekomendasi) rekomendasiAi = parsed.rekomendasi;
                 if (parsed.surat_balasan_html) suratBalasanHtml = parsed.surat_balasan_html;
              } catch(e) {
                 ringkasanAi = r.analisis_html;
              }
           }
           const cleanNoSurat = (r.no_surat || '').trim().toLowerCase();
           return {
              ...r,
              is_imported: importedIds.has(r.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)),
              subyek_persuratan_simaster: (r as any).subyek_persuratan_simaster || subyekSimaster || '',
              ringkasan_ai: ringkasanAi || r.ringkasan_ai || '',
              rekomendasi_ai: rekomendasiAi,
              surat_balasan_html: suratBalasanHtml,
              keterangan_keputusan: ketKeputusan,
              keputusan: keputusan || 'diajukan',
              nominal_disetujui: nominalDisetujui || '0'
           };
        });
        setRiwayat(processed);
        setFiltered(processed);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  useEffect(() => {
    let result = [...riwayat];

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

    if (statusFilter !== 'semua') {
      result = result.filter(r => (r.keputusan || 'diajukan').toLowerCase() === statusFilter.toLowerCase());
    }

    if (sortBy === 'terlama') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'nominal_tertinggi') {
      result.sort((a, b) => parseNum(b.total_anggaran) - parseNum(a.total_anggaran));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFiltered(result);
  }, [search, statusFilter, sortBy, riwayat]);

  const exportToExcel = () => {
    if (filtered.length === 0) return alert("Tidak ada data untuk di-export");

    const mappedExcelData = filtered.map((r, index) => {
      const totalUsulan = parseNum(r.total_anggaran);
      const totalDisetujui = parseNum(r.nominal_disetujui);
      return {
        'No': index + 1,
        'ID Analisis': r.id_analisis,
        'Tanggal Analisis': new Date(r.created_at).toLocaleDateString('id-ID'),
        'No Surat': r.no_surat || '-',
        'Unit Kerja': r.unit_pengirim || '-',
        'Subyek Simaster': r.subyek_persuratan_simaster || '-',
        'Perihal': r.perihal || '-',
        'Nominal Diajukan (Rp)': totalUsulan,
        'Nominal Disetujui (Rp)': totalDisetujui,
        'Keputusan': r.keputusan || 'Diajukan',
        'Status Impor': r.is_imported ? 'Sudah Diambil' : 'Belum Diambil'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedExcelData);
    
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 30 },
      { wch: 35 },
      { wch: 30 },
      { wch: 45 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Analisis Pagu");

    const fileName = `Riwayat_Analisis_Pagu_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDelete = async (id_analisis: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus arsip analisis ini (${id_analisis})?\nData realisasi dan pagu historis terkait juga akan dihapus.`)) return;

    try {
      await supabase.from('app_detail_realisasi').delete().eq('id_analisis', id_analisis);
      await supabase.from('app_pagu_historis').delete().eq('id_analisis', id_analisis);
      const { error } = await supabase.from('app_analisis_utama').delete().eq('id_analisis', id_analisis);

      if (error) throw error;
      setRiwayat(prev => prev.filter(r => r.id_analisis !== id_analisis));
      if (viewModalData?.id_analisis === id_analisis) setViewModalData(null);
      alert("Arsip analisis berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const toggleRow = async (id: string) => {
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
      if (!activeTabMap[id]) {
        setActiveTabMap(prev => ({ ...prev, [id]: 'substansi' }));
      }
      const targetRow = riwayat.find(r => r.id_analisis === id);
      if (!expandedDetails[id]) {
        setLoadingDetails(prev => ({ ...prev, [id]: true }));
        try {
          const [detailRes, historisRes, unitHistRes] = await Promise.all([
            supabase.from('app_detail_realisasi').select('*').eq('id_analisis', id).order('no_urut', { ascending: true }),
            supabase.from('app_pagu_historis').select('*').eq('id_analisis', id).order('tahun', { ascending: true }),
            targetRow?.unit_pengirim 
              ? supabase.from('app_analisis_utama').select('id_analisis, no_surat, perihal, total_anggaran, nominal_disetujui, keputusan, created_at').ilike('unit_pengirim', `%${targetRow.unit_pengirim}%`).order('created_at', { ascending: false })
              : Promise.resolve({ data: [] })
          ]);

          setExpandedDetails(prev => ({
            ...prev,
            [id]: {
              details: detailRes.data || [],
              historis: historisRes.data || []
            }
          }));

          if (unitHistRes.data) {
            setUnitHistoryMap(prev => ({
              ...prev,
              [id]: unitHistRes.data.filter((u: any) => u.id_analisis !== id)
            }));
          }
        } catch (err) {
          console.error("Error fetching detail for row:", err);
        } finally {
          setLoadingDetails(prev => ({ ...prev, [id]: false }));
        }
      }
    }
  };

  const kpiMetrics = React.useMemo(() => {
    const totalCount = riwayat.length;
    const totalAnggaranUsulan = riwayat.reduce((acc, r) => acc + parseNum(r.total_anggaran), 0);

    const approvedSemua = riwayat.filter(r => {
      const st = (r.keputusan || '').toLowerCase();
      return st === 'disetujui semua' || st === 'disetujui 100%';
    });
    const approvedSemuaCount = approvedSemua.length;
    const approvedSemuaAnggaran = approvedSemua.reduce((acc, r) => acc + parseNum(r.nominal_disetujui), 0);

    const approvedSebagian = riwayat.filter(r => (r.keputusan || '').toLowerCase() === 'disetujui sebagian');
    const approvedSebagianCount = approvedSebagian.length;
    const approvedSebagianAnggaran = approvedSebagian.reduce((acc, r) => acc + parseNum(r.nominal_disetujui), 0);

    const rejected = riwayat.filter(r => {
      const st = (r.keputusan || '').toLowerCase();
      return st === 'ditolak' || st === 'diajukan';
    });
    const rejectedCount = rejected.length;
    const rejectedAnggaran = rejected.reduce((acc, r) => acc + parseNum(r.total_anggaran), 0);

    const approvedPct = totalCount > 0 ? Math.round((approvedSemuaCount / totalCount) * 100) : 0;

    return {
      totalCount,
      totalAnggaranUsulan,
      approvedSemuaCount,
      approvedSemuaAnggaran,
      approvedSebagianCount,
      approvedSebagianAnggaran,
      rejectedCount,
      rejectedAnggaran,
      approvedPct
    };
  }, [riwayat]);

  const getStatusBadge = (status: string) => {
     const st = (status || 'diajukan').toLowerCase();
     if (st === 'disetujui semua' || st === 'disetujui 100%') {
        return (
           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200">
              <CheckCircle2 size={12}/> Disetujui Semua
           </span>
        );
     }
     if (st === 'disetujui sebagian') {
        return (
           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-200">
              <AlertCircle size={12}/> Disetujui Sebagian
           </span>
        );
     }
     if (st === 'ditolak') {
        return (
           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-200">
              <XCircle size={12}/> Ditolak
           </span>
        );
     }
     return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200">
           <Clock size={12}/> Diajukan
        </span>
     );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-20">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">TOTAL USULAN ANGGARAN</span>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.totalAnggaranUsulan)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>{kpiMetrics.totalCount} Usulan Arsip</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">100%</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-1">DISETUJUI SEMUA (100%)</span>
            <div className="text-2xl font-black text-emerald-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.approvedSemuaAnggaran)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-emerald-700 flex items-center justify-between">
            <span>{kpiMetrics.approvedSemuaCount} Item</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
              {kpiMetrics.approvedPct}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-indigo-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">DISETUJUI SEBAGIAN</span>
            <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.approvedSebagianAnggaran)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-indigo-700 flex items-center justify-between">
            <span>{kpiMetrics.approvedSebagianCount} Item</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Sebagian</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block mb-1">DITOLAK / DIAJUKAN</span>
            <div className="text-2xl font-black text-rose-700 font-mono tracking-tight">
              Rp {formatRp(kpiMetrics.rejectedAnggaran)}
            </div>
          </div>
          <div className="mt-4 text-xs font-bold text-rose-700 flex items-center justify-between">
            <span>{kpiMetrics.rejectedCount} Item</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">Proses</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
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

           <select 
             value={sortBy}
             onChange={e => setSortBy(e.target.value)}
             className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer mr-2"
           >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="nominal_tertinggi">Nominal Usulan Tertinggi</option>
           </select>
           <button
             onClick={exportToExcel}
             className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl px-4 py-3 shadow-sm transition-all flex items-center gap-1.5"
             title="Download Excel Seluruh Riwayat Analisis"
           >
             <FileSpreadsheet size={14} />
             <span>Export Excel</span>
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-200/80 shadow-sm overflow-hidden flex-1">
         {loading ? (
           <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-gray-400 py-20 bg-white rounded-[3rem]">
              <FileText size={64} className="opacity-20 mb-4" />
              <h3 className="text-xl font-bold text-gray-700">Tidak ada data arsip yang cocok.</h3>
              <p className="font-medium text-sm mt-2">Coba ubah filter status atau kata kunci pencarian Anda.</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-xs text-left border-collapse table-fixed">
               <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[11px] tracking-wider border-b border-slate-200">
                 <tr>
                   <th className="px-3 py-4 text-center w-12">#</th>
                   <th className="px-4 py-4 w-auto min-w-[240px]">Unit Kerja & Detail Surat Pengajuan</th>
                   <th className="px-4 py-4 text-right w-48">Nominal Usulan & Disetujui</th>
                   <th className="px-4 py-4 text-center w-36">Status Keputusan</th>
                   <th className="px-4 py-4 text-center w-32">Aksi / Kontrol</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {filtered.map((r, idx) => {
                   const isExpanded = expandedRowId === r.id_analisis;
                   const totalUsulan = parseNum(r.total_anggaran);
                   const totalDisetujui = parseNum(r.nominal_disetujui);

                   return (
                     <React.Fragment key={r.id_analisis || idx}>
                       <tr 
                         onClick={() => toggleRow(r.id_analisis)}
                         className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/40' : ''}`}
                       >
                         <td className="px-3 py-4 text-center font-bold text-slate-400 align-top pt-4">
                           <button 
                             type="button" 
                             className={`p-1.5 rounded-xl transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-500'}`}
                           >
                             {isExpanded ? <ChevronUp size={16} className="font-bold" /> : <ChevronDown size={16} />}
                           </button>
                           <div className="text-[10px] text-slate-400 mt-1 font-mono">{idx + 1}</div>
                         </td>

                         <td className="px-4 py-4 align-top">
                           <div className="space-y-1.5">
                             <div className="flex items-center gap-2">
                               <Building2 size={14} className="text-indigo-600 shrink-0" />
                               <span className="font-black text-slate-900 text-sm break-words">{r.unit_pengirim || 'Unit Kerja UGM'}</span>
                             </div>

                             {r.subyek_persuratan_simaster && (
                               <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                                 <Tag size={10} className="text-amber-600 shrink-0" />
                                 <span>Simaster: {r.subyek_persuratan_simaster}</span>
                               </div>
                             )}

                             <div className="text-slate-600 space-y-0.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                               <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-slate-700 font-bold">
                                 <span>📄 {r.no_surat || 'Tanpa No Surat'}</span>
                                 <span className="text-slate-400 font-normal text-[10px] shrink-0">
                                   {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                 </span>
                               </div>
                               <div className="text-[11px] font-medium text-slate-800 break-words line-clamp-2" title={r.perihal}>
                                 {r.perihal || 'Tanpa Perihal'}
                               </div>
                             </div>
                           </div>
                         </td>

                         <td className="px-4 py-4 text-right align-top font-mono">
                           <div className="space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                             <div>
                               <span className="text-[9px] uppercase font-bold text-slate-400 block">Usulan:</span>
                               <span className="text-amber-800 font-bold text-xs">
                                 Rp {formatRp(totalUsulan)}
                               </span>
                             </div>
                             <div className="pt-1 border-t border-slate-200/60">
                               <span className="text-[9px] uppercase font-bold text-emerald-600 block">Disetujui:</span>
                               <span className="text-emerald-700 font-black text-sm">
                                 Rp {formatRp(totalDisetujui)}
                               </span>
                             </div>
                           </div>
                         </td>

                          <td className="px-4 py-4 text-center align-top pt-5 space-y-1.5">
                            {getStatusBadge(r.keputusan)}
                            {r.is_imported && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                                  <Check size={10} className="text-emerald-600" /> Diambil
                                </span>
                              </div>
                            )}
                          </td>

                         <td className="px-4 py-4 text-center align-top pt-4" onClick={e => e.stopPropagation()}>
                           <div className="flex items-center justify-center gap-1.5">
                             <button
                               onClick={() => setViewModalData(r)}
                               className="p-2.5 bg-slate-900 hover:bg-black text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                               title="Lihat Detail & Preview PDF (Tombol Mata)"
                             >
                               <Eye size={15} />
                             </button>

                             <button
                               onClick={() => {
                                 onLoadAnalisis(r.id_analisis);
                                 setTimeout(() => setActiveTab('form'), 200);
                               }}
                               className="p-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl transition-all border border-indigo-200 shadow-sm"
                               title="Edit & Buka Form Analisis"
                             >
                               <Edit3 size={15} />
                             </button>

                             <button
                               onClick={(e) => handleDelete(r.id_analisis, e)}
                               className="p-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all border border-rose-200 shadow-sm"
                               title="Hapus Arsip"
                             >
                               <Trash2 size={15} />
                             </button>
                           </div>
                         </td>
                       </tr>

                       {isExpanded && (
                         <tr className="bg-indigo-50/30 border-b border-slate-200">
                           <td colSpan={5} className="px-2 sm:px-4 py-4 max-w-0">
                             <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300 w-full max-w-full">
                               
                               <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
                                     <Sparkles size={20} />
                                   </div>
                                   <div>
                                     <div className="flex items-center gap-2 flex-wrap">
                                       <span className="font-black text-sm text-white font-mono">
                                         {r.no_surat || r.id_analisis}
                                       </span>
                                       {r.subyek_persuratan_simaster && (
                                         <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold">
                                           Simaster: {r.subyek_persuratan_simaster}
                                         </span>
                                       )}
                                     </div>
                                     <p className="text-xs text-slate-300 font-medium mt-0.5">
                                       {r.unit_pengirim || 'Unit Kerja UGM'} • Tanggal: {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                     </p>
                                   </div>
                                 </div>

                                 <div className="flex items-center gap-2">
                                   {getStatusBadge(r.keputusan)}
                                   {r.is_imported && (
                                     <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider">
                                       <Check size={10} className="text-emerald-400" /> Sudah Diambil ke Tambah Pagu
                                     </span>
                                   )}
                                   <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                                     ID: {r.id_analisis}
                                   </span>
                                 </div>
                               </div>

                               <div className="p-4 sm:p-5 bg-slate-50/60 border-b border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
                                 <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Nominal Diajukan</span>
                                   <div className="text-base sm:text-lg font-black font-mono text-amber-800">
                                     Rp {formatRp(totalUsulan)}
                                   </div>
                                 </div>

                                 <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">Nominal Disetujui</span>
                                   <div className="text-base sm:text-lg font-black font-mono text-emerald-800">
                                     Rp {formatRp(totalDisetujui)}
                                   </div>
                                 </div>

                                 <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">Rasio Persetujuan</span>
                                   <div className="text-base sm:text-lg font-black font-mono text-indigo-900 flex items-center justify-between">
                                     <span>{totalUsulan > 0 ? Math.round((totalDisetujui / totalUsulan) * 100) : 0}%</span>
                                     <span className="text-[10px] font-sans font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                       {totalUsulan === totalDisetujui ? '100% Penuh' : `Selisih Rp ${formatRp(Math.abs(totalUsulan - totalDisetujui))}`}
                                     </span>
                                   </div>
                                 </div>

                                 <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Rincian Belanja</span>
                                   <div className="text-base sm:text-lg font-black text-slate-800 flex items-center justify-between">
                                     <span>{expandedDetails[r.id_analisis]?.details?.length || 0} Item</span>
                                     <span className="text-[10px] font-sans font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                       {expandedDetails[r.id_analisis]?.historis?.length || 0} thn historis
                                     </span>
                                   </div>
                                 </div>
                               </div>

                               <div className="px-3 sm:px-4 pt-2.5 bg-white border-b border-slate-100 flex items-center gap-1 overflow-x-auto custom-scrollbar w-full max-w-full">
                                 {[
                                   { id: 'substansi', label: 'Substansi & AI', icon: Sparkles },
                                   { id: 'posisi_pagu', label: 'Posisi Pagu 2026', icon: PieChart },
                                   { id: 'pdf_lampiran', label: 'PDF Lampiran', icon: FileText },
                                   { id: 'histori_unit', label: `Histori Usulan (${unitHistoryMap[r.id_analisis]?.length || 0})`, icon: Building2 },
                                   { id: 'detail', label: `Rincian Belanja (${expandedDetails[r.id_analisis]?.details?.length || 0})`, icon: Layers },
                                   { id: 'rekomendasi', label: 'Rekomendasi', icon: FileCheck },
                                   { id: 'historis', label: `Historis Multi-Tahun (${expandedDetails[r.id_analisis]?.historis?.length || 0})`, icon: Landmark }
                                 ].map(tab => {
                                   const Icon = tab.icon;
                                   const active = (activeTabMap[r.id_analisis] || 'substansi') === tab.id;
                                   return (
                                     <button
                                       key={tab.id}
                                       onClick={() => setActiveTabMap(prev => ({ ...prev, [r.id_analisis]: tab.id }))}
                                       className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 shrink-0 whitespace-nowrap ${
                                         active 
                                           ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                                           : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                       }`}
                                     >
                                       <Icon size={14} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                                       <span className="whitespace-nowrap">{tab.label}</span>
                                     </button>
                                   );
                                 })}
                               </div>

                               <div className="p-4 sm:p-6 bg-white space-y-4">
                                 
                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'substansi' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                       <div className="flex items-center justify-between flex-wrap gap-2">
                                         <span className="text-[11px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                                           <Sparkles size={14} className="text-indigo-600" /> Ringkasan Substansi Usulan & Catatan AI
                                         </span>
                                         {(r.link_lampiran || r.file_lampiran) && (
                                           <a 
                                             href={r.link_lampiran || r.file_lampiran} 
                                             target="_blank" 
                                             rel="noreferrer" 
                                             className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                           >
                                             <Paperclip size={12} /> Buka PDF Lampiran Asli
                                           </a>
                                         )}
                                       </div>

                                       {r.ringkasan_ai ? (
                                         <div 
                                           className="prose prose-xs text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs break-words overflow-hidden [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                                           dangerouslySetInnerHTML={{ __html: r.ringkasan_ai }}
                                         />
                                       ) : (
                                         <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 italic">
                                           {r.perihal || 'Nota analisis usulan tambah pagu anggaran unit kerja UGM.'}
                                         </div>
                                       )}
                                     </div>

                                     {r.keterangan_keputusan && (
                                       <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 space-y-1.5">
                                         <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                                           <AlertCircle size={14} className="text-amber-600" /> Catatan Keputusan Pimpinan
                                         </span>
                                         <p className="text-xs text-amber-950 font-medium bg-white p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                                           {r.keterangan_keputusan}
                                         </p>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'posisi_pagu' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Kalkulasi posisi pagu 2026...
                                       </div>
                                     ) : (() => {
                                       const historisList = expandedDetails[r.id_analisis]?.historis || [];
                                       const row2026 = historisList.find((h: any) => h.tahun === '2026') || historisList[historisList.length - 1] || {};
                                       const totalRealisasiBelanja = (expandedDetails[r.id_analisis]?.details || []).reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0);
                                       const totalPagu2026 = parseNum(row2026.total_pagu || '0');
                                       const sisaKapasitas2026 = totalPagu2026 > 0 ? (totalPagu2026 - totalRealisasiBelanja) : 0;
                                       const nominalUsulan = parseNum(r.total_anggaran);

                                       return (
                                         <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                           <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                                             <span className="font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                               <PieChart size={15} className="text-indigo-600" /> Posisi Pagu Anggaran Tahun 2026 ({r.unit_pengirim || 'Unit Kerja'})
                                             </span>
                                             <span className="text-[10px] text-slate-400 font-mono">TA 2026</span>
                                           </div>

                                           <table className="w-full text-xs text-left">
                                             <tbody className="divide-y divide-slate-100 font-mono">
                                               <tr className="hover:bg-slate-50/80">
                                                 <td className="px-4 py-3 font-sans font-medium text-slate-700 w-1/2">Pagu Awal 2026</td>
                                                 <td className="px-4 py-3 text-right font-bold text-slate-900">Rp {formatRp(row2026.pagu_awal || '0')}</td>
                                               </tr>
                                               <tr className="hover:bg-slate-50/80">
                                                 <td className="px-4 py-3 font-sans font-medium text-slate-700">Pengalihan (+/-)</td>
                                                 <td className="px-4 py-3 text-right font-bold text-slate-900">Rp {formatRp(row2026.pengalihan || '0')}</td>
                                               </tr>
                                               {parseNum(row2026.tambah_pagu_penugasan) > 0 && (
                                                 <tr className="hover:bg-emerald-50/40 text-emerald-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Tambah Pagu Penugasan (+)</td>
                                                   <td className="px-4 py-3 text-right font-bold">+ Rp {formatRp(row2026.tambah_pagu_penugasan)}</td>
                                                 </tr>
                                               )}
                                               {parseNum(row2026.tambah_pagu_inisiatif) > 0 && (
                                                 <tr className="hover:bg-emerald-50/40 text-emerald-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Tambah Pagu Inisiatif (+)</td>
                                                   <td className="px-4 py-3 text-right font-bold">+ Rp {formatRp(row2026.tambah_pagu_inisiatif)}</td>
                                                 </tr>
                                               )}
                                               {parseNum(row2026.efisiensi) !== 0 && (
                                                 <tr className="hover:bg-rose-50/40 text-rose-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Efisiensi (-)</td>
                                                   <td className="px-4 py-3 text-right font-bold">- Rp {formatRp(Math.abs(parseNum(row2026.efisiensi)))}</td>
                                                 </tr>
                                               )}
                                               {parseNum(row2026.talangan) > 0 && (
                                                 <tr className="hover:bg-amber-50/40 text-amber-800">
                                                   <td className="px-4 py-3 font-sans font-bold">Talangan (+)</td>
                                                   <td className="px-4 py-3 text-right font-bold">+ Rp {formatRp(row2026.talangan)}</td>
                                                 </tr>
                                               )}
                                               <tr className="bg-indigo-50/60 font-black text-indigo-900">
                                                 <td className="px-4 py-3 font-sans">Pagu Terkini Sampai Saat Ini</td>
                                                 <td className="px-4 py-3 text-right text-sm">Rp {formatRp(totalPagu2026)}</td>
                                               </tr>
                                               <tr className="hover:bg-slate-50/80">
                                                 <td className="px-4 py-3 font-sans font-medium text-slate-700">Realisasi Belanja S.d. Saat Ini</td>
                                                 <td className="px-4 py-3 text-right font-bold text-slate-800">Rp {formatRp(totalRealisasiBelanja)}</td>
                                               </tr>
                                               <tr className="bg-emerald-50/80 font-black text-emerald-900">
                                                 <td className="px-4 py-3 font-sans">Sisa Kapasitas Pagu Anggaran</td>
                                                 <td className="px-4 py-3 text-right text-sm">Rp {formatRp(sisaKapasitas2026)}</td>
                                               </tr>
                                               <tr className="bg-amber-50/80 font-black text-amber-900 border-t-2 border-amber-200">
                                                 <td className="px-4 py-3 font-sans">Nominal Usulan Tambahan Pagu (Diajukan Surat Ini)</td>
                                                 <td className="px-4 py-3 text-right text-sm">Rp {formatRp(nominalUsulan)}</td>
                                               </tr>
                                             </tbody>
                                           </table>
                                         </div>
                                       );
                                     })()}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'pdf_lampiran' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {r.link_lampiran || r.file_lampiran ? (
                                       <div className="space-y-3">
                                         <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-200/80">
                                           <div className="flex items-center gap-2.5">
                                             <FileText size={18} className="text-indigo-600 shrink-0" />
                                             <div>
                                               <span className="font-bold text-xs text-indigo-900 block">
                                                 File PDF Lampiran Asli Surat Pengajuan ({r.no_surat || r.id_analisis})
                                               </span>
                                               <span className="text-[10px] text-slate-500 font-mono">
                                                 {r.unit_pengirim || 'Unit Kerja UGM'}
                                               </span>
                                             </div>
                                           </div>
                                           <a
                                             href={r.link_lampiran || r.file_lampiran}
                                             target="_blank"
                                             rel="noreferrer"
                                             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                                           >
                                             <ExternalLink size={13} /> Buka di Tab Baru
                                           </a>
                                         </div>

                                         <div className="rounded-2xl border border-slate-200/90 overflow-hidden shadow-inner bg-slate-900 h-[600px] relative">
                                           <iframe
                                             src={(r.link_lampiran || r.file_lampiran).includes('drive.google.com') ? (r.link_lampiran || r.file_lampiran).replace('/view', '/preview') : (r.link_lampiran || r.file_lampiran)}
                                             className="w-full h-full border-0"
                                             title="Pratinjau PDF Lampiran Asli"
                                           />
                                         </div>
                                       </div>
                                     ) : (
                                       <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                                         <FileText size={48} className="mx-auto text-slate-300" />
                                         <div className="space-y-1">
                                           <h4 className="font-bold text-sm text-slate-700">Belum Ada PDF Lampiran Terlampir</h4>
                                           <p className="text-xs text-slate-500 max-w-md mx-auto">
                                             Tidak ada URL atau file PDF lampiran asli yang terlampir pada pengajuan ini. Anda dapat mengunggah berkas pada menu Edit Form Analisis.
                                           </p>
                                         </div>
                                         <button
                                           onClick={() => {
                                             onLoadAnalisis(r.id_analisis);
                                             setTimeout(() => setActiveTab('form'), 200);
                                           }}
                                           className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1.5"
                                         >
                                           <Edit3 size={13} /> Upload Lampiran via Form Edit
                                         </button>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'histori_unit' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
                                       <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
                                         <Building2 size={14} className="text-indigo-600 shrink-0" /> Histori Usulan Tambah Pagu
                                       </span>
                                       <span className="text-[10px] text-slate-500 font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200 font-mono whitespace-nowrap shrink-0">
                                         {unitHistoryMap[r.id_analisis]?.length || 0} Arsip Terdahulu
                                       </span>
                                     </div>

                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Memuat rekam jejak usulan unit kerja...
                                       </div>
                                     ) : !unitHistoryMap[r.id_analisis]?.length ? (
                                       <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         Belum ada riwayat usulan tambah pagu sebelumnya untuk unit kerja ini.
                                       </div>
                                     ) : (
                                       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                         <table className="w-full text-xs text-left">
                                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                                             <tr>
                                               <th className="px-3 py-3 text-center w-10">No</th>
                                               <th className="px-4 py-3">No & Perihal Surat Pengajuan</th>
                                               <th className="px-4 py-3 text-right">Nominal Usulan</th>
                                               <th className="px-4 py-3 text-right">Nominal Disetujui</th>
                                               <th className="px-4 py-3 text-center">Status Keputusan</th>
                                               <th className="px-4 py-3 text-center w-24">Aksi</th>
                                             </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100 font-mono">
                                             {unitHistoryMap[r.id_analisis].map((h: any, i: number) => {
                                               const usulanNum = parseNum(h.total_anggaran);
                                               const disetujuiNum = parseNum(h.nominal_disetujui);
                                               return (
                                                 <tr key={h.id_analisis || i} className="hover:bg-slate-50/80">
                                                   <td className="px-3 py-3 text-center text-slate-400 font-bold font-sans">{i + 1}</td>
                                                   <td className="px-4 py-3 font-sans">
                                                     <div className="font-bold text-slate-800 break-words line-clamp-2">{h.perihal || 'Tanpa Perihal'}</div>
                                                     <div className="text-[10px] text-slate-400 font-mono">
                                                       📄 No: {h.no_surat || '-'} • {new Date(h.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                     </div>
                                                   </td>
                                                   <td className="px-4 py-3 text-right font-bold text-amber-800">Rp {formatRp(usulanNum)}</td>
                                                   <td className="px-4 py-3 text-right font-bold text-emerald-700">Rp {formatRp(disetujuiNum)}</td>
                                                   <td className="px-4 py-3 text-center font-sans">{getStatusBadge(h.keputusan)}</td>
                                                   <td className="px-4 py-3 text-center font-sans">
                                                     <button
                                                       onClick={() => setViewModalData(h)}
                                                       className="p-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-lg transition-all text-slate-600"
                                                       title="Lihat Detail Modal"
                                                     >
                                                       <Eye size={13} />
                                                     </button>
                                                   </td>
                                                 </tr>
                                               );
                                             })}
                                           </tbody>
                                         </table>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'detail' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Memuat rincian belanja...
                                       </div>
                                     ) : !expandedDetails[r.id_analisis]?.details?.length ? (
                                       <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         Belum ada rincian belanja kegiatan yang tersimpan untuk analisis ini.
                                       </div>
                                     ) : (
                                       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                         <table className="w-full text-xs text-left">
                                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                                             <tr>
                                               <th className="px-3 py-3 text-center w-10">No</th>
                                               <th className="px-4 py-3">Uraian Kegiatan / Belanja</th>
                                               <th className="px-4 py-3 text-right">Pagu Anggaran</th>
                                               <th className="px-4 py-3 text-right">Realisasi</th>
                                               <th className="px-4 py-3 text-right">Sisa Pagu</th>
                                               <th className="px-4 py-3 text-center w-28">% Serapan</th>
                                             </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100 font-mono">
                                             {expandedDetails[r.id_analisis].details.map((item: any, i: number) => {
                                               const pagu = parseNum(item.anggaran);
                                               const real = parseNum(item.realisasi);
                                               const sisa = pagu - real;
                                               const pct = pagu > 0 ? Math.min(100, Math.round((real / pagu) * 100)) : 0;
                                               return (
                                                 <tr key={item.id || i} className="hover:bg-slate-50/80">
                                                   <td className="px-3 py-2.5 text-center text-slate-400 font-bold">{item.no_urut || i + 1}</td>
                                                   <td className="px-4 py-2.5 font-sans font-medium text-slate-800">{item.uraian_kegiatan}</td>
                                                   <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rp {formatRp(pagu)}</td>
                                                   <td className="px-4 py-2.5 text-right text-emerald-700 font-bold">Rp {formatRp(real)}</td>
                                                   <td className="px-4 py-2.5 text-right text-amber-800 font-bold">Rp {formatRp(sisa)}</td>
                                                   <td className="px-4 py-2.5 text-center">
                                                     <div className="flex items-center gap-2">
                                                       <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                         <div 
                                                           className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                                                           style={{ width: `${pct}%` }}
                                                         />
                                                       </div>
                                                       <span className="text-[10px] font-bold text-slate-600 w-8 text-right">{pct}%</span>
                                                     </div>
                                                   </td>
                                                 </tr>
                                               );
                                             })}
                                           </tbody>
                                         </table>
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'rekomendasi' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                       <span className="text-[11px] font-black text-indigo-900 uppercase tracking-widest block flex items-center gap-1.5">
                                         <FileCheck size={14} className="text-indigo-600" /> Analisis Rekomendasi AI & Pertimbangan
                                       </span>
                                       {r.rekomendasi_ai ? (
                                         <div 
                                           className="prose prose-xs text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                                           dangerouslySetInnerHTML={{ __html: r.rekomendasi_ai }}
                                         />
                                       ) : (
                                         <p className="text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                                           Tidak ada draf rekomendasi khusus tersimpan.
                                         </p>
                                       )}
                                     </div>

                                     {r.surat_balasan_html && (
                                       <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
                                         <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest block">
                                           📜 Draf Surat Balasan Tanggapan Pimpinan
                                         </span>
                                         <div 
                                           className="prose prose-xs text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-indigo-200/60 shadow-2xs"
                                           dangerouslySetInnerHTML={{ __html: r.surat_balasan_html }}
                                         />
                                       </div>
                                     )}
                                   </div>
                                 )}

                                 {(activeTabMap[r.id_analisis] || 'substansi') === 'historis' && (
                                   <div className="space-y-4 animate-in fade-in duration-200">
                                     {loadingDetails[r.id_analisis] ? (
                                       <div className="py-8 flex justify-center items-center text-slate-400 gap-2 text-xs font-medium">
                                         <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                         Memuat data historis...
                                       </div>
                                     ) : !expandedDetails[r.id_analisis]?.historis?.length ? (
                                       <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                         Belum ada data pagu historis multi-tahun yang tersimpan.
                                       </div>
                                     ) : (
                                       <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                                         <table className="w-full text-xs text-left">
                                           <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                                             <tr>
                                               <th className="px-4 py-3 text-center">Tahun</th>
                                               <th className="px-4 py-3 text-right">Pagu Awal</th>
                                               <th className="px-4 py-3 text-right">Penambahan</th>
                                               <th className="px-4 py-3 text-right">Total Pagu</th>
                                               <th className="px-4 py-3 text-right">Realisasi</th>
                                               <th className="px-4 py-3 text-center">% Serapan</th>
                                             </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100 font-mono">
                                             {expandedDetails[r.id_analisis].historis.map((h: any, i: number) => {
                                               const paguAwal = parseNum(h.pagu_awal);
                                               const totalPagu = parseNum(h.total_pagu);
                                               const real = parseNum(h.realisasi_historis);
                                               const pct = totalPagu > 0 ? ((real / totalPagu) * 100).toFixed(1) : '0';
                                               return (
                                                 <tr key={h.id || i} className="hover:bg-slate-50/80">
                                                   <td className="px-4 py-2.5 text-center font-bold text-indigo-700 font-sans">{h.tahun}</td>
                                                   <td className="px-4 py-2.5 text-right font-medium text-slate-700">Rp {formatRp(paguAwal)}</td>
                                                   <td className="px-4 py-2.5 text-right font-medium text-emerald-700">
                                                     {h.tambah ? `+ Rp ${formatRp(h.tambah)}` : '-'}
                                                   </td>
                                                   <td className="px-4 py-2.5 text-right font-bold text-slate-900">Rp {formatRp(totalPagu)}</td>
                                                   <td className="px-4 py-2.5 text-right text-indigo-700 font-bold">Rp {formatRp(real)}</td>
                                                   <td className="px-4 py-2.5 text-center">
                                                     <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">
                                                       {pct}%
                                                     </span>
                                                   </td>
                                                 </tr>
                                               );
                                             })}
                                           </tbody>
                                         </table>
                                       </div>
                                     )}
                                   </div>
                                 )}

                               </div>

                               <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                                 <div className="flex items-center gap-2">
                                   <button
                                     onClick={() => setViewModalData(r)}
                                     className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                   >
                                     <Eye size={14} /> Lihat Detail Modal & Preview PDF
                                   </button>
                                 </div>

                                 <div className="flex items-center gap-2">
                                   <button
                                     onClick={() => {
                                       onLoadAnalisis(r.id_analisis);
                                       setTimeout(() => setActiveTab('form'), 200);
                                     }}
                                     className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                   >
                                     <Edit3 size={14} /> Edit & Buka Form Analisis
                                   </button>

                                   <button
                                     onClick={() => {
                                       onLoadAnalisis(r.id_analisis);
                                       setTimeout(() => setActiveTab('pdf'), 200);
                                     }}
                                     className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                   >
                                     <Printer size={14} /> Pratinjau PDF Nota
                                   </button>

                                   <button
                                     onClick={(e) => handleDelete(r.id_analisis, e)}
                                     className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all border border-rose-200 shadow-sm"
                                     title="Hapus Arsip"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                 </div>
                               </div>

                             </div>
                           </td>
                         </tr>
                       )}
                     </React.Fragment>
                   );
                 })}
               </tbody>
             </table>
           </div>
         )}
      </div>

      {viewModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(viewModalData.keputusan)}
                  {viewModalData.subyek_persuratan_simaster && (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                      Simaster: {viewModalData.subyek_persuratan_simaster}
                    </span>
                  )}
                </div>
                <h3 className="font-black text-xl text-slate-900 pt-1">
                  {viewModalData.perihal || 'Detail Nota Analisis'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  📄 No Surat: <span className="font-bold text-slate-800">{viewModalData.no_surat || '-'}</span> • Unit: <span className="font-bold text-indigo-700">{viewModalData.unit_pengirim || '-'}</span>
                </p>
              </div>

              <button 
                onClick={() => setViewModalData(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Section 1: Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Anggaran Diajukan</span>
                <div className="text-xl font-black font-mono text-amber-800">
                  Rp {formatRp(viewModalData.total_anggaran)}
                </div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Nominal Disetujui Pimpinan</span>
                <div className="text-xl font-black font-mono text-emerald-800">
                  Rp {formatRp(viewModalData.nominal_disetujui)}
                </div>
              </div>
            </div>

            {/* Modal Section 2: Ringkasan AI & Substansi (FULL HTML FORMATTED) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-black text-indigo-900 uppercase tracking-widest block flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" /> Ringkasan Substansi & AI Note (Lengkap)
              </span>
              {viewModalData.ringkasan_ai ? (
                <div 
                  className="prose prose-sm text-slate-800 max-w-none text-xs leading-relaxed font-sans bg-white p-4 rounded-xl border border-slate-200/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h3]:font-bold [&_h3]:text-sm [&_strong]:font-bold"
                  dangerouslySetInnerHTML={{ __html: viewModalData.ringkasan_ai }}
                />
              ) : (
                <p className="text-xs text-slate-600 italic bg-white p-4 rounded-xl border border-slate-200">
                  {viewModalData.perihal || 'Nota analisis usulan tambah pagu anggaran unit kerja UGM.'}
                </p>
              )}
            </div>

            {/* Modal Section 3: Keterangan Keputusan Pimpinan (If available) */}
            {viewModalData.keterangan_keputusan && (
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest block">Catatan / Keterangan Persetujuan Pimpinan</span>
                <p className="text-xs font-medium text-amber-950">{viewModalData.keterangan_keputusan}</p>
              </div>
            )}

            {/* Modal Section 4: File Lampiran Original (If available) */}
            {viewModalData.link_lampiran && (
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Paperclip size={16} className="text-indigo-600" /> File PDF Lampiran Asli Pengajuan
                </div>
                <button
                  onClick={() => window.open(viewModalData.link_lampiran, '_blank')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> Buka PDF Lampiran
                </button>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setViewModalData(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = viewModalData.id_analisis;
                    setViewModalData(null);
                    onLoadAnalisis(id);
                    setTimeout(() => setActiveTab('pdf'), 200);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Eye size={14} /> View / Preview Nota Analisis PDF
                </button>

                <button
                  onClick={() => {
                    const id = viewModalData.id_analisis;
                    setViewModalData(null);
                    onLoadAnalisis(id);
                    setTimeout(() => setActiveTab('form'), 200);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Edit3 size={14} /> Buka Form & Edit
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

