'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Building2, Plus, Search, Trash2, Edit2, Save, X, 
  Link as LinkIcon, Loader2, RefreshCw, CheckCircle2, ShieldCheck,
  Database, ArrowRight, HelpCircle, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function GovMappingPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Units
      const { data: uData } = await supabase.from('gov_units').select('*').order('nama_unit');
      if (uData) setUnits(uData);

      // Fetch Mappings
      const { data: mData, error } = await supabase
        .from('gov_name_mappings')
        .select('id, input_name, unit_id, gov_units(nama_unit)');
      
      if (error) throw error;
      setMappings(mData.map(m => ({
        id: m.id,
        name: m.input_name,
        unitId: m.unit_id,
        unitName: (m as any).gov_units?.nama_unit || 'Belum Terhubung'
      })));
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memuat data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveMapping = async () => {
    if (!newName.trim() || !selectedUnit) {
      toast.error("Lengkapi Nama Variasi dan Unit Kerja Target!");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { 
        input_name: newName.trim(), 
        unit_id: parseInt(selectedUnit) 
      };

      if (editingId) {
        const { error } = await supabase
          .from('gov_name_mappings')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success("Pemetaan berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from('gov_name_mappings')
          .insert([payload]);
        if (error) throw error;
        toast.success("Pemetaan baru berhasil ditambahkan!");
      }

      await fetchData();
      setIsModalOpen(false);
      resetModal();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setNewName(m.name);
    setSelectedUnit(m.unitId ? m.unitId.toString() : '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmDelete = confirm(`Hapus pemetaan untuk "${name}"?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('gov_name_mappings').delete().eq('id', id);
      if (error) throw error;
      toast.success(`Pemetaan "${name}" berhasil dihapus.`);
      await fetchData();
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  const resetModal = () => {
    setNewName('');
    setSelectedUnit('');
    setEditingId(null);
  };

  const filteredMappings = useMemo(() => {
    return mappings.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.unitName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mappings, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* 1. SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2.5 rounded-xl text-white shadow-xs">
            <LinkIcon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Pemetaan PIC → Unit Kerja Resmi
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black">
                Auto-Mapping Engine
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Menghubungkan variasi penulisan nama di Excel (cth: Joni, Jono, Andi) ke Unit Kerja tujuan secara otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="h-9 px-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={() => { resetModal(); setIsModalOpen(true); }}
            className="h-9 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Tambah Pemetaan</span>
          </button>
        </div>
      </div>

      {/* 2. 4 MODERN KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL PEMETAAN */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">TOTAL PEMETAAN</span>
              <div className="text-xl font-black text-gray-900 font-mono tracking-tight flex items-baseline gap-1">
                {mappings.length} <span className="text-xs font-semibold text-gray-500">Aturan</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <LinkIcon size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Variasi Nama PIC</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Terdaftar</span>
          </div>
        </div>

        {/* CARD 2: TOTAL UNIT TUJUAN */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">UNIT KERJA TUJUAN</span>
              <div className="text-xl font-black text-emerald-700 font-mono tracking-tight flex items-baseline gap-1">
                {units.length} <span className="text-xs font-semibold text-emerald-600">Unit</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
            <span>Master Gov Units</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Tersambung</span>
          </div>
        </div>

        {/* CARD 3: HASIL FILTER SEARCH */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">HASIL FILTER</span>
              <div className="text-xl font-black text-amber-700 font-mono tracking-tight flex items-baseline gap-1">
                {filteredMappings.length} <span className="text-xs font-semibold text-amber-600">Data</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Search size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>Pencarian Cepat</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">Aktif</span>
          </div>
        </div>

        {/* CARD 4: STATUS AUTO-MAPPING */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">STATUS ENGINE</span>
              <div className="text-sm font-black text-gray-900 truncate mt-1">
                Normalisasi Otomatis
              </div>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Akurasi Impor Excel</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">100% Siap</span>
          </div>
        </div>
      </div>

      {/* 3. TABEL DATA PEMETAAN */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 px-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">
              Daftar Aturan Pemetaan PIC ({filteredMappings.length} Data)
            </h3>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Setiap kali nama PIC di bawah muncul di file Excel belanja gaji/honor, sistem otomatis memasukannya ke Unit Kerja tujuan.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Cari nama PIC / unit kerja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-400 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Variasi di Excel / Input</th>
                <th className="py-3 px-4">Diarahkan Ke Unit Kerja Resmi</th>
                <th className="py-3 px-4 w-32 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs font-medium">
                    <Loader2 size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Memuat data pemetaan...
                  </td>
                </tr>
              ) : filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs font-medium space-y-2">
                    <LinkIcon size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-600">Belum ada aturan pemetaan.</p>
                    <p className="text-[11px] text-gray-400">Klik tombol "Tambah Pemetaan" di atas untuk menambahkan data.</p>
                  </td>
                </tr>
              ) : (
                filteredMappings.map((m, idx) => (
                  <tr key={m.id} className="even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 whitespace-nowrap transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-gray-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200/70">
                          {m.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <Building2 size={13} />
                        </div>
                        <span className="font-bold text-xs text-gray-900">{m.unitName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Terpetakan
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(m)}
                          className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Edit Pemetaan"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="h-7 px-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Hapus Pemetaan"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL TAMBAH / EDIT PEMETAAN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <LinkIcon size={18} />
                </div>
                <h3 className="text-sm font-black text-gray-900">
                  {editingId ? 'Edit Aturan Pemetaan' : 'Tambah Pemetaan PIC Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Nama di Excel / Input (Variasi):
                </label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  autoFocus 
                  className="w-full h-9 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-gray-800" 
                  placeholder="Contoh: Joni Keuangan, Jono, Andi" 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Arahkan Ke Unit Kerja Resmi:
                </label>
                <select 
                  value={selectedUnit} 
                  onChange={(e) => setSelectedUnit(e.target.value)} 
                  className="w-full h-9 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-gray-800 bg-white"
                >
                  <option value="">-- Pilih Unit Kerja Target --</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.nama_unit}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-8 px-4 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveMapping} 
                disabled={isSaving} 
                className="h-8 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold disabled:opacity-70 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{editingId ? 'Simpan Perubahan' : 'Tambah Pemetaan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
