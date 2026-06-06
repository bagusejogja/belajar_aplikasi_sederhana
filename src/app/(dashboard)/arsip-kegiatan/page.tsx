'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderTree, Plus, Search, Edit2, Trash2, Folder, FileText, Upload, Link as LinkIcon, Loader2, Save, X, ChevronDown, ChevronRight, File, Archive, Calendar } from 'lucide-react';

export default function ArsipKegiatanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [years, setYears] = useState<string[]>([]);
  
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    tahun: new Date().getFullYear(),
    nama_kegiatan: '',
    catatan: '',
    fase_dokumen: [] as any[]
  });

  const [uploadingPhase, setUploadingPhase] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: arsipData, error } = await supabase
      .from('app_arsip_kegiatan')
      .select('*')
      .order('tahun', { ascending: false })
      .order('id', { ascending: true });
    
    if (error) {
      console.error(error);
    } else {
      setData(arsipData || []);
      const uniqueYears = Array.from(new Set((arsipData || []).map(d => String(d.tahun))));
      setYears(uniqueYears.sort().reverse());
    }
    setLoading(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await supabase.from('app_arsip_kegiatan').update(form).eq('id', editingId);
    } else {
      await supabase.from('app_arsip_kegiatan').insert([form]);
    }
    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus seluruh arsip kegiatan ini?')) {
      await supabase.from('app_arsip_kegiatan').delete().eq('id', id);
      fetchData();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ tahun: new Date().getFullYear(), nama_kegiatan: '', catatan: '', fase_dokumen: [] });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      tahun: item.tahun,
      nama_kegiatan: item.nama_kegiatan,
      catatan: item.catatan || '',
      fase_dokumen: typeof item.fase_dokumen === 'string' ? JSON.parse(item.fase_dokumen) : (item.fase_dokumen || [])
    });
    setIsModalOpen(true);
  };

  // Phase Management in Form
  const addPhase = () => {
    setForm(prev => ({ ...prev, fase_dokumen: [...prev.fase_dokumen, { nama_fase: `Fase ${prev.fase_dokumen.length + 1}`, files: [] }] }));
  };
  const updatePhaseName = (idx: number, name: string) => {
    const newPhases = [...form.fase_dokumen];
    newPhases[idx].nama_fase = name;
    setForm({ ...form, fase_dokumen: newPhases });
  };
  const removePhase = (idx: number) => {
    const newPhases = form.fase_dokumen.filter((_, i) => i !== idx);
    setForm({ ...form, fase_dokumen: newPhases });
  };

  // File Management in Form
  const addLink = (phaseIdx: number) => {
    const url = prompt('Masukkan URL Google Drive / Link lainnya:');
    if (!url) return;
    const name = prompt('Masukkan nama file/tautan (misal: Undangan Rapat):') || 'Link Terlampir';
    
    const newPhases = [...form.fase_dokumen];
    newPhases[phaseIdx].files.push({ name, url, type: 'link' });
    setForm({ ...form, fase_dokumen: newPhases });
  };

  const uploadFile = async (phaseIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhase(phaseIdx);
    const formData = new FormData();
    formData.append('file', file);
    // Masukkan ke folder spesifik R2 sesuai nama kegiatan agar rapi
    const safeFolderName = form.nama_kegiatan.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'arsip_umum';
    formData.append('folder', `arsip_kegiatan/${form.tahun}/${safeFolderName}`);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const newPhases = [...form.fase_dokumen];
        newPhases[phaseIdx].files.push({ name: file.name, url: data.publicUrl, type: 'file' });
        setForm({ ...form, fase_dokumen: newPhases });
      } else {
        alert('Gagal upload: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploadingPhase(null);
    }
  };

  const removeFile = (phaseIdx: number, fileIdx: number) => {
    const newPhases = [...form.fase_dokumen];
    newPhases[phaseIdx].files = newPhases[phaseIdx].files.filter((_: any, i: number) => i !== fileIdx);
    setForm({ ...form, fase_dokumen: newPhases });
  };

  const filteredData = data.filter(d => 
    (selectedYear === 'Semua' || String(d.tahun) === selectedYear) &&
    d.nama_kegiatan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-sky-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FolderTree size={120} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-3"><Archive size={32} /> Arsip Kegiatan Berjenjang</h1>
          <p className="text-indigo-100 font-medium mt-2 max-w-xl">Kelola folder arsip per kegiatan secara multi-tahun. Satu kegiatan dapat memiliki banyak fase dan file yang tersimpan rapi di Cloudflare R2 / GDrive.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="relative z-10 bg-white text-indigo-800 hover:bg-gray-100 px-6 py-3 rounded-2xl font-black transition-transform hover:scale-105 flex items-center gap-2 drop-shadow-md border-b-4 border-indigo-200"
        >
          <Plus size={20} /> BUAT FOLDER KEGIATAN
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama kegiatan..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 ring-indigo-100 font-medium text-gray-700"
          />
        </div>
        <div className="w-full md:w-auto">
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full bg-gray-50 text-gray-700 font-bold px-6 py-3 rounded-xl outline-none focus:ring-2 ring-indigo-100 border-none cursor-pointer"
          >
            <option value="Semua">📅 Semua Tahun</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Accordion View */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
        ) : filteredData.length === 0 ? (
           <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center text-gray-400 font-bold italic shadow-sm">Belum ada folder kegiatan yang dibuat.</div>
        ) : (
          filteredData.map(kegiatan => {
            const isExpanded = expandedIds.includes(kegiatan.id);
            const phases = typeof kegiatan.fase_dokumen === 'string' ? JSON.parse(kegiatan.fase_dokumen) : (kegiatan.fase_dokumen || []);
            const totalFiles = phases.reduce((acc: number, p: any) => acc + (p.files?.length || 0), 0);

            return (
              <div key={kegiatan.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                <div 
                  className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                  onClick={() => toggleExpand(kegiatan.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                      <Folder size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-indigo-900 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">{kegiatan.tahun}</span>
                        <h3 className="text-lg font-black text-gray-800">{kegiatan.nama_kegiatan}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-semibold text-gray-500 mt-1">
                        <span>{phases.length} Fase</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{totalFiles} File/Link Tersimpan</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(kegiatan); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl font-black text-xs flex items-center gap-2 transition-colors">
                      <Edit2 size={16}/> EDIT
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(kegiatan.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                      <Trash2 size={18}/>
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>
                    {isExpanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                    {kegiatan.catatan && (
                      <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-sm">
                        <strong className="block mb-1 text-amber-700 uppercase tracking-widest text-[10px]">Catatan Kegiatan:</strong>
                        <p className="whitespace-pre-wrap font-medium">{kegiatan.catatan}</p>
                      </div>
                    )}
                    
                    {phases.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 font-medium italic">Belum ada fase dan file di dalam kegiatan ini. Klik Edit untuk menambahkan.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {phases.map((phase: any, pIdx: number) => (
                          <div key={pIdx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                            <h4 className="font-black text-gray-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{pIdx + 1}</span>
                              {phase.nama_fase}
                            </h4>
                            {(!phase.files || phase.files.length === 0) ? (
                              <p className="text-xs text-gray-400 italic text-center py-4">Kosong</p>
                            ) : (
                              <ul className="space-y-3">
                                {phase.files.map((file: any, fIdx: number) => (
                                  <li key={fIdx}>
                                    <a href={file.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-colors">
                                      {file.type === 'link' ? <LinkIcon size={16} className="text-sky-500 mt-0.5 shrink-0" /> : <FileText size={16} className="text-indigo-500 mt-0.5 shrink-0" />}
                                      <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700 break-words line-clamp-2">{file.name}</span>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Edit/Add */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black text-gray-800">{editingId ? 'Edit Folder Kegiatan' : 'Buat Folder Kegiatan Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nama Kegiatan *</label>
                    <input required type="text" value={form.nama_kegiatan} onChange={e => setForm({...form, nama_kegiatan: e.target.value})} className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 font-black text-lg shadow-sm" placeholder="Misal: Penyusunan Anggaran Tahunan..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tahun *</label>
                    <input required type="number" value={form.tahun} onChange={e => setForm({...form, tahun: parseInt(e.target.value)})} className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 font-black text-lg shadow-sm text-center" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan Tambahan</label>
                  <textarea value={form.catatan} onChange={e => setForm({...form, catatan: e.target.value})} className="w-full p-4 bg-white border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 font-medium h-24 resize-none shadow-sm" placeholder="Opsional: Keterangan singkat mengenai kegiatan ini..." />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-black text-lg text-gray-800">Fase Dokumen</h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Buat urutan kegiatan dan lampirkan file (R2) atau link (GDrive) di setiap fase.</p>
                    </div>
                    <button type="button" onClick={addPhase} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-colors">
                      <Plus size={16} /> TAMBAH FASE BARU
                    </button>
                  </div>

                  <div className="space-y-4">
                    {form.fase_dokumen.map((phase, pIdx) => (
                      <div key={pIdx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative group">
                        <button type="button" onClick={() => removePhase(pIdx)} className="absolute top-4 right-4 text-gray-300 hover:text-rose-500 transition-colors p-1 bg-gray-50 rounded-lg">
                          <X size={16} />
                        </button>
                        
                        <div className="mb-4 pr-10">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nama Fase {pIdx + 1}</label>
                          <input type="text" value={phase.nama_fase} onChange={e => updatePhaseName(pIdx, e.target.value)} className="w-full bg-transparent border-b-2 border-gray-100 focus:border-indigo-500 outline-none py-2 font-black text-gray-800 text-lg transition-colors" placeholder="Misal: 1. Surat Undangan Rapat" />
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <label className="relative cursor-pointer bg-white border border-gray-200 hover:border-indigo-500 hover:text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs text-gray-600 transition-colors shadow-sm flex items-center gap-2">
                              {uploadingPhase === pIdx ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                              Upload File (R2)
                              <input type="file" className="hidden" onChange={e => uploadFile(pIdx, e)} disabled={uploadingPhase === pIdx} />
                            </label>
                            <button type="button" onClick={() => addLink(pIdx)} className="bg-white border border-gray-200 hover:border-sky-500 hover:text-sky-600 px-4 py-2 rounded-xl font-bold text-xs text-gray-600 transition-colors shadow-sm flex items-center gap-2">
                              <LinkIcon size={16} /> Link (GDrive dll)
                            </button>
                          </div>

                          {phase.files.length > 0 && (
                            <ul className="space-y-2">
                              {phase.files.map((file: any, fIdx: number) => (
                                <li key={fIdx} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    {file.type === 'link' ? <LinkIcon size={16} className="text-sky-500 shrink-0" /> : <FileText size={16} className="text-indigo-500 shrink-0" />}
                                    <a href={file.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 truncate">{file.name}</a>
                                  </div>
                                  <button type="button" onClick={() => removeFile(pIdx, fIdx)} className="text-rose-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                                    <Trash2 size={16} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                    {form.fase_dokumen.length === 0 && (
                      <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold">
                        Belum ada fase. Silakan tambah fase dokumen terlebih dahulu.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleSave} className="px-8 py-3 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
                <Save size={18} /> SIMPAN SEMUA DATA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
