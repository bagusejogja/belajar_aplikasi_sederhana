'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Trash2, MoreVertical, Layers, Users, Loader2, Save, X, AlertTriangle
} from 'lucide-react';
import { mockUnits } from '@/lib/mock-db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Unit } from '@/types';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(!isSupabaseConfigured);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setUnits(mockUnits);
      setIsUsingMock(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('units').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setUnits(data);
      setIsUsingMock(false);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits(mockUnits);
      setIsUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUnit = async () => {
    if (!newUnitName.trim()) {
       alert("Harap isi nama unit!");
       return;
    }

    setIsSaving(true);
    try {
      if (!isUsingMock) {
         const { error } = await supabase.from('units').insert([{ name: newUnitName }]);
         if (error) throw error;
         alert('Unit berhasil ditambahkan ke Database!');
         fetchData(); // Refresh list
      } else {
         const newUnit: Unit = {
           id: 'un' + Math.random().toString(36).substr(2, 9),
           name: newUnitName
         };
         setUnits(prev => [newUnit, ...prev]);
         alert('Tersimpan di mode Mock (Belum masuk database online).');
      }
      setIsModalOpen(false);
      setNewUnitName('');
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-600" size={40} /></div>;

  return (
    <div className="space-y-6">
      {/* Alert Mode Bohongan */}
      {isUsingMock && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
            <div>
               <h3 className="font-bold text-sm">Mode Data Simulasi Aktif</h3>
               <p className="text-xs mt-1 text-amber-700/80">Koneksi Supabase belum terdeteksi. Silakan atur .env jika ingin menggunakan database asli.</p>
            </div>
         </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <Building2 size={24} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-gray-900">Unit Kerja</h2>
              <p className="text-gray-500 text-sm">Organisasi internal & pembagian tugas</p>
           </div>
        </div>
        
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 shadow-xl shadow-amber-50 transition-all font-bold">
           <Plus size={20} />
           Tambah Unit
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {units.map((unit) => (
           <div key={unit.id} className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                 <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 rounded-2xl transition-colors">
                    <Layers size={24} />
                 </div>
                 <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreVertical size={20} />
                 </button>
              </div>

              <div>
                 <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors mb-2">{unit.name}</h3>
                 <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1.5">
                       <Users size={14} />
                       <span>Karyawan</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <div className="flex items-center gap-1.5 font-medium text-emerald-600">
                       Aktif
                    </div>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          +
                       </div>
                    ))}
                 </div>
                 <button className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors">
                    Lihat Detail
                 </button>
              </div>
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
           </div>
         ))}
         {units.length === 0 && <div className="col-span-full text-center py-10 text-gray-500">Belum ada Unit Kerja. Silakan tambahkan.</div>}
      </div>

      {/* Modal Tambah Unit */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                     <Building2 size={20} className="text-amber-600" />
                     {isUsingMock ? 'Tambah (Mock)' : 'Tambah Unit'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-all">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="p-6">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nama Unit/Departemen</label>
                  <input 
                     type="text" 
                     value={newUnitName} 
                     onChange={(e) => setNewUnitName(e.target.value)} 
                     autoFocus 
                     className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-sm font-medium" 
                     placeholder="Cth: Keuangan Daerah" 
                  />
               </div>

               <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                  <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition-all">Batal</button>
                  <button onClick={handleSaveUnit} disabled={isSaving} className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 disabled:opacity-70 transition-all flex items-center gap-2 shadow-lg shadow-amber-100">
                     {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                     Simpan
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
