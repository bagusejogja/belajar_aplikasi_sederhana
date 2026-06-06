'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar, Plus, Search, Edit2, Trash2, CheckCircle, Clock, Save, X, User, FileText } from 'lucide-react';

export default function TimelinePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    judul_kegiatan: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    pic: '',
    status: 'Belum Selesai',
    keterangan: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: timelineData, error } = await supabase
      .from('app_timeline')
      .select('*')
      .order('tanggal_mulai', { ascending: true });
    
    if (error) console.error(error);
    else setData(timelineData || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('app_timeline').update(form).eq('id', editingId);
    } else {
      await supabase.from('app_timeline').insert([form]);
    }
    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus timeline ini?')) {
      await supabase.from('app_timeline').delete().eq('id', id);
      fetchData();
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Selesai' ? 'Belum Selesai' : 'Selesai';
    await supabase.from('app_timeline').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ judul_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '', pic: '', status: 'Belum Selesai', keterangan: '' });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      judul_kegiatan: item.judul_kegiatan,
      tanggal_mulai: item.tanggal_mulai,
      tanggal_selesai: item.tanggal_selesai || '',
      pic: item.pic || '',
      status: item.status || 'Belum Selesai',
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const filteredData = data.filter(d => 
    d.judul_kegiatan.toLowerCase().includes(search.toLowerCase()) || 
    (d.pic && d.pic.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-sky-500 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><Calendar size={32} /> Timeline Kegiatan Per Pekan</h1>
          <p className="text-indigo-100 font-medium mt-2">Pantau jadwal pelaksanaan kegiatan dan PIC yang bertanggung jawab.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-black transition-transform flex items-center gap-2 drop-shadow-md"
        >
          <Plus size={20} /> TAMBAH JADWAL
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama kegiatan atau PIC..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium"
          />
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold italic">Belum ada timeline kegiatan yang ditambahkan.</div>
        ) : (
          <div className="relative border-l-4 border-indigo-100 ml-4 space-y-10 py-4">
            {filteredData.map((item, idx) => (
              <div key={item.id} className="relative pl-8 md:pl-10 group">
                {/* Dot */}
                <div className={`absolute -left-[14px] top-1 w-6 h-6 rounded-full border-4 border-white ${item.status === 'Selesai' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-md transition-colors`}></div>
                
                <div className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 rounded-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-black text-gray-800">{item.judul_kegiatan}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                          <Clock size={14} className="text-indigo-500" />
                          {new Date(item.tanggal_mulai).toLocaleDateString('id-ID')} {item.tanggal_selesai && ` s/d ${new Date(item.tanggal_selesai).toLocaleDateString('id-ID')}`}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                          <User size={14} className="text-sky-500" />
                          PIC: <span className="text-gray-800">{item.pic || '-'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleStatus(item.id, item.status)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                      >
                        {item.status === 'Selesai' ? <CheckCircle size={16} /> : <Clock size={16} />}
                        {item.status}
                      </button>
                      <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  
                  {item.keterangan && (
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-start gap-2 text-gray-600 text-sm">
                      <FileText size={16} className="mt-0.5 text-gray-400 shrink-0" />
                      <p className="font-medium whitespace-pre-wrap">{item.keterangan}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800">{editingId ? 'Edit Timeline' : 'Tambah Timeline Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Judul Kegiatan *</label>
                <input required type="text" value={form.judul_kegiatan} onChange={e => setForm({...form, judul_kegiatan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium" placeholder="Misal: Rapat Anggaran..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Mulai *</label>
                  <input required type="date" value={form.tanggal_mulai} onChange={e => setForm({...form, tanggal_mulai: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Selesai</label>
                  <input type="date" value={form.tanggal_selesai} onChange={e => setForm({...form, tanggal_selesai: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">PIC (Penanggung Jawab)</label>
                  <input type="text" value={form.pic} onChange={e => setForm({...form, pic: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium" placeholder="Nama orang/unit" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium cursor-pointer">
                    <option value="Belum Selesai">⏳ Belum Selesai</option>
                    <option value="Selesai">✅ Selesai</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Keterangan / Catatan</label>
                <textarea value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium h-24 resize-none" placeholder="Catatan tambahan..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-6 py-3 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
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
