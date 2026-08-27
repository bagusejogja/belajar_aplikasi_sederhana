'use client';

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import {
   Building2, MessageSquare, Copy, CheckCircle2, Info, Share, Undo2, FileText, Send, Sparkles, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

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
      if (n.includes('iswandari') || n.includes('muslifah')) return `Mbak ${name}`;
      if (n.includes('bambang') || n.includes('ridwan') || n.includes('bagus') || n.includes('triyanto') || n.includes('rohman')) return `Mas ${name}`;
      return name;
   };

   const getCleanLabel = (label: string) => {
      return label.replace(/^Fakultas /i, '').replace(/^Pusat Studi \(PS\) /i, '').replace(/^Pusat Studi /i, '');
   };

   // Phase 1: Request Access
   const getNarrative = () => {
      if (!selectedUnit) return '...';
      const { group, label } = selectedUnit;
      const cleanLabel = getCleanLabel(label);
      let mainText = '';
      if (group === 'Fakultas') mainText = `mohon dibukakan akses revisi/realokasi anggaran Fakultas ${cleanLabel} sesuai surat terlampir ngih.`;
      else if (group === 'Pusat Studi') mainText = `mohon dibukakan akses revisi/realokasi anggaran Pusat Studi (PS) ${cleanLabel} sesuai surat terlampir ngih.`;
      else if (group === 'KPTU') mainText = `mohon diproses revisi/realokasi anggaran ${cleanLabel} sesuai surat terlampir ngih.`;
      else if (group === 'UP') mainText = `mohon dibukakan akses revisi/realokasi anggaran ${cleanLabel} sesuai surat terlampir ngih.`;
      else mainText = `mohon diproses revisi/realokasi anggaran ${cleanLabel} sesuai surat terlampir ngih.`;

      const pic = prefixName(picOverride);
      return `Assalamualaikum warahmatullahi wabarakatuh,
${pic || '[PIC]'}, ${mainText}
Terima kasih.`;
   };

   // Phase 2: Closing / Archive
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

      return `Assalamualaikum warahmatullahi wabarakatuh,
Mas Ridwan, mohon surat diarsipkan; 
${note}
Terima kasih.`;
   };

   // Phase 3: Unit Notification
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

   // Phase 4: Request WR Approval
   const getWRApprovalReq = () => {
      if (!selectedUnit) return '...';
      return `Assalamualaikum warahmatullahi wabarakatuh,
Mbak Muslifah Iswandari, nyuwun tulung dibuatkan surat persetujuan penambahan pagu ${selectedUnit.label} yang ditandatangani Bapak WR, dengan keterangan bahwa pengajuan disetujui 100% dari nilai yang diajukan.
Terima kasih.`;
   };

   // Phase 5: Follow-up WR
   const getWRFollowUp = () => {
      if (!selectedUnit) return '...';
      const pic = prefixName(picOverride);
      return `Assalamualaikum warahmatullahi wabarakatuh,
${pic || '[PIC]'}, mohon tindak lanjut surat persetujuan penambahan pagu yang telah ditandatangani Pak WR dengan menghubungi staf ${selectedUnit.label} untuk matriks penambahan pagunya.
Terima kasih..`;
   };

   const copyToClipboard = (text: string, type: string) => {
      navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Pesan narasi berhasil disalin!');
      setTimeout(() => setCopied(null), 2000);
   };

   return (
      <div className="max-w-5xl mx-auto space-y-4 pb-20">
         {/* SLIM & UNIFIED TOP TOOLBAR */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
            <div className="flex items-center gap-3">
               <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-2 rounded-xl text-white shadow-xs">
                  <MessageSquare size={20} />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                     <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Generator Narasi Komunikasi</h2>
                     <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        WhatsApp & Surat
                     </span>
                  </div>
                  <p className="text-gray-500 font-medium text-[11px] mt-0.5">
                     Buat draf narasi permohonan buka akses, konfirmasi selesai, dan draf surat WR secara otomatis.
                  </p>
               </div>
            </div>
         </div>

         {/* CONFIGURATION CARD */}
         <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                     <Building2 size={13} className="text-indigo-600"/> Pilih Unit Kerja
                  </label>
                  <Select 
                     options={units} 
                     value={selectedUnit}
                     onChange={handleUnitChange} 
                     placeholder="Cari & pilih nama unit..." 
                     className="text-xs font-bold"
                     styles={{
                        control: (base) => ({ ...base, minHeight: '38px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
                        valueContainer: (base) => ({ ...base, padding: '0 8px' })
                     }}
                  />
               </div>

               <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                     Nama PIC Tujuan
                  </label>
                  <input 
                     type="text" 
                     value={picOverride} 
                     onChange={e => setPicOverride(e.target.value)} 
                     className="w-full h-9.5 px-3.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                     placeholder="Nama penerima pesan..." 
                  />
               </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
               <input 
                  type="checkbox" 
                  id="statusProcessed"
                  checked={isProcessed} 
                  onChange={e => setIsProcessed(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer" 
               />
               <label htmlFor="statusProcessed" className="text-xs font-bold text-gray-800 cursor-pointer select-none">
                  Tampilkan Opsi Tambahan (Konfirmasi Selesai, Notifikasi Unit, dan Draf Persetujuan WR)
               </label>
            </div>
         </div>

         {/* OUTPUT CARDS */}
         <div className="space-y-4">
            {/* PHASE 1: PERMOHONAN AKSES */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase">
                        Fase 1
                     </span>
                     <h3 className="text-xs font-black text-gray-900">Permohonan Buka Akses (Pesan WhatsApp)</h3>
                  </div>
                  <button 
                     disabled={!selectedUnit} 
                     onClick={() => copyToClipboard(getNarrative(), 'req')} 
                     className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                     {copied === 'req' ? <Check size={13} /> : <Copy size={13} />}
                     <span>{copied === 'req' ? 'Tersalin' : 'Salin Pesan'}</span>
                  </button>
               </div>
               <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedUnit ? getNarrative() : <span className="text-gray-400 italic">Silakan pilih unit kerja di atas untuk melihat narasi...</span>}
               </div>
            </div>

            {/* PHASE 2, 3, 4, 5 (When checked) */}
            {isProcessed && (
               <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Phase 2: Konfirmasi Selesai */}
                  <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase">
                              Fase 2
                           </span>
                           <h3 className="text-xs font-black text-gray-900">Konfirmasi Selesai / Diarsipkan (Closing WA)</h3>
                        </div>
                        <button 
                           onClick={() => copyToClipboard(getProcessedNote(), 'proc')} 
                           className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                        >
                           {copied === 'proc' ? <Check size={13} /> : <Copy size={13} />}
                           <span>{copied === 'proc' ? 'Tersalin' : 'Salin Pesan'}</span>
                        </button>
                     </div>
                     <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {getProcessedNote()}
                     </div>
                  </div>

                  {/* Phase 3: Notifikasi Unit */}
                  <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-black uppercase">
                              Fase 3
                           </span>
                           <h3 className="text-xs font-black text-gray-900">Pemberitahuan ke Unit Kerja</h3>
                        </div>
                        <button 
                           onClick={() => copyToClipboard(getUnitNotification(), 'notif')} 
                           className="h-8 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                        >
                           {copied === 'notif' ? <Check size={13} /> : <Copy size={13} />}
                           <span>{copied === 'notif' ? 'Tersalin' : 'Salin Pesan'}</span>
                        </button>
                     </div>
                     <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {getUnitNotification()}
                     </div>
                  </div>

                  {/* Phase 4 & 5: Draf WR */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase">
                              Persetujuan WR
                           </span>
                           <button 
                              onClick={() => copyToClipboard(getWRApprovalReq(), 'wr_req')} 
                              className="h-7 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95"
                           >
                              {copied === 'wr_req' ? <Check size={12} /> : <Copy size={12} />}
                              <span>Salin</span>
                           </button>
                        </div>
                        <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[110px]">
                           {getWRApprovalReq()}
                        </div>
                     </div>

                     <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">
                              Follow-up WR
                           </span>
                           <button 
                              onClick={() => copyToClipboard(getWRFollowUp(), 'wr_fu')} 
                              className="h-7 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95"
                           >
                              {copied === 'wr_fu' ? <Check size={12} /> : <Copy size={12} />}
                              <span>Salin</span>
                           </button>
                        </div>
                        <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[110px]">
                           {getWRFollowUp()}
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
