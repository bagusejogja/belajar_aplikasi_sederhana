'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
   Upload, FileSpreadsheet, Save, Loader2, AlertTriangle, CheckCircle, 
   ImagePlus, X, History, ExternalLink, Calendar, Search, Filter,
   ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Building2,
   ClipboardPaste, Database, PlusCircle, Coins, Hash, BookOpen
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

   // FETCH HANDLER (Join dengan gov_accounts untuk Nama Akun)
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
            .select('*, gov_accounts(account_name, account_code)', { count: 'exact' })
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
         if (error) throw error;
         
         if (isReset) {
            setDbTransactions(data || []);
            setTotalInDb(count || 0);
         } else {
            setDbTransactions(prev => [...prev, ...(data || [])]);
            setOffset(currentOffset);
         }
      } catch (err: any) {
         console.error("Gagal fetch history bank:", err);
      } finally {
         setIsLoadingHistory(false);
         setIsLoadingMore(false);
      }
   }, [selectedMonth, selectedYear, offset]);

   useEffect(() => {
      fetchHistory(true);
   }, [selectedMonth, selectedYear, fetchHistory]);

   // Helper: Format Tanggal (Prettier)
   const formatShowDate = (dateStr: string) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()} (${d.toTimeString().substring(0, 5)})`;
   };

   // Helper: Clean Indonesian Numbers
   const cleanNum = (str: string) => {
      if (!str) return 0;
      let val = str.trim().replace(/[^\d.,-]/g, '');
      if (val === '') return 0;
      if (val.includes(',') && val.includes('.')) {
         if (val.lastIndexOf(',') > val.lastIndexOf('.')) val = val.replace(/\./g, '').replace(',', '.');
         else val = val.replace(/,/g, '');
      } else if (val.includes(',')) {
         const parts = val.split(',');
         if (parts[parts.length - 1].length === 3) val = val.replace(/,/g, '');
         else val = val.replace(',', '.');
      }
      return parseFloat(val) || 0;
   };

   const parseExcelDate = (excelDate: string) => {
      const numScore = Number(excelDate.replace(',', '.'));
      if (isNaN(numScore)) {
         if (excelDate.includes('/')) {
            const parts = excelDate.split('/');
            if (parts.length === 3) {
               const [d, m, y] = parts;
               return `${y.length === 2 ? '20' + y : y}-${m.padStart(2, '0')}-${d.padStart(2, '0')} 00:00:00`;
            }
         }
         return excelDate;
      }
      const dateObj = new Date((numScore - 25569) * 86400 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
   };

   const handlePasteData = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text');
      if (!text) return;
      setIsParsing(true);
      const rows = text.split('\n').filter(r => r.trim() !== '');
      const extracted: any[] = [];
      let colMap = { tgl: 0, desc: 4, out: 5, in: 6, bal: 7, akun: -1 }; 
      const headerRow = rows[0].toLowerCase();
      if (headerRow.includes('waktu') || headerRow.includes('tanggal') || headerRow.includes('keterangan')) {
         const heads = rows[0].split(/\t|;/).map(h => h.trim().toLowerCase());
         heads.forEach((h, idx) => {
            if (h.includes('waktu') || h.includes('tanggal')) colMap.tgl = idx;
            if (h.includes('deskripsi') || h.includes('keterangan')) colMap.desc = idx;
            if (h.includes('debit') || h.includes('debet') || h.includes('keluar')) colMap.out = idx;
            if (h.includes('kredit') || h.includes('masuk')) colMap.in = idx;
            if (h.includes('saldo')) colMap.bal = idx;
            if (h.includes('akun') || h.includes('coa')) colMap.akun = idx;
         });
      }
      const startIdx = (headerRow.includes('waktu') || headerRow.includes('tanggal') || headerRow.includes('deskripsi')) ? 1 : 0;
      for (let i = startIdx; i < rows.length; i++) {
         const parts = rows[i].split(/\t|;/).map(p => p.trim());
         if (parts.length < 3) continue;
         extracted.push({
            waktu_transaksi: parseExcelDate(parts[colMap.tgl] || ''),
            rekening_id: '1',
            akun_id: colMap.akun !== -1 ? (Number(parts[colMap.akun]?.replace(/\D/g, '')) || null) : null,
            noref_bank: '',
            deskripsi: parts[colMap.desc] || '',
            debet: cleanNum(parts[colMap.out] || ''),
            kredit: cleanNum(parts[colMap.in] || ''),
            saldo_riil: cleanNum(parts[colMap.bal] || ''),
         });
      }
      if (extracted.length > 0) {
         setParsedData(extracted);
         setMessage({ type: 'success', text: `Terdeteksi ${extracted.length} baris.` });
      } else {
         setMessage({ type: 'error', text: 'Format data tidak dikenali.' });
      }
      setIsParsing(false);
   };

   const handleSimpanData = async () => {
      if (parsedData.length === 0) return;
      setIsSaving(true);
      try {
         const { error } = await supabase.from('bank_transactions').insert(parsedData);
         if (error) throw error;
         setParsedData([]);
         setMessage({ type: 'success', text: '✅ Impor berhasil!' });
         fetchHistory(true);
      } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setIsSaving(false); }
   };

   const [editingRow, setEditingRow] = useState<any | null>(null);
   const [isUpdating, setIsUpdating] = useState(false);
   const [uploadFiles, setUploadFiles] = useState<File[]>([]);
   const [previewUrls, setPreviewUrls] = useState<string[]>([]);
   const [manualUrls, setManualUrls] = useState<string>('');
   const [editAkunId, setEditAkunId] = useState<string>('');

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
         const files = Array.from(e.target.files).filter(f => f.size <= 5 * 1024 * 1024);
         setUploadFiles(prev => [...prev, ...files]);
         setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
      }
   };

   const removePreview = (idx: number) => {
      setUploadFiles(prev => prev.filter((_, i) => i !== idx));
      setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
   };

   const openEditModal = (row: any) => {
      setEditingRow(row);
      setPreviewUrls((row.foto_bukti || '').split(',').filter((s: string) => s.startsWith('http')));
      setUploadFiles([]);
      setManualUrls(row.foto_bukti && !row.foto_bukti.startsWith('http') ? row.foto_bukti : '');
      setEditAkunId(row.akun_id?.toString() || '');
   };

   const handleUpdateProof = async () => {
      if (!editingRow) return;
      setIsUpdating(true);
      try {
         let finalUrls: string[] = previewUrls.filter(u => u.startsWith('http'));
         if (uploadFiles.length) {
            const upPromises = uploadFiles.map(async (file) => {
               const name = `bank_${Math.random().toString(36).substring(7)}_${Date.now()}.${file.name.split('.').pop()}`;
               const { error: upError } = await supabase.storage.from('receipts').upload(name, file);
               if (upError) throw upError;
               return supabase.storage.from('receipts').getPublicUrl(name).data.publicUrl;
            });
            finalUrls = [...finalUrls, ...await Promise.all(upPromises)];
         }
         const combined = manualUrls ? `${finalUrls.join(',')},${manualUrls}` : finalUrls.join(',');
         await supabase.from('bank_transactions').update({ 
            foto_bukti: combined || null, 
            akun_id: editAkunId ? Number(editAkunId) : null 
         }).eq('id', editingRow.id);
         setEditingRow(null);
         fetchHistory(false);
         alert("✅ Data diperbarui!");
      } catch (err: any) { alert(err.message); } finally { setIsUpdating(false); }
   };

   const filteredHistory = dbTransactions.filter(row => {
      const matchSearch = (row.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (row.noref_bank || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (row.gov_accounts?.account_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchType = true;
      if (filterType === 'out') matchType = row.debet > 0;
      else if (filterType === 'in') matchType = row.kredit > 0;
      else if (filterType === 'no-proof') matchType = !row.foto_bukti;
      return matchSearch && matchType;
   });

   return (
      <div className="space-y-10 max-w-7xl mx-auto pb-20">
         {/* 1. PASTE ZONE */}
         <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col gap-8">
            <div className="flex-1">
               <h2 className="text-4xl font-black mb-4 flex items-center gap-4 tracking-tighter uppercase italic"><ClipboardPaste size={40} className="text-indigo-400"/> Bank Mutasi Manager</h2>
               <p className="text-indigo-100/70 font-bold text-xs uppercase tracking-widest leading-relaxed">Format: <span className="text-white underline">Tgl, Deskripsi, Debet, Kredit, Saldo, AkunId</span>.</p>
            </div>
            <div className="bg-white/5 rounded-[2.5rem] p-6 border-2 border-dashed border-white/10 group hover:border-indigo-500 transition-all text-center space-y-4">
               <textarea onPaste={handlePasteData} placeholder="PASTE DI SINI (CTRL+V)" className="w-full bg-transparent border-none focus:ring-0 outline-none h-24 text-indigo-200 font-black text-xl placeholder:text-white/10 text-center uppercase" />
               {message && (
                  <div className={`p-4 rounded-xl font-bold flex items-center justify-center gap-3 animate-in fade-in zoom-in ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/20 text-red-300 border border-red-500/20'}`}>
                     {message.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>} {message.text}
                  </div>
               )}
            </div>
         </div>

         {/* SUMMARY & FILTERS */}
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6 sm:col-span-2">
               <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600"><Calendar size={32}/></div>
               <div className="overflow-hidden">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periode Berjalan</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="font-black text-slate-800 text-lg bg-transparent outline-none cursor-pointer">
                        <option value={0}>Semua Bulan</option>
                        {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                     </select>
                     <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-black text-indigo-600 text-lg bg-transparent outline-none cursor-pointer">
                        <option value={0}>Thn</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
               </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center gap-6">
               <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><Database size={32}/></div>
               <div><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Rows</h4><p className="text-xl font-black text-slate-800 tracking-tighter">{totalInDb.toLocaleString()}</p></div>
            </div>
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-xl text-white flex items-center gap-4 overflow-hidden">
               <div className="bg-white/10 p-3 rounded-2xl"><Filter size={24}/></div>
               <div className="flex-1">
                  <h4 className="text-[9px] font-black text-white/50 uppercase tracking-widest">Filter</h4>
                  <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-transparent font-black text-sm w-full outline-none cursor-pointer">
                     <option value="all" className="text-slate-800">Semua</option>
                     <option value="out" className="text-slate-800">Uang Keluar</option>
                     <option value="in" className="text-slate-800">Uang Masuk</option>
                     <option value="no-proof" className="text-slate-800">Lengkapi Bukti</option>
                  </select>
               </div>
            </div>
         </div>

         {/* PREVIEW HASIL PASTE */}
         {parsedData.length > 0 && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 border-4 border-indigo-50">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-800 italic flex items-center gap-4"><FileSpreadsheet className="text-emerald-500" size={32}/> Preview Impor ({parsedData.length})</h3>
                  <div className="flex gap-4"><button onClick={() => setParsedData([])} className="px-8 py-4 text-slate-400 font-black uppercase text-xs">Batal</button><button onClick={handleSimpanData} disabled={isSaving} className="bg-emerald-500 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl uppercase tracking-tighter text-xs">{isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} SIMPAN</button></div>
               </div>
               <div className="overflow-x-auto rounded-[2rem] border-2 border-slate-100">
                  <table className="w-full text-left text-[11px] whitespace-nowrap">
                     <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                        <tr><th className="p-5">Waktu</th><th className="p-5">Akun ID</th><th className="p-5">Deskripsi</th><th className="p-5 text-right">Debet</th><th className="p-5 text-right">Kredit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {parsedData.slice(0, 10).map((row, i) => (<tr key={i} className="bg-white hover:bg-slate-50"><td className="p-5 font-black">{row.waktu_transaksi.split(' ')[0] || row.waktu_transaksi}</td><td className="p-5 font-bold text-indigo-600">{row.akun_id || '-'}</td><td className="p-5 font-bold text-slate-500 truncate max-w-[200px]">{row.deskripsi}</td><td className="p-5 text-right font-black text-red-500">- {row.debet.toLocaleString('id-ID')}</td><td className="p-5 text-right font-black text-emerald-500">+ {row.kredit.toLocaleString('id-ID')}</td></tr>))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* DATABASE HISTORY SECTION */}
         <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-10 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-4"><div className="bg-indigo-100 p-4 rounded-3xl text-indigo-600"><History size={32}/></div><div><h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase italic">Histori Mutasi Pusat</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Manajemen Bukti & COA Terpadu</p></div></div>
               <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input type="text" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-white border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold w-64 outline-none focus:border-indigo-500 transition-all font-sans" /></div>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
               <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white border-b-2 border-gray-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <tr><th className="p-8">Waktu & Ref</th><th className="p-8">Mata Anggaran (Akun)</th><th className="p-8">Deskripsi</th><th className="p-8 text-right">Mutasi</th><th className="p-8 text-right">Saldo</th><th className="p-8 text-center">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {isLoadingHistory ? (<tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={48}/></td></tr>) : filteredHistory.length === 0 ? (<tr><td colSpan={6} className="p-20 text-center italic text-gray-400 font-bold uppercase tracking-widest border-2 border-dashed border-gray-50 m-8 rounded-3xl bg-slate-50">Data Tidak Ditemukan.</td></tr>) : filteredHistory.map((row) => (
                        <tr key={row.id} className="group hover:bg-slate-50 transition-all border-b border-gray-50">
                           <td className="p-8"><p className="text-xs font-black text-slate-800">{formatShowDate(row.waktu_transaksi)}</p><p className="text-[10px] font-bold text-slate-400 uppercase">REF: {row.noref_bank || 'NoRef'}</p></td>
                           <td className="p-8">
                              <div className="flex flex-col">
                                 <span className="font-black text-indigo-600 text-xs flex items-center gap-2"><BookOpen size={12}/> {row.gov_accounts?.account_code || row.akun_id || '-'}</span>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{row.gov_accounts?.account_name || 'Tanpa Akun'}</span>
                              </div>
                           </td>
                           <td className="p-8 font-bold text-xs truncate max-w-[250px]">{row.deskripsi}</td>
                           <td className={`p-8 text-right font-black ${row.debet > 0 ? 'text-red-500' : 'text-emerald-500'}`}><span className="flex items-center justify-end gap-2 text-sm">{row.debet > 0 ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>} Rp {(row.debet || row.kredit).toLocaleString('id-ID')}</span></td>
                           <td className="p-8 text-right font-black text-slate-400 text-xs">Rp {row.saldo_riil?.toLocaleString('id-ID')}</td>
                           <td className="p-8 text-center flex justify-center gap-2">
                              {row.foto_bukti && <div className="flex gap-1">{row.foto_bukti.split(',').filter((u: string) => u.startsWith('http')).map((url: string, idx: number) => (<a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-slate-200 text-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all"><ExternalLink size={14}/></a>))}</div>}
                              <button onClick={() => openEditModal(row)} className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><ImagePlus size={18}/></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            {dbTransactions.length < totalInDb && (<div className="p-10 bg-slate-50 flex justify-center"><button onClick={() => fetchHistory(false)} disabled={isLoadingMore} className="bg-white border-2 border-indigo-600 text-indigo-600 px-10 py-5 rounded-[1.5rem] font-black flex items-center gap-4 hover:shadow-xl transition-all disabled:opacity-50 uppercase tracking-widest text-xs">{isLoadingMore ? <Loader2 className="animate-spin" size={24}/> : <PlusCircle size={24}/>}{isLoadingMore ? 'Memuat...' : 'MUAT DATA LAGI'}</button></div>)}
         </div>

         {/* MODAL EDIT */}
         {editingRow && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 px-4">
               <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-500">
                  <div className="p-10 border-b bg-slate-50/50 flex justify-between items-center shrink-0"><div><h4 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic flex items-center gap-3"><ImagePlus size={24} className="text-indigo-600"/> Data Mutasi</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ubah Akun atau Lampiran Nota.</p></div><button onClick={() => setEditingRow(null)} className="p-3 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X size={24}/></button></div>
                  <div className="p-8 space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                     <div className={`p-6 rounded-[2.5rem] border-2 shadow-inner ${editingRow.debet > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}><p className="text-[10px] font-black text-slate-400 uppercase mb-2 italic">{formatShowDate(editingRow.waktu_transaksi)}</p><p className="text-sm font-bold text-slate-900 leading-tight mb-4">{editingRow.deskripsi}</p><p className={`text-2xl font-black tracking-tighter italic ${editingRow.debet > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{editingRow.debet > 0 ? '-' : '+'} Rp {(editingRow.kredit || editingRow.debet).toLocaleString('id-ID')}</p></div>
                     <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Hash size={12}/> Akun ID (5 Digit)</label><input type="text" value={editAkunId} onChange={e => setEditAkunId(e.target.value)} placeholder="Contoh: 511611" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-black text-indigo-600 focus:border-indigo-500 outline-none transition-all" /></div>
                     <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Koleksi Bukti Foto ({previewUrls.length})</label><div className="grid grid-cols-3 gap-4">{previewUrls.map((url, idx) => (<div key={idx} className="relative group aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 bg-slate-50"><img src={url} className="w-full h-full object-cover" alt="Nota"/><button onClick={() => removePreview(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={10}/></button></div>))}<label className="aspect-square border-2 border-dashed border-indigo-200 rounded-[1.5rem] flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50"><Upload size={24} className="text-indigo-300"/><input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} /></label></div></div>
                  </div>
                  <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0"><button onClick={() => setEditingRow(null)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Batal</button><button onClick={handleUpdateProof} disabled={isUpdating} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all flex items-center justify-center gap-3">{isUpdating ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} SIMPAN PERUBAHAN</button></div>
               </div>
            </div>
         )}
      </div>
   );
}
