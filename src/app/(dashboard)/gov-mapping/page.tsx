'use client';

import React, { useState, useEffect } from 'react';
import { Users, Building2, Plus, Search, Trash2, Save, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { mockUnits } from '@/lib/mock-db';
import { supabase } from '@/lib/supabase';

export default function GovMappingPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gov_name_mappings')
        .select('id, input_name, unit_id, gov_units(nama_unit)');
      
      if (error) throw error;
      setMappings(data.map(m => ({
        id: m.id,
        name: m.input_name,
        unitId: m.unit_id,
        unitName: (m as any).gov_units?.nama_unit || 'Unknown'
      })));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleSaveMapping = async () => {
    if (!newName || !selectedUnit) {
      alert("Lengkapi Nama dan Unit!");
      return;
    }

    setIsSaving(true);
    try {
      // Use UPSERT to prevent 'duplicate key' errors
      const payload = { 
        input_name: newName, 
        unit_id: parseInt(selectedUnit) 
      };

      if (editingId) {
        const { error } = await supabase
          .from('gov_name_mappings')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('gov_name_mappings')
          .insert([payload]);
        if (error) throw error;
      }

      alert(editingId ? "Pemetaan Diperbarui!" : "Pemetaan Ditambahkan!");
      await fetchMappings();
      setIsModalOpen(false);
      resetModal();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setNewName(m.name);
    setSelectedUnit(m.unitId.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus pemetaan ini?")) return;
    try {
      const { error } = await supabase.from('gov_name_mappings').delete().eq('id', id);
      if (error) throw error;
      await fetchMappings();
    } catch (err: any) {
      alert("Gagal hapus: " + err.message);
    }
  };

  const resetModal = () => {
    setNewName('');
    setSelectedUnit('');
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in transition-all duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner">
              <LinkIcon size={32} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Pemetaan PIC → Unit</h2>
              <p className="text-slate-400 text-sm font-medium">Hubungkan variasi nama input ke unit kerja resmi</p>
           </div>
        </div>
        
        <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all font-black uppercase text-sm">
           <Plus size={20} /> Tambah Pemetaan
        </button>
      </div>

      {/* Stats / Help */}
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] text-amber-800 flex items-start gap-4">
         <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
            <Users size={24} />
         </div>
         <div>
            <h4 className="font-bold text-sm">Kenapa ini penting?</h4>
            <p className="text-xs mt-1 leading-relaxed opacity-80 font-medium">Sistem akan otomatis mengarahkan transaksi Joni/Jono/Andi ke Unit Kerja yang terdaftar di sini.</p>
         </div>
      </div>

      {/* Mapping Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
         {isLoading ? (
           <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Memuat Data Master...</p>
           </div>
         ) : (
           <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                 <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th className="p-6 border-b">Nama Di Excel</th>
                    <th className="p-6 border-b">Diarahkan Ke Unit</th>
                    <th className="p-6 border-b text-center">Aksi</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {mappings.length === 0 ? (
                    <tr>
                       <td colSpan={3} className="p-20 text-center text-slate-300 italic font-medium">Belum ada data pemetaan. Silakan tambah data baru.</td>
                    </tr>
                 ) : mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="p-6">
                          <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm tracking-tight">{m.name}</span>
                       </td>
                       <td className="p-6">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                <Building2 size={14} />
                             </div>
                             <span className="font-bold text-slate-700">{m.unitName}</span>
                          </div>
                       </td>
                       <td className="p-6 text-center space-x-2">
                          <button onClick={() => handleEdit(m)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                             <Plus size={18} className="rotate-45" /> 
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                             <Trash2 size={18} />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
         )}
      </div>

      {/* Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
               <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{editingId ? 'Edit Pemetaan' : 'Tambah Pemetaan'}</h3>
                  <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
               </div>
               <div className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama di Excel (Variasi)</label>
                     <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Contoh: Joni, Jono, Andi"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-6 outline-none font-bold" 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arahkan Ke Unit Kerja</label>
                     <select 
                        value={selectedUnit}
                        onChange={e => setSelectedUnit(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-6 outline-none font-black"
                     >
                        <option value="">-- Pilih Unit --</option>
                        {mockUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                     </select>
                  </div>
               </div>
               <div className="p-8 bg-slate-50 border-t flex gap-4">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest">Batal</button>
                  <button 
                     onClick={handleSaveMapping}
                     disabled={isSaving}
                     className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                     {isSaving ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
