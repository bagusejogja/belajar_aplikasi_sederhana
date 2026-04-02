'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste, Database, PlusCircle, Coins, Hash, BookOpen, Quote
} from 'lucide-react';

export default function BankTransaksiPage() {
   // Local State
   const [parsedData, setParsedData] = useState<any[]>([]);
   const [isParsing, setIsParsing] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [message, setMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

   const [dbTransactions, setDbTransactions] = useState<any[]>([]);
   const [totalInDb, setTotalInDb] = useState(0);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   
   // Interaction State
   const [searchTerm, setSearchTerm] = useState('');
   const [filterType, setFilterType] = useState<'all' | 'out' | 'in' | 'no-proof'>('out'); 
   
   // Filtering by Month
   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
   const [offset, setOffset] = useState(0); 

   // FETCH HISTORY
   const fetchHistory = useCallback(async (isReset = true) => {
      if (isReset) {
         setIsLoadingHistory(true);
         setOffset(0);
      } else {
         setIsLoadingMore(true);
      }

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

   // Helper: Format Tanggal Prettier
   const formatShowDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${mons[d.getMonth()]} ${d.getFullYear()}`;
   };

   // Helper: Clean Indonesian/US numbers
   const cleanNum = (str: string) => {
      if (!str || str === '\\N') return 0;
      let v = str.trim().replace(/[^\d.,-]/g, '');
      if (v === '') return 0;
      if (v.includes(',') && v.includes('.')) {
         if (v.lastIndexOf(',') > v.lastIndexOf('.')) v = v.replace(/\./g, '').replace(',', '.');
         else v = v.replace(/,/g, '');
      } else if (v.includes(',')) {
         const pts = v.split(',');
         if (pts[pts.length - 1].length === 3) v = v.replace(/,/g, '');
         else v = v.replace(',', '.');
      }
      return parseFloat(v) || 0;
   };

   // Smart Date Parser (fix 2023/12/31 issue)
   const parseDate = (ts: string) => {
      let val = ts.trim();
      const num = Number(val.replace(',', '.'));
      if (!isNaN(num) && num > 10000 && num < 100000) { 
         const dObj = new Date((num - 25569) * 86400 * 1000);
         const pad = (n: number) => n.toString().padStart(2, '0');
         return `${dObj.getFullYear()}-${pad(dObj.getMonth()+1)}-${pad(dObj.getDate())} 00:00:00`;
      }
      
      // Auto-Detect Y/M/D or D/M/Y
      if (val.includes('/')) {
         const pts = val.split(/[ /]/); // Split by space or slash
         const yIndex = pts.findIndex(p => p.length === 4);
         const dIndex = pts.findIndex(p => p.length <= 2 && Number(p) > 12);
         const mIndex = pts.findIndex((p, i) => i !== yIndex && i !== dIndex);
         
         const pad = (n: any) => String(n).padStart(2, '0');
         
         if (yIndex !== -1) {
            // Kita sudah punya Tahun. Cari Bulan dan Tanggal.
            let y = pts[yIndex];
            let m, d;
            if (yIndex === 0) { m = pts[1]; d = pts[2]; } // Y/M/D
            else { d = pts[0]; m = pts[1]; } // D/M/Y
            return `${y}-${pad(m)}-${pad(d)} 00:00:00`;
         }
      }
      return val;
   };

   // Paste Handler
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
      if (extracted.length > 0) { setParsedData(extracted); setMessage({ type: 'success', text: `Ditemukan ${extracted.length} baris.` }); }
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
         setMessage({ type: 'success', text: '✅ Data Berhasil Masuk Database!' });
         fetchHistory(true);
      } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setIsSaving(false); }
   };

   // Edit & Upload Logic
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
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) || (row.ref_akun?.nama_akun || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;
      return matchSearch && matchType;
   });

   return (
      <div className="space-y-6 max-w-[1600px] mx-auto pb-20 px-4 mt-8">
         {/* COMPACT DASHBOARD HEADER */}
         <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between">
               <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3"><ClipboardPaste className="text-indigo-400" size={32}/> Paste Zone</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-2 leading-relaxed">Format: Tgl; RekId; AkunId; NoRef; Deskripsi; Debet; Kredit; Saldo</p>
               </div>
               <div className="mt-6 relative">
                  <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI..." className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 h-20 outline-none focus:border-indigo-500 font-bold text-center transition-all" />
                  {message && <div className={`absolute -bottom-10 left-0 right-0 p-2 rounded-xl text-center text-[10px] font-black uppercase ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{message.text}</div>}
               </div>
            </div>
            
            <div className="md:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Laporan</h4><Calendar className="text-indigo-600" size={20}/></div>
               <div className="flex gap-2">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-lg bg-transparent outline-none cursor-pointer flex-1">
                     <option value={0}>Semua Bulan</option>
                     {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-lg bg-transparent outline-none cursor-pointer">
                     {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            <div className="md:col-span-4 grid grid-cols-2 gap-4">
               <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <Database className="text-emerald-500 mb-1" size={24}/>
                  <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Database</h4>
                  <p className="text-xl font-black text-slate-800 tracking-tighter">{totalInDb}</p>
               </div>
               <div className="bg-indigo-600 rounded-[2.5rem] p-6 shadow-xl text-white flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <Filter className="text-white/30 mb-1 group-hover:scale-110 transition-transform" size={24}/>
                  <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent font-black tracking-tighter text-sm outline-none cursor-pointer w-full text-center">
                     <option value="all" className="text-slate-800">Semua</option>
                     <option value="out" className="text-slate-800">Uang Keluar</option>
                     <option value="in" className="text-slate-800">Uang Masuk</option>
                     <option value="no-proof" className="text-slate-800">Lengkapi Foto</option>
                  </select>
               </div>
            </div>
         </div>

         {/* PREVIEW PANEL */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-2 border-indigo-50 animate-in slide-in-from-top-4 duration-500">
               <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div className="flex items-center gap-4"><FileSpreadsheet className="text-emerald-500" size={32}/><h3 className="text-xl font-black tracking-tighter uppercase italic">Preview Impor ({parsedData.length})</h3></div>
                  <div className="flex gap-4"><button onClick={() => setParsedData([])} className="text-xs font-black text-slate-400 uppercase">Batal</button><button onClick={handleSimpanData} disabled={isSaving} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:shadow-indigo-100 transition-all active:scale-95 text-xs">{isSaving ? 'Tunggu...' : 'UPLOAD SEKARANG'}</button></div>
               </div>
               <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-[10px] whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase">
                        <tr><th className="p-4">Waktu</th><th className="p-4">Akun</th><th className="p-4">Deskripsi</th><th className="p-4 text-right">Debet</th><th className="p-4 text-right">Kredit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 10).map((row, i) => (<tr key={i} className="hover:bg-slate-50"><td className="p-4 font-black">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-4 font-bold text-indigo-600">{row.akun_id || '-'}</td><td className="p-4 font-bold italic text-slate-500 truncate max-w-[400px]">{row.deskripsi}</td><td className="p-4 text-right font-black text-red-500">-{row.debet.toLocaleString()}</td><td className="p-4 text-right font-black text-emerald-500">+{row.kredit.toLocaleString()}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* HISTORY TABLE - SIMPLE BUT INFORMATIVE */}
         <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-2 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center p-6 bg-gray-50/50 rounded-t-[2rem]">
               <div className="flex items-center gap-4"><div className="bg-indigo-600 p-3 rounded-2xl text-white"><History size={24}/></div><h3 className="text-xl font-black tracking-tighter uppercase italic">Histori Mutasi Pusat</h3></div>
               <div className="relative w-full md:w-64 mt-4 md:mt-0"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input type="text" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-bold w-full outline-none focus:border-indigo-500 transition-all" /></div>
            </div>
            
            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left whitespace-nowrap table-fixed">
                  <thead className="bg-white border-b-2 border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                     <tr>
                        <th className="p-6 w-[120px]">Waktu</th>
                        <th className="p-6 w-[80px] text-center">Foto</th>
                        <th className="p-6">Keterangan & Kategori Belanja</th>
                        <th className="p-6 w-[200px] text-right">Nominal Mutasi</th>
                        <th className="p-6 w-[180px] text-right">Saldo Riil</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={40}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-20 text-center italic text-gray-300 font-bold uppercase tracking-widest">Kosong. Berkas Bulanan {selectedMonth}/{selectedYear} Tidak Ditemukan.</td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-indigo-50/30 transition-all border-b border-gray-50">
                           <td className="p-6"><p className="text-[10px] font-black text-slate-900 leading-none">{formatShowDate(row.waktu_transaksi)}</p><p className="text-[8px] font-bold text-slate-300 mt-1 uppercase truncate">REF: {row.noref_bank || '---'}</p></td>
                           <td className="p-6">
                              <div className="flex flex-col items-center gap-2">
                                 <button onClick={() => { setEditingRow(row); setPreviewUrls((row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'))); setUploadFiles([]); setManualUrls(row.foto_bukti && !row.foto_bukti.startsWith('http') ? row.foto_bukti : ''); setEditAkunId(row.akun_id?.toString() || ''); }} className={`p-3 rounded-2xl border-2 transition-all active:scale-95 shadow-sm group-hover:scale-110 ${row.foto_bukti ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-red-50 border-red-100 text-red-500 animate-pulse'}`}>
                                    <ImagePlus size={18}/>
                                 </button>
                                 {row.foto_bukti && row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url: string, idx: number) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black text-indigo-400 hover:underline uppercase flex items-center gap-1 group/link"><ExternalLink size={8}/> Lihat {idx+1}</a>))}
                              </div>
                           </td>
                           <td className="p-6">
                              <div className="flex flex-col gap-1 overflow-hidden">
                                 <p className="text-lg font-black text-gray-900 tracking-tighter leading-tight truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">{row.deskripsi}</p>
                                 <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-black text-[9px] border border-indigo-100 flex items-center gap-1"><Hash size={8}/> {row.ref_akun?.nomor_akun || row.akun_id || '???'}</span>
                                    <span className="text-[10px] font-bold text-slate-400 capitalize truncate">{row.ref_akun?.nama_akun || 'Tanpa Kategori'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-6 text-right font-black text-xl italic tracking-tighter ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              <span className="flex items-center justify-end gap-2">{row.debet > 0 ? <ArrowUpRight className="text-red-300" size={18}/> : <ArrowDownLeft className="text-emerald-300" size={18}/>} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-6 text-right font-black text-slate-300 text-xs italic">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-6 bg-slate-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-white border-2 border-indigo-600 text-indigo-600 px-10 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all text-[10px] tracking-widest disabled:opacity-50">{isLoadingMore ? 'MUAT...' : 'LIHAT LEBIH BANYAK'}</button></div>)}
         </div>

         {/* MODAL EDIT (UPLOADER) */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border border-white/10">
                  <div className="p-10 border-b bg-gray-50/50 flex justify-between items-center shrink-0"><div><h4 className="text-xl font-black italic text-slate-800 uppercase flex items-center gap-4"><ImagePlus size={24} className="text-indigo-600"/> Arsip Bukti</h4></div><button onClick={() => setEditingRow(null)} className="p-3 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button></div>
                  <div className="p-10 space-y-8 overflow-y-auto flex-1 italic scrollbar-hide">
                     <div className={`p-8 rounded-[2.5rem] border-2 shadow-inner ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-lg font-black text-slate-900 mb-3 leading-tight">{editingRow.deskripsi}</p><p className={`text-4xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Kategori Akun ID</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Misal: 11101" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-black text-indigo-600 outline-none focus:border-indigo-600 transition-all shadow-inner placeholder:text-slate-200" /></div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Lampiran Digital ({previewUrls.length})</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                           {previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100"><img src={url} className="w-full h-full object-cover"/><button onClick={() => { setUploadFiles(prev => prev.filter((_, i) => i !== idx)); setPreviewUrls(prev => prev.filter((_, i) => i !== idx)); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"><X size={10}/></button></div>))}
                           <label className="aspect-square border-2 border-dashed border-indigo-100 rounded-[1.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-300"><Upload size={32}/><div className="text-[8px] font-black mt-2 uppercase tracking-widest">Tambah</div><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.length) { const f = Array.from(e.target.files).filter(x => x.size <= 5*1024*1024); setUploadFiles(p=>[...p,...f]); setPreviewUrls(p=>[...p,...f.map(i=>URL.createObjectURL(i))]); } }} /></label>
                        </div>
                     </div>
                  </div>
                  <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Batal</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[3] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-3">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
