'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Plus, Loader2, Trash2, Edit, Save, X, Search, UploadCloud, RefreshCw, 
  CreditCard, ExternalLink, Image as ImageIcon, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import toast from 'react-hot-toast';

export default function MasterRekeningPage() {
  const [listRekening, setListRekening] = useState<any[]>([]);
  const [listBank, setListBank] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rekRes, bankRes] = await Promise.all([
        supabase.from('master_rekening').select('*, ref_bank(nama_bank)').order('created_at', { ascending: false }),
        supabase.from('ref_bank').select('*').order('nama_bank', { ascending: true })
      ]);
      if (rekRes.data) setListRekening(rekRes.data);
      if (bankRes.data) setListBank(bankRes.data);
    } catch (err: any) {
      console.error("Gagal menarik data rekening", err);
      toast.error('Gagal memuat data rekening: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedJenisFilter, pageSize]);

  const openModal = (item?: any) => {
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({ jenis: 'Vendor' });
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const uploadFile = async (file: File) => {
     const upData = new FormData();
     upData.append('file', file);
     upData.append('folder', 'buku_rekening');

     const response = await fetch('/api/upload', {
        method: 'POST',
        body: upData
     });
     const result = await response.json();
     if (!result.success) throw new Error(result.error);
     return result.publicUrl;
  };

  const handleSave = async () => {
    if (!formData.bank_id || !formData.nama_rekening?.trim() || !formData.no_rekening?.trim()) {
       toast.error("Lengkapi Bank, Nama Rekening, dan No Rekening!");
       return;
    }
    
    setIsSaving(true);
    try {
      const isEdit = !!formData.rek_id;
      let bukuUrl = formData.buku_rekening_url;
      if (selectedFile) {
         bukuUrl = await uploadFile(selectedFile);
      }

      const payload = {
         bank_id: formData.bank_id,
         nama_rekening: formData.nama_rekening.trim(),
         no_rekening: formData.no_rekening.trim(),
         jenis: formData.jenis || 'Vendor',
         catatan: formData.catatan?.trim() || '',
         buku_rekening_url: bukuUrl || null
      };
      
      if (isEdit) {
        await supabase.from('master_rekening').update(payload).eq('rek_id', formData.rek_id);
      } else {
        await supabase.from('master_rekening').insert([payload]);
      }
      toast.success('Data rekening berhasil disimpan!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus rekening ini?")) return;
    try {
      await supabase.from('master_rekening').delete().eq('rek_id', id);
      toast.success('Data rekening berhasil dihapus!');
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menghapus: ' + err.message);
    }
  };

  const [displayMode, setDisplayMode] = useState<'grouped' | 'flat'>('grouped');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return listRekening.filter(r => {
      const matchSearch = 
        (r.nama_rekening || '').toLowerCase().includes(search.toLowerCase()) || 
        (r.no_rekening || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.ref_bank?.nama_bank || '').toLowerCase().includes(search.toLowerCase());
      const matchJenis = selectedJenisFilter === 'ALL' || (r.jenis || 'Lainnya') === selectedJenisFilter;
      return matchSearch && matchJenis;
    });
  }, [listRekening, search, selectedJenisFilter]);

  const uniqueJenis = useMemo(() => {
    const list = Array.from(new Set(listRekening.map(r => r.jenis || 'Lainnya').filter(Boolean)));
    return list.sort();
  }, [listRekening]);

  // Grouped by category
  const groupedByCategory = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredData.forEach(item => {
      const cat = item.jenis || 'Lainnya';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [filteredData]);

  // Auto expand all categories when loaded
  useEffect(() => {
    if (uniqueJenis.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(uniqueJenis);
    }
  }, [uniqueJenis]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const expandAllCategories = () => setExpandedCategories(uniqueJenis);
  const collapseAllCategories = () => setExpandedCategories([]);

  // Pagination calculations (for flat view)
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (pageSize === -1) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 rounded-xl text-white shadow-xs">
              <CreditCard size={20} />
           </div>
           <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Master Rekening Bank</h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  {listRekening.length} Rekening Terdaftar
                </span>
              </div>
              <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                Kelola daftar nomor rekening bank penerima dikelompokkan berdasarkan kategori.
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
           {/* View Mode Switcher */}
           <div className="flex bg-gray-100 p-0.5 rounded-xl">
             <button
               onClick={() => setDisplayMode('grouped')}
               className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${displayMode === 'grouped' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
             >
               Grup Kategori
             </button>
             <button
               onClick={() => setDisplayMode('flat')}
               className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${displayMode === 'flat' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
             >
               Tabel Biasa
             </button>
           </div>

           {/* Jenis Filter */}
           <select
             value={selectedJenisFilter}
             onChange={(e) => setSelectedJenisFilter(e.target.value)}
             className="h-9 px-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
           >
             <option value="ALL">Semua Jenis ({listRekening.length})</option>
             {uniqueJenis.map(j => (
               <option key={j} value={j}>{j} ({listRekening.filter(r => (r.jenis || 'Lainnya') === j).length})</option>
             ))}
           </select>

           {/* Search Input */}
           <div className="relative flex-1 md:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input 
                 type="text" 
                 placeholder="Cari rekening / nama..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-9 pl-7 pr-7 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-xs font-semibold"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
           </div>

           <button
             onClick={fetchData}
             className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-colors shadow-2xs"
             title="Refresh Data"
           >
             <RefreshCw size={13} />
             <span className="hidden sm:inline">Refresh</span>
           </button>

           <button 
              onClick={() => openModal()}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
           >
              <Plus size={15} />
              <span>Tambah Rekening</span>
           </button>
        </div>
      </div>

      {/* CATEGORY CHIPS BAR & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedJenisFilter('ALL')}
            className={`px-3 py-1 rounded-xl font-bold transition-all text-xs ${selectedJenisFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Semua Kategori ({listRekening.length})
          </button>
          {uniqueJenis.map(cat => {
            const count = listRekening.filter(r => (r.jenis || 'Lainnya') === cat).length;
            const isSelected = selectedJenisFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedJenisFilter(isSelected ? 'ALL' : cat)}
                className={`px-3 py-1 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 ${isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {displayMode === 'grouped' && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
            <button onClick={expandAllCategories} className="hover:text-indigo-600 underline cursor-pointer">Buka Semua</button>
            <span>•</span>
            <button onClick={collapseAllCategories} className="hover:text-indigo-600 underline cursor-pointer">Tutup Semua</button>
          </div>
        )}
      </div>

      {/* CONTENT AREA: GROUPED VIEW vs FLAT VIEW */}
      {loading ? (
        <div className="bg-white rounded-2xl p-20 border border-gray-200/80 flex flex-col items-center justify-center text-gray-400 gap-3 shadow-xs">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
          <p className="text-xs font-bold text-gray-500">Memuat data rekening...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-gray-200/80 flex flex-col items-center justify-center text-gray-400 gap-2 shadow-xs">
          <AlertTriangle size={32} className="text-gray-300" />
          <p className="text-xs font-bold text-gray-500">Belum ada data rekening yang sesuai filter</p>
        </div>
      ) : displayMode === 'grouped' ? (
        /* ================= GROUPED CATEGORY VIEW ================= */
        <div className="space-y-4">
          {Object.entries(groupedByCategory).map(([category, items]) => {
            const isExpanded = expandedCategories.includes(category);
            
            // Bank distribution in this category
            const bankCounts: Record<string, number> = {};
            items.forEach(it => {
              const bName = it.ref_bank?.nama_bank || 'Lainnya';
              bankCounts[bName] = (bankCounts[bName] || 0) + 1;
            });

            return (
              <div key={category} className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden transition-all">
                
                {/* Category Group Header Banner */}
                <div 
                  onClick={() => toggleCategory(category)}
                  className="p-4 px-5 bg-gradient-to-r from-gray-50 via-white to-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-gray-100/60 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black text-sm">
                      {category.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-gray-900 tracking-tight">
                          Kategori: {category}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          {items.length} Rekening
                        </span>
                      </div>
                      
                      {/* Bank Pills summary */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {Object.entries(bankCounts).map(([bName, bCnt]) => (
                          <span key={bName} className="text-[10px] bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-md border border-gray-200/60">
                            {bName}: <strong className="text-gray-800 font-bold">{bCnt}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <span>{isExpanded ? 'Sembunyikan' : 'Tampilkan'}</span>
                    <div className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </div>
                </div>

                {/* Category Table Content */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[10px] tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="py-2.5 px-5">Nama Pemilik Rekening</th>
                          <th className="py-2.5 px-5">Bank</th>
                          <th className="py-2.5 px-5">No. Rekening</th>
                          <th className="py-2.5 px-5 text-center">Buku Tabungan</th>
                          <th className="py-2.5 px-5 text-center w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <tr key={item.rek_id} className="hover:bg-indigo-50/20 transition-colors group">
                            {/* Nama Rekening */}
                            <td className="py-3 px-5">
                              <p className="font-black text-gray-900 text-xs md:text-sm group-hover:text-indigo-700 transition-colors">
                                {item.nama_rekening}
                              </p>
                              {item.catatan && (
                                <p className="text-[10px] text-gray-400 line-clamp-1 italic mt-0.5">{item.catatan}</p>
                              )}
                            </td>

                            {/* Bank */}
                            <td className="py-3 px-5">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold border border-blue-200/80 rounded-md text-[11px]">
                                {item.ref_bank?.nama_bank || '-'}
                              </span>
                            </td>

                            {/* No Rekening */}
                            <td className="py-3 px-5 font-mono font-bold text-gray-800 text-xs">
                              {item.no_rekening}
                            </td>

                            {/* Lampiran Buku Rekening */}
                            <td className="py-3 px-5 text-center">
                              {item.buku_rekening_url ? (
                                <a 
                                  href={item.buku_rekening_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                                  title="Buka lampiran buku rekening"
                                >
                                  <ImageIcon size={11} />
                                  <span>Lihat Foto</span>
                                </a>
                              ) : (
                                <span className="text-gray-300 text-xs italic">-</span>
                              )}
                            </td>

                            {/* Aksi */}
                            <td className="py-3 px-5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => openModal(item)} 
                                  className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-2xs cursor-pointer" 
                                  title="Edit"
                                >
                                  <Edit size={12} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(item.rek_id)} 
                                  className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors shadow-2xs cursor-pointer" 
                                  title="Hapus"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        /* ================= FLAT TABLE VIEW ================= */
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50/80 text-gray-400 font-black uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-5">Nama Pemilik Rekening</th>
                  <th className="py-3 px-5">Bank</th>
                  <th className="py-3 px-5">No. Rekening</th>
                  <th className="py-3 px-5">Kategori</th>
                  <th className="py-3 px-5 text-center">Buku Tabungan</th>
                  <th className="py-3 px-5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((item) => (
                  <tr key={item.rek_id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-3 px-5">
                      <p className="font-black text-gray-900 text-xs md:text-sm group-hover:text-indigo-700 transition-colors">
                        {item.nama_rekening}
                      </p>
                      {item.catatan && (
                        <p className="text-[10px] text-gray-400 line-clamp-1 italic mt-0.5">{item.catatan}</p>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold border border-blue-200/80 rounded-md">
                        {item.ref_bank?.nama_bank || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-gray-800 text-xs">
                      {item.no_rekening}
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-bold rounded-md border border-gray-200 text-[10px]">
                        {item.jenis || 'Lainnya'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {item.buku_rekening_url ? (
                        <a 
                          href={item.buku_rekening_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                          title="Buka lampiran buku rekening"
                        >
                          <ImageIcon size={11} />
                          <span>Lihat Foto</span>
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => openModal(item)} 
                          className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-2xs" 
                          title="Edit"
                        >
                          <Edit size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.rek_id)} 
                          className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors shadow-2xs" 
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
            <div className="flex items-center gap-2">
              <span>
                Menampilkan <strong className="text-gray-900">{pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}</strong> - <strong className="text-gray-900">{pageSize === -1 ? filteredData.length : Math.min(currentPage * pageSize, filteredData.length)}</strong> dari <strong className="text-gray-900">{filteredData.length}</strong> rekening
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-bold uppercase">Baris:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>Semua</option>
                </select>
              </div>

              {pageSize !== -1 && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                    title="Halaman Pertama"
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                    title="Sebelumnya"
                  >
                    ‹ Prev
                  </button>
                  
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black">
                    Hal {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs text-xs font-bold"
                    title="Selanjutnya"
                  >
                    Next ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-gray-600 transition-colors shadow-2xs font-bold text-xs"
                    title="Halaman Terakhir"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 border border-gray-100">
              <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                 <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                       <CreditCard size={16} />
                    </div>
                    <h3 className="text-base font-black text-gray-900 leading-none">
                      {formData.rek_id ? 'Edit Rekening Bank' : 'Tambah Rekening Baru'}
                    </h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"><X size={18}/></button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                 <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Pilih Bank <span className="text-rose-500">*</span>
                    </label>
                    <Select
                       options={listBank.map(b => ({ value: b.id, label: b.nama_bank }))}
                       value={formData.bank_id ? { value: formData.bank_id, label: listBank.find(b => b.id === formData.bank_id)?.nama_bank } : null}
                       onChange={(val: any) => setFormData({...formData, bank_id: val?.value})}
                       placeholder="Pilih bank..."
                       className="text-xs font-bold"
                       styles={{ control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb' }) }}
                    />
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nama Pemilik Rekening <span className="text-rose-500">*</span>
                    </label>
                    <input 
                       type="text" 
                       value={formData.nama_rekening || ''} 
                       onChange={e => setFormData({...formData, nama_rekening: e.target.value})}
                       className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-gray-800 outline-none"
                       placeholder="Contoh: PT. Maju Bersama / Budi Santoso"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nomor Rekening <span className="text-rose-500">*</span>
                    </label>
                    <input 
                       type="text" 
                       value={formData.no_rekening || ''} 
                       onChange={e => setFormData({...formData, no_rekening: e.target.value})}
                       className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono font-bold text-gray-800 outline-none"
                       placeholder="Contoh: 1234567890"
                    />
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Kategori Jenis</label>
                    <select 
                       value={formData.jenis || 'Vendor'} 
                       onChange={e => setFormData({...formData, jenis: e.target.value})}
                       className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-gray-800 outline-none bg-white"
                    >
                       <option value="Vendor">Vendor / Rekanan</option>
                       <option value="Penceramah">Penceramah</option>
                       <option value="Takmir">Takmir</option>
                       <option value="Institusi">Institusi / Lembaga</option>
                       <option value="Lainnya">Lainnya</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Foto / Scan Buku Rekening (Opsional)</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center relative hover:bg-indigo-50/30 transition-all min-h-[100px] p-4 group">
                       <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                       />
                       {!selectedFile && !formData.buku_rekening_url && (
                          <>
                             <UploadCloud size={24} className="text-gray-400 mb-1 group-hover:text-indigo-600 transition-colors" />
                             <p className="text-xs font-bold text-gray-600">Klik atau seret file gambar/PDF ke sini</p>
                             <p className="text-[10px] text-gray-400">Maksimal 10MB</p>
                          </>
                       )}
                       {selectedFile && (
                          <div className="flex flex-col items-center">
                             <div className="bg-indigo-100 text-indigo-700 p-2 rounded-full mb-1">
                                <UploadCloud size={18} />
                             </div>
                             <p className="text-xs font-bold text-indigo-700 truncate max-w-[200px]">{selectedFile.name}</p>
                             <p className="text-[10px] text-gray-500">Siap diunggah saat disimpan</p>
                          </div>
                       )}
                       {!selectedFile && formData.buku_rekening_url && (
                          <div className="flex flex-col items-center">
                             <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full mb-1">
                                <ImageIcon size={18} />
                             </div>
                             <a href={formData.buku_rekening_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 underline z-20 relative">Lihat Lampiran Saat Ini</a>
                             <p className="text-[10px] text-gray-400 mt-0.5">Klik area ini jika ingin mengganti</p>
                          </div>
                       )}
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">Catatan Tambahan</label>
                    <textarea 
                       value={formData.catatan || ''} 
                       onChange={e => setFormData({...formData, catatan: e.target.value})}
                       className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs outline-none resize-none"
                       placeholder="Catatan rekening (opsional)..."
                       rows={2}
                    />
                 </div>
              </div>

              <div className="p-4 px-6 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/80">
                 <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 font-bold text-xs rounded-xl transition-colors">Batal</button>
                 <button disabled={isSaving} onClick={handleSave} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Simpan Rekening</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
