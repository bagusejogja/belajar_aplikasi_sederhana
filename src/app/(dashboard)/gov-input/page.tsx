'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Layers, Search, Save, X, Plus, Loader2, ChevronRight, Check
} from 'lucide-react';
import { mockUnits, mockGovAkun } from '@/lib/mock-db';

export default function GovInputPage() {
  const [person, setPerson] = useState('');
  const [unitId, setUnitId] = useState('');
  const [akunId, setAkunId] = useState('');
  const [nominal, setNominal] = useState('');
  const [uraian, setUraian] = useState('');

  // Filtering Logic
  // Cari units yang PIC-nya cocok dengan input 'person'
  const filteredUnits = mockUnits.filter(u => 
    person && u.pic?.toLowerCase().includes(person.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in transition-all duration-500">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <Layers size={32} />
           </div>
           <div>
              <h1 className="text-2xl font-black tracking-tight">Manajemen Dana Pemerintah (UGM)</h1>
              <p className="text-blue-100 mt-1 opacity-80 text-sm italic">Input Belanja & Mutasi Anggaran Pemerintah</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <h3 className="font-extrabold text-gray-800 text-lg uppercase tracking-wider">Form Pengajuan Belanja</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* PILIH PIC (ORANG) */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">1. Nama PIC (Orang)</label>
                   <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                         <Users size={18} />
                      </div>
                      <input 
                         type="text" 
                         value={person}
                         onChange={e => setPerson(e.target.value)}
                         placeholder="Ketik Nama PIC... (Cth: Bagus)"
                         className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-bold text-gray-800"
                      />
                   </div>
                </div>

                {/* PILIH UNIT (Auto Filtered) */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">2. Unit Kerja (Berdasarkan PIC)</label>
                   <select 
                      value={unitId}
                      onChange={e => setUnitId(e.target.value)}
                      disabled={!person}
                      className="w-full bg-slate-100 disabled:opacity-40 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 px-4 outline-none transition-all font-bold text-gray-800 appearance-none"
                   >
                      <option value="">{person ? '-- Pilih Unit PIC --' : 'Pilih PIC Terlebih Dahulu'}</option>
                      {filteredUnits.map(u => (
                        <option key={u.id} value={u.id}>[{u.kode_unit}] {u.name}</option>
                      ))}
                   </select>
                </div>

                {/* PILIH AKUN GOVT */}
                <div className="space-y-2 md:col-span-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">3. Mata Anggaran - Akun Belanja</label>
                   <select 
                      value={akunId}
                      onChange={e => setAkunId(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 px-4 outline-none transition-all font-bold text-gray-800 appearance-none"
                   >
                      <option value="">-- Pilih Mata Anggaran Belanja --</option>
                      {mockGovAkun.map(a => (
                        <option key={a.id} value={a.id}>{a.nomor_akun} - {a.nama_akun}</option>
                      ))}
                   </select>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">4. Nominal Belanja</label>
                   <input 
                      type="number" 
                      value={nominal}
                      onChange={e => setNominal(e.target.value)}
                      placeholder="Rp 0"
                      className="w-full bg-emerald-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl py-4 px-6 outline-none transition-all font-black text-emerald-700 text-xl"
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">5. Uraian Singkat</label>
                   <textarea 
                      value={uraian}
                      onChange={e => setUraian(e.target.value)}
                      placeholder="Cth: Pembayaran Gaji Karyawan Bln Maret"
                      rows={1}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 px-4 outline-none transition-all font-medium text-gray-800"
                   />
                </div>
             </div>

             <div className="mt-12 flex justify-end gap-4">
                <button className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black transition-all">BORANG BARU</button>
                <button className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-100 transition-all flex items-center gap-3">
                   <Save size={20} /> SIMPAN DATA
                </button>
             </div>
          </div>
        </div>

        {/* GUIDES / SIDE INFO */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -right-4 -bottom-6 text-white/5 text-9xl transform -rotate-12 select-none">
                 <Building2 />
              </div>
              <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-4">Informasi Unit</h4>
              {!unitId ? (
                <p className="text-xs text-gray-400 italic">Pilih Unit untuk melihat rincian PIC dan Kelompok.</p>
              ) : (() => {
                 const u = mockUnits.find(ux => ux.id === unitId);
                 return u ? (
                   <div className="space-y-4 relative z-10">
                      <div>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Grup Organisasi</p>
                        <p className="font-bold text-lg">{u.group}</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-40 uppercase tracking-widest">Penanggung Jawab (PIC)</p>
                        <p className="font-bold text-lg flex items-center gap-2">
                           <Users size={16} className="text-blue-400" /> {u.pic}
                        </p>
                      </div>
                      <div className="bg-blue-500/20 p-4 rounded-2xl border border-blue-500/30">
                         <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Status</p>
                         <p className="text-xs flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Terdaftar & Aktif
                         </p>
                      </div>
                   </div>
                 ) : null;
              })()}
           </div>
        </div>
      </div>
    </div>
  );
}
