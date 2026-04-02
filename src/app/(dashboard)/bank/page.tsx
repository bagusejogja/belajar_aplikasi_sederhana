'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste, Database, PlusCircle, Coins, Hash, BookOpen, Quote, 
   ArrowRight, Zap, RefreshCw
} from 'lucide-react';

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
         
         if (error) {
            const fallback = await supabase.from('bank_transactions').select('*', { count: 'exact' }).order('waktu_transaksi', { ascending: false }).range(rangeFrom, rangeTo);
            if (isReset) { setDbTransactions(fallback.data || []); setTotalInDb(fallback.count || 0); }
            else { setDbTransactions(prev => [...prev, ...(fallback.data || [])]); setOffset(currentOffset); }
         } else {
            if (isReset) { setDbTransactions(data || []); setTotalInDb(count || 0); }
            else { setDbTransactions(prev => [...prev, ...(data || [])]); setOffset(currentOffset); }
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
      if (extracted.length > 0) { setParsedData(extracted); setMessage({ type: 'success', text: `Ditemukan ${extracted.length} data.` }); }
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
      <div className="space-y-12 max-w-[1400px] mx-auto pb-40 px-6 mt-12 bg-white/5">
         {/* ROW 1: PASTE ZONE FULL WIDTH */}
         <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 left-0 p-8 opacity-5"><ClipboardPaste size={300}/></div>
            <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-7xl relative z-10">
               <div className="flex-1 text-center md:text-left space-y-6">
                  <div className="inline-flex items-center gap-4 bg-indigo-600/20 px-6 py-3 rounded-full border border-indigo-500/10">
                     <Zap size={20} className="text-indigo-400 fill-indigo-400"/>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Audio & Audit System v4.5</span>
                  </div>
                  <h2 className="text-7xl font-black italic tracking-tighter uppercase leading-[0.8]">Paste Zone</h2>
                  <p className="text-lg font-bold text-white/30 uppercase tracking-[0.2em] italic">Impor Bank Mutasi Masjid Pusat 🕌</p>
                  <div className="flex gap-4 justify-center md:justify-start pt-4">
                     <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                        <p className="text-[10px] font-black text-white/30 uppercase">Total Database</p>
                        <p className="text-xl font-black">{totalInDb}</p>
                     </div>
                     <button onClick={() => fetchHistory(true)} className="bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition-all"><RefreshCw size={24}/></button>
                  </div>
               </div>
               <div className="flex-[1.5] w-full">
                  <div className="relative group">
                     <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-[3rem] blur opacity-10 group-hover:opacity-30 transition-all duration-500"></div>
                     <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI..." className="relative w-full bg-slate-950 border-2 border-white/10 rounded-[2.5rem] p-10 h-52 outline-none focus:border-indigo-500 font-bold text-2xl text-center placeholder:text-white/5 shadow-2xl transition-all" />
                     {message && <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-12 py-4 rounded-full font-black uppercase text-xs shadow-2xl shadow-black animate-in zoom-in-50 ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</div>}
                  </div>
               </div>
            </div>
         </div>

         {/* ROW 2: FILTERS (DUAL CARD) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-100 flex flex-col justify-between group">
               <div className="flex justify-between items-center mb-8"><div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Filter Periode</h4><div className="h-1 w-20 bg-indigo-600 mt-2"></div></div><Calendar className="text-indigo-600" size={40}/></div>
               <div className="flex items-center gap-10">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-5xl bg-transparent outline-none cursor-pointer flex-1 uppercase tracking-tighter hover:text-indigo-600 transition-all">
                     <option value={0}>Semua</option>
                     {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-5xl bg-transparent outline-none cursor-pointer tracking-tighter">
                     {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-indigo-600 rounded-[40px] p-12 shadow-2xl text-white flex flex-col justify-between group overflow-hidden relative">
               <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform"><Filter size={200}/></div>
               <div className="flex justify-between items-center mb-8 relative z-10"><div><h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Status Transaksi</h4><div className="h-1 w-20 bg-white mt-2"></div></div><ArrowDownLeft className="text-white" size={40}/></div>
               <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="relative z-10 bg-transparent font-black tracking-tighter text-5xl outline-none cursor-pointer w-full text-left uppercase hover:text-indigo-200 transition-all">
                  <option value="all" className="text-slate-800">Semua</option>
                  <option value="out" className="text-slate-800">Uang Keluar</option>
                  <option value="in" className="text-slate-800">Uang Masuk</option>
                  <option value="no-proof" className="text-slate-800">Nota Kosong</option>
               </select>
            </div>
         </div>

         {/* PREVIEW IMPOR (SAMA OK) */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[4rem] shadow-2xl p-12 border-4 border-indigo-50 animate-in slide-in-from-bottom-10">
               <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-8 text-slate-800">
                  <div className="flex items-center gap-6"><div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-2xl shadow-emerald-200"><FileSpreadsheet size={40}/></div><div><h3 className="text-4xl font-black tracking-tighter uppercase italic">Preview Impor ({parsedData.length})</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Cepat Sebelum Simpan Berkas.</p></div></div>
                  <div className="flex gap-4"><button onClick={() => setParsedData([])} className="px-10 py-5 font-black uppercase text-xs text-slate-400">Batal</button><button onClick={handleSimpanData} disabled={isSaving} className="bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-black shadow-2xl hover:bg-emerald-600 transition-all flex items-center gap-4 uppercase text-xs tracking-widest">{isSaving ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN KE SERVER</button></div>
               </div>
               <div className="overflow-x-auto rounded-[3rem] border border-slate-100 bg-slate-50/30">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <tr><th className="p-8">Waktu</th><th className="p-8">Akun</th><th className="p-8">Deskripsi</th><th className="p-8 text-right">Debit</th><th className="p-8 text-right">Kredit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 font-bold italic">
                        {parsedData.slice(0, 10).map((row, i) => (<tr key={i} className="hover:bg-indigo-50 transition-colors"><td className="p-8 font-black">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-8 font-black text-indigo-600">ID: {row.akun_id || '??'}</td><td className="p-8 font-bold text-slate-500 truncate max-w-[400px]">{row.deskripsi}</td><td className="p-8 text-right font-black text-red-500">-{row.debet.toLocaleString()}</td><td className="p-8 text-right font-black text-emerald-500">+{row.kredit.toLocaleString()}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* ROW 4: HISTORI MUTASI (PERCAKEP) */}
         <div className="bg-white rounded-[5rem] shadow-sm border border-slate-100 overflow-hidden mx-2 pb-16">
            <div className="p-16 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-12">
               <div className="flex items-center gap-8"><div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-2xl shadow-indigo-200"><History size={40}/></div><div><h3 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Histori Mutasi Pusat</h3><div className="flex items-center gap-4 mt-3"><div className="h-2 w-24 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Integrated Financial Flow Masjid Audit</span></div></div></div>
               <div className="relative w-full md:w-[450px]"><Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={28}/><input type="text" placeholder="Pencarian mutasi dinamis..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-[2.5rem] py-6 pl-20 pr-10 text-base font-bold w-full outline-none focus:border-indigo-600 shadow-sm transition-all" /></div>
            </div>
            
            <div className="overflow-x-auto min-h-[600px] px-4 font-sans">
               <table className="w-full text-left whitespace-nowrap table-fixed">
                  <thead className="bg-white border-b-2 border-gray-100 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
                     <tr>
                        <th className="p-12 w-[160px]">Tgl Transaksi</th>
                        <th className="p-12 w-[120px] text-center">Berkas Bukti</th>
                        <th className="p-12">Keterangan & Pos Anggaran</th>
                        <th className="p-12 w-[280px] text-right">Debit / Kredit</th>
                        <th className="p-12 w-[220px] text-right">Saldo Kas</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-40 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={72}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-40 text-center"><p className="italic text-slate-200 font-black uppercase tracking-[0.5em] text-3xl">Zero Data In Range</p></td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all border-b border-gray-100">
                           <td className="p-12">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none">{formatShowDate(row.waktu_transaksi)}</p>
                              <p className="text-[10px] font-bold text-indigo-400 mt-2 uppercase tracking-widest pl-1 border-l-2 border-indigo-100 ml-1">REF: {row.noref_bank || '---'}</p>
                           </td>
                           <td className="p-12">
                              <div className="flex flex-col items-center gap-3">
                                 <button onClick={() => { setEditingRow(row); setPreviewUrls((row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'))); setUploadFiles([]); setManualUrls(row.foto_bukti && !row.foto_bukti.startsWith('http') ? row.foto_bukti : ''); setEditAkunId(row.akun_id?.toString() || ''); }} className={`p-5 rounded-[2.5rem] border-4 transition-all active:scale-90 shadow-2xl group-hover:rotate-6 ${row.foto_bukti ? 'bg-white border-indigo-100 text-indigo-600' : 'bg-red-50 border-red-50 text-red-500 animate-pulse'}`}>
                                    <ImagePlus size={28}/>
                                 </button>
                                 {row.foto_bukti && <div className="flex gap-1.5">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url, idx) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white"><ExternalLink size={10}/></a>))}</div>}
                              </div>
                           </td>
                           <td className="p-12">
                              <div className="flex flex-col gap-4">
                                 <p className="text-4xl font-black text-slate-900 tracking-tighter italic truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all uppercase leading-[0.8]">{row.deskripsi}</p>
                                 <div className="flex items-center gap-5">
                                    <span className="px-5 py-2 bg-slate-900 text-white rounded-2xl font-black text-[11px] shadow-2xl flex items-center gap-3 tracking-widest italic leading-none shadow-slate-200"><Hash size={14} className="text-emerald-400"/> {row.ref_akun?.nomor_akun || row.akun_id || '??'}</span>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">{row.ref_akun?.nama_akun || 'KATEGORI BELUM DISINKRON'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-12 text-right font-black text-5xl tracking-tighter italic ${row.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              <span className="flex items-center justify-end gap-2 leading-none">{row.debet > 0 ? '-' : '+'} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-12 text-right font-black text-slate-200 text-xl italic leading-none group-hover:text-slate-400 transition-colors uppercase">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-16 bg-slate-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-slate-900 text-white px-24 py-8 rounded-[3rem] font-black flex items-center gap-5 hover:bg-indigo-600 transition-all text-sm tracking-[0.4em] italic shadow-2xl active:scale-95">{isLoadingMore ? <Loader2 className="animate-spin" /> : <PlusCircle />} MUAT TRANSAKSI LAINNYA</button></div>)}
         </div>

         {/* MODAL EDIT (V4.5 ELITE) */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500">
               <div className="bg-white w-full max-w-3xl rounded-[5rem] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] border-2 border-white/10 animate-in slide-in-from-bottom-10">
                  <div className="p-16 border-b bg-gray-50/50 flex justify-between items-center shrink-0"><div><h4 className="text-3xl font-black italic text-slate-800 uppercase flex items-center gap-6"><ImagePlus size={40} className="text-indigo-600"/> Arsip Bukti</h4><p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2 border-l-4 border-indigo-600 pl-4 italic">Sinkronisasi Keuangan Masjid Kampus</p></div><button onClick={() => setEditingRow(null)} className="p-5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={48}/></button></div>
                  <div className="p-16 space-y-12 overflow-y-auto flex-1 scrollbar-hide italic">
                     <div className={`p-12 rounded-[4rem] border-4 shadow-2xl ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-4xl font-black text-slate-950 mb-6 tracking-tighter leading-none italic uppercase">{editingRow.deskripsi}</p><p className={`text-7xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="space-y-6"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.5em] block pl-10">Mata Anggaran (Account ID)</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Contoh: 11110.01" className="w-full bg-slate-50 border-4 border-slate-100 rounded-[3rem] p-10 font-black text-indigo-600 text-5xl outline-none focus:border-indigo-600 transition-all shadow-inner text-center italic tracking-tighter" /></div>
                     <div className="space-y-10"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.5em] block pl-10">Koleksi Bukti Nota ({previewUrls.length} File)</label><div className="grid grid-cols-2 gap-8">{previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-video rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl group/img"><img src={url} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center"><button onClick={() => { setUploadFiles(prev => prev.filter((_, i) => i !== idx)); setPreviewUrls(prev => prev.filter((_, i) => i !== idx)); }} className="bg-red-600 text-white p-6 rounded-full shadow-2xl hover:scale-110 transition-all"><X size={32}/></button></div></div>))}<label className="aspect-video border-4 border-dashed border-indigo-100 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-200"><Upload size={80}/><p className="text-xs font-black uppercase tracking-[0.4em] mt-8 text-indigo-300">Tambah Nota Digital</p><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.length) { const f = Array.from(e.target.files).filter(x => x.size <= 5*1024*1024); setUploadFiles(p=>[...p,...f]); setPreviewUrls(p=>[...p,...f.map(i=>URL.createObjectURL(i))]); } }} /></label></div></div>
                  </div>
                  <div className="p-16 bg-slate-50 border-t flex gap-10 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-10 text-xs font-black uppercase tracking-widest text-slate-400 italic">Batalkan</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[4] py-10 bg-slate-950 text-white rounded-[3rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-8 italic">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN REVISI PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
