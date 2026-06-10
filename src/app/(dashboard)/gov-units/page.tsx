'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, Plus, Search, Edit2, Loader2, Save, X, AlertTriangle, Building2, Filter, User as UserIcon, Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  const [filterJenis, setFilterJenis] = useState<string[]>([]);
  const [filterPic, setFilterPic] = useState<string[]>([]);
  const [filterGroup, setFilterGroup] = useState<string[]>([]);
  const [filterUnit, setFilterUnit] = useState('');

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
      alert('Gagal memuat data: ' + error.message);
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
    if (!formData.kode_unit || !formData.nama_unit) {
       alert("Kode Unit dan Nama Unit wajib diisi!");
       return;
    }

    setIsSaving(true);
    try {
      if (editingUnit?.id) {
         // Update
         const { error } = await supabase
            .from('gov_units')
            .update({
               kode_unit: formData.kode_unit,
               nama_unit: formData.nama_unit,
               group_org: formData.group_org,
               pic: formData.pic,
               jenis: formData.jenis,
               catatan: formData.catatan,
               is_active: formData.is_active
            })
            .eq('id', editingUnit.id);
         if (error) throw error;
         alert('Data berhasil diperbarui!');
      } else {
         // Insert
         const { error } = await supabase
            .from('gov_units')
            .insert([{
               kode_unit: formData.kode_unit,
               nama_unit: formData.nama_unit,
               group_org: formData.group_org,
               pic: formData.pic,
               jenis: formData.jenis,
               catatan: formData.catatan,
               is_active: formData.is_active
            }]);
         if (error) throw error;
         alert('Data berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Mengambil unique value untuk dropdown filter
  const uniqueJenis = useMemo(() => Array.from(new Set(units.map(u => u.jenis).filter(Boolean))), [units]);
  const uniquePic = useMemo(() => Array.from(new Set(units.map(u => u.pic).filter(Boolean))), [units]);
  const uniqueGroup = useMemo(() => Array.from(new Set(units.map(u => u.group_org).filter(Boolean))), [units]);

  // Filtering Logic
  const filteredUnits = useMemo(() => {
    return units.filter(u => {
       // Hanya tampilkan status aktif (is_active === true)
       if (!u.is_active) return false;

       const matchJenis = filterJenis.length === 0 || filterJenis.includes(u.jenis || '');
       const matchPic = filterPic.length === 0 || filterPic.includes(u.pic || '');
       const matchGroup = filterGroup.length === 0 || filterGroup.includes(u.group_org || '');
       const matchUnit = filterUnit ? 
          u.nama_unit.toLowerCase().includes(filterUnit.toLowerCase()) || 
          u.kode_unit.toLowerCase().includes(filterUnit.toLowerCase()) 
          : true;
       return matchJenis && matchPic && matchGroup && matchUnit;
    });
  }, [units, filterJenis, filterPic, filterGroup, filterUnit]);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-sky-600" size={40} /></div>;

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center shrink-0">
              <Landmark size={24} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-gray-900">Unit</h2>
              <p className="text-gray-500 text-sm">Kelola master data unit, PIC, Jenis, dan Catatan</p>
           </div>
        </div>
        
        <button onClick={() => handleOpenModal()} className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3 bg-sky-600 text-white rounded-2xl hover:bg-sky-500 shadow-xl shadow-sky-100 transition-all font-bold">
           <Plus size={20} />
           Tambah Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700 font-bold">
               <Filter size={18} className="text-sky-500" /> Filter Data (Multi-Pilihan)
            </div>
            <span className="text-xs text-gray-400 italic">Tekan CTRL/CMD untuk memilih lebih dari satu</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cari Nama/Kode Unit</label>
               <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input 
                     type="text" 
                     placeholder="Ketik untuk mencari..." 
                     value={filterUnit}
                     onChange={(e) => setFilterUnit(e.target.value)}
                     className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm"
                  />
               </div>
            </div>
            
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">Group <Layers size={12}/></label>
               <select 
                  multiple
                  value={filterGroup} 
                  onChange={(e) => setFilterGroup(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm custom-scrollbar"
                  size={3}
               >
                  {uniqueGroup.map((grp: any, i) => <option key={i} value={grp}>{grp}</option>)}
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">PIC <UserIcon size={12}/></label>
               <select 
                  multiple
                  value={filterPic} 
                  onChange={(e) => setFilterPic(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm custom-scrollbar"
                  size={3}
               >
                  {uniquePic.map((pic: any, i) => <option key={i} value={pic}>{pic}</option>)}
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">Jenis <Building2 size={12}/></label>
               <select 
                  multiple
                  value={filterJenis} 
                  onChange={(e) => setFilterJenis(Array.from(e.target.selectedOptions, option => option.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 transition-all text-sm custom-scrollbar"
                  size={3}
               >
                  {uniqueJenis.map((jenis: any, i) => <option key={i} value={jenis}>{jenis}</option>)}
               </select>
            </div>
         </div>
      </div>

      {/* Table Data */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs font-bold">
                  <tr>
                     <th className="px-6 py-4 whitespace-nowrap">Kode Unit</th>
                     <th className="px-6 py-4">Nama Unit</th>
                     <th className="px-6 py-4">Grup & Jenis</th>
                     <th className="px-6 py-4">PIC</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredUnits.map((u, i) => (
                     <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sky-600 font-medium whitespace-nowrap">{u.kode_unit}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{u.nama_unit}</td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg w-max">{u.group_org || '-'}</span>
                              <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1"><Building2 size={10}/> {u.jenis || 'Belum ada jenis'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{u.pic?.charAt(0) || '?'}</div>
                              <span className="text-gray-700">{u.pic || '-'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           {u.is_active ? 
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Aktif</span> : 
                              <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-xs font-bold">Nonaktif</span>
                           }
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex justify-center gap-2">
                              <button onClick={() => handleOpenModal(u)} className="p-2 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors" title="Edit">
                                 <Edit2 size={16} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
                  {filteredUnits.length === 0 && (
                     <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 flex-col items-center flex justify-center w-full">
                           <AlertTriangle size={32} className="text-gray-300 mb-2"/>
                           Tidak ada data yang sesuai dengan filter.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Modal Form Tambah/Edit */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                     <div className="p-2 bg-sky-100 text-sky-600 rounded-xl"><Landmark size={20} /></div>
                     {editingUnit ? 'Edit Unit' : 'Tambah Unit'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-xl transition-all">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Kode Unit <span className="text-rose-500">*</span></label>
                        <input type="text" value={formData.kode_unit} onChange={(e) => setFormData({...formData, kode_unit: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium" placeholder="Cth: 010101" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Nama Unit <span className="text-rose-500">*</span></label>
                        <input type="text" value={formData.nama_unit} onChange={(e) => setFormData({...formData, nama_unit: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium" placeholder="Cth: Biro Keuangan" />
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Group Organisasi</label>
                        <input type="text" value={formData.group_org} onChange={(e) => setFormData({...formData, group_org: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="Cth: KPTU / Fakultas" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Penanggung Jawab (PIC)</label>
                        <input type="text" value={formData.pic} onChange={(e) => setFormData({...formData, pic: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none text-sm" placeholder="Nama PIC" />
                     </div>
                  </div>

                  <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl space-y-5">
                     <h4 className="text-sm font-bold text-sky-800 flex items-center gap-2 mb-2"><Building2 size={16}/> Informasi Tambahan</h4>
                     
                     <div>
                        <label className="block text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">Jenis</label>
                        <input type="text" value={formData.jenis || ''} onChange={(e) => setFormData({...formData, jenis: e.target.value})} className="w-full border border-sky-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none text-sm bg-white" placeholder="Cth: Struktural, Fungsional, Non-Akademik..." />
                     </div>
                     
                     <div>
                        <label className="block text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">Catatan</label>
                        <textarea value={formData.catatan || ''} onChange={(e) => setFormData({...formData, catatan: e.target.value})} rows={3} className="w-full border border-sky-200 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 outline-none text-sm bg-white resize-none" placeholder="Catatan tambahan mengenai unit ini..." />
                     </div>
                  </div>

                  <div>
                     <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors w-max">
                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500" />
                        <span className="text-sm font-bold text-gray-700">Status Unit Aktif</span>
                     </label>
                  </div>
               </div>

               <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 shrink-0">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all">Batal</button>
                  <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-500 disabled:opacity-70 transition-all flex items-center gap-2 shadow-lg shadow-sky-200">
                     {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                     Simpan Data
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
