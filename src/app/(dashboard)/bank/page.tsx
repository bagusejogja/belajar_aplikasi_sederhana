'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste, Database, PlusCircle, Coins, Hash, BookOpen, Quote, 
   ArrowRight, Zap, RefreshCw, Layers
} from 'lucide-react';

// VERSION FLAG TO VERIFY VERCEL DEPLOYMENT
const BUILD_ID = "v4.5-ELITE-REV-1815"; 

export default function BankTransaksiPage() {
   const [parsedData, setParsedData] = useState<any[]>([]);
   const [isParsing, setIsParsing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

   const [dbTransactions, setDbTransactions] = useState<any[]>([]);
   const [totalInDb, setTotalInDb] = useState(0);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   
   const [searchTerm, setSearchTerm] = useState('');
   const [filterType, setFilterType] = useState<'all' | 'out' | 'in' | 'no-proof'>('out'); 
   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [offset, setOffset] = useState(0); 

   const fetchHistory = useCallback(async (isReset = true) => {
      if (isReset) { setIsLoadingHistory(true); setOffset(0); }
      else { setIsLoadingMore(true); }

      try {
         const currentOffset = isReset ? 0 : offset + 1;
         const rangeFrom = currentOffset * 2000;
         const rangeTo = rangeFrom + 1999;

         let query = supabase
            .from('bank_transactions')
            .select(`*, ref_akun (nama_akun, nomor_akun)`, { count: 'exact' })
            .order('waktu_transaksi', { ascending: false });

         if (selectedMonth > 0) {
            const start = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
            const nextM = selectedMonth === 12 ? 1 : selectedMonth + 1;
            const nextY = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
            const end = `${nextY}-${nextM.toString().padStart(2, '0')}-01`;
            query = query.gte('waktu_transaksi', start).lt('waktu_transaksi', end);
         } else if (selectedYear > 0) {
            query = query.gte('waktu_transaksi', `${selectedYear}-01-01`).lt('waktu_transaksi', `${selectedYear + 1}-01-01`);
         }

         const { data, error, count } = await query.range(rangeFrom, rangeTo);
         if (data) {
            if (isReset) { setDbTransactions(data); setTotalInDb(count || 0); }
            else { setDbTransactions(prev => [...prev, ...data]); setOffset(currentOffset); }
         }
      } catch (err: any) { console.error(err); } finally { setIsLoadingHistory(false); setIsLoadingMore(false); }
   }, [selectedMonth, selectedYear, offset]);

   useEffect(() => {
      fetchHistory(true);
   }, [selectedMonth, selectedYear, fetchHistory]);

   const formatShowDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${mons[d.getMonth()]} ${d.getFullYear()}`;
   };

   const cleanNum = (str: string) => {
      if (!str || str === '\\N') return v => 0;
      let v = str.trim().replace(/[^\d.,-]/g, '');
      if (v === '') return 0;
      if (v.includes(',') && v.includes('.')) {
         if (v.lastIndexOf(',') > v.lastIndexOf('.')) v = v.replace(/\./g, '').replace(',', '.');
         else v = v.replace(/,/g, '');
      } else if (v.includes(',')) {
         if (v.split(',')[1]?.length === 3) v = v.replace(/,/g, '');
         else v = v.replace(',', '.');
      }
      return parseFloat(v) || 0;
   };

   const parseDate = (ts: string) => {
      let val = ts.trim();
      const num = Number(val.replace(',', '.'));
      if (!isNaN(num) && num > 20000 && num < 100000) { 
         const dObj = new Date((num - 25569) * 86400 * 1000);
         const pad = (n: number) => String(n).padStart(2, '0');
         return `${dObj.getFullYear()}-${pad(dObj.getMonth()+1)}-${pad(dObj.getDate())} 00:00:00`;
      }
      if (val.includes('/')) {
         const pts = val.split(/[ /]/);
         const pad = (n: any) => String(n).padStart(2, '0');
         if (pts[0].length === 4) return `${pts[0]}-${pad(pts[1])}-${pad(pts[2])} 00:00:00`;
         if (pts[2]?.substring(0,4).length === 4) return `${pts[2].substring(0,4)}-${pad(pts[1])}-${pad(pts[0])} 00:00:00`;
      }
      return val;
   };

   const handlePasteData = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text');
      if (!text) return;
      setIsParsing(true);
      let rows = text.split('\n').filter(r => r.trim() !== '');
      if (rows.length > 0 && rows[0].includes('Saldo') && /\d{5}/.test(rows[0])) {
         const splitRow = rows[0].replace(/(Saldo)(\d{5})/, '$1\n$2');
         const nRows = splitRow.split('\n');
         rows = [nRows[0], nRows[1], ...rows.slice(1)];
      }
      const extracted: any[] = [];
      const isHeader = rows[0].toLowerCase().includes('tgl') || rows[0].toLowerCase().includes('desk');
      const startIdx = isHeader ? 1 : 0;
      for (let i = startIdx; i < rows.length; i++) {
         const pts = rows[i].split(/\t|;/).map(p => p.trim());
         if (pts.length < 5) continue;
         extracted.push({
            waktu_transaksi: parseDate(pts[0] || ''),
            rekening_id: Number(pts[1]) || null,
            akun_id: (pts[2] === '\\N' || !pts[2]) ? null : (Number(pts[2]) || null),
            noref_bank: (pts[3] === '\\N' || !pts[3]) ? null : pts[3],
            deskripsi: pts[4] || '',
            debet: cleanNum(pts[5]),
            kredit: cleanNum(pts[6]),
            saldo_riil: cleanNum(pts[7]),
         });
      }
      if (extracted.length > 0) { setParsedData(extracted); setMessage({ type: 'success', text: `Berhasil baca ${extracted.length} baris.` }); }
      else { setMessage({ type: 'error', text: 'Format tidak dikenali.' }); }
      setIsParsing(false);
   };

   const handleSimpanData = async () => {
      if (parsedData.length === 0) return;
      setIsSaving(true);
      try {
         const { error } = await supabase.from('bank_transactions').insert(parsedData);
         if (error) throw error;
         setParsedData([]);
         setMessage({ type: 'success', text: '✅ Data Tersimpan!' });
         fetchHistory(true);
      } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setIsSaving(false); }
   };

   const [editingRow, setEditingRow] = useState<any | null>(null);
   const [isUpdating, setIsUpdating] = useState(false);
   const [uploadFiles, setUploadFiles] = useState<File[]>([]);
   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
   const [manualUrls, setManualUrls] = useState<string>('');
   const [editAkunId, setEditAkunId] = useState<string>('');

   const handleUpdateProof = async () => {
      if (!editingRow) return;
      setIsUpdating(true);
      try {
         let finalUrls: string[] = previewUrls.filter(u => u.startsWith('http'));
         if (uploadFiles.length) {
            const upP = uploadFiles.map(async f => {
               const n = `b_${Math.random().toString(36).substring(7)}_${Date.now()}`;
               await supabase.storage.from('receipts').upload(n, f);
               return supabase.storage.from('receipts').getPublicUrl(n).data.publicUrl;
            });
            finalUrls = [...finalUrls, ...await Promise.all(upP)];
         }
         const combined = manualUrls ? `${finalUrls.join(',')},${manualUrls}` : finalUrls.join(',');
         await supabase.from('bank_transactions').update({ foto_bukti: combined || null, akun_id: editAkunId ? Number(editAkunId) : null }).eq('id', editingRow.id);
         setEditingRow(null); fetchHistory(false);
      } catch (err: any) { alert(err.message); } finally { setIsUpdating(false); }
   };

   const filteredHistory = dbTransactions.filter(row => {
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;
      return matchSearch && matchType;
   });

   return (
      <div className="space-y-12 max-w-[1400px] mx-auto pb-40 px-6 mt-12 bg-white/5 font-sans relative">
         {/* DEPLOYMENT BADGE */}
         <div className="fixed bottom-10 right-10 z-[200] bg-slate-900 border border-white/10 px-6 py-2 rounded-full text-[10px] font-black text-white/40 uppercase shadow-2xl tracking-widest pointer-events-none">
            {BUILD_ID}
         </div>

         {/* ROW 1: PASTE ZONE FULL WIDTH */}
         <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-3xl relative overflow-hidden flex flex-col items-center group border border-indigo-500/10">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center gap-16 w-full max-w-7xl relative z-10">
               <div className="flex-1 text-center md:text-left space-y-8">
                  <div className="inline-flex items-center gap-4 bg-indigo-600 px-6 py-2 rounded-full shadow-lg shadow-indigo-500/30">
                     <Zap size={18} className="fill-white"/>
                     <span className="text-[11px] font-black uppercase tracking-[0.4em]">Integrated Audit v4.5</span>
                  </div>
                  <h2 className="text-8xl font-black italic tracking-tighter uppercase leading-[0.8] drop-shadow-2xl">Paste Zone</h2>
                  <p className="text-xl font-black text-indigo-400 uppercase tracking-[0.2em] italic flex items-center gap-3">
                     <Layers size={24}/> Impor Bank Masjid
                  </p>
                  <div className="flex gap-4 justify-center md:justify-start pt-6">
                     <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-[2rem]">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Master Database</p>
                        <p className="text-3xl font-black mt-1 tracking-tighter">{totalInDb.toLocaleString()}</p>
                     </div>
                     <button onClick={() => fetchHistory(true)} className="bg-indigo-600 border border-indigo-500 p-6 rounded-[2rem] hover:rotate-180 transition-all duration-700 shadow-xl shadow-indigo-500/20"><RefreshCw size={28}/></button>
                  </div>
               </div>
               <div className="flex-[1.5] w-full">
                  <div className="relative group">
                     <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-[4rem] blur opacity-25 group-hover:opacity-100 transition-all duration-1000"></div>
                     <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI..." className="relative w-full bg-slate-900 border-2 border-white/20 rounded-[3.5rem] p-12 h-64 outline-none focus:border-indigo-500 font-bold text-3xl text-center placeholder:text-white/5 shadow-2xl transition-all font-mono" />
                     {message && <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-16 py-5 rounded-full font-black uppercase text-xs shadow-3xl animate-bounce ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</div>}
                  </div>
               </div>
            </div>
         </div>

         {/* ROW 2: FILTERS (DUAL CARD ELITE) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-[5rem] p-16 shadow-lg border border-slate-100 flex flex-col justify-between group hover:shadow-2xl transition-all">
               <div className="flex justify-between items-center mb-10"><div><h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Filter Laporan</h4><div className="h-1.5 w-32 bg-indigo-600 mt-2 rounded-full"></div></div><Calendar className="text-indigo-600" size={50}/></div>
               <div className="flex items-center gap-12">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-900 text-6xl bg-transparent outline-none cursor-pointer flex-1 uppercase tracking-tighter hover:text-indigo-600 transition-all border-none">
                     <option value={0}>Semua</option>
                     {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-6xl bg-transparent outline-none cursor-pointer tracking-tighter border-none">
                     {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-indigo-600 rounded-[5rem] p-16 shadow-3xl text-white flex flex-col justify-between group overflow-hidden relative">
               <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:-rotate-12 transition-all duration-700"><Filter size={300}/></div>
               <div className="flex justify-between items-center mb-10 relative z-10"><div><h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em]">Status Verifikasi</h4><div className="h-1.5 w-32 bg-white mt-2 rounded-full"></div></div><Search className="text-white" size={50}/></div>
               <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="relative z-10 bg-transparent font-black tracking-tighter text-6xl outline-none cursor-pointer w-full text-left uppercase hover:text-indigo-200 transition-all border-none">
                  <option value="all" className="text-slate-800">Semua Data</option>
                  <option value="out" className="text-slate-800">Pengeluaran (-)</option>
                  <option value="in" className="text-slate-800">Pemasukan (+)</option>
                  <option value="no-proof" className="text-slate-800">Cek Nota</option>
               </select>
            </div>
         </div>

         {/* ROW 4: HISTORI MUTASI (ULTRA-BIG) */}
         <div className="bg-white rounded-[6rem] shadow-sm border border-slate-100 overflow-hidden mx-4 pb-20">
            <div className="p-20 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-16">
               <div className="flex items-center gap-10"><div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-3xl"><History size={48}/></div><div><h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Histori Mutasi Pusat</h3><div className="flex items-center gap-5 mt-5"><div className="h-2 w-48 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200"></div><span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">Digital Ledger Masjid Kampus Audit</span></div></div></div>
               <div className="relative w-full md:w-[600px]"><Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" size={32}/><input type="text" placeholder="Cari transaksi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-[3rem] py-8 pl-24 pr-12 text-xl font-bold w-full outline-none focus:border-indigo-600 shadow-2xl shadow-indigo-50 transition-all font-mono" /></div>
            </div>
            
            <div className="overflow-x-auto min-h-[700px] px-8">
               <table className="w-full text-left whitespace-nowrap table-fixed">
                  <thead className="bg-white border-b-4 border-slate-50 text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic">
                     <tr>
                        <th className="p-16 w-[200px]">Tgl Mutasi</th>
                        <th className="p-16 w-[140px] text-center">Arsip</th>
                        <th className="p-16">Keterangan & Mata Anggaran</th>
                        <th className="p-16 w-[350px] text-right">Debit / Kredit</th>
                        <th className="p-16 w-[250px] text-right">Saldo Kas</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-60 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={80}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-60 text-center"><p className="italic text-slate-200 font-black uppercase tracking-[0.6em] text-5xl opacity-30">No Transactions</p></td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all border-b border-gray-100">
                           <td className="p-16">
                              <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">{formatShowDate(row.waktu_transaksi)}</p>
                              <div className="mt-4 flex items-center gap-3"><ArrowRight size={14} className="text-indigo-400"/><p className="text-xs font-black text-slate-300 uppercase tracking-widest tracking-tighter truncate">REF: {row.noref_bank || '---'}</p></div>
                           </td>
                           <td className="p-16">
                              <div className="flex flex-col items-center gap-4">
                                 <button onClick={() => { setEditingRow(row); setPreviewUrls((row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'))); setUploadFiles([]); setManualUrls(row.foto_bukti && !row.foto_bukti.startsWith('http') ? row.foto_bukti : ''); setEditAkunId(row.akun_id?.toString() || ''); }} className={`p-6 rounded-[3rem] border-[6px] transition-all active:scale-90 shadow-3xl group-hover:scale-110 ${row.foto_bukti ? 'bg-white border-indigo-100 text-indigo-600 shadow-indigo-100' : 'bg-red-50 border-red-50 text-red-500 animate-pulse'}`}>
                                    <ImagePlus size={36}/>
                                 </button>
                                 {row.foto_bukti && <div className="flex gap-2">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url, idx) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><ExternalLink size={12}/></a>))}</div>}
                              </div>
                           </td>
                           <td className="p-16">
                              <div className="flex flex-col gap-6">
                                 <p className="text-6xl font-black text-slate-950 tracking-tighter italic truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all uppercase leading-[0.7]">{row.deskripsi}</p>
                                 <div className="flex items-center gap-6">
                                    <span className="px-6 py-2.5 bg-slate-950 text-white rounded-2xl font-black text-[12px] shadow-2xl flex items-center gap-4 tracking-widest italic leading-none"><Hash size={16} className="text-emerald-400"/> {row.ref_akun?.nomor_akun || row.akun_id || '??'}</span>
                                    <span className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic">{row.ref_akun?.nama_akun || 'POS BELUM DITENTUKAN'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-16 text-right font-black text-6xl tracking-tighter italic ${row.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              <span className="flex items-center justify-end gap-3 leading-none drop-shadow-xl">{row.debet > 0 ? '-' : '+'} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-16 text-right font-black text-slate-200 text-2xl italic leading-none group-hover:text-slate-400 transition-colors uppercase">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-20 bg-slate-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-slate-950 text-white px-32 py-10 rounded-[4rem] font-black flex items-center gap-6 hover:bg-indigo-600 transition-all text-sm tracking-[0.5em] italic shadow-3xl active:scale-95">{isLoadingMore ? <Loader2 className="animate-spin" /> : <PlusCircle size={24} />} MUAT DATA SELANJUTNYA</button></div>)}
         </div>

         {/* MODAL EDIT (V4.5 ELITE FINAL) */}
         {editingRow && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-10 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500">
               <div className="bg-white w-full max-w-4xl rounded-[6rem] shadow-3xl overflow-hidden flex flex-col max-h-[96vh] border-4 border-white/20 animate-in slide-in-from-bottom-20">
                  <div className="p-20 border-b bg-gray-50/50 flex justify-between items-center shrink-0"><div><h4 className="text-4xl font-black italic text-slate-800 uppercase flex items-center gap-8"><ImagePlus size={48} className="text-indigo-600"/> Arsip Bukti Real-Time</h4><p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] mt-3 border-l-[10px] border-indigo-600 pl-6 italic">Verifikasi Transaksi Masjid Kampus v4.5</p></div><button onClick={() => setEditingRow(null)} className="p-6 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={60}/></button></div>
                  <div className="p-20 space-y-16 overflow-y-auto flex-1 scrollbar-hide italic">
                     <div className={`p-16 rounded-[5rem] border-[6px] shadow-3xl ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-5xl font-black text-slate-950 mb-8 tracking-tighter leading-none italic uppercase">{editingRow.deskripsi}</p><p className={`text-8xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="space-y-8"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.6em] block pl-12">Kode Pos Keuangan (Account ID)</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Misal: 11110.01" className="w-full bg-slate-50 border-[6px] border-slate-100 rounded-[4rem] p-12 font-black text-indigo-600 text-6xl outline-none focus:border-indigo-600 transition-all shadow-inner text-center italic tracking-tighter placeholder:opacity-10" /></div>
                     <div className="space-y-16"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.6em] block pl-12">Arsip Lampiran Nota ({previewUrls.length} Data)</label><div className="grid grid-cols-2 gap-12">{previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-video rounded-[4rem] overflow-hidden border-[10px] border-white shadow-3xl group/img"><img src={url} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/70 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center"><button onClick={() => { setUploadFiles(prev => prev.filter((_, i) => i !== idx)); setPreviewUrls(prev => prev.filter((_, i) => i !== idx)); }} className="bg-red-600 text-white p-8 rounded-full shadow-3xl hover:scale-110 transition-all"><X size={40}/></button></div></div>))}<label className="aspect-video border-[6px] border-dashed border-indigo-100 rounded-[4rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200"><Upload size={100}/><p className="text-sm font-black uppercase tracking-[0.5em] mt-10 text-indigo-300">Upload Nota Baru</p><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.length) { const f = Array.from(e.target.files).filter(x => x.size <= 5*1024*1024); setUploadFiles(p=>[...p,...f]); setPreviewUrls(p=>[...p,...f.map(i=>URL.createObjectURL(i))]); } }} /></label></div></div>
                  </div>
                  <div className="p-20 bg-slate-50 border-t flex gap-16 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-12 text-xs font-black uppercase tracking-widest text-slate-400 italic font-sans">Batalkan</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[5] py-12 bg-slate-950 text-white rounded-[4rem] font-black text-xs uppercase tracking-[0.6em] shadow-3xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-10 italic">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} KONFIRMASI PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
