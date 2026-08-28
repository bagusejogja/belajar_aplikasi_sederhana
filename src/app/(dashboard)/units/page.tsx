'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Search, Trash2, Edit2, RefreshCw, 
  Layers, Users, Loader2, Save, X, AlertTriangle,
  CheckCircle2, ShieldCheck, Database, Landmark, ExternalLink
} from 'lucide-react';
import { mockUnits } from '@/lib/mock-db';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Unit } from '@/types';
import toast from 'react-hot-toast';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingMock, setIsUsingMock] = useState(!isSupabaseConfigured);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);

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
      const { data, error } = await supabase.from('units').select('*').order('name', { ascending: true });
      if (error) throw error;
      if (data) setUnits(data);
      setIsUsingMock(false);
    } catch (error: any) {
      console.error('Error fetching units:', error);
      setUnits(mockUnits);
      setIsUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (unit?: Unit) => {
    if (unit) {
      setEditingId(unit.id);
      setUnitName(unit.name || '');
    } else {
      setEditingId(null);
      setUnitName('');
    }
    setIsModalOpen(true);
  };

  const handleSaveUnit = async () => {
    if (!unitName.trim()) {
       toast.error("Harap isi nama unit kerja!");
       return;
    }

    setIsSaving(true);
    try {
      if (!isUsingMock) {
        if (editingId) {
          const { error } = await supabase
            .from('units')
            .update({ name: unitName.trim() })
            .eq('id', editingId);
          if (error) throw error;
          toast.success('Nama unit kerja berhasil diperbarui!');
        } else {
          const { error } = await supabase
            .from('units')
            .insert([{ name: unitName.trim() }]);
          if (error) throw error;
          toast.success('Unit kerja baru berhasil ditambahkan!');
        }
        await fetchData();
      } else {
        if (editingId) {
          setUnits(prev => prev.map(u => u.id === editingId ? { ...u, name: unitName.trim() } : u));
          toast.success('Unit berhasil diperbarui (Simulasi Mock).');
        } else {
          const newUnit: Unit = {
            id: 'un_' + Math.random().toString(36).substring(2, 9),
            name: unitName.trim()
          } as any;
          setUnits(prev => [newUnit, ...prev]);
          toast.success('Unit baru ditambahkan (Simulasi Mock).');
        }
      }
      setIsModalOpen(false);
      setUnitName('');
      setEditingId(null);
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUnit = async (id: string | number, name: string) => {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus unit kerja "${name}"?`);
    if (!confirmDelete) return;

    try {
      if (!isUsingMock) {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) throw error;
        toast.success(`Unit "${name}" berhasil dihapus.`);
        await fetchData();
      } else {
        setUnits(prev => prev.filter(u => u.id !== id));
        toast.success(`Unit "${name}" dihapus (Simulasi Mock).`);
      }
    } catch (error: any) {
      toast.error('Gagal menghapus: ' + error.message);
    }
  };

  const filteredUnits = useMemo(() => {
    return units.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.id && u.id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [units, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* 1. SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2.5 rounded-xl text-white shadow-xs">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Master Unit Kerja & Departemen
              </h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                isUsingMock 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isUsingMock ? 'Mock Simulation' : 'Supabase Connected'}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Kelola master daftar unit kerja resmi organisasi sebagai referensi transaksi & form.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="h-9 px-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-600' : 'text-gray-500'} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="h-9 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Tambah Unit Baru</span>
          </button>
        </div>
      </div>

      {/* 2. 4 MODERN KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CARD 1: TOTAL UNIT */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">TOTAL UNIT KERJA</span>
              <div className="text-xl font-black text-gray-900 font-mono tracking-tight flex items-baseline gap-1">
                {units.length} <span className="text-xs font-semibold text-gray-500">Unit</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Referensi Terdaftar</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">Aktif</span>
          </div>
        </div>

        {/* CARD 2: HASIL PENCARIAN */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-1">UNIT TERFILTER</span>
              <div className="text-xl font-black text-emerald-700 font-mono tracking-tight flex items-baseline gap-1">
                {filteredUnits.length} <span className="text-xs font-semibold text-emerald-600">Ditampilkan</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Search size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center justify-between border-t border-emerald-100/60 pt-2">
            <span>Filter Kata Kunci</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Cocok</span>
          </div>
        </div>

        {/* CARD 3: STATUS DATABASE */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block mb-1">SUMBER DATA</span>
              <div className="text-sm font-black text-amber-800 truncate mt-1">
                {isUsingMock ? 'Mock Simulation' : 'Tabel "units" (PostgreSQL)'}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Database size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-amber-700 flex items-center justify-between border-t border-amber-100/60 pt-2">
            <span>Status Koneksi</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">Tersambung</span>
          </div>
        </div>

        {/* CARD 4: AKSES MANAJEMEN */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">OTORITAS AKSES</span>
              <div className="text-sm font-black text-gray-900 truncate mt-1">
                Administrator
              </div>
            </div>
            <div className="p-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3 text-xs font-bold text-gray-500 flex items-center justify-between border-t border-gray-100 pt-2">
            <span>Peran Pengguna</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">Admin Only</span>
          </div>
        </div>
      </div>

      {/* 3. TABEL DATA MASTER UNIT KERJA */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-4 px-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-black text-gray-900 tracking-tight">
              Daftar Master Unit Kerja ({filteredUnits.length} Data)
            </h3>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Unit kerja ini otomatis muncul sebagai opsi di form persuratan, mutasi, dan pencairan anggaran.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Cari nama unit kerja..."
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
                <th className="py-3 px-4">Nama Unit Kerja / Departemen</th>
                <th className="py-3 px-4 w-44">ID Referensi</th>
                <th className="py-3 px-4 w-32 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs font-medium">
                    <Loader2 size={20} className="animate-spin inline-block text-indigo-600 mr-2" />
                    Memuat daftar unit kerja...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-xs font-medium space-y-2">
                    <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-gray-600">Tidak ada data unit kerja ditemukan.</p>
                    <p className="text-[11px] text-gray-400">Klik tombol "Tambah Unit Baru" di atas untuk menambahkan data.</p>
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u, idx) => (
                  <tr key={u.id} className="even:bg-slate-50/80 odd:bg-white hover:bg-indigo-50/60 whitespace-nowrap transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-gray-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <Building2 size={14} />
                        </div>
                        <span className="font-bold text-xs text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500 font-semibold">
                      {u.id}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● Aktif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="h-7 px-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Edit Nama Unit"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteUnit(u.id, u.name)}
                          className="h-7 px-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Hapus Unit"
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

      {/* 4. MODAL TAMBAH / EDIT UNIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Building2 size={18} />
                </div>
                <h3 className="text-sm font-black text-gray-900">
                  {editingId ? 'Edit Unit Kerja' : 'Tambah Unit Kerja Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Nama Unit Kerja / Departemen:
                </label>
                <input 
                  type="text" 
                  value={unitName} 
                  onChange={(e) => setUnitName(e.target.value)} 
                  autoFocus 
                  className="w-full h-9 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-gray-800" 
                  placeholder="Contoh: Bagian Keuangan dan Akuntansi" 
                />
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
                onClick={handleSaveUnit} 
                disabled={isSaving} 
                className="h-8 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold disabled:opacity-70 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{editingId ? 'Simpan Perubahan' : 'Tambah Unit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
