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

   // Smart Date Parser
   const parseDate = (ts: string) => {
      let val = ts.trim();
      const num = Number(val.replace(',', '.'));
      if (!isNaN(num) && num > 10000 && num < 100000) { 
         const dObj = new Date((num - 25569) * 86400 * 1000);
         const pad = (n: number) => n.toString().padStart(2, '0');
         return `${dObj.getFullYear()}-${pad(dObj.getMonth()+1)}-${pad(dObj.getDate())} 00:00:00`;
      }
      if (val.includes('/')) {
         const pts = val.split(/[ /]/);
         const yIndex = pts.findIndex(p => p.length === 4);
         const pad = (n: any) => String(n).padStart(2, '0');
         if (yIndex !== -1) {
            let y = pts[yIndex], m, d;
            if (yIndex === 0) { m = pts[1]; d = pts[2]; }
            else { d = pts[0]; m = pts[1]; }
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
         setMessage({ type: 'success', text: '✅ Data Berhasil Disimpan!' });
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
      <div className="space-y-8 max-w-[1500px] mx-auto pb-20 px-6 mt-8">
         {/* TOP STATS & ACTIONS UNIFORM GRID */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* PASTE ZONE CARDS */}
            <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between">
               <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3"><ClipboardPaste className="text-indigo-400" size={32}/> Paste Zone</h2>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Tgl; RekId; AkunId; NoRef; Desk; +/-; Saldo</p>
               </div>
               <div className="mt-4">
                  <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI..." className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 h-24 outline-none focus:border-indigo-500 font-bold text-center text-sm transition-all" />
                  {message && <div className={`mt-2 p-2 rounded-xl text-center text-[9px] font-black uppercase ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{message.text}</div>}
               </div>
            </div>

            {/* FILTER PERIOD CARD */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
               <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Filter Laporan</h4><Calendar className="text-indigo-600" size={24}/></div>
               <div className="mt-6 flex flex-col gap-2">
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-2xl bg-transparent outline-none cursor-pointer w-full hover:text-indigo-600 transition-colors">
                     <option value={0}>Semua Bulan</option>
                     {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-xl bg-transparent outline-none cursor-pointer w-full">
                     {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
            </div>

            {/* DATABASE STATUS CARD */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Database size={32}/></div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Rows In Database</h4>
               <p className="text-4xl font-black text-slate-800 tracking-tighter">{totalInDb.toLocaleString()}</p>
            </div>

            {/* QUICK TYPE FILTER CARD */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-xl text-white flex flex-col justify-center items-center text-center group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-all"><Filter size={100}/></div>
               <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4"><Filter size={32}/></div>
               <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-2">Jenis Tampilan</h4>
               <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent font-black tracking-tighter text-2xl outline-none cursor-pointer w-full text-center hover:text-indigo-200 transition-colors">
                  <option value="all" className="text-slate-800">Semua Data</option>
                  <option value="out" className="text-slate-800">Pengeluaran</option>
                  <option value="in" className="text-slate-800">Pemasukan</option>
                  <option value="no-proof" className="text-slate-800">Lengkapi Nota</option>
               </select>
            </div>
         </div>

         {/* PREVIEW IMPOR PANEL */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 border-4 border-indigo-50 animate-in zoom-in-95 duration-500">
               <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                  <div className="flex items-center gap-6"><div className="bg-emerald-500 p-5 rounded-3xl text-white shadow-xl shadow-emerald-100"><FileSpreadsheet size={32}/></div><div><h3 className="text-3xl font-black tracking-tighter uppercase italic">Preview Impor ({parsedData.length})</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siap Disimpan Ke Database Cloud.</p></div></div>
                  <div className="flex gap-4"><button onClick={() => setParsedData([])} className="px-8 py-4 font-black uppercase text-xs text-slate-400">Batalkan</button><button onClick={handleSimpanData} disabled={isSaving} className="bg-emerald-500 text-white px-12 py-5 rounded-[2rem] font-black shadow-2xl hover:bg-slate-900 transition-all flex items-center gap-4 uppercase text-xs tracking-widest italic">{isSaving ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN SEKARANG</button></div>
               </div>
               <div className="overflow-x-auto rounded-[2.5rem] border border-slate-100">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <tr><th className="p-8">Waktu Trx</th><th className="p-8">Akun</th><th className="p-8">Keterangan</th><th className="p-8 text-right">Debet</th><th className="p-8 text-right">Kredit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 10).map((row, i) => (<tr key={i} className="hover:bg-slate-50 transition-colors"><td className="p-8 font-black">{row.waktu_transaksi.split(' ')[0]}</td><td className="p-8 font-black text-indigo-600">ID: {row.akun_id || '-'}</td><td className="p-8 font-bold italic text-slate-500 truncate max-w-[400px]">{row.deskripsi}</td><td className="p-8 text-right font-black text-red-500">-{row.debet.toLocaleString('id-ID')}</td><td className="p-8 text-right font-black text-emerald-500">+{row.kredit.toLocaleString('id-ID')}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* MAIN HISTORY LOG */}
         <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-12 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-6"><div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-xl shadow-indigo-100"><History size={36}/></div><div><h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Histori Mutasi Pusat</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Arsip Digital Modern Masjid Kampus</p></div></div>
               <div className="relative w-full md:w-96"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24}/><input type="text" placeholder="Cari deskripsi mutasi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-[1.5rem] py-5 px-16 text-sm font-bold w-full outline-none focus:border-indigo-500 shadow-sm transition-all" /></div>
            </div>
            
            <div className="overflow-x-auto min-h-[500px]">
               <table className="w-full text-left whitespace-nowrap table-fixed">
                  <thead className="bg-white border-b-2 border-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                     <tr>
                        <th className="p-10 w-[140px]">Waktu</th>
                        <th className="p-10 w-[100px] text-center">Arsip</th>
                        <th className="p-10">Keterangan Transaksi & Link Kategori</th>
                        <th className="p-10 w-[240px] text-right">Mutasi Nominal</th>
                        <th className="p-10 w-[200px] text-right">Saldo Pusat</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {isLoadingHistory ? (<tr><td colSpan={5} className="p-40 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={60}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={5} className="p-40 text-center"><p className="italic text-gray-300 font-black uppercase tracking-widest text-xl">Data Tidak Ditemukan</p></td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-indigo-50/20 transition-all border-b border-gray-100">
                           <td className="p-10"><p className="text-xs font-black text-slate-800">{formatShowDate(row.waktu_transaksi)}</p><p className="text-[9px] font-bold text-slate-300 mt-2 uppercase truncate tracking-widest">REF: {row.noref_bank || '---'}</p></td>
                           <td className="p-10">
                              <div className="flex flex-col items-center gap-3">
                                 <button onClick={() => openEditModal(row)} className={`p-4 rounded-[1.5rem] border-2 transition-all active:scale-90 shadow-lg group-hover:scale-110 ${row.foto_bukti ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-red-50 border-red-200 text-red-500 animate-pulse'}`}>
                                    <ImagePlus size={24}/>
                                 </button>
                                 {row.foto_bukti && <div className="flex gap-1">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url, idx) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white border border-slate-100 text-indigo-400 rounded-md hover:bg-indigo-50"><ExternalLink size={10}/></a>))}</div>}
                              </div>
                           </td>
                           <td className="p-10">
                              <div className="flex flex-col gap-2">
                                 <p className="text-2xl font-black text-gray-900 tracking-tighter leading-tight italic truncate group-hover:whitespace-normal group-hover:overflow-visible pr-10">{row.deskripsi}</p>
                                 <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px] border border-indigo-100 flex items-center gap-1"><Hash size={12}/> {row.ref_akun?.nomor_akun || row.akun_id || 'N/A'}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{row.ref_akun?.nama_akun || 'Kategori Kosong'}</span>
                                 </div>
                              </div>
                           </td>
                           <td className={`p-10 text-right font-black text-3xl tracking-tighter italic ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              <span className="flex items-center justify-end gap-3">{row.debet > 0 ? <ArrowUpRight className="text-red-300" size={24}/> : <ArrowDownLeft className="text-emerald-300" size={24}/>} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span>
                           </td>
                           <td className="p-10 text-right font-black text-slate-300 text-sm italic">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-16 bg-slate-50 flex justify-center"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-white border-2 border-indigo-600 text-indigo-600 px-20 py-6 rounded-3xl font-black flex items-center gap-4 hover:shadow-2xl hover:bg-slate-900 hover:text-white transition-all text-xs tracking-[0.3em]">{isLoadingMore ? 'MUAT ULANG...' : 'LIHAT DATA BERIKUTNYA'}</button></div>)}
         </div>

         {/* MODAL EDIT (UPLOADER) */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border border-white/10">
                  <div className="p-12 border-b bg-gray-50 flex justify-between items-center shrink-0"><div><h4 className="text-2xl font-black italic text-slate-800 uppercase flex items-center gap-4"><ImagePlus size={32} className="text-indigo-600"/> Arsip Lampiran</h4></div><button onClick={() => setEditingRow(null)} className="p-4 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-full transition-colors"><X size={32}/></button></div>
                  <div className="p-12 space-y-8 overflow-y-auto flex-1 italic scrollbar-hide">
                     <div className={`p-10 rounded-[3rem] border-4 shadow-2xl ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-2xl font-black text-slate-900 mb-4 leading-tight">{editingRow.deskripsi}</p><p className={`text-5xl font-black italic tracking-tighter ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rp {(editingRow.kredit || editingRow.debet).toLocaleString()}</p></div>
                     <div className="group"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] mb-3 block pl-4">Kategori Akun ID</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Contoh: 11101" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 font-black text-indigo-600 text-2xl outline-none focus:border-indigo-600 transition-all shadow-inner" /></div>
                     <div className="space-y-6"><label className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] block pl-4">Lampiran Foto ({previewUrls.length} File)</label><div className="grid grid-cols-2 md:grid-cols-3 gap-6">{previewUrls.map((url, idx) => (<div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-xl"><img src={url} className="w-full h-full object-cover"/><button onClick={() => { setUploadFiles(prev => prev.filter((_, i) => i !== idx)); setPreviewUrls(prev => prev.filter((_, i) => i !== idx)); }} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-2xl"><X size={16}/></button></div>))}<label className="aspect-square border-4 border-dashed border-indigo-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all text-indigo-300"><Upload size={48}/><input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.length) { const f = Array.from(e.target.files).filter(x => x.size <= 5*1024*1024); setUploadFiles(p=>[...p,...f]); setPreviewUrls(p=>[...p,...f.map(i=>URL.createObjectURL(i))]); } }} /></label></div></div>
                  </div>
                  <div className="p-12 bg-slate-50 border-t flex gap-6 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-6 text-xs font-black uppercase tracking-widest text-slate-400">Batalkan</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[3] py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} SIMPAN PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
