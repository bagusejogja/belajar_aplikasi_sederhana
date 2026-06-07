'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderTree, Plus, Search, Edit2, Trash2, Folder, FileText, Upload, Link as LinkIcon, Loader2, Save, X, ChevronDown, ChevronRight, File, Archive, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';

export default function ArsipKegiatanPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // View States
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [expandedCats, setExpandedCats] = useState<number[]>([]);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);

  const toggleCat = (id: number) => {
    setExpandedCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const toggleYear = (key: string) => {
    setExpandedYears(prev => {
       const catId = key.split('-')[0];
       const filtered = prev.filter(k => !k.startsWith(`${catId}-`));
       if (prev.includes(key)) return filtered;
       return [...filtered, key];
    });
  };

  // Modal Category
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ id: null as any, nama_kegiatan: '', deskripsi: '', template_fase: [{nama_fase: ''}] as any[] });

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
    
    if (catErr) toast.error('Gagal memuat kategori: ' + catErr.message);
    if (arcErr) toast.error('Gagal memuat arsip: ' + arcErr.message);
    
    setCategories(catData || []);
    setArchives(arcData || []);
    setLoading(false);
  };

  const confirmAction = (msg: string, onConfirm: () => void) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-bold text-sm text-gray-800">{msg}</span>
        <div className="flex gap-2 justify-end">
          <button onClick={() => { toast.dismiss(t.id); onConfirm(); }} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Ya, Lanjutkan</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 transition-colors">Batal</button>
        </div>
      </div>
    ), { duration: Infinity, style: { border: '1px solid #fee2e2' } });
  };

  const currentYear = new Date().getFullYear();
  const dbYears = archives.map(a => a.tahun);
  const startYear = 2023;
  const endYear = currentYear + 1;
  const baseYears = [];
  for (let y = startYear; y <= endYear; y++) {
    baseYears.push(y);
  }
  const allYears = Array.from(new Set([...dbYears, ...baseYears])).sort((a, b) => b - a);

  // --- CATEGORY LOGIC ---
  const handleCatSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...catForm, template_fase: JSON.stringify(catForm.template_fase.filter((t: any) => t.nama_fase && t.nama_fase.trim() !== '')) };
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
      toast.error('Gagal menyimpan kategori: ' + err.message);
      return;
    }
    toast.success('Kategori berhasil disimpan!');
    setIsCatModalOpen(false);
    fetchData();
  };

  const handleCatDelete = async (id: number) => {
    const hasArchives = archives.some(a => a.kategori_id === id);
    if (hasArchives) {
       toast.error('Gagal! Folder ini sudah berisi arsip tahunan. Harap hapus arsip tahunannya terlebih dahulu.', { duration: 5000 });
       return;
    }
    confirmAction('Yakin ingin menghapus Folder Kategori ini?', async () => {
      await supabase.from('app_arsip_kategori').delete().eq('id', id);
      toast.success('Kategori dihapus');
      if (selectedCatId === id) setSelectedCatId(null);
      fetchData();
    });
  };

  // --- ARCHIVE LOGIC ---
  const handleArcSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arcForm.id) {
       const exists = archives.find(a => a.tahun === arcForm.tahun && a.kategori_id === arcForm.kategori_id);
       if (exists) {
          toast.error(`Arsip tahun ${arcForm.tahun} sudah ada!`);
          return;
       }
    }
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
         phases = tpl.map((p: any) => ({ nama_fase: typeof p === 'string' ? p : p.nama_fase, files: [] }));
      }
      const { error } = await supabase.from('app_arsip_kegiatan').insert([{ kategori_id: arcForm.kategori_id, tahun: arcForm.tahun, catatan: arcForm.catatan, fase_dokumen: phases }]);
      err = error;
    }
    
    if (err) {
      toast.error('Gagal menyimpan arsip tahun: ' + err.message);
      return;
    }
    toast.success('Arsip berhasil disimpan!');
    setIsArcModalOpen(false);
    fetchData();
  };

  const handleArcDelete = async (id: number) => {
    confirmAction('Yakin ingin menghapus arsip tahun ini?', async () => {
      await supabase.from('app_arsip_kegiatan').delete().eq('id', id);
      toast.success('Arsip dihapus');
      fetchData();
    });
  };

  // --- FILE LOGIC ---
  const addLink = async (arcId: number, phaseIdx: number, phases: any[], catName: string, tahun: number) => {
    const url = prompt('Masukkan URL Google Drive / Link lainnya:');
    if (!url) return;
    const defaultName = `${tahun} ${catName} ${phases[phaseIdx].nama_fase}`;
    const name = prompt('Masukkan nama file/tautan (misal: Undangan Rapat):', defaultName) || defaultName;
    
    const newPhases = [...phases];
    newPhases[phaseIdx].files.push({ name, url, type: 'link', uploaded_at: new Date().toISOString() });
    await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
    fetchData();
  };

  const uploadFile = async (arcId: number, phaseIdx: number, phases: any[], e: React.ChangeEvent<HTMLInputElement>, catName: string, tahun: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB!');
      return;
    }

    setUploadingPhase(`${arcId}-${phaseIdx}`);
    const toastId = toast.loading('Mengunggah file...');
    const formData = new FormData();
    formData.append('file', file);
    const safeFolderName = catName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'arsip_umum';
    formData.append('folder', `arsip_kegiatan/${safeFolderName}/${tahun}`);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const newPhases = [...phases];
        
        // Format nama file: [tahun]_[kegiatanbesar]_[fasedokumen]
        const safeCatName = catName.replace(/[^a-zA-Z0-9]/g, '_');
        const safePhaseName = phases[phaseIdx].nama_fase.replace(/[^a-zA-Z0-9]/g, '_');
        const extMatch = file.name.match(/\.[0-9a-z]+$/i);
        const ext = extMatch ? extMatch[0] : '';
        const newFileName = `${tahun}_${safeCatName}_${safePhaseName}${ext}`;

        newPhases[phaseIdx].files.push({ name: newFileName, url: data.publicUrl, type: 'file', uploaded_at: new Date().toISOString() });
        await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
        toast.success('File berhasil diunggah!', { id: toastId });
        fetchData();
      } else {
        toast.error('Gagal upload: ' + data.error, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat upload', { id: toastId });
    } finally {
      setUploadingPhase(null);
    }
  };

  const removeFile = async (arcId: number, phaseIdx: number, fileIdx: number, phases: any[]) => {
    confirmAction('Yakin ingin mencabut file ini dari daftar?', async () => {
      const newPhases = [...phases];
      newPhases[phaseIdx].files = newPhases[phaseIdx].files.filter((_: any, i: number) => i !== fileIdx);
      await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
      toast.success('File dicabut');
      fetchData();
    });
  };

  const editPhaseNote = async (arcId: number, phaseIdx: number, phases: any[]) => {
    const note = prompt('Masukkan catatan untuk fase ini:', phases[phaseIdx].catatan || '');
    if (note === null) return;
    const newPhases = [...phases];
    newPhases[phaseIdx].catatan = note;
    await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
    fetchData();
  };

  const editGlobalNote = async (catId: number, phaseIdx: number, phases: any[]) => {
    const note = prompt(`Masukkan catatan GLOBAL untuk "${phases[phaseIdx].nama_fase}":\n(Berlaku untuk semua tahun)`, phases[phaseIdx].catatan_global || '');
    if (note === null) return;
    const newPhases = [...phases];
    newPhases[phaseIdx].catatan_global = note;
    await supabase.from('app_arsip_kategori').update({ template_fase: JSON.stringify(newPhases) }).eq('id', catId);
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
          onClick={() => { setCatForm({ id: null, nama_kegiatan: '', deskripsi: '', template_fase: [{nama_fase: 'Tahap 1', catatan_global: ''}, {nama_fase: 'Tahap 2', catatan_global: ''}] }); setIsCatModalOpen(true); }}
          className="relative z-10 bg-white text-indigo-800 hover:bg-gray-100 px-6 py-3 rounded-2xl font-black transition-transform hover:scale-105 flex items-center gap-2 drop-shadow-md border-b-4 border-indigo-200"
        >
          <Plus size={20} /> BUAT FOLDER KEGIATAN
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end gap-2 relative z-10">
        <button onClick={() => setViewMode('list')} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
          <Folder size={18} /> Tampilan List
        </button>
        <button onClick={() => setViewMode('matrix')} className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${viewMode === 'matrix' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}>
          <Archive size={18} /> Sandingkan Tahun
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4 z-10 relative">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Pilih Kegiatan Besar</label>
          <Select 
            options={[{ value: null, label: '— SEMUA KEGIATAN BESAR (KOMPLIT) —' }, ...categories.map(c => ({ value: c.id, label: c.nama_kegiatan }))]}
            value={selectedCatId ? { value: selectedCatId, label: categories.find(c => c.id === selectedCatId)?.nama_kegiatan } : { value: null, label: '— SEMUA KEGIATAN BESAR (KOMPLIT) —' }}
            onChange={(val: any) => setSelectedCatId(val && val.value !== null ? val.value : null)}
            placeholder="Cari atau pilih kegiatan..."
            isClearable
            styles={{
              control: (base) => ({ ...base, borderRadius: '0.75rem', padding: '0.2rem', border: '1px solid #e5e7eb', fontWeight: 'bold', backgroundColor: '#f9fafb' })
            }}
          />
        </div>
        {viewMode === 'matrix' && (
          <div className="w-full md:w-[600px] animate-in slide-in-from-right-4 duration-300">
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
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full">
          <div className="animate-pulse flex flex-col gap-6">
             <div className="flex gap-4">
               <div className="h-10 bg-indigo-50 rounded-xl w-1/4"></div>
               <div className="h-10 bg-indigo-50 rounded-xl w-1/4"></div>
             </div>
             <div className="h-[400px] bg-gray-50 rounded-2xl w-full border border-gray-100"></div>
          </div>
        </div>
      ) : viewMode === 'matrix' ? (
        <>
          {selectedCatId ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          {(() => {
            const cat = categories.find(c => c.id === selectedCatId);
            if (!cat) return null;
            
            const phases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);
            const normalizedPhases = phases.map((p: any) => typeof p === 'string' ? { nama_fase: p, catatan_global: '' } : p);

            return (
              <div className="overflow-x-auto custom-scrollbar pb-4">
                <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center min-w-[1000px]">
                  <div>
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2"><Folder size={24} className="text-indigo-600"/> {cat.nama_kegiatan}</h2>
                    {cat.deskripsi && <p className="text-sm text-gray-500 font-medium mt-1">{cat.deskripsi}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => { setCatForm({ ...cat, template_fase: normalizedPhases }); setIsCatModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors bg-white shadow-sm border border-indigo-100"><Settings size={18}/></button>
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
                          <th key={y} className="p-4 text-center border-r border-slate-700 bg-slate-800 font-black w-[350px] group relative">
                            <div className="flex items-center justify-center gap-2">
                              <span>TAHUN {y}</span>
                              <button onClick={() => {
                                const arc = archives.find(a => a.tahun === y && a.kategori_id === selectedCatId);
                                  if (arc) {
                                    setArcForm({ ...arc, fase_dokumen: typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : arc.fase_dokumen });
                                    setIsArcModalOpen(true);
                                  } else {
                                    toast.error('Buka arsip tahun ini terlebih dahulu sebelum mengeditnya.');
                                  }
                              }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 transition-opacity" title="Edit Arsip Tahun Ini"><Edit2 size={12}/></button>
                            </div>
                            <div className="text-[10px] font-normal text-indigo-200 normal-case mt-1">{cat.nama_kegiatan}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {normalizedPhases.map((phaseItem: any, pIdx: number) => {
                        const phaseName = phaseItem.nama_fase;
                        return (
                        <tr key={pIdx}>
                          <td className="p-4 sticky left-0 bg-white border-r border-gray-100 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)] align-top group/global">
                            <h3 className="font-black text-gray-800 flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs shrink-0 mt-0.5">{pIdx + 1}</span>
                              <span className="mt-1">{phaseName}</span>
                            </h3>
                            <div className="mt-3 pl-9">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Catatan Global:</span>
                                <button onClick={() => editGlobalNote(cat.id, pIdx, normalizedPhases)} className="opacity-0 group-hover/global:opacity-100 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded transition-opacity"><Edit2 size={10} className="inline mr-1" />Edit</button>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{phaseItem.catatan_global || <span className="italic text-gray-400">Belum ada catatan...</span>}</p>
                            </div>
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
                                  <div className="flex flex-col h-full">
                                    <div className="flex justify-between items-start gap-1 mb-3">
                                      <div className="flex-1 mr-2 group/note relative border-l-2 border-amber-300 pl-2">
                                        <p className="text-[10px] text-amber-900 leading-tight">
                                          <span className="font-bold text-amber-700 uppercase block mb-0.5 text-[9px] tracking-wider">Catatan Fase:</span>
                                          {phaseData.catatan || <span className="text-amber-500/50 italic">Kosong...</span>}
                                        </p>
                                        <button onClick={() => editPhaseNote(arc.id, arcPhaseIdx, arcPhases)} className="absolute top-0 right-0 opacity-0 group-hover/note:opacity-100 bg-white/80 p-0.5 rounded text-amber-600 hover:text-amber-800 transition-all"><Edit2 size={10}/></button>
                                      </div>
                                      <div className="flex gap-1 shrink-0 flex-col sm:flex-row">
                                        <label className="cursor-pointer px-2 py-1 bg-gray-100 text-gray-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1 shadow-sm" title="Upload File Fisik">
                                          {uploadingPhase === `${arc.id}-${arcPhaseIdx}` ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload
                                          <input type="file" className="hidden" onChange={e => uploadFile(arc.id, arcPhaseIdx, arcPhases, e, cat.nama_kegiatan, arc.tahun)} disabled={uploadingPhase === `${arc.id}-${arcPhaseIdx}`} />
                                        </label>
                                        <button onClick={() => addLink(arc.id, arcPhaseIdx, arcPhases, cat.nama_kegiatan, arc.tahun)} className="px-2 py-1 bg-gray-100 text-gray-600 hover:text-white hover:bg-sky-600 rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1 shadow-sm" title="Beri Link GDrive"><LinkIcon size={12}/> Link</button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                    {(!phaseData.files || phaseData.files.length === 0) ? (
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center py-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">KOSONG</p>
                                    ) : (
                                      <ul className="space-y-2">
                                        {phaseData.files.map((file: any, fIdx: number) => (
                                          <li key={fIdx} className="group flex items-start justify-between p-2 rounded-lg bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-colors">
                                            <a href={file.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 w-full pr-2 overflow-hidden">
                                              {file.type === 'link' ? <LinkIcon size={14} className="text-sky-500 mt-0.5 shrink-0" /> : <FileText size={14} className="text-indigo-500 mt-0.5 shrink-0" />}
                                              <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-700 group-hover:text-indigo-700 break-words line-clamp-2 leading-tight" title={file.name}>{file.name}</span>
                                                {file.uploaded_at && <span className="text-[9px] text-gray-400 mt-0.5 font-normal">{new Date(file.uploaded_at).toLocaleString('id-ID')}</span>}
                                              </div>
                                            </a>
                                            <button onClick={() => removeFile(arc.id, arcPhaseIdx, fIdx, arcPhases)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-100 rounded-md transition-all shrink-0">
                                              <Trash2 size={12} />
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    </div>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        );
                      })}
                      
                      {/* CATATAN TAHUNAN ROW */}
                      <tr className="bg-amber-50/50 hover:bg-amber-50 transition-colors group">
                        <td className="p-4 sticky left-0 bg-amber-50/80 group-hover:bg-amber-50 border-r border-amber-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 align-top">
                          <h4 className="font-black text-amber-800 flex items-start gap-3 text-sm">
                            <span className="mt-0.5">Catatan Umum Tahunan</span>
                          </h4>
                          <p className="text-[10px] text-amber-600 mt-1">Catatan untuk keseluruhan arsip di tahun tersebut.</p>
                        </td>
                        {selectedYears.map((y: number) => {
                          const arc = archives.find(a => a.tahun === y && a.kategori_id === selectedCatId);
                          if (!arc) {
                             return <td key={`catatan-${y}`} className="p-4 border-r border-gray-100 text-center align-middle bg-gray-50/50"></td>;
                          }
                          return (
                            <td key={`catatan-${y}`} className="p-4 border-r border-amber-100 align-top">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Isi Catatan:</span>
                                  <button onClick={() => { setArcForm({ ...arc, fase_dokumen: typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : arc.fase_dokumen }); setIsArcModalOpen(true); }} className="text-[10px] bg-white border border-amber-200 text-amber-600 px-2 py-1 rounded hover:bg-amber-100 font-bold transition-colors shadow-sm">Edit Catatan</button>
                               </div>
                               <p className="text-xs text-amber-900 whitespace-pre-wrap">{arc.catatan || <span className="text-amber-400 italic">Belum ada catatan...</span>}</p>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 py-24 text-center shadow-sm animate-in zoom-in-95 duration-300">
           <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 mb-6">
             <FolderTree size={48} className="text-indigo-400" />
           </div>
           <h3 className="text-2xl font-black text-gray-800 mb-3">Pilih Kegiatan Besar</h3>
           <p className="text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
             Silakan pilih "Kegiatan Besar" pada filter di atas untuk mulai mengelola dan melihat arsip dokumen tahunan.
           </p>
        </div>
      )}
      </>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          {(() => {
            const filteredCats = selectedCatId ? categories.filter(c => c.id === selectedCatId) : categories;
            if (filteredCats.length === 0) return <div className="bg-white rounded-3xl border border-gray-100 py-20 text-center text-gray-400 font-bold italic shadow-sm">Belum ada folder kegiatan.</div>;
            return filteredCats.map(cat => {
              const isCatExpanded = expandedCats.includes(cat.id);
              const catArcs = archives.filter(a => a.kategori_id === cat.id);

              return (
                <div key={cat.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
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
                        <div>
                          {/* Horizontal Tab Buttons */}
                          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {catArcs.map(arc => {
                              const yearKey = `${cat.id}-${arc.tahun}`;
                              const isYearExpanded = expandedYears.includes(yearKey);
                              const phases = typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : (arc.fase_dokumen || []);
                              const totalFiles = phases.reduce((acc: number, p: any) => acc + (p.files?.length || 0), 0);

                              return (
                                <div 
                                  key={arc.id}
                                  onClick={() => toggleYear(yearKey)}
                                  className={`cursor-pointer flex-shrink-0 w-56 p-5 rounded-2xl border transition-all duration-300 ${isYearExpanded ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 -translate-y-1' : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:shadow-sm'}`}
                                >
                                  <div className="flex justify-between items-center mb-3">
                                     <span className="text-3xl font-black">{arc.tahun}</span>
                                     <div className="flex gap-1.5">
                                        <button onClick={(e) => { e.stopPropagation(); setArcForm({ ...arc, fase_dokumen: phases }); setIsArcModalOpen(true); }} className={`p-2 rounded-xl transition-colors ${isYearExpanded ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}><Edit2 size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleArcDelete(arc.id); }} className={`p-2 rounded-xl transition-colors ${isYearExpanded ? 'bg-rose-500 hover:bg-rose-400 text-white' : 'bg-rose-50 hover:bg-rose-100 text-rose-500'}`}><Trash2 size={14}/></button>
                                     </div>
                                  </div>
                                  <div className={`text-sm font-bold flex items-center gap-1.5 ${isYearExpanded ? 'text-indigo-200' : 'text-gray-400'}`}>
                                     <FileText size={14} /> {totalFiles} File Tersimpan
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Detail / Phase List for Active Year */}
                          {(() => {
                            const expandedArc = catArcs.find(arc => expandedYears.includes(`${cat.id}-${arc.tahun}`));
                            if (!expandedArc) return null;
                            const phases = typeof expandedArc.fase_dokumen === 'string' ? JSON.parse(expandedArc.fase_dokumen) : (expandedArc.fase_dokumen || []);

                            return (
                                <div className="mt-2 p-6 border border-indigo-100 bg-white rounded-3xl shadow-sm animate-in slide-in-from-top-4 duration-300">
                                  <div className="flex items-center gap-3 mb-6">
                                    <h4 className="font-black text-2xl text-gray-800">Arsip Tahun {expandedArc.tahun}</h4>
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                  </div>

                                  {expandedArc.catatan && (
                                    <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-900 text-sm">
                                      <strong className="block mb-1 text-amber-700 uppercase tracking-widest text-[10px]">Catatan Ekstra {expandedArc.tahun}:</strong>
                                      <p className="whitespace-pre-wrap font-medium">{expandedArc.catatan}</p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {phases.map((phase: any, pIdx: number) => {
                                      const catTemplatePhases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);
                                      const globalNote = catTemplatePhases[pIdx]?.catatan_global || phase.catatan_global;

                                      return (
                                      <div key={pIdx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                                        <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
                                          <div className="flex-1 pr-4">
                                            <h4 className="font-black text-gray-800 flex items-center gap-2">
                                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">{pIdx + 1}</span>
                                              {phase.nama_fase}
                                            </h4>
                                            {globalNote ? (
                                              <div className="group/note flex items-start gap-1 mt-1 pl-8">
                                                <p className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 flex-1 whitespace-pre-wrap leading-relaxed">{globalNote}</p>
                                                <button onClick={(e) => { e.stopPropagation(); editGlobalNote(cat.id, pIdx, catTemplatePhases); }} className="opacity-0 group-hover/note:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-all" title="Edit Catatan Global Tahapan Ini"><Edit2 size={12}/></button>
                                              </div>
                                            ) : (
                                              <button onClick={(e) => { e.stopPropagation(); editGlobalNote(cat.id, pIdx, catTemplatePhases); }} className="text-[9px] font-bold text-gray-400 hover:text-indigo-500 mt-1 pl-8 border border-dashed border-gray-300 hover:border-indigo-300 rounded px-2 py-0.5 transition-colors">+ Tambah Catatan Tahapan</button>
                                            )}
                                          </div>
                                          <div className="flex gap-1 shrink-0 ml-2">
                                            <label className="cursor-pointer p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Upload File Fisik">
                                              {uploadingPhase === `${expandedArc.id}-${pIdx}` ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                              <input type="file" className="hidden" onChange={e => uploadFile(expandedArc.id, pIdx, phases, e, cat.nama_kegiatan, expandedArc.tahun)} disabled={uploadingPhase === `${expandedArc.id}-${pIdx}`} />
                                            </label>
                                            <button onClick={() => addLink(expandedArc.id, pIdx, phases, cat.nama_kegiatan, expandedArc.tahun)} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Beri Link GDrive"><LinkIcon size={16}/></button>
                                          </div>
                                        </div>
                                        
                                        {(!phase.files || phase.files.length === 0) ? (
                                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">Belum ada file</p>
                                        ) : (
                                          <ul className="space-y-3">
                                            {phase.files.map((file: any, fIdx: number) => (
                                              <li key={fIdx} className="group flex items-start justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 transition-colors">
                                                <a href={file.url} target="_blank" rel="noreferrer" className="flex flex-col gap-0.5 w-full pr-2">
                                                  <div className="flex items-start gap-3">
                                                    {file.type === 'link' ? <LinkIcon size={16} className="text-sky-500 mt-0.5 shrink-0" /> : <FileText size={16} className="text-indigo-500 mt-0.5 shrink-0" />}
                                                    <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-700 break-words line-clamp-2 leading-tight">{file.name}</span>
                                                  </div>
                                                  {file.uploaded_at && <span className="text-[9px] font-bold text-indigo-300 ml-7">{new Date(file.uploaded_at).toLocaleString('id-ID')}</span>}
                                                </a>
                                                <button onClick={() => removeFile(expandedArc.id, pIdx, fIdx, phases)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-100 rounded-md transition-all shrink-0">
                                                  <Trash2 size={14} />
                                                </button>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    )})}
                                  </div>
                                </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
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
                  <button type="button" onClick={() => setCatForm({...catForm, template_fase: [...catForm.template_fase, {nama_fase: '', catatan_global: ''}]})} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1">
                    <Plus size={14} /> FASE
                  </button>
                </div>
                
                <div className="space-y-3">
                  {catForm.template_fase.map((faseObj, i) => (
                    <div key={i} className="flex gap-2 items-center relative">
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-black text-xs shrink-0">{i + 1}</span>
                      <input 
                        type="text" 
                        value={faseObj.nama_fase} 
                        onChange={e => {
                          const newTpl = [...catForm.template_fase];
                          newTpl[i].nama_fase = e.target.value;
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
