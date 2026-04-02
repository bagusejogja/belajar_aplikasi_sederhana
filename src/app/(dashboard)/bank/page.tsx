'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste, Database, PlusCircle, Coins, Hash, BookOpen, Quote, 
   ArrowRight, Zap
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

   // Date Formatter
   const formatShowDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const mons = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${mons[d.getMonth()]} ${d.getFullYear()}`;
   };

   // Number Cleaner
   const cleanNum = (str: string) => {
      if (!str || str === '\\N') return 0;
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

   // Date Parser
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
         setMessage({ type: 'success', text: '✅ Data Mutasi Masjid Terintegrasi!' });
         fetchHistory(true);
      } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setIsSaving(false); }
   };

   // Edit Logic
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
      <div className="space-y-12 max-w-[1400px] mx-auto pb-40 px-6 mt-12 bg-white/5 font-sans">
         {/* ROW 1: FULL WIDTH PASTE ZONE */}
         <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20"><ClipboardPaste size={32}/></div>
                     <div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Paste Zone</h2>
                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2 italic"><Zap size={10}/> Impor Mutasi Masjid Kampus</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><p className="text-[10px] font-black text-white/30 uppercase mb-1">Total Database</p><p className="text-2xl font-black">{totalInDb}</p></div>
                     <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/20"><p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Status Sistem</p><p className="text-xl font-black flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div> LIVE</p></div>
                  </div>
               </div>
               <div className="flex-[2] w-full">
                  <div className="relative">
                     <textarea onPaste={handlePasteData} placeholder="SALIN DATA EXCEL (Tgl;Akun;NoRef;Desk;Debet;Kredit;Saldo) DAN TEMPEL DI SINI..." className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 h-40 outline-none focus:border-indigo-500 font-bold text-center text-xl transition-all placeholder:text-white/5 placeholder:font-black" />
                     {message && <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-10 py-3 rounded-2xl text-center font-black uppercase text-[10px] shadow-2xl animate-in zoom-in ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</div>}
                  </div>
               </div>
            </div>
         </div>

         {/* ROW 2: FILTERS (2 COLUMN STYLE) */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl hover:shadow-indigo-50 transition-all">
               <div className="flex justify-between items-center mb-6"><div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter Laporan</h4><div className="h-1 w-12 bg-indigo-600 mt-1"></div></div><Calendar className="text-indigo-600" size={28}/></div>
               <div className="flex items-center gap-6">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-3xl bg-transparent outline-none cursor-pointer flex-1 border-b-4 border-transparent focus:border-indigo-500 transition-all uppercase">
                     <option value={0}>Semua Bulan</option>
                     {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-3xl bg-transparent outline-none cursor-pointer border-b-4 border-transparent focus:border-indigo-600 transition-all mr-6">
                     {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            <div className="bg-indigo-600 rounded-[3rem] p-10 shadow-2xl text-white flex flex-col justify-between relative overflow-hidden group border border-indigo-400/20">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform"><Database size={150}/></div>
               <div className="flex justify-between items-center mb-6"><div><h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Jenis Tampilan</h4><div className="h-1 w-12 bg-white mt-1"></div></div><Filter className="text-white" size={28}/></div>
               <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent font-black tracking-tighter text-3xl outline-none cursor-pointer w-full text-left uppercase hover:text-indigo-200 transition-colors">
                  <option value="all" className="text-slate-800">Semua Dinamis</option>
                  <option value="out" className="text-slate-800">Pengeluaran (-)</option>
                  <option value="in" className="text-slate-800">Pemasukan (+)</option>
                  <option value="no-proof" className="text-slate-800">Lengkapi Nota</option>
               </select>
            </div>
         </div>

         {/* ROW 3: PREVIEW IMPOR */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[4rem] shadow-2xl p-12 border-2 border-indigo-50 animate-in slide-in-from-bottom-5 duration-700 mx-4">
               <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-8">
                  <div className="flex items-center gap-6"><div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-2xl shadow-emerald-200"><FileSpreadsheet size={36}/></div><div><h3 className="text-3xl font-black tracking-tighter uppercase italic text-slate-800">Preview Impor ({parsedData.length})</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lakukan Audit Terakhir Sebelum Database Sinkron.</p></div></div>
                  <div className="flex gap-4"><button onClick={() => setParsedData([])} className="px-10 py-5 font-black uppercase text-xs text-slate-400">Batalkan</button><button onClick={handleSimpanData} disabled={isSaving} className="bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center gap-3 uppercase text-xs tracking-widest italic">{isSaving ? <Loader2 className="animate-spin" /> : <Save />} KONFIRMASI IMPOR</button></div>
               </div>
               <div className="overflow-x-auto rounded-[3rem] border border-slate-100 bg-slate-50/50">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <tr><th className="p-8">Waktu Trx</th><th className="p-8">Akun</th><th className="p-8">Keterangan</th><th className="p-8 text-right">Debet</th><th className="p-8 text-right">Kredit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 10).map((row, i) => (<tr key={i} className="hover:bg-indigo-50/50 transition-colors"><td className="p-8 font-black">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-8 font-black text-indigo-600 italic">#{row.akun_id || '???'}</td><td className="p-8 font-bold italic text-slate-500 truncate max-w-[400px]">{row.deskripsi}</td><td className="p-8 text-right font-black text-red-500">-{row.debet.toLocaleString('id-ID')}</td><td className="p-8 text-right font-black text-emerald-500">+{row.kredit.toLocaleString('id-ID')}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* ROW 4: BEAUTIFUL HISTORY TABLE */}
         <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden mx-4 pb-12">
            <div className="p-12 border-b bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-10">
               <div className="flex items-center gap-6"><div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-xl shadow-indigo-200"><History size={32}/></div><div><h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Histori Mutasi Pusat</h3><div className="flex items-center gap-3 mt-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Audit Masjid Kampus</span><div className="h-1 lg:w-40 bg-indigo-100 rounded-full"></div></div></div></div>
               <div className="relative w-full md:w-[400px]"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/><input type="text" placeholder="Cari keterangan atau kata kunci..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-[2rem] py-5 px-16 text-sm font-bold w-full outline-none focus:border-indigo-600 shadow-sm transition-all focus:shadow-xl focus:shadow-indigo-50" /></div>
            </div>
            
            <div className="overflow-x-auto min-h-[600px] px-2">
               <table className="w-full text-left whitespace-nowrap table-fixed">
                  <thead className="bg-white border-b border-gray-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                     <tr>
                        <th className="p-10 w-[160px]">Waktu</th>
                        <th className="p-10 w-[120px] text-center">Validasi Bukti</th>
                        <th className="p-10">Keterangan Transaksi & Link Kategori</th>
                        <th className="p-10 w-[260px] text-right">Mutasi Nominal</th>
                        <th className="p-10 w-[200px] text-right">Saldo Pusat</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-40 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={64}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-40 text-center"><div className="bg-slate-50 border-2 border-dashed border-slate-100 p-20 rounded-[3rem] animate-pulse"><p className="italic text-slate-300 font-black uppercase tracking-widest text-2xl">Tidak Ada Mutasi Ditemukan</p></div></td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all border-b border-gray-50">
                           <td className="p-10">
                              <p className="text-xs font-black text-slate-800 leading-none">{formatShowDate(row.waktu_transaksi)}</p>
                              <div className="mt-3 flex items-center gap-2 group-hover:translate-x-2 transition-transform"><ArrowRight size={10} className="text-indigo-400"/><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">REF: {row.noref_bank || '---'}</p></div>
                           </td>
                           <td className="p-10">
                              <div className="flex flex-col items-center gap-3">
                                 <button onClick={() => { setEditingRow(row); setPreviewUrls((row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http'))); setUploadFiles([]); setManualUrls(row.foto_bukti && !row.foto_bukti.startsWith('http') ? row.foto_bukti : ''); setEditAkunId(row.akun_id?.toString() || ''); }} className={`p-4 rounded-[2rem] border-4 transition-all active:scale-90 shadow-xl group-hover:-translate-y-1 ${row.foto_bukti ? 'bg-white border-indigo-100 text-indigo-600' : 'bg-red-50 border-red-100 text-red-500 animate-pulse'}`}>
                                    <ImagePlus size={24}/>
                                 </button>
                                 {row.foto_bukti && <div className="flex gap-1">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url, idx) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-slate-100 text-slate-400 rounded hover:bg-indigo-600 hover:text-white transition-all"><ExternalLink size={8}/></a>))}</div>}
                              </div>
                           </td>
                           <td className="p-10">
                              <div className="flex flex-col gap-3">
                                 <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none italic truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all uppercase">{row.deskripsi}</p>
                                 <div className="flex items-center gap-4">
                                    <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] shadow-lg shadow-indigo-100 flex items-center gap-2 tracking-widest"><Hash size={12}/> {row.ref_akun?.nomor_akun || row.akun_id || 'N/A'}</span>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{row.ref_akun?.nama_akun || 'Kategori Belum Ditentukan'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-10 text-right font-black text-4xl tracking-tighter italic ${row.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              <span className="flex items-center justify-end gap-3">{row.debet > 0 ? <ArrowUpRight className="text-red-200" size={32}/> : <ArrowDownLeft className="text-emerald-200" size={32}/>} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-10 text-right font-black text-slate-200 text-base italic leading-none group-hover:text-slate-400 transition-colors">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-12 bg-slate-50 flex justify-center border-t border-gray-100"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-slate-900 text-white px-24 py-8 rounded-[2.5rem] font-black flex items-center gap-4 hover:shadow-2xl hover:bg-indigo-600 transition-all text-xs tracking-[0.4em] italic shadow-2xl active:scale-95">{isLoadingMore ? 'MEMUAT DATA...' : 'MUAT LEBIH BANYAK'}</button></div>)}
         </div>

         {/* MODAL EDIT (UPLOADER ELITE) */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 border border-white/20">
                  <div className="p-12 border-b bg-gray-50/50 flex justify-between items-center shrink-0"><div><h4 className="text-2xl font-black italic text-slate-800 uppercase flex items-center gap-4"><ImagePlus size={32} className="text-indigo-600"/> Arsip Digital</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Verifikasi Lampiran Nota Transaksi</p></div><button onClick={() => setEditingRow(null)} className="p-4 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={32}/></button></div>
                  <div className="p-12 space-y-10 overflow-y-auto flex-1 scrollbar-hide">
                     <div className={`p-10 rounded-[3rem] border-4 shadow-2xl ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-3xl font-black text-slate-900 mb-4 tracking-tighter leading-tight italic uppercase">{editingRow.deskripsi}</p><p className={`text-6xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="space-y-4"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.4em] block pl-6 italic">Mata Anggaran ID</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Contoh: 11110.01" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 font-black text-indigo-600 text-3xl outline-none focus:border-indigo-600 transition-all shadow-inner text-center italic" /></div>
                     <div className="space-y-8"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.4em] block pl-6 italic">Koleksi Nota Digital ({previewUrls.length} File)</label><div className="grid grid-cols-2 md:grid-cols-2 gap-6">{previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-video rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl group/img"><img src={url} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center"><button onClick={() => { setUploadFiles(prev => prev.filter((_, i) => i !== idx)); setPreviewUrls(prev => prev.filter((_, i) => i !== idx)); }} className="bg-red-500 text-white p-3 rounded-full shadow-2xl hover:scale-125 transition-all"><X size={20}/></button></div></div>))}<label className="aspect-video border-4 border-dashed border-indigo-100 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-300"><Upload size={48}/><p className="text-[10px] font-black uppercase tracking-widest mt-4">Tambah Lampiran</p><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.length) { const f = Array.from(e.target.files).filter(x => x.size <= 5*1024*1024); setUploadFiles(p=>[...p,...f]); setPreviewUrls(p=>[...p,...f.map(i=>URL.createObjectURL(i))]); } }} /></label></div></div>
                  </div>
                  <div className="p-12 bg-slate-50 border-t flex gap-6 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-8 text-xs font-black uppercase tracking-widest text-slate-400">Batalkan</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[4] py-8 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-6 italic active:scale-95">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
