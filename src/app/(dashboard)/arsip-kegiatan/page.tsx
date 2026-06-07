'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderTree, Plus, Search, Edit2, Trash2, Folder, FileText, Upload, Link as LinkIcon, Loader2, Save, X, ChevronDown, ChevronRight, File, Archive, Settings } from 'lucide-react';

import Select from 'react-select';

export default function ArsipKegiatanPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

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
    const [{ data: catData, error: catErr }, { data: arcData, error: arcErr }] = await Promise.all([
      supabase.from('app_arsip_kategori').select('*').order('nama_kegiatan', { ascending: true }),
      supabase.from('app_arsip_kegiatan').select('*, app_arsip_kategori(nama_kegiatan)').order('tahun', { ascending: false })
    ]);
    
    if (catErr) alert('Gagal memuat kategori: ' + catErr.message);
    if (arcErr) alert('Gagal memuat arsip: ' + arcErr.message);
    
    setCategories(catData || []);
    setArchives(arcData || []);
    setLoading(false);
  };

  const allYears = Array.from(new Set(archives.map(a => a.tahun))).sort((a, b) => b - a);
  if (allYears.length === 0) allYears.push(new Date().getFullYear());

  // --- CATEGORY LOGIC ---
  const handleCatSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...catForm, template_fase: JSON.stringify(catForm.template_fase.filter(t => t.trim() !== '')) };
    let err;
    if (catForm.id) {
      const { id, ...updateData } = payload;
      const { error } = await supabase.from('app_arsip_kategori').update(updateData).eq('id', catForm.id);
      err = error;
    } else {
      const { id, ...insertData } = payload;
      const { error } = await supabase.from('app_arsip_kategori').insert([insertData]);
      err = error;
    }
    
    if (err) {
      alert('Gagal menyimpan kategori: ' + err.message);
      return;
    }
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
    let err;
    if (arcForm.id) {
      const { error } = await supabase.from('app_arsip_kegiatan').update({ catatan: arcForm.catatan, fase_dokumen: arcForm.fase_dokumen }).eq('id', arcForm.id);
      err = error;
    } else {
      // Init from template
      const cat = categories.find(c => c.id === arcForm.kategori_id);
      let phases = [];
      if (cat && cat.template_fase) {
         const tpl = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : cat.template_fase;
         phases = tpl.map((nama: string) => ({ nama_fase: nama, files: [] }));
      }
      const { error } = await supabase.from('app_arsip_kegiatan').insert([{ kategori_id: arcForm.kategori_id, tahun: arcForm.tahun, catatan: arcForm.catatan, fase_dokumen: phases }]);
      err = error;
    }
    
    if (err) {
      alert('Gagal menyimpan arsip tahun: ' + err.message);
      return;
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
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 z-10 relative">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Pilih Kegiatan Besar</label>
          <Select 
            options={categories.map(c => ({ value: c.id, label: c.nama_kegiatan }))}
            value={categories.filter(c => c.id === selectedCatId).map(c => ({ value: c.id, label: c.nama_kegiatan }))[0] || null}
            onChange={(val: any) => setSelectedCatId(val ? val.value : null)}
            placeholder="Pilih Kegiatan Besar..."
            styles={{
              control: (base) => ({ ...base, borderRadius: '0.75rem', padding: '0.2rem', border: '1px solid #e5e7eb', fontWeight: 'bold', backgroundColor: '#f9fafb' })
            }}
          />
        </div>
        <div className="w-full md:w-[600px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sandingkan Tahun</label>
          <Select
            isMulti
            options={allYears.map(y => ({ value: y, label: String(y) }))}
            value={selectedYears.map(y => ({ value: y, label: String(y) }))}
            onChange={(val: any) => setSelectedYears(val ? val.map((v: any) => v.value) : [])}
            placeholder="Pilih tahun..."
            styles={{
              control: (base) => ({ ...base, borderRadius: '0.75rem', padding: '0.2rem', border: '1px solid #e5e7eb', fontWeight: 'bold', backgroundColor: '#f9fafb' }),
              multiValue: (base) => ({ ...base, backgroundColor: '#4f46e5', borderRadius: '0.5rem' }),
              multiValueLabel: (base) => ({ ...base, color: 'white', fontWeight: 'bold' }),
              multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#4338ca', color: 'white' } })
            }}
          />
        </div>
      </div>

      {/* Matrix View */}
      {selectedCatId ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {(() => {
            const cat = categories.find(c => c.id === selectedCatId);
            if (!cat) return null;
            
            const phases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);

            return (
              <div className="overflow-x-auto custom-scrollbar pb-4">
                <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center min-w-[1000px]">
                  <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><Folder size={24} className="text-indigo-600"/> {cat.nama_kegiatan}</h2>
                    {cat.deskripsi && <p className="text-sm text-gray-500 font-medium mt-1">{cat.deskripsi}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => { setCatForm({ ...cat, template_fase: phases }); setIsCatModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors bg-white shadow-sm border border-indigo-100"><Settings size={18}/></button>
                    <button onClick={() => { handleCatDelete(cat.id); setSelectedCatId(null); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors bg-white shadow-sm border border-rose-100"><Trash2 size={18}/></button>
                  </div>
                </div>

                {selectedYears.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold italic min-w-[1000px]">Silakan pilih minimal 1 tahun di filter atas untuk menampilkan tabel matriks dokumen.</div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase tracking-wider text-xs">
                        <th className="p-4 border-r border-slate-700 min-w-[300px] sticky left-0 bg-slate-900 z-20 font-black shadow-[4px_0_10px_rgba(0,0,0,0.2)]">Tahapan / Fase Dokumen</th>
                        {selectedYears.map((y: number) => (
                          <th key={y} className="p-4 text-center border-r border-slate-700 bg-slate-800 font-black w-[350px]">
                            TAHUN {y}
                            <div className="text-[10px] font-normal text-indigo-200 normal-case mt-1">Arsip Kegiatan</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {phases.map((phaseName: string, pIdx: number) => (
                        <tr key={pIdx} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="p-4 sticky left-0 bg-white group-hover:bg-indigo-50/30 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 align-top">
                            <h4 className="font-black text-gray-800 flex items-start gap-3 text-sm">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">{pIdx + 1}</span>
                              <span className="mt-0.5">{phaseName}</span>
                            </h4>
                          </td>
                          {selectedYears.map((y: number) => {
                            const arc = archives.find(a => a.tahun === y && a.kategori_id === selectedCatId);
                            if (!arc) {
                              return (
                                <td key={`${pIdx}-${y}`} className="p-4 border-r border-gray-100 text-center align-middle bg-gray-50/50">
                                  {pIdx === 0 && (
                                    <button 
                                      onClick={() => { setArcForm({ id: null, kategori_id: selectedCatId, tahun: y, catatan: '', fase_dokumen: [] }); setIsArcModalOpen(true); }}
                                      className="bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-600 px-4 py-2 rounded-xl font-black text-xs inline-flex items-center gap-2 shadow-sm transition-all"
                                    >
                                      <Plus size={16} /> BUKA ARSIP {y}
                                    </button>
                                  )}
                                  {pIdx > 0 && <span className="text-[10px] text-gray-400 italic">Menunggu arsip dibuka...</span>}
                                </td>
                              );
                            }
                            
                            // Arsip is available. Find the phase.
                            const arcPhases = typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : (arc.fase_dokumen || []);
                            const arcPhaseIdx = arcPhases.findIndex((f: any) => f.nama_fase === phaseName);
                            const phaseData = arcPhaseIdx >= 0 ? arcPhases[arcPhaseIdx] : null;

                            return (
                              <td key={`${pIdx}-${y}`} className="p-4 border-r border-gray-100 align-top bg-white">
                                {!phaseData ? (
                                  <span className="text-[10px] text-gray-400 italic block text-center mt-4">Fase tidak ditemukan di tahun ini.</span>
                                ) : (
                                  <div>
                                    <div className="flex justify-end gap-1 mb-3">
                                      <label className="cursor-pointer px-2 py-1 bg-gray-100 text-gray-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1 shadow-sm" title="Upload File Fisik">
                                        {uploadingPhase === `${arc.id}-${arcPhaseIdx}` ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload
                                        <input type="file" className="hidden" onChange={e => uploadFile(arc.id, arcPhaseIdx, arcPhases, e, cat.nama_kegiatan, arc.tahun)} disabled={uploadingPhase === `${arc.id}-${arcPhaseIdx}`} />
                                      </label>
                                      <button onClick={() => addLink(arc.id, arcPhaseIdx, arcPhases)} className="px-2 py-1 bg-gray-100 text-gray-600 hover:text-white hover:bg-sky-600 rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1 shadow-sm" title="Beri Link GDrive"><LinkIcon size={12}/> Link</button>
                                    </div>
                                    
                                    {(!phaseData.files || phaseData.files.length === 0) ? (
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center py-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">KOSONG</p>
                                    ) : (
                                      <ul className="space-y-2">
                                        {phaseData.files.map((file: any, fIdx: number) => (
                                          <li key={fIdx} className="group flex items-start justify-between p-2 rounded-lg bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-colors">
                                            <a href={file.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 w-full pr-2 overflow-hidden">
                                              {file.type === 'link' ? <LinkIcon size={14} className="text-sky-500 mt-0.5 shrink-0" /> : <FileText size={14} className="text-indigo-500 mt-0.5 shrink-0" />}
                                              <span className="text-[11px] font-bold text-gray-700 group-hover:text-indigo-700 break-words line-clamp-2 leading-tight" title={file.name}>{file.name}</span>
                                            </a>
                                            <button onClick={() => removeFile(arc.id, arcPhaseIdx, fIdx, arcPhases)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-100 rounded-md transition-all shrink-0">
                                              <Trash2 size={12} />
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center shadow-sm">
           <FolderTree size={64} className="mx-auto text-indigo-200 mb-4" />
           <p className="text-gray-400 font-bold italic text-lg">Silakan pilih "Kegiatan Besar" pada filter di atas untuk memulai.</p>
        </div>
      )}

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
