'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { 
  Building2, MessageSquare, Copy, CheckCircle2, Info, ChevronRight, Share, Undo2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function GovNarrativePage() {
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const [picOverride, setPicOverride] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('gov_units').select('*').order('nama_unit');
      if (data) {
        setUnits(data.map(u => ({
          value: u.id,
          label: u.nama_unit,
          group: u.group_org,
          pic: u.pic
        })));
      }
      setLoading(false);
    };
    fetchUnits();
  }, []);

  const handleUnitChange = (option: any) => {
    setSelectedUnit(option);
    setPicOverride(option?.pic || '');
  };

  const getNarrative = () => {
    if (!selectedUnit) return '...';
    
    const { group, label } = selectedUnit;
    let mainText = '';
    
    // Clean label to avoid redundancy (e.g. if name already has "Fakultas")
    let cleanLabel = label.replace(/^Fakultas /i, '').replace(/^Pusat Studi \(PS\) /i, '').replace(/^Pusat Studi /i, '');

    if (group === 'Fakultas') {
      mainText = `mohon dibukakan akses revisi/realokasi anggaran Fakultas ${cleanLabel} sesuai surat terlampir ngih.`;
    } else if (group === 'Pusat Studi') {
      mainText = `mohon dibukakan akses revisi/realokasi anggaran Pusat Studi (PS) ${cleanLabel} sesuai surat terlampir ngih.`;
    } else if (group === 'KPTU') {
      mainText = `mohon diproses revisi/realokasi anggaran ${cleanLabel} sesuai surat terlampir ngih.`;
    } else if (group === 'UP') {
      mainText = `mohon dibukakan akses revisi/realokasi anggaran ${cleanLabel} sesuai surat terlampir ngih.`;
    } else {
      mainText = `mohon diproses revisi/realokasi anggaran ${cleanLabel} sesuai surat terlampir ngih.`;
    }

    return `Assalamualaikum warahmatullahi wabarakatuh,
${picOverride || '[pic]'}, ${mainText} Setelah diproses, mohon sekalian diarsipkan ya, Mas.
Terima kasih.`;
  };

  const getProcessedNote = () => {
    return `Assalamualaikum warahmatullahi wabarakatuh,
${picOverride || 'Mas Ridwan Aditya Mahendra'}, mohon surat diarsipkan; akses sudah saya proses.
Terima kasih.`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return (
    <div className="p-40 flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Menyiapkan Mesin Narasi...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* 1. HEADER SECTION */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tighter italic uppercase flex items-center gap-4">
               <MessageSquare size={40} className="text-indigo-300" /> Narrative Engine
            </h1>
            <p className="text-indigo-100/60 mt-2 font-bold tracking-widest text-xs uppercase">Budget Revision Communication Generator</p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      {/* 2. CONFIGURATION CARD */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-10 border-b bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] italic">Pengaturan Pesan</h3>
            <div className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Drafting</div>
         </div>
         <div className="p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Building2 size={12} /> Pilih Unit Kerja
                  </label>
                  <Select 
                     options={units}
                     onChange={handleUnitChange}
                     placeholder="Cari Nama Unit..."
                     className="react-select-container"
                     classNamePrefix="react-select"
                     styles={{
                        control: (base) => ({
                           ...base,
                           borderRadius: '1.25rem',
                           padding: '6px',
                           border: '2px solid #f1f5f9',
                           boxShadow: 'none',
                           '&:hover': { borderColor: '#3b82f6' }
                        }),
                        placeholder: (base) => ({ ...base, fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }),
                        option: (base, state) => ({
                           ...base,
                           fontSize: '13px',
                           fontWeight: state.isSelected ? '800' : '600',
                           backgroundColor: state.isFocused ? '#f8fafc' : 'white',
                           color: state.isSelected ? '#3730a3' : '#475569'
                        })
                     }}
                  />
               </div>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Share size={12} /> Nama PIC / Tujuan
                  </label>
                  <input 
                     type="text" 
                     value={picOverride}
                     onChange={e => setPicOverride(e.target.value)}
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] p-4 font-bold text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                     placeholder="Contoh: Mas Ridwan Aditya Mahendra"
                  />
               </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 group transition-all hover:border-emerald-200">
               <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                     type="checkbox" 
                     checked={isProcessed}
                     onChange={e => setIsProcessed(e.target.checked)}
                     className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-700 uppercase tracking-tight italic">Sudah Selesai Diproses?</h4>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Aktifkan untuk memunculkan catatan pengarsipan</p>
               </div>
            </div>
         </div>
      </div>

      {/* 3. OUTPUT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Request Message */}
         <div className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-indigo-50 relative group">
            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
               Pesan Permohonan Akses
               <span className="bg-indigo-50 px-3 py-1 rounded-full">Phase 1</span>
            </h4>
            <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-100 min-h-[160px] relative">
               <p className="text-slate-800 font-bold whitespace-pre-wrap leading-relaxed text-sm italic">
                  {selectedUnit ? getNarrative() : 'Harap pilih unit kerja untuk generate pesan...'}
               </p>
            </div>
            <button 
               disabled={!selectedUnit}
               onClick={() => copyToClipboard(getNarrative(), 'req')}
               className={`mt-8 w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg ${
                  !selectedUnit ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-slate-900 active:scale-95 shadow-indigo-200'
               }`}
            >
               {copied === 'req' ? <CheckCircle2 size={18} /> : <Copy size={18} />}
               {copied === 'req' ? 'Tersalin' : 'Salin Pesan WA'}
            </button>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"><Info size={20} className="text-indigo-100" /></div>
         </div>

         {/* Archive Message (Visible only when checkbox checked) */}
         <div className={`transition-all duration-700 transform ${isProcessed ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none scale-95 translate-y-10'}`}>
            <div className="bg-white rounded-[3rem] p-10 shadow-xl border-4 border-emerald-50 h-full relative group">
               <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                  Pesan Konfirmasi Selesai
                  <span className="bg-emerald-50 px-3 py-1 rounded-full">Phase 2</span>
               </h4>
               <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-100 min-h-[160px]">
                  <p className="text-slate-800 font-bold whitespace-pre-wrap leading-relaxed text-sm italic">
                     {getProcessedNote()}
                  </p>
               </div>
               <button 
                  onClick={() => copyToClipboard(getProcessedNote(), 'proc')}
                  className="mt-8 w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
               >
                  {copied === 'proc' ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  {copied === 'proc' ? 'Tersalin' : 'Salin Pesan Closing'}
               </button>
            </div>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col md:flex-row items-center gap-10">
         <div className="bg-indigo-500/20 p-5 rounded-3xl"><Undo2 size={32} className="text-indigo-400" /></div>
         <div className="flex-1 text-center md:text-left">
            <h5 className="text-lg font-black uppercase tracking-tighter italic">Optimasi Alur Kerja</h5>
            <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase tracking-widest mt-1">Gunakan narasi di atas untuk mempercepat koordinasi revisi anggaran melalui platform messaging tanpa perlu mengetik ulang kriteria teknis unit.</p>
         </div>
      </div>
    </div>
  );
}
