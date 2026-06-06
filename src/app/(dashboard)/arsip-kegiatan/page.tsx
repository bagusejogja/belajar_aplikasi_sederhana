'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderTree, Plus, Search, Edit2, Trash2, Folder, FileText, Upload, Link as LinkIcon, Loader2, Save, X, ChevronDown, ChevronRight, File, Archive, Settings } from 'lucide-react';

export default function ArsipKegiatanPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [expandedCats, setExpandedCats] = useState<number[]>([]);
  const [expandedYears, setExpandedYears] = useState<string[]>([]); // "catId-year"

  // Modal Category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ id: null as any, nama_kegiatan: '', deskripsi: '', template_fase: [''] });

  // Modal Archive (Year)
  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [arcForm, setArcForm] = useState({ id: null as any, kategori_id: null as any, tahun: new Date().getFullYear(), catatan: '', fase_dokumen: [] as any[] });

  const [uploadingPhase, setUploadingPhase] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: catData }, { data: arcData }] = await Promise.all([
      supabase.from('app_arsip_kategori').select('*').order('nama_kegiatan', { ascending: true }),
      supabase.from('app_arsip_kegiatan').select('*, app_arsip_kategori(nama_kegiatan)').order('tahun', { ascending: false })
    ]);
    
    setCategories(catData || []);
    setArchives(arcData || []);
    setLoading(false);
  };

  const toggleCat = (id: number) => {
    setExpandedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleYear = (key: string) => {
    setExpandedYears(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  // --- CATEGORY LOGIC ---
  const handleCatSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...catForm, template_fase: JSON.stringify(catForm.template_fase.filter(t => t.trim() !== '')) };
    if (catForm.id) await supabase.from('app_arsip_kategori').update(payload).eq('id', catForm.id);
    else await supabase.from('app_arsip_kategori').insert([payload]);
    setIsCatModalOpen(false);
    fetchData();
  };

  const handleCatDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus Folder Kategori ini? Semua arsip tahunan di dalamnya akan ikut terhapus!')) {
      await supabase.from('app_arsip_kategori').delete().eq('id', id);
      fetchData();
    }
  };

  // --- ARCHIVE LOGIC ---
  const handleArcSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (arcForm.id) {
      await supabase.from('app_arsip_kegiatan').update({ catatan: arcForm.catatan, fase_dokumen: arcForm.fase_dokumen }).eq('id', arcForm.id);
    } else {
      // Init from template
      const cat = categories.find(c => c.id === arcForm.kategori_id);
      let phases = [];
      if (cat && cat.template_fase) {
         const tpl = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : cat.template_fase;
         phases = tpl.map((nama: string) => ({ nama_fase: nama, files: [] }));
      }
      await supabase.from('app_arsip_kegiatan').insert([{ kategori_id: arcForm.kategori_id, tahun: arcForm.tahun, catatan: arcForm.catatan, fase_dokumen: phases }]);
    }
    setIsArcModalOpen(false);
    fetchData();
  };

  const handleArcDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus arsip tahun ini?')) {
      await supabase.from('app_arsip_kegiatan').delete().eq('id', id);
      fetchData();
    }
  };

  // --- FILE LOGIC ---
  const addLink = async (arcId: number, phaseIdx: number, phases: any[]) => {
    const url = prompt('Masukkan URL Google Drive / Link lainnya:');
    if (!url) return;
    const name = prompt('Masukkan nama file/tautan (misal: Undangan Rapat):') || 'Link Terlampir';
    
    const newPhases = [...phases];
    newPhases[phaseIdx].files.push({ name, url, type: 'link' });
    await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
    fetchData();
  };

  const uploadFile = async (arcId: number, phaseIdx: number, phases: any[], e: React.ChangeEvent<HTMLInputElement>, catName: string, tahun: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhase(`${arcId}-${phaseIdx}`);
    const formData = new FormData();
    formData.append('file', file);
    const safeFolderName = catName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'arsip_umum';
    formData.append('folder', `arsip_kegiatan/${safeFolderName}/${tahun}`);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const newPhases = [...phases];
        newPhases[phaseIdx].files.push({ name: file.name, url: data.publicUrl, type: 'file' });
        await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
        fetchData();
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

  const removeFile = async (arcId: number, phaseIdx: number, fileIdx: number, phases: any[]) => {
    const newPhases = [...phases];
    newPhases[phaseIdx].files = newPhases[phaseIdx].files.filter((_: any, i: number) => i !== fileIdx);
    await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
    fetchData();
  };

  const filteredCats = categories.filter(c => c.nama_kegiatan.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-sky-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <FolderTree size={120} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-3"><Archive size={32} /> Arsip Kegiatan Tahunan</h1>
          <p className="text-indigo-100 font-medium mt-2 max-w-xl">Kelola Arsip berdasarkan Folder Kegiatan Besar. Template tahap/fase otomatis terbentuk saat membuat arsip tahun baru.</p>
        </div>
        <button 
          onClick={() => { setCatForm({ id: null, nama_kegiatan: '', deskripsi: '', template_fase: ['Tahap 1', 'Tahap 2'] }); setIsCatModalOpen(true); }}
          className="relative z-10 bg-white text-indigo-800 hover:bg-gray-100 px-6 py-3 rounded-2xl font-black transition-transform hover:scale-105 flex items-center gap-2 drop-shadow-md border-b-4 border-indigo-200"
        >
          <Plus size={20} /> BUAT FOLDER KEGIATAN
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari folder kegiatan besar..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 ring-indigo-100 font-bold text-gray-700"
          />
        </div>
      </div>

      {/* Accordion View */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
        ) : filteredCats.length === 0 ? (
           <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center text-gray-400 font-bold italic shadow-sm">Belum ada folder kegiatan yang dibuat.</div>
        ) : (
          filteredCats.map(cat => {
            const isCatExpanded = expandedCats.includes(cat.id);
            const catArcs = archives.filter(a => a.kategori_id === cat.id);

            return (
              <div key={cat.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
                {/* Category Header */}
                <div 
                  className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer transition-colors ${isCatExpanded ? 'bg-indigo-50 border-b border-indigo-100' : 'hover:bg-gray-50'}`}
                  onClick={() => toggleCat(cat.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl shadow-inner ${isCatExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <Folder size={28} className={isCatExpanded ? 'fill-indigo-500' : 'fill-gray-200'} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-800">{cat.nama_kegiatan}</h3>
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-500 mt-1">
                        <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">{catArcs.length} Tahun Data</span>
                        {cat.deskripsi && <span className="text-gray-400 truncate max-w-xs">{cat.deskripsi}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); setCatForm({ ...cat, template_fase: typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : cat.template_fase }); setIsCatModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors bg-white shadow-sm border border-indigo-100"><Settings size={18}/></button>
                    <button onClick={(e) => { e.stopPropagation(); handleCatDelete(cat.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors bg-white shadow-sm border border-rose-100"><Trash2 size={18}/></button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    {isCatExpanded ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
                  </div>
                </div>

                {/* Years inside Category */}
                {isCatExpanded && (
                  <div className="bg-gray-50/50 p-6">
                    <div className="mb-6 flex justify-between items-center">
                      <h4 className="font-bold text-gray-500 uppercase tracking-widest text-xs">Arsip Berdasarkan Tahun</h4>
                      <button 
                        onClick={() => { setArcForm({ id: null, kategori_id: cat.id, tahun: new Date().getFullYear(), catatan: '', fase_dokumen: [] }); setIsArcModalOpen(true); }}
                        className="bg-white border border-gray-200 hover:border-indigo-300 text-indigo-600 px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-sm"
                      >
                        <Plus size={16} /> BUKA TAHUN BARU
                      </button>
                    </div>

                    {catArcs.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 font-medium italic border-2 border-dashed border-gray-200 rounded-2xl">Belum ada arsip tahunan. Klik "Buka Tahun Baru" untuk mulai.</div>
                    ) : (
                      <div className="space-y-4">
                        {catArcs.map(arc => {
                          const yearKey = `${cat.id}-${arc.tahun}`;
                          const isYearExpanded = expandedYears.includes(yearKey);
                          const phases = typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : (arc.fase_dokumen || []);
                          const totalFiles = phases.reduce((acc: number, p: any) => acc + (p.files?.length || 0), 0);

                          return (
                            <div key={arc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                              <div 
                                className="p-4 flex justify-between items-center cursor-pointer hover:bg-indigo-50/50 transition-colors"
                                onClick={() => toggleYear(yearKey)}
                              >
                                <div className="flex items-center gap-4">
                                  <span className="bg-indigo-900 text-white text-lg font-black px-4 py-1.5 rounded-xl shadow-sm">{arc.tahun}</span>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-gray-700">{totalFiles} File Tersimpan</span>
                                    {arc.catatan && <span className="text-xs text-gray-400 truncate max-w-sm">{arc.catatan}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); setArcForm({ ...arc, fase_dokumen: phases }); setIsArcModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleArcDelete(arc.id); }} className="p-2 text-gray-400 hover:text-rose-600"><Trash2 size={16}/></button>
                                  {isYearExpanded ? <ChevronDown size={20} className="text-gray-400"/> : <ChevronRight size={20} className="text-gray-400"/>}
                                </div>
                              </div>

                              {/* Static Phases inside Year */}
                              {isYearExpanded && (
                                <div className="p-6 border-t border-gray-100 bg-gray-50/30">
                                  {arc.catatan && (
                                    <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-sm">
                                      <strong className="block mb-1 text-amber-700 uppercase tracking-widest text-[10px]">Catatan:</strong>
                                      <p className="whitespace-pre-wrap font-medium">{arc.catatan}</p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {phases.map((phase: any, pIdx: number) => (
                                      <div key={pIdx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                                          <h4 className="font-black text-gray-800 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{pIdx + 1}</span>
                                            {phase.nama_fase}
                                          </h4>
                                          <div className="flex gap-1">
                                            <label className="cursor-pointer p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Upload File Fisik">
                                              {uploadingPhase === `${arc.id}-${pIdx}` ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                              <input type="file" className="hidden" onChange={e => uploadFile(arc.id, pIdx, phases, e, cat.nama_kegiatan, arc.tahun)} disabled={uploadingPhase === `${arc.id}-${pIdx}`} />
                                            </label>
                                            <button onClick={() => addLink(arc.id, pIdx, phases)} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Beri Link GDrive"><LinkIcon size={16}/></button>
                                          </div>
                                        </div>
                                        
                                        {(!phase.files || phase.files.length === 0) ? (
                                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">Belum ada file</p>
                                        ) : (
                                          <ul className="space-y-3">
                                            {phase.files.map((file: any, fIdx: number) => (
                                              <li key={fIdx} className="group flex items-start justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-colors">
                                                <a href={file.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 w-full pr-2">
                                                  {file.type === 'link' ? <LinkIcon size={16} className="text-sky-500 mt-0.5 shrink-0" /> : <FileText size={16} className="text-indigo-500 mt-0.5 shrink-0" />}
                                                  <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-700 break-words line-clamp-2 leading-tight">{file.name}</span>
                                                </a>
                                                <button onClick={() => removeFile(arc.id, pIdx, fIdx, phases)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-100 rounded-md transition-all shrink-0">
                                                  <Trash2 size={14} />
                                                </button>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL KATEGORI (TEMPLATE FASE) */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black text-gray-800">{catForm.id ? 'Edit Kategori & Template' : 'Buat Folder Kategori Baru'}</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCatSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nama Kegiatan Besar *</label>
                <input required type="text" value={catForm.nama_kegiatan} onChange={e => setCatForm({...catForm, nama_kegiatan: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 font-black text-lg shadow-sm" placeholder="Misal: Pembayaran Gaji PNS..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Deskripsi Singkat</label>
                <input type="text" value={catForm.deskripsi} onChange={e => setCatForm({...catForm, deskripsi: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium" />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-black text-lg text-gray-800">Template Fase Statis</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Fase ini akan di-generate otomatis saat Anda membuka arsip tahun baru.</p>
                  </div>
                  <button type="button" onClick={() => setCatForm({...catForm, template_fase: [...catForm.template_fase, '']})} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1">
                    <Plus size={14} /> FASE
                  </button>
                </div>
                
                <div className="space-y-3">
                  {catForm.template_fase.map((fase, i) => (
                    <div key={i} className="flex gap-2 items-center relative">
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-black text-xs shrink-0">{i + 1}</span>
                      <input 
                        type="text" 
                        value={fase} 
                        onChange={e => {
                          const newTpl = [...catForm.template_fase];
                          newTpl[i] = e.target.value;
                          setCatForm({...catForm, template_fase: newTpl});
                        }} 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold" 
                        placeholder="Nama dokumen/tahap..." 
                      />
                      <button type="button" onClick={() => setCatForm({...catForm, template_fase: catForm.template_fase.filter((_, idx) => idx !== i)})} className="text-gray-300 hover:text-rose-500 p-2"><X size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            <div className="bg-white p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsCatModalOpen(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleCatSave} className="px-8 py-3 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200">
                <Save size={18} /> SIMPAN TEMPLATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ARCHIVE (BUKA TAHUN BARU) */}
      {isArcModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800">{arcForm.id ? 'Edit Catatan Arsip' : 'Buka Arsip Tahun Baru'}</h2>
              <button onClick={() => setIsArcModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleArcSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tahun Arsip *</label>
                <input required type="number" value={arcForm.tahun} disabled={!!arcForm.id} onChange={e => setArcForm({...arcForm, tahun: parseInt(e.target.value)})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 font-black text-2xl text-center shadow-sm disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan Ekstra (Opsional)</label>
                <textarea value={arcForm.catatan} onChange={e => setArcForm({...arcForm, catatan: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-indigo-500 font-medium h-24 resize-none" placeholder="Catatan untuk tahun ini..." />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="submit" className="w-full py-4 font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-200">
                  <Save size={18} /> {arcForm.id ? 'SIMPAN CATATAN' : 'GENERATE DARI TEMPLATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
