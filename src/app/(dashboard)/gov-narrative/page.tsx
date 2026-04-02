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

  const prefixName = (name: string) => {
    if (!name) return '';
    const n = name.toLowerCase();
    if (n.includes('iswandari')) return `Mbak ${name}`;
    if (n.includes('bambang') || n.includes('ridwan') || n.includes('bagus')) return `Mas ${name}`;
    return name;
  };

  const getCleanLabel = (label: string) => {
    return label.replace(/^Fakultas /i, '').replace(/^Pusat Studi \(PS\) /i, '').replace(/^Pusat Studi /i, '');
  };

  const getNarrative = () => {
    if (!selectedUnit) return '...';
    
    const { group, label } = selectedUnit;
    const cleanLabel = getCleanLabel(label);
    let mainText = '';

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

    const pic = prefixName(picOverride);
    return `Assalamualaikum warahmatullahi wabarakatuh,
${pic || '[pic]'}, ${mainText}
Terima kasih.`;
  };

  const getProcessedNote = () => {
    if (!selectedUnit) return '...';
    const { group, label } = selectedUnit;
    const cleanLabel = getCleanLabel(label);
    let note = '';

    if (group === 'Fakultas') note = `akses revisi/realokasi anggaran Fakultas ${cleanLabel} sudah saya bukakan sesuai surat terlampir.`;
    else if (group === 'Pusat Studi') note = `akses revisi/realokasi anggaran Pusat Studi (PS) ${cleanLabel} sudah saya bukakan sesuai surat terlampir ngih.`;
    else if (group === 'KPTU') note = `revisi/realokasi anggaran ${cleanLabel} sudah saya realokasi sesuai surat terlampir ngih.`;
    else if (group === 'UP') note = `revisi/realokasi anggaran ${cleanLabel} sudah saya bukakan aksesnya sesuai surat terlampir ngih.`;
    else note = `revisi/realokasi anggaran ${cleanLabel} sudah saya proses sesuai surat terlampir.`;

    const pic = picOverride.toLowerCase().includes('ridwan') ? 'Mas Ridwan' : prefixName(picOverride);

    return `Assalamualaikum warahmatullahi wabarakatuh,
${pic || 'Mas Ridwan'}, mohon surat diarsipkan; 
${note}
Terima kasih.`;
  };

  const getUnitNotification = () => {
    if (!selectedUnit) return '...';
    const { group, label } = selectedUnit;
    const cleanLabel = getCleanLabel(label);
    let note = '';

    if (group === 'Fakultas') note = `akses revisi/realokasi anggaran Fakultas ${cleanLabel} sudah saya bukakan sesuai surat terlampir.`;
    else if (group === 'Pusat Studi') note = `akses revisi/realokasi anggaran Pusat Studi (PS) ${cleanLabel} sudah saya bukakan sesuai surat terlampir ngih.`;
    else if (group === 'KPTU') note = `revisi/realokasi anggaran ${cleanLabel} sudah saya realokasi sesuai surat terlampir ngih.`;
    else if (group === 'UP') note = `revisi/realokasi anggaran ${cleanLabel} sudah saya bukakan aksesnya sesuai surat terlampir ngih.`;
    else note = `revisi/realokasi anggaran ${cleanLabel} sudah saya proses sesuai surat terlampir.`;

    return `Assalamualaikum warahmatullahi wabarakatuh,
Yth. Bapak/Ibu dari ${label},
Terkait dengan surat diatas perihal ${note}
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
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* 1. HEADER SECTION */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tighter italic uppercase flex items-center gap-4">
               <MessageSquare size={36} className="text-indigo-300" /> Narrative Engine
            </h1>
            <p className="text-indigo-100/60 mt-1 font-bold tracking-widest text-[10px] uppercase">Official Budget Communication Generator</p>
         </div>
      </div>

      {/* 2. CONFIGURATION CARD */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
         <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] italic">Parameter Unit & PIC</h3>
         </div>
         <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Pilih Unit Kerja</label>
                  <Select options={units} onChange={handleUnitChange} placeholder="Cari Nama Unit..." className="react-select-container" classNamePrefix="react-select" />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Nama PIC Tujuan</label>
                  <input type="text" value={picOverride} onChange={e => setPicOverride(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.2rem] p-4 font-black text-sm outline-none focus:border-indigo-500 transition-all shadow-inner" placeholder="Penerima Pesan..." />
               </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 transition-all hover:border-emerald-200">
               <input type="checkbox" checked={isProcessed} onChange={e => setIsProcessed(e.target.checked)} className="w-12 h-6 appearance-none bg-slate-200 rounded-full checked:bg-emerald-500 relative transition-all cursor-pointer before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 before:transition-all checked:before:translate-x-6 shadow-inner" />
               <div>
                  <h4 className="text-[11px] font-black text-slate-700 uppercase italic">Status: Sudah Selesai Diproses</h4>
                  <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Aktifkan untuk Konfirmasi Selesai & Notifikasi Unit</p>
               </div>
            </div>
         </div>
      </div>

      {/* 3. OUTPUT SECTION */}
      <div className="space-y-8">
         {/* BOX 1: REQUEST */}
         <div className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-indigo-50 group hover:border-indigo-100 transition-all">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
               Pesan Permohonan (WA) <span className="bg-indigo-50 px-3 py-1 rounded-full">Phase 1</span>
            </h4>
            <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border-2 border-dashed border-slate-100">
               <p className="text-slate-800 font-bold whitespace-pre-wrap leading-relaxed text-sm italic">{selectedUnit ? getNarrative() : '...'}</p>
            </div>
            <button disabled={!selectedUnit} onClick={() => copyToClipboard(getNarrative(), 'req')} className={`mt-6 w-full py-4 rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${!selectedUnit ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100'}`}>
               {copied === 'req' ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copied === 'req' ? 'Tersalin' : 'Salin Pesan WA'}
            </button>
         </div>

         {/* BOX 2 & 3: PROCESSED & UNIT NOTIF */}
         {isProcessed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
               <div className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-emerald-50 h-full flex flex-col group hover:border-emerald-100 transition-all">
                  <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Konfirmasi Selesai (Phase 2)</h4>
                  <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border-2 border-dashed border-slate-100 flex-1">
                     <p className="text-slate-800 font-bold whitespace-pre-wrap leading-relaxed text-xs italic">{getProcessedNote()}</p>
                  </div>
                  <button onClick={() => copyToClipboard(getProcessedNote(), 'proc')} className="mt-6 w-full py-4 bg-emerald-600 text-white rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 shadow-lg shadow-emerald-50 flex items-center justify-center gap-2">
                     {copied === 'proc' ? <CheckCircle2 size={16} /> : <Copy size={16} />} SALIN CLOSING
                  </button>
               </div>

               <div className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-amber-50 h-full flex flex-col group hover:border-amber-100 transition-all">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Notifikasi Unit (Phase 3)</h4>
                  <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border-2 border-dashed border-slate-100 flex-1">
                     <p className="text-slate-800 font-bold whitespace-pre-wrap leading-relaxed text-xs italic">{getUnitNotification()}</p>
                  </div>
                  <button onClick={() => copyToClipboard(getUnitNotification(), 'unit')} className="mt-6 w-full py-4 bg-amber-500 text-white rounded-[1.2rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 shadow-lg shadow-amber-50 flex items-center justify-center gap-2">
                     {copied === 'unit' ? <CheckCircle2 size={16} /> : <Copy size={16} />} SALIN NOTIF UNIT
                  </button>
               </div>
            </div>
         )}
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
