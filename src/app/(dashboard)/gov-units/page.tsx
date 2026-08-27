'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, Plus, Search, Edit2, Loader2, Save, X, AlertTriangle, Building2, 
  Filter, User as UserIcon, Layers, RefreshCw, CheckCircle2, XCircle
} from 'lucide-react';
import Select from 'react-select';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Tipe Data untuk gov_units
interface GovUnit {
  id?: number;
  kode_unit: string;
  nama_unit: string;
  group_org: string;
  pic: string;
  jenis?: string;
  catatan?: string;
  is_active: boolean;
}

export default function GovUnitsPage() {
  const [units, setUnits] = useState<GovUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterJenis, setFilterJenis] = useState<any[]>([]);
  const [filterPic, setFilterPic] = useState<any[]>([]);
  const [filterGroup, setFilterGroup] = useState<any[]>([]);
  const [filterUnit, setFilterUnit] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUnit, setEditingUnit] = useState<GovUnit | null>(null);

  // Form State
  const [formData, setFormData] = useState<GovUnit>({
    kode_unit: '',
    nama_unit: '',
    group_org: '',
    pic: '',
    jenis: '',
    catatan: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterJenis, filterPic, filterGroup, filterUnit, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
         .from('gov_units')
         .select('*')
         .order('kode_unit', { ascending: true });
         
      if (error) throw error;
      if (data) setUnits(data as GovUnit[]);
    } catch (error: any) {
      console.error('Error fetching gov units:', error);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (unit?: GovUnit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData(unit);
    } else {
      setEditingUnit(null);
      setFormData({
        kode_unit: '',
        nama_unit: '',
        group_org: '',
        pic: '',
        jenis: '',
        catatan: '',
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.kode_unit.trim() || !formData.nama_unit.trim()) {
       toast.error("Kode Unit dan Nama Unit wajib diisi!");
       return;
    }

    setIsSaving(true);
    try {
      if (editingUnit?.id) {
         // Update
         const { error } = await supabase
            .from('gov_units')
            .update({
               kode_unit: formData.kode_unit.trim(),
               nama_unit: formData.nama_unit.trim(),
               group_org: formData.group_org?.trim() || '',
               pic: formData.pic?.trim() || '',
               jenis: formData.jenis?.trim() || '',
               catatan: formData.catatan?.trim() || '',
               is_active: formData.is_active
            })
            .eq('id', editingUnit.id);
         if (error) throw error;
         toast.success('Data unit berhasil diperbarui!');
      } else {
         // Insert
         const { error } = await supabase
            .from('gov_units')
            .insert([{
               kode_unit: formData.kode_unit.trim(),
               nama_unit: formData.nama_unit.trim(),
               group_org: formData.group_org?.trim() || '',
               pic: formData.pic?.trim() || '',
               jenis: formData.jenis?.trim() || '',
               catatan: formData.catatan?.trim() || '',
               is_active: formData.is_active
            }]);
         if (error) throw error;
         toast.success('Data unit baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Mengambil unique value untuk dropdown filter
  const uniqueJenis = useMemo(() => Array.from(new Set(units.map(u => u.jenis).filter(Boolean))).map(j => ({ value: j, label: j })), [units]);
  const uniquePic = useMemo(() => Array.from(new Set(units.map(u => u.pic).filter(Boolean))).map(p => ({ value: p, label: p })), [units]);
  const uniqueGroup = useMemo(() => Array.from(new Set(units.map(u => u.group_org).filter(Boolean))).map(g => ({ value: g, label: g })), [units]);

  // Filtering Logic
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
       const matchJenis = filterJenis.length === 0 || filterJenis.some(f => f.value === u.jenis);
       const matchPic = filterPic.length === 0 || filterPic.some(f => f.value === u.pic);
       const matchGroup = filterGroup.length === 0 || filterGroup.some(f => f.value === u.group_org);
       const matchUnit = filterUnit ? 
          u.nama_unit.toLowerCase().includes(filterUnit.toLowerCase()) || 
          u.kode_unit.toLowerCase().includes(filterUnit.toLowerCase()) 
          : true;
       return matchJenis && matchPic && matchGroup && matchUnit;
    });
  }, [units, filterJenis, filterPic, filterGroup, filterUnit]);

  // Paginated data
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredUnits.length / pageSize) || 1;
  const paginatedUnits = useMemo(() => {
    if (pageSize === -1) return filteredUnits;
    const start = (currentPage - 1) * pageSize;
    return filteredUnits.slice(start, start + pageSize);
  }, [filteredUnits, currentPage, pageSize]);

  const activeCount = units.filter(u => u.is_active).length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-20">
      {/* SLIM & UNIFIED HEADER TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl text-white shadow-xs">
            <Landmark size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Data Unit Kerja</h2>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                {units.length} Unit ({activeCount} Aktif)
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Kelola master data unit, penanggung jawab (PIC), kelompok organisasi, dan jenis.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchData}
            className="h-9 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={() => handleOpenModal()} 
            className="h-9 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <Plus size={15} />
            <span>Tambah Unit</span>
          </button>
        </div>
      </div>

      {/* FILTERS CARD */}
      <div className="bg-white p-4 px-5 rounded-2xl shadow-xs border border-gray-200/80 space-y-3">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 text-xs font-black uppercase tracking-wider">
               <Filter size={14} className="text-sky-600" /> Filter Data Unit
            </div>
            {(filterUnit || filterGroup.length > 0 || filterPic.length > 0 || filterJenis.length > 0) && (
              <button 
                onClick={() => { setFilterUnit(''); setFilterGroup([]); setFilterPic([]); setFilterJenis([]); }}
                className="text-[11px] font-bold text-rose-600 hover:underline"
              >
                Reset Filter
              </button>
            )}
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Cari Kode / Nama</label>
               <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                  <input 
                     type="text" 
                     placeholder="Ketik untuk mencari..." 
                     value={filterUnit}
                     onChange={(e) => setFilterUnit(e.target.value)}
                     className="w-full h-9 pl-7 pr-3 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all text-xs font-medium"
                  />
                  {filterUnit && (
                    <button onClick={() => setFilterUnit('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  )}
               </div>
            </div>
            
            {/* Group Filter */}
            <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                 <Layers size={10}/> Group Org
               </label>
               <Select
                  isMulti
                  options={uniqueGroup}
                  value={filterGroup}
                  onChange={(val) => setFilterGroup(val as any[])}
                  placeholder="Semua Group..."
                  className="text-xs font-bold"
                  styles={{
                    control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
                    valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                    input: (base) => ({ ...base, margin: 0, padding: 0 })
                  }}
               />
            </div>

            {/* PIC Filter */}
            <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                 <UserIcon size={10}/> Penanggung Jawab (PIC)
               </label>
               <Select
                  isMulti
                  options={uniquePic}
                  value={filterPic}
                  onChange={(val) => setFilterPic(val as any[])}
                  placeholder="Semua PIC..."
                  className="text-xs font-bold"
                  styles={{
                    control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
                    valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                    input: (base) => ({ ...base, margin: 0, padding: 0 })
                  }}
               />
            </div>

            {/* Jenis Filter */}
            <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                 <Building2 size={10}/> Jenis
               </label>
               <Select
                  isMulti
                  options={uniqueJenis}
                  value={filterJenis}
                  onChange={(val) => setFilterJenis(val as any[])}
                  placeholder="Semua Jenis..."
                  className="text-xs font-bold"
                  styles={{
                    control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
                    valueContainer: (base) => ({ ...base, padding: '0 6px' }),
                    input: (base) => ({ ...base, margin: 0, padding: 0 })
                  }}
               />
            </div>
         </div>
      </div>

      {/* QUICK STATUS INFO */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-gray-500">
        <span>Menampilkan <strong>{filteredUnits.length}</strong> unit kerja</span>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
         {loading ? (
           <div className="h-64 flex flex-col justify-center items-center gap-3">
             <Loader2 className="animate-spin text-sky-600" size={32} />
             <span className="text-xs font-bold text-gray-500">Memuat data unit kerja...</span>
           </div>
         ) : (
           <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 uppercase text-[10px] font-black tracking-wider">
                  <tr>
                     <th className="px-5 py-3 whitespace-nowrap">Kode Unit</th>
                     <th className="px-5 py-3">Nama Unit Kerja</th>
                     <th className="px-5 py-3">Grup & Jenis</th>
                     <th className="px-5 py-3">Penanggung Jawab (PIC)</th>
                     <th className="px-5 py-3 text-center">Status</th>
                     <th className="px-5 py-3 text-center w-24">Aksi</th>
                  </tr>
               </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUnits.map((u, i) => (
                     <tr key={u.id || i} className="hover:bg-sky-50/30 transition-colors group">
                        {/* Kode Unit */}
                        <td className="px-5 py-3 whitespace-nowrap">
                           <span className="font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80 font-bold text-xs">
                              {u.kode_unit}
                           </span>
                        </td>

                        {/* Nama Unit */}
                        <td className="px-5 py-3">
                           <p className="font-black text-gray-900 text-xs md:text-sm group-hover:text-sky-700 transition-colors">
                              {u.nama_unit}
                           </p>
                           {u.catatan && (
                              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">
                                 {u.catatan}
                              </p>
                           )}
                        </td>

                        {/* Grup & Jenis */}
                        <td className="px-5 py-3">
                           <div className="flex flex-wrap items-center gap-1.5">
                              {u.group_org && (
                                 <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                                    {u.group_org}
                                 </span>
                              )}
                              {u.jenis && (
                                 <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                                    {u.jenis}
                                 </span>
                              )}
                           </div>
                        </td>

                        {/* PIC */}
                        <td className="px-5 py-3">
                           {u.pic ? (
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.pic.charAt(0).toUpperCase()}
                                 </div>
                                 <span className="text-xs font-bold text-gray-700">{u.pic}</span>
                              </div>
                           ) : (
                              <span className="text-gray-300 text-xs italic">-</span>
                           )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3 text-center">
                           {u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black">
                                 <CheckCircle2 size={11} /> Aktif
                              </span>
                           ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-black">
                                 <XCircle size={11} /> Nonaktif
                              </span>
                           )}
                        </td>

                        {/* Aksi */}
                        <td className="px-5 py-3 text-center">
                           <button 
                              onClick={() => handleOpenModal(u)} 
                              className="h-8 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs active:scale-95" 
                              title="Edit Data Unit"
                           >
                              <Edit2 size={12} />
                              <span>Edit</span>
                           </button>
                        </td>
                     </tr>
                  ))}
                  {filteredUnits.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                           <AlertTriangle size={28} className="mx-auto text-gray-300 mb-2"/>
                           <p className="text-xs font-bold">Tidak ada unit kerja yang sesuai dengan filter.</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
           </div>
         )}

         {/* PAGINATION FOOTER */}
         {!loading && filteredUnits.length > 0 && (
           <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 px-5 bg-gray-50/80 border-t border-gray-200 text-xs font-bold text-gray-600">
             {/* Left: Info */}
             <div className="flex items-center gap-2">
               <span>
                 Menampilkan <strong className="text-gray-900">{pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}</strong> - <strong className="text-gray-900">{pageSize === -1 ? filteredUnits.length : Math.min(currentPage * pageSize, filteredUnits.length)}</strong> dari <strong className="text-gray-900">{filteredUnits.length}</strong> unit
               </span>
             </div>

             {/* Center: Rows per page */}
             <div className="flex items-center gap-2">
               <span className="text-[11px] text-gray-400 font-bold uppercase">Baris per halaman:</span>
               <select
                 value={pageSize}
                 onChange={(e) => setPageSize(Number(e.target.value))}
                 className="h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
               >
                 <option value={25}>25</option>
                 <option value={50}>50</option>
                 <option value={100}>100</option>
                 <option value={-1}>Semua</option>
               </select>
             </div>

             {/* Right: Page Navigation */}
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
                 
                 <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-black">
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
         )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in transition-opacity">
            <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] border border-gray-100">
               <div className="p-4 px-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                        <Landmark size={18} />
                     </div>
                     <div>
                        <h3 className="text-base font-black text-gray-900 leading-none">
                           {editingUnit ? 'Edit Data Unit Kerja' : 'Tambah Unit Kerja Baru'}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                           Isi form master data unit di bawah ini.
                        </p>
                     </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-all">
                     <X size={18} />
                  </button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                           Kode Unit <span className="text-rose-500">*</span>
                        </label>
                        <input 
                           type="text" 
                           value={formData.kode_unit} 
                           onChange={(e) => setFormData({...formData, kode_unit: e.target.value})} 
                           className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs font-mono font-bold" 
                           placeholder="Cth: 010101" 
                        />
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                           Nama Unit <span className="text-rose-500">*</span>
                        </label>
                        <input 
                           type="text" 
                           value={formData.nama_unit} 
                           onChange={(e) => setFormData({...formData, nama_unit: e.target.value})} 
                           className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs font-bold" 
                           placeholder="Cth: Biro Keuangan" 
                        />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Group Organisasi</label>
                        <input 
                           type="text" 
                           value={formData.group_org} 
                           onChange={(e) => setFormData({...formData, group_org: e.target.value})} 
                           className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs font-medium" 
                           placeholder="Cth: KPTU / Fakultas" 
                        />
                     </div>
                     <div>
                        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Penanggung Jawab (PIC)</label>
                        <input 
                           type="text" 
                           value={formData.pic} 
                           onChange={(e) => setFormData({...formData, pic: e.target.value})} 
                           className="w-full border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs font-medium" 
                           placeholder="Cth: Rohman / Triyanto" 
                        />
                     </div>
                  </div>

                  <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-2xl space-y-3">
                     <h4 className="text-xs font-bold text-sky-800 flex items-center gap-1.5"><Building2 size={14}/> Informasi Tambahan</h4>
                     
                     <div>
                        <label className="block text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">Jenis Unit</label>
                        <input 
                           type="text" 
                           value={formData.jenis || ''} 
                           onChange={(e) => setFormData({...formData, jenis: e.target.value})} 
                           className="w-full border border-sky-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs bg-white" 
                           placeholder="Cth: Struktural, Fungsional, Non-Akademik..." 
                        />
                     </div>
                     
                     <div>
                        <label className="block text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1">Catatan</label>
                        <textarea 
                           value={formData.catatan || ''} 
                           onChange={(e) => setFormData({...formData, catatan: e.target.value})} 
                           rows={2} 
                           className="w-full border border-sky-200 rounded-xl p-2.5 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none text-xs bg-white resize-none" 
                           placeholder="Catatan tambahan mengenai unit ini..." 
                        />
                     </div>
                  </div>

                  <div>
                     <label className="flex items-center gap-2.5 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-max">
                        <input 
                           type="checkbox" 
                           checked={formData.is_active} 
                           onChange={(e) => setFormData({...formData, is_active: e.target.checked})} 
                           className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500" 
                        />
                        <span className="text-xs font-bold text-gray-700">Status Unit Aktif</span>
                     </label>
                  </div>
               </div>

               <div className="p-4 px-6 bg-gray-50 flex justify-end gap-2.5 border-t border-gray-100 shrink-0">
                  <button 
                     onClick={() => setIsModalOpen(false)} 
                     className="px-4 py-2 rounded-xl font-bold text-xs text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                  >
                     Batal
                  </button>
                  <button 
                     onClick={handleSave} 
                     disabled={isSaving} 
                     className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95"
                  >
                     {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                     <span>Simpan Data</span>
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
