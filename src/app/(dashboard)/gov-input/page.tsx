'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Layers, Search, Save, X, Plus, Loader2, ChevronRight, Check, FileSpreadsheet, Calendar, CreditCard, UserPlus
} from 'lucide-react';
import { mockUnits, mockGovAkun } from '@/lib/mock-db';

const JENIS_PAGU = [
  'pagu awal',
  'pengurangan pagu',
  'tambah pagu',
  'realokasi tambah',
  'realokasi kurang',
  'realisasi'
];

export default function GovInputPage() {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [personSearch, setPersonSearch] = useState(''); 
  const [namaInput, setNamaInput] = useState(''); 
  const [unitId, setUnitId] = useState<string | number>('');
  const [akunId, setAkunId] = useState<string | number>('');
  const [jenis, setJenis] = useState('pagu awal');
  const [nominal, setNominal] = useState('');
  const [uraian, setUraian] = useState('');

  // Bulk Import State
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filtering Logic
  const filteredUnits = mockUnits.filter(u => 
    personSearch && u.pic?.toLowerCase().includes(personSearch.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim());
      
      const parsed = rows.slice(1).map((row, idx) => {
        // Format: Tanggal;UnitCode;AccountCode;Nominal;Jenis;NamaInput
        const [tgl, uCode, aCode, nom, jns, nm] = row.split(';').map(s => s.trim());
        
        // Match Unit & Account
        const matchedUnit = mockUnits.find(ux => ux.kode_unit === uCode);
        const matchedAkun = mockGovAkun.find(ax => ax.nomor_akun === aCode);

        return {
          id: idx,
          tanggal: tgl,
          unitCode: uCode,
          unitId: matchedUnit?.id || null,
          unitName: matchedUnit?.name || 'TIDAK DITEMUKAN',
          akunCode: aCode,
          akunId: matchedAkun?.id || null,
          akunName: matchedAkun?.nama_akun || 'TIDAK DITEMUKAN',
          nominal: parseFloat(nom) || 0,
          jenis: jns || 'pagu awal',
          nama: nm || '-',
          isValid: !!matchedUnit && !!matchedAkun
        };
      });

      setBulkData(parsed);
      setIsImportModalOpen(true);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-8 animate-in fade-in transition-all duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6">
              <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/20 shadow-inner">
                 <FileSpreadsheet size={36} className="text-blue-300" />
              </div>
              <div>
                 <h1 className="text-3xl font-black tracking-tight uppercase italic">Manajemen Pagu & Realisasi</h1>
                 <p className="text-blue-200 mt-1 font-medium opacity-80 flex items-center gap-2 text-sm">
                    <Check size={16} /> Update Anggaran Pemerintah (UGM) • Real-time Sync
                 </p>
              </div>
           </div>
           {/* IMPORT EXCEL BUTTON (Wrapper for Hidden File Input) */}
           <div className="flex flex-col items-end gap-2">
              <label className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all active:scale-95 group cursor-pointer">
                 <FileSpreadsheet size={24} className="group-hover:rotate-12 transition-transform" />
                 IMPOR DARI CSV (EXCEL)
                 <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <button 
                 onClick={() => {
                   const blob = new Blob(["Tanggal;KodeUnit;KodeAkun;Nominal;Jenis;NamaInput\n2025-01-01;010101;511119;2871000;pagu awal;Joni"], { type: 'text/csv' });
                   const url = window.URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.setAttribute('hidden', '');
                   a.setAttribute('href', url);
                   a.setAttribute('download', 'template_pagu_ugm.csv');
                   document.body.appendChild(a);
                   a.click();
                   document.body.removeChild(a);
                 }}
                 className="text-[10px] text-blue-300 hover:text-blue-100 font-bold tracking-widest uppercase flex items-center gap-2 underline underline-offset-4"
              >
                 <Plus size={10} /> Download Template Format
              </button>
           </div>
        </div>
      </div>

      {bulkData.length > 0 && isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
              <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">PREVIEW IMPOR MASSAL</h3>
                    <p className="text-slate-500 text-sm font-medium">Validasi {bulkData.length} baris data sebelum disimpan ke database.</p>
                 </div>
                 <button onClick={() => setIsImportModalOpen(false)} className="p-3 bg-white border rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all shadow-sm">
                    <X size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                 <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-slate-900 text-white z-10 text-[10px] uppercase font-black tracking-widest">
                       <tr>
                          <th className="p-4 rounded-tl-2xl">Status</th>
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Unit</th>
                          <th className="p-4">Akun</th>
                          <th className="p-4">Nominal</th>
                          <th className="p-4">Jenis</th>
                          <th className="p-4 font-black">Nama Input (Excel)</th>
                          <th className="p-4 rounded-tr-2xl">Aksi</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                       {bulkData.map((row) => (
                         <tr key={row.id} className={row.isValid ? "hover:bg-slate-50 transition-colors" : "bg-red-50"}>
                            <td className="p-4">
                               {row.isValid ? <Check className="text-emerald-500" size={18} /> : <X className="text-red-500" size={18} />}
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-400">{row.tanggal}</td>
                            <td className="p-4">
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">{row.unitName}</span>
                                  <span className="text-[10px] font-bold text-slate-300">Code: {row.unitCode}</span>
                               </div>
                            </td>
                            <td className="p-4">
                               <div className="flex flex-col">
                                  <span className="font-bold text-slate-700">{row.akunName}</span>
                                  <span className="text-[10px] font-bold text-slate-300">Code: {row.akunCode}</span>
                               </div>
                            </td>
                            <td className="p-4 font-black text-indigo-600">IDR {row.nominal.toLocaleString('id-ID')}</td>
                            <td className="p-4">
                               <span className="px-3 py-1 bg-slate-200 rounded-lg font-black text-[9px] uppercase">{row.jenis}</span>
                            </td>
                            <td className="p-4 italic font-bold text-slate-500">{row.nama}</td>
                            <td className="p-4">
                               <button className="text-red-400 hover:text-red-600 transition-colors">Hapus</button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-10 bg-slate-50 border-t flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
                       <FileSpreadsheet size={24} />
                    </div>
                    <div>
                       <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Validitas Data</p>
                       <p className="text-lg font-black text-slate-800">{bulkData.filter(d => d.isValid).length} / {bulkData.length} Baris Siap Impor</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setBulkData([])} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-slate-400 hover:text-slate-800 transition-all">BATAL SEMUA</button>
                    <button 
                       disabled={bulkData.some(d => !d.isValid)}
                       className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                       <Save size={24} /> SIMPAN KE DATABASE SEKARANG
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* INPUT FORM */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-gray-100 border border-gray-100">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-indigo-600 rounded-full" />
                  <h3 className="font-extrabold text-slate-800 text-xl uppercase tracking-tighter">Borang Transaksi Anggaran</h3>
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 tracking-widest uppercase">ID Gen: AUTO</div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* TANGGAL */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      <Calendar size={12} /> 1. Tanggal Transaksi
                   </label>
                   <input 
                      type="date" 
                      value={tanggal}
                      onChange={e => setTanggal(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.25rem] py-4 px-6 outline-none transition-all font-bold text-slate-800 shadow-inner"
                   />
                </div>

                {/* JENIS PAGU */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      <Layers size={12} /> 2. Jenis Mutasi Pagu
                   </label>
                   <select 
                      value={jenis}
                      onChange={e => setJenis(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.25rem] py-4 px-6 outline-none transition-all font-bold text-slate-800 appearance-none cursor-pointer shadow-inner"
                   >
                      {JENIS_PAGU.map(j => <option key={j} value={j}>{j.toUpperCase()}</option>)}
                   </select>
                </div>

                {/* SEARCH PIC (ORANG) */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">3. Cari PIC (Filter Unit)</label>
                   <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                         <Search size={18} />
                      </div>
                      <input 
                         type="text" 
                         value={personSearch}
                         onChange={e => setPersonSearch(e.target.value)}
                         placeholder="Ketik Nama PIC... (Cth: Bagus)"
                         className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.25rem] py-4 pl-14 pr-6 outline-none transition-all font-bold text-slate-700 shadow-inner placeholder:font-medium"
                      />
                   </div>
                </div>

                {/* NAMA PENGAJU (BISA BEDA DENGAN PIC) */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      <UserPlus size={12} /> 4. Nama Pengaju (Boleh Beda)
                   </label>
                   <input 
                      type="text" 
                      value={namaInput}
                      onChange={e => setNamaInput(e.target.value)}
                      placeholder="Nama di Nota/Bukti"
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.25rem] py-4 px-6 outline-none transition-all font-bold text-slate-800 shadow-inner"
                   />
                </div>

                {/* PILIH UNIT */}
                <div className="space-y-3 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">5. Unit Kerja Terkait</label>
                   <select 
                      value={unitId}
                      onChange={e => setUnitId(e.target.value)}
                      disabled={!personSearch}
                      className="w-full bg-slate-100 disabled:opacity-40 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.25rem] py-4 px-6 outline-none transition-all font-black text-indigo-900 appearance-none shadow-inner"
                   >
                      <option value="">{personSearch ? '-- Pilih Unit Hasil Filter --' : 'Silakan Cari PIC Terlebih Dahulu'}</option>
                      {filteredUnits.map(u => (
                        <option key={u.id} value={u.id}>[{u.kode_unit}] - {u.name} ({u.group})</option>
                      ))}
                   </select>
                </div>

                {/* AKUN / MATA ANGGARAN */}
                <div className="space-y-3 md:col-span-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">6. Kode Akun (Mata Anggaran)</label>
                   <select 
                      value={akunId}
                      onChange={e => setAkunId(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[1.25rem] py-4 px-6 outline-none transition-all font-black text-blue-900 shadow-inner"
                   >
                      <option value="">-- Pilih Akun Belanja --</option>
                      {mockGovAkun.map(a => (
                        <option key={a.id} value={a.id}>{a.nomor_akun} - {a.nama_akun}</option>
                      ))}
                   </select>
                </div>

                {/* NOMINAL */}
                <div className="space-y-3 md:col-span-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                      <CreditCard size={12} /> 7. Nominal (IDR)
                   </label>
                   <input 
                      type="number" 
                      value={nominal}
                      onChange={e => setNominal(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-indigo-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.25rem] py-4 px-8 outline-none transition-all font-black text-indigo-700 text-2xl shadow-xl shadow-indigo-100/50"
                   />
                </div>

                {/* URAIAN */}
                <div className="space-y-3 md:col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">8. Keterangan / Uraian Belanja</label>
                   <textarea 
                      value={uraian}
                      onChange={e => setUraian(e.target.value)}
                      placeholder="Jelaskan rincian pengeluaran atau perubahan pagu di sini..."
                      rows={3}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[1.25rem] py-4 px-6 outline-none transition-all font-medium text-slate-700 shadow-inner"
                   />
                </div>
             </div>

             <div className="mt-12 flex flex-col sm:flex-row justify-end gap-6 border-t border-slate-100 pt-10">
                <button className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800 rounded-2xl font-black transition-all active:translate-y-1">BATAL / RESET</button>
                <button className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-2xl shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                   <Save size={24} className="group-hover:-translate-y-1 transition-transform" /> SIMPAN TRANSAKSI
                </button>
             </div>
          </div>
        </div>

        {/* INFO SIDE PANEL - DYNAMIC PREVIEW */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
                       <Building2 size={24} />
                    </div>
                    <h4 className="font-extrabold uppercase tracking-widest text-sm">Status Unit Terkait</h4>
                 </div>

                 {!unitId ? (
                   <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-[2rem] space-y-4">
                      <Search size={40} className="mx-auto text-white/10" />
                      <p className="text-xs text-white/30 italic px-6 leading-relaxed">Pilih Unit Kerja untuk sinkronisasi histori Pagu & Realisasi secara otomatis di sini.</p>
                   </div>
                 ) : (() => {
                    const u = mockUnits.find(ux => ux.id === unitId);
                    return u ? (
                      <div className="space-y-6">
                         <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">Nama Organisasi</p>
                            <p className="font-black text-xl text-blue-300 tracking-tight leading-tight">{u.name}</p>
                            <div className="mt-4 flex gap-2">
                               <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-bold text-white/60 tracking-wider uppercase">{u.group}</span>
                               <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-bold text-white/60 tracking-wider uppercase">{u.kode_unit}</span>
                            </div>
                         </div>

                         <div className="space-y-4 px-2">
                            <div className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                               <div>
                                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Penanggung Jawab (PIC)</p>
                                  <p className="font-bold flex items-center gap-2 mt-1 whitespace-nowrap">
                                     <Users size={16} className="text-emerald-400" /> {u.pic}
                                  </p>
                               </div>
                               <ChevronRight size={16} className="text-emerald-400/50" />
                            </div>
                         </div>

                         <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-4">Catatan Validasi</p>
                            <div className="flex items-start gap-4">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                               <p className="text-xs text-white/60 font-medium leading-relaxed">Unit valid & aktif. Transaksi akan dicatat sebagai <span className="text-white font-bold">{jenis.toUpperCase()}</span> untuk Mata Anggaran {akunId || '...'}.</p>
                            </div>
                         </div>
                      </div>
                    ) : null;
                 })()}
              </div>
           </div>

           {/* SUMMARY PANEL */}
           <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 overflow-hidden relative">
              <div className="absolute right-0 bottom-0 opacity-10 bg-indigo-600 w-1/2 h-1/2 rounded-tl-[10rem]" />
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                 <Check className="text-emerald-500" /> Ringkasan Simpan
              </h4>
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subtotal Mutasi</span>
                    <span className="font-black text-slate-900 text-lg">Rp {Number(nominal).toLocaleString('id-ID') || '0'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">STATUS DATA</span>
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full tracking-widest">DRAFT</span>
                 </div>
                 <p className="text-[9px] text-slate-400 leading-relaxed italic">Pastikan seluruh data sudah sesuai dengan Bukti Fisik sebelum menekan tombol Simpan. Data Pagu bersifat permanen.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
