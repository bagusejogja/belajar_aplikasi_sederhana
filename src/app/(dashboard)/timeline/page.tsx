'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Search, Edit2, Trash2, CheckCircle, Clock, Save, X, User, FileText, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';

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
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Timelines
    const { data: timelineData } = await supabase
      .from('app_timeline')
      .select('*')
      .order('tanggal_mulai', { ascending: true });
    
    // Fetch PICs from gov_units
    const { data: unitData } = await supabase.from('gov_units').select('pic').not('pic', 'is', null);
    
    if (timelineData) setData(timelineData);
    if (unitData) {
      const uniquePics = Array.from(new Set(unitData.map(u => u.pic).filter(p => p !== '-' && p.trim() !== '')));
      setPicOptions(uniquePics.map(p => ({ value: p, label: p })));
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      pic: form.pic?.value || form.pic?.label || null
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
      pic: item.pic ? { value: item.pic, label: item.pic } : null,
      status: item.status || 'Belum Selesai',
      keterangan: item.keterangan || '',
      warna: item.warna || 'bg-indigo-500'
    });
    setIsModalOpen(true);
  };

  // Organize Data (Parent -> Children)
  const parents = data.filter(d => !d.parent_id);
  const filteredParents = parents.filter(p => 
    p.judul_kegiatan.toLowerCase().includes(search.toLowerCase()) || 
    (p.pic && p.pic.toLowerCase().includes(search.toLowerCase())) ||
    data.some(c => c.parent_id === p.id && c.judul_kegiatan.toLowerCase().includes(search.toLowerCase()))
  );

  const calculateDeadlineInfo = (endDateStr: string, status: string) => {
    if (!endDateStr || status === 'Selesai') return null;
    const end = new Date(endDateStr).setHours(23, 59, 59, 999);
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Terlambat ${Math.abs(diffDays)} hari!`, isLate: true };
    if (diffDays === 0) return { text: 'Batas waktu hari ini!', isLate: false, isWarning: true };
    if (diffDays <= 3) return { text: `Sisa ${diffDays} hari`, isLate: false, isWarning: true };
    return { text: `Sisa ${diffDays} hari`, isLate: false };
  };

  const renderTimelineCard = (item: any, isChild = false) => {
    const deadline = calculateDeadlineInfo(item.tanggal_selesai, item.status);
    const children = data.filter(d => d.parent_id === item.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedParents.includes(item.id);

    return (
      <div key={item.id} className={`relative ${isChild ? 'ml-8 md:ml-12 mt-4' : 'pl-8 md:pl-10 mt-8 group'}`}>
        {/* Dot Timeline */}
        {!isChild && (
          <div className={`absolute -left-[14px] top-6 w-6 h-6 rounded-full border-4 border-white ${item.warna || 'bg-indigo-500'} shadow-md z-10`}></div>
        )}
        {isChild && (
           <div className="absolute -left-[18px] top-8 w-4 h-4 rounded-full border-[3px] border-white bg-gray-300 shadow-sm z-10"></div>
        )}
        
        <div className={`bg-white border transition-all rounded-2xl overflow-hidden ${isChild ? 'border-gray-100 shadow-sm' : 'border-gray-200 shadow-md hover:shadow-lg'}`}>
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex items-start gap-3">
                {!isChild && hasChildren && (
                  <button onClick={() => toggleExpand(item.id)} className="mt-1 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                )}
                <div>
                  <h3 className={`font-black text-gray-800 flex items-center gap-2 ${isChild ? 'text-lg' : 'text-xl'}`}>
                    {item.judul_kegiatan}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 uppercase tracking-widest">
                      <Clock size={12} className="text-indigo-500" />
                      {new Date(item.tanggal_mulai).toLocaleDateString('id-ID')} {item.tanggal_selesai && ` - ${new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}`}
                    </div>
                    {item.pic && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 uppercase tracking-widest">
                        <User size={12} className="text-sky-500" />
                        PIC: <span className="text-gray-800">{item.pic}</span>
                      </div>
                    )}
                    {deadline && (
                      <div className={`flex items-center gap-1.5 text-[11px] font-black px-2 py-1 rounded-md uppercase tracking-widest border shadow-sm ${deadline.isLate ? 'bg-rose-50 text-rose-600 border-rose-200' : deadline.isWarning ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                        {deadline.isLate ? <AlertCircle size={12} /> : <Clock size={12} />}
                        {deadline.text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleStatus(item.id, item.status)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
                >
                  {item.status === 'Selesai' ? <CheckCircle size={14} /> : <Clock size={14} />}
                  {item.status}
                </button>
                <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
            
            {item.keterangan && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-start gap-2 text-gray-600 text-sm">
                <FileText size={16} className="mt-0.5 text-gray-400 shrink-0" />
                <p className="font-medium whitespace-pre-wrap">{item.keterangan}</p>
              </div>
            )}
          </div>
          
          {/* Sub-Kegiatan (Children) */}
          {!isChild && hasChildren && isExpanded && (
            <div className="bg-gray-50/50 p-4 border-t border-gray-100 relative">
              <div className="absolute left-8 top-0 bottom-4 w-px bg-gray-200"></div>
              {children.map(child => renderTimelineCard(child, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-800 to-sky-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><Calendar size={32} /> Timeline Kegiatan</h1>
          <p className="text-indigo-100 font-medium mt-2">Pantau jadwal Induk & Sub-Kegiatan, PIC, dan peringatan batas waktu.</p>
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

      {/* Timeline View */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold italic">Belum ada timeline kegiatan yang ditambahkan.</div>
        ) : (
          <div className="relative border-l-4 border-gray-100 ml-4 pb-4">
            {filteredParents.map(parent => renderTimelineCard(parent, false))}
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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Warna Identitas (Khusus Induk)</label>
                  <div className="flex flex-wrap gap-3">
                    {warnaOptions.map(w => (
                      <label key={w.value} className="cursor-pointer">
                        <input type="radio" name="warna" value={w.value} checked={form.warna === w.value} onChange={() => setForm({...form, warna: w.value})} className="peer hidden" />
                        <div className={`w-10 h-10 rounded-full border-4 border-white shadow-sm peer-checked:scale-110 peer-checked:shadow-md transition-transform ${w.value}`}></div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Mulai *</label>
                  <input required type="date" value={form.tanggal_mulai} onChange={e => setForm({...form, tanggal_mulai: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Selesai (Batas Akhir)</label>
                  <input type="date" value={form.tanggal_selesai} onChange={e => setForm({...form, tanggal_selesai: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">PIC (Penanggung Jawab)</label>
                  <CreatableSelect
                    isClearable
                    options={picOptions}
                    value={form.pic}
                    onChange={(val) => setForm({...form, pic: val})}
                    placeholder="Pilih atau ketik nama PIC..."
                    formatCreateLabel={(inputValue) => `Buat PIC baru: "${inputValue}"`}
                    styles={{
                      control: (base) => ({ ...base, borderRadius: '0.75rem', padding: '0.2rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', fontWeight: 'bold' }),
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700 cursor-pointer">
                    <option value="Belum Selesai">⏳ Belum Selesai</option>
                    <option value="Selesai">✅ Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan Tambahan</label>
                <textarea value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium h-24 resize-none text-gray-700" placeholder="Catatan peringatan, hasil rapat, dll..." />
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-8 py-3 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
                  <Save size={18} /> SIMPAN DATA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
