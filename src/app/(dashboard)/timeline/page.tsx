'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Search, Edit2, Trash2, CheckCircle, Clock, Save, X, User, FileText, ChevronRight, ChevronDown, AlertCircle, Maximize2 } from 'lucide-react';

export default function TimelinePage() {
  const [data, setData] = useState<any[]>([]);
  const [picOptions, setPicOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [expandedParents, setExpandedParents] = useState<number[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    judul_kegiatan: '',
    parent_id: null as number | null,
    tanggal_mulai: '',
    tanggal_selesai: '',
    pic: null as any,
    status: 'Belum Selesai',
    keterangan: '',
    warna: 'bg-indigo-500'
  });

  const warnaOptions = [
    { value: 'bg-indigo-500', label: 'Biru Indigo' },
    { value: 'bg-emerald-500', label: 'Hijau Emerald' },
    { value: 'bg-rose-500', label: 'Merah Rose' },
    { value: 'bg-amber-500', label: 'Kuning Amber' },
    { value: 'bg-sky-500', label: 'Biru Langit' },
    { value: 'bg-purple-500', label: 'Ungu' },
    { value: 'bg-slate-700', label: 'Abu Gelap' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: timelineData } = await supabase
      .from('app_timeline')
      .select('*')
      .order('tanggal_mulai', { ascending: true });
    
    const { data: unitData } = await supabase.from('gov_units').select('pic').not('pic', 'is', null);
    
    if (timelineData) setData(timelineData);
    if (unitData) {
      const uniquePics = Array.from(new Set(unitData.map(u => u.pic).filter(p => p !== '-' && p.trim() !== '')));
      setPicOptions(uniquePics.map(p => ({ value: p, label: p })));
    }
    
    // Auto expand all parents by default
    if (timelineData) {
      const parents = timelineData.filter(d => !d.parent_id).map(p => p.id);
      setExpandedParents(parents);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      pic: form.pic || null
    };

    if (editingId) {
      await supabase.from('app_timeline').update(payload).eq('id', editingId);
    } else {
      await supabase.from('app_timeline').insert([payload]);
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
    setForm({ judul_kegiatan: '', parent_id: null, tanggal_mulai: '', tanggal_selesai: '', pic: null, status: 'Belum Selesai', keterangan: '', warna: 'bg-indigo-500' });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      judul_kegiatan: item.judul_kegiatan,
      parent_id: item.parent_id,
      tanggal_mulai: item.tanggal_mulai,
      tanggal_selesai: item.tanggal_selesai || '',
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
    rows.push({ ...p, isChild: false, parentColor: p.warna });
    if (expandedParents.includes(p.id)) {
      const children = data.filter(c => c.parent_id === p.id);
      children.forEach(c => {
        rows.push({ ...c, isChild: true, parentColor: p.warna });
      });
    }
  });

  // Gantt Chart Calculations
  const DAY_WIDTH = 12; // Pixel per day
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
    maxDate.setMonth(maxDate.getMonth() + 1, 0); // Set to last day of the month
    
    // Tambah padding 1 bulan ke kanan biar lega
    maxDate.setDate(maxDate.getDate() + 30);

    const totalDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1;

    const months = [];
    let curr = new Date(minDate);
    while (curr <= maxDate) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      months.push({
        label: curr.toLocaleString('id-ID', { month: 'short' }) + ' ' + y,
        days: daysInMonth
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
    const diff = Math.max(1, Math.ceil((e - s) / (1000 * 3600 * 24)));
    return diff * DAY_WIDTH;
  };

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-800 to-sky-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><Calendar size={32} /> Gantt Chart Kegiatan</h1>
          <p className="text-indigo-100 font-medium mt-2">Pantau jadwal Induk & Sub-Kegiatan dalam bentuk Gantt Chart interaktif.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-white text-indigo-700 hover:bg-gray-100 px-6 py-3 rounded-2xl font-black transition-transform hover:scale-105 flex items-center gap-2 drop-shadow-md border-b-4 border-indigo-200"
        >
          <Plus size={20} /> TAMBAH KEGIATAN
        </button>
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
                            <div className={`flex items-center gap-2 truncate ${r.isChild ? 'pl-8' : ''}`}>
                               {!r.isChild && (
                                  <button onClick={() => toggleExpand(r.id)} className={`p-1 rounded hover:bg-gray-200 text-gray-500 ${!hasChildren ? 'invisible' : ''}`}>
                                     {expandedParents.includes(r.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                  </button>
                               )}
                               {r.isChild && <div className="w-2 h-2 rounded-full border-2 border-gray-300 ml-1"></div>}
                               <span className={`truncate ${r.isChild ? 'text-sm text-gray-600 font-medium' : 'text-sm font-black text-gray-800'}`} title={r.judul_kegiatan}>
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
             <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-white">
                <div style={{ width: `${timelineWidth}px` }} className="relative h-full">
                   {/* Header Bulan */}
                   <div className="h-16 border-b-2 border-gray-100 bg-gray-50 flex sticky top-0 z-10 shadow-sm">
                      {months.map(m => (
                         <div key={m.label} style={{ width: `${m.days * DAY_WIDTH}px` }} className="border-r border-gray-200 flex flex-col justify-center items-center shrink-0">
                            <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">{m.label}</span>
                         </div>
                      ))}
                   </div>
                   
                   {/* Garis Vertikal Grid */}
                   <div className="absolute top-16 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                      {months.map(m => (
                         <div key={'grid'+m.label} style={{ width: `${m.days * DAY_WIDTH}px` }} className="border-r border-gray-100 border-dashed h-full shrink-0"></div>
                      ))}
                   </div>

                   {/* Container Bar Gantt */}
                   <div className="absolute top-16 left-0 right-0 z-10 pointer-events-none">
                      {rows.map((r, idx) => {
                         const left = getPosition(r.tanggal_mulai);
                         const width = getWidth(r.tanggal_mulai, r.tanggal_selesai);
                         const top = idx * 52; // Sama dengan h-[52px] row di panel kiri
                         
                         const formatDate = (dateStr: string) => {
                           if (!dateStr) return '';
                           const d = new Date(dateStr);
                           return `${d.getDate()} ${d.toLocaleString('id-ID', {month:'short'})}`;
                         };

                         return (
                            <div key={r.id} className="absolute h-[52px] flex items-center w-full pointer-events-none" style={{ top: `${top}px` }}>
                               <div 
                                  style={{ left: `${left}px`, width: `${width}px` }} 
                                  className={`absolute h-8 rounded-md shadow-sm border border-black/10 flex items-center justify-between px-2 truncate cursor-pointer hover:brightness-110 hover:shadow-md transition-all pointer-events-auto group ${r.parentColor || 'bg-indigo-500'} ${r.isChild ? 'opacity-85 h-6 rounded-sm' : ''}`}
                               >
                                  <span className="truncate text-[10px] font-bold text-white/90 mr-2 whitespace-nowrap">{r.judul_kegiatan}</span>
                                  <span className="text-[9px] font-black text-white/70 whitespace-nowrap shrink-0">{formatDate(r.tanggal_mulai)} {r.tanggal_selesai && `- ${formatDate(r.tanggal_selesai)}`}</span>
                                  
                                  {/* Tooltip Hover */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal break-words">
                                    <p className="font-bold text-[13px] mb-1">{r.judul_kegiatan}</p>
                                    <p className="text-gray-300">Waktu: {r.tanggal_mulai} s/d {r.tanggal_selesai || '-'}</p>
                                    <p className="text-gray-300">PIC: {r.pic || '-'}</p>
                                    <p className="text-gray-300">Status: {r.status}</p>
                                    {r.keterangan && <p className="text-gray-400 mt-2 italic border-t border-gray-700 pt-1">{r.keterangan}</p>}
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
              
              {!form.parent_id && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Warna Bar Kegiatan</label>
                  <div className="flex flex-wrap gap-3">
                    {warnaOptions.map(w => (
                      <label key={w.value} className={`cursor-pointer px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-sm ${form.warna === w.value ? 'border-gray-800 shadow-md ring-2 ring-gray-200' : 'border-transparent hover:bg-gray-100'}`}>
                        <input type="radio" name="warna" value={w.value} checked={form.warna === w.value} onChange={() => setForm({...form, warna: w.value})} className="hidden" />
                        <div className={`w-4 h-4 rounded-full ${w.value} border border-black/10`}></div>
                        <span className={form.warna === w.value ? 'text-gray-900' : 'text-gray-500'}>{w.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Mulai *</label>
                  <input required type="date" value={form.tanggal_mulai} onChange={e => setForm({...form, tanggal_mulai: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Selesai</label>
                  <input type="date" value={form.tanggal_selesai} onChange={e => setForm({...form, tanggal_selesai: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Penanggung Jawab (PIC)</label>
                  <input type="text" value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700" placeholder="Opsional" />
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
