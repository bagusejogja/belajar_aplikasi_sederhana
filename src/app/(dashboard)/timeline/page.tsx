'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import { 
  Calendar, Search, ChevronRight, ChevronDown, CheckCircle, Plus, LayoutGrid, Clock, Tag, X, Edit2, Download, User, FileText, AlertCircle, Maximize2, Trash2, Save 
} from 'lucide-react';

export default function TimelinePage() {
  const [data, setData] = useState<any[]>([]);
  const [picOptions, setPicOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [expandedParents, setExpandedParents] = useState<number[]>([]);
  const ganttScrollRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    judul_kegiatan: '',
    parent_id: null as number | null,
    tanggal_mulai: '',
    tanggal_selesai: '',
    tanggal_dikerjakan_mulai: '',
    tanggal_dikerjakan_selesai: '',
    link_hasil: '',
    pic: null as any,
    status: 'Belum Selesai',
    keterangan: '',
    warna: 'bg-indigo-500'
  });

  useEffect(() => {
    if (form.tanggal_dikerjakan_mulai && form.tanggal_dikerjakan_selesai) {
      setForm(prev => ({ ...prev, status: 'Selesai' }));
    }
  }, [form.tanggal_dikerjakan_mulai, form.tanggal_dikerjakan_selesai]);

  const warnaOptions = [
    { value: 'bg-indigo-500', label: 'Biru Indigo', hex: '#6366f1' },
    { value: 'bg-emerald-500', label: 'Hijau Emerald', hex: '#10b981' },
    { value: 'bg-rose-500', label: 'Merah Rose', hex: '#f43f5e' },
    { value: 'bg-amber-500', label: 'Kuning Amber', hex: '#f59e0b' },
    { value: 'bg-sky-500', label: 'Biru Langit', hex: '#0ea5e9' },
    { value: 'bg-purple-500', label: 'Ungu', hex: '#a855f7' },
    { value: 'bg-slate-700', label: 'Abu Gelap', hex: '#334155' },
  ];

  const getColorHex = (val: string) => {
    const opt = warnaOptions.find(w => w.value === val);
    return opt ? opt.hex : '#6366f1';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: timelineData } = await supabase
      .from('app_timeline')
      .select('*')
      .order('tanggal_mulai', { ascending: true });
    
    let allPics: string[] = [];
    
    const { data: picData, error: picError } = await supabase.from('ref_pic').select('*');
    if (!picError && picData && picData.length > 0) {
      allPics = [...allPics, ...picData.map(u => u.pic || u.nama || u.nama_pic || u.name)];
    }
    
    const { data: unitData } = await supabase.from('gov_units').select('pic').not('pic', 'is', null);
    if (unitData) {
      allPics = [...allPics, ...unitData.map(u => u.pic)];
    }

    const uniquePics = Array.from(new Set(allPics.filter(p => p && p !== '-' && p.trim() !== '')));
    setPicOptions(uniquePics.map((p: any) => ({ value: p, label: p })));
    
    if (timelineData) {
      setData(timelineData);
      const parents = timelineData.filter(d => !d.parent_id).map(d => d.id);
      setExpandedParents(parents);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      pic: form.pic || null,
      tanggal_selesai: form.tanggal_selesai || null,
      tanggal_dikerjakan_mulai: form.tanggal_dikerjakan_mulai || null,
      tanggal_dikerjakan_selesai: form.tanggal_dikerjakan_selesai || null,
      link_hasil: form.link_hasil || null
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('app_timeline').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('app_timeline').insert([payload]);
      error = err;
    }

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
      return;
    }

    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus timeline ini? (Sub-kegiatan di dalamnya juga akan terhapus)')) {
      await supabase.from('app_timeline').delete().eq('id', id);
      fetchData();
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Selesai' ? 'Belum Selesai' : 'Selesai';
    await supabase.from('app_timeline').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const toggleExpand = (id: number) => {
    setExpandedParents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ judul_kegiatan: '', parent_id: null, tanggal_mulai: '', tanggal_selesai: '', tanggal_dikerjakan_mulai: '', tanggal_dikerjakan_selesai: '', link_hasil: '', pic: null, status: 'Belum Selesai', keterangan: '', warna: 'bg-indigo-500' });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      judul_kegiatan: item.judul_kegiatan,
      parent_id: item.parent_id,
      tanggal_mulai: item.tanggal_mulai,
      tanggal_selesai: item.tanggal_selesai || '',
      tanggal_dikerjakan_mulai: item.tanggal_dikerjakan_mulai || '',
      tanggal_dikerjakan_selesai: item.tanggal_dikerjakan_selesai || '',
      link_hasil: item.link_hasil || '',
      pic: item.pic || '',
      status: item.status,
      keterangan: item.keterangan || '',
      warna: item.warna || 'bg-indigo-500'
    });
    setIsModalOpen(true);
  };

  // Organize Data for Gantt Chart
  const parents = data.filter(d => !d.parent_id);
  const filteredParents = parents.filter(p => 
    p.judul_kegiatan.toLowerCase().includes(search.toLowerCase()) || 
    (p.pic && p.pic.toLowerCase().includes(search.toLowerCase())) ||
    data.some(c => c.parent_id === p.id && c.judul_kegiatan.toLowerCase().includes(search.toLowerCase()))
  );

  const rows: any[] = [];
  filteredParents.forEach(p => {
    const children = data.filter(c => c.parent_id === p.id);
    const hasChildren = children.length > 0;
    
    let minT = new Date(p.tanggal_mulai).getTime();
    let maxT = new Date(p.tanggal_selesai || p.tanggal_mulai).getTime();
    
    if (hasChildren) {
       minT = Math.min(...children.map(c => new Date(c.tanggal_mulai).getTime()));
       maxT = Math.max(...children.map(c => new Date(c.tanggal_selesai || c.tanggal_mulai).getTime()));
    }
    
    const pMod = { 
       ...p, 
       tanggal_mulai: new Date(minT).toISOString().split('T')[0],
       tanggal_selesai: new Date(maxT).toISOString().split('T')[0],
       isChild: false, 
       parentColor: p.warna,
       hasChildren 
    };
    rows.push(pMod);
    
    if (expandedParents.includes(p.id)) {
      children.forEach(c => {
        rows.push({ ...c, isChild: true, parentColor: p.warna });
      });
    }
  });

  // Gantt Chart Calculations
  const DAY_WIDTH = 24; // Pixel per day
  const getGanttExtents = () => {
    if (data.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 0, months: [] };
    
    let minT = new Date(data[0].tanggal_mulai).getTime();
    let maxT = new Date(data[0].tanggal_selesai || data[0].tanggal_mulai).getTime();
    data.forEach(d => {
      const s = new Date(d.tanggal_mulai).getTime();
      const e = new Date(d.tanggal_selesai || d.tanggal_mulai).getTime();
      if (s < minT) minT = s;
      if (e > maxT) maxT = e;
    });

    const minDate = new Date(minT);
    minDate.setDate(1); // Set to 1st of the month
    
    const maxDate = new Date(maxT);
    maxDate.setDate(maxDate.getDate() + 30); // Tambah padding 1 bulan ke kanan biar lega
    maxDate.setMonth(maxDate.getMonth() + 1, 0); // Set to last day of that month

    const totalDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1;

    const months = [];
    let curr = new Date(minDate);
    while (curr <= maxDate) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      
      const daysArray = [];
      let currentWeekNum = -1;
      let weeks = [];
      let currentWeekDays = 0;
      let weekStartDate = null;

      for(let d = 1; d <= daysInMonth; d++) {
         const dateObj = new Date(y, m, d);
         if (dateObj > maxDate) break;
         const dayOfWeek = dateObj.getDay();
         const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
         
         const getWeek = (date: Date) => {
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
            return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
         }
         const w = getWeek(dateObj);
         
         if (w !== currentWeekNum) {
            if (currentWeekNum !== -1) {
               const lastDay = new Date(y, m, d - 1);
               weeks.push({ label: `Pekan ${currentWeekNum}`, days: currentWeekDays, startDate: weekStartDate, endDate: lastDay });
            }
            currentWeekNum = w;
            currentWeekDays = 1;
            weekStartDate = dateObj;
         } else {
            currentWeekDays++;
         }

         daysArray.push({ date: d, isWeekend, fullDate: dateObj });
      }
      if (currentWeekDays > 0) {
         const lastDay = new Date(y, m, daysInMonth);
         if (lastDay > maxDate) {
            weeks.push({ label: `Pekan ${currentWeekNum}`, days: currentWeekDays, startDate: weekStartDate, endDate: maxDate });
         } else {
            weeks.push({ label: `Pekan ${currentWeekNum}`, days: currentWeekDays, startDate: weekStartDate, endDate: lastDay });
         }
      }

      months.push({
        label: curr.toLocaleString('id-ID', { month: 'long' }) + ' ' + y,
        days: daysArray.length,
        daysArray,
        weeks
      });
      curr.setMonth(m + 1);
    }

    return { minDate, maxDate, totalDays, months };
  };

  const { minDate, totalDays, months } = getGanttExtents();
  const timelineWidth = totalDays * DAY_WIDTH;

  const getPosition = (dateStr: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr).getTime();
    const diff = Math.floor((d - minDate.getTime()) / (1000 * 3600 * 24));
    return diff * DAY_WIDTH;
  };

  const getWidth = (startStr: string, endStr: string) => {
    if (!startStr) return 0;
    const s = new Date(startStr).getTime();
    const e = endStr ? new Date(endStr).getTime() : s;
    const diff = Math.max(1, Math.ceil((e - s) / (1000 * 3600 * 24)) + 1);
    return diff * DAY_WIDTH;
  };

  useEffect(() => {
    if (ganttScrollRef.current && data.length > 0) {
      const timer = setTimeout(() => {
        if (ganttScrollRef.current) {
          const todayLeft = getPosition(new Date().toISOString());
          ganttScrollRef.current.scrollLeft = todayLeft - ganttScrollRef.current.clientWidth / 2;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [data, minDate]);

  const handleExportWord = () => {
    if (rows.length === 0) return alert('Tidak ada data untuk di-export');
    
    const { months } = getGanttExtents();
    
    // Bikin tabel HTML
    let tableHtml = `<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 10px;">
      <thead>
        <tr>
          <th rowspan="2" style="padding: 5px; background: #f3f4f6;">Daftar Kegiatan</th>
          ${months.map(m => `<th colspan="${m.weeks.length}" style="padding: 5px; background: #e5e7eb;">${m.label}</th>`).join('')}
        </tr>
        <tr>
          ${months.map(m => m.weeks.map((w: any) => `<th style="padding: 5px; background: #f9fafb;">${w.label}</th>`).join('')).join('')}
        </tr>
      </thead>
      <tbody>
    `;

    rows.forEach(r => {
      let rowHtml = `<tr>
        <td style="padding: 5px; ${!r.isChild ? 'font-weight: bold;' : 'padding-left: 15px;'}">${r.judul_kegiatan}</td>`;
      
      const rStart = new Date(r.tanggal_mulai).getTime();
      const rEnd = r.tanggal_selesai ? new Date(r.tanggal_selesai).getTime() : rStart;
      
      months.forEach(m => {
        m.weeks.forEach((w: any) => {
          const weekStart = w.startDate.getTime();
          const weekEnd = w.endDate.getTime();
          
          const isOverlap = rStart <= weekEnd && rEnd >= weekStart;
          const colorHex = isOverlap ? '#4f46e5' : 'transparent';
          
          rowHtml += `<td style="background-color: ${colorHex};"></td>`;
        });
      });
      
      rowHtml += `</tr>`;
      tableHtml += rowHtml;
    });

    tableHtml += `</tbody></table>`;
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Timeline Export</title>
        <style>
          @page { size: landscape; margin: 1cm; }
        </style>
      </head>
      <body>
        <h2 style="font-family: sans-serif;">Gantt Chart Kegiatan (Rekap per Pekan)</h2>
        ${tableHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'timeline_pekan.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-800 to-sky-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><Calendar size={32} /> Gantt Chart Kegiatan</h1>
          <p className="text-indigo-100 font-medium mt-2">Pantau jadwal Induk & Sub-Kegiatan dalam bentuk Gantt Chart interaktif.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           <button 
             onClick={handleExportWord}
             className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-2xl font-black transition-transform hover:scale-105 flex items-center justify-center gap-2 drop-shadow-md border border-sky-400"
           >
             <Download size={20} /> WORD (PEKAN)
           </button>
           <button 
             onClick={() => { resetForm(); setIsModalOpen(true); }}
             className="bg-white text-indigo-700 hover:bg-gray-100 px-6 py-3 rounded-2xl font-black transition-transform hover:scale-105 flex items-center justify-center gap-2 drop-shadow-md border-b-4 border-indigo-200"
           >
             <Plus size={20} /> TAMBAH KEGIATAN
           </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama kegiatan besar atau PIC..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-indigo-100 font-medium text-gray-700"
          />
        </div>
      </div>

      {/* Gantt Chart View */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center h-40 flex-1">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold italic flex-1 flex items-center justify-center">
            Belum ada timeline kegiatan yang ditambahkan.
          </div>
        ) : (
          <div className="flex flex-1 relative">
             {/* Left Panel (Daftar Kegiatan) */}
             <div className="w-80 md:w-96 shrink-0 border-r border-gray-200 bg-white z-20 flex flex-col relative shadow-[2px_0_10px_rgba(0,0,0,0.03)]">
                <div className="h-16 flex items-center px-4 font-black text-gray-800 text-sm border-b-2 border-gray-100 bg-gray-50 sticky top-0 z-30 shadow-sm">
                   Daftar Kegiatan
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                   {rows.map((r, idx) => {
                      const hasChildren = data.some(d => d.parent_id === r.id);
                      return (
                         <div key={r.id} className={`h-[52px] px-4 flex justify-between items-center border-b border-gray-100 hover:bg-gray-50 transition-colors group ${r.isChild ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <div className={`flex items-center gap-2 min-w-0 flex-1 ${r.isChild ? 'pl-8' : ''}`}>
                               {!r.isChild && (
                                  <button onClick={() => toggleExpand(r.id)} className={`p-1 rounded hover:bg-gray-200 text-gray-500 ${!hasChildren ? 'invisible' : ''} shrink-0`}>
                                     {expandedParents.includes(r.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                  </button>
                               )}
                               {r.isChild && <div className="w-2 h-2 rounded-full border-2 border-gray-300 ml-1 shrink-0"></div>}
                               <span className={`line-clamp-2 pr-2 ${r.isChild ? 'text-[11px] text-gray-600 font-medium leading-tight' : 'text-xs font-black text-gray-800 leading-tight'}`} title={r.judul_kegiatan}>
                                  {r.judul_kegiatan}
                               </span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14}/></button>
                               <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14}/></button>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>

             {/* Right Panel (Gantt Grid) */}
             <div ref={ganttScrollRef} className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-white scroll-smooth">
                <div style={{ width: `${timelineWidth}px` }} className="relative h-full pb-64">
                   {/* Header Bulan */}
                   <div className="h-[24px] border-b border-gray-200 bg-gray-50 flex sticky top-0 z-20 shadow-sm">
                      {months.map(m => (
                         <div key={m.label} style={{ width: `${m.days * DAY_WIDTH}px` }} className="border-r border-gray-300 flex justify-center items-center shrink-0 bg-gray-100">
                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{m.label}</span>
                         </div>
                      ))}
                   </div>
                   
                   {/* Header Pekan */}
                   <div className="h-[24px] border-b border-gray-200 bg-gray-50 flex sticky top-[24px] z-20 shadow-sm">
                      {months.map(m => (
                         m.weeks.map((w: any, i: number) => (
                            <div key={m.label+'-w-'+i} style={{ width: `${w.days * DAY_WIDTH}px` }} className="border-r border-gray-200 flex justify-center items-center shrink-0 bg-white">
                               <span className="text-[9px] font-bold text-sky-600 uppercase tracking-widest">{w.label}</span>
                            </div>
                         ))
                      ))}
                   </div>

                   {/* Header Tanggal */}
                   <div className="h-[24px] border-b-2 border-gray-200 bg-white flex sticky top-[48px] z-20 shadow-sm">
                      {months.map(m => (
                         m.daysArray.map((d: any, i: number) => (
                            <div key={m.label+i} style={{ width: `${DAY_WIDTH}px` }} className={`border-r border-gray-100 flex justify-center items-center shrink-0 ${d.isWeekend ? 'bg-rose-50/80' : ''}`}>
                               <span className={`text-[10px] font-bold ${d.isWeekend ? 'text-rose-500' : 'text-gray-500'}`}>{d.date}</span>
                            </div>
                         ))
                      ))}
                   </div>
                   
                   {/* Garis Vertikal Grid */}
                   <div className="absolute top-[72px] bottom-0 left-0 right-0 flex pointer-events-none z-0">
                      {months.map(m => (
                         m.daysArray.map((d: any, i: number) => (
                            <div key={'grid'+m.label+i} style={{ width: `${DAY_WIDTH}px` }} className={`border-r border-gray-100 border-dashed h-full shrink-0 ${d.isWeekend ? 'bg-rose-50/40' : ''}`}></div>
                         ))
                      ))}
                   </div>
                   
                   {/* Garis Hari Ini */}
                   <div className="absolute top-[72px] bottom-0 w-[2px] bg-sky-500/60 pointer-events-none z-10" style={{ left: `${getPosition(new Date().toISOString())}px` }}>
                     <div className="absolute top-0 -translate-x-1/2 -translate-y-full bg-sky-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-t">HARI INI</div>
                   </div>

                   {/* Container Bar Gantt */}
                   <div className="absolute top-[72px] left-0 right-0 z-10 pointer-events-none">
                      {rows.map((r, idx) => {
                         const left = getPosition(r.tanggal_mulai);
                         const width = getWidth(r.tanggal_mulai, r.tanggal_selesai);
                         const top = idx * 52; // Sama dengan h-[52px] row di panel kiri
                         
                         const formatDate = (dateStr: string) => {
                           if (!dateStr) return '';
                           const d = new Date(dateStr);
                           return `${d.getDate()} ${d.toLocaleString('id-ID', {month:'short'})}`;
                         };
                         
                         const isPast = new Date(r.tanggal_selesai || r.tanggal_mulai) < new Date(new Date().setHours(0,0,0,0));
                         const isOverdue = isPast && r.status !== 'Selesai';
                         const bgStyle = isOverdue ? { backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 10px, transparent 10px, transparent 20px)' } : {};

                         const realisasiLeft = r.tanggal_dikerjakan_mulai ? getPosition(r.tanggal_dikerjakan_mulai) : 0;
                         const realisasiWidth = (r.tanggal_dikerjakan_mulai && r.tanggal_dikerjakan_selesai) ? getWidth(r.tanggal_dikerjakan_mulai, r.tanggal_dikerjakan_selesai) : getWidth(r.tanggal_dikerjakan_mulai, r.tanggal_dikerjakan_mulai);

                         return (
                            <div key={r.id} className="absolute h-[52px] flex items-center w-full pointer-events-none" style={{ top: `${top}px` }}>
                               {r.tanggal_dikerjakan_mulai && (
                                  <div 
                                     style={{ 
                                        left: `${realisasiLeft}px`, 
                                        width: `${realisasiWidth}px`,
                                        top: '34px',
                                        backgroundColor: '#34d399'
                                     }} 
                                     className="absolute h-2 border border-white/50 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] z-30 pointer-events-none"
                                     title={`Realisasi: ${r.tanggal_dikerjakan_mulai} s/d ${r.tanggal_dikerjakan_selesai || '-'}`}
                                  ></div>
                               )}
                               <div 
                                  onClick={() => openEdit(r)}
                                  style={{ left: `${left}px`, width: `${width}px`, backgroundColor: getColorHex(r.isChild && r.warna !== 'bg-indigo-500' ? r.warna : (r.parentColor || r.warna || 'bg-indigo-500')), ...bgStyle }} 
                                  className={`absolute h-8 rounded-md shadow-sm border border-black/10 flex items-center justify-between px-3 cursor-pointer hover:brightness-110 hover:shadow-md transition-all pointer-events-auto group hover:z-50 ${r.isChild ? 'opacity-90 h-6 rounded-sm' : ''} ${isOverdue ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
                               >
                                  <span className="truncate text-[10px] font-bold text-white/95 mr-3 whitespace-nowrap drop-shadow-md flex items-center gap-1">
                                    {r.status === 'Selesai' && <CheckCircle size={10} className="text-emerald-300 shrink-0" />}
                                  </span>
                                  <span className="text-[9px] font-black text-white/90 whitespace-nowrap shrink-0 drop-shadow-md">{formatDate(r.tanggal_mulai)} {r.tanggal_selesai && r.tanggal_selesai !== r.tanggal_mulai ? `- ${formatDate(r.tanggal_selesai)}` : ''}</span>
                                  
                                  {/* Tooltip Hover */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal break-words">
                                    <p className="font-bold text-[13px] mb-1">{r.judul_kegiatan}</p>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 my-2 border-y border-gray-700 py-2">
                                       <span className="text-gray-400">Rencana</span><span className="text-gray-200">: {r.tanggal_mulai} s/d {r.tanggal_selesai || '-'}</span>
                                       <span className="text-gray-400">Dikerjakan</span><span className="text-gray-200">: {r.tanggal_dikerjakan_mulai ? `${r.tanggal_dikerjakan_mulai} s/d ${r.tanggal_dikerjakan_selesai || '-'}` : 'Belum dikerjakan'}</span>
                                       <span className="text-gray-400">PIC</span><span className="text-gray-200">: {r.pic || '-'}</span>
                                       <span className="text-gray-400">Status</span><span className={`font-bold ${r.status === 'Selesai' ? 'text-emerald-400' : 'text-amber-400'}`}>: {r.status}</span>
                                    </div>
                                    {isOverdue && <p className="text-rose-400 font-bold mt-1">⚠️ Terlewat (Overdue)</p>}
                                    {r.link_hasil && (
                                       <div className="mt-1 mb-2">
                                          <span className="text-gray-400 block mb-0.5">Link Hasil:</span>
                                          <div className="text-sky-400 text-[10px] break-all max-h-16 overflow-hidden">
                                             {r.link_hasil.split('\n').map((l: string, i: number) => <div key={i} className="truncate">{l}</div>)}
                                          </div>
                                       </div>
                                    )}
                                    {r.keterangan && <p className="text-gray-400 mt-2 italic border-t border-gray-700 pt-1">{r.keterangan}</p>}
                                    <p className="text-sky-300 text-[10px] mt-2 italic font-bold">Klik balok ini untuk mengedit</p>
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-gray-800">{editingId ? 'Edit Timeline' : 'Tambah Timeline Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tipe Kegiatan</label>
                <select 
                  value={form.parent_id || ''} 
                  onChange={e => setForm({...form, parent_id: e.target.value ? Number(e.target.value) : null})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700 cursor-pointer"
                >
                  <option value="">🌟 Kegiatan Besar (Induk)</option>
                  <optgroup label="Jadikan Sub-Kegiatan dari:">
                    {parents.filter(p => p.id !== editingId).map(p => (
                      <option key={p.id} value={p.id}>↳ {p.judul_kegiatan}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Judul Kegiatan *</label>
                <input required type="text" value={form.judul_kegiatan} onChange={e => setForm({...form, judul_kegiatan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-black text-gray-800" placeholder="Misal: Rapat Anggaran..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Warna Bar Kegiatan</label>
                  <div className="flex flex-wrap gap-3">
                    {warnaOptions.map(w => (
                      <button type="button" key={w.value} onClick={() => setForm({...form, warna: w.value})} className={`cursor-pointer px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-sm outline-none ${form.warna === w.value ? 'border-gray-800 shadow-md ring-2 ring-gray-200 bg-gray-50' : 'border-transparent hover:bg-gray-100'}`}>
                        <div style={{ backgroundColor: w.hex }} className={`w-4 h-4 rounded-full border border-black/10`}></div>
                        <span className={form.warna === w.value ? 'text-gray-900' : 'text-gray-500'}>{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Mulai * {(!form.parent_id && data.some(d => d.parent_id === editingId)) ? <span className="text-rose-500 normal-case">(Otomatis dari anak)</span> : ''}</label>
                  <input required type="date" value={form.tanggal_mulai} onChange={e => setForm({...form, tanggal_mulai: e.target.value})} disabled={!form.parent_id && data.some(d => d.parent_id === editingId)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Selesai {(!form.parent_id && data.some(d => d.parent_id === editingId)) ? <span className="text-rose-500 normal-case">(Otomatis dari anak)</span> : ''}</label>
                  <input type="date" value={form.tanggal_selesai || ''} onChange={e => setForm({...form, tanggal_selesai: e.target.value})} disabled={!form.parent_id && data.some(d => d.parent_id === editingId)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700 disabled:opacity-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div className="col-span-full">
                   <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2 mb-2"><CheckCircle size={16}/> Laporan Realisasi (Pekerjaan)</h4>
                   <p className="text-xs text-indigo-700 mb-4">Isi tanggal realisasi di bawah ini jika tugas sudah mulai dikerjakan. Status akan otomatis berubah menjadi "Selesai" jika rentang waktu terisi penuh.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Tgl Dikerjakan (Mulai)</label>
                  <input type="date" value={form.tanggal_dikerjakan_mulai || ''} onChange={e => setForm({...form, tanggal_dikerjakan_mulai: e.target.value})} className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-indigo-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Tgl Dikerjakan (Selesai)</label>
                  <input type="date" value={form.tanggal_dikerjakan_selesai || ''} onChange={e => setForm({...form, tanggal_dikerjakan_selesai: e.target.value})} className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-indigo-900" />
                </div>
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Multi-Link Hasil / Bukti Pekerjaan</label>
                  <textarea rows={2} value={form.link_hasil} onChange={e => setForm({...form, link_hasil: e.target.value})} className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-indigo-900 text-sm" placeholder="Paste link hasil di sini (pisahkan dengan enter bila lebih dari 1)..."></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Penanggung Jawab (PIC)</label>
                  <Select 
                    options={picOptions} 
                    value={picOptions.find(p => p.value === form.pic) || null}
                    onChange={(val: any) => setForm({...form, pic: val ? val.value : ''})}
                    placeholder="Pilih PIC..."
                    isClearable
                    styles={{
                      control: (base) => ({ ...base, borderRadius: '0.75rem', padding: '0.25rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', fontWeight: 500, color: '#374151' }),
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status Penyelesaian</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700 cursor-pointer">
                    <option value="Belum Selesai">⏳ Belum Selesai</option>
                    <option value="Selesai">✅ Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Keterangan / Catatan Tambahan</label>
                <textarea rows={3} value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700" placeholder="Tuliskan catatan opsional jika ada..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Batal</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black transition-transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2">
                  <Save size={18} /> {editingId ? 'SIMPAN PERUBAHAN' : 'TAMBAHKAN TIMELINE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
